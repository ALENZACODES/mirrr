"""BELJOUR shade-safety receipt: refusals win, constant honesty fields, photo-free.

Synthetic drawn colours only. Author: John Khan.
"""
from __future__ import annotations

import dataclasses

import pytest

from plumb_api.engines import shade
from plumb_api.engines.shade.finder import NO_WHITE, find_from_pixels
from plumb_api.engines.shade.illumination_sensitivity import LightingEstimate, audit_illumination_sensitivity
from plumb_api.engines.shade.reference_ambiguity import inspect_reference_ambiguity
from plumb_api.engines.shade.sensitivity_parity import CASTS, base_colours, case_reading
from plumb_api.engines.shade.shade_safety import LABEL, assess_shade_safety


def receipt(index: int, cast: str, modes: int = 3):  # type: ignore[no-untyped-def]
    result, sample, estimates = case_reading(base_colours()[index][1], CASTS[cast])
    return result, audit_illumination_sensitivity(result, sample, estimates[:modes]), inspect_reference_ambiguity(result)


def test_consistent_review_and_refused_statuses() -> None:
    statuses = set()
    for index in range(24):
        for cast in ("daylight", "warm", "dim"):
            result, sens, amb = receipt(index, cast, modes=1 if cast == "daylight" else 3)
            report = assess_shade_safety(result, sens, amb)
            statuses.add(report.status)
            if report.status == "refused":
                assert report.selected_id is None and report.reasons
            elif report.status == "review":
                assert set(report.reasons) <= {"lighting_sensitive", "nearby_references"} and report.reasons
            else:
                assert report.reasons == () and report.selected_id == result.best["id"]  # type: ignore[index]
    assert statuses == {"consistent", "review", "refused"}


def test_any_refusal_wins() -> None:
    result, sens, amb = receipt(4, "daylight")
    refused = find_from_pixels({}, NO_WHITE)
    unit = LightingEstimate("neutral", (1.0, 1.0, 1.0))
    report = assess_shade_safety(refused, audit_illumination_sensitivity(refused, [[1, 1, 1]], [unit]),
                                 inspect_reference_ambiguity(refused))
    assert report.status == "refused" and report.reasons[0] == "reading_refused"
    stale = dataclasses.replace(sens, status="refused", code="stale_sample", outcomes=())
    assert assess_shade_safety(result, stale, amb).reasons == ("lighting:stale_sample",)


def test_reviews_of_another_selection_are_rejected() -> None:
    result, sens, amb = receipt(4, "daylight")
    other = dataclasses.replace(sens, selected_id="LG-01C")
    with pytest.raises(ValueError):
        assess_shade_safety(result, other, amb)
    with pytest.raises(ValueError):
        assess_shade_safety(result, sens, {"status": "clear"})  # type: ignore[arg-type]


def test_receipt_states_its_limits_and_holds_no_photo_data() -> None:
    result, sens, amb = receipt(8, "warm")
    body = assess_shade_safety(result, sens, amb).public()
    assert body["label"] == LABEL and body["intent"] == "manual_only"
    assert (body["provider_calls"], body["real_product_match"], body["real_face_gate"], body["release_pass"]) == (
        0, False, "UNPROVEN", False)
    text = str(body)
    for forbidden in ("pixels", "landmark", "photo_digest", "sha256"):
        assert forbidden not in text
    assert shade.assess_shade_safety is assess_shade_safety
