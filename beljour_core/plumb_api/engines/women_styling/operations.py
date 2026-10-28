"""Each W feature defines an original deterministic colour/finish plan.

Layer plans always name their authorizing region. Even the highlight and blur
passes are restricted by those masks in the renderer. No learned weights,
training data, brand palette, photo upload, face recognition or medical use.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from .palette import RGB, mix_rgb, pick_swatch, reference_from_outfit
from .requests import PreviewRequest
from .specs import RegionId

Kind = Literal[
    "tint", "light", "shadow", "blur", "matte", "dewy", "cream", "powder",
    "colour_shift", "grain", "strands", "fibres", "gloss",
]
Placement = Literal["uniform", "upper", "lower", "side", "middle", "diagonal", "rounded", "soft"]


@dataclass(frozen=True, slots=True)
class Layer:
    region: RegionId
    kind: Kind
    color: RGB
    opacity: int
    placement: Placement = "uniform"
    scale: int = 100

    def __post_init__(self) -> None:
        if not 0 <= self.opacity <= 100 or not 0 <= self.scale <= 100:
            raise ValueError("Layer strengths must be in 0..100")


def _pair(region_a: RegionId, region_b: RegionId, kind: Kind,
          colour: RGB, opacity: int, placement: Placement = "uniform") -> tuple[Layer, ...]:
    return (Layer(region_a, kind, colour, opacity, placement),
            Layer(region_b, kind, colour, opacity, placement))


def _w4(req: PreviewRequest) -> tuple[Layer, ...]:
    """User-selected undertone: display swatch, no skin-category inference."""
    swatch = pick_swatch(req.variant, depth=req.depth)
    return _pair("cheek_left", "cheek_right", "tint", swatch.rgb, 49, "soft")


def _w5(req: PreviewRequest) -> tuple[Layer, ...]:
    """Three selectable colour harmonies anchored to a supplied outfit swatch."""
    colour = reference_from_outfit(req.outfit_rgb, req.variant)
    lip = mix_rgb(colour, (171, 102, 117), 38)
    return (
        Layer("eyelid_left", "tint", colour, 57, "upper"),
        Layer("eyelid_right", "tint", colour, 57, "upper"),
        Layer("lips", "tint", lip, 49, "uniform"),
    )


def _w7(req: PreviewRequest) -> tuple[Layer, ...]:
    """Concealer follows provided under-eye shapes rather than hardcoded circles."""
    tone: RGB = {
        "brighten": (214, 184, 164),
        "neutral": (177, 151, 141),
        "warm": (199, 157, 124),
    }[req.variant]
    return _pair("under_eye_left", "under_eye_right", "tint", tone, 57, "upper")


def _w8(req: PreviewRequest) -> tuple[Layer, ...]:
    """Colour-wheel hints are fictional corrective swatches, not diagnoses."""
    corrections: dict[str, RGB] = {
        "peach": (220, 148, 119),
        "green": (140, 168, 127),
        "lavender": (178, 152, 194),
    }
    shade = corrections[req.variant]
    return (
        *_pair("under_eye_left", "under_eye_right", "tint", shade, 39, "soft"),
        *_pair("cheek_left", "cheek_right", "tint", shade, 29, "soft"),
    )


def _w9(req: PreviewRequest) -> tuple[Layer, ...]:
    """Distinct cream sheen and powder diffusion on local RGB pixels."""
    if req.variant == "cream":
        return (
            Layer("face", "cream", (0, 0, 0), 88, "uniform"),
            Layer("face", "light", (6, 5, 4), 30, "upper"),
        )
    return (
        Layer("face", "powder", (0, 0, 0), 91, "uniform"),
        Layer("face", "grain", (0, 0, 0), 29, "soft"),
    )


def _w10(req: PreviewRequest) -> tuple[Layer, ...]:
    """Three local finish responses; no change to face geometry."""
    if req.variant == "dewy":
        return (
            Layer("face", "dewy", (0, 0, 0), 96, "upper"),
            Layer("face", "light", (4, 3, 2), 44, "middle"),
        )
    if req.variant == "matte":
        return (
            Layer("face", "matte", (0, 0, 0), 90, "uniform"),
            Layer("face", "powder", (0, 0, 0), 53, "soft"),
        )
    return (
        Layer("face", "tint", (179, 146, 135), 16, "soft"),
        Layer("face", "blur", (0, 0, 0), 38, "uniform"),
    )


def _w11(req: PreviewRequest) -> tuple[Layer, ...]:
    """Soft, lifted and rounded placement fields within user-approved cheeks."""
    if req.variant == "lifted":
        field: Placement = "upper"
    elif req.variant == "rounded":
        field = "rounded"
    elif req.variant == "soft":
        field = "soft"
    else:
        raise ValueError("Unsupported cheek placement")
    shade = (187, 96, 114) if req.variant != "soft" else (196, 139, 141)
    return _pair("cheek_left", "cheek_right", "tint", shade, 64, field)


def _w12(req: PreviewRequest) -> tuple[Layer, ...]:
    """Light/shadow styling, not a simulated change of face structure."""
    if req.variant == "bronze":
        return (
            *_pair("cheek_left", "cheek_right", "tint", (167, 115, 77), 45, "side"),
            Layer("jaw", "light", (5, 2, 0), 30, "lower"),
        )
    if req.variant == "contour":
        return (
            *_pair("cheek_left", "cheek_right", "shadow", (20, 19, 17), 84, "diagonal"),
            Layer("jaw", "shadow", (17, 16, 15), 76, "lower"),
        )
    return (
        *_pair("cheek_left", "cheek_right", "shadow", (11, 10, 8), 51, "soft"),
        Layer("jaw", "shadow", (9, 8, 7), 45, "lower"),
    )


def _w13(req: PreviewRequest) -> tuple[Layer, ...]:
    """A user chosen RGB sample, not a replication of a reference face."""
    shade = req.reference_rgb
    if req.variant == "muted":
        shade = mix_rgb(shade, (136, 119, 118), 58)
    lips = mix_rgb(shade, (158, 93, 118), 30)
    return (
        *_pair("eyelid_left", "eyelid_right", "tint", shade, 60, "upper"),
        *_pair("cheek_left", "cheek_right", "tint", shade, 28, "soft"),
        Layer("lips", "tint", lips, 54, "uniform"),
    )


def _w15(req: PreviewRequest) -> tuple[Layer, ...]:
    """Three authored colour combinations; no claims about weddings or wear."""
    if req.variant == "day":
        eye, cheek, lip = (161, 137, 128), (199, 133, 135), (173, 109, 123)
    elif req.variant == "evening":
        eye, cheek, lip = (111, 86, 125), (171, 94, 126), (124, 72, 103)
    else:
        eye, cheek, lip = (176, 158, 153), (200, 158, 152), (181, 127, 140)
    return (
        *_pair("eyelid_left", "eyelid_right", "tint", eye, 54, "upper"),
        *_pair("cheek_left", "cheek_right", "tint", cheek, 37, "soft"),
        Layer("lips", "tint", lip, 64, "uniform"),
    )


def _w16(req: PreviewRequest) -> tuple[Layer, ...]:
    """Subtle maximum response, always with an accessible strength-zero off."""
    opacity = 18 if req.variant == "minimal" else 34
    return (
        Layer("face", "blur", (0, 0, 0), opacity, "uniform"),
        *_pair("cheek_left", "cheek_right", "tint", (183, 134, 136), opacity, "soft"),
        Layer("lips", "tint", (164, 112, 127), opacity, "uniform"),
    )


def _w17(req: PreviewRequest) -> tuple[Layer, ...]:
    """Hours influence only a fictional colour-shift multiplier."""
    tint: RGB = (12, 10, 8) if req.variant == "warm_shift" else (9, 9, 9)
    return (Layer("face", "colour_shift", tint, 80, "uniform", scale=round(req.hours * 100 / 12)),)


def _w18(req: PreviewRequest) -> tuple[Layer, ...]:
    """Two manually specified fictitious colours and an explicit mixing dial."""
    blended = mix_rgb(req.primary_rgb, req.secondary_rgb, req.mix_percent)
    season_hint: dict[str, RGB] = {
        "spring": (202, 151, 137),
        "summer": (165, 142, 159),
        "autumn": (173, 125, 102),
        "winter": (152, 128, 142),
    }
    result = mix_rgb(blended, season_hint[req.variant], 14)
    return (
        Layer("face", "tint", result, 51, "uniform"),
        Layer("neck", "tint", result, 37, "upper"),
    )


def layers_for(request: PreviewRequest) -> tuple[Layer, ...]:
    request.validate()
    if request.feature_id in {
        "W59", "W60", "W61", "W62", "W63", "W64", "W65", "W66",
        "W67", "W68", "W69", "W70", "W71", "W72", "W73", "W75", "W76",
    }:
        from .eye_layers import layers_for_eyes

        return layers_for_eyes(request)
    if request.feature_id in {
        "W19", "W20", "W21", "W22", "W23", "W24", "W25", "W26", "W27",
        "W29", "W30", "W31", "W32", "W33", "W34", "W35", "W36",
        "W37", "W38", "W40", "W43", "W44",
    }:
        from .hair_layers import layers_for_hair

        return layers_for_hair(request)
    plans = {
        "W4": _w4, "W5": _w5, "W7": _w7, "W8": _w8,
        "W9": _w9, "W10": _w10, "W11": _w11, "W12": _w12,
        "W13": _w13, "W15": _w15, "W16": _w16,
        "W17": _w17, "W18": _w18,
    }
    return plans[request.feature_id](request)
