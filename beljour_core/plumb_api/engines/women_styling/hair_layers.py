"""Original W19–W27 hair-colour and fibre screen-simulation plans.

No geometry is inferred here: the caller must supply a cleared region mask.
Plans never assert that a physical extension, wig, dye or product will behave
like the illustration. They return layers that the common masked renderer
limits to its source alpha and channel-delta bounds.

Author: John Khan.
"""
from __future__ import annotations

from .operations import Kind, Layer, Placement
from .palette import RGB, mix_rgb
from .requests import PreviewRequest
from .specs import RegionId


def _layer(
    region: RegionId,
    kind: Kind,
    colour: RGB,
    opacity: int,
    placement: Placement = "uniform",
    scale: int = 100,
) -> Layer:
    """Construct a typed layer via the audited plan contract."""
    approved: frozenset[str] = frozenset({
        "hair", "roots", "tips", "crown", "hair_left", "hair_right",
        "scalp", "hairline", "fringe",
    })
    if region not in approved:
        raise ValueError("Unsupported hair mask region")
    return Layer(region, kind, colour, opacity, placement, scale)


def _clip_in(req: PreviewRequest) -> tuple[Layer, ...]:
    """W19: distinguish tip-toning, edge strands and a subdued frame band."""
    tone = mix_rgb(req.primary_rgb, req.secondary_rgb, req.mix_percent)
    if req.variant == "soft-volume":
        return (
            _layer("hair", "strands", tone, 38, "lower"),
            _layer("tips", "tint", tone, 33, "lower"),
        )
    if req.variant == "long-ribbon":
        return (
            _layer("hair", "strands", tone, 61, "side"),
            _layer("tips", "gloss", (6, 6, 5), 58, "lower"),
        )
    return (
        _layer("hair", "tint", tone, 38, "side"),
        _layer("tips", "strands", tone, 39, "side"),
    )


def _weft(req: PreviewRequest) -> tuple[Layer, ...]:
    """W20: local weft texture without synthesizing outside the hair mask."""
    tone = mix_rgb(req.primary_rgb, req.secondary_rgb, 35)
    if req.variant == "tape":
        return (
            _layer("hair", "strands", tone, 56, "upper"),
            _layer("hair_left", "shadow", (9, 7, 5), 38, "side"),
            _layer("hair_right", "shadow", (9, 7, 5), 38, "side"),
        )
    if req.variant == "sew":
        return (
            _layer("hair", "strands", tone, 68, "lower"),
            _layer("hair_left", "tint", tone, 28, "lower"),
            _layer("hair_right", "tint", tone, 28, "lower"),
        )
    return (
        _layer("hair", "strands", tone, 26, "uniform"),
        _layer("hair_left", "gloss", (4, 4, 3), 22),
        _layer("hair_right", "gloss", (4, 4, 3), 22),
    )


def _topper(req: PreviewRequest) -> tuple[Layer, ...]:
    """W21: screened roots/crown transitions, no false hair creation claim."""
    tone = mix_rgb(req.primary_rgb, req.secondary_rgb, req.mix_percent)
    if req.variant == "feathered":
        return (
            _layer("crown", "strands", tone, 43, "rounded"),
            _layer("roots", "tint", tone, 31, "upper"),
        )
    if req.variant == "dense":
        return (
            _layer("crown", "fibres", tone, 64, "middle"),
            _layer("roots", "strands", tone, 56, "upper"),
        )
    return (
        _layer("crown", "tint", tone, 23, "soft"),
        _layer("roots", "strands", tone, 24, "soft"),
    )


def _wig(req: PreviewRequest) -> tuple[Layer, ...]:
    """W22: recolour an explicit fashion-wig region, not a new silhouette."""
    if req.variant == "natural":
        return (
            _layer("hair", "tint", req.primary_rgb, 41),
            _layer("fringe", "gloss", (7, 7, 6), 40, "side"),
        )
    if req.variant == "bold":
        return (
            _layer("hair", "tint", req.secondary_rgb, 84),
            _layer("fringe", "tint", req.secondary_rgb, 56),
            _layer("hair", "strands", req.secondary_rgb, 27),
        )
    return (
        _layer("hair", "tint", mix_rgb(req.primary_rgb, req.secondary_rgb, 44), 48),
        _layer("fringe", "blur", (0, 0, 0), 27),
    )


def _root_touch_up(req: PreviewRequest) -> tuple[Layer, ...]:
    """W23: a visible reversible root overlay bounded by user paint."""
    tone = req.primary_rgb
    if req.variant == "powder":
        return (
            _layer("roots", "fibres", tone, 66, "upper"),
            _layer("hairline", "tint", tone, 34, "soft"),
        )
    if req.variant == "mist":
        return (
            _layer("roots", "tint", tone, 52, "soft"),
            _layer("hairline", "strands", tone, 28, "upper"),
        )
    return (
        _layer("roots", "tint", tone, 24, "uniform"),
        _layer("hairline", "blur", (0, 0, 0), 26, "soft"),
    )


def _scalp_cover(req: PreviewRequest) -> tuple[Layer, ...]:
    """W24: screen-only concealer; never an inference about hair density."""
    tone = req.primary_rgb
    if req.variant == "soft-shade":
        return (
            _layer("scalp", "tint", tone, 51, "soft"),
            _layer("hairline", "tint", tone, 37, "soft"),
        )
    if req.variant == "fine-grain":
        return (
            _layer("scalp", "fibres", tone, 51),
            _layer("hairline", "strands", tone, 43, "upper"),
        )
    return (
        _layer("scalp", "tint", mix_rgb(tone, (129, 108, 102), 54), 35),
        _layer("hairline", "tint", tone, 26),
    )


def _fibres(req: PreviewRequest) -> tuple[Layer, ...]:
    """W25: exact reproducible dot pattern with three intensities."""
    level: dict[str, int] = {"sparse": 29, "medium": 51, "full": 76}
    opacity = level[req.variant]
    return (
        _layer("scalp", "fibres", req.primary_rgb, opacity),
        _layer("crown", "strands", req.primary_rgb, round(opacity * 0.62), "rounded"),
    )


def _tint(req: PreviewRequest) -> tuple[Layer, ...]:
    """W26: predictable alternate colour choices, never product chemistry."""
    colour = mix_rgb(req.primary_rgb, req.secondary_rgb, req.mix_percent)
    if req.variant == "soft":
        return (
            _layer("hair", "tint", colour, 45),
            _layer("tips", "tint", req.secondary_rgb, 27, "lower"),
        )
    if req.variant == "vivid":
        return (
            _layer("hair", "tint", req.secondary_rgb, 79),
            _layer("tips", "gloss", (6, 6, 6), 35, "lower"),
        )
    return (
        _layer("hair", "tint", colour, 31),
        _layer("tips", "blur", (0, 0, 0), 28, "lower"),
    )


def _toner(req: PreviewRequest) -> tuple[Layer, ...]:
    """W27: three distinct local screen warmth/reflection responses."""
    if req.variant == "cool":
        return (
            _layer("hair", "tint", (114, 130, 157), 28),
            _layer("tips", "gloss", (5, 6, 9), 35, "lower"),
        )
    if req.variant == "warm":
        return (
            _layer("hair", "tint", (182, 146, 116), 30),
            _layer("tips", "gloss", (8, 6, 3), 40, "lower"),
        )
    return (
        _layer("hair", "gloss", (6, 6, 6), 52),
        _layer("tips", "blur", (0, 0, 0), 21),
    )

def _money_piece(req: PreviewRequest) -> tuple[Layer, ...]:
    """W29: face-framing colour placement, never a geometry detector."""
    light = mix_rgb(req.primary_rgb, (208, 174, 147), 57)
    if req.variant == "soft":
        return (
            _layer("hair_left", "tint", light, 38, "side"),
            _layer("hair_right", "tint", light, 38, "side"),
        )
    if req.variant == "contrast":
        return (
            _layer("hair_left", "tint", light, 73, "upper"),
            _layer("hair_right", "tint", light, 73, "upper"),
            _layer("fringe", "gloss", (6, 5, 4), 52),
        )
    return (
        _layer("hair_left", "strands", light, 49),
        _layer("hair_right", "strands", light, 49),
        _layer("fringe", "tint", light, 18),
    )


def _foil_layout(req: PreviewRequest) -> tuple[Layer, ...]:
    """W30: three different authored texture/colour reference plans."""
    dark = mix_rgb(req.primary_rgb, (78, 67, 64), 43)
    bright = mix_rgb(req.secondary_rgb, (211, 179, 143), 54)
    if req.variant == "lowlights":
        return (
            _layer("hair", "strands", dark, 69),
            _layer("hair_left", "shadow", (11, 8, 7), 39),
            _layer("hair_right", "shadow", (11, 8, 7), 39),
        )
    if req.variant == "babylights":
        return (
            _layer("hair", "strands", bright, 41, "upper"),
            _layer("hair_left", "gloss", (4, 4, 3), 37),
            _layer("hair_right", "gloss", (4, 4, 3), 37),
        )
    return (
        _layer("hair", "strands", bright, 78, "side"),
        _layer("hair_left", "tint", bright, 23, "diagonal"),
        _layer("hair_right", "tint", bright, 23, "diagonal"),
    )


def _chunky_highlights(req: PreviewRequest) -> tuple[Layer, ...]:
    """W31: separation between bold highlights and lived-in soft colour."""
    bright = mix_rgb(req.secondary_rgb, (224, 186, 151), 34)
    if req.variant == "chunky":
        return (
            _layer("hair", "strands", bright, 83, "side"),
            _layer("tips", "tint", bright, 35, "lower"),
        )
    if req.variant == "lived-in":
        return (
            _layer("hair", "strands", bright, 49, "lower"),
            _layer("tips", "tint", bright, 59, "lower"),
        )
    return (
        _layer("hair", "tint", bright, 21),
        _layer("tips", "blur", (0, 0, 0), 28, "lower"),
    )


def _grey_blend(req: PreviewRequest) -> tuple[Layer, ...]:
    """W32: artificial grey palettes, not a biological-age inference."""
    if req.variant == "silver":
        tone: RGB = (186, 193, 202)
    elif req.variant == "smoke":
        tone = (144, 147, 155)
    else:
        tone = mix_rgb(req.primary_rgb, (177, 172, 175), 45)
    return (
        _layer("hair", "tint", tone, 37, "soft"),
        _layer("roots", "strands", tone, 48, "upper"),
        _layer("tips", "gloss", (5, 5, 5), 27, "lower"),
    )


def _grey_storyboard(req: PreviewRequest) -> tuple[Layer, ...]:
    """W33: no clock, lifetime or timeline outcome is inferred."""
    mixture: dict[str, int] = {"early": 18, "middle": 49, "late": 82}
    grey = mix_rgb(req.primary_rgb, (188, 190, 190), mixture[req.variant])
    return (
        _layer("roots", "tint", grey, 61, "upper"),
        _layer("hair", "strands", grey, 42, "uniform"),
        _layer("tips", "tint", grey, 27, "lower"),
    )


def _colour_melt(req: PreviewRequest) -> tuple[Layer, ...]:
    """W34: separate upper/middle/lower masks, never new hair volume."""
    middle = mix_rgb(req.primary_rgb, req.secondary_rgb, 48)
    if req.variant == "seamless":
        return (
            _layer("roots", "tint", req.primary_rgb, 56, "upper"),
            _layer("hair", "tint", middle, 43, "diagonal"),
            _layer("tips", "tint", req.secondary_rgb, 65, "lower"),
        )
    if req.variant == "contrast":
        return (
            _layer("roots", "tint", req.primary_rgb, 70, "upper"),
            _layer("hair", "strands", middle, 48),
            _layer("tips", "tint", req.secondary_rgb, 83, "lower"),
        )
    cool = mix_rgb(middle, (128, 139, 168), 42)
    return (
        _layer("roots", "tint", req.primary_rgb, 51),
        _layer("hair", "tint", cool, 43),
        _layer("tips", "gloss", (5, 6, 10), 53, "lower"),
    )


def _split_dye(req: PreviewRequest) -> tuple[Layer, ...]:
    """W35: left and right independent masks; no part-line detection."""
    left = req.primary_rgb
    right = req.secondary_rgb
    if req.variant == "balanced":
        return (
            _layer("hair_left", "tint", left, 67),
            _layer("hair_right", "tint", right, 67),
            _layer("fringe", "strands", mix_rgb(left, right, 50), 22),
        )
    if req.variant == "left-bright":
        return (
            _layer("hair_left", "tint", left, 84, "upper"),
            _layer("hair_right", "tint", right, 41),
            _layer("fringe", "gloss", (5, 5, 4), 35, "side"),
        )
    return (
        _layer("hair_left", "tint", left, 40),
        _layer("hair_right", "tint", right, 84, "upper"),
        _layer("fringe", "strands", right, 34),
    )


def _peekaboo(req: PreviewRequest) -> tuple[Layer, ...]:
    """W36: underlayers must be hand painted; no movement prediction."""
    accent = req.secondary_rgb
    if req.variant == "underlayer":
        return (
            _layer("hair", "strands", accent, 24, "lower"),
            _layer("tips", "tint", accent, 71, "lower"),
        )
    if req.variant == "side-slice":
        return (
            _layer("hair_left", "tint", accent, 62, "side"),
            _layer("hair_right", "tint", accent, 48, "side"),
        )
    return (
        _layer("tips", "tint", accent, 32, "soft"),
        _layer("hair", "blur", (0, 0, 0), 21, "lower"),
    )


def _fringe_preview(req: PreviewRequest) -> tuple[Layer, ...]:
    """W37: strand orientation is a visible tonal cue, not generated fringe."""
    shade = mix_rgb(req.primary_rgb, req.secondary_rgb, 31)
    if req.variant == "curtain":
        return (
            _layer("fringe", "strands", shade, 58, "side"),
            _layer("hairline", "shadow", (8, 7, 7), 25, "side"),
        )
    if req.variant == "wispy":
        return (
            _layer("fringe", "strands", shade, 34, "soft"),
            _layer("hairline", "blur", (0, 0, 0), 24),
        )
    return (
        _layer("fringe", "tint", shade, 43, "upper"),
        _layer("hairline", "strands", shade, 36, "uniform"),
    )


def _cut_reference(req: PreviewRequest) -> tuple[Layer, ...]:
    """W38: only tonal length annotations; source silhouette is unchanged."""
    tone = mix_rgb(req.primary_rgb, (155, 130, 116), 34)
    if req.variant == "bob":
        return (
            _layer("hair", "gloss", (5, 5, 4), 49, "lower"),
            _layer("tips", "strands", tone, 38, "lower"),
        )
    if req.variant == "crop":
        return (
            _layer("fringe", "tint", tone, 45, "upper"),
            _layer("hair", "strands", tone, 44, "upper"),
        )
    return (
        _layer("hair", "strands", tone, 57, "diagonal"),
        _layer("tips", "gloss", (6, 6, 5), 41, "lower"),
    )


def _curl_definition(req: PreviewRequest) -> tuple[Layer, ...]:
    """W40: colour-frequency illustration, not an algorithm creating curls."""
    if req.variant == "definition":
        return (
            _layer("hair", "strands", req.primary_rgb, 37),
            _layer("hair_left", "gloss", (4, 4, 4), 26),
            _layer("hair_right", "gloss", (4, 4, 4), 26),
        )
    if req.variant == "soft-frizz":
        return (
            _layer("hair", "blur", (0, 0, 0), 42),
            _layer("hair_left", "blur", (0, 0, 0), 29),
            _layer("hair_right", "blur", (0, 0, 0), 29),
        )
    return (
        _layer("hair", "gloss", (6, 6, 6), 48),
        _layer("hair_left", "strands", req.primary_rgb, 19),
        _layer("hair_right", "strands", req.primary_rgb, 19),
    )


def _heat_styling(req: PreviewRequest) -> tuple[Layer, ...]:
    """W43: fictional ribbon textures, no heat effect or safety prediction."""
    if req.variant == "waves":
        return (
            _layer("hair", "strands", req.primary_rgb, 56, "diagonal"),
            _layer("tips", "gloss", (5, 5, 5), 38, "lower"),
        )
    if req.variant == "straight":
        return (
            _layer("hair", "strands", req.primary_rgb, 41, "uniform"),
            _layer("tips", "blur", (0, 0, 0), 28),
        )
    return (
        _layer("hair", "gloss", (8, 7, 6), 51, "upper"),
        _layer("tips", "strands", req.primary_rgb, 31),
    )


def _humidity_scenario(req: PreviewRequest) -> tuple[Layer, ...]:
    """W44: manually selected hypothetical conditions, never a forecast."""
    if req.variant == "dry":
        return (
            _layer("hair", "gloss", (3, 3, 3), 43),
            _layer("tips", "strands", req.primary_rgb, 32),
        )
    if req.variant == "humid":
        return (
            _layer("hair", "blur", (0, 0, 0), 37),
            _layer("tips", "strands", req.primary_rgb, 21, "lower"),
        )
    return (
        _layer("hair", "blur", (0, 0, 0), 55),
        _layer("tips", "gloss", (8, 8, 9), 44, "lower"),
    )


_HAIR_PLANS = {
    "W19": _clip_in,
    "W20": _weft,
    "W21": _topper,
    "W22": _wig,
    "W23": _root_touch_up,
    "W24": _scalp_cover,
    "W25": _fibres,
    "W26": _tint,
    "W27": _toner,
    "W29": _money_piece,
    "W30": _foil_layout,
    "W31": _chunky_highlights,
    "W32": _grey_blend,
    "W33": _grey_storyboard,
    "W34": _colour_melt,
    "W35": _split_dye,
    "W36": _peekaboo,
    "W37": _fringe_preview,
    "W38": _cut_reference,
    "W40": _curl_definition,
    "W43": _heat_styling,
    "W44": _humidity_scenario,
}


def layers_for_hair(request: PreviewRequest) -> tuple[Layer, ...]:
    """The shared request validation enforces each W's exact variant set."""
    request.validate()
    try:
        plan = _HAIR_PLANS[request.feature_id]
    except KeyError as exc:
        raise ValueError("Unregistered hair screen simulation") from exc
    return plan(request)
