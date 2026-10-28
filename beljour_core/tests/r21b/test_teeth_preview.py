"""Teeth refusal and valid optical simulation use synthetic RGB inputs only."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.teeth import preview


def photo_and_opening() -> tuple[np.ndarray, np.ndarray]:
    image = np.full((28, 32, 3), 75, dtype=np.uint8)
    mask = np.zeros((28, 32), dtype=np.float64)
    image[10:18, 9:23] = (110, 80, 75)
    image[12:16, 12:20] = (212, 197, 171)
    mask[10:18, 9:23] = 1
    return image, mask


@pytest.mark.parametrize("state", ["closed", "unknown"])
def test_closed_or_unverified_mouth_is_refused_without_any_pixel_change(state: str) -> None:
    image, opening = photo_and_opening()
    before = image.tobytes()
    outcome = preview.preview(image, opening, mouth_state=state, level=3.2)
    assert outcome.refused
    assert outcome.status == "refused"
    assert outcome.changed == 0
    assert not outcome.alpha.any()
    assert outcome.image.tobytes() == before
    assert image.tobytes() == before
    assert outcome.image is not image


def test_a_closed_mouth_refuses_even_with_stale_or_invalid_opening_evidence() -> None:
    image, opening = photo_and_opening()
    malformed = [opening[:-2], np.full_like(opening, float("nan")),
                 np.full_like(opening, 1.7), np.zeros((5, 5))]
    for state in ("closed", "unknown"):
        for candidate in malformed:
            outcome = preview.preview(image, candidate, mouth_state=state, level=2.3)
            assert outcome.refused
            assert outcome.reason.startswith("mouth closed" if state == "closed" else "mouth opening")
            assert outcome.changed == 0
            assert np.array_equal(outcome.image, image)
            assert np.array_equal(outcome.alpha, np.zeros(image.shape[:2]))


def test_missing_tiny_or_occluded_mask_refused() -> None:
    image, opening = photo_and_opening()
    tiny = np.zeros_like(opening)
    tiny[12:14, 14:16] = 1
    for invalid in (None, np.zeros_like(opening), tiny):
        result = preview.preview(image, invalid, mouth_state="open")
        assert result.refused
        np.testing.assert_array_equal(result.image, image)
    assert preview.preview(image, opening, mouth_state="closed").reason.startswith("mouth closed")


def test_open_mouth_edits_only_enamel_candidates_at_decimal_level() -> None:
    image, opening = photo_and_opening()
    result = preview.preview(image, opening, mouth_state="open", level=4.2)
    assert result.status == "preview"
    assert not result.refused
    assert result.changed > 0
    assert result.changed < np.count_nonzero(opening)
    assert result.level == 4.2
    np.testing.assert_array_equal(result.image[opening == 0], image[opening == 0])
    np.testing.assert_array_equal(result.image[result.alpha == 0], image[result.alpha == 0])
    assert result.caption.startswith("Teeth colour simulation")
    assert not np.shares_memory(image, result.image)


def test_no_enamel_pixels_return_refusal_with_original() -> None:
    image, opening = photo_and_opening()
    image[12:16, 12:20] = (85, 47, 45)
    result = preview.preview(image, opening, mouth_state="open")
    assert result.status == "refused"
    np.testing.assert_array_equal(result.image, image)


def test_validation_refuses_bad_photographs_masks_and_levels() -> None:
    image, opening = photo_and_opening()
    with pytest.raises(ValueError):
        preview.preview(image.astype(np.float64), opening)
    with pytest.raises(ValueError):
        preview.preview(image, opening[:-1], mouth_state="open")
    with pytest.raises(ValueError):
        preview.preview(image, np.full_like(opening, np.nan), mouth_state="open")
    with pytest.raises(ValueError):
        preview.preview(image, np.full_like(opening, 1.2), mouth_state="open")
    with pytest.raises(ValueError):
        preview.preview(image, opening, mouth_state="incorrect")  # type: ignore[arg-type]
    with pytest.raises(ValueError):
        preview.preview(image, opening, level=3.05)
    with pytest.raises(ValueError):
        preview.preview(image, opening, level=6.0)
