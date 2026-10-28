"""Portable, image-free and versioned five-command recipes.

The digest detects accidental alteration; it is not a signature or evidence
that a recipe, edit, model or real-face gate is approved. Imported choices
that weaken identity protection require a fresh local user decision.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import re
from dataclasses import dataclass
from typing import Literal, cast

from .errors import CommandValidationError
from .pro_plan import ProPlan, pro_plan_from_dict
from .types import LockMode

RECIPE_VERSION: Literal["beljour-pro-recipe/1"] = "beljour-pro-recipe/1"
MAX_RECIPE_BYTES = 8192
_SHA256 = re.compile(r"^[0-9a-f]{64}$")
_ENVELOPE_FIELDS = frozenset(("format", "plan", "sha256"))


@dataclass(frozen=True, slots=True)
class PortableRecipe:
    """Validated plan plus content checksum, never an identity certificate."""

    plan: ProPlan
    sha256: str
    identity_reconfirmation_required: bool
    format: Literal["beljour-pro-recipe/1"] = RECIPE_VERSION

    def public_metadata(self) -> dict[str, object]:
        return {
            "format": self.format,
            "sha256": self.sha256,
            "commands": [step.name.value for step in self.plan.steps],
            "identity_reconfirmation_required": self.identity_reconfirmation_required,
            "synthetic_or_realface_qualified": False,
        }


def _digest(plan: ProPlan) -> str:
    return hashlib.sha256(plan.canonical_json().encode("utf-8")).hexdigest()


def _is_weakened(plan: ProPlan) -> bool:
    return not plan.identity.enabled or plan.identity.mode is LockMode.WARN


def _unique_object(pairs: list[tuple[str, object]]) -> dict[str, object]:
    """Reject shadowed security fields before constructing Python dictionaries."""
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            raise CommandValidationError(
                "duplicate_recipe_field", "A portable recipe repeats a JSON field.",
            )
        result[key] = value
    return result


def _parse_recipe(raw: str | bytes) -> object:
    if isinstance(raw, bytes):
        if len(raw) > MAX_RECIPE_BYTES or not raw:
            raise CommandValidationError("invalid_recipe_size", "Recipe exceeds its size limit.")
        try:
            raw = raw.decode("utf-8", errors="strict")
        except UnicodeDecodeError:
            raise CommandValidationError("invalid_recipe_encoding", "Recipe must be UTF-8.") from None
    if not isinstance(raw, str):
        raise CommandValidationError("invalid_recipe", "Recipe must be JSON text or bytes.")
    try:
        encoded = raw.encode("utf-8", errors="strict")
    except UnicodeEncodeError:
        raise CommandValidationError("invalid_recipe_encoding", "Recipe must be UTF-8.") from None
    if not 1 <= len(encoded) <= MAX_RECIPE_BYTES:
        raise CommandValidationError("invalid_recipe_size", "Recipe exceeds its size limit.")
    try:
        value = cast(
            object,
            json.loads(raw, object_pairs_hook=_unique_object, parse_constant=_reject_constant),
        )
    except CommandValidationError:
        raise
    except (ValueError, TypeError, RecursionError):
        raise CommandValidationError("invalid_recipe_json", "Recipe JSON is malformed.") from None
    return value


def _reject_constant(value: str) -> None:
    raise CommandValidationError("invalid_recipe_number", "Recipe numbers must be finite.")


def export_portable_recipe(plan: ProPlan) -> str:
    """Export a deterministic plan without source pixels, landmarks or filenames."""
    if not isinstance(plan, ProPlan):
        raise CommandValidationError("invalid_recipe_plan", "A typed command plan is required.")
    payload: dict[str, object] = {
        "format": RECIPE_VERSION,
        "plan": plan.as_dict(),
        "sha256": _digest(plan),
    }
    document = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    if len(document.encode("utf-8")) > MAX_RECIPE_BYTES:
        raise CommandValidationError("invalid_recipe_size", "Recipe exceeds its size limit.")
    return document


def import_portable_recipe(
    raw: str | bytes,
    *,
    confirm_weakened_identity: bool = False,
) -> PortableRecipe:
    """Admit a checked recipe. Never treat an imported opt-out as local consent."""
    if type(confirm_weakened_identity) is not bool:
        raise CommandValidationError(
            "invalid_identity_confirmation", "Identity confirmation must be explicit.",
        )
    decoded = _parse_recipe(raw)
    if not isinstance(decoded, dict) or set(decoded) != _ENVELOPE_FIELDS:
        raise CommandValidationError("invalid_recipe_schema", "Recipe fields do not match the schema.")
    if decoded.get("format") != RECIPE_VERSION:
        raise CommandValidationError("invalid_recipe_version", "Recipe version is not supported.")
    supplied = decoded.get("sha256")
    if not isinstance(supplied, str) or _SHA256.fullmatch(supplied) is None:
        raise CommandValidationError("invalid_recipe_digest", "Recipe digest is malformed.")
    plan = pro_plan_from_dict(decoded.get("plan"))
    calculated = _digest(plan)
    if not hmac.compare_digest(supplied, calculated):
        raise CommandValidationError("recipe_integrity_failed", "Recipe contents were modified.")
    weakened = _is_weakened(plan)
    if weakened and not confirm_weakened_identity:
        raise CommandValidationError(
            "identity_reconfirmation_required",
            "Importing an unlocked or warning-only recipe requires a new local user choice.",
        )
    return PortableRecipe(plan, supplied, weakened)


def inspect_portable_recipe(raw: str | bytes) -> PortableRecipe:
    """Inspect (but never execute) a recipe, even one requiring opt-out consent.

    The returned `plan` is untrusted until identity reconfirmation when required.
    Call import_portable_recipe with an actual user confirmation before applying.
    """
    return import_portable_recipe(raw, confirm_weakened_identity=True)
