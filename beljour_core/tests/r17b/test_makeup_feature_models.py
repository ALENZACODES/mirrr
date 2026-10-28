'Deep tests for R17B makeup planning models. Author: John Khan.'
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.makeup_w.feature_models import ORIGINAL_EVENT_LOOKS, balanced_palette, blush_plan, checked_reference, concealer_plan, contour_plan, correction_plan, deep_skin_guard, event_recipe, finish_plan, minimal_product_plan, outfit_harmony, oxidation_timeline, rank_shades, seasonal_mix, signature, transfer_plan, undertone_anchor

def reference_image() -> np.ndarray:
    h, w = (64, 64)
    yy, xx = np.mgrid[:h, :w]
    image = np.zeros((h, w, 4), dtype=np.uint8)
    image[..., 0] = 74 + xx // 8
    image[..., 1] = 52 + yy // 10
    image[..., 2] = 46 + (xx + yy) // 20
    image[..., 3] = 255
    return image

def mask(cx: float, cy: float, rx: float, ry: float) -> np.ndarray:
    h, w = (64, 64)
    yy, xx = np.mgrid[:h, :w]
    return (((xx / w - cx) / rx) ** 2 + ((yy / h - cy) / ry) ** 2 <= 1).astype(float)

def checked_masks() -> dict[str, np.ndarray]:
    return {'eye': np.maximum(mask(0.38, 0.42, 0.08, 0.04), mask(0.62, 0.42, 0.08, 0.04)), 'cheek': np.maximum(mask(0.34, 0.58, 0.1, 0.08), mask(0.66, 0.58, 0.1, 0.08)), 'lip': mask(0.5, 0.7, 0.11, 0.045)}

@pytest.mark.parametrize('name,expected', [('cool', 345.0), ('neutral', 25.0), ('warm', 55.0), ('olive', 92.0)])
def test_undertone_anchors_are_explicit(name: str, expected: float) -> None:
    assert undertone_anchor(name) == expected

def test_undertone_anchor_rejects_unknown() -> None:
    with pytest.raises(ValueError):
        undertone_anchor('automatic')

def test_rank_shades_returns_best_first() -> None:
    shades = [(130, 60, 70), (105, 86, 55), (82, 68, 76), (155, 92, 74)]
    ranked = rank_shades(shades, 'olive', 'lip')
    assert len(ranked) == len(shades)
    assert all((a.score >= b.score for a, b in zip(ranked, ranked[1:], strict=False)))
    assert all((row.rationale.startswith('local Lab/LCh') for row in ranked))

def test_rank_shades_keeps_rgb_in_8bit_range() -> None:
    ranked = rank_shades([(999, -10, 130)], 'neutral')
    assert ranked[0].rgb == (255, 0, 130)

def test_rank_shades_rejects_unknown_role() -> None:
    with pytest.raises(ValueError):
        rank_shades([(100, 80, 70)], 'neutral', 'foundation_brand')

def test_balanced_palette_returns_multiple_ranked_accents() -> None:
    palette = balanced_palette((120, 70, 65), 'warm')
    assert len(palette) == 4
    assert all((row.role == 'accent' for row in palette))

def test_outfit_harmony_reports_only_local_math() -> None:
    result = outfit_harmony((40, 80, 120), 'cool')
    assert result['relation'] in {'adjacent', 'contrast'}
    assert 'no brand' in str(result['label'])
    assert 0 <= float(result['outfit_hue']) < 360

def test_deep_skin_guard_never_exceeds_lightness_budget() -> None:
    corrected, passed = deep_skin_guard(31.0, 48.0, tolerance=1.0)
    assert passed is True
    assert corrected <= 32.0

def test_deep_skin_guard_does_not_force_darkening_when_already_safe() -> None:
    corrected, passed = deep_skin_guard(31.0, 29.5, tolerance=1.0)
    assert passed
    assert corrected == pytest.approx(29.5)

def test_concealer_plan_has_symmetric_eye_zones() -> None:
    rows = concealer_plan(0.7)
    assert len(rows) == 3
    left, right = rows[:2]
    assert left.centre[0] == pytest.approx(1 - right.centre[0])
    assert left.radius == right.radius
    assert left.angle_deg == -right.angle_deg

def test_concealer_plan_is_bounded_at_high_amount() -> None:
    rows = concealer_plan(5.0)
    assert all((0 <= row.intensity <= 1 for row in rows))

def test_under_eye_correction_reuses_eye_only_zones() -> None:
    rows = correction_plan('under_eye', 0.8)
    assert len(rows) == 2
    assert all(('eye' in row.name for row in rows))

def test_redness_correction_is_cosmetic_copy() -> None:
    rows = correction_plan('redness', 0.5)
    assert len(rows) == 2
    assert all(('cosmetic' in row.instruction for row in rows))

def test_deeper_pigmentation_requires_checked_region_semantics() -> None:
    rows = correction_plan('deeper_pigmentation', 0.5)
    assert len(rows) == 1
    assert rows[0].name == 'checked_region'
    assert 'checked' in rows[0].instruction

def test_correction_rejects_unknown_health_label() -> None:
    with pytest.raises(ValueError):
        correction_plan('diagnosed_condition', 0.5)

@pytest.mark.parametrize('shape', ['balanced', 'round', 'oval', 'square', 'heart', 'long'])
def test_blush_plan_supports_declared_face_shapes_without_beauty_score(shape: str) -> None:
    left, right = blush_plan(shape, 0.6)
    assert left.centre[0] == pytest.approx(1 - right.centre[0])
    assert 'optional' in left.instruction
    assert left.intensity == pytest.approx(right.intensity)

def test_contour_plan_explicitly_says_no_slimming() -> None:
    rows = contour_plan('round', 0.7)
    cheek = [row for row in rows if 'bronze' in row.name]
    assert len(cheek) == 2
    assert all(('no slimming' in row.instruction for row in cheek))

@pytest.mark.parametrize('name', ['cream', 'powder', 'dewy', 'matte', 'skin_tint'])
def test_finish_plans_have_texture_floor(name: str) -> None:
    plan = finish_plan(name, 0.8)
    assert plan.finish == name
    assert 0.7 <= plan.texture_floor <= 1.0
    assert 0 <= plan.coverage <= 1

def test_powder_and_dewy_have_distinct_finish_signals() -> None:
    powder = finish_plan('powder', 0.8)
    dewy = finish_plan('dewy', 0.8)
    assert powder.powder > dewy.powder
    assert powder.highlight < dewy.highlight

def test_finish_rejects_brand_name() -> None:
    with pytest.raises(ValueError):
        finish_plan('third_party_finish', 0.5)

def test_minimum_product_plan_all_steps_are_optional_or_localized() -> None:
    plan = minimal_product_plan(0.6, ('under_eye', 'redness', 'shine', 'lip', 'brow'))
    assert plan['product_count_estimate'] == 5
    assert 'optional' in str(plan['label'])
    assert len(plan['steps']) == 5

def test_minimum_product_plan_accepts_no_concerns() -> None:
    plan = minimal_product_plan(0.6, ('none',))
    assert plan['product_count_estimate'] == 0
    assert plan['steps'] == ()

def test_minimum_product_plan_rejects_diagnostic_concern() -> None:
    with pytest.raises(ValueError):
        minimal_product_plan(0.5, ('medical_diagnosis',))

def test_oxidation_timeline_starts_at_zero_delta() -> None:
    rows = oxidation_timeline(-8.0, 3.0, 8)
    assert rows[0]['delta_l_estimate'] == 0
    assert rows[0]['delta_chroma_estimate'] == 0
    assert 'user-entered' in str(rows[-1]['label'])

def test_oxidation_timeline_approaches_user_entered_delta_monotonically() -> None:
    rows = oxidation_timeline(-8.0, 3.0, 8)
    lightness = [float(row['delta_l_estimate']) for row in rows]
    chroma = [float(row['delta_chroma_estimate']) for row in rows]
    assert all((b <= a for a, b in zip(lightness, lightness[1:], strict=False)))
    assert all((b >= a for a, b in zip(chroma, chroma[1:], strict=False)))
    assert abs(lightness[-1]) < 8.0

def test_seasonal_mix_sums_to_one() -> None:
    result = seasonal_mix(0.4, 0.3)
    assert float(result['lighter_ratio']) + float(result['deeper_ratio']) == pytest.approx(1.0)
    assert 'verify' in str(result['label'])

def test_self_tan_increases_deeper_mix_ratio() -> None:
    plain = seasonal_mix(0.0, 0.0)
    tanned = seasonal_mix(0.0, 1.0)
    assert float(tanned['deeper_ratio']) > float(plain['deeper_ratio'])

def test_reference_signature_uses_only_checked_region() -> None:
    image = reference_image()
    region = checked_masks()['lip']
    sig = signature(image, region, 'lip')
    assert sig.name == 'lip'
    assert sig.coverage == pytest.approx(float((region > 0.25).mean()))
    assert 0 <= sig.hue < 360

def test_reference_signature_rejects_tiny_region() -> None:
    image = reference_image()
    tiny = np.zeros(image.shape[:2], dtype=float)
    tiny[0, 0] = 1
    with pytest.raises(ValueError):
        signature(image, tiny, 'lip')

def test_checked_reference_requires_exact_regions() -> None:
    image = reference_image()
    regions = checked_masks()
    signatures = checked_reference(image, regions)
    assert {item.name for item in signatures} == {'eye', 'cheek', 'lip'}
    with pytest.raises(ValueError):
        checked_reference(image, {'lip': regions['lip']})

def test_transfer_plan_caps_eye_strength_more_than_other_regions() -> None:
    signatures = checked_reference(reference_image(), checked_masks())
    plans = transfer_plan(signatures, 0.7)
    by_region = {str(row['region']): row for row in plans}
    assert float(by_region['eye']['strength_cap']) <= 0.52
    assert float(by_region['lip']['strength_cap']) == pytest.approx(0.7)
    assert all((row['source'] == 'user-checked local reference' for row in plans))

def test_original_event_looks_have_own_names_and_no_person_names() -> None:
    assert set(ORIGINAL_EVENT_LOOKS) == {'gallery_evening', 'city_lights', 'soft_velvet', 'copper_hour'}
    forbidden = ('celebrity', 'kardash', 'swift', 'rihanna', 'beyonce', 'reference app')
    text = repr(ORIGINAL_EVENT_LOOKS).lower()
    assert not any((word in text for word in forbidden))

@pytest.mark.parametrize('name', list(ORIGINAL_EVENT_LOOKS))
def test_event_recipe_is_original_and_bounded(name: str) -> None:
    recipe = event_recipe(name)
    assert recipe['name'] == name
    assert 'original BELJOUR' in str(recipe['source'])
    assert 0 <= float(recipe['intensity']) <= 1

def test_event_recipe_rejects_unknown_person_name() -> None:
    with pytest.raises(ValueError):
        event_recipe('famous_person')
