"""R19 Lane C: preference-only consultation and preview-board boundary tests.

Synthetic style metadata, no persons, datasets or provider credentials.
"""
from __future__ import annotations

from dataclasses import replace
from typing import Any

import pytest

from plumb_api.engines.menshair.consultation import (
    Consultation,
    compare_styles,
    find_concepts,
    score_style,
    stylist_brief,
)
from plumb_api.engines.menshair.render import HairRecipe, available_presets


def test_catalogue_browsing_never_requires_a_face() -> None:
    styles = available_presets()
    assert len(styles) >= 150
    selection = find_concepts(styles, Consultation(), limit=17)
    assert len(selection) == 17
    assert len({one.style.id for one in selection}) == 17
    assert len({one.style.family for one in selection}) >= 5
    for item in selection:
        summary = item.public()
        assert summary['provider_calls'] == 0 and summary['simulation'] is True
        assert summary['quality_status'] == 'UNPROVEN'
        assert not any(x in summary for x in ('photo', 'face', 'ethnicity', 'sex', 'diagnosis'))


def test_strong_user_preferences_change_browse_order_not_identity() -> None:
    styles = available_presets()
    preferences = Consultation(texture='coily', desired_length='short', fade='low',
                               fade_shape='burst', require_short_sides=True,
                               scalp_visibility='keep', maintenance_minutes=15)
    selected = find_concepts(styles, preferences, limit=12)
    assert len(selected) == 12
    assert selected == find_concepts(styles, preferences, limit=12)
    ranked = find_concepts(styles, preferences, limit=12, diversify=False)
    assert all(ranked[k].score >= ranked[k+1].score for k in range(len(ranked)-1))
    assert all(0 <= row.score <= 160 for row in ranked)
    assert selected[0].style.id == find_concepts(list(reversed(styles)), preferences, limit=12)[0].style.id
    assert all(row.consultation_version == 'r19c/1' for row in selected)


@pytest.mark.parametrize('bad', [
    {'texture': 'guess-from-photo'}, {'desired_length': 'unknown'},
    {'fade': 'skin'}, {'fade_shape': 'beard'}, {'presentation': 'identity'},
    {'scalp_visibility': 'medical'}, {'part': 'centre'},
    {'maintenance_minutes': -1}, {'maintenance_minutes': 999},
    {'maintenance_minutes': 1.5}, {'maintenance_minutes': True},
    {'require_short_sides': 1}, {'prefer_volume': None},
    {'race': 'unknown'}, {'photo_data': 'base64'},
])
def test_reject_untrusted_personal_or_unbounded_input(bad: dict[str, Any]) -> None:
    with pytest.raises((ValueError, TypeError)):
        Consultation.parse(bad)


def test_defaults_round_trip_without_hair_photo_or_suspected_gender() -> None:
    p = Consultation.parse({'texture': 'wavy', 'presentation': 'masculine',
                            'require_short_sides': True, 'fade_shape': 'temple'})
    assert Consultation.parse(p.public()) == p
    assert set(p.public()) == {
        'texture', 'desired_length', 'fade', 'fade_shape', 'presentation',
        'maintenance_minutes', 'scalp_visibility', 'part',
        'require_short_sides', 'prefer_volume',
    }
    for style in available_presets()[:40]:
        assert score_style(style, p) == score_style(style, p)


def test_length_and_fade_preferences_are_real_numeric_sort_inputs() -> None:
    styles = available_presets()
    low = next(item for item in styles if item.fade == 'low' and item.fade_shape == 'classic')
    changed = replace(low, id='local-tests-high', name='Test high fade shape', fade='high')
    p = Consultation(fade='low', desired_length='short')
    assert score_style(low, p).score - score_style(changed, p).score == 20
    burst = replace(low, id='local-tests-burst', name='Test burst fade shape',
                    fade_shape='burst')
    a = score_style(low, Consultation(fade_shape='burst')).score
    b = score_style(burst, Consultation(fade_shape='burst')).score
    assert b > a


def test_comparison_board_is_bounded_and_no_provider_claim() -> None:
    styles = available_presets()
    comparison = compare_styles([styles[0], styles[1], styles[2]])
    assert comparison['provider_calls'] == 0
    assert comparison['real_face_tested'] is False
    assert len(comparison['tiles']) == 3
    assert set(comparison['differences']) <= {
        'fade', 'shape', 'side_grade', 'top_grade', 'length_tag', 'pattern', 'family',
    }
    for invalid in ([], [styles[0], styles[0]], list(styles[:10])):
        with pytest.raises(ValueError):
            compare_styles(invalid)
    for limit in (-1, 0, 49, True, 0.5):
        with pytest.raises(ValueError):
            find_concepts(styles, Consultation(), limit=limit)


def test_stylist_brief_is_not_an_appearance_prediction() -> None:
    p = Consultation(scalp_visibility='keep', maintenance_minutes=0)
    style = available_presets()[35]
    text = stylist_brief(style, p)
    assert text['simulation'] is True and text['photo_required'] is False
    assert text['provider_calls'] == 0 and text['quality_status'] == 'UNPROVEN'
    assert any('scalp' in question.lower() for question in text['questions'])
    assert all('suit you' not in question.lower() for question in text['questions'])


def test_catalogue_duplicate_or_oversized_is_rejected() -> None:
    styles = list(available_presets())
    with pytest.raises(ValueError):
        find_concepts([styles[0], styles[0]], Consultation())
    with pytest.raises(ValueError):
        find_concepts(styles * 7, Consultation())
