"""Strict SKN-03 count reconciliation and source-derived undertone checks.

All values are hypothetical aggregates or in-house Lab references, not faces.
Author: John Khan.
"""
from __future__ import annotations

import dataclasses
import math
from typing import cast

import pytest

from plumb_api.engines.shade import load_skn03_c18_binding
from plumb_api.engines.shade.c18 import load_c18_shades
from plumb_api.engines.shade.calibration import committed_distance_limit
from plumb_api.engines.shade.skn03_checkpoint import (
    SKN03Checkpoint,
    TransitionCounts,
    build_skn03_checkpoint,
    pending_checkpoint_note,
    undertone_boundary_vectors,
)

SOURCE = load_c18_shades("skin")
MANIFEST = "a" * 64


def checkpoint(
    counts: TransitionCounts,
    *, independently_labelled: int | None = None,
    causes: dict[str, int] | None = None,
    digest: str | None = None,
    compatible_baseline: bool = True,
    human_review_complete: bool = True,
) -> SKN03Checkpoint:
    return build_skn03_checkpoint(
        counts=counts,
        frozen_manifest_digest=MANIFEST,
        c18_digest=SOURCE.digest if digest is None else digest,
        independently_labelled=(counts.total if independently_labelled is None else independently_labelled),
        causes={"other": counts.total - counts.after} if causes is None else causes,
        compatible_baseline=compatible_baseline,
        human_review_complete=human_review_complete,
    )


@pytest.mark.parametrize(
    ("stable", "fixed", "lost", "wrong", "expected_target", "expected_remaining"),
    [
        (939, 0, 0, 61, 950, 11),
        (939, 11, 0, 50, 950, 0),
        (939, 12, 1, 48, 950, 0),
        (939, 10, 0, 51, 950, 1),
        (920, 0, 0, 63, 934, 14),
        (923, 11, 0, 49, 934, 0),
        (95, 0, 0, 5, 95, 0),
        (94, 0, 0, 6, 95, 1),
        (1, 0, 0, 0, 1, 0),
    ],
)
def test_exact_target_ceiling_keeps_regressions_in_denominator(
    stable: int, fixed: int, lost: int, wrong: int,
    expected_target: int, expected_remaining: int,
) -> None:
    counts = TransitionCounts(stable, fixed, lost, wrong)
    report = checkpoint(counts)
    assert report.minimum_correct == expected_target
    assert report.additional_required == expected_remaining
    assert report.counts.before == stable + lost
    assert report.counts.after == stable + fixed
    assert report.public()["candidate_incorrect"] == lost + wrong
    assert report.public()["release_pass"] is False


def test_insufficient_labels_never_turn_a_numeric_threshold_into_evidence() -> None:
    counts = TransitionCounts(939, 11, 0, 50)
    assert checkpoint(counts, independently_labelled=949).status == "EVIDENCE_INCOMPLETE"
    assert checkpoint(counts, compatible_baseline=False).status == "EVIDENCE_INCOMPLETE"
    assert checkpoint(counts, human_review_complete=False).status == "EVIDENCE_INCOMPLETE"
    assert checkpoint(counts).status == "BOX_REVIEW_REQUIRED"
    assert checkpoint(counts).public()["release_pass"] is False


def test_catalogue_identity_is_bound_to_stable_c18_skin_digest() -> None:
    report = checkpoint(TransitionCounts(93, 1, 0, 6))
    assert report.c18_digest == SOURCE.digest
    binding = load_skn03_c18_binding()
    assert binding["digest"] == SOURCE.digest
    assert binding["count"] == 96
    assert binding["release_pass"] is False
    assert binding["format"] == "beljour-skn03-c18-binding/1"
    assert binding["digest"] != load_c18_shades("hair").digest


@pytest.mark.parametrize(
    "wrong_digest", ["b" * 64, "0" * 63, "ABC" * 21 + "A", "", "invalid"]
)
def test_c18_binding_refuses_unverified_inventory(wrong_digest: object) -> None:
    with pytest.raises(ValueError):
        checkpoint(TransitionCounts(93, 1, 0, 6), digest=cast(str, wrong_digest))


@pytest.mark.parametrize(
    "invalid", [-1, 1.0, True, "1", None, 100001]
)
def test_frozen_transition_count_refuses_invalid_types(invalid: object) -> None:
    with pytest.raises(ValueError):
        TransitionCounts(cast(int, invalid), 0, 0, 1)
    with pytest.raises(ValueError):
        TransitionCounts(1, cast(int, invalid), 0, 1)


def test_failure_causes_are_exhaustive_and_do_not_drop_no_mesh_cases() -> None:
    counts = TransitionCounts(935, 2, 4, 59)
    report = checkpoint(counts, causes={
        "no_mesh": 18,
        "unreliable_lighting": 13,
        "undertone_boundary": 15,
        "other": 17,
    })
    assert report.counts.total == 1000
    assert dict(report.causes)["no_mesh"] == 18
    assert sum(dict(report.causes).values()) == 63
    assert report.additional_required == 13


@pytest.mark.parametrize(
    "bad_causes", [
        {},
        {"other": 1},
        {"unknown_reason": 6},
        {"no_mesh": 7},
        {"other": True},
        {"other": -1},
        {"other": 6, "photo": 1},
    ],
)
def test_failure_cause_reconciliation_rejects_omissions_and_private_fields(
    bad_causes: dict[str, int],
) -> None:
    with pytest.raises(ValueError):
        checkpoint(TransitionCounts(94, 0, 0, 6), causes=bad_causes)


@pytest.mark.parametrize("labels", [-1, 101, 1.0, True])
def test_independent_label_counts_reject_invalid_evidence(labels: object) -> None:
    with pytest.raises(ValueError):
        checkpoint(TransitionCounts(94, 0, 0, 6), independently_labelled=cast(int, labels))


def test_unverified_reported_rate_has_no_invented_numerator_or_denominator() -> None:
    result = pending_checkpoint_note()
    assert result["reported_percent"] == 93.9
    assert result["percentage_point_gap"] == pytest.approx(1.1)
    assert result["verified_denominator"] is None
    assert result["verified_transition_counts"] is None
    assert result["status"] == "UNPROVEN"
    assert result["release_pass"] is False


@pytest.mark.parametrize("bad_rate", [float("nan"), math.inf, -1.0, 101.0, True])
def test_unverified_rate_cannot_hide_invalid_numbers(bad_rate: object) -> None:
    with pytest.raises(ValueError):
        pending_checkpoint_note(cast(float, bad_rate))


def test_undertone_midpoints_are_source_derived_not_hidden_reference_labels() -> None:
    edges = undertone_boundary_vectors()
    assert len(edges) == 32
    assert len({(edge.first_id, edge.second_id) for edge in edges}) == len(edges)
    ids = {row.id: row for row in SOURCE.records}
    for edge in edges:
        assert ids[edge.first_id].undertone != ids[edge.second_id].undertone
        assert max(edge.first_distance, edge.second_distance) >= 0
        assert edge.inside_committed_limit == (max(
            edge.first_distance, edge.second_distance,
        ) <= committed_distance_limit())
        assert edge.lab[0] == pytest.approx(
            (ids[edge.first_id].lab[0] + ids[edge.second_id].lab[0]) / 2
        )


@pytest.mark.parametrize("limit", [0, -1, 97, True, 1.0])
def test_undertone_edge_sweep_has_bounded_requested_size(limit: object) -> None:
    with pytest.raises(ValueError):
        undertone_boundary_vectors(max_pairs=cast(int, limit))


def test_evidence_records_remain_photo_free_and_do_not_claim_a_release_pass() -> None:
    entry = checkpoint(TransitionCounts(93, 1, 0, 6)).public()
    text = str(entry)
    for forbidden in ("photo", "landmarks", "portrait", "pixels", "provider_token"):
        assert forbidden not in text
    assert entry["release_pass"] is False
    assert entry["status"] == "BELOW_TARGET"
    assert dataclasses.asdict(TransitionCounts(1, 2, 3, 4))["regressed"] == 3
