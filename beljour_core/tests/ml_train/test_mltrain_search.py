"""Learning-rate finder and grid/random hyperparameter search.

Author: John Khan.
"""

from __future__ import annotations

import math
import random
from collections.abc import Callable
from pathlib import Path

import numpy as np
import pytest

from lab.ml.train import config as C
from lab.ml.train import experiments as X
from lab.ml.train import losses as L
from lab.ml.train import search as S
from lab.ml.train.data import ArrayDataset, Batch, DataLoader, synthetic_licence
from lab.ml.train.fixtures import regression_problem
from lab.ml.train.modules import MLP, Module
from lab.ml.train.optim import SGD, Optimizer
from lab.ml.train.tensor import Tensor


def _loader() -> DataLoader:
    x, y = regression_problem(64, features=3, seed=2)
    return DataLoader(ArrayDataset([x, y], licence=synthetic_licence("rows")), 16, seed=2)


def _make() -> tuple[Module, Optimizer]:
    model = MLP([3, 16, 1], np.random.default_rng(0))
    return model, SGD(model.parameters(), lr=1e-4, momentum=0.9)


def _mse(model: Module, batch: Batch) -> Tensor:
    return L.mse(model(Tensor(batch[0])), batch[1])


def test_lr_finder_sweeps_and_detects_divergence() -> None:
    result = S.find_lr(_make, _mse, _loader(), start_lr=1e-4, end_lr=10.0, steps=60)
    assert result.diverged
    assert len(result.lrs) < 60
    assert result.lrs[0] == pytest.approx(1e-4)
    assert all(b > a for a, b in zip(result.lrs, result.lrs[1:], strict=False))
    assert 1e-4 <= result.suggestion < result.lrs[-1]
    assert len(result.losses) == len(result.smoothed) == len(result.lrs)


def test_lr_finder_suggestion_trains_well() -> None:
    result = S.find_lr(_make, _mse, _loader(), start_lr=1e-4, end_lr=1.0, steps=40)
    model, opt = _make()
    opt.lr = result.suggestion
    loader = _loader()
    first = None
    for epoch in range(5):
        for _, batch in loader.iter_epoch(epoch):
            loss = _mse(model, batch)
            first = loss.item() if first is None else first
            opt.zero_grad()
            loss.backward()
            opt.step()
    assert first is not None and loss.item() < 0.5 * first


def test_lr_finder_validation_and_short_series() -> None:
    with pytest.raises(ValueError, match="start_lr"):
        S.find_lr(_make, _mse, _loader(), start_lr=1.0, end_lr=0.1)
    with pytest.raises(ValueError, match="at least 3"):
        S.find_lr(_make, _mse, _loader(), steps=2)
    assert S.suggest_lr([0.1], [1.0]) == 0.1
    assert math.isnan(S.suggest_lr([], []))
    assert S.suggest_lr([1e-3, 1e-2, 1e-1, 1.0], [1.0, 0.5, 0.45, 2.0]) == 1e-3


def test_lr_finder_stops_on_nan_loss() -> None:
    def nan_loss(model: Module, batch: Batch) -> Tensor:
        return _mse(model, batch) * float("nan")

    result = S.find_lr(_make, nan_loss, _loader(), steps=10)
    assert result.diverged and result.lrs == []


def test_dimensions_sample_in_range() -> None:
    rng = random.Random(1)
    for _ in range(50):
        assert 1e-4 <= S.log_uniform(1e-4, 1e-1).sample(rng) <= 1e-1
        assert 0.2 <= S.uniform(0.2, 0.4).sample(rng) <= 0.4
        assert S.integer(2, 4).sample(rng) in (2, 3, 4)
        assert S.choice("a", "b").sample(rng) in ("a", "b")
    bad_dimensions: list[Callable[[], S.Dimension]] = [
        lambda: S.Dimension("normal"), lambda: S.choice(),
        lambda: S.uniform(1.0, 1.0), lambda: S.log_uniform(0.0, 1.0)]
    for bad in bad_dimensions:
        with pytest.raises(ValueError):
            bad()
    with pytest.raises(ValueError, match="choice dimensions"):
        S.uniform(0.0, 1.0).grid()


def test_grid_and_random_trials() -> None:
    grid = S.grid_trials({"optim.lr": S.choice(0.1, 0.01), "optim.name": S.choice("sgd", "adam")})
    assert grid == [
        {"optim.lr": 0.1, "optim.name": "sgd"}, {"optim.lr": 0.1, "optim.name": "adam"},
        {"optim.lr": 0.01, "optim.name": "sgd"}, {"optim.lr": 0.01, "optim.name": "adam"},
    ]
    space = {"optim.lr": S.log_uniform(1e-3, 1e-1)}
    assert S.random_trials(space, 5, seed=3) == S.random_trials(space, 5, seed=3)
    assert S.random_trials(space, 5, seed=3) != S.random_trials(space, 5, seed=4)


def test_with_overrides_validates() -> None:
    base = C.ExperimentConfig()
    assert S.with_overrides(base, {"optim.lr": 0.5}).optim.lr == 0.5
    with pytest.raises(C.ConfigError, match="not a config section"):
        S.with_overrides(base, {"nothing.lr": 0.5})
    with pytest.raises(C.ConfigError, match="optim.lr"):
        S.with_overrides(base, {"optim.lr": -1.0})


def _base() -> C.ExperimentConfig:
    return C.from_dict({
        "name": "search",
        "data": {"task": "regression", "samples": 40, "batch_size": 8, "features": 3},
        "model": {"kind": "mlp", "hidden": [8]},
        "train": {"epochs": 2, "checkpoint_every": 100},
    })


def test_grid_search_ranks_runs(tmp_path: Path) -> None:
    registry = X.Registry(tmp_path)
    space = {"optim.lr": S.choice(1e-5, 0.03)}
    result = S.search(registry, _base(), space, strategy="grid")
    assert len(result.records) == 2 and not result.failures
    best = result.best
    assert best is not None and best.config["optim"]["lr"] == 0.03
    board = result.leaderboard()
    assert board[0]["optim.lr"] == 0.03
    assert len(registry.list_runs(sweep_id=result.records[0].sweep_id)) == 2


def test_random_search_records_failures(tmp_path: Path) -> None:
    registry = X.Registry(tmp_path)
    space = {"optim.lr": S.choice(1e30), "optim.name": S.choice("sgd"),
             "optim.momentum": S.choice(0.0)}
    with np.errstate(all="ignore"):
        result = S.search(registry, _base(), space, strategy="random", count=1,
                          metric="val_loss", mode="max")
    assert len(result.failures) == 1
    assert result.records[0].status == "failed"
    assert result.best is None
    assert result.score(result.records[0]) == -math.inf


def test_search_argument_errors(tmp_path: Path) -> None:
    registry = X.Registry(tmp_path)
    with pytest.raises(ValueError, match="mode"):
        S.search(registry, _base(), {}, mode="best")
    with pytest.raises(ValueError, match="strategy"):
        S.search(registry, _base(), {}, strategy="bayes")


def test_parse_dimension() -> None:
    assert S.parse_dimension("optim.lr=0.1,0.01") == ("optim.lr", S.choice(0.1, 0.01))
    assert S.parse_dimension("optim.name=sgd,adam") == ("optim.name", S.choice("sgd", "adam"))
    assert S.parse_dimension("optim.lr=log:1e-4:1e-1") == ("optim.lr", S.log_uniform(1e-4, 0.1))
    assert S.parse_dimension("data.batch_size=int:4:16")[1] == S.integer(4, 16)
    assert S.parse_dimension("optim.beta1=uniform:0.8:0.95")[1].kind == "uniform"
    for bad, message in (("optim.lr", "field=values"), ("optim.lr=log:1", "LOW:HIGH"),
                         ("optim.lr=log:a:b", "numbers")):
        with pytest.raises(ValueError, match=message):
            S.parse_dimension(bad)


def test_find_lr_for_config() -> None:
    result = S.find_lr_for_config(_base(), start_lr=1e-4, end_lr=1.0, steps=10)
    assert len(result.lrs) == 10 and not math.isnan(result.suggestion)
