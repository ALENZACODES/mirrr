"""Small, deterministic grammar for slash-command chains and typed plans.

A slash starts a new step. Everything after it belongs to that step until
another slash. No shell execution, expansion, filesystem or external network.
Author: John Khan.
"""

from __future__ import annotations

import re
import shlex

from .errors import CommandParseError
from .registry import COMMAND_REGISTRY, CommandDefinition, CommandRegistry
from .types import MAX_COMMANDS, CommandPlan, CommandStep

MAX_SOURCE_LENGTH = 1024
_COMMAND_TOKEN = re.compile(r"^/[A-Za-z]+$")
_PARAMETER_KEY = re.compile(r"^[a-z][a-z_]*$")


def _argument_tokens(definition: CommandDefinition, tokens: list[str], index: int) -> dict[str, str]:
    parameters = definition.parameters
    values: dict[str, str] = {}
    position = 0
    for token in tokens:
        if token.startswith("/"):
            raise CommandParseError(
                "malformed_command",
                "Command names must be /NAME without a path or inline values.",
                command_index=index,
            )
        if "=" in token:
            name, value = token.split("=", 1)
            key = name.lower()
            if not _PARAMETER_KEY.fullmatch(key) or not value:
                raise CommandParseError(
                    "invalid_parameter",
                    "Parameters use key=value with a non-empty value.",
                    command_index=index,
                )
        else:
            candidates = [parameter for parameter in parameters if parameter.positional]
            # A named value consumes its slot, even when followed by positional values.
            while position < len(candidates) and candidates[position].key in values:
                position += 1
            if definition.name.value == "identitylock":
                matching = [
                    item for item in candidates
                    if token.lower() in item.choices and item.key not in values
                ]
                if len(matching) == 1:
                    key = matching[0].key
                    values[key] = token.lower()
                    continue
            if position >= len(candidates):
                raise CommandParseError(
                    "too_many_arguments",
                    f"Too many arguments for /{definition.name.value}.",
                    command_index=index,
                )
            key = candidates[position].key
            position += 1
            value = token
        if key in values:
            raise CommandParseError(
                "duplicate_parameter",
                f"Parameter {key} is supplied more than once.",
                command_index=index,
                parameter=key,
            )
        values[key] = value.lower()
    return values


def parse_commands(text: str, *, registry: CommandRegistry = COMMAND_REGISTRY) -> CommandPlan:
    """Parse a chain such as '/cleanup strong /upscale 2x /identitylock soften strict'."""
    if not isinstance(text, str) or len(text) > MAX_SOURCE_LENGTH:
        raise CommandParseError("invalid_source", "The command string must be at most 1024 characters.")
    if "\x00" in text or any(ord(character) < 32 and character not in " \t\r\n" for character in text):
        raise CommandParseError("invalid_character", "Control characters are not allowed in commands.")
    try:
        tokens = shlex.split(text, comments=False, posix=True)
    except ValueError:
        raise CommandParseError("invalid_quotes", "The command contains an unmatched quote.") from None
    if not tokens:
        raise CommandParseError("empty_commands", "Enter at least one /command.")
    if not _COMMAND_TOKEN.fullmatch(tokens[0]):
        raise CommandParseError("missing_command", "The first token must be a /command.")
    steps: list[CommandStep] = []
    current_name: str | None = None
    current_args: list[str] = []

    def flush() -> None:
        nonlocal current_name, current_args
        if current_name is None:
            return
        index = len(steps)
        if index >= MAX_COMMANDS:
            raise CommandParseError(
                "too_many_commands",
                f"At most {MAX_COMMANDS} commands are supported.",
            )
        definition = registry.lookup(current_name, index=index)
        arguments = _argument_tokens(definition, current_args, index)
        settings = registry.construct(definition, arguments, index=index)
        steps.append(CommandStep(definition.name, settings, index))
        current_name = None
        current_args = []

    for token in tokens:
        if _COMMAND_TOKEN.fullmatch(token):
            flush()
            current_name = token[1:]
        elif current_name is None:
            raise CommandParseError("missing_command", "An argument needs a preceding /command.")
        else:
            current_args.append(token)
    flush()
    return CommandPlan(tuple(steps))


def parse_single(text: str, *, registry: CommandRegistry = COMMAND_REGISTRY) -> CommandStep:
    plan = parse_commands(text, registry=registry)
    if len(plan.steps) != 1:
        raise CommandParseError("not_single", "Expected exactly one command.")
    return plan.steps[0]
