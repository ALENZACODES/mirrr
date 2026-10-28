"""Lane H command grammar and deterministic recipe tests. Author: John Khan."""

from __future__ import annotations

import json

import pytest

from plumb_api.commands import COMMAND_REGISTRY
from plumb_api.commands import CleanupArgs
from plumb_api.commands import CommandName
from plumb_api.commands import CommandParseError
from plumb_api.commands import CommandPlan
from plumb_api.commands import CommandStep
from plumb_api.commands import CommandValidationError
from plumb_api.commands import IdentityLockArgs
from plumb_api.commands import LockMode
from plumb_api.commands import LockStrength
from plumb_api.commands import PoseOnlyArgs
from plumb_api.commands import Strength
from plumb_api.commands import UpscaleArgs
from plumb_api.commands import parse_commands
from plumb_api.commands import parse_single
from plumb_api.commands import plan_from_dict
from plumb_api.commands import plan_from_json
from plumb_api.commands.registry import CommandDefinition
from plumb_api.commands.registry import CommandRegistry
from plumb_api.commands.registry import ParameterSpec


@pytest.mark.parametrize(
    ("source", "names"),
    [
        ("/cleanup", (CommandName.CLEANUP,)),
        ("/CLEANUP /upscale 2x", (CommandName.CLEANUP, CommandName.UPSCALE)),
        (
            "/cleanup /upscale 2x /identitylock",
            (CommandName.CLEANUP, CommandName.UPSCALE, CommandName.IDENTITYLOCK),
        ),
        (
            "/poseonly /studioquality /identitylock warn strict",
            (CommandName.POSEONLY, CommandName.STUDIOQUALITY, CommandName.IDENTITYLOCK),
        ),
        ("  /identitylock mode=block strength=strict ", (CommandName.IDENTITYLOCK,)),
        ("/upscale scale=4x", (CommandName.UPSCALE,)),
        ("/cleanup strength=strong", (CommandName.CLEANUP,)),
    ],
)
def test_chain_order_and_case(source: str, names: tuple[CommandName, ...]) -> None:
    plan = parse_commands(source)
    assert plan.commands() == names
    assert tuple(step.index for step in plan.steps) == tuple(range(len(names)))


@pytest.mark.parametrize("factor", ["2x", "4x"])
def test_valid_scale(factor: str) -> None:
    plan = parse_commands(f"/upscale {factor}")
    assert plan.steps[0].args == UpscaleArgs(int(factor[0]))


@pytest.mark.parametrize("level", list(Strength))
def test_strength_choices(level: Strength) -> None:
    assert parse_single(f"/cleanup {level.value}").args == CleanupArgs(level)
    assert parse_single(f"/studioquality {level.value}").args.strength == level
    assert parse_single(f"/poseonly {level.value}").args == PoseOnlyArgs(level)


def test_defaults_match_editor_intent() -> None:
    assert parse_single("/identitylock").args == IdentityLockArgs()
    assert parse_single("/poseonly").args == PoseOnlyArgs(Strength.SUBTLE)
    assert parse_single("/upscale").args == UpscaleArgs(2)
    assert parse_single("/cleanup").args == CleanupArgs(Strength.NORMAL)


@pytest.mark.parametrize("mode", list(LockMode))
@pytest.mark.parametrize("level", list(LockStrength))
def test_every_identity_mode_and_strength(mode: LockMode, level: LockStrength) -> None:
    args = parse_single(f"/identitylock mode={mode.value} strength={level.value}").args
    assert args == IdentityLockArgs(mode, level)
    assert parse_single(f"/identitylock {mode.value} {level.value}").args == args
    assert parse_single(f"/identitylock {level.value} {mode.value}").args == args


def test_named_and_positional_mixing() -> None:
    assert parse_single("/identitylock mode=warn strict").args == IdentityLockArgs(
        LockMode.WARN, LockStrength.STRICT,
    )
    assert parse_single("/identitylock strength=strict block").args == IdentityLockArgs(
        LockMode.BLOCK, LockStrength.STRICT,
    )
    assert parse_single("/identitylock strict").args == IdentityLockArgs(
        LockMode.SOFTEN, LockStrength.STRICT,
    )


@pytest.mark.parametrize(
    ("source", "expected"),
    [
        ("", "empty_commands"),
        ("   ", "empty_commands"),
        ("cleanup", "missing_command"),
        ("/nonsense", "unknown_command"),
        ("/upscale 3x", "invalid_parameter"),
        ("/upscale 1x", "invalid_parameter"),
        ("/upscale 8x", "invalid_parameter"),
        ("/upscale -2x", "invalid_parameter"),
        ("/upscale scale=true", "invalid_parameter"),
        ("/cleanup strength=", "invalid_parameter"),
        ("/cleanup turbo", "invalid_parameter"),
        ("/identitylock level=strict", "unknown_parameter"),
        ("/identitylock warn extra", "invalid_parameter"),
        ("/identitylock block strength=super", "invalid_parameter"),
        ("/cleanup strength=strong strength=subtle", "duplicate_parameter"),
        ("/upscale 2x scale=4x", "duplicate_parameter"),
        ("/identitylock warn mode=warn", "duplicate_parameter"),
        ("/cleanup subtle strong", "too_many_arguments"),
        ("/identitylock block strict verbose", "too_many_arguments"),
        ("/identitylock /upscale 4x trailing", "too_many_arguments"),
        ("/cleanup key=value=extra", "unknown_parameter"),
        ("/cleanup ?", "invalid_parameter"),
        ("/cleanup \"unfinished", "invalid_quotes"),
        ("/foo/bar", "missing_command"),
        ("/cleanup //upscale", "malformed_command"),
        ("/cleanup /upscale/", "malformed_command"),
        ("/cleanup /upscale=4x", "malformed_command"),
        ("/identitylock \x00", "invalid_character"),
        ("/cleanup\x01", "invalid_character"),
    ],
)
def test_parse_error_codes(source: str, expected: str) -> None:
    with pytest.raises(CommandParseError) as error:
        parse_commands(source)
    assert error.value.code == expected
    assert error.value.as_dict()["code"] == expected


def test_parse_length_limit_and_command_count() -> None:
    with pytest.raises(CommandParseError, match="1024"):
        parse_commands("/cleanup " + "x" * 1025)
    with pytest.raises(CommandParseError) as error:
        parse_commands(" ".join(["/cleanup"] * 13))
    assert error.value.code == "too_many_commands"
    assert len(parse_commands(" ".join(["/cleanup"] * 12)).steps) == 12


def test_quotation_and_escape_are_data_not_commands() -> None:
    # shlex never evaluates operators, environment variables, or subprocesses.
    with pytest.raises(CommandParseError):
        parse_commands("/cleanup '$(printf hacked)'")
    with pytest.raises(CommandParseError):
        parse_commands("/cleanup 'subtle;rm -rf /'")
    with pytest.raises(CommandParseError):
        parse_commands("/cleanup strength=$SECRET")


def test_single_refuses_chain() -> None:
    with pytest.raises(CommandParseError) as error:
        parse_single("/cleanup /upscale")
    assert error.value.code == "not_single"


def test_plan_hash_stable_between_syntaxes() -> None:
    first = parse_commands("/cleanup normal /identitylock soften strict")
    second = parse_commands("/CLEANUP strength=NORMAL /identitylock strength=strict mode=soften")
    assert first == second
    assert first.fingerprint() == second.fingerprint()
    assert len(first.fingerprint()) == 64
    assert "photo" not in first.canonical_json()


def test_plan_json_and_dictionary_roundtrip() -> None:
    plan = parse_commands("/cleanup strong /upscale 4x /identitylock block strict")
    serialized = plan.canonical_json()
    assert plan_from_json(serialized) == plan
    assert plan_from_dict(plan.as_dict()) == plan
    assert json.loads(serialized)["steps"][1]["args"] == {"scale": 4}


@pytest.mark.parametrize(
    "mutator",
    [
        lambda p: p.update({"version": "beljour-commands/99"}),
        lambda p: p.update({"other": "field"}),
        lambda p: p["steps"].append({"index": 0, "name": "cleanup", "args": {"strength": "normal"}}),
        lambda p: p["steps"][0].update({"name": "unknown"}),
        lambda p: p["steps"][0].update({"index": 7}),
        lambda p: p["steps"][0]["args"].update({"scale": "2x"}),
        lambda p: p["steps"][0]["args"].pop("strength"),
        lambda p: p["steps"][0].update({"args": {"strength": 3}}),
        lambda p: p["steps"][0].update({"args": {"strength": True}}),
    ],
)
def test_untrusted_recipe_rejected(mutator: object) -> None:
    plan = parse_commands("/cleanup")
    body = plan.as_dict()
    mutator(body)
    with pytest.raises((CommandParseError, CommandValidationError)):
        plan_from_dict(body)


def test_scale_boolean_never_treated_as_integer() -> None:
    body = parse_commands("/upscale").as_dict()
    body["steps"][0]["args"]["scale"] = True
    with pytest.raises(CommandValidationError):
        plan_from_dict(body)


@pytest.mark.parametrize("raw", ["", "{", "[]", "null", "\"word\"", "0", "{" + " " * 4096 + "}"])
def test_recipe_json_rejected(raw: str) -> None:
    with pytest.raises(CommandValidationError):
        plan_from_json(raw)


def test_constructor_validation_cannot_be_bypassed() -> None:
    with pytest.raises(CommandValidationError):
        UpscaleArgs(True)
    with pytest.raises(CommandValidationError):
        CommandStep(CommandName.UPSCALE, CleanupArgs(), 0)
    with pytest.raises(CommandValidationError):
        CommandPlan((CommandStep(CommandName.CLEANUP, CleanupArgs(), 1),))
    with pytest.raises(CommandValidationError):
        CommandPlan(())


def test_command_registry_is_declarative_and_complete() -> None:
    desc = COMMAND_REGISTRY.describe()
    assert len(desc) == 5
    assert {value["name"] for value in desc} == {
        "/identitylock", "/cleanup", "/upscale", "/studioquality", "/poseonly",
    }
    assert {value["name"] for value in desc if value["engine_ready"]} == {"/identitylock"}
    with pytest.raises(ValueError):
        CommandRegistry((COMMAND_REGISTRY.definitions()[0], COMMAND_REGISTRY.definitions()[0]))
    with pytest.raises(ValueError):
        CommandDefinition(
            CommandName.CLEANUP,
            (ParameterSpec("strength", ("normal",), "nope"),),
            "bad",
            False,
        )
