"""W39 dark, copper and ash colour shifts across wavy, curly and coily arithmetic strands.

No inference, real photos or measurements of actual dye are included.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.women_styling.top_five import TopFiveRequest
from plumb_api.engines.women_styling.top_five import edit_top_five

H = 72
W = 84
SWATCHES = {
    "hair_dark": (32, 28, 24),
    "hair_copper": (190, 85, 50),
    "hair_ash": (105, 112, 123),
}


def strands(period: int, base: int = 120) -> tuple[np.ndarray, np.ndarray]:
    y, x = np.indices((H, W))
    wave = np.sin((x + 0.6 * np.sin(y / period)) / period * 6.28)
    value = np.clip(base + wave * 18, 0, 255)
    photo = np.zeros((H, W, 4), dtype=np.uint8)
    photo[..., 0] = value.astype(np.uint8)
    photo[..., 1] = np.clip(value * 0.91, 0, 255).astype(np.uint8)
    photo[..., 2] = np.clip(value * 0.82, 0, 255).astype(np.uint8)
    photo[..., 3] = 207
    mask = np.zeros((H, W), dtype=np.uint8)
    mask[8:66, 9:76] = 255
    return photo, mask


@pytest.mark.parametrize("period", [13, 7, 3], ids=["wavy", "curly", "coily"])
@pytest.mark.parametrize("look,shade", SWATCHES.items())
def test_color_swatches_reach_visible_shifts_and_preserve_strands(
    period: int,
    look: str,
    shade: tuple[int, int, int],
) -> None:
    image, hair = strands(period)
    original = image.copy()
    rendered = edit_top_five(image, hair, TopFiveRequest("W39", 100, shade))
    inside = rendered.pixels[hair > 0, :3].astype(np.int16)
    previous = image[hair > 0, :3].astype(np.int16)
    delta = np.mean(inside - previous, axis=0)
    assert np.max(np.abs(delta)) >= 8.0, f"{look} must cause a visible tint"
    if look == "hair_dark":
        assert float(np.mean(delta)) <= -8.0
    if look == "hair_copper":
        assert delta[0] - delta[2] >= 15.0
    if look == "hair_ash":
        assert delta[2] - delta[0] >= 7.0
    assert rendered.evidence.max_channel_delta <= 36
    assert rendered.evidence.silhouette_preserved
    assert rendered.evidence.still_her_score == 100
    np.testing.assert_array_equal(image, original)
    np.testing.assert_array_equal(rendered.pixels[hair == 0], image[hair == 0])
    np.testing.assert_array_equal(rendered.pixels[..., 3], image[..., 3])


def test_neutral_reference_and_zero_strength_remain_unchanged() -> None:
    original, hair = strands(7)
    result = edit_top_five(original, hair, TopFiveRequest("W39", 0, SWATCHES["hair_ash"]))
    np.testing.assert_array_equal(result.pixels, original)
    assert result.evidence.changed_pixels == 0


def test_unknown_realface_results_may_not_be_claimed_as_passes() -> None:
    from pathlib import Path

    path = Path(__file__).resolve().parents[2] / "tests/realface/pass_definitions_r22c/definitions.py"
    text = path.read_text(encoding="utf-8")
    assert "real_face_status: Literal[\"UNPROVEN\"]" in text
