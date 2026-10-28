"""Strict, recipe-only import/export. No photo, landmark or biometric values.

Author: John Khan.
"""

from __future__ import annotations

import json
from collections.abc import Mapping

from .errors import CommandParseError, CommandValidationError
from .registry import COMMAND_REGISTRY, CommandRegistry
from .types import MAX_COMMANDS, PLAN_VERSION, CommandPlan, CommandStep

MAX_JSON_BYTES = 4096


def _object(value: object, *, expected: set[str], label: str) -> Mapping[str, object]:
    if not isinstance(value, dict):
        raise CommandValidationError("invalid_recipe", f"{label} must be an object.")
    if any(not isinstance(key, str) for key in value):
        raise CommandValidationError("invalid_recipe", f"{label} object keys must be strings.")
    typed: Mapping[str, object] = value
    if set(typed) != expected:
        raise CommandValidationError(
            "invalid_recipe_fields",
            f"{label} contains missing or unexpected fields.",
        )
    return typed


def plan_from_dict(
    value: object,
    *,
    registry: CommandRegistry = COMMAND_REGISTRY,
) -> CommandPlan:
    record = _object(value, expected={"version", "steps"}, label="Plan")
    if record["version"] != PLAN_VERSION:
        raise CommandValidationError("invalid_version", "Unsupported command-plan version.")
    steps_value = record["steps"]
    if not isinstance(steps_value, list) or not 1 <= len(steps_value) <= MAX_COMMANDS:
        raise CommandValidationError("invalid_plan_size", "Plan step count is invalid.")
    steps: list[CommandStep] = []
    for index, raw in enumerate(steps_value):
        entry = _object(raw, expected={"name", "args", "index"}, label="Step")
        if type(entry["index"]) is not int or entry["index"] != index:
            raise CommandValidationError("invalid_step_order", "Plan step indexes must be sequential.")
        raw_name = entry["name"]
        if not isinstance(raw_name, str):
            raise CommandValidationError("invalid_command", "Command name must be a string.")
        definition = registry.lookup(raw_name, index=index)
        arguments = entry["args"]
        if not isinstance(arguments, dict):
            raise CommandValidationError("invalid_arguments", "Command args must be an object.")
        options: dict[str, str] = {}
        for key, option in arguments.items():
            if not isinstance(key, str):
                raise CommandValidationError("invalid_arguments", "Command keys must be strings.")
            if key == "scale" and type(option) is int and option in (2, 4):
                options[key] = f"{option}x"
            elif isinstance(option, str):
                options[key] = option
            else:
                raise CommandValidationError(
                    "invalid_arguments",
                    "Command parameter has the wrong type.",
                )
        try:
            settings = registry.construct(definition, options, index=index)
        except CommandParseError as error:
            raise CommandValidationError(
                error.code,
                str(error),
                command_index=index,
                parameter=error.detail.parameter,
            ) from None
        required = {parameter.key for parameter in definition.parameters}
        if set(options) != required:
            raise CommandValidationError(
                "missing_arguments",
                "Serialized command parameters must all be present.",
            )
        steps.append(CommandStep(definition.name, settings, index))
    return CommandPlan(tuple(steps))


def plan_from_json(text: str, *, registry: CommandRegistry = COMMAND_REGISTRY) -> CommandPlan:
    if not isinstance(text, str) or len(text.encode("utf-8")) > MAX_JSON_BYTES:
        raise CommandValidationError("oversized_recipe", "Command recipe is too large.")
    try:
        value: object = json.loads(text)
    except (ValueError, TypeError):
        raise CommandValidationError("invalid_json", "Command recipe JSON is invalid.") from None
    return plan_from_dict(value, registry=registry)
