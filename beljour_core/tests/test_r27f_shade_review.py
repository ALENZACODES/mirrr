"""Shade review classification rules on W6 results built from flat zone pixels.

Synthetic zone pixels only. Author: John Khan.
"""
from __future__ import annotations

import dataclasses

import numpy as np
import pytest

from plumb_api.engines.shade.finder import NO_WHITE, WhiteBalance, find_from_pixels
from plumb_api.engines.shade.review import CATEGORIES, LAST_REPORTED_REAL_FACE, classify_paths, review_diagnoses

NEUTRAL = WhiteBalance((1.0, 1.0, 1.0), "neutral", False)


def flat(rgb: tuple[int, int, int]):  # type: ignore[no-untyped-def]
    zones = {z: np.tile(np.asarray([rgb], dtype=np.float64), (300, 1)) for z in ("cheek_right", "cheek_left",
                                                                                   "forehead")}
    return find_from_pixels(zones, NEUTRAL)


def test_precedence_of_categories() -> None:
    named = flat((190, 150, 125))
    refused = find_from_pixels({}, NO_WHITE)
    assert classify_paths(named, named, None, geometry=False).category == "missing_geometry"
    assert classify_paths(named, named, "mixed_lighting", geometry=True).category == "inconsistent_light"
    assert classify_paths(named, named, None, geometry=True).category == "agree"
    assert classify_paths(refused, refused, None, geometry=True).category == "agree"
    other = dataclasses.replace(named, best={**named.best, "id": "LG-02C"})  # type: ignore[dict-item]
    assert classify_paths(named, other, None, geometry=True).category == "measurement_mismatch"
    assert classify_paths(named, refused, None, geometry=True).category == "measurement_mismatch"


def test_coverage_gap_needs_both_paths_without_a_shade() -> None:
    deep = flat((22, 14, 10))
    assert deep.refused and deep.measured_lab is not None
    gap = classify_paths(deep, deep, None, geometry=True)
    assert (gap.category, gap.coverage_status) == ("coverage_gap", "no_reference_deep_enough")
    named = flat((190, 150, 125))
    assert classify_paths(named, deep, None, geometry=True).category == "measurement_mismatch"


def test_review_is_photo_free_and_counts_everything() -> None:
    named = flat((190, 150, 125))
    rows = [classify_paths(named, named, None, geometry=True), classify_paths(None, None, None, geometry=False)]
    body = review_diagnoses(rows).public()
    assert body["total"] == 2 and list(body["categories"]) == list(CATEGORIES)
    assert body["last_reported_real_face"] == LAST_REPORTED_REAL_FACE == "65/983"
    assert body["new_real_face_score"] is None and body["thresholds_changed"] is False
    assert set(rows[0].public()) == {"category", "legacy", "audited", "audit_reason", "coverage"}
    with pytest.raises(ValueError):
        review_diagnoses([])
    with pytest.raises(ValueError):
        classify_paths(named, named, None, geometry=1)  # type: ignore[arg-type]
