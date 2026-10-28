"""W59–W76 original, locally masked lash/lid/iris/brow colour studies.

Every operation is restricted to a caller-supplied mask and the shared RGB
channel cap. No eye landmarks, pupil location, skin trait or safety decision
is inferred. W74 serum progress is intentionally unavailable: no efficacy
simulation is made. Author: John Khan.
"""
from __future__ import annotations

from .operations import Kind, Layer, Placement
from .palette import RGB, mix_rgb
from .requests import PreviewRequest
from .specs import RegionId


def _eye_layer(
    region: RegionId,
    kind: Kind,
    color: RGB,
    opacity: int,
    placement: Placement = "uniform",
) -> Layer:
    if type(opacity) is not int or not 0 <= opacity <= 100:
        raise ValueError("Layer intensity outside a safe range")
    return Layer(region, kind, color, opacity, placement)


def _lash_pair(kind: Kind, rgb: RGB, opacity: int, placement: Placement = "uniform") -> tuple[Layer, ...]:
    return (
        _eye_layer("lash_left", kind, rgb, opacity, placement),
        _eye_layer("lash_right", kind, rgb, opacity, placement),
    )


def _lid_pair(kind: Kind, rgb: RGB, opacity: int, placement: Placement = "uniform") -> tuple[Layer, ...]:
    return (
        _eye_layer("lid_left", kind, rgb, opacity, placement),
        _eye_layer("lid_right", kind, rgb, opacity, placement),
    )


def _liner_pair(kind: Kind, rgb: RGB, opacity: int, placement: Placement = "uniform") -> tuple[Layer, ...]:
    return (
        _eye_layer("liner_left", kind, rgb, opacity, placement),
        _eye_layer("liner_right", kind, rgb, opacity, placement),
    )


def _brow_pair(kind: Kind, rgb: RGB, opacity: int, placement: Placement = "uniform") -> tuple[Layer, ...]:
    return (
        _eye_layer("brow_left", kind, rgb, opacity, placement),
        _eye_layer("brow_right", kind, rgb, opacity, placement),
    )


def _lash_extension(req: PreviewRequest) -> tuple[Layer, ...]:
    """W59: matte-dark strand density inside fixed eyelash masks."""
    if req.variant == "natural":
        return (*_lash_pair("shadow", (13, 12, 12), 54),)
    if req.variant == "fan":
        return (*_lash_pair("strands", (33, 30, 32), 71, "side"),)
    return (
        *_lash_pair("strands", (44, 35, 38), 52, "soft"),
        *_lash_pair("shadow", (7, 7, 6), 22, "upper"),
    )


def _lash_reference(req: PreviewRequest) -> tuple[Layer, ...]:
    """W60: geometry-free client-selected styling bands."""
    placement: dict[str, Placement] = {
        "open": "middle",
        "cat": "side",
        "rounded": "rounded",
    }
    return (
        *_lash_pair("shadow", (21, 19, 17), 62, placement[req.variant]),
        *_lash_pair("strands", req.primary_rgb, 23, placement[req.variant]),
    )


def _lash_tint(req: PreviewRequest) -> tuple[Layer, ...]:
    """W61: visual colour response only, never a physical lash lift."""
    if req.variant == "lift":
        return (*_lash_pair("strands", (32, 29, 30), 54, "upper"),)
    if req.variant == "brown":
        return (*_lash_pair("tint", (87, 66, 57), 56),)
    return (*_lash_pair("tint", (39, 38, 40), 72),)


def _cluster_lashes(req: PreviewRequest) -> tuple[Layer, ...]:
    """W62: deterministic RGB grouping, no generated lash silhouette."""
    if req.variant == "strip":
        return (*_lash_pair("strands", (30, 27, 29), 74, "upper"),)
    if req.variant == "cluster":
        return (*_lash_pair("fibres", (37, 33, 36), 67),)
    return (*_lash_pair("shadow", (8, 7, 7), 37, "soft"),)


def _mascara(req: PreviewRequest) -> tuple[Layer, ...]:
    """W63: three cosmetic colour textures without wear predictions."""
    if req.variant == "length":
        return (*_lash_pair("strands", (35, 32, 34), 59, "upper"),)
    if req.variant == "volume":
        return (
            *_lash_pair("shadow", (18, 17, 17), 72),
            *_lash_pair("strands", (37, 34, 33), 24),
        )
    return (*_lash_pair("tint", (95, 76, 73), 29, "soft"),)


def _eyeliner_wing(req: PreviewRequest) -> tuple[Layer, ...]:
    """W64: client-drawn wing region, not extrapolated geometry."""
    if req.variant == "short":
        return (*_liner_pair("tint", (50, 43, 49), 64, "middle"),)
    if req.variant == "long":
        return (*_liner_pair("tint", (48, 40, 53), 77, "side"),)
    return (*_liner_pair("blur", (0, 0, 0), 36, "soft"),)


def _graphic_liner(req: PreviewRequest) -> tuple[Layer, ...]:
    """W65: bounded colour and blur, always under user-drawn liner masks."""
    if req.variant == "graphic":
        return (
            *_liner_pair("tint", (51, 36, 69), 80),
            *_lid_pair("shadow", (4, 4, 5), 20, "side"),
        )
    if req.variant == "smoke":
        return (
            *_liner_pair("blur", (0, 0, 0), 57),
            *_lid_pair("shadow", (12, 9, 12), 48, "soft"),
        )
    return (*_liner_pair("shadow", (24, 22, 24), 45, "upper"),)


def _shadow_techniques(req: PreviewRequest) -> tuple[Layer, ...]:
    """W66: original RGB swatches with three placement fields."""
    colour = mix_rgb(req.primary_rgb, req.secondary_rgb, req.mix_percent)
    if req.variant == "halo":
        return (*_lid_pair("tint", colour, 64, "rounded"),)
    if req.variant == "crease":
        return (*_lid_pair("tint", colour, 58, "upper"),)
    return (*_lid_pair("tint", colour, 39, "soft"),)


def _duochrome(req: PreviewRequest) -> tuple[Layer, ...]:
    """W67: local finite highlight, not physical optical material rendering."""
    if req.variant == "foil":
        return (
            *_lid_pair("tint", req.secondary_rgb, 44),
            *_lid_pair("gloss", (6, 6, 6), 72, "middle"),
        )
    if req.variant == "duochrome":
        return (
            _eye_layer("lid_left", "tint", req.primary_rgb, 53, "side"),
            _eye_layer("lid_right", "tint", req.secondary_rgb, 53, "side"),
            *_lid_pair("gloss", (3, 4, 5), 44),
        )
    return (*_lid_pair("gloss", (4, 4, 4), 33, "soft"),)


def _iris_colour(req: PreviewRequest) -> tuple[Layer, ...]:
    """W68: cosmetic iris tint only; caller must exclude iris pupil."""
    shades: dict[str, RGB] = {
        "blue": (100, 142, 177),
        "hazel": (158, 135, 91),
        "violet": (139, 121, 166),
    }
    return (
        _eye_layer("iris_left", "tint", shades[req.variant], 61),
        _eye_layer("iris_right", "tint", shades[req.variant], 61),
    )


def _brow_tint(req: PreviewRequest) -> tuple[Layer, ...]:
    """W69: three independent fictional brow swatches."""
    colours: dict[str, RGB] = {
        "warm": (114, 83, 63),
        "cool": (92, 93, 104),
        "deep": (58, 48, 47),
    }
    return (*_brow_pair("tint", colours[req.variant], 66),)


def _brow_lamination(req: PreviewRequest) -> tuple[Layer, ...]:
    """W70: strand-reflection direction, with unchanged pixel locations."""
    if req.variant == "raised":
        return (*_brow_pair("strands", (62, 51, 46), 67, "upper"),)
    if req.variant == "feathered":
        return (*_brow_pair("fibres", (72, 61, 54), 58, "side"),)
    return (*_brow_pair("blur", (0, 0, 0), 30, "soft"),)


def _microblading(req: PreviewRequest) -> tuple[Layer, ...]:
    """W71: cosmetic textured-colour study, no procedural advice."""
    colour = mix_rgb(req.primary_rgb, (75, 59, 56), 42)
    if req.variant == "hair-stroke":
        return (*_brow_pair("strands", colour, 63, "side"),)
    if req.variant == "soft":
        return (*_brow_pair("tint", colour, 33),)
    return (
        *_brow_pair("strands", colour, 76),
        *_brow_pair("shadow", (6, 5, 5), 21),
    )


def _nano_brow(req: PreviewRequest) -> tuple[Layer, ...]:
    """W72: powder versus fine, deterministic and additive RGB textures."""
    shade = mix_rgb(req.primary_rgb, (96, 74, 66), 37)
    if req.variant == "powder":
        return (*_brow_pair("fibres", shade, 61),)
    if req.variant == "nano":
        return (*_brow_pair("strands", shade, 54),)
    return (
        *_brow_pair("tint", shade, 34, "upper"),
        *_brow_pair("fibres", shade, 29, "lower"),
    )


def _brow_reference(req: PreviewRequest) -> tuple[Layer, ...]:
    """W73: no face-shape classifier; user chooses editorial placement."""
    field: dict[str, Placement] = {
        "soft-arch": "rounded",
        "straight": "uniform",
        "high-arch": "upper",
    }
    return (
        *_brow_pair("shadow", (18, 15, 14), 53, field[req.variant]),
        *_brow_pair("gloss", (4, 3, 3), 31, field[req.variant]),
    )


def _eye_type_layout(req: PreviewRequest) -> tuple[Layer, ...]:
    """W75: editorial choices are voluntary, never detected from images."""
    if req.variant == "hooded":
        return (
            *_lid_pair("tint", (155, 122, 153), 49, "upper"),
            *_liner_pair("shadow", (14, 11, 14), 48, "side"),
        )
    if req.variant == "monolid":
        return (
            *_lid_pair("tint", (138, 123, 168), 54, "middle"),
            *_liner_pair("tint", (69, 58, 93), 46, "upper"),
        )
    return (
        *_lid_pair("tint", (173, 141, 135), 43, "rounded"),
        *_liner_pair("blur", (0, 0, 0), 39, "soft"),
    )


def _colour_pair(req: PreviewRequest) -> tuple[Layer, ...]:
    """W76: locally paired eyeliner and mascara screen swatches."""
    colours: dict[str, RGB] = {
        "plum": (108, 69, 116),
        "navy": (74, 98, 147),
        "bronze": (163, 120, 78),
    }
    swatch = colours[req.variant]
    lash_colour = mix_rgb(swatch, (64, 54, 56), 51)
    return (
        *_liner_pair("tint", swatch, 65),
        *_lash_pair("tint", lash_colour, 52),
    )


_EYE_PLANS = {
    "W59": _lash_extension,
    "W60": _lash_reference,
    "W61": _lash_tint,
    "W62": _cluster_lashes,
    "W63": _mascara,
    "W64": _eyeliner_wing,
    "W65": _graphic_liner,
    "W66": _shadow_techniques,
    "W67": _duochrome,
    "W68": _iris_colour,
    "W69": _brow_tint,
    "W70": _brow_lamination,
    "W71": _microblading,
    "W72": _nano_brow,
    "W73": _brow_reference,
    "W75": _eye_type_layout,
    "W76": _colour_pair,
}


def layers_for_eyes(request: PreviewRequest) -> tuple[Layer, ...]:
    """Fail closed for unsupported features; body masks are never fallback."""
    request.validate()
    try:
        plan = _EYE_PLANS[request.feature_id]
    except KeyError as exc:
        raise ValueError("Unknown or disallowed eye makeup simulation") from exc
    return plan(request)
