"""Small synthetic samples verify brush, gradients and Python/TS mask contracts."""

from __future__ import annotations

from dataclasses import replace

import pytest

from plumb_api.pro import (
    Brush,
    Linear,
    Point,
    Radial,
    Recipe,
    ToneCurves,
    channel_luts,
    coverage_at,
    decode_recipe,
    encode_recipe,
    masked_rgba,
    sample_mask,
    validate_masks,
)


def test_masks_validate_shape_and_numeric_limits() -> None:
    with pytest.raises(ValueError):
        Brush(points=(), radius=0.1)
    with pytest.raises(ValueError):
        Brush(points=(Point(0.5, 0.5),) * 49, radius=0.1)
    with pytest.raises(ValueError):
        Brush(points=(Point(0.5, 0.5),), radius=float("nan"))
    with pytest.raises(ValueError):
        Brush(points=(Point(0.5, 0.5),), radius=0.1, hardness=-0.1)
    with pytest.raises(ValueError):
        Point(1.1, 0.5)
    with pytest.raises(ValueError):
        Radial(Point(0.5, 0.5), 0.0, 0.2)
    with pytest.raises(ValueError):
        Linear(Point(0.5, 0.5), Point(0.5, 0.5))
    with pytest.raises(ValueError):
        Radial(Point(0.5, 0.5), 0.2, 0.2, opacity=1.01)
    with pytest.raises(ValueError):
        Linear(Point(0, 0), Point(1, 0), mode="bad")  # type: ignore[arg-type]
    with pytest.raises(ValueError):
        validate_masks((Radial(Point(0.5, 0.5), 0.2, 0.2),) * 17)


def test_radial_feather_boundary_and_center() -> None:
    mask = Radial(Point(0.5, 0.5), 0.4, 0.4, feather=0.5)
    assert sample_mask(mask, 0.5, 0.5, 100, 100) == 1
    assert sample_mask(mask, 1, 1, 100, 100) == 0
    assert 0 < sample_mask(mask, 0.8, 0.5, 100, 100) < 1
    hard = replace(mask, feather=0)
    assert sample_mask(hard, 0.5, 0.5, 100, 100) == 1
    assert sample_mask(hard, 1, 0.5, 100, 100) == 0


def test_brush_stroke_segment_distance_and_hardness() -> None:
    mask = Brush((Point(0.2, 0.5), Point(0.8, 0.5)), 0.1)
    assert sample_mask(mask, 0.5, 0.5, 100, 100) == 1
    assert sample_mask(mask, 0.5, 0.99, 100, 100) == 0
    assert 0 < sample_mask(mask, 0.5, 0.58, 100, 100) < 1
    assert sample_mask(Brush((Point(0.2, 0.5),), 0.1), 0.8, 0.5, 100, 100) == 0


def test_linear_gradient_feather_and_hard_boundary() -> None:
    linear = Linear(Point(0.1, 0.5), Point(0.9, 0.5), feather=1)
    assert sample_mask(linear, 0, 0.5, 100, 100) == 0
    assert sample_mask(linear, 1, 0.5, 100, 100) == 1
    assert sample_mask(linear, 0.5, 0.5, 100, 100) == pytest.approx(0.5)
    hard = replace(linear, feather=0)
    assert sample_mask(hard, 0.2, 0.5, 100, 100) == 0
    assert sample_mask(hard, 0.8, 0.5, 100, 100) == 1


def test_mask_add_subtract_and_opacity_order() -> None:
    full = Radial(Point(0.5, 0.5), 1, 1, feather=0)
    erase = Radial(Point(0.5, 0.5), 0.15, 0.15, feather=0, mode="subtract")
    assert coverage_at((full, erase), 0.5, 0.5, 100, 100) == 0
    assert coverage_at((full, erase), 0.5, 0.1, 100, 100) == 255
    assert coverage_at((full, replace(erase, opacity=0.5)), 0.5, 0.5, 100, 100) in (127, 128)
    assert coverage_at((), 0.5, 0.5, 100, 100) == 255


def test_masked_rgb_keeps_alpha_and_source_unmodified() -> None:
    from plumb_api.pro import CurvePoint

    curves = ToneCurves(master=(CurvePoint(0, 0), CurvePoint(0.5, 0.8), CurvePoint(1, 1)))
    red_lut, green_lut, blue_lut = channel_luts(curves)
    luts = (red_lut, green_lut, blue_lut)
    original = bytes((70, 80, 90, 255, 70, 80, 90, 255, 70, 80, 90, 0, 70, 80, 90, 66))
    selection = Linear(Point(0.25, 0.5), Point(0.5, 0.5), feather=0)
    changed = masked_rgba(original, 4, 1, (selection,), luts)
    assert changed[0:4] == original[0:4]
    assert changed[4] > original[4]
    assert changed[8:12] == original[8:12]
    assert changed[12] > original[12] and changed[15] == 66
    assert original[4] == 70
    with pytest.raises(ValueError):
        masked_rgba(original, 1, 1, (), luts)


def test_mask_recipe_round_trip_legacy_and_bad_json() -> None:
    import json

    masks = (
        Brush((Point(0.2, 0.2), Point(0.8, 0.8)), 0.15, hardness=0.5),
        Linear(Point(0.1, 0.5), Point(0.9, 0.5)),
        Radial(Point(0.5, 0.5), 0.3, 0.4),
    )
    recipe = Recipe(masks=masks)
    encoded = encode_recipe(recipe)
    assert decode_recipe(encoded) == recipe
    assert '"radiusX"' in encoded and '"radius_x"' not in encoded
    data = json.loads(encoded)
    del data["recipe"]["masks"]
    assert decode_recipe(json.dumps(data)).masks == ()
    data = json.loads(encoded)
    data["recipe"]["masks"][0]["unexpected"] = "bad"
    with pytest.raises(ValueError):
        decode_recipe(json.dumps(data))
    data = json.loads(encoded)
    data["recipe"]["masks"][2]["radiusX"] = 1.5
    with pytest.raises(ValueError):
        decode_recipe(json.dumps(data))
    data = json.loads(encoded)
    data["recipe"]["masks"] = [{}] * 17
    with pytest.raises(ValueError):
        decode_recipe(json.dumps(data))


def test_masks_remain_anchored_after_crop_and_quarter_turn() -> None:
    from plumb_api.pro import Crop, inverse_point, plan

    geometry = plan(200, 100, Crop(x=0.1, y=0.1, width=0.8, height=0.8, rotation=90))
    center_source = inverse_point(geometry, (geometry.out_width - 1) / 2,
                                  (geometry.out_height - 1) / 2)
    assert center_source == pytest.approx((100, 50))
    mark = Radial(Point(0.5, 0.5), 0.1, 0.1, feather=0)
    assert coverage_at((mark,), center_source[0] / 200, center_source[1] / 100, 200, 100) == 255
    edge = inverse_point(geometry, 0, 0)
    assert coverage_at((mark,), edge[0] / 200, edge[1] / 100, 200, 100) == 0


def test_reference_mask_paint_is_deterministic_and_bounded() -> None:
    from plumb_api.pro import CurvePoint

    curves = ToneCurves(master=(CurvePoint(0, 0), CurvePoint(0.5, 0.7), CurvePoint(1, 1)))
    data = bytes([70, 80, 90, 255] * (32 * 32))
    mark = Brush((Point(0.5, 0.5),), 0.15, hardness=0.6)
    red_lut, green_lut, blue_lut = channel_luts(curves)
    luts = (red_lut, green_lut, blue_lut)
    first = masked_rgba(data, 32, 32, (mark,), luts)
    second = masked_rgba(data, 32, 32, (mark,), luts)
    assert first == second
    assert first[:4] == data[:4]
    middle = 4 * (16 * 32 + 16)
    assert first[middle] > data[middle]
    assert all(first[index] == 255 for index in range(3, len(first), 4))
