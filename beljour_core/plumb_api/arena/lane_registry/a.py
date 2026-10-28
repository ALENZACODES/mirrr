"""Lane A ownership extension. Author: John Khan."""

from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path
from typing import Any

from . import LaneContribution
from .legacy import REPO_ROOT

# Lane A r16a — additive ownership block; other lanes' registrations are unchanged.
LANE_A_R16A_MODULES: Mapping[str, str] = {
    "api/plumb_api/quality/realface_summary.py": "A",
    "api/plumb_api/quality/realface_regression.py": "A",
    "tests/realface/primary_face.py": "A",
    "tests/realface/landmark_stability.py": "A",
    "tests/realface/compare_commits.py": "A",
    "web/src/quality/realface-summary.ts": "A",
}


def lane_a_r16a_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Every R16A production module must be present with its declared owner."""
    return [f"{module}: missing or not owned by Lane A"
            for module, owner in sorted(LANE_A_R16A_MODULES.items())
            if owner != "A" or not (root / module).is_file()]

CONTRIBUTIONS: tuple[LaneContribution, ...] = ()

# --- Lane A r25a: local Proof/Save and 100-shard synthetic regression ownership ---
LANE_A_R25A_MODULES: Mapping[str, str] = {
    "web/src/save/proof.ts": "A",
    "web/src/save/proof-ledger.ts": "A",
    "web/src/save/proof-export.ts": "A",
    "web/src/save/proof-plan.ts": "A",
    "web/src/save/proof-diff.ts": "A",
    "web/src/save/proof-service.ts": "A",
    "web/test/save-proof.test.mjs": "A",
    "web/test/save-proof-ledger.test.mjs": "A",
    "web/test/save-proof-export.test.mjs": "A",
    "web/test/save-proof-plan.test.mjs": "A",
    "web/test/save-proof-diff.test.mjs": "A",
    "web/test/save-proof-service.test.mjs": "A",
    "api/tests/test_large_frozen_shards.py": "A",
    "api/plumb_api/quality/recovery_counts.py": "A",
    "tests/realface/face_set.py": "A",
    "tests/realface/definitions.py": "A",
    "tests/realface/run_state.py": "A",
    "tests/realface/run_realface.py": "A",
    "tests/realface/filters_bench.py": "A",
}


def lane_a_r25a_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Require every local proof and shard module to exist with Lane A ownership."""
    return [
        f"{module}: missing or not owned by Lane A"
        for module, owner in sorted(LANE_A_R25A_MODULES.items())
        if owner != "A" or not (root / module).is_file()
    ]


# --- Lane A r26a: local Save/Proof runtime, portable receipts, browser adapters ---
LANE_A_R26A_MODULES: Mapping[str, str] = {
    "web/src/save/proof-bridge.ts": "A",
    "web/src/save/proof-download.ts": "A",
    "web/src/save/proof-readiness.ts": "A",
    "web/src/save/proof-receipt.ts": "A",
    "web/src/save/proof-scheduler.ts": "A",
    "web/src/save/proof-session.ts": "A",
    "web/src/save/proof-widget.ts": "A",
    "web/test/save-proof-bridge.test.mjs": "A",
    "web/test/save-proof-download.test.mjs": "A",
    "web/test/save-proof-readiness.test.mjs": "A",
    "web/test/save-proof-receipt.test.mjs": "A",
    "web/test/save-proof-scheduler.test.mjs": "A",
    "web/test/save-proof-session.test.mjs": "A",
    "web/test/save-proof-widget.test.mjs": "A",
}


def lane_a_r26a_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Verify Lane A Proof/Save sources and tests retain their declared ownership."""
    return [
        f"{module}: missing or not owned by Lane A"
        for module, owner in sorted(LANE_A_R26A_MODULES.items())
        if owner != "A" or not (root / module).is_file()
    ]


# --- Lane A r26a cp2: concurrency, resource and local diagnostics owners ---
LANE_A_R26A_CP2_MODULES: Mapping[str, str] = {
    "web/src/save/proof-batch-queue.ts": "A",
    "web/src/save/proof-budget.ts": "A",
    "web/src/save/proof-diagnostics.ts": "A",
    "web/src/save/proof-library.ts": "A",
    "web/test/save-proof-batch-queue.test.mjs": "A",
    "web/test/save-proof-budget.test.mjs": "A",
    "web/test/save-proof-diagnostics.test.mjs": "A",
    "web/test/save-proof-library.test.mjs": "A",
}


def lane_a_r26a_cp2_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Verify every additional R26A owner record is present and belongs to A."""
    return [
        f"{module}: missing or not owned by Lane A"
        for module, owner in sorted(LANE_A_R26A_CP2_MODULES.items())
        if owner != "A" or not (root / module).is_file()
    ]


# --- Lane A r27a: explicit ownership transfer and new geometric proof tools ---
# The existing main-feature JSON keeps the same module rows and feature counts.
# Legacy ratios and symmetry engines are now maintained by Lane A, not duplicated.
LANE_A_R27A_MODULES: Mapping[str, str] = {
    "api/plumb_api/engines/proportions/__init__.py": "A",
    "api/plumb_api/engines/proportions/anatomy.py": "A",
    "api/plumb_api/engines/proportions/golden.py": "A",
    "api/plumb_api/engines/proportions/ratios.py": "A",
    "api/plumb_api/engines/proportions/symmetry.py": "A",
    "api/plumb_api/engines/proportions/synthetic.py": "A",
    "api/plumb_api/engines/shape/turn.py": "A",
    "api/plumb_api/engines/shape/turn_pyramid.py": "A",
    "api/plumb_api/vision/face_picker.py": "A",
    "api/plumb_api/vision/face_region_audit.py": "A",
    "api/plumb_api/vision/face_session.py": "A",
    "api/plumb_api/vision/retry_faces.py": "A",
    "web/src/engines/proportions/golden.ts": "A",
    "web/src/engines/proportions/guarded.ts": "A",
    "web/src/engines/proportions/index.ts": "A",
    "web/src/engines/proportions/ratios.ts": "A",
    "web/src/engines/proportions/symmetry.ts": "A",
    "web/src/save/face-picker.ts": "A",
    "web/src/save/face-region-audit.ts": "A",
    "web/src/save/face-selection.ts": "A",
    "web/src/save/golden-widget.ts": "A",
    "web/src/save/turn-validation.ts": "A",
    "tests/realface/face_recovery.py": "A",
    "tests/realface/realface_lib.py": "A",
    "tests/realface/run_realface.py": "A",
    "tests/realface/pass_definitions_r27a/proportions_control.json": "A",
    "parity/golden-controls.json": "A",
    "parity/face-region-audit.json": "A",
    "api/tests/test_primary_face_fallback.py": "A",
    "api/tests/test_face_picker.py": "A",
    "api/tests/test_face_region_audit.py": "A",
    "api/tests/test_face_session.py": "A",
    "api/tests/test_degenerate_inputs_refuse.py": "A",
    "api/tests/test_recovered_runner_denominator.py": "A",
    "api/tests/test_golden_controls.py": "A",
    "api/tests/test_golden_multiface_flow.py": "A",
    "api/tests/test_golden_definition.py": "A",
    "web/test/golden-control.test.mjs": "A",
    "web/test/golden-multiface-flow.test.mjs": "A",
    "web/test/golden-widget.test.mjs": "A",
    "web/test/save-face-picker.test.mjs": "A",
    "web/test/save-face-region-audit.test.mjs": "A",
    "web/test/save-face-selection.test.mjs": "A",
    "web/test/save-turn-validation.test.mjs": "A",
}


def lane_a_r27a_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Transferred and newly shipped modules must exist and retain owner A."""
    return [
        f"{module}: missing or not owned by Lane A"
        for module, owner in sorted(LANE_A_R27A_MODULES.items())
        if owner != "A" or not (root / module).is_file()
    ]


def lane_a_r27a_paths(root: Path) -> list[str]:
    """Expose Lane A-owned modules to the normal registry missing-owner audit."""
    return [module for module in LANE_A_R27A_MODULES if (root / module).is_file()]


def lane_a_r27a_extra_rows(path: Path) -> list[dict[str, Any]]:
    """Claim transferred and added paths without altering 103 feature statuses."""
    return [{
        "id": "r27a-multiface-ratio-turn",
        "name": "Selected-person turn and optional proportion reference controls",
        "owner": "A",
        "status": "Built",
        "tested": "synthetic_only",
        "provider": "local",
        "modules": sorted(LANE_A_R27A_MODULES),
        "tests": [
            "api/tests/test_primary_face_fallback.py",
            "api/tests/test_face_picker.py",
            "api/tests/test_golden_controls.py",
            "web/test/golden-control.test.mjs",
        ],
        "note": "Historical ratios preserved; real-face gating remains UNPROVEN.",
    }]


# --- Lane A r27a final: detector-to-picker binding and truthful frozen diagnostics ---
LANE_A_R27A_CP3_MODULES: Mapping[str, str] = {
    "api/plumb_api/vision/detected_faces.py": "A",
    "web/src/vision/detected-faces.ts": "A",
    "tests/realface/region_reasons.py": "A",
    "api/tests/test_detected_faces.py": "A",
    "api/tests/test_region_reason_diagnostics.py": "A",
    "api/tests/test_shared_gate_regression.py": "A",
    "web/test/vision-detected-faces.test.mjs": "A",
}


def lane_a_r27a_cp3_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Every final-round source and test remains present under owner A."""
    return [
        f"{module}: missing or not owned by Lane A"
        for module, owner in sorted(LANE_A_R27A_CP3_MODULES.items())
        if owner != "A" or not (root / module).is_file()
    ]


# --- Lane A r27a CP4: validated turn levels and optional frozen golden gate ---
LANE_A_TURN_PROOF_MODULES: Mapping[str, str] = {
    "api/plumb_api/engines/shape/turn_level.py": "A",
    "web/src/save/turn-level.ts": "A",
    "tests/realface/golden_gate.py": "A",
    "api/tests/test_turn_level.py": "A",
    "api/tests/test_golden_runner.py": "A",
    "web/test/save-turn-level.test.mjs": "A",
}


def lane_a_turn_proof_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Check the additional user-level turn and frozen control registration."""
    return [
        f"{module}: missing or not owned by Lane A"
        for module, owner in sorted(LANE_A_TURN_PROOF_MODULES.items())
        if owner != "A" or not (root / module).is_file()
    ]


# Gatefix-A: recovery and selection paths are owned by Lane A only.
LANE_A_GATEFIX_MODULES: Mapping[str, str] = {
    "api/plumb_api/quality/visibility_masks.py": "A",
    "api/tests/test_recovery_visibility_r17a.py": "A",
    "api/plumb_api/vision/mesh_recovery.py": "A",
    "api/plumb_api/vision/subject.py": "A",
    "api/tests/test_gatefix_mesh_recovery.py": "A",
    "api/tests/test_gatefix_subject.py": "A",
    "api/tests/test_gatefix_runner.py": "A",
    "api/tests/test_gatefix_turn_refusals.py": "A",
}


def lane_a_gatefix_ownership(root: Path = REPO_ROOT) -> list[str]:
    """New recovery modules and their regressions require owner A."""
    return [
        f"{module}: missing or not owned by Lane A"
        for module, owner in sorted(LANE_A_GATEFIX_MODULES.items())
        if owner != "A" or not (root / module).is_file()
    ]
