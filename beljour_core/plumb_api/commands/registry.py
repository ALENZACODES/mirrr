"""Declarative command catalogue with strict, typed argument construction.

Catalogue entries are planning contracts, not claims that effects ship in r1h.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass

from .errors import CommandParseError
from .types import (
    CleanupArgs,
    CommandArgs,
    CommandName,
    IdentityLockArgs,
    LockMode,
    LockStrength,
    PoseOnlyArgs,
    Strength,
    StudioQualityArgs,
    UpscaleArgs,
)


@dataclass(frozen=True, slots=True)
class ParameterSpec:
    key: str
    choices: tuple[str, ...]
    default: str
    positional: bool = True


@dataclass(frozen=True, slots=True)
class CommandDefinition:
    name: CommandName
    parameters: tuple[ParameterSpec, ...]
    description: str
    engine_ready: bool

    def __post_init__(self) -> None:
        keys = [parameter.key for parameter in self.parameters]
        if len(set(keys)) != len(keys):
            raise ValueError("Duplicate parameter schema keys are not allowed.")
        for parameter in self.parameters:
            if parameter.default not in parameter.choices or not parameter.choices:
                raise ValueError("Parameter defaults must be valid choices.")


DEFAULT_DEFINITIONS = (
    CommandDefinition(
        CommandName.IDENTITYLOCK,
        (
            ParameterSpec("mode", ("block", "soften", "warn"), "soften"),
            ParameterSpec("strength", ("normal", "strict"), "normal"),
        ),
        "Compare original and edited face embeddings. Block, soften or warn.",
        True,
    ),
    CommandDefinition(
        CommandName.CLEANUP,
        (ParameterSpec("strength", ("subtle", "normal", "strong"), "normal"),),
        "Local, region-aware blemish and distraction cleanup (r2h).",
        False,
    ),
    CommandDefinition(
        CommandName.UPSCALE,
        (ParameterSpec("scale", ("2x", "4x"), "2x"),),
        "Deterministic locally tiled 2x or 4x upscale (r2h).",
        False,
    ),
    CommandDefinition(
        CommandName.STUDIOQUALITY,
        (ParameterSpec("strength", ("subtle", "normal", "strong"), "normal"),),
        "Bounded, local studio-level colour and detail correction (r3h).",
        False,
    ),
    CommandDefinition(
        CommandName.POSEONLY,
        (ParameterSpec("strength", ("subtle", "normal", "strong"), "subtle"),),
        "Pose-only local warp without face reshape (r4h).",
        False,
    ),
)


class CommandRegistry:
    """Unambiguous command names; no dynamic imports or provider-side effects."""

    def __init__(self, definitions: tuple[CommandDefinition, ...] = DEFAULT_DEFINITIONS) -> None:
        self._definitions: dict[CommandName, CommandDefinition] = {}
        for definition in definitions:
            if definition.name in self._definitions:
                raise ValueError("Duplicate command definitions are not allowed.")
            self._definitions[definition.name] = definition

    def lookup(self, name: str, *, index: int | None = None) -> CommandDefinition:
        normalized = name.strip().lower()
        try:
            command = CommandName(normalized)
        except ValueError:
            raise CommandParseError(
                "unknown_command",
                "Unknown command. Available: /identitylock, /cleanup, /upscale, "
                "/studioquality, /poseonly.",
                command_index=index,
            ) from None
        definition = self._definitions.get(command)
        if definition is None:
            raise CommandParseError(
                "command_unavailable", "This command is not enabled.", command_index=index,
            )
        return definition

    def definitions(self) -> tuple[CommandDefinition, ...]:
        return tuple(self._definitions.values())

    def describe(self) -> tuple[dict[str, object], ...]:
        return tuple(
            {
                "name": f"/{definition.name.value}",
                "engine_ready": definition.engine_ready,
                "description": definition.description,
                "parameters": [
                    {
                        "name": parameter.key,
                        "choices": list(parameter.choices),
                        "default": parameter.default,
                    }
                    for parameter in definition.parameters
                ],
            }
            for definition in self.definitions()
        )

    def construct(
        self,
        definition: CommandDefinition,
        values: dict[str, str],
        *,
        index: int,
    ) -> CommandArgs:
        allowed = {parameter.key for parameter in definition.parameters}
        unknown = set(values) - allowed
        if unknown:
            raise CommandParseError(
                "unknown_parameter",
                f"Unsupported parameter: {sorted(unknown)[0]}.",
                command_index=index,
            )
        choices: dict[str, str] = {}
        for parameter in definition.parameters:
            value = values.get(parameter.key, parameter.default).lower()
            if value not in parameter.choices:
                raise CommandParseError(
                    "invalid_parameter",
                    f"{parameter.key} must be one of: {', '.join(parameter.choices)}.",
                    command_index=index,
                    parameter=parameter.key,
                )
            choices[parameter.key] = value
        name = definition.name
        if name is CommandName.UPSCALE:
            return UpscaleArgs(2) if choices["scale"] == "2x" else UpscaleArgs(4)
        if name is CommandName.IDENTITYLOCK:
            return IdentityLockArgs(LockMode(choices["mode"]), LockStrength(choices["strength"]))
        strength = Strength(choices["strength"])
        if name is CommandName.CLEANUP:
            return CleanupArgs(strength)
        if name is CommandName.STUDIOQUALITY:
            return StudioQualityArgs(strength)
        return PoseOnlyArgs(strength)


COMMAND_REGISTRY = CommandRegistry()
