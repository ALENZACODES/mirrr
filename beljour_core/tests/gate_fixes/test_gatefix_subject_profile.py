"""C16 item (c), ported to the current main-subject and visibility code.

Pass definition: the largest face is chosen (vision/subject.py), the centre
breaks a tie within 10%, a chosen index wins, a photo is never declined for
several people and a clipped bystander is skipped; an edit composed for the
main subject (vision/face_picker.compose_selected) leaves every pixel outside
its mask, and every bystander's face, byte-identical; with no face nothing is
edited. Under yaw, an eye, brow and iris hidden by the turn are declared not
visible from the mesh (engines/core/regions.py with Lane C's
engines/eyes/turn_visibility.py), the regions row passes, and iris_recolour
edits the visible iris, from frontal to an 88-degree profile on the cylinder model.
From about 60 degrees the far-side oval landmarks fold back over the face; regions
then use the oval's convex hull (reported as hull_fallback), and past about 82
degrees the far eye's corners swap order, which is itself the turn evidence.
Drawn meshes and photos only. Author: John Khan.
"""
from __future__ import annotations

import sys
from typing import Any

import numpy as np
import pytest
from gatefix_gates import REALFACE
from gatefix_meshes import drawn_photo, normalized, placed_face, yawed

from plumb_api.engines.core import regions
from plumb_api.vision import face_picker, subject
from plumb_api.vision.box_first import FaceBox

if str(REALFACE) not in sys.path:
    sys.path.insert(0, str(REALFACE))

import feature_checks as fc  # noqa: E402
import primary_face  # noqa: E402

SKINS = ((198, 152, 120), (120, 82, 58), (232, 196, 170))
# Largest yaw (degrees) checked on the cylinder model; past 88 the face is a pure profile.
MAIN_YAW_LIMIT = 69
PROFILE_LIMIT = 88


def ring(cx: float, cy: float, r: float) -> np.ndarray:
    """A normalized 478 x 3 stand-in mesh (flat depth)."""
    angles = np.linspace(0, 2 * np.pi, 478, endpoint=False)
    return np.stack((cx + r * np.cos(angles), cy + 1.3 * r * np.sin(angles), np.zeros(478)), -1)


def test_largest_face_wins_in_any_order() -> None:
    big, small = ring(0.25, 0.5, 0.15), ring(0.5, 0.5, 0.05)
    for meshes, expected in (([big, small], 0), ([small, big], 1)):
        found = subject.choose_subject(meshes, [], 640, 480)
        assert found.index == expected
        assert found.reason_code == "selected_largest"


def test_centre_breaks_a_tie_only_within_ten_percent() -> None:
    edge, centre = ring(0.2, 0.5, 0.104), ring(0.52, 0.5, 0.1)
    tie = subject.choose_subject([edge, centre], [], 640, 640)
    assert (tie.index, tie.reason_code) == (1, "selected_centre_tiebreak")
    far_larger = ring(0.2, 0.5, 0.12)
    assert subject.choose_subject([far_larger, centre], [], 640, 640).index == 0


def test_chosen_index_and_its_refusals() -> None:
    meshes = [ring(0.25, 0.5, 0.15), ring(0.7, 0.5, 0.05)]
    tapped = subject.choose_subject(meshes, [], 640, 480, chosen_index=1)
    assert (tapped.index, tapped.reason_code) == (1, "selected_by_index")
    wrong = subject.choose_subject(meshes, [], 640, 480, chosen_index=5)
    assert (wrong.index, wrong.reason_code) == (None, "invalid_selection")
    assert subject.choose_subject([], [], 640, 480).reason_code == "no_face"


def test_several_people_are_never_declined_and_clipped_bystanders_are_skipped() -> None:
    main, clipped = ring(0.45, 0.5, 0.14), ring(0.98, 0.5, 0.1)
    broken = np.full((478, 3), np.nan)
    found = subject.choose_subject([clipped, broken, main], [], 640, 480)
    assert found.accepted and found.index == 2
    assert (found.candidates, found.other_faces) == (3, 2)
    assert primary_face.select([clipped, broken, main], [], 640, 480).index == 2


def test_chosen_face_can_still_be_refused() -> None:
    clipped_big = ring(0.95, 0.5, 0.2)
    found = subject.choose_subject([clipped_big, ring(0.3, 0.5, 0.05)], [], 640, 480)
    assert found.index == 1
    alone = subject.choose_subject([clipped_big], [], 640, 480)
    assert (alone.index, alone.reason_code) == (None, "mesh_out_of_frame")
    tapped = subject.choose_subject([clipped_big, ring(0.3, 0.5, 0.05)], [], 640, 480,
                                    chosen_index=0)
    assert not tapped.accepted
    weak = FaceBox(208, 96, 192, 288, 0.5)
    refused = subject.choose_subject([ring(0.475, 0.5, 0.15)], [weak], 640, 480)
    assert (refused.index, refused.reason_code) == (None, "low_confidence")


def three_people() -> tuple[np.ndarray, list[np.ndarray]]:
    height, width = 360, 720
    faces = [placed_face(140, 190, 0.5), placed_face(370, 180, 0.8), placed_face(600, 200, 0.45)]
    image = drawn_photo(height, width, list(zip(faces, SKINS, strict=True)))
    return image, faces


def with_depth(points: np.ndarray) -> np.ndarray:
    return np.column_stack((points, np.zeros(len(points))))


def tint_skin(image: np.ndarray, mesh: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    height, width = image.shape[:2]
    pixels = np.asarray(mesh, dtype=np.float64)[:, :2] * (width, height)
    mask = regions.region_mask("skin", pixels, height, width, normalized=False)
    warmer = image.astype(np.float64) + mask[..., None] * np.array([18.0, 4.0, -10.0])
    return np.rint(warmer).clip(0, 255).astype(np.uint8), mask


@pytest.mark.parametrize("chosen", (None, 2))
def test_bystanders_stay_byte_identical_outside_the_edit_mask(chosen: int | None) -> None:
    image, faces = three_people()
    height, width = image.shape[:2]
    meshes = [with_depth(normalized(face, width, height)) for face in faces]
    choice = subject.choose_subject(meshes, [], width, height, chosen_index=chosen)
    target = 1 if chosen is None else chosen
    assert choice.index == target
    edited, mask = tint_skin(image, meshes[target])
    ovals = [regions.region_mask("face_oval", face, height, width, normalized=False)
             for index, face in enumerate(faces) if index != target]
    result = face_picker.compose_selected(image, edited, mask, ovals)
    assert np.array_equal(result[mask <= 0], image[mask <= 0])
    assert not np.array_equal(result, image)
    for oval in ovals:
        assert np.array_equal(result[oval > 0], image[oval > 0])


def test_photo_without_a_face_is_returned_unchanged_with_no_face() -> None:
    image = drawn_photo(200, 300, [])
    assert subject.choose_subject([], [], 300, 200).reason_code == "no_face"
    before = image.copy()
    with pytest.raises(ValueError, match="no verified editable region"):
        face_picker.compose_selected(image, image.copy(), np.zeros((200, 300)))
    assert np.array_equal(image, before)


def turned(degrees: float) -> tuple[np.ndarray, np.ndarray]:
    points = yawed(placed_face(200, 250), degrees, 200, 110)
    return drawn_photo(500, 400, [(points, SKINS[0])]), points


def declared_by_turn(points: np.ndarray) -> list[str]:
    states = regions.region_states(points, 500, 400, normalized=False)
    return sorted(name for name, state in states.items() if state == "not_visible:hidden_by_turn"
                  and name.split("_")[0] in ("left", "right"))


def assert_no_unexplained_gap(points: np.ndarray) -> None:
    states = regions.region_states(points, 500, 400, normalized=False)
    assert not [name for name, state in states.items() if state == "empty"]
    assert not regions.region_diagnostics(points, 500, 400, normalized=False)["invalid_geometry"]


@pytest.mark.parametrize("degrees,hidden", ((0, None), (45, None), (60, "left"), (-60, "right"),
                                            (MAIN_YAW_LIMIT, "left"), (-MAIN_YAW_LIMIT, "right")))
def test_turn_declaration_from_the_mesh(degrees: float, hidden: str | None) -> None:
    _, points = turned(degrees)
    expected = [] if hidden is None else sorted(f"{hidden}_{part}" for part in ("brow", "eye", "iris"))
    assert declared_by_turn(points) == expected
    assert_no_unexplained_gap(points)


@pytest.mark.parametrize("degrees", (80, -80))
def test_turn_declaration_at_profile(degrees: float) -> None:
    _, points = turned(degrees)
    assert_no_unexplained_gap(points)


def test_frontal_masks_are_unchanged_by_the_turn_rule(monkeypatch: pytest.MonkeyPatch) -> None:
    _, points = turned(0)
    with_rule = regions.region_masks(points, 500, 400, normalized=False)
    monkeypatch.setattr(regions._RegionBuilder, "hidden_by_turn", lambda *_: False)
    without = regions.region_masks(points, 500, 400, normalized=False)
    assert all(np.array_equal(with_rule[name], without[name]) for name in regions.REGIONS)


def sweep_problems(start: int, limit: int) -> list[tuple[int, list[str]]]:
    problems = []
    for sign in (1, -1):
        for degrees in sorted({*range(start, limit + 1, 3), limit}):
            _, points = turned(sign * degrees)
            states = regions.region_states(points, 500, 400, normalized=False)
            empty = [name for name, state in states.items() if state == "empty"]
            if empty or regions.region_diagnostics(points, 500, 400, normalized=False)["invalid_geometry"]:
                problems.append((sign * degrees, empty))
    return problems


def test_yaw_sweep_leaves_no_undeclared_empty_feature() -> None:
    assert sweep_problems(0, MAIN_YAW_LIMIT) == []


def test_yaw_sweep_to_profile_leaves_no_undeclared_empty_feature() -> None:
    assert sweep_problems(MAIN_YAW_LIMIT + 1, PROFILE_LIMIT) == []


def test_odd_mesh_without_a_nose_shift_is_not_read_as_a_turn() -> None:
    _, points = turned(0)
    swapped = points.copy()
    swapped[[33, 133]] = swapped[[133, 33]]
    # Main decides the turn inside regions (Lane C's engines/eyes/turn_visibility.py);
    # the C16 engines/core/turn_visibility.py is no longer called by any product path.
    builder = regions._RegionBuilder(swapped, 500, 400, normalized=False, supersample=4)
    assert not builder.hidden_by_turn("right") and not builder.hidden_by_turn("left")
    assert declared_by_turn(swapped) == []


def regions_row(image: np.ndarray, points: np.ndarray) -> dict[str, Any]:
    import realface_lib as lib

    rows: list[dict[str, Any]] = []
    bench: Any = object.__new__(lib.Bench)
    bench.m = {"regions": regions}

    def add(module: str, check: str, ok: bool, *args: Any, **fields: Any) -> None:
        rows.append({"check": check, "pass": ok, **fields})

    bench._regions(image, None, points, 40.0, add)
    return rows[0]


@pytest.mark.parametrize("degrees", (0, 45, 60, -60))
def test_regions_gate_row_passes_from_frontal_to_a_strong_turn(degrees: float) -> None:
    image, points = turned(degrees)
    row = regions_row(image, points)
    assert row["pass"], row
    assert row["empty"] == ""


@pytest.mark.parametrize("degrees", (80, -80))
def test_regions_gate_row_passes_at_profile(degrees: float) -> None:
    image, points = turned(degrees)
    assert regions_row(image, points)["pass"]


def test_iris_check_edits_the_visible_iris_on_a_turned_face() -> None:
    image, points = turned(60)
    row = fc.iris_recolour(image, points)
    assert row.passed
    assert row.measurements["visible_irises"] == 1
    assert row.measurements["declared_not_visible"] == ["left:hidden_by_turn"]
    assert row.measurements["undeclared_missing"] == []
    frontal = fc.iris_recolour(*turned(0))
    assert frontal.passed and frontal.measurements["visible_irises"] == 2


def test_iris_check_edits_the_visible_iris_on_a_profile() -> None:
    assert fc.iris_recolour(*turned(80)).passed


def test_iris_check_declares_both_closed_irises_and_edits_nothing() -> None:
    image, points = turned(0)
    closed = points.copy()
    for top, bottom in ((159, 145), (386, 374)):
        closed[top] = closed[bottom] = (closed[top] + closed[bottom]) / 2
    for side in (regions.RIGHT_EYE, regions.LEFT_EYE):
        centre_y = closed[list(side), 1].mean()
        closed[list(side), 1] = centre_y
    row = fc.iris_recolour(image, closed)
    assert row.passed is False
    assert row.measurements["reason"] == "iris_not_observed"
    assert sorted(row.measurements["declared_not_visible"]) == ["left:closed", "right:closed"]
    assert row.measurements["undeclared_missing"] == []
    assert row.output is not None and np.array_equal(row.output, image)
