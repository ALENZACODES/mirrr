"""Coverage, laterality, optical brightening and mask determinism tests.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.skin_tone import adjust_skin_tone
from lab.synth_diversity.types import SyntheticInputError
from lab.synth_diversity.vitiligo import (
    apply_vitiligo,
    build_vitiligo_mask,
    patch_lightness_rise,
)


@pytest.mark.parametrize(
    "kind,fraction", [("focal", 0.06), ("segmental", 0.17), ("generalised", 0.27)]
)
def test_patch_coverage_and_outside_unchanged(kind: str, fraction: float) -> None:
    base = make_drawn_face()
    output = apply_vitiligo(base.image, base.skin_mask, kind, fraction, seed=21)
    assert abs(output.coverage - fraction) <= 0.015
    np.testing.assert_array_equal(
        output.image[base.skin_mask == 0], base.image[base.skin_mask == 0]
    )
    assert 0 <= float(output.patch_mask.min()) <= float(output.patch_mask.max()) <= 1


def test_segmental_is_one_sided() -> None:
    base = make_drawn_face()
    result = apply_vitiligo(base.image, base.skin_mask, "segmental", 0.13, seed=5)
    center = (base.width - 1) / 2
    yy, xx = np.mgrid[: base.height, : base.width]
    actual = result.patch_mask > 0.5
    if result.side == "left":
        assert not actual[xx >= center].any()
    else:
        assert not actual[xx <= center].any()


def test_generalised_is_nearly_bilateral() -> None:
    base = make_drawn_face()
    patch, side = build_vitiligo_mask(base.skin_mask, "generalised", 0.31, seed=8)
    left = float(patch[:, : base.width // 2].sum())
    right = float(patch[:, base.width // 2 :].sum())
    assert side == "both"
    assert abs(left - right) / max(left + right, 1) <= 0.11


def test_deep_tone_has_larger_patch_lightness_rise() -> None:
    face = make_drawn_face()
    light = adjust_skin_tone(face.image, face.skin_mask, "II").image
    deep = adjust_skin_tone(face.image, face.skin_mask, "VI").image
    first = apply_vitiligo(light, face.skin_mask, "focal", 0.08, seed=13)
    second = apply_vitiligo(deep, face.skin_mask, "focal", 0.08, seed=13)
    assert patch_lightness_rise(deep, second.image, second.patch_mask) > (
        patch_lightness_rise(light, first.image, first.patch_mask) + 12
    )


def test_optional_rim_and_trichrome_deterministic() -> None:
    face = make_drawn_face()
    options = dict(trichrome=True, hyperpigmented_rim=True)
    first = apply_vitiligo(face.image, face.skin_mask, "focal", 0.04, 45, **options)
    second = apply_vitiligo(face.image, face.skin_mask, "focal", 0.04, 45, **options)
    np.testing.assert_array_equal(first.image, second.image)
    assert first.rim_mask.sum() > 0
    assert first.white_hair_mask.sum() == 0


def test_invalid_segmental_coverage_rejected() -> None:
    face = make_drawn_face()
    with pytest.raises(SyntheticInputError, match="segmental"):
        apply_vitiligo(face.image, face.skin_mask, "segmental", 0.8, 3)
