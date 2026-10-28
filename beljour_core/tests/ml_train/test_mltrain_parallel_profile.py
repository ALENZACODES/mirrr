"""Data-parallel simulation equals single-worker gradients; per-op profiler.

Author: John Khan.
"""

from __future__ import annotations

import itertools

import numpy as np
import pytest

from lab.ml.train import functional as F
from lab.ml.train import losses as L
from lab.ml.train import tensor as T
from lab.ml.train.data import Batch
from lab.ml.train.fixtures import portraits, regression_problem
from lab.ml.train.models import TinyEncoderDecoder
from lab.ml.train.modules import MLP, Dropout, Linear, Module, Sequential
from lab.ml.train.optim import SGD
from lab.ml.train.parallel import DataParallel, shard
from lab.ml.train.profiler import Profiler
from lab.ml.train.tensor import Tensor


def _mse(model: Module, batch: Batch) -> Tensor:
    return L.mse(model(Tensor(batch[0])), batch[1])


def _single_grads(model: Module, batch: Batch) -> tuple[float, list[np.ndarray]]:
    model.zero_grad()
    loss = _mse(model, batch)
    loss.backward()
    return loss.item(), [p.grad.copy() for p in model.parameters()]  # type: ignore[union-attr]


@pytest.mark.parametrize("workers", [1, 2, 3, 5])
def test_parallel_gradients_equal_single_worker(workers: int) -> None:
    x, y = regression_problem(13, features=4, outputs=2, seed=1)
    batch = (x.astype(np.float64), y.astype(np.float64))
    model = MLP([4, 8, 2], np.random.default_rng(0), dtype=np.float64)
    loss_one, grads_one = _single_grads(model, batch)
    parallel = DataParallel(model, workers)
    step = parallel.step(batch, _mse)
    assert sum(step.shard_sizes) == 13 and len(step.shard_sizes) == workers
    assert step.loss == pytest.approx(loss_one, rel=1e-12)
    for p, g in zip(model.parameters(), grads_one, strict=True):
        assert p.grad is not None
        np.testing.assert_allclose(p.grad, g, rtol=1e-11, atol=1e-13)
    if workers == 1:
        assert step.bytes_per_worker == 0


def test_parallel_training_matches_single_worker_training() -> None:
    images = portraits(8, size=8, seed=2).astype(np.float64)
    batch = (images, images)
    single = TinyEncoderDecoder(np.random.default_rng(3), width=2, latent=2, dtype=np.float64)
    multi = TinyEncoderDecoder(np.random.default_rng(3), width=2, latent=2, dtype=np.float64)
    opt_single = SGD(single.parameters(), lr=0.5, momentum=0.9)
    opt_multi = SGD(multi.parameters(), lr=0.5, momentum=0.9)
    parallel = DataParallel(multi, 4)
    for _ in range(5):
        _single_grads(single, batch)
        opt_single.step()
        parallel.step(batch, _mse)
        opt_multi.step()
    for a, b in zip(single.parameters(), multi.parameters(), strict=True):
        np.testing.assert_allclose(a.data, b.data, rtol=1e-10, atol=1e-12)


def test_replicas_get_distinct_dropout_streams() -> None:
    model = Sequential(Linear(2, 2, np.random.default_rng(0)), Dropout(0.5, seed=1))
    parallel = DataParallel(model, 2)
    first = dict(parallel.replicas[0].named_modules())["1"]
    second = dict(parallel.replicas[1].named_modules())["1"]
    assert isinstance(first, Dropout) and isinstance(second, Dropout)
    assert first.rng.random() != second.rng.random()
    assert parallel.replicas[0] is not model


def test_shard_validation_and_shapes() -> None:
    batch = (np.arange(10), np.arange(10) * 2)
    parts = shard(batch, 3)
    assert [len(p[0]) for p in parts] == [3, 3, 4]
    np.testing.assert_array_equal(np.concatenate([p[1] for p in parts]), batch[1])
    with pytest.raises(ValueError, match="cannot split"):
        shard(batch, 11)
    with pytest.raises(ValueError, match="at least 1"):
        shard(batch, 0)
    with pytest.raises(ValueError, match="at least 1"):
        DataParallel(MLP([2, 1], np.random.default_rng(0)), 0)


def test_profiler_records_forward_backward_and_restores_ops() -> None:
    original_conv = F.conv2d
    original_add = T.add
    model = TinyEncoderDecoder(np.random.default_rng(0), width=2, latent=2)
    x = Tensor(portraits(2, size=16, seed=1))
    with Profiler() as prof:
        loss = L.mse(model(x), x.data)
        loss.backward()
    assert F.conv2d is original_conv and T.add is original_add
    stats = prof.stats
    assert stats["conv2d"].calls == 4 and stats["conv2d"].backward_calls == 4
    assert stats["upsample_nearest"].calls == 2
    assert stats["relu"].calls == 3 and stats["sigmoid"].calls == 1
    assert stats["pad2d"].calls == 4
    assert stats["conv2d"].self_s <= stats["conv2d"].total_s
    assert stats["conv2d"].peak_output_bytes == 2 * 3 * 16 * 16 * 4
    rows = prof.rows()
    assert {r["op"] for r in rows} >= {"conv2d", "mean", "sub", "mul"}
    text = prof.report("Encoder-decoder step")
    assert text.startswith("# Encoder-decoder step") and "| conv2d |" in text
    assert prof.total_seconds() > 0


def test_profiler_self_time_excludes_children() -> None:
    ticks = itertools.count()

    def clock() -> float:
        return float(next(ticks))

    prof = Profiler(clock=clock)
    x = Tensor(np.ones((1, 1, 3, 3)), requires_grad=True)
    w = Tensor(np.ones((1, 1, 3, 3)), requires_grad=True)
    with prof:
        F.conv2d(x, w, padding=1)
    conv = prof.stats["conv2d"]
    pad = prof.stats["pad2d"]
    assert pad.total_s == 1.0 and conv.total_s == 3.0 and conv.self_s == 2.0
    with prof, pytest.raises(RuntimeError, match="already active"):
        prof.__enter__()
