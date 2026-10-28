"""A2 goldens (filters-plan.md §5.4): every shipped filter rendered on the fixture set and stored.

Each filter has two goldens in api/tests/goldens/filters/:

* `<ID>-atlas.png`: the 256 x 192 chart atlas at the default strength, masks off, so the PNG
  records the recipe's own look on every chart colour;
* `<ID>-face.png`: the drawn medium-tone portrait (128 x 152) at the default strength with
  the guard on and the mesh masks, so it records what she gets.

manifest.json keeps, per PNG, its SHA-256 and the SHA-256 of the rendered bytes. A check
re-renders and compares pixels, never file bytes (PNG encoders differ): mean ΔE2000 <= 0.5
and max <= 2.0 pass. Goldens change only through `make goldens-filters`, which prints what
moved for HANDOFF. PNG needs Pillow (already in api/requirements.txt). Author: John Khan.
"""
from __future__ import annotations

import hashlib
import io
import json
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
from numpy.typing import NDArray

from .. import engine
from ..colour import space as S
from ..recipe import registry
from . import fixtures as F

U8 = NDArray[np.uint8]
REPO = Path(__file__).resolve().parents[4]
FOLDER = REPO / "api/tests/goldens/filters"
MANIFEST = "manifest.json"
MEAN_DE, MAX_DE = 0.5, 2.0
FACE_W, FACE_H = 128, 152


@dataclass(frozen=True)
class Golden:
    name: str
    image: U8


def renders(recipe: Mapping[str, Any]) -> list[Golden]:
    atlas = engine.render(F.chart_atlas(), recipe, engine.Settings(guard=False, protect_skin=False,
                                                                     background_only=False)).image
    face = F.portrait("medium", width=FACE_W, height=FACE_H, grain=3.0)
    out = engine.render(face.image, recipe, engine.Settings(), face.masks, face_centre=F.face_centre(face)).image
    return [Golden(f"{recipe['id']}-atlas.png", atlas), Golden(f"{recipe['id']}-face.png", out)]


def png_bytes(image: U8) -> bytes:
    from PIL import Image

    buf = io.BytesIO()
    Image.fromarray(np.ascontiguousarray(image), "RGB").save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def read_png(path: Path) -> U8:
    from PIL import Image

    with Image.open(path) as im:
        return np.asarray(im.convert("RGB"), dtype=np.uint8)


def compare(expected: U8, actual: U8) -> tuple[float, float]:
    if expected.shape != actual.shape:
        return float("inf"), float("inf")
    de = S.ciede2000(S.srgb_to_lab(S.bytes_to_unit(expected)), S.srgb_to_lab(S.bytes_to_unit(actual)))
    return float(de.mean()), float(np.max(de))


def write(folder: Path = FOLDER, cat: registry.Catalogue | None = None) -> list[str]:
    """Re-render every golden; returns one line per golden that moved (for HANDOFF)."""
    c = cat or registry.default()
    folder.mkdir(parents=True, exist_ok=True)
    old = load_manifest(folder)
    rows: dict[str, Any] = {}
    moved: list[str] = []
    for recipe in c.ranked():
        for g in renders(recipe):
            data = png_bytes(g.image)
            path = folder / g.name
            if path.exists():
                mean, peak = compare(read_png(path), g.image)
                if mean > 0 or peak > 0:
                    moved.append(f"{g.name}: mean ΔE2000 {mean:.3f}, max {peak:.3f}")
            else:
                moved.append(f"{g.name}: new")
            path.write_bytes(data)
            rows[g.name] = {"png_sha256": hashlib.sha256(data).hexdigest(),
                            "output_sha256": hashlib.sha256(np.ascontiguousarray(g.image).tobytes()).hexdigest(),
                            "shape": list(g.image.shape), "recipe": recipe["id"], "version": recipe["version"]}
    for name in old.get("goldens", {}):
        if name not in rows:
            (folder / name).unlink(missing_ok=True)
            moved.append(f"{name}: removed")
    manifest = {"format": "beljour-filter-goldens/1", "author": "John Khan",
                "about": "A2 goldens: written only by make goldens-filters. Pass: mean ΔE2000 <= 0.5, max <= 2.0.",
                "goldens": dict(sorted(rows.items()))}
    (folder / MANIFEST).write_text(json.dumps(manifest, indent=1) + "\n", encoding="utf-8")
    return moved


def load_manifest(folder: Path = FOLDER) -> dict[str, Any]:
    path = folder / MANIFEST
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def manifest_problems(folder: Path = FOLDER, cat: registry.Catalogue | None = None) -> list[str]:
    """Audit all 122 references without rendering or trusting manifest claims.

    Independent checksum and recipe coverage checks detect evidence drift even
    when a pixel-tolerance comparison would accept a similar-looking image.
    No golden file is written, replaced, or normalized by this audit.
    """
    c = cat or registry.default()
    path = folder / MANIFEST
    if not path.is_file():
        return ["golden manifest is missing"]
    def reject_duplicate_fields(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        seen: dict[str, Any] = {}
        for key, value in pairs:
            if key in seen:
                raise ValueError(f"duplicate golden manifest field: {key}")
            seen[key] = value
        return seen

    try:
        doc = json.loads(
            path.read_text(encoding="utf-8"),
            object_pairs_hook=reject_duplicate_fields,
        )
    except (ValueError, OSError, UnicodeError) as exc:
        return [f"golden manifest could not be read: {type(exc).__name__}"]
    if not isinstance(doc, dict) or not isinstance(doc.get("goldens"), dict):
        return ["golden manifest needs a goldens object"]
    listed = doc["goldens"]
    problems: list[str] = []
    expected = {
        f"{r['id']}-{variant}.png": (r, variant)
        for r in c.ranked() for variant in ("atlas", "face")
    }
    if doc.get("format") != "beljour-filter-goldens/1":
        problems.append("unexpected golden manifest format")
    if doc.get("author") != "John Khan":
        problems.append("golden provenance is missing")
    for name in sorted(set(expected) - set(listed)):
        problems.append(f"{name}: golden absent from manifest")
    for name in sorted(set(listed) - set(expected)):
        problems.append(f"{name}: golden not in built catalogue")
    for name, (recipe, variant) in expected.items():
        if name not in listed:
            continue
        row = listed[name]
        if not isinstance(row, dict):
            problems.append(f"{name}: golden metadata must be an object")
            continue
        if row.get("recipe") != recipe["id"] or row.get("version") != recipe["version"]:
            problems.append(f"{name}: recipe ID or version mismatch")
        dimensions = [F.ATLAS_H, F.ATLAS_W, 3] if variant == "atlas" else [FACE_H, FACE_W, 3]
        if row.get("shape") != dimensions:
            problems.append(f"{name}: declared shape mismatch")
        file_path = folder / name
        if not file_path.is_file():
            problems.append(f"{name}: golden PNG missing")
            continue
        try:
            content = file_path.read_bytes()
            if hashlib.sha256(content).hexdigest() != row.get("png_sha256"):
                problems.append(f"{name}: PNG checksum mismatch")
            pixels = read_png(file_path)
            if list(pixels.shape) != dimensions:
                problems.append(f"{name}: decoded PNG dimensions mismatch")
            digest = hashlib.sha256(np.ascontiguousarray(pixels).tobytes()).hexdigest()
            if digest != row.get("output_sha256"):
                problems.append(f"{name}: decoded RGB checksum mismatch")
        except (OSError, ValueError, SyntaxError) as exc:
            problems.append(f"{name}: corrupt PNG ({type(exc).__name__})")
    # An unlisted image is never silently accepted as an additional reference.
    for path in folder.glob("*.png"):
        if path.name not in expected:
            problems.append(f"{path.name}: unregistered golden PNG")
    return problems


def check(folder: Path = FOLDER, cat: registry.Catalogue | None = None) -> list[str]:
    """Validate manifest provenance, stored pixels and fresh renders."""
    c = cat or registry.default()
    problems = manifest_problems(folder, c)
    try:
        listed = load_manifest(folder).get("goldens", {})
    except (ValueError, OSError, UnicodeError):
        return problems
    if not isinstance(listed, dict):
        return problems
    for recipe in c.ranked():
        for golden in renders(recipe):
            path = folder / golden.name
            if golden.name not in listed or not path.is_file():
                continue
            try:
                mean, peak = compare(read_png(path), golden.image)
            except (OSError, ValueError, SyntaxError):
                # The manifest audit has already reported the damaged input.
                continue
            if mean > MEAN_DE or peak > MAX_DE:
                problems.append(
                    f"{golden.name}: moved by mean ΔE2000 {mean:.3f}, max {peak:.3f}"
                )
    return problems
