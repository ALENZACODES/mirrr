"""Safe export specification and filename construction for the browser worker.

This reference returns metadata only. No image, external API or private photo
is accepted by this module, and video export remains a separate lane surface.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

from .contracts import PRESETS, Recipe
from .geometry import Geometry, plan


@dataclass(frozen=True)
class ExportPlan:
    name: str
    mime: str
    quality: float
    geometry: Geometry
    label: str | None


def safe_name(value: str) -> str:
    if not isinstance(value, str):
        raise ValueError("filename must be text")
    normalized = unicodedata.normalize("NFKD", value)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^A-Za-z0-9_-]+", "-", ascii_name).strip("-_")[:48]
    return slug or "look"


def export_plan(width: int, height: int, recipe: Recipe, file_stem: str = "look") -> ExportPlan:
    preset = PRESETS[recipe.export]
    geom = plan(width, height, recipe.crop, preset)
    extension = "png" if preset.mime == "image/png" else "jpg"
    label = "Simulation" if recipe.simulation and recipe.simulation_label else None
    return ExportPlan(f"{safe_name(file_stem)}.{extension}", preset.mime, preset.quality, geom, label)
