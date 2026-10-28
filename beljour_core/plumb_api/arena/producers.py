"""Our three hero filters as arena producers, on the existing local engines only.

OLD and YOUNG use the R6 age-look engine (engines/shape/age.py) at stops +3 and -2; GENDER
SWAP uses the R6 masculine/feminine geometry recipe (engines/shape/gender.py) through the
guarded R5 mesh warp. Nothing here calls YouCam (no YouCam for these filters, brief rules)
and nothing is generative. Each render also returns the original moved by the same
geometry ("aligned"), which Texture Graft and Identity Lock compare against, and the edited
landmark positions. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..engines.shape import age, gender, geometry
from ..engines.warp import field as warp_field
from ..engines.warp import mesh as warp_mesh

U8 = NDArray[np.uint8]
Floats = NDArray[np.float64]
OLD_STOP = 3
YOUNG_STOP = -2
GENDER_STOP = 66  # "Extra" on the seven-stop scale
VERSION = "arena-producers/1"
WARP_ONLY = {"lines": 0.0, "texture": 0.0, "spots": 0.0, "colour": 0.0, "hair": 0.0}


@dataclass
class Edit:
    image: U8
    aligned: U8
    points_after: Floats
    strength: float
    metrics: dict[str, Any] = field(default_factory=dict)


def _age_values(stop: int, strength: float, layers: Mapping[str, float]) -> dict[str, float]:
    older, fraction, _ = age.age_strength(stop, strength)
    modifier = 1 if older else -.65
    settings = age.layer_settings(layers)
    return {"jowl_fullness": modifier * 75 * fraction * settings["jowl"],
            "jaw_length": modifier * 40 * fraction * settings["jowl"],
            "forehead_height": -modifier * 20 * fraction * settings["brows_lids"],
            "chin_shape": -modifier * 20 * fraction * settings["lips"]}


def render_age(image: U8, points: Floats, *, stop: int, strength: float, seed: int,
               layers: Mapping[str, float] | None = None) -> Edit:
    layers = dict(layers or {})
    out, edit_mask, metrics = age.render(image, points, stop=stop, strength=strength, seed=seed, layers=layers)
    warp_layers = {**layers, **WARP_ONLY}
    aligned, _, _ = age.render(image, points, stop=stop, strength=strength, seed=seed, layers=warp_layers)
    target = geometry.target_mesh(points, _age_values(stop, strength, layers), strength=metrics["guard_scale"])
    return Edit(out, aligned, target, strength, {**metrics, "edited_pixels": int(edit_mask.sum())})


def gender_direction(row_gender: str) -> int:
    """+1 toward masculine for a face labelled female, -1 toward feminine for one labelled
    male. Unlabelled faces get no gender swap in the arena (we don't guess anyone's gender)."""
    value = row_gender.strip().lower()
    if value == "female":
        return 1
    if value == "male":
        return -1
    raise ValueError("gender swap needs the dataset's gender label for the face")


def render_gender(image: U8, points: Floats, *, direction: int, strength: float,
                  regions: Mapping[str, float] | None = None) -> Edit:
    if direction not in (-1, 1):
        raise ValueError("direction is +1 or -1")
    slider = float(direction * GENDER_STOP * strength)
    target, info = gender.recipe_targets(points, slider, region_strengths=regions)
    src = geometry.check_face(points)
    if np.allclose(target, src):
        return Edit(image.copy(), image.copy(), src.copy(), strength, {"slider": slider, "strength_used": 0.0})
    lay = warp_mesh.layout(src, image.shape[1], image.shape[0])
    warp = warp_mesh.mesh_warp(image.shape[0], image.shape[1], src, target, lay=lay)
    out = warp_field.apply(image, warp.result.field)
    moved = src + (np.asarray(target) - src) * warp.strength_used
    return Edit(out, out.copy(), moved, strength, {"slider": slider, "strength_used": warp.strength_used,
                                                   "capped_landmarks": info.get("capped_landmarks", 0)})


def render(filter_name: str, image: U8, points: Floats, *, strength: float = 1.0, seed: int = 1,
           row: Mapping[str, str] | None = None, overrides: Mapping[str, Any] | None = None) -> Edit:
    """One hero-filter edit at `strength` (0..1). `overrides` carries Adaptive Strength's
    per-layer (age) or per-region (gender) settings."""
    overrides = overrides or {}
    if not 0.0 <= strength <= 1.0:
        raise ValueError("strength is 0..1")
    if filter_name == "old":
        return render_age(image, points, stop=OLD_STOP, strength=strength, seed=seed, layers=overrides.get("layers"))
    if filter_name == "young":
        return render_age(image, points, stop=YOUNG_STOP, strength=strength, seed=seed, layers=overrides.get("layers"))
    if filter_name == "gender_swap":
        direction = int(overrides.get("direction") or gender_direction((row or {}).get("gender", "")))
        return render_gender(image, points, direction=direction, strength=strength, regions=overrides.get("regions"))
    raise ValueError(f"unknown filter {filter_name}")
