"""Exported-image checks and manifest diffs on a published demo set.

Author: John Khan.
"""

from __future__ import annotations

import io
from dataclasses import replace
from pathlib import Path

import pytest

from plumb_api.data_factory.cli import EXIT_FAILED, EXIT_OK, main
from plumb_api.data_factory.config import load_config
from plumb_api.data_factory.demo_set import write_demo_set
from plumb_api.data_factory.integrity import diff_manifests, export_target, verify_exports
from plumb_api.data_factory.manifest import read_manifest, write_manifest
from plumb_api.data_factory.pipeline import run_pipeline
from plumb_api.data_factory.takedown import TakedownRequest, apply_takedown


@pytest.fixture()
def lock_path(tmp_path: Path) -> Path:
    demo = write_demo_set(tmp_path / "set", distinct=5, size=200)
    result = run_pipeline(load_config(demo.config_path))
    assert result.lock_path is not None
    return result.lock_path


def first_export(lock_path: Path) -> Path:
    rows, _ = read_manifest(lock_path.parent / "demo-set.manifest.jsonl")
    target = export_target(lock_path.parent, rows[0].record.path)
    assert target is not None
    return target


def test_fresh_exports_verify(lock_path: Path) -> None:
    assert verify_exports(lock_path) == []
    out = io.StringIO()
    assert main(["verify", "--lock", str(lock_path), "--images"], out) == EXIT_OK
    assert out.getvalue() == "lock and images ok\n"


def test_changed_missing_and_extra_files(lock_path: Path) -> None:
    target = first_export(lock_path)
    target.write_bytes(b"changed")
    assert any("exported image changed" in p for p in verify_exports(lock_path))
    target.unlink()
    assert any("exported image missing" in p for p in verify_exports(lock_path))
    extra = lock_path.parent / "images" / "00" / "extra.png"
    extra.parent.mkdir(parents=True, exist_ok=True)
    extra.write_bytes(b"x")
    assert "unlisted file in images: images/00/extra.png" in verify_exports(lock_path)
    out = io.StringIO()
    assert main(["verify", "--lock", str(lock_path), "--images"], out) == EXIT_FAILED


def test_export_target_rules(tmp_path: Path) -> None:
    assert export_target(tmp_path, None) is None
    assert export_target(tmp_path, "/abs/images/a.png") is None
    assert export_target(tmp_path, "images/../a.png") is None
    assert export_target(tmp_path, "other/a.png") is None
    assert export_target(tmp_path, "images/ab/a.png") == tmp_path / "images/ab/a.png"


def test_rows_outside_images_are_reported(tmp_path: Path, lock_path: Path) -> None:
    rows, _ = read_manifest(lock_path.parent / "demo-set.manifest.jsonl")
    moved = [(replace(r.record, path="elsewhere/x.png"), r.annotations) for r in rows[:1]]
    other = tmp_path / "other.jsonl"
    write_manifest(other, moved, shards=4)
    diff = diff_manifests(lock_path.parent / "demo-set.manifest.jsonl", other)
    assert diff.changed == [rows[0].record.content_sha256]
    assert len(diff.removed) == len(rows) - 1 and diff.added == []


def test_diff_after_takedown(lock_path: Path, tmp_path: Path) -> None:
    manifest = lock_path.parent / "demo-set.manifest.jsonl"
    before = tmp_path / "before.jsonl"
    before.write_bytes(manifest.read_bytes())
    rows, _ = read_manifest(manifest)
    apply_takedown(lock_path, [TakedownRequest(rows[1].record.content_sha256,
                                               "consent-withdrawn", "2026-10-25")])
    diff = diff_manifests(before, manifest)
    assert diff.removed == [rows[1].record.content_sha256]
    assert diff.added == [] and diff.changed == [] and not diff.same
    assert diff.to_dict()["removed_count"] == 1
    assert diff_manifests(manifest, manifest).same
    assert verify_exports(lock_path) == []
    out = io.StringIO()
    assert main(["diff", "--before", str(before), "--after", str(manifest)], out) == EXIT_OK
    assert out.getvalue().splitlines() == ["added 0, removed 1, changed 0",
                                           f"- {rows[1].record.content_sha256}"]
