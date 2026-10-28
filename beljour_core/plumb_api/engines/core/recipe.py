"""Versioned, validated, serialisable presets for local image engines.

Recipe parameters are non-bool finite numbers, short strings, or booleans. Caps
bind numeric ranges. Stops are an ordered sequence of operations, not endpoints.
Author: John Khan.
"""
from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from typing import TypeAlias

Scalar: TypeAlias = str | float | int | bool
_NAME = re.compile(r"^[a-z][a-z0-9_-]{0,63}$")
_VERSION = re.compile(r"^[1-9][0-9]*\.[0-9]+\.[0-9]+$")


@dataclass(frozen=True)
class Cap:
    minimum: float
    maximum: float
    default: float

    def __post_init__(self) -> None:
        if not all(math.isfinite(v) for v in (self.minimum, self.maximum, self.default)):
            raise ValueError("cap boundaries must be finite")
        if not self.minimum <= self.default <= self.maximum:
            raise ValueError("cap must contain default")

    def check(self, value: Scalar) -> float:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError("capped parameter must be numeric")
        if not math.isfinite(value) or not self.minimum <= value <= self.maximum:
            raise ValueError("parameter is outside its cap")
        return float(value)


@dataclass(frozen=True)
class Stop:
    engine: str
    params: dict[str, Scalar] = field(default_factory=dict)
    enabled: bool = True

    def __post_init__(self) -> None:
        if not _NAME.fullmatch(self.engine):
            raise ValueError("invalid stop engine identifier")
        _validate_params(self.params)


@dataclass(frozen=True)
class Recipe:
    name: str
    version: str
    params: dict[str, Scalar]
    stops: tuple[Stop, ...]
    caps: dict[str, Cap]
    description: str = ""

    def __post_init__(self) -> None:
        if not _NAME.fullmatch(self.name) or not _VERSION.fullmatch(self.version):
            raise ValueError("invalid recipe name or semantic version")
        if not self.stops or len(self.stops) > 32:
            raise ValueError("recipe requires 1 to 32 stops")
        if len(self.description) > 500:
            raise ValueError("recipe description too long")
        _validate_params(self.params)
        for key, cap in self.caps.items():
            if not _NAME.fullmatch(key) or key not in self.params:
                raise ValueError("cap references an unknown parameter")
            cap.check(self.params[key])

    def resolve(self, overrides: dict[str, Scalar] | None = None) -> dict[str, Scalar]:
        merged = dict(self.params)
        for key, value in (overrides or {}).items():
            if key not in merged:
                raise ValueError(f"unknown recipe parameter: {key}")
            merged[key] = value
        _validate_params(merged)
        for key, cap in self.caps.items():
            cap.check(merged[key])
        return merged

    def to_dict(self) -> dict:
        return {
            "name": self.name, "version": self.version,
            "params": dict(self.params),
            "stops": [{"engine": s.engine, "params": dict(s.params), "enabled": s.enabled} for s in self.stops],
            "caps": {k: {"minimum": v.minimum, "maximum": v.maximum, "default": v.default}
                     for k, v in self.caps.items()},
            "description": self.description,
        }


def _validate_params(values: dict[str, Scalar]) -> None:
    if len(values) > 128:
        raise ValueError("too many parameters")
    for key, value in values.items():
        if not isinstance(key, str) or not _NAME.fullmatch(key):
            raise ValueError("invalid parameter name")
        if not isinstance(value, (int, float, str, bool)):
            raise ValueError("parameter must be scalar")
        if isinstance(value, (int, float)) and not math.isfinite(value):
            raise ValueError("parameter must be finite")
        if isinstance(value, str) and len(value) > 256:
            raise ValueError("parameter string too long")


def validate_recipe(data: dict) -> Recipe:
    if not isinstance(data, dict) or set(data) - {"name", "version", "params", "stops", "caps", "description"}:
        raise ValueError("unexpected recipe fields")
    try:
        stops = tuple(Stop(engine=s["engine"], params=s.get("params", {}),
                           enabled=s.get("enabled", True)) for s in data["stops"])
        caps = {key: Cap(**cap) for key, cap in data["caps"].items()}
        return Recipe(name=data["name"], version=data["version"], params=data["params"],
                      stops=stops, caps=caps, description=data.get("description", ""))
    except (KeyError, TypeError, AttributeError) as exc:
        raise ValueError("invalid recipe document") from exc
