"""FaceTarget geometry tests: local frame, regions, landmarks and masks.

Author: John Khan.
"""

from __future__ import annotations

import math

import numpy as np
import pytest

from plumb_api.seasonal.packs import FaceBox, FaceLandmarks, FaceTarget, TargetError
from plumb_api.seasonal.packs.synthetic import single
from plumb_api.seasonal.packs.target import (
    Ellipse,
    allowed_mask,
    polygon_mask,
    protected_mask,
    region_mask,
)

BOX = FaceBox(100.0, 120.0, 80.0, 100.0)


def test_box_validation() -> None:
    with pytest.raises(TargetError, match="4 x 4"):
        FaceBox(0, 0, 3, 10)
    with pytest.raises(TargetError, match="finite"):
        FaceBox(0, math.nan, 10, 10)
    with pytest.raises(TargetError, match="numbers"):
        FaceBox(0, 0, True, 10)
    assert BOX.centre == (140.0, 170.0)


def test_target_validation() -> None:
    with pytest.raises(TargetError, match="roll"):
        FaceTarget(BOX, roll=120.0)
    with pytest.raises(TargetError, match="roll"):
        FaceTarget(BOX, roll=math.inf)
    with pytest.raises(TargetError, match="FaceBox"):
        FaceTarget((0, 0, 10, 10))  # type: ignore[arg-type]
    with pytest.raises(TargetError, match="landmarks"):
        FaceTarget(BOX, landmarks=[(1.0, 2.0)])  # type: ignore[arg-type]


def test_landmark_points_are_checked() -> None:
    with pytest.raises(TargetError, match="pairs"):
        FaceLandmarks(left_eye=((1.0, 2.0, 3.0),))  # type: ignore[arg-type]
    with pytest.raises(TargetError, match="non-finite"):
        FaceLandmarks(mouth=((math.nan, 1.0),))
    marks = FaceLandmarks(nose=((1, 2),))
    assert marks.nose == ((1.0, 2.0),)


@pytest.mark.parametrize("roll", [-60.0, -15.0, 0.0, 22.5, 75.0])
def test_local_and_image_coordinates_round_trip(roll: float) -> None:
    target = FaceTarget(BOX, roll)
    for u, v in ((0.0, 0.0), (0.5, -0.5), (-0.9, 1.2), (0.3, -1.3)):
        x, y = target.to_image(u, v)
        back = target.to_local(x, y)
        assert back[0] == pytest.approx(u) and back[1] == pytest.approx(v)


def test_positive_roll_turns_clockwise_on_screen() -> None:
    upright = FaceTarget(BOX, 0.0)
    turned = FaceTarget(BOX, 30.0)
    top_upright = upright.to_image(0.0, -0.5)
    top_turned = turned.to_image(0.0, -0.5)
    assert top_upright[0] == pytest.approx(140.0)
    assert top_turned[0] > top_upright[0]


def test_region_is_clipped_to_the_image() -> None:
    target = FaceTarget(FaceBox(-20.0, -30.0, 60.0, 80.0))
    x0, y0, x1, y1 = target.region_bounds(200, 150)
    assert (x0, y0) == (0, 0)
    assert x1 <= 200 and y1 <= 150


def test_targets_outside_the_image_are_rejected() -> None:
    target = FaceTarget(FaceBox(500.0, 500.0, 40.0, 40.0))
    with pytest.raises(TargetError, match="outside"):
        target.check_on_image(200, 200)


def test_estimated_eyes_are_above_the_mouth_and_mirrored() -> None:
    target = FaceTarget(BOX)
    left, right = target.eye_regions()
    mouth = target.mouth_region()
    assert left.cx < right.cx
    assert left.cy == pytest.approx(right.cy)
    assert mouth.cy > left.cy
    assert (left.cx + right.cx) / 2 == pytest.approx(BOX.centre[0])


def test_landmarks_override_the_estimate() -> None:
    marks = FaceLandmarks(
        left_eye=((110.0, 150.0), (120.0, 148.0), (130.0, 150.0), (120.0, 152.0)),
        right_eye=((150.0, 150.0), (160.0, 148.0), (170.0, 150.0), (160.0, 152.0)),
        mouth=((125.0, 200.0), (155.0, 200.0), (140.0, 195.0), (140.0, 206.0)),
    )
    target = FaceTarget(BOX, landmarks=marks)
    left, right = target.eye_regions()
    assert left.cx == pytest.approx(120.0)
    assert right.cx == pytest.approx(160.0)
    assert target.mouth_region().cy == pytest.approx(200.5)
    for x, y in marks.left_eye + marks.right_eye + marks.mouth:
        assert any(region.contains(x, y) for region in target.protected_regions())


def test_missing_landmark_groups_fall_back_to_estimates() -> None:
    target = FaceTarget(BOX, landmarks=FaceLandmarks(nose=((140.0, 170.0),)))
    estimate = FaceTarget(BOX)
    assert target.eye_regions() == estimate.eye_regions()
    assert target.mouth_region() == estimate.mouth_region()


def test_ellipse_contains_and_polygon() -> None:
    ellipse = Ellipse(50.0, 50.0, 20.0, 10.0, 90.0)
    assert ellipse.contains(50.0, 68.0)
    assert not ellipse.contains(68.0, 50.0)
    assert ellipse.contains(68.0, 50.0, pad=9.0)
    assert len(ellipse.polygon(12)) == 12


def test_masks_nest_and_exclude_features() -> None:
    image, target = single(256)
    height, width = image.shape[:2]
    region = region_mask(target, width, height)
    protected = protected_mask(target, width, height)
    allowed = allowed_mask(target, width, height)
    assert (allowed <= region).all()
    assert not (allowed & protected).any()
    assert protected.sum() > 0
    assert region.sum() > protected.sum()


def test_drawn_landmarks_sit_on_drawn_features() -> None:
    image, target = single(256)
    assert target.landmarks is not None
    for x, y in target.landmarks.left_eye:
        assert target.eye_regions()[0].contains(x, y)
    xs = [p[0] for p in target.landmarks.mouth]
    assert min(xs) < target.box.centre[0] < max(xs)


def test_polygon_mask_ignores_degenerate_polygons() -> None:
    mask = polygon_mask(20, 20, [[(1.0, 1.0), (5.0, 5.0)], [(0, 0), (10, 0), (10, 10), (0, 10)]])
    assert mask.sum() > 50
    assert not mask[15, 15]


def test_cheek_anchors_are_outside_the_eyes_and_mouth() -> None:
    target = FaceTarget(BOX, 10.0)
    for side in (-1, 1):
        x, y = target.to_image(*target.cheek_anchor(side))
        assert not any(region.contains(x, y) for region in target.protected_regions())
    left = target.cheek_anchor(-1)
    right = target.cheek_anchor(1)
    assert left[0] < 0 < right[0]


@pytest.mark.parametrize("roll", [-45.0, -10.0, 0.0, 15.0, 60.0])
def test_from_landmarks_recovers_roll_and_box(roll: float) -> None:
    image, drawn = single(300, roll=roll)
    assert drawn.landmarks is not None
    built = FaceTarget.from_landmarks(drawn.landmarks)
    assert built.roll == pytest.approx(roll, abs=0.5)
    for got, want in (
        (built.box.width, drawn.box.width),
        (built.box.height, drawn.box.height),
        (built.box.centre[0], drawn.box.centre[0]),
        (built.box.centre[1], drawn.box.centre[1]),
    ):
        assert abs(got - want) <= 0.1 * drawn.box.width
    assert built.landmarks is drawn.landmarks


def test_from_landmarks_keeps_a_given_roll_and_rejects_bad_input() -> None:
    _, drawn = single(200, roll=20.0)
    assert drawn.landmarks is not None
    assert FaceTarget.from_landmarks(drawn.landmarks, roll=0.0).roll == 0.0
    with pytest.raises(TargetError, match="both eyes and the mouth"):
        FaceTarget.from_landmarks(FaceLandmarks(left_eye=((1.0, 1.0),)))
    flipped = FaceLandmarks(
        left_eye=((50.0, 50.0),), right_eye=((80.0, 50.0),), mouth=((65.0, 20.0),)
    )
    with pytest.raises(TargetError, match="above the mouth"):
        FaceTarget.from_landmarks(flipped, roll=0.0)


def test_looks_on_a_landmark_target_stay_local() -> None:
    image, drawn = single(256, roll=10.0)
    assert drawn.landmarks is not None
    built = FaceTarget.from_landmarks(drawn.landmarks)
    from plumb_api.seasonal.packs import apply_look

    out = apply_look(image, "halloween", "witch_hat", built)
    diff = np.any(out != image, axis=2)
    assert diff.any()
    assert not diff[~region_mask(built, 256, 256)].any()
    assert not diff[protected_mask(built, 256, 256)].any()
