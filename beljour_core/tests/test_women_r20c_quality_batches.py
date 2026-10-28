"""Synthetic-only shard protocols; never masquerade as a frozen face run.

We exercise schema, partition, suppression and aggregation failures with
arithmetic counters, without importing an image dataset or face identifiers.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import FrozenInstanceError, replace

import pytest

from plumb_api.engines.women_styling.quality_batches import (
    FROZEN_FACE_COUNT,
    GroupCount,
    ShardAccumulator,
    ShardHeader,
    ShardSummary,
    merge_shards,
)
from plumb_api.engines.women_styling.realface_protocol import (
    FeatureGate,
    PixelEvidence,
    RealFaceObservation,
    SliceLabel,
    all_lane_c_gates,
    women_gates,
)

MANIFEST = "b" * 64


def gate() -> FeatureGate:
    return women_gates()[0]


def header(index: int = 0, count: int = 1) -> ShardHeader:
    return ShardHeader(gate().id, MANIFEST, index, count)


def synthetic_metrics(
    feature: FeatureGate,
    *,
    synthetic: bool = True,
    human: bool | None = None,
    breach: bool = False,
) -> PixelEvidence:
    return PixelEvidence(
        feature_id=feature.id,
        mask_pixel_count=120,
        edited_pixel_count=35,
        outside_mask_changed=1 if breach else 0,
        alpha_pixels_changed=0,
        max_channel_delta=10,
        original_preserved=True,
        simulation_disclosed=True,
        provider_calls=0,
        face_consented=True,
        synthetic=synthetic,
        human_accepted=human,
    )


def observation(
    feature: FeatureGate,
    *,
    tone: int = 5,
    synthetic: bool = True,
    human: bool | None = None,
    breach: bool = False,
) -> RealFaceObservation:
    return RealFaceObservation(
        SliceLabel(tone, "withheld", "30-39"),
        synthetic_metrics(feature, synthetic=synthetic,
                          human=human, breach=breach),
    )


def test_header_rejects_unknown_features_or_unfrozen_manifests() -> None:
    good = header()
    good.validate(gate())
    for change in (
        replace(good, feature_id="W14"),
        replace(good, manifest_sha256="x" * 64),
        replace(good, manifest_sha256="A" * 64),
        replace(good, index=-1),
        replace(good, index=2),
        replace(good, count=0),
        replace(good, count=4097),
        replace(good, evaluator_version="unknown"),
    ):
        with pytest.raises(ValueError):
            change.validate(gate())
    with pytest.raises(ValueError):
        replace(good, index=True).validate(gate())


def test_group_stats_are_bounded_and_well_formed() -> None:
    good = GroupCount("tone-10/self_described/60+", 100, 87, 82, 95)
    good.validate()
    for wrong in (
        replace(good, group="tone-0/self_described/60+"),
        replace(good, group="tone-10/random/60+"),
        replace(good, group="tone-10/self_described/80+"),
        replace(good, group="email/person@example.com"),
        replace(good, group="tone-10"),
        replace(good, total=True),
        replace(good, total=-1),
        replace(good, technical_pass=101),
        replace(good, human_pass=95),
        replace(good, human_reviewed=80),
    ):
        with pytest.raises(ValueError):
            wrong.validate()


def test_accumulator_discards_synthetic_rows_without_group_attribution() -> None:
    acc = ShardAccumulator(gate(), header())
    acc.ingest_many(observation(gate(), tone=tone) for tone in range(1, 11))
    snapshot = acc.snapshot()
    assert snapshot.real_count == 0
    assert snapshot.synthetic_count == 10
    assert snapshot.groups == ()
    assert snapshot.faults == (("SYNTHETIC_NOT_REAL_FACE", 10),)
    merged = merge_shards(gate(), [snapshot],
                          expected_frozen_sha256=MANIFEST)
    assert merged.state == "UNPROVEN"
    assert merged.real_faces == 0
    assert "SYNTHETIC_DATA_PRESENT" in merged.faults
    assert "FROZEN_FACE_COUNT_INCOMPLETE" in merged.faults
    assert "EXTERNAL_MANIFEST_REVIEW_REQUIRED" in merged.faults
    assert merged.disclosed_strata_rates == {}


def test_example_statistics_never_meet_frozen_realface_gate() -> None:
    acc = ShardAccumulator(gate(), header())
    acc.ingest_many(observation(gate(), tone=tone,
                                synthetic=False, human=True)
                    for tone in range(1, 11) for _ in range(20))
    snapshot = acc.snapshot()
    assert snapshot.real_count == 200
    assert snapshot.synthetic_count == 0
    assert sum(row.total for row in snapshot.groups) == 200
    assert all(row.human_pass == 20 for row in snapshot.groups)
    report = merge_shards(gate(), [snapshot],
                          expected_frozen_sha256=MANIFEST)
    assert report.state == "UNPROVEN"
    assert report.overall_acceptance == 1.0
    assert len(report.disclosed_strata_rates) == 10
    assert "FROZEN_FACE_COUNT_INCOMPLETE" in report.faults
    assert FROZEN_FACE_COUNT == 100_000


def test_group_report_hides_undersampled_intersections() -> None:
    acc = ShardAccumulator(gate(), header())
    acc.ingest_many(observation(gate(), synthetic=False,
                                tone=tone, human=True)
                    for tone in range(1, 11))
    snapshot = acc.snapshot()
    report = merge_shards(gate(), [snapshot],
                          expected_frozen_sha256=MANIFEST)
    assert report.suppressed_strata == 10
    assert report.disclosed_strata_rates == {}
    assert "STRATUM_UNDERSAMPLED" in report.faults


def test_failed_mask_and_missing_human_review_are_aggregated_separately() -> None:
    acc = ShardAccumulator(gate(), header())
    acc.ingest(observation(gate(), synthetic=False, human=True, breach=True))
    acc.ingest(observation(gate(), synthetic=False, human=None, breach=False))
    acc.ingest(observation(gate(), synthetic=False, human=False, breach=False))
    snapshot = acc.snapshot()
    counters = dict(snapshot.faults)
    assert counters["OUTSIDE_MASK_EDIT"] == 1
    assert counters["HUMAN_REVIEW_REQUIRED"] == 1
    assert snapshot.groups[0].human_reviewed == 2
    assert snapshot.groups[0].technical_pass == 2
    assert snapshot.groups[0].human_pass == 0
    report = merge_shards(gate(), [snapshot],
                          expected_frozen_sha256=MANIFEST,
                          manifest_reviewed=True)
    assert report.state == "FAIL"
    assert "NONNEGOTIABLE_PIXEL_BOUNDARY_FAILURE" in report.faults
    assert "HUMAN_REVIEW_INCOMPLETE" in report.faults


def test_shard_merging_is_order_independent_and_detects_duplicates() -> None:
    gate_value = gate()
    accs = [ShardAccumulator(gate_value, header(i, 3)) for i in range(3)]
    for i, acc in enumerate(accs):
        acc.ingest_many(observation(gate_value, tone=tone,
                                    synthetic=False, human=True)
                        for tone in range(1, 11) for _ in range(i + 2))
    snapshots = [acc.snapshot() for acc in accs]
    first = merge_shards(gate_value, snapshots,
                         expected_frozen_sha256=MANIFEST)
    second = merge_shards(gate_value, snapshots[::-1],
                          expected_frozen_sha256=MANIFEST)
    assert first == second
    assert first.included_shards == 3
    assert first.expected_shards == 3
    assert first.real_faces == 90
    with pytest.raises(ValueError, match="Duplicate shard"):
        merge_shards(gate_value, [snapshots[0], snapshots[0]],
                     expected_frozen_sha256=MANIFEST)
    with pytest.raises(ValueError, match="different frozen datasets"):
        merge_shards(gate_value, [snapshots[0]],
                     expected_frozen_sha256="e" * 64)


def test_partial_shards_always_fail_and_do_not_claim_coverage() -> None:
    value = gate()
    shard = ShardAccumulator(value, header(1, 3)).snapshot()
    output = merge_shards(value, [shard],
                          expected_frozen_sha256=MANIFEST,
                          manifest_reviewed=True)
    assert output.state == "FAIL"
    assert output.included_shards == 1
    assert "SHARDS_MISSING" in output.faults
    assert "NO_VALID_STRATA" in output.faults
    assert "TONE_COVERAGE_MISSING" in output.faults


def test_mismatched_shard_headers_and_replayed_summaries_rejected() -> None:
    value = gate()
    s1 = ShardAccumulator(value, header(0, 2)).snapshot()
    s2 = ShardAccumulator(value, header(1, 2)).snapshot()
    with pytest.raises(ValueError, match="Shard count"):
        merge_shards(value, [s1, replace(s2, header=header(1, 3))],
                     expected_frozen_sha256=MANIFEST)
    with pytest.raises(ValueError, match="Feature identifier"):
        replace(s1, header=replace(s1.header, feature_id="W15")).validate(value)
    with pytest.raises(ValueError):
        replace(s1, real_count=2).validate(value)
    with pytest.raises(ValueError):
        replace(s1, synthetic_count=FROZEN_FACE_COUNT + 1).validate(value)


def test_counter_forgery_rejected_even_without_a_runner() -> None:
    initial = ShardAccumulator(gate(), header()).snapshot()
    example = GroupCount("tone-1/female/20-29", 12, 12, 12, 12)
    illegal = (
        replace(initial, groups=(example, example), real_count=24),
        replace(initial, groups=(example,), real_count=4),
        replace(initial, faults=(("lowercase", 2),)),
        replace(initial, faults=(("INVALID_FAULT", True),)),
        replace(initial, faults=(("BAD_FAULT", 3), ("BAD_FAULT", 1))),
        replace(initial, groups=(example,), real_count=True),
    )
    for forged in illegal:
        with pytest.raises(ValueError):
            forged.validate(gate())


def test_snapshot_is_immutable_and_does_not_change_after_more_rows() -> None:
    acc = ShardAccumulator(gate(), header())
    before = acc.snapshot()
    acc.ingest(observation(gate()))
    after = acc.snapshot()
    assert before.synthetic_count == 0
    assert after.synthetic_count == 1
    with pytest.raises(FrozenInstanceError):
        before.real_count = 2  # type: ignore[misc]


@pytest.mark.parametrize("feature", women_gates(), ids=lambda feature: feature.id)
def test_every_lanec_w_feature_has_an_owned_shard_protocol(
    feature: FeatureGate,
) -> None:
    record = ShardHeader(feature.id, MANIFEST, 0, 1)
    accumulator = ShardAccumulator(feature, record)
    accumulator.ingest(observation(feature, synthetic=True))
    snapshot = accumulator.snapshot()
    assert snapshot.header.feature_id == feature.id
    assert snapshot.synthetic_count == 1
    assert snapshot.real_count == 0
    assert snapshot.groups == ()
    result = merge_shards(feature, [snapshot],
                          expected_frozen_sha256=MANIFEST)
    assert result.state == "UNPROVEN"
    assert result.disclosed_strata_rates == {}


@pytest.mark.parametrize("feature", all_lane_c_gates(), ids=lambda feature: feature.id)
def test_every_registered_lanec_gate_is_covered_by_one_quality_shard(
    feature: FeatureGate,
) -> None:
    """A dynamic, exact coverage gate prevents silently dropped men's presets."""
    assert feature.owner == "John Khan"
    header_value = ShardHeader(feature.id, MANIFEST, 0, 1)
    accumulator = ShardAccumulator(feature, header_value)
    row = PixelEvidence(
        feature_id=feature.id,
        mask_pixel_count=100,
        edited_pixel_count=1 if feature.require_visible_change else 0,
        outside_mask_changed=0,
        alpha_pixels_changed=0,
        max_channel_delta=min(5, feature.max_channel_delta),
        original_preserved=True,
        simulation_disclosed=True,
        provider_calls=0,
        face_consented=False,
        synthetic=True,
        human_accepted=None,
    )
    accumulator.ingest(
        RealFaceObservation(SliceLabel(5, "withheld", "30-39"), row),
    )
    report = accumulator.snapshot()
    assert report.synthetic_count == 1
    assert report.real_count == 0
    assert report.header.feature_id == feature.id
    merged = merge_shards(feature, [report],
                          expected_frozen_sha256=MANIFEST)
    assert merged.state == "UNPROVEN"
    assert merged.real_faces == 0
    assert merged.disclosed_strata_rates == {}
