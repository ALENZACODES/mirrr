'R17B workflow and classical upscale tests. Author: John Khan.'
from __future__ import annotations

from datetime import date

import numpy as np
import pytest

from plumb_api.engines.upscale import psnr, ringing_score, ssim_proxy, upscale
from plumb_api.engines.upscale.evaluation import evaluate
from plumb_api.engines.upscale.pyramid import build, detail_strength, recommended_detail, summaries
from plumb_api.engines.upscale.reference import downsample_box, resize_image, synthetic_detail
from plumb_api.engines.upscale.ringing import clamp_neighbourhood, edge_overshoot_share, score
from plumb_api.engines.workflow_w import run
from plumb_api.engines.workflow_w.calendar import schedule
from plumb_api.engines.workflow_w.evaluation import pass_result
from plumb_api.engines.workflow_w.passport import decode as decode_passport
from plumb_api.engines.workflow_w.passport import encode as encode_passport
from plumb_api.engines.workflow_w.passport import payload as passport_payload
from plumb_api.engines.workflow_w.pricing import estimate

def test_w94_price_estimate_orders_ranges_and_labels_assumption() -> None:
    result = run({'feature': 'W94', 'city': 'Toronto', 'service': 'colour consultation', 'price_low': 120, 'price_high': 220, 'sessions': 2, 'maintenance_weeks': 10})
    assert result['initial_low'] == 240
    assert result['initial_high'] == 440
    assert float(result['year1_low']) < float(result['year1_high'])
    assert 'estimate' in str(result['label']).lower()
    assert pass_result(result)

def test_w94_rejects_inverted_price_band() -> None:
    with pytest.raises(ValueError, match='price band'):
        estimate(300, 100, 1, 8)

def test_w94_has_no_affiliate_steering_field() -> None:
    result = run({'feature': 'W94', 'service': 'cut', 'price_low': 80, 'price_high': 150})
    text = str(result).lower()
    assert 'affiliate' in text
    assert 'partner_salon' not in result
    assert 'buy' not in result

def test_w96_saved_occasion_is_local_reference_only() -> None:
    result = run({'feature': 'W96', 'occasion': 'work dinner', 'look_id': 'recipe-17'})
    assert result == {'feature': 'W96', 'occasion': 'work dinner', 'look_id': 'recipe-17', 'storage': 'local recipe reference', 'network': False}
    assert pass_result(result)

def test_w96_requires_occasion_and_look_id() -> None:
    with pytest.raises(ValueError):
        run({'feature': 'W96', 'occasion': '', 'look_id': 'recipe'})
    with pytest.raises(ValueError):
        run({'feature': 'W96', 'occasion': 'dinner', 'look_id': ''})

def test_w99_calendar_dates_are_deterministic() -> None:
    rows = schedule(date(2026, 10, 24), 6, 5)
    assert [row['date'] for row in rows] == ['2026-10-24', '2026-12-05', '2027-01-16', '2027-02-27', '2027-04-10']
    assert all(('estimated' in str(row['label']) for row in rows))

def test_w99_engine_uses_explicit_start_date() -> None:
    result = run({'feature': 'W99', 'maintenance_weeks': 4, 'metadata': {'start_date': '2026-11-01'}})
    calendar = result['calendar']
    assert calendar[0]['date'] == '2026-11-01'
    assert calendar[1]['date'] == '2026-11-29'
    assert pass_result(result)

def test_w100_passport_round_trip_and_integrity() -> None:
    payload = passport_payload(42.0, 'olive', 'level 4 neutral brown', ('fragrance',), '2026-10-24')
    encoded = encode_passport(payload)
    decoded = decode_passport(encoded)
    assert decoded == payload
    assert decoded['privacy'].startswith('local export')

def test_w100_passport_rejects_tamper() -> None:
    payload = passport_payload(42.0, 'neutral', 'dark brown', (), '2026-10-24')
    encoded = encode_passport(payload)
    tampered = encoded.replace('neutral', 'warm')
    with pytest.raises(ValueError, match='integrity'):
        decode_passport(tampered)

def test_w100_engine_does_not_claim_encryption_it_does_not_do() -> None:
    result = run({'feature': 'W100', 'depth': 42, 'undertone': 'olive', 'hair_base': 'neutral brown', 'allergens': ['fragrance'], 'measured_on': '2026-10-24'})
    assert result['network'] is False
    assert result['encrypted'] is False
    assert 'encrypt externally' in str(result['note'])
    assert decode_passport(str(result['export']))['undertone'] == 'olive'

def test_upscale_2x_beats_baseline_on_declared_synthetic_case() -> None:
    report = evaluate(2)
    assert report.passed
    assert report.ours_psnr >= report.baseline_psnr
    assert report.ours_ssim >= report.baseline_ssim
    assert report.ringing <= 0.55

def test_upscale_4x_beats_baseline_on_declared_synthetic_case() -> None:
    report = evaluate(4)
    assert report.passed
    assert report.ours_psnr >= report.baseline_psnr
    assert report.ours_ssim >= report.baseline_ssim
    assert report.ringing <= 0.55

def test_upscale_preserves_rgba_alpha_shape() -> None:
    rgb = synthetic_detail(32, 40)
    alpha = np.linspace(0, 255, 32 * 40, dtype=np.uint8).reshape(32, 40)
    source = np.dstack([rgb, alpha])
    result = upscale(source, 2, 0.5)
    assert result.shape == (64, 80, 4)
    assert result.dtype == np.uint8
    assert int(result[..., 3].min()) >= 0
    assert int(result[..., 3].max()) <= 255

def test_upscale_rejects_invalid_scale() -> None:
    with pytest.raises(ValueError, match='scale'):
        upscale(synthetic_detail(16, 16), 3)

def test_upscale_rejects_invalid_detail_strength() -> None:
    with pytest.raises(ValueError, match='detail'):
        upscale(synthetic_detail(16, 16), 2, 1.1)

def test_upscale_objective_metrics_are_identity_perfect() -> None:
    image = synthetic_detail(32, 32)
    assert psnr(image, image) == float('inf')
    assert ssim_proxy(image, image) == pytest.approx(1.0)

def test_upscale_ringing_is_low_on_synthetic_output() -> None:
    truth = synthetic_detail(64, 64)
    low = downsample_box(truth, 2)
    result = upscale(low, 2, 0.5)
    assert ringing_score(result) <= 0.55

def test_pyramid_has_decreasing_sizes() -> None:
    image = synthetic_detail(64, 64)
    channel = image[..., 0]
    levels = build(channel, 4)
    assert [level.shape for level in levels] == [(64, 64), (32, 32), (16, 16), (8, 8)]

def test_pyramid_summaries_are_finite() -> None:
    values = summaries(synthetic_detail(64, 64)[..., 0], 4)
    assert len(values) == 4
    for value in values:
        assert value.mean_detail >= 0
        assert value.p95_detail >= value.mean_detail
        assert 0 <= value.edge_share <= 1

def test_recommended_detail_is_bounded() -> None:
    strength = detail_strength(synthetic_detail(64, 64)[..., 0])
    recommendation = recommended_detail(synthetic_detail(64, 64)[..., 0])
    assert strength >= 0
    assert 0.3 <= recommendation <= 0.58

def test_ringing_clamp_respects_reference_neighbourhood() -> None:
    truth = synthetic_detail(32, 32)[..., 0].astype(float)
    exaggerated = truth.copy()
    exaggerated[16, 16] = 255
    clamped = clamp_neighbourhood(exaggerated, truth, 4)
    assert clamped[16, 16] <= np.max(truth[15:18, 15:18]) + 4
    assert score(clamped) <= score(exaggerated)

def test_edge_overshoot_share_is_zero_for_reference() -> None:
    channel = synthetic_detail(32, 32)[..., 0].astype(float)
    assert edge_overshoot_share(channel, channel) == pytest.approx(0.0)

def test_baseline_resize_has_expected_shape() -> None:
    low = synthetic_detail(16, 18)
    result = resize_image(low, 4)
    assert result.shape == (64, 72, 3)
