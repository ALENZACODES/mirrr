"""Versioned, immutable command-plan contracts; pure metadata, no face pixels.

Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from enum import StrEnum
from typing import Literal

from .errors import CommandValidationError

PLAN_VERSION: Literal["beljour-commands/1"] = "beljour-commands/1"
MAX_COMMANDS = 12


class CommandName(StrEnum):
    IDENTITYLOCK = "identitylock"
    CLEANUP = "cleanup"
    UPSCALE = "upscale"
    STUDIOQUALITY = "studioquality"
    POSEONLY = "poseonly"


class Strength(StrEnum):
    SUBTLE = "subtle"
    NORMAL = "normal"
    STRONG = "strong"


class LockStrength(StrEnum):
    NORMAL = "normal"
    STRICT = "strict"


class LockMode(StrEnum):
    BLOCK = "block"
    SOFTEN = "soften"
    WARN = "warn"


@dataclass(frozen=True, slots=True)
class CleanupArgs:
    strength: Strength = Strength.NORMAL

    def __post_init__(self) -> None:
        if not isinstance(self.strength, Strength):
            raise CommandValidationError(
                "invalid_strength",
                "Cleanup strength must be subtle, normal or strong.",
            )


@dataclass(frozen=True, slots=True)
class UpscaleArgs:
    scale: Literal[2, 4] = 2

    def __post_init__(self) -> None:
        if type(self.scale) is not int or self.scale not in (2, 4):
            raise CommandValidationError("invalid_scale", "Upscale factor must be 2x or 4x.")


@dataclass(frozen=True, slots=True)
class IdentityLockArgs:
    mode: LockMode = LockMode.SOFTEN
    strength: LockStrength = LockStrength.NORMAL

    def __post_init__(self) -> None:
        if not isinstance(self.mode, LockMode):
            raise CommandValidationError("invalid_mode", "Identity mode must be block, soften or warn.")
        if not isinstance(self.strength, LockStrength):
            raise CommandValidationError(
                "invalid_strength",
                "Identity strength must be normal or strict.",
            )


@dataclass(frozen=True, slots=True)
class StudioQualityArgs:
    strength: Strength = Strength.NORMAL

    def __post_init__(self) -> None:
        if not isinstance(self.strength, Strength):
            raise CommandValidationError(
                "invalid_strength",
                "Studio quality strength must be subtle, normal or strong.",
            )


@dataclass(frozen=True, slots=True)
class PoseOnlyArgs:
    strength: Strength = Strength.SUBTLE

    def __post_init__(self) -> None:
        if not isinstance(self.strength, Strength):
            raise CommandValidationError(
                "invalid_strength",
                "Pose strength must be subtle, normal or strong.",
            )


CommandArgs = CleanupArgs | UpscaleArgs | IdentityLockArgs | StudioQualityArgs | PoseOnlyArgs


def argument_values(args: CommandArgs) -> dict[str, str | int]:
    if isinstance(args, UpscaleArgs):
        return {"scale": args.scale}
    if isinstance(args, IdentityLockArgs):
        return {"mode": args.mode.value, "strength": args.strength.value}
    return {"strength": args.strength.value}


def expected_args(name: CommandName) -> type[CommandArgs]:
    if name is CommandName.CLEANUP:
        return CleanupArgs
    if name is CommandName.UPSCALE:
        return UpscaleArgs
    if name is CommandName.IDENTITYLOCK:
        return IdentityLockArgs
    if name is CommandName.STUDIOQUALITY:
        return StudioQualityArgs
    return PoseOnlyArgs


@dataclass(frozen=True, slots=True)
class CommandStep:
    name: CommandName
    args: CommandArgs
    index: int

    def __post_init__(self) -> None:
        if not isinstance(self.name, CommandName):
            raise CommandValidationError("invalid_command", "Unknown command name.")
        if type(self.index) is not int or self.index < 0 or self.index >= MAX_COMMANDS:
            raise CommandValidationError(
                "invalid_index",
                "Command index is outside the supported range.",
            )
        if type(self.args) is not expected_args(self.name):
            raise CommandValidationError(
                "argument_mismatch",
                "The command arguments do not match the command name.",
                command_index=self.index,
            )

    def as_dict(self) -> dict[str, object]:
        return {"name": self.name.value, "args": argument_values(self.args), "index": self.index}


@dataclass(frozen=True, slots=True)
class CommandPlan:
    steps: tuple[CommandStep, ...]
    version: Literal["beljour-commands/1"] = PLAN_VERSION

    def __post_init__(self) -> None:
        if self.version != PLAN_VERSION:
            raise CommandValidationError("invalid_version", "Unsupported command-plan version.")
        if not isinstance(self.steps, tuple) or not self.steps or len(self.steps) > MAX_COMMANDS:
            raise CommandValidationError(
                "invalid_plan_size",
                f"A plan needs between 1 and {MAX_COMMANDS} commands.",
            )
        for index, step in enumerate(self.steps):
            if not isinstance(step, CommandStep) or step.index != index:
                raise CommandValidationError(
                    "invalid_step_order",
                    "Command indexes must start at zero and be ordered.",
                )

    def as_dict(self) -> dict[str, object]:
        return {"version": self.version, "steps": [step.as_dict() for step in self.steps]}

    def canonical_json(self) -> str:
        return json.dumps(self.as_dict(), sort_keys=True, separators=(",", ":"), ensure_ascii=True)

    def fingerprint(self) -> str:
        """Hash only the recipe, never source pixels or an identifier for a person."""
        return hashlib.sha256(self.canonical_json().encode("utf-8")).hexdigest()

    def commands(self) -> tuple[CommandName, ...]:
        return tuple(step.name for step in self.steps)
