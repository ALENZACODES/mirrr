"""R18B balanced frozen-1000 schedule tests. Author: John Khan."""
from __future__ import annotations

import itertools

import pytest

from plumb_api.engines.gender_look import frozen1000 as gender_frozen
from plumb_api.engines.gender_look import frozen_schedule as gender_schedule
from plumb_api.engines.hair_women import frozen1000 as hair_frozen
from plumb_api.engines.hair_women import frozen_schedule as hair_schedule
from plumb_api.engines.hair_women.realface import registry_feature_ids as hair_ids
from plumb_api.engines.makeup_w import frozen1000 as makeup_frozen
from plumb_api.engines.makeup_w import frozen_schedule as makeup_schedule
from plumb_api.engines.makeup_w.realface import registry_feature_ids as makeup_ids
from plumb_api.engines.skin_more import frozen1000 as skin_frozen
from plumb_api.engines.skin_more import frozen_schedule as skin_schedule
from plumb_api.engines.skin_more.realface import registry_feature_ids as skin_ids


DIGEST = "a" * 64


def _hair_manifest() -> hair_frozen.FrozenManifest:
    features = hair_ids()
    cases = tuple(
        hair_frozen.FrozenCase(
            f"hair-{index:03d}",
            DIGEST,
            (features[index % len(features)],),
            ("straight", "wavy", "curly")[index % 3],
            ("light", "medium", "deep")[index // 3 % 3],
        )
        for index in range(27)
    )
    return hair_frozen.FrozenManifest("hair-test", cases)


def _makeup_manifest() -> makeup_frozen.FrozenManifest:
    features = makeup_ids()
    depths = ("fair", "light", "medium", "tan", "deep", "very-deep")
    undertones = ("cool", "neutral", "warm", "olive")
    cases = tuple(
        makeup_frozen.FrozenCase(
            f"makeup-{index:03d}",
            DIGEST,
            (features[index % len(features)],),
            depths[index % len(depths)],
            undertones[index // len(depths) % len(undertones)],
        )
        for index in range(48)
    )
    return makeup_frozen.FrozenManifest("makeup-test", cases)


def _skin_manifest() -> skin_frozen.FrozenManifest:
    features = skin_ids()
    depths = ("light", "medium", "deep", "very-deep")
    cases = tuple(
        skin_frozen.FrozenCase(
            f"skin-{index:03d}",
            DIGEST,
            (features[index % len(features)],),
            depths[index % len(depths)],
        )
        for index in range(28)
    )
    return skin_frozen.FrozenManifest("skin-test", cases)


def _gender_manifest() -> gender_frozen.FrozenManifest:
    patterns = (("normal",), ("extra",), ("hyper",), ("normal", "extra", "hyper"))
    cases = tuple(
        gender_frozen.FrozenCase(
            f"gender-{index:03d}",
            DIGEST,
            patterns[index % len(patterns)],
        )
        for index in range(24)
    )
    return gender_frozen.FrozenManifest("gender-test", cases)


def test_hair_schedule_is_deterministic_balanced_and_hash_bound() -> None:
    manifest = _hair_manifest()
    first = hair_schedule.build(manifest)
    second = hair_schedule.build(manifest)
    assert first == second
    assert first.sha256(manifest) == second.sha256(manifest)
    assert len(first.sha256(manifest)) == 64
    assert hair_schedule.maximum_prefix_imbalance(first) <= 1
    counts = hair_schedule.slice_counts(first)
    assert sum(counts["hair_slice"].values()) == len(manifest.cases)
    assert sum(counts["tone_slice"].values()) == len(manifest.cases)


def test_hair_schedule_shards_are_disjoint_and_complete() -> None:
    schedule = hair_schedule.build(_hair_manifest())
    shards = hair_schedule.shards(schedule, 5)
    flattened = tuple(itertools.chain.from_iterable(shards))
    assert {item.case_id for item in flattened} == {item.case_id for item in schedule.cases}
    assert len(flattened) == len({item.case_id for item in flattened})
    assert max(map(len, shards)) - min(map(len, shards)) <= 1


def test_hair_schedule_resume_keeps_original_order() -> None:
    schedule = hair_schedule.build(_hair_manifest())
    completed = {schedule.cases[index].case_id for index in (0, 3, 7, 11)}
    pending = hair_schedule.pending(schedule, completed)
    assert [item.case_id for item in pending] == [
        item.case_id for item in schedule.cases if item.case_id not in completed
    ]
    with pytest.raises(ValueError, match="unknown completed"):
        hair_schedule.pending(schedule, {"not-in-manifest"})


def test_makeup_schedule_balances_depth_and_undertone_intersections() -> None:
    manifest = _makeup_manifest()
    schedule = makeup_schedule.build(manifest)
    assert len(schedule.cases) == len(manifest.cases)
    counts = makeup_schedule.slice_counts(schedule)
    assert len(counts["depth"]) == 6
    assert len(counts["undertone"]) == 4
    assert len(counts["intersection"]) == 24
    assert makeup_schedule.prefix_fairness(schedule, 24)["depth_spread"] <= 1
    assert makeup_schedule.prefix_fairness(schedule, 24)["undertone_spread"] <= 1


def test_makeup_schedule_prefix_validation_and_resume() -> None:
    schedule = makeup_schedule.build(_makeup_manifest())
    with pytest.raises(ValueError, match="prefix"):
        makeup_schedule.prefix_fairness(schedule, -1)
    with pytest.raises(ValueError, match="prefix"):
        makeup_schedule.prefix_fairness(schedule, len(schedule.cases) + 1)
    done = {item.case_id for item in schedule.cases[:9]}
    assert len(makeup_schedule.pending(schedule, done)) == len(schedule.cases) - 9
    with pytest.raises(ValueError, match="unknown"):
        makeup_schedule.pending(schedule, {"unknown"})


def test_makeup_schedule_hash_changes_when_manifest_changes() -> None:
    manifest = _makeup_manifest()
    schedule = makeup_schedule.build(manifest)
    changed_cases = manifest.cases[:-1] + (
        makeup_frozen.FrozenCase(
            manifest.cases[-1].case_id,
            "b" * 64,
            manifest.cases[-1].feature_ids,
            manifest.cases[-1].depth_slice,
            manifest.cases[-1].undertone_slice,
        ),
    )
    changed = makeup_frozen.FrozenManifest(manifest.dataset_id, changed_cases)
    assert manifest.sha256 != changed.sha256
    with pytest.raises(ValueError, match="provenance"):
        schedule.validate(changed)


def test_skin_schedule_round_robins_depths_and_preserves_features() -> None:
    manifest = _skin_manifest()
    schedule = skin_schedule.build(manifest)
    assert skin_schedule.maximum_prefix_depth_spread(schedule) <= 1
    assert skin_schedule.depth_counts(schedule) == {
        "deep": 7,
        "light": 7,
        "medium": 7,
        "very-deep": 7,
    }
    by_id = {case.case_id: case for case in manifest.cases}
    for item in schedule.cases:
        assert item.feature_ids == by_id[item.case_id].feature_ids


def test_skin_schedule_shards_and_resume_are_lossless() -> None:
    schedule = skin_schedule.build(_skin_manifest())
    shards = skin_schedule.shards(schedule, 6)
    flat = tuple(itertools.chain.from_iterable(shards))
    assert len(flat) == len(schedule.cases)
    assert {item.case_id for item in flat} == set(schedule.case_ids)
    completed = set(schedule.case_ids[::2])
    remaining = skin_schedule.pending(schedule, completed)
    assert {item.case_id for item in remaining} == set(schedule.case_ids) - completed


def test_gender_schedule_balances_level_signatures() -> None:
    manifest = _gender_manifest()
    schedule = gender_schedule.build(manifest)
    assert gender_schedule.maximum_prefix_signature_spread(schedule) <= 1
    assert gender_schedule.signature_counts(schedule) == {
        "extra": 6,
        "hyper": 6,
        "normal": 6,
        "normal+extra+hyper": 6,
    }
    assert gender_schedule.level_evaluation_counts(schedule) == {
        "extra": 12,
        "hyper": 12,
        "normal": 12,
    }


def test_gender_schedule_shards_are_deterministic() -> None:
    schedule = gender_schedule.build(_gender_manifest())
    first = gender_schedule.shards(schedule, 4)
    second = gender_schedule.shards(schedule, 4)
    assert first == second
    for index, shard in enumerate(first):
        assert shard == schedule.cases[index::4]


def test_gender_schedule_rejects_unknown_resume_case() -> None:
    schedule = gender_schedule.build(_gender_manifest())
    with pytest.raises(ValueError, match="unknown"):
        gender_schedule.pending(schedule, {"ghost-case"})


@pytest.mark.parametrize("count", (0, -1))
def test_all_schedulers_reject_nonpositive_shard_counts(count: int) -> None:
    pairs = (
        (hair_schedule, hair_schedule.build(_hair_manifest())),
        (makeup_schedule, makeup_schedule.build(_makeup_manifest())),
        (skin_schedule, skin_schedule.build(_skin_manifest())),
        (gender_schedule, gender_schedule.build(_gender_manifest())),
    )
    for module, schedule in pairs:
        with pytest.raises(ValueError, match="positive"):
            module.shards(schedule, count)
