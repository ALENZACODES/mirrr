"""Manual observation corrections, interchange and ownership. Author: John Khan."""
from __future__ import annotations

import copy
import json

import numpy as np
import pytest

from plumb_api.engines.brows.annotations import (
    annotate_brows,
    export_observations,
    observation_document,
    parse_observations,
    simplify_mark,
    validate_marks,
)
from plumb_api.engines.brows.geometry import brow_frames, union
from plumb_api.engines.brows.synthetic import brow_fixture


def mark(mode: str = "hair", opacity: float = 1) -> dict:
    return {"mode": mode, "radius": 0.006, "points": [[0.28, 0.31], [0.33, 0.31]], "opacity": opacity}


def test_manual_marks_are_clipped_to_brows_and_never_modify_image() -> None:
    image, face, _ = brow_fixture()
    before = image.copy()
    marks = [mark(), {"mode": "grey", "radius": 0.03, "points": [[0.2, 0.2], [0.8, 0.8]], "opacity": 0.5}]
    snapshot = copy.deepcopy(marks)
    evidence = annotate_brows(image, face, marks, reviewed=True)
    region = union(brow_frames(face, 128, 128))
    assert np.any(evidence.coverage)
    assert np.any(evidence.grey)
    assert np.all(evidence.coverage[region == 0] == 0)
    assert np.all(evidence.grey <= evidence.coverage)
    assert np.array_equal(image, before)
    assert marks == snapshot
    assert evidence.origin == "manual"
    assert evidence.confidence == 1


def test_unreviewed_marks_do_not_claim_review_of_both_brows() -> None:
    image, face, _ = brow_fixture()
    evidence = annotate_brows(image, face, [mark()])
    assert evidence.origin == "contrast"
    assert evidence.confidence == 0
    assert any("incomplete" in note for note in evidence.notes)


def test_erase_reduces_hair_and_grey_together_without_negative_values() -> None:
    image, face, _ = brow_fixture()
    covered = annotate_brows(image, face, [mark("grey")], reviewed=True)
    erased = annotate_brows(image, face, [mark("erase", 0.5)], base=covered, reviewed=True)
    assert np.sum(erased.coverage) < np.sum(covered.coverage)
    assert np.sum(erased.grey) < np.sum(covered.grey)
    assert np.all(erased.coverage >= 0)
    assert np.all(erased.grey <= erased.coverage)
    assert not np.shares_memory(erased.coverage, covered.coverage)


def test_single_point_dab_and_zero_opacity_have_defined_behaviour() -> None:
    image, face, _ = brow_fixture()
    dab = {**mark(), "points": [[0.3, 0.31]]}
    assert np.any(annotate_brows(image, face, [dab]).coverage)
    assert not np.any(annotate_brows(image, face, [{**dab, "opacity": 0}]).coverage)
    outside = {**dab, "points": [[0.95, 0.95]]}
    assert not np.any(annotate_brows(image, face, [outside]).coverage)


def test_portable_observation_document_round_trips_and_checks_dimensions() -> None:
    document = observation_document(128, 128, [mark()], reviewed=True)
    text = export_observations(document)
    assert parse_observations(text, expected_size=(128, 128)) == document
    assert json.loads(text)["author"] == "John Khan"
    assert set(document) == {"format", "author", "width", "height", "reviewed", "marks"}
    with pytest.raises(ValueError, match="dimensions"):
        parse_observations(text, expected_size=(256, 256))


@pytest.mark.parametrize("key,value", [("photo", "data:image/png;base64,AAAA"), ("name", "private"),
                                      ("landmarks", [[0.5, 0.5]]), ("notes", "a note")])
def test_annotation_document_has_no_photo_identity_or_landmark_fields(key: str, value: object) -> None:
    document = observation_document(128, 128, [mark()])
    document[key] = value
    with pytest.raises(ValueError, match="fields"):
        parse_observations(document)


@pytest.mark.parametrize("bad", [{"radius": 0}, {"radius": 0.1}, {"opacity": float("nan")}, {"mode": "fill"},
                                {"points": []}, {"points": [[-1, 0.5]]}, {"points": [[0.5, float("inf")]]},
                                {"points": [[0.5, 0.5, 0.2]]}])
def test_invalid_mark_boundaries_are_rejected(bad: dict) -> None:
    with pytest.raises(ValueError):
        validate_marks([{**mark(), **bad}])


def test_annotation_count_size_and_format_limits_are_enforced() -> None:
    with pytest.raises(ValueError, match="256"):
        validate_marks([mark()] * 257)
    with pytest.raises(ValueError, match="512"):
        validate_marks([{**mark(), "points": [[0.5, 0.5]] * 513}])
    with pytest.raises(ValueError, match="1 MiB"):
        parse_observations(" " * 1_048_577)
    with pytest.raises(ValueError, match="JSON"):
        parse_observations("{")
    document = observation_document(128, 128, [])
    document["format"] = "unknown"
    with pytest.raises(ValueError, match="format"):
        parse_observations(document)


def test_simplification_retains_endpoints_and_does_not_invent_points() -> None:
    points = [[0.2, 0.3], [0.2001, 0.3], [0.21, 0.3], [0.2101, 0.3], [0.25, 0.3]]
    result = simplify_mark(points, 0.002)
    assert result == [points[0], points[2], points[-1]]
    assert all(point in points for point in result)
    assert simplify_mark([points[0]]) == [points[0]]
    assert simplify_mark([points[0], points[0]]) == [points[0]]


def test_total_annotation_point_budget_bounds_history_memory() -> None:
    long_mark = {**mark(), "points": [[0.3, 0.31]] * 512}
    assert len(validate_marks([long_mark] * 8)) == 8
    with pytest.raises(ValueError, match="4096 total"):
        validate_marks([long_mark] * 9)
