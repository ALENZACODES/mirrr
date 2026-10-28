"""R16 Lane B feature tests. Author: John Khan."""
from __future__ import annotations
import numpy as np
import pytest
from plumb_api.engines.lips import render as render_lip
from plumb_api.engines.lips.contracts import FEATURES as LIP_FEATURES
from plumb_api.engines.lips.benchmark import PASS_DEFINITIONS as LIP_PASS, metrics as lip_metrics
from plumb_api.engines.smile import render as render_smile, render_sequence
from plumb_api.engines.smile.benchmark import PASS_DEFINITIONS as SMILE_PASS, metrics as smile_metrics
from plumb_api.engines.skin_more import render as render_skin
from plumb_api.engines.skin_more.contracts import FEATURES as SKIN_FEATURES
from plumb_api.engines.skin_more.benchmark import PASS_DEFINITIONS as SKIN_PASS, metrics as skin_metrics
from plumb_api.engines.skin_more.diary import aligned_series, pattern_summary, export_rows

def photo(h: int=96, w: int=96) -> np.ndarray:
    yy, xx = np.mgrid[:h, :w]
    out = np.zeros((h, w, 4), np.uint8)
    out[..., 0] = 150 + xx % 35
    out[..., 1] = 105 + yy % 30
    out[..., 2] = 90 + (xx + yy) % 20
    out[..., 3] = 255
    return out

def landmarks() -> np.ndarray:
    p = np.full((478, 2), 0.5, float)
    lip = np.array([[0.39, 0.66], [0.43, 0.64], [0.47, 0.635], [0.5, 0.64], [0.53, 0.635], [0.57, 0.64], [0.61, 0.66], [0.58, 0.69], [0.54, 0.705], [0.5, 0.71], [0.46, 0.705], [0.42, 0.69]])
    ids = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308]
    for i, j in enumerate(ids):
        p[j] = lip[i]
    for i, j in enumerate([324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415]):
        p[j] = lip[i % len(lip)]
    return p

def ann() -> dict[str, object]:
    return {'teeth': [[0.42, 0.64], [0.58, 0.64], [0.57, 0.7], [0.43, 0.7]], 'gum': [[0.43, 0.635], [0.57, 0.635], [0.56, 0.655], [0.44, 0.655]], 'midline_x': 0.5}

def region(name: str='region') -> dict[str, object]:
    return {'name': name, 'points': [[0.25, 0.25], [0.75, 0.25], [0.75, 0.75], [0.25, 0.75]]}

def lip_request(feature: str) -> dict[str, object]:
    styles = {'W45': 'natural_plump', 'W46': 'balanced', 'W47': 'healed', 'W48': 'rest', 'W49': '0.5_ml_style', 'W54': 'blue_based', 'W55': 'matte', 'W56': 'coffee', 'W57': 'medium'}
    return {'feature': feature, 'style': styles[feature], 'amount': 0.55, 'adult_confirmed': feature in {'W45', 'W47', 'W48', 'W49'}}

@pytest.mark.parametrize('feature', LIP_FEATURES)
def test_lip_features_render(feature: str) -> None:
    src = photo()
    r = render_lip(src, landmarks(), lip_request(feature))
    assert r.image.shape == src.shape
    assert r.image.dtype == np.uint8
    assert r.coverage.shape == src.shape[:2]
    assert r.report['feature'] == feature
    assert 'simulation' in str(r.report['label']).lower()
    assert np.array_equal(r.image[..., 3], src[..., 3])
    assert feature in LIP_PASS

@pytest.mark.parametrize('feature', LIP_FEATURES)
def test_lip_zero_amount_is_identity(feature: str) -> None:
    src = photo()
    req = lip_request(feature)
    req['amount'] = 0.0
    r = render_lip(src, landmarks(), req)
    assert np.array_equal(r.image, src)
    assert np.count_nonzero(r.coverage) == 0

@pytest.mark.parametrize('feature', ['W45', 'W47', 'W48', 'W49'])
def test_adult_lip_features_fail_closed(feature: str) -> None:
    req = lip_request(feature)
    req['adult_confirmed'] = False
    with pytest.raises(PermissionError):
        render_lip(photo(), landmarks(), req)

@pytest.mark.parametrize('feature', LIP_FEATURES)
def test_lip_box_metrics(feature: str) -> None:
    src = photo()
    r = render_lip(src, landmarks(), lip_request(feature))
    m = lip_metrics(src, r.image, r.coverage, feature)
    assert m.outside_error <= 0.03
    assert np.isfinite(m.texture_correlation)
    assert 0 <= m.changed_fraction <= 1

def test_w47_fresh_stronger_than_healed() -> None:
    src = photo()
    a = render_lip(src, landmarks(), {'feature': 'W47', 'style': 'fresh', 'amount': 0.7, 'adult_confirmed': True})
    b = render_lip(src, landmarks(), {'feature': 'W47', 'style': 'healed', 'amount': 0.7, 'adult_confirmed': True})
    da = np.mean(np.abs(a.image[..., :3].astype(float) - src[..., :3]))
    db = np.mean(np.abs(b.image[..., :3].astype(float) - src[..., :3]))
    assert da > db

def test_w54_never_changes_teeth_area_outside_lip() -> None:
    src = photo()
    r = render_lip(src, landmarks(), {'feature': 'W54', 'style': 'blue_based', 'amount': 1})
    assert np.array_equal(r.image[54:58, 42:55], src[54:58, 42:55])

def test_w56_wear_states_are_distinct() -> None:
    src = photo()
    outs = []
    for style in ('two_hours', 'coffee', 'meal'):
        outs.append(render_lip(src, landmarks(), {'feature': 'W56', 'style': style, 'amount': 1}).image)
    assert not np.array_equal(outs[0], outs[1])
    assert not np.array_equal(outs[1], outs[2])

@pytest.mark.parametrize('feature', ['W50', 'W51', 'W52', 'W53'])
def test_smile_features_render_from_checked_annotation(feature: str) -> None:
    src = photo()
    r = render_smile(src, {'feature': feature, 'amount': 0.5, 'adult_confirmed': True, 'annotation': ann()})
    assert r.image.shape == src.shape
    assert r.report['annotation_source'] == 'user_checked'
    assert feature in SMILE_PASS
    assert np.array_equal(r.image[..., 3], src[..., 3])
    m = smile_metrics(src, r.image, r.coverage, feature)
    assert m.outside_error <= 0.01

@pytest.mark.parametrize('feature', ['W50', 'W51', 'W52', 'W53', 'W58'])
def test_smile_adult_gate(feature: str) -> None:
    req = {'feature': feature, 'adult_confirmed': False, 'annotation': ann(), 'frame_annotations': [ann(), ann()]}
    with pytest.raises(PermissionError):
        render_smile(photo(), req)

def test_smile_requires_manual_annotation_instead_of_model() -> None:
    with pytest.raises(ValueError, match='annotation'):
        render_smile(photo(), {'feature': 'W51', 'adult_confirmed': True})

def test_w58_checked_sequence_preserves_frame_count() -> None:
    frames = [photo(), photo(), photo()]
    a = ann()
    b = ann()
    c = ann()
    b['teeth'] = [[x + 0.002, y] for x, y in b['teeth']]
    out, rep = render_sequence(frames, {'feature': 'W58', 'amount': 0.4, 'adult_confirmed': True, 'frame_annotations': [a, b, c]})
    assert len(out) == 3
    assert rep['frames'] == 3
    assert rep['max_annotation_jump'] > 0
    assert 'automatic' in rep['temporal_status']

def test_w52_midline_metric_present() -> None:
    r = render_smile(photo(), {'feature': 'W52', 'amount': 0.7, 'adult_confirmed': True, 'annotation': ann()})
    assert r.report['midline_error'] == pytest.approx(0, abs=0.02)
SKIN_STYLES = {'W77': 'sheer', 'W78': 'olive', 'W79': 'match_face', 'W80': 'mineral_cast', 'W81': 'orange_corrector', 'W82': 'green_micro', 'W83': 'irregular', 'W84': 'dewy_base', 'W85': 'both', 'W86': 'soft_round', 'W87': 'berry', 'W88': 'soft_drape', 'W89': 'interview', 'W90': 'faux_subtle', 'W91': 'continuity', 'W92': 'texture_first'}

def skin_request(feature: str) -> dict[str, object]:
    req: dict[str, object] = {'feature': feature, 'style': SKIN_STYLES[feature], 'amount': 0.5}
    if feature in {'W79', 'W80', 'W81', 'W82', 'W85', 'W86', 'W87', 'W88', 'W90', 'W91'}:
        req['masks'] = [region('a'), region('b')]
    if feature == 'W83':
        req.update(consent_local_health_data=True, diary_values=[0.2, 0.4, 0.3, 0.45, 0.25])
    return req

@pytest.mark.parametrize('feature', SKIN_FEATURES)
def test_skin_features_render(feature: str) -> None:
    src = photo()
    r = render_skin(src, skin_request(feature))
    assert r.image.shape == src.shape
    assert r.image.dtype == np.uint8
    assert r.report['feature'] == feature
    assert feature in SKIN_PASS
    assert 'medical' in str(r.report['label']).lower()
    assert np.array_equal(r.image[..., 3], src[..., 3])
    m = skin_metrics(src, r.image, r.coverage, feature)
    assert m.outside_error <= 0.03
    assert np.isfinite(m.texture_correlation)

@pytest.mark.parametrize('feature', SKIN_FEATURES)
def test_skin_zero_amount_identity(feature: str) -> None:
    src = photo()
    req = skin_request(feature)
    req['amount'] = 0.0
    r = render_skin(src, req)
    assert np.array_equal(r.image, src)

@pytest.mark.parametrize('feature', ['W79', 'W80', 'W81', 'W82', 'W85', 'W86', 'W87', 'W88', 'W90', 'W91'])
def test_checked_region_features_fail_without_region(feature: str) -> None:
    req = skin_request(feature)
    req.pop('masks')
    with pytest.raises(ValueError, match='region'):
        render_skin(photo(), req)

def test_w83_requires_explicit_local_health_consent() -> None:
    with pytest.raises(PermissionError):
        render_skin(photo(), {'feature': 'W83', 'style': 'cycle', 'diary_values': [0.2, 0.3]})

def test_w83_diary_has_no_cycle_prediction() -> None:
    values = (0.2, 0.3, 0.25, 0.4)
    s = pattern_summary(values)
    assert s['samples'] == 4
    assert 'prediction' in str(s['label']).lower()
    assert len(aligned_series(values)) == 4
    assert [x['index'] for x in export_rows(values)] == [0, 1, 2, 3]

def test_w80_cast_strength_order() -> None:
    src = photo()
    diffs = []
    for style in ('clear_finish', 'tinted_cast', 'mineral_cast'):
        r = render_skin(src, {'feature': 'W80', 'style': style, 'amount': 1, 'masks': [region()]})
        diffs.append(float(np.mean(np.abs(r.image[..., :3].astype(float) - src[..., :3]))))
    assert diffs[0] < diffs[1] < diffs[2]

def test_w90_preserve_is_identity() -> None:
    src = photo()
    r = render_skin(src, {'feature': 'W90', 'style': 'preserve', 'amount': 1, 'masks': [region()]})
    assert np.array_equal(r.image, src)

def test_w88_never_modifies_outside_checked_scarf_region() -> None:
    src = photo()
    r = render_skin(src, {'feature': 'W88', 'style': 'soft_drape', 'amount': 1, 'masks': [region()]})
    mask = r.coverage > 0.05
    assert np.array_equal(r.image[~mask], src[~mask])

def test_pass_definitions_complete() -> None:
    assert set(LIP_PASS) == set(LIP_FEATURES)
    assert set(SMILE_PASS) == {'W50', 'W51', 'W52', 'W53', 'W58'}
    assert set(SKIN_PASS) == set(SKIN_FEATURES)

def test_box_evaluator_keeps_missing_evidence_not_tested(tmp_path) -> None:
    import json, subprocess, sys
    src = photo()
    np.save(tmp_path / 'face.npy', src)
    manifest = {'cases': [{'id': 'local', 'image': 'face.npy', 'landmarks': landmarks().tolist(), 'adult_confirmed': True, 'health_consent': True, 'diary_values': [0.2, 0.3], 'regions': [region('a'), region('b')]}]}
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    run = subprocess.run([sys.executable, str(__import__('pathlib').Path(__file__).parents[2] / 'scripts/r16b_realface_eval.py'), str(tmp_path / 'manifest.json'), '--features', 'W45', 'W50', 'W77'], cwd=__import__('pathlib').Path(__file__).parents[2], text=True, capture_output=True, check=True)
    data = json.loads(run.stdout)
    assert data['groups']['lips']['W45']['tested'] == 1
    assert data['groups']['smile']['W50']['not_tested'] == 1
    assert data['groups']['skin_more']['W77']['tested'] == 1
    assert data['privacy'].startswith('local-only')

def test_parity_vector_script_covers_all_30_rows() -> None:
    import json, subprocess, sys
    from pathlib import Path
    root = Path(__file__).parents[2]
    run = subprocess.run([sys.executable, str(root / 'scripts/r16b_parity_vectors.py')], cwd=root, text=True, capture_output=True, check=True)
    data = json.loads(run.stdout)
    assert data['format'] == 'beljour-r16b-parity/1'
    assert len(data['rows']) == 30
    assert len({x['feature'] for x in data['rows']}) == 30
    assert all((x['shape'] == [48, 48, 4] for x in data['rows']))
