"""Conservative migration of existing named-strength command plans.

Version-1 plans are converted to decimal strengths only for human review.
Identity protection becomes an enabled wrapper; an old warning-only request
is strengthened, not silently adopted as an unguarded current policy.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from .errors import CommandValidationError
from .levels import DecimalLevel
from .pro_plan import IdentityPolicy, ProPlan, ProStep
from .serialization import plan_from_json
from .types import (
    CleanupArgs,
    CommandName,
    CommandPlan,
    IdentityLockArgs,
    LockMode,
    LockStrength,
    PoseOnlyArgs,
    StudioQualityArgs,
    UpscaleArgs,
)

UpgradeCode = Literal[
    "named_strength_approximate",
    "identity_moved_to_default_wrapper",
    "warning_mode_strengthened",
    "legacy_upscale_keeps_scale",
    "requires_visual_review",
]


@dataclass(frozen=True, slots=True)
class UpgradePreview:
    """An uncommitted candidate, not an import consent or release verdict."""

    plan: ProPlan
    warnings: tuple[UpgradeCode, ...]
    review_required: Literal[True] = True
    source_format: Literal["beljour-commands/1"] = "beljour-commands/1"

    def public_metadata(self) -> dict[str, object]:
        return {
            "format": self.source_format,
            "new_plan_fingerprint": self.plan.fingerprint(),
            "warnings": list(self.warnings),
            "review_required": True,
            "release_qualified": False,
        }


def preview_legacy_upgrade(source: CommandPlan | str) -> UpgradePreview:
    """Prepare, but do not authorize, migration from an older command plan."""
    if isinstance(source, str):
        candidate = plan_from_json(source)
    elif isinstance(source, CommandPlan):
        candidate = source
    else:
        raise CommandValidationError("invalid_legacy_recipe", "A verified old command plan is required.")
    steps: list[ProStep] = []
    notes: list[UpgradeCode] = ["requires_visual_review"]
    mode = LockMode.SOFTEN
    strength = LockStrength.NORMAL
    for index, step in enumerate(candidate.steps):
        arguments = step.args
        level = DecimalLevel(10)
        scale = 2
        if isinstance(arguments, IdentityLockArgs):
            if arguments.mode is LockMode.BLOCK:
                mode = LockMode.BLOCK
            elif arguments.mode is LockMode.WARN:
                notes.append("warning_mode_strengthened")
            if arguments.strength is LockStrength.STRICT:
                strength = LockStrength.STRICT
            notes.append("identity_moved_to_default_wrapper")
        elif isinstance(arguments, UpscaleArgs):
            scale = arguments.scale
            notes.append("legacy_upscale_keeps_scale")
        elif isinstance(arguments, (CleanupArgs, StudioQualityArgs, PoseOnlyArgs)):
            level = DecimalLevel.from_legacy(arguments.strength)
            notes.append("named_strength_approximate")
        else:
            raise CommandValidationError("invalid_legacy_recipe", "Legacy command is not supported.")
        steps.append(ProStep(CommandName(step.name), level, scale, index))
    policy = IdentityPolicy(True, mode, strength, False)
    return UpgradePreview(ProPlan(tuple(steps), policy), tuple(dict.fromkeys(notes)))


def approve_legacy_upgrade(preview: UpgradePreview, *, user_reviewed: bool = False) -> ProPlan:
    """Require an affirmative current-session review of approximate mappings."""
    if not isinstance(preview, UpgradePreview):
        raise CommandValidationError("invalid_upgrade_preview", "A typed migration preview is required.")
    if user_reviewed is not True:
        raise CommandValidationError("legacy_review_required", "Review the migrated strengths before editing.")
    return preview.plan
