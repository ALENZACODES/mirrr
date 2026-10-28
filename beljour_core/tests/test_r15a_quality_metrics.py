"""Synthetic-only metric direction, licence and aggregation regression tests.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.quality.artifact_bench import human_review_indices, probe_artifacts, seam_discontinuity
from plumb_api.quality.bench_summary import parse_metrics, summarize
from plumb_api.quality.distribution import (FeatureProvenance, frechet_activations, measure_distribution,
                                             polynomial_kid)
from plumb_api.quality.identity_bench import (IdentityProvenance, compare_identity, cosine_similarity)


def _inception_evidence() -> FeatureProvenance:
    # Synthetic TEST-ONLY descriptor: no model or third-party weights installed.
    return FeatureProvenance("inception-v3-pool3", "Own work", "Own work", "a" * 64,
                             ("independently drawn synthetic patterns",), True, "test fixture only")


def _identity_evidence() -> IdentityProvenance:
    return IdentityProvenance("a" * 64, "Own work", ("synthetic patterns",), True, "test fixture only")


def test_identical_gaussian_feature_cloud_has_zero_frechet_distance() -> None:
    rng = np.random.default_rng(20)
    features = rng.normal(size=(24, 12))
    assert frechet_activations(features, features) < 1e-7
    shifted = features.copy()
    shifted[:, 3] += 2.0
    assert abs(frechet_activations(features, shifted) - 4.0) < 1e-7


def test_fid_kid_shift_direction_on_synthetic_activations() -> None:
    rng = np.random.default_rng(21)
    cloud = rng.normal(size=(128, 6))
    same = measure_distribution(cloud, cloud, _inception_evidence())
    shifted = measure_distribution(cloud, cloud + 4, _inception_evidence())
    assert same.fid_status == "MEASURED" and same.kid_status == "MEASURED"
    assert shifted.fid is not None and shifted.fid > 20
    assert shifted.kid is not None and same.kid is not None and shifted.kid > same.kid
    assert isinstance(polynomial_kid(cloud, cloud), float)


def test_unverified_weights_cannot_yield_fake_fid_or_kid() -> None:
    feat = np.eye(4)
    pending = measure_distribution(feat, feat + 1, None)
    assert pending.fid is None and pending.kid is None and pending.fid_status == "UNPROVEN"
    forged = FeatureProvenance("rgb-statistics", "MIT", "MIT", "a" * 64,
                               ("synthetic",), True, "claimed")
    assert measure_distribution(feat, feat + 1, forged).fid is None


@pytest.mark.parametrize("source", ["VGGFace2", "CelebA-HQ", "UTKFace", "DigiFace-1M", "FaceSynthetics", "MS-Celeb-1M"])
def test_banned_face_data_rejected_for_both_metric_models(source: str) -> None:
    family = FeatureProvenance("inception-v3-pool3", "MIT", "MIT", "a" * 64,
                               (source,), True, "no")
    identity = IdentityProvenance("a" * 64, "MIT", (source,), True, "no")
    assert family.problems()
    assert identity.problems()
    assert "banned" in " ".join(family.problems())
    assert "banned" in " ".join(identity.problems())


def test_swapped_identity_has_lower_cosine_and_trips_effect_threshold() -> None:
    source = np.array([1.0, 0.0, 0.2])
    same = np.array([0.95, 0.0, 0.19])
    other = np.array([0.0, 1.0, 0.1])
    assert cosine_similarity(source, same) > cosine_similarity(source, other)
    held = compare_identity(source, same, provenance=_identity_evidence(), threshold=0.85, effect="age")
    swapped = compare_identity(source, other, provenance=_identity_evidence(), threshold=0.85, effect="age")
    assert held.passed is True and swapped.passed is False
    assert held.status == "MEASURED"


def test_unlicensed_face_embedding_and_missing_threshold_always_unproven() -> None:
    arr = np.array([1.0, 0.0])
    assert compare_identity(arr, arr, provenance=None, threshold=0.9, effect="smile").passed is None
    assert compare_identity(arr, arr, provenance=_identity_evidence(), threshold=None, effect="smile").passed is None
    with pytest.raises(ValueError):
        cosine_similarity(arr, np.zeros(2))


def _fixture_image() -> np.ndarray:
    rng = np.random.default_rng(99)
    pixels = rng.integers(45, 160, size=(96, 128, 1), dtype=np.uint8)
    return np.repeat(pixels, 3, axis=2)


def test_checkerboard_edit_raises_training_free_artifact_score() -> None:
    img = _fixture_image()
    identical = probe_artifacts(img, img)
    y, x = np.indices(img.shape[:2])
    pattern = np.where((x + y) % 2, 65, -65)
    after = np.clip(img.astype(np.int16) + pattern[:, :, None], 0, 255).astype(np.uint8)
    corrupt = probe_artifacts(img, after)
    assert identical.checkerboard == pytest.approx(0)
    assert corrupt.checkerboard > identical.checkerboard + 0.08


def test_mask_edge_seam_detector_responds_to_abrupt_boundary() -> None:
    img = np.full((64, 64, 3), 100, dtype=np.uint8)
    mask = np.zeros((64, 64), dtype=np.float64)
    mask[10:54, 10:54] = 1
    same = seam_discontinuity(img, img.copy(), mask)
    after = img.copy()
    after[10:54, 10:54] = 240
    cut = seam_discontinuity(img, after, mask)
    assert same == pytest.approx(0.0)
    assert cut is not None and cut > 0.3


def test_artifact_probe_rejects_invalid_shapes_and_mask_values() -> None:
    img = np.zeros((30, 30, 3), dtype=np.uint8)
    with pytest.raises(ValueError):
        probe_artifacts(img, img, np.ones((29, 30)))
    with pytest.raises(ValueError):
        probe_artifacts(img, img, np.full((30, 30), -0.2))
    with pytest.raises(ValueError):
        probe_artifacts(img[:, :, 0], img)


def test_review_sampler_stratifies_and_never_returns_photos() -> None:
    rows = [{"group": "light", "artifact_score": x} for x in (0.2, 0.1, 0.9)]
    rows += [{"group": "deep", "artifact_score": x} for x in (0.3, 0.8)]
    assert human_review_indices(rows, each_group=2) == [4, 3, 2, 0]


def test_quality_summary_never_promotes_unproven_metric_to_pass() -> None:
    values = [{"module": "age", "check": "stop_-3", "face_id": "A", "group": "A", "gender": "female",
               "artifact_score": 0.3},
              {"module": "age", "check": "stop_+5", "face_id": "A", "group": "A", "gender": "female",
               "artifact_score": 0.1},
              {"module": "age", "check": "stop_-3", "face_id": "B", "group": "B", "gender": "male"}]
    req = parse_metrics("fid,kid,identity,artifacts")
    summary = summarize(values, req)
    assert summary["status"] == "UNPROVEN"
    female = next(row for row in summary["by_module_group"] if row["group"] == "gender:female")
    assert female["faces_with_artifact_probe"] == 1
    assert female["artifact_score_mean"] == pytest.approx(0.2)
    assert female["identity"] is None and female["identity_status"] == "UNPROVEN"
    with pytest.raises(ValueError):
        parse_metrics("fid,fid")
