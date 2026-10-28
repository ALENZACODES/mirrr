"""Exact matched-pair identity regression across proposed engine versions.

No photographs, live identities, feature embeddings or model files are used.
Author: John Khan.
"""

from __future__ import annotations

import json
from dataclasses import replace

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.identity_pair_regression import compare_identity_pairs
from plumb_api.commands.identity_pairs import IdentityPair, IdentityPolicy, RequiredSlice


DIMENSIONS = ("source", "tone", "gender", "yaw", "occlusion", "image_size")
A = tuple(RequiredSlice(item, "A") for item in DIMENSIONS)
B = tuple(RequiredSlice(item, "B") for item in DIMENSIONS)
BASE_MODEL = "a" * 64
NEW_MODEL = "b" * 64


def frozen_policy(**overrides: object) -> IdentityPolicy:
    policy = IdentityPolicy(
        name="regression_demo",
        manifest_sha256="c" * 64,
        model_sha256=BASE_MODEL,
        preprocessing_sha256="d" * 64,
        definitions_sha256="e" * 64,
        baseline_sha256="f" * 64,
        threshold=0.6,
        minimum_genuine=20,
        minimum_impostor=20,
        minimum_genuine_per_slice=10,
        minimum_impostor_per_slice=10,
        max_false_accept_rate=0.1,
        min_true_accept_rate=0.9,
        max_true_accept_gap=0.02,
        required_slices=A + B,
        independent_threshold_commit=True,
    )
    return replace(policy, **overrides)


def generated_pairs(per_group: int = 20) -> tuple[IdentityPair, ...]:
    output: list[IdentityPair] = []
    for group, tags in (("A", A), ("B", B)):
        for number in range(per_group):
            for genuine in (True, False):
                kind = "g" if genuine else "i"
                key = f"{group}_{number}_{kind}"
                output.append(IdentityPair(
                    pair_id=f"pair_{key}",
                    source_a=f"source_{key}_a",
                    source_b=f"source_{key}_b",
                    subject_a=f"subject_{group}_{number}",
                    subject_b=(f"subject_{group}_{number}" if genuine
                               else f"other_{group}_{number}"),
                    genuine=genuine,
                    cosine=0.9 if genuine else 0.1,
                    slices=tags,
                    consent_and_rights_checked=True,
                    reference_labels_checked=True,
                ))
    return tuple(output)


def evaluate(
    baseline: tuple[IdentityPair, ...], candidate: tuple[IdentityPair, ...],
    policy: IdentityPolicy | None = None, external: bool = True,
) -> object:
    return compare_identity_pairs(
        baseline, candidate, frozen_policy() if policy is None else policy,
        baseline_model_sha256=BASE_MODEL,
        candidate_model_sha256=NEW_MODEL,
        externally_labelled=external,
    )


def updated(
    rows: tuple[IdentityPair, ...], index: int, **modifications: object,
) -> tuple[IdentityPair, ...]:
    clone = list(rows)
    clone[index] = replace(clone[index], **modifications)
    return tuple(clone)


def test_clean_matched_pairs_are_for_independent_review_only() -> None:
    baseline = generated_pairs()
    result = evaluate(baseline, baseline)
    assert result.status == "ready_for_independent_review"
    assert result.reasons == ()
    assert result.overall.compared == 80
    assert result.overall.unchanged_correct == 80
    assert result.overall.unchanged_wrong == 0
    assert result.overall.genuine_losses == 0
    assert result.overall.impostor_new_accepts == 0
    assert len(result.slices) == 12
    assert not result.release_qualified


def test_genuine_loss_blocks_instead_of_allowing_aggregate_tie() -> None:
    before = generated_pairs()
    after = updated(before, 0, cosine=0.01)
    report = evaluate(before, after)
    assert report.status == "blocked"
    assert report.overall.genuine_losses == 1
    assert report.overall.genuine_gains == 0
    assert "identity_regression_detected" in report.reasons
    assert sum(row.counts.genuine_losses for row in report.slices) == 6


def test_impostor_new_acceptance_blocks() -> None:
    before = generated_pairs()
    after = updated(before, 1, cosine=0.99)
    report = evaluate(before, after)
    assert report.status == "blocked"
    assert report.overall.impostor_new_accepts == 1
    assert report.overall.genuine_losses == 0


def test_fixes_and_gains_are_distinct_not_regressions() -> None:
    before = list(generated_pairs())
    before[0] = replace(before[0], cosine=0.1)
    before[1] = replace(before[1], cosine=0.9)
    baseline = tuple(before)
    after = list(baseline)
    after[0] = replace(after[0], cosine=0.95)
    after[1] = replace(after[1], cosine=0.01)
    result = evaluate(baseline, tuple(after))
    assert result.status == "ready_for_independent_review"
    assert result.overall.genuine_gains == 1
    assert result.overall.impostor_fixes == 1
    assert result.overall.genuine_losses == 0
    assert result.overall.impostor_new_accepts == 0


def test_aggregate_improvement_cannot_hide_fresh_loss() -> None:
    before = list(generated_pairs())
    before[2] = replace(before[2], cosine=0.05)
    baseline = tuple(before)
    after = list(baseline)
    after[2] = replace(after[2], cosine=0.99)
    after[4] = replace(after[4], cosine=0.01)
    report = evaluate(baseline, tuple(after))
    assert report.overall.genuine_gains == 1
    assert report.overall.genuine_losses == 1
    assert report.status == "blocked"


def test_missing_group_coverage_never_counts_as_complete() -> None:
    baseline = tuple(item for item in generated_pairs() if item.slices == A)
    result = evaluate(baseline, baseline)
    assert result.status == "unproven"
    assert "comparison_slice_underpowered" in result.reasons
    assert sum(item.sufficiently_sampled for item in result.slices) == 6


def test_report_is_photo_free_and_source_order_independent() -> None:
    baseline = generated_pairs()
    first = evaluate(baseline, baseline)
    second = evaluate(baseline[::-1], baseline[::-1])
    assert first.public_metadata() == second.public_metadata()
    public = json.dumps(first.public_metadata(), sort_keys=True)
    assert "subject_A_1" not in public
    assert "source_A_1" not in public
    assert "pair_A_1" not in public
    assert "cosine" not in public
    assert '"release_qualified": false' in public


def test_unconfirmed_reference_labels_keep_unproven() -> None:
    baseline = generated_pairs()
    result = evaluate(baseline, baseline, external=False)
    assert result.status == "unproven"
    assert "independent_pair_labels_not_confirmed" in result.reasons


def test_nonpreregistered_threshold_never_counts_as_technical_ready() -> None:
    baseline = generated_pairs()
    result = evaluate(baseline, baseline,
                      frozen_policy(independent_threshold_commit=False))
    assert result.status == "unproven"
    assert "threshold_not_independently_preregistered" in result.reasons


@pytest.mark.parametrize("revision", [
    {"subject_a": "changed_subject", "subject_b": "changed_subject"},
    {"slices": B},
    {"consent_and_rights_checked": False},
    {"reference_labels_checked": False},
    {"split": "calibration"},
    {"source_a": "different_image"},
    {"source_b": "different_image"},
])
def test_pair_evidence_cannot_change_between_revisions(revision: dict[str, object]) -> None:
    baseline = generated_pairs()
    after = updated(baseline, 0, **revision)
    with pytest.raises(CommandValidationError):
        evaluate(baseline, after)


def test_missing_and_added_pairs_fail_before_scoring() -> None:
    baseline = generated_pairs()
    for candidate in (baseline[:-1], (*baseline, replace(baseline[-1], pair_id="extra"))):
        with pytest.raises(CommandValidationError):
            evaluate(baseline, candidate)


def test_duplicate_pair_ids_and_photo_pairs_fail() -> None:
    baseline = generated_pairs()
    duplicate_id = replace(baseline[1], pair_id=baseline[0].pair_id)
    duplicate_sources = replace(baseline[1], source_a=baseline[0].source_b,
                                source_b=baseline[0].source_a)
    for wrong in (duplicate_id, duplicate_sources):
        with pytest.raises(CommandValidationError):
            evaluate(baseline, updated(baseline, 1,
                                       pair_id=wrong.pair_id,
                                       source_a=wrong.source_a,
                                       source_b=wrong.source_b))


@pytest.mark.parametrize("digest", ["x", "G" * 64, "", "a" * 63])
def test_invalid_model_digest_rejected(digest: str) -> None:
    baseline = generated_pairs()
    with pytest.raises(CommandValidationError):
        compare_identity_pairs(baseline, baseline, frozen_policy(),
                               baseline_model_sha256=digest,
                               candidate_model_sha256=NEW_MODEL)


def test_invalid_external_flag_rejected() -> None:
    baseline = generated_pairs()
    with pytest.raises(CommandValidationError):
        compare_identity_pairs(baseline, baseline, frozen_policy(),
                               baseline_model_sha256=BASE_MODEL,
                               candidate_model_sha256=NEW_MODEL,
                               externally_labelled=1)


def test_empty_evidence_refused() -> None:
    with pytest.raises(CommandValidationError):
        evaluate((), ())


def test_regression_result_has_no_false_release_authority() -> None:
    baseline = generated_pairs()
    report = evaluate(baseline, baseline)
    result = report.public_metadata()
    assert result["release_qualified"] is False
    assert result["version"] == "beljour-identity-pair-regression/1"
    assert result["policy_sha256"] == frozen_policy().fingerprint()
    assert result["baseline_model_sha256"] == BASE_MODEL
    assert result["candidate_model_sha256"] == NEW_MODEL
