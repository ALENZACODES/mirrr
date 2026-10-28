"""Packs as plain data: dict and JSON round trips with full validation.

Lets a later session (or a content tool) describe a pack in JSON instead of
Python. Loading builds the same SeasonalPack objects, so every model check
still runs, and register_pack then adds the renderer, motif and respect checks.
Unknown keys are rejected so a typo cannot silently drop a setting.
Author: John Khan.
"""

from __future__ import annotations

import json
from collections.abc import Mapping

from .model import Look, LookKind, PackError, Palette, ParamValue, SeasonalPack, StrengthCurve

SCHEMA_VERSION = 1
PACK_KEYS = {"schema", "occasion", "title", "palette", "motifs", "looks", "greeting"}
LOOK_KEYS = {"id", "kind", "title", "renderer", "params", "motifs", "default_strength", "curve"}
PALETTE_KEYS = {"primary", "secondary", "accent", "dark", "light"}

Data = dict[str, object]


def look_to_dict(look: Look) -> Data:
    """Plain-data form of a look; tuples become lists."""
    params: dict[str, object] = {}
    for key, value in look.params.items():
        params[key] = list(value) if isinstance(value, tuple) else value
    return {
        "id": look.id,
        "kind": look.kind.value,
        "title": look.title,
        "renderer": look.renderer,
        "params": params,
        "motifs": list(look.motifs),
        "default_strength": look.default_strength,
        "curve": look.curve.value,
    }


def pack_to_dict(pack: SeasonalPack) -> Data:
    """Plain-data form of a pack, ready for json.dumps."""
    palette = pack.palette
    return {
        "schema": SCHEMA_VERSION,
        "occasion": pack.occasion,
        "title": pack.title,
        "palette": {role: getattr(palette, role) for role in sorted(PALETTE_KEYS)},
        "motifs": list(pack.motifs),
        "looks": [look_to_dict(look) for look in pack.looks],
        "greeting": pack.greeting,
    }


def _mapping(value: object, where: str) -> Mapping[str, object]:
    if not isinstance(value, Mapping) or any(not isinstance(key, str) for key in value):
        raise PackError(f"{where} must be an object with text keys")
    return value


def _check_keys(data: Mapping[str, object], allowed: set[str], where: str) -> None:
    unknown = sorted(set(data) - allowed)
    if unknown:
        raise PackError(f"{where} has unknown keys {unknown}")


def _text(data: Mapping[str, object], key: str, where: str) -> str:
    value = data.get(key)
    if not isinstance(value, str):
        raise PackError(f"{where}.{key} must be text")
    return value


def _names(value: object, where: str) -> tuple[str, ...]:
    if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
        raise PackError(f"{where} must be a list of text")
    return tuple(str(item) for item in value)


def _param(value: object, where: str) -> ParamValue:
    if isinstance(value, list):
        if all(isinstance(item, str) for item in value):
            return tuple(str(item) for item in value)
        if all(isinstance(item, (int, float)) and not isinstance(item, bool) for item in value):
            return tuple(float(item) for item in value)
        raise PackError(f"{where} lists must hold only text or only numbers")
    if isinstance(value, (str, int, float, bool)):
        return value
    raise PackError(f"{where} has an unsupported value")


def look_from_dict(raw: object, where: str = "look") -> Look:
    """Build a Look from plain data; every model check applies."""
    data = _mapping(raw, where)
    _check_keys(data, LOOK_KEYS, where)
    try:
        kind = LookKind(_text(data, "kind", where))
        curve = StrengthCurve(str(data.get("curve", StrengthCurve.LINEAR.value)))
    except ValueError as error:
        raise PackError(f"{where}: {error}") from error
    params_raw = _mapping(data.get("params", {}), f"{where}.params")
    params = {key: _param(value, f"{where}.params.{key}") for key, value in params_raw.items()}
    strength = data.get("default_strength", 3.0)
    if isinstance(strength, bool) or not isinstance(strength, (int, float)):
        raise PackError(f"{where}.default_strength must be a number")
    return Look(
        id=_text(data, "id", where),
        kind=kind,
        title=_text(data, "title", where),
        renderer=_text(data, "renderer", where),
        params=params,
        motifs=_names(data.get("motifs", []), f"{where}.motifs"),
        default_strength=float(strength),
        curve=curve,
    )


def pack_from_dict(raw: object) -> SeasonalPack:
    """Build a SeasonalPack from plain data written by pack_to_dict or by hand."""
    data = _mapping(raw, "pack")
    _check_keys(data, PACK_KEYS, "pack")
    if data.get("schema", SCHEMA_VERSION) != SCHEMA_VERSION:
        raise PackError(f"pack schema must be {SCHEMA_VERSION}")
    palette_raw = _mapping(data.get("palette"), "pack.palette")
    _check_keys(palette_raw, PALETTE_KEYS, "pack.palette")
    palette = Palette(**{role: _text(palette_raw, role, "pack.palette") for role in PALETTE_KEYS})
    looks_raw = data.get("looks")
    if not isinstance(looks_raw, list):
        raise PackError("pack.looks must be a list")
    looks = tuple(look_from_dict(item, f"pack.looks[{i}]") for i, item in enumerate(looks_raw))
    return SeasonalPack(
        occasion=_text(data, "occasion", "pack"),
        title=_text(data, "title", "pack"),
        palette=palette,
        motifs=_names(data.get("motifs", []), "pack.motifs"),
        looks=looks,
        greeting=_text(data, "greeting", "pack"),
    )


def pack_to_json(pack: SeasonalPack) -> str:
    """Pack as indented, key-sorted JSON text."""
    return json.dumps(pack_to_dict(pack), indent=2, sort_keys=True, ensure_ascii=True)


def pack_from_json(text: str) -> SeasonalPack:
    """Parse JSON text into a validated pack."""
    try:
        raw = json.loads(text)
    except json.JSONDecodeError as error:
        raise PackError(f"pack JSON is not valid: {error.msg} at line {error.lineno}") from error
    return pack_from_dict(raw)
