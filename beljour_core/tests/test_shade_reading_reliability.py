"""W6 cheek-only colour reading under drawn uniform and mixed illumination."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.shade import colourspace as cs
from plumb_api.engines.shade import finder
from plumb_api.engines.shade.reading import audit_patches
from tests.test_w6_shade import BACKGROUND, H, OVAL, POINTS, W, drawn, lab_from


def _neutral_patch(image: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    selected = image.copy()
    mask = np.zeros((H, W), dtype=np.uint8)
    mask[2:24, 2:25] = 1
    selected[mask != 0] = (128, 128, 128)
    return selected, mask


def _cast(image: np.ndarray, gains: tuple[float, float, float]) -> np.ndarray:
    return cs.to_bytes(cs.encode(cs.decode(image) * np.array(gains)))


@pytest.mark.parametrize("gains", [
    (1.0, 1.0, 1.0),
    (1.18, 1.0, 0.82),
    (0.78, 1.0, 1.22),
])
def test_uniform_cool_warm_light_with_neutral_reference(gains: tuple[float, float, float]) -> None:
    reference = drawn(lab_from(60, 19, 64), seed=20, grain=0.25)
    reference, neutral = _neutral_patch(reference)
    tinted = _cast(reference, gains)
    result, audit = finder.find_reliable_shade(tinted, POINTS, neutral_mask=neutral)
    assert audit.usable, audit.public()
    assert audit.reason is None
    assert result.white.mode == "neutral"
    assert result.measured_lab is not None
    assert audit.cheek_distance is not None
    assert audit.cheek_distance < 3.0
    assert result.best is not None
    assert result.best["delta_e"] <= 6.0
    assert result.refused is False


def test_mixed_illumination_returns_specific_refusal() -> None:
    image = drawn(lab_from(60, 19, 64), seed=40, grain=0.1)
    image, neutral = _neutral_patch(image)
    left = image[:, :W // 2]
    right = image[:, W // 2:]
    mixed = image.copy()
    mixed[:, :W // 2] = _cast(left, (1.6, 0.7, 0.58))
    mixed[:, W // 2:] = _cast(right, (0.6, 0.8, 1.7))
    # A neutral patch on one side cannot reconcile colour on opposite cheeks.
    result, audit = finder.find_reliable_shade(mixed, POINTS, neutral_mask=neutral)
    assert audit.usable is False
    assert audit.reason == "mixed_lighting"
    assert result.refused is True
    assert "incompatible lighting" in (result.reason or "")
    assert result.best is None
    assert result.confidence["overall"] == 0


def test_absent_neutral_reference_is_explicitly_disclosed() -> None:
    image = drawn(lab_from(64, 18, 63), seed=30, grain=0.2)
    result, audit = finder.find_reliable_shade(image, POINTS)
    assert audit.white_mode == "none"
    assert "No neutral reference" in audit.note
    assert result.white.mode == "none"


def test_geometry_mask_is_never_a_skin_colour_threshold() -> None:
    zones = finder.zone_masks(POINTS, H, W)
    image = np.zeros((H, W, 3), dtype=np.uint8)
    image[OVAL] = (80, 50, 34)
    corrected, quality = audit_patches(image, zones, (1.0, 1.0, 1.0), "none", minimum=12, cheek_limit=10)
    assert quality.zone_sizes["cheek_left"] > 12
    assert quality.zone_sizes["cheek_right"] > 12
    assert corrected["cheek_left"].shape[1] == 3
    assert quality.usable


def test_invalid_masks_and_image_fail_closed() -> None:
    zones = finder.zone_masks(POINTS, H, W)
    image = drawn(lab_from(60, 18, 64))
    with pytest.raises(ValueError, match="geometry"):
        audit_patches(image, {**zones, "cheek_left": np.zeros((5, 5), bool)},
                      (1, 1, 1), "neutral", minimum=12, cheek_limit=10)
    with pytest.raises(ValueError, match="uint8"):
        audit_patches(image.astype(np.float64), zones, (1, 1, 1), "none", minimum=12, cheek_limit=10)
    with pytest.raises(ValueError, match="limits"):
        audit_patches(image, zones, (1, 1, 1), "none", minimum=0, cheek_limit=10)


def test_existing_zone_agreement_limit_not_relaxed() -> None:
    confidence = finder.thresholds()["confidence"]
    assert confidence["zone_delta_e_ok"] + confidence["zone_delta_e_span"] == 10.0
    assert confidence["refuse_below"] == 0.45
    assert confidence["refuse_delta_e_above"] == 6.0
    assert BACKGROUND.shape == (H, W)
