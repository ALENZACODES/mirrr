"""Set versioning on tiny synthetic sets in tmp_path (DSN-01, SPL-02, SPL-03).

Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.bqa_core import sets as sts


def build_sets(root: Path) -> Path:
    for kind in sts.KINDS:
        sts.write_version(root, kind, "v1", {"case_001.npz": b"one", "case_002.npz": b"two"},
                          frozen=kind == "gold", changelog="+ case_001.npz\n+ case_002.npz")
    return root


def test_good_layout_has_no_problems(tmp_path: Path) -> None:
    """DSN-01, SPL-02, SPL-03: four versioned sets, matching changelogs, intact freeze."""
    root = build_sets(tmp_path / "sets")
    assert sts.layout_problems(root) == []
    assert sts.changelog_problems(root) == []
    assert sts.freeze_problems(root) == []
    assert sts.dataset_versions(root)["gold"] == "GOLD-v1"


def test_missing_set_and_bad_manifest(tmp_path: Path) -> None:
    root = build_sets(tmp_path / "sets")
    (root / "fresh" / "v1" / "manifest.json").unlink()
    (root / "silver" / "v1" / "manifest.json").write_text(json.dumps(
        {"format": sts.SET_FORMAT, "set": "gold", "version": "v1", "files": {}}))
    found = sts.layout_problems(root)
    assert "fresh/v1: manifest.json missing" in found
    assert "silver/v1: manifest format, set or version is wrong" in found
    assert sts.layout_problems(tmp_path / "empty") == [
        f"{kind}: no versioned folder with a manifest" for kind in sts.KINDS]


def test_change_after_freeze_needs_new_version_and_rerun(tmp_path: Path) -> None:
    """SPL-03: editing a frozen version fails; a new version needs a re-run marker."""
    root = build_sets(tmp_path / "sets")
    (root / "gold" / "v1" / "case_001.npz").write_bytes(b"edited")
    assert sts.freeze_problems(root) == ["gold/v1: 1 file(s) changed after freeze"]
    (root / "gold" / "v1" / "case_001.npz").write_bytes(b"one")
    sts.write_version(root, "gold", "v2", {"case_001.npz": b"one", "case_003.npz": b"3"},
                      changelog="- case_002.npz\n+ case_003.npz")
    assert sts.freeze_problems(root) == ["gold/v2: post-freeze version without a re-run marker"]
    sts.write_version(root, "gold", "v3", {"case_001.npz": b"one", "case_003.npz": b"3"},
                      changelog="", rerun_run_id="R-0042")
    assert "gold/v3: post-freeze version without a re-run marker" not in sts.freeze_problems(root)
    assert sts.changelog_problems(root) == ["gold/v3: not in the changelog"]


def test_changelog_mismatch_and_unfrozen_drift(tmp_path: Path) -> None:
    """SPL-02: changelog and manifest must agree; unfrozen drift is reported too."""
    root = build_sets(tmp_path / "sets")
    (root / "silver" / "CHANGELOG.md").write_text("## v1\n+ case_001.npz\n")
    (root / "challenge" / "CHANGELOG.md").unlink()
    (root / "fresh" / "v1" / "extra.npz").write_bytes(b"x")
    assert sts.changelog_problems(root) == ["silver/v1: changelog and manifest disagree",
                                            "challenge: CHANGELOG.md missing"]
    assert "fresh/v1: 1 file(s) differs from manifest" in sts.layout_problems(root)
    assert sts.changelog_versions("## v1\n+ a\n+ b\n## v2\n- a\n") == {"v1": {"a", "b"},
                                                                      "v2": {"b"}}


def test_versions_are_never_overwritten(tmp_path: Path) -> None:
    root = build_sets(tmp_path / "sets")
    with pytest.raises(FileExistsError):
        sts.write_version(root, "gold", "v1", {})
    with pytest.raises(ValueError):
        sts.write_version(root, "bronze", "v1", {})
