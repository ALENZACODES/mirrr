'R17B workflow passport, full-look and shave safety tests. Author: John Khan.'
from __future__ import annotations

import json

import pytest

from plumb_api.engines.gender_look.presets import PRESETS, compare_levels, disclosure, preset
from plumb_api.engines.shave.assessment import amount_cap, assess, report
from plumb_api.engines.workflow_w.shade_passport import SCHEMA, ShadePassport, canonical, export, fingerprint, import_export, parse, payload, redacted_summary

def passport() -> ShadePassport:
    return ShadePassport(42.5, 'olive', 'medium brown', ('fragrance', 'nickel'), '2026-10-24', 'Patch-test new products.')

def test_passport_payload_is_versioned_and_local() -> None:
    value = payload(passport())
    assert value['schema'] == SCHEMA
    assert value['privacy'] == 'local export; no network transmission'
    assert value['undertone'] == 'olive'

def test_passport_canonical_is_stable() -> None:
    first = canonical(passport())
    second = canonical(passport())
    assert first == second
    assert first.startswith('{"allergens"')

def test_passport_fingerprint_is_stable_sha256() -> None:
    value = fingerprint(passport())
    assert len(value) == 64
    assert value == fingerprint(passport())
    int(value, 16)

def test_passport_export_round_trips() -> None:
    text = export(passport())
    restored = import_export(text)
    assert restored == passport()

def test_passport_export_contains_integrity_not_encryption_claim() -> None:
    raw = json.loads(export(passport()))
    assert len(raw['sha256']) == 64
    assert 'encrypted' not in json.dumps(raw).lower()

def test_passport_import_rejects_tamper() -> None:
    raw = json.loads(export(passport()))
    raw['depth'] = 80
    with pytest.raises(ValueError, match='integrity'):
        import_export(json.dumps(raw))

def test_passport_import_rejects_missing_fingerprint() -> None:
    raw = json.loads(export(passport()))
    raw.pop('sha256')
    with pytest.raises(ValueError, match='fingerprint'):
        import_export(json.dumps(raw))

@pytest.mark.parametrize('undertone', ['cool', 'neutral', 'warm', 'olive'])
def test_passport_parse_supports_declared_undertones(undertone: str) -> None:
    value = parse({'depth': 30, 'undertone': undertone, 'allergens': [], 'hair_base': '', 'measured_on': ''})
    assert value.undertone == undertone

def test_passport_parse_rejects_unknown_undertone() -> None:
    with pytest.raises(ValueError):
        parse({'depth': 30, 'undertone': 'automatic', 'allergens': []})

def test_passport_parse_rejects_out_of_range_depth() -> None:
    with pytest.raises(ValueError):
        parse({'depth': 101, 'undertone': 'neutral', 'allergens': []})

def test_passport_parse_deduplicates_and_sorts_allergens() -> None:
    value = parse({'depth': 30, 'undertone': 'neutral', 'allergens': ['nickel', 'fragrance', 'nickel']})
    assert value.allergens == ('fragrance', 'nickel')

def test_passport_parse_rejects_unknown_fields() -> None:
    with pytest.raises(ValueError, match='unknown'):
        parse({'depth': 30, 'undertone': 'neutral', 'allergens': [], 'photo': 'do-not-store'})

def test_passport_redacted_summary_excludes_free_text() -> None:
    summary = redacted_summary(passport())
    serialized = json.dumps(summary)
    assert 'Patch-test' not in serialized
    assert 'medium brown' not in serialized
    assert summary['allergen_count'] == 2
    assert summary['depth_band'] == 40

def test_gender_presets_are_monotone() -> None:
    assert compare_levels() is True
    assert PRESETS['normal'].brow_tint < PRESETS['extra'].brow_tint < PRESETS['hyper'].brow_tint
    assert PRESETS['normal'].stubble_signal < PRESETS['extra'].stubble_signal < PRESETS['hyper'].stubble_signal

@pytest.mark.parametrize('level', ['normal', 'extra', 'hyper'])
def test_gender_preset_never_changes_geometry(level: str) -> None:
    value = preset(level, 1.0)
    assert value.geometry_change == 0
    assert 0 <= value.brow_tint <= 1
    assert 0 <= value.skin_texture <= 1

def test_gender_preset_amount_scales_signals() -> None:
    low = preset('hyper', 0.25)
    high = preset('hyper', 0.75)
    assert low.brow_tint < high.brow_tint
    assert low.brow_density < high.brow_density
    assert low.skin_texture < high.skin_texture
    assert low.stubble_signal < high.stubble_signal

def test_gender_preset_rejects_unknown_level() -> None:
    with pytest.raises(ValueError):
        preset('extreme', 1.0)

def test_gender_preset_rejects_amount_outside_range() -> None:
    with pytest.raises(ValueError):
        preset('normal', 1.1)

@pytest.mark.parametrize('direction', ['feminine', 'masculine', 'neutral'])
@pytest.mark.parametrize('level', ['normal', 'extra', 'hyper'])
def test_gender_disclosure_preserves_identity_language(direction: str, level: str) -> None:
    lines = disclosure(direction, level)
    text = ' '.join(lines).lower()
    assert direction in text
    assert level in text
    assert 'geometry' in text
    assert 'identity' in text
    assert 'determine gender identity' in text

def test_gender_disclosure_rejects_unknown_direction() -> None:
    with pytest.raises(ValueError):
        disclosure('diagnosed', 'normal')

def test_shave_assessment_accepts_stubble() -> None:
    value = assess(coverage=0.12, estimated_length_mm=1.5, mask_confidence=0.9)
    assert value.accepted is True
    assert value.scope == 'stubble'
    assert value.label == 'clean-shave visual estimate'

def test_shave_assessment_accepts_short_beard() -> None:
    value = assess(coverage=0.2, estimated_length_mm=6.0, mask_confidence=0.9)
    assert value.accepted is True
    assert value.scope == 'short_beard'
    assert value.confidence <= 0.85

def test_shave_assessment_refuses_long_beard() -> None:
    value = assess(coverage=0.3, estimated_length_mm=12.0, mask_confidence=0.9)
    assert value.accepted is False
    assert value.scope == 'long_beard'
    assert value.label == 'refused'

def test_shave_assessment_requires_confident_mask() -> None:
    value = assess(coverage=0.2, estimated_length_mm=2.0, mask_confidence=0.4)
    assert value.accepted is False
    assert value.scope == 'unknown'
    assert 'confidence' in value.reason

def test_shave_assessment_marks_empty_region_not_applicable() -> None:
    value = assess(coverage=0.001, estimated_length_mm=1.0, mask_confidence=0.9)
    assert value.accepted is False
    assert value.scope == 'none'
    assert value.label == 'not applicable'

def test_shave_assessment_rejects_impossible_length() -> None:
    with pytest.raises(ValueError):
        assess(coverage=0.2, estimated_length_mm=-1, mask_confidence=0.9)

def test_shave_amount_cap_is_lower_for_short_beard() -> None:
    stubble = amount_cap('stubble')
    short = amount_cap('short_beard')
    assert 0 < short < stubble <= 1

def test_shave_amount_cap_zero_for_unsupported_scope() -> None:
    assert amount_cap('long_beard') == 0
    assert amount_cap('none') == 0

def test_shave_report_has_no_geometry_or_medical_claim() -> None:
    value = report(assess(coverage=0.12, estimated_length_mm=1.5, mask_confidence=0.9))
    assert value['simulation'] is True
    assert value['medical_advice'] is False
    assert value['identity_geometry_changed'] is False
