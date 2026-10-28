"""Trainer loop, callbacks, NaN guard, gradient accumulation and in-process resume.

Uses small MLPs on seeded linear-regression data and a dropout model so resume
must restore generator state. Author: John Khan.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
import pytest

from lab.ml.train import losses as L
from lab.ml.train.callbacks import (
    Callback,
    Checkpointing,
    EarlyStopping,
    History,
    LRSchedule,
    MetricsLog,
    Throughput,
)
from lab.ml.train.data import ArrayDataset, Batch, DataLoader, synthetic_licence
from lab.ml.train.fixtures import regression_problem
from lab.ml.train.modules import MLP, Dropout, Linear, Module, Sequential
from lab.ml.train.optim import EMA, SGD, Adam
from lab.ml.train.schedules import CosineWithWarmup, Scheduler
from lab.ml.train.tensor import Tensor
from lab.ml.train.trainer import NonFiniteError, Trainer, TrainState


def _loader(n: int = 32, batch: int = 8, seed: int = 0, aug: bool = False) -> DataLoader:
    x, y = regression_problem(n, features=3, outputs=1, seed=seed)
    ds = ArrayDataset([x, y], licence=synthetic_licence("regression rows"))
    return DataLoader(ds, batch, seed=seed, augment=_jitter if aug else None)


def _jitter(batch: Batch, rng: np.random.Generator) -> Batch:
    noise = rng.normal(0.0, 0.01, batch[0].shape).astype(np.float32)
    return (batch[0] + noise, batch[1])


def _mse(model: Module, batch: Batch) -> Tensor:
    return L.mse(model(Tensor(batch[0])), batch[1])


def _model(seed: int = 0, dropout: bool = False) -> Module:
    rng = np.random.default_rng(seed)
    if dropout:
        return Sequential(Linear(3, 16, rng), Dropout(0.2, seed=seed), Linear(16, 1, rng))
    return MLP([3, 16, 1], rng)


def _trainer(model: Module, callbacks: list[Callback] | None = None, epochs: int = 3,
             **kwargs: object) -> Trainer:
    opt = Adam(model.parameters(), lr=0.01)
    return Trainer(model, opt, _mse, _loader(), epochs=epochs, callbacks=callbacks or [],
                   **kwargs)  # type: ignore[arg-type]


def test_training_reduces_loss_and_reports_state() -> None:
    history = History()
    trainer = _trainer(_model(), [history], epochs=20, val_loader=_loader(16, 8, seed=0))
    state = trainer.fit()
    assert state.step == 20 * 4
    assert state.epoch == 20
    assert state.stop_reason == "completed 20 epochs"
    assert history.epochs[-1]["train_loss"] < 0.25 * history.epochs[0]["train_loss"]
    assert "val_loss" in history.epochs[-1]
    assert {"loss", "lr", "grad_norm"} <= set(history.steps[0])


def test_max_steps_stops_mid_epoch() -> None:
    state = _trainer(_model(), epochs=10, max_steps=6).fit()
    assert state.step == 6 and state.epoch == 1 and state.batch == 2
    assert state.stop_reason == "reached max_steps=6"


def test_same_seed_is_deterministic() -> None:
    a = _model(3)
    b = _model(3)
    _trainer(a, epochs=2).fit()
    _trainer(b, epochs=2).fit()
    for pa, pb in zip(a.parameters(), b.parameters(), strict=True):
        np.testing.assert_array_equal(pa.data, pb.data)


def test_gradient_accumulation_matches_large_batch() -> None:
    x, y = regression_problem(16, features=3, seed=1)
    ds = ArrayDataset([x, y], licence=synthetic_licence("rows"))
    big = _model(5)
    small = _model(5)
    Trainer(big, SGD(big.parameters(), lr=0.1), _mse,
            DataLoader(ds, 8, shuffle=False), epochs=1).fit()
    Trainer(small, SGD(small.parameters(), lr=0.1), _mse,
            DataLoader(ds, 4, shuffle=False), epochs=1, grad_accum=2).fit()
    for pa, pb in zip(big.parameters(), small.parameters(), strict=True):
        np.testing.assert_allclose(pa.data, pb.data, rtol=1e-5, atol=1e-6)


def test_partial_accumulation_at_epoch_end_uses_true_mean() -> None:
    x, y = regression_problem(12, features=3, seed=2)
    ds = ArrayDataset([x, y], licence=synthetic_licence("rows"))
    whole = _model(6)
    pieces = _model(6)
    Trainer(whole, SGD(whole.parameters(), lr=0.05), _mse,
            DataLoader(ds, 4, shuffle=False), epochs=1).fit()
    Trainer(pieces, SGD(pieces.parameters(), lr=0.05), _mse,
            DataLoader(ds, 4, shuffle=False), epochs=1, grad_accum=5).fit()
    for pa, pb in zip(whole.parameters(), pieces.parameters(), strict=True):
        assert not np.allclose(pa.data, pb.data)
    state = Trainer(pieces, SGD(pieces.parameters(), lr=0.05), _mse,
                    DataLoader(ds, 4, shuffle=False), epochs=1, grad_accum=5).fit()
    assert state.step == 1


def test_nan_loss_stops_with_clear_error() -> None:
    def exploding(model: Module, batch: Batch) -> Tensor:
        return _mse(model, batch) * math.inf

    trainer = Trainer(_model(), SGD(_model().parameters(), lr=0.1), exploding, _loader())
    with pytest.raises(NonFiniteError, match=r"loss is (inf|nan) at step 0 \(epoch 0, batch 0\)"):
        trainer.fit()


def test_nan_gradient_stops_with_clear_error() -> None:
    model = _model()
    model.parameters()[0].data[0, 0] = np.float32(1e38)
    trainer = Trainer(model, SGD(model.parameters(), lr=0.1), _mse, _loader())
    with np.errstate(over="ignore"), pytest.raises(NonFiniteError, match="(gradient norm|loss) is"):
        trainer.fit()


def test_clip_norm_limits_reported_norm_effect() -> None:
    history = History()
    model = _model()
    trainer = Trainer(model, SGD(model.parameters(), lr=0.0), _mse, _loader(),
                      clip_norm=1e-3, callbacks=[history])
    trainer.fit()
    assert all(step["grad_norm"] > 1e-3 for step in history.steps)


def test_early_stopping_stops_and_validates_monitor() -> None:
    model = _model()
    stopper = EarlyStopping(monitor="train_loss", patience=1, mode="max")
    state = Trainer(model, Adam(model.parameters(), lr=0.01), _mse, _loader(), epochs=50,
                    callbacks=[stopper]).fit()
    assert state.epoch == 3 and "early stopping" in state.stop_reason
    assert stopper.stopped_epoch == 2
    missing = EarlyStopping(monitor="val_accuracy")
    with pytest.raises(KeyError, match="val_accuracy"):
        _trainer(_model(), [missing]).fit()
    with pytest.raises(ValueError, match="mode"):
        EarlyStopping(mode="up")
    with pytest.raises(ValueError, match="patience"):
        EarlyStopping(patience=-1)


def test_lr_schedule_callback_and_metrics_log(tmp_path: Path) -> None:
    model = _model()
    opt = SGD(model.parameters(), lr=1.0, momentum=0.9)
    sched = Scheduler(opt, CosineWithWarmup(0.1, total_steps=8, warmup_steps=2))
    path = tmp_path / "metrics.jsonl"
    records: list[dict[str, object]] = []
    Trainer(model, opt, _mse, _loader(), epochs=2,
            callbacks=[LRSchedule(sched), MetricsLog(path, every=2), MetricsLog(records.append)]
            ).fit()
    lines = [json.loads(line) for line in path.read_text().splitlines()]
    steps = [r for r in lines if r["kind"] == "step"]
    assert [r["step"] for r in steps] == [2, 4, 6, 8]
    assert sum(1 for r in lines if r["kind"] == "epoch") == 2
    lrs = [float(r["lr"]) for r in records if r["kind"] == "step"]  # type: ignore[arg-type]
    assert lrs[0] == pytest.approx(0.05) and lrs[1] == pytest.approx(0.1)
    assert opt.lr == pytest.approx(0.0)
    with pytest.raises(ValueError, match="interval"):
        MetricsLog(path, every=0)


def test_validation_errors() -> None:
    model = _model()
    opt = SGD(model.parameters(), lr=0.1)
    for kwargs, message in (({"epochs": 0}, "epochs"), ({"grad_accum": 0}, "grad_accum"),
                            ({"max_steps": 0}, "max_steps")):
        with pytest.raises(ValueError, match=message):
            Trainer(model, opt, _mse, _loader(), **kwargs)  # type: ignore[arg-type]

    def vector(model: Module, batch: Batch) -> Tensor:
        return model(Tensor(batch[0]))

    with pytest.raises(ValueError, match="scalar"):
        Trainer(model, opt, vector, _loader()).fit()
    with pytest.raises(ValueError, match="interval"):
        Checkpointing(Path("."), every=0)


def test_eval_fn_and_ema_are_used() -> None:
    model = _model()
    ema = EMA(model, decay=0.9)

    def metrics(m: Module, loader: DataLoader) -> dict[str, float]:
        assert not m.training
        return {"val_metric": 1.0}

    history = History()
    trainer = Trainer(model, Adam(model.parameters(), lr=0.01), _mse, _loader(), epochs=1,
                      ema=ema, val_loader=_loader(), eval_fn=metrics, callbacks=[history])
    trainer.fit()
    assert history.epochs[0]["val_metric"] == 1.0
    assert ema.updates == 4
    assert model.training
    assert trainer.evaluate(_loader()) == {"val_metric": 1.0}


def _run(tmp: Path, stop_at: int | None, resume: bool, dropout: bool = True) -> Trainer:
    model = _model(11, dropout=dropout)
    opt = SGD(model.parameters(), lr=1.0, momentum=0.9, nesterov=True)
    sched = Scheduler(opt, CosineWithWarmup(0.05, total_steps=24, warmup_steps=3))
    ema = EMA(model, decay=0.8)
    callbacks: list[Callback] = [
        Checkpointing(tmp, every=1, keep_last=2),
        LRSchedule(sched),
        EarlyStopping(monitor="train_loss", patience=100),
    ]
    trainer = Trainer(model, opt, _mse, _loader(aug=True), epochs=6, max_steps=stop_at,
                      grad_accum=2, ema=ema, callbacks=callbacks, seed=4)
    if resume:
        assert trainer.resume_from(tmp)
        trainer.max_steps = None
    trainer.fit()
    return trainer


def test_interrupted_run_resumes_to_identical_weights(tmp_path: Path) -> None:
    straight = _run(tmp_path / "a", None, resume=False)
    _run(tmp_path / "b", 5, resume=False)
    resumed = _run(tmp_path / "b", None, resume=True)
    assert resumed.state.step == straight.state.step == 12
    for pa, pb in zip(straight.model.parameters(), resumed.model.parameters(), strict=True):
        np.testing.assert_array_equal(pa.data, pb.data)
    assert straight.ema is not None and resumed.ema is not None
    for key, value in straight.ema.shadow.items():
        np.testing.assert_array_equal(value, resumed.ema.shadow[key])
    assert straight.optimizer.lr == resumed.optimizer.lr
    assert len(list((tmp_path / "b").glob("ckpt-*.json"))) == 2


def test_resume_without_checkpoint_and_ema_mismatch(tmp_path: Path) -> None:
    trainer = _trainer(_model())
    assert trainer.resume_from(tmp_path / "empty") is False
    path = trainer.save_checkpoint(tmp_path / "plain")
    model = _model()
    with_ema = Trainer(model, Adam(model.parameters()), _mse, _loader(), ema=EMA(model))
    with pytest.raises(Exception, match="no EMA state"):
        with_ema.load_checkpoint(path)


def test_checkpoint_refused_mid_accumulation() -> None:
    trainer = _trainer(_model(), grad_accum=2)
    trainer._accumulated = 1
    with pytest.raises(RuntimeError, match="step boundaries"):
        trainer.checkpoint()


def test_train_state_round_trip() -> None:
    state = TrainState(epoch=2, batch=3, step=9, last_loss=0.5, stop_reason="x")
    assert TrainState.from_dict({**state.to_dict(), "unknown": 1}) == state


def test_resume_falls_back_past_a_corrupt_newest_checkpoint(tmp_path: Path) -> None:
    trainer = _trainer(_model(), [Checkpointing(tmp_path, every=2, keep_last=None)], epochs=1)
    trainer.fit()
    newest = sorted(tmp_path.glob("ckpt-*.npz"))[-1]
    newest.write_bytes(newest.read_bytes()[:-10])
    fresh = _trainer(_model(7), epochs=1)
    assert fresh.resume_from(tmp_path)
    assert fresh.state.step == 2


def test_eval_ema_scores_the_averaged_weights() -> None:
    model = _model(3)
    ema = EMA(model, decay=0.5)
    trainer = Trainer(model, Adam(model.parameters(), lr=0.05), _mse, _loader(), epochs=2,
                      ema=ema, val_loader=_loader(16, 8), eval_ema=True)
    trainer.fit()
    with_ema = trainer.evaluate()["val_loss"]
    trainer.eval_ema = False
    live = trainer.evaluate()["val_loss"]
    assert with_ema != live
    with ema.swapped():
        trainer.eval_ema = False
        assert trainer.evaluate()["val_loss"] == with_ema


def test_throughput_callback_adds_timing_before_logging() -> None:
    ticks = iter(float(i) * 0.5 for i in range(100))
    records: list[dict[str, object]] = []
    trainer = _trainer(_model(), [MetricsLog(records.append), Throughput(lambda: next(ticks))],
                       epochs=1, grad_accum=2)
    trainer.fit()
    steps = [r for r in records if r["kind"] == "step"]
    assert len(steps) == 2
    assert steps[0]["step_ms"] == 500.0
    assert steps[0]["samples_per_s"] == 8 * 2 / 0.5
