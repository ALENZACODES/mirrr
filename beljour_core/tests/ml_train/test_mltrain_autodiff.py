"""Gradient checks for every differentiable op in lab.ml.train.

Each op is compared with central finite differences in float64. Inputs are
seeded random arrays; no images or faces are used. Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Callable

import numpy as np
import pytest

from lab.ml.train import functional as F
from lab.ml.train import tensor as T
from lab.ml.train.gradcheck import gradcheck, numeric_grad
from lab.ml.train.tensor import Tensor, no_grad, unbroadcast


def _t(*shape: int, seed: int = 0, positive: bool = False) -> Tensor:
    rng = np.random.default_rng(seed)
    data = rng.standard_normal(shape)
    if positive:
        data = np.abs(data) + 0.5
    return Tensor(data, requires_grad=True, dtype=np.float64)


def _away_from_zero(*shape: int, seed: int = 0) -> Tensor:
    rng = np.random.default_rng(seed)
    data = rng.uniform(0.2, 1.5, shape) * rng.choice([-1.0, 1.0], shape)
    return Tensor(data, requires_grad=True, dtype=np.float64)


def _distinct(*shape: int, seed: int = 0) -> Tensor:
    rng = np.random.default_rng(seed)
    data = rng.permutation(int(np.prod(shape))).reshape(shape) * 0.37
    return Tensor(data, requires_grad=True, dtype=np.float64)


UNARY: dict[str, tuple[Callable[[Tensor], Tensor], Callable[[], Tensor]]] = {
    "exp": (T.exp, lambda: _t(3, 4)),
    "log": (T.log, lambda: _t(3, 4, positive=True)),
    "tanh": (T.tanh, lambda: _t(3, 4)),
    "relu": (T.relu, lambda: _away_from_zero(3, 4)),
    "leaky_relu": (lambda x: T.leaky_relu(x, 0.1), lambda: _away_from_zero(3, 4)),
    "gelu": (T.gelu, lambda: _t(3, 4)),
    "sigmoid": (T.sigmoid, lambda: _t(3, 4)),
    "abs": (T.tabs, lambda: _away_from_zero(3, 4)),
    "sqrt": (T.sqrt, lambda: _t(3, 4, positive=True)),
    "neg": (T.neg, lambda: _t(3, 4)),
    "power": (lambda x: T.power(x, 3.0), lambda: _t(3, 4)),
    "clip": (lambda x: T.clip(x, -0.1, 0.1), lambda: _away_from_zero(3, 4)),
    "astype": (lambda x: x.astype(np.float64) * 2.0, lambda: _t(2, 3)),
    "sum_all": (lambda x: x.sum(), lambda: _t(3, 4)),
    "sum_axis": (lambda x: x.sum(axis=1), lambda: _t(3, 4, 2)),
    "sum_keep": (lambda x: x.sum(axis=(0, 2), keepdims=True), lambda: _t(3, 4, 2)),
    "mean_axis": (lambda x: x.mean(axis=0), lambda: _t(3, 4)),
    "mean_keep": (lambda x: x.mean(axis=-1, keepdims=True), lambda: _t(3, 4)),
    "max_axis": (lambda x: x.max(axis=1), lambda: _distinct(3, 4)),
    "max_all_keep": (lambda x: T.tmax(x, None, True), lambda: _distinct(3, 4)),
    "reshape": (lambda x: x.reshape(4, 3) * 2.0, lambda: _t(3, 4)),
    "transpose": (lambda x: x.transpose(2, 0, 1) * 1.5, lambda: _t(2, 3, 4)),
    "T": (lambda x: x.T @ x, lambda: _t(3, 2)),
    "getitem": (lambda x: x[1:, ::2] * 3.0, lambda: _t(3, 4)),
    "getitem_repeat": (lambda x: x[np.array([0, 0, 2])], lambda: _t(3, 4)),
    "softmax": (lambda x: F.softmax(x, axis=-1), lambda: _t(3, 5)),
    "softmax_axis0": (lambda x: F.softmax(x, axis=0), lambda: _t(3, 5)),
    "log_softmax": (lambda x: F.log_softmax(x, axis=-1), lambda: _t(3, 5)),
    "logsumexp": (lambda x: F.logsumexp(x, axis=1), lambda: _t(3, 5)),
    "logsumexp_keep": (lambda x: F.logsumexp(x, axis=0, keepdims=True), lambda: _t(3, 5)),
    "avg_pool": (lambda x: F.avg_pool2d(x, 2), lambda: _t(2, 2, 4, 4)),
    "avg_pool_overlap": (lambda x: F.avg_pool2d(x, 3, 1), lambda: _t(1, 2, 5, 5)),
    "max_pool": (lambda x: F.max_pool2d(x, 2), lambda: _distinct(2, 2, 4, 4)),
    "max_pool_stride1": (lambda x: F.max_pool2d(x, 2, 1), lambda: _distinct(1, 2, 4, 4)),
    "global_pool": (F.global_avg_pool2d, lambda: _t(2, 3, 4, 4)),
    "upsample": (lambda x: F.upsample_nearest(x, 2), lambda: _t(1, 2, 3, 3)),
    "pad": (lambda x: F.pad2d(x, (1, 2)), lambda: _t(1, 2, 3, 3)),
    "layer_norm_plain": (lambda x: F.layer_norm(x, axes=1), lambda: _t(4, 6)),
    "layer_norm_2axes": (lambda x: F.layer_norm(x, axes=2), lambda: _t(2, 3, 4)),
}


@pytest.mark.parametrize("name", sorted(UNARY))
def test_unary_ops_match_finite_differences(name: str) -> None:
    fn, make = UNARY[name]
    result = gradcheck(fn, [make()])
    assert result.ok, f"{name}: {result.describe()}"


BINARY: dict[str, tuple[Callable[[Tensor, Tensor], Tensor], tuple[int, ...], tuple[int, ...]]] = {
    "add_broadcast": (T.add, (3, 4), (4,)),
    "sub_broadcast": (T.sub, (3, 1), (1, 4)),
    "mul_broadcast": (T.mul, (2, 3, 4), (3, 1)),
    "div": (T.div, (3, 4), (3, 4)),
    "matmul": (T.matmul, (3, 4), (4, 5)),
    "matmul_batched": (T.matmul, (2, 3, 4), (4, 2)),
    "maximum": (T.maximum, (3, 4), (3, 4)),
    "concat": (lambda a, b: T.concat([a, b], axis=1), (2, 3), (2, 2)),
    "stack": (lambda a, b: T.stack([a, b], axis=1), (2, 3), (2, 3)),
}


@pytest.mark.parametrize("name", sorted(BINARY))
def test_binary_ops_match_finite_differences(name: str) -> None:
    fn, sa, sb = BINARY[name]
    a = _t(*sa, seed=1)
    b = _t(*sb, seed=2, positive=name == "div")
    result = gradcheck(fn, [a, b])
    assert result.ok, f"{name}: {result.describe()}"


def test_where_routes_gradients() -> None:
    a = _t(3, 4, seed=3)
    b = _t(3, 4, seed=4)
    cond = np.arange(12).reshape(3, 4) % 2 == 0
    assert gradcheck(lambda x, y: T.where(cond, x, y), [a, b]).ok


@pytest.mark.parametrize(
    ("stride", "padding", "groups"),
    [(1, 0, 1), (1, 1, 1), (2, 1, 1), (1, 1, 2), (2, 0, 4)],
)
def test_conv2d_matches_finite_differences(stride: int, padding: int, groups: int) -> None:
    x = _t(2, 4, 5, 5, seed=5)
    w = _t(4, 4 // groups, 3, 3, seed=6)
    b = _t(4, seed=7)
    result = gradcheck(
        lambda xx, ww, bb: F.conv2d(xx, ww, bb, stride=stride, padding=padding, groups=groups),
        [x, w, b],
    )
    assert result.ok, result.describe()


def test_conv2d_without_bias_and_reference_values() -> None:
    x = Tensor(np.arange(16.0).reshape(1, 1, 4, 4), dtype=np.float64)
    w = Tensor(np.ones((1, 1, 2, 2)), dtype=np.float64)
    out = F.conv2d(x, w)
    expected = np.array([[10.0, 14.0, 18.0], [26.0, 30.0, 34.0], [42.0, 46.0, 50.0]])
    np.testing.assert_allclose(out.data[0, 0], expected)
    with pytest.raises(ValueError, match="channels"):
        F.conv2d(Tensor(np.zeros((1, 3, 4, 4))), Tensor(np.zeros((2, 2, 3, 3))))


def test_layer_norm_affine_matches_finite_differences() -> None:
    x = _t(3, 5, seed=8)
    w = _t(5, seed=9)
    b = _t(5, seed=10)
    assert gradcheck(lambda xx, ww, bb: F.layer_norm(xx, ww, bb), [x, w, b]).ok


def test_dropout_gradient_and_eval_identity() -> None:
    x = _t(4, 6, seed=11)
    keep_rng = np.random.default_rng(3)
    mask_rng_state = keep_rng.bit_generator.state

    def fn(xx: Tensor) -> Tensor:
        rng = np.random.default_rng()
        rng.bit_generator.state = mask_rng_state
        return F.dropout(xx, 0.5, rng)

    assert gradcheck(fn, [x]).ok
    assert F.dropout(x, 0.5, keep_rng, training=False) is x


def test_softmax_is_stable_for_large_logits() -> None:
    x = Tensor(np.array([[1000.0, 1001.0, 999.0]]), dtype=np.float64)
    probs = F.softmax(x).data
    assert np.all(np.isfinite(probs))
    np.testing.assert_allclose(probs.sum(), 1.0)
    logp = F.log_softmax(x).data
    np.testing.assert_allclose(np.exp(logp), probs, rtol=1e-12)


def test_sigmoid_is_stable_for_extremes() -> None:
    out = T.sigmoid(Tensor(np.array([-800.0, 0.0, 800.0]), dtype=np.float64)).data
    np.testing.assert_allclose(out, [0.0, 0.5, 1.0], atol=1e-12)


def test_shared_input_accumulates_gradient() -> None:
    x = Tensor(np.array([2.0, -3.0]), requires_grad=True, dtype=np.float64)
    y = (x * x + x * 3.0).sum()
    y.backward()
    assert x.grad is not None
    np.testing.assert_allclose(x.grad, 2 * x.data + 3.0)


def test_backward_accumulates_across_calls_and_zero_grad_resets() -> None:
    x = Tensor(np.array([1.0, 2.0]), requires_grad=True)
    (x * 2.0).sum().backward()
    (x * 2.0).sum().backward()
    assert x.grad is not None
    np.testing.assert_allclose(x.grad, [4.0, 4.0])
    x.zero_grad()
    assert x.grad is None


def test_no_grad_records_nothing() -> None:
    x = Tensor(np.ones(3), requires_grad=True)
    with no_grad():
        y = x * 2.0
    assert not y.requires_grad
    assert y.is_leaf
    assert T.is_grad_enabled()


def test_backward_requires_scalar_or_explicit_grad() -> None:
    x = Tensor(np.ones(3), requires_grad=True)
    with pytest.raises(ValueError, match="scalar"):
        (x * 2.0).backward()


def test_dtype_is_preserved_with_python_scalars() -> None:
    x = Tensor(np.ones(3, dtype=np.float32), requires_grad=True)
    y = 2.0 * x + 1.0 - x / 4.0
    assert y.dtype == np.float32
    assert Tensor([1, 2, 3]).dtype == np.float32
    assert Tensor(np.zeros(2), dtype=np.float64).dtype == np.float64


def test_float32_gradients_match_float64() -> None:
    rng = np.random.default_rng(12)
    data = rng.standard_normal((4, 3))
    grads = []
    for dtype in (np.float32, np.float64):
        x = Tensor(data, requires_grad=True, dtype=dtype)
        (T.gelu(x @ x.T).sum()).backward()
        assert x.grad is not None and x.grad.dtype == dtype
        grads.append(x.grad.astype(np.float64))
    np.testing.assert_allclose(grads[0], grads[1], rtol=1e-4, atol=1e-5)


def test_matmul_rejects_vectors_and_unbroadcast_shapes() -> None:
    with pytest.raises(ValueError, match="two dimensions"):
        T.matmul(Tensor(np.ones(3)), Tensor(np.ones((3, 2))))
    g = np.ones((2, 3, 4))
    assert unbroadcast(g, (3, 1)).shape == (3, 1)
    np.testing.assert_allclose(unbroadcast(g, (3, 1)), np.full((3, 1), 8.0))
    assert unbroadcast(g, ()).shape == ()


def test_numeric_grad_restores_input() -> None:
    data = np.array([1.0, 2.0, 3.0])
    copy = data.copy()
    grad = numeric_grad(lambda: float(np.sum(data ** 2)), data)
    np.testing.assert_allclose(grad, 2 * copy, rtol=1e-6)
    np.testing.assert_array_equal(data, copy)


def test_gradcheck_reports_a_wrong_gradient() -> None:
    def broken(x: Tensor) -> Tensor:
        out = T.exp(x)
        bad = Tensor(out.data, requires_grad=True)
        bad._parents = (x,)
        bad._backward = lambda g: (g * 2.0,)
        return bad

    result = gradcheck(broken, [_t(3)])
    assert not result.ok
    assert "FAILED" in result.describe()


def test_tensor_helpers() -> None:
    x = Tensor(np.arange(6.0).reshape(2, 3), requires_grad=True, name="x")
    assert x.shape == (2, 3) and x.ndim == 2 and x.size == 6 and len(x) == 2
    assert "requires_grad=True" in repr(x)
    assert x.detach().requires_grad is False
    assert Tensor(np.array([5.0])).item() == 5.0
    assert np.isnan(x.item())
    assert x.numpy() is x.data
    y = 1.0 - x
    z = 2.0 / (x + 1.0)
    w = np.ones((3, 2)) @ x
    assert y.shape == (2, 3) and z.shape == (2, 3) and w.shape == (3, 3)
    assert x.reshape((3, 2)).shape == (3, 2)
    assert (x ** 2.0).abs().relu().sigmoid().tanh().exp().log().shape == (2, 3)


def test_stack_negative_axis_and_boolean_index() -> None:
    a = _t(2, 3, seed=20)
    b = _t(2, 3, seed=21)
    stacked = T.stack([a, b], axis=-1)
    assert stacked.shape == (2, 3, 2)
    np.testing.assert_array_equal(stacked.data[..., 1], b.data)
    assert gradcheck(lambda x, y: T.stack([x, y], axis=-1), [a, b]).ok
    a.zero_grad()
    mask = a.data > 0
    picked = a[mask]
    assert picked.shape == (int(mask.sum()),)
    picked.sum().backward()
    assert a.grad is not None
    np.testing.assert_array_equal(a.grad, mask.astype(np.float64))


def test_float16_graph_keeps_dtype() -> None:
    x = Tensor(np.linspace(-1, 1, 6).reshape(2, 3), requires_grad=True, dtype=np.float16)
    w = Tensor(np.ones((3, 2)), requires_grad=True, dtype=np.float16)
    out = T.gelu(x @ w).sum() * 0.5
    assert out.dtype == np.float16
    out.backward()
    assert x.grad is not None and x.grad.dtype == np.float16
    assert w.grad is not None and w.grad.dtype == np.float16


def test_backward_through_unused_branch_and_constants() -> None:
    x = Tensor(np.ones(3), requires_grad=True)
    constant = Tensor(np.full(3, 2.0))
    unused = x * 5.0
    y = (x * constant).sum()
    y.backward()
    assert x.grad is not None and constant.grad is None
    np.testing.assert_array_equal(x.grad, [2.0, 2.0, 2.0])
    assert unused.requires_grad
