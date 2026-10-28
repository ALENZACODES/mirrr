'R17B evidence, definitions, evaluator, and parity hardening. Author: John Khan.'
from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys

import numpy as np
import pytest

from plumb_api.arena.r17b_definitions import DEFINITIONS, EXPECTED_IDS
from plumb_api.arena.r17b_evidence import EvidenceRecord, MetricRule, PassDefinition, definitions_fingerprint, evaluate_definition, input_fingerprint, summarize_group, validate_definition_set
from plumb_api.engines.hair_women.contracts import FEATURES as HAIR_FEATURES
from plumb_api.engines.makeup_w.contracts import FEATURES as MAKEUP_FEATURES
from plumb_api.engines.workflow_w.contracts import FEATURES as WORKFLOW_FEATURES

ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / 'api/scripts/r17b_realface_eval.py'
PROBE = ROOT / 'api/scripts/r17b_parity_probe.py'

def _digest(fill: bytes=b'x') -> str:
    return input_fingerprint([fill])

def test_definition_set_covers_every_r17b_feature_and_auxiliary_engine() -> None:
    expected = tuple(HAIR_FEATURES) + tuple(MAKEUP_FEATURES) + tuple(WORKFLOW_FEATURES) + ('UPSCALE2', 'UPSCALE4', 'GENDER', 'SHAVE')
    assert EXPECTED_IDS == expected
    assert tuple(DEFINITIONS) == expected
    result = validate_definition_set(DEFINITIONS, expected_ids=expected)
    assert result['count'] == 46
    assert result['author'] == 'John Khan'
    assert result['quality_result'] == 'criteria_only_no_realface_pass'
    assert result['sha256'] == definitions_fingerprint(DEFINITIONS)

def test_every_definition_has_measurable_rules_and_local_evidence() -> None:
    for name, definition in DEFINITIONS.items():
        definition.validate()
        assert definition.id == name
        assert definition.author == 'John Khan'
        assert definition.rules
        assert definition.required_evidence
        assert all((rule.description.strip() for rule in definition.rules))
        assert len(definition.sha256) == 64

@pytest.mark.parametrize('feature', HAIR_FEATURES)
def test_hair_definition_has_outside_alpha_and_texture_rules(feature: str) -> None:
    definition = DEFINITIONS[feature]
    names = {rule.name for rule in definition.rules}
    assert {'outside_error', 'alpha_error', 'texture_ratio'} <= names
    assert definition.group == 'hair_women'

@pytest.mark.parametrize('feature', MAKEUP_FEATURES)
def test_makeup_definition_has_deep_skin_and_brand_safeguards(feature: str) -> None:
    definition = DEFINITIONS[feature]
    names = {rule.name for rule in definition.rules}
    assert {'outside_error', 'alpha_error', 'chroma_ratio', 'mean_luminance_delta', 'brand_name_free'} <= names
    assert definition.group == 'makeup_w'

@pytest.mark.parametrize('feature', WORKFLOW_FEATURES)
def test_workflow_definition_requires_no_network_and_round_trip(feature: str) -> None:
    names = {rule.name for rule in DEFINITIONS[feature].rules}
    assert 'round_trip' in names
    assert 'network_calls' in names

def test_special_definition_requirements_are_explicit() -> None:
    assert 'grey_observation' in DEFINITIONS['W33'].required_evidence
    assert 'humidity' in DEFINITIONS['W44'].required_evidence
    assert 'checked_reference' in DEFINITIONS['W13'].required_evidence
    assert 'checked_reference_masks' in DEFINITIONS['W13'].required_evidence
    assert 'identity_pins' in DEFINITIONS['GENDER'].required_evidence
    assert 'beard_length_scope' in DEFINITIONS['SHAVE'].required_evidence

def test_metric_rule_boundaries_are_inclusive() -> None:
    assert MetricRule('a', 'max', 0.5, 'max').passes(0.5)
    assert not MetricRule('a', 'max', 0.5, 'max').passes(0.500001)
    assert MetricRule('a', 'min', 0.5, 'min').passes(0.5)
    assert not MetricRule('a', 'min', 0.5, 'min').passes(0.499999)
    assert MetricRule('a', 'eq', True, 'equal').passes(True)
    assert not MetricRule('a', 'eq', True, 'equal').passes(False)

def test_invalid_rule_rejects_nonfinite_threshold() -> None:
    with pytest.raises(ValueError, match='finite'):
        MetricRule('x', 'max', float('nan'), 'bad').validate()

def test_definition_rejects_duplicate_metric_names() -> None:
    definition = PassDefinition(id='x', group='test', title='test', scope='test', rules=(MetricRule('m', 'max', 1.0, 'one'), MetricRule('m', 'min', 0.0, 'two')), required_evidence=('image',))
    with pytest.raises(ValueError, match='unique'):
        definition.validate()

def test_missing_evidence_is_not_tested_not_failed_or_passed() -> None:
    definition = DEFINITIONS['W44']
    record = evaluate_definition(definition, case_id='case-a', input_sha256=_digest(), available_evidence={'image', 'hair_mask', 'scalp_mask', 'head_landmarks'}, metrics={})
    assert record.status == 'not_tested'
    assert 'humidity' in record.missing

def test_missing_metric_is_not_tested() -> None:
    definition = PassDefinition(id='demo', group='test', title='demo', scope='test', rules=(MetricRule('score', 'min', 0.9, 'score'),), required_evidence=('image',))
    record = evaluate_definition(definition, case_id='case-a', input_sha256=_digest(), available_evidence={'image'}, metrics={})
    assert record.status == 'not_tested'
    assert record.missing == ('metric:score',)

def test_measured_failure_remains_failed() -> None:
    definition = PassDefinition(id='demo', group='test', title='demo', scope='test', rules=(MetricRule('score', 'min', 0.9, 'score'),), required_evidence=('image',))
    record = evaluate_definition(definition, case_id='case-a', input_sha256=_digest(), available_evidence={'image'}, metrics={'score': 0.89})
    assert record.status == 'failed'
    assert record.metrics == {'score': 0.89}

def test_measured_pass_requires_every_rule() -> None:
    definition = PassDefinition(id='demo', group='test', title='demo', scope='test', rules=(MetricRule('floor', 'min', 0.9, 'floor'), MetricRule('ceiling', 'max', 0.1, 'ceiling'), MetricRule('flag', 'eq', True, 'flag')), required_evidence=('image',))
    record = evaluate_definition(definition, case_id='case-a', input_sha256=_digest(), available_evidence={'image'}, metrics={'floor': 0.91, 'ceiling': 0.09, 'flag': True, 'unregistered': 999.0})
    assert record.status == 'passed'
    assert 'unregistered' not in record.metrics

def test_group_summary_never_treats_not_tested_as_pass() -> None:
    definition = DEFINITIONS['W19']
    digest = _digest()
    passed = EvidenceRecord(definition.id, definition.sha256, 'a', digest, 'passed', {'ok': True})
    untested = EvidenceRecord(definition.id, definition.sha256, 'b', digest, 'not_tested', {}, ('hair_mask',))
    summary = summarize_group('hair', [passed, untested])
    assert summary.passed == 1
    assert summary.not_tested == 1
    assert summary.ready is False

def test_group_summary_ready_only_when_every_record_passes() -> None:
    definition = DEFINITIONS['W19']
    digest = _digest()
    records = [EvidenceRecord(definition.id, definition.sha256, f'c{i}', digest, 'passed', {'ok': True}) for i in range(3)]
    summary = summarize_group('hair', records)
    assert summary.ready is True
    assert summary.tested == 3
    assert summary.passed == 3

def test_evidence_record_rejects_not_tested_without_reason() -> None:
    record = EvidenceRecord('x', '0' * 64, 'case', '1' * 64, 'not_tested')
    with pytest.raises(ValueError, match='missing'):
        record.validate()

def test_input_fingerprint_is_length_delimited() -> None:
    assert input_fingerprint([b'ab', b'c']) != input_fingerprint([b'a', b'bc'])
    assert input_fingerprint(['ab', 'c']) == input_fingerprint([b'ab', b'c'])

def test_definition_hash_changes_when_threshold_changes() -> None:
    first = PassDefinition('x', 'g', 't', 's', (MetricRule('m', 'max', 1.0, 'd'),), ('image',))
    second = PassDefinition('x', 'g', 't', 's', (MetricRule('m', 'max', 0.9, 'd'),), ('image',))
    assert first.sha256 != second.sha256

def test_validate_definitions_cli_is_criteria_only() -> None:
    run = subprocess.run([sys.executable, str(SCRIPT), '--validate-definitions'], cwd=ROOT, env={**dict(__import__('os').environ), 'PYTHONPATH': 'api'}, text=True, capture_output=True, check=True)
    assert '"count": 46' in run.stdout
    assert 'No real-face quality result has been measured' in run.stdout
    assert 'passed' not in run.stdout.lower()

def test_parity_probe_is_synthetic_and_covers_every_engine_family() -> None:
    run = subprocess.run([sys.executable, str(PROBE)], cwd=ROOT, env={**dict(__import__('os').environ), 'PYTHONPATH': 'api'}, text=True, capture_output=True, check=True)
    payload = json.loads(run.stdout)
    assert payload['format'] == 'beljour-r17b-parity-probe/1'
    assert payload['author'] == 'John Khan'
    assert set(payload) >= {'hair', 'makeup', 'workflow', 'upscale2', 'gender', 'shave'}
    assert set(payload['workflow']) == set(WORKFLOW_FEATURES)
    assert len(payload['hair']) >= 6
    assert len(payload['makeup']) >= 8

def test_realface_evaluator_missing_masks_stays_not_tested(tmp_path: Path) -> None:
    image = np.full((24, 24, 4), 90, dtype=np.uint8)
    image[..., 3] = 255
    np.save(tmp_path / 'image.npy', image)
    manifest = {'cases': [{'id': 'missing', 'image': 'image.npy'}]}
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest), encoding='utf-8')
    run = subprocess.run([sys.executable, str(SCRIPT), str(tmp_path / 'manifest.json'), '--features', 'W19'], cwd=ROOT, env={**dict(__import__('os').environ), 'PYTHONPATH': 'api'}, text=True, capture_output=True, check=True)
    payload = json.loads(run.stdout)
    row = payload['cases'][0]['features']['W19']
    assert row['status'] == 'not_tested'
    assert 'mask required' in row['reason']
    group = payload['groups']['hair_women']['W19']
    assert group['tested'] == 0
    assert group['not_tested'] == 1

def test_realface_evaluator_refuses_path_escape(tmp_path: Path) -> None:
    manifest = {'cases': [{'id': 'escape', 'image': '../outside.npy'}]}
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest), encoding='utf-8')
    run = subprocess.run([sys.executable, str(SCRIPT), str(tmp_path / 'manifest.json'), '--features', 'W19'], cwd=ROOT, env={**dict(__import__('os').environ), 'PYTHONPATH': 'api'}, text=True, capture_output=True)
    assert run.returncode != 0
    assert 'escapes' in run.stderr or 'escapes' in run.stdout
