"""Illumination sensitivity of a selected W6 shade on drawn skin zones under integer casts.

Synthetic drawn colours only. Author: John Khan.
"""
from __future__ import annotations

import dataclasses

import numpy as np
import pytest

from plumb_api.engines import shade
from plumb_api.engines.shade.finder import NO_WHITE, find_from_pixels
from plumb_api.engines.shade.illumination_sensitivity import (
    LightingEstimate,
    audit_illumination_sensitivity,
    measure_sample,
)
from plumb_api.engines.shade.sensitivity_parity import CASTS, base_colours, case_reading

BASE = base_colours()[10][1]


def test_daylight_reading_is_stable_and_keeps_its_selection() -> None:
    result, sample, estimates = case_reading(BASE, CASTS["daylight"])
    decision = audit_illumination_sensitivity(result, sample, estimates[:1])
    assert decision.status == "stable" and decision.code is None
    assert decision.selected_id == result.best["id"]  # type: ignore[index]
    assert decision.outcomes[0].nearest_id == decision.selected_id


def test_uncorrected_warm_light_is_sensitive_but_never_reselects() -> None:
    result, sample, estimates = case_reading(BASE, CASTS["warm"])
    decision = audit_illumination_sensitivity(result, sample, estimates)
    assert [o.mode for o in decision.outcomes] == ["neutral", "grey_world", "none"]
    assert decision.status == "sensitive"
    none = decision.outcomes[2]
    assert none.nearest_id != decision.selected_id or not none.within_limits
    assert decision.selected_id == result.best["id"]  # type: ignore[index]
    body = decision.public()
    assert body["changes_selection"] is False and "pixels" not in str(body)
    assert body["max_delta_e"] == round(max(o.delta_e for o in decision.outcomes), 4)


def test_refused_or_unknown_baseline_is_incompatible() -> None:
    result, sample, estimates = case_reading(BASE, CASTS["daylight"])
    refused = find_from_pixels({}, NO_WHITE)
    assert audit_illumination_sensitivity(refused, sample, estimates).code == "incompatible_baseline"
    foreign = dataclasses.replace(result, best={**result.best, "id": "S05"})  # type: ignore[dict-item]
    decision = audit_illumination_sensitivity(foreign, sample, estimates)
    assert (decision.status, decision.code, decision.outcomes) == ("refused", "incompatible_baseline", ())


def test_a_different_sample_is_stale() -> None:
    result, sample, estimates = case_reading(BASE, CASTS["daylight"])
    other = np.clip(sample + 6, 0, 255)
    assert audit_illumination_sensitivity(result, other, estimates).code == "stale_sample"
    assert audit_illumination_sensitivity(result, sample[::-1].copy(), estimates).status != "refused"


@pytest.mark.parametrize(("mode", "gains"), [
    ("daylight", (1, 1, 1)), ("neutral", (1, 1)), ("neutral", (1, float("nan"), 1)), ("neutral", (0.4, 1, 1)),
    ("neutral", (1, 2.1, 1)), ("none", (1.1, 1, 1)), ("neutral", (True, 1, 1)),
])
def test_invalid_estimates_are_refused(mode: str, gains: tuple[float, ...]) -> None:
    with pytest.raises(ValueError):
        LightingEstimate(mode, gains)  # type: ignore[arg-type]


def test_estimate_lists_and_samples_are_checked() -> None:
    result, sample, estimates = case_reading(BASE, CASTS["daylight"])
    for bad in ([], estimates + [estimates[0]], [estimates[0], estimates[0]], ["neutral"]):
        with pytest.raises(ValueError):
            audit_illumination_sensitivity(result, sample, bad)  # type: ignore[arg-type]
    for bad_sample in (np.zeros((0, 3)), np.zeros((5, 2)), np.full((5, 3), np.nan)):
        with pytest.raises(ValueError):
            measure_sample(bad_sample, (1, 1, 1))
    with pytest.raises(ValueError):
        audit_illumination_sensitivity({"refused": False}, sample, estimates)  # type: ignore[arg-type]
    assert shade.audit_illumination_sensitivity is audit_illumination_sensitivity
