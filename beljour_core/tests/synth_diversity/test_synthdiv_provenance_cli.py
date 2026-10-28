"""Read-only provenance CLI: verify and count, with no training export command.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_cli import build_parser, main
from lab.synth_diversity.stress_provenance_fixtures import fixture_records
from lab.synth_diversity.stress_provenance_ledger import RECORDS_NAME, write_shard


def ledger(root: Path) -> Path:
    for name in ("own_render", "sfhq", "research_test"):
        write_shard(root, f"{name}-1", [r for r in fixture_records() if r.pool == name])
    return root


def test_verify_lists_every_shard(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["verify", "--root", str(ledger(tmp_path))]) == 0
    data = json.loads(capsys.readouterr().out)
    assert [shard["pool"] for shard in data["shards"]] == ["own_render", "research_test", "sfhq"]


def test_count_reports_observed_totals_without_approvals(
        tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["count", "--root", str(ledger(tmp_path))]) == 0
    data = json.loads(capsys.readouterr().out)
    assert data["observed_total"] == 7 and data["approvals"] == "NOT_SUPPLIED"
    assert data["by_disposition"]["TRAIN_ELIGIBLE"] == 0


def test_tampered_shard_exits_two(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    root = ledger(tmp_path)
    rows = root / "sfhq" / "sfhq-1" / RECORDS_NAME
    rows.write_bytes(rows.read_bytes() + b"\n")
    assert main(["verify", "--root", str(root)]) == 2
    assert "provenance error" in capsys.readouterr().err


def test_empty_root_exits_two(tmp_path: Path) -> None:
    assert main(["count", "--root", str(tmp_path)]) == 2


def test_no_training_export_command_exists() -> None:
    with pytest.raises(SystemExit):
        build_parser().parse_args(["export", "--root", "/tmp"])
