"""Independent iris audit and count-only group checks. Author: John Khan."""

from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from plumb_api.engines.eyes.iris_trial import IrisTrialEngine
from plumb_api.engines.eyes.iris_trial_evidence import (
    aggregate_trial_audits,
    audit_trial,
)
from tests.r26c_iris_cases import Observed, scene


@pytest.fixture
def observation() -> tuple[np.ndarray, object, object]:
    image, evidence = scene(75)
    box = (0.0, 0.0, 1.0, 1.0)
    result = IrisTrialEngine(Observed(evidence)).render(image, box=box, level=4.0)
    return image, evidence, result


def test_rendered_iris_is_unproven_not_quality_pass(observation: tuple) -> None:
    image, evidence, result = observation
    audit = audit_trial(image, result, evidence.masks, (0, 0, 1, 1))
    assert audit.verdict == "UNPROVEN"
    assert audit.changed_inside > 0
    assert audit.changed_outside == 0
    assert audit.changed_alpha == 0
    assert audit.off_mask_max_rgb == 0
    assert audit.changed_catchlights == 0
    assert audit.missing_guard is False
    assert audit.to_counts()["quality_verdict"] == "UNPROVEN"


def test_unobserved_background_edit_is_reported_as_a_breach(observation: tuple) -> None:
    image, evidence, result = observation
    changed = result.image.copy()
    changed[0, 0, 2] = np.uint8((int(changed[0, 0, 2]) + 1) % 255)
    broken = replace(result, image=changed)
    audit = audit_trial(image, broken, evidence.masks, (0, 0, 1, 1))
    assert audit.changed_outside == 1
    assert audit.off_mask_max_rgb == 1
    assert audit.verdict == "FAIL"


def test_identity_guard_missing_is_not_silently_passed(observation: tuple) -> None:
    image, evidence, result = observation
    bad = replace(result, guard_called=False)
    measured = audit_trial(image, bad, evidence.masks, (0, 0, 1, 1))
    assert measured.missing_guard
    assert measured.verdict == "FAIL"


def test_catchlight_change_is_a_distinct_failure(observation: tuple) -> None:
    image, evidence, result = observation
    changed = result.image.copy()
    changed[17, 20] = [220, 220, 220]
    trial = replace(result, image=changed)
    audit = audit_trial(image, trial, evidence.masks, (0, 0, 1, 1))
    assert audit.changed_catchlights == 1
    assert audit.verdict == "FAIL"


def test_rgba_alpha_changes_are_caught_even_when_rgb_is_unchanged() -> None:
    image, evidence = scene(channels=4)
    trial = IrisTrialEngine(Observed(evidence)).render(image, box=(0, 0, 1, 1))
    edited = trial.image.copy()
    edited[20, 21, 3] = 0
    measured = audit_trial(image, replace(trial, image=edited), evidence.masks, (0, 0, 1, 1))
    assert measured.changed_alpha == 1
    assert measured.verdict == "FAIL"


def test_a_refusal_with_changed_pixels_is_not_marked_safe() -> None:
    image, evidence = scene()
    trial = IrisTrialEngine(Observed(evidence)).render(image, box=(0, 0, 1, 1))
    result = replace(trial, status="refused")
    audit = audit_trial(image, result, evidence.masks, (0, 0, 1, 1))
    assert audit.visibility_violations == 1
    assert audit.verdict == "FAIL"


def test_a_claim_of_more_visible_irises_than_observed_is_refused() -> None:
    image, evidence = scene(hidden="right")
    trial = IrisTrialEngine(Observed(evidence)).render(image, box=(0, 0, 1, 1))
    assert trial.visible_irises == 1
    bogus = replace(trial, visible_irises=2)
    audit = audit_trial(image, bogus, evidence.masks, (0, 0, 1, 1))
    assert audit.visibility_violations == 1
    assert audit.verdict == "FAIL"


@pytest.mark.parametrize("corruption", ["nan", "negative", "greater_than_one", "bad_shape"])
def test_mask_validation_fails_closed(observation: tuple, corruption: str) -> None:
    image, evidence, result = observation
    masks = {name: value.copy() for name, value in evidence.masks.items()}
    if corruption == "nan":
        masks["right_iris"][20, 21] = float("nan")
    elif corruption == "negative":
        masks["right_iris"][20, 21] = -0.2
    elif corruption == "greater_than_one":
        masks["right_iris"][20, 21] = 1.2
    else:
        masks["right_iris"] = masks["right_iris"][:20]
    with pytest.raises(ValueError, match="mask"):
        audit_trial(image, result, masks, (0, 0, 1, 1))


@pytest.mark.parametrize("index", [0, 1, 2, 3])
def test_group_counts_report_only_aggregate_names(index: int, observation: tuple) -> None:
    image, evidence, result = observation
    good = audit_trial(image, result, evidence.masks, (0, 0, 1, 1))
    damaged = result.image.copy()
    damaged[index, 0, 1] ^= np.uint8(1)
    bad = audit_trial(image, replace(result, image=damaged), evidence.masks, (0, 0, 1, 1))
    report = aggregate_trial_audits([good, bad], supplied_groups=["set_a", "set_b"]).to_json()
    assert report["observations"] == 2
    assert report["failures"] == 1
    assert report["unproven"] == 1
    assert report["quality_verdict"] == "FAIL"
    text = str(report)
    assert "set_a" in text and "set_b" in text
    for forbidden in ("photo_sha256", "filename", "landmarks", "person_id", "pixel_bytes"):
        assert forbidden not in text


@pytest.mark.parametrize("bad", ["Group A", "../escape", "", "../unsafe"])
def test_group_names_must_be_short_aggregate_slugs(bad: str, observation: tuple) -> None:
    image, evidence, result = observation
    measured = audit_trial(image, result, evidence.masks, (0, 0, 1, 1))
    with pytest.raises(ValueError, match="group"):
        aggregate_trial_audits([measured], supplied_groups=[bad])


def test_group_length_is_exact(observation: tuple) -> None:
    image, evidence, result = observation
    measured = audit_trial(image, result, evidence.masks, (0, 0, 1, 1))
    with pytest.raises(ValueError, match="group/observation"):
        aggregate_trial_audits([measured], supplied_groups=[])
    with pytest.raises(ValueError, match="group/observation"):
        aggregate_trial_audits([measured], supplied_groups=["a", "b"])


def test_no_observations_cannot_imply_quality_pass() -> None:
    report = aggregate_trial_audits([]).to_json()
    assert report["observations"] == 0
    assert report["quality_verdict"] == "UNPROVEN"
    assert not report["statuses"]


def test_result_is_not_allowed_at_thumbnail_resolution(observation: tuple) -> None:
    image, evidence, result = observation
    thumbnail = replace(result, image=result.image[:20].copy(), height=20)
    with pytest.raises(ValueError, match="full-resolution"):
        audit_trial(image, thumbnail, evidence.masks, (0, 0, 1, 1))


def test_preserves_input_observations_when_measuring() -> None:
    image, evidence = scene()
    original = image.copy()
    masks = {key: value.copy() for key, value in evidence.masks.items()}
    trial = IrisTrialEngine(Observed(evidence)).render(image, box=(0, 0, 1, 1))
    audit_trial(image, trial, evidence.masks, (0, 0, 1, 1))
    np.testing.assert_array_equal(image, original)
    for key in masks:
        np.testing.assert_array_equal(evidence.masks[key], masks[key])
