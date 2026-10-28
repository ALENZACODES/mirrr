"""R18B frozen-manifest parser, hashing, sharding, and completeness contracts. Author: John Khan."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from plumb_api.engines.gender_look import frozen1000 as gender
from plumb_api.engines.hair_women import frozen1000 as hair
from plumb_api.engines.hair_women.realface import registry_feature_ids as hair_ids
from plumb_api.engines.lips import frozen1000 as lips
from plumb_api.engines.lips.realface import registry_feature_ids as lip_ids
from plumb_api.engines.makeup_w import frozen1000 as makeup
from plumb_api.engines.makeup_w.realface import registry_feature_ids as makeup_ids
from plumb_api.engines.skin_more import frozen1000 as skin
from plumb_api.engines.skin_more.realface import registry_feature_ids as skin_ids
from plumb_api.engines.smile import frozen1000 as smile
from plumb_api.engines.smile.realface import registry_feature_ids as smile_ids


SHA = "d" * 64


def test_hair_manifest_canonical_hash_and_registry_counts() -> None:
    features = hair_ids()
    cases = (
        hair.FrozenCase("a", SHA, (features[0], features[1]), "curly", "deep"),
        hair.FrozenCase("b", SHA, (features[1],), "straight", "light"),
    )
    manifest = hair.FrozenManifest("hair-unit", cases)
    manifest.validate(require_complete=False)
    parsed = json.loads(manifest.canonical())
    assert parsed["registry_features"] == list(features)
    assert parsed["expected_cases"] == 1000
    assert len(manifest.sha256) == 64
    counts = hair.feature_case_counts(manifest)
    assert counts[features[0]] == 1
    assert counts[features[1]] == 2
    assert hair.required_evaluations(manifest) == 3


def test_hair_manifest_parser_round_trip_and_defaults() -> None:
    feature = hair_ids()[0]
    raw = {
        "format": hair.FORMAT,
        "author": "John Khan",
        "dataset_id": "hair-unit",
        "expected_cases": 1000,
        "cases": [
            {
                "case_id": "a",
                "input_sha256": SHA,
                "feature_ids": [feature],
                "hair_slice": "curly",
                "tone_slice": "deep",
            }
        ],
    }
    manifest = hair.parse_manifest(raw, require_complete=False)
    assert manifest.cases[0].hair_slice == "curly"
    assert hair.parse_case({"case_id": "b", "input_sha256": SHA, "feature_ids": [feature]}).hair_slice == "unknown"
    assert json.loads(manifest.canonical())["cases"][0]["case_id"] == "a"


def test_hair_manifest_rejects_bad_format_nonobject_cases_and_duplicates() -> None:
    feature = hair_ids()[0]
    with pytest.raises(ValueError, match="unsupported"):
        hair.parse_manifest({"format": "wrong", "cases": []}, require_complete=False)
    with pytest.raises(ValueError, match="each case"):
        hair.parse_manifest(
            {
                "format": hair.FORMAT,
                "author": "John Khan",
                "dataset_id": "x",
                "cases": ["bad"],
            },
            require_complete=False,
        )
    duplicate = hair.FrozenCase("same", SHA, (feature,), "x", "y")
    with pytest.raises(ValueError, match="duplicate"):
        hair.FrozenManifest("x", (duplicate, duplicate)).validate(require_complete=False)


def test_hair_shards_are_disjoint_and_completeness_detects_extra_work() -> None:
    feature = hair_ids()[0]
    cases = tuple(hair.FrozenCase(str(index), SHA, (feature,), "x", "y") for index in range(10))
    shards = tuple(hair.shard(cases, index, 3) for index in range(3))
    flattened = [case.case_id for shard in shards for case in shard]
    assert sorted(flattened) == sorted(case.case_id for case in cases)
    manifest = hair.FrozenManifest("x", cases)
    completed = {(case.case_id, feature) for case in cases}
    state = hair.completeness(manifest, completed | {("ghost", feature)})
    assert state["missing"] == ()
    assert state["unexpected"] == (("ghost", feature),)
    assert state["complete"] is False


def test_makeup_manifest_canonical_tracks_fairness_slices() -> None:
    feature = makeup_ids()[0]
    case = makeup.FrozenCase("m", SHA, (feature,), "deep", "olive")
    manifest = makeup.FrozenManifest("makeup-unit", (case,))
    payload = json.loads(manifest.canonical())
    assert payload["cases"][0]["depth_slice"] == "deep"
    assert payload["cases"][0]["undertone_slice"] == "olive"
    assert makeup.feature_case_counts(manifest)[feature] == 1
    assert makeup.required_evaluations(manifest) == 1


def test_makeup_parser_rejects_feature_string_instead_of_array() -> None:
    with pytest.raises(ValueError, match="feature_ids"):
        makeup.parse_case({"case_id": "m", "input_sha256": SHA, "feature_ids": "W1"})


def test_makeup_manifest_hash_changes_with_slice_or_input() -> None:
    feature = makeup_ids()[0]
    base = makeup.FrozenManifest("x", (makeup.FrozenCase("m", SHA, (feature,), "deep", "olive"),))
    depth_changed = makeup.FrozenManifest("x", (makeup.FrozenCase("m", SHA, (feature,), "light", "olive"),))
    input_changed = makeup.FrozenManifest("x", (makeup.FrozenCase("m", "e" * 64, (feature,), "deep", "olive"),))
    assert base.sha256 != depth_changed.sha256
    assert base.sha256 != input_changed.sha256


def test_lips_required_evaluations_and_feature_counts() -> None:
    features = lip_ids()[:2]
    manifest = lips.FrozenManifest(
        "lip-unit",
        (
            lips.FrozenCase("l1", SHA, features),
            lips.FrozenCase("l2", SHA, (features[0],)),
        ),
    )
    assert lips.required_evaluations(manifest) == 3
    counts = lips.feature_case_counts(manifest)
    assert counts[features[0]] == 2
    assert counts[features[1]] == 1


def test_lips_parser_rejects_unknown_feature_and_duplicate_feature() -> None:
    feature = lip_ids()[0]
    with pytest.raises(ValueError, match="built lip ids"):
        lips.FrozenCase("x", SHA, ("W999",)).validate()
    with pytest.raises(ValueError, match="unique"):
        lips.FrozenCase("x", SHA, (feature, feature)).validate()


def test_smile_helpers_derive_counts_from_registry_features() -> None:
    features = smile_ids()[:2]
    manifest = smile.FrozenManifest(
        "smile-unit",
        (
            smile.FrozenCase("s1", SHA, features),
            smile.FrozenCase("s2", SHA, (features[1],)),
        ),
    )
    assert smile.required_evaluations(manifest) == 3
    counts = smile.feature_case_counts(manifest)
    assert set(counts) == set(smile_ids())
    assert counts[features[1]] == 2


def test_smile_completeness_requires_exact_case_feature_pairs() -> None:
    feature = smile_ids()[0]
    manifest = smile.FrozenManifest("s", (smile.FrozenCase("s1", SHA, (feature,)),))
    missing = smile.completeness(manifest, set())
    assert missing["missing"] == (("s1", feature),)
    done = smile.completeness(manifest, {("s1", feature)})
    assert done["missing"] == ()
    assert done["complete"] is False


def test_skin_helpers_derive_feature_counts_and_evaluation_count() -> None:
    features = skin_ids()[:3]
    manifest = skin.FrozenManifest(
        "skin-unit",
        (
            skin.FrozenCase("k1", SHA, (features[0], features[1]), "deep"),
            skin.FrozenCase("k2", SHA, (features[2],), "light"),
        ),
    )
    assert skin.required_evaluations(manifest) == 3
    counts = skin.feature_case_counts(manifest)
    assert [counts[feature] for feature in features] == [1, 1, 1]


def test_skin_manifest_hash_binds_depth_slice() -> None:
    feature = skin_ids()[0]
    deep = skin.FrozenManifest("skin", (skin.FrozenCase("k", SHA, (feature,), "deep"),))
    light = skin.FrozenManifest("skin", (skin.FrozenCase("k", SHA, (feature,), "light"),))
    assert deep.sha256 != light.sha256


def test_gender_manifest_hash_binds_enabled_levels() -> None:
    normal = gender.FrozenManifest("gender", (gender.FrozenCase("g", SHA, ("normal",)),))
    all_levels = gender.FrozenManifest("gender", (gender.FrozenCase("g", SHA, ("normal", "extra", "hyper")),))
    assert normal.sha256 != all_levels.sha256
    assert json.loads(all_levels.canonical())["levels"] == ["normal", "extra", "hyper"]


def test_gender_parser_rejects_unknown_level() -> None:
    raw = {
        "format": gender.FORMAT,
        "author": "John Khan",
        "dataset_id": "g",
        "expected_cases": 1000,
        "cases": [{"case_id": "g", "input_sha256": SHA, "levels": ["extreme"]}],
    }
    with pytest.raises(ValueError, match="unsupported level"):
        gender.parse_manifest(raw, require_complete=False)


def test_gender_completeness_counts_each_enabled_level() -> None:
    manifest = gender.FrozenManifest("g", (gender.FrozenCase("g1", SHA, ("normal", "extra")),))
    state = gender.completeness(manifest, {("g1", "normal")})
    assert state["required"] == 2
    assert state["completed"] == 1
    assert state["missing"] == (("g1", "extra"),)


@pytest.mark.parametrize(
    "module,cases",
    (
        (hair, lambda: (hair.FrozenCase("0", SHA, (hair_ids()[0],), "x", "y"),)),
        (makeup, lambda: (makeup.FrozenCase("0", SHA, (makeup_ids()[0],), "x", "y"),)),
        (lips, lambda: (lips.FrozenCase("0", SHA, (lip_ids()[0],)),)),
        (smile, lambda: (smile.FrozenCase("0", SHA, (smile_ids()[0],)),)),
        (skin, lambda: (skin.FrozenCase("0", SHA, (skin_ids()[0],), "x"),)),
        (gender, lambda: (gender.FrozenCase("0", SHA, ("normal",)),)),
    ),
)
def test_every_frozen_twin_declares_exactly_1000_cases(module: object, cases: object) -> None:
    assert getattr(module, "EXPECTED_CASES") == 1000
    manifest_type = getattr(module, "FrozenManifest")
    manifest = manifest_type("unit", cases())
    with pytest.raises(ValueError, match="1000"):
        manifest.validate(require_complete=True)


def test_load_rejects_missing_path(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="does not exist"):
        hair.load(tmp_path / "missing.json", require_complete=False)


def test_load_round_trip_from_small_hair_manifest(tmp_path: Path) -> None:
    feature = hair_ids()[0]
    raw = {
        "format": hair.FORMAT,
        "author": "John Khan",
        "dataset_id": "disk",
        "expected_cases": 1000,
        "cases": [
            {
                "case_id": "h",
                "input_sha256": SHA,
                "feature_ids": [feature],
                "hair_slice": "wavy",
                "tone_slice": "medium",
            }
        ],
    }
    path = tmp_path / "hair.json"
    path.write_text(json.dumps(raw), encoding="utf-8")
    loaded = hair.load(path, require_complete=False)
    assert loaded.cases[0].hair_slice == "wavy"
    assert loaded.dataset_id == "disk"
