"""Numerical rendered-image evidence with intentional negative controls.

This is synthetic pixel contract testing, not a real-person appearance score.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from plumb_api.engines.proportions.synthetic import symmetric_face
from plumb_api.styling.evidence import analyse_demo, summarise_evidence
from plumb_api.styling.local_demo import DemoRefusal, DemoRender, demo_catalogue, render_demo_style

H, W = 192, 160
POINTS = symmetric_face(W, H, face_width=88, face_length=126)


def paint_head() -> np.ndarray:
    yy, xx = np.mgrid[:H, :W]
    img = np.zeros((H, W, 4), dtype=np.uint8)
    img[..., 0] = 85 + ((xx // 3 + yy) % 20)
    img[..., 1] = 65 + ((xx + yy // 3) % 20)
    img[..., 2] = 49 + ((xx + 2 * yy) % 16)
    img[..., 3] = np.where((yy % 7) == 0, 180, 255)
    return img


def render_pair(style_id: str = "tpl-long-layers") -> tuple[np.ndarray, DemoRender]:
    image = paint_head()
    result = render_demo_style(image, POINTS, style_id, 4.0)
    assert isinstance(result, DemoRender)
    return image, result


def test_twelve_styles_produce_real_byte_evidence() -> None:
    observations = []
    for row in demo_catalogue():
        image, result = render_pair(row.id)
        measured = analyse_demo(image, result)
        assert measured.valid and measured.status == "rendered", row.id
        assert measured.style_id == row.id
        assert measured.edited_pixels > 0
        assert measured.supported_pixels >= measured.edited_pixels
        assert measured.leaked_pixels == 0
        assert measured.alpha_changed == 0
        assert measured.provider_calls == 0
        assert measured.guard_applied
        observations.append(measured)
    summary = summarise_evidence(observations)
    assert summary.total == summary.valid == len(demo_catalogue()) == 12
    assert summary.refused == summary.failed == 0
    assert summary.max_leaked_pixels == summary.provider_calls == 0
    assert len(summary.styles) == 12
    assert summary.public()["scope"] == "synthetic_pixel_contract_not_real_face_quality"


def test_exact_support_and_changed_counts_are_derived_from_output() -> None:
    image, result = render_pair()
    evidence = analyse_demo(image, result)
    change = np.any(result.image[..., :3] != image[..., :3], axis=2)
    assert evidence.edited_pixels == np.count_nonzero(change)
    assert evidence.supported_pixels == np.count_nonzero(result.support_mask)
    assert evidence.changed_fraction == pytest.approx(np.count_nonzero(change) / (H * W))
    assert evidence.maximum_rgb_change > 0


def test_negative_control_detects_pixel_outside_hair_support() -> None:
    image, result = render_pair()
    altered = result.image.copy()
    altered[H - 1, W - 1, :3] = 0
    damaged = replace(result, image=altered)
    evidence = analyse_demo(image, damaged)
    assert not evidence.valid
    assert evidence.status == "changed_outside_hair_region"
    assert evidence.leaked_pixels == 1


def test_negative_control_detects_alpha_change() -> None:
    image, result = render_pair("tpl-pixie")
    altered = result.image.copy()
    altered[42, 60, 3] = 30
    evidence = analyse_demo(image, replace(result, image=altered))
    assert not evidence.valid
    assert evidence.status == "altered_alpha"
    assert evidence.alpha_changed == 1


@pytest.mark.parametrize("field,value", [
    ("changed_pixels", 0), ("changed_pixel_share", 0.0),
    ("affected_region_pixels", 0), ("rendered", False),
])
def test_negative_control_detects_untrue_render_evidence(field: str, value: object) -> None:
    image, result = render_pair()
    evidence = analyse_demo(image, replace(result, **{field: value}))
    assert not evidence.valid
    assert evidence.status == "inaccurate_render_evidence"


def test_invalid_shape_fails_without_indexing_outside_input() -> None:
    image, result = render_pair()
    bad = replace(result, image=result.image[:-1].copy())
    evidence = analyse_demo(image, bad)
    assert not evidence.valid and evidence.status == "invalid_shape"
    assert evidence.edited_pixels == 0


def test_invalid_support_mask_dtype_is_rejected() -> None:
    image, result = render_pair()
    invalid = replace(result, support_mask=result.support_mask.astype(np.uint8))
    evidence = analyse_demo(image, invalid)
    assert evidence.status == "invalid_shape" and not evidence.valid


def test_negative_control_detects_provider_or_guard_contract_change() -> None:
    image, result = render_pair()
    wrong_provider = analyse_demo(image, replace(result, provider_calls=1))
    assert wrong_provider.status == "identity_or_provider_contract"
    assert not wrong_provider.valid
    wrong_similarity = analyse_demo(image, replace(result, identity_similarity=1.1))
    assert wrong_similarity.status == "identity_or_provider_contract"
    assert not wrong_similarity.valid


def test_level_one_is_valid_but_not_a_render_claim() -> None:
    image = paint_head()
    result = render_demo_style(image, POINTS, "tpl-waves", 1.0)
    assert isinstance(result, DemoRender)
    evidence = analyse_demo(image, result)
    assert evidence.valid
    assert evidence.status == "unchanged_by_level"
    assert evidence.edited_pixels == 0


def test_coded_refusals_are_not_counted_as_rendered() -> None:
    image = paint_head()
    refusal = render_demo_style(image, None, "tpl-waves")
    assert isinstance(refusal, DemoRefusal)
    measured = analyse_demo(image, refusal)
    assert not measured.valid
    assert measured.status == "no_mesh"
    batch = summarise_evidence([measured])
    assert batch.refused == 1 and batch.valid == 0
    assert batch.failed == 1


def test_empty_batch_is_invalid_evidence() -> None:
    with pytest.raises(ValueError):
        summarise_evidence([])


def test_evidence_payload_has_no_pixels_mesh_or_photo_identifier() -> None:
    image, result = render_pair()
    data = analyse_demo(image, result).public()
    assert set(data) == {
        "style_id", "valid", "status", "edited_pixels", "supported_pixels",
        "leaked_pixels", "alpha_changed", "changed_fraction", "maximum_rgb_change",
        "guard_applied", "provider_calls", "evidence",
    }
    assert data["evidence"] == "synthetic_pixel_contract_only"
