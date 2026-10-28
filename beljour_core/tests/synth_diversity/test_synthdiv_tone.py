"""Optical-density, ITA and bounded region behaviour on drawn faces.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.geometry import mask_blur
from lab.synth_diversity.optics import (
    chromophore_projection,
    optical_density,
    reconstruction,
)
from lab.synth_diversity.skin_tone import ITA_BANDS, adjust_skin_tone
from lab.synth_diversity.types import BaseFace, SyntheticInputError


@pytest.mark.parametrize("tone", list(ITA_BANDS))
def test_ita_target_inside_declared_band(tone: str) -> None:
    base = make_drawn_face()
    result = adjust_skin_tone(base.image, base.skin_mask, tone)
    assert result.inside_band
    assert ITA_BANDS[tone][0] <= result.final_ita <= ITA_BANDS[tone][1]
    assert result.image.dtype == np.uint8
    np.testing.assert_array_equal(
        result.image[base.skin_mask == 0], base.image[base.skin_mask == 0]
    )


@pytest.mark.parametrize("tone", list(ITA_BANDS))
def test_optical_texture_energy_and_hue_remain_bounded(tone: str) -> None:
    base = make_drawn_face(seed=37)
    result = adjust_skin_tone(base.image, base.skin_mask, tone)
    support = base.skin_mask > 0.9

    def energy(image: np.ndarray) -> float:
        density = optical_density(image)
        high = density - mask_blur(density, base.skin_mask, 2.5)
        return float(np.var(high[support]))

    assert 0.86 <= energy(result.image) / energy(base.image) <= 1.14
    assert result.hue_change_degrees <= 15.0


def test_chromophore_projection_round_trip() -> None:
    base = make_drawn_face()
    density = optical_density(base.image)
    layers = chromophore_projection(density)
    np.testing.assert_allclose(reconstruction(layers), density, atol=2e-6)
    assert np.isfinite(layers.melanin).all()
    assert np.isfinite(layers.haemoglobin).all()


def test_base_face_validation_rejects_mismatched_masks() -> None:
    face = make_drawn_face()
    with pytest.raises(SyntheticInputError, match="mask shape"):
        BaseFace(face.image, np.zeros((25, 25), np.float32), face.hair_mask, "bad")
    with pytest.raises(SyntheticInputError, match="landmark"):
        BaseFace(
            face.image,
            face.skin_mask,
            face.hair_mask,
            "bad",
            landmarks=np.array([[999, 0]], np.float32),
        )
