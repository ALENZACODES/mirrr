"""Decimal-first, chainable Pro Command plans with guard-on default.

The version-1 named-stop command parser remains supported for old recipes. A
ProPlan is the production surface: every effect step carries a decimal level
and an explicit identity policy which defaults to enabled and fail-closed.
No image bytes or names are serialized.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
import re
import shlex
from dataclasses import dataclass, field

from .errors import CommandParseError, CommandValidationError
from .levels import DecimalLevel
from .types import MAX_COMMANDS, CommandName, LockMode, LockStrength

_VERSION = "beljour-pro-plan/1"
_COMMAND = re.compile(r"^/[a-z][a-z0-9]*$", re.IGNORECASE)
_SCALE = frozenset(("2x", "4x"))


@dataclass(frozen=True, slots=True)
class IdentityPolicy:
    enabled: bool = True
    mode: LockMode = LockMode.SOFTEN
    strength: LockStrength = LockStrength.NORMAL
    explicit_user_override: bool = False

    def __post_init__(self) -> None:
        if type(self.enabled) is not bool or type(self.explicit_user_override) is not bool:
            raise CommandValidationError("invalid_lock_policy", "Identity policy flags must be boolean.")
        if not isinstance(self.mode, LockMode) or not isinstance(self.strength, LockStrength):
            raise CommandValidationError("invalid_lock_policy", "Identity lock settings are invalid.")
        if (not self.enabled or self.mode is LockMode.WARN) and not self.explicit_user_override:
            raise CommandValidationError(
                "identity_override_required",
                "Identity protection can be weakened only by an explicit user action.",
            )

    def as_dict(self) -> dict[str, object]:
        return {
            "enabled": self.enabled,
            "mode": self.mode.value,
            "strength": self.strength.value,
            "explicit_user_override": self.explicit_user_override,
        }

    def with_user_override(
        self,
        *,
        enabled: bool = True,
        mode: LockMode = LockMode.SOFTEN,
        strength: LockStrength = LockStrength.NORMAL,
    ) -> IdentityPolicy:
        return IdentityPolicy(enabled, mode, strength, True)


@dataclass(frozen=True, slots=True)
class ProStep:
    name: CommandName
    level: DecimalLevel = field(default_factory=DecimalLevel)
    scale: int = 2
    index: int = 0

    def __post_init__(self) -> None:
        if not isinstance(self.name, CommandName) or not isinstance(self.level, DecimalLevel):
            raise CommandValidationError("invalid_pro_step", "Pro step has invalid typed arguments.")
        if type(self.index) is not int or not 0 <= self.index < MAX_COMMANDS:
            raise CommandValidationError("invalid_pro_step", "Pro step index is invalid.")
        if type(self.scale) is not int or self.scale not in (2, 4):
            raise CommandValidationError("invalid_scale", "Pro upscale scale must be 2x or 4x.")
        if self.name is not CommandName.UPSCALE and self.scale != 2:
            raise CommandValidationError("invalid_scale", "Only /upscale may change scale.")

    def as_dict(self) -> dict[str, object]:
        return {
            "name": self.name.value, "level": self.level.label,
            "scale": self.scale, "index": self.index,
        }


@dataclass(frozen=True, slots=True)
class ProPlan:
    steps: tuple[ProStep, ...]
    identity: IdentityPolicy = field(default_factory=IdentityPolicy)
    version: str = _VERSION

    def __post_init__(self) -> None:
        if self.version != _VERSION:
            raise CommandValidationError("invalid_version", "Unsupported Pro plan version.")
        if not isinstance(self.identity, IdentityPolicy):
            raise CommandValidationError("invalid_lock_policy", "Pro plan needs an identity policy.")
        if not isinstance(self.steps, tuple) or not 1 <= len(self.steps) <= MAX_COMMANDS:
            raise CommandValidationError("invalid_plan_size", "Pro plan has an invalid command count.")
        for index, step in enumerate(self.steps):
            if not isinstance(step, ProStep) or step.index != index:
                raise CommandValidationError(
                    "invalid_step_order", "Pro plan indexes must be contiguous.",
                )

    def as_dict(self) -> dict[str, object]:
        return {
            "version": self.version,
            "identity": self.identity.as_dict(),
            "steps": [step.as_dict() for step in self.steps],
        }

    def canonical_json(self) -> str:
        return json.dumps(self.as_dict(), sort_keys=True, separators=(",", ":"), ensure_ascii=True)

    def fingerprint(self) -> str:
        return hashlib.sha256(self.canonical_json().encode("utf-8")).hexdigest()

    def with_identity(self, policy: IdentityPolicy) -> ProPlan:
        return ProPlan(self.steps, policy)

    def edit_level(self, index: int, level: DecimalLevel) -> ProPlan:
        if type(index) is not int or not 0 <= index < len(self.steps):
            raise CommandValidationError("invalid_index", "Selected command does not exist.")
        if not isinstance(level, DecimalLevel):
            raise CommandValidationError("invalid_level", "Level must be an exact decimal level.")
        updated = tuple(
            ProStep(step.name, level if i == index else step.level, step.scale, i)
            for i, step in enumerate(self.steps)
        )
        return ProPlan(updated, self.identity)


def _read_step(name: str, arguments: list[str], index: int) -> ProStep:
    try:
        command = CommandName(name.casefold())
    except ValueError:
        raise CommandParseError("unknown_command", "Unknown Pro command.", command_index=index) from None
    found: dict[str, str] = {}
    for token in arguments:
        if "=" in token:
            key, value = token.split("=", 1)
            key = key.casefold()
        elif command is CommandName.UPSCALE and token.casefold() in _SCALE:
            key, value = "scale", token
        else:
            key, value = "level", token
        if key not in ("level", "scale"):
            raise CommandParseError(
                "unknown_parameter",
                "Only level and scale are supported in Pro steps.",
                command_index=index,
            )
        if key in found:
            raise CommandParseError(
                "duplicate_parameter", "Pro parameter repeated.", command_index=index,
            )
        found[key] = value
    if command is not CommandName.UPSCALE and "scale" in found:
        raise CommandParseError(
            "unknown_parameter", "Only /upscale accepts a scale.", command_index=index,
        )
    raw_scale = found.get("scale", "2x").casefold()
    if command is CommandName.UPSCALE and raw_scale not in _SCALE:
        raise CommandParseError("invalid_scale", "Scale must be 2x or 4x.", command_index=index)
    if "level" in found:
        try:
            level = DecimalLevel.parse(found["level"])
        except CommandValidationError:
            raise CommandParseError(
                "invalid_level", "Use level=1.0 to level=5.0 in 0.1 increments.", command_index=index,
            ) from None
    else:
        level = DecimalLevel()
    scale = int(raw_scale[0]) if command is CommandName.UPSCALE else 2
    return ProStep(command, level, scale, index)


def parse_pro_commands(text: str, *, policy: IdentityPolicy | None = None) -> ProPlan:
    if not isinstance(text, str) or not text.strip():
        raise CommandParseError("empty_commands", "A Pro command is required.")
    if len(text) > 2048 or any(ord(char) < 32 and char not in "\r\n\t" for char in text):
        raise CommandParseError("invalid_commands", "Pro command text is invalid or too long.")
    try:
        tokens = shlex.split(text)
    except ValueError:
        raise CommandParseError("invalid_quotes", "Pro command quotations are invalid.") from None
    steps: list[ProStep] = []
    current: str | None = None
    arguments: list[str] = []
    for token in tokens:
        if _COMMAND.fullmatch(token) is not None:
            if current is not None:
                steps.append(_read_step(current, arguments, len(steps)))
            current = token[1:]
            arguments = []
        elif current is None or token.startswith("/"):
            raise CommandParseError("invalid_commands", "Arguments must follow a valid /command.")
        else:
            arguments.append(token)
    if current is not None:
        steps.append(_read_step(current, arguments, len(steps)))
    return ProPlan(tuple(steps), policy if policy is not None else IdentityPolicy())


def pro_plan_from_dict(raw: object) -> ProPlan:
    if not isinstance(raw, dict) or set(raw) != {"version", "identity", "steps"}:
        raise CommandValidationError("invalid_pro_plan", "Plan must use the exact Pro schema.")
    if raw["version"] != _VERSION or not isinstance(raw["identity"], dict):
        raise CommandValidationError("invalid_pro_plan", "Plan schema version or identity is invalid.")
    entry = raw["identity"]
    if set(entry) != {"enabled", "mode", "strength", "explicit_user_override"}:
        raise CommandValidationError("invalid_lock_policy", "Identity policy fields are incomplete.")
    try:
        policy = IdentityPolicy(
            entry["enabled"], LockMode(entry["mode"]), LockStrength(entry["strength"]),
            entry["explicit_user_override"],
        )
    except (TypeError, ValueError):
        raise CommandValidationError(
            "invalid_lock_policy", "Identity policy fields are invalid.",
        ) from None
    entries = raw["steps"]
    if not isinstance(entries, list) or not 1 <= len(entries) <= MAX_COMMANDS:
        raise CommandValidationError("invalid_plan_size", "Pro plan needs 1 to 12 steps.")
    steps: list[ProStep] = []
    for index, value in enumerate(entries):
        if not isinstance(value, dict) or set(value) != {"name", "level", "scale", "index"}:
            raise CommandValidationError("invalid_pro_step", "Pro step fields are invalid.")
        try:
            name = CommandName(value["name"])
        except (TypeError, ValueError):
            raise CommandValidationError("invalid_pro_step", "Pro command is invalid.") from None
        steps.append(ProStep(name, DecimalLevel.parse(value["level"]), value["scale"], value["index"]))
        if steps[-1].index != index:
            raise CommandValidationError("invalid_step_order", "Pro step indexes must be contiguous.")
    return ProPlan(tuple(steps), policy)


def pro_plan_from_json(text: str) -> ProPlan:
    if not isinstance(text, str) or len(text) > 8192:
        raise CommandValidationError("invalid_pro_plan", "Pro plan JSON is too long or missing.")
    try:
        decoded = json.loads(text)
    except (ValueError, TypeError):
        raise CommandValidationError("invalid_pro_plan", "Pro plan JSON is malformed.") from None
    return pro_plan_from_dict(decoded)
