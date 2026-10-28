'Deep tests for R17B women-hair feature planning. Author: John Khan.'
from __future__ import annotations

import math

import pytest

from plumb_api.engines.hair_women.contracts import HairRequest, parse_geometry
from plumb_api.engines.hair_women.feature_models import choices, clip_in_plan, curl_definition, fibre_density, foil_map, fringe_plan, heat_style, humidity_response, integration_plan, money_piece, monotone, neutral_copy, ombre_curve, peekaboo_region, root_depth, split_partition, texture_retained, timeline, topper_plan, wig_plan, worn_length

def geometry():
    return parse_geometry({'crown': [0.5, 0.13], 'left_temple': [0.27, 0.33], 'right_temple': [0.73, 0.33], 'chin': [0.5, 0.84]})

def request(**updates):
    values = {'feature': 'W19', 'amount': 0.62, 'length_ratio': 0.7, 'volume': 0.44, 'grey_share': 0.35, 'curl_strength': 0.66, 'humidity': 62}
    values.update(updates)
    return HairRequest(**values)

def test_worn_length_is_below_stretched_for_curls() -> None:
    stretched = 1.8
    worn = worn_length(stretched, 0.8)
    assert 1.0 < worn < stretched

def test_worn_length_rejects_nonfinite() -> None:
    with pytest.raises(ValueError):
        worn_length(float('nan'), 0.5)

def test_clip_in_plan_reports_both_lengths() -> None:
    plan = clip_in_plan(request(length_ratio=0.95), geometry())
    assert plan.stretched_ratio > plan.worn_ratio
    assert 0.1 <= plan.attachment_y <= 0.82
    assert 0.45 <= plan.blend_ratio <= 1.0

def test_clip_in_plan_warns_on_long_preview() -> None:
    plan = clip_in_plan(request(length_ratio=1.0), geometry())
    assert any(('Long extension' in warning for warning in plan.warnings))

def test_clip_in_plan_warns_on_high_curl() -> None:
    plan = clip_in_plan(request(curl_strength=0.92), geometry())
    assert any(('curl shrinkage' in warning for warning in plan.warnings))

def test_integration_tape_and_sew_in_have_distinct_attachment_depths() -> None:
    base = clip_in_plan(request(), geometry())
    tape = integration_plan(request(), geometry(), 'tape')
    sew = integration_plan(request(), geometry(), 'sew_in')
    assert tape.attachment_y > base.attachment_y
    assert sew.attachment_y > tape.attachment_y
    assert sew.blend_ratio <= tape.blend_ratio

def test_integration_refuses_unknown_attachment_method() -> None:
    with pytest.raises(ValueError):
        integration_plan(request(), geometry(), 'glue')

def test_topper_plan_is_crown_bound() -> None:
    plan = topper_plan(request(volume=0.9), geometry())
    assert 0.2 <= float(plan['centre_x']) <= 0.8
    assert 0.08 <= float(plan['centre_y']) <= 0.6
    assert 0.18 <= float(plan['density_gain']) <= 0.5
    assert 'in-person' in str(plan['label'])

def test_wig_plan_has_no_fit_claim() -> None:
    plan = wig_plan(request(), geometry())
    assert plan['simulation'] is True
    assert 0.32 <= float(plan['cap_width_ratio']) <= 0.72
    assert 'fit' in str(plan['label']).lower()

def test_fringe_styles_change_drop_or_width() -> None:
    soft = fringe_plan(request(), geometry(), 'soft')
    full = fringe_plan(request(), geometry(), 'full')
    side = fringe_plan(request(), geometry(), 'side')
    assert full['drop'] > soft['drop']
    assert side['width'] < soft['width']

def test_fringe_rejects_unknown_style() -> None:
    with pytest.raises(ValueError):
        fringe_plan(request(), geometry(), 'copied_brand_style')

def test_root_depth_opacity_is_monotone() -> None:
    low = root_depth(0.1)
    mid = root_depth(0.5)
    high = root_depth(0.9)
    assert float(low['opacity']) < float(mid['opacity']) < float(high['opacity'])

def test_root_depth_bounds_width() -> None:
    assert root_depth(0.5, 0.001)['band_ratio'] == pytest.approx(0.03)
    assert root_depth(0.5, 0.9)['band_ratio'] == pytest.approx(0.22)

def test_money_piece_is_symmetric() -> None:
    left, right = money_piece(0.7)
    assert left.side == 'left'
    assert right.side == 'right'
    assert left.end - left.start == pytest.approx(right.end - right.start)
    assert left.weight == pytest.approx(right.weight)

@pytest.mark.parametrize('style', ['babylights', 'lowlights', 'balanced', 'chunky', 'lived_in'])
def test_foil_maps_are_bounded_and_deterministic(style: str) -> None:
    a = foil_map(style, 0.7, seed=31)
    b = foil_map(style, 0.7, seed=31)
    assert a == b
    assert len(a) >= 2
    assert all((0 <= band.start < band.end <= 1 for band in a))
    assert all((0 <= band.weight <= 1 for band in a))

def test_babylights_use_more_narrow_bands_than_chunky() -> None:
    baby = foil_map('babylights', 0.8)
    chunky = foil_map('chunky', 0.8)
    assert len(baby) > len(chunky)
    assert max((b.end - b.start for b in baby)) < max((b.end - b.start for b in chunky))

def test_foil_map_rejects_unknown_style() -> None:
    with pytest.raises(ValueError):
        foil_map('brand_signature', 0.5)

def test_ombre_curve_is_monotone() -> None:
    curve = ombre_curve(0.55, 0.12, 41)
    assert len(curve) == 41
    assert all((b >= a for a, b in zip(curve, curve[1:], strict=False)))
    assert curve[0] < 0.1
    assert curve[-1] > 0.9

def test_ombre_softness_changes_transition_slope() -> None:
    hard = ombre_curve(0.5, 0.04, 21)
    soft = ombre_curve(0.5, 0.25, 21)
    assert hard[8] < soft[8]
    assert hard[12] > soft[12]

def test_split_partition_leaves_feather_gap() -> None:
    partition = split_partition(0.52, 0.03)
    assert partition['left_end'] < partition['part_x'] < partition['right_start']
    assert partition['right_start'] - partition['left_end'] == pytest.approx(0.06)

@pytest.mark.parametrize('side', ['left', 'right', 'both'])
def test_peekaboo_region_uses_only_allowed_sides(side: str) -> None:
    region = peekaboo_region(side, 0.65)
    assert region['side'] == side
    assert 0.4 <= float(region['lower_start']) <= 0.52
    assert 0.18 <= float(region['outer_width']) <= 0.32

def test_peekaboo_rejects_unknown_side() -> None:
    with pytest.raises(ValueError):
        peekaboo_region('centre', 0.5)

def test_curl_definition_preserves_texture_floor() -> None:
    plan = curl_definition(0.78, 0.9)
    assert plan.texture_floor >= 0.72
    assert plan.definition > plan.smoothing
    assert 'appearance' in plan.warning

def test_heat_style_is_more_smoothing_than_low_curl_definition() -> None:
    base = curl_definition(0.5, 0.6)
    heat = heat_style(0.5, 0.9, 0.8)
    assert heat.smoothing > base.smoothing
    assert heat.texture_floor >= 0.68
    assert 'heat' in heat.warning.lower()

def test_humidity_risk_increases_with_user_entered_humidity() -> None:
    dry = humidity_response(20, 0.7)
    wet = humidity_response(90, 0.7)
    assert dry.humidity_risk < wet.humidity_risk
    assert dry.definition > wet.definition
    assert 'user-entered' in wet.warning

def test_humidity_accepts_fraction_or_percent() -> None:
    fraction = humidity_response(0.6, 0.5)
    percent = humidity_response(60, 0.5)
    assert fraction.humidity_risk == pytest.approx(percent.humidity_risk)

def test_fibre_density_sensitive_mode_has_lower_cap() -> None:
    normal = fibre_density(0.4, 1.0, False)
    sensitive = fibre_density(0.4, 1.0, True)
    assert float(sensitive['visual_gain']) < float(normal['visual_gain'])
    assert sensitive['sensitive_mode'] is True
    assert 'not hair growth' in str(sensitive['label'])

def test_texture_retained_passes_at_floor() -> None:
    ratio, passed = texture_retained(10.0, 7.1, 0.7)
    assert ratio == pytest.approx(0.71)
    assert passed is True

def test_texture_retained_handles_zero_baseline() -> None:
    ratio, passed = texture_retained(0.0, 0.0)
    assert ratio == 1.0
    assert passed is True

def test_texture_retained_rejects_negative_energy() -> None:
    with pytest.raises(ValueError):
        texture_retained(-1.0, 1.0)

def test_grey_choices_keep_is_first_class() -> None:
    rows = choices(0.55)
    keep = rows[0]
    assert keep.id == 'keep'
    assert keep.colour_fraction == 0
    assert keep.maintenance_weeks is None

def test_grey_choices_include_blend_cover_and_grow_out() -> None:
    ids = [row.id for row in choices(0.4)]
    assert ids == ['keep', 'blend', 'cover', 'grow_out']

def test_grey_timeline_is_monotone() -> None:
    rows = timeline(0.25, months=18)
    assert monotone(rows)
    assert rows[0].natural_fraction == pytest.approx(0.25)
    assert rows[-1].natural_fraction == pytest.approx(1.0)
    assert rows[-1].regrowth_cm > rows[0].regrowth_cm

def test_grey_timeline_stage_progresses() -> None:
    rows = timeline(0.35, months=12)
    stages = [row.transition_stage for row in rows]
    assert stages[0] == 'early contrast'
    assert 'blended transition' in stages
    assert stages[-1] == 'mostly natural'

def test_grey_timeline_rejects_impossible_growth_rate() -> None:
    with pytest.raises(ValueError):
        timeline(0.3, months=12, growth_cm=0)

def test_grey_neutral_copy_avoids_age_correction_language() -> None:
    copy = ' '.join(neutral_copy()).lower()
    assert 'equal option' in copy
    assert 'not age-correction' in copy
    assert 'younger' not in copy

def test_all_feature_model_numbers_are_finite() -> None:
    models = [clip_in_plan(request(), geometry()).worn_ratio, float(topper_plan(request(), geometry())['density_gain']), float(wig_plan(request(), geometry())['hairline_softness']), float(root_depth(0.6)['opacity']), money_piece(0.6)[0].weight, ombre_curve(0.5, 0.1)[5], curl_definition(0.6, 0.7).texture_floor, heat_style(0.6, 0.7, 0.7).definition, humidity_response(55, 0.6).humidity_risk, timeline(0.3)[5].natural_fraction]
    assert all((math.isfinite(value) for value in models))
