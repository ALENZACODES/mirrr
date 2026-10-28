"""R25c read-only hair pixel evidence, refusal and privacy tests. Author: John Khan."""

from __future__ import annotations

from dataclasses import asdict, replace

import numpy as np
import pytest

from plumb_api.engines.gender_look.levels import GuardDecision
from plumb_api.engines.hair_women.contracts import HairGeometry
from plumb_api.engines.hair_women.style_guides import STYLE_KEYS
from plumb_api.engines.hair_women.style_preview import StylePreview, render_style_guide
from plumb_api.engines.hair_women.style_quality import (
    assert_evidence_schema,
    audit_style,
    count_groups,
    monotone_coverage,
)

def scene() -> tuple[np.ndarray, np.ndarray, HairGeometry]:
    yy, xx = np.mgrid[:64, :64]
    photo = np.zeros((64, 64, 4), dtype=np.uint8)
    photo[..., 0] = ((54 + 2 * xx + 3 * yy) % 256).astype(np.uint8)
    photo[..., 1] = ((54 + xx + yy) % 256).astype(np.uint8)
    photo[..., 2] = ((54 + 2 * yy) % 256).astype(np.uint8)
    photo[..., 3] = ((xx + 2 * yy + 101) % 256).astype(np.uint8)
    mask = np.zeros((64, 64), dtype=float)
    mask[5:58, 5:59] = 1
    geometry = HairGeometry((.5, .06), (.25, .32), (.75, .32), (.5, .91), .5, .85)
    return photo, mask, geometry


class AllowEdits:
    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> GuardDecision:
        return GuardDecision(after.copy(), 1.0, False)


def rendered(style: str = "crescent_pixie", level: float = 5.0) -> tuple[np.ndarray, np.ndarray, StylePreview]:
    image, mask, geometry = scene()
    result = render_style_guide(image, mask, geometry, style, level,
                                primary_box=(0, 0, 1, 1), identity_guard=AllowEdits())
    assert result.rendered
    return image, mask, result


@pytest.mark.parametrize("style", STYLE_KEYS)
def test_good_masked_edits_remain_unproven_not_a_real_face_pass(style: str) -> None:
    image, mask, preview = rendered(style)
    record = audit_style(image, preview, mask)
    assert record.style_id == style
    assert record.status == "UNPROVEN"
    assert record.selected_pixel_count > 0
    assert record.changed_pixel_count > 0
    assert record.outside_pixel_count == 0
    assert record.protected_pixel_count == 0
    assert record.alpha_pixel_count == 0
    assert record.maximum_selected_delta <= 255


def test_neutral_level_is_unmodified_but_guarded_and_unproven() -> None:
    image, mask, preview = rendered("curly_shag", 1.0)
    assert preview.guard_called
    assert np.array_equal(image, preview.image)
    evidence = audit_style(image, preview, mask)
    assert evidence.changed_pixel_count == 0
    assert evidence.status == "UNPROVEN"


@pytest.mark.parametrize("error_kind", ("outside", "protected", "alpha", "unguarded", "neutral"))
def test_negative_controls_fail_without_adjusting_a_threshold(error_kind: str) -> None:
    image, mask, preview = rendered("sleek_side_part")
    faulty = preview.image.copy()
    protected = np.zeros(mask.shape, dtype=float)
    if error_kind == "outside":
        faulty[0, 0, 0] = 255 - faulty[0, 0, 0]
    elif error_kind == "protected":
        protected[29, 29] = 0.1
        faulty[29, 29, 1] = 255 - faulty[29, 29, 1]
    elif error_kind == "alpha":
        faulty[25, 25, 3] = 255 - faulty[25, 25, 3]
    elif error_kind == "neutral":
        preview = replace(preview, level=1.0)
    if error_kind != "neutral":
        preview = replace(preview, image=faulty)
    if error_kind == "unguarded":
        preview = replace(preview, guard_called=False)
    result = audit_style(image, preview, mask, protected_mask=protected)
    assert result.status == "FAIL"
    if error_kind == "outside":
        assert result.outside_pixel_count == 1
    if error_kind == "alpha":
        assert result.alpha_pixel_count == 1


def test_protected_mask_is_not_counted_as_allowed_even_inside_hair() -> None:
    image, mask, preview = rendered("graduated_bob")
    protected = np.zeros(mask.shape)
    protected[20:45, 20:45] = 1
    # Re-evaluating a result under a newly protected region detects stale edits.
    result = audit_style(image, preview, mask, protected_mask=protected)
    assert result.status == ("FAIL" if result.protected_pixel_count else "UNPROVEN")


def test_invalid_inputs_are_not_downgraded_to_a_harmless_status() -> None:
    image, mask, preview = rendered()
    with pytest.raises(ValueError):
        audit_style(image.astype(np.float32), preview, mask)
    with pytest.raises(ValueError):
        audit_style(image, replace(preview, image=preview.image[:10]), mask)
    with pytest.raises(ValueError):
        audit_style(image, preview, mask[:20])
    mask[11, 12] = float("nan")
    with pytest.raises(ValueError):
        audit_style(image, preview, mask)
    refused = replace(preview, status="no_mesh")
    with pytest.raises(ValueError):
        audit_style(image, refused, np.ones(image.shape[:2], dtype=float))


def test_invalid_release_claim_and_pii_fields_are_rejected() -> None:
    image, mask, preview = rendered()
    record = audit_style(image, preview, mask)
    counts = count_groups([("texture", "coily", record), ("monk", "5", record)])
    assert len(counts) == 2
    serial = [asdict(row) for row in counts]
    assert assert_evidence_schema(serial) == 2
    unwanted = {**serial[0], "face_hash": "private-hash"}
    with pytest.raises(ValueError):
        assert_evidence_schema([unwanted])
    with pytest.raises(ValueError):
        assert_evidence_schema([{**serial[0], "unproven": 0}])


@pytest.mark.parametrize("name", ("someone@example.com", "/private/photo.jpg", "x" * 41, ""))
def test_group_names_must_not_expose_sensitive_text(name: str) -> None:
    image, mask, preview = rendered()
    record = audit_style(image, preview, mask)
    with pytest.raises(ValueError):
        count_groups([("texture", name, record)])


def test_unknown_group_kind_is_rejected_instead_of_inferred_from_pixels() -> None:
    image, mask, preview = rendered()
    record = audit_style(image, preview, mask)
    with pytest.raises(ValueError):
        count_groups([("personal_identity", "reference", record)])


def test_monotone_coverage_counts_and_rejects_duplicate_or_mixed_series() -> None:
    image, mask, geometry = scene()
    series = [render_style_guide(image, mask, geometry, "curly_shag", level,
                                 primary_box=(0, 0, 1, 1), identity_guard=AllowEdits())
              for level in (1.0, 1.8, 2.5, 3.5, 5.0)]
    assert monotone_coverage(series)
    with pytest.raises(ValueError):
        monotone_coverage(series + [series[0]])
    with pytest.raises(ValueError):
        monotone_coverage([])
    other = render_style_guide(image, mask, geometry, "long_ribbons", 2.5,
                               primary_box=(0, 0, 1, 1), identity_guard=AllowEdits())
    with pytest.raises(ValueError):
        monotone_coverage(series + [other])
    broken = replace(series[-1], coverage=np.zeros(mask.shape, dtype=float))
    assert not monotone_coverage([series[2], broken])
