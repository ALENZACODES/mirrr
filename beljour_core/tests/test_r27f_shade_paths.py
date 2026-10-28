"""Legacy and audited W6 paths on drawn faces, each outcome in exactly one category.

Drawn faces on the symmetric synthetic mesh only. Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.shade.diagnostics import diagnose_photo, diagnose_photos
from plumb_api.engines.shade.finder import thresholds
from tests.r27f_fixtures import POINTS, cast_zone, drawn_face


def test_plain_face_paths_agree() -> None:
    found = diagnose_photo(drawn_face(60), POINTS)
    assert (found.category, found.legacy_id, found.audited_id) == ("agree", "LG-08N", "LG-08N")


def test_missing_or_invalid_mesh_is_never_guessed() -> None:
    assert diagnose_photo(drawn_face(60), None).category == "missing_geometry"
    assert diagnose_photo(drawn_face(60), POINTS[:100]).category == "missing_geometry"
    with pytest.raises(ValueError):
        diagnose_photo(drawn_face(60).astype(np.float32), POINTS)


def test_one_tinted_cheek_is_inconsistent_light() -> None:
    found = diagnose_photo(cast_zone(drawn_face(60), "cheek_left", (2.0, 1.0, 0.5)), POINTS)
    assert (found.category, found.audit_reason) == ("inconsistent_light", "mixed_lighting")


def test_a_face_deeper_than_every_reference_is_a_coverage_gap() -> None:
    found = diagnose_photo(drawn_face(10), POINTS)
    assert (found.category, found.coverage_status) == ("coverage_gap", "no_reference_deep_enough")


def test_a_coloured_wall_splits_the_paths_as_a_measurement_mismatch() -> None:
    found = diagnose_photo(drawn_face(60, background=(200, 170, 130)), POINTS)
    assert found.category == "measurement_mismatch"
    assert found.legacy_id == "LG-08N" and found.audited_id is None


def test_review_counts_every_case_and_keeps_thresholds() -> None:
    before = dict(thresholds()["confidence"])
    cases = [(drawn_face(60), POINTS), (drawn_face(60), None), (drawn_face(10), POINTS),
             (cast_zone(drawn_face(50), "cheek_left", (2.0, 1.0, 0.5)), POINTS),
             (drawn_face(60, background=(200, 170, 130)), POINTS)]
    body = diagnose_photos(cases).public()
    assert body["total"] == 5 and sum(body["categories"].values()) == 5
    assert body["categories"] == {"agree": 1, "measurement_mismatch": 1, "missing_geometry": 1,
                                  "inconsistent_light": 1, "coverage_gap": 1}
    assert thresholds()["confidence"] == before and before["refuse_below"] == 0.45
    assert before["refuse_delta_e_above"] == 6.0 and thresholds()["never_lighter_allowance"] == 1.0
