"""Mask-limited, nonmedical hair-fibre visual comparison (R18 Lane C).

The upstream concealer engine is an optional *density source*, not a model
bundled here. A density map supplied by that engine is consumed without changes.
No pixels outside caller-supplied, independently authorized scalp/region masks
can change. A fibre is a deterministic cosmetic colour-overlay simulation, not
new hair, a measured fibre count, or a treatment prediction. No images are sent.

This file deliberately neither edits nor monkey-patches engines/concealer.
"""
from __future__ import annotations

from dataclasses import dataclass
from importlib import import_module
from typing import TYPE_CHECKING, Literal, Protocol

import numpy as np

if TYPE_CHECKING:
    from .render import HairAnchors

Region = Literal["crown", "hairline", "both"]
_SUPPORTED_REGIONS: frozenset[str] = frozenset({"crown", "hairline", "both"})
_MAX_PIXELS = 4_000_000


class DensitySource(Protocol):
    """The narrow seam for consuming precomputed concealer-engine density."""

    def density_map(self, hair_mask: np.ndarray, scalp_mask: np.ndarray) -> np.ndarray: ...


@dataclass(frozen=True, slots=True)
class FibreOptions:
    region: Region = "both"
    strength: int = 65
    density_gain: int = 80
    hair_rgb: tuple[int, int, int] = (69, 48, 38)
    seed: int = 37

    def validate(self) -> None:
        if self.region not in _SUPPORTED_REGIONS:
            raise ValueError("choose crown, hairline or both")
        if (type(self.strength) is not int or not 0 <= self.strength <= 100 or
                type(self.density_gain) is not int or not 0 <= self.density_gain <= 100):
            raise ValueError("fibre strength and gain must be integers between 0 and 100")
        if (len(self.hair_rgb) != 3 or any(type(channel) is not int or
                not 0 <= channel <= 255 for channel in self.hair_rgb)):
            raise ValueError("hair colour needs three bounded RGB channels")
        if type(self.seed) is not int or not 0 <= self.seed <= 65535:
            raise ValueError("deterministic fibre seed must be a bounded integer")


@dataclass(frozen=True, slots=True)
class FibreMetrics:
    scalp_show_before: float
    scalp_show_after: float
    coverage_gain: float
    colour_delta_e76: float
    eligible_pixels: int
    altered_pixels: int
    provider_calls: int = 0
    simulated: bool = True

    def to_json(self) -> dict[str, float | int | bool]:
        return {
            "scalp_show_before": self.scalp_show_before,
            "scalp_show_after": self.scalp_show_after,
            "coverage_gain": self.coverage_gain,
            "colour_delta_e76": self.colour_delta_e76,
            "eligible_pixels": self.eligible_pixels,
            "altered_pixels": self.altered_pixels,
            "provider_calls": self.provider_calls,
            "simulated": self.simulated,
        }


@dataclass(frozen=True, slots=True)
class FibreComparison:
    before: np.ndarray
    after: np.ndarray
    density_before: np.ndarray
    density_after: np.ndarray
    metrics: FibreMetrics
    label: str = "Local hair-fibre appearance simulation; not hair restoration"


def _coverage(value: object, height: int, width: int, label: str) -> np.ndarray:
    arr = np.asarray(value)
    if arr.shape != (height, width) or arr.dtype not in (np.uint8, np.float32, np.float64, np.bool_):
        raise ValueError(f"{label} must be an HxW uint8 or float mask")
    if arr.dtype == np.uint8:
        return arr.astype(np.float64) / 255.0
    if not np.all(np.isfinite(arr)) or bool(np.any(arr < 0)) or bool(np.any(arr > 1)):
        raise ValueError(f"{label} must contain finite coverage in 0..1")
    return arr.astype(np.float64)


def _ease(low: float, high: float, value: np.ndarray) -> np.ndarray:
    t = np.clip((value - low) / (high - low), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def region_field(width: int, height: int, anchors: HairAnchors, region: Region) -> np.ndarray:
    """A softly feathered head-landmark region; NOT a skin or hair classifier."""
    if type(width) is not int or type(height) is not int or width < 8 or height < 8 or width * height > _MAX_PIXELS:
        raise ValueError("unsupported region dimensions")
    anchors.validate()
    if region not in _SUPPORTED_REGIONS:
        raise ValueError("invalid thinning region")
    yy, xx = np.mgrid[:height, :width]
    center = (anchors.left_temple[0] + anchors.right_temple[0]) / 2.0
    half = max((anchors.right_temple[0] - anchors.left_temple[0]) / 2.0, 0.01)
    ear = (anchors.left_ear[1] + anchors.right_ear[1]) / 2.0
    u = ((xx + 0.5) / width - center) / half
    v = ((yy + 0.5) / height - anchors.crown[1]) / max(ear - anchors.crown[1], 0.01)
    # Central crown; hairline goes across forehead just above the temple line.
    crown = 1.0 - _ease(0.45, 1.05, np.sqrt((u / 0.87) ** 2 + ((v - 0.09) / 0.60) ** 2))
    hairline = (1.0 - _ease(0.47, 1.03, np.abs(u))) * (
        _ease(-0.26, -0.04, v) * (1.0 - _ease(0.34, 0.61, v)))
    if region == "crown":
        return np.clip(crown, 0.0, 1.0)
    if region == "hairline":
        return np.clip(hairline, 0.0, 1.0)
    return np.maximum(crown, hairline)


def _fibre_pattern(width: int, height: int, seed: int) -> np.ndarray:
    """Reproducible sub-pixel flecks, smooth enough for small live previews."""
    yy, xx = np.mgrid[:height, :width]
    hash_a = (xx * 19 + yy * 31 + ((xx * yy) % 37) * 7 + seed * 13) % 257
    hash_b = (xx * 43 + yy * 11 + ((xx + yy) % 23) * 5 + seed * 3) % 251
    return 0.64 + 0.20 * hash_a / 256.0 + 0.16 * hash_b / 250.0


def _srgb_to_lab(color: tuple[int, int, int]) -> tuple[float, float, float]:
    """CIE 1976 Lab, D65 reference and sRGB input. Used for a colour guard."""
    values = np.asarray(color, dtype=np.float64) / 255.0
    linear = np.where(values <= 0.04045, values / 12.92, ((values + 0.055) / 1.055) ** 2.4)
    xyz = np.array((
        0.4124564 * linear[0] + 0.3575761 * linear[1] + 0.1804375 * linear[2],
        0.2126729 * linear[0] + 0.7151522 * linear[1] + 0.0721750 * linear[2],
        0.0193339 * linear[0] + 0.1191920 * linear[1] + 0.9503041 * linear[2],
    ), dtype=np.float64) / (0.95047, 1.0, 1.08883)
    f = np.where(xyz > 0.008856451679, np.cbrt(xyz), 7.787037037 * xyz + 16.0 / 116.0)
    return float(116 * f[1] - 16), float(500 * (f[0] - f[1])), float(200 * (f[1] - f[2]))


def colour_delta_e76(left: tuple[int, int, int], right: tuple[int, int, int]) -> float:
    a = _srgb_to_lab(left)
    b = _srgb_to_lab(right)
    return float(sum((x - y) ** 2 for x, y in zip(a, b, strict=True)) ** 0.5)


def _tone_sample(image: np.ndarray, hair: np.ndarray, selected: tuple[int, int, int]) -> tuple[int, int, int]:
    """Use a user-selected hair colour; no automatic demographic prediction."""
    if not bool(np.any(hair > 0.95)):
        return selected
    pixels = image[..., :3][hair > 0.95]
    if pixels.shape[0] < 8:
        return selected
    # Median is robust against glare and sparse bright pixels. User can override.
    med = np.median(pixels.astype(np.float64), axis=0)
    return tuple(int(np.floor(channel + 0.5)) for channel in med)  # type: ignore[return-value]


def density_from_concealer(hair_mask: np.ndarray, scalp_mask: np.ndarray,
                            *, module_name: str = "plumb_api.engines.concealer") -> np.ndarray:
    """Consume the existing concealer engine ONLY if it exposes density_map.

    Do not silently synthesize a density model under an unverified interface.
    Tests can supply a local fake module through the normal Python import cache.
    """
    if module_name != "plumb_api.engines.concealer":
        raise ValueError("concealer module is fixed to the audited local engine")
    provider = import_module(module_name)
    method = getattr(provider, "density_map", None)
    if not callable(method):
        raise RuntimeError("The installed concealer engine does not expose density_map; provide its cleared density mask")
    value = method(hair_mask, scalp_mask)
    return np.asarray(value)


def render_fibres(image: object, hair_mask: object, scalp_mask: object,
                  density_map: object, anchors: HairAnchors, options: FibreOptions,
                  *, sample_hair_colour: bool = False) -> FibreComparison:
    """Create before/after arrays without mutating any input or making network calls.

    A lower model-estimated density corresponds to greater visible scalp. The
    output alpha is unchanged. Colour metrics compare original fibre *pigment*
    to its reference, not the blend with underlying scalp skin. Graded coverage
    is an illustration, and physical coverage claims need separate validation.
    """
    options.validate()
    original = np.asarray(image)
    if original.dtype != np.uint8 or original.ndim != 3 or original.shape[-1] not in (3, 4):
        raise ValueError("fibre preview requires RGB or RGBA uint8 data")
    h, w = original.shape[:2]
    if h < 8 or w < 8 or h * w > _MAX_PIXELS:
        raise ValueError("fibre preview exceeds safe image bounds")
    hair = _coverage(hair_mask, h, w, "hair_mask")
    scalp = _coverage(scalp_mask, h, w, "scalp_mask")
    density = _coverage(density_map, h, w, "density_map")
    # Scalp AND caller-supplied thinning area are required to authorize a pixel.
    region = region_field(w, h, anchors, options.region)
    eligible = scalp * region * (1.0 - hair)
    before = original.copy()
    after = original.copy()
    colour = _tone_sample(original, hair, options.hair_rgb) if sample_hair_colour else options.hair_rgb
    # Pattern is a purely cosmetic illustration; the same source colour is used
    # at every fleck so pigmentation delta E relative to the selected shade is 0.
    pigment = np.asarray(colour, dtype=np.float64)
    variation = _fibre_pattern(w, h, options.seed)
    coverage = eligible * (1.0 - density) * (options.strength / 100.0) * (
        options.density_gain / 100.0) * variation
    coverage = np.clip(coverage, 0.0, 1.0)
    rgb = original[..., :3].astype(np.float64)
    after[..., :3] = np.floor(rgb * (1.0 - coverage[..., None]) +
                               pigment[None, None, :] * coverage[..., None] + 0.5).astype(np.uint8)
    density_after = np.clip(density + (1.0 - density) * coverage, 0.0, 1.0)
    support = eligible > 0.001
    weight = float(np.sum(eligible))
    if weight > 0:
        ratio_before = float(np.sum((1.0 - density) * eligible) / weight)
        ratio_after = float(np.sum((1.0 - density_after) * eligible) / weight)
    else:
        ratio_before = 0.0
        ratio_after = 0.0
    metrics = FibreMetrics(
        scalp_show_before=ratio_before,
        scalp_show_after=ratio_after,
        coverage_gain=max(0.0, ratio_before - ratio_after),
        colour_delta_e76=colour_delta_e76(colour, options.hair_rgb),
        eligible_pixels=int(np.count_nonzero(support)),
        altered_pixels=int(np.count_nonzero(np.any(after[..., :3] != before[..., :3], axis=2))),
    )
    return FibreComparison(before, after, density.copy(), density_after, metrics)
