"""Asset guard (filters-plan.md §6.5): no preset, LUT, effect, image or font file in the filter pack.

Every look is drawn by our own code, so the filter folders and their static build hold code
and JSON only. These fail the build when found under a guarded folder:

* colour presets and LUTs: .cube .3dl .acv .lut .xmp .lrtemplate .dng
* AR effect project files: .arproj .arexport
* any image or font: .png .jpg .jpeg .gif .webp .bmp .tif .tiff .heic .avif .svg .ico
  .ttf .otf .woff .woff2

The one exception is the goldens folder (api/tests/goldens/filters): its PNGs are our own
renders of drawn fixtures, and each must be listed in its manifest with a matching SHA-256.
Anything else there, or an unlisted image, fails. Author: John Khan.
"""
from __future__ import annotations

import hashlib
import json
from collections.abc import Sequence
from pathlib import Path

PRESET_EXT = {".cube", ".3dl", ".acv", ".lut", ".xmp", ".lrtemplate", ".dng"}
EFFECT_EXT = {".arproj", ".arexport"}
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tif", ".tiff", ".heic", ".avif", ".svg", ".ico"}
FONT_EXT = {".ttf", ".otf", ".woff", ".woff2"}
FORBIDDEN = PRESET_EXT | EFFECT_EXT | IMAGE_EXT | FONT_EXT
GUARDED = ("web/src/filters", "api/plumb_api/filters", "web/dist/js/filters")
GOLDENS = "api/tests/goldens/filters"
MANIFEST = "manifest.json"


def kind(path: Path) -> str:
    ext = path.suffix.lower()
    if ext in PRESET_EXT:
        return "colour preset or LUT"
    if ext in EFFECT_EXT:
        return "AR effect project"
    if ext in IMAGE_EXT:
        return "image"
    if ext in FONT_EXT:
        return "font"
    return ""


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check(root: Path, guarded: Sequence[str] = GUARDED, goldens: str = GOLDENS) -> list[str]:
    problems: list[str] = []
    for base in guarded:
        folder = root / base
        if not folder.is_dir():
            continue
        for path in sorted(folder.rglob("*")):
            if path.is_file() and path.suffix.lower() in FORBIDDEN:
                problems.append(f"{path.relative_to(root).as_posix()}: {kind(path)} file in the filter pack; "
                                f"looks are drawn by our code")
    folder = root / goldens
    if folder.is_dir():
        listed: dict[str, str] = {}
        manifest = folder / MANIFEST
        if manifest.exists():
            data = json.loads(manifest.read_text(encoding="utf-8"))
            listed = {name: row["png_sha256"] for name, row in data.get("goldens", {}).items()}
        for path in sorted(folder.rglob("*")):
            if not path.is_file() or path.name == MANIFEST:
                continue
            rel = path.relative_to(root).as_posix()
            if path.suffix.lower() != ".png":
                if path.suffix.lower() in FORBIDDEN:
                    problems.append(f"{rel}: only golden PNGs may sit in the goldens folder")
                continue
            key = path.relative_to(folder).as_posix()
            if key not in listed:
                problems.append(f"{rel}: golden image not listed in {MANIFEST}")
            elif listed[key] != sha256(path):
                problems.append(f"{rel}: golden image does not match its manifest hash (run make goldens-filters)")
    return problems
