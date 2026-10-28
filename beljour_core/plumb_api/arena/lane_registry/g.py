"""Lane G ownership entries for synthetic acceptance and audit tooling.

This lane records test coverage, not real-face or production-quality verdicts.
The integration registry owns the contribution dispatch interface.
"""
from __future__ import annotations

from . import LaneContribution

LANE_G_R22G_FEATURE_IDS = (5, 14, 18, 35, 73, 92, 94, 101, 102)
LANE_G_R22G_MODULES = (
    "tests/e2e/conftest.py",
    "tests/e2e/a11y_audit.py",
    "tests/e2e/test_accessibility.py",
    "tests/e2e/test_judge_http.py",
    "tests/e2e/test_provider_mock.py",
    "web/test/e2e/judge-flow.test.mjs",
    "web/test/e2e/hair-and-appearance.test.mjs",
    "web/test/e2e/commerce-and-consent.test.mjs",
    "web/test/e2e/keyboard-editor.test.mjs",
)

LANE_G_R23G_FEATURE_IDS = (5, 14, 18, 35, 73, 92, 94, 95, 100, 101, 102, 103)
LANE_G_R23G_MODULES = (
    "tests/e2e/test_release_http_contract.py",
    "tests/e2e/test_gateway_cache_contract.py",
    "tests/e2e/test_judge_browser_r23g.py",
    "web/test/e2e/commerce-races.test.mjs",
    "web/test/e2e/revision-regression.test.mjs",
    "web/test/e2e/export-integrity-r23g.test.mjs",
    "web/test/e2e/accessible-interaction-r23g.test.mjs",
)

# --- Lane G r24g: owner records moved from REGISTRY-NOTES-G.md ---
LANE_G_R24G_REGISTRATIONS: dict[str, dict[str, object]] = {
    "scripts/check_dead_code.py": {"owner": "G", "feature_ids": [95, 100]},
    "scripts/check_editor_contracts.py": {"owner": "G", "feature_ids": [95, 100]},
    "scripts/check_registry_honesty.py": {"owner": "G", "feature_ids": [95, 100]},
    "scripts/check_round_suffix.py": {"owner": "G", "feature_ids": [95, 100]},
    "scripts/check_timing_stability.py": {"owner": "G", "feature_ids": [95, 100]},
    "scripts/mutation_spotcheck.py": {"owner": "G", "feature_ids": [95, 100]},
    "scripts/sync_realface_100000.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/portable_faces.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/stream_io.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/mutation_probes.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_dead_code_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_editor_contracts_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_freeze_manifest_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_realface_100k_contract.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_registry_honesty_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_registry_notes_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_round_suffix_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_stream_integrity_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_timing_stability_g.py": {"owner": "G", "feature_ids": [95, 100]},
}

LANE_G_MODULE_OWNERS: dict[str, dict[str, object]] = {
    **{
        path: {"owner": "G", "feature_ids": list(LANE_G_R22G_FEATURE_IDS)}
        for path in LANE_G_R22G_MODULES
    },
    **{
        path: {"owner": "G", "feature_ids": list(LANE_G_R23G_FEATURE_IDS)}
        for path in LANE_G_R23G_MODULES
    },
    **LANE_G_R24G_REGISTRATIONS,
}


def lane_g_ownership() -> dict[str, dict[str, object]]:
    """Expose non-scoring, module-by-module ownership to the lane loader."""
    return dict(LANE_G_MODULE_OWNERS)


# Preserve the split registry's public contribution slot. The exact constructor
# used by other lanes must be taken from integration 2d50e7e, not guessed here.
CONTRIBUTIONS: tuple[LaneContribution, ...] = ()

# --- Lane G r25g: synthetic release tooling and evidence ownership ---
# Ownership never marks a new real-face quality gate as Passed.
LANE_G_R25G_REGISTRATIONS: dict[str, dict[str, object]] = {
    "scripts/rebase_lane_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/shard_release.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/shard_manifest.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/shard_cli.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/feature_checks_repair.py": {"owner": "G", "feature_ids": [1, 43, 95]},
    "tests/realface/feature_checks_hair.py": {"owner": "G", "feature_ids": [14, 18, 95]},
    "tests/realface/feature_evidence.py": {"owner": "G", "feature_ids": [14, 43, 95]},
    "tests/realface/shard_quality.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_shards_r25g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_face_fixer_hair_r25g.py": {"owner": "G", "feature_ids": [14, 43, 95]},
    "tests/e2e/test_feature_evidence_r25g.py": {"owner": "G", "feature_ids": [14, 43, 95]},
    "tests/e2e/test_shard_cli_r25g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_rebase_lane_g_r25g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_shard_quality_r25g.py": {"owner": "G", "feature_ids": [95, 100]},
}
LANE_G_MODULE_OWNERS.update(LANE_G_R25G_REGISTRATIONS)
# --- End Lane G r25g ---

# --- Lane G gatefix-g: versioned acceptance measurements and report tooling ---
# Non-scoring ownership. Missing external evidence remains UNPROVEN.
LANE_G_GATEFIX_REGISTRATIONS: dict[str, dict[str, object]] = {
    "scripts/check_gate_diffs.py": {"owner": "G", "feature_ids": [95, 100]},
    "scripts/sync_realface_50000.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/gatefix_inputs.py": {"owner": "G", "feature_ids": [14, 18, 39, 95]},
    "tests/realface/gatefix_hair.py": {"owner": "G", "feature_ids": [14, 18, 39]},
    "tests/realface/gatefix_teeth.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/gatefix_fibre.py": {"owner": "G", "feature_ids": [18, 95]},
    "tests/realface/gatefix_scoring.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_gatefix_hair_g.py": {"owner": "G", "feature_ids": [14, 18, 39]},
    "tests/e2e/test_gatefix_teeth_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_gatefix_scoring_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_gatefix_definitions_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_gatefix_diffs_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_gatefix_geometry_g.py": {"owner": "G", "feature_ids": [14, 18, 95]},
}
LANE_G_MODULE_OWNERS.update(LANE_G_GATEFIX_REGISTRATIONS)
# --- End Lane G gatefix-g ---

# --- Lane G gatefix-g-cp2: checkout verification without cross-lane writes ---
LANE_G_GATEFIX_CP2_REGISTRATIONS: dict[str, dict[str, object]] = {
    "scripts/check_gatefix_checkout.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_gatefix_checkout_g.py": {"owner": "G", "feature_ids": [95, 100]},
}
LANE_G_MODULE_OWNERS.update(LANE_G_GATEFIX_CP2_REGISTRATIONS)
# --- End Lane G gatefix-g-cp2 ---

# --- Lane G gatefix-g-cp3: synthetic multi-face, seasonal and timing evidence ---
# Ownership records only. The pinned contribution and extras views remain unchanged.
LANE_G_GATEFIX_CP3_REGISTRATIONS: dict[str, dict[str, object]] = {
    "tests/realface/multi_face_gate.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/seasonal_pack_gate.py": {"owner": "G", "feature_ids": [73, 95]},
    "api/tests/timing_gate_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "scripts/check_judge_slices_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_multi_face_gate_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_seasonal_pack_gate_g.py": {"owner": "G", "feature_ids": [73, 95]},
    "tests/e2e/test_timing_budget_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_judge_slices_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_versioned_slices_g.py": {"owner": "G", "feature_ids": [73, 95, 100]},
    "web/test/e2e/multiface-gate.test.mjs": {"owner": "G", "feature_ids": [95, 100]},
    "web/test/e2e/seasonal-pack-gate.test.mjs": {"owner": "G", "feature_ids": [73, 95]},
}
LANE_G_MODULE_OWNERS.update(LANE_G_GATEFIX_CP3_REGISTRATIONS)
# --- End Lane G gatefix-g-cp3 ---

# --- Lane G r27g: resumable release evidence and judge-path acceptance ---
# Module ownership only; frozen-set quality and human-review verdicts are separate.
LANE_G_R27G_REGISTRATIONS: dict[str, dict[str, object]] = {
    "tests/realface/release_confidence_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/release_controller_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/feature_bridge_g.py": {"owner": "G", "feature_ids": [73, 95, 100]},
    "tests/e2e/test_release_confidence_r27g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_controller_r27g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_feature_bridge_r27g.py": {"owner": "G", "feature_ids": [73, 95, 100]},
    "tests/e2e/test_r27g_versioned_definitions.py": {"owner": "G", "feature_ids": [73, 95, 100]},
    "tests/e2e/test_judge_mode_r27g.py": {"owner": "G", "feature_ids": [73, 95, 100]},
    "tests/e2e/test_judge_usage_r27g.py": {"owner": "G", "feature_ids": [95, 100]},
    "web/test/e2e/judge-mode-r27g.test.mjs": {"owner": "G", "feature_ids": [73, 95, 100]},
}
LANE_G_MODULE_OWNERS.update(LANE_G_R27G_REGISTRATIONS)
# --- End Lane G r27g ---

# --- Lane G r28g: release reconciliation and reference-review evidence ---
# Non-scoring ownership. The pinned contribution view remains unchanged.
LANE_G_R28G_REGISTRATIONS: dict[str, dict[str, object]] = {
    "tests/realface/release_reconciliation_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/review_coverage_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/release_matrix_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_reconciliation_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_review_coverage_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_controller_reporting_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_matrix_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_source_recheck_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_reporting_cli_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_review_multi_module_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_scale_matrix_g.py": {"owner": "G", "feature_ids": [95, 100]},
}
LANE_G_MODULE_OWNERS.update(LANE_G_R28G_REGISTRATIONS)
# --- End Lane G r28g ---

# --- Lane G r29g: paired release checks, reviewer provenance and public exports ---
# Ownership only; neither quality scores nor pinned contribution records change.
LANE_G_R29G_REGISTRATIONS: dict[str, dict[str, object]] = {
    "tests/realface/release_regression_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/release_dossier_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/review_assignments_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/release_publication_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/release_intersections_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_regression_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_dossier_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_review_assignments_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_publication_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_intersections_g.py": {"owner": "G", "feature_ids": [95, 100]},
}
LANE_G_MODULE_OWNERS.update(LANE_G_R29G_REGISTRATIONS)
# --- End Lane G r29g ---

# --- Lane G r30g: preregistered frozen release coverage and operator evidence ---
# Ownership only. Existing pinned contributions and extras remain unchanged.
LANE_G_R30G_REGISTRATIONS: dict[str, dict[str, object]] = {
    "tests/realface/release_inventory_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/release_gap_plan_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/release_prereg_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/release_workpack_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "scripts/check_release_workpack_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_inventory_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_gap_plan_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_prereg_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_workpack_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_operator_g.py": {"owner": "G", "feature_ids": [95, 100]},
}
LANE_G_MODULE_OWNERS.update(LANE_G_R30G_REGISTRATIONS)
# --- End Lane G r30g ---

# --- Lane G r31g: physical release-source membership and paired evidence ---
# These are test and audit modules; ownership never marks quality as passed.
LANE_G_R31G_REGISTRATIONS: dict[str, dict[str, object]] = {
    "tests/realface/release_membership_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/release_chain_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/release_paired_source_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "scripts/check_release_chain_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/release_chain_fixture_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_membership_r31g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_chain_r31g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_chain_cli_r31g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_paired_source_r31g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_source_scale_r31g.py": {"owner": "G", "feature_ids": [95, 100]},
}
LANE_G_MODULE_OWNERS.update(LANE_G_R31G_REGISTRATIONS)
# --- End Lane G r31g ---

# --- Lane G r32g: versioned Hair Studio and frozen-rerun acceptance ---
# Ownership adds test and audit modules only, not feature or quality PASS.
LANE_G_R32G_REGISTRATIONS: dict[str, dict[str, object]] = {
    "tests/realface/hair_gate_revision_g.py": {"owner": "G", "feature_ids": [14, 95, 100]},
    "tests/realface/hair_rerun_summary_g.py": {"owner": "G", "feature_ids": [14, 95, 100]},
    "tests/realface/monday_rerun_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/rerun_definition_overlay_g.py": {"owner": "G", "feature_ids": [14, 95, 100]},
    "tests/realface/check_monday_rerun_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/r32g_fixtures.py": {"owner": "G", "feature_ids": [14, 95, 100]},
    "tests/e2e/test_hair_studio_definition_r32g.py": {"owner": "G", "feature_ids": [14, 95]},
    "tests/e2e/test_monday_rerun_r32g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_definition_overlay_r32g.py": {"owner": "G", "feature_ids": [14, 95, 100]},
    "tests/e2e/test_monday_operator_r32g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_hair_rerun_summary_r32g.py": {"owner": "G", "feature_ids": [14, 95]},
}
LANE_G_MODULE_OWNERS.update(LANE_G_R32G_REGISTRATIONS)
# --- End Lane G r32g ---

# --- Lane G r32g: count-only rerun reference-group comparison ---
LANE_G_R32G_GROUP_OWNERS: dict[str, dict[str, object]] = {
    "tests/realface/monday_rerun_groups_g.py": {"owner": "G", "feature_ids": [14, 95, 100]},
    "tests/e2e/test_monday_groups_r32g.py": {"owner": "G", "feature_ids": [14, 95, 100]},
}
LANE_G_MODULE_OWNERS.update(LANE_G_R32G_GROUP_OWNERS)
# --- End Lane G r32g group comparison ---

# --- Lane G r33g: evaluation-only three-million corpus source and shard tooling ---
# Ownership is recorded without modifying pinned contribution and feature views.
LANE_G_R33G_MODULE_OWNERS: dict[str, dict[str, object]] = {
    "tests/e2e/corpus_fixtures_r33g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_corpus_catalogue_r33g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_corpus_eval_r33g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_corpus_gates_r33g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_corpus_operator_r33g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_corpus_scale_r33g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_corpus_schedule_r33g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_corpus_shards_r33g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/corpus_catalogue_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/corpus_eval_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/corpus_gates_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/corpus_operator_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/corpus_schedule_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/corpus_shards_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/pass_definitions_r33g/corpus_programme.json": {"owner": "G", "feature_ids": [95, 100]},
}
LANE_G_MODULE_OWNERS.update(LANE_G_R33G_MODULE_OWNERS)
# --- End Lane G r33g ---

# --- Lane G r34g: Monday rerun and sealed frozen release work queue ---
# Ownership only. Existing contributions and other lane registrations are unchanged.
LANE_G_R34G_MODULE_OWNERS: dict[str, dict[str, object]] = {
    "tests/realface/monday_gatepack_g.py": {"owner": "G", "feature_ids": [14, 95, 100]},
    "tests/realface/release_shard_seals_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/release_queue_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/release_batch_attestation_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "scripts/check_monday_gatepack_g.py": {"owner": "G", "feature_ids": [14, 95, 100]},
    "scripts/check_release_queue_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_monday_gatepack_r34g.py": {"owner": "G", "feature_ids": [14, 95, 100]},
    "tests/e2e/test_release_seals_r34g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_queue_r34g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_corpus_count_status_r34g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_operator_r34g.py": {"owner": "G", "feature_ids": [14, 95, 100]},
    "tests/e2e/test_release_batch_attestation_r34g.py": {
        "owner": "G", "feature_ids": [95, 100],
    },
}
LANE_G_MODULE_OWNERS.update(LANE_G_R34G_MODULE_OWNERS)
# --- End Lane G r34g ---

# --- Lane G r35g: sealed numerical receipts and portable evaluation replay ---
# Ownership only. Pinned contribution views and earlier registrations are unchanged.
LANE_G_R35G_MODULE_OWNERS: dict[str, dict[str, object]] = {
    "tests/realface/corpus_eval_seals_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/corpus_replay_guard_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/corpus_offline_audit_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/corpus_evidence_manifest_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/corpus_receipt_chain_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/corpus_receipt_operator_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_corpus_eval_seals_r35g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_corpus_replay_guard_r35g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_corpus_offline_audit_r35g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_corpus_evidence_manifest_r35g.py": {
        "owner": "G", "feature_ids": [95, 100],
    },
    "tests/e2e/test_corpus_receipt_chain_r35g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_corpus_receipt_operator_r35g.py": {
        "owner": "G", "feature_ids": [95, 100],
    },
}
LANE_G_MODULE_OWNERS.update(LANE_G_R35G_MODULE_OWNERS)
# --- End Lane G r35g ---

# --- Lane G r36g: ordered private member receipts and stage reconciliation ---
# This is ownership only. No new feature score or contribution view is changed.
LANE_G_R36G_MODULE_OWNERS: dict[str, dict[str, object]] = {
    "tests/realface/corpus_member_proofs_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/corpus_member_rollup_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/corpus_member_operator_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "scripts/check_corpus_members_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_corpus_member_proofs_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_corpus_member_rollup_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_corpus_member_regression_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_corpus_member_operator_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_corpus_member_recovery_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_corpus_member_scale_g.py": {"owner": "G", "feature_ids": [95, 100]},
}
LANE_G_MODULE_OWNERS.update(LANE_G_R36G_MODULE_OWNERS)
# --- End Lane G r36g ---

# --- Lane G r37g: Monday causes, delivery counts and authenticated release evidence ---
# Ownership only; published contribution and feature score views remain unchanged.
LANE_G_R37G_MODULE_OWNERS: dict[str, dict[str, object]] = {
    "tests/realface/monday_rerun_buckets_g.py": {"owner": "G", "feature_ids": [14, 95, 100]},
    "tests/realface/lane_delivery_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/release_checkpoint_receipts_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/corpus_public_guard_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/proof_wall_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "scripts/check_lane_deliveries_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_monday_buckets_r37g.py": {"owner": "G", "feature_ids": [14, 95, 100]},
    "tests/e2e/test_lane_delivery_r37g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_release_checkpoint_r37g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_corpus_public_guard_r37g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_proof_wall_r37g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_operator_hooks_r37g.py": {"owner": "G", "feature_ids": [14, 95, 100]},
}
LANE_G_MODULE_OWNERS.update(LANE_G_R37G_MODULE_OWNERS)
# --- End Lane G r37g ---

# --- Lane G r38g: mutation, property, visual, performance and ML measure evidence ---
# Report-only ownership. The contribution and existing feature-score views are unchanged.
LANE_G_R38G_MODULE_OWNERS: dict[str, dict[str, object]] = {
    "scripts/check_mutation_pilot_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "scripts/check_gate_metrics_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/slider_properties_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/ml_gate_metrics_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/perf_warnings_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/visual_pixels_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/eval_report_crosscheck_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "web/test/browser/visual-regression-g.py": {"owner": "G", "feature_ids": [95, 100]},
    "web/test/e2e/slider-properties-g.test.mjs": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_mutation_pilot_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_slider_properties_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_filter_recipe_properties_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_ml_gate_metrics_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_perf_warnings_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_visual_regression_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_gate_metrics_cli_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_eval_report_crosscheck_g.py": {"owner": "G", "feature_ids": [95, 100]},
}
LANE_G_MODULE_OWNERS.update(LANE_G_R38G_MODULE_OWNERS)
# --- End Lane G r38g ---

# --- Lane G r39g: five-way Monday manifests, gate report and QB checkpoints ---
# Ownership only. Pinned contributions and release thresholds are unchanged.
LANE_G_R39G_REGISTRATIONS: dict[str, dict[str, object]] = {
    "tests/realface/monday_fiveway_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/monday_fiveway_results_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/monday_gate_report_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/monday_worker_resume_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/monday_launch_contract_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/qb_checkpoint_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "scripts/check_monday_fiveway_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "scripts/check_qb_checkpoint_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_monday_fiveway_r39g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_monday_worker_resume_r39g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_monday_launch_contract_r39g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_qb_checkpoint_r39g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_monday_operators_r39g.py": {"owner": "G", "feature_ids": [95, 100]},
}
LANE_G_MODULE_OWNERS.update(LANE_G_R39G_REGISTRATIONS)
# --- End Lane G r39g ---

# --- Lane G r39g-cp2: reviewed identity, quality and test evidence ---
# Source contracts and report-only evidence; existing contributions are unchanged.
LANE_G_R39G_RESEARCH_MODULES: dict[str, dict[str, object]] = {
    "tests/realface/sface_identity_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/piq_battery_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/research_tools_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/realface/research_gate_bundle_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "scripts/check_research_adoptions_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "scripts/check_research_quality_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_sface_identity_r39g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_piq_battery_r39g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_research_tools_r39g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_research_adoption_cli_r39g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_research_gate_bundle_r39g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_research_quality_cli_r39g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/test_hypothesis_slider_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "tests/e2e/research_fixture_g.py": {"owner": "G", "feature_ids": [95, 100]},
    "web/test/e2e/fast-check-g.test.mjs": {"owner": "G", "feature_ids": [95, 100]},
}
LANE_G_MODULE_OWNERS.update(LANE_G_R39G_RESEARCH_MODULES)
# --- End Lane G r39g-cp2 ---

# --- Lane G r39g-cp3: recorded training opt-in and withdrawal enforcement ---
# Owner G. Launch evidence only; no shared feature score or contribution is changed.
LANE_G_TRAINING_CONSENT_MODULES: dict[str, dict[str, object]] = {
    "tests/realface/training_consent_ledger_g.py": {
        "owner": "G", "feature_ids": [95, 100],
    },
    "tests/realface/training_manifest_gate_g.py": {
        "owner": "G", "feature_ids": [95, 100],
    },
    "scripts/check_training_consent_g.py": {
        "owner": "G", "feature_ids": [95, 100],
    },
    "tests/e2e/test_training_consent_gate_g.py": {
        "owner": "G", "feature_ids": [95, 100],
    },
    "tests/e2e/test_training_consent_cli_g.py": {
        "owner": "G", "feature_ids": [95, 100],
    },
}
LANE_G_MODULE_OWNERS.update(LANE_G_TRAINING_CONSENT_MODULES)
# --- End Lane G r39g-cp3 ---
