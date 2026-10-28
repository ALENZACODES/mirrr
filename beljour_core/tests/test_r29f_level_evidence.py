"""Frame evidence comes from final pixels: changed counts, alpha and region contracts.

Invented arrays only. Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.commerce.level_evidence import (
    FIVE_LEVELS,
    FrameEvidence,
    FrameEvidenceError,
    frame_evidence,
    refused_evidence,
    totals,
)


def frames() -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    before = np.full((10, 12, 4), 100, dtype=np.uint8)
    region = np.zeros((10, 12), dtype=bool)
    region[2:6, 3:9] = True
    after = before.copy()
    after[2:4, 3:9, :3] = (110, 100, 90)
    return before, after, region


def measure(before: np.ndarray, after: np.ndarray, region: np.ndarray, level: float = 3.0) -> FrameEvidence:
    return frame_evidence(before, after, region, level, similarity=0.99, blended=False, guard_applied=True)


def test_counts_and_deltas_come_from_changed_pixels() -> None:
    before, after, region = frames()
    evidence = measure(before, after, region)
    assert evidence.status == "rendered"
    assert evidence.changed_pixels == 12 and evidence.region_pixels == 24
    assert evidence.changed_share == 0.5
    assert evidence.max_delta == 10
    assert evidence.mean_delta == round(20 / 3 / 255, 4)


def test_identical_output_is_unchanged_not_rendered() -> None:
    before, _, region = frames()
    evidence = measure(before, before.copy(), region, 1.0)
    assert evidence.status == "unchanged" and evidence.changed_pixels == 0
    assert evidence.mean_delta == 0.0 and evidence.max_delta == 0


def test_alpha_change_is_a_contract_error() -> None:
    before, after, region = frames()
    after[0, 0, 3] = 7
    with pytest.raises(FrameEvidenceError) as caught:
        measure(before, after, region)
    assert caught.value.code == "alpha_changed"


def test_edit_outside_region_is_a_protected_change() -> None:
    before, after, region = frames()
    after[9, 11, 0] = 0
    with pytest.raises(FrameEvidenceError) as caught:
        measure(before, after, region)
    assert caught.value.code == "protected_change"


@pytest.mark.parametrize("change", ["shape", "dtype", "mask"])
def test_mismatched_frames_are_refused(change: str) -> None:
    before, after, region = frames()
    if change == "shape":
        after = after[:, :-1]
    elif change == "dtype":
        after = after.astype(np.float32)
    else:
        region = region.astype(np.uint8)
    with pytest.raises(FrameEvidenceError):
        measure(before, after, region)


@pytest.mark.parametrize("similarity", [float("nan"), -0.1, 1.5])
def test_similarity_must_be_a_fraction(similarity: float) -> None:
    before, after, region = frames()
    with pytest.raises(FrameEvidenceError):
        frame_evidence(before, after, region, 2.0, similarity=similarity, blended=False, guard_applied=True)


def test_refusals_keep_their_code_and_no_pixel_claims() -> None:
    refused = refused_evidence(4.0, "no_mesh", 24)
    assert refused.status == "refused" and refused.refusal_code == "no_mesh"
    assert refused.identity_similarity is None and refused.guard_applied is False
    with pytest.raises(ValueError):
        refused_evidence(4.0, "")


def test_totals_need_the_five_stops_in_order() -> None:
    before, after, region = frames()
    rows = (measure(before, before, region, 1.0), *(measure(before, after, region, level)
                                                    for level in FIVE_LEVELS[1:4]),
            refused_evidence(5.0, "no_scalp"))
    counted = totals(rows)
    assert (counted.rendered, counted.unchanged, counted.refused, counted.cases) == (3, 1, 1, 5)
    with pytest.raises(ValueError):
        totals(rows[:4])
    with pytest.raises(ValueError):
        totals(tuple(reversed(rows)))


@pytest.mark.parametrize("level", [0.5, 2.05, True, "3"])
def test_levels_use_the_strict_strength_scale(level: object) -> None:
    before, after, region = frames()
    with pytest.raises(ValueError):
        frame_evidence(before, after, region, level, similarity=1.0, blended=False, guard_applied=True)
