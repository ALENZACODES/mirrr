"""Roll, asymmetry and anatomy-specific eye-space tests. Author: John Khan."""
from __future__ import annotations

import math

import numpy as np
import pytest

from plumb_api.engines.core import regions
from plumb_api.engines.eyes import render_eyes
from plumb_api.engines.eyes.contracts import ANATOMIES, parse_request
from plumb_api.engines.eyes.geometry import frames, interpolate, lid_height, native_placement, visible_canvas
from plumb_api.engines.eyes.liner import graphic_mask, wing_geometry
from plumb_api.engines.eyes.raster import filled
from plumb_api.engines.eyes.specimens import specimen


@pytest.mark.parametrize("roll", [-35, -17, 0, 14, 32])
def test_eye_local_roundtrip_and_roll_equivariance(roll: float) -> None:
    image, mesh, _ = specimen(120, 144, roll=roll)
    for frame in frames(mesh, image.shape[1], image.shape[0]):
        assert math.isclose(frame.width, 19.2, abs_tol=1e-8)
        assert math.isclose(sum(a * b for a, b in zip(frame.axis, frame.up, strict=True)), 0, abs_tol=1e-12)
        for u, v in ((0, 0), (.5, .2), (1, -.1)):
            assert np.allclose(frame.local(*frame.point(u, v)), (u, v), atol=1e-12)
        assert frame.visible
        assert frame.aperture > .3


def test_eye_frame_scales_with_the_photo() -> None:
    photo, mesh, _ = specimen(100, 120)
    one = frames(mesh, 100, 120)
    two = frames(mesh, 200, 240)
    for a, b in zip(one, two, strict=True):
        assert b.width == pytest.approx(a.width * 2)
        assert b.aperture == pytest.approx(a.aperture)
        assert np.allclose(b.point(.4, .2), np.array(a.point(.4, .2)) * 2)
    assert photo.shape[:2] == (120, 100)


def test_left_and_right_keep_their_own_measured_widths_and_angles() -> None:
    image, mesh, _ = specimen()
    mesh[list(regions.LEFT_EYE), 0] += .015
    mesh[263, 0] += .025
    mesh[263, 1] += .018
    right, left = frames(mesh, image.shape[1], image.shape[0])
    assert left.width > right.width
    assert left.downturned and not right.downturned
    assert left.roll != right.roll
    result = render_eyes(image, mesh, {"feature": "W64"})
    assert result.report["sides"][0]["eye_width_px"] != result.report["sides"][1]["eye_width_px"]
    assert any("turns down" in text for text in result.report["warnings"])


def test_native_anatomies_have_distinct_canvas_budgets() -> None:
    image, mesh, _ = specimen()
    frame = frames(mesh, image.shape[1], image.shape[0])[0]
    budgets = {a: lid_height(frame, a, .5) for a in ANATOMIES}
    assert budgets["hooded"] < budgets["deep_set"] < budgets["open"] <= budgets["monolid"]
    for anatomy in ANATOMIES:
        placement = native_placement(frame, anatomy)
        assert placement["geometry_changed"] is False
        assert "Not tested" in placement["expert_validation"]
        assert len(visible_canvas(frame, anatomy)) == 50
    assert "crease" in native_placement(frame, "monolid")["why"]


@pytest.mark.parametrize("anatomy", ANATOMIES)
def test_graphic_liner_never_spills_outside_mobile_lid(anatomy: str) -> None:
    photo, mesh, _ = specimen(160, 190)
    frame = frames(mesh, photo.shape[1], photo.shape[0])[0]
    canvas = filled(photo.shape[0], photo.shape[1], visible_canvas(frame, anatomy))
    for style in ("floating", "double_wing", "smoked_pencil", "gel", "shadow"):
        mask, report = graphic_mask(photo.shape[0], photo.shape[1], frame, parse_request({
            "feature": "W65", "style": style, "anatomy": {"right": anatomy, "left": anatomy}, "blend": .9}))
        assert np.count_nonzero(mask[canvas == 0]) == 0
        assert np.count_nonzero(mask) > 0
        assert report["mobile_lid_only"]


def test_hooded_wing_is_a_step_and_other_shapes_have_distinct_connectors() -> None:
    image, mesh, _ = specimen()
    frame = frames(mesh, image.shape[1], image.shape[0])[0]
    data = {a: wing_geometry(frame, a, .20, .012) for a in ANATOMIES}
    assert len(data["hooded"]["polygon"]) == 6
    assert len(data["open"]["polygon"]) == 3
    assert data["hooded"]["fold_estimate"] and not data["monolid"]["fold_estimate"]
    assert data["monolid"]["polygon"] != data["deep_set"]["polygon"]


def test_closed_eyes_return_explicit_unavailable_without_drawing() -> None:
    photo, mesh, _ = specimen()
    for contour in (regions.RIGHT_EYE, regions.LEFT_EYE):
        mean = float(np.mean(mesh[list(contour), 1]))
        mesh[list(contour), 1] = mean
    result = render_eyes(photo, mesh, {"feature": "W75"})
    assert result.report["status"] == "unavailable"
    assert np.array_equal(result.image, photo)
    assert np.count_nonzero(result.coverage) == 0


def test_interpolation_clamps_outside_the_measured_arc() -> None:
    arc = ((0.0, 0.0), (.5, .2), (1.0, 0.0))
    assert interpolate(arc, -.1) == 0
    assert interpolate(arc, .25) == pytest.approx(.1)
    assert interpolate(arc, .75) == pytest.approx(.1)
    assert interpolate(arc, 1.2) == 0
