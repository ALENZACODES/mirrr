"""Capture intake: check the reference app's outputs before `arena.py import-baseline` takes them.

John captures the reference app's results for the sealed baseline block by hand. Before any of
them enter the baseline slot, this check reads the capture folder and its sidecar and says
READY, INCOMPLETE or REFUSED, with every reason. It never imports, edits or uploads anything.

Capture folder (ASSUMED layout, written down in docs/ARENA-RUNBOOK.md):

    <capture>/capture.json   the sidecar below
    <capture>/...            images named with face ID and filter (`LG0007_old.jpg`,
                             `old/LG0007.png`), or listed in <capture>/mapping.csv
                             (face_id, filter, file), exactly as import-baseline reads them

capture.json (format beljour-capture/1): producer "reference app" (never a product name),
app_version, tier, settings "default", device, captured_by, captured_on (ISO date),
terms_reviewed (true: the reference app's terms allow keeping its outputs for internal
evaluation) with terms_note, adults_only (true), third_party_upload (one true per face set
used: that set's licence allows uploading its faces to the reference app), synthetic (true
only for a dry run).

Checks
  format     readable image, allowed extension, a short side of at least MIN_SIDE pixels (or the
             original's, if smaller),
             at most MAX_BYTES, not pixel-identical to the original, not a byte copy of another
             capture; aspect ratio and embedded metadata are reported (import strips metadata,
             pairing centre-crops a different aspect).
  pairing    face ID in the frozen set and in the sealed block, a known filter, one image per
             face and filter, every sealed face x filter present (gender swap only where the
             face has a gender label, as `generate` does).
  consent    every captured face has a licence, no banned source, no minor age label, and its
  licence    set is attested in third_party_upload; the sidecar attests terms and adults only.
  synthetic  a synthetic capture only enters a dry-run folder, and a real one never does.
Author: John Khan.
"""
from __future__ import annotations

import csv
import datetime as _dt
import hashlib
import json
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np

from . import constants as C
from .freeze import banned_reason, read_manifest
from .slots import ASPECT_TELL, FILTER_WORDS, ORIGINAL, Slots, load_image, parse_name

CAPTURE_FORMAT = "beljour-capture/1"
PRODUCER = "reference app"
SIDECAR = "capture.json"
MAPPING = "mapping.csv"
SYNTHETIC_MARKER = "SYNTHETIC-DRY-RUN.json"
MIN_SIDE = 256            # ASSUMED: smaller than this can't show the edit at the arena's 768 working size
MAX_BYTES = 25 * 1024 ** 2
READY, INCOMPLETE, REFUSED = "READY", "INCOMPLETE", "REFUSED"
SIDECAR_TEXT = ("app_version", "tier", "device", "captured_by", "terms_note")


def is_synthetic_root(root: Path) -> bool:
    """A test-faces folder written by the dry run (arena/dry_run.py), never a real one."""
    return (root / C.ARENA_DIR / SYNTHETIC_MARKER).is_file()


@dataclass
class IntakeReport:
    status: str = READY
    problems: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    accepted: list[tuple[str, str]] = field(default_factory=list)
    missing: list[tuple[str, str]] = field(default_factory=list)
    synthetic: bool = False

    def to_json(self) -> dict[str, Any]:
        return {"status": self.status, "synthetic": self.synthetic, "problems": self.problems,
                "warnings": self.warnings, "accepted": len(self.accepted), "missing": [f"{f} {g}" for f, g in self.missing]}

    def text(self) -> str:
        head = f"capture intake: {self.status}" + (" (SYNTHETIC dry-run capture)" if self.synthetic else "")
        lines = [head, f"{len(self.accepted)} images pass, {len(self.missing)} sealed face x filter results missing"]
        lines += [f"REFUSE {p}" for p in self.problems] + [f"NOTE   {w}" for w in self.warnings]
        return "\n".join(lines)


def check_sidecar(data: Mapping[str, Any], sets_used: set[str]) -> list[str]:
    problems = []
    if data.get("format") != CAPTURE_FORMAT:
        problems.append(f"{SIDECAR} format must be {CAPTURE_FORMAT}")
    if data.get("producer") != PRODUCER:
        problems.append(f'producer must be "{PRODUCER}" (no product names anywhere in the arena)')
    if data.get("settings") != "default":
        problems.append('settings must be "default": the baseline is the reference app at its default settings')
    for key in SIDECAR_TEXT:
        if not isinstance(data.get(key), str) or not data[key].strip():
            problems.append(f"{SIDECAR} needs {key}")
    try:
        _dt.date.fromisoformat(str(data.get("captured_on", "")))
    except ValueError:
        problems.append(f"{SIDECAR} needs captured_on as an ISO date")
    if data.get("terms_reviewed") is not True:
        problems.append("terms_reviewed must be true: someone has read the reference app's terms for keeping its outputs")
    if data.get("adults_only") is not True:
        problems.append("adults_only must be true: only adult faces may be captured")
    uploads = data.get("third_party_upload") or {}
    for face_set in sorted(sets_used):
        if uploads.get(face_set) is not True:
            problems.append(f"third_party_upload.{face_set} must be true: that set's licence must allow uploading its faces")
    if not isinstance(data.get("synthetic", False), bool):
        problems.append("synthetic must be true or false")
    return problems


def _entries(source: Path) -> tuple[list[tuple[str, str, Path]], list[str]]:
    entries, problems = [], []
    mapping = source / MAPPING
    if mapping.is_file():
        with mapping.open(newline="", encoding="utf-8") as fh:
            for n, row in enumerate(csv.DictReader(fh), 2):
                fid = (row.get("face_id") or "").strip().upper()
                filt = FILTER_WORDS.get((row.get("filter") or "").strip().lower())
                if not fid or not filt or not (row.get("file") or "").strip():
                    problems.append(f"{MAPPING} line {n}: needs face_id, a known filter and file")
                    continue
                entries.append((fid, filt, source / row["file"].strip()))
        return entries, problems
    for path in sorted(p for p in source.rglob("*") if p.is_file() and p.name not in (SIDECAR, MAPPING)):
        parsed = parse_name(path)
        if path.suffix.lower() not in C.IMAGE_EXTS or parsed is None:
            problems.append(f"{path.relative_to(source)}: not an image named with a face ID and one filter")
            continue
        entries.append((parsed[0], parsed[1], path))
    return entries, problems


def _metadata(path: Path) -> list[str]:
    from PIL import Image
    with Image.open(path) as im:
        found = [k for k in ("exif", "xmp", "icc_profile", "comment") if im.info.get(k)]
        found += [str(k) for k, v in im.info.items() if isinstance(k, str) and isinstance(v, str)]   # text chunks
    return sorted(set(found))


def check_capture(root: Path, source: Path, filters: Sequence[str] = C.FILTERS) -> IntakeReport:
    """Check a capture folder against the frozen set under `root`; coverage counts `filters`."""
    report = IntakeReport()
    sidecar_path = source / SIDECAR
    sidecar: dict[str, Any] = {}
    if not sidecar_path.is_file():
        report.problems.append(f"no {SIDECAR} in the capture folder")
    else:
        try:
            sidecar = json.loads(sidecar_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            report.problems.append(f"{SIDECAR} is not JSON ({exc.msg})")
    report.synthetic = sidecar.get("synthetic") is True
    if report.synthetic != is_synthetic_root(root):
        report.problems.append("a SYNTHETIC capture only enters a dry-run folder" if report.synthetic
                               else "this is a dry-run folder; a real capture never goes into it")
    rows = {r["face_id"]: r for r in read_manifest(root)}
    slots = Slots(root)
    entries, naming = _entries(source)
    report.problems += naming
    seen: dict[tuple[str, str], str] = {}
    digests: dict[str, str] = {}
    sets_used: set[str] = set()
    for fid, filt, path in entries:
        name = path.relative_to(source).as_posix() if path.is_relative_to(source) else path.name
        row = rows.get(fid)
        if row is None:
            report.problems.append(f"{name}: {fid} is not in the frozen set")
            continue
        if (fid, filt) in seen:
            report.problems.append(f"{name}: second image for {fid} {filt} (first: {seen[(fid, filt)]})")
            continue
        seen[(fid, filt)] = name
        sets_used.add(row["set"])
        if row.get("baseline") != "1":
            report.warnings.append(f"{name}: {fid} is outside the sealed block; the gate will not use it")
        reasons = face_rights(row)
        if reasons:
            report.problems += [f"{name}: {r}" for r in reasons]
            continue
        problems = image_problems(path, slots.path(ORIGINAL, filt, fid), digests, name, report.warnings)
        if problems:
            report.problems += problems
            continue
        if filt == "gender_swap" and row.get("gender", "").lower() not in ("male", "female"):
            report.warnings.append(f"{name}: {fid} has no gender label, so there is no result of ours to pair it with")
        report.accepted.append((fid, filt))
    if sidecar:
        report.problems += check_sidecar(sidecar, sets_used)
    sealed = [fid for fid, row in rows.items() if row.get("baseline") == "1"]
    report.missing = [(fid, filt) for fid in sealed for filt in filters
                      if (fid, filt) not in seen
                      and (filt != "gender_swap" or rows[fid].get("gender", "").lower() in ("male", "female"))]
    report.status = REFUSED if report.problems else INCOMPLETE if report.missing or not report.accepted else READY
    return report


def face_rights(row: Mapping[str, str]) -> list[str]:
    """Why a frozen face may not be sent to a third-party app, if anything."""
    out = []
    if not row.get("licence", "").strip():
        out.append(f"{row['face_id']} has no licence in the frozen manifest")
    banned = banned_reason(row.get("rel_path", ""), row.get("source", ""), row.get("licence", ""))
    if banned:
        out.append(f"{row['face_id']} comes from a banned source ({banned})")
    if row.get("age_bin") in C.MINOR_AGE_BINS:
        out.append(f"{row['face_id']} is labelled under 20; the arena is adults only")
    return out


def image_problems(path: Path, original_path: Path, digests: dict[str, str], name: str,
                   warnings: list[str]) -> list[str]:
    if path.suffix.lower() not in C.IMAGE_EXTS:
        return [f"{name}: {path.suffix or 'no extension'} is not an allowed image type"]
    if not path.is_file():
        return [f"{name}: file is missing"]
    size = path.stat().st_size
    if size > MAX_BYTES:
        return [f"{name}: {size} bytes is over the {MAX_BYTES} byte limit"]
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest in digests:
        return [f"{name}: the same file as {digests[digest]}"]
    digests[digest] = name
    try:
        image = load_image(path)
    except Exception as exc:  # noqa: BLE001  any decoder failure refuses the file
        return [f"{name}: unreadable ({type(exc).__name__})"]
    h, w = image.shape[:2]
    original = load_image(original_path)
    oh, ow = original.shape[:2]
    floor = min(MIN_SIDE, oh, ow)   # a result may be as small as its own input, never smaller
    if min(h, w) < floor:
        return [f"{name}: {w}x{h} is under {floor} pixels on the short side"]
    if image.shape == original.shape and np.array_equal(image, original):
        return [f"{name}: identical to the original photo (a capture mistake)"]
    if abs((w / h) / (ow / oh) - 1) > ASPECT_TELL:
        warnings.append(f"{name}: aspect {w / h:.3f} against the original's {ow / oh:.3f}; pairing will centre-crop")
    meta = _metadata(path)
    if meta:
        warnings.append(f"{name}: carries {', '.join(meta)}; import re-saves it as a plain PNG")
    return []
