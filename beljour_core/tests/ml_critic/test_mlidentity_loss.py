"""Identity loss maths, gradient checks, and the refusal to run without admission.

The admitted path uses a tiny in-test embedder with made-up weights bytes and a
made-up record, only to prove that the guard opens when every check passes.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
from pathlib import Path

import numpy as np
import pytest
from numpy.typing import NDArray

from lab.ml.critic import FaceBox
from lab.ml.identity import (
    VARIANTS,
    AdmissionRecord,
    AdmittedEmbedder,
    EmbeddingError,
    GeometryProxyEmbedder,
    IdentityGateRefused,
    IdentityLoss,
    ProvenanceLink,
    admit_embedder,
    batch_identity_loss,
    cosine_distance,
    cosine_distance_grad,
    finite_difference_check,
    identity_loss,
    proxy_record,
    refusal_reasons,
    unit,
)
from lab.ml.identity.admission import AdmissionDecision

WEIGHTS = b"tiny made-up weights for the test embedder"
NO_EXCLUSIONS: frozenset[str] = frozenset()


class MeanColourEmbedder:
    """Test-only embedder: normalised mean colour and spread of the face box."""

    @property
    def name(self) -> str:
        return "mean-colour-test"

    @property
    def version(self) -> str:
        return "0.1"

    def embed(self, image: NDArray[np.float64], box: FaceBox) -> NDArray[np.float64]:
        crop = image[box.y:box.y + box.h, box.x:box.x + box.w].reshape(-1, 3)
        vector = np.concatenate([crop.mean(axis=0), crop.std(axis=0), [0.1]])
        return np.asarray(vector / np.linalg.norm(vector), dtype=np.float64)


def sample_record() -> AdmissionRecord:
    return AdmissionRecord(
        "mean-colour-test", "0.1", "MIT", True, hashlib.sha256(WEIGHTS).hexdigest(),
        (ProvenanceLink("drawn-squares", "generator", "MIT", True),),
    )


def admitted() -> AdmittedEmbedder:
    return admit_embedder(MeanColourEmbedder(), sample_record(), weights=WEIGHTS,
                          excluded=NO_EXCLUSIONS)


def random_pair(seed: int, size: int = 8) -> tuple[NDArray[np.float64], NDArray[np.float64]]:
    rng = np.random.default_rng(seed)
    return rng.normal(0.0, 1.0, size), rng.normal(0.0, 1.0, size)


def test_cosine_distance_values() -> None:
    a = np.array([1.0, 0.0])
    assert cosine_distance(a, a) == pytest.approx(0.0)
    assert cosine_distance(a, np.array([0.0, 2.0])) == pytest.approx(1.0)
    assert cosine_distance(a, -a) == pytest.approx(2.0)
    with pytest.raises(ValueError, match="zero vector"):
        cosine_distance(a, np.zeros(2))


@pytest.mark.parametrize("seed", range(5))
def test_cosine_gradients_match_finite_differences(seed: int) -> None:
    source, edit = random_pair(seed)
    d_source, d_edit = cosine_distance_grad(source, edit)
    assert finite_difference_check(lambda v: cosine_distance(source, v), edit, d_edit) < 1e-6
    assert finite_difference_check(lambda v: cosine_distance(v, edit), source, d_source) < 1e-6


@pytest.mark.parametrize("variant", VARIANTS)
def test_every_variant_gradient_matches_finite_differences(variant: str) -> None:
    source, edit = random_pair(10)
    margin = 0.5 * cosine_distance(source, edit)
    value = identity_loss(source, edit, variant, margin, temperature=0.05)

    def loss_at(point: NDArray[np.float64]) -> float:
        return identity_loss(source, point, variant, margin, temperature=0.05).loss

    assert finite_difference_check(loss_at, edit, value.grad_edit) < 1e-5


def test_hinge_is_zero_inside_the_margin() -> None:
    source = np.array([1.0, 0.0, 0.0])
    edit = np.array([1.0, 0.05, 0.0])
    for variant in ("hinge", "squared_hinge"):
        value = identity_loss(source, edit, variant, margin=0.1)
        assert value.loss == 0.0
        assert float(np.abs(value.grad_edit).max()) == 0.0
    smooth = identity_loss(source, edit, "smooth_hinge", margin=0.1, temperature=0.01)
    assert 0.0 < smooth.loss < 1e-3


def test_variants_order_outside_the_margin() -> None:
    source, edit = np.array([1.0, 0.0]), np.array([0.0, 1.0])
    cosine = identity_loss(source, edit, "cosine", margin=0.2).loss
    hinge = identity_loss(source, edit, "hinge", margin=0.2).loss
    squared = identity_loss(source, edit, "squared_hinge", margin=0.2).loss
    assert cosine == pytest.approx(1.0)
    assert hinge == pytest.approx(0.8)
    assert squared == pytest.approx(0.64)


def test_gradient_step_reduces_distance() -> None:
    source, edit = random_pair(20)
    value = identity_loss(source, edit, "cosine")
    stepped = edit - 0.1 * value.grad_edit / float(np.linalg.norm(value.grad_edit))
    assert cosine_distance(source, stepped) < value.distance


def test_gradient_is_orthogonal_to_edit() -> None:
    source, edit = random_pair(21)
    value = identity_loss(source, edit, "cosine")
    assert abs(float(np.dot(value.grad_edit, edit))) < 1e-10


def test_batch_loss_is_the_mean_with_scaled_gradients() -> None:
    rng = np.random.default_rng(3)
    sources = rng.normal(0.0, 1.0, (4, 6))
    edits = rng.normal(0.0, 1.0, (4, 6))
    mean, grads = batch_identity_loss(sources, edits, "cosine")
    singles = [identity_loss(s, e, "cosine") for s, e in zip(sources, edits, strict=True)]
    assert mean == pytest.approx(np.mean([v.loss for v in singles]))
    assert np.allclose(grads[2], singles[2].grad_edit / 4)
    with pytest.raises(ValueError):
        batch_identity_loss(sources, edits[:2])


def test_bad_loss_arguments() -> None:
    source, edit = random_pair(4)
    with pytest.raises(ValueError, match="variant"):
        identity_loss(source, edit, "triplet")
    with pytest.raises(ValueError, match="margin"):
        identity_loss(source, edit, "hinge", margin=-1.0)
    with pytest.raises(ValueError, match="equal length"):
        identity_loss(source, edit[:3])


def test_identity_loss_refuses_unadmitted_embedder() -> None:
    with pytest.raises(IdentityGateRefused, match="has not been admitted"):
        IdentityLoss(MeanColourEmbedder())


def test_identity_loss_refuses_proxy_and_nothing() -> None:
    with pytest.raises(IdentityGateRefused, match="PROXY"):
        IdentityLoss(GeometryProxyEmbedder())
    with pytest.raises(IdentityGateRefused, match="no embedder"):
        IdentityLoss(None)
    assert refusal_reasons(admitted()) == []


def test_proxy_cannot_be_admitted_even_with_a_forged_record() -> None:
    forged = AdmissionRecord(
        "PROXY-geometry-ratio", "1", "MIT", True, hashlib.sha256(b"").hexdigest(),
        (ProvenanceLink("drawn", "generator", "MIT", True),),
    )
    with pytest.raises(IdentityGateRefused, match="declares itself a PROXY"):
        admit_embedder(GeometryProxyEmbedder(), forged, weights=b"", excluded=NO_EXCLUSIONS)
    with pytest.raises(IdentityGateRefused, match="never admitted"):
        admit_embedder(GeometryProxyEmbedder(), proxy_record(), weights=b"")


def test_admission_checks_name_version_and_weights(tmp_path: Path) -> None:
    record = sample_record()
    with pytest.raises(IdentityGateRefused, match="do not match the recorded SHA-256"):
        admit_embedder(MeanColourEmbedder(), record, weights=b"other", excluded=NO_EXCLUSIONS)
    with pytest.raises(IdentityGateRefused, match="no weights were given"):
        admit_embedder(MeanColourEmbedder(), record, excluded=NO_EXCLUSIONS)
    with pytest.raises(IdentityGateRefused, match="does not exist"):
        admit_embedder(MeanColourEmbedder(), record, weights_path=tmp_path / "none.bin",
                       excluded=NO_EXCLUSIONS)
    renamed = AdmissionRecord("other-name", "0.2", record.licence_id, True,
                              record.weights_sha256, record.provenance)
    with pytest.raises(IdentityGateRefused) as caught:
        admit_embedder(MeanColourEmbedder(), renamed, weights=WEIGHTS, excluded=NO_EXCLUSIONS)
    assert len(caught.value.reasons) == 2
    path = tmp_path / "weights.bin"
    path.write_bytes(WEIGHTS)
    assert admit_embedder(MeanColourEmbedder(), record, weights_path=path,
                          excluded=NO_EXCLUSIONS).name == "mean-colour-test"


def test_admitted_embedder_cannot_be_forged() -> None:
    decision = AdmissionDecision(sample_record())
    with pytest.raises(IdentityGateRefused, match="only be built by admit_embedder"):
        AdmittedEmbedder(MeanColourEmbedder(), decision, object())


def test_admitted_loss_runs_on_images() -> None:
    rng = np.random.default_rng(5)
    image = rng.uniform(0.2, 0.8, (32, 32, 3))
    edited = np.clip(image * np.array([1.2, 1.0, 0.8]), 0.0, 1.0)
    box = FaceBox(4, 4, 24, 24)
    loss = IdentityLoss(admitted(), variant="cosine")
    same = loss.measure(image, box, image, box)
    changed = loss.measure(image, box, edited, box)
    assert same.value.distance == pytest.approx(0.0, abs=1e-12)
    assert changed.value.distance > same.value.distance
    assert changed.embedder == "mean-colour-test"
    assert float(np.linalg.norm(changed.edit_embedding)) == pytest.approx(1.0)


def test_unit_rejects_bad_embeddings() -> None:
    for bad, message in (
        (np.zeros(4), "zero vector"),
        (np.array([1.0, np.nan]), "NaN"),
        (np.ones((2, 2)) / 2.0, "1-D"),
        (np.array([3.0, 4.0]), "norm is 5"),
    ):
        with pytest.raises(EmbeddingError, match=message):
            unit(bad)
    assert np.allclose(unit(np.array([0.6, 0.8])), [0.6, 0.8])


def test_admitted_embedder_checks_inner_output() -> None:
    class Broken(MeanColourEmbedder):
        def embed(self, image: NDArray[np.float64], box: FaceBox) -> NDArray[np.float64]:
            return np.zeros(4)

    wrapped = admit_embedder(Broken(), sample_record(), weights=WEIGHTS, excluded=NO_EXCLUSIONS)
    with pytest.raises(EmbeddingError, match="zero vector"):
        wrapped.embed(np.zeros((20, 20, 3)), FaceBox(0, 0, 10, 10))
