"""Python -> TypeScript parity vectors for the FX1 kernels (A5; parity/filters-fx1.json).

`build()` writes, from the Python kernels, everything the browser must reproduce:

* every pointwise op on 64 seeded colours (greys and cube corners included), several settings each
* curve tangents and values, the eight hue-band weights, the photo colour cast
* every recipe's LUT at strength 30 and 100: 40 fixed lattice points plus the sum of all values
* tetrahedral apply on 256 random colours through two LUTs
* glow and position light on a small chart block, whole and as an offset tile
* the guard on drawn faces of three tones, both modes
* full renders of drawn faces with mesh masks under default, strong, Protect skin, Background
  only, guard off, a preset, the Fade add-on, and the no-mask fallback

Tolerances on the TypeScript side: LUT values 1e-5, op outputs 1e-9, bytes within one level.
`make filters-data` regenerates in memory and fails if the committed file has drifted.
Author: John Khan.
"""
from __future__ import annotations

import base64
import json
import math
from collections.abc import Mapping
from pathlib import Path
from typing import Any

import numpy as np

from . import engine, oplist
from .colour import curves
from .colour import lut as LUT
from .colour import ops as O
from .colour import space as S
from .frame import Frame
from .masks import blend
from .masks import guard as G
from .qa import fixtures as F
from .recipe import registry

FORMAT = "beljour-parity-filters/1"
REPO = Path(__file__).resolve().parents[3]
PATH = REPO / "parity/filters-fx1.json"
DECIMALS = 12
LUT_POINTS = 40
SEED = 20261023


def num(x: float) -> float:
    return round(float(x), DECIMALS)


def nums(a: np.ndarray) -> list[Any]:
    return np.round(np.asarray(a, dtype=np.float64), DECIMALS).tolist()


def b64(img: np.ndarray) -> str:
    return base64.b64encode(np.ascontiguousarray(img, dtype=np.uint8).tobytes()).decode("ascii")


def colours() -> np.ndarray:
    rng = np.random.default_rng(SEED)
    fixed = [[0, 0, 0], [1, 1, 1], [0.5, 0.5, 0.5], [119 / 255] * 3, [1, 0, 0], [0, 1, 0], [0, 0, 1],
             [1, 1, 0], [0, 1, 1], [1, 0, 1], [0.93, 0.82, 0.75], [0.44, 0.28, 0.2], [0.27, 0.17, 0.13],
             [0.75, 0.55, 0.41], [0.2, 0.2, 0.2], [0.8, 0.8, 0.8]]
    return np.vstack([np.array(fixed, dtype=np.float64), rng.random((64 - len(fixed), 3))])


OP_CASES: dict[str, list[dict[str, Any]]] = {
    "colour.whiteBalance": [{"temperature": 0.4}, {"temperature": -0.6, "tint": 0.3}],
    "colour.exposure": [{"ev": 0.35}, {"ev": -0.8}],
    "colour.contrast": [{"amount": 0.5}, {"amount": -0.4, "pivot": 0.45}],
    "colour.curve": [{"master": [[0, 0.05], [0.4, 0.35], [1, 0.95]]},
                     {"r": [[0, 0], [0.25, 0.2], [0.75, 0.82], [1, 1]], "b": [[0, 0.06], [0.5, 0.48], [1, 0.92]]}],
    "colour.hsl": [{"bands": {"red": {"hue": 10, "chroma": 0.3, "light": 0.2}, "blue": {"hue": -15, "chroma": -0.4}}},
                   {"bands": {"orange": {"chroma": -0.5, "light": -0.3}, "green": {"hue": 20, "chroma": 0.6},
                              "magenta": {"hue": 30, "light": 0.5}}}],
    "colour.saturation": [{"amount": 0.4}, {"amount": -0.7}],
    "colour.vibrance": [{"amount": 0.6}, {"amount": -0.5}],
    "colour.splitTone": [{"shadowHue": 225, "shadowAmount": 0.05, "highlightHue": 70, "highlightAmount": 0.04},
                         {"shadowHue": 310, "shadowAmount": 0.03, "highlightHue": 355, "highlightAmount": 0.06,
                          "balance": -0.4}],
    "colour.tint": [{"hue": 88, "amount": 0.04}, {"hue": 285, "amount": 0.08}],
    "colour.fade": [{"amount": 0.5}, {"amount": 0.8, "toneHue": 95, "toneAmount": 0.05}],
    "colour.highlightRolloff": [{"amount": 1.0, "knee": 0.6}, {"amount": 0.4, "chroma": -0.7}],
    "colour.tone": [{"shadows": 0.6, "highlights": -0.4}, {"shadows": -0.8}],
    "colour.channelMixer": [{"matrix": [[0.2126, 0.7152, 0.0722]] * 3},
                            {"matrix": [[1.1, -0.1, 0.0], [0.05, 0.9, 0.05], [0.0, 0.2, 0.8]]}],
    "colour.greyWorld": [{"amount": 0.8, "castA": 0.012, "castB": 0.02}, {"amount": 0.3, "castA": -0.02, "castB": 0.0}],
}


def op_vectors() -> list[dict[str, Any]]:
    rgb = colours()
    out = []
    for name, cases in OP_CASES.items():
        op = oplist.op(name)
        for given in cases:
            stats = {k: v for k, v in given.items() if op.params[k].kind == "stat"}
            recipe_params = {k: v for k, v in given.items() if k not in stats}
            params = {**O.full_params(op, recipe_params), **stats}
            out.append({"op": name, "params": params, "out": nums(O.run(name, rgb, params))})
    return out


def scale_vectors() -> list[dict[str, Any]]:
    out = []
    for name in ("colour.contrast", "colour.curve", "colour.hsl", "colour.channelMixer", "colour.splitTone"):
        op = oplist.op(name)
        target = OP_CASES[name][-1]
        for scale in O.SCALES:
            for s in (0.0, 0.3, 1.0):
                f = O.scale_fraction(scale, s)
                out.append({"op": name, "target": target, "scale": scale, "strength": s,
                            "params": O.scale_params(op, target, f)})
    return out


def curve_vectors() -> list[dict[str, Any]]:
    xs = np.linspace(-0.05, 1.05, 45)
    cases: list[list[list[float]]] = [[[0, 0.05], [0.4, 0.35], [1, 0.95]], [[0, 0], [0.25, 0.2], [0.75, 0.82], [1, 1]],
             [[0.1, 0.0], [0.2, 0.9], [0.3, 0.92], [0.9, 1.0]], [[0, 0.5], [1, 0.5]],
             [[0, 0], [0.5, 0.0], [0.6, 1.0], [1.0, 1.0]]]
    return [{"points": c, "tangents": nums(np.array(curves.tangents(curves.check_points(c)))),
             "x": nums(xs), "y": nums(curves.evaluate(curves.check_points(c), xs))} for c in cases]


def band_vectors() -> dict[str, Any]:
    hues = np.array([0, 10, 25, 42.5, 60, 80, 100, 120, 140, 170, 195, 225, 255, 275, 295, 315, 335, 350, 359.9])
    return {"hues": nums(hues), "weights": nums(O.band_weights(hues))}


def lattice_points() -> np.ndarray:
    rng = np.random.default_rng(SEED + 1)
    fixed = [[0, 0, 0], [32, 32, 32], [16, 16, 16], [32, 0, 0], [0, 32, 0], [0, 0, 32], [30, 24, 20], [14, 9, 7]]
    return np.vstack([np.array(fixed), rng.integers(0, LUT.SIZE, (LUT_POINTS - len(fixed), 3))])


def lut_vectors(cat: registry.Catalogue) -> list[dict[str, Any]]:
    pts = lattice_points()
    stats = {"castA": 0.01, "castB": -0.006}
    out = []
    for recipe in cat.ranked():
        for strength in (30, 100):
            p = engine.plan(recipe, engine.Settings(strength=strength, guard=False), stats=stats)
            table = LUT.bake(engine.colour_transform(p.family("colour")))
            out.append({"recipe": recipe["id"], "strength": strength, "stats": stats, "key": p.key,
                        "points": pts.tolist(), "values": nums(LUT.sample(table, pts)),
                        "sum": num(table.sum()), "count": int(table.size)})
    return out


def tetra_vectors(cat: registry.Catalogue) -> list[dict[str, Any]]:
    rng = np.random.default_rng(SEED + 2)
    rgb = np.vstack([rng.random((240, 3)), np.array([[0, 0, 0], [1, 1, 1], [0.5, 0.5, 0.5], [1, 0, 0],
                                                    [0.03125, 0.03125, 0.03125], [0.25, 0.5, 0.75],
                                                    [0.5, 0.25, 0.25], [0.25, 0.25, 0.5], [1, 1, 0],
                                                    [0.6, 0.6, 0.2], [0.2, 0.6, 0.6], [0.6, 0.2, 0.6],
                                                    [0.999, 0.0001, 0.5], [0.4, 0.4, 0.40001],
                                                    [0.7, 0.70001, 0.7], [0.1, 0.1, 0.1]])])
    out = []
    for rid in ("C01", "M04"):
        p = engine.plan(cat.get(rid), engine.Settings(strength=100, guard=False))
        table = LUT.bake(engine.colour_transform(p.family("colour")))
        out.append({"recipe": rid, "strength": 100, "rgb": nums(rgb), "out": nums(LUT.apply(table, rgb))})
    return out


def block() -> np.ndarray:
    return np.ascontiguousarray(F.chart_atlas()[::4, ::4])


def spatial_vectors() -> list[dict[str, Any]]:
    img = block()
    h, w = img.shape[:2]
    unit = S.bytes_to_unit(img)
    cases = [("spatial.glow", {"amount": 0.4, "threshold": 0.6, "radius": 0.05, "warmth": 0.5}),
             ("light.vignette", {"amount": 0.6, "inner": 0.2, "outer": 1.1}),
             ("light.vignette", {"amount": -0.5}),
             ("light.centre", {"amount": 0.5, "warmth": 0.7, "radius": 0.4}),
             ("light.centre", {"amount": 0.4, "follow": 1}),
             ("light.grade", {"topHue": 270, "topAmount": 0.05, "bottomHue": 65, "bottomAmount": 0.06}),
             ("spatial.halation", {"amount": 0.6, "threshold": 0.62, "radius": 0.05, "warmth": 0.85}),
             ("light.border", {"amount": 0.8, "width": 0.10, "tone": 1.0}),
             ("light.border", {"amount": 0.6, "width": 0.05, "tone": -1.0})]
    out = []
    for name, given in cases:
        op = oplist.op(name)
        params = O.full_params(op, given)
        frames = [Frame(w, h, 0, 0, (w * 0.4, h * 0.45)), Frame(w * 3, h * 2, w, h // 2, (w * 1.3, h * 1.1))]
        for fr in frames:
            res = S.clamp01(op.apply(unit, params, fr))
            out.append({"op": name, "params": params, "frame": [fr.width, fr.height, fr.x0, fr.y0,
                                                                 list(fr.face_centre or [])],
                        "out": b64(S.unit_to_bytes(res))})
    return out


MASK_STEPS = 4  # mesh masks are drawn with 2 x 2 supersampling: alpha is a multiple of 1/4


def mask_b64(mask: np.ndarray | None) -> str | None:
    if mask is None:
        return None
    q = np.asarray(mask, dtype=np.float64) * MASK_STEPS
    if not np.allclose(q, np.rint(q)):
        raise ValueError("parity masks must be quarter steps")
    return b64(np.rint(q).astype(np.uint8))


def portraits() -> list[F.Portrait]:
    return [F.portrait(t, width=48, height=56, grain=3.0) for t in ("very_light", "medium", "very_dark")]


def face_vectors() -> list[dict[str, Any]]:
    out = []
    for p in portraits():
        centre = F.face_centre(p)
        out.append({"tone": p.face.tone, "w": p.image.shape[1], "h": p.image.shape[0], "image": b64(p.image),
                    "skin": mask_b64(p.masks.skin), "person": mask_b64(p.masks.person),
                    "faceCentre": [num(centre[0]), num(centre[1])]})
    return out


def guard_vectors(cat: registry.Catalogue) -> list[dict[str, Any]]:
    """The guard alone on face i: the look and the guard output; the TypeScript side re-derives
    the mid-grey rise from its own look of a grey photo (so the look on grey is checked too)."""
    out = []
    for i, (p, rid) in enumerate(zip(portraits(), ("C05", "C12", "M04"), strict=True)):
        recipe = cat.get(rid)
        plan = engine.plan(recipe, engine.Settings(strength=100), has_skin=True)
        fr = Frame(p.image.shape[1], p.image.shape[0])
        look = engine.look(p.image, plan, fr)
        rise = G.grey_rise(engine.look(engine.grey_photo(p.image.shape[:2]), plan, fr))
        assert p.masks.skin is not None
        stats = G.spread_stats(p.image, look, p.masks.skin)
        for mode in G.MODES:
            res = G.guard(p.image, look, p.masks.skin, rise, mode=mode)
            out.append({"face": i, "recipe": rid, "strength": 100, "mode": mode, "look": b64(look), "out": b64(res),
                        "riseMean": num(rise.mean()), "spreadScale": num(G.spread_scale(stats))})
    return out


RENDER_CASES: list[tuple[str, dict[str, Any], bool]] = [
    ("C08", {}, True), ("C01", {"strength": 100}, True), ("C39", {}, True), ("C28", {}, True),
    ("C41", {"strength": 80}, True), ("C04", {"strength": 100, "preset": "Strong"}, True),
    ("C40", {"strength": 60, "preset": "Framed"}, True), ("C38", {"addons": {"fade": 70}}, True),
    ("C30", {"strength": 100, "guard": False}, True), ("C53", {"strength": 100}, True),
    ("M02", {}, True), ("M06", {"strength": 50}, True), ("C10", {"strength": 90}, False),
    ("C02", {"strength": 100}, False), ("C20", {"strength": 100, "protect_skin": True}, True),
    ("C33", {"strength": 0}, True), ("C33", {"strength": 0, "addons": {"fade": 40}}, True),
]


def render_vectors(cat: registry.Catalogue) -> list[dict[str, Any]]:
    out = []
    faces = portraits()
    for i, (rid, given, with_masks) in enumerate(RENDER_CASES):
        p = faces[i % len(faces)]
        masks = p.masks if with_masks else blend.NO_MASKS
        settings = engine.Settings(**given)
        res = engine.render(p.image, cat.get(rid), settings, masks, face_centre=F.face_centre(p))
        out.append({"face": i % len(faces), "recipe": rid, "settings": given, "masks": with_masks,
                    "look": b64(res.look), "out": b64(res.image), "fallback": res.plan.fallback,
                    "strength": num(res.plan.strength), "pending": list(res.plan.pending), "key": res.plan.key})
    return out


CAST_SHIFTS = ((0, 0, 0), (12, 0, -10), (-6, 4, 14))


def cast_vectors() -> list[dict[str, Any]]:
    """Colour cast of face i shifted by a fixed RGB offset (the TypeScript side applies the same)."""
    out = []
    for i, p in enumerate(portraits()):
        for shift in CAST_SHIFTS:
            img = np.clip(p.image.astype(np.int16) + np.array(shift), 0, 255).astype(np.uint8)
            a, b = O.photo_cast(S.bytes_to_unit(img))
            out.append({"face": i, "shift": list(shift), "cast": [num(a), num(b)]})
    return out


def build(cat: registry.Catalogue | None = None) -> dict[str, Any]:
    c = cat or registry.default()
    doc: dict[str, Any] = {"format": FORMAT, "author": "John Khan",
           "about": "FX1 filter kernels, written by api/plumb_api/filters/parity.py from the Python mirror. "
                    "Drawn fixtures only; no photo of a person.",
           "lutSize": LUT.SIZE, "maskSteps": MASK_STEPS, "colours": nums(colours()), "faces": face_vectors(),
           "block": {"w": block().shape[1], "h": block().shape[0], "image": b64(block())},
           "ops": op_vectors(), "scales": scale_vectors(),
           "curves": curve_vectors(), "bands": band_vectors(), "luts": lut_vectors(c), "tetra": tetra_vectors(c),
           "spatial": spatial_vectors(), "guard": guard_vectors(c), "renders": render_vectors(c),
           "casts": cast_vectors()}
    doc["vectorCount"] = sum(len(doc[k]) for k in ("ops", "scales", "curves", "luts", "tetra", "spatial", "guard",
                                                   "renders", "casts"))
    return doc


def dumps(doc: Mapping[str, Any]) -> str:
    def clean(v: Any) -> Any:
        if isinstance(v, float) and not math.isfinite(v):
            raise ValueError("parity vectors must be finite")
        if isinstance(v, Mapping):
            return {k: clean(x) for k, x in v.items()}
        if isinstance(v, list | tuple):
            return [clean(x) for x in v]
        return v
    return json.dumps(clean(doc), separators=(",", ":"), ensure_ascii=False) + "\n"
