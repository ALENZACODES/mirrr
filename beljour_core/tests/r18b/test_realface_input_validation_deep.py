"""R18B boundary validation tests for Lane-B real-face evidence. Author: John Khan."""
from __future__ import annotations

from dataclasses import replace
from typing import Protocol, cast

import numpy as np
import pytest

from plumb_api.engines.gender_look.realface import evaluate as evaluate_gender
from plumb_api.engines.hair_women.realface import evaluate as evaluate_hair
from plumb_api.engines.lips.realface import evaluate as evaluate_lips
from plumb_api.engines.makeup_w.realface import evaluate as evaluate_makeup
from plumb_api.engines.skin_more.realface import evaluate as evaluate_skin
from plumb_api.engines.smile.realface import evaluate as evaluate_smile
from tests.r18b import test_realface_measurements_deep as fixtures


class Validatable(Protocol):
    def validate(self) -> None: ...


def assert_invalid(case: object, phrase: str) -> None:
    with pytest.raises(ValueError, match=phrase):
        cast(Validatable, case).validate()


def wrong_mask() -> np.ndarray:
    return np.ones((fixtures.SIZE - 1, fixtures.SIZE), dtype=np.float64)


def nan_mask() -> np.ndarray:
    mask = np.ones((fixtures.SIZE, fixtures.SIZE), dtype=np.float64)
    mask[3, 4] = np.nan
    return mask


def negative_mask() -> np.ndarray:
    mask = np.ones((fixtures.SIZE, fixtures.SIZE), dtype=np.float64)
    mask[2, 2] = -0.01
    return mask


def excessive_mask() -> np.ndarray:
    mask = np.ones((fixtures.SIZE, fixtures.SIZE), dtype=np.float64)
    mask[2, 2] = 1.01
    return mask


def test_hair_rejects_blank_case_id() -> None:
    assert_invalid(replace(fixtures.hair_case(), case_id="   "), "case_id")


def test_hair_rejects_unknown_feature() -> None:
    assert_invalid(replace(fixtures.hair_case(), feature_id="W999"), "feature_id")


def test_hair_rejects_non_uint8_before() -> None:
    case = fixtures.hair_case()
    assert_invalid(replace(case, before=case.before.astype(np.float32)), "uint8")


def test_hair_rejects_non_uint8_after() -> None:
    case = fixtures.hair_case()
    assert_invalid(replace(case, after=case.after.astype(np.int16)), "uint8")


def test_hair_rejects_image_shape_mismatch() -> None:
    case = fixtures.hair_case()
    assert_invalid(replace(case, after=case.after[:-1]), "shape mismatch")


def test_hair_rejects_grayscale_input() -> None:
    case = fixtures.hair_case()
    assert_invalid(replace(case, before=case.before[..., 0], after=case.after[..., 0]), "RGB or RGBA")


def test_hair_rejects_wrong_hair_mask_shape() -> None:
    assert_invalid(replace(fixtures.hair_case(), hair_mask=wrong_mask()), "hair mask shape")


def test_hair_rejects_nonfinite_hair_mask() -> None:
    assert_invalid(replace(fixtures.hair_case(), hair_mask=nan_mask()), "finite")


def test_hair_rejects_negative_hair_mask() -> None:
    assert_invalid(replace(fixtures.hair_case(), hair_mask=negative_mask()), "0..1")


def test_hair_rejects_excessive_hair_mask() -> None:
    assert_invalid(replace(fixtures.hair_case(), hair_mask=excessive_mask()), "0..1")


def test_hair_rejects_wrong_scalp_mask_shape() -> None:
    assert_invalid(replace(fixtures.hair_case(), scalp_mask=wrong_mask()), "scalp mask shape")


def test_hair_rejects_nonfinite_scalp_mask() -> None:
    assert_invalid(replace(fixtures.hair_case(), scalp_mask=nan_mask()), "scalp mask must be finite")


def test_hair_rejects_wrong_curl_reference_shape() -> None:
    assert_invalid(replace(fixtures.hair_case(), curl_reference=wrong_mask()), "curl reference shape")


def test_hair_rejects_unknown_hair_slice() -> None:
    assert_invalid(replace(fixtures.hair_case(), hair_slice="zigzag"), "hair slice")


def test_hair_rejects_unknown_tone_slice() -> None:
    assert_invalid(replace(fixtures.hair_case(), tone_slice="ultraviolet"), "tone slice")


def test_hair_rejects_nonfinite_timeline() -> None:
    assert_invalid(replace(fixtures.hair_case(), timeline_values=(0.0, float("nan"))), "timeline")


def test_hair_input_hash_changes_with_checked_feature() -> None:
    left = evaluate_hair(fixtures.hair_case("W26"))
    right = evaluate_hair(fixtures.hair_case("W28"))
    assert left.input_sha256 != right.input_sha256


def test_makeup_rejects_blank_case_id() -> None:
    assert_invalid(replace(fixtures.makeup_case(), case_id=""), "case_id")


def test_makeup_rejects_unknown_feature() -> None:
    assert_invalid(replace(fixtures.makeup_case(), feature_id="W999"), "feature_id")


def test_makeup_rejects_non_uint8_before() -> None:
    case = fixtures.makeup_case()
    assert_invalid(replace(case, before=case.before.astype(np.float64)), "uint8")


def test_makeup_rejects_non_uint8_after() -> None:
    case = fixtures.makeup_case()
    assert_invalid(replace(case, after=case.after.astype(np.float32)), "uint8")


def test_makeup_rejects_shape_mismatch() -> None:
    case = fixtures.makeup_case()
    assert_invalid(replace(case, after=case.after[:, :-1]), "shape mismatch")


def test_makeup_rejects_wrong_skin_mask_shape() -> None:
    assert_invalid(replace(fixtures.makeup_case(), skin_mask=wrong_mask()), "skin_mask shape")


def test_makeup_rejects_wrong_effect_mask_shape() -> None:
    assert_invalid(replace(fixtures.makeup_case(), effect_mask=wrong_mask()), "effect_mask shape")


def test_makeup_rejects_nan_skin_mask() -> None:
    assert_invalid(replace(fixtures.makeup_case(), skin_mask=nan_mask()), "skin_mask must be finite")


def test_makeup_rejects_negative_effect_mask() -> None:
    assert_invalid(replace(fixtures.makeup_case(), effect_mask=negative_mask()), "effect_mask must be finite 0..1")


def test_makeup_rejects_wrong_protected_mask_shape() -> None:
    assert_invalid(replace(fixtures.makeup_case(), protected_mask=wrong_mask()), "protected_mask shape")


def test_makeup_rejects_nonfinite_protected_mask() -> None:
    assert_invalid(replace(fixtures.makeup_case(), protected_mask=nan_mask()), "protected_mask must be finite")


def test_makeup_rejects_reference_channel_below_zero() -> None:
    assert_invalid(replace(fixtures.makeup_case(), reference_rgb=(-1, 20, 30)), "reference_rgb")


def test_makeup_rejects_reference_channel_above_255() -> None:
    assert_invalid(replace(fixtures.makeup_case(), reference_rgb=(20, 30, 256)), "reference_rgb")


def test_makeup_rejects_unknown_depth_slice() -> None:
    assert_invalid(replace(fixtures.makeup_case(), depth_slice="very-deep"), "depth slice")


def test_makeup_rejects_unknown_undertone_slice() -> None:
    assert_invalid(replace(fixtures.makeup_case(), undertone_slice="purple"), "undertone slice")


def test_makeup_hash_changes_when_reference_colour_changes() -> None:
    left = evaluate_makeup(fixtures.makeup_case("W1"))
    right = evaluate_makeup(replace(fixtures.makeup_case("W1"), reference_rgb=(1, 2, 3)))
    assert left.input_sha256 != right.input_sha256


def test_lips_reject_blank_case_id() -> None:
    assert_invalid(replace(fixtures.lip_case(), case_id=" "), "case_id")


def test_lips_reject_unknown_feature() -> None:
    assert_invalid(replace(fixtures.lip_case(), feature_id="W999"), "feature_id")


def test_lips_reject_non_uint8_before() -> None:
    case = fixtures.lip_case()
    assert_invalid(replace(case, before=case.before.astype(np.float32)), "uint8")


def test_lips_reject_non_uint8_after() -> None:
    case = fixtures.lip_case()
    assert_invalid(replace(case, after=case.after.astype(np.int16)), "uint8")


def test_lips_reject_shape_mismatch() -> None:
    case = fixtures.lip_case()
    assert_invalid(replace(case, after=case.after[:-1]), "shape mismatch")


def test_lips_reject_wrong_lip_mask_shape() -> None:
    assert_invalid(replace(fixtures.lip_case(), lip_mask=wrong_mask()), "lip_mask shape")


def test_lips_reject_nan_lip_mask() -> None:
    assert_invalid(replace(fixtures.lip_case(), lip_mask=nan_mask()), "lip_mask must be finite")


def test_lips_reject_negative_teeth_mask() -> None:
    assert_invalid(replace(fixtures.lip_case(), teeth_mask=negative_mask()), "teeth_mask must be finite 0..1")


def test_lips_reject_excessive_skin_mask() -> None:
    assert_invalid(replace(fixtures.lip_case(), skin_mask=excessive_mask()), "skin_mask must be finite 0..1")


def test_lips_reject_wrong_pigmentation_mask_shape() -> None:
    assert_invalid(replace(fixtures.lip_case(), pigmentation_mask=wrong_mask()), "pigmentation_mask shape")


def test_lips_hash_changes_when_pixels_change() -> None:
    case = fixtures.lip_case("W54")
    changed = case.after.copy()
    changed[24, 12, 0] += 1
    left = evaluate_lips(case, available_evidence=("before", "after", "lip_mask", "teeth_mask"))
    right = evaluate_lips(
        replace(case, after=changed),
        available_evidence=("before", "after", "lip_mask", "teeth_mask"),
    )
    assert left.input_sha256 != right.input_sha256


def test_smile_rejects_blank_case_id() -> None:
    assert_invalid(replace(fixtures.smile_case(), case_id=""), "case_id")


def test_smile_rejects_unknown_feature() -> None:
    assert_invalid(replace(fixtures.smile_case(), feature_id="W999"), "feature_id")


def test_smile_rejects_non_uint8_before() -> None:
    case = fixtures.smile_case()
    assert_invalid(replace(case, before=case.before.astype(np.float32)), "uint8")


def test_smile_rejects_non_uint8_after() -> None:
    case = fixtures.smile_case()
    assert_invalid(replace(case, after=case.after.astype(np.int16)), "uint8")


def test_smile_rejects_shape_mismatch() -> None:
    case = fixtures.smile_case()
    assert_invalid(replace(case, after=case.after[:, :-1]), "shape mismatch")


def test_smile_rejects_wrong_mouth_mask_shape() -> None:
    assert_invalid(replace(fixtures.smile_case(), mouth_mask=wrong_mask()), "mouth_mask shape")


def test_smile_rejects_nan_tooth_mask() -> None:
    assert_invalid(replace(fixtures.smile_case(), tooth_mask=nan_mask()), "tooth_mask must be finite")


def test_smile_rejects_negative_gum_mask() -> None:
    assert_invalid(replace(fixtures.smile_case(), gum_mask=negative_mask()), "gum_mask must be finite 0..1")


def test_smile_rejects_motion_frame_shape_mismatch() -> None:
    case = fixtures.smile_case("W58")
    frame = case.before[:-1].copy()
    assert_invalid(replace(case, motion_frames=(frame,)), "motion frame")


def test_smile_rejects_motion_frame_dtype_mismatch() -> None:
    case = fixtures.smile_case("W58")
    frame = case.before.astype(np.float32)
    assert_invalid(replace(case, motion_frames=(frame,)), "motion frame")


def test_smile_hash_changes_with_motion_frames() -> None:
    case = fixtures.smile_case("W58")
    changed = list(case.motion_frames)
    changed[1] = changed[1].copy()
    changed[1][22, 12, 0] += 1
    left = evaluate_smile(case)
    right = evaluate_smile(replace(case, motion_frames=tuple(changed)))
    assert left.input_sha256 != right.input_sha256


def test_skin_rejects_blank_case_id() -> None:
    assert_invalid(replace(fixtures.skin_case(), case_id=""), "case_id")


def test_skin_rejects_unknown_feature() -> None:
    assert_invalid(replace(fixtures.skin_case(), feature_id="W999"), "feature_id")


def test_skin_rejects_non_uint8_before() -> None:
    case = fixtures.skin_case()
    assert_invalid(replace(case, before=case.before.astype(np.float64)), "uint8")


def test_skin_rejects_non_uint8_after() -> None:
    case = fixtures.skin_case()
    assert_invalid(replace(case, after=case.after.astype(np.int16)), "uint8")


def test_skin_rejects_shape_mismatch() -> None:
    case = fixtures.skin_case()
    assert_invalid(replace(case, after=case.after[:-1]), "shape mismatch")


def test_skin_rejects_wrong_effect_mask_shape() -> None:
    assert_invalid(replace(fixtures.skin_case(), effect_mask=wrong_mask()), "effect_mask shape")


def test_skin_rejects_wrong_face_mask_shape() -> None:
    assert_invalid(replace(fixtures.skin_case(), face_mask=wrong_mask()), "face_mask shape")


def test_skin_rejects_nan_protected_mask() -> None:
    assert_invalid(replace(fixtures.skin_case(), protected_mask=nan_mask()), "protected_mask must be finite")


def test_skin_rejects_negative_neck_mask() -> None:
    assert_invalid(replace(fixtures.skin_case(), neck_mask=negative_mask()), "neck_mask must be finite 0..1")


def test_skin_rejects_excessive_chest_mask() -> None:
    assert_invalid(replace(fixtures.skin_case(), chest_mask=excessive_mask()), "chest_mask must be finite 0..1")


def test_skin_rejects_wrong_freckle_mask_shape() -> None:
    assert_invalid(replace(fixtures.skin_case(), freckle_mask=wrong_mask()), "freckle_mask shape")


def test_skin_rejects_unknown_depth_slice() -> None:
    assert_invalid(replace(fixtures.skin_case(), depth_slice="ultra"), "depth slice")


def test_skin_hash_changes_when_depth_slice_changes() -> None:
    left = evaluate_skin(fixtures.skin_case())
    right = evaluate_skin(replace(fixtures.skin_case(), depth_slice="medium"))
    assert left.input_sha256 != right.input_sha256


def test_gender_rejects_blank_case_id() -> None:
    assert_invalid(replace(fixtures.gender_case(), case_id=""), "case_id")


def test_gender_rejects_invalid_level() -> None:
    assert_invalid(replace(fixtures.gender_case(), level="maximum"), "level")


def test_gender_rejects_invalid_direction() -> None:
    assert_invalid(replace(fixtures.gender_case(), direction="unknown"), "direction")


def test_gender_rejects_non_uint8_before() -> None:
    case = fixtures.gender_case()
    assert_invalid(replace(case, before=case.before.astype(np.float32)), "uint8")


def test_gender_rejects_non_uint8_after() -> None:
    case = fixtures.gender_case()
    assert_invalid(replace(case, after=case.after.astype(np.int16)), "uint8")


def test_gender_rejects_shape_mismatch() -> None:
    case = fixtures.gender_case()
    assert_invalid(replace(case, after=case.after[:-1]), "shape mismatch")


def test_gender_rejects_wrong_face_mask_shape() -> None:
    assert_invalid(replace(fixtures.gender_case(), face_mask=wrong_mask()), "face_mask shape")


def test_gender_rejects_nan_cheek_mask() -> None:
    assert_invalid(replace(fixtures.gender_case(), cheek_mask=nan_mask()), "cheek_mask must be finite")


def test_gender_rejects_negative_identity_pin_mask() -> None:
    assert_invalid(replace(fixtures.gender_case(), identity_pin_mask=negative_mask()), "identity_pin_mask must be finite 0..1")


def test_gender_rejects_excessive_brow_mask() -> None:
    assert_invalid(replace(fixtures.gender_case(), brow_mask=excessive_mask()), "brow_mask must be finite 0..1")


def test_gender_rejects_wrong_stubble_mask_shape() -> None:
    assert_invalid(replace(fixtures.gender_case(), stubble_mask=wrong_mask()), "stubble_mask shape")


def test_gender_hash_changes_with_direction() -> None:
    left = evaluate_gender(fixtures.gender_case(direction="masculine"))
    right = evaluate_gender(fixtures.gender_case(direction="feminine"))
    assert left.input_sha256 != right.input_sha256


def test_gender_hash_changes_with_level() -> None:
    left = evaluate_gender(fixtures.gender_case(level="normal"))
    right = evaluate_gender(fixtures.gender_case(level="hyper"))
    assert left.input_sha256 != right.input_sha256
