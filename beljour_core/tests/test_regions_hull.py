"""R13 region masks: convex-hull fallback and explicit not-visible states.

Pass definition (improve-r12.md item 3, written before the run): on drawn meshes with
self-intersecting ovals, closed eyes, a closed mouth, turned heads and ten skin tones,
all 13 masks are finite; no mask is empty without a geometric not-visible reason
(closed eye or closed mouth); skin share stays in [0.45, 0.97]; a displaced eye is
still invalid. Masks never read pixel colour. Drawn meshes only. Author: John Khan.
"""
from __future__ import annotations

import math

import numpy as np
import pytest

from plumb_api.engines.core import regions
from plumb_api.engines.proportions.synthetic import symmetric_face
from plumb_api.engines.shape.synthetic_heads import drawn_head
from plumb_api.engines.shape.turn_field import silhouette_depth

H, W = 500, 400
SKIN = (0.45, 0.97)


def _check(points: np.ndarray, height: int = H, width: int = W, *, allow_invalid: bool = False) -> dict:
    masks = regions.region_masks(points, height, width, normalized=False, supersample=2)
    states = regions.region_states(points, height, width, normalized=False, supersample=2)
    diag = regions.region_diagnostics(points, height, width, normalized=False, supersample=2)
    assert set(masks) == set(regions.REGIONS) and len(masks) == 13
    for name, mask in masks.items():
        assert np.all(np.isfinite(mask)), name
        assert mask.min() >= 0 and mask.max() <= 1, name
        if float(mask.sum()) <= 0:
            assert states[name].startswith("not_visible:") or (allow_invalid and diag["invalid_geometry"]), \
                (name, states[name])
        else:
            assert states[name] == "visible"
    if not diag["invalid_geometry"]:
        assert SKIN[0] <= diag["skin_share"] <= SKIN[1]
        assert diag["eyes_inside"] >= 0.95
    assert diag["colour_dependent"] is False
    assert diag["version"] == regions.VERSION
    return diag


def test_unit_self_intersection_and_hull() -> None:
    square = np.array([[0, 0], [4, 0], [4, 4], [0, 4]], float)
    bowtie = np.array([[0, 0], [4, 4], [4, 0], [0, 4]], float)
    assert not regions.self_intersects(square)
    assert regions.self_intersects(bowtie)
    hull = regions.convex_hull(np.vstack([bowtie, [[2, 2]]]))
    assert len(hull) == 4
    assert {tuple(p) for p in hull} == {(0, 0), (4, 0), (4, 4), (0, 4)}
    # Repeated points and zero-length edges are not crossings.
    assert not regions.self_intersects(np.array([[0, 0], [0, 0], [4, 0], [4, 4], [0, 4]], float))


def _crossed_oval() -> np.ndarray:
    face = symmetric_face()
    ids = list(regions.FACE_OVAL)
    a, b = ids[6], ids[10]
    face[[a, b]] = face[[b, a]]
    return face


def test_self_intersecting_oval_falls_back_to_its_hull() -> None:
    face = _crossed_oval()
    loop = face[list(regions.FACE_OVAL)]
    assert regions.self_intersects(loop)
    even_odd = regions.polygon(H, W, loop, 2)
    hull = regions.polygon(H, W, regions.convex_hull(loop), 2)
    assert even_odd.sum() < hull.sum(), "the crossed loop leaves a hole under the even-odd rule"
    diag = _check(face)
    assert "face_oval" in diag["hull_fallback"]
    assert not diag["invalid_geometry"]
    oval = regions.region_mask("face_oval", face, H, W, normalized=False, supersample=2)
    np.testing.assert_array_equal(oval, hull)


def test_self_intersecting_eye_falls_back_to_its_hull() -> None:
    face = symmetric_face()
    eye = list(regions.RIGHT_EYE)
    face[[eye[2], eye[12]]] = face[[eye[12], eye[2]]]
    diag = _check(face)
    assert "right_eye" in diag["hull_fallback"]


def _close_eye(face: np.ndarray, side: str) -> np.ndarray:
    out = face.copy()
    ids = list(regions.RIGHT_EYE if side == "right" else regions.LEFT_EYE)
    centre_y = out[ids, 1].mean()
    out[ids, 1] = centre_y
    iris = [468, 469, 470, 471, 472] if side == "right" else [473, 474, 475, 476, 477]
    out[iris, 1] = centre_y
    return out


@pytest.mark.parametrize("sides", (("right",), ("left",), ("right", "left")))
def test_closed_eyes_are_declared_not_visible(sides: tuple[str, ...]) -> None:
    face = symmetric_face()
    for side in sides:
        face = _close_eye(face, side)
    diag = _check(face)
    for side in sides:
        assert diag["not_visible"][f"{side}_eye"] == "closed"
        assert diag["not_visible"][f"{side}_iris"] == "closed"
    if len(sides) == 2:
        assert diag["not_visible"]["eyes"] == "closed"
        assert diag["eyes_inside"] == 1.0
    assert not diag["invalid_geometry"]


def test_closed_mouth_opening_is_declared_not_visible() -> None:
    face = symmetric_face()
    inner = list(regions.LIPS_INNER)
    face[inner, 1] = face[inner, 1].mean()
    diag = _check(face)
    assert diag["not_visible"]["mouth_opening"] == "closed"
    lips = regions.region_mask("lips", face, H, W, normalized=False, supersample=2)
    assert lips.sum() > 0


def test_open_mouth_and_eyes_stay_visible() -> None:
    face = symmetric_face()
    inner = list(regions.LIPS_INNER)
    centre = face[inner, 1].mean()
    face[inner, 1] = centre + (face[inner, 1] - centre) * 1.0 + np.sign(face[inner, 1] - centre) * 6
    diag = _check(face)
    assert "mouth_opening" not in diag["not_visible"]
    assert "right_eye" not in diag["not_visible"]


def test_displaced_closed_eye_is_still_invalid() -> None:
    face = _close_eye(symmetric_face(), "right")
    ids = list(regions.RIGHT_EYE) + [468, 469, 470, 471, 472]
    face[ids, 0] -= 160
    diag = regions.region_diagnostics(face, H, W, normalized=False, supersample=2)
    assert diag["invalid_geometry"]
    states = regions.region_states(face, H, W, normalized=False, supersample=2)
    assert states["right_eye"] == "empty"


def _turned(seed: int, yaw: float) -> np.ndarray:
    xyz, _ = drawn_head(seed)
    pivot_x, pivot_z = xyz[:, 0].mean(), silhouette_depth(xyz)
    c, s = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
    x, z = xyz[:, 0] - pivot_x, xyz[:, 2] - pivot_z
    return np.column_stack([pivot_x + x * c + z * s, xyz[:, 1]])


@pytest.mark.parametrize("seed,yaw", ((0, 20), (1, -25), (2, 35), (3, -40), (4, 50)))
def test_turned_and_profile_heads_never_hide_an_unexplained_empty_mask(seed: int, yaw: float) -> None:
    points = _turned(seed, yaw)
    _, image = drawn_head(seed)
    _check(points, image.shape[0], image.shape[1], allow_invalid=True)


@pytest.mark.parametrize("monk", range(1, 11))
def test_masks_ignore_skin_tone(monk: int) -> None:
    xyz, _ = drawn_head(monk % 12)
    # Ten swatch colours across Monk 1-10 (drawn values, not measured from people).
    level = 245 - 21 * (monk - 1)
    image = np.full((360, 360, 3), (level, int(level * 0.8), int(level * 0.65)), np.uint8)
    first = regions.region_masks(xyz[:, :2], image.shape[0], image.shape[1], normalized=False, supersample=2)
    again = regions.region_masks(xyz[:, :2], image.shape[0], image.shape[1], normalized=False, supersample=2)
    for name in regions.REGIONS:
        np.testing.assert_array_equal(first[name], again[name])
    _check(xyz[:, :2], image.shape[0], image.shape[1])


def test_drawn_heads_pass_every_mask_check() -> None:
    for seed in range(12):
        xyz, image = drawn_head(seed)
        diag = _check(xyz[:, :2], image.shape[0], image.shape[1])
        assert not diag["invalid_geometry"]
        assert diag["hull_fallback"] == []
