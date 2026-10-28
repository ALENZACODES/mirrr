"""Lane E pro-tool ownership extension. Author: John Khan."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from . import LaneContribution
from .legacy import REGISTRY_PATH, REPO_ROOT

# --- Lane E r21e: append-only ownership of pro tools and reel export presets ---
# The master features.json is deliberately unchanged during parallel integration.
# A pro-image export size option does not by itself complete blocked feature #94.
# Each shipped implementation module has a concrete owner and related feature IDs.
LANE_E_OWNER = "E"
LANE_E_FEATURE_IDS = (73, 94)
LANE_E_MODULES: tuple[str, ...] = (
    "api/plumb_api/pro/__init__.py",
    "api/plumb_api/pro/contracts.py",
    "api/plumb_api/pro/curves.py",
    "api/plumb_api/pro/geometry.py",
    "api/plumb_api/pro/export.py",
    "api/plumb_api/pro/serialization.py",
    "api/plumb_api/pro/test_pro.py",
    "api/plumb_api/pro/test_serialization.py",
    "web/src/pro/types.ts",
    "web/src/pro/curves.ts",
    "web/src/pro/crop.ts",
    "web/src/pro/presets.ts",
    "web/src/pro/render.ts",
    "web/src/pro/panel.ts",
    "web/src/pro/boot.ts",
    "web/src/pro/index.ts",
    "web/src/pro/history.ts",
    "web/src/pro/recipe.ts",
    "web/src/reel/short-clips.ts",
    "web/src/reel/index.ts",
)
LANE_E_TESTS: tuple[str, ...] = (
    "api/plumb_api/pro/test_pro.py",
    "api/plumb_api/pro/test_serialization.py",
    "web/src/pro/test/history.test.mjs",
    "web/src/pro/test/recipe.test.mjs",
    "web/src/pro/test/curves.test.mjs",
    "web/src/pro/test/crop.test.mjs",
    "web/src/pro/test/presets.test.mjs",
    "web/src/pro/test/render.test.mjs",
    "web/src/pro/test/panel.test.mjs",
    "web/src/pro/test/reel.test.mjs",
)


def lane_e_ownership() -> dict[str, dict[str, Any]]:
    """Module-by-module ownership for the R21E checkpoint, not a scoring claim."""
    owned: dict[str, dict[str, Any]] = {
        path: {"owner": LANE_E_OWNER, "feature_ids": list(LANE_E_FEATURE_IDS)}
             for path in LANE_E_MODULES}
    for records in (LANE_E_R24E_MODULE_OWNERS, LANE_E_R25E_MODULE_OWNERS,
                    LANE_E_GATEFIX_MODULE_OWNERS, LANE_E_R26E_MODULE_OWNERS,
                    LANE_E_R27E_MODULE_OWNERS, LANE_E_R28E_MODULE_OWNERS,
                    LANE_E_R36E_MODULE_OWNERS):
        for module, details in records.items():
            owned[module] = {"owner": "E", "feature_ids": list(details["feature_ids"])}
    return owned


def lane_e_extra_rows(path: Path = REGISTRY_PATH) -> list[dict[str, Any]]:
    """The unchanged R21E ownership row, without a dependency on another lane."""
    return [{
        "id": "r21e-pro-tools",
        "name": "Local pro curves, precision crop and labelled export presets",
        "owner": LANE_E_OWNER,
        "feature_ids": list(LANE_E_FEATURE_IDS),
        "status": "Built",
        "tested": "synthetic_only",
        "provider": "local",
        "modules": list(LANE_E_MODULES),
        "tests": list(LANE_E_TESTS),
        "note": "Pro image tools are usable on recorder.html; broader feature 94 stays blocked.",
    }]


def lane_e_module_universe(root: Path = REPO_ROOT) -> list[str]:
    """Include every new pro file in ownership checks, not only its directory."""
    return sorted(module for module in LANE_E_MODULES if (root / module).is_file())


CONTRIBUTIONS = (LaneContribution(200, "E", lane_e_extra_rows, lane_e_module_universe),)

# --- Lane E r22e/r23e/r24e: cumulative owner registration after registry split ---
# R24E keeps the pre-existing contributions tuple and public interfaces intact.
# New effect hooks are built, but release quality is still untested.
LANE_E_R22E_CP3_MODULES: tuple[str, ...] = (
    'api/plumb_api/pro/compare.py',
    'api/plumb_api/pro/history.py',
    'api/plumb_api/pro/masks.py',
    'api/plumb_api/pro/test_history_compare.py',
    'api/plumb_api/pro/test_masks.py',
    'web/src/pro/masks.ts',
    'web/src/pro/split.ts',
    'web/src/pro/test/history-memory.test.mjs',
    'web/src/pro/test/masked-render.test.mjs',
    'web/src/pro/test/masks.test.mjs',
    'web/src/pro/test/split.test.mjs',
    'web/src/reel/clip-jobs.ts',
    'web/src/reel/test/clip-jobs.test.mjs',
)

LANE_E_R22E_CP3_TESTS: tuple[str, ...] = (
    'api/plumb_api/pro/test_history_compare.py',
    'api/plumb_api/pro/test_masks.py',
    'web/src/pro/test/history-memory.test.mjs',
    'web/src/pro/test/masked-render.test.mjs',
    'web/src/pro/test/masks.test.mjs',
    'web/src/pro/test/split.test.mjs',
    'web/src/reel/test/clip-jobs.test.mjs',
)

LANE_E_R23E_MODULES: tuple[str, ...] = (
    'api/plumb_api/pro/tiles.py',
    'api/plumb_api/pro/test_tiles.py',
    'web/src/pro/gpu-shaders.ts',
    'web/src/pro/gpu.ts',
    'web/src/pro/source-projection.ts',
    'web/src/pro/performance.ts',
    'web/src/pro/test/gpu.test.mjs',
    'web/src/pro/test/source-projection.test.mjs',
    'web/src/pro/test/performance.test.mjs',
    'web/src/reel/session.ts',
    'web/src/reel/test/session.test.mjs',
    'web/src/reel/test/gl-resources.test.mjs',
)

LANE_E_R23E_TESTS: tuple[str, ...] = (
    'api/plumb_api/pro/test_tiles.py',
    'web/src/pro/test/gpu.test.mjs',
    'web/src/pro/test/source-projection.test.mjs',
    'web/src/pro/test/performance.test.mjs',
    'web/src/reel/test/session.test.mjs',
    'web/src/reel/test/gl-resources.test.mjs',
)

LANE_E_R24E_MODULE_OWNERS: dict[str, dict[str, Any]] = {
    'api/plumb_api/engines/upscale/identity_hooks.py': {"owner": "E", "feature_ids": (49,)},
    'api/plumb_api/engines/upscale/op_counts.py': {"owner": "E", "feature_ids": (49,)},
    'api/plumb_api/engines/upscale/test_identity_hooks.py': {"owner": "E", "feature_ids": (49,)},
    'api/plumb_api/engines/upscale/test_op_counts.py': {"owner": "E", "feature_ids": (49,)},
    'api/plumb_api/pro/cache.py': {"owner": "E", "feature_ids": (49, 94)},
    'api/plumb_api/pro/evidence.py': {"owner": "E", "feature_ids": (49, 94)},
    'api/plumb_api/pro/identity.py': {"owner": "E", "feature_ids": (49, 94)},
    'api/plumb_api/pro/preview.py': {"owner": "E", "feature_ids": (49, 94)},
    'api/plumb_api/pro/strength.py': {"owner": "E", "feature_ids": (49, 94)},
    'api/plumb_api/pro/test_evidence.py': {"owner": "E", "feature_ids": (49, 94)},
    'api/plumb_api/pro/test_preview.py': {"owner": "E", "feature_ids": (49, 94)},
    'api/plumb_api/pro/test_strength_cache.py': {"owner": "E", "feature_ids": (49, 94)},
    'api/plumb_api/video/__init__.py': {"owner": "E", "feature_ids": (73, 93)},
    'api/plumb_api/video/face_frame.py': {"owner": "E", "feature_ids": (73, 93)},
    'api/plumb_api/video/test_face_frame.py': {"owner": "E", "feature_ids": (73, 93)},
    'api/tests/test_pro_identity_lock_default.py': {"owner": "E", "feature_ids": (49, 73, 94)},
    'tests/realface/pass_definitions_r24e/pro_identity.json': {"owner": "E", "feature_ids": (49, 94)},
    'tests/realface/pass_definitions_r24e/pro_masks.json': {"owner": "E", "feature_ids": (49, 94)},
    'tests/realface/pass_definitions_r24e/upscale_detail.json': {"owner": "E", "feature_ids": (49, 94)},
    'web/src/engines/upscale/identity-hooks.ts': {"owner": "E", "feature_ids": (49,)},
    'web/src/engines/upscale/test/identity-hooks.test.mjs': {"owner": "E", "feature_ids": (49,)},
    'web/src/pro/cache.ts': {"owner": "E", "feature_ids": (49, 94)},
    'web/src/pro/export-privacy.ts': {"owner": "E", "feature_ids": (49, 94)},
    'web/src/pro/identity.ts': {"owner": "E", "feature_ids": (49, 94)},
    'web/src/pro/interaction.ts': {"owner": "E", "feature_ids": (49, 94)},
    'web/src/pro/strength.ts': {"owner": "E", "feature_ids": (49, 94)},
    'web/src/pro/test/encoded-fixtures.mjs': {"owner": "E", "feature_ids": (49, 94)},
    'web/src/pro/test/export-security.test.mjs': {"owner": "E", "feature_ids": (49, 94)},
    'web/src/pro/test/identity-cache.test.mjs': {"owner": "E", "feature_ids": (49, 94)},
    'web/src/pro/test/interaction.test.mjs': {"owner": "E", "feature_ids": (49, 94)},
    'web/src/pro/test/strength-scale.test.mjs': {"owner": "E", "feature_ids": (49, 94)},
    'web/src/reel/frame-export.ts': {"owner": "E", "feature_ids": (73, 93)},
    'web/src/reel/test/frame-export.test.mjs': {"owner": "E", "feature_ids": (73, 93)},
    'web/test/pro-export-metadata.test.mjs': {"owner": "E", "feature_ids": (73, 94)},
}

LANE_E_R24E_TESTS: tuple[str, ...] = (
    'api/plumb_api/engines/upscale/test_identity_hooks.py',
    'api/plumb_api/engines/upscale/test_op_counts.py',
    'api/plumb_api/pro/test_evidence.py',
    'api/plumb_api/pro/test_preview.py',
    'api/plumb_api/pro/test_strength_cache.py',
    'api/plumb_api/video/test_face_frame.py',
    'api/tests/test_pro_identity_lock_default.py',
    'tests/realface/pass_definitions_r24e/pro_identity.json',
    'tests/realface/pass_definitions_r24e/pro_masks.json',
    'tests/realface/pass_definitions_r24e/upscale_detail.json',
    'web/src/engines/upscale/test/identity-hooks.test.mjs',
    'web/src/pro/test/encoded-fixtures.mjs',
    'web/src/pro/test/export-security.test.mjs',
    'web/src/pro/test/identity-cache.test.mjs',
    'web/src/pro/test/interaction.test.mjs',
    'web/src/pro/test/strength-scale.test.mjs',
    'web/src/reel/test/frame-export.test.mjs',
    'web/test/pro-export-metadata.test.mjs',
)

LANE_E_MODULES = tuple(dict.fromkeys((
    *LANE_E_MODULES,
    *LANE_E_R22E_CP3_MODULES,
    *LANE_E_R23E_MODULES,
    *LANE_E_R24E_MODULE_OWNERS,
)))
LANE_E_TESTS = tuple(dict.fromkeys((
    *LANE_E_TESTS,
    *LANE_E_R22E_CP3_TESTS,
    *LANE_E_R23E_TESTS,
    *LANE_E_R24E_TESTS,
)))

# --- Lane E r25e: transferred J10-J16 posture ownership, no feature-status changes ---
# Posture is *outside* the numbered 103 feature list. An empty feature_ids tuple
# is intentional; J10-J16 remains the sole feature reference in features.json.
LANE_E_R25E_MODULE_OWNERS: dict[str, dict[str, Any]] = {
    "api/plumb_api/engines/upscale": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale": {"owner": "E", "feature_ids": (49,)},
    "api/plumb_api/engines/posture/__init__.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/fixes.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/points.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/render.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/synthetic.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/catalogue.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/levels.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/session.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/identity.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/body_evidence.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/review.py": {"owner": "E", "feature_ids": ()},
    "web/src/engines/local/posture.ts": {"owner": "E", "feature_ids": ()},
    "web/src/body/measure.ts": {"owner": "E", "feature_ids": ()},
    "web/src/body/pose.ts": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-session.ts": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-evidence.ts": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-export.ts": {"owner": "E", "feature_ids": ()},
    "api/tests/test_posture_r7.py": {"owner": "E", "feature_ids": ()},
    "api/tests/test_posture_scope.py": {"owner": "E", "feature_ids": ()},
    "api/tests/test_posture_catalogue.py": {"owner": "E", "feature_ids": ()},
    "api/tests/test_posture_levels.py": {"owner": "E", "feature_ids": ()},
    "api/tests/test_posture_synthetic_truth.py": {"owner": "E", "feature_ids": ()},
    "api/tests/test_posture_body_set_spec.py": {"owner": "E", "feature_ids": ()},
    "api/tests/test_posture_review.py": {"owner": "E", "feature_ids": ()},
    "api/tests/test_posture_cache_isolation.py": {"owner": "E", "feature_ids": ()},
    "web/test/posture-catalogue.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-levels.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-session.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-evidence.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-export.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-cache-isolation.test.mjs": {"owner": "E", "feature_ids": ()},
    "tests/realface/pass_definitions_r25e/posture_levels.json": {"owner": "E", "feature_ids": ()},
    "tests/realface/pass_definitions_r25e/posture_front.json": {"owner": "E", "feature_ids": ()},
    "tests/realface/pass_definitions_r25e/posture_side.json": {"owner": "E", "feature_ids": ()},
    "parity/posture-catalogue-r25e.json": {"owner": "E", "feature_ids": ()},
    "parity/posture-levels-r25e.json": {"owner": "E", "feature_ids": ()},
    "docs/posture-body-test-set.md": {"owner": "E", "feature_ids": ()},
}

LANE_E_MODULES = tuple(dict.fromkeys((*LANE_E_MODULES, *LANE_E_R25E_MODULE_OWNERS)))


# Lane E gatefix: separable shape and age safety hooks with synthetic regression suites.
LANE_E_GATEFIX_MODULE_OWNERS: dict[str, dict[str, Any]] = {
    "api/plumb_api/engines/shape/shape_guard.py": {"owner": "E", "feature_ids": (39,)},
    "api/plumb_api/engines/shape/age_protection.py": {"owner": "E", "feature_ids": (1, 3)},
    "api/tests/gatefix_e_drawn.py": {"owner": "E", "feature_ids": (1, 3, 39)},
    "api/tests/test_shape_gatefix_e.py": {"owner": "E", "feature_ids": (39,)},
    "api/tests/test_age_gatefix_e.py": {"owner": "E", "feature_ids": (1, 3)},
    "api/tests/test_gatefix_e_injected_sources.py": {"owner": "E", "feature_ids": (1, 3, 39)},
}

LANE_E_MODULES = tuple(dict.fromkeys((*LANE_E_MODULES, *LANE_E_GATEFIX_MODULE_OWNERS)))


# Lane E r26e: independent posture safety and screen wiring, no new extra rows.
LANE_E_R26E_MODULE_OWNERS: dict[str, dict[str, Any]] = {
    "api/plumb_api/engines/posture/protected.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/inspection.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/body_acceptance.py": {"owner": "E", "feature_ids": ()},
    "api/tests/test_posture_protected_r26e.py": {"owner": "E", "feature_ids": ()},
    "api/tests/test_posture_body_acceptance_r26e.py": {"owner": "E", "feature_ids": ()},
    "api/tests/test_posture_preview_budget_r26e.py": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-safe.ts": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-panel-state.ts": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-workflow.ts": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-panel.ts": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-preview.ts": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-binding.ts": {"owner": "E", "feature_ids": ()},
    "web/test/posture-protected-r26e.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-workflow-r26e.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-panel-r26e.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-dom-fake.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-preview-r26e.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-binding-r26e.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-output.ts": {"owner": "E", "feature_ids": ()},
    "web/test/posture-output-r26e.test.mjs": {"owner": "E", "feature_ids": ()},
    "docs/posture-body-evidence-r26e.md": {"owner": "E", "feature_ids": ()},
    "tests/realface/pass_definitions_r26e/posture_movement.json": {
        "owner": "E", "feature_ids": (),
    },
    "tests/realface/pass_definitions_r26e/posture_identity.json": {
        "owner": "E", "feature_ids": (),
    },
    "tests/realface/pass_definitions_r26e/posture_artifacts.json": {
        "owner": "E", "feature_ids": (),
    },
}


# Lane E r27e: manual annotation, source-bound head protection and checked export.
LANE_E_R27E_MODULE_OWNERS: dict[str, dict[str, Any]] = {
    "web/src/body/posture-polygons.ts": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-intake.ts": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-pixel-guard.ts": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-annotator.ts": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-file.ts": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-stage.ts": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-studio.ts": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-acceptance.ts": {"owner": "E", "feature_ids": ()},
    "web/test/posture-fixtures-r27e.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-polygons-r27e.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-intake-r27e.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-guard-r27e.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-annotator-r27e.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-file-stage-r27e.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-studio-r27e.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-acceptance-r27e.test.mjs": {"owner": "E", "feature_ids": ()},
}

LANE_E_MODULES = tuple(dict.fromkeys((*LANE_E_MODULES, *LANE_E_R27E_MODULE_OWNERS)))

# Lane E r28e: frozen body provenance and counts-only numerical evidence.
# No new extras/contribution row or release-quality PASS is added.
LANE_E_R28E_MODULE_OWNERS: dict[str, dict[str, Any]] = {
    "api/plumb_api/engines/posture/body_freeze.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/body_measurement.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/body_ledger.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/body_scorecard.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/body_command.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/test_body_freeze.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/test_body_measurement.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/test_body_ledger.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/test_body_scorecard.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/test_body_command.py": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-proof.ts": {"owner": "E", "feature_ids": ()},
    "web/test/posture-proof-r28e.test.mjs": {"owner": "E", "feature_ids": ()},
}

LANE_E_MODULES = tuple(dict.fromkeys((*LANE_E_MODULES, *LANE_E_R28E_MODULE_OWNERS)))


# Lane E r29e: body numeric evidence projection and admitted-group planning.
# Contributions and historical feature-status rows are unchanged.
LANE_E_R29E_MODULE_OWNERS: dict[str, dict[str, Any]] = {
    "api/plumb_api/engines/posture/body_public.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/body_coverage.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/test_body_public.py": {"owner": "E", "feature_ids": ()},
    "api/plumb_api/engines/posture/test_body_coverage.py": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-proof-integrity.ts": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-evidence-file.ts": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-proof-summary.ts": {"owner": "E", "feature_ids": ()},
    "web/src/body/posture-coverage-plan.ts": {"owner": "E", "feature_ids": ()},
    "web/test/posture-public-fixture-r29e.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-proof-integrity-r29e.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-evidence-file-r29e.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-proof-summary-r29e.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-studio-proof-r29e.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-coverage-plan-r29e.test.mjs": {"owner": "E", "feature_ids": ()},
    "docs/posture-browser-evidence.md": {"owner": "E", "feature_ids": ()},
}

LANE_E_MODULES = tuple(dict.fromkeys((*LANE_E_MODULES, *LANE_E_R29E_MODULE_OWNERS)))


# Lane E r30e: checked local upscale, allocation evidence and protected export.
# No new contribution/extras rows and no release-quality score is introduced.
LANE_E_R30E_MODULE_OWNERS: dict[str, dict[str, Any]] = {
    "api/plumb_api/engines/upscale/safe.py": {"owner": "E", "feature_ids": (49,)},
    "api/plumb_api/engines/upscale/safe_tiles.py": {"owner": "E", "feature_ids": (49,)},
    "api/plumb_api/engines/upscale/safe_quality.py": {"owner": "E", "feature_ids": (49,)},
    "api/plumb_api/engines/upscale/preview_session.py": {"owner": "E", "feature_ids": (49,)},
    "api/plumb_api/engines/upscale/test_safe.py": {"owner": "E", "feature_ids": (49,)},
    "api/plumb_api/engines/upscale/test_safe_tiles.py": {"owner": "E", "feature_ids": (49,)},
    "api/plumb_api/engines/upscale/test_safe_quality.py": {"owner": "E", "feature_ids": (49,)},
    "api/plumb_api/engines/upscale/test_safe_properties.py": {"owner": "E", "feature_ids": (49,)},
    "api/plumb_api/engines/upscale/test_preview_session.py": {"owner": "E", "feature_ids": (49,)},
    "api/plumb_api/engines/upscale/test_device_admission.py": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/safe.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/safe-export.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/safe-quality.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/safe-tile-policy.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/preview-session.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/test/safe.test.mjs": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/test/safe-export.test.mjs": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/test/safe-quality.test.mjs": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/test/safe-tile-policy.test.mjs": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/test/safe-properties.test.mjs": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/test/preview-session.test.mjs": {"owner": "E", "feature_ids": (49,)},
    "docs/upscale-safe-r30e.md": {"owner": "E", "feature_ids": (49,)},
}

LANE_E_MODULES = tuple(dict.fromkeys((*LANE_E_MODULES, *LANE_E_R30E_MODULE_OWNERS)))

# Lane E r30e additional synthetic negative controls for the same owned surface.
LANE_E_R30E_NEGATIVE_TESTS: dict[str, dict[str, Any]] = {
    "api/plumb_api/engines/upscale/test_safe_adversarial.py": {
        "owner": "E", "feature_ids": (49,),
    },
    "web/src/engines/upscale/test/safe-adversarial.test.mjs": {
        "owner": "E", "feature_ids": (49,),
    },
}

LANE_E_MODULES = tuple(dict.fromkeys((*LANE_E_MODULES, *LANE_E_R30E_NEGATIVE_TESTS)))

# Lane E r31e: settings-only posture edit history and source-bound replay.
# Existing contribution rows and release evidence remain unchanged.
LANE_E_R31E_MODULE_OWNERS: dict[str, dict[str, Any]] = {
    "web/src/body/posture-history.ts": {"owner": "E", "feature_ids": ()},
    "web/test/posture-history-r31e.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/test/posture-history-studio-r31e.test.mjs": {"owner": "E", "feature_ids": ()},
    "docs/posture-edit-history-r31e.md": {"owner": "E", "feature_ids": ()},
}

LANE_E_MODULES = tuple(dict.fromkeys((*LANE_E_MODULES, *LANE_E_R31E_MODULE_OWNERS)))


# Lane E r32e: local commercial-rights-gated pretraining and tests.
LANE_E_R32E_MODULE_OWNERS: dict[str, dict[str, Any]] = {
    "api/plumb_api/pro/training/__init__.py": {"owner": "E", "feature_ids": (49,)},
    "api/plumb_api/pro/training/pipeline.py": {"owner": "E", "feature_ids": (49,)},
    "api/plumb_api/pro/training/policy.py": {"owner": "E", "feature_ids": (49,)},
    "api/plumb_api/pro/training/test_pipeline.py": {"owner": "E", "feature_ids": (49,)},
    "api/plumb_api/pro/training/train.py": {"owner": "E", "feature_ids": (49,)},
}
LANE_E_MODULES = tuple(dict.fromkeys((*LANE_E_MODULES, *LANE_E_R32E_MODULE_OWNERS)))


# Lane E r33e: immutable approved-corpus audit, revocations and private scoring.
# No new extras, feature statuses or release PASS records are introduced.
LANE_E_R33E_MODULE_OWNERS: dict[str, dict[str, Any]] = {
    "api/plumb_api/pro/training/atomic.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/audit.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/coverage.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/operator.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/revocations.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/scoring.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/shards.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_atomic.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_audit_stress.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_coverage.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_integrity.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_operator.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_revocations.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_scoring.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_shards.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_support.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_training_safety.py": {"owner": "E", "feature_ids": (94,)},
    "docs/BELJOUR-training-integrity-r33e.md": {"owner": "E", "feature_ids": (94,)},
}
LANE_E_MODULES = tuple(dict.fromkeys((*LANE_E_MODULES, *LANE_E_R33E_MODULE_OWNERS)))

# Lane E r34e: reproducible masked-patch reference training and bounded checkpoints.
# No changes to scored feature rows or the legacy registry contribution views.
LANE_E_R34E_MODULE_OWNERS: dict[str, dict[str, Any]] = {
    "api/plumb_api/pro/training/checkpoint_guard.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/masked_train.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/model_card.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/patch_model.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/patches.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/resources.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/sampler.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_checkpoint_guard.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_masked_eval.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_masked_security.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_masked_train.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_model_card.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_patch_model.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_patch_operator.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_patch_reliability.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_patches.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_resources.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_sampler.py": {"owner": "E", "feature_ids": (94,)},
    "docs/BELJOUR-masked-training-r34e.md": {"owner": "E", "feature_ids": (94,)},
}
LANE_E_MODULES = tuple(dict.fromkeys((*LANE_E_MODULES, *LANE_E_R34E_MODULE_OWNERS)))

# Lane E r35e: rights certificate, measured gate hook and integrity-preserving workflows.
# Existing registry contribution rows and feature-status tests are unchanged.
LANE_E_R35E_MODULE_OWNERS: dict[str, dict[str, Any]] = {
    "api/plumb_api/pro/training/certificate.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/gate_metrics.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/shard_stream.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/shard_index.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_shard_index.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_certificate.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_gate_metrics.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_shard_stream.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_operator_improvements.py": {
        "owner": "E", "feature_ids": (94,),
    },
    "web/src/body/posture-history-storage.ts": {"owner": "E", "feature_ids": ()},
    "web/test/posture-history-storage-r35e.test.mjs": {"owner": "E", "feature_ids": ()},
    "web/src/engines/upscale/colour-export.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/test/colour-export-r35e.test.mjs": {
        "owner": "E", "feature_ids": (49,),
    },
}
LANE_E_MODULES = tuple(dict.fromkeys((*LANE_E_MODULES, *LANE_E_R35E_MODULE_OWNERS)))


# Lane E r36e: 1080 Quality Generator lab and audited local export.
# All feature status and existing contribution views remain unchanged.
LANE_E_R36E_MODULE_OWNERS: dict[str, dict[str, Any]] = {
    "web/src/engines/upscale/quality-tier.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/quality-generator.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/quality-export.ts": {"owner": "E", "feature_ids": (49, 94)},
    "web/src/pro/quality-session.ts": {"owner": "E", "feature_ids": (49, 94)},
    "web/src/pro/quality-lab.ts": {"owner": "E", "feature_ids": (49, 94)},
    "web/src/engines/upscale/test/quality-tier.test.mjs": {
        "owner": "E", "feature_ids": (49,),
    },
    "web/src/engines/upscale/test/quality-generator.test.mjs": {
        "owner": "E", "feature_ids": (49,),
    },
    "web/src/engines/upscale/test/quality-export.test.mjs": {
        "owner": "E", "feature_ids": (49, 94),
    },
    "web/src/pro/test/quality-session.test.mjs": {"owner": "E", "feature_ids": (49, 94)},
    "web/src/pro/test/quality-lab-page.test.mjs": {"owner": "E", "feature_ids": (49, 94)},
    "docs/BELJOUR-quality-generator-r36e.md": {"owner": "E", "feature_ids": (49, 94)},
}


# Lane E r37e: aspect-preserved HD and 4K local quality tiers and paired diagnostics.
# No feature scores or pinned registry contribution rows are modified.
LANE_E_R37E_MODULE_OWNERS: dict[str, dict[str, Any]] = {
    "web/src/engines/upscale/quality-aspect.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/quality-raster.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/quality-stages.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/quality-identity.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/quality-pipeline.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/quality-export-tier.ts": {
        "owner": "E", "feature_ids": (49, 94),
    },
    "web/src/engines/upscale/quality-metrics.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/quality-paired.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/test/quality-aspect-r37e.test.mjs": {
        "owner": "E", "feature_ids": (49,),
    },
    "web/src/engines/upscale/test/quality-stages-r37e.test.mjs": {
        "owner": "E", "feature_ids": (49,),
    },
    "web/src/engines/upscale/test/quality-pipeline-r37e.test.mjs": {
        "owner": "E", "feature_ids": (49,),
    },
    "web/src/engines/upscale/test/quality-paired-r37e.test.mjs": {
        "owner": "E", "feature_ids": (49,),
    },
    "web/src/engines/upscale/test/quality-export-tier-r37e.test.mjs": {
        "owner": "E", "feature_ids": (49, 94),
    },
    "web/src/pro/test/quality-tier-session-r37e.test.mjs": {
        "owner": "E", "feature_ids": (49, 94),
    },
    "web/src/engines/upscale/quality-budget.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/test/quality-budget-r37e.test.mjs": {
        "owner": "E", "feature_ids": (49,),
    },
    "web/src/engines/upscale/test/quality-safety-r37e.test.mjs": {
        "owner": "E", "feature_ids": (49,),
    },
    "web/src/engines/upscale/test/quality-colour-r37e.test.mjs": {
        "owner": "E", "feature_ids": (49,),
    },
    "docs/BELJOUR-quality-generator-r37e.md": {"owner": "E", "feature_ids": (49, 94)},
}
LANE_E_MODULES = tuple(dict.fromkeys((*LANE_E_MODULES, *LANE_E_R37E_MODULE_OWNERS)))

# Lane E r38e: locally verified model rights, primary upscale and matting diagnostics.
# Existing feature counts, score views and outside-the-100 contribution rows are unchanged.
LANE_E_R38E_MODULE_OWNERS: dict[str, dict[str, Any]] = {
    "web/src/engines/upscale/quality-model-rights.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/quality-model-chain.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/quality-model-matte.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/quality-model-loader.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/test/quality-model-loader-r38e.test.mjs": {
        "owner": "E", "feature_ids": (49,),
    },
    "web/src/engines/upscale/test/quality-model-rights-r38e.test.mjs": {
        "owner": "E", "feature_ids": (49,),
    },
    "web/src/engines/upscale/test/quality-model-chain-r38e.test.mjs": {
        "owner": "E", "feature_ids": (49,),
    },
    "web/src/engines/upscale/test/quality-model-matte-r38e.test.mjs": {
        "owner": "E", "feature_ids": (49,),
    },
    "web/src/engines/upscale/test/quality-model-pipeline-r38e.test.mjs": {
        "owner": "E", "feature_ids": (49,),
    },
    "web/src/engines/upscale/test/quality-model-fixtures-r38e.mjs": {
        "owner": "E", "feature_ids": (49,),
    },
    "web/src/pro/test/quality-model-session-r38e.test.mjs": {
        "owner": "E", "feature_ids": (49,),
    },
    "api/plumb_api/engines/upscale/model_gate.py": {"owner": "E", "feature_ids": (49,)},
    "api/plumb_api/engines/upscale/test_model_gate.py": {
        "owner": "E", "feature_ids": (49,),
    },
    "docs/BELJOUR-quality-model-adoption-r38e.md": {
        "owner": "E", "feature_ids": (49,),
    },
}
LANE_E_MODULES = tuple(dict.fromkeys((*LANE_E_MODULES, *LANE_E_R38E_MODULE_OWNERS)))


# Lane E r39e: encrypted model, checkpoint, tuning and private recipe boundaries.
# Existing feature rows and registry contribution hooks remain unchanged.
LANE_E_R39E_MODULE_OWNERS: dict[str, dict[str, Any]] = {
    "api/plumb_api/pro/training/sealed_store.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/sealed_checkpoint.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/sealed_settings.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/protected_training.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/protection_gate.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_sealed_store.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_sealed_checkpoint.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_sealed_settings.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_protected_training.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_protection_gate.py": {"owner": "E", "feature_ids": (94,)},
    "web/src/engines/upscale/protected-artifact.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/quality-model-protected.ts": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/test/protected-artifact-r39e.test.mjs": {"owner": "E", "feature_ids": (49,)},
    "web/src/engines/upscale/test/quality-model-protected-r39e.test.mjs": {"owner": "E", "feature_ids": (49,)},
    "web/src/pro/protected-recipe.ts": {"owner": "E", "feature_ids": (94,)},
    "web/src/pro/source-binding.ts": {"owner": "E", "feature_ids": (94,)},
    "web/src/pro/test/protected-recipe-r39e.test.mjs": {"owner": "E", "feature_ids": (94,)},
    "web/src/body/posture-history-protected.ts": {"owner": "E", "feature_ids": ()},
    "web/test/posture-history-protected-r39e.test.mjs": {"owner": "E", "feature_ids": ()},
    "docs/BELJOUR-protection-r39e.md": {"owner": "E", "feature_ids": (49, 94)},
}
LANE_E_MODULES = tuple(dict.fromkeys((*LANE_E_MODULES, *LANE_E_R39E_MODULE_OWNERS)))

# Lane E r39e consent addition: explicit opt-in, withdrawal and checkpoint lineage.
# Registry contribution ordering and feature rows remain unchanged.
LANE_E_R39E_CONSENT_OWNERS: dict[str, dict[str, Any]] = {
    "api/plumb_api/pro/training/consent.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/withdrawal.py": {"owner": "E", "feature_ids": (94,)},
    "api/plumb_api/pro/training/test_consent_admission.py": {
        "owner": "E", "feature_ids": (94,),
    },
    "api/plumb_api/pro/training/test_consent_withdrawal.py": {
        "owner": "E", "feature_ids": (94,),
    },
    "docs/BELJOUR-consent-training-r39e.md": {"owner": "E", "feature_ids": (94,)},
}
LANE_E_MODULES = tuple(dict.fromkeys((*LANE_E_MODULES, *LANE_E_R39E_CONSENT_OWNERS)))
