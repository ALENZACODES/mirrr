"""R21c preregistered Lane C quality definitions; synthetic mock metrics only.

No images, face identities, manually labelled people, or provider credentials.
Every gate remains UNPROVEN until an approved frozen real-face evaluator runs.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import replace

import pytest

from plumb_api.engines.women_styling.realface_protocol import (
    FROZEN_FACE_COUNT,
    FeatureGate,
    PixelEvidence,
    RealFaceObservation,
    SliceLabel,
    all_lane_c_gates,
    commerce_gates,
    evaluate_real_face_gate,
    menshair_gates,
    score_pixel_evidence,
    women_gates,
)
from plumb_api.engines.women_styling.specs import FEATURE_SPECS


def synthetic_metric(gate: FeatureGate) -> PixelEvidence:
    return PixelEvidence(
        feature_id=gate.id,
        mask_pixel_count=180,
        edited_pixel_count=19 if gate.require_visible_change else 0,
        outside_mask_changed=0,
        alpha_pixels_changed=0,
        max_channel_delta=8 if gate.max_channel_delta > 0 else 0,
        original_preserved=True,
        simulation_disclosed=True,
        provider_calls=0,
        face_consented=False,
        synthetic=True,
        human_accepted=None,
    )


def test_full_lane_c_manifest_has_every_authored_hairstyle_once() -> None:
    women = women_gates()
    men = menshair_gates()
    commerce = commerce_gates()
    all_features = all_lane_c_gates()
    assert [gate.id for gate in women] == [spec.id for spec in FEATURE_SPECS]
    assert len(men) == 437
    assert len(commerce) == 3
    assert len(all_features) == len(women) + len(men) + len(commerce)
    assert len({feature.id for feature in all_features}) == len(all_features)
    assert all(feature.owner == "John Khan" for feature in all_features)
    assert all(feature.real_face_status == "UNPROVEN" for feature in all_features)
    assert all(feature.outside_mask_pixels == 0 for feature in all_features)
    assert all(feature.alpha_changed_pixels == 0 for feature in all_features)


@pytest.mark.parametrize("gate", women_gates(), ids=lambda gate: gate.id)
def test_one_realface_definition_per_woman_feature(gate: FeatureGate) -> None:
    evidence = synthetic_metric(gate)
    result = score_pixel_evidence(gate, evidence)
    assert result.technical_pass
    assert result.faults == ()
    assert result.evidence_kind == "SYNTHETIC"
    assert result.human_pass is None
    assert gate.max_channel_delta < 255
    assert gate.must_change != gate.must_not_change
    assert gate.must_not_change.startswith(("No", "Not", "Does not"))


@pytest.mark.parametrize("gate", women_gates(), ids=lambda gate: gate.id)
def test_each_feature_rejects_pixels_outside_mask_or_alpha(gate: FeatureGate) -> None:
    good = synthetic_metric(gate)
    edits = (
        (replace(good, outside_mask_changed=1), "OUTSIDE_MASK_EDIT"),
        (replace(good, alpha_pixels_changed=1), "ALPHA_EDIT"),
        (replace(good, max_channel_delta=gate.max_channel_delta + 1), "CHANNEL_LIMIT"),
        (replace(good, original_preserved=False), "ORIGINAL_BUFFER_CHANGED"),
        (replace(good, simulation_disclosed=False), "DISCLOSURE_MISSING"),
        (replace(good, mask_pixel_count=0), "MISSING_REGION_MASK"),
        (replace(good, provider_calls=1), "UNAUTHORIZED_PROVIDER"),
    )
    for altered, expected in edits:
        verdict = score_pixel_evidence(gate, altered)
        assert not verdict.technical_pass
        assert expected in verdict.faults
    absent = score_pixel_evidence(gate, replace(good, edited_pixel_count=0))
    assert "NO_VISIBLE_EFFECT" in absent.faults


def test_commerce_ranking_is_not_mistaken_for_image_editing() -> None:
    ranking = commerce_gates()[0]
    result = score_pixel_evidence(ranking, synthetic_metric(ranking))
    assert result.technical_pass
    assert not ranking.require_visible_change
    assert ranking.max_channel_delta == 0
    assert ranking.required_mask == ("selected-swatch",)
    forged = replace(synthetic_metric(ranking), max_channel_delta=1)
    assert "CHANNEL_LIMIT" in score_pixel_evidence(ranking, forged).faults


def test_positive_release_cannot_be_inferred_from_synthetic_metrics() -> None:
    gate = women_gates()[0]
    group = SliceLabel(1, "female", "20-29")
    rows = (RealFaceObservation(group, synthetic_metric(gate)) for _ in range(120))
    report = evaluate_real_face_gate(
        gate,
        rows,
        expected_frozen_sha256="b" * 64,
        reviewed_real_face_manifest=True,
    )
    assert report.state == "FAIL"
    assert report.total_real_faces == 0
    assert "SYNTHETIC_NOT_REAL_FACE" in report.failures
    assert "INSUFFICIENT_FROZEN_FACES" in report.failures
    assert "NO_REAL_FACE_SLICES" in report.failures


def test_no_manifest_never_consumes_an_evaluator_or_marks_release_green() -> None:
    gate = women_gates()[0]
    report = evaluate_real_face_gate(
        gate,
        (item for item in ()),
        expected_frozen_sha256=None,
        reviewed_real_face_manifest=False,
    )
    assert report.state == "UNPROVEN"
    assert report.total_real_faces == 0
    assert report.failures == ("FROZEN_SET_UNAVAILABLE",)


def test_unconsented_real_metric_rejected_even_when_other_numbers_look_good() -> None:
    gate = women_gates()[1]
    row = replace(synthetic_metric(gate), synthetic=False, human_accepted=True)
    assert "CONSENT_MISSING" in score_pixel_evidence(gate, row).faults


def test_short_real_face_run_is_rejected_despite_valid_human_scores() -> None:
    gate = women_gates()[0]
    accepted = replace(
        synthetic_metric(gate),
        synthetic=False,
        face_consented=True,
        human_accepted=True,
    )
    groups = [SliceLabel(tone, "female", "30-39") for tone in range(1, 11)]
    observations = [RealFaceObservation(group, accepted) for group in groups for _ in range(20)]
    report = evaluate_real_face_gate(
        gate,
        observations,
        expected_frozen_sha256="a" * 64,
        reviewed_real_face_manifest=True,
    )
    assert report.state == "FAIL"
    assert report.total_real_faces == 200
    assert report.overall_success_rate == 1.0
    assert "INSUFFICIENT_FROZEN_FACES" in report.failures
    assert FROZEN_FACE_COUNT == 100_000
    assert len(report.slice_rates) == 10


def test_a_missing_tone_or_small_intersection_is_explicitly_identified() -> None:
    gate = women_gates()[0]
    accepted = replace(
        synthetic_metric(gate),
        synthetic=False,
        face_consented=True,
        human_accepted=True,
    )
    row = RealFaceObservation(SliceLabel(9, "nonbinary", "60+"), accepted)
    report = evaluate_real_face_gate(
        gate,
        [row],
        expected_frozen_sha256="a" * 64,
        reviewed_real_face_manifest=True,
    )
    assert report.state == "FAIL"
    assert "SLICE_UNDERSAMPLED" in report.failures
    assert "MISSING_TONE_GROUPS" in report.failures


def test_boolean_and_negative_counts_do_not_silently_pass_evaluator() -> None:
    gate = women_gates()[0]
    source = synthetic_metric(gate)
    for override in (
        replace(source, edited_pixel_count=True),
        replace(source, outside_mask_changed=-1),
        replace(source, provider_calls=-2),
        replace(source, original_preserved=1),
        replace(source, human_accepted="yes"),
    ):
        with pytest.raises(ValueError):
            score_pixel_evidence(gate, override)
    with pytest.raises(ValueError):
        score_pixel_evidence(gate, replace(source, feature_id="W14"))
    with pytest.raises(ValueError):
        SliceLabel(0, "female", "20-29").validate()
    with pytest.raises(ValueError):
        SliceLabel(11, "female", "20-29").validate()
    with pytest.raises(ValueError):
        SliceLabel(5, "female", "unknown").validate()  # type: ignore[arg-type]
