"""Privacy-safe aggregate geometry audit tests with artificial masks only.

No face images, source paths or individual result records are retained.
Author: John Khan.
"""
from __future__ import annotations

import json
from collections.abc import Iterator, Mapping

import pytest

from plumb_api.engines.eyes.turn_audit import (
    GeometryCounts,
    aggregate,
    merge_shards,
    written_rule_breakdown,
)


def _valid(reason: str = "hidden_by_turn") -> dict[str, object]:
    return {
        "invalid_geometry": False,
        "invalid_reasons": [],
        "not_visible": {"right_eye": reason},
    }


def _invalid(kind: str = "right_eye:outside_visible_oval") -> dict[str, object]:
    return {"invalid_geometry": True, "invalid_reasons": [kind], "not_visible": {}}


def test_zero_observations_is_not_a_quality_pass() -> None:
    report = aggregate(())
    assert report.total == 0
    assert report.measured_valid_fraction is None
    assert report.to_json()["quality_verdict"] == "UNPROVEN"


def test_count_only_summary_has_no_person_specific_fields() -> None:
    report = aggregate([_valid(), _invalid(), _valid("closed")])
    assert report.total == 3
    assert report.valid == 2
    assert report.invalid == 1
    assert report.measured_valid_fraction == pytest.approx(2 / 3)
    assert report.invalid_reasons == {"right_eye:outside_visible_oval": 1}
    assert report.visibility_reasons == {"right_eye:hidden_by_turn": 1, "right_eye:closed": 1}
    payload = report.to_json()
    assert payload["groups"] == {"all": {"total": 3, "valid": 2, "invalid": 1}}
    assert "quality_verdict" in payload and payload["quality_verdict"] == "UNPROVEN"
    assert "mask" not in json.dumps(payload)
    assert "landmarks" not in json.dumps(payload)


def test_valid_data_must_not_be_reported_as_an_invalid_feature() -> None:
    with pytest.raises(ValueError, match="valid geometry"):
        aggregate([{"invalid_geometry": False, "invalid_reasons": ["face_oval_empty"]}])


@pytest.mark.parametrize(
    "reason",
    (
        "right_eye:unclassified",
        "left_eye:somebody_else",
        "right_cheek:empty_raw_contour",
        "right_eye:other",
        "hidden_by_turn",
    ),
)
def test_unsupported_reason_names_are_rejected(reason: str) -> None:
    with pytest.raises(ValueError, match="reason"):
        aggregate([_invalid(reason)])


@pytest.mark.parametrize("reason", ("closed", "hidden_by_turn"))
def test_visibility_reason_count_is_separate_from_invalidity(reason: str) -> None:
    report = aggregate([_valid(reason)])
    assert report.valid == 1
    assert report.invalid == 0
    assert report.visibility_reasons["right_eye:" + reason] == 1
    assert report.invalid_reasons == {}


@pytest.mark.parametrize("broken", (None, "yes", 1, [], {}))
def test_an_invalidity_flag_must_be_explicitly_boolean(broken: object) -> None:
    with pytest.raises(ValueError, match="boolean"):
        aggregate([{"invalid_geometry": broken}])


def test_no_explanation_is_a_counted_invalid_geometry_not_a_silent_pass() -> None:
    report = aggregate([{"invalid_geometry": True}, {"invalid_geometry": False}])
    assert report.invalid == 1
    assert report.invalid_reasons == {"other_invalid_geometry": 1}


def test_missing_group_labels_are_not_filled_from_pixels() -> None:
    with pytest.raises(ValueError, match="group count"):
        aggregate([_valid(), _valid()], supplied_groups=["front"])
    with pytest.raises(ValueError, match="group count"):
        aggregate([_valid()], supplied_groups=["front", "profile"])


@pytest.mark.parametrize("bad", ("", "a b", "A", "slash/name", "x" * 33))
def test_groups_accept_only_explicit_short_nonidentifying_slugs(bad: str) -> None:
    with pytest.raises(ValueError, match="aggregate slug"):
        aggregate([_valid()], supplied_groups=[bad])


def test_externally_supplied_groups_are_summarized_without_individual_rows() -> None:
    report = aggregate(
        [_valid(), _invalid(), _invalid("lips_outer:empty_raw_contour")],
        supplied_groups=["frontal", "profile", "frontal"],
    )
    assert report.groups["frontal"] == {"total": 2, "valid": 1, "invalid": 1}
    assert report.groups["profile"] == {"total": 1, "invalid": 1}
    assert report.to_json()["quality_verdict"] == "UNPROVEN"


def test_duplicate_categories_within_one_observation_are_not_double_counted() -> None:
    bad = _invalid("right_eye:empty_raw_contour")
    bad["invalid_reasons"] = ["right_eye:empty_raw_contour"] * 4
    report = aggregate([bad])
    assert report.invalid_reasons["right_eye:empty_raw_contour"] == 1
    assert report.invalid == 1


def test_generator_inputs_are_consumed_exactly_once() -> None:
    counter = [0]

    def events() -> Iterator[Mapping[str, object]]:
        for _ in range(7):
            counter[0] += 1
            yield _valid()

    report = aggregate(events())
    assert report.total == 7
    assert counter == [7]


def test_unique_shards_merge_additively_without_loss_of_refusals() -> None:
    part_a = aggregate([_valid(), _invalid()], supplied_groups=["frontal", "profile"])
    part_b = aggregate([_valid(), _valid("closed")], supplied_groups=["profile", "profile"])
    combined = merge_shards({"shard_0": part_a, "shard_1": part_b})
    assert combined.total == 4
    assert combined.valid == 3
    assert combined.invalid == 1
    assert combined.visibility_reasons == {
        "right_eye:hidden_by_turn": 2,
        "right_eye:closed": 1,
    }
    assert combined.groups["frontal"]["total"] == 1
    assert combined.groups["profile"]["total"] == 3
    assert combined.to_json()["quality_verdict"] == "UNPROVEN"


def test_aggregate_never_accepts_individual_frame_buffers_as_a_report() -> None:
    with pytest.raises(ValueError, match="mapping"):
        aggregate([[(0, 0, 0)]])


def test_missing_shard_is_not_assumed_successful() -> None:
    result = merge_shards({"shard_0": GeometryCounts(1, 0, 1, 0, {}, {}, {})})
    assert result.total == 1
    assert result.invalid == 1
    assert result.to_json()["quality_verdict"] == "UNPROVEN"


def test_malformed_merge_input_is_rejected() -> None:
    with pytest.raises(ValueError, match="count-only"):
        merge_shards({"shard_1": {"total": 5}})


def test_written_rule_breakdown_counts_old_thresholds_separately() -> None:
    reports = [
        {
            "face_area_px": 1400.0,
            "invalid_geometry": False,
            "skin_share": 0.8,
            "eyes_inside": 0.99,
        },
        {
            "face_area_px": 1500.0,
            "invalid_geometry": True,
            "skin_share": 0.42,
            "eyes_inside": 0.84,
        },
        {
            "face_area_px": 0.0,
            "invalid_geometry": True,
            "skin_share": 0.98,
            "eyes_inside": 0.96,
        },
    ]
    metrics = written_rule_breakdown(reports)
    assert metrics.observations == 3
    assert metrics.missing_measurements == 0
    assert metrics.face_area_empty == 1
    assert metrics.invalid_geometry == 2
    assert metrics.skin_share_below == 1
    assert metrics.skin_share_above == 1
    assert metrics.eyes_outside == 1
    assert metrics.to_json()["status"] == "UNPROVEN"


def test_missing_or_nonfinite_threshold_evidence_is_not_a_pass() -> None:
    reports = [
        {"invalid_geometry": False},
        {"invalid_geometry": True, "face_area_px": float("nan"),
         "skin_share": float("nan"), "eyes_inside": float("inf")},
    ]
    metrics = written_rule_breakdown(reports)
    assert metrics.observations == 2
    assert metrics.missing_measurements >= 3
    assert metrics.invalid_geometry == 1
    assert metrics.to_json()["status"] == "UNPROVEN"


@pytest.mark.parametrize(
    "skin,eyes,skin_low,skin_high,eyes_low",
    (
        (0.45, 0.95, 0, 0, 0),
        (0.97, 1.0, 0, 0, 0),
        (0.44999, 0.95, 1, 0, 0),
        (0.97001, 0.95, 0, 1, 0),
        (0.45, 0.94999, 0, 0, 1),
    ),
)
def test_written_inequalities_keep_exact_boundaries(
    skin: float, eyes: float, skin_low: int, skin_high: int, eyes_low: int
) -> None:
    value = written_rule_breakdown([{
        "invalid_geometry": False,
        "face_area_px": 10.0,
        "skin_share": skin,
        "eyes_inside": eyes,
    }])
    assert value.skin_share_below == skin_low
    assert value.skin_share_above == skin_high
    assert value.eyes_outside == eyes_low


def test_written_breakdown_uses_counts_only_not_input_identity() -> None:
    one = {
        "invalid_geometry": True,
        "face_area_px": 950.0,
        "skin_share": 0.38,
        "eyes_inside": 0.9,
    }
    two = dict(one)
    two["source"] = "not-read-by-audit"
    first = written_rule_breakdown([one]).to_json()
    second = written_rule_breakdown([two]).to_json()
    assert first == second
    assert "source" not in str(first)
