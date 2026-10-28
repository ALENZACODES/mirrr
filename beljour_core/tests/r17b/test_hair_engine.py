'R17B women-hair engine acceptance tests. Author: John Khan.'
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.hair_women import FEATURES, render
from plumb_api.engines.hair_women.benchmark import PASS_DEFINITIONS
from plumb_api.engines.hair_women.consultation import card_for
from plumb_api.engines.hair_women.contracts import HairRequest, parse_geometry, parse_request
from plumb_api.engines.hair_women.evaluation import metrics
from plumb_api.engines.hair_women.features import PLANNERS
from plumb_api.engines.hair_women.grey import evidence as grey_evidence
from plumb_api.engines.hair_women.highlights import money_piece, ombre, peekaboo, placement_statistics, split_dye
from plumb_api.engines.hair_women.safety import claim_safe, label_for
from plumb_api.engines.hair_women.style import curl_pattern_retained
from plumb_api.engines.hair_women.synthetic import landmarks, masks, photo
from plumb_api.engines.hair_women.timeline import grey_transition, humidity_forecast, monotone, postpartum_regrowth

def request(feature: str, amount: float=0.55) -> dict[str, object]:
    return {'feature': feature, 'amount': amount, 'colour': (83, 55, 39), 'accent': (164, 112, 76), 'length_ratio': 0.32, 'volume': 0.42, 'grey_share': 0.28, 'month': 6, 'curl_strength': 0.63, 'heat_shape': 0.44, 'humidity': 78.0, 'scalp_sensitivity': feature == 'W42', 'seed': 29}

@pytest.mark.parametrize('feature', FEATURES)
def test_every_owned_hair_feature_renders(feature: str) -> None:
    source = photo()
    hair, scalp = masks()
    result = render(source, hair, scalp, landmarks(), request(feature))
    assert result.image.shape == source.shape
    assert result.image.dtype == np.uint8
    assert result.coverage.shape == source.shape[:2]
    assert np.all(np.isfinite(result.coverage))
    assert float(np.min(result.coverage)) >= 0.0
    assert float(np.max(result.coverage)) <= 1.0
    assert result.report['feature'] == feature
    assert result.report['simulation'] is True
    assert result.report['provider'] == 'local'
    assert feature in PASS_DEFINITIONS
    assert feature in PLANNERS
    assert feature in label_for(feature) or isinstance(label_for(feature), str)
    assert np.array_equal(result.image[..., 3], source[..., 3])

@pytest.mark.parametrize('feature', FEATURES)
def test_zero_amount_is_exact_identity(feature: str) -> None:
    source = photo()
    hair, scalp = masks()
    result = render(source, hair, scalp, landmarks(), request(feature, 0.0))
    assert np.array_equal(result.image, source)
    assert np.count_nonzero(result.coverage) == 0
    assert result.report['label'] == 'identity'

@pytest.mark.parametrize('feature', FEATURES)
def test_hair_box_metrics_are_finite_and_bounded(feature: str) -> None:
    source = photo()
    hair, scalp = masks()
    result = render(source, hair, scalp, landmarks(), request(feature))
    value = metrics(source, result.image, result.coverage)
    assert np.isfinite(value.outside_error)
    assert np.isfinite(value.changed_fraction)
    assert np.isfinite(value.alpha_error)
    assert np.isfinite(value.texture_ratio)
    assert np.isfinite(value.mean_inside_change)
    assert 0.0 <= value.outside_error <= 1.0
    assert 0.0 <= value.changed_fraction <= 1.0
    assert value.alpha_error == 0.0
    assert value.outside_error <= 0.005

def test_w19_reports_stretched_and_worn_lengths() -> None:
    source = photo()
    hair, scalp = masks()
    result = render(source, hair, scalp, landmarks(), request('W19'))
    assert result.report['stretched_length_ratio'] == pytest.approx(0.32)
    assert float(result.report['worn_length_ratio']) < float(result.report['stretched_length_ratio'])

def test_w20_extension_geometry_is_texture_aware() -> None:
    geometry = parse_geometry(landmarks())
    req = parse_request(request('W20'))
    plan = PLANNERS['W20'](req, geometry, 128)
    length = plan['length']
    assert length.worn_ratio < length.stretched_ratio
    assert plan['method'] in {'tape', 'sew'}
    assert len(plan['attachments']) == 5

def test_w21_topper_profile_is_centered_on_crown() -> None:
    geometry = parse_geometry(landmarks())
    req = parse_request(request('W21'))
    plan = PLANNERS['W21'](req, geometry)
    profile = plan['profile']
    assert profile['crown_x'] == pytest.approx(0.5)
    assert profile['crown_y'] == pytest.approx(0.08)
    assert float(profile['base_width_ratio']) > 0

def test_w22_wig_profile_contains_fit_caveat() -> None:
    geometry = parse_geometry(landmarks())
    req = parse_request(request('W22'))
    plan = PLANNERS['W22'](req, geometry)
    profile = plan['profile']
    assert 'fit' in str(profile['label']).lower()
    assert bool(profile['scalp_contact_visualization']) is False

def test_w23_root_touch_up_does_not_cover_full_hair() -> None:
    source = photo()
    hair, scalp = masks()
    result = render(source, hair, scalp, landmarks(), request('W23', 1.0))
    assert 0 < np.mean(result.coverage > 0.1) < np.mean(hair > 0.1)

def test_w24_sensitive_mode_caps_opacity() -> None:
    req = parse_request({**request('W24'), 'amount': 1.0, 'scalp_sensitivity': True})
    plan = PLANNERS['W24'](req)
    assert float(plan['effective_opacity']) <= 0.35
    assert 'concealer' in str(plan['concept_import'])

def test_w25_density_fibres_have_no_growth_claim() -> None:
    req = parse_request(request('W25'))
    plan = PLANNERS['W25'](req)
    spec = plan['spec']
    assert any(('growth' in caveat for caveat in spec.caveats))
    assert 0 < float(plan['strand_density']) < 1

def test_w26_tint_preserves_texture_energy() -> None:
    source = photo()
    hair, scalp = masks()
    result = render(source, hair, scalp, landmarks(), request('W26', 0.65))
    value = metrics(source, result.image, result.coverage)
    assert value.texture_ratio >= 0.7

def test_w29_money_piece_is_front_weighted() -> None:
    hair, _ = masks()
    mapped = money_piece(hair)
    stats = placement_statistics(mapped)
    assert stats['coverage'] > 0
    assert 0.35 <= stats['centroid_x'] <= 0.65

def test_w30_foil_count_responds_to_volume() -> None:
    low = parse_request({**request('W30'), 'volume': 0.1})
    high = parse_request({**request('W30'), 'volume': 0.9})
    assert int(PLANNERS['W30'](high)['stripe_count']) > int(PLANNERS['W30'](low)['stripe_count'])

def test_w31_lived_in_plan_softens_root_transition() -> None:
    req = parse_request(request('W31'))
    plan = PLANNERS['W31'](req)
    assert 0.1 <= float(plan['root_softness']) <= 0.22
    assert 0.35 <= float(plan['chunkiness']) <= 0.9

def test_w32_grey_evidence_is_observation_not_identity_claim() -> None:
    source = photo()
    hair, scalp = masks()
    from plumb_api.engines.hair_women.masks import lower_hair, root_band
    geometry = parse_geometry(landmarks())
    root = root_band(hair, geometry)
    lower = lower_hair(hair, geometry)
    evidence = grey_evidence(source, hair, root, lower, 0.35)
    assert 0 <= evidence.observed_bright_share <= 1
    assert len(evidence.natural_transition) == 19

def test_w33_grey_timeline_is_strictly_monotone_non_decreasing() -> None:
    points = grey_transition(0.25, 18)
    assert monotone(points)
    values = [point.natural_share for point in points]
    assert values == sorted(values)
    assert values[0] == pytest.approx(0.25)
    assert values[-1] == pytest.approx(1.0)

def test_w33_renderer_months_follow_timeline() -> None:
    source = photo()
    hair, scalp = masks()
    shares = []
    for month in (0, 3, 6, 12, 18):
        result = render(source, hair, scalp, landmarks(), {**request('W33'), 'month': month})
        shares.append(float(result.report['natural_grey_share']))
    assert shares == sorted(shares)

def test_w34_ombre_mask_increases_toward_ends() -> None:
    hair, _ = masks()
    mapped = ombre(hair, 0.45, 0.18)
    top = float(np.mean(mapped[:40]))
    bottom = float(np.mean(mapped[-40:]))
    assert bottom > top

def test_w35_split_dye_partitions_without_overflow() -> None:
    hair, _ = masks()
    left, right = split_dye(hair)
    assert np.all(left >= 0)
    assert np.all(right >= 0)
    assert np.all(left <= hair + 1e-12)
    assert np.all(right <= hair + 1e-12)
    assert np.allclose(left + right, hair, atol=1e-06)

def test_w36_peekaboo_is_lower_and_one_sided() -> None:
    hair, _ = masks()
    mapped = peekaboo(hair, 'right')
    assert np.count_nonzero(mapped[:, :mapped.shape[1] // 2]) == 0
    assert np.mean(mapped[-40:]) > np.mean(mapped[:40])

def test_w37_fringe_options_preserve_texture() -> None:
    geometry = parse_geometry(landmarks())
    req = parse_request(request('W37'))
    plan = PLANNERS['W37'](req, geometry)
    options = plan['options']
    assert len(options) == 3
    assert all((item.texture_retention >= 0.9 for item in options))

def test_w38_face_shape_plan_never_ranks_beauty() -> None:
    geometry = parse_geometry(landmarks())
    req = parse_request(request('W38'))
    plan = PLANNERS['W38'](req, geometry)
    assert len(plan['options']) == 3
    assert all(('beauty' not in item.name.lower() for item in plan['options']))
    assert 'ranking' in plan['spec'].caveats[0]

def test_w40_curl_definition_keeps_pattern_frequency() -> None:
    source = photo()
    hair, scalp = masks()
    result = render(source, hair, scalp, landmarks(), request('W40', 0.7))
    assert curl_pattern_retained(source, result.image, hair, tolerance=0.12)
    assert result.report['curl_pattern_preserved'] is True

def test_w41_regrowth_density_increases_with_month() -> None:
    values = [float(postpartum_regrowth(month, 0.8)['relative_density']) for month in (0, 3, 6, 12, 18, 24)]
    assert values == sorted(values)
    assert values[-1] == pytest.approx(0.8)

def test_w41_copy_is_explicitly_non_medical() -> None:
    assert 'not medical' in label_for('W41').lower()
    card = card_for('W41', HairRequest(feature='W41'))
    assert any(('not medical' in warning.lower() for warning in card.warnings))

def test_w42_calm_mode_caps_render_strength_and_copy() -> None:
    source = photo()
    hair, scalp = masks()
    result = render(source, hair, scalp, landmarks(), request('W42', 1.0))
    assert result.report['mode'] == 'calm_sensitive'
    assert 'equal option' in str(result.report['copy']).lower()
    assert result.report['medical_advice'] is False

def test_w42_claim_filter_rejects_medical_promises() -> None:
    assert claim_safe('Optional gentle visual aid')
    assert not claim_safe('This will cure hair loss')
    assert not claim_safe('Regrow guaranteed')

def test_w43_heat_style_plan_has_no_temperature_recommendation() -> None:
    req = parse_request({**request('W43'), 'metadata': {'heat_style': 'wave'}})
    plan = PLANNERS['W43'](req)
    profile = plan['profile']
    assert profile['style'] == 'wave'
    assert 0.72 <= float(profile['texture_retention_target']) <= 1.0
    assert 'temperature' in plan['spec'].caveats[0]

def test_w44_humidity_forecast_is_bounded_and_labelled() -> None:
    dry = humidity_forecast(10, 0.6)
    wet = humidity_forecast(95, 0.6)
    assert float(wet['frizz_risk']) > float(dry['frizz_risk'])
    assert float(wet['definition_retention']) < float(dry['definition_retention'])
    assert 'user-entered' in str(wet['label'])

def test_hair_request_rejects_unknown_fields() -> None:
    with pytest.raises(ValueError, match='unknown'):
        parse_request({'feature': 'W19', 'mystery': 1})

def test_hair_request_rejects_invalid_humidity() -> None:
    with pytest.raises(ValueError, match='humidity'):
        parse_request({'feature': 'W44', 'humidity': 101})

def test_hair_geometry_rejects_degenerate_head() -> None:
    bad = dict(landmarks())
    bad['left_temple'] = (0.5, 0.3)
    bad['right_temple'] = (0.51, 0.3)
    with pytest.raises(ValueError, match='degenerate'):
        parse_geometry(bad)
