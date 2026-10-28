"""Parametric short-sides *tonal guide*, constrained by caller-provided scalp/hair masks.

R16 Lane C scope and testable guarantees:
- no face, hairstyle or scalp model is bundled or called;
- cannot remove, grow or reconstruct hair: only visual blending inside hair/scalp mask;
- masked-out pixels and input arrays are bit-for-bit unchanged;
- synthetic low/mid/high fade heights increase geometric affected area monotonically;
- TypeScript implementation uses the same preset JSON and exact pixel formulas;
- labels always say local simulation; a YouCam hairstyle route is optional only through
  the pre-existing provider and is NOT invoked by this engine.
Author: John Khan.
"""
from __future__ import annotations

import json
import math
from collections.abc import Mapping
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np

from .advanced import EXTENDED_FAMILIES, PATTERNS, PRESENTATIONS, family_ratio, spatial_field
from .detailing import HairDetail, detail_field
from .graded import FADE_SHAPES, FadeShape, graded_field

STYLES_PATH = Path(__file__).with_name("presets.json")
VERSION = "menshair-r16c/1"
SIMULATION_LABEL = "Local tonal haircut simulation. No strands removed or haircut outcome predicted."
FADE_START = {"low": 0.80, "mid": 0.62, "high": 0.43}

FAMILIES = frozenset({"fade", "taper", "undercut", "crew", "side-part", "crop", "buzz"}) | EXTENDED_FAMILIES
TOPS = frozenset({"natural", "short", "parted", "textured"})
SIDES = frozenset({"none", "left", "right"})
Point = tuple[float, float]


def _point(obj: object) -> Point:
    if (not isinstance(obj, (tuple, list)) or len(obj) != 2 or
            not all(isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)
                    and 0 <= v <= 1 for v in obj)):
        raise ValueError("each landmark must contain two finite normalized coordinates")
    return (float(obj[0]), float(obj[1]))


@dataclass(frozen=True)
class HairAnchors:
    """2D head landmarks; x/y are in [0,1] image coordinates, not untrusted pixels."""
    left_temple: Point
    right_temple: Point
    crown: Point
    left_ear: Point
    right_ear: Point
    nape: Point

    @classmethod
    def parse(cls, values: Mapping[str, object]) -> HairAnchors:
        points = cls(**{field: _point(values[field]) for field in
                        ("left_temple", "right_temple", "crown", "left_ear", "right_ear", "nape")})
        points.validate()
        return points

    def validate(self) -> None:
        if (not self.left_temple[0] + 0.05 < self.right_temple[0] or
                not self.crown[1] + 0.05 < min(self.left_ear[1], self.right_ear[1]) or
                not max(self.left_ear[1], self.right_ear[1]) < self.nape[1] or
                abs(self.left_temple[1] - self.right_temple[1]) > 0.15 or
                abs(self.left_ear[1] - self.right_ear[1]) > 0.15):
            raise ValueError("landmarks do not describe a roughly upright forward-facing head")

    def to_json(self) -> dict[str, list[float]]:
        return {name: list(getattr(self, name)) for name in
                ("left_temple", "right_temple", "crown", "left_ear", "right_ear", "nape")}


@dataclass(frozen=True)
class HairRecipe:
    id: str
    name: str
    family: str
    fade: str
    top: str
    buzz_grade: int
    part: str
    strength: int
    # Optional original R17 tonal controls. Zero/default preserves legacy pixels.
    pattern: str = "plain"
    presentation: str = "unisex"  # concept browse label, not a person's inferred sex
    top_bias: int = 0
    side_bias: int = 0
    fringe: int = 0
    flow: int = 0
    length: int = 0
    definition: int = 50
    # R18 optional clipper-grade guide; omitted values preserve R16/R17 pixels.
    fade_shape: FadeShape = "classic"
    side_grade: int = 1
    top_grade: int = 4
    blend_width: int = 45
    detail: HairDetail | None = None  # Opt-in R19 line/texture tonal guide

    @classmethod
    def parse(cls, raw: Mapping[str, Any]) -> HairRecipe:
        required = {"id", "name", "family", "fade", "top", "buzz_grade", "part", "strength"}
        if not required <= raw.keys() or not isinstance(raw["id"], str) or not raw["id"].startswith("local-"):
            raise ValueError("invalid local hairstyle recipe")
        if not isinstance(raw["name"], str) or not 8 <= len(raw["name"]) <= 90:
            raise ValueError("invalid hairstyle name")
        if raw["family"] not in FAMILIES or raw["fade"] not in FADE_START or raw["top"] not in TOPS:
            raise ValueError("invalid hairstyle family, fade or top")
        if raw["part"] not in SIDES:
            raise ValueError("invalid hairstyle part")
        if type(raw["buzz_grade"]) is not int or not 0 <= raw["buzz_grade"] <= 4:
            raise ValueError("invalid buzz grade")
        if raw["family"] != "buzz" and raw["buzz_grade"] != 0:
            raise ValueError("buzz grade only for buzz cuts")
        if type(raw["strength"]) is not int or not 0 <= raw["strength"] <= 100:
            raise ValueError("strength must be 0..100")
        for field_name, allowed in (("pattern", PATTERNS), ("presentation", PRESENTATIONS)):
            if field_name in raw and raw[field_name] not in allowed:
                raise ValueError(f"unknown {field_name}")
        for field_name in ("top_bias", "side_bias", "fringe", "length", "definition"):
            value = raw.get(field_name, 50 if field_name == "definition" else 0)
            if type(value) is not int or not 0 <= value <= 100:
                raise ValueError(f"{field_name} must be an integer 0..100")
        flow = raw.get("flow", 0)
        if type(flow) is not int or not -100 <= flow <= 100:
            raise ValueError("flow must be an integer -100..100")
        untrusted_shape = raw.get("fade_shape", "classic")
        if not isinstance(untrusted_shape, str) or untrusted_shape not in FADE_SHAPES:
            raise ValueError("unsupported fade shape")
        shape: FadeShape
        if untrusted_shape == "classic":
            shape = "classic"
        elif untrusted_shape == "skin":
            shape = "skin"
        elif untrusted_shape == "drop":
            shape = "drop"
        elif untrusted_shape == "burst":
            shape = "burst"
        elif untrusted_shape == "temple":
            shape = "temple"
        elif untrusted_shape == "shadow":
            shape = "shadow"
        else:
            raise ValueError("unknown validated fade shape")
        side_grade = raw.get("side_grade", 1)
        top_grade = raw.get("top_grade", 4)
        band = raw.get("blend_width", 45)
        if (type(side_grade) is not int or type(top_grade) is not int or
                not 0 <= side_grade < top_grade <= 4):
            raise ValueError("clipper grade must increase from side to top")
        if shape == "skin" and side_grade != 0:
            raise ValueError("skin fade requires grade zero")
        if type(band) is not int or not 1 <= band <= 100:
            raise ValueError("fade blending width must be an integer 1..100")
        allowed_keys = required | {
            "pattern", "presentation", "top_bias", "side_bias", "fringe", "flow", "length", "definition",
            "fade_shape", "side_grade", "top_grade", "blend_width", "detail",
        }
        if set(raw) - allowed_keys:
            raise ValueError("unknown hairstyle renderer fields")
        detail = raw.get("detail")
        if detail is not None:
            if not isinstance(detail, Mapping) or set(detail) - set(HairDetail.__dataclass_fields__):
                raise ValueError("invalid line/texture detail parameters")
            detail = HairDetail(**detail)
            detail.validate()
        fields = {key: raw[key] for key in allowed_keys - {"detail"} if key in raw}
        return cls(**fields, detail=detail)

    def to_json(self) -> dict[str, Any]:
        out = {key: getattr(self, key) for key in
               ("id", "name", "family", "fade", "top", "buzz_grade", "part", "strength",
                "pattern", "presentation", "top_bias", "side_bias", "fringe", "flow", "length", "definition",
                "fade_shape", "side_grade", "top_grade", "blend_width")}
        if self.detail is not None:
            from dataclasses import asdict
            out["detail"] = asdict(self.detail)
        return out


@lru_cache(maxsize=1)
def available_presets() -> tuple[HairRecipe, ...]:
    payload = json.loads(STYLES_PATH.read_text(encoding="utf-8"))
    if (payload.get("format") != "beljour-menshair-r16c/1" or
            payload.get("author") != "John Khan" or payload.get("simulation_label") != SIMULATION_LABEL):
        raise ValueError("menshair source provenance changed")
    rows = payload.get("styles")
    if not isinstance(rows, list) or len(rows) < 12:
        raise ValueError("short-sides family incomplete")
    out = tuple(HairRecipe.parse(row) for row in rows)
    if len({r.id for r in out}) != len(out):
        raise ValueError("duplicate menshair preset id")
    return out


def require_preset(style_id: str) -> HairRecipe:
    for preset in available_presets():
        if preset.id == style_id:
            return preset
    raise ValueError("unknown local hairstyle preset")


def smoothstep(lo: float, hi: float, x: np.ndarray) -> np.ndarray:
    """Cubic interpolation with a defined zero-width step, mirrored in TypeScript."""
    if not math.isfinite(lo) or not math.isfinite(hi) or hi <= lo:
        raise ValueError("smoothstep requires increasing finite thresholds")
    t = np.clip((x - lo) / (hi - lo), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def _geometry(height: int, width: int, anchors: HairAnchors) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    anchors.validate()
    yy, xx = np.mgrid[0:height, 0:width]
    x = (xx.astype(np.float64) + 0.5) / width
    y = (yy.astype(np.float64) + 0.5) / height
    centre = (anchors.left_temple[0] + anchors.right_temple[0]) / 2
    half = (anchors.right_temple[0] - anchors.left_temple[0]) / 2
    u = (x - centre) / max(half, 0.01)
    ear_y = (anchors.left_ear[1] + anchors.right_ear[1]) / 2
    v = (y - anchors.crown[1]) / max(ear_y - anchors.crown[1], 0.01)
    return u, v, y


def fade_coverage(width: int, height: int, anchors: HairAnchors, fade: str) -> np.ndarray:
    """Fade height ordering is monotone pixel-by-pixel, not merely by average area."""
    if fade not in FADE_START:
        raise ValueError("unknown fade height")
    u, v, _ = _geometry(height, width, anchors)
    side = smoothstep(0.34, 0.94, np.abs(u))
    start = FADE_START[fade]
    vertical = smoothstep(start - 0.13, start + 0.11, v)
    return side * vertical


def _mask(mask: object, h: int, w: int, name: str) -> np.ndarray:
    data = np.asarray(mask)
    if data.shape != (h, w) or data.dtype not in (np.uint8, np.float32, np.float64, np.bool_):
        raise ValueError(f"{name} must be a {h} x {w} uint8/float mask")
    if data.dtype == np.uint8:
        return data.astype(np.float64) / 255.0
    if not np.all(np.isfinite(data)) or bool(np.any(data < 0)) or bool(np.any(data > 1)):
        raise ValueError(f"{name} contains invalid coverage")
    return data.astype(np.float64)


def effect_field(width: int, height: int, anchors: HairAnchors, recipe: HairRecipe) -> np.ndarray:
    """Return 0..1 intensity field before the hair/scalp support mask is applied.

    This is a tonal schematic, not a haircut geometry reconstruction. Buzz grades
    alter tonal response, not a literal clipper length or hair growth.
    """
    if width < 8 or height < 8 or width * height > 24_000_000:
        raise ValueError("unsupported render dimensions")
    u, v, _ = _geometry(height, width, anchors)
    field = fade_coverage(width, height, anchors, recipe.fade) * 0.80
    if recipe.family == "taper":
        # A subtle temple taper, tapering off away from the lower temple.
        proximity = smoothstep(0.68, 1.0, np.abs(u))
        field = field * (0.55 + 0.45 * proximity)
    elif recipe.family == "undercut":
        # A defined step, still soft on a pixel boundary to avoid a jagged edge.
        field = smoothstep(0.45, 0.58, np.abs(u)) * smoothstep(0.30, 0.37, v)
    elif recipe.family == "crew":
        top = 1 - smoothstep(0.08, 0.55, v)
        field = np.maximum(field, 0.12 * top)
    elif recipe.family == "crop":
        top = 1 - smoothstep(0.09, 0.60, v)
        yy, xx = np.mgrid[0:height, 0:width]
        texture = ((xx * 17 + yy * 29 + ((xx * yy) % 13) * 7) % 101) / 100.0
        field = np.maximum(field, top * (0.09 + 0.12 * texture))
    elif recipe.family == "buzz":
        grade = recipe.buzz_grade
        # Grade 1 the most pronounced tonal coverage, grade 4 the least.
        field = np.maximum(field * 0.35, 0.61 - 0.105 * grade)
    if recipe.part != "none":
        direction = -1 if recipe.part == "left" else 1
        ridge = 1.0 - smoothstep(0.006, 0.035, np.abs(u - direction * 0.27))
        top = 1.0 - smoothstep(0.28, 0.60, v)
        field = np.maximum(field, 0.52 * ridge * top)
    if (recipe.family in EXTENDED_FAMILIES or recipe.pattern != "plain" or
            any((recipe.top_bias, recipe.side_bias, recipe.fringe, recipe.flow, recipe.length)) or
            recipe.definition != 50):
        extra = spatial_field(u, v, width, height, family=recipe.family, pattern=recipe.pattern,
                              top_bias=recipe.top_bias, side_bias=recipe.side_bias,
                              fringe=recipe.fringe, flow=recipe.flow, length=recipe.length,
                              definition=recipe.definition)
        field = np.maximum(field, extra)
    # Only recipes opting into R18 graded short-sides use the new geometric field.
    # Legacy catalogue render observations remain unchanged to the byte.
    if (recipe.fade_shape != "classic" or recipe.side_grade != 1 or
            recipe.top_grade != 4 or recipe.blend_width != 45):
        guide = graded_field(width, height, anchors, fade=recipe.fade,
                             shape=recipe.fade_shape, side_grade=recipe.side_grade,
                             top_grade=recipe.top_grade, blend_width=recipe.blend_width)
        intensity = (0.67 + (4.0 - guide.grade) * 0.036) * guide.blend
        intensity += 0.12 * guide.transition
        field = np.maximum(field, intensity)
    if recipe.detail is not None and recipe.detail.active():
        # The same original head frame anchors every R19 pixel; actual support
        # is constrained by render_style after this purely spatial field.
        field = np.maximum(field, detail_field(u, v, width, height, recipe.detail))
    return np.clip(field * (recipe.strength / 100.0), 0.0, 1.0)


def render_style(image: object, hair_mask: object, anchors: HairAnchors, recipe: HairRecipe,
                 *, scalp_mask: object | None = None,
                 scalp_rgb: tuple[int, int, int] = (132, 99, 83)) -> tuple[np.ndarray, dict[str, Any]]:
    """Return a new image plus evidence; the input and mask remain unchanged.

    Scalp RGB is an explicit local cosmetic approximation, not an estimated skin tone;
    callers should sample with a cleared skin mask before commercial use.
    """
    arr = np.asarray(image)
    if arr.ndim != 3 or arr.shape[2] not in (3, 4) or arr.dtype != np.uint8:
        raise ValueError("menshair renderer needs uint8 RGB or RGBA")
    h, w = arr.shape[:2]
    if h < 8 or w < 8 or h * w > 24_000_000:
        raise ValueError("unsupported dimensions")
    if (len(scalp_rgb) != 3 or any(type(channel) is not int or not 0 <= channel <= 255
                                   for channel in scalp_rgb)):
        raise ValueError("scalp colour must be three integer RGB channels")
    hair = _mask(hair_mask, h, w, "hair_mask")
    scalp = np.zeros_like(hair) if scalp_mask is None else _mask(scalp_mask, h, w, "scalp_mask")
    support = np.maximum(hair, scalp)
    strength = effect_field(w, h, anchors, recipe) * support
    rgb = arr[..., :3].astype(np.float64)
    scalp_colour = np.asarray(scalp_rgb, dtype=np.float64)
    # Blend more scalp tone on short sides, preserving gradient and original texture.
    ratio = (0.75 if recipe.family in ("undercut", "buzz") else family_ratio(recipe.family))
    target = rgb * (1 - ratio) + scalp_colour * ratio
    result = arr.copy()
    result[..., :3] = np.floor(rgb * (1 - strength[..., None]) + target * strength[..., None] + 0.5).astype(np.uint8)
    affected = (support > 0) & (strength > 0)
    # Quantised rows/coverage are diagnostic, never presented as a haircut accuracy score.
    return result, {"version": VERSION, "style_id": recipe.id, "source": "local",
                    "simulation": True, "label": SIMULATION_LABEL,
                    "affected_pixels": int(affected.sum()), "total_pixels": h * w,
                    "mask_support_pixels": int((support > 0).sum()),
                    "provider_calls": 0, "note": "Tonal guide only; no strand segmentation, hair removal or restored scalp."}
