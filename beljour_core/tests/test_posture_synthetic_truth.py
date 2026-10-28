"""Drawn bodies with known offsets, no faces, external images or model downloads."""
from __future__ import annotations

import math

import numpy as np
import pytest

from plumb_api.engines.posture.catalogue import posture_fixes
from plumb_api.engines.posture.fixes import measure
from plumb_api.engines.posture.levels import level_plan
from plumb_api.engines.posture.render import render
from plumb_api.engines.posture.synthetic import FLAT_COLOURS, front_figure, side_figure, truth_cases

MIN_REDUCTION = 0.10


@pytest.mark.parametrize("fix", list(truth_cases()))
def test_every_real_fix_improves_known_deviation_without_overshooting_neutral(fix: str) -> None:
    fig = truth_cases()[fix]
    before = measure(fix, fig.controls)
    plan = level_plan(fig.controls, fix, 5.0)
    after = measure(fix, plan.after)
    assert abs(before) > 1e-6
    assert math.isfinite(after)
    assert abs(after) < abs(before)
    assert math.copysign(1, after) == math.copysign(1, before)
    assert plan.reduction >= MIN_REDUCTION
    assert plan.largest_move_px <= 0.06 * fig.controls.torso_height + 1e-7
    for pinned in plan.pins:
        assert plan.before.points[pinned] == plan.after.points[pinned]


@pytest.mark.parametrize("index", range(7))
def test_neutral_level_preserves_drawn_pixel_bytes(index: int) -> None:
    entry = posture_fixes()[index]
    fig = truth_cases()[entry.fix]
    plan = level_plan(fig.controls, entry.fix, 1.0)
    outcome = render(fig.image, fig.person, plan, fill="none")
    assert outcome.image.dtype == np.uint8
    assert np.max(np.abs(outcome.image.astype(np.int16) - fig.image.astype(np.int16))) <= 1
    assert np.isfinite(outcome.field.map_x).all()
    assert np.isfinite(outcome.field.map_y).all()


@pytest.mark.parametrize("fix", ("lean", "forward_head", "pelvic_tilt"))
def test_full_render_preserves_background_outside_band(fix: str) -> None:
    fig = truth_cases()[fix]
    planned = level_plan(fig.controls, fix, 5.0)
    output = render(fig.image, fig.person, planned, fill="none")
    outside = output.band == 0
    assert np.any(outside)
    assert np.array_equal(output.image[outside], fig.image[outside])
    assert np.isfinite(output.band).all()
    assert np.isfinite(output.strip).all()
    assert output.strength_used > 0
    assert output.label.startswith("Simulation.")


@pytest.mark.parametrize("colour", FLAT_COLOURS)
def test_flat_drawn_tones_are_configurable_and_not_photographs(colour: tuple[float, float, float]) -> None:
    fig = front_figure(lean=4, skin=colour, flat=True, width=128, height=160)
    assert fig.image.shape == (160, 128, 3)
    assert len(fig.controls.points) == 6
    assert fig.person.dtype == np.float32
    assert fig.person.max() == pytest.approx(1.0)
    assert fig.image.min() >= 0 and fig.image.max() <= 255
    assert fig.params["lean"] == 4


@pytest.mark.parametrize("width,height", ((128, 160), (160, 200), (192, 256)))
def test_side_figure_scales_with_photo_size_without_nans(width: int, height: int) -> None:
    fig = side_figure(width, height, slouch=4.0, sway=3.0, flat=True)
    assert fig.image.shape[:2] == (height, width)
    assert math.isfinite(fig.controls.torso_height)
    assert fig.controls.torso_height >= 8
    for xy in fig.controls.points.values():
        assert all(math.isfinite(value) for value in xy)
