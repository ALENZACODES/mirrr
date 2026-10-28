"""Synthetic pigment appearance, target counts and regional isolation.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.optics import mean_lab, median_ita
from lab.synth_diversity.pigment import apply_albinism, apply_birthmark, apply_freckles
from lab.synth_diversity.types import SyntheticInputError


@pytest.mark.parametrize("style,minimum,maximum", [("light", 16, 28), ("dense", 46, 80)])
def test_freckle_counts_and_reproducibility(style: str, minimum: int, maximum: int) -> None:
    face = make_drawn_face()
    first = apply_freckles(face.image, face, style, seed=32)
    second = apply_freckles(face.image, face, style, seed=32)
    assert minimum <= len(first.centers) <= maximum
    assert len(set(first.centers)) == len(first.centers)
    np.testing.assert_array_equal(first.result.image, second.result.image)
    np.testing.assert_array_equal(first.result.mask, second.result.mask)
    np.testing.assert_array_equal(
        first.result.image[face.skin_mask == 0], face.image[face.skin_mask == 0]
    )


@pytest.mark.parametrize("style", ["port_wine", "cafe_au_lait", "congenital_naevus"])
def test_birthmark_area_and_color_change(style: str) -> None:
    face = make_drawn_face()
    result = apply_birthmark(face.image, face, style, seed=50)
    assert 0.002 <= float(result.parameters["area_fraction"]) <= 0.13
    assert np.any(result.image != face.image)
    np.testing.assert_array_equal(
        result.image[face.skin_mask == 0], face.image[face.skin_mask == 0]
    )
    if style == "port_wine":
        assert mean_lab(result.image, result.mask)[1] > mean_lab(face.image, result.mask)[1]


def test_albinism_reduces_skin_melanin_and_lightens_hair() -> None:
    face = make_drawn_face()
    result = apply_albinism(face.image, face, True)
    assert median_ita(result.image, face.skin_mask) > median_ita(face.image, face.skin_mask)
    assert float(result.image[face.hair_mask > 0.8].mean()) > (
        float(face.image[face.hair_mask > 0.8].mean()) + 30
    )
    assert result.parameters["iris_mask_present"] is True


def test_invalid_freckle_setting_fails() -> None:
    face = make_drawn_face()
    with pytest.raises(SyntheticInputError):
        apply_freckles(face.image, face, "random", 3)
