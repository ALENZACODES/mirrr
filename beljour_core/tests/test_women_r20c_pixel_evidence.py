"""Real-failure pixel auditors tested on arithmetic frames, not faces.

The emitter is invoked only in tests; no generated parity JSON is shipped.
Author: John Khan.
"""
from __future__ import annotations

import base64
import json
import sys
from dataclasses import asdict

import numpy as np
import pytest

from plumb_api.engines.women_styling.engine import apply_preview
from plumb_api.engines.women_styling.pixel_evidence import audit_frame
from plumb_api.engines.women_styling.realface_protocol import (
    score_pixel_evidence,
    women_gates,
)
from plumb_api.engines.women_styling.requests import PreviewRequest
from plumb_api.engines.women_styling.specs import FEATURE_SPECS, FeatureSpec


def synthetic_frame(width: int, height: int, channels: int) -> np.ndarray:
    grid = np.arange(width * height, dtype=np.int32).reshape(height, width)
    result = np.empty((height, width, channels), dtype=np.uint8)
    result[:, :, 0] = (grid * 19 + 17) % 256
    result[:, :, 1] = (grid * 47 + 61) % 256
    result[:, :, 2] = (grid * 11 + 137) % 256
    if channels == 4:
        result[:, :, 3] = (grid * 7 + 100) % 256
    return result


def synthetic_masks(
    spec: FeatureSpec, width: int, height: int,
) -> dict[str, np.ndarray]:
    result: dict[str, np.ndarray] = {}
    for index, region in enumerate(spec.regions):
        mask = np.zeros((height, width), dtype=np.uint8)
        for y in range(height):
            for x in range(width):
                if (x * 3 + y * 7 + index * 11) % (index + 4) < 2:
                    mask[y, x] = (x * 11 + y * 13 + index * 19) % 220 + 35
        result[region] = mask
    return result


@pytest.mark.parametrize("spec", FEATURE_SPECS, ids=lambda spec: spec.id)
def test_actual_frame_auditor_works_for_each_registered_feature(
    spec: FeatureSpec,
) -> None:
    width = 19
    height = 12
    frame = synthetic_frame(width, height, 4)
    masks = synthetic_masks(spec, width, height)
    request = PreviewRequest(spec.id, spec.variants[0], strength=73)
    output = apply_preview(frame, masks, request)
    audit = audit_frame(spec.id, frame, output.pixels, masks, stripe_height=3)
    assert audit.feature_id == spec.id
    assert audit.frame_pixels == width * height
    assert audit.authorized_pixels == output.evidence.mask_support_pixels
    assert audit.altered_rgb_pixels == output.evidence.changed_pixels
    assert audit.altered_rgb_outside == output.evidence.outside_mask_changed == 0
    assert audit.altered_alpha_pixels == output.evidence.changed_alpha_pixels == 0
    assert audit.max_rgb_channel_delta == output.evidence.largest_channel_delta
    assert audit.pixels_over_limit == 0
    assert audit.original_preserved
    assert audit.checks(spec) == ()
    row = audit.to_protocol()
    gate = next(gate for gate in women_gates() if gate.id == spec.id)
    verdict = score_pixel_evidence(gate, row)
    assert verdict.technical_pass == (audit.altered_rgb_pixels > 0)
    assert verdict.evidence_kind == "SYNTHETIC"


@pytest.mark.parametrize("channels", [3, 4])
def test_multiple_stripe_heights_produce_the_same_image_free_audit(
    channels: int,
) -> None:
    spec = FEATURE_SPECS[-1]
    frame = synthetic_frame(65, 38, channels)
    masks = synthetic_masks(spec, 65, 38)
    result = apply_preview(frame, masks, PreviewRequest(spec.id, "plum", strength=82))
    baseline = audit_frame(spec.id, frame, result.pixels, masks, stripe_height=38)
    for stripe in (1, 2, 3, 7, 15, 64, 1024):
        outcome = audit_frame(
            spec.id, frame, result.pixels, masks, stripe_height=stripe,
        )
        assert outcome == baseline
        assert outcome.sum_rgb_channel_delta >= outcome.altered_rgb_pixels


def test_pixel_audit_detects_outside_colour_alpha_and_per_pixel_limit() -> None:
    spec = FEATURE_SPECS[0]
    before = synthetic_frame(10, 7, 4)
    masks = {spec.regions[0]: np.zeros((7, 10), dtype=np.uint8)}
    masks[spec.regions[0]][3, 4] = 255
    after = before.copy()
    after[3, 4, :3] = [244, 245, 246]
    after[0, 0, :3] = [5, 10, 15]
    after[6, 9, 3] ^= np.uint8(1)
    audit = audit_frame(spec.id, before, after, masks)
    assert audit.altered_rgb_outside == 1
    assert audit.altered_rgb_inside == 1
    assert audit.altered_rgb_pixels == 2
    assert audit.altered_alpha_pixels == 1
    assert audit.pixels_over_limit >= 1
    assert set(audit.checks(spec)) >= {
        "OUTSIDE_MASK", "ALPHA_CHANGED", "CHANNEL_LIMIT", "CHANNEL_PIXEL_LIMIT",
    }


def test_pixel_audit_rejects_unconsented_real_face_and_undisclosed_simulation() -> None:
    spec = FEATURE_SPECS[0]
    source = synthetic_frame(4, 4, 3)
    mask = np.full((4, 4), 255, dtype=np.uint8)
    row = audit_frame(
        spec.id, source, source.copy(), {spec.regions[0]: mask},
        synthetic=False, consented=False, simulation_disclosed=False,
        human_accepted=False, provider_calls=1,
    )
    assert "REAL_FACE_CONSENT_REQUIRED" in row.checks(spec)
    assert "SIMULATION_NOT_DISCLOSED" in row.checks(spec)
    assert "NETWORK_NOT_AUTHORIZED" in row.checks(spec)
    assert not row.to_protocol().synthetic
    assert not row.to_protocol().face_consented


def test_caller_alias_does_not_masquerade_as_preserved_original() -> None:
    spec = FEATURE_SPECS[0]
    before = synthetic_frame(8, 9, 3)
    mask = np.ones((9, 8), dtype=np.uint8)
    row = audit_frame(spec.id, before, before.view(), {spec.regions[0]: mask})
    assert "ORIGINAL_NOT_PRESERVED" in row.checks(spec)
    assert row.altered_rgb_pixels == 0


def test_mask_boundaries_do_not_implicitly_cover_unrelated_regions() -> None:
    spec = FEATURE_SPECS[0]
    before = synthetic_frame(3, 2, 3)
    after = before.copy()
    mask = np.zeros((2, 3), dtype=np.uint8)
    mask[0, 0] = 1
    other = np.ones((2, 3), dtype=np.uint8)
    after[0, 1, 0] += np.uint8(1)
    row = audit_frame(spec.id, before, after, {
        spec.regions[0]: mask, "hair": other,
    })
    assert row.authorized_pixels == 1
    assert row.altered_rgb_outside == 1
    assert "OUTSIDE_MASK" in row.checks(spec)


@pytest.mark.parametrize("invalid", [0, -1, 1025, 1.2, True, None])
def test_invalid_audit_tile_sizes_fail_closed(invalid: object) -> None:
    spec = FEATURE_SPECS[0]
    frame = synthetic_frame(5, 3, 3)
    mask = np.ones((3, 5), dtype=np.uint8)
    with pytest.raises(ValueError):
        audit_frame(spec.id, frame, frame.copy(), {spec.regions[0]: mask},
                    stripe_height=invalid)  # type: ignore[arg-type]


@pytest.mark.parametrize("value", [True, -1, 0.5, "2"])
def test_invalid_provider_call_counts_fail_closed(value: object) -> None:
    spec = FEATURE_SPECS[0]
    frame = synthetic_frame(5, 3, 3)
    mask = np.ones((3, 5), dtype=np.uint8)
    with pytest.raises(ValueError):
        audit_frame(spec.id, frame, frame.copy(), {spec.regions[0]: mask},
                    provider_calls=value)  # type: ignore[arg-type]


def test_bad_frame_and_mask_inputs_are_rejected() -> None:
    spec = FEATURE_SPECS[0]
    frame = synthetic_frame(6, 5, 4)
    mask = np.ones((5, 6), dtype=np.uint8)
    with pytest.raises(ValueError):
        audit_frame(spec.id, frame, frame[:, :, :3].copy(), {spec.regions[0]: mask})
    with pytest.raises(ValueError):
        audit_frame(spec.id, frame, frame.copy(), {spec.regions[0]: mask[:, :3]})
    with pytest.raises(ValueError):
        audit_frame(spec.id, frame, frame.copy(), {"unapproved": mask})
    with pytest.raises(ValueError):
        audit_frame(spec.id, frame, frame.copy(), {"hair": mask})
    with pytest.raises(ValueError):
        audit_frame("W14", frame, frame.copy(), {spec.regions[0]: mask})


def vector_bytes(data: np.ndarray) -> str:
    return base64.b64encode(data.tobytes(order="C")).decode("ascii")


def test_generated_audit_vectors_are_small_and_contain_no_user_metadata() -> None:
    cases = generated_vectors()
    assert len(cases) == len(FEATURE_SPECS) * 2
    assert sum(len(case["source"]) for case in cases) < 1_000_000
    assert all(case["expected"]["synthetic"] is True for case in cases)
    assert all(case["expected"]["provider_calls"] == 0 for case in cases)
    assert all("image_id" not in case for case in cases)
    assert all("filename" not in case for case in cases)


def generated_vectors() -> list[dict[str, object]]:
    """Create ephemeral parity cases from mathematical arrays only."""
    cases: list[dict[str, object]] = []
    for spec in FEATURE_SPECS:
        for channels in (3, 4):
            width = 11
            height = 9
            src = synthetic_frame(width, height, channels)
            masks = synthetic_masks(spec, width, height)
            req = PreviewRequest(spec.id, spec.variants[-1], strength=61)
            result = apply_preview(src, masks, req)
            audit = audit_frame(spec.id, src, result.pixels, masks, stripe_height=3)
            cases.append({
                "feature": spec.id,
                "channels": channels,
                "width": width,
                "height": height,
                "source": vector_bytes(src),
                "result": vector_bytes(result.pixels),
                "masks": {name: vector_bytes(mask) for name, mask in masks.items()},
                "expected": asdict(audit),
                "failures": audit.checks(spec),
            })
    return cases


if __name__ == "__main__" and sys.argv[1:] == ["--emit-audit-vectors"]:
    sys.stdout.write(json.dumps({
        "version": "synthetic-audit-parity/1",
        "no_photos": True,
        "cases": generated_vectors(),
    }, separators=(",", ":")))
