"""R6 E08 first fifteen shape controls: recipes, MLS guard, contract and geometry.

Uses R5's synthetic 478-point mesh. No camera, face model or network is needed.
Author: John Khan.
"""
from __future__ import annotations

import json
import math
import subprocess
import sys
from pathlib import Path

import numpy as np
import pytest

from plumb_api.engines.shape import geometry, gender, turn, age
from plumb_api.engines.proportions import anatomy
from plumb_api.engines.core import regions
from lab.python.beljour_lab.face_harness import synthetic_case

ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture(scope="module")
def synthetic():
    return synthetic_case(1)


def test_control_list_is_complete_and_has_no_duplicate_id():
    assert len(geometry.CONTROLS) == 15
    assert len(geometry.CONTROL_BY_ID) == 15
    assert [sum(x["group"] == group for x in geometry.CONTROLS)
            for group in ("face", "jaw", "chin", "forehead")] == [3, 6, 4, 2]
    assert {"face_width", "face_length", "cheek_fullness", "jaw_width_left", "jaw_width_right",
            "jaw_angle_sharpness", "jawline_slope", "jowl_fullness", "jaw_length", "chin_width",
            "chin_length", "chin_projection_2d", "chin_shape", "forehead_height",
            "forehead_width"} == set(geometry.CONTROL_BY_ID)
    for item in geometry.CONTROLS:
        assert 0 < item["cap_iod"] <= 12
        assert item["sigma_v"] > 0
        assert item["region"] in {"outline", "outline_midline", "cheeks", "jaw", "jaw_midline",
                                  "chin", "chin_midline", "forehead", "forehead_midline"}
        assert item["mode"] in {"symmetric_x", "length", "puff", "side_x", "corner", "slope",
                                 "jowl", "lower_y", "projection", "pointed", "upper_y"}


@pytest.mark.parametrize("amount", [-100, -77, -33, 0, 42, 65, 100])
def test_all_controls_keep_a_finite_478_point_mesh(amount, synthetic):
    before = synthetic[0][:, :2]
    for record in geometry.CONTROLS:
        after = geometry.target_mesh(before, {record["id"]: amount})
        assert after.shape == before.shape
        assert np.isfinite(after).all()
        stats = geometry.displacement(before, after)
        assert 0 <= stats["max_iod_percent"] <= 12.00001
        if amount == 0:
            np.testing.assert_array_equal(before, after)
        else:
            assert stats["moving_landmarks"] > 0, record["id"]


def test_strength_zero_is_identity_and_does_not_modify_input(synthetic):
    before = synthetic[0][:, :2]
    copy = before.copy()
    for record in geometry.CONTROLS:
        np.testing.assert_array_equal(before, geometry.target_mesh(before, {record["id"]: 90}, strength=0))
    np.testing.assert_array_equal(before, copy)


def test_mirror_jaw_controls_are_independent(synthetic):
    mesh = synthetic[0][:, :2]
    f = geometry.frame(mesh)
    left = geometry.target_mesh(mesh, {"jaw_width_left": 80}, spread=0)
    right = geometry.target_mesh(mesh, {"jaw_width_right": 80}, spread=0)
    ld = np.linalg.norm(left - mesh, axis=1)
    rd = np.linalg.norm(right - mesh, axis=1)
    assert ld.max() > 0 and rd.max() > 0
    assert np.dot(left[np.argmax(ld)] - mesh[np.argmax(ld)], f.axis_across) != 0
    assert np.dot(right[np.argmax(rd)] - mesh[np.argmax(rd)], f.axis_across) != 0
    assert not np.allclose(left, right)


def test_local_frame_remains_valid_for_roll_and_scale(synthetic):
    face = synthetic[0][:, :2]
    f = geometry.frame(face)
    angle = math.radians(12)
    transform = np.array([[math.cos(angle), -math.sin(angle)],
                          [math.sin(angle), math.cos(angle)]])
    turned = (face - f.centre) @ transform.T * 1.13 + f.centre + [3, -2]
    before = geometry.target_mesh(face, {"chin_width": 50}) - face
    after = geometry.target_mesh(turned, {"chin_width": 50}) - turned
    # MLS in the face frame should follow the photo's roll, not a world X/Y axis.
    rotated_displacement = before @ transform.T * 1.13
    np.testing.assert_allclose(after, rotated_displacement, atol=0.015)


@pytest.mark.parametrize("invalid", [None, {}, [[1, 2]] * 477,
                                     [[1, 2, 3]] * 478])
def test_invalid_mesh_shapes_fail(invalid):
    if invalid == {}:
        with pytest.raises((TypeError, ValueError)):
            geometry.check_face(invalid)
        return
    with pytest.raises((TypeError, ValueError)):
        geometry.check_face(invalid)


def test_degenerate_but_well_formed_mesh_has_no_frame():
    with pytest.raises(ValueError):
        geometry.frame([[1, 2]] * 478)

def test_nonfinite_invalid_values_and_limits_are_rejected(synthetic):
    before = synthetic[0][:, :2]
    for value in (101, -101, float("nan"), float("inf"), True, "twenty"):
        with pytest.raises(ValueError):
            geometry.target_mesh(before, {"face_width": value})
    with pytest.raises(ValueError):
        geometry.target_mesh(before, {"unregistered": 40})
    for s in (-.1, 1.001, float("nan")):
        with pytest.raises(ValueError):
            geometry.target_mesh(before, {"face_width": 40}, strength=s)
    invalid = before.copy(); invalid[10, 0] = np.nan
    with pytest.raises(ValueError): geometry.check_face(invalid)


def test_anatomy_and_face_mesh_contours_are_single_source(synthetic):
    assert anatomy.MESH_POINTS == 478
    assert 10 in regions.FACE_OVAL and 152 in regions.FACE_OVAL
    assert anatomy.LANDMARKS["mesh_top"] == 10
    assert geometry.REGION_PAIRS == anatomy.region_pairs()
    mesh = synthetic[0][:, :2]
    for region in sorted({x["region"] for x in geometry.CONTROLS}):
        assert 2 < len(geometry._indices(region, mesh, geometry.frame(mesh))) < 150


def test_guard_reports_actual_used_strength_and_no_outer_artifacts(synthetic):
    xyz, img = synthetic
    mesh = xyz[:, :2]
    rendered, stats = geometry.raster_warp(img, mesh, {"jaw_width_right": 85})
    assert rendered.shape == img.shape and rendered.dtype == np.uint8
    assert 0 < stats["strength_used"] <= 1
    assert stats["min_area_ratio"] >= .2 - 1e-6
    np.testing.assert_array_equal(rendered[0, 0], img[0, 0])
    np.testing.assert_array_equal(rendered[-1, -1], img[-1, -1])
    identical, zero = geometry.raster_warp(img, mesh, {"face_width": 0})
    np.testing.assert_array_equal(identical, img)
    assert zero["strength_used"] == 1


def test_combined_controls_are_capped_and_deterministic(synthetic):
    mesh = synthetic[0][:, :2]
    moves = {c["id"]: 100 for c in geometry.CONTROLS}
    a = geometry.target_mesh(mesh, moves)
    b = geometry.target_mesh(mesh, moves)
    np.testing.assert_array_equal(a, b)
    # Cross-region sum is limited; after MLS spread the result may only be marginally higher.
    assert geometry.displacement(mesh, a)["max_iod_percent"] <= 12.00001


def test_generated_data_and_parity_files_cannot_drift():
    for command in (["scripts/sync_r6_data.py", "--check"],
                    ["api/scripts/make_parity.py", "shape", "--check"]):
        res = subprocess.run([sys.executable, *command], cwd=ROOT, text=True,
                             capture_output=True, timeout=40, check=False)
        assert res.returncode == 0, res.stdout + res.stderr
    spec = json.loads((ROOT / "api/plumb_api/engines/shape/controls.json").read_text())
    assert spec["author"] == "John Khan"
