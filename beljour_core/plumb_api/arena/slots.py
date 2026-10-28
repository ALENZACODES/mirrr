"""Output slots: where each producer's results live, and the reference app baseline importer.

Layout, all under test-faces/_arena/slots/ (outside the repo):

    slots/<slot>/slot.json              kind (external | ours), version, settings
    slots/<slot>/<filter>/<face_id>.png one result per face and filter

Files are named by filter and face ID only (master command v1, "Baseline"). The slot name
says nothing about who made the image either: the competitor's slot is called "baseline".
The arena's sealed key is the only place that ties a judged image back to a slot, and judges
never see it. "original" is a virtual slot: the untouched frozen face.

Imported images are decoded and re-saved as plain PNG, which drops EXIF, XMP and any
app-written tags. Author: John Khan.
"""
from __future__ import annotations

import csv
import datetime as _dt
import json
import re
from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from . import constants as C
from .freeze import read_manifest

SLOT_FORMAT = "beljour-slot/1"
ORIGINAL = "original"
BASELINE = "baseline"
SLOT_NAME = re.compile(r"^[a-z0-9][a-z0-9._-]{0,47}$")
FILTER_WORDS = {"old": "old", "older": "old", "aging": "old", "age": "old", "young": "young", "younger": "young",
                "gender": "gender_swap", "gender_swap": "gender_swap", "genderswap": "gender_swap", "swap": "gender_swap"}
FACE_ID = re.compile(r"(LG\d{4})", re.I)
# Aspect ratios further apart than this are a visible "tell" between two sides of a pair.
ASPECT_TELL = 0.02


class SlotError(RuntimeError):
    pass


def load_image(path: Path) -> np.ndarray:
    from PIL import Image, ImageOps
    with Image.open(path) as src:
        return np.array(ImageOps.exif_transpose(src).convert("RGB"), dtype=np.uint8)


def save_png(path: Path, image: np.ndarray) -> None:
    """Plain PNG: pixels only, no text chunks or metadata."""
    from PIL import Image
    if image.dtype != np.uint8 or image.ndim != 3 or image.shape[2] != 3:
        raise SlotError("slot images are RGB uint8")
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp.png")
    Image.fromarray(image, "RGB").save(tmp, format="PNG", optimize=False)
    tmp.replace(path)


@dataclass(frozen=True)
class SlotInfo:
    name: str
    kind: str
    version: str
    settings: str


class Slots:
    def __init__(self, root: Path):
        self.root = root
        self.dir = root / C.ARENA_DIR / "slots"
        self.frozen = root / C.FROZEN_DIR
        self.rows = {r["face_id"]: r for r in read_manifest(root)}

    def create(self, name: str, kind: str, version: str, settings: str = "default") -> SlotInfo:
        if name in (ORIGINAL,) or not SLOT_NAME.match(name):
            raise SlotError(f"bad slot name {name!r}")
        if kind not in ("external", "ours"):
            raise SlotError("slot kind is external or ours")
        if kind == "external" and name != BASELINE:
            raise SlotError("the external comparison slot is called 'baseline'")
        folder = self.dir / name
        folder.mkdir(parents=True, exist_ok=True)
        meta = folder / "slot.json"
        info = {"format": SLOT_FORMAT, "name": name, "kind": kind, "version": version, "settings": settings,
                "created": _dt.datetime.now(_dt.UTC).isoformat(timespec="seconds")}
        if meta.is_file():
            old = json.loads(meta.read_text(encoding="utf-8"))
            if old.get("kind") != kind or old.get("version") != version:
                raise SlotError(f"slot {name} already exists as {old.get('kind')} {old.get('version')}")
            return self.info(name)
        meta.write_text(json.dumps(info, indent=1) + "\n", encoding="utf-8")
        return self.info(name)

    def info(self, name: str) -> SlotInfo:
        if name == ORIGINAL:
            return SlotInfo(ORIGINAL, "original", "frozen", "untouched")
        meta = self.dir / name / "slot.json"
        if not meta.is_file():
            raise SlotError(f"no slot {name}")
        data = json.loads(meta.read_text(encoding="utf-8"))
        return SlotInfo(data["name"], data["kind"], data["version"], data.get("settings", ""))

    def names(self) -> list[str]:
        if not self.dir.is_dir():
            return []
        return sorted(p.name for p in self.dir.iterdir() if (p / "slot.json").is_file())

    def path(self, slot: str, filter_name: str, face_id: str) -> Path:
        if face_id not in self.rows:
            raise SlotError(f"{face_id} is not in the frozen set")
        if slot == ORIGINAL:
            return self.frozen / self.rows[face_id]["rel_path"]
        if filter_name not in C.FILTERS:
            raise SlotError(f"unknown filter {filter_name}")
        return self.dir / slot / filter_name / f"{face_id}.png"

    def has(self, slot: str, filter_name: str, face_id: str) -> bool:
        return self.path(slot, filter_name, face_id).is_file()

    def put(self, slot: str, filter_name: str, face_id: str, image: np.ndarray) -> Path:
        if slot == ORIGINAL:
            raise SlotError("the original slot is read-only")
        self.info(slot)
        target = self.path(slot, filter_name, face_id)
        save_png(target, image)
        return target

    def coverage(self, slot: str) -> dict[str, int]:
        return {f: sum(1 for fid in self.rows if self.has(slot, f, fid)) for f in C.FILTERS}


@dataclass
class ImportReport:
    imported: list[tuple[str, str]]
    skipped: list[str]
    missing: list[tuple[str, str]]
    not_baseline: list[str]

    def text(self) -> str:
        lines = [f"imported {len(self.imported)} baseline images"]
        if self.not_baseline:
            lines.append(f"{len(self.not_baseline)} are outside the first 100 faces (kept, but the gate uses only the 100)")
        if self.missing:
            lines.append(f"missing {len(self.missing)} of the 300 (filter x first-100 face) results")
        for why in self.skipped[:20]:
            lines.append("skipped: " + why)
        return "\n".join(lines)


def parse_name(path: Path) -> tuple[str, str] | None:
    """`LG0007_old.jpg`, `old/LG0007.png`, `gender-swap LG0007.heic.jpg` -> (face_id, filter)."""
    match = FACE_ID.search(path.name)
    if not match:
        return None
    words = re.split(r"[^a-z]+", (path.parent.name + " " + path.stem.replace(match.group(1), " ")).lower())
    found = {FILTER_WORDS[w] for w in words if w in FILTER_WORDS}
    joined = path.stem.lower().replace("-", "_")
    if "gender_swap" in joined or "genderswap" in joined:
        found = {"gender_swap"}
    if len(found) != 1:
        return None
    return match.group(1).upper(), found.pop()


def import_baseline(root: Path, source: Path, *, mapping: Path | None = None, overwrite: bool = False) -> ImportReport:
    """Bring the reference app's Pro outputs (captured by John at default settings) into the baseline slot.

    `source` is a folder of images named with the face ID and filter, or `mapping` is a CSV with
    columns face_id, filter, file (file relative to `source`). Images are re-encoded as plain PNG,
    so EXIF and app tags are dropped; an image identical to the original is refused (a capture
    mistake). The producer is never written anywhere but the slot's kind."""
    slots = Slots(root)
    slots.create(BASELINE, "external", "default-settings")
    entries: list[tuple[str, str, Path]] = []
    skipped: list[str] = []
    if mapping is not None:
        with mapping.open(newline="", encoding="utf-8") as fh:
            for row in csv.DictReader(fh):
                fid, filt = row.get("face_id", "").strip().upper(), FILTER_WORDS.get(row.get("filter", "").strip().lower())
                if not fid or not filt:
                    skipped.append(f"mapping row {row} has no face_id or known filter")
                    continue
                entries.append((fid, filt, source / row.get("file", "").strip()))
    else:
        for path in sorted(p for p in source.rglob("*") if p.suffix.lower() in C.IMAGE_EXTS):
            parsed = parse_name(path)
            if parsed is None:
                skipped.append(f"{path.name}: no face ID and filter in the name")
                continue
            entries.append((parsed[0], parsed[1], path))
    imported: list[tuple[str, str]] = []
    not_baseline: list[str] = []
    seen: set[tuple[str, str]] = set()
    for fid, filt, path in entries:
        if fid not in slots.rows:
            skipped.append(f"{path.name}: {fid} is not in the frozen set")
            continue
        if (fid, filt) in seen:
            skipped.append(f"{path.name}: second image for {fid} {filt}")
            continue
        seen.add((fid, filt))
        if slots.has(BASELINE, filt, fid) and not overwrite:
            skipped.append(f"{path.name}: {fid} {filt} already imported")
            continue
        try:
            image = load_image(path)
        except Exception as exc:  # noqa: BLE001 - report and continue with the rest
            skipped.append(f"{path.name}: unreadable ({type(exc).__name__})")
            continue
        original = load_image(slots.path(ORIGINAL, filt, fid))
        if image.shape == original.shape and np.array_equal(image, original):
            skipped.append(f"{path.name}: identical to the original photo")
            continue
        slots.put(BASELINE, filt, fid, image)
        imported.append((fid, filt))
        if slots.rows[fid]["baseline"] != "1":
            not_baseline.append(fid)
    first = [fid for fid, row in slots.rows.items() if row["baseline"] == "1"]
    missing = [(fid, f) for fid in first for f in C.FILTERS if not slots.has(BASELINE, f, fid)]
    return ImportReport(imported, skipped, missing, not_baseline)


# --- making two sides of a pair look alike apart from the edit ------------------------------

def _resize(image: np.ndarray, width: int, height: int) -> np.ndarray:
    from PIL import Image
    if image.shape[1] == width and image.shape[0] == height:
        return image
    return np.array(Image.fromarray(image).resize((width, height), Image.Resampling.LANCZOS), dtype=np.uint8)


def _centre_crop(image: np.ndarray, aspect: float) -> np.ndarray:
    h, w = image.shape[:2]
    if w / h > aspect:
        nw = max(1, round(h * aspect))
        x0 = (w - nw) // 2
        return image[:, x0:x0 + nw]
    nh = max(1, round(w / aspect))
    y0 = (h - nh) // 2
    return image[y0:y0 + nh]


def conform(images: Iterable[np.ndarray], *, long_side: int = 768) -> tuple[list[np.ndarray], list[str]]:
    """Bring every side of a comparison to one aspect ratio and size, so crop and resolution
    can't give away the producer. Returns the images and the tells that were corrected."""
    imgs = list(images)
    if not imgs:
        return [], []
    aspects = [i.shape[1] / i.shape[0] for i in imgs]
    tells: list[str] = []
    target_aspect = min(aspects) if max(aspects) / min(aspects) - 1 > ASPECT_TELL else aspects[0]
    if max(aspects) / min(aspects) - 1 > ASPECT_TELL:
        tells.append(f"aspect {min(aspects):.3f} vs {max(aspects):.3f} (centre-cropped)")
    sizes = {i.shape[:2] for i in imgs}
    if len(sizes) > 1:
        tells.append("different sizes (resized)")
    cropped = [_centre_crop(i, target_aspect) if abs(i.shape[1] / i.shape[0] - target_aspect) > 1e-3 else i for i in imgs]
    h = min(c.shape[0] for c in cropped)
    w = min(c.shape[1] for c in cropped)
    scale = min(1.0, long_side / max(h, w))
    width, height = max(1, round(w * scale)), max(1, round(h * scale))
    return [_resize(c, width, height) for c in cropped], tells
