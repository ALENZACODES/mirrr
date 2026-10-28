"""Locality and identity tests: looks touch only the chosen person.

Fixtures are procedural portraits drawn in code; two faces share one picture
so the bystander can be checked pixel for pixel.
Author: John Khan.
"""

from __future__ import annotations

import cv2
import numpy as np
import pytest

from plumb_api.seasonal.packs import FaceTarget, LookKind, PackError, apply_look, list_packs
from plumb_api.seasonal.packs.synthetic import pair, single
from plumb_api.seasonal.packs.target import protected_mask, region_mask

FACE_LOOKS = [
    (pack.occasion, look.id) for pack in list_packs() for look in pack.looks if look.kind.needs_face
]
GRADE_LOOKS = [
    (pack.occasion, look.id)
    for pack in list_packs()
    for look in pack.looks
    if look.kind is LookKind.GRADE
]
WHOLE_LOOKS = [
    (pack.occasion, look.id)
    for pack in list_packs()
    for look in pack.looks
    if look.kind.whole_image
]


def changed(before: np.ndarray, after: np.ndarray) -> np.ndarray:
    result: np.ndarray = np.any(before != after, axis=2)
    return result


@pytest.mark.parametrize(("occasion", "look_id"), FACE_LOOKS)
def test_face_looks_leave_everything_outside_the_chosen_region(occasion: str, look_id: str) -> None:
    image, chosen, bystander = pair()
    height, width = image.shape[:2]
    out = apply_look(image, occasion, look_id, chosen, strength=5.0, seed=3)
    diff = changed(image, out)
    assert diff.any(), "the look must change something"
    inside = region_mask(chosen, width, height)
    assert not diff[~inside].any()
    assert not diff[region_mask(bystander, width, height)].any()


@pytest.mark.parametrize(("occasion", "look_id"), FACE_LOOKS)
def test_face_looks_never_paint_eyes_or_mouth(occasion: str, look_id: str) -> None:
    image, target = single(320)
    height, width = image.shape[:2]
    for strength in (1.0, 5.0):
        out = apply_look(image, occasion, look_id, target, strength=strength, seed=11)
        assert not changed(image, out)[protected_mask(target, width, height)].any()


@pytest.mark.parametrize(("occasion", "look_id"), FACE_LOOKS)
def test_choosing_the_other_face_moves_the_look(occasion: str, look_id: str) -> None:
    image, left, right = pair()
    height, width = image.shape[:2]
    out = apply_look(image, occasion, look_id, right, strength=5.0, seed=5)
    diff = changed(image, out)
    assert diff[region_mask(right, width, height)].any()
    assert not diff[region_mask(left, width, height)].any()


@pytest.mark.parametrize(("occasion", "look_id"), FACE_LOOKS)
def test_face_looks_need_a_target(occasion: str, look_id: str) -> None:
    image, _ = single(128)
    with pytest.raises(PackError, match="chosen face"):
        apply_look(image, occasion, look_id)


@pytest.mark.parametrize(("occasion", "look_id"), WHOLE_LOOKS)
def test_whole_image_looks_ignore_the_target(occasion: str, look_id: str) -> None:
    image, left, right = pair()
    with_left = apply_look(image, occasion, look_id, left, seed=2)
    with_right = apply_look(image, occasion, look_id, right, seed=2)
    without = apply_look(image, occasion, look_id, None, seed=2)
    assert np.array_equal(with_left, without)
    assert np.array_equal(with_right, without)


def edge_map(image: np.ndarray, target: FaceTarget) -> np.ndarray:
    box = target.box
    x0, y0 = int(box.x), int(box.y)
    x1, y1 = int(box.x + box.width), int(box.y + box.height)
    grey = cv2.cvtColor(np.ascontiguousarray(image[y0:y1, x0:x1]), cv2.COLOR_RGB2GRAY)
    edges: np.ndarray = cv2.Canny(grey, 20, 60) > 0
    return edges


@pytest.mark.parametrize(("occasion", "look_id"), GRADE_LOOKS)
def test_grades_keep_face_geometry(occasion: str, look_id: str) -> None:
    image, target = single(384)
    out = apply_look(image, occasion, look_id, strength=5.0)
    before = edge_map(image, target)
    after = edge_map(out, target)
    assert before.sum() > 100
    # Grown by one pixel, every original edge must still be an edge after the grade.
    grown = cv2.dilate(after.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    kept = int((before & grown).sum()) / int(before.sum())
    assert kept >= 0.97
    union = int((before | after).sum())
    assert int((before & after).sum()) / union >= 0.85


@pytest.mark.parametrize(("occasion", "look_id"), FACE_LOOKS)
def test_accessories_keep_face_geometry(occasion: str, look_id: str) -> None:
    image, target = single(320)
    height, width = image.shape[:2]
    out = apply_look(image, occasion, look_id, target, strength=5.0)
    protected = protected_mask(target, width, height)
    # Eyes and mouth carry the face shape; they must be byte-identical.
    assert np.array_equal(image[protected], out[protected])


def test_input_array_is_never_modified() -> None:
    image, target = single(200)
    copy = image.copy()
    for pack in list_packs():
        for look in pack.looks:
            apply_look(image, pack.occasion, look.id, target)
    assert np.array_equal(image, copy)


def test_output_shape_and_type_match() -> None:
    image, target = single(150)
    for pack in list_packs():
        for look in pack.looks:
            out = apply_look(image, pack.occasion, look.id, target)
            assert out.shape == image.shape
            assert out.dtype == np.uint8
