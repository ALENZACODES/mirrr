"""Lane S file ownership ledger and independent additive-content check.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class LaneFile:
    """An explicit, owned file and its nonredundant role."""

    path: str
    owner: str
    purpose: str


LANE_FILES: tuple[LaneFile, ...] = (
    LaneFile("lab/synth_diversity/__init__.py", "S", "Public synthetic-only API"),
    LaneFile("lab/synth_diversity/__main__.py", "S", "Offline CLI"),
    LaneFile("lab/synth_diversity/calibration.py", "S", "Optical gamut diagnostics"),
    LaneFile("lab/synth_diversity/cases.py", "S", "Stable regression identifiers"),
    LaneFile("lab/synth_diversity/compose.py", "S", "Fixed-order composition"),
    LaneFile("lab/synth_diversity/writer.py", "S", "Safe PNG/JSONL serialization"),
    LaneFile("lab/synth_diversity/types.py", "S", "Face, tag and array contracts"),
    LaneFile("lab/synth_diversity/geometry.py", "S", "Seeded masks and shape primitives"),
    LaneFile("lab/synth_diversity/lighting.py", "S", "Controlled synthetic lighting"),
    LaneFile("lab/synth_diversity/mask_checks.py", "S", "Landmark and occlusion diagnostics"),
    LaneFile("lab/synth_diversity/morphology.py", "S", "Deterministic pose variation"),
    LaneFile("lab/synth_diversity/shards.py", "S", "Verified resumable shard exports"),
    LaneFile("lab/synth_diversity/strata.py", "S", "Declared rare trait-pair cases"),
    LaneFile("lab/synth_diversity/trait_evidence.py", "S", "Numeric trait changes and sites"),
    LaneFile("lab/synth_diversity/visible_vitiligo.py", "S", "Occlusion-aware test patches"),
    LaneFile("lab/synth_diversity/optics.py", "S", "Optical densities and CIE metrics"),
    LaneFile("lab/synth_diversity/plan.py", "S", "Balanced seeded quota planning"),
    LaneFile("lab/synth_diversity/skin_tone.py", "S", "Fitzpatrick testing targets"),
    LaneFile("lab/synth_diversity/vitiligo.py", "S", "Depigmentation and coverage"),
    LaneFile("lab/synth_diversity/pigment.py", "S", "Melanin and blood pigment marks"),
    LaneFile("lab/synth_diversity/skin_marks.py", "S", "Scars, acne and rosacea"),
    LaneFile("lab/synth_diversity/age.py", "S", "Monotonic age testing cues"),
    LaneFile("lab/synth_diversity/overlays.py", "S", "Drapery, beard and eyewear"),
    LaneFile("lab/synth_diversity/fixtures.py", "S", "Original drawn test base"),
    LaneFile("api/tests/synth_diversity/test_synthdiv_plan.py", "S", "Quota tests"),
    LaneFile("api/tests/synth_diversity/test_synthdiv_api.py", "S", "Public API tests"),
    LaneFile("api/tests/synth_diversity/test_synthdiv_calibration.py", "S", "Gamut tests"),
    LaneFile("api/tests/synth_diversity/test_synthdiv_cases.py", "S", "Case routing tests"),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_cross_coverage.py",
        "S",
        "Rare composition tests",
    ),
    LaneFile("api/tests/synth_diversity/test_synthdiv_lighting.py", "S", "Light tests"),
    LaneFile("api/tests/synth_diversity/test_synthdiv_masks.py", "S", "Occlusion tests"),
    LaneFile("api/tests/synth_diversity/test_synthdiv_morphology.py", "S", "Pose tests"),
    LaneFile("api/tests/synth_diversity/test_synthdiv_shards.py", "S", "Resumable shard tests"),
    LaneFile("api/tests/synth_diversity/test_synthdiv_shard_integrity.py", "S", "Job lock tests"),
    LaneFile("api/tests/synth_diversity/test_synthdiv_strata.py", "S", "Rare interaction tests"),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_trait_evidence.py",
        "S",
        "Regional delta tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_visible_vitiligo.py",
        "S",
        "Visible patch tests",
    ),
    LaneFile("api/tests/synth_diversity/test_synthdiv_tone.py", "S", "Density and ITA tests"),
    LaneFile("api/tests/synth_diversity/test_synthdiv_vitiligo.py", "S", "Patch tests"),
    LaneFile("api/tests/synth_diversity/test_synthdiv_registry.py", "S", "Ownership self-test"),
    LaneFile("api/tests/synth_diversity/test_synthdiv_pigment.py", "S", "Pigment tests"),
    LaneFile("api/tests/synth_diversity/test_synthdiv_marks.py", "S", "Skin marks tests"),
    LaneFile("api/tests/synth_diversity/test_synthdiv_compose.py", "S", "Composition tests"),
    LaneFile("api/tests/synth_diversity/test_synthdiv_writer.py", "S", "Exporter tests"),
    LaneFile("api/tests/synth_diversity/test_synthdiv_cli.py", "S", "CLI tests"),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_overlays_age.py", "S", "Covering and age tests"
    ),
    LaneFile(
        "lab/synth_diversity/stress_coverage.py",
        "S",
        "Count-only declared slice diagnostics",
    ),
    LaneFile(
        "lab/synth_diversity/stress_manifest.py",
        "S",
        "Offline manifest, integrity and validation",
    ),
    LaneFile("lab/synth_diversity/stress_profiles.py", "S", "Rare trait anchor definitions"),
    LaneFile("lab/synth_diversity/stress_render.py", "S", "In-memory synthetic plan renderer"),
    LaneFile("lab/synth_diversity/stress_schedule.py", "S", "Seeded adult anchor schedule"),
    LaneFile("lab/synth_diversity/stress_slices.py", "S", "Opaque Lane G name bridge"),
    LaneFile("lab/synth_diversity/stress_spec.py", "S", "Age, trait and case contracts"),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stress_coverage.py",
        "S",
        "Stress coverage tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stress_manifest.py",
        "S",
        "Stress manifest tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stress_profiles.py",
        "S",
        "Stress profiles tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stress_render.py",
        "S",
        "Stress render tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stress_schedule.py",
        "S",
        "Stress schedule tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stress_slices.py",
        "S",
        "Stress slices tests",
    ),
    LaneFile("api/tests/synth_diversity/test_synthdiv_stress_spec.py", "S", "Stress spec tests"),
    LaneFile("lab/synth_diversity/stress_audit.py", "S", "Declared pair coverage audit"),
    LaneFile("lab/synth_diversity/stress_cli.py", "S", "Metadata stress CLI"),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stress_audit.py",
        "S",
        "Pair input audit tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stress_cli.py",
        "S",
        "Offline stress CLI tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stress_end_to_end.py",
        "S",
        "Manifest to render audit tests",
    ),
    LaneFile("lab/synth_diversity/stress_evidence.py", "S", "Measured check record transport"),
    LaneFile("lab/synth_diversity/stress_evidence_cli.py", "S", "Offline evidence CLI"),
    LaneFile("lab/synth_diversity/stress_partition.py", "S", "Seeded shard metadata plan"),
    LaneFile("lab/synth_diversity/stress_statistics.py", "S", "Wilson slice outcome counts"),
    LaneFile("lab/synth_diversity/stress_triage.py", "S", "Count-only failure fix notes"),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_evidence_transport.py",
        "S",
        "Evidence transport and integrity tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_evidence_statistics.py",
        "S",
        "Wilson and slice evidence tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_evidence_triage.py",
        "S",
        "Deterministic fix-note tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_evidence_partition.py",
        "S",
        "Resumable metadata partition tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_evidence_cli.py",
        "S",
        "Evidence CLI failure-path tests",
    ),
    LaneFile("lab/synth_diversity/stress_merge.py", "S", "Verified evidence shard merge"),
    LaneFile("lab/synth_diversity/stress_gate.py", "S", "Fail-closed synthetic slice gate"),
    LaneFile("lab/synth_diversity/stress_compare.py", "S", "Paired slice regression checks"),
    LaneFile("lab/synth_diversity/stress_release_cli.py", "S", "Offline evidence release CLI"),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_release_merge.py",
        "S",
        "Shard integrity and merge tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_release_gate.py",
        "S",
        "Per-slice fail-closed gate tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_release_compare.py",
        "S",
        "Paired regression tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_release_cli.py",
        "S",
        "Offline release CLI tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_release_workflow.py",
        "S",
        "End-to-end metadata stress workflow",
    ),
    LaneFile("lab/synth_diversity/stress_near_duplicate.py", "S", "Four-bit protected hash index"),
    LaneFile("lab/synth_diversity/stress_variations.py", "S", "Local camera variation plans"),
    LaneFile("lab/synth_diversity/stress_similarity_gate.py", "S", "Input uniqueness gate"),
    LaneFile("lab/synth_diversity/stress_extra_cases.py", "S", "Additional rare combinations"),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_near_duplicate.py",
        "S",
        "Hash boundary and index tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_camera_variations.py",
        "S",
        "Camera variant determinism tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_similarity_gate.py",
        "S",
        "Synthetic uniqueness gate tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_extra_cases.py",
        "S",
        "Extra rare-intersection tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_similarity_properties.py",
        "S",
        "Four-bit index property tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_variation_contracts.py",
        "S",
        "Synthetic variation contract tests",
    ),
    LaneFile(
        'api/tests/synth_diversity/test_synthdiv_provenance_clearance.py', "S",
        'Rights and approval boundary tests',
    ),
    LaneFile(
        'api/tests/synth_diversity/test_synthdiv_provenance_cli.py', "S",
        'Offline verification CLI tests',
    ),
    LaneFile(
        'api/tests/synth_diversity/test_synthdiv_provenance_contract.py', "S",
        'Record schema validation tests',
    ),
    LaneFile(
        'api/tests/synth_diversity/test_synthdiv_provenance_counts.py', "S",
        'Observed corpus class counting tests',
    ),
    LaneFile(
        'api/tests/synth_diversity/test_synthdiv_provenance_ledger.py', "S",
        'Pool-separated IO contract tests',
    ),
    LaneFile(
        'api/tests/synth_diversity/test_synthdiv_provenance_lineage.py', "S",
        'Closed provenance lineage tests',
    ),
    LaneFile(
        'api/tests/synth_diversity/test_synthdiv_provenance_overlap.py', "S",
        'Cross-pool four-bit matching tests',
    ),
    LaneFile(
        'api/tests/synth_diversity/test_synthdiv_provenance_tamper.py', "S",
        'Corrupt metadata and symlink tests',
    ),
    LaneFile(
        'api/tests/synth_diversity/test_synthdiv_provenance_training.py', "S",
        'Fail-closed training allowlist tests',
    ),
    LaneFile("lab/synth_diversity/stress_provenance.py", "S", "Typed pool and rights contracts"),
    LaneFile("lab/synth_diversity/stress_provenance_cli.py", "S", "Read-only provenance CLI"),
    LaneFile(
        'lab/synth_diversity/stress_provenance_counts.py', "S",
        'Count and global uniqueness audit',
    ),
    LaneFile(
        'lab/synth_diversity/stress_provenance_fixtures.py', "S",
        'Fictional metadata test fixtures',
    ),
    LaneFile(
        'lab/synth_diversity/stress_provenance_ledger.py', "S",
        'Pool-isolated metadata shards',
    ),
    LaneFile(
        'lab/synth_diversity/stress_provenance_overlap.py', "S",
        'Four-bit cross-pool exclusion',
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_provenance_checkpoint.py",
        "S",
        "Atomic checkpoint recovery tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_provenance_checkpoint_tamper.py",
        "S",
        "Checkpoint integrity failure tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_provenance_partition.py",
        "S",
        "Job partition boundary tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_provenance_partition_properties.py",
        "S",
        "Partition determinism properties",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_provenance_resume.py",
        "S",
        "Resume count and ordering tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_provenance_resume_tamper.py",
        "S",
        "Stale resume proof tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_provenance_roster.py",
        "S",
        "Verified shard roster checks",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_provenance_slice_failures.py",
        "S",
        "Missing slices fail closed tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_provenance_slice_survival.py",
        "S",
        "Protected slice retention tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_provenance_trait_matrix.py",
        "S",
        "Reachable diverse adult traits",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_provenance_workflow.py",
        "S",
        "Corpus provenance workflow tests",
    ),
    LaneFile(
        "lab/synth_diversity/stress_provenance_checkpoint.py",
        "S",
        "Atomic metadata resume checkpoint",
    ),
    LaneFile(
        "lab/synth_diversity/stress_provenance_resume.py",
        "S",
        "Seeded count-only corpus job planner",
    ),
    LaneFile(
        "lab/synth_diversity/stress_provenance_resume_fixtures.py",
        "S",
        "Fictional seeded partition fixtures",
    ),
    LaneFile(
        "lab/synth_diversity/stress_provenance_roster.py",
        "S",
        "Frozen provenance shard roster",
    ),
    LaneFile(
        "lab/synth_diversity/stress_provenance_slices.py",
        "S",
        "Protected slice retention counts",
    ),
    LaneFile(
        "lab/synth_diversity/stress_provenance_receipts.py",
        "S",
        "Domain-separated expiring HMAC witness envelopes",
    ),
    LaneFile(
        "lab/synth_diversity/stress_provenance_witness.py",
        "S",
        "Whole-inventory render rights and scan proof",
    ),
    LaneFile(
        "lab/synth_diversity/stress_provenance_witness_fixtures.py",
        "S",
        "Fictional receipt and pool fixtures",
    ),
    LaneFile(
        "lab/synth_diversity/stress_provenance_admission.py",
        "S",
        "Fail-closed synthetic identifier admission",
    ),
    LaneFile(
        "lab/synth_diversity/stress_provenance_witness_io.py",
        "S",
        "Atomic metadata-only witness transport",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_witness_receipt_rules.py",
        "S",
        "Witness roles, time and signatures",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_witness_receipt_schema.py",
        "S",
        "Exact signed envelope schema",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_witness_claim_binding.py",
        "S",
        "Per-source and scan checksum bindings",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_witness_population.py",
        "S",
        "Complete corpus witness coverage",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_witness_inventory_schema.py",
        "S",
        "Witness roster schema checks",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_admission_global_lineage.py",
        "S",
        "Global lineage and identity closure",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_admission_gate.py",
        "S",
        "Provenance admission decisions",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_admission_integrity.py",
        "S",
        "Stale and changed admission inputs",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_admission_verified_shards.py",
        "S",
        "Actual shard verification regression",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_witness_io.py",
        "S",
        "Witness and admission file round-trip",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_witness_io_hardening.py",
        "S",
        "Interrupted and invalid metadata IO",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_admission_contract.py",
        "S",
        "Admitted identity and count invariants",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_admission_properties.py",
        "S",
        "Variable-size synthetic corpus properties",
    ),
    LaneFile(
        "lab/synth_diversity/stress_provenance_stream_contract.py",
        "S",
        "Streaming witness schema and canonical validation",
    ),
    LaneFile(
        "lab/synth_diversity/stress_provenance_stream_io.py",
        "S",
        "Bounded witnessed metadata stream IO",
    ),
    LaneFile(
        "lab/synth_diversity/stress_provenance_stream_fixtures.py",
        "S",
        "Reproducible provenance stream fixtures",
    ),
    LaneFile(
        "lab/synth_diversity/stress_provenance_stream_verify.py",
        "S",
        "Disk-backed corpus admission verification",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stream_admission.py",
        "S",
        "Witness stream admission regressions",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stream_contract.py",
        "S",
        "Witness stream contract regressions",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stream_dimensions.py",
        "S",
        "Witness stream dimensions regressions",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stream_index.py",
        "S",
        "Witness stream index regressions",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stream_integrity.py",
        "S",
        "Witness stream integrity regressions",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stream_limits.py",
        "S",
        "Witness stream limits regressions",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stream_output.py",
        "S",
        "Witness stream output regressions",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stream_overlap.py",
        "S",
        "Witness stream overlap regressions",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stream_permissions.py",
        "S",
        "Witness stream permissions regressions",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stream_properties.py",
        "S",
        "Witness stream properties regressions",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stream_reader.py",
        "S",
        "Witness stream reader regressions",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stream_recovery.py",
        "S",
        "Witness stream recovery regressions",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stream_security.py",
        "S",
        "Witness stream security regressions",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_stream_writer.py",
        "S",
        "Witness stream writer regressions",
    ),
    LaneFile(
        "lab/synth_diversity/stress_provenance_revocation.py",
        "S",
        "Signed rights revocation epoch contract",
    ),
    LaneFile(
        "lab/synth_diversity/stress_provenance_revocation_release.py",
        "S",
        "Revocation-filtered ID export gate",
    ),
    LaneFile(
        "lab/synth_diversity/stress_provenance_cursor_plan.py",
        "S",
        "Exact deterministic witness cursor ranges",
    ),
    LaneFile(
        "lab/synth_diversity/stress_provenance_cursor_journal.py",
        "S",
        "Crash-detecting append-only cursor progress",
    ),
    LaneFile(
        "lab/synth_diversity/stress_provenance_replay_fixtures.py",
        "S",
        "Fictional rights and cursor test wiring",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_revocation_contract.py",
        "S",
        "revocation contract regression checks",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_revocation_epoch.py",
        "S",
        "revocation epoch regression checks",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_revocation_permissions.py",
        "S",
        "revocation permissions regression checks",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_revocation_properties.py",
        "S",
        "revocation properties regression checks",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_revocation_release.py",
        "S",
        "revocation release regression checks",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_revocation_signature.py",
        "S",
        "revocation signature regression checks",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_revocation_tamper.py",
        "S",
        "revocation tamper regression checks",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_cursor_concurrency.py",
        "S",
        "cursor concurrency regression checks",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_cursor_integrity.py",
        "S",
        "cursor integrity regression checks",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_cursor_journal.py",
        "S",
        "cursor journal regression checks",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_cursor_permissions.py",
        "S",
        "cursor permissions regression checks",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_cursor_plan.py",
        "S",
        "cursor plan regression checks",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_cursor_properties.py",
        "S",
        "cursor properties regression checks",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_cursor_recovery.py",
        "S",
        "cursor recovery regression checks",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_cursor_tamper.py",
        "S",
        "cursor tamper regression checks",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_replay_workflow.py",
        "S",
        "replay workflow regression checks",
    ),
    LaneFile(
        "lab/synth_diversity/stress_provenance_release_gate.py",
        "S",
        "Fresh source and revocation composite gate",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_current_release_gate.py",
        "S",
        "Fresh release gate regression checks",
    ),
    LaneFile(
        "lab/synth_diversity/stress_pool_guard.py", "S",
        "Enforced provenance pool access and test markers",
    ),
    LaneFile(
        "lab/synth_diversity/stress_gap_matrix.py", "S",
        "Deterministic absent rare-trait intersection cells",
    ),
    LaneFile(
        "lab/synth_diversity/stress_collision_audit.py", "S",
        "Independent 4-bit similarity collision oracle",
    ),
    LaneFile(
        "lab/synth_diversity/stress_camera_seed_registry.py", "S",
        "Stable camera and view seed binding",
    ),
    LaneFile(
        "lab/synth_diversity/stress_pose_pack.py", "S",
        "Synthetic-only group crop and profile challenges",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_pool_guard.py", "S",
        "Runtime training prohibition and pool fence tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_gap_matrix.py", "S",
        "Coverage matrix and deterministic gap reporting tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_collision_audit.py", "S",
        "Four-bit oracle and cross-pool collision tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_camera_seed_registry.py", "S",
        "Seed replay and binding tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_pose_pack.py", "S",
        "Group crop and profile stress tests",
    ),
    LaneFile(
        "lab/synth_diversity/stress_mesh_budget.py", "S",
        "Exact 1000-face group crop profile scenario schedule",
    ),
    LaneFile(
        "lab/synth_diversity/stress_mesh_oracle.py", "S",
        "One-to-one clipped IoU and synthetic mesh outcome oracle",
    ),
    LaneFile(
        "lab/synth_diversity/stress_mesh_exchange.py", "S",
        "Tamper-evident local metadata exchange for mesh reruns",
    ),
    LaneFile(
        "lab/synth_diversity/stress_mesh_report.py", "S",
        "Fail-closed per-scenario and trait mesh gap reporting",
    ),
    LaneFile(
        "lab/synth_diversity/stress_mesh_cli.py", "S",
        "Standalone offline local mesh replay commands",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_mesh_budget.py", "S",
        "Frozen face budget and shard consistency tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_mesh_oracle.py", "S",
        "Face matching, yaw and mesh detection failure tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_mesh_exchange.py", "S",
        "Scene/observation checksum and provenance boundary tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_mesh_report.py", "S",
        "1000-face synthetic error and fairness-slice gate tests",
    ),
    LaneFile(
        "api/tests/synth_diversity/test_synthdiv_mesh_cli.py", "S",
        "Offline plan verify and audit command tests",
    ),
    LaneFile("api/plumb_api/arena/lane_registry/s.py", "S", "Ownership ledger"),
)


def check_registry(root: Path | None = None) -> list[str]:
    """Return integration-readiness errors without changing any shared registry."""
    root = root or Path(__file__).resolve().parents[4]
    errors: list[str] = []
    expected: set[str] = set()
    for entry in LANE_FILES:
        if entry.path in expected:
            errors.append(f"duplicate lane path: {entry.path}")
        expected.add(entry.path)
        if entry.owner != "S" or not entry.purpose.strip():
            errors.append(f"bad owner/purpose: {entry.path}")
        allowed = (
            "lab/synth_diversity/",
            "api/tests/synth_diversity/",
            "api/plumb_api/arena/lane_registry/s.py",
        )
        if not entry.path.startswith(allowed):
            errors.append(f"out-of-scope owner path: {entry.path}")
        if not (root / entry.path).is_file():
            errors.append(f"registered file missing: {entry.path}")
    actual = {
        path.relative_to(root).as_posix()
        for folder in (
            root / "lab/synth_diversity",
            root / "api/tests/synth_diversity",
        )
        for path in folder.glob("*.py")
    }
    actual.add("api/plumb_api/arena/lane_registry/s.py")
    for path in sorted(actual - expected):
        errors.append(f"unregistered Lane S file: {path}")
    for path in sorted(expected - actual):
        errors.append(f"declared Lane S file not discovered: {path}")
    return errors
