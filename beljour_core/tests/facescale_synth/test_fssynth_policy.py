"""Tests for the test-only rule, output-folder guards and opaque source ids.

Everything runs on temporary folders; no images, no real faces.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.facescale_synth import policy
from lab.facescale_synth.sources import (
    SOURCES,
    SourceInfo,
    load_local_sources,
    source,
)


@pytest.mark.parametrize("use", ["train", "Training", "fine-tune", "pretrain-v2", "distill"])
def test_training_uses_are_refused(use: str) -> None:
    with pytest.raises(policy.UsageRefused, match="banned|not one of"):
        policy.require_use(use)


@pytest.mark.parametrize("use", ["demo", "video", "screenshot", "ship", "anything"])
def test_unknown_or_display_uses_are_refused(use: str) -> None:
    with pytest.raises(policy.UsageRefused):
        policy.require_use(use)


@pytest.mark.parametrize("use", ["test", "score", "benchmark", " Debug-Internal "])
def test_test_uses_pass(use: str) -> None:
    assert policy.require_use(use) == use.strip().lower()


def test_stamp_round_trip_and_tamper() -> None:
    header = policy.stamp()
    policy.check_stamp(header)
    for key in header:
        broken = dict(header)
        broken[key] = not broken[key] if isinstance(broken[key], bool) else "changed"
        with pytest.raises(policy.UsageRefused):
            policy.check_stamp(broken)


def test_open_manifest_checks_use_before_reading(tmp_path: Path) -> None:
    manifest = tmp_path / "manifest.jsonl"
    manifest.write_text(json.dumps(policy.stamp()) + "\n")
    assert policy.open_manifest_for(manifest, "test")["purpose"] == policy.PURPOSE
    with pytest.raises(policy.UsageRefused):
        policy.open_manifest_for(manifest, "train")
    missing = tmp_path / "missing.jsonl"
    with pytest.raises(policy.UsageRefused):
        policy.open_manifest_for(missing, "fine-tune")
    unstamped = tmp_path / "bare.jsonl"
    unstamped.write_text(json.dumps({"purpose": "test-only"}) + "\n")
    with pytest.raises(policy.UsageRefused):
        policy.open_manifest_for(unstamped, "test")


def test_output_inside_this_repository_is_refused() -> None:
    with pytest.raises(policy.UsageRefused, match="repository|git"):
        policy.safe_output_dir(policy.REPO_ROOT / "lab" / "out")


def test_output_inside_any_git_tree_is_refused(tmp_path: Path) -> None:
    (tmp_path / "other" / ".git").mkdir(parents=True)
    with pytest.raises(policy.UsageRefused, match="git"):
        policy.safe_output_dir(tmp_path / "other" / "deep" / "out", repo_root=None)


@pytest.mark.parametrize("part", ["public", "demo", "Devpost", "screenshots", "video"])
def test_output_in_display_areas_is_refused(tmp_path: Path, part: str) -> None:
    with pytest.raises(policy.UsageRefused, match="display"):
        policy.safe_output_dir(tmp_path / part / "set")


def test_plain_box_folder_is_accepted(tmp_path: Path) -> None:
    assert policy.safe_output_dir(tmp_path / "sets") == (tmp_path / "sets").resolve()


def test_every_source_is_test_only() -> None:
    assert set(SOURCES) == {"S05", "S20", "S21", "S22"}
    for info in SOURCES.values():
        assert info.test_only is True
        assert info.train_allowed is False
    assert source("S20").licence == "Own work, John Khan"
    assert "test-only" in source("S05").licence
    with pytest.raises(KeyError, match="known"):
        source("S99")


def test_trainable_source_is_a_hard_error() -> None:
    with pytest.raises(policy.UsageRefused):
        SourceInfo("S30", "x", "y", train_allowed=True)
    with pytest.raises(policy.UsageRefused):
        SourceInfo("S30", "x", "y", test_only=False)
    with pytest.raises(ValueError):
        SourceInfo("dataset", "x", "y")


def test_local_source_file_reads_ids_and_paths_only(tmp_path: Path) -> None:
    path = tmp_path / "sources.local.json"
    body = {
        "format": "beljour-sources-local/1",
        "sources": {"S05": {"local_path": "/box/s05", "note": "kept in the file only"}},
    }
    path.write_text(json.dumps(body))
    loaded = load_local_sources(path)
    assert list(loaded) == ["S05"]
    assert loaded["S05"].local_path == Path("/box/s05")
    assert "note" not in repr(loaded)


def test_local_source_file_rules(tmp_path: Path) -> None:
    path = tmp_path / "sources.local.json"
    path.write_text(json.dumps({"format": "other", "sources": {}}))
    with pytest.raises(ValueError, match="format"):
        load_local_sources(path)
    path.write_text(json.dumps({"format": "beljour-sources-local/1", "sources": {"S77": {}}}))
    with pytest.raises(KeyError):
        load_local_sources(path)
    tree = tmp_path / "repo"
    (tree / ".git").mkdir(parents=True)
    inside = tree / "sources.local.json"
    inside.write_text(json.dumps({"format": "beljour-sources-local/1", "sources": {}}))
    with pytest.raises(policy.UsageRefused):
        load_local_sources(inside)
