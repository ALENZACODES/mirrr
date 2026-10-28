"""Regression tests for defects found in review, one test per finding.

Author: John Khan.
"""

from __future__ import annotations

import itertools
import math
from datetime import date

import numpy as np
import pytest

from plumb_api.seasonal.packs import (
    FaceBox,
    FaceLandmarks,
    FaceTarget,
    Look,
    LookKind,
    PackError,
    PackRegistry,
    Palette,
    RenderRequest,
    SeasonalPack,
    apply_look,
    is_forbidden,
    next_occurrence,
    occurrences_between,
    register_renderer,
    suggest,
)
from plumb_api.seasonal.packs.calendar import MAX_YEAR, MIN_YEAR, CalendarError
from plumb_api.seasonal.packs.grades import LUMA, GradeSettings, grade_array, never_brighter
from plumb_api.seasonal.packs.hebrew import hanukkah_start
from plumb_api.seasonal.packs.particles import MAX_FRAME
from plumb_api.seasonal.packs.raster import ImageArray
from plumb_api.seasonal.packs.render import renderer_names
from plumb_api.seasonal.packs.synthetic import background, single
from plumb_api.seasonal.packs.target import protected_mask, region_mask

PALETTE = Palette("#224466", "#446688", "#ffcc00", "#0a0a0a", "#fafafa")


def _scribble(request: RenderRequest) -> ImageArray:
    """A badly behaved renderer: tries to write into its input, else paints all."""
    try:
        request.image[:] = 0
        return request.image
    except ValueError:
        return np.zeros_like(request.image)


def _register_scribble() -> PackRegistry:
    for name, kind in (("accessory.test_scribble", LookKind.ACCESSORY),):
        if name not in renderer_names():
            register_renderer(name, kind, _scribble)
    look = Look("scribble", LookKind.ACCESSORY, "Scribble", "accessory.test_scribble")
    registry = PackRegistry()
    registry.register(SeasonalPack("holi", "Holi", PALETTE, (), (look,), "Happy Holi"))
    return registry


def test_foreign_renderer_cannot_touch_the_callers_array_or_bystanders() -> None:
    registry = _register_scribble()
    image, target = single(128)
    before = image.copy()
    out = apply_look(image, "holi", "scribble", target, registry=registry)
    assert np.array_equal(image, before)
    height, width = image.shape[:2]
    outside = ~region_mask(target, width, height) | protected_mask(target, width, height)
    assert np.array_equal(out[outside], before[outside])
    assert out.flags.writeable


def _luma(image: np.ndarray) -> np.ndarray:
    result: np.ndarray = image.astype(np.float64) @ LUMA.astype(np.float64)
    return result


def test_grades_never_raise_integer_luminance_on_any_colour_cube_sample() -> None:
    levels = np.arange(0, 256, 3, dtype=np.uint8)
    cube = np.array(list(itertools.product(levels, levels, levels)), dtype=np.uint8)
    image = cube.reshape(-1, 86, 3)
    for settings in (
        GradeSettings((0.0, 0.0, 0.0), (0.0, 0.0, 0.0), 0.0, 1.0, 0.0, 0.0),
        GradeSettings((0.7, -0.2, -0.5), (-0.5, 0.1, 0.7), 0.3, 0.0, 0.0, 0.0),
        GradeSettings((0.2, 0.2, -0.6), (-0.3, 0.6, -0.3), 0.3, 0.4, 0.3, 0.0),
    ):
        graded = grade_array(image, settings)
        assert (_luma(graded) <= _luma(image)).all()


def test_reported_colour_is_not_brightened() -> None:
    pixel = np.array([[[167, 255, 154]]], dtype=np.uint8)
    settings = GradeSettings((0.0, 0.0, 0.0), (0.0, 0.0, 0.0), 0.0, 1.0, 0.0, 0.0)
    assert (
        _luma(grade_array(np.repeat(np.repeat(pixel, 8, 0), 8, 1), settings)).max()
        <= _luma(pixel).max()
    )


def test_never_brighter_steps_down_only_brighter_pixels() -> None:
    before = np.array([[[100, 100, 100], [50, 60, 70]]], dtype=np.uint8)
    after = np.array([[[101, 101, 101], [40, 60, 70]]], dtype=np.uint8)
    fixed = never_brighter(before, after.copy())
    assert fixed[0, 0].tolist() == [100, 100, 100]
    assert fixed[0, 1].tolist() == [40, 60, 70]


def test_large_face_keeps_the_whole_mouth_ellipse_protected() -> None:
    target = FaceTarget(FaceBox(100.0, 100.0, 1600.0, 1600.0))
    width = height = 1800
    mask = protected_mask(target, width, height)
    mouth = target.mouth_region()
    ys, xs = np.mgrid[0:height, 0:width]
    inside = ((xs + 0.5 - mouth.cx) / mouth.rx) ** 2 + ((ys + 0.5 - mouth.cy) / mouth.ry) ** 2 <= 1
    assert inside.sum() > 1000
    assert mask[inside].all()


def test_large_face_with_landmarks_keeps_the_mouth() -> None:
    marks = FaceLandmarks(
        mouth=tuple(
            (700.0 + 180.0 * math.cos(t), 1000.0 + 60.0 * math.sin(t))
            for t in np.linspace(0, 2 * math.pi, 20, endpoint=False)
        )
    )
    target = FaceTarget(FaceBox(100.0, 300.0, 1200.0, 1200.0), landmarks=marks)
    mask = protected_mask(target, 1400, 1600)
    for x, y in marks.mouth:
        assert mask[int(y), int(x)]


def test_region_mask_never_extends_past_the_rotated_rectangle() -> None:
    for roll, box in ((90.0, FaceBox(250.0, 250.0, 200.0, 200.0)), (0.0, FaceBox(40, 40, 4, 4))):
        target = FaceTarget(box, roll)
        mask = region_mask(target, 800, 800)
        ys, xs = np.nonzero(mask)
        for x, y in zip(xs.tolist(), ys.tolist(), strict=True):
            u, v = target.to_local(x + 0.5, y + 0.5)
            assert abs(u) <= 0.95 + 1e-9 and -1.35 - 1e-9 <= v <= 0.8 + 1e-9


def test_rotated_light_look_stays_inside_the_exact_region() -> None:
    image = background(700, 700)
    target = FaceTarget(FaceBox(250.0, 250.0, 200.0, 200.0), roll=90.0)
    out = apply_look(image, "new_year", "fireworks_bokeh", target, strength=5.0)
    diff = np.any(out != image, axis=2)
    assert not diff[~region_mask(target, 700, 700)].any()


def test_huge_frame_index_is_a_clear_error() -> None:
    image, target = single(64)
    for frame in (MAX_FRAME + 1, 10**309):
        with pytest.raises(PackError, match="frame"):
            apply_look(image, "halloween", "floating_bats", target, frame=frame)
    apply_look(image, "halloween", "floating_bats", target, frame=MAX_FRAME)


@pytest.mark.parametrize("motif", ["angels", "temples", "crosses", "saints", "deities", "halos"])
def test_plural_forbidden_ids_are_caught(motif: str) -> None:
    assert is_forbidden(motif)


@pytest.mark.parametrize("motif", ["glass", "moss", "leaves", "stars", "bats", "angles"])
def test_ordinary_plurals_stay_allowed(motif: str) -> None:
    assert not is_forbidden(motif)


def test_table_occasion_with_a_missing_year_raises() -> None:
    for occasion in ("diwali", "eid_al_fitr", "holi"):
        with pytest.raises(CalendarError, match="2025 is missing"):
            next_occurrence(occasion, date(2025, 6, 1))
    with pytest.raises(CalendarError, match="2031 is missing"):
        next_occurrence("diwali", date(2030, 12, 1))
    assert next_occurrence("diwali", date(2026, 1, 1)).start == date(2026, 11, 8)


def test_suggest_rejects_a_bad_variant_instead_of_hiding_easter() -> None:
    with pytest.raises(CalendarError, match="no variant"):
        suggest(date(2027, 3, 1), window_days=60, variants={"easter": "eastern"})
    with pytest.raises(KeyError):
        suggest(date(2027, 3, 1), variants={"summer": "day"})


def test_years_outside_the_supported_span_are_clear_errors() -> None:
    for day in (date(9999, 11, 1), date(1, 1, 1), date(MAX_YEAR + 1, 1, 1)):
        with pytest.raises(CalendarError, match="supported"):
            suggest(day)
        with pytest.raises(CalendarError, match="supported"):
            next_occurrence("halloween", day)
    with pytest.raises(CalendarError, match="supported"):
        occurrences_between(date(1500, 1, 1), date(1500, 12, 31))
    assert next_occurrence("halloween", date(MIN_YEAR, 1, 1)).start == date(MIN_YEAR, 10, 31)
    assert next_occurrence("easter", date(MAX_YEAR, 1, 1)).start.year == MAX_YEAR


def test_hanukkah_starts_in_its_own_year_across_the_supported_span() -> None:
    for year in range(MIN_YEAR, MAX_YEAR + 1):
        assert hanukkah_start(year).year == year
