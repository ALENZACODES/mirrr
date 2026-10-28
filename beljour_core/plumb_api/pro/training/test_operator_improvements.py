"""r35e operator commands: certificate, gate-score, resume-shard and index-shards.

Author: John Khan.
"""

from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path

import pytest

from .operator import execute, main
from .patches import PatchPlan
from .test_support import DrawnCorpus, make_corpus


@pytest.fixture
def setup(tmp_path: Path) -> tuple[DrawnCorpus, list[str], Path]:
    corpus = make_corpus(tmp_path / "corpus", size=18)
    plan = tmp_path / "plan.json"
    plan.write_text(json.dumps(asdict(corpus.plan)))
    common = ["--approved", str(corpus.approved), "--images", str(corpus.photos), "--plan", str(plan)]
    return corpus, common, tmp_path


def test_certificate_command_exports_once(setup: tuple[DrawnCorpus, list[str], Path]) -> None:
    corpus, common, root = setup
    output = root / "certificate.json"
    result = execute(["certificate", *common, "--output", str(output)])
    assert result["approved_train"] + result["approved_eval"] == 18
    assert json.loads(output.read_text()) == result
    assert main(["certificate", *common, "--output", str(output)]) == 2


def test_gate_score_command_reports_untested(setup: tuple[DrawnCorpus, list[str], Path]) -> None:
    corpus, common, root = setup
    patch = root / "patch.json"
    patch.write_text(json.dumps(asdict(PatchPlan())))
    folder = root / "checkpoints"
    execute(["run-patches", *common, "--patch-plan", str(patch), "--checkpoint-dir", str(folder),
             "--steps", "1"])
    result = execute(["gate-score", *common, "--patch-plan", str(patch),
                      "--checkpoint-dir", str(folder)])
    assert result["gate"]["status"] == "UNTESTED"
    assert result["release_gate"] == "NOT_RUN"


def test_resume_shard_continues_across_invocations(setup: tuple[DrawnCorpus, list[str], Path]) -> None:
    corpus, common, root = setup
    cursor = root / "cursor.json"
    arguments = ["resume-shard", *common, "--cursor", str(cursor), "--shard", "0",
                 "--shard-count", "1", "--batch", "5"]
    progress = [execute(arguments)["yielded"] for _ in range(4)]
    assert progress == [5, 10, 12, 12]
    final = execute(arguments)
    assert final["complete"] is True
    assert final["batches"] == 3
    text = cursor.read_text()
    assert all(record["sha256"] not in text for record in corpus.records)


def test_resume_shard_refuses_a_cursor_for_another_shard(
    setup: tuple[DrawnCorpus, list[str], Path],
) -> None:
    _, common, root = setup
    cursor = root / "cursor.json"
    execute(["resume-shard", *common, "--cursor", str(cursor), "--shard", "0", "--shard-count", "2"])
    assert main(["resume-shard", *common, "--cursor", str(cursor), "--shard", "1",
                 "--shard-count", "2"]) == 2


def test_index_shards_command(setup: tuple[DrawnCorpus, list[str], Path]) -> None:
    corpus, common, root = setup
    result = execute(["index-shards", *common, "--index-dir", str(root / "index"), "--count", "3"])
    assert result["rows"] == {"train": 12, "eval": 6}
    assert result["contents"] == "NUMERIC_OFFSETS_ONLY"
    inside = corpus.approved / "index"
    assert main(["index-shards", *common, "--index-dir", str(inside)]) == 2


def test_errors_print_no_paths(
    setup: tuple[DrawnCorpus, list[str], Path], capsys: pytest.CaptureFixture[str],
) -> None:
    corpus, common, root = setup
    assert main(["resume-shard", *common, "--cursor", str(root / "c.json"), "--shard", "9",
                 "--shard-count", "2"]) == 2
    output = capsys.readouterr().out
    assert str(root) not in output
    assert json.loads(output)["reason"] == "invalid_local_training_input"
