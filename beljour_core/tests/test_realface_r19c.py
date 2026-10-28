"""R19 preregistration tests are synthetic-only and never certify real-face quality."""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path
from typing import Any

import pytest

HERE = Path(__file__).resolve().parents[2] / 'tests' / 'realface' / 'pass_definitions_r19c'
MODULE = HERE / 'r19c_suite.py'
_spec = importlib.util.spec_from_file_location('lane_c_r19c_suite_test', MODULE)
assert _spec is not None and _spec.loader is not None
suite = importlib.util.module_from_spec(_spec)
sys.modules[_spec.name] = suite
_spec.loader.exec_module(suite)
FEATURES = tuple(sorted(suite.FEATURES))


def synthetic_samples(feature: str) -> list[dict[str, Any]]:
    checks = suite.definition(feature).criteria
    rows: list[dict[str, Any]] = []
    for monk in suite.Q.MONK:
        for gender in suite.Q.GENDERS:
            for age in suite.Q.AGES:
                row: dict[str, Any] = {'monk': monk, 'gender': gender, 'age': age,
                                       'consent_valid': True, 'review_human': True}
                for metric in checks:
                    row[metric.field] = metric.limit
                rows.append(row)
    return rows


@pytest.mark.parametrize('feature', FEATURES)
def test_all_100_synthetic_intersection_groups_score_without_hidden_omissions(feature: str) -> None:
    summary = suite.evaluate(feature, synthetic_samples(feature))
    assert summary.status == 'SYNTHETIC_OK'
    assert summary.passed == summary.total == 100
    assert len(summary.groups) == 117
    assert all(group.tested and group.eligible and group.rate == 1.0 for group in summary.groups)
    assert set(suite.required_metrics(feature)) == {
        item.field for item in suite.definition(feature).criteria
    }
    assert suite.definition(feature).minimum_faces == 100000


@pytest.mark.parametrize('feature', FEATURES)
def test_not_ready_without_real_frozen_manifest_and_independent_review(feature: str) -> None:
    rows = synthetic_samples(feature)
    summary = suite.evaluate(feature, rows, mode='real', manifest_sha256='a' * 64,
                             human_review=True)
    assert summary.status == 'UNPROVEN'
    assert summary.total == 100
    assert any('100,000' in explanation for explanation in summary.reasons)
    assert any(not group.eligible for group in summary.groups)
    rows[0].pop(suite.required_metrics(feature)[0])
    assert suite.evaluate(feature, rows).status == 'SYNTHETIC_FAIL'
    rows[0]['monk'] = 'undefined'
    assert suite.evaluate(feature, rows).status == 'SYNTHETIC_FAIL'


@pytest.mark.parametrize('feature', FEATURES)
def test_quality_threshold_and_fairness_cannot_be_relaxed(feature: str) -> None:
    source = json.loads((HERE / (feature + '.json')).read_text())
    assert source['status'] == 'UNPROVEN' and source['face_set']['number_of_faces'] >= 100000
    assert source['face_set']['no_training_faces'] is True
    assert source['gates']['overall'] == 0.95 and source['gates']['every_slice'] == 0.95
    for field, weaker in (('overall', 0.94), ('every_slice', 0.6), ('minimum_slice_faces', 1)):
        altered = json.loads(json.dumps(source))
        altered['gates'][field] = weaker
        with pytest.raises(ValueError):
            suite.Q.Definition.parse(altered)
    altered = json.loads(json.dumps(source))
    altered['required_slices']['monk'] = ['1']
    with pytest.raises(ValueError):
        suite.Q.Definition.parse(altered)
    altered = json.loads(json.dumps(source))
    altered['human_required'] = False
    with pytest.raises(ValueError):
        suite.Q.Definition.parse(altered)
    for banned in ('base64', 'data:image', '/photos/', 'model_weights'):
        assert banned not in json.dumps(source).lower()


def test_quality_feature_allowlist_rejects_unknown_and_strips_no_failing_faces() -> None:
    with pytest.raises(ValueError):
        suite.definition('../untrusted')
    with pytest.raises(ValueError):
        suite.evaluate('commerce-vto', [])
    with pytest.raises(ValueError):
        suite.evaluate(FEATURES[0], [1] * 150001)
    assert suite.evaluate(FEATURES[0], []).status == 'SYNTHETIC_FAIL'
