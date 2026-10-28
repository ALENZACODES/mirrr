"""R18B women-hair real-face and frozen-1000 contracts. Author: John Khan."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.hair_women import frozen1000, realface

from .conftest import digest, inset, tint


def make_case(image: np.ndarray, mask: np.ndarray, feature: str = "W19") -> realface.HairCase:
    after = tint(image, inset(mask), (2, 0, 1))
    scalp = np.zeros_like(mask)
    scalp[10:16, 20:32] = 1.0
    return realface.HairCase(
        case_id="hair-1",
        feature_id=feature,
        before=image,
        after=after,
        hair_mask=mask,
        scalp_mask=scalp,
        hair_slice="curly",
        tone_slice="deep",
        curl_reference=mask.copy(),
    )


def test_registry_ids_are_derived_and_include_colour_engine() -> None:
    ids = realface.registry_feature_ids()
    assert len(ids) == 25
    assert ids[0] == "W19"
    assert ids[-1] == "W44"
    assert "W28" in ids
    assert "W39" in ids
    assert "W27" not in ids


def test_every_registry_feature_has_written_definition() -> None:
    definitions = realface.definitions()
    assert len(definitions) == len(realface.registry_feature_ids())
    assert {item.id.split(".")[-1].upper() for item in definitions} == set(realface.registry_feature_ids())
    for item in definitions:
        item.validate()
        assert item.author == "John Khan"
        assert "Synthetic tests do not satisfy" in item.notes[0]


def test_hair_measure_localizes_changes_and_keeps_alpha(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    metrics = realface.measure(make_case(rgba_image, center_mask))
    assert metrics.outside_change_fraction == 0
    assert metrics.outside_max_delta == 0
    assert metrics.alpha_max_delta == 0
    assert metrics.hair_mean_delta > 0
    assert metrics.edge_retention > 0.7
    assert metrics.texture_retention > 0.65
    assert metrics.curl_retention > 0.69


def test_hair_evidence_passes_for_localized_case(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = make_case(rgba_image, center_mask)
    record = realface.evaluate(case)
    record.validate()
    assert record.status == "passed"
    assert len(record.input_sha256) == 64


def test_hair_missing_evidence_is_not_tested(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = make_case(rgba_image, center_mask)
    record = realface.evaluate(case, available_evidence=("before", "after"))
    assert record.status == "not_tested"
    assert record.missing == ("hair_mask",)


def test_hair_outside_change_fails(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = make_case(rgba_image, center_mask)
    bad_after = case.after.copy()
    bad_after[0, 0, 0] = np.uint8((int(bad_after[0, 0, 0]) + 20) % 255)
    bad = realface.HairCase(**{**case.__dict__, "after": bad_after})
    record = realface.evaluate(bad)
    assert record.status == "failed"
    assert float(record.metrics["outside_max_delta"]) > 1


def test_grey_timeline_rule_is_monotone(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = make_case(rgba_image, center_mask, "W33")
    good = realface.HairCase(**{**case.__dict__, "timeline_values": (0.1, 0.2, 0.2, 0.5)})
    bad = realface.HairCase(**{**case.__dict__, "timeline_values": (0.1, 0.4, 0.3)})
    assert realface.measure(good).grey_timeline_monotone is True
    assert realface.measure(bad).grey_timeline_monotone is False
    assert realface.evaluate(bad).status == "failed"


def test_summary_uses_registry_count_not_case_count(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = make_case(rgba_image, center_mask)
    record = realface.evaluate(case)
    summary = realface.summarize(((case, record),))
    assert summary["registry_feature_count"] == len(realface.registry_feature_ids())
    assert summary["tested_features"] == 1
    assert summary["ready"] is False


def test_frozen_manifest_partial_validation_and_hash() -> None:
    case = frozen1000.FrozenCase("one", digest(1), ("W19", "W28"), "curly", "deep")
    manifest = frozen1000.FrozenManifest("hair-set", (case,))
    manifest.validate(require_complete=False)
    assert len(manifest.sha256) == 64
    assert frozen1000.required_evaluations(manifest) == 2
    assert frozen1000.feature_case_counts(manifest)["W28"] == 1


def test_frozen_manifest_requires_exactly_1000_when_complete() -> None:
    manifest = frozen1000.FrozenManifest("hair-set", (frozen1000.FrozenCase("one", digest(1), ("W19",), "wavy", "medium"),))
    with pytest.raises(ValueError, match="expected 1000"):
        manifest.validate()


def test_frozen_shards_are_disjoint_and_cover_input() -> None:
    cases = tuple(frozen1000.FrozenCase(str(i), digest(i + 1), ("W19",), "unknown", "unknown") for i in range(17))
    shards = [frozen1000.shard(cases, index, 4) for index in range(4)]
    flattened = [case.case_id for shard in shards for case in shard]
    assert sorted(flattened, key=int) == [str(i) for i in range(17)]
    assert len(flattened) == len(set(flattened))


def test_frozen_completeness_rejects_unexpected_pair() -> None:
    case = frozen1000.FrozenCase("one", digest(1), ("W19",), "unknown", "unknown")
    manifest = frozen1000.FrozenManifest("hair-set", (case,))
    report = frozen1000.completeness(manifest, (("one", "W19"), ("two", "W19")))
    assert report["completed"] == 1
    assert report["unexpected"] == (("two", "W19"),)
    assert report["complete"] is False
