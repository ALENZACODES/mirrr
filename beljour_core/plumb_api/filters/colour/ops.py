"""The FX1 pointwise colour ops (filters-plan.md §3.3), one registry shared by recipes and the LUT.

Each op maps sRGB-encoded colours in [0, 1] (an (N, 3) array) to new ones and clips its
output to [0, 1], so every op sees a valid colour. Ops work in the space that suits them:

  colour.whiteBalance   linear light, luminance kept (a warm look never lightens by itself)
  colour.exposure       linear light, stops
  colour.contrast       OKLab L, an S-curve through a pivot (0 and 1 fixed, monotone)
  colour.curve          sRGB-encoded, monotone cubic master curve then R, G, B curves
  colour.hsl            OKLCh, eight hue bands (hue turn, chroma scale, lightness)
  colour.saturation     OKLab a, b scaled
  colour.vibrance       OKLab a, b: quiet colours first (or, below 0, the strongest first)
  colour.splitTone      OKLab a, b pushed toward one hue in shadows, another in highlights
  colour.tint           OKLab a, b pushed toward one hue, fading at black and white
  colour.fade           OKLab L lifted at black and lowered at white, chroma eased, shadow tone
  colour.highlightRolloff  OKLab L compressed above a knee (optionally cleaner whites)
  colour.greyWorld      OKLab a, b: half the photo's measured colour cast removed
  colour.tone           OKLab L, separate shadow and highlight lift
  colour.channelMixer   linear light, 3 x 3 matrix (a mono mix has three equal rows)

Parameters in a recipe are the op's values at strength 100. `scale_params` moves each
scalable value from the op's neutral (strength 0) to its target, so strength recomputes the
recipe (plan M8). Hues never scale: a hue is a direction, its amount scales.

`skin_hue` marks ops the missing-mask fallback drops (§2.1: no skin mask means no op that
can turn skin hue); for colour.hsl the fallback zeroes only the red, orange and yellow hue
turns. The TypeScript mirror is web/src/filters/colour/ops.ts, same names and formulas.
OKLab is Ottosson (2020); grey-world balance is Buchsbaum grey world (1980), here "lite"
(half the cast, near-neutral pixels only); concept only, no code copied.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Callable, Mapping
from dataclasses import dataclass, field
from typing import Any

import numpy as np
from numpy.typing import NDArray

from . import curves
from . import space as S

Floats = NDArray[np.float64]
Params = Mapping[str, Any]

BANDS = ("red", "orange", "yellow", "green", "aqua", "blue", "purple", "magenta")
# OKLCh hue angles (degrees) at the centre of each band. sRGB primaries sit near red 29,
# yellow 110, green 142, blue 264; skin tones sit around 45-75 (orange band).
BAND_CENTRES = (25.0, 60.0, 100.0, 140.0, 195.0, 255.0, 295.0, 335.0)
BAND_KEYS = ("hue", "chroma", "light")
SKIN_BANDS = ("red", "orange", "yellow")
BAND_LIMITS = {"hue": 45.0, "chroma": 1.0, "light": 1.0}
CHROMA_GATE = 0.05     # OKLCh chroma below which band edits fade out (greys stay grey)
LIGHT_UNIT = 0.1       # OKLab L per unit of a band's "light"
VIBRANCE_KNEE = 0.2    # OKLCh chroma at which vibrance stops adding
FADE_BLACK, FADE_WHITE, FADE_CHROMA = 0.12, 0.04, 0.25
TONE_UNIT = 0.12


@dataclass(frozen=True)
class Param:
    kind: str                       # number | fixed | angle | points | matrix | bands | stat
    neutral: Any
    lo: float = -math.inf
    hi: float = math.inf
    help: str = ""


@dataclass(frozen=True)
class Op:
    name: str
    family: str                     # colour (pointwise), spatial, light
    params: Mapping[str, Param]
    apply: Callable[..., Floats]
    skin_hue: bool = False
    help: str = ""
    extra: Mapping[str, Any] = field(default_factory=dict)


def num(neutral: float, lo: float, hi: float, help: str = "") -> Param:
    return Param("number", neutral, lo, hi, help)


def fixed(value: float, lo: float, hi: float, help: str = "") -> Param:
    """A setting that doesn't follow strength (a pivot, a knee, a radius): target at any strength."""
    return Param("fixed", value, lo, hi, help)


def angle(neutral: float = 0.0, help: str = "") -> Param:
    return Param("angle", neutral, help=help)


IDENTITY3 = ((1.0, 0.0, 0.0), (0.0, 1.0, 0.0), (0.0, 0.0, 1.0))


# --- op bodies (rgb is (N, 3) sRGB-encoded in [0, 1]) -------------------------------------

def _from_lab(lab: Floats) -> Floats:
    return S.oklab_to_srgb(lab)


def white_balance(rgb: Floats, p: Params) -> Floats:
    lin = S.decode(rgb)
    y0 = S.luminance(lin)
    gains = np.array([2.0 ** (0.3 * p["temperature"]), 2.0 ** (-0.2 * p["tint"]),
                      2.0 ** (-0.3 * p["temperature"])])
    out = lin * gains
    y1 = S.luminance(out)
    scale = np.where(y1 > 1e-12, y0 / np.where(y1 > 1e-12, y1, 1.0), 1.0)
    return S.encode(out * scale[..., None])


def exposure(rgb: Floats, p: Params) -> Floats:
    return S.encode(S.decode(rgb) * 2.0 ** p["ev"])


def contrast_curve(light: Floats, amount: float, pivot: float) -> Floats:
    """S-curve on OKLab L: u - a sin(2 pi u) / (2 pi) after mapping the pivot to u = 0.5."""
    a = min(0.95, max(-0.95, amount))
    L = np.clip(light, 0.0, 1.0)
    u = np.where(L <= pivot, 0.5 * L / pivot, 0.5 + 0.5 * (L - pivot) / (1 - pivot))
    u = u - a * np.sin(2 * math.pi * u) / (2 * math.pi)
    return np.where(u <= 0.5, 2 * u * pivot, pivot + (u - 0.5) * 2 * (1 - pivot))


def contrast(rgb: Floats, p: Params) -> Floats:
    lab = S.srgb_to_oklab(rgb)
    lab[..., 0] = contrast_curve(lab[..., 0], p["amount"], p["pivot"])
    return _from_lab(lab)


def curve(rgb: Floats, p: Params) -> Floats:
    out = rgb.copy()
    if not curves.is_identity(p["master"]):
        out = curves.evaluate(p["master"], out)
    for i, key in enumerate(("r", "g", "b")):
        if not curves.is_identity(p[key]):
            out[..., i] = curves.evaluate(p[key], out[..., i])
    return S.clamp01(out)


def band_weights(hue: Floats) -> Floats:
    """(N, 8) raised-cosine weights over the band centres; each row sums to 1."""
    weights = np.zeros(hue.shape + (len(BAND_CENTRES),))
    n = len(BAND_CENTRES)
    for k, centre in enumerate(BAND_CENTRES):
        nxt = (BAND_CENTRES[(k + 1) % n] - centre) % 360.0
        prv = (centre - BAND_CENTRES[(k - 1) % n]) % 360.0
        d = S.wrap_degrees(hue - centre)
        t = np.where(d >= 0, d / nxt, -d / prv)
        weights[..., k] = np.where(t < 1, 0.5 * (1 + np.cos(math.pi * np.minimum(t, 1.0))), 0.0)
    return weights


def hsl(rgb: Floats, p: Params) -> Floats:
    bands = p["bands"]
    lch = S.oklab_to_oklch(S.srgb_to_oklab(rgb))
    w = band_weights(lch[..., 2]) * S.smoothstep(0.0, CHROMA_GATE, lch[..., 1])[..., None]
    turn = np.zeros(lch.shape[:-1])
    grow = np.zeros(lch.shape[:-1])
    lift = np.zeros(lch.shape[:-1])
    for k, name in enumerate(BANDS):
        entry = bands.get(name)
        if not entry:
            continue
        turn += w[..., k] * entry.get("hue", 0.0)
        grow += w[..., k] * entry.get("chroma", 0.0)
        lift += w[..., k] * entry.get("light", 0.0)
    lch[..., 0] = lch[..., 0] + LIGHT_UNIT * lift
    lch[..., 1] = lch[..., 1] * np.maximum(0.0, 1.0 + grow)
    lch[..., 2] = lch[..., 2] + turn
    return _from_lab(S.oklch_to_oklab(lch))


def saturation(rgb: Floats, p: Params) -> Floats:
    lab = S.srgb_to_oklab(rgb)
    lab[..., 1:] *= max(0.0, 1.0 + p["amount"])
    return _from_lab(lab)


def vibrance(rgb: Floats, p: Params) -> Floats:
    """Positive amounts lift quiet colours most; negative amounts mute the strongest first."""
    lab = S.srgb_to_oklab(rgb)
    c = np.hypot(lab[..., 1], lab[..., 2])
    share = np.minimum(c / VIBRANCE_KNEE, 1.0)
    weight = 1.0 - share if p["amount"] >= 0 else share
    factor = np.maximum(0.0, 1.0 + p["amount"] * weight)
    lab[..., 1:] *= factor[..., None]
    return _from_lab(lab)


def _push(lab: Floats, hue: float, amount: Floats) -> None:
    rad = math.radians(hue)
    lab[..., 1] += amount * math.cos(rad)
    lab[..., 2] += amount * math.sin(rad)


def split_tone(rgb: Floats, p: Params) -> Floats:
    lab = S.srgb_to_oklab(rgb)
    u = np.clip(lab[..., 0], 0.0, 1.0) ** (2.0 ** (-p["balance"]))
    _push(lab, p["shadowHue"], p["shadowAmount"] * (1 - u) ** 2)
    _push(lab, p["highlightHue"], p["highlightAmount"] * u ** 2)
    return _from_lab(lab)


def tint(rgb: Floats, p: Params) -> Floats:
    lab = S.srgb_to_oklab(rgb)
    u = np.clip(lab[..., 0], 0.0, 1.0)
    _push(lab, p["hue"], p["amount"] * (1 - (2 * u - 1) ** 4))
    return _from_lab(lab)


def fade(rgb: Floats, p: Params) -> Floats:
    f = p["amount"]
    lab = S.srgb_to_oklab(rgb)
    u = np.clip(lab[..., 0], 0.0, 1.0)
    lab[..., 0] = FADE_BLACK * f + u * (1 - (FADE_BLACK + FADE_WHITE) * f)
    lab[..., 1:] *= 1 - FADE_CHROMA * f
    _push(lab, p["toneHue"], p["toneAmount"] * (1 - u) ** 2)
    return _from_lab(lab)


def rolloff_curve(light: Floats, amount: float, knee: float) -> Floats:
    L = np.clip(light, 0.0, 1.0)
    x = np.clip((L - knee) / (1 - knee), 0.0, 1.0)
    y = x * (1 - amount * 0.5 * x)
    return np.where(L > knee, knee + y * (1 - knee), L)


def highlight_rolloff(rgb: Floats, p: Params) -> Floats:
    """Highlight shoulder; `chroma` below 0 also cleans colour out of the highlights."""
    lab = S.srgb_to_oklab(rgb)
    knee = p["knee"]
    above = np.clip((np.clip(lab[..., 0], 0.0, 1.0) - knee) / (1 - knee), 0.0, 1.0)
    lab[..., 0] = rolloff_curve(lab[..., 0], p["amount"], knee)
    lab[..., 1:] *= np.maximum(0.0, 1.0 + p["chroma"] * above)[..., None]
    return _from_lab(lab)


CAST_CHROMA_MAX = 0.08   # pixels quieter than this count toward the photo's colour cast
CAST_LIMIT = 0.03        # largest cast (OKLab a or b) the grey-world step will remove
GREY_WORLD_SHARE = 0.5   # "lite": remove half the measured cast at full strength


def photo_cast(rgb: np.ndarray) -> tuple[float, float]:
    """Mean OKLab (a, b) of the near-neutral pixels of a photo: its colour cast."""
    lab = S.srgb_to_oklab(np.asarray(rgb, dtype=np.float64).reshape(-1, 3))
    quiet = np.hypot(lab[:, 1], lab[:, 2]) < CAST_CHROMA_MAX
    if not quiet.any():
        return 0.0, 0.0
    a = float(np.clip(lab[quiet, 1].mean(), -CAST_LIMIT, CAST_LIMIT))
    b = float(np.clip(lab[quiet, 2].mean(), -CAST_LIMIT, CAST_LIMIT))
    return a, b


def grey_world(rgb: Floats, p: Params) -> Floats:
    lab = S.srgb_to_oklab(rgb)
    u = np.clip(lab[..., 0], 0.0, 1.0)
    weight = GREY_WORLD_SHARE * p["amount"] * (1 - (1 - u) ** 4)
    lab[..., 1] -= weight * p["castA"]
    lab[..., 2] -= weight * p["castB"]
    return _from_lab(lab)


def tone_curve(light: Floats, shadows: float, highlights: float) -> Floats:
    L = np.clip(light, 0.0, 1.0)
    return L + TONE_UNIT * 6.75 * (shadows * L * (1 - L) ** 2 + highlights * L * L * (1 - L))


def tone(rgb: Floats, p: Params) -> Floats:
    lab = S.srgb_to_oklab(rgb)
    lab[..., 0] = tone_curve(lab[..., 0], p["shadows"], p["highlights"])
    return _from_lab(lab)


def channel_mixer(rgb: Floats, p: Params) -> Floats:
    m = np.asarray(p["matrix"], dtype=np.float64)
    lin = S.decode(rgb)
    out = np.stack([lin[..., 0] * m[i, 0] + lin[..., 1] * m[i, 1] + lin[..., 2] * m[i, 2] for i in range(3)], axis=-1)
    return S.encode(out)


OPS: dict[str, Op] = {}


def register(op: Op) -> Op:
    if op.name in OPS:
        raise ValueError(f"op {op.name} is registered twice")
    OPS[op.name] = op
    return op


register(Op("colour.whiteBalance", "colour", {"temperature": num(0, -1, 1, "warm +, cool -"),
                                               "tint": num(0, -1, 1, "magenta +, green -")}, white_balance,
            help="White balance in linear light; luminance kept"))
register(Op("colour.exposure", "colour", {"ev": num(0, -2, 2, "stops")}, exposure, help="Exposure in stops"))
register(Op("colour.contrast", "colour", {"amount": num(0, -0.95, 0.95), "pivot": fixed(0.6, 0.2, 0.8)},
            contrast, help="S-curve contrast on OKLab L through a pivot"))
register(Op("colour.curve", "colour", {k: Param("points", curves.IDENTITY) for k in ("master", "r", "g", "b")},
            curve, help="Monotone tone curves"))
register(Op("colour.hsl", "colour", {"bands": Param("bands", {})}, hsl, skin_hue=True,
            help="Eight hue bands in OKLCh"))
register(Op("colour.saturation", "colour", {"amount": num(0, -1, 1)}, saturation, help="Chroma scale"))
register(Op("colour.vibrance", "colour", {"amount": num(0, -1, 1)}, vibrance, help="Chroma scale, low chroma first"))
register(Op("colour.splitTone", "colour", {"shadowHue": angle(), "shadowAmount": num(0, 0, 0.12),
                                            "highlightHue": angle(), "highlightAmount": num(0, 0, 0.12),
                                            "balance": num(0, -1, 1)}, split_tone, skin_hue=True,
            help="Shadow and highlight tints"))
register(Op("colour.tint", "colour", {"hue": angle(), "amount": num(0, 0, 0.12)}, tint, skin_hue=True,
            help="One colour cast, fading at black and white"))
register(Op("colour.fade", "colour", {"amount": num(0, 0, 1), "toneHue": angle(), "toneAmount": num(0, 0, 0.08)},
            fade, help="Lifted blacks, softer whites, eased colour, optional shadow tone"))
register(Op("colour.highlightRolloff", "colour", {"amount": num(0, 0, 1), "knee": fixed(0.7, 0.4, 0.95),
                                                  "chroma": num(0, -1, 0, "below 0 cleans colour out of highlights")},
            highlight_rolloff, help="Highlight shoulder"))
register(Op("colour.greyWorld", "colour", {"amount": num(0, 0, 1),
                                           "castA": Param("stat", 0.0), "castB": Param("stat", 0.0)},
            grey_world, skin_hue=True, help="Removes half the photo's measured colour cast (grey world, lite)",
            extra={"stats": "cast"}))
register(Op("colour.tone", "colour", {"shadows": num(0, -1, 1), "highlights": num(0, -1, 1)}, tone,
            help="Shadow and highlight lift"))
register(Op("colour.channelMixer", "colour", {"matrix": Param("matrix", IDENTITY3, -2, 2)}, channel_mixer,
            help="3 x 3 channel mix in linear light"))


# --- parameter resolution ---------------------------------------------------------------

SCALES = ("linear", "easeIn", "easeOut", "step")


def scale_fraction(scale: str, strength: float) -> float:
    """How far a stage moves toward its target at `strength` in [0, 1]."""
    s = min(1.0, max(0.0, float(strength)))
    if scale == "linear":
        return s
    if scale == "easeIn":
        return s * s
    if scale == "easeOut":
        return 1 - (1 - s) * (1 - s)
    if scale == "step":
        return 1.0 if s > 0 else 0.0
    raise ValueError(f"unknown scale {scale!r}")


def full_params(op: Op, given: Params) -> dict[str, Any]:
    """The op's neutral values, overridden by the recipe's targets."""
    out: dict[str, Any] = {}
    for key, spec in op.params.items():
        value = given.get(key, spec.neutral)
        if spec.kind == "points":
            value = curves.check_points(value)
        elif spec.kind == "bands":
            value = {b: {k: float(v.get(k, 0.0)) for k in BAND_KEYS} for b, v in dict(value).items()}
        elif spec.kind == "matrix":
            value = tuple(tuple(float(x) for x in row) for row in value)
        else:
            value = float(value)
        out[key] = value
    return out


def scale_params(op: Op, target: Params, fraction: float) -> dict[str, Any]:
    """Parameters `fraction` of the way from neutral to target (hues stay at target)."""
    full = full_params(op, target)
    out: dict[str, Any] = {}
    for key, spec in op.params.items():
        value = full[key]
        if spec.kind == "number":
            out[key] = spec.neutral + (value - spec.neutral) * fraction
        elif spec.kind in ("angle", "fixed", "stat"):
            out[key] = value
        elif spec.kind == "points":
            out[key] = curves.at_strength(value, fraction)
        elif spec.kind == "matrix":
            # At full scale the target itself, so a mono mix keeps three identical rows (exact greys).
            out[key] = value if fraction == 1 else tuple(
                tuple(IDENTITY3[i][j] + (value[i][j] - IDENTITY3[i][j]) * fraction for j in range(3)) for i in range(3))
        elif spec.kind == "bands":
            out[key] = {b: {k: v[k] * fraction for k in BAND_KEYS} for b, v in value.items()}
        else:
            raise ValueError(f"unknown parameter kind {spec.kind}")
    return out


def is_neutral(name: str, params: Mapping[str, Any]) -> bool:
    """True when every value that follows strength sits at the op's neutral: the op does nothing.

    Plans drop such stages, so strength 0 (and the identity recipe) bake an exact identity LUT
    and the published OKLab matrices' tiny round-trip error never touches an untouched photo."""
    for key, spec in OPS[name].params.items():
        value = params.get(key, spec.neutral)
        if spec.kind == "number" and float(value) != float(spec.neutral):
            return False
        if spec.kind == "points" and not curves.is_identity(value):
            return False
        if spec.kind == "matrix" and tuple(tuple(float(x) for x in r) for r in value) != IDENTITY3:
            return False
        if spec.kind == "bands" and any(float(v) != 0.0 for e in dict(value).values() for v in dict(e).values()):
            return False
    return True


def without_skin_hue(name: str, params: Mapping[str, Any]) -> dict[str, Any] | None:
    """The missing-mask fallback version of one stage's params, or None to drop the stage."""
    if name == "colour.hsl":
        bands = {b: dict(v) for b, v in params["bands"].items()}
        for b in SKIN_BANDS:
            if b in bands:
                bands[b]["hue"] = 0.0
        return {**params, "bands": bands}
    if OPS[name].skin_hue:
        return None
    return dict(params)


def run(name: str, rgb: np.ndarray, params: Mapping[str, Any]) -> Floats:
    """Apply one pointwise op to (..., 3) sRGB values with fully resolved params."""
    op = OPS[name]
    if op.family != "colour":
        raise ValueError(f"{name} is not a pointwise colour op")
    flat = S.clamp01(np.asarray(rgb, dtype=np.float64)).reshape(-1, 3)
    return S.clamp01(op.apply(flat, params)).reshape(np.shape(rgb))
