"""Parity vectors `beljour-parity/1` (CONTRACTS.md §16): the Python side.

A vector names a shared kernel, its JSON arguments and the Python output. The
TypeScript suite (`web/test/parity.test.mjs`) evaluates the same kernel on the same
arguments and must agree within 1/255 on every number (check Q5).

Arrays travel as {"shape": [...], "data": [...flat, row-major...]}. Images are uint8
when the kernel says so ("u8" in KERNELS) and floats otherwise. Non-finite numbers
are written as null. Outputs are rounded to 10 decimal places.
Author: John Khan.
"""
from __future__ import annotations

import json
import math
from collections.abc import Callable
from pathlib import Path
from typing import Any

import numpy as np

from ..engines.core import blending, colour, composite, distance, guided, masks, pyramid, regions, resample
from ..engines.core.engine import run_engine
from ..engines.core.local import ExposureEngine, TintEngine
from . import harness, metrics

FORMAT = "beljour-parity/1"
TOLERANCE = 1 / 255
DECIMALS = 10
MIN_VECTORS = 200

Json = Any


def encode_array(arr: np.ndarray) -> dict[str, Any]:
    a = np.asarray(arr)
    data: list[Any]
    if a.dtype.kind in "iub":
        data = [int(v) for v in a.ravel()]
    else:
        data = [round(float(v), DECIMALS) if math.isfinite(v) else None for v in a.astype(np.float64).ravel()]
    return {"shape": list(a.shape), "data": data}


def decode_array(value: dict[str, Any], dtype: Any = np.float64) -> np.ndarray:
    shape = tuple(int(n) for n in value["shape"])
    data = [math.nan if v is None else v for v in value["data"]]
    arr = np.asarray(data, dtype=dtype)
    if arr.size != math.prod(shape):
        raise ValueError("array data does not match its shape")
    return arr.reshape(shape)


def _u8(value: dict[str, Any]) -> np.ndarray:
    return decode_array(value, np.uint8)


def _num(value: float) -> float | None:
    return round(float(value), DECIMALS) if math.isfinite(value) else None


def _nums(values: Any) -> list[float | None]:
    return [_num(v) for v in values]


def _measured(check: metrics.Check, keys: tuple[str, ...]) -> dict[str, Any]:
    return {k: (_num(check.measured[k]) if isinstance(check.measured[k], float) else check.measured[k])
            for k in keys}


def _combine(args: dict[str, Any]) -> np.ndarray:
    op = args["op"]
    a = decode_array(args["a"])
    if op == "invert":
        return masks.invert(a)
    if op == "threshold":
        return masks.threshold(a, args["t"])
    b = decode_array(args["b"])
    if op == "union":
        return masks.union(a, b)
    if op == "intersection":
        return masks.intersection(a, b)
    if op == "subtract":
        return masks.subtract(a, b)
    raise ValueError(f"unknown mask operation {op!r}")


def _guide(value: dict[str, Any]) -> np.ndarray:
    return _u8(value) if len(value["shape"]) == 3 else decode_array(value)


KERNELS: dict[str, Callable[[dict[str, Any]], Json]] = {
    "colour.srgb_decode": lambda a: _nums(colour.srgb_decode(v) for v in a["values"]),
    "colour.srgb_encode": lambda a: _nums(colour.srgb_encode(v) for v in a["values"]),
    "colour.rgb_to_lab": lambda a: _nums(colour.rgb_to_lab(a["rgb"])),
    "colour.lab_to_rgb": lambda a: _nums(colour.lab_to_rgb(a["lab"])),
    "colour.ciede2000": lambda a: _num(colour.ciede2000(a["lab1"], a["lab2"])),
    "colour.rgb_to_oklab": lambda a: _nums(colour.rgb_to_oklab(a["rgb"])),
    "colour.oklab_to_rgb": lambda a: _nums(colour.oklab_to_rgb(a["lab"])),
    "colour.mix_oklab": lambda a: _nums(colour.mix_oklab(a["rgb1"], a["rgb2"], a["t"])),
    "buffer.decode": lambda a: encode_array(composite.decode(_u8(a["image"]))),
    "buffer.encode": lambda a: encode_array(composite.encode(decode_array(a["image"]))),
    "buffer.remap": lambda a: encode_array(resample.remap(
        _u8(a["image"]), decode_array(a["map_x"]), decode_array(a["map_y"]),
        border=a["border"], linear_light=a["linear_light"])),
    "buffer.jacobian": lambda a: encode_array(resample.jacobian_determinant(
        decode_array(a["map_x"]), decode_array(a["map_y"]))),
    "mask.rectangle": lambda a: encode_array(masks.rectangle(
        a["h"], a["w"], a["left"], a["top"], a["right"], a["bottom"])),
    "mask.ellipse": lambda a: encode_array(masks.ellipse(
        a["h"], a["w"], a["cx"], a["cy"], a["rx"], a["ry"], a["feather"])),
    "mask.polygon": lambda a: encode_array(regions.polygon(a["h"], a["w"], a["points"], a["supersample"])),
    "mask.box_blur": lambda a: encode_array(masks.blur(decode_array(a["mask"]), a["radius"])),
    "mask.combine": lambda a: encode_array(_combine(a)),
    "mask.squared_edt": lambda a: encode_array(distance.squared_edt(decode_array(a["mask"]) >= 0.5)),
    "mask.dilate": lambda a: encode_array(distance.dilate(decode_array(a["mask"]), a["radius"])),
    "mask.erode": lambda a: encode_array(distance.erode(decode_array(a["mask"]), a["radius"])),
    "mask.feather": lambda a: encode_array(distance.feather(decode_array(a["mask"]), a["radius"], a["mode"])),
    "mask.guided": lambda a: encode_array(guided.guided_filter(
        _guide(a["guide"]), decode_array(a["source"]), a["radius"], a["eps"])),
    "mask.edge_feather": lambda a: encode_array(guided.edge_aware_feather(
        decode_array(a["mask"]), _guide(a["guide"]), a["radius"], a["eps"], a["band"])),
    "pyramid.down": lambda a: encode_array(pyramid.down(decode_array(a["image"]))),
    "pyramid.up": lambda a: encode_array(pyramid.up(decode_array(a["image"]), a["h"], a["w"])),
    "pyramid.laplacian": lambda a: [encode_array(b) for b in pyramid.laplacian(
        decode_array(a["image"]), a["levels"])],
    "pyramid.collapse": lambda a: encode_array(pyramid.collapse([decode_array(b) for b in a["bands"]])),
    "blend.mode": lambda a: encode_array(blending.mode_float(
        decode_array(a["cb"]), decode_array(a["cs"]), a["mode"])),
    "blend.apply": lambda a: encode_array(blending.apply_mode(
        _u8(a["base"]), _u8(a["top"]), a["mode"], opacity=a["opacity"],
        mask=None if a["mask"] is None else decode_array(a["mask"]), space=a["space"])),
    "blend.alpha": lambda a: encode_array(composite.blend(
        _u8(a["base"]), _u8(a["overlay"]), decode_array(a["mask"]), linear_light=a["linear_light"])),
    "blend.multiband": lambda a: encode_array(blending.multiband_float(
        decode_array(a["a"]), decode_array(a["b"]), decode_array(a["mask"]), a["levels"])),
    "quality.q1": lambda a: _measured(metrics.q1_outside_mask(
        _u8(a["before"]), _u8(a["after"]), decode_array(a["mask"])), ("mean", "max", "outside_pixels")),
    "quality.q3": lambda a: _measured(metrics.q3_fold_free(
        decode_array(a["map_x"]), decode_array(a["map_y"])), ("min_det", "folded_share", "below_share")),
    "quality.q4": lambda a: _measured(metrics.q4_seam(
        _u8(a["before"]), _u8(a["after"]), decode_array(a["mask"])), ("seam", "reference", "ratio", "band_pixels")),
    "quality.q6": lambda a: _measured(metrics.q6_colour_accuracy(
        _u8(a["image"]), decode_array(a["mask"]), a["target"]), ("delta_e",)),
    "quality.effect": lambda a: _num(metrics.effect_strength(
        _u8(a["before"]), _u8(a["after"]), decode_array(a["mask"]))),
    "quality.texture": lambda a: _num(metrics.texture_energy(_u8(a["image"]), decode_array(a["mask"]))),
}


def _engine(engine: Any, a: dict[str, Any]) -> dict[str, Any]:
    image = _u8(a["image"])
    named = {k: decode_array(v) for k, v in a["masks"].items()}
    result = run_engine(engine, image, None, named, a["params"], 0)
    return {"image": encode_array(result.image), "edit_mask": encode_array(result.editMask),
            "metrics": {k: _num(v) for k, v in sorted(result.metrics.items())}}


def _synthetic(a: dict[str, Any]) -> dict[str, Any]:
    photo = harness.synthetic_photo(a["seed"], a["h"], a["w"])
    return {"image": encode_array(photo.image), "selection": encode_array(photo.masks["selection"]),
            "skin": encode_array(photo.masks["skin"])}


KERNELS.update({
    "colour.lab_to_lch": lambda a: _nums(colour.lab_to_lch(a["lab"])),
    "colour.lch_to_lab": lambda a: _nums(colour.lch_to_lab(a["lch"])),
    "colour.rotate_hue": lambda a: _nums(colour.rotate_hue(a["rgb"], a["degrees"])),
    "buffer.resize_area": lambda a: encode_array(resample.resize_area(_u8(a["image"]), a["w"], a["h"])),
    "buffer.resize_bilinear": lambda a: encode_array(resample.resize_bilinear(_u8(a["image"]), a["w"], a["h"])),
    "engine.exposure": lambda a: _engine(ExposureEngine(), a),
    "engine.tint": lambda a: _engine(TintEngine(), a),
    "harness.synthetic_photo": _synthetic,
})


def evaluate(vector: dict[str, Any]) -> Json:
    kernel = KERNELS.get(vector["kernel"])
    if kernel is None:
        raise KeyError(f"unknown parity kernel {vector['kernel']!r}")
    return kernel(vector["args"])


def validate(document: Any) -> list[str]:
    if not isinstance(document, dict) or document.get("format") != FORMAT:
        return [f"format must be {FORMAT}"]
    problems = []
    if document.get("tolerance") != TOLERANCE:
        problems.append("tolerance must be 1/255")
    vectors = document.get("vectors")
    if not isinstance(vectors, list):
        return problems + ["vectors must be a list"]
    seen = set()
    for i, vec in enumerate(vectors):
        if not isinstance(vec, dict) or not {"id", "kernel", "args", "expected"} <= vec.keys():
            problems.append(f"vectors[{i}]: needs id, kernel, args and expected")
            continue
        if vec["id"] in seen:
            problems.append(f"vectors[{i}]: duplicate id {vec['id']}")
        seen.add(vec["id"])
        if vec["kernel"] not in KERNELS:
            problems.append(f"vectors[{i}]: unknown kernel {vec['kernel']}")
    used = {str(v.get("kernel")) for v in vectors if isinstance(v, dict)}
    if sorted(str(k) for k in document.get("kernels", [])) != sorted(used):
        problems.append("kernels must list exactly the kernels the vectors use")
    return problems


def load(path: Path) -> dict[str, Any]:
    document = json.loads(Path(path).read_text())
    problems = validate(document)
    if problems:
        raise ValueError("; ".join(problems))
    return document


def compare(document: dict[str, Any]) -> list[tuple[str, float]]:
    """(id, max abs difference) between each stored expectation and a fresh evaluation."""
    return [(vec["id"], metrics.max_abs_difference(vec["expected"], evaluate(vec)))
            for vec in document["vectors"]]
