"""Local operator commands return aggregates only and fail with constant codes.

Author: John Khan.
"""

from __future__ import annotations

import json
import os
from dataclasses import asdict
from pathlib import Path
from typing import Any

import pytest

from .operator import OperatorFailure, execute, main, read_plan
from .test_support import DrawnCorpus, make_corpus


@pytest.fixture
def corpus(tmp_path: Path) -> DrawnCorpus:
    return make_corpus(tmp_path / "corpus")


def _plan_file(corpus: DrawnCorpus, tmp_path: Path, **changes: object) -> Path:
    path = tmp_path / "training-plan.json"
    path.write_text(json.dumps({**asdict(corpus.plan), **changes}))
    return path


def _run(corpus: DrawnCorpus, tmp_path: Path, action: str, *extra: str) -> dict[str, Any]:
    return execute([
        action, "--approved", str(corpus.approved), "--images", str(corpus.photos),
        "--plan", str(_plan_file(corpus, tmp_path)), *extra,
    ])


def _private_values(corpus: DrawnCorpus, tmp_path: Path) -> list[str]:
    values = [str(tmp_path)]
    for row in corpus.records:
        values.extend((row["subject_key"], row["sha256"], row["image"]))
    return values


def test_audit_coverage_and_shards_return_counts_only(corpus: DrawnCorpus, tmp_path: Path) -> None:
    audit = _run(corpus, tmp_path, "audit")
    assert audit["train_count"] == 32 and audit["eval_count"] == 16
    coverage = _run(corpus, tmp_path, "coverage", "--minimum", "1")
    assert coverage["status"] == "COVERAGE_MET"
    shards = _run(corpus, tmp_path, "shards", "--count", "4")
    assert sum(shards["train_counts"]) == 32
    text = json.dumps([audit, coverage, shards])
    assert not any(value in text for value in _private_values(corpus, tmp_path))


def test_run_resume_and_score_against_baseline(corpus: DrawnCorpus, tmp_path: Path) -> None:
    checkpoints = str(tmp_path / "checkpoints")
    first = _run(corpus, tmp_path, "run", "--checkpoint-dir", checkpoints, "--steps", "2")
    final = _run(corpus, tmp_path, "run", "--checkpoint-dir", checkpoints, "--resume")
    assert (first["steps"], final["steps"]) == (2, 4)
    before, after = tmp_path / "before.json", tmp_path / "after.json"
    before.write_text(json.dumps(first["heldout_before"]["sources"]))
    after.write_text(json.dumps(final["heldout_after"]["sources"]))
    scored = _run(corpus, tmp_path, "score", "--scores", str(after), "--baseline", str(before))
    assert scored["overall"]["count"] == 16
    assert scored["comparison"]["status"] in ("IMPROVED", "MIXED")
    assert scored["comparison"]["overall_mse_delta"] < 0
    text = json.dumps([first, final, scored])
    assert not any(value in text for value in _private_values(corpus, tmp_path))


def test_run_rejects_nonpositive_step_counts(corpus: DrawnCorpus, tmp_path: Path) -> None:
    with pytest.raises(OperatorFailure, match="invalid_run_length"):
        _run(corpus, tmp_path, "run", "--checkpoint-dir", str(tmp_path / "ck"), "--steps", "0")


@pytest.mark.parametrize("changes", [
    {"steps": True}, {"steps": 4.0}, {"learning_rate": "0.1"}, {"image_size": 33},
    {"holdout_fraction": 0.95}, {"unexpected": 1},
])
def test_plan_file_is_exact_and_typed(corpus: DrawnCorpus, tmp_path: Path, changes: dict[str, object]) -> None:
    with pytest.raises(OperatorFailure, match="invalid_training_plan"):
        read_plan(_plan_file(corpus, tmp_path, **changes))


def test_oversized_or_linked_plan_is_refused(corpus: DrawnCorpus, tmp_path: Path) -> None:
    large = tmp_path / "large.json"
    large.write_text(" " * 9000 + json.dumps(asdict(corpus.plan)))
    with pytest.raises(OperatorFailure, match="invalid_operator_input"):
        read_plan(large)
    if os.name != "nt":
        linked = tmp_path / "linked.json"
        linked.symlink_to(_plan_file(corpus, tmp_path))
        with pytest.raises(OperatorFailure, match="invalid_operator_input"):
            read_plan(linked)


def test_main_hides_details_of_hostile_input(
    corpus: DrawnCorpus, tmp_path: Path, capsys: pytest.CaptureFixture[str],
) -> None:
    train_file = corpus.approved / "train.jsonl"
    train_file.write_bytes(train_file.read_bytes() + b'{"path": "' + str(tmp_path).encode() + b'"}\n')
    code = main([
        "audit", "--approved", str(corpus.approved), "--images", str(corpus.photos),
        "--plan", str(_plan_file(corpus, tmp_path)),
    ])
    printed = capsys.readouterr().out
    assert code == 2
    assert json.loads(printed) == {"status": "ERROR", "reason": "invalid_local_training_input"}


def test_main_prints_sorted_aggregate_json(
    corpus: DrawnCorpus, tmp_path: Path, capsys: pytest.CaptureFixture[str],
) -> None:
    code = main([
        "coverage", "--approved", str(corpus.approved), "--images", str(corpus.photos),
        "--plan", str(_plan_file(corpus, tmp_path)), "--minimum", "30",
    ])
    output = json.loads(capsys.readouterr().out)
    assert code == 0
    assert output["status"] == "COVERAGE_GAPS"
    assert output["minimum"] == 30
