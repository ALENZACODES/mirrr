"""Pro acceptance bundles remain unproven without independent face evidence.
Author: John Khan.
"""

from __future__ import annotations

import pytest

from plumb_api.commands.acceptance_bundle import build_pro_acceptance_bundle
from plumb_api.commands.embedders import DeterministicTestEmbedder
from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.guarded import GuardedProExecutor
from plumb_api.commands.identity import IdentityGuard
from plumb_api.commands.pro_plan import ProStep, parse_pro_commands
from plumb_api.commands.protected_quality import MaskEvidence
from plumb_api.commands.types import CommandName


def original() -> ImageFrame:
    return ImageFrame(10, 10, 3, bytes([75, 85, 95]) * 100)


def effect(frame: ImageFrame, step: ProStep, quality: str) -> ImageFrame:
    if quality == "preview":
        return frame
    return ImageFrame(frame.width, frame.height, 3, bytes(
        min(255, color + 1) for color in frame.pixels
    ))


def run_pair() -> tuple[object, object, object]:
    plan = parse_pro_commands("/cleanup 2.5 /identitylock")
    executor = GuardedProExecutor(
        handlers={CommandName.CLEANUP: effect},
        identity=IdentityGuard(DeterministicTestEmbedder(), allow_test_embedder=True),
    )
    preview = executor.run(plan, original(), quality="preview")
    export = executor.run(plan, original(), quality="export")
    return plan, preview, export


def test_bundle_keeps_synthetic_evidence_unproven() -> None:
    plan, preview, exported = run_pair()
    bundle = build_pro_acceptance_bundle(plan, original(), preview, exported)
    assert bundle.status in ("unproven", "review")
    assert bundle.release_qualified is False
    assert "checked_region_coverage" in bundle.outstanding_evidence
    assert "approved_identity_model_and_realface_test" in bundle.outstanding_evidence
    assert bundle.public_metadata()["release_qualified"] is False


def test_checked_face_and_skin_masks_still_need_external_review() -> None:
    plan, preview, exported = run_pair()
    mask = bytes([255]) * 100
    checked = (MaskEvidence("face", 10, 10, mask, True),
               MaskEvidence("skin", 10, 10, mask, True))
    bundle = build_pro_acceptance_bundle(
        plan, original(), preview, exported, checked_masks=checked,
    )
    assert bundle.preservation is not None
    assert bundle.preservation.complete
    assert "checked_region_coverage" not in bundle.outstanding_evidence
    assert "external_realface_gate_and_human_review" in bundle.outstanding_evidence
    assert not bundle.release_qualified


def test_unchecked_mask_does_not_count_as_valid_coverage() -> None:
    plan, preview, exported = run_pair()
    unchecked = (MaskEvidence("face", 10, 10, bytes([255]) * 100, False),)
    bundle = build_pro_acceptance_bundle(
        plan, original(), preview, exported, checked_masks=unchecked,
    )
    assert "checked_region_coverage" in bundle.outstanding_evidence


def test_bundle_public_metadata_omits_input_frame_and_sensitive_paths() -> None:
    plan, preview, exported = run_pair()
    bundle = build_pro_acceptance_bundle(plan, original(), preview, exported)
    metadata = bundle.public_metadata()
    assert "image" not in metadata
    assert "source_file" not in metadata
    assert "face_embedding" not in metadata
    assert metadata["release_qualified"] is False


def test_bundle_rejects_incompatible_plan() -> None:
    _, preview, exported = run_pair()
    with pytest.raises(CommandValidationError):
        build_pro_acceptance_bundle(parse_pro_commands("/cleanup 4.8"),
                                    original(), preview, exported)


def test_bundle_rejects_unknown_required_mask_class() -> None:
    plan, preview, exported = run_pair()
    with pytest.raises(CommandValidationError):
        build_pro_acceptance_bundle(plan, original(), preview, exported,
                                    required_regions=("unknown",))
