"""Independent brow-mask evidence and privacy-safe aggregate regressions.

Only constructed colour planes are used; no person data is included.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from plumb_api.engines.brows.trial import BrowTrialSession
from plumb_api.engines.brows.trial_evidence import (
    aggregate_brow_evidence,
    audit_brow_trial,
    brow_side_evidence,
)
from tests.r28c_brow_vectors import DrawnBrowSource, drawn_brows


@pytest.mark.parametrize("channels", [3, 4])
@pytest.mark.parametrize("hidden", [None, "left", "right"])
def test_real_render_keeps_all_independent_pixel_invariants(
    channels: int, hidden: str | None,
) -> None:
    frame, observed = drawn_brows(channels, hidden, True)
    result = BrowTrialSession(DrawnBrowSource(observed)).render(frame, box=(0, 0, 1, 1), level=5)
    audit = audit_brow_trial(frame, result, observed.masks, observed.protected)
    assert audit.verdict == "UNPROVEN"
    assert audit.changed_pixels > 0
    assert audit.changed_outside == 0
    assert audit.max_outside_rgb == 0
    assert audit.alpha_changes == 0
    assert audit.protected_changes == 0
    assert not audit.guard_missing
    assert audit.texture_correlation is not None
    assert audit.texture_correlation > 0.8
    assert audit.mean_luma_change is not None
    assert audit.mean_luma_change < 0
    assert audit.safe_counts()["quality_verdict"] == "UNPROVEN"


@pytest.mark.parametrize("position", ["outside", "protected", "alpha"])
def test_negative_control_detects_unauthorized_pixels(position: str) -> None:
    frame, observed = drawn_brows(4, None, True)
    result = BrowTrialSession(DrawnBrowSource(observed)).render(frame, box=(0, 0, 1, 1))
    altered = result.image.copy()
    if position == "outside":
        altered[23, 20, 0] = np.uint8(0)
    elif position == "protected":
        altered[11, 8, 0] = np.uint8(0)
    else:
        altered[11, 8, 3] = np.uint8(5)
    report = audit_brow_trial(frame, replace(result, image=altered), observed.masks, observed.protected)
    assert report.verdict == "FAIL"
    if position == "outside":
        assert report.changed_outside > 0
        assert report.max_outside_rgb > 0
    elif position == "protected":
        assert report.protected_changes > 0
    else:
        assert report.alpha_changes > 0


def test_guard_bypass_is_detected_without_claiming_quality_pass() -> None:
    frame, observed = drawn_brows()
    result = BrowTrialSession(DrawnBrowSource(observed)).render(frame, box=(0, 0, 1, 1))
    unguarded = replace(result, guard_called=False)
    audit = audit_brow_trial(frame, unguarded, observed.masks)
    assert audit.guard_missing
    assert audit.verdict == "FAIL"


def test_refusal_must_leave_every_pixel_unchanged() -> None:
    frame, observed = drawn_brows(hidden="right")
    source = DrawnBrowSource(observed)
    observed.masks["right_brow"][10:15, 7:17] = 1
    result = BrowTrialSession(source).render(frame, box=(0, 0, 1, 1))
    assert result.status == "refused"
    audit = audit_brow_trial(frame, result, observed.masks)
    assert audit.verdict == "UNPROVEN"
    assert audit.changed_pixels == 0


def test_evidence_requires_two_disjoint_observed_brows() -> None:
    frame, observed = drawn_brows()
    result = BrowTrialSession(DrawnBrowSource(observed)).render(frame, box=(0, 0, 1, 1))
    with pytest.raises(ValueError, match="both observed"):
        audit_brow_trial(frame, result, {"left_brow": observed.masks["left_brow"]})
    observed.masks["left_brow"][11, 8] = 1
    with pytest.raises(ValueError, match="overlap"):
        audit_brow_trial(frame, result, observed.masks)


@pytest.mark.parametrize("count", [0, 1, 3, 25])
def test_count_only_aggregate_has_no_face_data(count: int) -> None:
    frame, observed = drawn_brows()
    result = BrowTrialSession(DrawnBrowSource(observed)).render(frame, box=(0, 0, 1, 1))
    evidence = audit_brow_trial(frame, result, observed.masks)
    grouped = aggregate_brow_evidence([evidence] * count, ["group-a"] * count)
    report = grouped.safe_counts()
    assert report["observations"] == count
    assert report["unproven"] == count
    assert report["failures"] == 0
    assert "image" not in report
    assert "photo" not in report
    assert "hash" not in report
    assert report["quality_verdict"] == "UNPROVEN"


def test_aggregate_rejects_excess_or_missing_group_rows() -> None:
    frame, observed = drawn_brows()
    result = BrowTrialSession(DrawnBrowSource(observed)).render(frame, box=(0, 0, 1, 1))
    audit = audit_brow_trial(frame, result, observed.masks)
    with pytest.raises(ValueError, match="group count"):
        aggregate_brow_evidence([audit], [])
    with pytest.raises(ValueError, match="group count"):
        aggregate_brow_evidence([audit], ["one", "two"])
    with pytest.raises(ValueError, match="anonymous"):
        aggregate_brow_evidence([audit], ["private/slash-alias"])


def test_each_brow_has_independent_observed_or_declared_visibility() -> None:
    frame, observation = drawn_brows(hidden="left")
    result = BrowTrialSession(DrawnBrowSource(observation)).render(frame, box=(0, 0, 1, 1))
    right, left = brow_side_evidence(frame, result, observation.masks, observation.states)
    assert right.status == "MEASURED"
    assert right.observed_pixels == 50
    assert right.changed_pixels > 0
    assert left.status == "DECLARED_NOT_VISIBLE"
    assert left.observed_pixels == 0
    assert left.changed_pixels == 0
    assert right.safe_counts()["quality_verdict"] == "UNPROVEN"


def test_undeclared_missing_brow_never_counts_as_measured() -> None:
    frame, observation = drawn_brows(hidden="left")
    observation.states["left_brow"] = "visible"
    result = BrowTrialSession(DrawnBrowSource(observation)).render(frame, box=(0, 0, 1, 1))
    _, left = brow_side_evidence(frame, result, observation.masks, observation.states)
    assert left.status == "INVALID"
    assert left.safe_counts()["quality_verdict"] == "FAIL"
