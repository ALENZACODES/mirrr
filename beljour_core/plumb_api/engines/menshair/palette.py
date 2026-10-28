"""R19c original colour palette and strictly mask-limited cosmetic hair tint.

No model, face-analysis inference, real hair product, or hairstyle is included.
Colours are illustrative display sRGB swatches. The user deliberately selects
all preferences; no automatic age/sex/race traits are inferred. Light, exposure,
underlying pigments and printing screens all change visible results.

This module shares its original formulas with web/src/engines/menshair/palette.ts.
Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

import numpy as np

from .concealer_link import FibreComparison, FibreOptions, colour_delta_e76, render_fibres
from .render import HairAnchors

ColorGroup = Literal["natural", "grey", "creative"]
Region = Literal["all", "crown", "roots", "sides"]


@dataclass(frozen=True, slots=True)
class HairSwatch:
    id: str
    name: str
    rgb: tuple[int, int, int]
    family: ColorGroup
    note: str

    def validate(self) -> None:
        if not self.id.startswith("local-") or not 8 <= len(self.id) <= 50:
            raise ValueError("not an original local hair swatch")
        if not 5 <= len(self.name) <= 60 or len(self.note) < 15:
            raise ValueError("swatch needs a descriptive name and disclosure")
        if self.family not in ("natural", "grey", "creative"):
            raise ValueError("unknown illustrative hair palette family")
        if len(self.rgb) != 3 or any(type(c) is not int or c < 0 or c > 255 for c in self.rgb):
            raise ValueError("invalid sRGB swatch")


# Independently authored fictional display swatches, not copied dye names or
# manufacturer formulas. RGB is a screen preview, not a measured salon result.
SWATCHES: tuple[HairSwatch, ...] = (
    HairSwatch("local-black-ink", "Deep ink black", (27, 29, 33), "natural", "Fictional deep-neutral colour example"),
    HairSwatch("local-black-warm", "Warm black", (38, 31, 27), "natural", "Fictional warm-black colour example"),
    HairSwatch("local-espresso", "Deep espresso", (52, 37, 31), "natural", "Fictional deep-brown colour example"),
    HairSwatch("local-cocoa", "Cocoa brown", (72, 51, 43), "natural", "Fictional cocoa-brown colour example"),
    HairSwatch("local-umber", "Soft umber", (91, 67, 52), "natural", "Fictional mid-brown colour example"),
    HairSwatch("local-chestnut", "Chestnut brown", (111, 69, 48), "natural", "Fictional warm-brown colour example"),
    HairSwatch("local-hazel", "Hazel brown", (130, 91, 62), "natural", "Fictional golden-brown colour example"),
    HairSwatch("local-copper", "Muted copper", (143, 75, 54), "natural", "Fictional copper-shade colour example"),
    HairSwatch("local-sand", "Sandy brown", (153, 123, 89), "natural", "Fictional muted-sand colour example"),
    HairSwatch("local-flax", "Flax gold", (190, 159, 107), "natural", "Fictional lighter-gold colour example"),
    HairSwatch("local-ash-blond", "Muted ash blond", (166, 156, 133), "natural", "Fictional ash-blond colour example"),
    HairSwatch("local-cloud", "Cloud silver", (190, 187, 183), "grey", "Fictional silver-grey colour example"),
    HairSwatch("local-pewter", "Dark pewter", (117, 118, 121), "grey", "Fictional medium-grey colour example"),
    HairSwatch("local-stone", "Stone grey", (150, 151, 150), "grey", "Fictional neutral-grey colour example"),
    HairSwatch("local-snow", "Soft white", (220, 216, 210), "grey", "Fictional pale-grey colour example"),
    HairSwatch("local-blue-night", "Blue night", (38, 58, 102), "creative", "Fictional muted-blue colour example"),
    HairSwatch("local-forest", "Forest green", (46, 83, 69), "creative", "Fictional muted-green colour example"),
    HairSwatch("local-plum", "Deep plum", (91, 53, 88), "creative", "Fictional plum-toned colour example"),
    HairSwatch("local-rosewood", "Muted rosewood", (139, 80, 92), "creative", "Fictional rosewood colour example"),
    HairSwatch("local-cobalt", "Soft cobalt", (60, 91, 152), "creative", "Fictional cobalt-toned colour example"),
    HairSwatch("local-auburn", "Auburn copper", (115, 55, 46), "natural", "Fictional auburn-copper colour example"),
    HairSwatch("local-walnut", "Walnut brown", (83, 58, 45), "natural", "Fictional walnut-brown colour example"),
)
SWATCH_BY_ID: dict[str, HairSwatch] = {swatch.id: swatch for swatch in SWATCHES}


@dataclass(frozen=True, slots=True)
class ColourOptions:
    """A user-controlled, reproducible display effect, not dye instructions."""

    swatch_id: str
    strength: int = 65
    preserve_highlights: int = 60
    region: Region = "all"
    feather: int = 40
    seed: int = 0

    def validate(self) -> None:
        if self.swatch_id not in SWATCH_BY_ID:
            raise ValueError("Choose an original local hair colour")
        if self.region not in ("all", "crown", "roots", "sides"):
            raise ValueError("Unknown hair tint region")
        for key in ("strength", "preserve_highlights", "feather"):
            val = getattr(self, key)
            if type(val) is not int or not 0 <= val <= 100:
                raise ValueError(f"{key} must be an integer 0..100")
        if type(self.seed) is not int or not 0 <= self.seed <= 65535:
            raise ValueError("Seed must be a bounded integer")


@dataclass(frozen=True, slots=True)
class ColourMetrics:
    candidate_swatch: str
    sampled_reference: tuple[int, int, int]
    sample_count: int
    undertone_delta_e76: float
    edited_pixels: int
    mask_support_pixels: int
    provider_calls: int = 0
    simulated: bool = True


@dataclass(frozen=True, slots=True)
class ColourComparison:
    before: np.ndarray
    after: np.ndarray
    metrics: ColourMetrics
    notice: str = "Local screen-only hair-colour simulation. No physical dye match is implied."


def swatch(id: str) -> HairSwatch:
    try:
        return SWATCH_BY_ID[id]
    except (KeyError, TypeError) as exc:
        raise ValueError("Unknown locally authored hair colour") from exc


def _image(value: object) -> np.ndarray:
    a = np.asarray(value)
    if a.dtype != np.uint8 or a.ndim != 3 or a.shape[2] not in (3, 4):
        raise ValueError("Hair tint needs RGB or RGBA uint8")
    height, width = a.shape[:2]
    if height < 8 or width < 8 or height * width > 4_000_000:
        raise ValueError("Hair tint exceeds pixel safety limits")
    return a


def _coverage(value: object, height: int, width: int) -> np.ndarray:
    mask = np.asarray(value)
    if mask.shape != (height, width) or mask.dtype not in (np.uint8, np.bool_, np.float32, np.float64):
        raise ValueError("Use an authorized HxW hair mask")
    if mask.dtype == np.uint8:
        return mask.astype(np.float64) / 255.0
    if not np.all(np.isfinite(mask)) or np.any(mask < 0) or np.any(mask > 1):
        raise ValueError("Mask coverage must be finite within 0..1")
    return mask.astype(np.float64)


def _smooth(a: float, b: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def colour_region(width: int, height: int, anchors: HairAnchors,
                  region: Region, feather: int) -> np.ndarray:
    """Only authorizes positions inside a separate caller-supplied hair mask."""
    anchors.validate()
    if region not in ("all", "crown", "roots", "sides"):
        raise ValueError("Unsupported cosmetic tint region")
    if type(feather) is not int or not 0 <= feather <= 100:
        raise ValueError("Feather amount must be an integer 0..100")
    if width < 8 or height < 8 or width * height > 4_000_000:
        raise ValueError("Unsupported tint dimensions")
    if region == "all":
        return np.ones((height, width), dtype=np.float64)
    yy, xx = np.mgrid[:height, :width]
    centre = (anchors.left_temple[0] + anchors.right_temple[0]) * 0.5
    half = max((anchors.right_temple[0] - anchors.left_temple[0]) * 0.5, .01)
    ear = (anchors.left_ear[1] + anchors.right_ear[1]) * .5
    u = ((xx + .5) / width - centre) / half
    v = ((yy + .5) / height - anchors.crown[1]) / max(.01, ear - anchors.crown[1])
    transition = .03 + feather / 100.0 * .22
    if region == "roots":
        # Hairline simulation only, not a scalp-edge finder.
        gate = 1.0 - _smooth(.11 + transition, .33 + transition, v)
        return np.clip(gate * (1.0 - _smooth(.84, 1.24, np.abs(u))), 0.0, 1.0)
    if region == "sides":
        return _smooth(.33 - transition, .88 + transition, np.abs(u)) * (
            1.0 - _smooth(1.14, 1.70, v))
    radius = np.sqrt((u / .94) ** 2 + ((v - .15) / .75) ** 2)
    return 1.0 - _smooth(.32 + transition, 1.0 + transition, radius)


def sample_reference(image: object, mask: object, default: tuple[int, int, int]) -> tuple[tuple[int, int, int], int]:
    """Small, deterministic bounded median sample. No photo is retained.

    Pixel centres are sampled on the same flattened stride in Python and TS.
    This protects memory and avoids probabilistic behaviour in low-end browsers.
    """
    original = _image(image)
    h, w = original.shape[:2]
    coverage = _coverage(mask, h, w).reshape(-1)
    rgb = original[..., :3].reshape((-1, 3))
    stride = max(1, math.ceil((h * w) / 2048))
    indices = np.arange(0, h * w, stride, dtype=np.int64)
    valid = indices[coverage[indices] >= .95]
    if len(valid) < 8:
        return default, int(len(valid))
    med = np.median(rgb[valid].astype(np.float64), axis=0)
    result = (int(math.floor(med[0] + .5)), int(math.floor(med[1] + .5)),
              int(math.floor(med[2] + .5)))
    return result, int(len(valid))


def rank_swatches(rgb: tuple[int, int, int], *, family: ColorGroup | None = None,
                  limit: int = 7) -> tuple[tuple[HairSwatch, float], ...]:
    if len(rgb) != 3 or any(type(v) is not int or not 0 <= v <= 255 for v in rgb):
        raise ValueError("Reference must be an explicit bounded colour")
    if family is not None and family not in ("natural", "grey", "creative"):
        raise ValueError("Unknown colour family")
    if type(limit) is not int or not 1 <= limit <= len(SWATCHES):
        raise ValueError("Invalid top-k swatch count")
    distances = [(sw, colour_delta_e76(rgb, sw.rgb)) for sw in SWATCHES
                 if family is None or sw.family == family]
    return tuple(sorted(distances, key=lambda pair: (round(pair[1], 9), pair[0].id))[:limit])


def render_colour(image: object, mask: object, anchors: HairAnchors,
                  options: ColourOptions) -> ColourComparison:
    """Apply a bounded colour-delta overlay inside the validated hair mask.

    A reference median is subtracted from the swatch, preserving existing local
    light/dark texture rather than painting opaque coloured hair. Suppression of
    highlights is an artistic control, not a reflectance or dye-mixing model.
    """
    options.validate()
    original = _image(image)
    h, w = original.shape[:2]
    hair = _coverage(mask, h, w)
    region = colour_region(w, h, anchors, options.region, options.feather)
    target = swatch(options.swatch_id)
    sample, count = sample_reference(original, mask, target.rgb)
    reference = np.asarray(sample, dtype=np.float64)
    delta = np.asarray(target.rgb, dtype=np.float64) - reference
    rgb = original[..., :3].astype(np.float64)
    # Desaturating specular highlights prevents bleaching light patches.
    luminance = (rgb[..., 0] * .2126 + rgb[..., 1] * .7152 + rgb[..., 2] * .0722) / 255.0
    specular = _smooth(.63, .99, luminance) * (options.preserve_highlights / 100.0)
    coverage = np.clip(hair * region * options.strength / 100.0 * (1.0 - specular), 0.0, 1.0)
    seed = options.seed
    yy, xx = np.mgrid[:h, :w]
    # Tiny deterministic local texture modulation, independent of identity.
    micro = ((xx * 17 + yy * 29 + seed * 3) % 37) / 36.0
    subtle = 0.91 + micro * 0.09
    change = coverage[..., None] * delta[None, None, :] * subtle[..., None]
    output = original.copy()
    output[..., :3] = np.floor(np.clip(rgb + change, 0, 255) + .5).astype(np.uint8)
    different = np.any(output[..., :3] != original[..., :3], axis=-1)
    return ColourComparison(original.copy(), output, ColourMetrics(
        target.id, sample, count, colour_delta_e76(sample, target.rgb),
        int(np.count_nonzero(different)), int(np.count_nonzero(hair > 0))))


def render_palette_fibres(image: object, hair_mask: object, scalp_mask: object,
                          density_map: object, anchors: HairAnchors, *,
                          swatch_id: str, region: Literal["crown", "hairline", "both"] = "both",
                          strength: int = 65, density_gain: int = 80,
                          seed: int = 37) -> FibreComparison:
    """Link a selected original palette swatch to existing topical fibre engine.

    This is not medical treatment or hair restoration. The pigment is *exactly*
    the chosen display colour, so its delta E relative to that reference is zero.
    The output can be inspected with/without without any network request.
    """
    shade = swatch(swatch_id)
    opts = FibreOptions(region=region, strength=strength, density_gain=density_gain,
                        hair_rgb=shade.rgb, seed=seed)
    return render_fibres(image, hair_mask, scalp_mask, density_map, anchors, opts)
