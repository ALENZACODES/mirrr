"""Strict, versioned, photo-free recipe JSON for the local pro editor.

Round-trip behaviour mirrors web/src/pro/recipe.ts and rejects unknown data.
This is intentionally not a photo upload or persistence endpoint.
"""

from __future__ import annotations

import json
import math
from dataclasses import asdict
from typing import cast

from .contracts import Aspect, Crop, CurvePoint, ExportName, Recipe, ToneCurves
from .masks import Brush, Linear, Mask, Mode, Point, Radial

FORMAT = "beljour-pro-recipe/1"
MAX_BYTES = 8192
CHANNELS = ("master", "red", "green", "blue")


def _mapping(value: object, name: str, keys: tuple[str, ...]) -> dict[str, object]:
    if not isinstance(value, dict) or not all(isinstance(key, str) for key in value):
        raise ValueError(f"{name} must be an object")
    obj = cast(dict[str, object], value)
    if set(obj) != set(keys):
        raise ValueError(f"{name} contains missing or unknown fields")
    return obj


def _number(value: object, name: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (float, int)) or not math.isfinite(value):
        raise ValueError(f"{name} must be a finite number")
    return float(value)


def _flag(value: object, name: str) -> bool:
    if not isinstance(value, bool):
        raise ValueError(f"{name} must be a boolean")
    return value


def _curve(value: object, name: str) -> tuple[CurvePoint, ...]:
    if not isinstance(value, list) or not 2 <= len(value) <= 16:
        raise ValueError(f"{name} needs 2 to 16 points")
    output = []
    for item in value:
        data = _mapping(item, name + " point", ("x", "y"))
        output.append(CurvePoint(_number(data["x"], "x"), _number(data["y"], "y")))
    return tuple(output)


def _point(value: object) -> Point:
    coords = _mapping(value, "mask point", ("x", "y"))
    return Point(_number(coords["x"], "x"), _number(coords["y"], "y"))


def _mask(value: object) -> Mask:
    if not isinstance(value, dict):
        raise ValueError("mask must be an object")
    data = cast(dict[str, object], value)
    kind = data.get("kind")
    mode = data.get("mode")
    if mode not in ("add", "subtract"):
        raise ValueError("unknown mask mode")
    opacity = _number(data.get("opacity"), "opacity")
    typed_mode = cast(Mode, mode)
    if kind == "brush":
        obj = _mapping(value, "brush", ("kind", "mode", "opacity", "points", "radius", "hardness"))
        points = obj["points"]
        if not isinstance(points, list) or not 1 <= len(points) <= 48:
            raise ValueError("invalid brush stroke length")
        return Brush(points=tuple(_point(point) for point in points),
                     radius=_number(obj["radius"], "radius"), hardness=_number(obj["hardness"], "hardness"),
                     opacity=opacity, mode=typed_mode)
    if kind == "linear":
        obj = _mapping(value, "linear", ("kind", "mode", "opacity", "start", "end", "feather"))
        return Linear(start=_point(obj["start"]), end=_point(obj["end"]),
                      feather=_number(obj["feather"], "feather"), opacity=opacity, mode=typed_mode)
    if kind == "radial":
        obj = _mapping(value, "radial", ("kind", "mode", "opacity", "center", "radiusX", "radiusY", "feather"))
        return Radial(center=_point(obj["center"]), radius_x=_number(obj["radiusX"], "radiusX"),
                      radius_y=_number(obj["radiusY"], "radiusY"),
                      feather=_number(obj["feather"], "feather"), opacity=opacity, mode=typed_mode)
    raise ValueError("unknown mask kind")


def _encode_mask(mask: Mask) -> dict[str, object]:
    base: dict[str, object] = {"kind": mask.kind, "mode": mask.mode, "opacity": mask.opacity}
    if isinstance(mask, Brush):
        base.update(points=[asdict(point) for point in mask.points], radius=mask.radius, hardness=mask.hardness)
    elif isinstance(mask, Linear):
        base.update(start=asdict(mask.start), end=asdict(mask.end), feather=mask.feather)
    else:
        base.update(center=asdict(mask.center), radiusX=mask.radius_x, radiusY=mask.radius_y,
                    feather=mask.feather)
    return base


def decode_recipe(text: str) -> Recipe:
    if not isinstance(text, str) or len(text.encode("utf-8")) > MAX_BYTES:
        raise ValueError("recipe is not valid text up to 8 KB")
    try:
        raw: object = json.loads(text)
    except (TypeError, ValueError) as exc:
        raise ValueError("recipe JSON could not be read") from exc
    envelope = _mapping(raw, "envelope", ("format", "recipe"))
    if envelope["format"] != FORMAT:
        raise ValueError("unsupported recipe format")
    raw_recipe = envelope["recipe"]
    if not isinstance(raw_recipe, dict):
        raise ValueError("recipe must be an object")
    fields = ("curves", "crop", "export", "simulation", "simulationLabel")
    raw_fields = cast(dict[str, object], raw_recipe)
    keys = fields + (("masks",) if "masks" in raw_fields else ())
    obj = _mapping(raw_recipe, "recipe", keys)
    raw_masks = obj.get("masks", [])
    if not isinstance(raw_masks, list) or len(raw_masks) > 16:
        raise ValueError("masks must be an array of at most sixteen")
    masks = tuple(_mask(item) for item in raw_masks)
    curves = _mapping(obj["curves"], "curves", CHANNELS)
    crop = _mapping(obj["crop"], "crop", ("x", "y", "width", "height", "aspect", "rotation"))
    aspect = crop["aspect"]
    preset = obj["export"]
    if not isinstance(aspect, str) or not isinstance(preset, str):
        raise ValueError("aspect and export must be named presets")
    return Recipe(
        curves=ToneCurves(**{key: _curve(value, key) for key, value in curves.items()}),
        masks=masks,
        crop=Crop(x=_number(crop["x"], "x"), y=_number(crop["y"], "y"),
                  width=_number(crop["width"], "width"), height=_number(crop["height"], "height"),
                  aspect=cast(Aspect, aspect), rotation=_number(crop["rotation"], "rotation")),
        export=cast(ExportName, preset),
        simulation=_flag(obj["simulation"], "simulation"),
        simulation_label=_flag(obj["simulationLabel"], "simulationLabel"),
    )


def encode_recipe(recipe: Recipe) -> str:
    """Produce the same public camel-case field name used by the web schema."""
    payload = asdict(recipe)
    payload["simulationLabel"] = payload.pop("simulation_label")
    payload["masks"] = [_encode_mask(mask) for mask in recipe.masks]
    encoded = json.dumps({"format": FORMAT, "recipe": payload}, separators=(",", ":"), allow_nan=False)
    if len(encoded.encode("utf-8")) > MAX_BYTES:
        raise ValueError("recipe exceeds 8 KB")
    return encoded
