"""Lane F sole ownership registration: catalogue, shade, concealer and men's hair.

Only additive infrastructure ownership. No real-face score or feature status claim.
Author: John Khan.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

from . import LaneContribution

LANE_F_OWNER = "F"
LANE_F_FEATURE_IDS = (13, 14, 17, 18, 101, 102, 103)
LANE_F_R22_MODULES = (
    "api/plumb_api/routes/skin_match.py",
    "web/src/screens/skin-match.ts",
    "web/src/screens/skin-match-types.ts",
    "web/src/screens/skin-match-model.ts",
    "web/src/api.ts",
)
LANE_F_R22_TESTS: tuple[str, ...] = ()
LANE_F_R23_MODULES = (
    "api/plumb_api/commerce/identity.py",
    "api/plumb_api/commerce/preview_cache.py",
    "api/plumb_api/commerce/preview_levels.py",
    "api/plumb_api/commerce/strength.py",
    "api/plumb_api/engines/shade/deep_reference_shades.json",
    "api/plumb_api/engines/shade/reading.py",
    "api/plumb_api/engines/shade/session.py",
    "web/src/commerce/identity.ts",
    "web/src/commerce/preview-cache.ts",
    "web/src/commerce/strength.ts",
    "web/src/engines/shade/deep-reference.ts",
    "web/src/engines/shade/reading.ts",
    "web/src/engines/shade/session.ts",
)
LANE_F_R23_TESTS = (
    "api/tests/test_r23f_flag_off.py",
    "api/tests/test_r23f_preview_cache.py",
    "api/tests/test_r23f_shade_session.py",
    "api/tests/test_shade_deep_coverage.py",
    "api/tests/test_shade_reading_reliability.py",
    "api/tests/test_tryon_identity_lock_default.py",
    "api/tests/test_tryon_strength_scale.py",
    "web/test/shade-session-r23f.test.mjs",
    "web/test/tryon-strength-scale.test.mjs",
)
LANE_F_R26_MODULES = (
    "api/plumb_api/engines/concealer/__init__.py",
    "api/plumb_api/engines/concealer/crown.py",
    "api/plumb_api/engines/concealer/shades.py",
    "api/plumb_api/engines/concealer/strands.py",
    "api/plumb_api/engines/concealer/synthetic.py",
    "api/plumb_api/engines/concealer/cover.py",
    "api/plumb_api/services/fibre.py",
    "api/plumb_api/engines/hair_palette/__init__.py",
    "api/plumb_api/engines/hair_palette/catalogue.py",
    "api/plumb_api/engines/hair_palette/matching.py",
    "api/plumb_api/engines/hair_palette/preview.py",
    "api/plumb_api/engines/hair_palette/export.py",
    "api/plumb_api/engines/hair_palette/catalogue.json",
    "api/plumb_api/engines/menshair/public_render.py",
    "web/src/engines/local/fibre.ts",
    "web/src/engines/local/strands.ts",
    "web/src/engines/hair_palette/index.ts",
    "web/src/engines/hair_palette/palette.ts",
    "web/src/engines/hair_palette/preview.ts",
    "web/src/engines/hair_palette/generated/data.ts",
    "web/src/engines/menshair/public-render.ts",
    "web/src/commerce/hair-workbench.ts",
)
LANE_F_R26_TESTS = (
    "api/tests/test_concealer_levels.py",
    "api/tests/test_concealer_r7.py",
    "api/tests/test_hair_palette.py",
    "api/tests/test_menshair_render_entry.py",
    "api/tests/test_f_primary_face_input.py",
    "api/tests/test_f_hair_flag_off.py",
    "api/tests/test_fibre_parity_r26f.py",
    "api/tests/test_menshair_parity_r26f.py",
    "api/tests/test_lane_f_registry_r26f.py",
    "api/tests/test_r26f_guard_boundaries.py",
    "web/test/hair-workbench-r26f.test.mjs",
    "web/test/hair-palette.test.mjs",
    "web/test/hair-fibre-r26f.test.mjs",
    "web/test/menshair-render-r26f.test.mjs",
)


def _rows(
    identifier: str,
    name: str,
    modules: tuple[str, ...],
    tests: tuple[str, ...],
) -> list[dict[str, Any]]:
    return [{
        "id": identifier,
        "name": name,
        "owner": LANE_F_OWNER,
        "feature_ids": list(LANE_F_FEATURE_IDS),
        "status": "Built",
        "tested": "synthetic_only",
        "provider": "local",
        "modules": list(modules),
        "tests": list(tests),
        "note": "Local prototypes and provider mock boundaries; real-face quality Not tested.",
    }]


def _present(root: Path, paths: tuple[str, ...]) -> list[str]:
    """Include only source and tests actually present in the target tree."""
    return [path for path in paths if (root / path).is_file()]


def r22_rows(root: Path) -> list[dict[str, Any]]:
    return _rows(
        "r22f-catalogue-skin-products",
        "Editorial hair and cosmetic shade catalogue",
        tuple(r22_paths(root)),
        tuple(_present(root, LANE_F_R22_TESTS)),
    )


def r23_rows(root: Path) -> list[dict[str, Any]]:
    return _rows(
        "r23f-shade-lighting-guard-and-cache",
        "Guarded shade sampling and try-on cache",
        tuple(r23_paths(root)),
        tuple(_present(root, LANE_F_R23_TESTS)),
    )


def r26_rows(root: Path) -> list[dict[str, Any]]:
    return _rows(
        "r26f-fibre-palette-menshair",
        "Mask-limited fibre cover, original palette and short sides",
        tuple(r26_paths(root)),
        tuple(_present(root, LANE_F_R26_TESTS)),
    )


def r22_paths(root: Path) -> list[str]:
    return _present(root, LANE_F_R22_MODULES)


def r23_paths(root: Path) -> list[str]:
    return _present(root, LANE_F_R23_MODULES)


def r26_paths(root: Path) -> list[str]:
    return _present(root, LANE_F_R26_MODULES)


LANE_F_GATEFIX_MODULES = (
    "api/plumb_api/engines/shade/measurement.py",
    "api/plumb_api/engines/shade/coverage.py",
    "api/plumb_api/engines/shade/gate_evidence.py",
    "api/plumb_api/styling/local_demo.py",
    "api/plumb_api/styling/evidence.py",
    "api/plumb_api/styling/demo_gate.py",
)
LANE_F_GATEFIX_TESTS = (
    "api/tests/test_gatefix_f_shade.py",
    "api/tests/test_gatefix_f_hair_studio.py",
    "api/tests/test_gatefix_f_coverage.py",
    "api/tests/test_gatefix_f_render_evidence.py",
    "api/tests/test_gatefix_f_public_gate_hooks.py",
    "api/tests/test_gatefix_f_edges.py",
    "api/tests/test_gatefix_f_stress.py",
)


def gatefix_rows(root: Path) -> list[dict[str, Any]]:
    return _rows(
        "gatefix-f-shade-and-local-hair",
        "Cheek-audited cosmetic reference and twelve actual local hair renderers",
        tuple(gatefix_paths(root)),
        tuple(_present(root, LANE_F_GATEFIX_TESTS)),
    )


def gatefix_paths(root: Path) -> list[str]:
    return _present(root, LANE_F_GATEFIX_MODULES)


# Lane-local audit records only; the historical shared views remain untouched.
LANE_F_OWNERSHIP: tuple[LaneContribution, ...] = (
    LaneContribution(order=2200, owner=LANE_F_OWNER, extra_rows=r22_rows, module_paths=r22_paths),
    LaneContribution(order=2300, owner=LANE_F_OWNER, extra_rows=r23_rows, module_paths=r23_paths),
    LaneContribution(order=2600, owner=LANE_F_OWNER, extra_rows=r26_rows, module_paths=r26_paths),
    LaneContribution(order=2650, owner=LANE_F_OWNER,
                     extra_rows=gatefix_rows, module_paths=gatefix_paths),
)

# The shared loader must expose only its original, pinned contribution history.
CONTRIBUTIONS: tuple[LaneContribution, ...] = ()

# Lane F r27f: independently reviewed synthetic evidence, not shared extras.
# A lane-local ledger keeps the pinned contribution sequence unchanged.
LANE_F_R27_MODULES: tuple[str, ...] = (
    "api/plumb_api/engines/concealer/triage.py",
    "api/plumb_api/engines/hair_palette/evidence.py",
    "api/plumb_api/engines/hair_palette/reading.py",
    "api/plumb_api/engines/menshair/portfolio.py",
    "api/plumb_api/engines/menshair/portfolio_matrix.py",
    "api/plumb_api/engines/shade/diagnostics.py",
    "api/plumb_api/engines/shade/review.py",
    "web/src/engines/hair_palette/evidence.ts",
    "web/src/engines/hair_palette/reading.ts",
    "web/src/engines/shade/review.ts",
    "web/src/commerce/fibre-evidence.ts",
    "web/src/engines/menshair/portfolio.ts",
)
LANE_F_R27_TESTS: tuple[str, ...] = (
    "api/tests/r27f_fixtures.py",
    "api/tests/test_r27f_fibre_triage.py",
    "api/tests/test_r27f_hair_colour_reading.py",
    "api/tests/test_r27f_mens_portfolio.py",
    "api/tests/test_r27f_portfolio_matrix.py",
    "api/tests/test_r27f_palette_targets.py",
    "api/tests/test_r27f_shade_paths.py",
    "api/tests/test_r27f_shade_review.py",
    "api/tests/test_r27f_registry.py",
    "web/test/r27f-fibre-triage.test.mjs",
    "web/test/r27f-hair-colour-reading.test.mjs",
    "web/test/r27f-mens-portfolio.test.mjs",
    "web/test/r27f-palette-targets.test.mjs",
    "web/test/r27f-shade-review.test.mjs",
)


def r27_paths(root: Path) -> list[str]:
    """Only exact owned files present in this checkout are returned."""
    return _present(root, LANE_F_R27_MODULES)


def r27_rows(root: Path) -> list[dict[str, Any]]:
    """Private ownership record; not a change to the pinned shared views."""
    return _rows(
        "r27f-local-hair-evidence",
        "Forty-eight locally rendered cuts, colour target audits and fibre triage",
        tuple(r27_paths(root)),
        tuple(_present(root, LANE_F_R27_TESTS)),
    )


LANE_F_R27_OWNER = "F"

# Lane F r28f: local output verification, consultation and settings-only flow.
# Registry ownership remains private; pinned shared extras and order do not change.
LANE_F_R28_MODULES: tuple[str, ...] = (
    "api/plumb_api/commerce/local_hair_acceptance.py",
    "api/plumb_api/commerce/local_hair_journey.py",
    "api/plumb_api/commerce/local_hair_recipe.py",
    "api/plumb_api/engines/concealer/observed.py",
    "api/plumb_api/engines/hair_palette/consultation.py",
    "web/src/commerce/local-hair-recipe.ts",
    "web/src/commerce/observed-cover.ts",
    "web/src/engines/hair_palette/consultation.ts",
)
LANE_F_R28_TESTS: tuple[str, ...] = (
    "api/tests/test_r28f_consultation.py",
    "api/tests/test_r28f_cover_observation.py",
    "api/tests/test_r28f_local_hair_recipe.py",
    "api/tests/test_r28f_local_hair_acceptance.py",
    "api/tests/test_r28f_local_journey.py",
    "api/tests/test_r28f_ownership.py",
    "api/tests/test_r28f_observation_parity.py",
    "web/test/r28f-consultation.test.mjs",
    "web/test/r28f-local-hair-recipe.test.mjs",
    "web/test/r28f-observed-cover.test.mjs",
    "web/test/r28f-observation-parity.test.mjs",
)


def r28_paths(root: Path) -> list[str]:
    """Only source files owned by F and present in the checked-out tree."""
    return _present(root, LANE_F_R28_MODULES)


def r28_rows(root: Path) -> list[dict[str, Any]]:
    """Read-only local ledger. No shared feature or real-face status changes."""
    return _rows(
        "r28f-local-hair-consultation",
        "Observed guarded pigment output, conservative hair colour and private recipes",
        tuple(r28_paths(root)),
        tuple(_present(root, LANE_F_R28_TESTS)),
    )


LANE_F_R28_OWNER = "F"

# Lane F r29f: five actual guarded strength stops, local comparison and safe receipts.
# Only private ownership metadata; shared history remains pinned and unchanged.
LANE_F_R29_MODULES: tuple[str, ...] = (
    "api/plumb_api/commerce/level_evidence.py",
    "api/plumb_api/commerce/hair_comparison.py",
    "api/plumb_api/commerce/board_receipt.py",
    "web/src/commerce/level-board.ts",
    "web/src/commerce/board-view.ts",
    "web/src/commerce/board-receipt.ts",
)
LANE_F_R29_TESTS: tuple[str, ...] = (
    "api/tests/test_r29f_level_evidence.py",
    "api/tests/test_r29f_hair_comparison.py",
    "api/tests/test_r29f_board_receipt.py",
    "api/tests/test_r29f_comparison_boundaries.py",
    "api/tests/test_r29f_catalogue_matrix.py",
    "api/tests/test_r29f_registry.py",
    "web/test/r29f-scene.mjs",
    "web/test/r29f-level-board.test.mjs",
    "web/test/r29f-board-view.test.mjs",
    "web/test/r29f-board-receipt.test.mjs",
    "web/test/r29f-board-boundaries.test.mjs",
)


def r29_paths(root: Path) -> list[str]:
    """Existing Lane F source paths for internal registry audit only."""
    return _present(root, LANE_F_R29_MODULES)


def r29_rows(root: Path) -> list[dict[str, Any]]:
    """No additions to the pinned shared contribution sequence."""
    return _rows(
        "r29f-five-stop-comparison",
        "Real guarded five-strength hair boards and private settings-only receipts",
        tuple(r29_paths(root)),
        tuple(_present(root, LANE_F_R29_TESTS)),
    )


LANE_F_R29_OWNER = "F"

# Lane F r30f: stable shade source and colour distance contracts for local callers.
# Ownership is private; no additions to shared extras or contribution order.
LANE_F_R30_MODULES: tuple[str, ...] = (
    "api/plumb_api/engines/shade/loaders.py",
    "api/plumb_api/engines/shade/distance.py",
    "api/plumb_api/engines/shade/readiness.py",
    "api/plumb_api/engines/concealer/shade_support.py",
    "api/plumb_api/engines/concealer/colour_stability.py",
    "web/src/engines/shade/loaders.ts",
    "web/src/engines/shade/distance.ts",
    "web/src/engines/shade/readiness.ts",
    "web/src/commerce/shade-support.ts",
    "web/src/commerce/colour-stability.ts",
)
LANE_F_R30_TESTS: tuple[str, ...] = (
    "api/tests/test_r30f_shade_loaders.py",
    "api/tests/test_r30f_shade_distance.py",
    "api/tests/test_r30f_skn03.py",
    "api/tests/test_r30f_fibre_colour.py",
    "api/tests/test_r30f_colour_stability.py",
    "api/tests/test_r30f_public_parity.py",
    "web/test/r30f-shade-loaders.test.mjs",
    "web/test/r30f-shade-distance.test.mjs",
    "web/test/r30f-skn03.test.mjs",
    "web/test/r30f-fibre-colour.test.mjs",
    "web/test/r30f-colour-stability.test.mjs",
    "web/test/r30f-public-parity.test.mjs",
)


def r30_paths(root: Path) -> list[str]:
    """Existing Lane F implementation paths, not shared registry entries."""
    return _present(root, LANE_F_R30_MODULES)


def r30_rows(root: Path) -> list[dict[str, Any]]:
    """Retain actual ownership with synthetic-only and unverified product status."""
    return _rows(
        "r30f-public-shade-loaders",
        "Checked CIEDE2000, original shade catalogues and conservative fibre colour",
        tuple(r30_paths(root)),
        tuple(_present(root, LANE_F_R30_TESTS)),
    )


LANE_F_R30_OWNER = "F"

# Lane F r31f: on-screen pigment evidence and two-tone digital consultation.
# The pinned shared lane contributions remain empty; this is a private ledger.
LANE_F_R31_MODULES: tuple[str, ...] = (
    "api/plumb_api/engines/concealer/colour_evidence.py",
    "api/plumb_api/engines/concealer/colour_workflow.py",
    "api/plumb_api/engines/concealer/two_tone.py",
    "api/plumb_api/engines/concealer/colour_parity.py",
    "api/plumb_api/engines/concealer/colour_acceptance.py",
    "web/src/commerce/colour-evidence.ts",
    "web/src/commerce/colour-workflow.ts",
    "web/src/commerce/two-tone.ts",
    "web/src/commerce/colour-acceptance.ts",
)
LANE_F_R31_TESTS: tuple[str, ...] = (
    "api/tests/test_r31f_final_colour.py",
    "api/tests/test_r31f_tinted_workflow.py",
    "api/tests/test_r31f_two_tone.py",
    "api/tests/test_r31f_parity.py",
    "api/tests/test_r31f_acceptance.py",
    "web/test/r31f-colour-evidence.test.mjs",
    "web/test/r31f-colour-workflow.test.mjs",
    "web/test/r31f-two-tone.test.mjs",
    "web/test/r31f-parity.test.mjs",
    "web/test/r31f-acceptance.test.mjs",
)


def r31_paths(root: Path) -> list[str]:
    """Existing source ownership without changing shared registry history."""
    return _present(root, LANE_F_R31_MODULES)


def r31_rows(root: Path) -> list[dict[str, Any]]:
    """Synthetic only: never a physical pigment or release-quality score."""
    return _rows(
        "r31f-on-screen-hair-colour-evidence",
        "Guarded fibre colour, two-tone digital consultation and privacy-safe counts",
        tuple(r31_paths(root)),
        tuple(_present(root, LANE_F_R31_TESTS)),
    )


LANE_F_R31_OWNER = "F"


# Lane F r32f: skin-reference accuracy and photo-free acceptance evidence.
# This ledger is private and must not affect shared contribution order.
LANE_F_R32_OWNER = "F"
LANE_F_R32_MODULES: tuple[str, ...] = (
    "api/plumb_api/engines/shade/skin_accuracy.py",
    "api/plumb_api/engines/shade/skin_evidence.py",
    "api/plumb_api/engines/shade/reference_study.py",
    "web/src/engines/shade/skin-accuracy.ts",
    "web/src/engines/shade/skin-evidence.ts",
    "web/src/engines/shade/reference-study.ts",
)
LANE_F_R32_TESTS: tuple[str, ...] = (
    "api/tests/test_r32f_skin_consensus.py",
    "api/tests/test_r32f_skin_evidence.py",
    "api/tests/test_r32f_skin_photo.py",
    "api/tests/test_r32f_reference_study.py",
    "api/tests/test_r32f_registry.py",
    "api/tests/test_r32f_neutral_reference.py",
    "web/test/r32f-skin-consensus.test.mjs",
    "web/test/r32f-skin-evidence.test.mjs",
    "web/test/r32f-reference-study.test.mjs",
    "web/test/r32f-photo-session.test.mjs",
    "web/test/r32f-neutral-card.test.mjs",
)


def r32_paths(root: Path) -> list[str]:
    """Existing Lane F source files only, leaving shared ownership history intact."""
    return _present(root, LANE_F_R32_MODULES)


def r32_rows(root: Path) -> list[dict[str, Any]]:
    """Synthetic quality evidence is never marked as real-face validation."""
    return _rows(
        "r32f-skin-reference-accuracy",
        "Checked cheek consensus, reference identity and safe local audit",
        tuple(r32_paths(root)),
        tuple(_present(root, LANE_F_R32_TESTS)),
    )


# Lane F r33f: independently owned calibration and editorial display modules.
# No change to pinned historical extras, shared module universe or contributions.
LANE_F_R33_OWNER = "F"
LANE_F_R33_MODULES: tuple[str, ...] = (
    "api/plumb_api/engines/shade/neutral_calibration.py",
    "api/plumb_api/engines/shade/paired_stability.py",
    "api/plumb_api/engines/shade/calibrated_photo.py",
    "api/plumb_api/engines/hair_palette/editorial.py",
    "web/src/engines/shade/neutral-calibration.ts",
    "web/src/engines/shade/paired-stability.ts",
    "web/src/engines/shade/calibrated-photo.ts",
    "web/src/commerce/editorial-shade-model.ts",
    "web/src/commerce/editorial-shade-book.ts",
)
LANE_F_R33_TESTS: tuple[str, ...] = (
    "api/tests/test_r33f_neutral_calibration.py",
    "api/tests/test_r33f_paired_stability.py",
    "api/tests/test_r33f_calibrated_photo.py",
    "web/test/r33f-neutral-calibration.test.mjs",
    "web/test/r33f-paired-stability.test.mjs",
    "web/test/r33f-editorial-shade-book.test.mjs",
    "web/test/r33f-shade-book-interaction.test.mjs",
    "web/test/r33f-editorial-parity.test.mjs",
)


def r33_paths(root: Path) -> list[str]:
    """Return exactly the owned r33 source files that exist in the checkout."""
    return _present(root, LANE_F_R33_MODULES)


def r33_rows(root: Path) -> list[dict[str, Any]]:
    """Local calibration and presentation are not real-face or product passes."""
    return _rows(
        "r33f-shade-calibration-and-editorial-book",
        "Checked neutral sampling, repeatability and original shade folios",
        tuple(r33_paths(root)),
        tuple(_present(root, LANE_F_R33_TESTS)),
    )


# Lane F r34f: lighting sensitivity, nearby-reference review, and checked UI.
# These are private ownership records, not shared historical contributions.
LANE_F_R34_OWNER = "F"
LANE_F_R34_MODULES: tuple[str, ...] = (
    "api/plumb_api/engines/shade/illumination_sensitivity.py",
    "api/plumb_api/engines/shade/reference_ambiguity.py",
    "api/plumb_api/engines/shade/shade_safety.py",
    "api/plumb_api/engines/shade/sensitivity_parity.py",
    "web/src/engines/shade/illumination-sensitivity.ts",
    "web/src/engines/shade/reference-ambiguity.ts",
    "web/src/engines/shade/shade-safety.ts",
    "web/src/commerce/skin-sensitivity-panel.ts",
)
LANE_F_R34_TESTS: tuple[str, ...] = (
    "api/tests/test_r34f_illumination_sensitivity.py",
    "api/tests/test_r34f_reference_ambiguity.py",
    "api/tests/test_r34f_shade_safety.py",
    "api/tests/test_r34f_sensitivity_parity.py",
    "api/tests/test_r34f_stress_matrix.py",
    "api/tests/test_r34f_registry.py",
    "web/test/r34f-illumination-sensitivity.test.mjs",
    "web/test/r34f-reference-ambiguity.test.mjs",
    "web/test/r34f-shade-safety.test.mjs",
    "web/test/r34f-sensitivity-panel.test.mjs",
    "web/test/r34f-parity.test.mjs",
)


def r34_paths(root: Path) -> list[str]:
    """Only existing Lane F source files; no global ownership-view change."""
    return _present(root, LANE_F_R34_MODULES)


def r34_rows(root: Path) -> list[dict[str, Any]]:
    """Read-only synthetic review tools, with no human-evaluation claims."""
    return _rows(
        "r34f-lighting-and-reference-consultation",
        "Checked illumination sensitivity and manual reference comparison",
        tuple(r34_paths(root)),
        tuple(_present(root, LANE_F_R34_TESTS)),
    )


# Lane F r35f: calibrated source audits and C18 editorial shade QA.
# Private lane ownership only; pinned shared registry views are unchanged.
LANE_F_R35_OWNER = "F"
LANE_F_R35_MODULES: tuple[str, ...] = (
    "api/plumb_api/engines/shade/calibration.py",
    "api/plumb_api/engines/shade/c18.py",
    "api/plumb_api/engines/concealer/parity_contract.py",
    "api/plumb_api/engines/hair_palette/book_audit.py",
    "web/src/engines/shade/calibration.ts",
    "web/src/engines/shade/c18.ts",
    "web/src/engines/hair_palette/book-audit.ts",
    "web/src/commerce/fibre-parity.ts",
    "web/src/commerce/editorial-shade-search.ts",
)
LANE_F_R35_TESTS: tuple[str, ...] = (
    "api/tests/test_r35f_calibration.py",
    "api/tests/test_r35f_c18.py",
    "api/tests/test_r35f_fibre_parity.py",
    "api/tests/test_r35f_book_audit.py",
    "api/tests/test_r35f_integration.py",
    "web/test/r35f-calibration.test.mjs",
    "web/test/r35f-c18.test.mjs",
    "web/test/r35f-fibre-parity.test.mjs",
    "web/test/r35f-editorial-search.test.mjs",
    "web/test/r35f-book-audit.test.mjs",
    "web/test/r35f-integration.test.mjs",
)
LANE_F_R35_EVIDENCE: tuple[str, ...] = (
    "parity/skn03-calibration-r35f.json",
    "parity/fibre-coverage-r35f.json",
)


def r35_paths(root: Path) -> list[str]:
    """Only actual owned r35 source files, without modifying global ownership."""
    return _present(root, LANE_F_R35_MODULES)


def r35_rows(root: Path) -> list[dict[str, Any]]:
    """Synthetic-only ownership record, never a released-face quality verdict."""
    return _rows(
        "r35f-skin-calibration-and-editorial-integrity",
        "C18 shade integrity, SKN-03 calibration and fibre parity",
        tuple(r35_paths(root)),
        tuple(_present(root, LANE_F_R35_TESTS)),
    )


# Lane F SKN-03 frozen-count and C18 QA contracts; private ownership only.
LANE_F_R36_OWNER = "F"
LANE_F_R36_MODULES: tuple[str, ...] = (
    "api/plumb_api/engines/shade/skn03_checkpoint.py",
    "api/scripts/skn03_checkpoint.py",
    "web/src/engines/shade/skn03-checkpoint.ts",
)
LANE_F_R36_TESTS: tuple[str, ...] = (
    "api/tests/test_r36f_skn03_checkpoint.py",
    "api/tests/test_r36f_skn03_command.py",
    "web/test/r36f-skn03-checkpoint.test.mjs",
)
