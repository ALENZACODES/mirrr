"""W28 Balayage placement painter (Top 5 #4): she or her stylist paints where the lightening goes.

* The painted strokes become a soft lift map (two box-blur passes, close to a Gaussian),
  limited to the hair mask, plus an optional face-frame band (a "money piece").
* The lift is limited by her base depth and colour history: a dark base cannot reach the
  lightest blonde in one session. The preview shows session 1, at the level that session can
  reach, with the warm pigment lightening exposes at that level (toner can only deposit and
  neutralise; it never lifts). The plan lists how many sessions the full target needs.
* The colour is rendered through W39 (recolour.py), so the curl pattern is kept.

Level scale, pigment and lift per session are ASSUMED (levels.json) and labelled; this is a
visual aid for a consultation, not a formula. Local code only. Mirrored in
web/src/engines/haircolour/balayage.ts. Author: John Khan.
"""
from __future__ import annotations

import json
import math
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np

from ..shade import colourspace as cs
from .recolour import box_blur, recolour_hair

LABEL = ("Balayage simulation of session 1. Lightening limits are estimates; "
         "a strand test and a colourist decide the real result.")
VERSION = "balayage-w28/1"
HISTORIES = ("virgin", "colour_treated", "box_dye")


@lru_cache(maxsize=1)
def levels_data() -> dict[str, Any]:
    return dict(json.loads(Path(__file__).with_name("levels.json").read_text(encoding="utf-8")))


def level_row(level: int) -> dict[str, Any]:
    if isinstance(level, bool) or not isinstance(level, int) or not 1 <= level <= 10:
        raise ValueError("hair level must be an integer 1..10")
    return dict(levels_data()["levels"][level - 1])


def level_of_lightness(lightness: float) -> int:
    if not math.isfinite(lightness):
        raise ValueError("lightness must be finite")
    rows = levels_data()["levels"]
    return int(min(rows, key=lambda r: (abs(r["lightness"] - lightness), r["level"]))["level"])


def measure_base_level(image: object, hair_mask: object) -> int:
    img = np.asarray(image)
    mask = np.asarray(hair_mask, dtype=np.float64)
    if img.dtype != np.uint8 or img.ndim != 3 or mask.shape != img.shape[:2]:
        raise ValueError("base level needs a uint8 photo and a matching hair mask")
    hair = mask >= 0.5
    if int(hair.sum()) < 16:
        raise ValueError("not enough hair in the mask to measure its level")
    lightness = cs.srgb_to_lab(img[..., :3][hair].astype(np.float64))[:, 0]
    return level_of_lightness(float(np.median(lightness)))


def level_lab(level: int, toner: str = "none") -> np.ndarray:
    row = level_row(level)
    toners = levels_data()["toners"]
    if toner not in toners:
        raise ValueError(f"toner must be one of {', '.join(toners)}")
    t = toners[toner]
    chroma = row["pigment_chroma"] * t["chroma_scale"]
    hue = math.radians(row["pigment_hue"] + t["hue_shift"])
    return np.array([row["lightness"], chroma * math.cos(hue), chroma * math.sin(hue)], dtype=np.float64)


def session_plan(base_level: int, target_level: int, history: str = "virgin") -> dict[str, Any]:
    level_row(base_level)
    level_row(target_level)
    if history not in HISTORIES:
        raise ValueError(f"colour history must be one of {', '.join(HISTORIES)}")
    if target_level <= base_level:
        raise ValueError("balayage lightens: choose a target level above your base")
    lift = int(levels_data()["lift_per_session"][history])
    steps = []
    level = base_level
    while level < target_level:
        level = min(target_level, level + lift)
        steps.append(level)
    first = steps[0]
    note = levels_data()["history_notes"][history]
    if len(steps) > 1:
        note += (f" Level {target_level} from level {base_level} needs {len(steps)} sessions; "
                 f"this preview shows session 1 (level {first}).")
    return {"base_level": base_level, "target_level": target_level, "history": history,
            "lift_per_session": lift, "sessions": len(steps), "levels_by_session": steps,
            "session_1_level": first, "reachable_in_one_session": len(steps) == 1, "note": note,
            "assumed": True}


def lift_map(hair_mask: object, strokes: object, *, softness_px: int = 4,
             face_frame: object | None = None) -> np.ndarray:
    hair = np.asarray(hair_mask, dtype=np.float64)
    paint = np.asarray(strokes, dtype=np.float64)
    if paint.shape != hair.shape or not np.all(np.isfinite(paint)) or np.min(paint) < 0 or np.max(paint) > 1:
        raise ValueError("strokes must match the photo and hold values in 0..1")
    if isinstance(softness_px, bool) or not isinstance(softness_px, int) or not 0 <= softness_px <= 64:
        raise ValueError("softness must be an integer 0..64 pixels")
    soft = box_blur(box_blur(paint, softness_px), softness_px)
    if face_frame is not None:
        frame = np.asarray(face_frame, dtype=np.float64)
        if frame.shape != hair.shape or not np.all(np.isfinite(frame)) or np.min(frame) < 0 or np.max(frame) > 1:
            raise ValueError("face frame must match the photo and hold values in 0..1")
        soft = np.maximum(soft, box_blur(frame, max(1, softness_px // 2)))
    return np.clip(soft, 0.0, 1.0) * np.where(hair >= 0.5, hair, 0.0)


@dataclass(frozen=True)
class BalayageResult:
    image: np.ndarray
    lift: np.ndarray
    plan: dict[str, Any]
    colour_lab: tuple[float, float, float]
    checks: dict[str, Any]
    toner: str
    label: str = LABEL

    def to_json(self) -> dict[str, Any]:
        painted = self.lift > 0.05
        return {"format": "beljour-balayage-w28/1", "version": VERSION, "label": self.label,
                "plan": self.plan, "toner": self.toner, "colour_lab": [round(v, 4) for v in self.colour_lab],
                "coverage": round(float(painted.mean()), 6), "checks": self.checks}


def paint(image: object, hair_mask: object, strokes: object, *, target_level: int,
          base_level: int | None = None, history: str = "virgin", toner: str = "none",
          face_frame: object | None = None, softness_px: int = 4) -> BalayageResult:
    img = np.asarray(image)
    base = measure_base_level(img, hair_mask) if base_level is None else base_level
    plan = session_plan(base, target_level, history)
    colour = level_lab(plan["session_1_level"], toner)
    lift = lift_map(hair_mask, strokes, softness_px=softness_px, face_frame=face_frame)
    if float(np.max(lift)) <= 0:
        raise ValueError("no painted hair: paint inside the hair to place the lightening")
    rendered = recolour_hair(img, hair_mask, colour, alpha=np.clip(lift / max(float(np.max(lift)), 1e-9), 0, 1))
    return BalayageResult(rendered.image, lift, plan, (float(colour[0]), float(colour[1]), float(colour[2])),
                          rendered.checks, toner)
