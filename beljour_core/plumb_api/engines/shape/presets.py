"""Trans and non-binary presets (round 2 plan section 11): androgynous, soft feminine, soft
masculine, gender-affirming feminine and gender-affirming masculine.

Each preset is a named blend of the existing feminine and masculine controls in gender.json:
one signed slider stop and a 0..1 factor per region. Factors never exceed 1, so a preset can
only scale an authored band down, never past it; every preset runs through the same
`gender.recipe_targets`, so it inherits the same caps, regularizer and parity gate as the
sliders. Copy is respectful and plain; a preset is a visual aid, not a statement about who
someone is. Face-mapping inspiration: FLAME (independent named shape parameters blended by
weight); concept only, no code copied. Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Mapping
from typing import Any

from . import gender

REQUIRED = ("androgynous", "soft-feminine", "soft-masculine", "affirming-feminine", "affirming-masculine")
LABEL = "Gender-affirming preview. A visual aid, not a measure of identity."


def rows() -> list[dict[str, Any]]:
    data = gender.RECIPE.get("presets", {})
    return [dict(r) for r in data.get("rows", [])]


def validate(preset_rows: list[Mapping[str, Any]] | None = None) -> list[str]:
    """Rule problems: ids, slider range, known regions and factors in 0..1."""
    found = rows() if preset_rows is None else [dict(r) for r in preset_rows]
    problems: list[str] = []
    ids = [str(r.get("id")) for r in found]
    if sorted(ids) != sorted(REQUIRED) or len(set(ids)) != len(ids):
        problems.append(f"presets must be exactly {', '.join(REQUIRED)}")
    for row in found:
        where = f"preset {row.get('id')}"
        slider = row.get("slider")
        if isinstance(slider, bool) or not isinstance(slider, (int, float)) or not math.isfinite(slider) \
                or not -100 <= slider <= 100 or slider == 0:
            problems.append(f"{where}: slider must be a nonzero stop in -100..100")
        regions = row.get("regions")
        if not isinstance(regions, Mapping) or set(regions) != set(gender.REGIONS):
            problems.append(f"{where}: name every gender region exactly once")
            continue
        for name, value in regions.items():
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not 0 <= value <= 1:
                problems.append(f"{where}: region {name} factor must be 0..1")
        for key in ("label", "description"):
            if not isinstance(row.get(key), str) or not row[key].strip():
                problems.append(f"{where}: needs a {key}")
    return problems


def preset(preset_id: str) -> dict[str, Any]:
    for row in rows():
        if row["id"] == preset_id:
            return row
    raise ValueError(f"unknown preset {preset_id!r}; choose one of {', '.join(REQUIRED)}")


def blended_bands(preset_id: str) -> dict[str, float]:
    """The effective parameter bands a preset asks for (slider bands times region factors)."""
    row = preset(preset_id)
    bands = gender.parameters(float(row["slider"]))
    by_region = {
        "jaw_width_fw": "jaw", "chin_width_pct": "chin", "chin_height_fh": "chin", "brow_height_iod": "brows",
        "brow_arch_iod": "brows", "brow_ridge_shadow_pct": "brow_ridge", "cheek_width_iod": "cheekbones",
        "nose_width_pct": "nose", "bridge_width_pct": "nose", "tip_lift_iod": "nose", "lip_height_pct": "lips",
        "mouth_width_iod": "lips", "eye_opening_pct": "eyes", "eye_outer_tilt_deg": "eyes",
        "forehead_height_fh": "forehead", "face_length_fh": "chin",
    }
    return {name: value * float(row["regions"][by_region[name]]) for name, value in bands.items()}


def apply(face: object, preset_id: str) -> tuple[Any, dict[str, Any]]:
    """Targets for one preset through the shared gender recipe (same caps and regularizer)."""
    row = preset(preset_id)
    points, report = gender.recipe_targets(face, float(row["slider"]), region_strengths=dict(row["regions"]))
    report = dict(report)
    report["preset"] = row["id"]
    report["preset_label"] = row["label"]
    report["preset_note"] = LABEL
    return points, report
