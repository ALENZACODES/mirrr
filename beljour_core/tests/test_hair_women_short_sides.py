"""R25c mask-limited short-side consultation rendering. Author: John Khan."""

from __future__ import annotations

import numpy as np
import pytest
from numpy.typing import NDArray

from plumb_api.engines.gender_look.levels import GuardDecision
from plumb_api.engines.hair_women.contracts import HairGeometry
from plumb_api.engines.hair_women.short_sides import STYLES, TEXTURES, HairStyleSession, render_style

ByteImage = NDArray[np.uint8]


def scene(tone: int = 80) -> tuple[ByteImage, NDArray[np.float64], HairGeometry]:
    yy, xx = np.mgrid[:64, :64]
    photo = np.zeros((64, 64, 4), dtype=np.uint8)
    photo[..., 0] = ((tone + 2 * xx + yy) % 256).astype(np.uint8)
    photo[..., 1] = ((tone + xx + 3 * yy) % 256).astype(np.uint8)
    photo[..., 2] = ((tone + 3 * xx + yy) % 256).astype(np.uint8)
    photo[..., 3] = 255
    hair = ((yy >= 7) & (yy <= 59) & (xx >= 6) & (xx <= 57)).astype(float)
    geometry = HairGeometry((0.5, 0.06), (0.25, 0.32), (0.75, 0.32), (0.5, 0.91), 0.5, 0.85)
    return photo, hair, geometry


class PassThrough:
    def guard(self, before: ByteImage, after: ByteImage, lock_level: float) -> GuardDecision:
        return GuardDecision(after.copy(), 1.0, False)


@pytest.mark.parametrize("style", STYLES)
@pytest.mark.parametrize("texture", TEXTURES)
def test_short_side_coverage_monotone_across_levels(style: str, texture: str) -> None:
    original, hair, landmarks = scene()
    previous = -1
    for level in (1.0, 1.5, 2.0, 3.5, 5.0):
        result = render_style(original, hair, landmarks, style, level, texture=texture,
                              primary_face_box=(0, 0, 1, 1), identity_guard=PassThrough())
        assert result.status == "rendered"
        assert result.rendered
        count = int(np.count_nonzero(result.coverage))
        assert count >= previous
        previous = count
        assert np.array_equal(result.image[..., 3], original[..., 3])
        assert np.array_equal(result.image[hair == 0], original[hair == 0])
        if level == 1:
            assert np.array_equal(result.image, original)
        if level == 5:
            assert result.changed_pixel_share > 0
    assert previous > 0


@pytest.mark.parametrize("style", STYLES)
def test_identity_lock_is_used_even_at_strongest_level(style: str) -> None:
    original, hair, geometry = scene(99)
    actual = render_style(original, hair, geometry, style, 5, primary_face_box=(0, 0, 1, 1))
    assert actual.guard_called
    assert actual.status == "rendered"
    assert actual.simulation_label.lower().find("simulation") >= 0
    assert np.array_equal(actual.image[..., 3], original[..., 3])


def test_two_face_frame_cannot_modify_unselected_person() -> None:
    original, hair, geometry = scene()
    result = render_style(original, hair, geometry, "pixie_taper", 5,
                          primary_face_box=(0, 0, 0.5, 1), identity_guard=PassThrough())
    assert np.array_equal(result.image[:, 32:], original[:, 32:])
    assert result.changed_pixel_share > 0


def test_no_landmarks_produces_refusal_without_fabricating_a_mask() -> None:
    image, hair, _ = scene()
    refused = render_style(image, hair, None, "bixie", 5, primary_face_box=(0, 0, 1, 1))
    assert refused.status == "no_mesh"
    assert refused.guard_called is False
    assert refused.rendered is False
    assert np.array_equal(refused.image, image)


@pytest.mark.parametrize("level", [0.95, 2.25, 5.1, float("nan")])
def test_invalid_levels_fail_closed(level: float) -> None:
    image, hair, geometry = scene()
    with pytest.raises(ValueError):
        render_style(image, hair, geometry, "pixie_taper", level, primary_face_box=(0, 0, 1, 1))


def test_explicit_side_mask_may_be_used_but_outside_union_is_unchanged() -> None:
    image, hair, geometry = scene()
    hair[:, :22] = 0
    extra = np.zeros(hair.shape, dtype=float)
    extra[10:57, 8:20] = 1
    result = render_style(image, hair, geometry, "side_undercut", 5, side_mask=extra,
                          primary_face_box=(0, 0, 1, 1), identity_guard=PassThrough())
    assert np.array_equal(result.image[(hair + extra) == 0], image[(hair + extra) == 0])
    assert np.any(result.coverage[extra > 0] > 0)


def test_cached_geometry_is_reused_for_five_slider_changes_and_mask_correction() -> None:
    image, hair, geometry = scene(103)
    session = HairStyleSession(max_styles=2)
    for level in (1, 1.7, 2, 3.5, 5):
        cached = session.render(image, hair, geometry, "pixie_taper", level,
                                primary_face_box=(0, 0, 1, 1), identity_guard=PassThrough())
        uncached = render_style(image, hair, geometry, "pixie_taper", level,
                                primary_face_box=(0, 0, 1, 1), identity_guard=PassThrough())
        assert np.array_equal(cached.image, uncached.image)
    assert session.zone_computations == 1
    corrected = hair.copy()
    corrected[:, :35] = 0
    after_correction = session.render(image, corrected, geometry, "pixie_taper", 5,
                                      primary_face_box=(0, 0, 1, 1), identity_guard=PassThrough())
    assert session.zone_computations == 1
    assert np.array_equal(after_correction.image[:, :35], image[:, :35])
    session.clear()
    _ = session.render(image, corrected, geometry, "pixie_taper", 5,
                       primary_face_box=(0, 0, 1, 1), identity_guard=PassThrough())
    assert session.zone_computations == 2
