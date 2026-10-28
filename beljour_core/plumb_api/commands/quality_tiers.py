"""BELJOUR quality-generator tiers built on guarded local Pro Commands.

A tier is a guaranteed minimum long edge, not an alias for a fixed 2x or
4x resize. Only the existing, tested 2x/4x engines are usable here; inputs
which cannot reach the requested tier within the 24 MP budget fail before
cleanup. This deliberately does not invent a neural super-resolution engine.

The canonical pipeline always starts with /CLEANUP, then /UPSCALE. Each step
passes the existing default-on identity guard before the transaction commits.
Both operations preserve the source aspect ratio by integral scaling.
Author: John Khan.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from typing import Literal

from .errors import CommandUnavailable, CommandValidationError
from .frames import MAX_IMAGE_PIXELS, ImageFrame
from .guarded import ProExecutionResult
from .levels import DecimalLevel
from .performance import RenderQuality
from .pro_plan import IdentityPolicy, ProPlan, ProStep
from .r2h_session import R2HSession
from .types import CommandName

QualityTier = Literal["1080", "4k"]
TIER_LONG_EDGES: dict[QualityTier, int] = {"1080": 1920, "4k": 3840}
QUALITY_TIER_VERSION = "beljour-quality-generator/1"
_PIPELINE = re.compile(
    r"^(?:/cleanup (?P<cleanup>[1-5](?:\.[0-9])?) )?"
    r"/upscale (?P<tier>1080|4k)"
    r"(?: (?P<upscale>[1-5](?:\.[0-9])?))?"
    r"(?P<lock> /identitylock)?$",
    flags=re.IGNORECASE,
)


def checked_tier(value: object) -> QualityTier:
    if value == "1080":
        return "1080"
    if value in ("4k", "4K"):
        return "4k"
    raise CommandValidationError(
        "invalid_tier", "Quality Generator supports only 1080 or 4K tiers.",
    )


@dataclass(frozen=True, slots=True)
class QualityTierRecipe:
    tier: QualityTier
    cleanup_level: DecimalLevel = field(default_factory=lambda: DecimalLevel(10))
    upscale_level: DecimalLevel = field(default_factory=DecimalLevel)
    explicit_identity_step: bool = False

    def __post_init__(self) -> None:
        checked_tier(self.tier)
        if not isinstance(self.cleanup_level, DecimalLevel):
            raise CommandValidationError("invalid_level", "Cleanup level must be a decimal stop.")
        if not isinstance(self.upscale_level, DecimalLevel):
            raise CommandValidationError("invalid_level", "Upscale level must be a decimal stop.")
        if type(self.explicit_identity_step) is not bool:
            raise CommandValidationError(
                "invalid_lock_policy", "Explicit lock flag must be boolean.",
            )

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": QUALITY_TIER_VERSION,
            "tier": self.tier,
            "minimum_long_edge": TIER_LONG_EDGES[self.tier],
            "cleanup_first": True,
            "cleanup_level": self.cleanup_level.label,
            "upscale_level": self.upscale_level.label,
            "identity_default_on": True,
            "explicit_identity_step": self.explicit_identity_step,
            "local_only": True,
        }


def parse_quality_tier_commands(text: str) -> QualityTierRecipe:
    """Interpret the new tier syntax without changing saved v1 Pro recipes.

    /upscale 4k is legal, but gets an automatic neutral /cleanup 1.0 pre-step.
    /cleanup 2.4 /upscale 1080 3.1 /identitylock is the full grammar.
    """
    if not isinstance(text, str) or len(text) > 192 or text != text.strip():
        raise CommandValidationError("invalid_quality_command", "Quality command text is invalid.")
    match = _PIPELINE.fullmatch(text)
    if match is None:
        raise CommandValidationError(
            "invalid_quality_command",
            "Use /cleanup LEVEL /upscale 1080|4k LEVEL [/identitylock].",
        )
    return QualityTierRecipe(
        tier=checked_tier(match.group("tier").lower()),
        cleanup_level=DecimalLevel.parse(match.group("cleanup") or "1.0"),
        upscale_level=DecimalLevel.parse(match.group("upscale") or "3.0"),
        explicit_identity_step=match.group("lock") is not None,
    )


@dataclass(frozen=True, slots=True)
class QualityTierPlan:
    recipe: QualityTierRecipe
    pro_plan: ProPlan
    source_width: int
    source_height: int
    output_width: int
    output_height: int
    upscale_factor: Literal[2, 4]

    @property
    def output_long_edge(self) -> int:
        return max(self.output_width, self.output_height)

    def public_metadata(self) -> dict[str, object]:
        return {
            **self.recipe.public_metadata(),
            "source_size": [self.source_width, self.source_height],
            "output_size": [self.output_width, self.output_height],
            "scale": self.upscale_factor,
            "meets_tier": self.output_long_edge >= TIER_LONG_EDGES[self.recipe.tier],
            "aspect_ratio_exact": (
                self.source_width * self.output_height
                == self.source_height * self.output_width
            ),
            "identity_lock_on": self.pro_plan.identity.enabled,
            "plan_fingerprint": self.pro_plan.fingerprint(),
        }


def plan_quality_tier(frame: ImageFrame, recipe: QualityTierRecipe) -> QualityTierPlan:
    """Refuse undersized/over-budget tiers BEFORE running /CLEANUP.

    Never round a requested 4K output down to 1080 or another smaller size.
    High resolution is checked using integer arithmetic, without allocations.
    """
    if not isinstance(frame, ImageFrame) or not isinstance(recipe, QualityTierRecipe):
        raise CommandValidationError("invalid_tier_input", "A checked image and tier are required.")
    minimum = TIER_LONG_EDGES[recipe.tier]
    original_long = max(frame.width, frame.height)
    original_area = frame.width * frame.height
    selected: Literal[2, 4] | None = None
    for factor in (2, 4):
        can_meet_long_edge = original_long * factor >= minimum
        within_capacity = original_area * factor * factor <= MAX_IMAGE_PIXELS
        if can_meet_long_edge and within_capacity:
            selected = factor
            break
    if selected is None:
        raise CommandUnavailable(
            "tier_unavailable",
            f"{recipe.tier.upper()} tier needs a long edge of at least {minimum}; "
            "this photo cannot reach it using permitted 2x/4x CPU scaling "
            "within the 24 MP limit. No lower-resolution output was produced.",
        )
    steps = [
        ProStep(CommandName.CLEANUP, recipe.cleanup_level, 2, 0),
        ProStep(CommandName.UPSCALE, recipe.upscale_level, selected, 1),
    ]
    if recipe.explicit_identity_step:
        steps.append(ProStep(CommandName.IDENTITYLOCK, DecimalLevel(10), 2, 2))
    plan = ProPlan(tuple(steps), identity=IdentityPolicy())
    return QualityTierPlan(
        recipe, plan, frame.width, frame.height,
        frame.width * selected, frame.height * selected, selected,
    )


@dataclass(frozen=True, slots=True)
class QualityTierRun:
    plan: QualityTierPlan
    result: ProExecutionResult
    quality: RenderQuality
    guarded_step_count: int
    elapsed_ms: float

    def public_metadata(self) -> dict[str, object]:
        return {
            **self.plan.public_metadata(),
            "quality": self.quality,
            "guarded_steps": self.guarded_step_count,
            "completed_steps": len(self.result.steps),
            "elapsed_ms": round(self.elapsed_ms, 3),
            "performance_target_met": self.result.timing.within_target,
            "cleanup_before_upscale": True,
            "independent_face_gate": "NOT_RUN",
            "release_qualified": False,
        }


def checked_tier_output(plan: QualityTierPlan, output: ImageFrame) -> None:
    if not isinstance(output, ImageFrame):
        raise CommandValidationError("invalid_tier_output", "Upscale output is invalid.")
    if (output.width, output.height) != (plan.output_width, plan.output_height):
        raise CommandValidationError(
            "tier_shortfall", "Upscale returned dimensions that do not match the tier plan.",
        )
    if max(output.width, output.height) < TIER_LONG_EDGES[plan.recipe.tier]:
        raise CommandValidationError(
            "tier_shortfall", "Upscale output is below the requested tier long edge.",
        )
    if output.width * plan.source_height != output.height * plan.source_width:
        raise CommandValidationError("aspect_changed", "Upscale changed the source aspect ratio.")


def run_quality_tier(
    session: R2HSession,
    frame: ImageFrame,
    recipe: QualityTierRecipe,
    *,
    quality: RenderQuality = "export",
) -> QualityTierRun:
    """Execute both guarded steps as a single, cached and undoable transaction.

    The caller opens this same frame in the photo-scoped session beforehand.
    A missing production identity embedder fails closed in session.run.
    """
    if not isinstance(session, R2HSession) or quality not in ("preview", "export"):
        raise CommandValidationError("invalid_tier_session", "A checked local session is required.")
    prepared = plan_quality_tier(frame, recipe)
    if session.summary.photo_open is not True:
        raise CommandUnavailable("photo_missing", "Open the source photo before processing.")
    result = session.run(prepared.pro_plan, quality=quality, input_frame=frame)
    checked_tier_output(prepared, result.image)
    guarded_count = 0
    for index, step in enumerate(result.steps):
        if step.command is not prepared.pro_plan.steps[index].name or step.identity is None:
            raise CommandUnavailable(
                "tier_identity_unverified", "Tier execution lacks mandatory identity evidence.",
            )
        guarded_count += 1
    if guarded_count != len(prepared.pro_plan.steps) or not math.isfinite(result.timing.elapsed_ms):
        raise CommandValidationError(
            "invalid_tier_execution", "Tier execution evidence is incomplete.",
        )
    return QualityTierRun(prepared, result, quality, guarded_count, result.timing.elapsed_ms)
