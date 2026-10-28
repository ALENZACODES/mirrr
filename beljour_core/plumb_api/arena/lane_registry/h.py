"""Lane H R1H: Pro Commands ownership contribution. Author: John Khan."""

from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path
from typing import Any

from . import LaneContribution
from .legacy import REGISTRY_PATH, REPO_ROOT

_LANE_H_R1H_SOURCES: tuple[str, ...] = (
    "api/plumb_api/commands/regions.py",
    "api/plumb_api/commands/numeric.py",
    "api/plumb_api/commands/cleanup_detail.py",
    "api/plumb_api/commands/cleanup.py",
    "api/plumb_api/commands/upscale_kernel.py",
    "api/plumb_api/commands/upscale.py",
    "api/plumb_api/commands/r2h_session.py",
    "api/plumb_api/commands/quality_r2h.py",
    "web/src/commands/regions.ts",
    "web/src/commands/cpu-cleanup.ts",
    "api/plumb_api/commands/quality_metrics.py",
    "web/src/commands/cpu-upscale.ts",
    "web/src/commands/r2h-session.ts",
    "web/src/commands/quality-r2h.ts",
    "api/plumb_api/commands/__init__.py",
    "api/plumb_api/commands/adapters.py",
    "api/plumb_api/commands/cache.py",
    "api/plumb_api/commands/guarded.py",
    "api/plumb_api/commands/levels.py",
    "api/plumb_api/commands/performance.py",
    "api/plumb_api/commands/preview.py",
    "api/plumb_api/commands/pro_plan.py",
    "api/plumb_api/commands/pro_undo.py",
    "api/plumb_api/commands/repair_gate.py",
    "web/src/commands/face-fixer.ts",
    "web/src/commands/index.ts",
    "web/src/commands/levels.ts",
    "web/src/commands/plan.ts",
    "web/src/commands/preview.ts",
    "web/src/commands/runtime.ts",
    "api/plumb_api/commands/embedders.py",
    "api/plumb_api/commands/errors.py",
    "api/plumb_api/commands/execution.py",
    "api/plumb_api/commands/frames.py",
    "api/plumb_api/commands/identity.py",
    "api/plumb_api/commands/parser.py",
    "api/plumb_api/commands/registry.py",
    "api/plumb_api/commands/serialization.py",
    "api/plumb_api/commands/types.py",
    "api/plumb_api/commands/undo.py",
    "api/plumb_api/commands/studio_kernels.py",
    "api/plumb_api/commands/studio.py",
    "api/plumb_api/commands/pose_geometry.py",
    "api/plumb_api/commands/pose.py",
    "api/plumb_api/commands/quality_r3h.py",
    "api/plumb_api/commands/quality_gate_r3h.py",
    "web/src/commands/studio-quality.ts",
    "web/src/commands/pose-only.ts",
    "web/src/commands/r3h-session.ts",
    "web/src/commands/quality-metrics-r3h.ts",
    "web/src/commands/quality-gate-r3h.ts",
)
_LANE_H_R1H_TESTS: tuple[str, ...] = (
    "api/tests/commands/test_cleanup_r2h.py",
    "api/tests/commands/test_upscale_r2h.py",
    "api/tests/commands/test_quality_r2h.py",
    "api/tests/commands/test_session_r2h.py",
    "api/tests/commands/test_perf_r2h.py",
    "api/tests/commands/test_properties_r2h.py",
    "web/src/commands/test-cleanup-r2h.ts",
    "tests/realface/pass_definitions_r2h/cleanup.json",
    "tests/realface/pass_definitions_r2h/upscale.json",
    "api/tests/commands/test_quality_metrics_r2h.py",
    "web/src/commands/test-upscale-r2h.ts",
    "web/src/commands/test-session-r2h.ts",
    "web/src/commands/test-quality-r2h.ts",
    "api/tests/commands/test_evidence.py",
    "api/tests/commands/test_execution.py",
    "api/tests/commands/test_identity.py",
    "api/tests/commands/test_parser.py",
    "api/tests/commands/test_adapters_pro.py",
    "api/tests/commands/test_cache_preview_pro.py",
    "api/tests/commands/test_guarded_pro.py",
    "api/tests/commands/test_levels_pro.py",
    "api/tests/commands/test_repair_gate_pro.py",
    "web/src/commands/test-contract.ts",
    "tests/realface/pass_definitions_r1h/face_fixer.json",
    "api/tests/commands/test_studio_r3h.py",
    "api/tests/commands/test_pose_r3h.py",
    "api/tests/commands/test_r3h_chain.py",
    "api/tests/commands/test_perf_r3h.py",
    "api/tests/commands/test_quality_r3h.py",
    "web/src/commands/test-studio-r3h.ts",
    "web/src/commands/test-pose-r3h.ts",
    "web/src/commands/test-r3h-chain.ts",
    "api/tests/commands/test_quality_gate_r3h.py",
    "web/src/commands/test-quality-gate-r3h.ts",
    "tests/realface/pass_definitions_r3h/studioquality.json",
    "tests/realface/pass_definitions_r3h/poseonly.json",
    "tests/realface/pass_definitions_r3h/enhance.json",
    "tests/realface/pass_definitions_r3h/denoise.json",
    "tests/realface/pass_definitions_r3h/upscale.json",
)
_LANE_H_R1H_OWNER: Mapping[str, str] = {
    module: "H" for module in (*_LANE_H_R1H_SOURCES, *_LANE_H_R1H_TESTS)
}


def lane_h_r1h_extras(path: Path = REGISTRY_PATH) -> list[dict[str, Any]]:
    """Supply the Lane H row; the stable loader composes preceding lanes."""
    return [
        {
            "id": "r1h-pro-commands",
            "name": "Pro Commands: guarded decimal plans and synthetic-tested identity guard",
            "owner": "H",
            "status": "Built",
            "tested": "synthetic_only",
            "provider": "local",
            "modules": list(_LANE_H_R1H_SOURCES),
            "tests": list(_LANE_H_R1H_TESTS),
            "note": (
                "Parser/plan/undo plus guarded decimal execution, local caching, "
                "preview contracts and repair gate hook are implemented; "
                "visual effects require approved injected engine exports. "
                "Identity production embedder remains unavailable."
            ),
        }
    ]


def lane_h_r1h_module_universe(root: Path = REPO_ROOT) -> list[str]:
    """Supply Lane H sources to the split module audit only when present."""
    return sorted(
        module
        for module in _LANE_H_R1H_SOURCES
        if (root / module).is_file()
    )


CONTRIBUTIONS: tuple[LaneContribution, ...] = ()

# Lane H r4h: local workbench, protected-region measurements and render receipts.
# These records do not extend the frozen public extras or contributions views.
# Author: John Khan.
LANE_H_R4H_FILES: tuple[str, ...] = (
    "api/plumb_api/commands/proof.py",
    "api/plumb_api/commands/protected_quality.py",
    "api/plumb_api/commands/preview_parity.py",
    "api/tests/commands/test_proof_r4h.py",
    "api/tests/commands/test_protected_quality_r4h.py",
    "api/tests/commands/test_preview_parity_r4h.py",
    "web/src/commands/workbench-model.ts",
    "web/src/commands/workbench-view.ts",
    "web/src/commands/frame-io.ts",
    "web/src/commands/preview-parity.ts",
    "web/src/commands/protected-quality.ts",
    "web/src/commands/test-workbench-r4h.ts",
    "web/src/commands/test-workbench-view-r4h.ts",
    "web/src/commands/test-frame-io-r4h.ts",
    "web/src/commands/test-preview-parity-r4h.ts",
    "web/src/commands/test-protected-quality-r4h.ts",
)
LANE_H_R4H_OWNER: Mapping[str, str] = {name: "H" for name in LANE_H_R4H_FILES}


def lane_h_r4h_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Validate ownership without altering the shared registry's frozen views."""
    return [
        f"{path}: missing Lane H module"
        for path, owner in LANE_H_R4H_OWNER.items()
        if owner != "H" or not (root / path).is_file()
    ]

# Additional Lane H r4h acceptance assembler. No shared contribution row.
LANE_H_R4H_CP2_FILES: tuple[str, ...] = (
    "api/plumb_api/commands/acceptance_bundle.py",
    "api/tests/commands/test_acceptance_bundle_r4h.py",
    "web/src/commands/acceptance-bundle.ts",
    "web/src/commands/test-acceptance-bundle-r4h.ts",
)
LANE_H_R4H_CP2_OWNER: Mapping[str, str] = {
    name: "H" for name in LANE_H_R4H_CP2_FILES
}


# Lane H r5h: local identity admission, host bridge, frozen evidence readiness.
# Standalone ownership only; the frozen contribution sequence is unchanged.
# Author: John Khan.
LANE_H_R5H_CP1_FILES: tuple[str, ...] = (
    "api/plumb_api/commands/release_readiness.py",
    "api/plumb_api/commands/release_payload.py",
    "api/plumb_api/commands/fairness_readiness.py",
    "api/tests/commands/test_release_readiness_r5h.py",
    "api/tests/commands/test_release_payload_r5h.py",
    "api/tests/commands/test_fairness_readiness_r5h.py",
    "web/src/commands/identity-admission.ts",
    "web/src/commands/host-bridge.ts",
    "web/src/commands/verified-model.ts",
    "web/src/commands/test-identity-admission-r5h.ts",
    "web/src/commands/test-host-bridge-r5h.ts",
    "web/src/commands/test-verified-model-r5h.ts",
)
LANE_H_R5H_CP1_OWNER: Mapping[str, str] = {
    filename: "H" for filename in LANE_H_R5H_CP1_FILES
}


# Lane H r5h-cp2: local smoke and sanitized public acceptance receipt.
# Owner declarations remain separate from frozen contributions and extras.
# Author: John Khan.
LANE_H_R5H_CP2_FILES: tuple[str, ...] = (
    "web/src/commands/release-smoke.ts",
    "web/src/commands/test-release-smoke-r5h.ts",
    "web/src/commands/public-receipt.ts",
    "web/src/commands/test-public-receipt-r5h.ts",
    "web/src/commands/test-runtime-hardening-r5h.ts",
)
LANE_H_R5H_CP2_OWNER: Mapping[str, str] = {
    filename: "H" for filename in LANE_H_R5H_CP2_FILES
}


# Lane H r6h: offline recipe sharing, host atomicity and fresh identity consent.
# Owner declarations only; no shared extras or contribution changes.
# Author: John Khan.
LANE_H_R6H_CP1_FILES: tuple[str, ...] = (
    "api/plumb_api/commands/portable_recipe.py",
    "api/plumb_api/commands/share_fragment.py",
    "api/plumb_api/commands/legacy_recipe_upgrade.py",
    "api/tests/commands/test_portable_recipe_r6h.py",
    "api/tests/commands/test_share_fragment_r6h.py",
    "api/tests/commands/test_legacy_recipe_upgrade_r6h.py",
    "api/tests/commands/test_portable_guarded_execution_r6h.py",
    "web/src/commands/portable-recipe.ts",
    "web/src/commands/recipe-local-io.ts",
    "web/src/commands/share-fragment.ts",
    "web/src/commands/test-portable-recipe-r6h.ts",
    "web/src/commands/test-recipe-local-io-r6h.ts",
    "web/src/commands/test-share-fragment-r6h.ts",
    "web/src/commands/test-atomic-host-r6h.ts",
    "web/src/commands/test-recipe-panel-r6h.ts",
)
LANE_H_R6H_CP1_OWNER: Mapping[str, str] = {
    filename: "H" for filename in LANE_H_R6H_CP1_FILES
}


# Lane H r7h: host editor attachment, device diagnostics, frozen schedule.
# This owner record does not change the shared extras, module universe or order.
# Author: John Khan.
LANE_H_R7H_CP1_FILES: tuple[str, ...] = (
    "api/plumb_api/commands/frozen_schedule.py",
    "api/plumb_api/commands/frozen_schedule_cli.py",
    "api/tests/commands/test_frozen_schedule_r7h.py",
    "api/tests/commands/test_frozen_schedule_cli_r7h.py",
    "web/src/commands/host-shell-adapter.ts",
    "web/src/commands/test-host-shell-adapter-r7h.ts",
    "web/src/commands/device-readiness.ts",
    "web/src/commands/test-device-readiness-r7h.ts",
    "web/src/commands/demo-contract.ts",
    "web/src/commands/test-demo-contract-r7h.ts",
    "web/src/commands/test-host-panel-e2e-r7h.ts",
)
LANE_H_R7H_CP1_OWNER: Mapping[str, str] = {
    path: "H" for path in LANE_H_R7H_CP1_FILES
}


def lane_h_r7h_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Check the new files without activating any frozen shared registry view."""
    return [
        f"{path}: missing Lane H module"
        for path, owner in LANE_H_R7H_CP1_OWNER.items()
        if owner != "H" or not (root / path).is_file()
    ]


# Lane H r8h: fold-safe pose, prepared preview fields and rounded Studio safety.
# Explicit ownership only. Frozen extras, module universe and contributions stay unchanged.
# Author: John Khan.
LANE_H_R8H_CP1_FILES: tuple[str, ...] = (
    "api/plumb_api/commands/pose_safety.py",
    "api/plumb_api/commands/pose_field.py",
    "api/plumb_api/commands/studio_protection.py",
    "api/plumb_api/commands/lock_matrix.py",
    "api/tests/commands/test_pose_safe_r8h.py",
    "api/tests/commands/test_pose_field_r8h.py",
    "api/tests/commands/test_studio_protection_r8h.py",
    "api/tests/commands/test_lock_matrix_r8h.py",
    "api/tests/commands/test_r8h_lock_execution.py",
    "api/tests/commands/test_definitions_r8h.py",
    "web/src/commands/pose-safe.ts",
    "web/src/commands/pose-field.ts",
    "web/src/commands/studio-protection.ts",
    "web/src/commands/lock-matrix.ts",
    "web/src/commands/test-pose-safe-r8h.ts",
    "web/src/commands/test-pose-field-r8h.ts",
    "web/src/commands/test-studio-protection-r8h.ts",
    "web/src/commands/test-lock-matrix-r8h.ts",
    "tests/realface/pass_definitions_r8h/studio_final_byte.json",
    "tests/realface/pass_definitions_r8h/pose_fold_retention.json",
)
LANE_H_R8H_CP1_OWNER: Mapping[str, str] = {
    name: "H" for name in LANE_H_R8H_CP1_FILES
}


# Lane H r9h checkpoint 1: guarded execution evidence, photo-scoped audit and sweeps.
# Module ownership only; shared extra rows and contribution order stay frozen.
# Author: John Khan.
LANE_H_R9H_CP1_FILES: tuple[str, ...] = (
    "api/plumb_api/commands/observed_lock.py",
    "api/plumb_api/commands/observed_ledger.py",
    "api/plumb_api/commands/observed_sweep.py",
    "api/tests/commands/test_observed_lock_r9h.py",
    "api/tests/commands/test_observed_ledger_r9h.py",
    "api/tests/commands/test_observed_sweep_r9h.py",
    "web/src/commands/observed-lock.ts",
    "web/src/commands/observed-ledger.ts",
    "web/src/commands/observed-sweep.ts",
    "web/src/commands/test-observed-lock-r9h.ts",
    "web/src/commands/test-observed-ledger-r9h.ts",
    "web/src/commands/test-observed-sweep-r9h.ts",
)
LANE_H_R9H_CP1_OWNER: Mapping[str, str] = {
    path: "H" for path in LANE_H_R9H_CP1_FILES
}


def lane_h_r9h_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Check this lane's additions without changing frozen shared views."""
    return [
        f"{path}: missing Lane H module"
        for path, owner in LANE_H_R9H_CP1_OWNER.items()
        if owner != "H" or not (root / path).is_file()
    ]


# Lane H r10h: exact neutral upscale and Tuesday technical lock worksheet.
# These paths are H-owned only. The frozen shared contributions remain empty.
# Author: John Khan.
LANE_H_R10H_FILES: tuple[str, ...] = (
    "api/plumb_api/commands/neutral_resize.py",
    "api/plumb_api/commands/tuesday_lock.py",
    "api/tests/commands/test_neutral_upscale_r10h.py",
    "api/tests/commands/test_tuesday_lock_r10h.py",
    "api/tests/commands/test_tuesday_definition_r10h.py",
    "api/tests/commands/tuesday_synthetic_demo.py",
    "api/tests/commands/fixtures/tuesday_lock_synthetic_r10h.json",
    "tests/realface/pass_definitions_r10h/tuesday_lock.json",
    "web/src/commands/neutral-resize.ts",
    "web/src/commands/neutral-reference.ts",
    "web/src/commands/tuesday-lock.ts",
    "web/src/commands/test-neutral-upscale-r10h.ts",
    "web/src/commands/test-tuesday-lock-r10h.ts",
    "api/plumb_api/commands/tuesday_sheet.py",
    "api/plumb_api/commands/tuesday_compare.py",
    "api/tests/commands/test_tuesday_sheet_r10h.py",
    "api/tests/commands/test_tuesday_compare_r10h.py",
    "api/tests/commands/test_neutral_parity_r10h.py",
    "api/tests/commands/fixtures/neutral_upscale_parity_r10h.json",
    "api/tests/commands/fixtures/tuesday_lock_synthetic_r10h.md",
    "web/src/commands/tuesday-sheet.ts",
    "web/src/commands/test-tuesday-sheet-r10h.ts",
    "web/src/commands/tuesday-compare.ts",
    "web/src/commands/test-tuesday-compare-r10h.ts",
    "web/src/commands/test-neutral-parity-r10h.ts",
)
LANE_H_R10H_OWNER: Mapping[str, str] = {path: "H" for path in LANE_H_R10H_FILES}


# Lane H r11h: frozen identity-pair qualification and privacy-safe browser review.
# The frozen shared registry contributes no new extras or module-universe rows.
# Author: John Khan.
LANE_H_R11H_FILES: tuple[str, ...] = (
    "api/plumb_api/commands/identity_pairs.py",
    "api/plumb_api/commands/identity_pair_shards.py",
    "api/plumb_api/commands/identity_pair_regression.py",
    "api/tests/commands/test_identity_pairs_r11h.py",
    "api/tests/commands/test_identity_pair_shards_r11h.py",
    "api/tests/commands/test_identity_pair_regression_r11h.py",
    "api/tests/commands/test_identity_definitions_r11h.py",
    "api/tests/commands/test_identity_ownership_r11h.py",
    "api/tests/commands/test_identity_properties_r11h.py",
    "web/src/commands/identity-qualification.ts",
    "web/src/commands/identity-qualification-view.ts",
    "web/src/commands/test-identity-qualification-r11h.ts",
    "web/src/commands/test-identity-qualification-view-r11h.ts",
    "tests/realface/pass_definitions_r11h/identity_pairs.json",
)
LANE_H_R11H_OWNER: Mapping[str, str] = {path: "H" for path in LANE_H_R11H_FILES}

# Lane H Pro Commands improvement: source/test ownership only.
# Frozen shared registry extras and contribution order remain unchanged.
# Author: John Khan.
LANE_H_IMPROVEMENT_FILES: tuple[str, ...] = (
    "api/plumb_api/commands/neutral_audit.py",
    "api/plumb_api/commands/tuesday_export.py",
    "api/plumb_api/commands/latency_probe.py",
    "api/plumb_api/commands/studio_light_audit.py",
    "api/plumb_api/commands/pose_face_audit.py",
    "api/tests/commands/test_neutral_improvement_h.py",
    "api/tests/commands/test_tuesday_export_improvement_h.py",
    "api/tests/commands/test_latency_improvement_h.py",
    "api/tests/commands/test_studio_light_improvement_h.py",
    "api/tests/commands/test_pose_face_improvement_h.py",
    "web/src/commands/test-improvement-h.ts",
    "api/tests/commands/fixtures/tuesday_improvement_h/tuesday-pending-unverified/tuesday-lock.json",
    "api/tests/commands/fixtures/tuesday_improvement_h/tuesday-pending-unverified/tuesday-review.md",
    "api/tests/commands/fixtures/tuesday_improvement_h/tuesday-pending-unverified/tuesday-matrix.csv",
    "api/tests/commands/fixtures/tuesday_improvement_h/tuesday-pending-unverified/manifest.json",
)
LANE_H_IMPROVEMENT_OWNER: Mapping[str, str] = {
    module: "H" for module in LANE_H_IMPROVEMENT_FILES
}


def lane_h_improvement_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Validate all new modules without changing the legacy registry views."""
    return [
        f"{path}: missing Lane H improvement module"
        for path, owner in LANE_H_IMPROVEMENT_OWNER.items()
        if owner != "H" or not (root / path).is_file()
    ]


# BELJOUR Quality Generator: Lane H sources, tests and written gates only.
# The frozen shared extras, contribution order and module universe do not change.
# Author: John Khan.
LANE_H_R13H_FILES: tuple[str, ...] = (
    "api/plumb_api/commands/quality_tiers.py",
    "api/plumb_api/commands/quality_tier_matrix.py",
    "api/plumb_api/commands/quality_tier_export.py",
    "api/plumb_api/commands/__init__.py",
    "api/tests/commands/test_quality_tiers_r13h.py",
    "api/tests/commands/test_quality_tier_matrix_r13h.py",
    "api/tests/commands/test_quality_tier_export_r13h.py",
    "api/tests/commands/test_quality_tier_definition_r13h.py",
    "api/tests/commands/test_tier_synthetic_benchmark_r13h.py",
    "api/tests/commands/tier_synthetic_benchmark_r13h.py",
    "web/src/commands/quality-tiers.ts",
    "web/src/commands/quality-tier-matrix.ts",
    "web/src/commands/test-quality-tiers-r13h.ts",
    "web/src/commands/index.ts",
    "tests/realface/pass_definitions_r13h/quality_generator_tiers.json",
)
LANE_H_R13H_OWNER: Mapping[str, str] = {name: "H" for name in LANE_H_R13H_FILES}


def lane_h_r13h_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Verify all tier modules are Lane H owned without touching frozen views."""
    return [
        f"{name}: absent or incorrectly owned"
        for name, owner in LANE_H_R13H_OWNER.items()
        if owner != "H" or not (root / name).is_file()
    ]


# Lane H Tuesday near-final operator dossier and Studio/Pose diagnostics.
# Ownership entries only; leave the frozen CONTRIBUTIONS tuple unchanged.
# Author: John Khan.
LANE_H_R14H_FILES: tuple[str, ...] = (
    "api/plumb_api/commands/lock_readiness.py",
    "api/plumb_api/commands/lock_bundle.py",
    "api/plumb_api/commands/lock_pack_cli.py",
    "api/plumb_api/commands/studio_pose_annex.py",
    "api/plumb_api/commands/lock_capture_session.py",
    "api/tests/commands/test_joint_lock_readiness_r14h.py",
    "api/tests/commands/test_lock_bundle_r14h.py",
    "api/tests/commands/test_lock_pack_cli_r14h.py",
    "api/tests/commands/test_studio_pose_annex_r14h.py",
    "api/tests/commands/test_near_final_fixture_r14h.py",
    "api/tests/commands/test_lock_capture_session_r14h.py",
    "api/tests/commands/fixtures/tuesday_near_final_r14h/OPERATOR-RUNBOOK.md",
    "api/tests/commands/fixtures/tuesday_near_final_r14h/synthetic-tier-probe.json",
    "tests/realface/pass_definitions_r14h/tuesday_lock_evidence.json",
    "api/tests/commands/fixtures/tuesday_near_final_r14h/"
    "tuesday-unmeasured-build-unverified-lock/command-lock.json",
    "api/tests/commands/fixtures/tuesday_near_final_r14h/"
    "tuesday-unmeasured-build-unverified-lock/tier-lock.json",
    "api/tests/commands/fixtures/tuesday_near_final_r14h/"
    "tuesday-unmeasured-build-unverified-lock/studio-pose-annex.json",
    "api/tests/commands/fixtures/tuesday_near_final_r14h/"
    "tuesday-unmeasured-build-unverified-lock/command-matrix.csv",
    "api/tests/commands/fixtures/tuesday_near_final_r14h/"
    "tuesday-unmeasured-build-unverified-lock/tier-matrix.csv",
    "api/tests/commands/fixtures/tuesday_near_final_r14h/"
    "tuesday-unmeasured-build-unverified-lock/action-gaps.csv",
    "api/tests/commands/fixtures/tuesday_near_final_r14h/"
    "tuesday-unmeasured-build-unverified-lock/review.md",
    "api/tests/commands/fixtures/tuesday_near_final_r14h/"
    "tuesday-unmeasured-build-unverified-lock/manifest.json",
)
LANE_H_R14H_OWNER: Mapping[str, str] = {
    path: "H" for path in LANE_H_R14H_FILES
}


def lane_h_r14h_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Check the new files without modifying frozen registry contributions."""
    return [
        f"{path}: unregistered Lane H module"
        for path, owner in LANE_H_R14H_OWNER.items()
        if owner != "H" or not (root / path).is_file()
    ]


# H-GAP-1: neutral upscale fix-or-scope, measured pixel differences, and tests.
# This is ownership metadata only; the frozen contribution view remains empty.
# Author: John Khan.
LANE_H_GAP1_FILES: tuple[str, ...] = (
    "api/plumb_api/commands/upscale_claims.py",
    "api/plumb_api/commands/neutral_reference_set.py",
    "api/tests/commands/test_upscale_claim_hgap1.py",
    "web/src/commands/upscale-claims.ts",
    "web/src/commands/test-upscale-claims-hgap1.ts",
    "web/src/commands/index.ts",
    "tests/realface/pass_definitions_hgap1/upscale_neutral_claim.json",
    "api/tests/commands/fixtures/hgap1/neutral-pixel-diff.json",
    "api/tests/commands/fixtures/hgap1/neutral-pixel-diff.md",
)
LANE_H_GAP1_OWNERS: Mapping[str, str] = {
    name: "H" for name in LANE_H_GAP1_FILES
}


def lane_h_gap1_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Verify that the fix-or-scope files exist without modifying shared views."""
    return [
        f"{path}: missing Lane H neutral-evidence module"
        for path, owner in LANE_H_GAP1_OWNERS.items()
        if owner != "H" or not (root / path).is_file()
    ]
