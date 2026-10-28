"""Module system, initialisers and reference models in lab.ml.train.

Covers parameter naming, train/eval, state dict round trips, seeded
initialisation statistics and gradient checks of the composite layers.
Inputs are seeded random arrays only. Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.ml.train import initializers as init
from lab.ml.train.gradcheck import gradcheck
from lab.ml.train.models import (
    DepthwiseSeparable,
    ResidualBlock,
    TinyEncoderDecoder,
    TinySelfAttention,
    Upsample,
)
from lab.ml.train.modules import (
    MLP,
    Activation,
    Conv2d,
    Dropout,
    Flatten,
    LayerNorm,
    Linear,
    Module,
    Parameter,
    Reshape,
    Sequential,
)
from lab.ml.train.tensor import Tensor


def _rng(seed: int = 0) -> np.random.Generator:
    return np.random.default_rng(seed)


def _x(*shape: int, seed: int = 1) -> Tensor:
    return Tensor(_rng(seed).standard_normal(shape), requires_grad=True, dtype=np.float64)


def _check_module(module: Module, x: Tensor) -> None:
    params = module.parameters()

    def fn(xx: Tensor, *ps: Tensor) -> Tensor:
        return module(xx)

    result = gradcheck(fn, [x, *params], atol=1e-5, rtol=1e-3)
    assert result.ok, f"{type(module).__name__}: {result.describe()}"


def test_parameter_names_follow_assignment_order() -> None:
    model = Sequential(Linear(4, 3, _rng()), Activation("relu"), Linear(3, 2, _rng()))
    names = [name for name, _ in model.named_parameters()]
    assert names == ["0.weight", "0.bias", "2.weight", "2.bias"]
    assert model.num_parameters() == 4 * 3 + 3 + 3 * 2 + 2
    assert len(model) == 3
    assert isinstance(model[1], Activation)


def test_reassignment_replaces_registration() -> None:
    layer = Linear(2, 2, _rng())
    layer.bias = None
    assert [n for n, _ in layer.named_parameters()] == ["weight"]
    out = layer(Tensor(np.ones((1, 2))))
    assert out.shape == (1, 2)


def test_module_requires_init_before_assignment() -> None:
    class Broken(Module):
        def __init__(self) -> None:
            self.weight = Parameter(np.ones(2))

    with pytest.raises(AttributeError, match="Module.__init__"):
        Broken()


def test_forward_must_be_defined() -> None:
    with pytest.raises(NotImplementedError):
        Module()(Tensor(np.ones(1)))


def test_train_eval_propagates_to_children() -> None:
    model = Sequential(Linear(2, 2, _rng()), Dropout(0.5))
    model.eval()
    assert all(not m.training for _, m in model.named_modules())
    model.train()
    assert all(m.training for _, m in model.named_modules())


def test_state_dict_round_trip_and_strictness() -> None:
    a = MLP([4, 8, 2], _rng(1))
    b = MLP([4, 8, 2], _rng(2))
    x = Tensor(_rng(3).standard_normal((5, 4)))
    assert not np.allclose(a(x).data, b(x).data)
    b.load_state_dict(a.state_dict())
    np.testing.assert_array_equal(a(x).data, b(x).data)
    state = a.state_dict()
    state["0.weight"][...] = 0.0
    assert not np.all(a.state_dict()["0.weight"] == 0.0), "state_dict must copy"
    with pytest.raises(KeyError, match="missing"):
        b.load_state_dict({"0.weight": state["0.weight"]})
    with pytest.raises(ValueError, match="shape"):
        b.load_state_dict({**a.state_dict(), "0.weight": np.zeros((3, 3))})
    extra = {**a.state_dict(), "spare": np.zeros(1)}
    assert b.load_state_dict(extra, strict=False) == ["spare"]


def test_buffers_are_saved_and_restored() -> None:
    model = Sequential(Linear(2, 2, _rng()))
    model[0].register_buffer("count", np.array([3.0]))
    state = model.state_dict()
    assert "0.count" in state
    other = Sequential(Linear(2, 2, _rng(5)))
    other[0].register_buffer("count", np.array([0.0]))
    other.load_state_dict(state)
    np.testing.assert_array_equal(other[0].buffer("count"), [3.0])


def test_freeze_and_trainable_parameters() -> None:
    model = MLP([3, 4, 2], _rng())
    model[0].freeze()
    assert model.num_parameters(trainable_only=True) == 4 * 2 + 2
    model.unfreeze()
    assert model.num_parameters(trainable_only=True) == model.num_parameters()
    model.zero_grad()
    assert all(p.grad is None for p in model.parameters())


def test_repr_lists_children() -> None:
    text = repr(Sequential(Linear(2, 3, _rng()), Activation("tanh")))
    assert "Linear(2, 3, bias=True)" in text
    assert "(1): Activation(tanh)" in text


@pytest.mark.parametrize("name", sorted(init.INITIALISERS))
def test_initialisers_are_seeded_and_scaled(name: str) -> None:
    shape = (256, 128)
    a = init.initialise(name, shape, _rng(7))
    b = init.initialise(name, shape, _rng(7))
    np.testing.assert_array_equal(a, b)
    fan_in, fan_out = init.fans(shape)
    expected = {
        "xavier_uniform": np.sqrt(2.0 / (fan_in + fan_out)),
        "xavier_normal": np.sqrt(2.0 / (fan_in + fan_out)),
        "he_uniform": np.sqrt(2.0 / fan_in),
        "he_normal": np.sqrt(2.0 / fan_in),
    }[name]
    assert abs(float(a.std()) - expected) / expected < 0.05
    assert a.dtype == np.float32


def test_initialiser_errors_and_conv_fans() -> None:
    assert init.fans((8, 4, 3, 3)) == (36, 72)
    with pytest.raises(ValueError, match="at least 2"):
        init.fans((5,))
    with pytest.raises(ValueError, match="unknown initialiser"):
        init.initialise("orthogonal", (2, 2), _rng())
    assert init.zeros((2,)).sum() == 0.0 and init.ones((2,)).sum() == 2.0


def test_linear_and_mlp_gradients() -> None:
    _check_module(Linear(4, 3, _rng(), dtype=np.float64), _x(2, 4))
    _check_module(MLP([3, 5, 2], _rng(), activation="tanh", dtype=np.float64), _x(4, 3))


def test_conv_and_pool_layers_gradients() -> None:
    conv = Conv2d(2, 3, 3, _rng(), stride=2, padding=1, dtype=np.float64)
    _check_module(conv, _x(2, 2, 5, 5))
    with pytest.raises(ValueError, match="divisible"):
        Conv2d(3, 4, 3, _rng(), groups=2)


def test_residual_depthwise_upsample_gradients() -> None:
    _check_module(ResidualBlock(2, _rng(), activation="gelu", dtype=np.float64), _x(1, 2, 4, 4))
    _check_module(DepthwiseSeparable(2, 3, _rng(), stride=2, dtype=np.float64), _x(1, 2, 4, 4))
    out = Upsample(2)(_x(1, 1, 2, 2))
    assert out.shape == (1, 1, 4, 4)


def test_layernorm_flatten_reshape_gradients() -> None:
    _check_module(LayerNorm((4,), dtype=np.float64), _x(3, 4))
    model = Sequential(Flatten(), Linear(8, 4, _rng(), dtype=np.float64), Reshape(2, 2))
    _check_module(model, _x(2, 2, 2, 2))
    assert model(_x(3, 2, 2, 2)).shape == (3, 2, 2)


@pytest.mark.parametrize("causal", [False, True])
def test_self_attention_gradients_and_causality(causal: bool) -> None:
    attention = TinySelfAttention(4, _rng(), causal=causal, dtype=np.float64)
    _check_module(attention, _x(2, 3, 4))
    weights = attention.attention_weights(_x(1, 5, 4)).data[0]
    np.testing.assert_allclose(weights.sum(axis=-1), np.ones(5), rtol=1e-10)
    if causal:
        assert np.all(np.triu(weights, k=1) < 1e-12)


def test_dropout_rate_validation_and_eval_identity() -> None:
    with pytest.raises(ValueError, match="dropout rate"):
        Dropout(1.0)
    layer = Dropout(0.5, seed=3)
    x = Tensor(np.ones((100, 10)))
    y = layer(x)
    assert 0.3 < float((y.data == 0).mean()) < 0.7
    layer.eval()
    assert layer(x) is x


def test_unknown_activation_and_short_mlp() -> None:
    with pytest.raises(ValueError, match="unknown activation"):
        Activation("swish")
    with pytest.raises(ValueError, match="at least"):
        MLP([3], _rng())


def test_tiny_encoder_decoder_shapes_and_range() -> None:
    model = TinyEncoderDecoder(_rng(), width=4, latent=6, residual=True)
    x = Tensor(_rng(2).random((2, 3, 32, 32)))
    assert model.encode(x).shape == (2, 6, 8, 8)
    y = model(x)
    assert y.shape == (2, 3, 32, 32)
    assert float(y.data.min()) >= 0.0 and float(y.data.max()) <= 1.0
    with pytest.raises(ValueError, match="divisible by 4"):
        model(Tensor(np.zeros((1, 3, 30, 30))))


def test_tiny_encoder_decoder_gradient_on_small_input() -> None:
    model = TinyEncoderDecoder(_rng(4), channels=1, width=2, latent=2, dtype=np.float64)
    _check_module(model, _x(1, 1, 8, 8))


def test_same_seed_gives_identical_models() -> None:
    a = TinyEncoderDecoder(_rng(9))
    b = TinyEncoderDecoder(_rng(9))
    for (na, pa), (nb, pb) in zip(a.named_parameters(), b.named_parameters(), strict=True):
        assert na == nb
        np.testing.assert_array_equal(pa.data, pb.data)


def test_public_exports_resolve() -> None:
    import lab.ml.train as package

    missing = [name for name in package.__all__ if not hasattr(package, name)]
    assert missing == []
    assert len(set(package.__all__)) == len(package.__all__)
