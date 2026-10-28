"""Loss functions in lab.ml.train: values, reductions, errors and gradients.

Reference values are computed by hand or with plain NumPy formulas.
Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Callable

import numpy as np
import pytest

from lab.ml.train import losses as L
from lab.ml.train.gradcheck import gradcheck
from lab.ml.train.tensor import Tensor


def _t(*shape: int, seed: int = 0) -> Tensor:
    return Tensor(np.random.default_rng(seed).standard_normal(shape), requires_grad=True,
                  dtype=np.float64)


def test_mse_l1_values() -> None:
    pred = Tensor(np.array([1.0, 2.0, 4.0]), dtype=np.float64)
    target = np.array([1.0, 0.0, 1.0])
    assert L.mse(pred, target).item() == pytest.approx((0 + 4 + 9) / 3)
    assert L.mse(pred, target, "sum").item() == pytest.approx(13.0)
    np.testing.assert_allclose(L.mse(pred, target, "none").data, [0.0, 4.0, 9.0])
    assert L.l1(pred, target).item() == pytest.approx(5.0 / 3)


def test_huber_matches_piecewise_definition() -> None:
    pred = Tensor(np.array([0.5, 3.0, -2.0]), dtype=np.float64)
    target = np.zeros(3)
    out = L.huber(pred, target, delta=1.0, reduction="none").data
    np.testing.assert_allclose(out, [0.125, 2.5, 1.5])
    with pytest.raises(ValueError, match="delta"):
        L.huber(pred, target, delta=0.0)


def test_bce_with_logits_matches_reference_and_is_stable() -> None:
    logits = np.array([-50.0, -1.0, 0.0, 2.0, 60.0])
    target = np.array([0.0, 1.0, 1.0, 0.0, 1.0])
    mid = 1.0 / (1.0 + np.exp(-logits[1:4]))
    ref = -(target[1:4] * np.log(mid) + (1 - target[1:4]) * np.log(1 - mid))
    out = L.bce_with_logits(Tensor(logits, dtype=np.float64), target, "none").data
    assert np.all(np.isfinite(out))
    np.testing.assert_allclose(out[1:4], ref, rtol=1e-10)
    assert out[0] < 1e-20 and out[4] < 1e-20


def test_bce_pos_weight_scales_positive_term() -> None:
    logits = Tensor(np.array([0.3, -0.7]), dtype=np.float64)
    target = np.array([1.0, 0.0])
    base = L.bce_with_logits(logits, target, "none").data
    weighted = L.bce_with_logits(logits, target, "none", pos_weight=3.0).data
    np.testing.assert_allclose(weighted, [3.0 * base[0], base[1]], rtol=1e-12)


def test_cross_entropy_matches_reference() -> None:
    logits = np.array([[2.0, 1.0, 0.1], [0.5, 2.5, 0.0]])
    labels = np.array([0, 1])
    logp = logits - np.log(np.exp(logits).sum(axis=1, keepdims=True))
    ref = -logp[np.arange(2), labels].mean()
    out = L.cross_entropy(Tensor(logits, dtype=np.float64), labels)
    assert out.item() == pytest.approx(ref)
    smooth = L.cross_entropy(Tensor(logits, dtype=np.float64), labels, label_smoothing=0.1)
    target = np.full((2, 3), 0.1 / 3)
    target[np.arange(2), labels] += 0.9
    assert smooth.item() == pytest.approx(float(-(logp * target).sum(axis=1).mean()))
    assert L.accuracy(Tensor(logits), labels) == 1.0
    assert L.accuracy(Tensor(np.zeros((0, 3))), np.zeros(0, dtype=int)) == 0.0


@pytest.mark.parametrize(
    ("logits", "labels", "message"),
    [
        (np.zeros(3), np.array([0]), "logits"),
        (np.zeros((2, 3)), np.array([0.0, 1.0]), "integer labels"),
        (np.zeros((2, 3)), np.array([0, 3]), "labels must be"),
    ],
)
def test_cross_entropy_rejects_bad_inputs(logits: np.ndarray, labels: np.ndarray,
                                          message: str) -> None:
    with pytest.raises(ValueError, match=message):
        L.cross_entropy(Tensor(logits), labels)


def test_cross_entropy_rejects_bad_smoothing() -> None:
    with pytest.raises(ValueError, match="label_smoothing"):
        L.cross_entropy(Tensor(np.zeros((1, 2))), np.array([0]), label_smoothing=1.0)


def test_cosine_distance_values() -> None:
    a = Tensor(np.array([[1.0, 0.0], [1.0, 1.0], [0.0, 0.0]]), dtype=np.float64)
    b = np.array([[0.0, 1.0], [2.0, 2.0], [1.0, 0.0]])
    out = L.cosine_distance(a, b, reduction="none").data
    np.testing.assert_allclose(out, [1.0, 0.0, 1.0], atol=1e-6)


def test_shape_mismatch_and_unknown_reduction() -> None:
    with pytest.raises(ValueError, match="shape"):
        L.mse(Tensor(np.zeros(3)), np.zeros(4))
    with pytest.raises(ValueError, match="unknown reduction"):
        L.reduce(Tensor(np.zeros(3)), "max")  # type: ignore[arg-type]


LOSSES: dict[str, Callable[[Tensor, Tensor], Tensor]] = {
    "mse": lambda p, t: L.mse(p, t),
    "l1": lambda p, t: L.l1(p, t, "sum"),
    "huber": lambda p, t: L.huber(p, t, delta=0.5),
    "bce": lambda p, t: L.bce_with_logits(p, Tensor(np.abs(np.tanh(t.data)))),
    "bce_weighted": lambda p, t: L.bce_with_logits(p, Tensor((t.data > 0) * 1.0),
                                                   pos_weight=2.5),
    "cosine": lambda p, t: L.cosine_distance(p, t),
}


@pytest.mark.parametrize("name", sorted(LOSSES))
def test_loss_gradients(name: str) -> None:
    pred = _t(4, 3, seed=1)
    target = Tensor(np.random.default_rng(2).standard_normal((4, 3)) * 2.0, dtype=np.float64)
    result = gradcheck(lambda p: LOSSES[name](p, target), [pred])
    assert result.ok, f"{name}: {result.describe()}"


def test_cross_entropy_gradient() -> None:
    labels = np.array([2, 0, 1, 1])
    for smoothing in (0.0, 0.2):
        result = gradcheck(lambda x, s=smoothing: L.cross_entropy(x, labels, label_smoothing=s),
                           [_t(4, 3, seed=3)])
        assert result.ok, result.describe()


def test_psnr() -> None:
    a = np.zeros((4, 4))
    assert L.psnr(a, a) == float("inf")
    assert L.psnr(a, a + 0.1) == pytest.approx(20.0)
