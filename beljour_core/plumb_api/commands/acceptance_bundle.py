"""Compose locally checked Pro step, parity and preservation evidence.

The bundle is a diagnostic preflight for independent real-face qualification,
not an authority to turn a synthetic test or arbitrary uploaded report into
release approval. Private pixels are never placed in metadata.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from .errors import CommandValidationError
from .frames import ImageFrame, resize_reference
from .guarded import ProExecutionResult
from .preview_parity import PreviewParityReport, compare_render_paths
from .pro_plan import ProPlan
from .proof import ProProof, inspect_pro_run
from .protected_quality import MaskEvidence, MaskKind, ProtectionReport, measure_protection

BundleStatus = Literal["blocked", "review", "unproven"]


@dataclass(frozen=True, slots=True)
class ProAcceptanceBundle:
    version: Literal["beljour-pro-acceptance-bundle/1"]
    status: BundleStatus
    plan_fingerprint: str
    preview: ProProof
    export: ProProof
    parity: PreviewParityReport
    preservation: ProtectionReport | None
    blocking_reasons: tuple[str, ...]
    outstanding_evidence: tuple[str, ...]
    release_qualified: Literal[False] = False

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": self.version,
            "status": self.status,
            "plan_fingerprint": self.plan_fingerprint,
            "preview": self.preview.public_metadata(),
            "export": self.export.public_metadata(),
            "parity": self.parity.public_metadata(),
            "preservation": self.preservation.public_metadata()
            if self.preservation is not None else None,
            "blocking_reasons": list(self.blocking_reasons),
            "outstanding_evidence": list(self.outstanding_evidence),
            "release_qualified": False,
        }


def build_pro_acceptance_bundle(
    plan: ProPlan,
    original: ImageFrame,
    preview: ProExecutionResult,
    exported: ProExecutionResult,
    *,
    checked_masks: tuple[MaskEvidence, ...] = (),
    required_regions: tuple[MaskKind, ...] = ("face", "skin"),
) -> ProAcceptanceBundle:
    if not isinstance(plan, ProPlan) or not isinstance(original, ImageFrame):
        raise CommandValidationError("invalid_bundle", "A typed plan and original frame are required.")
    if not isinstance(preview, ProExecutionResult) or not isinstance(exported, ProExecutionResult):
        raise CommandValidationError("invalid_bundle", "Guarded preview and export evidence is required.")
    if any(not isinstance(item, MaskEvidence) for item in checked_masks):
        raise CommandValidationError("invalid_bundle", "Checked mask evidence is malformed.")
    if any(item not in ("face", "skin", "eyes", "hair", "person", "protected")
           for item in required_regions):
        raise CommandValidationError("invalid_bundle", "Required mask categories are unknown.")
    if (
        plan.fingerprint() != preview.plan.fingerprint()
        or plan.fingerprint() != exported.plan.fingerprint()
    ):
        raise CommandValidationError("invalid_bundle", "Run plans do not match the requested recipe.")
    preview_proof = inspect_pro_run(plan, preview)
    export_proof = inspect_pro_run(plan, exported)
    parity = compare_render_paths(preview, exported)
    blockers: list[str] = []
    missing: list[str] = []
    if not plan.identity.enabled:
        blockers.append("identity_user_optout")
    if preview_proof.status == "blocked" or export_proof.status == "blocked":
        blockers.append("step_identity_unverified")
    if "identity_warned" in (*preview_proof.reasons, *export_proof.reasons):
        blockers.append("identity_warning_requires_review")
    if not preview.timing.within_target or not exported.timing.within_target:
        missing.append("device_performance_gate")
    if parity.alpha_mismatch_pixels > 0:
        blockers.append("preview_alpha_mismatch")
    if "mean_preview_drift" in parity.reason_codes or "peak_preview_drift" in parity.reason_codes:
        missing.append("preview_export_drift_review")
    if "identity_synthetic" in (*preview_proof.reasons, *export_proof.reasons):
        missing.append("approved_identity_model_and_realface_test")
    baseline = resize_reference(original, exported.image.width, exported.image.height)
    protection: ProtectionReport | None = None
    if checked_masks:
        protection = measure_protection(
            baseline, exported.image, checked_masks, required=required_regions,
        )
        if any(item.alpha_mismatch_pixels > 0 for item in protection.readings):
            blockers.append("protected_alpha_changed")
        if not protection.complete:
            missing.append("checked_region_coverage")
    else:
        missing.append("checked_region_coverage")
    missing.append("external_realface_gate_and_human_review")
    status: BundleStatus = "blocked" if blockers else "review" if (
        "preview_export_drift_review" in missing or "device_performance_gate" in missing
    ) else "unproven"
    return ProAcceptanceBundle(
        "beljour-pro-acceptance-bundle/1", status, plan.fingerprint(),
        preview_proof, export_proof, parity, protection,
        tuple(dict.fromkeys(blockers)), tuple(dict.fromkeys(missing)),
    )
