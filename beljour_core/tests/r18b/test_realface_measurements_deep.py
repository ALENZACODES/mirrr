"""R18B deep measurement behavior tests for every Lane-B evidence family. Author: John Khan."""
from __future__ import annotations

from dataclasses import replace
from typing import cast

import numpy as np
import pytest

from plumb_api.engines.gender_look.realface import Direction, GenderCase, Level
from plumb_api.engines.gender_look.realface import evaluate as evaluate_gender
from plumb_api.engines.gender_look.realface import measure as measure_gender
from plumb_api.engines.hair_women.realface import HairCase
from plumb_api.engines.hair_women.realface import evaluate as evaluate_hair
from plumb_api.engines.hair_women.realface import measure as measure_hair
from plumb_api.engines.lips.realface import LipCase
from plumb_api.engines.lips.realface import evaluate as evaluate_lips
from plumb_api.engines.lips.realface import measure as measure_lips
from plumb_api.engines.makeup_w.realface import MakeupCase
from plumb_api.engines.makeup_w.realface import evaluate as evaluate_makeup
from plumb_api.engines.makeup_w.realface import measure as measure_makeup
from plumb_api.engines.skin_more.realface import SkinCase
from plumb_api.engines.skin_more.realface import evaluate as evaluate_skin
from plumb_api.engines.skin_more.realface import measure as measure_skin
from plumb_api.engines.smile.realface import SmileCase
from plumb_api.engines.smile.realface import evaluate as evaluate_smile
from plumb_api.engines.smile.realface import measure as measure_smile

SIZE = 40


def rgba(value: tuple[int, int, int] = (96, 72, 64)) -> np.ndarray:
    image = np.zeros((SIZE, SIZE, 4), dtype=np.uint8)
    image[..., 0] = value[0]
    image[..., 1] = value[1]
    image[..., 2] = value[2]
    image[..., 3] = 255
    yy, xx = np.indices((SIZE, SIZE))
    texture = ((xx + yy) % 5).astype(np.uint8)
    image[..., 0] = np.clip(image[..., 0].astype(np.int16) + texture, 0, 255).astype(np.uint8)
    return image


def rect(y0: int, y1: int, x0: int, x1: int, weight: float = 1.0) -> np.ndarray:
    mask = np.zeros((SIZE, SIZE), dtype=np.float64)
    mask[y0:y1, x0:x1] = weight
    return mask


def tinted(before: np.ndarray, mask: np.ndarray, delta: tuple[int, int, int]) -> np.ndarray:
    out = before.copy()
    active = mask > 0.25
    for channel, shift in enumerate(delta):
        values = out[..., channel].astype(np.int16)
        values[active] = np.clip(values[active] + shift, 0, 255)
        out[..., channel] = values.astype(np.uint8)
    return out


def hair_case(feature: str = "W26", *, delta: tuple[int, int, int] = (10, -4, 5)) -> HairCase:
    before = rgba((78, 60, 48))
    hair = rect(4, 25, 5, 35)
    after = tinted(before, hair, delta)
    return HairCase(
        case_id=f"hair-{feature}",
        feature_id=feature,
        before=before,
        after=after,
        hair_mask=hair,
        scalp_mask=rect(4, 11, 10, 30),
        hair_slice="curly",
        tone_slice="deep",
        curl_reference=hair.copy(),
        timeline_values=(0.0, 0.2, 0.4, 0.8),
    )


def makeup_case(feature: str = "W1", *, delta: tuple[int, int, int] = (3, -4, 5)) -> MakeupCase:
    before = rgba((78, 56, 45))
    effect = rect(14, 29, 9, 31)
    skin = rect(5, 35, 5, 35)
    protected = rect(18, 22, 18, 22)
    effect_without_protected = effect.copy()
    effect_without_protected[protected > 0.25] = 0.0
    after = tinted(before, effect_without_protected, delta)
    return MakeupCase(
        case_id=f"makeup-{feature}",
        feature_id=feature,
        before=before,
        after=after,
        skin_mask=skin,
        effect_mask=effect,
        protected_mask=protected,
        reference_rgb=(80, 52, 48),
        depth_slice="deep",
        undertone_slice="olive",
    )


def lip_case(feature: str = "W54", *, delta: tuple[int, int, int] = (8, -3, 4)) -> LipCase:
    before = rgba((92, 65, 62))
    lip = rect(22, 29, 10, 30)
    teeth = rect(23, 25, 16, 24)
    pigment = rect(25, 28, 12, 18)
    paint = lip.copy()
    paint[teeth > 0.25] = 0.0
    after = tinted(before, paint, delta)
    return LipCase(
        case_id=f"lip-{feature}",
        feature_id=feature,
        before=before,
        after=after,
        lip_mask=lip,
        teeth_mask=teeth,
        skin_mask=rect(16, 34, 5, 35),
        pigmentation_mask=pigment,
    )


def smile_case(feature: str = "W50") -> SmileCase:
    before = rgba((90, 70, 65))
    mouth = rect(20, 31, 8, 32)
    teeth = rect(22, 27, 13, 27)
    gum = rect(20, 22, 13, 27)
    after = tinted(before, mouth, (3, 2, 1))
    frames = (
        before.copy(),
        tinted(before, mouth, (1, 1, 0)),
        tinted(before, mouth, (2, 1, 0)),
        before.copy(),
    )
    return SmileCase(
        case_id=f"smile-{feature}",
        feature_id=feature,
        before=before,
        after=after,
        mouth_mask=mouth,
        tooth_mask=teeth,
        gum_mask=gum,
        motion_frames=frames if feature == "W58" else (),
    )


def skin_case(feature: str = "W77", *, delta: tuple[int, int, int] = (2, -2, 3)) -> SkinCase:
    before = rgba((83, 60, 48))
    effect = rect(8, 33, 7, 33)
    face = rect(5, 35, 5, 35)
    protected = rect(18, 22, 18, 22)
    paint = effect.copy()
    paint[protected > 0.25] = 0.0
    after = tinted(before, paint, delta)
    return SkinCase(
        case_id=f"skin-{feature}",
        feature_id=feature,
        before=before,
        after=after,
        effect_mask=effect,
        face_mask=face,
        protected_mask=protected,
        neck_mask=rect(33, 38, 12, 28),
        chest_mask=rect(37, 40, 8, 32),
        freckle_mask=rect(14, 18, 12, 17),
        depth_slice="deep",
    )


def gender_case(level: str = "normal", direction: str = "masculine") -> GenderCase:
    before = rgba((88, 67, 57))
    face = rect(5, 35, 6, 34)
    cheek = rect(20, 28, 10, 18)
    pins = rect(12, 17, 16, 24)
    brows = rect(11, 14, 10, 30)
    stubble = rect(27, 34, 10, 30)
    paint = face.copy()
    paint[pins > 0.25] = 0.0
    after = tinted(before, paint, (3, -3, 3))
    return GenderCase(
        case_id=f"gender-{level}-{direction}",
        level=cast(Level, level),
        direction=cast(Direction, direction),
        before=before,
        after=after,
        face_mask=face,
        cheek_mask=cheek,
        identity_pin_mask=pins,
        brow_mask=brows,
        stubble_mask=stubble,
    )


def test_hair_measurement_localizes_changes() -> None:
    metrics = measure_hair(hair_case())
    assert metrics.outside_change_fraction == 0.0
    assert metrics.outside_max_delta == 0.0
    assert metrics.hair_mean_delta > 0.0
    assert metrics.changed_hair_fraction > 0.95
    assert metrics.alpha_max_delta == 0.0


def test_hair_measurement_preserves_monotone_grey_timeline() -> None:
    metrics = measure_hair(hair_case("W33"))
    assert metrics.grey_timeline_monotone is True


def test_hair_measurement_detects_nonmonotone_grey_timeline() -> None:
    case = replace(hair_case("W33"), timeline_values=(0.0, 0.5, 0.4, 0.9))
    assert measure_hair(case).grey_timeline_monotone is False


def test_hair_measurement_detects_outside_hair_change() -> None:
    case = hair_case()
    after = case.after.copy()
    after[35, 35, 0] += 10
    metrics = measure_hair(replace(case, after=after))
    assert metrics.outside_change_fraction > 0
    assert metrics.outside_max_delta == 10.0


def test_hair_alpha_change_is_detected_exactly() -> None:
    case = hair_case()
    after = case.after.copy()
    after[10, 10, 3] = 245
    metrics = measure_hair(replace(case, after=after))
    assert metrics.alpha_max_delta == 10.0


@pytest.mark.parametrize("feature", ["W26", "W28", "W29", "W30", "W31", "W32", "W34", "W35", "W36", "W39"])
def test_hair_colour_features_report_changed_region(feature: str) -> None:
    metrics = measure_hair(hair_case(feature))
    assert metrics.changed_hair_fraction >= 0.9
    assert metrics.curl_retention > 0.7


@pytest.mark.parametrize("feature", ["W40", "W43", "W44"])
def test_hair_texture_features_keep_curl_structure(feature: str) -> None:
    metrics = measure_hair(hair_case(feature, delta=(2, -1, 2)))
    assert metrics.curl_retention > 0.72


def test_hair_missing_evidence_stays_not_tested() -> None:
    record = evaluate_hair(hair_case(), available_evidence=("before", "after"))
    assert record.status == "not_tested"
    assert record.missing == ("hair_mask",)


def test_makeup_measurement_localizes_effect_and_preserves_protected_region() -> None:
    metrics = measure_makeup(makeup_case())
    assert metrics.outside_change_fraction == 0.0
    assert metrics.protected_max_delta == 0.0
    assert metrics.effect_changed_fraction > 0.8
    assert metrics.alpha_max_delta == 0.0


def test_makeup_deep_skin_chroma_is_measured_not_assumed() -> None:
    metrics = measure_makeup(makeup_case())
    assert metrics.deep_skin_chroma_retention == metrics.skin_chroma_retention
    assert metrics.deep_skin_chroma_retention > 0.7


def test_makeup_non_deep_case_uses_neutral_deep_slice_metric() -> None:
    case = replace(makeup_case(), depth_slice="medium")
    assert measure_makeup(case).deep_skin_chroma_retention == 1.0


def test_makeup_global_lightening_is_visible_in_metric() -> None:
    case = makeup_case()
    after = case.before.copy()
    active = case.skin_mask > 0.25
    for channel in range(3):
        values = after[..., channel].astype(np.int16)
        values[active] = np.clip(values[active] + 15, 0, 255)
        after[..., channel] = values.astype(np.uint8)
    metrics = measure_makeup(replace(case, after=after, effect_mask=case.skin_mask))
    assert metrics.skin_lightening_delta > 10.0


def test_makeup_protected_region_violation_is_detected() -> None:
    case = makeup_case()
    after = case.after.copy()
    active = case.protected_mask > 0.25
    after[..., 0][active] = np.clip(after[..., 0][active].astype(np.int16) + 20, 0, 255)
    assert measure_makeup(replace(case, after=after)).protected_max_delta >= 20.0


def test_makeup_reference_distance_is_zero_when_reference_is_absent() -> None:
    case = replace(makeup_case(), reference_rgb=None)
    assert measure_makeup(case).reference_distance == 0.0


def test_makeup_reference_distance_responds_to_target_colour() -> None:
    case = makeup_case()
    near = measure_makeup(case).reference_distance
    far = measure_makeup(replace(case, reference_rgb=(240, 240, 240))).reference_distance
    assert far > near


@pytest.mark.parametrize("feature", ["W1", "W2", "W4", "W5", "W7", "W8", "W13", "W14", "W17", "W18"])
def test_makeup_colour_features_change_effect_region(feature: str) -> None:
    case = makeup_case(feature)
    assert measure_makeup(case).effect_changed_fraction > 0.01


@pytest.mark.parametrize("feature", ["W9", "W10", "W16"])
def test_makeup_finish_features_keep_texture_floor(feature: str) -> None:
    case = makeup_case(feature, delta=(2, -2, 3))
    assert measure_makeup(case).texture_retention > 0.70


def test_makeup_w13_requires_checked_reference_regions() -> None:
    case = makeup_case("W13")
    record = evaluate_makeup(case)
    assert record.status == "not_tested"
    assert "checked_reference_regions" in record.missing


def test_makeup_w13_can_be_evaluated_when_checked_reference_is_declared() -> None:
    case = makeup_case("W13")
    record = evaluate_makeup(
        case,
        available_evidence=("before", "after", "skin_mask", "effect_mask", "checked_reference_regions"),
    )
    assert record.status in {"passed", "failed"}
    assert not record.missing


def test_lip_measurement_localizes_changes_and_protects_teeth() -> None:
    metrics = measure_lips(lip_case())
    assert metrics.outside_change_fraction == 0.0
    assert metrics.outside_max_delta == 0.0
    assert metrics.teeth_max_delta == 0.0
    assert metrics.alpha_max_delta == 0.0
    assert metrics.lip_changed_fraction > 0.5


def test_lip_teeth_violation_is_detected() -> None:
    case = lip_case()
    after = case.after.copy()
    active = case.teeth_mask > 0.25
    after[..., 0][active] = np.clip(after[..., 0][active].astype(np.int16) + 15, 0, 255)
    assert measure_lips(replace(case, after=after)).teeth_max_delta == 15.0


def test_lip_alpha_violation_is_detected() -> None:
    case = lip_case()
    after = case.after.copy()
    after[25, 12, 3] = 240
    assert measure_lips(replace(case, after=after)).alpha_max_delta == 15.0


def test_lip_centroid_pin_is_zero_without_output_anatomy_mask() -> None:
    assert measure_lips(lip_case()).centroid_shift_px == 0.0


def test_lip_w57_uses_observed_pigmentation_metric() -> None:
    metrics = measure_lips(lip_case("W57", delta=(4, -2, 3)))
    assert 0.0 <= metrics.pigmentation_contrast_retention <= 3.0


def test_lip_w54_missing_teeth_evidence_is_not_tested() -> None:
    case = lip_case("W54")
    record = evaluate_lips(case, available_evidence=("before", "after", "lip_mask"))
    assert record.status == "not_tested"
    assert "teeth_mask" in record.missing


def test_lip_w57_missing_pigmentation_evidence_is_not_tested() -> None:
    case = lip_case("W57")
    record = evaluate_lips(case, available_evidence=("before", "after", "lip_mask"))
    assert record.status == "not_tested"
    assert "pigmentation_mask" in record.missing


def test_smile_measurement_localizes_change() -> None:
    metrics = measure_smile(smile_case())
    assert metrics.outside_change_fraction == 0.0
    assert metrics.alpha_max_delta == 0.0
    assert metrics.tooth_mean_delta > 0.0


def test_smile_gum_delta_uses_checked_gum_region() -> None:
    case = smile_case("W50")
    baseline = measure_smile(case).gum_mean_delta
    after = case.after.copy()
    active = case.gum_mask > 0.25
    after[..., 0][active] = np.clip(after[..., 0][active].astype(np.int16) + 12, 0, 255)
    changed = measure_smile(replace(case, after=after)).gum_mean_delta
    assert changed > baseline


def test_smile_motion_round_trip_reports_zero_return_error() -> None:
    metrics = measure_smile(smile_case("W58"))
    assert metrics.motion_max_step > 0.0
    assert metrics.motion_return_error == 0.0


def test_smile_motion_return_error_detects_nonreturning_last_frame() -> None:
    case = smile_case("W58")
    frames = list(case.motion_frames)
    frames[-1] = tinted(case.before, case.mouth_mask, (8, 0, 0))
    metrics = measure_smile(replace(case, motion_frames=tuple(frames)))
    assert metrics.motion_return_error > 0.0


def test_smile_missing_required_evidence_is_not_tested() -> None:
    case = smile_case("W50")
    record = evaluate_smile(case, available_evidence=("before", "after", "mouth_mask"))
    assert record.status == "not_tested"
    assert record.missing


def test_skin_measurement_localizes_effect() -> None:
    metrics = measure_skin(skin_case())
    assert metrics.outside_change_fraction == 0.0
    assert metrics.protected_max_delta == 0.0
    assert metrics.alpha_max_delta == 0.0


def test_skin_protected_region_violation_is_detected() -> None:
    case = skin_case()
    after = case.after.copy()
    active = case.protected_mask > 0.25
    after[..., 1][active] = np.clip(after[..., 1][active].astype(np.int16) + 11, 0, 255)
    assert measure_skin(replace(case, after=after)).protected_max_delta == 11.0


def test_skin_global_lightening_is_measured() -> None:
    case = skin_case()
    after = case.before.copy()
    active = case.face_mask > 0.25
    for channel in range(3):
        values = after[..., channel].astype(np.int16)
        values[active] = np.clip(values[active] + 12, 0, 255)
        after[..., channel] = values.astype(np.uint8)
    metrics = measure_skin(replace(case, after=after, effect_mask=case.face_mask))
    assert metrics.face_lightening_delta > 8.0


def test_skin_continuity_metrics_are_finite_with_neck_and_chest_masks() -> None:
    metrics = measure_skin(skin_case("W91"))
    assert np.isfinite(metrics.face_neck_gap)
    assert np.isfinite(metrics.neck_chest_gap)


def test_skin_freckle_metric_uses_checked_freckle_mask() -> None:
    metrics = measure_skin(skin_case("W90"))
    assert 0.0 <= metrics.freckle_contrast_retention <= 3.0


def test_skin_missing_face_mask_evidence_is_not_tested() -> None:
    case = skin_case()
    record = evaluate_skin(case, available_evidence=("before", "after", "effect_mask"))
    assert record.status == "not_tested"
    assert "face_mask" in record.missing


def test_gender_measurement_respects_identity_pins() -> None:
    metrics = measure_gender(gender_case())
    assert metrics.outside_face_change_fraction == 0.0
    assert metrics.identity_pin_max_delta == 0.0
    assert metrics.alpha_max_delta == 0.0
    assert metrics.changed_face_fraction > 0.5


def test_gender_identity_pin_violation_is_detected() -> None:
    case = gender_case()
    after = case.after.copy()
    active = case.identity_pin_mask > 0.25
    after[..., 0][active] = np.clip(after[..., 0][active].astype(np.int16) + 10, 0, 255)
    assert measure_gender(replace(case, after=after)).identity_pin_max_delta == 10.0


def test_gender_cheek_delta_proxy_is_zero_when_cheek_unchanged() -> None:
    case = gender_case()
    after = case.after.copy()
    active = case.cheek_mask > 0.25
    after[active] = case.before[active]
    assert measure_gender(replace(case, after=after)).cheek_delta_e_proxy == 0.0


def test_gender_cheek_delta_proxy_detects_large_colour_shift() -> None:
    case = gender_case()
    after = case.after.copy()
    active = case.cheek_mask > 0.25
    for channel in range(3):
        values = after[..., channel].astype(np.int16)
        values[active] = np.clip(values[active] + 20, 0, 255)
        after[..., channel] = values.astype(np.uint8)
    assert measure_gender(replace(case, after=after)).cheek_delta_e_proxy > 4.0


@pytest.mark.parametrize("level", ["normal", "extra", "hyper"])
def test_gender_all_levels_have_measured_changed_face_fraction(level: str) -> None:
    metrics = measure_gender(gender_case(level))
    assert metrics.changed_face_fraction > 0.0


@pytest.mark.parametrize("direction", ["feminine", "masculine", "neutral"])
def test_gender_direction_is_evidence_metadata_not_identity_inference(direction: str) -> None:
    case = gender_case(direction=direction)
    record = evaluate_gender(case)
    assert record.status in {"passed", "failed"}
    assert case.direction == direction


def test_gender_missing_identity_pin_evidence_is_not_tested() -> None:
    case = gender_case()
    record = evaluate_gender(case, available_evidence=("before", "after", "face_mask", "cheek_mask"))
    assert record.status == "not_tested"
    assert "identity_pin_mask" in record.missing
