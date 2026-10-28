"""Scar, acne and rosacea synthetic lesion count and local-colour tests.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.optics import redness_change
from lab.synth_diversity.skin_marks import apply_acne, apply_rosacea, apply_scar


@pytest.mark.parametrize("style", ["linear", "atrophic", "hypertrophic"])
def test_scars_are_local_and_deterministic(style: str) -> None:
    face = make_drawn_face()
    first = apply_scar(face.image, face, style, seed=21)
    second = apply_scar(face.image, face, style, seed=21)
    np.testing.assert_array_equal(first.image, second.image)
    assert first.mask.sum() > 1
    np.testing.assert_array_equal(
        first.image[face.skin_mask == 0], face.image[face.skin_mask == 0]
    )


@pytest.mark.parametrize("severity,minimum,maximum", [("mild", 8, 15), ("moderate", 21, 34)])
def test_acne_counts_and_redness(severity: str, minimum: int, maximum: int) -> None:
    face = make_drawn_face()
    result = apply_acne(face.image, face, severity, seed=12)
    assert minimum <= int(result.parameters["count"]) <= maximum
    assert redness_change(face.image, result.image, result.mask) > 0
    np.testing.assert_array_equal(
        result.image[face.skin_mask == 0], face.image[face.skin_mask == 0]
    )


@pytest.mark.parametrize("severity,count", [("mild", 9), ("moderate", 18)])
def test_rosacea_center_redness_and_vessel_count(severity: str, count: int) -> None:
    face = make_drawn_face()
    result = apply_rosacea(face.image, face, severity, seed=27)
    assert result.parameters["count"] == count
    assert redness_change(face.image, result.image, result.mask) > 0
    np.testing.assert_array_equal(
        result.image[face.skin_mask == 0], face.image[face.skin_mask == 0]
    )
