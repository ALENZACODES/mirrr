"""Two-swatch digital pigment plan for the local fibre preview.

The visitor chooses two different in-house hair swatches. The plan mixes them in
sRGB at 5 percent steps of the second swatch (0, 5, ..., 100 percent; each channel
rounded half up to a byte), converts each mix to CIELAB and keeps the step whose
CIEDE2000 distance to the corrected hair reading is smallest (ties go to the
smaller share of the second swatch). A mix whose measured hair level is above the
reading's level is left out unless the visitor affirmatively opts in to a lighter
result, the same no-lightening rule as the single-swatch plan.

Coded refusals instead of guesses: ``uncorrected_lighting`` (the reading has no
lighting correction), ``same_swatch``, ``too_light`` (every mix is lighter and no
opt-in was given) and ``too_far`` (the best mix is beyond the committed W6 6.0
limit, ASSUMED to carry over to fibre colour as in shade_support.py).

The interpolation is a screen-space estimate, not a laboratory or physical-fibre
mixture prediction. ``render_two_tone`` passes the chosen mix to the existing
guarded, mask-limited ``CoverSession.render``. Mirrored in
web/src/commerce/two-tone.ts. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

import numpy as np

from ..hair_palette.catalogue import HairShade, require_shade
from ..hair_palette.matching import measured_level
from ..shade import colourspace as cs
from ..shade.distance import delta_e
from ..shade.finder import thresholds
from .cover import CoverRefusal, CoverResult, CoverSession, HeadLandmarks, Zone
from .shade_support import FibreReading

STEP_PERCENT = 5
STEPS = tuple(range(0, 101, STEP_PERCENT))
RefusalCode = Literal["uncorrected_lighting", "same_swatch", "too_light", "too_far"]
LABEL = "Two-swatch screen colour estimate; not a physical fibre or dye mixture."


def mix_rgb(first: tuple[int, int, int], second: tuple[int, int, int], percent: int) -> tuple[int, int, int]:
    """Per-channel byte mix with ``percent`` of the second colour, rounded half up."""
    if type(percent) is not int or not 0 <= percent <= 100:
        raise ValueError("mix percent must be an integer 0..100")
    r, g, b = ((a * (100 - percent) + c * percent + 50) // 100 for a, c in zip(first, second, strict=True))
    return r, g, b


@dataclass(frozen=True, slots=True)
class MixOption:
    percent: int
    rgb: tuple[int, int, int]
    lab: tuple[float, float, float]
    level: int
    delta_e: float

    def public(self) -> dict[str, Any]:
        return {"second_percent": self.percent, "rgb": list(self.rgb),
                "lab": [round(v, 6) for v in self.lab], "level": self.level,
                "delta_e": round(self.delta_e, 6)}


def mix_option(first: HairShade, second: HairShade, percent: int,
               reading: tuple[float, float, float]) -> MixOption:
    rgb = mix_rgb(first.rgb, second.rgb, percent)
    lab = cs.srgb_to_lab(np.asarray(rgb, dtype=np.float64))
    triple = (float(lab[0]), float(lab[1]), float(lab[2]))
    return MixOption(percent, rgb, triple, measured_level(triple), delta_e(triple, reading))


@dataclass(frozen=True, slots=True)
class TwoTonePlan:
    reading: FibreReading
    first_id: str
    second_id: str
    code: RefusalCode | None
    best: MixOption | None
    reading_level: int
    approved_lighter: bool
    options_considered: int

    @property
    def refused(self) -> bool:
        return self.code is not None

    def public(self) -> dict[str, Any]:
        return {"format": "beljour-two-tone/1", "label": LABEL, "refused": self.refused, "code": self.code,
                "first_id": self.first_id, "second_id": self.second_id,
                "reading": self.reading.public(), "reading_level": self.reading_level,
                "best": None if self.best is None else self.best.public(),
                "approved_lighter": self.approved_lighter, "options_considered": self.options_considered,
                "step_percent": STEP_PERCENT, "tested_against_real_products": False}


def plan_two_tone(reading: FibreReading, first_id: str, second_id: str, *,
                  approve_lighter: bool = False) -> TwoTonePlan:
    """The closest allowed 5 percent mix of two chosen swatches, or a coded refusal."""
    if not isinstance(reading, FibreReading):
        raise ValueError("Expected a fibre colour reading")
    if type(approve_lighter) is not bool:
        raise ValueError("approve_lighter must be a boolean")
    first, second = require_shade(first_id), require_shade(second_id)
    level = measured_level(reading.lab)

    def refuse(code: RefusalCode, considered: int = 0) -> TwoTonePlan:
        return TwoTonePlan(reading, first.id, second.id, code, None, level, approve_lighter, considered)

    if reading.white_mode == "none":
        return refuse("uncorrected_lighting")
    if first.id == second.id:
        return refuse("same_swatch")
    options = [mix_option(first, second, percent, reading.lab) for percent in STEPS]
    allowed = [o for o in options if approve_lighter or o.level <= level]
    if not allowed:
        return refuse("too_light", len(options))
    best = min(allowed, key=lambda o: (o.delta_e, o.percent))
    if best.delta_e > float(thresholds()["confidence"]["refuse_delta_e_above"]):
        return refuse("too_far", len(options))
    return TwoTonePlan(reading, first.id, second.id, None, best, level, approve_lighter, len(options))


def render_two_tone(session: CoverSession, image: object, hair_region: object, scalp_show: object,
                    plan: TwoTonePlan, *, landmarks: HeadLandmarks | None, zone: Zone = "crown",
                    level: object = 3.0, **options: Any) -> CoverResult | CoverRefusal:
    """Draw the chosen mix with the existing guarded, mask-limited fibre renderer."""
    if plan.best is None:
        raise ValueError("A refused two-tone plan cannot be rendered")
    return session.render(image, hair_region, scalp_show, zone=zone, level=level, landmarks=landmarks,
                          palette_rgb=plan.best.rgb, **options)
