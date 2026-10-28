"""Settings-only local hair recipes: export and import of chosen controls, nothing else.

A recipe records which local preview was chosen and how strong it was: the kind
(``fibre``, ``palette`` or ``short-sides``), the strength and identity-lock levels in
tenths from 1.0 to 5.0, and the kind's own setting (fibre zone and optional pigment
swatch, palette swatch and the explicit lightening choice, or a men's style). It
never holds a photo, mask, landmark, hash or account detail.

Import is strict: oversized payloads, invalid JSON, a wrong format, unknown keys,
private fields, unknown swatch or style IDs, and levels that are not whole tenths
are refused with a coded ``RecipeError``. Importing returns settings only; it never
renders, restores a face or reads a photo. Mirrored in
web/src/commerce/local-hair-recipe.ts. Author: John Khan.
"""
from __future__ import annotations

import json
import math
from dataclasses import dataclass
from typing import Any, Literal

from ..engines.hair_palette.catalogue import require_shade
from ..engines.menshair.render import require_preset

FORMAT = "beljour-local-hair-recipe/1"
MAX_BYTES = 1024
KINDS = ("fibre", "palette", "short-sides")
ZONES = ("crown", "parting", "hairline")
PRIVATE_KEYS = frozenset({"image", "photo", "pixels", "mask", "masks", "hair_mask", "scalp_mask", "landmarks",
                          "points", "head", "mesh", "hash", "photo_hash", "face", "email", "account", "token",
                          "secret", "api_key", "user"})
COMMON_KEYS = frozenset({"format", "kind", "level", "lock_level"})
KIND_KEYS = {"fibre": frozenset({"zone", "shade_id"}), "palette": frozenset({"shade_id", "allow_lightening"}),
             "short-sides": frozenset({"style_id"})}
Kind = Literal["fibre", "palette", "short-sides"]
ErrorCode = Literal["too_large", "invalid_json", "wrong_format", "private_field", "unknown_key", "missing_key",
                    "invalid_level", "unknown_id", "invalid_value"]


class RecipeError(ValueError):
    """A refused recipe, with a stable ``code`` for the interface."""

    def __init__(self, code: ErrorCode, message: str) -> None:
        super().__init__(message)
        self.code: ErrorCode = code


def tenths(value: object, name: str) -> float:
    """A level from 1.0 to 5.0 that is a whole number of tenths."""
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise RecipeError("invalid_level", f"{name} must be a number")
    scaled = float(value) * 10
    if abs(scaled - round(scaled)) > 1e-9 or not 10 <= round(scaled) <= 50:
        raise RecipeError("invalid_level", f"{name} must be 1.0 to 5.0 in tenths")
    return round(scaled) / 10


@dataclass(frozen=True, slots=True)
class LocalHairRecipe:
    kind: Kind
    level: float = 3.0
    lock_level: float = 5.0
    zone: str | None = None
    shade_id: str | None = None
    style_id: str | None = None
    allow_lightening: bool = False

    def __post_init__(self) -> None:
        if self.kind not in KINDS:
            raise RecipeError("invalid_value", "unknown local preview kind")
        object.__setattr__(self, "level", tenths(self.level, "level"))
        object.__setattr__(self, "lock_level", tenths(self.lock_level, "lock_level"))
        if type(self.allow_lightening) is not bool:
            raise RecipeError("invalid_value", "allow_lightening must be a boolean")
        if self.kind == "fibre":
            if self.zone not in ZONES or self.style_id is not None or self.allow_lightening:
                raise RecipeError("invalid_value", "a fibre recipe needs a zone and no style")
        elif self.kind == "palette":
            if self.shade_id is None or self.zone is not None or self.style_id is not None:
                raise RecipeError("missing_key", "a palette recipe needs exactly one swatch")
        elif self.style_id is None or self.zone is not None or self.shade_id is not None or self.allow_lightening:
            raise RecipeError("missing_key", "a short-sides recipe needs exactly one style")
        try:
            if self.shade_id is not None:
                require_shade(self.shade_id)
            if self.style_id is not None:
                require_preset(self.style_id)
        except ValueError as error:
            raise RecipeError("unknown_id", "unknown swatch or style id") from error

    def settings(self) -> dict[str, Any]:
        out: dict[str, Any] = {"format": FORMAT, "kind": self.kind, "level": self.level,
                               "lock_level": self.lock_level}
        if self.kind == "fibre":
            out.update(zone=self.zone, shade_id=self.shade_id)
        elif self.kind == "palette":
            out.update(shade_id=self.shade_id, allow_lightening=self.allow_lightening)
        else:
            out["style_id"] = self.style_id
        return out

    def to_json(self) -> str:
        return json.dumps(self.settings(), sort_keys=True, separators=(",", ":"))


def import_recipe(text: str) -> LocalHairRecipe:
    """Settings only; refuses anything that is not exactly a local hair recipe."""
    if not isinstance(text, str) or len(text.encode("utf-8")) > MAX_BYTES:
        raise RecipeError("too_large", f"a recipe must be a string of at most {MAX_BYTES} bytes")
    try:
        data = json.loads(text)
    except json.JSONDecodeError as error:
        raise RecipeError("invalid_json", "the recipe is not valid JSON") from error
    if not isinstance(data, dict) or data.get("format") != FORMAT:
        raise RecipeError("wrong_format", "not a local hair recipe")
    keys = set(data)
    if keys & PRIVATE_KEYS:
        raise RecipeError("private_field", "a recipe must not carry photos, masks, landmarks or account data")
    kind = data.get("kind")
    if kind not in KINDS:
        raise RecipeError("invalid_value", "unknown local preview kind")
    allowed = COMMON_KEYS | KIND_KEYS[kind]
    if keys - allowed:
        raise RecipeError("unknown_key", "the recipe has unknown keys")
    if not {"kind", "level"} <= keys:
        raise RecipeError("missing_key", "a recipe needs a kind and a level")
    for key in ("zone", "shade_id", "style_id"):
        if data.get(key) is not None and not isinstance(data[key], str):
            raise RecipeError("invalid_value", f"{key} must be a string")
    return LocalHairRecipe(kind, data["level"], data.get("lock_level", 5.0), data.get("zone"),
                           data.get("shade_id"), data.get("style_id"), data.get("allow_lightening", False))


def export_recipe(recipe: LocalHairRecipe) -> str:
    if not isinstance(recipe, LocalHairRecipe):
        raise RecipeError("invalid_value", "expected a local hair recipe")
    return recipe.to_json()
