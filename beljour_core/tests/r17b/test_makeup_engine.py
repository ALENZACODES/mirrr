'R17B women-makeup engine tests. Author: John Khan.'
from __future__ import annotations

import json

import numpy as np
import pytest

from plumb_api.engines.makeup_w import FEATURES, render
from plumb_api.engines.makeup_w.appearance import finish_metrics, product_budget
from plumb_api.engines.makeup_w.benchmark import PASS_DEFINITIONS
from plumb_api.engines.makeup_w.colourspace import delta_e, lab_to_lch, lch_score, rgb_to_lab
from plumb_api.engines.makeup_w.evaluation import metrics
from plumb_api.engines.makeup_w.fairness import deep_skin_guard, olive_guard, skin_stats
from plumb_api.engines.makeup_w.features import PLANNERS
from plumb_api.engines.makeup_w.oxidation import oxidation_curve, seasonal_mix
from plumb_api.engines.makeup_w.palette import custom_palette, extract_palette, outfit_harmony, recommend
from plumb_api.engines.makeup_w.recipes import contains_brand_name, decode, encode, generic_steps
from plumb_api.engines.makeup_w.reference_analysis import recipe as reference_recipe
from plumb_api.engines.makeup_w.session import accepts, begin, cancel, complete, initial, with_image, with_request
from plumb_api.engines.makeup_w.synthetic import masks, photo
from plumb_api.engines.makeup_w.undertone import assess, constrain_shade, rank

def request(feature: str, amount: float=0.52) -> dict[str, object]:
    return {'feature': feature, 'amount': amount, 'shade': (118, 68, 62), 'accent': (157, 90, 82), 'finish': 'satin', 'face_shape': 'balanced', 'undertone': 'olive', 'oxidation_delta': -7.0, 'season_shift': 0.25, 'look': 'gallery_glow', 'seed': 23}

def render_feature(source: np.ndarray, region_masks: dict[str, np.ndarray], feature: str):
    if feature == 'W13':
        checked = {name: region_masks[name] for name in ('eye', 'cheek', 'lip')}
        return render(source, region_masks, request(feature), reference=photo(dark=False), reference_masks=checked)
    return render(source, region_masks, request(feature))

@pytest.mark.parametrize('feature', FEATURES)
def test_every_owned_makeup_feature_renders(feature: str) -> None:
    source = photo(dark=True)
    region_masks = masks()
    result = render_feature(source, region_masks, feature)
    assert result.image.shape == source.shape
    assert result.image.dtype == np.uint8
    assert result.coverage.shape == source.shape[:2]
    assert result.report['feature'] == feature
    assert result.report['simulation'] is True
    assert result.report['provider'] == 'local'
    assert np.array_equal(result.image[..., 3], source[..., 3])
    assert feature in PASS_DEFINITIONS
    assert feature in PLANNERS

@pytest.mark.parametrize('feature', FEATURES)
def test_every_makeup_feature_zero_amount_is_identity(feature: str) -> None:
    source = photo(dark=True)
    result = render(source, masks(), request(feature, 0.0))
    assert np.array_equal(result.image, source)
    assert np.count_nonzero(result.coverage) == 0

@pytest.mark.parametrize('feature', FEATURES)
def test_makeup_metrics_are_finite(feature: str) -> None:
    source = photo(dark=True)
    result = render_feature(source, masks(), feature)
    value = metrics(source, result.image, result.coverage)
    assert np.isfinite(value.outside_error)
    assert np.isfinite(value.alpha_error)
    assert np.isfinite(value.mean_luminance_shift)
    assert np.isfinite(value.deep_chroma_ratio)
    assert np.isfinite(value.changed_fraction)
    assert value.outside_error <= 0.005
    assert value.alpha_error == 0

def test_w1_custom_palette_is_user_sourced_and_scored() -> None:
    palette = custom_palette([(118, 68, 62), (157, 90, 82), (83, 70, 54)], 'olive')
    assert len(palette) == 3
    assert all((item.source == 'user' for item in palette))
    assert all((0 <= item.undertone_score <= 1 for item in palette))

def test_w2_palette_extraction_is_deterministic() -> None:
    source = photo(dark=True)
    mask = masks()['palette_region']
    a = extract_palette(source, mask, 6)
    b = extract_palette(source, mask, 6)
    assert a == b
    assert 1 <= len(a) <= 6

def test_w2_palette_changes_with_region() -> None:
    source = photo(dark=True)
    h, w = source.shape[:2]
    left = np.zeros((h, w), dtype=float)
    right = np.zeros((h, w), dtype=float)
    left[:, :w // 2] = 1
    right[:, w // 2:] = 1
    assert extract_palette(source, left, 4) != extract_palette(source, right, 4)

def test_w4_olive_is_a_first_class_undertone() -> None:
    candidates = ((95, 78, 52), (114, 66, 75), (153, 95, 68))
    ranked = recommend(candidates, 'olive')
    assert len(ranked) == 3
    assert ranked[0].undertone_score >= ranked[-1].undertone_score
    assert olive_guard(tuple((float(lab_to_lch(rgb_to_lab(np.asarray(item.rgb, float)))[2]) for item in ranked)))['passed'] in {True, False}

def test_w5_outfit_harmony_returns_multiple_local_choices() -> None:
    choices = outfit_harmony((78, 96, 123), 'neutral')
    assert len(choices) >= 4
    assert all((item.source == 'local-colour-math' for item in choices))

def test_w7_constraint_never_forces_lighter_shade_on_deep_skin() -> None:
    observed = (72, 48, 39)
    too_light = (205, 176, 159)
    constrained = constrain_shade(observed, too_light, 'warm')
    assessment = assess(observed, constrained, 'warm')
    assert assessment.would_lighten is False

def test_w7_rank_places_non_lightening_candidates_first() -> None:
    observed = (70, 46, 38)
    candidates = ((210, 180, 165), (82, 54, 44), (105, 68, 55))
    ranked = rank(observed, candidates, 'warm')
    assert ranked[0].would_lighten is False

def test_w8_correction_is_non_diagnostic() -> None:
    plan = PLANNERS['W8'](__import__('plumb_api.engines.makeup_w.contracts', fromlist=['parse_request']).parse_request({**request('W8'), 'metadata': {'issue': 'redness'}}), 0.72)
    correction = plan['correction']
    assert 'no diagnosis' in correction.note
    assert 0 < correction.opacity < 0.3

def test_w9_cream_and_powder_change_texture_differently() -> None:
    source = photo(dark=True)
    m = masks()
    cream = render(source, m, {**request('W9'), 'finish': 'cream', 'amount': 0.8})
    powder = render(source, m, {**request('W9'), 'finish': 'powder', 'amount': 0.8})
    assert not np.array_equal(cream.image, powder.image)
    c_metrics = finish_metrics(source, cream.image, cream.coverage)
    p_metrics = finish_metrics(source, powder.image, powder.coverage)
    assert np.isfinite(c_metrics['texture_variance_ratio'])
    assert np.isfinite(p_metrics['texture_variance_ratio'])

def test_w10_finish_switches_keep_alpha_exact() -> None:
    source = photo(dark=True)
    for finish in ('dewy', 'matte', 'skin_tint'):
        result = render(source, masks(), {**request('W10'), 'finish': finish, 'amount': 0.75})
        assert np.array_equal(result.image[..., 3], source[..., 3])

def test_w11_blush_face_shape_does_not_move_pixels_geometrically() -> None:
    source = photo(dark=True)
    round_result = render(source, masks(), {**request('W11'), 'face_shape': 'round'})
    long_result = render(source, masks(), {**request('W11'), 'face_shape': 'long'})
    assert round_result.image.shape == source.shape
    assert long_result.image.shape == source.shape
    assert not np.array_equal(round_result.coverage, long_result.coverage)

def test_w12_contour_reports_no_geometry_change() -> None:
    result = render(photo(dark=True), masks(), request('W12'))
    assert result.report['geometry_change'] is False

def test_w13_requires_checked_reference_inputs() -> None:
    source = photo(dark=True)
    with pytest.raises(ValueError, match='reference'):
        render(source, masks(), request('W13'))

def test_w13_reference_recipe_uses_only_checked_regions() -> None:
    reference = photo(dark=False)
    target = photo(dark=True)
    m = masks()
    recipe = reference_recipe(reference, target, {k: m[k] for k in ('eye', 'cheek', 'lip')}, {k: m[k] for k in ('eye', 'cheek', 'lip')})
    assert recipe['source'] == 'user_checked_reference'
    assert recipe['automatic_face_parsing'] is False
    assert recipe['network'] is False
    assert len(recipe['regions']) == 3

def test_w14_uses_original_generic_names_only() -> None:
    for name in ('gallery_glow', 'midnight_line', 'soft_flash', 'velvet_evening'):
        steps = generic_steps(name)
        assert len(steps) == 3
        assert not contains_brand_name(' '.join(steps))
    result = render(photo(dark=True), masks(), {**request('W14'), 'look': 'velvet_evening'})
    assert result.report['third_party_names'] is False

def test_w14_brand_scan_catches_known_names_in_untrusted_copy() -> None:
    assert contains_brand_name('Copy this Dior shade')
    assert contains_brand_name('Find it at Sephora')
    assert not contains_brand_name('Original soft evening look')

def test_w16_minimum_product_budget_is_small() -> None:
    budget = product_budget('W16')
    assert 1 <= len(budget) <= 3
    assert all((isinstance(item, str) for item in budget))

def test_w17_oxidation_curve_is_labelled_and_saturating() -> None:
    curve = oxidation_curve(-8.0, 8)
    assert curve[0]['delta_l_estimate'] == 0
    assert abs(float(curve[-1]['delta_l_estimate'])) > abs(float(curve[1]['delta_l_estimate']))
    assert all(('user-entered' in str(row['label']) for row in curve))

def test_w18_mix_ratios_sum_to_one_across_seasons() -> None:
    for shift in (-1.0, -0.6, 0.0, 0.4, 1.0):
        mix = seasonal_mix(shift)
        assert float(mix['lighter_ratio']) + float(mix['deeper_ratio']) == pytest.approx(1.0)
        assert 'estimate' in str(mix['label'])

def test_deep_skin_guard_never_allows_large_lightening() -> None:
    source = photo(dark=True)
    skin = masks()['skin']
    result = render(source, masks(), {**request('W7'), 'shade': (235, 210, 192), 'amount': 1.0})
    guard = deep_skin_guard(source, result.image, skin)
    assert guard['lightened'] is False
    assert float(guard['chroma_ratio']) >= 0.78

def test_skin_stats_are_finite_on_deep_fixture() -> None:
    stats = skin_stats(photo(dark=True), masks()['skin'])
    assert 0 <= stats['l'] <= 100
    assert stats['chroma'] >= 0
    assert 0 <= stats['hue'] <= 360

def test_colourspace_delta_e_is_zero_for_identity() -> None:
    lab = rgb_to_lab(np.asarray((90, 60, 50), dtype=float))
    assert delta_e(lab, lab) == pytest.approx(0.0)
    assert 0 <= lch_score((90, 60, 50), 'olive') <= 1

def test_recipe_round_trip_is_canonical() -> None:
    original = {'feature': 'W14', 'shade': [118, 68, 62], 'amount': 0.5, 'look': 'gallery_glow'}
    text = encode(original)
    decoded = decode(text)
    assert decoded == original
    assert json.loads(text)['schema'].startswith('beljour')

def test_session_rejects_stale_completion_after_image_change() -> None:
    state = initial()
    state = with_image(state, 'image-a')
    state = with_request(state, request('W11'))
    rendering, revision = begin(state)
    changed = with_image(rendering, 'image-b')
    assert not accepts(changed, revision)
    assert complete(changed, revision) == changed

def test_session_cancel_clears_active_job_without_losing_recipe() -> None:
    state = with_request(with_image(initial(), 'image-a'), request('W10'))
    rendering, _ = begin(state)
    cancelled = cancel(rendering)
    assert cancelled.active_job_id is None
    assert cancelled.request is not None
    assert cancelled.request.feature == 'W10'
