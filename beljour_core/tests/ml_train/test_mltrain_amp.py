"""Mixed-precision simulation: loss scaling, overflow skips and float32 masters.

Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

from lab.ml.train import checkpoint as CK
from lab.ml.train import losses as L
from lab.ml.train.amp import AmpStep, LossScaler, amp_step, half_batch, underflow_fraction
from lab.ml.train.callbacks import History
from lab.ml.train.checkpoint import CheckpointError
from lab.ml.train.config import ConfigError
from lab.ml.train.config import from_dict as config_from_dict
from lab.ml.train.data import ArrayDataset, Batch, DataLoader, synthetic_licence
from lab.ml.train.fixtures import regression_problem
from lab.ml.train.modules import MLP, Module
from lab.ml.train.optim import SGD, Adam
from lab.ml.train.recipes import build
from lab.ml.train.tensor import Tensor
from lab.ml.train.trainer import Trainer


def _mse(model: Module, batch: Batch) -> Tensor:
    return L.mse(model(Tensor(batch[0])), batch[1])


def test_scaler_backoff_and_growth() -> None:
    scaler = LossScaler(init_scale=8.0, growth_interval=2)
    scaler.update(True)
    assert scaler.scale == 4.0 and scaler.skipped == 1
    scaler.update(False)
    scaler.update(False)
    assert scaler.scale == 8.0 and scaler.good_steps == 0
    restored = LossScaler()
    restored.load_state_dict(scaler.state_dict())
    assert (restored.scale, restored.good_steps, restored.skipped) == (8.0, 0, 1)
    floor = LossScaler(init_scale=1.0, min_scale=1.0)
    floor.update(True)
    assert floor.scale == 1.0


@pytest.mark.parametrize(
    "kwargs",
    [{"init_scale": 0.0}, {"growth_factor": 1.0}, {"backoff_factor": 1.0},
     {"growth_interval": 0}],
)
def test_scaler_validation(kwargs: dict[str, float]) -> None:
    with pytest.raises(ValueError):
        LossScaler(**kwargs)  # type: ignore[arg-type]


def test_half_batch_keeps_labels() -> None:
    x, labels = np.ones((2, 3), np.float32), np.array([1, 2])
    hx, hl = half_batch((x, labels))
    assert hx.dtype == np.float16 and hl.dtype == labels.dtype


def test_amp_training_tracks_float32_training() -> None:
    x, y = regression_problem(64, features=3, seed=3)
    batch = (x, y)
    fp32 = MLP([3, 16, 1], np.random.default_rng(0))
    amp = MLP([3, 16, 1], np.random.default_rng(0))
    opt32 = Adam(fp32.parameters(), lr=0.01)
    opt16 = Adam(amp.parameters(), lr=0.01)
    scaler = LossScaler(init_scale=1024.0)
    steps: list[AmpStep] = []
    for _ in range(60):
        loss = _mse(fp32, batch)
        opt32.zero_grad()
        loss.backward()
        opt32.step()
        steps.append(amp_step(amp, opt16, _mse, batch, scaler))
    assert all(s.stepped for s in steps)
    assert all(p.dtype == np.float32 for p in amp.parameters())
    final32 = _mse(fp32, batch).item()
    final16 = _mse(amp, batch).item()
    assert final16 < 0.2 * steps[0].loss
    assert abs(final16 - final32) < 0.1 * max(final32, 1e-3) + 0.02


def test_overflow_skips_step_and_reduces_scale() -> None:
    model = MLP([3, 4, 1], np.random.default_rng(1))
    before = [p.data.copy() for p in model.parameters()]
    opt = SGD(model.parameters(), lr=0.1)
    scaler = LossScaler(init_scale=2.0 ** 40)
    x, y = regression_problem(8, features=3, seed=1)
    result = amp_step(model, opt, _mse, (x, y * 100.0), scaler)
    assert not result.stepped and result.scale == 2.0 ** 40
    assert scaler.scale == 2.0 ** 39 and scaler.skipped == 1
    for p, b in zip(model.parameters(), before, strict=True):
        np.testing.assert_array_equal(p.data, b)
        assert p.grad is None and p.dtype == np.float32
    for _ in range(40):
        result = amp_step(model, opt, _mse, (x, y), scaler)
        if result.stepped:
            break
    assert result.stepped and scaler.scale < 2.0 ** 39


def test_loss_scaling_prevents_gradient_underflow() -> None:
    tiny = [np.full(10, 1e-8, dtype=np.float32)]
    assert underflow_fraction(tiny) == 1.0
    assert underflow_fraction([g * 2.0 ** 16 for g in tiny]) == 0.0
    assert underflow_fraction([np.zeros(3, np.float32)]) == 0.0


def test_amp_requires_float32_masters() -> None:
    model = MLP([2, 1], np.random.default_rng(0), dtype=np.float64)
    opt = SGD(model.parameters(), lr=0.1)
    batch = (np.ones((2, 2)), np.ones((2, 1)))
    with pytest.raises(ValueError, match="float32 master"):
        amp_step(model, opt, _mse, batch, LossScaler())
    assert all(p.dtype == np.float64 for p in model.parameters())


def _amp_trainer(model: Module, scaler: LossScaler, epochs: int = 4,
                 **kwargs: object) -> Trainer:
    x, y = regression_problem(32, features=3, seed=5)
    loader = DataLoader(ArrayDataset([x, y], licence=synthetic_licence("rows")), 8, seed=1)
    return Trainer(model, Adam(model.parameters(), lr=0.01), _mse, loader, epochs=epochs,
                   scaler=scaler, **kwargs)  # type: ignore[arg-type]


def test_trainer_mixed_precision_trains_and_keeps_masters() -> None:
    model = MLP([3, 16, 1], np.random.default_rng(0))
    history = History()
    trainer = _amp_trainer(model, LossScaler(init_scale=256.0, growth_interval=4),
                           epochs=6, callbacks=[history], grad_accum=2)
    state = trainer.fit()
    assert state.step == 12
    assert history.steps[-1]["loss"] < 0.5 * history.steps[0]["loss"]
    assert all(p.dtype == np.float32 for p in model.parameters())
    assert trainer.scaler is not None and trainer.scaler.scale == 256.0 * 2 ** 3


def test_trainer_skips_overflowing_steps() -> None:
    model = MLP([3, 4, 1], np.random.default_rng(1))
    scaler = LossScaler(init_scale=2.0 ** 60, growth_interval=1000)
    trainer = _amp_trainer(model, scaler, epochs=1)
    state = trainer.fit()
    assert scaler.skipped >= 1
    assert state.step == 4 - scaler.skipped
    assert scaler.scale == 2.0 ** (60 - scaler.skipped)


def test_trainer_mixed_precision_resumes_scaler_state(tmp_path: Path) -> None:
    model = MLP([3, 8, 1], np.random.default_rng(2))
    trainer = _amp_trainer(model, LossScaler(init_scale=64.0, growth_interval=3), epochs=2)
    trainer.fit()
    path = trainer.save_checkpoint(tmp_path)
    fresh = _amp_trainer(MLP([3, 8, 1], np.random.default_rng(9)), LossScaler(), epochs=2)
    fresh.load_checkpoint(path)
    assert fresh.scaler is not None and trainer.scaler is not None
    assert fresh.scaler.scale == trainer.scaler.scale
    assert fresh.scaler.good_steps == trainer.scaler.good_steps
    plain = Trainer(MLP([3, 8, 1], np.random.default_rng(9)), SGD(model.parameters(), 0.1),
                    _mse, trainer.train_loader)
    plain.save_checkpoint(tmp_path / "plain")
    with pytest.raises(CheckpointError, match="loss-scaler"):
        fresh.load_checkpoint(CK.latest(tmp_path / "plain"))  # type: ignore[arg-type]


def test_mixed_precision_config_and_recipe(tmp_path: Path) -> None:
    with pytest.raises(ConfigError, match="mixed_precision"):
        config_from_dict({"train": {"mixed_precision": True, "dtype": "float64"}})
    config = config_from_dict({
        "data": {"task": "regression", "samples": 24, "batch_size": 8, "features": 2},
        "model": {"kind": "mlp", "hidden": [4]},
        "optim": {"ema_decay": 0.5},
        "train": {"epochs": 1, "mixed_precision": True, "eval_ema": True},
    })
    built = build(config, tmp_path)
    assert built.trainer.scaler is not None and built.trainer.eval_ema
    built.trainer.fit()
