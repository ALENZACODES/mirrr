"""Only nonidentifying group labels/counts may appear in women's reports.

Author: John Khan.
"""
from __future__ import annotations

import json
from dataclasses import replace

import pytest

from plumb_api.engines.women_styling.quality_counts import GroupCount
from plumb_api.engines.women_styling.quality_counts import aggregate_counts
from plumb_api.engines.women_styling.quality_counts import public_report


def cases() -> tuple[GroupCount, ...]:
    return (
        GroupCount('W28', 'monk', 'tone-1', 9, 1, 0, 0),
        GroupCount('W28', 'monk', 'tone-1', 7, 2, 1, 1),
        GroupCount('W39', 'hair_texture', 'coily', 5, 0, 5, 0),
    )


def test_group_names_and_counts_only() -> None:
    outcome = public_report(cases())
    assert outcome['release_status'] == 'UNPROVEN'
    groups = outcome['groups']
    assert isinstance(groups, list)
    assert len(groups) == 2
    row = next(item for item in groups if item['feature'] == 'W28')
    assert row['passed'] == 16 and row['failed'] == 3 and row['unproven'] == 1
    assert row['total'] == 20 and row['shards'] == 2
    text = json.dumps(outcome)
    for forbidden in ('photo_id', 'image_sha256', 'face_embedding', 'frame_pixels', 'raw_score'):
        assert forbidden not in text


@pytest.mark.parametrize('bad', [
    dict(shard=-1), dict(shard=1000), dict(group_name=''),
    dict(group_name='user@example.org'), dict(group_name='../face'),
    dict(passed=-1), dict(failed=100_001), dict(passed=100_000, failed=1),
])
def test_forged_personal_metadata_and_invalid_counts_are_rejected(bad: dict) -> None:
    sample = replace(cases()[0], **bad)
    with pytest.raises(ValueError):
        public_report((sample,))


def test_duplicate_shard_entries_do_not_inflate_successes() -> None:
    with pytest.raises(ValueError, match='Duplicated'):
        aggregate_counts((cases()[0], cases()[0]))


def test_empty_count_set_is_unproven() -> None:
    assert public_report(()) == {
        'format': 'beljour-women-r24c-counts/1', 'release_status': 'UNPROVEN',
        'groups': [], 'note': 'Count-only summary; no frozen quality PASS inferred.',
    }
