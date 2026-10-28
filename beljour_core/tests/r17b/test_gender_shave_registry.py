'R17B gender-look, shave and registry integration tests. Author: John Khan.'
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.arena import registry
from plumb_api.arena.r17b_registry import HAIR_IDS, IDS, MAKEUP_IDS, WORKFLOW_IDS, built_entries
from plumb_api.engines.gender_look import render as render_gender
from plumb_api.engines.gender_look.evaluation import cheek_delta, identity_pins
from plumb_api.engines.gender_look.signals import signal_report
from plumb_api.engines.shave import render as render_shave
from plumb_api.engines.shave.evaluation import metrics as shave_metrics
from plumb_api.engines.shave.evaluation import passed as shave_passed

def fixture() -> tuple[np.ndarray, dict[str, np.ndarray]]:
    h, w = (96, 80)
    yy, xx = np.mgrid[:h, :w]
    image = np.zeros((h, w, 4), dtype=np.uint8)
    image[..., 0] = np.clip(112 + xx * 0.18 + yy * 0.06, 0, 255).astype(np.uint8)
    image[..., 1] = np.clip(82 + xx * 0.12 + yy * 0.05, 0, 255).astype(np.uint8)
    image[..., 2] = np.clip(68 + xx * 0.09 + yy * 0.04, 0, 255).astype(np.uint8)
    image[..., 3] = 255
    x = xx / (w - 1)
    y = yy / (h - 1)
    skin = (((x - 0.5) / 0.31) ** 2 + ((y - 0.48) / 0.38) ** 2 <= 1).astype(float)
    brow = ((((x - 0.38) / 0.11) ** 2 + ((y - 0.35) / 0.025) ** 2 <= 1) | (((x - 0.62) / 0.11) ** 2 + ((y - 0.35) / 0.025) ** 2 <= 1)).astype(float)
    stubble = (skin * (y > 0.56) * (y < 0.76)).astype(float)
    cheek = (skin * (y > 0.48) * (y < 0.62)).astype(float)
    return (image, {'skin': skin, 'brow': brow, 'stubble': stubble, 'cheek': cheek})

@pytest.mark.parametrize('direction', ['feminine', 'masculine', 'neutral'])
@pytest.mark.parametrize('level', ['normal', 'extra', 'hyper'])
def test_gender_look_levels_render_without_geometry(direction: str, level: str) -> None:
    image, masks = fixture()
    result, report = render_gender(image, masks, {'direction': direction, 'level': level, 'amount': 0.6})
    assert result.shape == image.shape
    assert result.dtype == np.uint8
    assert report['identity_geometry_changed'] is False
    assert report['simulation'] is True
    assert np.array_equal(result[..., 3], image[..., 3])

def test_gender_look_intensity_increases_by_level() -> None:
    image, masks = fixture()
    deltas = []
    for level in ('normal', 'extra', 'hyper'):
        result, _ = render_gender(image, masks, {'direction': 'masculine', 'level': level, 'amount': 1.0})
        deltas.append(float(np.mean(np.abs(result[..., :3].astype(float) - image[..., :3].astype(float)))))
    assert deltas == sorted(deltas)

def test_gender_look_identity_pins_hold_exactly() -> None:
    points = np.array([[0.2, 0.3], [0.5, 0.5], [0.8, 0.3]], dtype=float)
    assert identity_pins(points, points.copy())
    moved = points.copy()
    moved[0, 0] += 0.01
    assert not identity_pins(points, moved)

def test_gender_look_signal_report_is_finite() -> None:
    image, masks = fixture()
    result, _ = render_gender(image, masks, {'direction': 'feminine', 'level': 'extra', 'amount': 0.7})
    report = signal_report(image, result, masks)
    assert set(report) == {'brow_darkness_before', 'brow_darkness_after', 'skin_texture_before', 'skin_texture_after', 'stubble_darkness_before', 'stubble_darkness_after'}
    assert all((np.isfinite(value) for value in report.values()))

def test_gender_look_cheek_delta_is_bounded() -> None:
    image, masks = fixture()
    result, _ = render_gender(image, masks, {'direction': 'masculine', 'level': 'hyper', 'amount': 0.7})
    assert cheek_delta(image, result, masks['cheek']) <= 4

def test_clean_shave_is_labelled_estimate() -> None:
    image, masks = fixture()
    result, report = render_shave(image, masks['stubble'], masks['cheek'], 0.8)
    assert result.shape == image.shape
    assert report['simulation'] is True
    assert 'estimate' in str(report['label']).lower()
    assert 'short beards' in str(report['suitable_scope']).lower()

def test_clean_shave_preserves_alpha() -> None:
    image, masks = fixture()
    result, _ = render_shave(image, masks['stubble'], masks['cheek'], 1.0)
    assert np.array_equal(result[..., 3], image[..., 3])

def test_clean_shave_changes_only_declared_beard_area() -> None:
    image, masks = fixture()
    result, _ = render_shave(image, masks['stubble'], masks['cheek'], 0.8)
    value = shave_metrics(image, result, masks['stubble'], masks['cheek'])
    assert value.outside_error <= 0.005
    assert value.alpha_error == 0
    assert shave_passed(value)

def test_clean_shave_cheek_delta_meets_declared_gate() -> None:
    image, masks = fixture()
    result, report = render_shave(image, masks['stubble'], masks['cheek'], 0.65)
    value = shave_metrics(image, result, masks['stubble'], masks['cheek'])
    assert value.cheek_delta_e_proxy <= 4
    assert float(report['cheek_delta_e_proxy']) <= 4

def test_r17_registry_owns_exact_requested_w_rows() -> None:
    assert len(HAIR_IDS) == 23
    assert len(MAKEUP_IDS) == 15
    assert len(WORKFLOW_IDS) == 4
    assert len(IDS) == 42
    assert 'W27' not in IDS
    assert 'W3' not in IDS
    assert 'W15' not in IDS
    assert 'W28' not in IDS
    assert 'W39' not in IDS

def test_r17_registry_built_entries_are_complete() -> None:
    entries = built_entries()
    assert set(entries) == set(IDS)
    for wid, row in entries.items():
        assert row['status'] == 'built'
        assert row['tested'] == 'Not tested'
        assert row['evidence_status'] == 'synthetic_verified_realface_unproven'
        assert row['implementation_provider'] == 'local procedural fallback'
        assert 'realface' in row['note'].lower()
        assert wid.startswith('W')

def test_r17_combined_view_preserves_order_and_prior_built_rows() -> None:
    rows = registry.effective_women_rows_r17b()
    assert [row['id'] for row in rows] == [f'W{i}' for i in range(1, 101)]
    by_id = {row['id']: row for row in rows}
    for wid in IDS:
        assert by_id[wid]['status'] == 'built'
    for wid in ('W45', 'W59', 'W77'):
        assert by_id[wid]['status'] == 'built'

def test_r17_legacy_r15_view_is_not_mutated() -> None:
    legacy = registry.effective_women_rows()
    by_id = {row['id']: row for row in legacy}
    assert by_id['W59']['status'] == 'built'
    assert by_id['W19']['status'] != 'built'

def test_r17_r16_view_is_not_mutated() -> None:
    r16 = registry.effective_women_rows_r16b()
    by_id = {row['id']: row for row in r16}
    assert by_id['W45']['status'] == 'built'
    assert by_id['W77']['status'] == 'built'
    assert by_id['W19']['status'] != 'built'

def test_r17_extras_add_one_lane_ownership_record() -> None:
    before = registry.extras_r16b()
    after = registry.extras_r17b()
    assert len(after) == len(before) + 1
    assert after[:-1] == before
    assert after[-1]['id'] == 'r17b-hair-makeup-workflow-upscale-gender-shave'
