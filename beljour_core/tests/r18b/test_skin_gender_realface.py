"""R18B Skin & More and gender full-look real-face contracts. Author: John Khan."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.gender_look import frozen1000 as gender_frozen
from plumb_api.engines.gender_look import realface as gender_realface
from plumb_api.engines.skin_more import frozen1000 as skin_frozen
from plumb_api.engines.skin_more import realface as skin_realface

from .conftest import digest, inset, tint


def skin_case(image: np.ndarray, mask: np.ndarray, feature: str = "W77") -> skin_realface.SkinCase:
    effect = inset(mask, 4)
    after = tint(image, effect, (2, 0, 0))
    protected = np.zeros_like(mask)
    protected[10:14, 12:40] = 1.0
    neck = np.zeros_like(mask)
    neck[38:44, 20:32] = 1.0
    chest = np.zeros_like(mask)
    chest[44:48, 16:36] = 1.0
    freckle = np.zeros_like(mask)
    freckle[20:22, 20:22] = 1.0
    return skin_realface.SkinCase(
        "skin-1",
        feature,
        image,
        after,
        effect,
        mask,
        protected_mask=protected,
        neck_mask=neck,
        chest_mask=chest,
        freckle_mask=freckle,
        depth_slice="deep",
    )


def gender_case(image: np.ndarray, mask: np.ndarray, level: gender_realface.Level = "normal") -> gender_realface.GenderCase:
    face = mask.copy()
    cheek = np.zeros_like(mask)
    cheek[24:30, 15:21] = 1.0
    pins = np.zeros_like(mask)
    pins[20:24, 24:28] = 1.0
    brow = np.zeros_like(mask)
    brow[15:18, 18:34] = 1.0
    after = tint(image, brow, (0, -3, -3))
    return gender_realface.GenderCase("gender-1", level, "feminine", image, after, face, cheek, pins, brow_mask=brow)


def test_skin_registry_count_and_definitions() -> None:
    assert len(skin_realface.registry_feature_ids()) == 16
    assert skin_realface.registry_feature_ids()[0] == "W77"
    assert skin_realface.registry_feature_ids()[-1] == "W92"
    for definition in skin_realface.definitions():
        definition.validate()


def test_skin_localized_preview_passes(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = skin_case(rgba_image, center_mask)
    metrics = skin_realface.measure(case)
    assert metrics.outside_change_fraction == 0
    assert metrics.protected_max_delta == 0
    assert metrics.alpha_max_delta == 0
    assert metrics.face_lightening_delta < 2
    assert metrics.texture_retention > 0.65
    assert skin_realface.evaluate(case).status == "passed"


def test_skin_freckle_feature_requires_mask(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = skin_case(rgba_image, center_mask, "W90")
    missing = skin_realface.evaluate(case)
    assert missing.status == "not_tested"
    assert missing.missing == ("freckle_mask",)
    record = skin_realface.evaluate(case, available_evidence=("before", "after", "effect_mask", "face_mask", "freckle_mask"))
    assert "freckle_contrast_retention" in record.metrics


def test_skin_continuity_requires_neck_and_chest(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = skin_case(rgba_image, center_mask, "W91")
    missing = skin_realface.evaluate(case)
    assert missing.status == "not_tested"
    assert missing.missing == ("neck_mask", "chest_mask")
    record = skin_realface.evaluate(case, available_evidence=("before", "after", "effect_mask", "face_mask", "neck_mask", "chest_mask"))
    assert "face_neck_gap" in record.metrics
    assert "neck_chest_gap" in record.metrics


def test_skin_summary_tracks_depth_slice(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = skin_case(rgba_image, center_mask)
    summary = skin_realface.summarize(((case, skin_realface.evaluate(case)),))
    assert summary["registry_feature_count"] == 16
    assert summary["per_depth_slice"]["deep"]["passed"] == 1
    assert summary["ready"] is False


def test_skin_frozen_manifest_uses_registry_features() -> None:
    case = skin_frozen.FrozenCase("one", digest(1), ("W77", "W92"), "deep")
    manifest = skin_frozen.FrozenManifest("skin-set", (case,))
    manifest.validate(require_complete=False)
    assert len(manifest.sha256) == 64
    report = skin_frozen.completeness(manifest, (("one", "W77"), ("one", "W92")))
    assert report["missing"] == ()
    assert report["complete"] is False


def test_gender_has_normal_extra_hyper_definitions() -> None:
    definitions = gender_realface.definitions()
    assert [item.id for item in definitions] == ["r18b.gender.normal", "r18b.gender.extra", "r18b.gender.hyper"]
    for definition in definitions:
        definition.validate()
        assert definition.author == "John Khan"


@pytest.mark.parametrize("level", gender_realface.LEVELS)
def test_gender_identity_and_cheek_guards(level: gender_realface.Level, rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = gender_case(rgba_image, center_mask, level)
    metrics = gender_realface.measure(case)
    assert metrics.outside_face_change_fraction == 0
    assert metrics.identity_pin_max_delta == 0
    assert metrics.cheek_delta_e_proxy == 0
    assert metrics.changed_face_fraction > 0
    assert gender_realface.evaluate(case).status == "passed"


def test_gender_identity_pin_change_fails(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = gender_case(rgba_image, center_mask)
    after = case.after.copy()
    active = case.identity_pin_mask > 0.5
    after[..., 0][active] = np.clip(after[..., 0][active].astype(np.int16) + 8, 0, 255).astype(np.uint8)
    bad = gender_realface.GenderCase(**{**case.__dict__, "after": after})
    assert gender_realface.evaluate(bad).status == "failed"


def test_gender_missing_evidence_is_not_tested(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = gender_case(rgba_image, center_mask)
    record = gender_realface.evaluate(case, available_evidence=("before", "after"))
    assert record.status == "not_tested"
    assert set(record.missing) == {"face_mask", "cheek_mask", "identity_pin_mask"}


def test_gender_summary_requires_all_three_levels(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    pairs = []
    for level in gender_realface.LEVELS:
        case = gender_case(rgba_image, center_mask, level)
        pairs.append((case, gender_realface.evaluate(case)))
    summary = gender_realface.summarize(tuple(pairs))
    assert summary["registry_feature_count"] == 3
    assert summary["complete_levels"] == 3
    assert summary["ready"] is True


def test_gender_frozen_manifest_and_completeness() -> None:
    case = gender_frozen.FrozenCase("one", digest(1), ("normal", "hyper"))
    manifest = gender_frozen.FrozenManifest("gender-set", (case,))
    manifest.validate(require_complete=False)
    assert len(manifest.sha256) == 64
    report = gender_frozen.completeness(manifest, (("one", "normal"),))
    assert report["missing"] == (("one", "hyper"),)
    assert report["complete"] is False


def test_all_frozen_twins_require_1000_complete_cases() -> None:
    skin_manifest = skin_frozen.FrozenManifest("skin", (skin_frozen.FrozenCase("one", digest(1), ("W77",), "deep"),))
    gender_manifest = gender_frozen.FrozenManifest("gender", (gender_frozen.FrozenCase("one", digest(1), ("normal",)),))
    with pytest.raises(ValueError, match="1000"):
        skin_manifest.validate()
    with pytest.raises(ValueError, match="1000"):
        gender_manifest.validate()
