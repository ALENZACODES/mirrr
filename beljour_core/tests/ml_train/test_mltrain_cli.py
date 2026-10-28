"""Command line interface, including a real kill-and-resume in a subprocess.

The kill test starts `python -m lab.ml.train run` in a child process, waits for
a checkpoint line, kills the child with SIGKILL, resumes the run in a second
child and checks the final weights equal those of an uninterrupted run.
Author: John Khan.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

import numpy as np
import pytest

from lab.ml.train import checkpoint as CK
from lab.ml.train import config as C
from lab.ml.train import experiments as X
from lab.ml.train.cli import main

REPO = Path(__file__).resolve().parents[3]
TINY = ["--set", "data.samples=40", "--set", "data.batch_size=8", "--set", "data.features=3",
        "--set", "train.epochs=2", "--set", "train.checkpoint_every=2"]


def _env() -> dict[str, str]:
    env = dict(os.environ)
    env["PYTHONPATH"] = str(REPO) + os.pathsep + env.get("PYTHONPATH", "")
    return env


def test_run_list_compare_report(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    root = ["--root", str(tmp_path)]
    assert main([*root, "run", *TINY]) == 0
    assert main([*root, "run", *TINY, "--set", "train.seed=5"]) == 0
    out = capsys.readouterr().out
    assert "finished: completed 2 epochs" in out
    ids = [r.run_id for r in X.Registry(tmp_path).list_runs()]
    assert main([*root, "list", "--status", "finished"]) == 0
    listing = capsys.readouterr().out
    assert all(run_id in listing for run_id in ids)
    assert main([*root, "compare", *ids, "--metric", "val_loss"]) == 0
    assert "| val_loss |" in capsys.readouterr().out
    report = tmp_path / "report.md"
    assert main([*root, "report", ids[0], "--out", str(report)]) == 0
    assert report.read_text().startswith(f"# Run {ids[0]}")
    assert main([*root, "report", *ids]) == 0
    assert "# Run comparison" in capsys.readouterr().out


def test_print_config_and_toml(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    example = REPO / "lab/ml/train/example.toml"
    assert main(["--root", str(tmp_path), "run", "--config", str(example), "--print-config",
                 "--set", "train.epochs=1"]) == 0
    out = capsys.readouterr().out
    body, hash_line = out.rsplit("config hash ", 1)
    resolved = C.from_dict(json.loads(body))
    assert resolved.name == "denoise-example" and resolved.train.epochs == 1
    assert hash_line.strip() == C.config_hash(resolved)
    assert not (tmp_path / "registry.sqlite").exists()


def test_errors_exit_with_code_two(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    root = ["--root", str(tmp_path)]
    assert main([*root, "run", "--set", "optim.lr=-1"]) == 2
    assert "optim.lr: must be positive" in capsys.readouterr().err
    assert main([*root, "resume", "nope"]) == 2
    assert "no unique run" in capsys.readouterr().err


def test_sweep_command(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["--root", str(tmp_path), "sweep", *TINY, "--seeds", "1", "2"]) == 0
    out = capsys.readouterr().out
    assert "## Spread across runs" in out
    assert len(X.Registry(tmp_path).list_runs()) == 2


KILL_CONFIG = ["--set", "name=kill-test", "--set", "model.kind=encoder_decoder",
               "--set", "data.task=denoise", "--set", "data.samples=40",
               "--set", "data.batch_size=8", "--set", "data.image_size=16",
               "--set", 'data.augment=["flip"]', "--set", "train.epochs=40",
               "--set", "train.checkpoint_every=10", "--set", "train.keep_last=2",
               "--set", "optim.name=adamw", "--set", "optim.lr=0.01",
               "--set", "optim.ema_decay=0.9", "--set", "optim.grad_accum=2",
               "--set", "schedule.name=cosine", "--set", "schedule.warmup_steps=5"]


def _final_weights(run_dir: Path) -> dict[str, np.ndarray]:
    latest = CK.latest(run_dir / "checkpoints")
    assert latest is not None
    loaded = CK.load(latest)
    return {**loaded.section("model"), **{f"ema:{k}": v for k, v in loaded.section("ema").items()}}


def test_killed_subprocess_resumes_to_identical_weights(tmp_path: Path) -> None:
    killed_root = tmp_path / "killed"
    command = [sys.executable, "-m", "lab.ml.train", "--root", str(killed_root), "run",
               *KILL_CONFIG]
    child = subprocess.Popen(command, cwd=REPO, env=_env(), stdout=subprocess.PIPE,
                             stderr=subprocess.STDOUT, text=True)
    assert child.stdout is not None
    seen = []
    try:
        for line in child.stdout:
            seen.append(line.strip())
            if line.startswith("checkpoint step=20 "):
                child.kill()
                break
    finally:
        child.kill()
        child.wait(timeout=30)
    assert child.returncode != 0, "child finished before it could be killed:\n" + "\n".join(seen)
    registry = X.Registry(killed_root)
    (record,) = registry.list_runs()
    assert record.status == "running"
    latest = CK.latest(record.run_dir / "checkpoints")
    assert latest is not None
    killed_at = CK.load(latest).step
    assert 20 <= killed_at < 80

    resumed = subprocess.run(
        [sys.executable, "-m", "lab.ml.train", "--root", str(killed_root), "resume",
         record.run_id],
        cwd=REPO, env=_env(), capture_output=True, text=True, timeout=120, check=False)
    assert resumed.returncode == 0, resumed.stdout + resumed.stderr
    assert f"resumed at step {killed_at}" in resumed.stdout
    assert registry.get(record.run_id).status == "finished"

    straight_root = tmp_path / "straight"
    assert main(["--root", str(straight_root), "run", *KILL_CONFIG]) == 0
    (straight,) = X.Registry(straight_root).list_runs()
    a = _final_weights(straight.run_dir)
    b = _final_weights(record.run_dir)
    assert set(a) == set(b) and any(k.startswith("ema:") for k in a)
    for key in a:
        np.testing.assert_array_equal(a[key], b[key], err_msg=key)
    assert CK.load(CK.latest(straight.run_dir / "checkpoints")).step == 80  # type: ignore[arg-type]


def test_card_lr_find_search_and_profile_commands(tmp_path: Path,
                                                  capsys: pytest.CaptureFixture[str]) -> None:
    root = ["--root", str(tmp_path)]
    assert main([*root, "run", *TINY]) == 0
    (record,) = X.Registry(tmp_path).list_runs()
    assert main([*root, "card", record.run_id, "--use", "Unit test card."]) == 0
    card = (record.run_dir / "MODEL_CARD.md").read_text()
    assert "Unit test card." in card and "Author: John Khan" in card
    capsys.readouterr()
    assert main([*root, "lr-find", *TINY, "--steps", "12", "--end", "10"]) == 0
    assert "suggested lr" in capsys.readouterr().out
    assert main([*root, "search", *TINY, "--dim", "optim.lr=0.001,0.02"]) == 0
    out = capsys.readouterr().out
    assert "| optim.lr |" in out and "best run " in out
    assert main([*root, "search", *TINY, "--dim", "optim.lr=log:0.001:0.1",
                 "--trials", "2", "--seed", "4"]) == 0
    assert len(X.Registry(tmp_path).list_runs()) == 5
    capsys.readouterr()
    assert main([*root, "profile", *TINY, "--steps", "2"]) == 0
    assert "| matmul |" in capsys.readouterr().out
    assert main([*root, "search", *TINY, "--dim", "optim.lr=log:1"]) == 2
