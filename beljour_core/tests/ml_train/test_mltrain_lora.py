"""LoRA adapters: injection, adapter-only training, exact merge/unmerge, save/load.

Exact-equality checks use float64 and values that are exactly representable,
so merged and unmerged forward passes agree bit for bit. Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

from lab.ml.train import lora as LR
from lab.ml.train import losses as L
from lab.ml.train.checkpoint import CheckpointError
from lab.ml.train.gradcheck import gradcheck
from lab.ml.train.models import TinyEncoderDecoder
from lab.ml.train.modules import MLP, Conv2d, Linear, Module, Sequential
from lab.ml.train.optim import Adam
from lab.ml.train.tensor import Tensor


def _rng(seed: int = 0) -> np.random.Generator:
    return np.random.default_rng(seed)


def _dyadic(shape: tuple[int, ...], seed: int) -> np.ndarray:
    """Small multiples of 1/8: sums and products stay exact in float64."""
    return _rng(seed).integers(-4, 5, shape).astype(np.float64) / 8.0


def test_injection_starts_as_identity_and_freezes_base() -> None:
    model = MLP([4, 6, 3], _rng(), dtype=np.float64)
    x = Tensor(_rng(1).standard_normal((5, 4)), dtype=np.float64)
    before = model(x).data.copy()
    wrapped = LR.inject_lora(model, rank=2, alpha=4.0)
    assert wrapped == ["0", "2"]
    np.testing.assert_array_equal(model(x).data, before)
    trainable = [n for n, p in model.named_parameters() if p.requires_grad]
    assert trainable == ["0.lora_A", "0.lora_B", "2.lora_A", "2.lora_B"]
    assert model.num_parameters(trainable_only=True) == 2 * 4 + 6 * 2 + 2 * 6 + 3 * 2


def test_targets_select_layers_and_errors() -> None:
    model = TinyEncoderDecoder(_rng(), width=4, latent=4)
    names = LR.inject_lora(model, rank=1, targets=["decoder.*"])
    assert names == ["decoder.1", "decoder.4"]
    assert all(not p.requires_grad for n, p in model.named_parameters()
               if n.startswith("encoder"))
    with pytest.raises(ValueError, match="no Linear or Conv2d"):
        LR.inject_lora(MLP([2, 2], _rng()), targets=["nothing*"])
    with pytest.raises(ValueError, match="rank"):
        LR.LoRALinear(Linear(2, 2, _rng()), 0, 1.0, _rng())
    with pytest.raises(ValueError, match="groups=1"):
        LR.LoRAConv2d(Conv2d(4, 4, 3, _rng(), groups=2), 1, 1.0, _rng())


def test_reinjection_skips_wrapped_layers() -> None:
    model = MLP([3, 3], _rng())
    LR.inject_lora(model, rank=1)
    with pytest.raises(ValueError, match="no Linear"):
        LR.inject_lora(model, rank=1)


def test_training_updates_only_adapters() -> None:
    model = MLP([3, 8, 1], _rng(2))
    base = {n: p.data.copy() for n, p in model.named_parameters()}
    LR.inject_lora(model, rank=2, alpha=2.0, seed=1)
    opt = Adam(model.trainable_parameters(), lr=0.05)
    x = Tensor(_rng(3).standard_normal((16, 3)))
    y = _rng(4).standard_normal((16, 1)).astype(np.float32)
    first = None
    for _ in range(30):
        loss = L.mse(model(x), y)
        first = loss.item() if first is None else first
        opt.zero_grad()
        loss.backward()
        opt.step()
    assert first is not None and loss.item() < first
    for name, value in base.items():
        np.testing.assert_array_equal(dict(model.named_parameters())[
            name.replace("0.", "0.base.", 1).replace("2.", "2.base.", 1)].data, value)


def _set_dyadic(model: Module, seed: int) -> None:
    for index, (_, p) in enumerate(model.named_parameters()):
        p.data[...] = _dyadic(p.shape, seed + index)


def test_linear_merge_unmerge_exact() -> None:
    model = Sequential(Linear(4, 3, _rng(), dtype=np.float64))
    LR.inject_lora(model, rank=2, alpha=2.0)
    _set_dyadic(model, 10)
    layer = LR.lora_layers(model)[0][1]
    x = Tensor(_dyadic((5, 4), 99), dtype=np.float64)
    unmerged_out = model(x).data.copy()
    original = layer.base.weight.data.copy()
    LR.merge_all(model)
    assert layer.merged
    np.testing.assert_array_equal(model(x).data, unmerged_out)
    np.testing.assert_array_equal(layer.base.weight.data,
                                  original + layer.scale * layer.delta_weight())
    LR.merge_all(model)
    LR.unmerge_all(model)
    assert not layer.merged
    np.testing.assert_array_equal(layer.base.weight.data, original)
    np.testing.assert_array_equal(model(x).data, unmerged_out)
    LR.unmerge_all(model)


def test_conv_merge_unmerge_exact() -> None:
    model = Sequential(Conv2d(2, 3, 3, _rng(), padding=1, dtype=np.float64))
    LR.inject_lora(model, rank=2, alpha=4.0)
    _set_dyadic(model, 20)
    x = Tensor(_dyadic((1, 2, 5, 5), 7), dtype=np.float64)
    out = model(x).data.copy()
    original = model[0].base.weight.data.copy()  # type: ignore[attr-defined]
    LR.merge_all(model)
    np.testing.assert_array_equal(model(x).data, out)
    LR.unmerge_all(model)
    np.testing.assert_array_equal(model[0].base.weight.data, original)  # type: ignore[attr-defined]


def test_unmerge_after_weight_change_subtracts_delta() -> None:
    model = Sequential(Linear(2, 2, _rng(), dtype=np.float64))
    LR.inject_lora(model, rank=1, alpha=1.0)
    _set_dyadic(model, 30)
    layer = LR.lora_layers(model)[0][1]
    original = layer.base.weight.data.copy()
    layer.merge()
    layer.base.weight.data += 0.5
    layer.unmerge()
    np.testing.assert_array_equal(layer.base.weight.data, original + 0.5)


def test_lora_gradients() -> None:
    model = Sequential(Linear(3, 2, _rng(), dtype=np.float64),
                       Conv2d(1, 2, 3, _rng(), padding=1, dtype=np.float64))
    LR.inject_lora(model, rank=2, targets=["0"])
    for _, p in model.named_parameters():
        if p.requires_grad:
            p.data[...] = _rng(5).standard_normal(p.shape)
    linear = model[0]
    x = Tensor(_rng(6).standard_normal((4, 3)), requires_grad=True, dtype=np.float64)
    adapters = model.trainable_parameters()
    assert gradcheck(lambda xx, *ps: linear(xx), [x, *adapters]).ok
    conv_model = Sequential(Conv2d(2, 3, 3, _rng(), padding=1, dtype=np.float64))
    LR.inject_lora(conv_model, rank=2)
    for p in conv_model.trainable_parameters():
        p.data[...] = _rng(7).standard_normal(p.shape)
    xc = Tensor(_rng(8).standard_normal((1, 2, 4, 4)), requires_grad=True, dtype=np.float64)
    result = gradcheck(lambda xx, *ps: conv_model(xx), [xc, *conv_model.trainable_parameters()])
    assert result.ok, result.describe()


def test_adapters_save_and_load_alone(tmp_path: Path) -> None:
    source = MLP([3, 4, 2], _rng(1))
    LR.inject_lora(source, rank=2, alpha=3.0)
    for p in source.trainable_parameters():
        p.data[...] = _rng(2).standard_normal(p.shape)
    path = tmp_path / "adapter.npz"
    sidecar = LR.save_adapters(source, path, meta={"task": "unit"})
    assert sidecar.name == "adapter.json"
    target = MLP([3, 4, 2], _rng(1))
    LR.inject_lora(target, rank=2, alpha=3.0)
    loaded = LR.load_adapters(target, path)
    assert loaded == ["0.lora_A", "0.lora_B", "2.lora_A", "2.lora_B"]
    x = Tensor(_rng(3).standard_normal((2, 3)))
    np.testing.assert_array_equal(source(x).data, target(x).data)
    assert path.stat().st_size < 4096


def test_adapter_load_errors(tmp_path: Path) -> None:
    source = MLP([3, 4, 2], _rng(1))
    LR.inject_lora(source, rank=2)
    path = tmp_path / "a.npz"
    LR.save_adapters(source, path)
    wrong_rank = MLP([3, 4, 2], _rng(1))
    LR.inject_lora(wrong_rank, rank=3)
    with pytest.raises(CheckpointError, match="rank/alpha"):
        LR.load_adapters(wrong_rank, path)
    partial = MLP([3, 4, 2], _rng(1))
    LR.inject_lora(partial, rank=2, targets=["0"])
    with pytest.raises(CheckpointError, match="no LoRA layer"):
        LR.load_adapters(partial, path)
    path.write_bytes(path.read_bytes() + b"x")
    with pytest.raises(CheckpointError, match="hash"):
        LR.load_adapters(source, path)
    with pytest.raises(CheckpointError, match="not found"):
        LR.load_adapters(source, tmp_path / "missing.npz")
    with pytest.raises(ValueError, match="no LoRA layers"):
        LR.save_adapters(MLP([2, 2], _rng()), tmp_path / "b.npz")
    LR.merge_all(source)
    with pytest.raises(ValueError, match="unmerge"):
        LR.save_adapters(source, tmp_path / "c.npz")


def test_merged_state_dict_loads_into_plain_model() -> None:
    model = MLP([3, 4, 2], _rng(1), dtype=np.float64)
    LR.inject_lora(model, rank=2)
    for p in model.trainable_parameters():
        p.data[...] = _rng(4).standard_normal(p.shape)
    x = Tensor(_rng(5).standard_normal((3, 3)), dtype=np.float64)
    expected = model(x).data
    plain = MLP([3, 4, 2], _rng(9), dtype=np.float64)
    plain.load_state_dict(LR.merged_state_dict(model))
    np.testing.assert_allclose(plain(x).data, expected, rtol=1e-12, atol=1e-12)
    assert not any(layer.merged for _, layer in LR.lora_layers(model))
    assert "rank=2" in repr(model)
