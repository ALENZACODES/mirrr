"""Numerical shard-ledger tests; counts are synthetic and no real faces are used.

Author: John Khan.
"""

from __future__ import annotations

import json
from dataclasses import replace
from typing import cast

import pytest

from plumb_api.commands.evidence_batch import (
    AggregateReading,
    ShardEvidence,
    collect_evidence,
    decode_evidence,
    decode_evidence_json,
)
from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.quality_gate_r3h import R3HDefinition, R3HMetricLimit

_MANIFEST = "a" * 64
_DEFINITION = "b" * 64


@pytest.fixture
def definition() -> R3HDefinition:
    return R3HDefinition(
        "beljour-pro-quality-gate/1", "studioquality", 100_000,
        ("source", "skin_tone", "gender"),
        (
            R3HMetricLimit("psnr_db", "at_least", 25.0, "dB"),
            R3HMetricLimit("artifact_fraction", "at_most", 0.05, "ratio"),
        ),
        True,
    )


def shard(index: int, *, population: int = 50_000) -> ShardEvidence:
    return ShardEvidence(
        "test-run-001", _MANIFEST, _DEFINITION, "studioquality", index, 2,
        population, population, population, 0,
        ("source", "skin_tone", "gender"),
        (
            AggregateReading("psnr_db", population, population * 30.0, 29.0, 31.0),
            AggregateReading("artifact_fraction", population, population * 0.02, 0.01, 0.03),
        ),
        True,
    )


def collect(definition: R3HDefinition, rows: list[ShardEvidence]) -> object:
    return collect_evidence(
        definition, rows,
        definition_sha256=_DEFINITION,
        frozen_manifest_sha256=_MANIFEST,
    )


def test_complete_ledger_remains_unproven(definition: R3HDefinition) -> None:
    report = collect_evidence(
        definition, [shard(0), shard(1)],
        definition_sha256=_DEFINITION,
        frozen_manifest_sha256=_MANIFEST,
    )
    assert report.status == "unproven"
    assert report.expected_total == 100_000
    assert report.seen_total == 100_000
    assert report.eligible_total == 100_000
    assert report.error_total == 0
    assert report.missing_shards == ()
    assert report.missing == ("external_release_verdict_not_supplied",)
    assert report.failed == ()
    assert report.metrics[0].average == 30.0
    assert report.metrics[1].average == 0.02
    assert report.public_metadata()["release_qualified"] is False
    assert "face_id" not in json.dumps(report.public_metadata())
    assert "image_path" not in json.dumps(report.public_metadata())


def test_order_is_stable(definition: R3HDefinition) -> None:
    first = collect_evidence(
        definition, [shard(0), shard(1)],
        definition_sha256=_DEFINITION,
        frozen_manifest_sha256=_MANIFEST,
    )
    reversed_order = collect_evidence(
        definition, [shard(1), shard(0)],
        definition_sha256=_DEFINITION,
        frozen_manifest_sha256=_MANIFEST,
    )
    assert first == reversed_order
    assert len(first.evidence_fingerprint) == 64


def test_low_metric_causes_failure(definition: R3HDefinition) -> None:
    bad = replace(
        shard(1),
        readings=(
            AggregateReading("psnr_db", 50_000, 750_000.0, 14.0, 16.0),
            AggregateReading("artifact_fraction", 50_000, 6_000.0, 0.11, 0.13),
        ),
    )
    report = collect_evidence(
        definition, [shard(0), bad],
        definition_sha256=_DEFINITION,
        frozen_manifest_sha256=_MANIFEST,
    )
    assert report.status == "fail"
    assert "metric:psnr_db" in report.failed
    assert "metric:artifact_fraction" in report.failed
    assert report.public_metadata()["release_qualified"] is False


def test_missing_shard_never_passes(definition: R3HDefinition) -> None:
    report = collect_evidence(
        definition, [shard(0)],
        definition_sha256=_DEFINITION,
        frozen_manifest_sha256=_MANIFEST,
    )
    assert report.status == "unproven"
    assert report.missing_shards == (1,)
    assert "missing_shards" in report.missing
    assert "frozen_population_incomplete" in report.missing


def test_partial_shard_cannot_claim_completeness(definition: R3HDefinition) -> None:
    incomplete = replace(
        shard(1), seen=49_000, eligible=49_000,
        readings=(
            AggregateReading("psnr_db", 49_000, 49_000 * 30.0, 29.0, 31.0),
            AggregateReading("artifact_fraction", 49_000, 49_000 * 0.02, 0.01, 0.03),
        ),
    )
    report = collect_evidence(
        definition, [shard(0), incomplete],
        definition_sha256=_DEFINITION,
        frozen_manifest_sha256=_MANIFEST,
    )
    assert report.status == "unproven"
    assert "incomplete_shard" in report.missing
    assert report.seen_total == 99_000


def test_failed_cases_cannot_disappear(definition: R3HDefinition) -> None:
    failed_case = replace(
        shard(0), eligible=49_900, errors=100,
        readings=(
            AggregateReading("psnr_db", 49_900, 49_900 * 30.0, 29.0, 31.0),
            AggregateReading("artifact_fraction", 49_900, 49_900 * 0.02, 0.01, 0.03),
        ),
    )
    report = collect_evidence(
        definition, [failed_case, shard(1)],
        definition_sha256=_DEFINITION,
        frozen_manifest_sha256=_MANIFEST,
    )
    assert report.error_total == 100
    assert report.expected_total == 100_000
    assert report.eligible_total == 99_900
    assert report.status == "unproven"


def test_missing_metric_is_unproven(definition: R3HDefinition) -> None:
    absent = replace(shard(0), readings=(shard(0).readings[0],))
    report = collect_evidence(
        definition, [absent, shard(1)],
        definition_sha256=_DEFINITION,
        frozen_manifest_sha256=_MANIFEST,
    )
    assert "metric:artifact_fraction" in report.missing
    assert report.status == "unproven"


def test_inconsistent_dataset_is_rejected(definition: R3HDefinition) -> None:
    bad = replace(shard(1), manifest_sha256="c" * 64)
    with pytest.raises(CommandValidationError):
        collect(definition, [shard(0), bad])


def test_inconsistent_definition_is_rejected(definition: R3HDefinition) -> None:
    bad = replace(shard(1), definition_sha256="c" * 64)
    with pytest.raises(CommandValidationError):
        collect(definition, [shard(0), bad])


def test_inconsistent_run_is_rejected(definition: R3HDefinition) -> None:
    bad = replace(shard(1), run_id="another")
    with pytest.raises(CommandValidationError):
        collect(definition, [shard(0), bad])


def test_duplicate_shards_fail(definition: R3HDefinition) -> None:
    with pytest.raises(CommandValidationError, match="Shard identifiers"):
        collect(definition, [shard(0), shard(0)])


def test_unknown_command_fails(definition: R3HDefinition) -> None:
    bad = replace(shard(1), command="upscale")
    with pytest.raises(CommandValidationError):
        collect(definition, [shard(0), bad])


def test_unverified_human_review(definition: R3HDefinition) -> None:
    bad = replace(shard(1), human_review_complete=False)
    report = collect_evidence(
        definition, [shard(0), bad],
        definition_sha256=_DEFINITION,
        frozen_manifest_sha256=_MANIFEST,
    )
    assert "independent_review_missing" in report.missing


def test_unverified_ground_truth_labels(definition: R3HDefinition) -> None:
    bad = replace(shard(0), labels=("source", "skin_tone"))
    report = collect_evidence(
        definition, [bad, shard(1)],
        definition_sha256=_DEFINITION,
        frozen_manifest_sha256=_MANIFEST,
    )
    assert "label:gender" in report.missing


def test_exact_json_roundtrip() -> None:
    data = shard(0).as_dict()
    decoded = decode_evidence_json(json.dumps(data))
    assert decoded == shard(0)
    assert decoded.as_dict() == data


def test_rejects_photo_and_path_fields() -> None:
    data = shard(0).as_dict()
    data["image_path"] = "/private/image.jpg"
    with pytest.raises(CommandValidationError):
        decode_evidence(data)


def test_rejects_unbounded_json() -> None:
    with pytest.raises(CommandValidationError):
        decode_evidence_json(" " * 33_000)


def test_invalid_json() -> None:
    with pytest.raises(CommandValidationError):
        decode_evidence_json("{")


@pytest.mark.parametrize("bad", [True, 1.5, "20", None, -1])
def test_invalid_counts(bad: object) -> None:
    data = shard(0).as_dict()
    data["seen"] = bad
    with pytest.raises(CommandValidationError):
        decode_evidence(data)


@pytest.mark.parametrize("bad", [float("nan"), float("inf"), -float("inf")])
def test_nonfinite_metric(bad: float) -> None:
    with pytest.raises(CommandValidationError):
        AggregateReading("psnr_db", 2, bad, 1.0, 2.0)


def test_aggregate_outside_extrema() -> None:
    with pytest.raises(CommandValidationError):
        AggregateReading("psnr_db", 100, 100_000.0, 0.0, 10.0)


def test_metric_count_exceeds_eligible() -> None:
    with pytest.raises(CommandValidationError):
        replace(
            shard(0),
            readings=(AggregateReading("psnr_db", 50_001, 50_001 * 30.0, 29.0, 31.0),),
        )


def test_evidence_digest_changes_with_metric() -> None:
    default = shard(0)
    changed = replace(
        default,
        readings=(
            AggregateReading("psnr_db", 50_000, 50_000 * 30.1, 29.0, 31.0),
            default.readings[1],
        ),
    )
    assert default.as_dict() != changed.as_dict()


def test_invalid_evidence_input(definition: R3HDefinition) -> None:
    with pytest.raises(CommandValidationError):
        collect_evidence(
            definition, cast(list[ShardEvidence], ["not-a-shard"]),
            definition_sha256=_DEFINITION,
            frozen_manifest_sha256=_MANIFEST,
        )


def test_population_is_bounded() -> None:
    with pytest.raises(CommandValidationError):
        replace(shard(0), expected=10_000_001, seen=50_000, eligible=50_000)


def test_overflow_is_typed_failure(definition: R3HDefinition) -> None:
    first = replace(
        shard(0), readings=(
            AggregateReading("psnr_db", 1, 1e308, 1e308, 1e308),
            shard(0).readings[1],
        ),
    )
    second = replace(
        shard(1), readings=(
            AggregateReading("psnr_db", 1, 1e308, 1e308, 1e308),
            shard(1).readings[1],
        ),
    )
    with pytest.raises(CommandValidationError, match="overflowed"):
        collect(definition, [first, second])


def test_exact_numeric_boundary(definition: R3HDefinition) -> None:
    first = replace(
        shard(0),
        readings=(
            AggregateReading("psnr_db", 50_000, 50_000 * 25, 25, 25),
            AggregateReading("artifact_fraction", 50_000, 50_000 * 0.05, 0.05, 0.05),
        ),
    )
    second = replace(
        shard(1),
        readings=(
            AggregateReading("psnr_db", 50_000, 50_000 * 25, 25, 25),
            AggregateReading("artifact_fraction", 50_000, 50_000 * 0.05, 0.05, 0.05),
        ),
    )
    report = collect_evidence(
        definition, [first, second],
        definition_sha256=_DEFINITION,
        frozen_manifest_sha256=_MANIFEST,
    )
    assert report.status == "unproven"
    assert report.failed == ()
    assert report.public_metadata()["release_qualified"] is False
