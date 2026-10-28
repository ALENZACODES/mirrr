"""Synthetic ages and respectful occlusion coverage tests.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.synth_diversity.age import apply_age, grey_fraction, wrinkle_weight
from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.overlays import apply_overlays
from lab.synth_diversity.types import AGE_MIDPOINTS


def test_age_cues_are_monotonic_across_declared_bands() -> None:
    weights = [wrinkle_weight(label) for label in AGE_MIDPOINTS]
    greys = [grey_fraction(label) for label in AGE_MIDPOINTS]
    assert weights == sorted(weights)
    assert greys == sorted(greys)
    face = make_drawn_face()
    results = [apply_age(face.image, face, label, 13) for label in AGE_MIDPOINTS]
    assert results[0].grey_hair_coverage == 0
    assert results[0].wrinkle_coverage == 0
    assert results[-1].grey_hair_coverage > results[3].grey_hair_coverage
    assert results[-1].wrinkle_coverage > results[3].wrinkle_coverage


@pytest.mark.parametrize("kind", ["hijab", "turban", "kippah"])
def test_head_coverings_return_masks_and_keep_eyes_visible(kind: str) -> None:
    face = make_drawn_face()
    result = apply_overlays(face.image, face, kind, "none", "none", 12)
    assert result.head_covering_mask.sum() > 50
    for x, y in face.group_points("eyes"):
        assert result.head_covering_mask[int(y), int(x)] <= 0.1
    assert result.parameters["head_covering"] == kind
    if kind == "hijab":
        fraction = float((result.head_covering_mask * face.skin_mask).sum() / face.skin_mask.sum())
        assert fraction <= 0.07


@pytest.mark.parametrize("kind", ["stubble", "short", "full"])
def test_beard_mask_covers_chin_not_eyes(kind: str) -> None:
    face = make_drawn_face()
    result = apply_overlays(face.image, face, "none", kind, "none", 12)
    assert result.beard_mask.sum() > 20
    for x, y in face.group_points("eyes"):
        assert result.beard_mask[int(y), int(x)] == 0
    assert np.all(result.beard_mask[face.skin_mask == 0] == 0)


@pytest.mark.parametrize("kind", ["clear", "tinted"])
def test_eyewear_occlusion_is_near_named_eyes(kind: str) -> None:
    face = make_drawn_face()
    result = apply_overlays(face.image, face, "none", "none", kind, 19)
    assert result.glasses_mask.sum() > 20
    assert result.glasses_mask.max() > 0.8
    for x, y in face.group_points("eyes"):
        assert result.glasses_mask[int(y), int(x)] >= 0
    assert result.parameters["glasses"] == kind
