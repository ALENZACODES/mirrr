"""W39, W98, W28 invariants, errors, first-session safeguards and bounds.

All frames are synthetic arithmetic arrays, never human images.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from plumb_api.engines.women_styling.top_five import (
    BrushStroke,
    TopFiveRequest,
    edit_top_five,
    first_session_lift,
)


def synthetic_frame(width: int, height: int, channels: int) -> np.ndarray:
    """Produce the original deterministic R22c synthetic RGB(A) scene."""
    rows, columns = np.indices((height, width))
    frame = np.empty((height, width, channels), dtype=np.uint8)
    frame[..., 0] = (columns * 13 + rows * 3 + 68) % 256
    frame[..., 1] = (columns * 9 + rows * 11 + 51) % 256
    frame[..., 2] = (columns * 7 + rows * 17 + 43) % 256
    if channels == 4:
        frame[..., 3] = (columns * 43 + rows * 17 + 111) % 256
    return frame


def synthetic_mask(width: int, height: int, kind: int) -> np.ndarray:
    """Produce the same mixed 125/255 synthetic alpha mask as R22c."""
    rows, columns = np.indices((height, width))
    valid = (columns * 2 + rows + kind) % 7 < 4
    intensity = np.where((columns + rows + kind) % 3 == 0, 125, 255)
    return np.where(valid, intensity, 0).astype(np.uint8)


@pytest.mark.parametrize("feature", ["W39", "W98", "W28"])
@pytest.mark.parametrize("strength", [0, 1, 35, 70, 100])
@pytest.mark.parametrize("channels", [3, 4])
def test_authorized_mask_bounds_original_alpha_and_still_her(
    feature: str, strength: int, channels: int,
) -> None:
    frame = synthetic_frame(29, 27, channels)
    mask = synthetic_mask(29, 27, 2)
    copy = frame.copy()
    mask_copy = mask.copy()
    req = TopFiveRequest(
        feature=feature, strength=strength,
        strokes=(BrushStroke(0.20, 0.15, 0.78, 0.91, 0.23),) if feature == "W28" else (),
        lighting="flash", base_depth=5,
    )
    outcome = edit_top_five(frame, mask, req)
    output = outcome.pixels
    difference = np.any(output[..., :3] != frame[..., :3], axis=2)
    assert np.array_equal(frame, copy)
    assert np.array_equal(mask, mask_copy)
    assert not np.shares_memory(frame, output)
    assert not np.any(difference & (mask == 0))
    if channels == 4:
        assert np.array_equal(output[..., 3], frame[..., 3])
    assert outcome.evidence.outside_mask_changed == 0
    assert outcome.evidence.changed_alpha == 0
    assert outcome.evidence.silhouette_preserved
    assert outcome.evidence.still_her_score == 100
    assert outcome.evidence.provider_calls == 0
    assert "simulation" in outcome.evidence.disclosure
    assert outcome.evidence.changed_pixels == int(np.count_nonzero(difference))
    assert outcome.evidence.max_channel_delta <= (36 if feature == "W39" else 40)
    if strength == 0:
        assert np.array_equal(output, frame)
    elif strength >= 35:
        assert np.any(difference)


@pytest.mark.parametrize("depth,history,expected", [
    (1, False, 22), (4, False, 22), (5, False, 26),
    (7, False, 26), (8, False, 30), (10, False, 30),
    (1, True, 16), (7, True, 16), (10, True, 16),
])
def test_balayage_respects_base_colour_history(
    depth: int, history: bool, expected: int,
) -> None:
    frame = np.full((19, 21, 4), 33, dtype=np.uint8)
    frame[..., 3] = 193
    mask = np.full((19, 21), 255, dtype=np.uint8)
    req = TopFiveRequest(
        "W28", 100, (180, 170, 156), "daylight", depth, history,
        (BrushStroke(0.1, 0.1, 0.9, 0.9, 0.35),),
    )
    output = edit_top_five(frame, mask, req)
    delta = output.pixels[..., :3].astype(np.int16) - frame[..., :3].astype(np.int16)
    assert int(np.max(delta)) <= expected
    assert int(np.min(delta)) >= 0
    assert output.evidence.max_first_session_lift == expected
    assert np.all(output.pixels[..., 3] == 193)


def test_curl_recolour_does_not_change_neutral_hair_luminance_gradients() -> None:
    frame = np.zeros((30, 26, 4), dtype=np.uint8)
    for y in range(30):
        for x in range(26):
            value = (x * 3 + y * 4) % 150 + 35
            frame[y, x, :3] = value
            frame[y, x, 3] = 255
    mask = np.full((30, 26), 255, dtype=np.uint8)
    output = edit_top_five(frame, mask, TopFiveRequest("W39", 80, (74, 160, 125)))
    before = frame[..., :3].astype(np.int16)
    after = output.pixels[..., :3].astype(np.int16)
    # Every pair of adjacent pixels has the same initial spatial order.
    for x in range(25):
        for y in range(29):
            if before[y, x, 0] < before[y + 1, x + 1, 0]:
                assert after[y, x, 0] <= after[y + 1, x + 1, 0]
    assert np.count_nonzero(after != before) > 0


@pytest.mark.parametrize("lighting", ["daylight", "office", "evening", "flash"])
def test_lighting_never_manipulates_geometry_and_can_report_failure(lighting: str) -> None:
    frame = np.full((15, 17, 4), 17, dtype=np.uint8)
    frame[..., 3] = 201
    mask = np.full((15, 17), 255, dtype=np.uint8)
    output = edit_top_five(frame, mask, TopFiveRequest("W98", 100, lighting=lighting))
    if lighting != "flash":
        assert output.evidence.visible_risk
    assert output.pixels.shape == frame.shape
    assert np.array_equal(output.pixels[..., 3], frame[..., 3])
    if lighting == "daylight":
        assert np.array_equal(output.pixels, frame)
    if lighting == "evening":
        assert int(np.mean(output.pixels[..., :3])) < 17


@pytest.mark.parametrize("bad", [
    BrushStroke(-.1, .2, .5, .6, .1),
    BrushStroke(.1, .2, 1.1, .6, .1),
    BrushStroke(.1, .2, .5, .6, 0),
    BrushStroke(.1, .2, .5, .6, .5),
    BrushStroke(float("nan"), .2, .5, .6, .1),
])
def test_invalid_brush_geometry_fails_closed(bad: BrushStroke) -> None:
    req = TopFiveRequest("W28", strokes=(bad,))
    with pytest.raises(ValueError):
        edit_top_five(synthetic_frame(7, 9, 3), synthetic_mask(7, 9, 0), req)


def test_rejects_missing_mask_and_bad_input_types() -> None:
    frame = synthetic_frame(12, 13, 4)
    mask = np.full((13, 12), 255, dtype=np.uint8)
    with pytest.raises(ValueError, match="mask"):
        edit_top_five(frame, np.zeros_like(mask), TopFiveRequest("W39"))
    with pytest.raises(ValueError, match="mask"):
        edit_top_five(frame, mask.astype(np.int32), TopFiveRequest("W39"))
    with pytest.raises(ValueError, match="Strength"):
        edit_top_five(frame, mask, TopFiveRequest("W39", -1))
    with pytest.raises(ValueError, match="RGB"):
        edit_top_five(frame, mask, TopFiveRequest("W39", rgb=(12, 300, 18)))
    with pytest.raises(ValueError, match="painted hair placement"):
        edit_top_five(frame, mask, TopFiveRequest("W28"))
    with pytest.raises(ValueError, match="depth"):
        edit_top_five(frame, mask, TopFiveRequest("W28", base_depth=0))


def test_multiple_overlapping_strokes_do_not_accumulate_lift() -> None:
    frame = np.full((15, 15, 3), 90, dtype=np.uint8)
    mask = np.full((15, 15), 255, dtype=np.uint8)
    stroke = BrushStroke(.1, .1, .9, .9, .3)
    single = TopFiveRequest("W28", 100, strokes=(stroke,))
    repeated = replace(single, strokes=(stroke, stroke, stroke))
    assert np.array_equal(
        edit_top_five(frame, mask, single).pixels,
        edit_top_five(frame, mask, repeated).pixels,
    )
