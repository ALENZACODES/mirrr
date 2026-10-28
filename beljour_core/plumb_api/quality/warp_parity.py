"""R5 parity kernels (CONTRACTS.md §16 format `beljour-parity/1`) for E06 warp, E07 fill
and Q12, stored in parity/warp-fill-r5.json. The TypeScript twin is
`web/src/quality/warp-parity.ts`; every number must agree within 1/255 (check Q5), and
integer outputs (triangles, pixel owners, fill order, PatchMatch bytes) must match exactly.

Arrays travel as {"shape", "data"} (quality/parity.py); point lists as [[x, y], ...].
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Callable
from typing import Any

import numpy as np

from ..engines.core.engine import run_engine
from ..engines.fill import biharmonic as bh
from ..engines.fill import fill as fills
from ..engines.fill import fmm
from ..engines.fill import patchmatch as pm
from ..engines.proportions import ratios as proportion_ratios
from ..engines.proportions import symmetry
from ..engines.warp import falloff, fold, mesh, mls, piecewise, triangulate
from ..engines.warp import field as fields
from ..engines.warp.engine import WarpEngine
from ..engines.warp.tps import ThinPlateSpline, tps_field
from . import metrics, warpfill
from .parity import FORMAT, TOLERANCE, decode_array, encode_array

Json = Any
KERNELS: dict[str, Callable[[dict[str, Any]], Json]] = {}
MIN_VECTORS = 80


def kernel(name: str) -> Callable[[Callable[[dict[str, Any]], Json]], Callable[[dict[str, Any]], Json]]:
    def register(fn: Callable[[dict[str, Any]], Json]) -> Callable[[dict[str, Any]], Json]:
        KERNELS[name] = fn
        return fn
    return register


def _pts(value: Any) -> np.ndarray:
    return np.asarray(value, dtype=np.float64).reshape(-1, 2)


def _list(arr: np.ndarray) -> list[list[float]]:
    return [[float(x), float(y)] for x, y in np.asarray(arr).reshape(-1, 2)]


def _maps(f: fields.Field) -> dict[str, Any]:
    return {"map_x": encode_array(f.map_x), "map_y": encode_array(f.map_y)}


def _field(a: dict[str, Any]) -> fields.Field:
    return fields.Field(decode_array(a["map_x"]), decode_array(a["map_y"]))


def _u8(value: dict[str, Any]) -> np.ndarray:
    return decode_array(value, np.uint8)


# warp ------------------------------------------------------------------------------

@kernel("warp.tps_map")
def _tps_map(a: dict[str, Any]) -> Json:
    spline = ThinPlateSpline.fit(_pts(a["src"]), _pts(a["dst"]), a["smooth"])
    probe = _pts(a["points"])
    jac = spline.jacobian(probe)
    return {"points": _list(spline(probe)), "jacobian": [[float(v) for v in j.ravel()] for j in jac],
            "energy": spline.bending_energy()}


@kernel("warp.tps_field")
def _tps_field(a: dict[str, Any]) -> Json:
    return _maps(tps_field(a["h"], a["w"], _pts(a["from"]), _pts(a["to"]), pins=_pts(a["pins"]) if a["pins"] else None,
                           step=a["step"]))


@kernel("warp.mls_points")
def _mls_points(a: dict[str, Any]) -> Json:
    return _list(mls.deform(_pts(a["points"]), _pts(a["p"]), _pts(a["q"]), a["mode"], a["alpha"]))


@kernel("warp.mls_field")
def _mls_field(a: dict[str, Any]) -> Json:
    return _maps(mls.mls_field(a["h"], a["w"], _pts(a["from"]), _pts(a["to"]), mode=a["mode"], alpha=a["alpha"],
                               step=a["step"], pin_border=a["pin_border"]))


@kernel("warp.delaunay")
def _delaunay(a: dict[str, Any]) -> Json:
    return [list(t) for t in triangulate.delaunay(a["points"])]


@kernel("warp.piecewise")
def _piecewise(a: dict[str, Any]) -> Json:
    res = piecewise.piecewise_affine(a["h"], a["w"], _pts(a["src"]), _pts(a["dst"]), a["triangles"])
    return {**_maps(res.field), "owner": encode_array(res.owner)}


@kernel("warp.fold_report")
def _fold_report(a: dict[str, Any]) -> Json:
    rep = fold.fold_report(_field(a), a["minimum"])
    return {"min_det": rep.min_det, "max_det": rep.max_det, "folded_share": rep.folded_share,
            "below_share": rep.below_share, "worst_x": rep.worst_x, "worst_y": rep.worst_y, "passed": rep.passed}


@kernel("warp.triangle_flips")
def _flips(a: dict[str, Any]) -> Json:
    rep = fold.triangle_flips(_pts(a["src"]), _pts(a["dst"]), a["triangles"], a["min_ratio"])
    return {"flipped": list(rep.flipped), "squashed": list(rep.squashed), "min_area_ratio": rep.min_area_ratio}


@kernel("warp.curve")
def _curve(a: dict[str, Any]) -> Json:
    return [float(v) for v in falloff.curve(np.asarray(a["values"]), a["kind"])]


@kernel("warp.band_weights")
def _band_weights(a: dict[str, Any]) -> Json:
    return encode_array(falloff.band_weights(decode_array(a["band"]), a["ramp"], a["kind"]))


@kernel("warp.radial_weights")
def _radial(a: dict[str, Any]) -> Json:
    return encode_array(falloff.radial_weights(a["h"], a["w"], a["cx"], a["cy"], a["radius"], a["kind"]))


@kernel("warp.compose")
def _compose(a: dict[str, Any]) -> Json:
    return _maps(fields.compose(_field(a["outer"]), _field(a["inner"])))


@kernel("warp.safe_strength")
def _safe(a: dict[str, Any]) -> Json:
    res = fold.safe_strength(fold.scaled_builder(_field(a)), minimum=a["minimum"])
    return {"strength": res.strength, "min_det": res.report.min_det, "reduced": res.reduced}


@kernel("warp.anchor_ring")
def _ring(a: dict[str, Any]) -> Json:
    return _list(mesh.anchor_ring(_pts(a["mesh"]), a["scale"], a["count"]))


@kernel("warp.mesh_warp")
def _mesh_warp(a: dict[str, Any]) -> Json:
    res = mesh.mesh_warp(a["h"], a["w"], _pts(a["before"]), _pts(a["after"]), strength=a["strength"], guard=a["guard"])
    return {**_maps(res.result.field), "owner": encode_array(res.result.owner), "strength_used": res.strength_used,
            "reduced": res.reduced, "flipped": list(res.flips.flipped)}


@kernel("warp.engine")
def _warp_engine(a: dict[str, Any]) -> Json:
    masks = {"band": decode_array(a["band"], np.float32)} if a["band"] else {}
    res = run_engine(WarpEngine(), _u8(a["image"]), None, masks, a["params"])
    return {"image": encode_array(res.image), "metrics": {k: res.metrics[k] for k in sorted(res.metrics)}}


# fill ------------------------------------------------------------------------------

@kernel("fill.fast_marching")
def _fast_marching(a: dict[str, Any]) -> Json:
    res = fmm.fast_marching(decode_array(a["values"]), decode_array(a["mask"]), radius=a["radius"],
                            gradient=a["gradient"])
    return {"image": encode_array(res.image), "arrival": encode_array(res.arrival), "order": list(res.order)}


@kernel("fill.onion_peel")
def _onion(a: dict[str, Any]) -> Json:
    return encode_array(pm.onion_peel(_u8(a["image"]), decode_array(a["hole"]) >= 0.5))


@kernel("fill.patchmatch")
def _patchmatch(a: dict[str, Any]) -> Json:
    res = pm.patchmatch(_u8(a["image"]), decode_array(a["mask"]), patch_radius=a["patch_radius"],
                        iterations=a["iterations"], seed=a["seed"])
    return {"image": encode_array(res.image), "mean_distance": list(res.mean_distance),
            "matches": [[int(x), int(y)] for x, y in res.matches]}


@kernel("fill.biharmonic")
def _biharmonic(a: dict[str, Any]) -> Json:
    res = bh.biharmonic(decode_array(a["values"]), decode_array(a["mask"]))
    return {"image": encode_array(res.image), "box": list(res.box), "converged": res.converged}


@kernel("fill.fill")
def _fill(a: dict[str, Any]) -> Json:
    out = fills.fill(_u8(a["image"]), decode_array(a["mask"]), a["method"], grow=a["grow"], seed=a["seed"])
    return {"image": encode_array(out.image), "hole_pixels": out.hole_pixels}


@kernel("fill.xorshift")
def _xorshift(a: dict[str, Any]) -> Json:
    rng = pm.XorShift32(a["seed"])
    return [rng.next() for _ in range(a["count"])]


# quality ---------------------------------------------------------------------------

Q12_KEYS = ("max_deviation", "lines_checked", "lines_skipped", "samples")


@kernel("quality.q12")
def _q12(a: dict[str, Any]) -> Json:
    band = decode_array(a["band"]) if a["band"] else None
    check = metrics.q12_straight_lines(_u8(a["image"]), band, spacing=a["spacing"], offset=a["offset"],
                                       thickness=a["thickness"])
    return {"passed": check.passed, **{k: metrics._clean(check.measured.get(k)) for k in Q12_KEYS}}


@kernel("quality.grid_scene")
def _grid(a: dict[str, Any]) -> Json:
    return encode_array(warpfill.grid_scene(a["h"], a["w"], a["spacing"], a["offset"], a["thickness"]))


# proportions (E10 start) --------------------------------------------------------------

@kernel("proportions.symmetry")
def _symmetry(a: dict[str, Any]) -> Json:
    rep = symmetry.analyse(_pts(a["points"]), a["regions"])
    return {"tilt_degrees": rep.tilt_degrees, "iod": rep.iod, "midline_spread": rep.midline_spread,
            "mean": rep.mean, "yaw_share": rep.yaw_share, "facing_camera": rep.facing_camera,
            "regions": [[r.mean, r.max, r.across, r.along] for r in rep.regions],
            "pairs": [[p.right, p.left, p.across, p.along] for p in rep.pairs]}


@kernel("proportions.targets")
def _targets(a: dict[str, Any]) -> Json:
    out = symmetry.targets(_pts(a["points"]), a["strength"], side=a["side"], regions=a["regions"], midline=a["midline"])
    return _list(out)


@kernel("proportions.ratios")
def _ratios(a: dict[str, Any]) -> Json:
    rep = proportion_ratios.measure(_pts(a["points"]), a["set"], a["custom"])
    return [[r.key, r.value, r.reference, r.difference_percent, r.plain] for r in rep.ratios]


def evaluate(vector: dict[str, Any]) -> Json:
    fn = KERNELS.get(vector["kernel"])
    if fn is None:
        raise KeyError(f"unknown parity kernel {vector['kernel']!r}")
    return fn(vector["args"])


def validate(document: Any) -> list[str]:
    if not isinstance(document, dict) or document.get("format") != FORMAT:
        return [f"format must be {FORMAT}"]
    problems = [] if document.get("tolerance") == TOLERANCE else ["tolerance must be 1/255"]
    vectors = document.get("vectors")
    if not isinstance(vectors, list):
        return problems + ["vectors must be a list"]
    seen: set[str] = set()
    for i, vec in enumerate(vectors):
        if not isinstance(vec, dict) or not {"id", "kernel", "args", "expected"} <= vec.keys():
            problems.append(f"vectors[{i}]: needs id, kernel, args and expected")
            continue
        if vec["id"] in seen:
            problems.append(f"vectors[{i}]: duplicate id {vec['id']}")
        seen.add(vec["id"])
        if vec["kernel"] not in KERNELS:
            problems.append(f"vectors[{i}]: unknown kernel {vec['kernel']}")
    used = sorted({str(v.get("kernel")) for v in vectors if isinstance(v, dict)})
    if sorted(document.get("kernels", [])) != used:
        problems.append("kernels must list exactly the kernels the vectors use")
    return problems


def compare(document: dict[str, Any]) -> list[tuple[str, float]]:
    return [(vec["id"], metrics.max_abs_difference(vec["expected"], evaluate(vec))) for vec in document["vectors"]]
