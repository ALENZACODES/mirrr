"""Synthetic external-face inventories; not a single real or downloaded face.
Author: John Khan.
"""
from __future__ import annotations

import csv
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from plumb_api.arena import freeze, lock_existing

REALFACE = Path(__file__).resolve().parents[2] / "tests" / "realface"
if str(REALFACE) not in sys.path:
    sys.path.insert(0, str(REALFACE))
import lock_contract  # noqa: E402
import realface_lib  # noqa: E402


def _csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)


def _fixture(root: Path, kind: str) -> Path:
    """Mirror the two on-disk manifest shapes, not their confidential images."""
    folder = root / kind
    names = ["fairface-ccby4/cell/a.png", "sfhq/released/b.png", "adversarial/source/c.png"]
    items: list[dict[str, str]] = []
    for i, name in enumerate(names):
        path = folder / name
        path.parent.mkdir(parents=True, exist_ok=True)
        arr = np.full((12 + i, 16, 3), 48 + i * 60, dtype=np.uint8)
        Image.fromarray(arr).save(path)
        items.append({"path": name, "file": path.name, "source": ("fairface", "sfhq", "adversarial")[i],
                      "licence": "MIT", "gender": "Female", "age_band": "30-39",
                      "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
        if i < 2:
            _csv(path.parent / "manifest.csv", [{k: items[-1][k] for k in ("file", "source", "licence", "gender", "age_band", "sha256")}])
    (folder / "HASHES.sha256").write_text("".join(f"{item['sha256']}  {item['path']}\n" for item in items))
    if kind == "frozen-10000":
        # R15 reported layout includes a root uppercase manifest; freeze must
        # leave its source provenance unchanged and create lowercase arena CSV.
        _csv(folder / "MANIFEST.csv", items)
        (folder / "_build").mkdir()
        (folder / "_build" / "debug.json").write_text('{"not_face":true}')
        (folder / "sfhq" / "segmentations").mkdir()
    return folder


@pytest.mark.parametrize("kind", ["frozen-1000", "frozen-10000"])
def test_seals_both_original_layouts_and_existing_verifier_accepts(tmp_path: Path, kind: str) -> None:
    root = tmp_path / "test-faces"
    folder = _fixture(root, kind)
    uppercase = (folder / "MANIFEST.csv").read_bytes() if kind.endswith("10000") else None
    before = {p.relative_to(folder): p.read_bytes() for p in folder.rglob("*.png")}
    lock = lock_existing.lock_existing(folder)
    assert lock["format"] == "beljour-frozen-lock/1"
    assert lock["total"] == len(before)
    assert not freeze.verify_directory(folder)
    assert {p.relative_to(folder): p.read_bytes() for p in folder.rglob("*.png")} == before
    if uppercase is not None:
        assert (folder / "MANIFEST.csv").read_bytes() == uppercase
    observed = realface_lib.discover(root, (kind,))
    assert len(observed) == len(before)
    assert kind in lock_contract.verify(root, (kind,), observed)
    assert len(json.loads((folder / "frozen.lock").read_text())["faces"]) == len(before)


@pytest.mark.parametrize("kind", ["frozen-1000", "frozen-10000"])
def test_rejects_changed_bytes_before_any_lock(tmp_path: Path, kind: str) -> None:
    folder = _fixture(tmp_path, kind)
    with (folder / "sfhq/released/b.png").open("ab") as stream:
        stream.write(b"changed image")
    with pytest.raises(freeze.FreezeError, match="mismatch"):
        lock_existing.lock_existing(folder)
    assert not (folder / "frozen.lock").exists()
    assert not (folder / "manifest.csv").exists()


def test_rejects_unlisted_image_instead_of_silently_expanding(tmp_path: Path) -> None:
    folder = _fixture(tmp_path, "frozen-1000")
    (folder / "sfhq/released/new.png").write_bytes(b"an unexpected photo")
    with pytest.raises(freeze.FreezeError, match="unlisted"):
        lock_existing.lock_existing(folder)
    assert not (folder / "frozen.lock").exists()


def test_preexisting_lock_cannot_be_overwritten(tmp_path: Path) -> None:
    folder = _fixture(tmp_path, "frozen-10000")
    lock_existing.lock_existing(folder)
    previous = (folder / "frozen.lock").read_bytes()
    with pytest.raises(freeze.FreezeError, match="unlocked"):
        lock_existing.lock_existing(folder)
    assert (folder / "frozen.lock").read_bytes() == previous


def test_conflicting_original_manifest_hash_prevents_lock(tmp_path: Path) -> None:
    folder = _fixture(tmp_path, "frozen-10000")
    text = (folder / "MANIFEST.csv").read_text()
    (folder / "MANIFEST.csv").write_text(text + "\n")
    # Extra trailing whitespace before sealing remains provenance input. The
    # locked metadata fingerprint must then detect its subsequent alteration.
    lock_existing.lock_existing(folder)
    (folder / "MANIFEST.csv").write_text(text)
    assert any("source manifest changed" in p for p in freeze.verify_directory(folder))


def test_root_manifest_digest_mismatch_refused(tmp_path: Path) -> None:
    folder = _fixture(tmp_path, "frozen-10000")
    csv_path = folder / "MANIFEST.csv"
    old = csv_path.read_text()
    sha = "0" * 64
    first_sha = old.splitlines()[1].split(",")[-1]
    csv_path.write_text(old.replace(first_sha, sha))
    with pytest.raises(freeze.FreezeError, match="manifest SHA-256"):
        lock_existing.lock_existing(folder)


def test_existing_lowercase_manifest_must_agree(tmp_path: Path) -> None:
    folder = _fixture(tmp_path, "frozen-1000")
    _csv(folder / "manifest.csv", [{"face_id": "WRONG", "rel_path": "sfhq/released/b.png", "sha256": "b" * 64}])
    with pytest.raises(freeze.FreezeError, match="root manifest"):
        lock_existing.lock_existing(folder)


def test_hash_list_duplicate_and_unsafe_paths_fail(tmp_path: Path) -> None:
    folder = _fixture(tmp_path, "frozen-1000")
    original = (folder / "HASHES.sha256").read_text()
    for invalid in (original + original.splitlines()[0] + "\n", original + "0" * 64 + "  ../escape.png\n"):
        (folder / "HASHES.sha256").write_text(invalid)
        with pytest.raises(freeze.FreezeError):
            lock_existing.lock_existing(folder)
        assert not (folder / "frozen.lock").exists()


def test_same_bytes_different_file_name_not_silently_accepted(tmp_path: Path) -> None:
    folder = _fixture(tmp_path, "frozen-1000")
    p = folder / "fairface-ccby4/cell/a.png"
    p.rename(p.with_name("renamed.png"))
    with pytest.raises(freeze.FreezeError):
        lock_existing.lock_existing(folder)


def test_lock_detects_image_or_manifest_changes_after_seal(tmp_path: Path) -> None:
    folder = _fixture(tmp_path, "frozen-10000")
    lock_existing.lock_existing(folder)
    original = folder / "sfhq/released/manifest.csv"
    original.write_text(original.read_text() + "\n")
    assert any("source manifest changed" in p for p in freeze.verify_directory(folder))
