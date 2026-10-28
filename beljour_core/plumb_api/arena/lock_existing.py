"""One-time, non-destructive sealing of externally assembled frozen face sets.

Consumes the *existing* sha256sum inventory and source manifests. It never
selects, relabels, copies, decodes or renames photographs. The first valid
snapshot creates a lowercase arena manifest (if absent) and frozen.lock using
exclusive creation, preserving any uppercase MANIFEST.csv unchanged.

Both metadata and image bytes are bound to beljour-frozen-lock/1. A missing,
extra, changed or ambiguous image makes sealing refuse without creating a lock.
Author: John Khan.
"""
from __future__ import annotations

import csv
import hashlib
import json
import re
from collections.abc import Mapping
from pathlib import Path, PurePosixPath

from .freeze import LOCK_FORMAT, LOCK_NAME, MANIFEST_NAME, FreezeError, sha256_file, verify_directory

_IMAGE_EXTENSIONS = frozenset({".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"})
_HASH_LINE = re.compile(r"^([0-9a-fA-F]{64}) [ *](.+)$")
_METADATA = ("HASHES.sha256", "MANIFEST.csv")
_EXCLUDED = frozenset({"_build", "landmarks", "segmentations"})


def _relative(value: str, directory: Path) -> str:
    candidate = PurePosixPath(value)
    if (not value or value != candidate.as_posix() or candidate.is_absolute()
            or any(part in {"", ".", ".."} for part in candidate.parts)
            or "\\" in value or not (directory / value).resolve().is_relative_to(directory.resolve())):
        raise FreezeError("unsafe inventory path")
    return value


def _image(rel: str) -> bool:
    path = PurePosixPath(rel)
    return (path.suffix.lower() in _IMAGE_EXTENSIONS
            and not any(part.startswith("_") or part in _EXCLUDED for part in path.parts[:-1]))


def _hash_inventory(directory: Path) -> dict[str, str]:
    path = directory / "HASHES.sha256"
    if not path.is_file() or path.is_symlink():
        raise FreezeError("HASHES.sha256 is required and must be a regular file")
    try:
        contents = path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        raise FreezeError("HASHES.sha256 cannot be read") from exc
    inventory: dict[str, str] = {}
    for line in contents.splitlines():
        if not line.strip():
            continue
        match = _HASH_LINE.fullmatch(line)
        if match is None:
            raise FreezeError("malformed HASHES.sha256 line")
        digest, raw_name = match.groups()
        name = _relative(raw_name, directory)
        if name in inventory:
            raise FreezeError("duplicate HASHES.sha256 entry")
        image = directory / name
        if not image.is_file() or image.is_symlink():
            raise FreezeError(f"hash-listed file missing or unsafe: {name}")
        if sha256_file(image) != digest.lower():
            raise FreezeError(f"HASHES.sha256 mismatch: {name}")
        inventory[name] = digest.lower()
    if not inventory:
        raise FreezeError("empty HASHES.sha256 inventory")
    found = {
        p.relative_to(directory).as_posix() for p in directory.rglob("*")
        if p.is_file() and _image(p.relative_to(directory).as_posix())
    }
    expected = {p for p in inventory if _image(p)}
    if not expected:
        raise FreezeError("no image entries in HASHES.sha256")
    if expected != found:
        missing = sorted(found - expected)
        absent = sorted(expected - found)
        raise FreezeError(f"unlisted or missing images: unlisted={missing[:2]}, missing={absent[:2]}")
    return inventory


def _read_csv(path: Path) -> list[dict[str, str]]:
    if path.is_symlink() or not path.is_file():
        raise FreezeError("unsafe or missing manifest")
    try:
        with path.open(encoding="utf-8-sig", newline="") as stream:
            reader = csv.DictReader(stream)
            fields = reader.fieldnames or []
            if len(set(fields)) != len(fields) or not fields:
                raise FreezeError("manifest has duplicate or missing columns")
            rows = list(reader)
    except (OSError, UnicodeError, csv.Error) as exc:
        raise FreezeError("manifest cannot be parsed") from exc
    if not rows or any(None in row or any(v is None for v in row.values()) for row in rows):
        raise FreezeError("manifest has no records or a malformed row")
    return rows


def _row_name(row: Mapping[str, str], parent: Path, directory: Path) -> str:
    # Root manifest path column is relative to the frozen set. Folder manifest
    # file column is relative to its source folder; some repeat the prefix.
    raw = (row.get("path") or row.get("rel_path") or row.get("file") or "").strip()
    if not raw:
        raise FreezeError("manifest image row lacks path or file")
    _relative(raw, directory)
    if parent == directory:
        return raw
    prefixed = (parent / raw).relative_to(directory).as_posix()
    if (directory / prefixed).is_file():
        return _relative(prefixed, directory)
    if (directory / raw).is_file():
        return raw
    return _relative(prefixed, directory)


def _manifest_index(directory: Path, inventory: Mapping[str, str]) -> tuple[dict[str, dict[str, str]], dict[str, str]]:
    images = {p for p in inventory if _image(p)}
    rows_by_path: dict[str, dict[str, str]] = {}
    hashes: dict[str, str] = {}
    # Authenticate root source provenance and every per-folder manifest even
    # where their rows carry only filenames rather than source-relative paths.
    manifests = ([directory / "MANIFEST.csv"] if (directory / "MANIFEST.csv").exists() else [])
    manifests += sorted(p for p in directory.rglob("manifest.csv")
                        if p.parent != directory and not any(part in _EXCLUDED for part in p.relative_to(directory).parts))
    if not manifests:
        raise FreezeError("at least one source manifest required")
    for path in manifests:
        hashes[path.relative_to(directory).as_posix()] = sha256_file(path)
        seen: set[str] = set()
        for row in _read_csv(path):
            rel = _row_name(row, path.parent, directory)
            if not _image(rel):
                continue
            if rel in seen:
                raise FreezeError(f"duplicate row in {path.name}: {rel}")
            seen.add(rel)
            if rel not in images:
                raise FreezeError(f"manifest lists an image outside the sealed inventory: {rel}")
            digest = (row.get("sha256") or "").strip().lower()
            if digest and digest != inventory[rel]:
                raise FreezeError(f"manifest SHA-256 differs from HASHES.sha256: {rel}")
            previous = rows_by_path.setdefault(rel, {})
            for field in ("source", "licence", "race", "gender", "age", "age_band",
                          "age_band_r12", "slice", "tags", "shard"):
                new = (row.get(field) or "").strip()
                # Source manifests can use different age-band granularity.
                if new and previous.get(field) and previous[field].casefold() != new.casefold():
                    if field != "age_band" or previous.get("age_band_r12") != new:
                        raise FreezeError(f"conflicting {field} manifest labels: {rel}")
                if new:
                    previous[field] = new
    if not all(rel in rows_by_path for rel in images):
        # External frozen-1000 adversarial images may have no source manifest;
        # inventory hashes still attest their membership, but never infer labels.
        pass
    return rows_by_path, hashes


def _manifest_text(rows: list[dict[str, str]]) -> str:
    import io
    buffer = io.StringIO(newline="")
    columns = ("face_id", "rel_path", "sha256", "source", "licence", "race", "gender", "age",
               "age_band", "age_band_r12", "slice", "tags", "shard")
    writer = csv.DictWriter(buffer, columns, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return buffer.getvalue()


def _lock_body(directory: Path, inventory: Mapping[str, str], source: Mapping[str, Mapping[str, str]],
               metadata: Mapping[str, str], manifest_sha256: str) -> dict[str, object]:
    faces = []
    image_names = sorted(rel for rel in inventory if _image(rel))
    for i, rel in enumerate(image_names, 1):
        faces.append({"face_id": f"LG{i:06d}", "rel_path": rel, "sha256": inventory[rel]})
    # The canonical format is shared with api/plumb_api/arena/freeze.py.
    from .freeze import _canonical
    return {
        "format": LOCK_FORMAT,
        "version": 1,
        "total": len(faces),
        "faces": faces,
        "faces_sha256": _canonical(faces),
        "manifest_sha256": manifest_sha256,
        "existing_inventory_sha256": sha256_file(directory / "HASHES.sha256"),
        "source_metadata_sha256": dict(sorted(metadata.items())),
        "creation": "lock-existing: preserve existing external faces and labels; no reselection",
        "counts": {
            category: sum(1 for face in faces if category in face["rel_path"])
            for category in ("fairface", "sfhq", "adversarial")
        },
    }


def lock_existing(directory: Path) -> dict[str, object]:
    """Seal an external frozen-N folder exactly once. Refuse without rewriting faces."""
    directory = directory.resolve(strict=True)
    if (not directory.is_dir() or not directory.name.startswith("frozen-")
            or (directory / LOCK_NAME).exists() or (directory / LOCK_NAME).is_symlink()):
        raise FreezeError("expected an unlocked external frozen-N directory")
    inventory = _hash_inventory(directory)
    source, metadata = _manifest_index(directory, inventory)
    # If a lowercase root manifest already exists, respect it and validate it,
    # even though the supplied 10k layout uses uppercase MANIFEST.csv.
    existing = directory / MANIFEST_NAME
    image_names = sorted(rel for rel in inventory if _image(rel))
    rows = [dict(face_id=f"LG{i:06d}", rel_path=rel, sha256=inventory[rel], **source.get(rel, {}))
            for i, rel in enumerate(image_names, 1)]
    body = _manifest_text(rows)
    if existing.exists():
        if existing.is_symlink() or not existing.is_file():
            raise FreezeError("root manifest.csv is unsafe")
        actual = _read_csv(existing)
        if [(r.get("face_id"), r.get("rel_path"), r.get("sha256")) for r in actual] != [
                (r["face_id"], r["rel_path"], r["sha256"]) for r in rows]:
            raise FreezeError("existing root manifest.csv identities disagree with inventory")
        manifest_digest = sha256_file(existing)
    else:
        manifest_digest = hashlib.sha256(body.encode("utf-8")).hexdigest()
    lock = _lock_body(directory, inventory, source, metadata, manifest_digest)
    # Repeat the entire preflight before any write, catching changes while we
    # prepared the lock. Exclusive creation prevents replacement on a race.
    if inventory != _hash_inventory(directory) or source != _manifest_index(directory, inventory)[0]:
        raise FreezeError("files changed during lock-existing preflight")
    if not existing.exists():
        try:
            with existing.open("x", encoding="utf-8", newline="") as handle:
                handle.write(body)
        except FileExistsError as exc:
            raise FreezeError("root manifest.csv was concurrently created") from exc
    try:
        with (directory / LOCK_NAME).open("x", encoding="utf-8") as handle:
            json.dump(lock, handle, indent=2, sort_keys=True)
            handle.write("\n")
    except FileExistsError as exc:
        raise FreezeError("frozen.lock already exists: refusing overwrite") from exc
    problems = verify_directory(directory)
    if problems:
        raise FreezeError("newly sealed set does not verify: " + "; ".join(problems[:3]))
    return lock
