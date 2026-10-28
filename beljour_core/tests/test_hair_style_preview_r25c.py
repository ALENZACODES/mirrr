"""R25c women hairstyle guarded-render, tiling and caching tests. Author: John Khan."""

from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest
from numpy.typing import NDArray

from plumb_api.engines.gender_look.levels import GuardDecision
from plumb_api.engines.hair_women.contracts import HairGeometry
from plumb_api.engines.hair_women.style_guides import GuideField, STYLE_KEYS, TEXTURES, fields
from plumb_api.engines.hair_women.style_preview import StyleGuideSession, render_style_guide

ByteImage = NDArray[np.uint8]
FloatPlane = NDArray[np.float64]


def scene(tone: int = 54) -> tuple[ByteImage, FloatPlane, HairGeometry]:
    yy, xx = np.mgrid[:64, :64]
    image = np.zeros((64, 64, 4), dtype=np.uint8)
    image[..., 0] = ((tone + 2 * xx + 3 * yy) % 256).astype(np.uint8)
    image[..., 1] = ((tone + xx + yy) % 256).astype(np.uint8)
    image[..., 2] = ((tone + 2 * yy) % 256).astype(np.uint8)
    image[..., 3] = ((xx + 2 * yy + 101) % 256).astype(np.uint8)
    mask = np.zeros((64, 64), dtype=np.float64)
    mask[5:58, 5:59] = 1
    geometry = HairGeometry((0.5, 0.06), (0.25, 0.32), (0.75, 0.32), (0.5, 0.91), 0.5, 0.85)
    return image, mask, geometry


class RecordingGuard:
    def __init__(self, *, mutate: bool = False) -> None:
        self.calls: list[float] = []
        self.mutate = mutate

    def guard(self, before: ByteImage, after: ByteImage, lock_level: float) -> GuardDecision:
        self.calls.append(lock_level)
        if self.mutate:
            before.fill(0)
            after[..., 3] = 0
            after[..., :3] = 255
        return GuardDecision(after.copy(), 0.95, False)


@pytest.mark.parametrize("style", STYLE_KEYS)
@pytest.mark.parametrize("texture", TEXTURES)
def test_each_style_is_a_real_local_masked_edit(style: str, texture: str) -> None:
    image, mask, geometry = scene()
    before_image = image.copy()
    before_mask = mask.copy()
    guard = RecordingGuard()
    result = render_style_guide(image, mask, geometry, style, 5, texture=texture,
                                primary_box=(0, 0, 1, 1), identity_guard=guard)
    assert result.rendered
    assert result.status == "rendered"
    assert result.guard_called
    assert guard.calls == [5]
    assert result.changed_pixel_share > 0
    assert result.simulation_label.lower().find("simulation") != -1
    assert np.array_equal(image, before_image)
    assert np.array_equal(mask, before_mask)
    assert np.array_equal(result.image[..., 3], before_image[..., 3])
    assert np.array_equal(result.image[mask == 0], before_image[mask == 0])


@pytest.mark.parametrize("style", STYLE_KEYS)
def test_all_hairstyles_have_monotone_coverage_and_neutral_level(style: str) -> None:
    image, mask, geometry = scene(89)
    previous = 0
    for level in (1.0, 1.6, 2.0, 3.5, 5.0):
        result = render_style_guide(image, mask, geometry, style, level,
                                    primary_box=(0, 0, 1, 1), identity_guard=RecordingGuard())
        count = int(np.count_nonzero(result.coverage))
        assert count >= previous
        previous = count
        if level == 1.0:
            assert np.array_equal(result.image, image)
            assert result.guard_called
        if level == 5.0:
            assert result.changed_pixel_share > 0
    assert previous > 0


@pytest.mark.parametrize("style", STYLE_KEYS)
def test_tiled_rendering_is_identical_at_multiple_tile_heights(style: str) -> None:
    image, mask, geometry = scene(103)
    reference = render_style_guide(image, mask, geometry, style, 3.5,
                                   primary_box=(0, 0, 1, 1), identity_guard=RecordingGuard(), tile_height=128)
    for tile in (16, 17, 32):
        actual = render_style_guide(image, mask, geometry, style, 3.5,
                                    primary_box=(0, 0, 1, 1), identity_guard=RecordingGuard(), tile_height=tile)
        assert np.array_equal(actual.image, reference.image)
        assert np.array_equal(actual.coverage, reference.coverage)


def test_guard_cannot_change_other_face_alpha_or_user_protected_regions() -> None:
    image, mask, geometry = scene()
    protected = np.zeros(mask.shape, dtype=float)
    protected[11:19, 25:43] = 0.3
    guard = RecordingGuard(mutate=True)
    result = render_style_guide(image, mask, geometry, "swept_crop", 5,
                                protected_mask=protected, primary_box=(0, 0, 0.5, 1), identity_guard=guard)
    assert guard.calls == [5]
    assert np.array_equal(result.image[:, 32:], image[:, 32:])
    assert np.array_equal(result.image[protected > 0], image[protected > 0])
    assert np.array_equal(result.image[..., 3], image[..., 3])
    assert np.array_equal(result.image[mask == 0], image[mask == 0])


def test_explicit_side_region_is_allowed_only_inside_requested_face() -> None:
    image, mask, geometry = scene()
    mask[:, :32] = 0
    side = np.zeros(mask.shape, dtype=float)
    side[8:57, 7:31] = 1
    result = render_style_guide(image, mask, geometry, "crescent_pixie", 5,
                                side_mask=side, primary_box=(0, 0, 0.5, 1), identity_guard=RecordingGuard())
    assert result.changed_pixel_share > 0
    assert np.array_equal(result.image[:, 32:], image[:, 32:])
    assert np.array_equal(result.image[(mask + side) == 0], image[(mask + side) == 0])


def test_missing_landmarks_and_primary_box_refuse_without_side_effects() -> None:
    image, mask, geometry = scene()
    for head, box in ((None, (0, 0, 1, 1)), (geometry, None)):
        result = render_style_guide(image, mask, head, "curly_shag", 5, primary_box=box)
        assert result.status == "no_mesh"
        assert not result.rendered
        assert not result.guard_called
        assert np.array_equal(result.image, image)


def test_empty_hair_selection_refuses_instead_of_guessing_from_rgb() -> None:
    image, mask, geometry = scene()
    mask.fill(0)
    result = render_style_guide(image, mask, geometry, "long_ribbons", 5, primary_box=(0, 0, 1, 1))
    assert result.status == "empty_selection"
    assert result.changed_pixel_share == 0
    assert np.array_equal(result.image, image)


@pytest.mark.parametrize("invalid", [0.95, 2.25, 5.1, float("nan"), 0.0])
def test_strength_must_match_exact_one_tenth_scale(invalid: float) -> None:
    image, mask, geometry = scene()
    with pytest.raises(ValueError):
        render_style_guide(image, mask, geometry, "curtain_fringe", invalid, primary_box=(0, 0, 1, 1))


@pytest.mark.parametrize("bad", [
    (0.3, 0.7, 0.3, 0.9),
    (0, 0, 1.1, 1),
    (float("nan"), 0, 1, 1),
])
def test_invalid_primary_face_scope_is_never_guessed(bad: tuple[float, float, float, float]) -> None:
    image, mask, geometry = scene()
    with pytest.raises(ValueError):
        render_style_guide(image, mask, geometry, "twist_taper", 5, primary_box=bad)


def test_unsupported_texture_and_invalid_masks_are_rejected() -> None:
    image, mask, geometry = scene()
    with pytest.raises(ValueError):
        render_style_guide(image, mask, geometry, "swept_crop", 5,
                           texture="unsupported", primary_box=(0, 0, 1, 1))
    mask[22, 23] = float("inf")
    with pytest.raises(ValueError):
        render_style_guide(image, mask, geometry, "swept_crop", 5, primary_box=(0, 0, 1, 1))


@pytest.mark.parametrize("problem", ("wrong_shape", "nonfinite", "negative_zone", "bad_grade"))
def test_bad_precomputed_guide_is_rejected(problem: str) -> None:
    image, mask, geometry = scene()

    def tampered(*args: object) -> GuideField:
        valid = fields("curly_shag", geometry, 64, 64)
        zone = valid.zone.copy()
        grade = valid.grade.copy()
        if problem == "wrong_shape":
            zone = zone[:12]
        elif problem == "nonfinite":
            grade[12, 12] = np.nan
        elif problem == "negative_zone":
            zone[12, 12] = -0.5
        else:
            grade[13, 13] = 1.25
        return GuideField(zone, grade, valid.tone)

    with pytest.raises(ValueError):
        render_style_guide(image, mask, geometry, "curly_shag", 5, primary_box=(0, 0, 1, 1),
                           guide_factory=tampered)


def test_geometry_cache_counts_operations_and_reuses_five_slider_levels() -> None:
    image, mask, geometry = scene()
    session = StyleGuideSession()
    for level in (1.0, 1.7, 2.0, 3.5, 5.0):
        actual = session.render(image, mask, geometry, "curly_shag", level,
                                primary_box=(0, 0, 1, 1), identity_guard=RecordingGuard(), tile_height=32)
        uncached = render_style_guide(image, mask, geometry, "curly_shag", level,
                                      primary_box=(0, 0, 1, 1), identity_guard=RecordingGuard(), tile_height=32)
        assert np.array_equal(actual.image, uncached.image)
    assert session.computations == 2
    assert 0 < session.retained_bytes <= session.max_bytes
    changed_mask = mask.copy()
    changed_mask[:40, :] = 0
    corrected = session.render(image, changed_mask, geometry, "curly_shag", 5,
                                primary_box=(0, 0, 1, 1), identity_guard=RecordingGuard(), tile_height=32)
    assert session.computations == 2
    assert np.array_equal(corrected.image[:40], image[:40])
    session.clear()
    assert session.retained_bytes == 0


def test_photo_replacement_geometry_change_and_explicit_invalidation() -> None:
    image, mask, geometry = scene(44)
    session = StyleGuideSession()
    session.render(image, mask, geometry, "long_ribbons", 5, primary_box=(0, 0, 1, 1), tile_height=64)
    assert session.computations == 1
    replacement, _, _ = scene(96)
    session.render(replacement, mask, geometry, "long_ribbons", 5,
                   primary_box=(0, 0, 1, 1), tile_height=64)
    assert session.computations == 2
    changed_geometry = replace(geometry, crown=(0.51, 0.06))
    session.render(image, mask, changed_geometry, "long_ribbons", 5,
                   primary_box=(0, 0, 1, 1), tile_height=64)
    assert session.computations == 3
    session.invalidate()
    assert session.retained_bytes == 0
    session.render(image, mask, geometry, "long_ribbons", 5,
                   primary_box=(0, 0, 1, 1), tile_height=64)
    assert session.computations == 4


def test_cache_budget_rejects_invalid_limits_and_bounds_memory() -> None:
    for size in (-1, 0, 1024, 67_108_865):
        with pytest.raises(ValueError):
            StyleGuideSession(size)
    image, mask, geometry = scene()
    session = StyleGuideSession(max_bytes=8192)
    for style in STYLE_KEYS:
        session.render(image, mask, geometry, style, 5,
                       primary_box=(0, 0, 1, 1), tile_height=16)
        assert 0 <= session.retained_bytes <= 8192
