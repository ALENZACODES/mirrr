"""R7 LS4 posture: control points, the seven fixes, band render checks. Drawn figures only.

Author: John Khan.
"""
from __future__ import annotations

import math

import numpy as np
import pytest

from plumb_api.engines.posture import fixes, points, render, synthetic
from plumb_api.engines.warp import fold
from plumb_api.quality.metrics import q12_straight_lines, q1_outside_mask


@pytest.fixture(scope="module")
def front():
    return synthetic.front_figure(lean=4.0, shoulder_drop=4.0)


@pytest.fixture(scope="module")
def side():
    return synthetic.side_figure(head_forward=10.0, round_shoulder=4.0, slouch=4.0, sway=5.0, belly=3.0)


def test_controls_validate_points_order_and_facing(front, side):
    pts = dict(front.controls.points)
    with pytest.raises(ValueError, match="missing"):
        points.Controls("front", {k: v for k, v in pts.items() if k != "navel"}, 160, 200)
    with pytest.raises(ValueError, match="unknown"):
        points.Controls("front", {**pts, "ear": (1.0, 1.0)}, 160, 200)
    with pytest.raises(ValueError, match="above both hips"):
        points.Controls("front", {**pts, "right_shoulder": (40.0, 150.0)}, 160, 200)
    with pytest.raises(ValueError, match="outside the photo"):
        points.Controls("front", {**pts, "left_hip": (400.0, 100.0)}, 160, 200)
    with pytest.raises(ValueError, match="no facing"):
        points.Controls("front", pts, 160, 200, 1)
    with pytest.raises(ValueError, match="facing"):
        points.Controls("side", dict(side.controls.points), 160, 200, 0)
    with pytest.raises(ValueError, match="top to bottom"):
        points.Controls("side", {**side.controls.points, "ear": (80.0, 190.0)}, 160, 200, 1)
    with pytest.raises(ValueError, match="too small"):
        points.Controls("front", {"right_shoulder": (10, 10), "left_shoulder": (12, 10), "right_hip": (10, 13),
                                  "left_hip": (12, 13), "mid_chest": (11, 11), "navel": (11, 12)}, 160, 200)
    assert front.controls.torso_height > 50


def _pose(**over):
    marks = [{"x": 0.5, "y": 0.1 + i * 0.02, "visibility": 0.9} for i in range(33)]
    for index, values in over.items():
        marks[int(index[1:])].update(values)
    return marks


def test_from_pose_front_and_side():
    c = points.from_pose(_pose(i11={"x": 0.6, "y": 0.3}, i12={"x": 0.4, "y": 0.3}, i23={"x": 0.56, "y": 0.6, "visibility": 0.2},
                               i24={"x": 0.44, "y": 0.6}), 200, 300, "front")
    assert c.estimated == ("mid_chest", "navel") and c.manual == ("left_hip",)
    s = points.from_pose(_pose(i0={"x": 0.62, "y": 0.15}, i7={"x": 0.5, "y": 0.16}, i11={"x": 0.5, "y": 0.3},
                               i23={"x": 0.5, "y": 0.6}, i25={"x": 0.52, "y": 0.8}, i27={"x": 0.5, "y": 0.95},
                               i8={"visibility": 0.1}, i12={"visibility": 0.1}, i24={"visibility": 0.1}, i26={"visibility": 0.1}),
                         200, 300, "side")
    assert s.facing == 1 and "ankle" in s.points
    assert s.points["mid_back"][0] < s.points["shoulder"][0]
    assert s.manual == ("ear", "shoulder", "hip", "knee")
    with pytest.raises(ValueError, match="33"):
        points.from_pose(_pose()[:30], 200, 300, "front")
    with pytest.raises(ValueError):
        points.from_pose([[0.5, float("nan")]] * 33, 200, 300, "front")


@pytest.mark.parametrize("case", range(6))
def test_every_fix_moves_its_points_only_reduces_its_measure_and_respects_cap(case):
    fig = synthetic.cases()[case]
    for fix, stops in fixes.plans_for(fig.controls).items():
        sizes = []
        for stop, p in stops.items():
            for name in p.pins:
                assert p.after.points[name] == fig.controls.points[name]
            assert p.largest_move_px <= p.cap_px + 1e-9
            if p.largest_move_px > 0:
                assert abs(p.measure_after) < abs(p.measure_before)
            sizes.append(p.largest_move_px)
            assert "not medical advice" in p.label
        assert sizes == sorted(sizes)


def test_lean_turns_toward_vertical_and_shoulder_modes(front):
    p = fixes.plan(front.controls, "lean", "full")
    assert abs(fixes.torso_tilt(p.after)) < abs(fixes.torso_tilt(front.controls))
    small = synthetic.front_figure(lean=2.0, shoulder_drop=2.0)
    higher = fixes.plan(small.controls, "uneven_shoulders", "full", shoulder="higher")
    assert higher.after.points["left_shoulder"] == small.controls.points["left_shoulder"]
    lower = fixes.plan(small.controls, "uneven_shoulders", "full", shoulder="lower")
    assert lower.after.points["right_shoulder"] == small.controls.points["right_shoulder"]
    assert fixes.j11_check(fixes.plan(small.controls, "uneven_shoulders", "normal", shoulder="both"))["passed"]
    with pytest.raises(ValueError, match="higher, lower or both"):
        fixes.plan(small.controls, "uneven_shoulders", shoulder="left")
    with pytest.raises(ValueError, match="side view"):
        fixes.plan(front.controls, "slouch")
    with pytest.raises(ValueError):
        fixes.plan(front.controls, "lean", 2.0)
    with pytest.raises(ValueError, match="cap share"):
        fixes.plan(front.controls, "lean", cap_share=0.5)


def test_side_fixes_follow_the_plan_targets(side):
    forward = synthetic.side_figure(head_forward=2.0, round_shoulder=12.0, sway=1.0)
    rounded = fixes.plan(forward.controls, "rounded_shoulders", "normal", cap_share=0.2)
    assert rounded.reduction == pytest.approx(0.5, abs=1e-9)          # halfway at Normal
    head = fixes.plan(side.controls, "forward_head", "full", cap_share=0.2)
    assert head.measure_after == pytest.approx(0.0, abs=1e-9)        # ear above the shoulder at Full
    slouch = fixes.plan(side.controls, "slouch", "full", cap_share=0.2)
    assert slouch.reduction == pytest.approx(0.5, abs=1e-9)
    pelvic = fixes.plan(side.controls, "pelvic_tilt", "full", cap_share=0.2)
    assert pelvic.reduction == pytest.approx(0.4, abs=1e-9)
    assert any("not a measurement" in n for n in pelvic.notes)
    no_ankle = synthetic.side_figure(sway=6.0, ankle=False)
    assert any("knee stands in" in n for n in fixes.plan(no_ankle.controls, "swayback").notes)


def test_render_keeps_outside_band_fold_free_and_grid_straight(front):
    p = fixes.plan(front.controls, "lean", "normal")
    out = render.render(front.image, front.person, p)
    assert q1_outside_mask(front.image, out.image, out.band).passed
    assert fold.fold_report(out.field).passed
    assert q12_straight_lines(out.image, out.band, **front.grid).passed
    assert 0 < out.strength_used <= 1
    wide = render.render(front.image, front.person, p, band_share=0.05, fill="none")
    assert wide.strength_used >= out.strength_used
    achieved = render.achieved_points(p, out.strength_used)
    assert set(achieved) == set(p.moves)


def test_render_identity_and_errors(side):
    still = render.render(side.image, side.person, fixes.plan(side.controls, "swayback", "normal", cap_share=0.06))
    assert still.metrics["version"] == render.VERSION
    with pytest.raises(ValueError, match="empty"):
        render.render(side.image, np.zeros(side.person.shape, np.float32), fixes.plan(side.controls, "forward_head"))
    with pytest.raises(ValueError, match="another size"):
        render.render(np.zeros((50, 50, 3), np.uint8), np.ones((50, 50), np.float32), fixes.plan(side.controls, "forward_head"))
    with pytest.raises(ValueError, match="fill"):
        render.render(side.image, side.person, fixes.plan(side.controls, "forward_head"), fill="smear")
    with pytest.raises(ValueError, match="band share"):
        render.band_px(100, 0.5)


def test_approximate_person_covers_the_skeleton(front, side):
    for fig in (front, side):
        area = render.approximate_person(fig.controls)
        for name in fig.controls.names:
            x, y = (int(round(v)) for v in fig.controls.points[name])
            if name != "ankle":
                assert area[min(y, area.shape[0] - 1), min(x, area.shape[1] - 1)] > 0.5, name
    assert math.isclose(float(render.approximate_person(front.controls).max()), 1.0)
