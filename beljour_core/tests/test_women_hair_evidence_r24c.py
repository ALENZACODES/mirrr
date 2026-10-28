"""Measured colour deltas must use Lab, not an unsupported appearance claim.

Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.women_styling.hair_evidence import measure_hair_change
from plumb_api.engines.women_styling.top_five import BrushStroke
from plumb_api.engines.women_styling.top_five import TopFiveRequest
from plumb_api.engines.women_styling.top_five import edit_top_five


@pytest.mark.parametrize('base,depth', [(35, 2), (100, 5), (175, 8)])
def test_w28_lift_has_measured_positive_lstar_without_outside_changes(base: int, depth: int) -> None:
    source = np.full((48, 52, 4), base, dtype=np.uint8)
    source[..., 3] = 223
    mask = np.full((48, 52), 255, dtype=np.uint8)
    stroke = BrushStroke(.10, .15, .90, .85, .35)
    rendered = edit_top_five(source, mask, TopFiveRequest('W28', 100, base_depth=depth, strokes=(stroke,)))
    evidence = measure_hair_change(source, rendered.pixels, mask, 'W28')
    assert evidence.lightness_delta_lstar > 3.0
    assert evidence.changed_hair_pixels > 0
    assert evidence.outside_mask_changed == 0
    assert evidence.alpha_changed == 0
    assert evidence.maximum_channel_delta <= 30
    assert evidence.status == 'UNPROVEN'


@pytest.mark.parametrize('swatch', [(32, 28, 24), (190, 85, 50), (105, 112, 123)])
def test_w39_rgb_and_chroma_are_reported_without_dye_claim(swatch: tuple[int, int, int]) -> None:
    source = np.full((48, 52, 3), 118, dtype=np.uint8)
    mask = np.full((48, 52), 255, dtype=np.uint8)
    rendered = edit_top_five(source, mask, TopFiveRequest('W39', 100, swatch))
    evidence = measure_hair_change(source, rendered.pixels, mask, 'W39')
    assert evidence.changed_hair_pixels == 48 * 52
    assert evidence.chroma_delta_de76 >= 0
    assert evidence.maximum_channel_delta <= 36
    assert evidence.status == 'UNPROVEN'


def test_missing_mask_and_forged_input_shapes_are_refused() -> None:
    source = np.full((24, 28, 3), 90, dtype=np.uint8)
    with pytest.raises(ValueError):
        measure_hair_change(source, source, np.ones((2, 2), np.uint8), 'W28')
    with pytest.raises(ValueError):
        measure_hair_change(source, source, np.zeros((24, 28), np.uint8), 'W39')
    with pytest.raises(ValueError):
        measure_hair_change(source, source.astype(float), np.ones((24, 28), np.uint8), 'W39')


def parity_vectors() -> list[dict[str, object]]:
    """Small runtime-only arithmetic fixtures for cross-language evidence."""
    source = np.full((5, 6, 4), 104, dtype=np.uint8)
    source[..., 3] = 219
    mask = np.ones((5, 6), dtype=np.uint8) * 255
    records: list[dict[str, object]] = []
    for feature, colour in (("W28", (120, 120, 120)), ("W39", (60, 140, 75))):
        after = source.copy()
        after[..., :3] = colour
        report = measure_hair_change(source, after, mask, feature)
        records.append({
            'feature': feature, 'width': 6, 'height': 5,
            'channels': 4, 'source': source.flatten().tolist(),
            'after': after.flatten().tolist(), 'mask': mask.flatten().tolist(),
            'evidence': {
                'lightness_delta_lstar': report.lightness_delta_lstar,
                'chroma_delta_de76': report.chroma_delta_de76,
                'mean_rgb_delta': list(report.mean_rgb_delta),
                'maximum_channel_delta': report.maximum_channel_delta,
            },
        })
    return records


if __name__ == '__main__':
    import json

    print(json.dumps(parity_vectors(), separators=(',', ':')))
