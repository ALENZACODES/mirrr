"""Private identity-pair metrics, holdout isolation and fail-closed reports.

Every pair in this suite is a generated numeric observation, not a face.
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
    reject_subject_overlap,
    wilson_interval,
)


DIGEST = "a" * 64
DIMENSIONS = ("source", "tone", "gender", "yaw", "occlusion", "image_size")
SLICES_A = tuple(RequiredSlice(dimension, "A") for dimension in DIMENSIONS)
SLICES_B = tuple(RequiredSlice(dimension, "B") for dimension in DIMENSIONS)
ALL_SLICES = SLICES_A + SLICES_B


def policy(**replacements: object) -> IdentityPolicy:
    fields: dict[str, object] = {
        "name": "synthetic_policy_v1",
        "manifest_sha256": DIGEST,
        "model_sha256": "b" * 64,
        "preprocessing_sha256": "c" * 64,
        "definitions_sha256": "d" * 64,
        "baseline_sha256": "e" * 64,
        "threshold": 0.70,
        "minimum_genuine": 40,
        "minimum_impostor": 40,
        "minimum_genuine_per_slice": 20,
        "minimum_impostor_per_slice": 20,
        "max_false_accept_rate": 0.20,
        "min_true_accept_rate": 0.80,
        "max_true_accept_gap": 0.05,
        "required_slices": ALL_SLICES,
        "independent_threshold_commit": True,
    }
    fields.update(replacements)
    return IdentityPolicy(
        name=str(fields["name"]),
        manifest_sha256=str(fields["manifest_sha256"]),
        model_sha256=str(fields["model_sha256"]),
        preprocessing_sha256=str(fields["preprocessing_sha256"]),
        definitions_sha256=str(fields["definitions_sha256"]),
        baseline_sha256=str(fields["baseline_sha256"]),
        threshold=fields["threshold"],
        minimum_genuine=fields["minimum_genuine"],
        minimum_impostor=fields["minimum_impostor"],
        minimum_genuine_per_slice=fields["minimum_genuine_per_slice"],
        minimum_impostor_per_slice=fields["minimum_impostor_per_slice"],
        max_false_accept_rate=fields["max_false_accept_rate"],
        min_true_accept_rate=fields["min_true_accept_rate"],
        max_true_accept_gap=fields["max_true_accept_gap"],
        required_slices=fields["required_slices"],
        independent_threshold_commit=fields["independent_threshold_commit"],
    )


def make_pair(number: int, group: str = "A", genuine: bool = True,
              cosine: float | None = None) -> IdentityPair:
    left = f"subject{number}"
    right = left if genuine else f"other{number}"
    return IdentityPair(
        pair_id=f"pair{number}{group}{'g' if genuine else 'i'}",
        source_a=f"src{number}{group}A{'g' if genuine else 'i'}",
        source_b=f"src{number}{group}B{'g' if genuine else 'i'}",
        subject_a=left,
        subject_b=right,
        genuine=genuine,
        cosine=(0.94 if genuine else 0.20) if cosine is None else cosine,
        slices=SLICES_A if group == "A" else SLICES_B,
        consent_and_rights_checked=True,
        reference_labels_checked=True,
    )


def pairs(per_class: int = 40) -> tuple[IdentityPair, ...]:
    rows: list[IdentityPair] = []
    for group in ("A", "B"):
        for index in range(per_class):
            number = index + (0 if group == "A" else 10_000)
            rows.append(make_pair(number, group, genuine=True))
            rows.append(make_pair(number, group, genuine=False))
    return tuple(rows)


def test_complete_external_report_never_approves_release() -> None:
    result = evaluate_identity_pairs(pairs(), policy(), measured_on_external_faces=True)
    assert result.status == "ready_for_independent_review"
    assert result.reasons == ()
    assert result.all_pairs.genuine == 80
    assert result.all_pairs.impostor == 80
    assert result.all_pairs.false_accept.measured == 0
    assert result.all_pairs.true_accept.measured == 1
    assert result.release_qualified is False
    assert result.independently_approved is False
    assert len(result.slices) == 12
    assert all(row.sufficiently_sampled for row in result.slices)


def test_synthetic_never_counts_as_independent_face_qualification() -> None:
    result = evaluate_identity_pairs(pairs(), policy())
    assert result.status == "unproven"
    assert "synthetic_or_external_source_unverified" in result.reasons
    assert result.measured_on_external_faces is False
    assert result.release_qualified is False


def test_missing_threshold_commit_is_unproven() -> None:
    result = evaluate_identity_pairs(pairs(), policy(independent_threshold_commit=False),
                                     measured_on_external_faces=True)
    assert result.status == "unproven"
    assert "threshold_not_independently_preregistered" in result.reasons


def test_genuine_failure_blocks_every_aggregate() -> None:
    data = list(pairs())
    data[0] = replace(data[0], cosine=0.1)
    result = evaluate_identity_pairs(data, policy(min_true_accept_rate=0.99),
                                     measured_on_external_faces=True)
    assert result.status == "blocked"
    assert "true_accept_rate_below_policy" in result.reasons


def test_impostor_failure_blocks_and_keeps_nonrelease_status() -> None:
    data = list(pairs())
    for index, row in enumerate(data):
        if not row.genuine and row.slices == SLICES_A:
            data[index] = replace(row, cosine=0.99)
    result = evaluate_identity_pairs(data, policy(), measured_on_external_faces=True)
    assert "slice_false_accept_exceeds_policy" in result.reasons
    assert "false_accept_rate_exceeds_policy" in result.reasons
    assert result.status == "blocked"
    assert not result.release_qualified


def test_group_disparity_cannot_hide_behind_high_aggregate() -> None:
    data = list(pairs())
    changed = 0
    for index, row in enumerate(data):
        if row.genuine and row.slices == SLICES_B and changed < 10:
            data[index] = replace(row, cosine=0.0)
            changed += 1
    result = evaluate_identity_pairs(data, policy(min_true_accept_rate=0.65),
                                     measured_on_external_faces=True)
    assert result.status == "blocked"
    assert "true_accept_group_disparity" in result.reasons
    assert result.worst_true_accept_gap == 0.25


def test_missing_registered_slice_is_never_silently_skipped() -> None:
    result = evaluate_identity_pairs(
        [row for row in pairs() if row.slices == SLICES_A],
        policy(), measured_on_external_faces=True,
    )
    assert result.status == "unproven"
    assert "frozen_slice_underpowered" in result.reasons
    assert "comparison_groups_underpowered" in result.reasons
    assert len(result.slices) == 12
    assert sum(item.sufficiently_sampled for item in result.slices) == 6


def test_underpowered_groups_do_not_become_passes() -> None:
    result = evaluate_identity_pairs(pairs(per_class=3), policy(),
                                     measured_on_external_faces=True)
    assert result.status == "unproven"
    assert "genuine_pairs_underpowered" in result.reasons
    assert "impostor_pairs_underpowered" in result.reasons
    assert all(not row.sufficiently_sampled for row in result.slices)


def test_no_confidence_from_perfect_but_tiny_sample() -> None:
    report = evaluate_identity_pairs(pairs(per_class=10),
                                     policy(minimum_genuine=1, minimum_impostor=1,
                                            minimum_genuine_per_slice=1,
                                            minimum_impostor_per_slice=1,
                                            max_false_accept_rate=0.01,
                                            min_true_accept_rate=0.99),
                                     measured_on_external_faces=True)
    assert report.status == "unproven"
    assert "false_accept_confidence_insufficient" in report.reasons
    assert "true_accept_confidence_insufficient" in report.reasons


def test_shuffling_observations_keeps_same_aggregate_report() -> None:
    source = pairs()
    left = evaluate_identity_pairs(source, policy(), measured_on_external_faces=True)
    right = evaluate_identity_pairs(source[::-1], policy(), measured_on_external_faces=True)
    assert identity_report_json(left) == identity_report_json(right)


def test_public_metadata_never_contains_identifiers_or_vectors() -> None:
    source = pairs()
    result = evaluate_identity_pairs(source, policy(), measured_on_external_faces=True)
    public = identity_report_json(result)
    assert json.loads(public)["release_qualified"] is False
    for row in source:
        for private in (row.pair_id, row.source_a, row.source_b,
                        row.subject_a, row.subject_b):
            assert private not in public
    assert "cosine" not in public
    assert "photo" not in public


@pytest.mark.parametrize("defect", [
    {"source_b": "src0AAg"},
    {"pair_id": "../../private"},
    {"pair_id": ""},
    {"source_a": "person name"},
    {"cosine": float("nan")},
    {"cosine": float("inf")},
    {"cosine": 1.000001},
    {"cosine": -1.000001},
    {"genuine": False},
    {"consent_and_rights_checked": 1},
    {"reference_labels_checked": "true"},
    {"split": "train"},
    {"slices": ()},
    {"slices": SLICES_A + SLICES_A[:1]},
])
def test_invalid_pair_inputs_fail_closed(defect: dict[str, object]) -> None:
    item = make_pair(0)
    with pytest.raises(CommandValidationError):
        replace(item, **defect)


@pytest.mark.parametrize("field,bad", [
    ("name", "unsafe/path"),
    ("manifest_sha256", "A" * 64),
    ("model_sha256", "123"),
    ("preprocessing_sha256", "0" * 63),
    ("definitions_sha256", ""),
    ("baseline_sha256", "q" * 64),
    ("threshold", 1.2),
    ("threshold", float("nan")),
    ("threshold", True),
    ("minimum_genuine", 0),
    ("minimum_impostor", 0),
    ("minimum_genuine_per_slice", -1),
    ("minimum_impostor_per_slice", 1.2),
    ("max_false_accept_rate", -0.01),
    ("min_true_accept_rate", 1.01),
    ("max_true_accept_gap", float("nan")),
    ("required_slices", ()),
    ("required_slices", SLICES_A),
    ("required_slices", ALL_SLICES + SLICES_B[:1]),
    ("independent_threshold_commit", "true"),
])
def test_bad_policy_values_are_rejected(field: str, bad: object) -> None:
    with pytest.raises(CommandValidationError):
        policy(**{field: bad})


@pytest.mark.parametrize("dimension,label", [
    ("assumed_attribute", "A"),
    ("tone", "../../private"),
    ("", "A"),
    ("tone", ""),
    ("tone", "a" * 70),
    ("gender", "name@local"),
])
def test_invalid_group_labels_rejected(dimension: str, label: str) -> None:
    with pytest.raises(CommandValidationError):
        RequiredSlice(dimension, label)


def test_exact_pair_duplicates_are_rejected() -> None:
    item = make_pair(0)
    with pytest.raises(CommandValidationError, match="Duplicate"):
        evaluate_identity_pairs([item, item], policy())


def test_reversed_photo_pairs_are_duplicates_even_with_another_id() -> None:
    item = make_pair(0)
    repeated = replace(item, pair_id="different", source_a=item.source_b,
                       source_b=item.source_a)
    with pytest.raises(CommandValidationError, match="Duplicate"):
        evaluate_identity_pairs([item, repeated], policy())


def test_cross_split_photo_reuse_is_rejected() -> None:
    item = make_pair(0)
    calibration = replace(item, split="calibration", pair_id="cal",
                          source_b="fresh_source")
    with pytest.raises(CommandValidationError, match="calibration"):
        evaluate_identity_pairs([item, calibration], policy())


def test_missing_rights_or_independent_group_labels_makes_unproven() -> None:
    data = list(pairs())
    data[0] = replace(data[0], consent_and_rights_checked=False)
    data[1] = replace(data[1], reference_labels_checked=False)
    result = evaluate_identity_pairs(data, policy(), measured_on_external_faces=True)
    assert result.status == "unproven"
    assert "pair_rights_not_confirmed" in result.reasons
    assert "independent_pair_labels_missing" in result.reasons


def test_release_flag_is_explicit_bool_only() -> None:
    with pytest.raises(CommandValidationError):
        evaluate_identity_pairs(pairs(), policy(), measured_on_external_faces=1)


@pytest.mark.parametrize("success,count", [(0, 0), (1, 0), (-1, 2), (3, 2), (1, -1)])
def test_wilson_invalid_or_empty(success: int, count: int) -> None:
    if success == 0 and count == 0:
        assert wilson_interval(success, count).measured is None
    else:
        with pytest.raises(CommandValidationError):
            wilson_interval(success, count)


def test_wilson_interval_contains_point_at_multiple_counts() -> None:
    for count in (1, 2, 3, 10, 100, 1000):
        for success in range(count + 1):
            result = wilson_interval(success, count)
            assert result.lower95 is not None
            assert result.measured is not None
            assert result.upper95 is not None
            assert 0 <= result.lower95 <= result.measured <= result.upper95 <= 1


def test_impostor_accepted_count_never_increases_with_threshold() -> None:
    source = pairs()
    previous = len(source)
    for threshold in (-1.0, -0.5, 0.0, 0.2, 0.7, 1.0):
        report = evaluate_identity_pairs(source, policy(threshold=threshold),
                                         measured_on_external_faces=True)
        accepted = report.all_pairs.false_accept.numerator
        assert accepted <= previous
        previous = accepted


def test_development_and_frozen_subject_separation() -> None:
    reject_subject_overlap(["p1", "p2"], ["p3", "p4"])
    for dev, frozen in ((["p1"], ["p1"]), (["p1", "p1"], ["p2"]),
                        (["p1"], ["p2", "p2"]), (["bad/path"], ["p1"])):
        with pytest.raises(CommandValidationError):
            reject_subject_overlap(dev, frozen)


def test_frozen_policy_digest_is_content_bound() -> None:
    first = policy()
    second = policy()
    assert first.fingerprint() == second.fingerprint()
    assert first.fingerprint() != policy(threshold=0.77).fingerprint()
    assert first.fingerprint() != policy(model_sha256="f" * 64).fingerprint()
    assert first.fingerprint() == policy(required_slices=tuple(reversed(ALL_SLICES))).fingerprint()
    assert json.dumps(first.public_policy(), sort_keys=True).find("source") != -1
