"""R18B lips and smile real-face evidence contracts. Author: John Khan."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.lips import frozen1000 as lip_frozen
from plumb_api.engines.lips import realface as lip_realface
from plumb_api.engines.smile import frozen1000 as smile_frozen
from plumb_api.engines.smile import realface as smile_realface

from .conftest import digest, inset, tint


def lip_case(image: np.ndarray, mask: np.ndarray, feature: str = "W55") -> lip_realface.LipCase:
    lip = inset(mask, 8)
    after = tint(image, lip, (5, 0, 1))
    teeth = np.zeros_like(mask)
    teeth[24:28, 22:31] = 1.0
    after[teeth > 0.5] = image[teeth > 0.5]
    pigment = np.zeros_like(mask)
    pigment[28:32, 20:26] = lip[28:32, 20:26]
    return lip_realface.LipCase("lip-1", feature, image, after, lip, teeth_mask=teeth, pigmentation_mask=pigment)


def smile_case(image: np.ndarray, mask: np.ndarray, feature: str = "W51") -> smile_realface.SmileCase:
    mouth = inset(mask, 7)
    teeth = np.zeros_like(mask)
    teeth[23:29, 20:33] = 1.0
    gum = np.zeros_like(mask)
    gum[21:23, 20:33] = 1.0
    after = tint(image, teeth, (2, 2, 2))
    return smile_realface.SmileCase("smile-1", feature, image, after, mouth, teeth, gum_mask=gum)


def test_lip_and_smile_registry_counts() -> None:
    assert lip_realface.registry_feature_ids() == ("W45", "W46", "W47", "W48", "W49", "W54", "W55", "W56", "W57")
    assert smile_realface.registry_feature_ids() == ("W50", "W51", "W52", "W53", "W58")


def test_lip_definitions_validate() -> None:
    assert len(lip_realface.definitions()) == 9
    for definition in lip_realface.definitions():
        definition.validate()
        assert definition.author == "John Khan"


def test_smile_definitions_validate() -> None:
    assert len(smile_realface.definitions()) == 5
    for definition in smile_realface.definitions():
        definition.validate()
        assert definition.author == "John Khan"


def test_lip_localized_tint_passes(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = lip_case(rgba_image, center_mask)
    metrics = lip_realface.measure(case)
    assert metrics.outside_change_fraction == 0
    assert metrics.alpha_max_delta == 0
    assert metrics.lip_changed_fraction > 0
    assert metrics.lip_texture_retention > 0.6
    assert lip_realface.evaluate(case).status == "passed"


def test_optical_whiter_lip_requires_teeth_evidence(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = lip_case(rgba_image, center_mask, "W54")
    record = lip_realface.evaluate(case)
    assert record.status == "not_tested"
    assert record.missing == ("teeth_mask",)
    complete = lip_realface.evaluate(case, available_evidence=("before", "after", "lip_mask", "teeth_mask"))
    assert complete.status == "passed"
    assert float(complete.metrics["teeth_max_delta"]) == 0


def test_pigmentation_feature_requires_pigment_mask(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = lip_case(rgba_image, center_mask, "W57")
    missing = lip_realface.evaluate(case)
    assert missing.status == "not_tested"
    complete = lip_realface.evaluate(case, available_evidence=("before", "after", "lip_mask", "pigmentation_mask"))
    assert complete.status in {"passed", "failed"}
    assert "pigmentation_contrast_retention" in complete.metrics


def test_lip_outside_change_is_failure(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = lip_case(rgba_image, center_mask)
    after = case.after.copy()
    after[0, 0, 0] = np.uint8((int(after[0, 0, 0]) + 20) % 255)
    bad = lip_realface.LipCase(**{**case.__dict__, "after": after})
    assert lip_realface.evaluate(bad).status == "failed"


def test_smile_tooth_preview_passes(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = smile_case(rgba_image, center_mask)
    metrics = smile_realface.measure(case)
    assert metrics.outside_change_fraction == 0
    assert metrics.tooth_mean_delta > 0
    assert metrics.tooth_texture_retention > 0.55
    assert smile_realface.evaluate(case).status == "passed"


def test_gum_feature_requires_gum_mask(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = smile_case(rgba_image, center_mask, "W50")
    missing = smile_realface.evaluate(case)
    assert missing.status == "not_tested"
    assert "gum_mask" in missing.missing


def test_motion_feature_requires_frames(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = smile_case(rgba_image, center_mask, "W58")
    missing = smile_realface.evaluate(case)
    assert missing.status == "not_tested"
    assert missing.missing == ("motion_frames",)
    frames = (case.after.copy(), rgba_image.copy())
    with_frames = smile_realface.SmileCase(**{**case.__dict__, "motion_frames": frames})
    complete = smile_realface.evaluate(with_frames, available_evidence=("before", "after", "mouth_mask", "tooth_mask", "motion_frames"))
    assert complete.status in {"passed", "failed"}
    assert float(complete.metrics["motion_return_error"]) == 0


def test_lip_frozen_manifest_and_completeness() -> None:
    case = lip_frozen.FrozenCase("one", digest(1), ("W45", "W57"))
    manifest = lip_frozen.FrozenManifest("lip-set", (case,))
    manifest.validate(require_complete=False)
    counts = lip_frozen.feature_case_counts(manifest)
    assert counts["W45"] == 1
    report = lip_frozen.completeness(manifest, (("one", "W45"),))
    assert ("one", "W57") in report["missing"]


def test_smile_frozen_manifest_and_shards() -> None:
    cases = tuple(smile_frozen.FrozenCase(str(i), digest(i + 1), ("W51",)) for i in range(8))
    manifest = smile_frozen.FrozenManifest("smile-set", cases)
    manifest.validate(require_complete=False)
    assert len(smile_frozen.shard(cases, 0, 2)) == 4
    assert len(smile_frozen.shard(cases, 1, 2)) == 4


def test_frozen_twins_require_exact_1000_for_complete() -> None:
    lip_manifest = lip_frozen.FrozenManifest("lip-set", (lip_frozen.FrozenCase("one", digest(1), ("W45",)),))
    smile_manifest = smile_frozen.FrozenManifest("smile-set", (smile_frozen.FrozenCase("one", digest(1), ("W51",)),))
    with pytest.raises(ValueError, match="1000"):
        lip_manifest.validate()
    with pytest.raises(ValueError, match="1000"):
        smile_manifest.validate()
