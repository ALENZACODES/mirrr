"""Count-only iris eligibility reports from artificial render evidence.

The report never serializes source frames, masks, landmarks or personal ids.
Author: John Khan.
"""
from __future__ import annotations

import json

import numpy as np
import pytest

from plumb_api.engines.eyes.iris_colour import VisibleIrisResult
from plumb_api.engines.eyes.turn_audit import iris_counts


def _measured(
    visible: int,
    *,
    declared: tuple[str, ...] = (),
    missing: tuple[str, ...] = (),
) -> VisibleIrisResult:
    original = np.full((8, 8, 3), 84, dtype=np.uint8)
    alpha = np.zeros((8, 8), dtype=np.float64)
    if visible:
        alpha[2:4, 2:4] = 0.4
    changed = 4 * visible
    reason = "measured_visible_iris" if visible and not missing else "iris_not_observed"
    if reason != "measured_visible_iris":
        changed = 0
        visible = 0
        alpha[:] = 0
    return VisibleIrisResult(original, alpha, changed, visible, declared, missing, reason)


def test_count_only_report_keeps_refusals_and_slices_separate() -> None:
    records = [
        _measured(2),
        _measured(1, declared=("right:hidden_by_turn",)),
        _measured(0, missing=("right:unobserved",)),
        _measured(0, missing=("iris_masks_overlap",)),
    ]
    report = iris_counts(records, supplied_groups=["frontal", "profile", "profile", "frontal"])
    assert report.total == 4
    assert report.eligible == 2
    assert report.refused == 2
    assert report.edited_one == 1
    assert report.edited_two == 1
    assert report.undeclared_reasons == {"right:unobserved": 1, "iris_masks_overlap": 1}
    assert report.declared_reasons == {"right:hidden_by_turn": 1}
    assert report.groups["frontal"] == {"total": 2, "eligible": 1, "edited_two": 1, "refused": 1}
    assert report.groups["profile"] == {"total": 2, "eligible": 1, "edited_one": 1, "refused": 1}
    payload = json.dumps(report.to_json(), sort_keys=True)
    assert "quality_verdict" in payload and "UNPROVEN" in payload
    assert "image" not in payload
    assert "landmarks" not in payload
    assert "photo" not in payload


def test_zero_results_are_not_a_release_pass() -> None:
    report = iris_counts(())
    assert report.total == 0
    assert report.eligible == 0
    assert report.to_json()["quality_verdict"] == "UNPROVEN"


def test_missing_group_labels_are_not_filled_by_guesswork() -> None:
    records = [_measured(1), _measured(2)]
    with pytest.raises(ValueError, match="group count"):
        iris_counts(records, supplied_groups=["profile"])
    with pytest.raises(ValueError, match="group count"):
        iris_counts(records[:1], supplied_groups=["profile", "profile"])


@pytest.mark.parametrize("bad", ("", "With Spaces", "outside/path", "x" * 50))
def test_aggregate_group_names_must_be_short_slugs(bad: str) -> None:
    with pytest.raises(ValueError, match="aggregate slug"):
        iris_counts([_measured(1)], supplied_groups=[bad])


@pytest.mark.parametrize(
    "bad",
    ("right:guessed", "someone:closed", "unknown", "face_id:123"),
)
def test_unknown_declared_reasons_cannot_enter_aggregate_counts(bad: str) -> None:
    with pytest.raises(ValueError, match="visibility reason"):
        iris_counts([_measured(1, declared=(bad,))])


@pytest.mark.parametrize(
    "bad",
    ("unknown", "right:wrong_eye", "image_path", "portrait_id"),
)
def test_unknown_missing_codes_cannot_enter_aggregate_counts(bad: str) -> None:
    with pytest.raises(ValueError, match="refusal reason"):
        iris_counts([_measured(0, missing=(bad,))])


def test_unmeasured_payload_shape_is_rejected() -> None:
    with pytest.raises(ValueError, match="render results"):
        iris_counts([{"visible_irises": 1, "image": "raw bytes"}])


def test_impossible_positive_visible_count_with_no_edit_is_rejected() -> None:
    result = _measured(1)
    wrong = VisibleIrisResult(result.image, result.alpha, 0, 1, (), (), "measured_visible_iris")
    with pytest.raises(ValueError, match="unchanged visible"):
        iris_counts([wrong])


def test_refused_result_can_never_keep_a_partial_edit() -> None:
    result = _measured(0, missing=("right:unobserved",))
    wrong = VisibleIrisResult(
        result.image, result.alpha, 1, 0, (), result.undeclared_missing, result.reason
    )
    with pytest.raises(ValueError, match="partial edit"):
        iris_counts([wrong])


def test_refusal_reason_and_eligibility_must_agree() -> None:
    result = _measured(1)
    wrong = VisibleIrisResult(
        result.image, result.alpha, 4, 1, (), ("right:unobserved",), result.reason
    )
    with pytest.raises(ValueError, match="conflicts with eligibility"):
        iris_counts([wrong])
