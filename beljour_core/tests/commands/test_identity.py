"""Lane H identity guard tests: synthetic only, no provider, photo or model weight.

Author: John Khan.
"""

from __future__ import annotations

import math

import pytest

from plumb_api.commands import CommandUnavailable
from plumb_api.commands import CommandValidationError
from plumb_api.commands import DeterministicTestEmbedder
from plumb_api.commands import EmbedderEvidence
from plumb_api.commands import IdentityBlocked
from plumb_api.commands import IdentityGuard
from plumb_api.commands import IdentityLockArgs
from plumb_api.commands import IdentityThresholds
from plumb_api.commands import ImageFrame
from plumb_api.commands import LockMode
from plumb_api.commands import LockStrength
from plumb_api.commands import cosine_similarity
from plumb_api.commands import identity_meter
from plumb_api.commands.embedders import forbidden_training_data
from plumb_api.commands.embedders import normalized_embedding
from plumb_api.commands.frames import blend_toward_original
from plumb_api.commands.frames import resize_reference


def photo(value: int, *, width: int = 4, height: int = 4, channels: int = 3) -> ImageFrame:
    if channels == 3:
        rgb = bytes([value, value, value]) * (width * height)
        return ImageFrame(width, height, 3, rgb)
    rgba = bytes([value, value, value, 177]) * (width * height)
    return ImageFrame(width, height, 4, rgba)


class RedAngleEmbedder:
    """Angle of one synthetic channel; a predictable edit-sensitivity double."""

    @property
    def evidence(self) -> EmbedderEvidence:
        return DeterministicTestEmbedder().evidence

    def embed(self, frame: ImageFrame) -> tuple[float, ...]:
        angle = frame.pixels[0] * math.pi / (2.0 * 255.0)
        return math.cos(angle), math.sin(angle)


class BrokenEmbedder:
    @property
    def evidence(self) -> EmbedderEvidence:
        return DeterministicTestEmbedder().evidence

    def embed(self, frame: ImageFrame) -> tuple[float, ...]:
        raise RuntimeError("secret image information must not leak")


class NanEmbedder:
    @property
    def evidence(self) -> EmbedderEvidence:
        return DeterministicTestEmbedder().evidence

    def embed(self, frame: ImageFrame) -> tuple[float, ...]:
        return 1.0, float("nan")


def test_synthetic_embedder_is_deterministic_and_not_recognition() -> None:
    embedder = DeterministicTestEmbedder()
    first = embedder.embed(photo(10))
    assert len(first) == 50
    assert first == embedder.embed(photo(10))
    assert first != embedder.embed(photo(200))
    assert math.isclose(sum(value * value for value in first), 1.0)
    assert embedder.evidence.synthetic_only
    assert embedder.evidence.weights_sha256 is None
    assert embedder.evidence.training_sources == ()
    assert not embedder.evidence.real_face_validation_passed


def test_synthetic_embedder_never_runs_without_explicit_opt_in() -> None:
    with pytest.raises(CommandUnavailable) as error:
        IdentityGuard(DeterministicTestEmbedder())
    assert error.value.code == "test_model_forbidden"
    guard = IdentityGuard(DeterministicTestEmbedder(), allow_test_embedder=True)
    assert guard.enforce(photo(33), photo(33), IdentityLockArgs()).decision.synthetic_evidence


@pytest.mark.parametrize("strength", list(LockStrength))
@pytest.mark.parametrize("mode", list(LockMode))
def test_unmodified_image_passes_every_policy(strength: LockStrength, mode: LockMode) -> None:
    guard = IdentityGuard(RedAngleEmbedder(), allow_test_embedder=True)
    original = photo(70)
    outcome = guard.enforce(original, original, IdentityLockArgs(mode, strength))
    assert outcome.frame is original
    assert outcome.decision.identity_match == 100
    assert outcome.decision.requested_meter == 100
    assert outcome.decision.applied_fraction == 1.0
    assert outcome.decision.status == "kept"
    assert outcome.decision.warning is None


@pytest.mark.parametrize("strength", list(LockStrength))
def test_block_fails_closed_below_threshold(strength: LockStrength) -> None:
    guard = IdentityGuard(RedAngleEmbedder(), allow_test_embedder=True)
    original = photo(0)
    after = photo(255)
    with pytest.raises(IdentityBlocked) as failure:
        guard.enforce(original, after, IdentityLockArgs(LockMode.BLOCK, strength), command_index=2)
    assert failure.value.code == "identity_below_threshold"
    assert failure.value.meter == 0
    assert failure.value.threshold > 0.0
    assert failure.value.detail.command_index == 2
    assert "255" not in str(failure.value)
    assert original.pixels == bytes([0]) * 48
    assert after.pixels == bytes([255]) * 48


@pytest.mark.parametrize("strength", list(LockStrength))
def test_warn_reports_unacceptable_edit_but_does_not_change_it(strength: LockStrength) -> None:
    guard = IdentityGuard(RedAngleEmbedder(), allow_test_embedder=True)
    original = photo(0)
    edit = photo(255)
    result = guard.enforce(original, edit, IdentityLockArgs(LockMode.WARN, strength))
    assert result.frame is edit
    assert result.decision.status == "warned"
    assert result.decision.warning is not None
    assert result.decision.identity_match == 0
    assert result.decision.applied_fraction == 1.0
    assert result.decision.requested_cosine < result.decision.threshold


@pytest.mark.parametrize("strength", list(LockStrength))
def test_soften_converges_and_output_is_remeasured(strength: LockStrength) -> None:
    guard = IdentityGuard(RedAngleEmbedder(), allow_test_embedder=True)
    original = photo(0)
    edit = photo(255)
    result = guard.enforce(original, edit, IdentityLockArgs(LockMode.SOFTEN, strength))
    assert result.decision.status == "softened"
    assert 0.0 < result.decision.applied_fraction < 1.0
    assert result.decision.final_cosine >= result.decision.threshold
    assert result.decision.identity_match >= result.decision.requested_meter
    assert result.frame.pixels[0] < edit.pixels[0]
    assert result.frame.pixels[0] > original.pixels[0]
    measured = cosine_similarity(RedAngleEmbedder().embed(original), RedAngleEmbedder().embed(result.frame))
    assert measured == pytest.approx(result.decision.final_cosine)
    assert result.decision.identity_match == identity_meter(measured)
    assert original.pixels == bytes(48)
    assert edit.pixels == bytes([255]) * 48


def test_strict_always_protects_at_least_as_much_as_normal() -> None:
    guard = IdentityGuard(RedAngleEmbedder(), allow_test_embedder=True)
    original = photo(0)
    edited = photo(255)
    normal = guard.enforce(original, edited, IdentityLockArgs(LockMode.SOFTEN, LockStrength.NORMAL))
    strict = guard.enforce(original, edited, IdentityLockArgs(LockMode.SOFTEN, LockStrength.STRICT))
    assert strict.decision.threshold > normal.decision.threshold
    assert strict.decision.applied_fraction < normal.decision.applied_fraction
    assert strict.frame.pixels[0] <= normal.frame.pixels[0]
    assert strict.decision.final_cosine >= strict.decision.threshold


def test_soften_is_deterministic_on_same_inputs() -> None:
    guard = IdentityGuard(RedAngleEmbedder(), allow_test_embedder=True)
    first = guard.enforce(photo(0), photo(220), IdentityLockArgs())
    second = guard.enforce(photo(0), photo(220), IdentityLockArgs())
    assert first == second
    assert first.frame.pixels == second.frame.pixels


def test_soften_returns_reference_when_no_intermediate_values_pass() -> None:
    class BinaryMatchEmbedder:
        @property
        def evidence(self) -> EmbedderEvidence:
            return DeterministicTestEmbedder().evidence

        def embed(self, frame: ImageFrame) -> tuple[float, ...]:
            return (1.0, 0.0) if frame.pixels[0] == 0 else (0.0, 1.0)

    guard = IdentityGuard(BinaryMatchEmbedder(), allow_test_embedder=True)
    result = guard.enforce(photo(0), photo(255), IdentityLockArgs())
    assert result.decision.status == "restored"
    assert result.decision.applied_fraction == 0.0
    assert result.frame.identical(photo(0))
    assert result.decision.identity_match == 100


def test_identity_lock_supports_differently_sized_upscaled_image() -> None:
    guard = IdentityGuard(RedAngleEmbedder(), allow_test_embedder=True)
    original = photo(0, width=2, height=2)
    upscaled = photo(255, width=4, height=4)
    result = guard.enforce(original, upscaled, IdentityLockArgs())
    assert (result.frame.width, result.frame.height) == (4, 4)
    assert result.decision.final_cosine >= result.decision.threshold
    assert result.decision.applied_fraction < 1.0
    assert original.width == 2


def test_bad_reference_aligner_fails_closed() -> None:
    def wrong(original: ImageFrame, width: int, height: int) -> ImageFrame:
        return original

    guard = IdentityGuard(RedAngleEmbedder(), allow_test_embedder=True, align_original=wrong)
    with pytest.raises(CommandValidationError) as error:
        guard.enforce(photo(0, width=2, height=2), photo(255), IdentityLockArgs())
    assert error.value.code == "invalid_aligner"


def test_reference_resize_is_pixel_centered_at_edges() -> None:
    image = ImageFrame(2, 2, 3, bytes([0, 0, 0, 80, 80, 80, 180, 180, 180, 255, 255, 255]))
    resized = resize_reference(image, 4, 4)
    assert resized.pixels[0:3] == bytes([0, 0, 0])
    assert resized.pixels[-3:] == bytes([255, 255, 255])
    assert resized.pixels[3] > resized.pixels[0]
    assert resized.pixels[12] > resized.pixels[0]


def test_rgba_alpha_preserved_and_changed_alpha_rejected() -> None:
    original = photo(0, channels=4)
    edit = photo(255, channels=4)
    result = IdentityGuard(RedAngleEmbedder(), allow_test_embedder=True).enforce(
        original, edit, IdentityLockArgs(),
    )
    assert result.frame.pixels[3::4] == original.pixels[3::4]
    forged = ImageFrame(4, 4, 4, bytes([255, 255, 255, 0]) * 16)
    with pytest.raises(CommandValidationError) as error:
        blend_toward_original(original, forged, 0.5)
    assert error.value.code == "alpha_changed"


def test_linear_light_blend_differs_from_encoded_average() -> None:
    before = ImageFrame(1, 1, 3, bytes([0, 0, 0]))
    after = ImageFrame(1, 1, 3, bytes([255, 255, 255]))
    assert blend_toward_original(before, after, 0.5).pixels == bytes([188, 188, 188])
    assert blend_toward_original(before, after, 0.0) is before
    assert blend_toward_original(before, after, 1.0) is after


@pytest.mark.parametrize("value", [float("nan"), -1.0, 1.01, float("inf")])
def test_bad_blend_fractions_fail(value: float) -> None:
    with pytest.raises(CommandValidationError):
        blend_toward_original(photo(0), photo(255), value)


def test_embedder_failure_message_cannot_expose_private_content() -> None:
    guard = IdentityGuard(BrokenEmbedder(), allow_test_embedder=True)
    with pytest.raises(CommandUnavailable) as failure:
        guard.enforce(photo(0), photo(255), IdentityLockArgs())
    assert failure.value.code == "identity_embedder_failed"
    assert "secret" not in str(failure.value)
    assert "image information" not in repr(failure.value)


def test_malformed_vectors_are_never_reported_as_matches() -> None:
    guard = IdentityGuard(NanEmbedder(), allow_test_embedder=True)
    with pytest.raises(CommandValidationError, match="invalid value"):
        guard.enforce(photo(0), photo(255), IdentityLockArgs())
    with pytest.raises(CommandValidationError):
        cosine_similarity((1.0, 0.0), (1.0, 0.0, 0.0))
    with pytest.raises(CommandValidationError):
        normalized_embedding((0.0, 0.0))
    with pytest.raises(CommandValidationError):
        normalized_embedding((1.0,))


@pytest.mark.parametrize("value", [-1.0, -0.5, 0.0, 0.4, 0.79, 0.991, 1.0])
def test_meter_is_clamped_and_display_only(value: float) -> None:
    score = identity_meter(value)
    assert 0 <= score <= 100
    assert isinstance(score, int)


def test_meter_monotone_across_full_cosine_range() -> None:
    meters = [identity_meter(-1.0 + 2.0 * index / 1000) for index in range(1001)]
    assert meters == sorted(meters)
    assert meters[0] == 0
    assert meters[500] == 0
    assert meters[1000] == 100
    assert all(meters[i] <= meters[i + 1] for i in range(1000))


def test_public_metadata_excludes_biometric_values() -> None:
    outcome = IdentityGuard(RedAngleEmbedder(), allow_test_embedder=True).enforce(
        photo(0), photo(255), IdentityLockArgs(),
    )
    keys = set(outcome.decision.public_metadata())
    assert "image" not in keys
    assert "pixels" not in keys
    assert "embedding" not in keys
    assert "face_id" not in keys
    assert "model_id" not in keys
    assert "requested_cosine" not in keys


def test_threshold_invariants() -> None:
    for normal, strict in [(0.95, 0.9), (0, 0.8), (0.7, 1), (float("nan"), 0.9)]:
        with pytest.raises(CommandValidationError):
            IdentityThresholds(normal, strict)
    assert IdentityThresholds().for_strength(LockStrength.STRICT) > IdentityThresholds().normal


def test_search_budget_checked() -> None:
    with pytest.raises(CommandValidationError):
        IdentityGuard(RedAngleEmbedder(), allow_test_embedder=True, coarse_samples=1)
    with pytest.raises(CommandValidationError):
        IdentityGuard(RedAngleEmbedder(), allow_test_embedder=True, refine_iterations=100)


def test_input_frame_validation_does_not_echo_bytes() -> None:
    frame = photo(10)
    assert "pixels" not in repr(frame)
    with pytest.raises(CommandValidationError) as failure:
        ImageFrame(4, 4, 3, bytes([2]))
    assert "02" not in str(failure.value)
    with pytest.raises(CommandValidationError):
        ImageFrame(0, 3, 3, b"")
    with pytest.raises(CommandValidationError):
        ImageFrame(24_000_001, 1, 3, b"")


def test_banned_dataset_variants_all_fail() -> None:
    aliases = [
        "CelebA", "CelebA-HQ", "UTKFace", "VGGFace2", "DigiFace-1M",
        "FaceSynthetics", "MS-Celeb-1M", "ms_celeb_1m", "vgg-face-2",
    ]
    assert forbidden_training_data(tuple(aliases)) == tuple(aliases)
    assert forbidden_training_data(("licensed-internal-reviewed-set",)) == ()
