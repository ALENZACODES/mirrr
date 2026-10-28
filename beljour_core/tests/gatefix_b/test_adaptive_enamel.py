"""Generated mouth palettes and mesh-only closure tests for local tooth treatment.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.shade.colourspace import srgb_to_lab
from plumb_api.engines.teeth import mouth_state, whiten

TONES = (
    (226, 188, 155),
    (196, 145, 112),
    (151, 104, 74),
    (96, 57, 41),
    (53, 32, 27),
)
ENAMELS = (
    (235, 228, 213),
    (204, 192, 167),
    (213, 175, 120),
    (164, 158, 169),
)
LIGHTS = (
    (1.0, 1.0, 1.0),
    (0.55, 0.55, 0.55),
    (0.76, 0.65, 0.51),
    (0.73, 0.85, 1.0),
)


def scene(skin: tuple[int, int, int], enamel: tuple[int, int, int] | None,
          illumination: tuple[float, float, float]) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """A code-drawn mouth: inner lip, dark oral cavity, enamel and tongue."""
    image = np.empty((88, 100, 3), dtype=np.uint8)
    image[:] = skin
    image[32:59, 26:77] = np.asarray(skin, dtype=np.float64) * 0.67
    image[36:55, 31:72] = (25, 15, 20)
    image[48:54, 40:62] = (128, 52, 73)
    enamel_mask = np.zeros(image.shape[:2], dtype=bool)
    if enamel is not None:
        image[38:46, 37:67] = enamel
        enamel_mask[38:46, 37:67] = True
    mouth = np.zeros(image.shape[:2], dtype=np.float64)
    mouth[36:55, 31:72] = 1.0
    image = np.rint(np.clip(image.astype(np.float64) * illumination, 0, 255)).astype(np.uint8)
    return image, mouth, enamel_mask


@pytest.mark.parametrize("skin_index", range(len(TONES)))
@pytest.mark.parametrize("enamel", ENAMELS)
@pytest.mark.parametrize("lighting", LIGHTS)
def test_open_mouth_finds_only_enamel_with_warmth_floor(
        skin_index: int, enamel: tuple[int, int, int],
        lighting: tuple[float, float, float]) -> None:
    image, opening, teeth = scene(TONES[skin_index], enamel, lighting)
    before = image.tobytes()
    result = whiten.whiten(image, opening, strength=92.0, mouth_state="open")
    assert result.status == "edited", (skin_index, enamel, lighting, result.reason_code)
    assert result.changed >= 8
    assert result.reason_code == "edited"
    assert np.count_nonzero(result.alpha) == result.changed
    assert np.array_equal(result.image[~teeth], image[~teeth])
    assert np.array_equal(result.image[result.alpha == 0], image[result.alpha == 0])
    assert float(srgb_to_lab(result.image)[..., 2][result.alpha > 0].min()) >= 3.75
    assert before == image.tobytes()


@pytest.mark.parametrize("skin", TONES)
def test_tongue_only_is_refused_without_pixel_change(skin: tuple[int, int, int]) -> None:
    image, opening, _ = scene(skin, None, (1.0, 1.0, 1.0))
    result = whiten.whiten(image, opening, mouth_state="open")
    assert result.changed == 0
    assert result.status == "refused"
    assert result.reason_code == "no_teeth_visible"
    assert result.image.tobytes() == image.tobytes()


def test_closed_mouth_typed_na_and_original_bytes() -> None:
    image, opening, _ = scene(TONES[0], ENAMELS[0], LIGHTS[0])
    result = whiten.whiten(image, opening, strength=100, mouth_state="closed")
    assert result.status == "not_applicable"
    assert result.reason_code == "mouth_closed"
    assert result.not_applicable
    assert result.changed == 0
    assert result.image.tobytes() == image.tobytes()


@pytest.mark.parametrize("relative_gap,expected", [(0.0, "closed"), (0.039, "closed"),
                                                    (0.04, "open"), (0.18, "open")])
def test_mesh_observation_is_scale_invariant(relative_gap: float, expected: str) -> None:
    points = np.zeros((478, 2), dtype=np.float64)
    points[61] = [20, 55]
    points[291] = [60, 55]
    points[13] = [40, 50]
    points[14] = [40, 50 + relative_gap * 40]
    got = mouth_state.observe(points)
    assert got.state == expected
    assert got.reason_code == ("mouth_closed" if expected == "closed" else "observed_open")
    assert mouth_state.observe(points * 0.01).state == expected


@pytest.mark.parametrize("wrong", [np.zeros((450, 2)), np.full((478, 2), np.nan),
                                   np.zeros((478, 2))])
def test_unreliable_mesh_is_rejected(wrong: np.ndarray) -> None:
    with pytest.raises(ValueError):
        mouth_state.observe(wrong)


def test_closed_state_ignores_stale_opening_evidence() -> None:
    image, opening, _ = scene(TONES[2], ENAMELS[1], LIGHTS[0])
    for invalid in (opening[:5, :5], np.full_like(opening, np.nan)):
        result = whiten.whiten(image, invalid, mouth_state="closed")
        assert result.not_applicable
        assert result.image.tobytes() == image.tobytes()


def test_mesh_gap_ignores_horizontal_lip_motion_and_face_rotation() -> None:
    points = np.zeros((478, 2), dtype=np.float64)
    points[61] = (20.0, 60.0)
    points[291] = (60.0, 60.0)
    points[13] = (40.0, 50.0)
    points[14] = (48.0, 51.0)
    assert mouth_state.observe(points).state == "closed"
    rotation = np.asarray([[0.0, -1.0], [1.0, 0.0]], dtype=np.float64)
    assert mouth_state.observe(points @ rotation).state == "closed"
    points[14] = (48.0, 57.0)
    assert mouth_state.observe(points).state == "open"
    assert mouth_state.observe(points @ rotation).state == "open"
