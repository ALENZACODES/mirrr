"""Experiment registry, metrics, comparison, sweeps, reports and recipes.

Runs are tiny (a few optimiser steps on drawn data) and live in tmp_path.
Author: John Khan.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any

import numpy as np
import pytest

from lab.ml.train import config as C
from lab.ml.train import experiments as X
from lab.ml.train import recipes as R
from lab.ml.train import report as P


def _config(**sections: dict[str, Any]) -> C.ExperimentConfig:
    raw: dict[str, Any] = {
        "name": "tiny",
        "data": {"task": "regression", "samples": 40, "batch_size": 8, "features": 3},
        "model": {"kind": "mlp", "hidden": [8]},
        "optim": {"name": "adam", "lr": 0.02},
        "train": {"epochs": 2, "checkpoint_every": 2, "log_every": 1},
    }
    for key, value in sections.items():
        raw[key] = {**raw.get(key, {}), **value}
    return C.from_dict(raw)


def test_run_records_everything(tmp_path: Path) -> None:
    registry = X.Registry(tmp_path)
    lines: list[str] = []
    record = X.run(registry, _config(), lines.append)
    assert record.status == "finished"
    assert record.message == "completed 2 epochs"
    assert record.config_hash == C.config_hash(_config())
    assert record.seed == 0 and record.duration is not None and record.duration >= 0
    assert (record.run_dir / "config.json").is_file()
    assert C.load(record.run_dir / "config.json") == _config()
    assert {"final_loss", "val_loss", "best_val_loss", "train_loss"} <= set(record.final_metrics)
    assert lines[0].startswith(f"run {record.run_id} started")
    assert any(line.startswith("checkpoint step=2 ") for line in lines)
    assert any(line.startswith("epoch 1 ") for line in lines)
    assert registry.get(record.run_id[-6:]).run_id == record.run_id
    assert registry.by_hash(record.config_hash)[0].run_id == record.run_id


def test_git_commit_is_recorded_when_available(tmp_path: Path) -> None:
    repo = Path(__file__).resolve().parents[3]
    commit = X.git_commit(repo)
    assert commit is None or len(commit) == 40
    assert X.git_commit(tmp_path) is None


def test_list_filters_and_unknown_ids(tmp_path: Path) -> None:
    registry = X.Registry(tmp_path)
    X.run(registry, _config())
    X.run(registry, _config(train={"epochs": 1}))
    assert len(registry.list_runs()) == 2
    assert len(registry.list_runs(status="finished", name="tiny")) == 2
    assert registry.list_runs(status="failed") == []
    with pytest.raises(KeyError, match="no unique run"):
        registry.get("zzzz-not-a-run")
    with pytest.raises(KeyError, match="no unique run"):
        registry.get("tiny-does-not-match-0")
    with pytest.raises(ValueError, match="unknown run status"):
        registry.set_status(registry.list_runs()[0].run_id, "paused")


def test_registry_schema_is_plain_sqlite(tmp_path: Path) -> None:
    X.Registry(tmp_path)
    with sqlite3.connect(tmp_path / "registry.sqlite") as db:
        columns = [row[1] for row in db.execute("PRAGMA table_info(runs)")]
    for column in ("run_id", "config_hash", "git_commit", "seed", "status", "started", "ended"):
        assert column in columns


def test_failed_run_is_marked(tmp_path: Path) -> None:
    registry = X.Registry(tmp_path)
    exploding = _config(optim={"name": "sgd", "lr": 1e30, "momentum": 0.0})
    with pytest.raises(FloatingPointError):
        with np.errstate(all="ignore"):
            X.run(registry, exploding)
    record = registry.list_runs()[0]
    assert record.status == "failed" and "is" in record.message


def test_resume_of_finished_run_is_refused(tmp_path: Path) -> None:
    registry = X.Registry(tmp_path)
    record = X.run(registry, _config())
    with pytest.raises(ValueError, match="already finished"):
        X.resume(registry, record.run_id)


def test_resume_after_stop_continues(tmp_path: Path) -> None:
    registry = X.Registry(tmp_path)
    config = _config(train={"epochs": 3})
    record = registry.create(config)
    registry.set_status(record.run_id, "stopped", "interrupted by test")
    lines: list[str] = []
    resumed = X.resume(registry, record.run_id, lines.append)
    assert resumed.status == "finished"
    assert not any(line.startswith("resumed") for line in lines)


def test_seed_sweep_and_compare(tmp_path: Path) -> None:
    registry = X.Registry(tmp_path)
    runs = X.seed_sweep(registry, _config(), [1, 2, 3])
    assert [r.seed for r in runs] == [1, 2, 3]
    assert len({r.sweep_id for r in runs}) == 1
    assert len(registry.list_runs(sweep_id=runs[0].sweep_id)) == 3
    rows = X.compare(runs, ["val_loss"])
    assert [set(row) for row in rows][0] == {"run_id", "name", "seed", "status", "val_loss"}
    diffs = X.config_differences(runs)
    assert set(diffs) == {"data.seed", "train.seed"}
    text = P.compare_report(runs)
    assert "## Spread across runs" in text and "| val_loss |" in text
    assert "data.seed" in text


def test_metrics_reader_skips_torn_lines(tmp_path: Path) -> None:
    path = tmp_path / "m.jsonl"
    path.write_text('{"kind": "step", "step": 1, "loss": 2.0}\n'
                    '{"kind": "epoch", "step": 1, "epoch": 0, "val_loss": 1.5}\n'
                    '{"kind": "step", "st')
    records = X.read_metrics(path)
    assert len(records) == 2
    summary = X.summarise(records)
    assert summary == {"final_loss": 2.0, "steps": 1.0, "val_loss": 1.5, "best_val_loss": 1.5}
    assert X.read_metrics(tmp_path / "none.jsonl") == []


def test_run_report_contents(tmp_path: Path) -> None:
    registry = X.Registry(tmp_path)
    record = X.run(registry, _config())
    text = P.run_report(record)
    for part in ("# Run ", "## Final metrics", "## Training loss", "## Epochs",
                 "## Checkpoints", "LicenseRef-Synthetic-In-Code"):
        assert part in text
    out = P.write(tmp_path / "r.md", text)
    assert out.read_text() == text
    same = P.compare_report([record, record])
    assert "All configs are identical." in same


def test_report_helpers() -> None:
    assert P.table([]) == "_no rows_\n"
    assert "| a | b |" in P.table([{"a": 1, "b": None}])
    assert "| 1 | - |" in P.table([{"a": 1, "b": None}])
    assert "nan" in P.table([{"a": float("nan")}])
    line = P.curve([3.0, 2.0, 1.0, float("inf")])
    assert line[0] == "@" and line[2] == " " and line[3] == "!"
    assert len(P.curve(list(np.linspace(0, 1, 500)), width=50)) == 50
    assert P.curve([float("nan")]) == ""


@pytest.mark.parametrize(
    "sections",
    [
        {"data": {"task": "denoise", "samples": 12, "batch_size": 4, "image_size": 8,
                  "augment": ["flip", "noise"]},
         "model": {"kind": "encoder_decoder", "width": 2, "latent": 2, "residual": True}},
        {"data": {"task": "shapes", "samples": 12, "batch_size": 4, "image_size": 8},
         "model": {"kind": "classifier", "width": 2, "latent": 2, "dropout": 0.1}},
    ],
)
def test_image_recipes_train(tmp_path: Path, sections: dict[str, Any]) -> None:
    config = _config(**sections, optim={"ema_decay": 0.9, "grad_accum": 2},
                     schedule={"name": "cosine", "warmup_steps": 1},
                     train={"early_stopping_patience": 5, "dtype": "float64"})
    built = R.build(config, tmp_path)
    state = built.trainer.fit()
    assert state.step == 4
    metrics = X.summarise(X.read_metrics(tmp_path / "metrics.jsonl"))
    key = "val_psnr" if config.data.task == "denoise" else "val_accuracy"
    assert key in metrics
    assert built.model.parameters()[0].dtype == np.float64


def test_recipe_with_lora_trains_only_adapters(tmp_path: Path) -> None:
    config = _config(lora={"enabled": True, "rank": 2, "alpha": 4.0})
    built = R.build(config, tmp_path)
    assert all(name.endswith(("lora_A", "lora_B"))
               for name, p in built.model.named_parameters() if p.requires_grad)
    assert built.trainer.optimizer.params == built.model.trainable_parameters()
    built.trainer.fit()


def test_total_steps_respects_accumulation_and_max_steps() -> None:
    config = _config(optim={"grad_accum": 2}, train={"epochs": 3, "max_steps": 4})
    train, _ = R.build_loaders(config)
    assert len(train) == 4
    assert R.total_steps(config, train) == 4
    assert R.total_steps(_config(optim={"grad_accum": 3}), train) == 4
