"""Photo-free Pro edit receipts for the guarded execution boundary.

Receipts describe what the local runner actually checked. Synthetic embeddings,
explicit opt-outs and unreviewed images never create a real-face quality pass.
The photo, its content hash and biometric measurements are not serialized.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

from .errors import CommandValidationError
from .guarded import ProExecutionResult, ProStepReport
from .pro_plan import ProPlan
from .types import CommandName

ProofStatus = Literal["blocked", "review", "synthetic", "measured"]
ProofReason = Literal[
    "step_order_mismatch", "identity_missing", "identity_warned", "identity_synthetic",
    "identity_weak", "identity_invalid", "identity_user_override", "step_missing",
    "plan_mismatch", "invalid_timing", "face_review_pending",
]


@dataclass(frozen=True, slots=True)
class StepProof:
    index: int
    command: CommandName
    level: str
    changed: bool
    cache_hit: bool
    lock_applied: bool
    meter: int | None
    applied_fraction: float | None
    reasons: tuple[ProofReason, ...]

    def public_metadata(self) -> dict[str, object]:
        return {
            "index": self.index,
            "command": self.command.value,
            "level": self.level,
            "changed": self.changed,
            "cache_hit": self.cache_hit,
            "lock_applied": self.lock_applied,
            "meter": self.meter,
            "applied_fraction": self.applied_fraction,
            "reasons": list(self.reasons),
        }


@dataclass(frozen=True, slots=True)
class ProProof:
    version: Literal["beljour-pro-step-proof/1"]
    plan_fingerprint: str
    status: ProofStatus
    steps: tuple[StepProof, ...]
    reasons: tuple[ProofReason, ...]
    preview_budget_met: bool
    realface_pass: Literal[False] = False

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": self.version,
            "plan_fingerprint": self.plan_fingerprint,
            "status": self.status,
            "steps": [step.public_metadata() for step in self.steps],
            "reasons": list(self.reasons),
            "preview_budget_met": self.preview_budget_met,
            "realface_pass": False,
        }


def _inspect_step(step: ProStepReport, expected: CommandName, index: int) -> StepProof:
    reasons: list[ProofReason] = []
    if step.index != index or step.command is not expected:
        reasons.append("step_order_mismatch")
    decision = step.identity
    if decision is None:
        reasons.append("identity_missing")
        return StepProof(
            step.index, step.command, step.level, step.modified, step.cache_hit,
            False, None, None, tuple(reasons),
        )
    if decision.status == "warned":
        reasons.append("identity_warned")
    if decision.synthetic_evidence:
        reasons.append("identity_synthetic")
    if (
        not math.isfinite(decision.final_cosine)
        or not math.isfinite(decision.threshold)
        or not 0 <= decision.identity_match <= 100
        or not 0 <= decision.applied_fraction <= 1
    ):
        reasons.append("identity_invalid")
    elif decision.final_cosine + 1e-9 < decision.threshold:
        reasons.append("identity_weak")
    return StepProof(
        step.index, step.command, step.level, step.modified, step.cache_hit,
        True, decision.identity_match, decision.applied_fraction, tuple(reasons),
    )


def inspect_pro_run(plan: ProPlan, result: ProExecutionResult) -> ProProof:
    """Check every step, not just the final output, without claiming release approval."""
    if not isinstance(plan, ProPlan) or not isinstance(result, ProExecutionResult):
        raise CommandValidationError("invalid_proof", "A typed plan and guarded result are required.")
    reasons: list[ProofReason] = []
    if result.plan.fingerprint() != plan.fingerprint():
        reasons.append("plan_mismatch")
    if len(plan.steps) != len(result.steps):
        reasons.append("step_missing")
    if not math.isfinite(result.timing.elapsed_ms) or result.timing.elapsed_ms < 0:
        reasons.append("invalid_timing")
    if not plan.identity.enabled:
        reasons.append("identity_user_override")
    inspected: list[StepProof] = []
    for index, report in enumerate(result.steps):
        expected = plan.steps[index].name if index < len(plan.steps) else report.command
        item = _inspect_step(report, expected, index)
        inspected.append(item)
        for reason in item.reasons:
            if reason not in reasons:
                reasons.append(reason)
    if any(item in reasons for item in (
        "plan_mismatch", "step_missing", "step_order_mismatch", "identity_invalid",
        "identity_missing", "identity_weak", "invalid_timing",
    )):
        status: ProofStatus = "blocked"
    elif "identity_warned" in reasons or "identity_user_override" in reasons:
        status = "review"
    elif "identity_synthetic" in reasons:
        status = "synthetic"
    else:
        status = "measured"
    if "face_review_pending" not in reasons:
        reasons.append("face_review_pending")
    return ProProof(
        "beljour-pro-step-proof/1", plan.fingerprint(), status, tuple(inspected),
        tuple(reasons), result.timing.within_target,
    )
