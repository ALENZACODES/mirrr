"""W28 first-session lift on dark, medium and light synthetic hair.

The unmodified real-face pass definition remains authoritative. These
synthetic checks expose the previous low-lift defect but do not replace the
external 225-face measurement. Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.shade.colourspace import srgb_to_lab
from plumb_api.engines.women_styling.top_five import BrushStroke
from plumb_api.engines.women_styling.top_five import TopFiveRequest
from plumb_api.engines.women_styling.top_five import edit_top_five

H = 72
W = 80
STROKE = BrushStroke(0.20, 0.08, 0.78, 0.92, 0.35)


def synthetic_hair(base: int) -> tuple[np.ndarray, np.ndarray]:
    image = np.full((H, W, 4), base, dtype=np.uint8)
    image[..., 3] = 199
    mask = np.zeros((H, W), dtype=np.uint8)
    mask[9:62, 10:70] = 255
    return image, mask


@pytest.mark.parametrize("base,depth", [(35, 2), (100, 5), (175, 8)])
def test_balayage_lifts_synthetic_hair_at_all_three_depths(base: int, depth: int) -> None:
    image, mask = synthetic_hair(base)
    reference = image.copy()
    req = TopFiveRequest("W28", 100, (190, 175, 160), "daylight", depth, False, (STROKE,))
    result = edit_top_five(image, mask, req)
    xx = np.indices(mask.shape)[1]
    centre = (mask != 0) & (xx > 28) & (xx < 52)
    previous = float(np.mean(srgb_to_lab(image[centre, :3])[:, 0]))
    lifted = float(np.mean(srgb_to_lab(result.pixels[centre, :3])[:, 0]))
    # Assumed additional engineering smoke floor; frozen definition is unchanged.
    assert lifted - previous >= 5.0
    assert result.evidence.changed_pixels > 0
    assert result.evidence.max_channel_delta <= result.evidence.max_first_session_lift <= 30
    assert result.evidence.still_her_score == 100
    assert result.evidence.outside_mask_changed == 0
    np.testing.assert_array_equal(image, reference)
    np.testing.assert_array_equal(result.pixels[mask == 0], image[mask == 0])
    np.testing.assert_array_equal(result.pixels[..., 3], image[..., 3])
    assert "simulation" in result.evidence.disclosure


def test_balayage_respects_history_and_user_brush() -> None:
    image, mask = synthetic_hair(70)
    original = image.copy()
    req = TopFiveRequest("W28", 100, strokes=(STROKE,), base_depth=3, previously_coloured=True)
    result = edit_top_five(image, mask, req)
    assert result.evidence.max_first_session_lift == 16
    assert result.evidence.max_channel_delta <= 16
    np.testing.assert_array_equal(image, original)
    with pytest.raises(ValueError, match="painted"):
        edit_top_five(image, mask, TopFiveRequest("W28", 100))


def test_realface_gate_is_not_changed_to_accept_a_synthetic_pass() -> None:
    from pathlib import Path

    definition = Path(__file__).resolve().parents[2] / "tests/realface/pass_definitions_r22c/definitions.py"
    text = definition.read_text(encoding="utf-8")
    assert '"W28", "User-brushed balayage placement preview"' in text
    assert '0, 0, 30, 100, True, True, False, True' in text
