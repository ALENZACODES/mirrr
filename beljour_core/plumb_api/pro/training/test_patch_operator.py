"""Operator run-patches and score-patches commands on drawn images. Author: John Khan."""

from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path

import pytest

from .operator import OperatorFailure, execute, main, read_patch_plan
from .patches import PatchPlan
from .test_support import DrawnCorpus, make_corpus


@pytest.fixture
def files(tmp_path: Path) -> tuple[DrawnCorpus, Path, Path]:
    corpus = make_corpus(tmp_path / "corpus", size=18)
    plan = tmp_path / "plan.json"
    plan.write_text(json.dumps(asdict(corpus.plan)))
    patch = tmp_path / "patch.json"
    patch.write_text(json.dumps(asdict(PatchPlan())))
    return corpus, plan, patch


def _common(corpus: DrawnCorpus, plan: Path, patch: Path, folder: Path) -> list[str]:
    return [
        "--approved", str(corpus.approved), "--images", str(corpus.photos),
        "--plan", str(plan), "--patch-plan", str(patch), "--checkpoint-dir", str(folder),
    ]


def test_run_resume_and_score_through_the_operator(
    files: tuple[DrawnCorpus, Path, Path], tmp_path: Path,
) -> None:
    corpus, plan, patch = files
    folder = tmp_path / "checkpoints"
    first = execute(["run-patches", *_common(corpus, plan, patch, folder), "--steps", "2"])
    assert first["steps"] == 2
    second = execute(["run-patches", *_common(corpus, plan, patch, folder), "--resume"])
    assert second["steps"] == corpus.plan.steps
    scored = execute(["score-patches", *_common(corpus, plan, patch, folder)])
    assert scored["evaluation"] == second["after"]
    assert scored["release_gate"] == "NOT_RUN"


def test_operator_memory_budget_bounds(files: tuple[DrawnCorpus, Path, Path], tmp_path: Path) -> None:
    corpus, plan, patch = files
    for value in ("0", "262145"):
        with pytest.raises(OperatorFailure, match="memory"):
            execute(["run-patches", *_common(corpus, plan, patch, tmp_path / "c"),
                     "--memory-mib", value])


def test_main_prints_only_a_constant_error(
    files: tuple[DrawnCorpus, Path, Path], tmp_path: Path, capsys: pytest.CaptureFixture[str],
) -> None:
    corpus, plan, patch = files
    inside = corpus.approved / "checkpoints"
    assert main(["run-patches", *_common(corpus, plan, patch, inside)]) == 2
    output = capsys.readouterr().out
    assert json.loads(output) == {"status": "ERROR", "reason": "invalid_local_training_input"}
    assert str(corpus.root) not in output


def test_main_prints_aggregates_on_success(
    files: tuple[DrawnCorpus, Path, Path], tmp_path: Path, capsys: pytest.CaptureFixture[str],
) -> None:
    corpus, plan, patch = files
    assert main(["run-patches", *_common(corpus, plan, patch, tmp_path / "ok"), "--steps", "1"]) == 0
    printed = json.loads(capsys.readouterr().out)
    assert printed["steps"] == 1
    assert all(record["sha256"] not in json.dumps(printed) for record in corpus.records)


@pytest.mark.parametrize("change", [
    {"hidden_dim": True}, {"patch_edge": 4.0}, {"masked_fraction": "0.5"},
    {"masked_fraction": 0.99}, {"extra": 1},
])
def test_patch_plan_files_are_strict(tmp_path: Path, change: dict[str, object]) -> None:
    path = tmp_path / "patch.json"
    path.write_text(json.dumps({**asdict(PatchPlan()), **change}))
    with pytest.raises(OperatorFailure, match="patch_plan"):
        read_patch_plan(path)


def test_patch_plan_file_round_trip(tmp_path: Path) -> None:
    path = tmp_path / "patch.json"
    wanted = PatchPlan(hidden_dim=16, masked_fraction=0.4)
    path.write_text(json.dumps(asdict(wanted)))
    assert read_patch_plan(path) == wanted
