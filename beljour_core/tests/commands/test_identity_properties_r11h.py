"""Metamorphic holdout and identity-score acceptance tests on invented values.

The fixed threshold never changes in response to frozen-set observations.
Author: John Khan.
"""

from __future__ import annotations

import json
from dataclasses import replace

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.identity_pairs import (
    IdentityPair,
    IdentityPolicy,
    RequiredSlice,
    evaluate_identity_pairs,
    identity_report_json,
)


DIMENSIONS = ("source", "tone", "gender", "yaw", "occlusion", "image_size")
SLICES = tuple(RequiredSlice(name, group)
               for name in DIMENSIONS for group in ("A", "B"))


def policy(threshold: float = 0.7) -> IdentityPolicy:
    return IdentityPolicy(
        name="synthetic_regression",
        manifest_sha256="0" * 64,
        model_sha256="1" * 64,
        preprocessing_sha256="2" * 64,
        definitions_sha256="3" * 64,
        baseline_sha256="4" * 64,
        threshold=threshold,
        minimum_genuine=20,
        minimum_impostor=20,
        minimum_genuine_per_slice=10,
        minimum_impostor_per_slice=10,
        max_false_accept_rate=0.25,
        min_true_accept_rate=0.6,
        max_true_accept_gap=0.2,
        required_slices=SLICES,
        independent_threshold_commit=True,
    )


def observations(per_group: int = 50) -> tuple[IdentityPair, ...]:
    result: list[IdentityPair] = []
    for group, offset in (("A", 0), ("B", 100_000)):
        for index in range(per_group):
            item = index + offset
            identity = f"subject_{item}"
            slices = tuple(RequiredSlice(dim, group) for dim in DIMENSIONS)
            for genuine in (True, False):
                suffix = "g" if genuine else "i"
                result.append(IdentityPair(
                    pair_id=f"p_{item}_{suffix}",
                    source_a=f"src_{item}_{suffix}_a",
                    source_b=f"src_{item}_{suffix}_b",
                    subject_a=identity,
                    subject_b=identity if genuine else f"other_{item}",
                    genuine=genuine,
                    cosine=(index % 20) / 19 if genuine else (index % 30) / 29,
                    slices=slices,
                    consent_and_rights_checked=True,
                    reference_labels_checked=True,
                ))
    return tuple(result)


def test_threshold_increases_never_raise_acceptance_count() -> None:
    source = observations()
    true_last = len(source)
    false_last = len(source)
    for tenth in range(11):
        result = evaluate_identity_pairs(source, policy(tenth / 10))
        assert result.all_pairs.true_accept.numerator <= true_last
        assert result.all_pairs.false_accept.numerator <= false_last
        true_last = result.all_pairs.true_accept.numerator
        false_last = result.all_pairs.false_accept.numerator


def test_score_threshold_boundary_is_inclusive() -> None:
    base = list(observations())
    left = next(i for i, row in enumerate(base) if row.genuine)
    right = next(i for i, row in enumerate(base) if not row.genuine)
    base[left] = replace(base[left], cosine=0.7)
    base[right] = replace(base[right], cosine=0.7)
    first = evaluate_identity_pairs(base, policy(0.7))
    base[left] = replace(base[left], cosine=0.699999999999)
    base[right] = replace(base[right], cosine=0.699999999999)
    second = evaluate_identity_pairs(base, policy(0.7))
    assert first.all_pairs.true_accept.numerator == second.all_pairs.true_accept.numerator + 1
    assert first.all_pairs.false_accept.numerator == second.all_pairs.false_accept.numerator + 1


def test_report_denominators_include_failures_and_negative_pairs() -> None:
    source = observations()
    audit = evaluate_identity_pairs(source, policy())
    assert audit.all_pairs.genuine == 100
    assert audit.all_pairs.impostor == 100
    assert audit.all_pairs.true_accept.denominator == 100
    assert audit.all_pairs.false_accept.denominator == 100
    assert all(row.metric.genuine == 50 for row in audit.slices)
    assert all(row.metric.impostor == 50 for row in audit.slices)


def test_group_comparison_order_does_not_change_diagnostic() -> None:
    source = observations()
    original = evaluate_identity_pairs(source, policy())
    reversed_rows = evaluate_identity_pairs(source[::-1], policy())
    rotate = evaluate_identity_pairs(source[31:] + source[:31], policy())
    assert identity_report_json(original) == identity_report_json(reversed_rows)
    assert identity_report_json(original) == identity_report_json(rotate)


def test_public_json_contains_slices_not_private_member_ids() -> None:
    source = observations()
    data = json.loads(identity_report_json(evaluate_identity_pairs(source, policy())))
    assert data["release_qualified"] is False
    assert data["independently_approved"] is False
    assert data["measured_on_external_faces"] is False
    assert len(data["slices"]) == 12
    dumped = json.dumps(data)
    for keyword in ("source_a", "source_b", "subject_a", "subject_b", "pair_id",
                    "p_100000", "src_100000", "other_100000", "cosine"):
        assert keyword not in dumped


def test_report_never_selects_a_better_threshold_on_frozen_data() -> None:
    source = observations()
    first = policy(0.1)
    second = policy(0.9)
    before = first.fingerprint()
    audit_one = evaluate_identity_pairs(source, first)
    audit_two = evaluate_identity_pairs(source, second)
    assert audit_one.policy_sha256 == before
    assert first.fingerprint() == before
    assert audit_two.policy_sha256 == second.fingerprint()
    assert audit_one.policy_sha256 != audit_two.policy_sha256


def test_genuine_group_failure_is_not_concealed_by_negative_improvement() -> None:
    source = list(observations())
    for index, row in enumerate(source):
        if row.genuine and row.slices[0].label == "B":
            source[index] = replace(row, cosine=-0.9)
        if not row.genuine and row.slices[0].label == "A":
            source[index] = replace(row, cosine=-0.99)
    result = evaluate_identity_pairs(source, policy())
    assert result.status == "blocked"
    assert "slice_true_accept_below_policy" in result.reasons
    assert "true_accept_group_disparity" in result.reasons


def test_incomplete_dimension_does_not_create_a_pass() -> None:
    source = list(observations())
    for index, row in enumerate(source):
        if row.slices[0].label == "B":
            source[index] = replace(row, slices=(RequiredSlice("source", "A"),))
    report = evaluate_identity_pairs(source, policy())
    assert report.status != "ready_for_independent_review"
    assert "frozen_slice_underpowered" in report.reasons


def test_frozen_and_calibration_reuse_of_subject_is_rejected() -> None:
    source = observations()
    frozen = source[0]
    calibration = replace(source[1], pair_id="cal_1", source_a="new_a",
                          source_b="new_b", split="calibration")
    assert calibration.subject_a == frozen.subject_a
    assert calibration.source_a != frozen.source_a
    with pytest.raises(CommandValidationError, match="subject"):
        evaluate_identity_pairs([frozen, calibration], policy())


def test_calibration_only_does_not_count_as_frozen_evidence() -> None:
    source = [replace(row, split="calibration") for row in observations()]
    result = evaluate_identity_pairs(source, policy())
    assert result.status == "unproven"
    assert result.all_pairs.genuine == 0
    assert result.all_pairs.impostor == 0
    assert "frozen_comparison_set_empty" in result.reasons


def test_pair_ids_remain_unique_even_when_photo_ids_differ() -> None:
    base = list(observations())
    duplicate = replace(base[1], pair_id=base[0].pair_id)
    base[1] = duplicate
    with pytest.raises(CommandValidationError, match="Duplicate"):
        evaluate_identity_pairs(base, policy())


def test_same_underlying_photo_reused_as_new_pair_is_rejected() -> None:
    base = list(observations())
    clone = replace(base[0], pair_id="fresh_pair", source_a=base[0].source_b,
                    source_b=base[0].source_a)
    with pytest.raises(CommandValidationError, match="Duplicate"):
        evaluate_identity_pairs((*base, clone), policy())


def test_external_source_flag_without_release_is_still_unproven_or_blocked() -> None:
    result = evaluate_identity_pairs(observations(), policy(),
                                     measured_on_external_faces=True)
    assert result.release_qualified is False
    assert result.independently_approved is False
    assert result.status != "ready_for_independent_review" or not result.release_qualified


def test_every_annotated_group_is_reported_even_without_evidence() -> None:
    data = tuple(row for row in observations() if row.slices[0].label == "A")
    result = evaluate_identity_pairs(data, policy())
    assert {(s.dimension, s.label) for s in result.slices} == {
        (tag.dimension, tag.label) for tag in policy().required_slices
    }
    assert all(not s.sufficiently_sampled for s in result.slices if s.label == "B")


def test_policy_is_stable_under_preregistered_group_reordering() -> None:
    original = policy()
    changed = replace(original, required_slices=tuple(reversed(original.required_slices)))
    assert original.fingerprint() == changed.fingerprint()


def test_empty_observation_still_produces_a_nonrelease_report() -> None:
    audit = evaluate_identity_pairs((), policy())
    assert audit.status == "unproven"
    assert audit.release_qualified is False
    assert all(row.metric.true_accept.measured is None for row in audit.slices)
