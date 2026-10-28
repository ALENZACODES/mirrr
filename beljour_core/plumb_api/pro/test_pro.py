"""Synthetic, model-free tests for each public Python pro module."""

from __future__ import annotations

import math
import time

import pytest

from plumb_api.pro import (
    Crop,
    CurvePoint,
    Recipe,
    ToneCurves,
    apply_rgba,
    channel_luts,
    export_plan,
    inverse_point,
    make_lut,
    plan,
    safe_name,
    within_crop,
)
from plumb_api.pro.contracts import PRESETS
from plumb_api.pro.geometry import image_size


def test_contracts_reject_invalid_curves() -> None:
    for pts in (
        (CurvePoint(0.1, 0), CurvePoint(1, 1)),
        (CurvePoint(0, 0), CurvePoint(0.5, 0.7), CurvePoint(0.5, 0.8), CurvePoint(1, 1)),
        (CurvePoint(0, 0), CurvePoint(0.5, 0.9), CurvePoint(1, 0.5)),
    ):
        with pytest.raises(ValueError):
            ToneCurves(master=pts)
    with pytest.raises(ValueError):
        CurvePoint(float("nan"), 0)
    with pytest.raises(ValueError):
        Crop(x=0.9, width=0.4)
    with pytest.raises(ValueError):
        Crop(rotation=181)
    with pytest.raises(ValueError):
        Crop(aspect="bad")  # type: ignore[arg-type]
    with pytest.raises(ValueError):
        Recipe(export="bad")  # type: ignore[arg-type]


def test_curves_identity_monotonicity_and_alpha() -> None:
    identity = make_lut(ToneCurves().master)
    assert identity == tuple(range(256))
    points = (CurvePoint(0, 0), CurvePoint(0.25, 0.12), CurvePoint(0.6, 0.8), CurvePoint(1, 1))
    curve = make_lut(points)
    assert curve[0] == 0 and curve[-1] == 255
    assert all(x <= y for x, y in zip(curve, curve[1:], strict=False))
    recipe = ToneCurves(red=points)
    data = bytes((50, 70, 150, 9, 100, 80, 120, 241))
    output = apply_rgba(data, 2, 1, recipe)
    assert output[0] == channel_luts(recipe)[0][50]
    assert output[1:4] == data[1:4]
    assert output[-1] == 241
    assert data[0] == 50
    with pytest.raises(ValueError):
        apply_rgba(data, 1, 1, recipe)


def test_geometry_center_aspect_rotation_and_limits() -> None:
    geom = plan(1200, 800, Crop(aspect="square"))
    assert geom.crop_width == geom.crop_height == 800
    assert geom.x == 200 and geom.y == 0
    assert inverse_point(geom, 399.5, 399.5) == pytest.approx((600, 400))
    quarter_turn = plan(800, 400, Crop(rotation=90))
    assert (quarter_turn.out_width, quarter_turn.out_height) == (400, 800)
    assert within_crop(quarter_turn, *inverse_point(quarter_turn, 199.5, 399.5))
    free = plan(1000, 600, Crop(rotation=45))
    assert free.out_width > 1000 and free.out_height > 600
    small = plan(3000, 4000, Crop(), PRESETS["web"])
    assert max(small.out_width, small.out_height) == 1600
    with pytest.raises(ValueError):
        image_size(4000, 4000)
    with pytest.raises(ValueError):
        image_size(0, 2)
    with pytest.raises(ValueError):
        image_size(True, 2)


def test_export_presets_and_simulation_label_default() -> None:
    spec = export_plan(3000, 4000, Recipe(), "Été / Before & after")
    assert spec.name == "Ete-Before-after.jpg"
    assert spec.label == "Simulation"
    assert spec.mime == "image/jpeg"
    assert spec.geometry.out_width == 3000 and spec.geometry.out_height == 4000
    lossless = export_plan(3000, 4000, Recipe(export="lossless", simulation_label=False))
    assert lossless.label is None
    assert lossless.mime == "image/png" and lossless.name.endswith(".png")
    assert safe_name("../\\?\x00") == "look"
    assert math.isfinite(spec.geometry.crop_width)


def test_preview_planning_budget_under_100_ms() -> None:
    """Measures planning and 256-entry LUT preparation, not device GPU draw time."""
    curves = ToneCurves(red=(CurvePoint(0, 0), CurvePoint(0.5, 0.7), CurvePoint(1, 1)))
    start = time.perf_counter()
    for _ in range(20):
        plan(640, 480, Crop(rotation=2.25, aspect="portrait"))
        channel_luts(curves)
    elapsed_ms = (time.perf_counter() - start) * 1000 / 20
    assert elapsed_ms < 100, f"plan+LUT preview budget exceeded: {elapsed_ms:.2f}ms"


def test_export_planning_budget_under_two_seconds_12_mp() -> None:
    """Preflight only; actual 12 MP browser encode has a separate Node test."""
    start = time.perf_counter()
    for _ in range(100):
        spec = export_plan(3000, 4000, Recipe(crop=Crop(rotation=0)), "synthetic")
        assert spec.geometry.out_width * spec.geometry.out_height == 12_000_000
    elapsed = time.perf_counter() - start
    assert elapsed < 2.0, f"12 MP export preflight budget exceeded: {elapsed:.3f}s"
