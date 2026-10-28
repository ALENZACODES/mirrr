"""Executed R15A module evidence on drawn fixtures. Author: John Khan.

This deliberately exercises production engines but does not represent the
licensed-face sample or satisfy any human realism, fairness or identity gate.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tests/realface"))

from feature_checks import (balayage_w28, body_posture, colour_engine, hair_studio,
                            hair_w39, lighting_w98, salon_w93)
from feature_registry import BUILT, BuiltFeature, CoverageError, check_coverage
from realface_lib import MODULES


def synthetic_photo() -> np.ndarray:
    y, x = np.mgrid[:96, :112]
    result = np.empty((96, 112, 3), dtype=np.uint8)
    result[..., 0] = np.clip(90 + x // 3 + 14 * np.sin(y / 6), 0, 255).astype(np.uint8)
    result[..., 1] = np.clip(55 + y // 2 + x // 5, 0, 255).astype(np.uint8)
    result[..., 2] = np.clip(34 + x // 4 + y // 4, 0, 255).astype(np.uint8)
    return result


def synthetic_hair() -> np.ndarray:
    y, x = np.mgrid[:96, :112]
    return ((y < 44) & (x > 8) & (x < 106)).astype(float)


@pytest.mark.parametrize("directory", ("pass_definitions", "pass_definitions-10000"))
def test_written_coverage_for_every_named_built_feature(directory: str) -> None:
    check_coverage(BUILT, MODULES, ROOT / "tests/realface" / directory)


def test_registry_rejects_missing_measurement_module() -> None:
    extra = dict(BUILT)
    extra["missing"] = BuiltFeature(("api/plumb_api/engines/shade/lighting.py",),
                                     "never_shipped_test", "measured pixel result", ("photo",), "none")
    with pytest.raises(CoverageError, match="no runnable real-face module"):
        check_coverage(extra, MODULES, ROOT / "tests/realface/pass_definitions")


def test_colour_roundtrip_on_variable_synthetic_photo() -> None:
    check = colour_engine(synthetic_photo())
    assert check.passed
    assert check.measurements["max_channel_error"] <= 2


def test_light_conditions_use_rendered_pixels() -> None:
    checks = lighting_w98(synthetic_photo())
    assert [row.check for row in checks] == ["lighting_daylight", "lighting_office", "lighting_evening"]
    assert all(row.passed and row.output is not None for row in checks)
    assert all(row.output is not None and row.output.shape == synthetic_photo().shape for row in checks)


def test_hair_recolour_preserves_unmasked_pixels_and_detail() -> None:
    image, mask = synthetic_photo(), synthetic_hair()
    checks = hair_w39(image, mask)
    assert len(checks) == 3
    assert all(check.measurements["outside_max_abs_diff"] == 0 for check in checks)
    assert all(check.measurements["highlight_correlation"] >= 0.9 for check in checks)
    assert all(check.passed for check in checks)


def test_hair_without_segmentation_cannot_fake_a_pass() -> None:
    assert all(not check.passed and not check.measurements["mask_observed"]
               for check in hair_w39(synthetic_photo(), None))
    assert not balayage_w28(synthetic_photo(), None).passed


def test_balayage_processes_mask_as_real_pixels_not_canned_score() -> None:
    image, mask = synthetic_photo(), synthetic_hair()
    check = balayage_w28(image, mask)
    assert check.output is not None
    assert check.measurements["outside_max_abs_diff"] == 0
    assert check.measurements["sessions"] >= 1


def test_salon_decision_pack_keeps_original_first() -> None:
    result = salon_w93(synthetic_photo())
    assert result.passed
    assert result.measurements["original_first"]
    assert result.measurements["consent_footer"]
    assert result.measurements["no_hosting"]


def test_studio_catalogue_is_not_misrepresented_as_tryon() -> None:
    result = hair_studio(synthetic_photo())
    assert result.measurements["styles"] > 0
    assert not result.measurements["actually_rendered"]


def test_body_posture_cannot_pass_without_licensed_full_body_fixture() -> None:
    result = body_posture(synthetic_photo())
    assert not result.passed
    assert not result.measurements["pose_measured"]
    assert "not medical advice" in result.measurements["simulation_label"]


def test_invalid_photo_fails_before_any_feature_engine() -> None:
    with pytest.raises(ValueError, match="uint8 RGB"):
        colour_engine(np.zeros((5, 5, 3), dtype=np.uint8))
