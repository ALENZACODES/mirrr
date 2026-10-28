"""Published allowlist: IDs only, canonical, digest-bound and never overwritten.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_stream_fixtures import build_world
from lab.synth_diversity.stress_provenance_stream_verify import StreamSummary, verify_and_export
from lab.synth_diversity.types import SyntheticInputError


def run(tmp_path: Path, out: Path) -> StreamSummary:
    world = build_world(tmp_path / "w")
    return verify_and_export(world.roster, world.ledger, world.stream, world.trust,
                             world.registry, world.now, out)


def test_lines_hold_record_ids_only(tmp_path: Path) -> None:
    run(tmp_path, tmp_path / "allow.jsonl")
    rows = [json.loads(line) for line in (tmp_path / "allow.jsonl").read_text().splitlines()]
    assert all(set(row) == {"record_id"} for row in rows)
    assert [row["record_id"] for row in rows] == ["own-0001", "own-0002", "own-0003"]


def test_summary_digest_matches_published_bytes(tmp_path: Path) -> None:
    summary = run(tmp_path, tmp_path / "allow.jsonl")
    data = (tmp_path / "allow.jsonl").read_bytes()
    assert summary.allowlist_sha256 == hashlib.sha256(data).hexdigest()
    assert data.endswith(b"\n") and b" " not in data


def test_existing_output_is_refused_before_any_work(tmp_path: Path) -> None:
    target = tmp_path / "allow.jsonl"
    target.write_text("previous")
    with pytest.raises(SyntheticInputError, match="already exists"):
        run(tmp_path, target)
    assert target.read_text() == "previous"


def test_output_inside_repository_is_refused(tmp_path: Path) -> None:
    inside = Path(__file__).resolve().parent / "allow-should-not-exist.jsonl"
    with pytest.raises(SyntheticInputError, match="repo"):
        run(tmp_path, inside)
    assert not inside.exists()


def test_summary_marks_loader_recheck(tmp_path: Path) -> None:
    data = run(tmp_path, tmp_path / "allow.jsonl").to_dict()
    assert data["loader_must_recheck"] is True and data["contains_image_data"] is False
