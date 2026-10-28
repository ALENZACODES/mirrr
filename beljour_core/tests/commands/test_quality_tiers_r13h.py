"""Quality Generator tiers are dimension guarantees, never silent downgrade.

All examples are synthetic, with no face photographs or production weights.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from plumb_api.commands.errors import CommandUnavailable, CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.levels import DecimalLevel
from plumb_api.commands.pro_plan import IdentityPolicy
from plumb_api.commands.quality_tiers import (
    QUALITY_TIER_VERSION,
    TIER_LONG_EDGES,
    QualityTierRecipe,
    checked_tier,
    checked_tier_output,
    parse_quality_tier_commands,
    plan_quality_tier,
    run_quality_tier,
)
from plumb_api.commands.r2h_session import R2HSession
from plumb_api.commands.types import CommandName


@pytest.fixture(scope="module")
def portrait() -> ImageFrame:
    return ImageFrame(960, 540, 3, bytes([117, 123, 131]) * (960 * 540))


@pytest.mark.parametrize("tier,long_edge,scale", [
    ("1080", 1920, 2),
    ("4k", 3840, 4),
])
@pytest.mark.parametrize("tenths", range(10, 51))
def test_both_tiers_cover_all_decimal_steps(
    portrait: ImageFrame, tier: str, long_edge: int, scale: int, tenths: int,
) -> None:
    recipe = QualityTierRecipe(
        checked_tier(tier), DecimalLevel(10), DecimalLevel(tenths),
    )
    plan = plan_quality_tier(portrait, recipe)
    assert plan.output_long_edge == long_edge
    assert plan.upscale_factor == scale
    assert plan.output_width * portrait.height == plan.output_height * portrait.width
    assert plan.pro_plan.identity == IdentityPolicy()
    assert plan.pro_plan.identity.enabled
    assert plan.pro_plan.steps[0].name is CommandName.CLEANUP
    assert plan.pro_plan.steps[0].level.tenths == 10
    assert plan.pro_plan.steps[1].name is CommandName.UPSCALE
    assert plan.pro_plan.steps[1].level.tenths == tenths
    assert plan.pro_plan.steps[1].scale == scale
    assert plan.public_metadata()["meets_tier"] is True
    assert plan.public_metadata()["aspect_ratio_exact"] is True


@pytest.mark.parametrize("command,tier,cleanup,upscale,steps", [
    ("/upscale 1080", "1080", 10, 30, 2),
    ("/upscale 4k 5.0", "4k", 10, 50, 2),
    ("/cleanup 2.4 /upscale 1080 3.1", "1080", 24, 31, 2),
    ("/cleanup 1.0 /upscale 4K 1.0 /identitylock", "4k", 10, 10, 3),
])
def test_parser_and_cleanup_pre_step(
    portrait: ImageFrame, command: str, tier: str,
    cleanup: int, upscale: int, steps: int,
) -> None:
    recipe = parse_quality_tier_commands(command)
    assert recipe.tier == tier
    assert recipe.cleanup_level.tenths == cleanup
    assert recipe.upscale_level.tenths == upscale
    plan = plan_quality_tier(portrait, recipe)
    assert len(plan.pro_plan.steps) == steps
    assert all(step.index == position for position, step in enumerate(plan.pro_plan.steps))
    assert plan.pro_plan.identity.enabled
    assert plan.recipe.public_metadata()["version"] == QUALITY_TIER_VERSION


@pytest.mark.parametrize("bad", [
    "", " ", "/upscale 720", "/upscale 1080 0.9", "/upscale 4k 5.1",
    "/upscale 1080 2.45", "/upscale 1080 2.0 /cleanup 3.0",
    "/cleanup 3.0", "/upscale 4k /identitylock /cleanup 3.0",
    "/upscale 4k; rm -rf /", "/cleanup nan /upscale 4k",
    "/cleanup 3.0 /upscale 1080 2.0 level=3.0",
    "/upscale 4k\n/upscale 1080", "/upscale 1080 2.0 /upscale 4k",
])
def test_unrecognized_commands_do_not_execute(bad: str) -> None:
    with pytest.raises(CommandValidationError) as reason:
        parse_quality_tier_commands(bad)
    assert reason.value.code in ("invalid_quality_command", "invalid_level")


@pytest.mark.parametrize("source,tier,reason", [
    ((100, 90), "1080", "tier_unavailable"),
    ((400, 300), "1080", "tier_unavailable"),
    ((512, 512), "4k", "tier_unavailable"),
    ((4000, 2500), "4k", "tier_unavailable"),
])
def test_no_smaller_output_or_over_budget_allocation(
    source: tuple[int, int], tier: str, reason: str,
) -> None:
    width, height = source
    frame = ImageFrame(width, height, 3, bytes(width * height * 3))
    with pytest.raises(CommandUnavailable) as result:
        plan_quality_tier(frame, QualityTierRecipe(checked_tier(tier)))
    assert result.value.code == reason
    assert "No lower-resolution output" in str(result.value)


def test_no_allocation_from_impossible_4k_request() -> None:
    source = ImageFrame(320, 240, 3, bytes(320 * 240 * 3))
    class ExplodingSession(R2HSession):
        def run(self, *args: object, **kwargs: object) -> None:
            raise AssertionError("an impossible tier must never render")
    session = ExplodingSession(identity=None)
    session.open_photo(source)
    with pytest.raises(CommandUnavailable) as error:
        run_quality_tier(session, source, QualityTierRecipe("4k"))
    assert error.value.code == "tier_unavailable"


def test_missing_identity_model_refuses_without_render(portrait: ImageFrame) -> None:
    session = R2HSession(identity=None)
    session.open_photo(portrait)
    with pytest.raises(CommandUnavailable) as error:
        run_quality_tier(session, portrait, QualityTierRecipe("1080"))
    assert error.value.code == "identity_model_unavailable"


def test_output_checker_fails_if_tier_or_aspect_changes(portrait: ImageFrame) -> None:
    plan = plan_quality_tier(portrait, QualityTierRecipe("1080"))
    output = ImageFrame(plan.output_width, plan.output_height, 3,
                        bytes(plan.output_width * plan.output_height * 3))
    checked_tier_output(plan, output)
    for rejected in (
        ImageFrame(plan.output_width // 2, plan.output_height // 2, 3,
                   bytes(plan.output_width * plan.output_height * 3 // 4)),
        ImageFrame(plan.output_width, plan.output_height - 1, 3,
                   bytes(plan.output_width * (plan.output_height - 1) * 3)),
    ):
        with pytest.raises(CommandValidationError) as error:
            checked_tier_output(plan, rejected)
        assert error.value.code == "tier_shortfall"
    with pytest.raises(CommandValidationError) as error:
        checked_tier_output(replace(plan, source_width=961), output)
    assert error.value.code == "aspect_changed"


def test_lower_bounds_are_contract_and_not_a_1080p_4k_downscale() -> None:
    assert TIER_LONG_EDGES == {"1080": 1920, "4k": 3840}
    for tier in ("1080", "4k"):
        assert plan_quality_tier(
            ImageFrame(1024, 768, 3, bytes(1024 * 768 * 3)),
            QualityTierRecipe(tier),
        ).output_long_edge >= TIER_LONG_EDGES[tier]
