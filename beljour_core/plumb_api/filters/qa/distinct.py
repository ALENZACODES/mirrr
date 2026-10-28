"""Distinctness and the A3 properties, so the catalogue can't be padded with copies (§3.4, §5.4).

* distinctness: within one tab, any two recipes at strength 100 must differ on the chart
  atlas by a mean ΔE2000 of at least 2.0 (ASSUMED threshold). A near-duplicate fails.
* properties (A3): strength 0 is bit-identical to the input; the effect grows with strength
  (Q9 on the mean CIE76 change); the output is finite bytes; two runs give the same bytes;
  Protect skin and Background only leave their area unchanged (Q1 inverted).
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from itertools import combinations
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ...quality import metrics
from .. import engine
from ..colour import space as S
from ..recipe import registry
from . import fixtures as F

Floats = NDArray[np.float64]
MIN_DE = 2.0
STOPS = (0, 20, 40, 60, 80, 100)
OFF = engine.Settings(strength=100, guard=False, protect_skin=False, background_only=False)


@dataclass(frozen=True)
class Pair:
    tab: str
    a: str
    b: str
    mean_de: float


def full_strength_lab(recipe: Mapping[str, Any], atlas: np.ndarray | None = None) -> Floats:
    img = F.chart_atlas() if atlas is None else atlas
    return S.srgb_to_lab(S.bytes_to_unit(engine.render(img, recipe, OFF).image))


def pairs(cat: registry.Catalogue | None = None) -> list[Pair]:
    c = cat or registry.default()
    atlas = F.chart_atlas()
    labs = {r["id"]: full_strength_lab(r, atlas) for r in c.recipes}
    out: list[Pair] = []
    for tab in c.tabs():
        for a, b in combinations([r["id"] for r in c.in_tab(tab)], 2):
            out.append(Pair(tab, a, b, float(S.ciede2000(labs[a], labs[b]).mean())))
    return out


def too_close(cat: registry.Catalogue | None = None, minimum: float = MIN_DE) -> list[Pair]:
    return [p for p in pairs(cat) if p.mean_de < minimum]


def lightness_change(before: np.ndarray, after: np.ndarray) -> float:
    lb = S.srgb_to_lab(S.bytes_to_unit(before))[..., 0]
    la = S.srgb_to_lab(S.bytes_to_unit(after))[..., 0]
    return float(np.abs(la - lb).mean())


def effect_curve(recipe: Mapping[str, Any], p: F.Portrait, stops: Sequence[int] = STOPS) -> list[float]:
    """The effect at each stop. Mono looks are black and white at any strength above 0 (their
    mix is a step stage), so their slider sets tone and Q9 is measured on L* alone."""
    mono = recipe["limits"].get("guardMode") == "lightness"
    out = []
    for s in stops:
        res = engine.render(p.image, recipe, engine.Settings(strength=s), p.masks, face_centre=F.face_centre(p))
        out.append(lightness_change(p.image, res.image) if mono else metrics.effect_strength(p.image, res.image))
    return out


def property_problems(recipe: Mapping[str, Any], p: F.Portrait) -> list[str]:
    rid = recipe["id"]
    problems: list[str] = []
    zero = engine.render(p.image, recipe, engine.Settings(strength=0), p.masks)
    if not np.array_equal(zero.image, p.image[..., :3]):
        problems.append(f"{rid}: strength 0 is not bit-identical to the input")
    curve = effect_curve(recipe, p)
    q9 = metrics.q9_monotonic(curve)
    if not q9.passed:
        problems.append(f"{rid}: effect does not grow with strength {np.round(curve, 3).tolist()}")
    a = engine.render(p.image, recipe, engine.Settings(), p.masks, face_centre=F.face_centre(p)).image
    b = engine.render(p.image, recipe, engine.Settings(), p.masks, face_centre=F.face_centre(p)).image
    if not np.array_equal(a, b):
        problems.append(f"{rid}: two runs differ")
    if a.dtype != np.uint8 or a.shape != p.image[..., :3].shape:
        problems.append(f"{rid}: output is not an RGB byte image of the input size")
    return problems


def kept_area_problems(recipe: Mapping[str, Any], p: F.Portrait) -> list[str]:
    """Protect skin and Background only (on) leave their mask's full-alpha pixels unchanged."""
    rid = recipe["id"]
    problems: list[str] = []
    assert p.masks.skin is not None and p.masks.person is not None
    for setting, mask, label in ((engine.Settings(protect_skin=True), p.masks.skin, "Protect skin"),
                                 (engine.Settings(background_only=True), p.masks.person, "Background only")):
        out = engine.render(p.image, recipe, setting, p.masks, face_centre=F.face_centre(p)).image
        inside = mask >= 1.0
        if not np.array_equal(out[inside], p.image[..., :3][inside]):
            problems.append(f"{rid}: {label} changed pixels inside its area")
        q1 = metrics.q1_outside_mask(p.image[..., :3], out, 1.0 - np.asarray(mask, dtype=np.float64), dilate_px=0)
        if not q1.passed:
            problems.append(f"{rid}: {label} fails Q1 on the kept area {q1.measured}")
    return problems
