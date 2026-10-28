"""Face model provenance is a blocking dependency, not a box to tick. Author: John Khan."""

from __future__ import annotations

import pytest

from plumb_api.commands import CommandUnavailable
from plumb_api.commands import DeterministicTestEmbedder
from plumb_api.commands import EmbedderEvidence
from plumb_api.commands import IdentityGuard
from plumb_api.commands import IdentityLockArgs
from plumb_api.commands import ImageFrame


PIN = "a" * 64  # Syntax-only test pin. It is NOT a verified real model artifact.


def approved_record() -> EmbedderEvidence:
    """Fixture exercising contract validation, never authorizing any real model."""
    return EmbedderEvidence(
        model_id="synthetic-provenance-schema-fixture",
        implementation_licence="Apache-2.0",
        weights_licence="MIT",
        training_sources=("original-small-consented-commercial-fixture",),
        weights_sha256=PIN,
        commercial_use_verified=True,
        real_face_validation_passed=True,
    )


def test_complete_record_has_no_automatic_model_loader() -> None:
    record = approved_record()
    record.validate()
    assert not record.synthetic_only
    assert record.weights_sha256 == PIN
    # This is merely a record validator. No weights are loaded or distributed.


@pytest.mark.parametrize(
    ("change", "code"),
    [
        ({"model_id": ""}, "invalid_model_id"),
        ({"model_id": "x" * 101}, "invalid_model_id"),
        ({"implementation_licence": "GPL-3.0"}, "code_licence_pending"),
        ({"weights_licence": "CC-BY-NC"}, "weights_licence_pending"),
        ({"weights_licence": None}, "weights_licence_pending"),
        ({"weights_sha256": None}, "weights_pin_missing"),
        ({"weights_sha256": "a" * 63}, "weights_pin_missing"),
        ({"weights_sha256": "G" * 64}, "weights_pin_missing"),
        ({"training_sources": ()}, "training_data_pending"),
        ({"training_sources": ("",)}, "training_data_pending"),
        ({"commercial_use_verified": False}, "commercial_use_pending"),
        ({"real_face_validation_passed": False}, "identity_validation_pending"),
        ({"training_sources": ("vggface2",)}, "forbidden_training_data"),
    ],
)
def test_missing_licence_and_evidence_fail_closed(change: dict[str, object], code: str) -> None:
    original = approved_record()
    values = {
        "model_id": original.model_id,
        "implementation_licence": original.implementation_licence,
        "weights_licence": original.weights_licence,
        "training_sources": original.training_sources,
        "weights_sha256": original.weights_sha256,
        "commercial_use_verified": original.commercial_use_verified,
        "real_face_validation_passed": original.real_face_validation_passed,
    }
    values.update(change)
    modified = EmbedderEvidence(**values)
    with pytest.raises(CommandUnavailable) as failure:
        modified.validate()
    assert failure.value.code == code


@pytest.mark.parametrize(
    "name",
    ["CelebA", "CelebA-HQ", "UTKFace", "VGGFace2", "DigiFace-1M", "FaceSynthetics", "MS-Celeb-1M"],
)
def test_explicitly_banned_training_sources_never_clear(name: str) -> None:
    record = approved_record()
    forbidden = EmbedderEvidence(
        model_id=record.model_id,
        implementation_licence=record.implementation_licence,
        weights_licence=record.weights_licence,
        training_sources=(name,),
        weights_sha256=record.weights_sha256,
        commercial_use_verified=True,
        real_face_validation_passed=True,
    )
    with pytest.raises(CommandUnavailable) as failure:
        forbidden.validate()
    assert failure.value.code == "forbidden_training_data"


def test_licence_allowlist_is_not_all_osi_or_noncommercial() -> None:
    for licence in ["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause"]:
        record = approved_record()
        changed = EmbedderEvidence(
            record.model_id, licence, licence, record.training_sources,
            record.weights_sha256, True, True,
        )
        changed.validate()
    with pytest.raises(CommandUnavailable):
        record = approved_record()
        EmbedderEvidence(
            record.model_id, "LGPL-2.1", "MIT", record.training_sources,
            record.weights_sha256, True, True,
        ).validate()


def test_test_double_evidence_cannot_claim_fake_weight_hash() -> None:
    original = DeterministicTestEmbedder().evidence
    broken = EmbedderEvidence(
        original.model_id, original.implementation_licence, "MIT", (), PIN, False, False,
        synthetic_only=True,
    )
    with pytest.raises(CommandUnavailable) as failure:
        broken.validate(allow_test_embedder=True)
    assert failure.value.code == "test_model_invalid"


def test_guard_validates_evidence_before_any_inference() -> None:
    class Disallowed:
        @property
        def evidence(self) -> EmbedderEvidence:
            return EmbedderEvidence("test", "MIT", "MIT", ("CelebA-HQ",), PIN, True, True)

        def embed(self, frame: ImageFrame) -> tuple[float, ...]:
            raise AssertionError("Must never run")

    with pytest.raises(CommandUnavailable) as failure:
        IdentityGuard(Disallowed()).enforce(
            ImageFrame(1, 1, 3, bytes([0, 0, 0])),
            ImageFrame(1, 1, 3, bytes([255, 255, 255])),
            IdentityLockArgs(),
        )
    assert failure.value.code == "forbidden_training_data"


@pytest.mark.parametrize(
    ("change", "code"),
    [
        ({"model_id": 123}, "invalid_model_id"),
        ({"training_sources": None}, "invalid_training_sources"),
        ({"training_sources": (3,)}, "invalid_training_sources"),
        ({"commercial_use_verified": "yes"}, "invalid_approval"),
        ({"weights_sha256": 15}, "weights_pin_missing"),
    ],
)
def test_untrusted_metadata_types_fail_closed(change: dict[str, object], code: str) -> None:
    record = approved_record()
    values = {
        "model_id": record.model_id,
        "implementation_licence": record.implementation_licence,
        "weights_licence": record.weights_licence,
        "training_sources": record.training_sources,
        "weights_sha256": record.weights_sha256,
        "commercial_use_verified": record.commercial_use_verified,
        "real_face_validation_passed": record.real_face_validation_passed,
    }
    values.update(change)
    with pytest.raises(CommandUnavailable) as failure:
        EmbedderEvidence(**values).validate()
    assert failure.value.code == code
