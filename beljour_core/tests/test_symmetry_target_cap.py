"""R13 gate 9: symmetry targets capped at 15% IOD and gated by head angle.

Pass definition (improve-r12.md item 2, written before the run): 20 drawn meshes,
including asymmetric, tilted and turned ones. At every strength the largest target
move is <= 15% of the eye distance; turned (|yaw| > 15 deg) and tilted (|roll| > 10
deg) heads are refused with a reason; strength 0 is the exact identity; the cap
scales the whole move field by one factor. Drawn meshes only. Author: John Khan.
"""
from __future__ import annotations

import math

import numpy as np
import pytest

from plumb_api.engines.proportions import symmetry
from plumb_api.engines.proportions.synthetic import rolled, symmetric_face, with_asymmetry
from plumb_api.engines.shape.synthetic_heads import drawn_head
from plumb_api.engines.shape.turn_field import silhouette_depth

STRENGTHS = (0.0, 0.1, 0.25, 0.5, 0.75, 1.0)
CAP = symmetry.MAX_TARGET_MOVE_IOD


def _asymmetric(k: int) -> np.ndarray:
    face = symmetric_face()
    shifts = {"eyes": (2.0 + k, -1.5 * k), "brows": (-3.0 * k, 2.0), "mouth": (8.0 * k, 1.0),
              "jaw": (1.5 * k, 0.0), "nose": (-2.0 * k, 0.5 * k), "cheeks": (3.0, -2.0 * k)}
    return with_asymmetry(face, shifts)


def _turned(seed: int, yaw: float) -> np.ndarray:
    """Rotate a drawn 3D head about the vertical axis through its silhouette depth."""
    xyz, _ = drawn_head(seed)
    pivot = np.array([xyz[:, 0].mean(), 0.0, silhouette_depth(xyz)])
    c, s = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
    out = xyz.copy()
    x, z = xyz[:, 0] - pivot[0], xyz[:, 2] - pivot[2]
    out[:, 0] = pivot[0] + x * c + z * s
    out[:, 2] = pivot[2] - x * s + z * c
    return out


def _meshes() -> list[tuple[str, np.ndarray, bool]]:
    cases: list[tuple[str, np.ndarray, bool]] = [("symmetric", symmetric_face(), False)]
    cases += [(f"asymmetric-{k}", _asymmetric(k), False) for k in range(1, 9)]
    cases += [(f"rolled-{deg}", rolled(_asymmetric(2), deg), abs(deg) > 10) for deg in (-6, 4, 9, -14, 22)]
    cases += [(f"head-{seed}", drawn_head(seed)[0], False) for seed in (0, 5)]
    cases += [(f"turned-{yaw}", _turned(seed, yaw), abs(yaw) > 15)
              for seed, yaw in ((1, 25), (2, -30), (3, 10), (4, -12))]
    return cases


CASES = _meshes()


def test_twenty_drawn_meshes() -> None:
    assert len(CASES) == 20
    assert sum(1 for _, _, refused in CASES if refused) >= 4


@pytest.mark.parametrize("name,points,refused", CASES, ids=[c[0] for c in CASES])
def test_cap_and_gate(name: str, points: np.ndarray, refused: bool) -> None:
    flat = np.asarray(points, dtype=np.float64)[:, :2]
    iod = symmetry.interocular(flat)
    for strength in STRENGTHS:
        result = symmetry.safe_targets(points, strength)
        move = float(np.hypot(*(result.points - flat).T).max()) / iod
        assert move <= CAP, (name, strength, move)
        assert result.max_move_iod == pytest.approx(move, abs=1e-12)
        if refused:
            assert result.refused
            assert result.reason in ("head_turned", "head_tilted")
            np.testing.assert_array_equal(result.points, flat)
        else:
            assert not result.refused, (name, result.reason, result.yaw_degrees, result.roll_degrees)


@pytest.mark.parametrize("name,points,refused", CASES, ids=[c[0] for c in CASES])
def test_strength_zero_is_identity(name: str, points: np.ndarray, refused: bool) -> None:
    result = symmetry.safe_targets(points, 0.0)
    np.testing.assert_array_equal(result.points, np.asarray(points, dtype=np.float64)[:, :2])
    assert result.max_move_iod == 0.0


def test_cap_scales_the_whole_field_by_one_factor() -> None:
    points = _asymmetric(8)
    raw = symmetry.targets(points, 1.0)
    result = symmetry.safe_targets(points, 1.0)
    assert result.raw_max_move_iod > CAP, "the fixture must exceed the cap"
    assert result.scale < 1.0
    np.testing.assert_allclose(result.points - points, (raw - points) * result.scale, atol=1e-9)
    # Every region's asymmetry shrinks by the same share: the balance stays coherent.
    before = symmetry.analyse(points)
    after = symmetry.analyse(result.points)
    for region in before.regions:
        if region.mean > 1e-6:
            assert after.region(region.name).mean < region.mean


def test_strength_half_reproduces_the_r12_failure_and_now_stays_under() -> None:
    points = _asymmetric(8)
    flat = np.asarray(points)
    iod = symmetry.interocular(flat)
    old = float(np.hypot(*(symmetry.targets(points, 0.5) - flat).T).max()) / iod
    assert old > CAP, "uncapped targets move more than 15% IOD, as on 498 real faces"
    new = symmetry.safe_targets(points, 0.5)
    assert new.max_move_iod <= CAP


def test_turned_head_reasons_and_angles() -> None:
    turned = symmetry.safe_targets(_turned(1, 25), 0.5)
    assert turned.refused and turned.reason == "head_turned"
    assert abs(turned.yaw_degrees) == pytest.approx(25, abs=4)
    tilted = symmetry.safe_targets(rolled(symmetric_face(), 14), 0.5)
    assert tilted.refused and tilted.reason == "head_tilted"
    assert abs(tilted.roll_degrees) == pytest.approx(14, abs=0.5)
    near = symmetry.safe_targets(_turned(3, 10), 0.5)
    assert not near.refused and abs(near.yaw_degrees) < 15


def test_two_dimensional_yaw_uses_the_nose_offset() -> None:
    face = symmetric_face()
    shifted = face.copy()
    width = face[454, 0] - face[234, 0]
    shifted[1, 0] += 0.2 * width
    yaw, roll = symmetry.head_angles(shifted)
    assert yaw > 15
    assert abs(roll) < 1e-9
    result = symmetry.safe_targets(shifted, 0.5)
    assert result.refused and result.reason == "head_turned"


def test_symmetric_face_needs_no_movement() -> None:
    result = symmetry.safe_targets(symmetric_face(), 1.0)
    assert result.reason in ("no_movement", "ok")
    assert result.max_move_iod < 1e-9


def test_invalid_strength_is_refused() -> None:
    with pytest.raises(ValueError, match="strength"):
        symmetry.safe_targets(symmetric_face(), 1.5)
    with pytest.raises(ValueError, match="strength"):
        symmetry.safe_targets(symmetric_face(), float("nan"))
