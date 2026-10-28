"""R18B frozen-1000 ledger integrity, resume, and merge tests. Author: John Khan."""
from __future__ import annotations

import pytest

from plumb_api.engines.gender_look import frozen1000 as gender_manifest
from plumb_api.engines.gender_look import frozen_results as gender_results
from plumb_api.engines.hair_women import frozen1000 as hair_manifest
from plumb_api.engines.hair_women import frozen_results as hair_results
from plumb_api.engines.hair_women.realface import registry_feature_ids as hair_ids
from plumb_api.engines.lips import frozen1000 as lips_manifest
from plumb_api.engines.lips import frozen_results as lips_results
from plumb_api.engines.lips.realface import registry_feature_ids as lip_ids
from plumb_api.engines.makeup_w import frozen1000 as makeup_manifest
from plumb_api.engines.makeup_w import frozen_results as makeup_results
from plumb_api.engines.makeup_w.realface import registry_feature_ids as makeup_ids
from plumb_api.engines.skin_more import frozen1000 as skin_manifest
from plumb_api.engines.skin_more import frozen_results as skin_results
from plumb_api.engines.skin_more.realface import registry_feature_ids as skin_ids
from plumb_api.engines.smile import frozen1000 as smile_manifest
from plumb_api.engines.smile import frozen_results as smile_results
from plumb_api.engines.smile.realface import registry_feature_ids as smile_ids


INPUT = "1" * 64
DEFINITION = "2" * 64
METRICS = "3" * 64


def _hair() -> hair_manifest.FrozenManifest:
    features = hair_ids()[:3]
    cases = (
        hair_manifest.FrozenCase("h1", INPUT, (features[0], features[1]), "curly", "deep"),
        hair_manifest.FrozenCase("h2", INPUT, (features[2],), "straight", "light"),
    )
    return hair_manifest.FrozenManifest("hair", cases)


def _makeup() -> makeup_manifest.FrozenManifest:
    features = makeup_ids()[:3]
    cases = (
        makeup_manifest.FrozenCase("m1", INPUT, (features[0], features[1]), "deep", "olive"),
        makeup_manifest.FrozenCase("m2", INPUT, (features[2],), "light", "cool"),
    )
    return makeup_manifest.FrozenManifest("makeup", cases)


def _lips() -> lips_manifest.FrozenManifest:
    features = lip_ids()[:3]
    return lips_manifest.FrozenManifest(
        "lips",
        (
            lips_manifest.FrozenCase("l1", INPUT, (features[0], features[1])),
            lips_manifest.FrozenCase("l2", INPUT, (features[2],)),
        ),
    )


def _smile() -> smile_manifest.FrozenManifest:
    features = smile_ids()[:3]
    return smile_manifest.FrozenManifest(
        "smile",
        (
            smile_manifest.FrozenCase("s1", INPUT, (features[0], features[1])),
            smile_manifest.FrozenCase("s2", INPUT, (features[2],)),
        ),
    )


def _skin() -> skin_manifest.FrozenManifest:
    features = skin_ids()[:3]
    return skin_manifest.FrozenManifest(
        "skin",
        (
            skin_manifest.FrozenCase("k1", INPUT, (features[0], features[1]), "deep"),
            skin_manifest.FrozenCase("k2", INPUT, (features[2],), "light"),
        ),
    )


def _gender() -> gender_manifest.FrozenManifest:
    return gender_manifest.FrozenManifest(
        "gender",
        (
            gender_manifest.FrozenCase("g1", INPUT, ("normal", "extra")),
            gender_manifest.FrozenCase("g2", INPUT, ("hyper",)),
        ),
    )


def test_hair_ledger_pending_merge_and_statuses() -> None:
    manifest = _hair()
    first_feature, second_feature = manifest.cases[0].feature_ids
    first = hair_results.ResultRow("h1", first_feature, "passed", DEFINITION, INPUT, METRICS)
    second = hair_results.ResultRow("h1", second_feature, "failed", DEFINITION, INPUT, METRICS)
    third = hair_results.ResultRow("h2", manifest.cases[1].feature_ids[0], "not_tested", DEFINITION, INPUT, METRICS)
    shard_a = hair_results.ResultLedger(manifest.sha256, (first,))
    shard_b = hair_results.ResultLedger(manifest.sha256, (second, third))
    assert hair_results.pending(manifest, shard_a) == (("h1", second_feature), ("h2", manifest.cases[1].feature_ids[0]))
    merged = hair_results.merge(manifest, (shard_b, shard_a))
    assert hair_results.pending(manifest, merged) == ()
    assert hair_results.statuses(merged) == {"passed": 1, "failed": 1, "not_tested": 1}
    assert len(merged.sha256(manifest)) == 64


def test_hair_ledger_rejects_overlap_hash_drift_and_unknown_rows() -> None:
    manifest = _hair()
    feature = manifest.cases[0].feature_ids[0]
    row = hair_results.ResultRow("h1", feature, "passed", DEFINITION, INPUT, METRICS)
    ledger = hair_results.ResultLedger(manifest.sha256, (row,))
    with pytest.raises(ValueError, match="overlapping"):
        hair_results.merge(manifest, (ledger, ledger))
    bad_hash = hair_results.ResultRow("h1", feature, "passed", DEFINITION, "9" * 64, METRICS)
    with pytest.raises(ValueError, match="input hash"):
        hair_results.ResultLedger(manifest.sha256, (bad_hash,)).validate(manifest)
    unknown = hair_results.ResultRow("ghost", feature, "passed", DEFINITION, INPUT, METRICS)
    with pytest.raises(ValueError, match="outside"):
        hair_results.ResultLedger(manifest.sha256, (unknown,)).validate(manifest)


def test_makeup_ledger_merges_shards_and_hashes_metrics_canonically() -> None:
    manifest = _makeup()
    rows = [
        makeup_results.ResultRow(case.case_id, feature, "passed", DEFINITION, INPUT, makeup_results.metrics_sha256({"b": 2.0, "a": 1.0}))
        for case in manifest.cases
        for feature in case.feature_ids
    ]
    shard_a = makeup_results.ResultLedger(manifest.sha256, tuple(rows[::2]))
    shard_b = makeup_results.ResultLedger(manifest.sha256, tuple(rows[1::2]))
    merged = makeup_results.merge(manifest, (shard_a, shard_b))
    assert makeup_results.pending(manifest, merged) == ()
    assert makeup_results.metrics_sha256({"a": 1.0, "b": 2.0}) == makeup_results.metrics_sha256({"b": 2.0, "a": 1.0})
    assert makeup_results.statuses(merged)["passed"] == 3


def test_makeup_ledger_rejects_invalid_status_and_digest() -> None:
    manifest = _makeup()
    feature = manifest.cases[0].feature_ids[0]
    with pytest.raises(ValueError, match="status"):
        makeup_results.ResultRow("m1", feature, "maybe", DEFINITION, INPUT, METRICS).validate()
    with pytest.raises(ValueError, match="sha256"):
        makeup_results.ResultRow("m1", feature, "passed", "bad", INPUT, METRICS).validate()


def test_lip_ledger_full_resume_round_trip() -> None:
    manifest = _lips()
    rows = tuple(
        lips_results.ResultRow(case.case_id, feature, "passed", DEFINITION, INPUT, METRICS)
        for case in manifest.cases
        for feature in case.feature_ids
    )
    ledger = lips_results.ResultLedger(manifest.sha256, rows)
    ledger.validate(manifest)
    assert lips_results.pending(manifest, ledger) == ()
    assert lips_results.statuses(ledger) == {"passed": 3, "failed": 0, "not_tested": 0}
    assert ledger.canonical(manifest) == ledger.canonical(manifest)


def test_lip_ledger_manifest_binding_prevents_cross_dataset_reuse() -> None:
    manifest = _lips()
    feature = manifest.cases[0].feature_ids[0]
    ledger = lips_results.ResultLedger(
        manifest.sha256,
        (lips_results.ResultRow("l1", feature, "passed", DEFINITION, INPUT, METRICS),),
    )
    changed = lips_manifest.FrozenManifest("different", manifest.cases)
    with pytest.raises(ValueError, match="manifest hash"):
        ledger.validate(changed)


def test_smile_ledger_tracks_dental_and_motion_feature_rows_independently() -> None:
    manifest = _smile()
    rows = tuple(
        smile_results.ResultRow(case.case_id, feature, "passed", DEFINITION, INPUT, METRICS)
        for case in manifest.cases
        for feature in case.feature_ids
    )
    ledger = smile_results.ResultLedger(manifest.sha256, rows)
    assert smile_results.pending(manifest, ledger) == ()
    assert smile_results.statuses(ledger)["passed"] == len(rows)
    assert len(ledger.sha256(manifest)) == 64


def test_smile_ledger_duplicate_case_feature_is_rejected() -> None:
    manifest = _smile()
    feature = manifest.cases[0].feature_ids[0]
    row = smile_results.ResultRow("s1", feature, "passed", DEFINITION, INPUT, METRICS)
    ledger = smile_results.ResultLedger(manifest.sha256, (row, row))
    with pytest.raises(ValueError, match="duplicate"):
        ledger.validate(manifest)


def test_skin_ledger_resume_distinguishes_failed_from_not_tested() -> None:
    manifest = _skin()
    rows = (
        skin_results.ResultRow("k1", manifest.cases[0].feature_ids[0], "failed", DEFINITION, INPUT, METRICS),
        skin_results.ResultRow("k1", manifest.cases[0].feature_ids[1], "not_tested", DEFINITION, INPUT, METRICS),
    )
    ledger = skin_results.ResultLedger(manifest.sha256, rows)
    counts = skin_results.statuses(ledger)
    assert counts == {"passed": 0, "failed": 1, "not_tested": 1}
    assert skin_results.pending(manifest, ledger) == (("k2", manifest.cases[1].feature_ids[0]),)


def test_skin_metrics_digest_changes_when_boolean_gate_changes() -> None:
    passed = skin_results.metrics_sha256({"localized": True, "delta": 0.5})
    failed = skin_results.metrics_sha256({"localized": False, "delta": 0.5})
    assert passed != failed


def test_gender_ledger_operates_on_case_level_pairs() -> None:
    manifest = _gender()
    rows = (
        gender_results.ResultRow("g1", "normal", "passed", DEFINITION, INPUT, METRICS),
        gender_results.ResultRow("g1", "extra", "passed", DEFINITION, INPUT, METRICS),
    )
    ledger = gender_results.ResultLedger(manifest.sha256, rows)
    assert gender_results.pending(manifest, ledger) == (("g2", "hyper"),)
    final = gender_results.merge(
        manifest,
        (
            ledger,
            gender_results.ResultLedger(
                manifest.sha256,
                (gender_results.ResultRow("g2", "hyper", "passed", DEFINITION, INPUT, METRICS),),
            ),
        ),
    )
    assert gender_results.pending(manifest, final) == ()


def test_gender_ledger_rejects_level_not_enabled_for_case() -> None:
    manifest = _gender()
    row = gender_results.ResultRow("g2", "normal", "passed", DEFINITION, INPUT, METRICS)
    with pytest.raises(ValueError, match="outside"):
        gender_results.ResultLedger(manifest.sha256, (row,)).validate(manifest)


@pytest.mark.parametrize(
    "function,first,second",
    (
        (hair_results.metrics_sha256, {"x": 1.0, "flag": True}, {"flag": True, "x": 1.0}),
        (makeup_results.metrics_sha256, {"x": 1.0, "flag": True}, {"flag": True, "x": 1.0}),
        (lips_results.metrics_sha256, {"x": 1.0, "flag": True}, {"flag": True, "x": 1.0}),
        (smile_results.metrics_sha256, {"x": 1.0, "flag": True}, {"flag": True, "x": 1.0}),
        (skin_results.metrics_sha256, {"x": 1.0, "flag": True}, {"flag": True, "x": 1.0}),
        (gender_results.metrics_sha256, {"x": 1.0, "flag": True}, {"flag": True, "x": 1.0}),
    ),
)
def test_metric_hashes_are_order_independent(function: object, first: dict[str, float | bool], second: dict[str, float | bool]) -> None:
    assert callable(function)
    assert function(first) == function(second)
