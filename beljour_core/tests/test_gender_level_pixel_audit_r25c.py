"""R25c pixel-evidence negative controls on synthetic images. Author: John Khan."""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.gender_look.level_audit import (
    audit_level_result,
    checked_selection,
    count_only,
    pixel_audit,
)
from plumb_api.engines.gender_look.levels import GenderLevelEngine, GuardDecision


def drawn_frame() -> tuple[np.ndarray, np.ndarray]:
    height = 45
    width = 52
    yy, xx = np.mgrid[:height, :width]
    original = np.empty((height, width, 4), dtype=np.uint8)
    original[..., 0] = (xx * 2 + yy * 3 + 27).astype(np.uint8)
    original[..., 1] = (xx * 3 + yy + 30).astype(np.uint8)
    original[..., 2] = (xx + yy * 5 + 15).astype(np.uint8)
    original[..., 3] = ((xx * 4 + yy * 3) % 256).astype(np.uint8)
    selection = np.zeros((height, width), dtype=np.float64)
    selection[8:30, 8:29] = 1
    return original, selection


class PhotoMasks:
    def masks(self, photo_hash: str, photo: np.ndarray) -> dict[str, np.ndarray]:
        _, selection = drawn_frame()
        return {"brow": selection, "skin": selection, "stubble": selection}


class PassThroughGuard:
    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> GuardDecision:
        return GuardDecision(after.copy(), 1.0, False)


@pytest.mark.parametrize("direction", ["feminine", "masculine"])
@pytest.mark.parametrize("level", [1.0, 2.0, 3.5, 5.0])
def test_actual_render_evidence_preserves_source_and_does_not_claim_pass(direction: str, level: float) -> None:
    original, selection = drawn_frame()
    frozen = original.copy()
    engine = GenderLevelEngine(PhotoMasks(), PassThroughGuard())
    result = engine.render(original, direction, level, primary_box=(0.0, 0.0, 1.0, 1.0))
    record = audit_level_result(original, result, selection)
    assert record.direction == direction
    assert record.level == level
    assert record.guard_called
    assert record.status == "UNPROVEN"
    assert record.off_mask_changed_count == 0
    assert record.alpha_changed_count == 0
    assert np.array_equal(original, frozen)
    if level == 1.0:
        assert record.changed_pixel_count == 0
        assert record.maximum_selected_delta == 0


def test_positive_pixels_are_counted_without_granting_quality_pass() -> None:
    original, selection = drawn_frame()
    after = original.copy()
    after[11, 11, 1] += 7
    after[15, 13, 2] += 9
    record = pixel_audit(original, after, selection, "feminine", 5.0, guard_called=True)
    assert record.changed_pixel_count == 2
    assert record.maximum_selected_delta == 9
    assert record.mask_pixel_count == 22 * 21
    assert record.status == "UNPROVEN"
    assert 0 < record.mean_selected_delta < 1
    assert np.array_equal(original[11, 11], drawn_frame()[0][11, 11])


@pytest.mark.parametrize("rgb_out,alpha_out,guard_called", [
    (True, False, True),
    (False, True, True),
    (False, False, False),
    (True, True, False),
])
def test_off_mask_alpha_and_skipped_guard_cannot_pass(
    rgb_out: bool,
    alpha_out: bool,
    guard_called: bool,
) -> None:
    original, selection = drawn_frame()
    after = original.copy()
    if rgb_out:
        after[1, 1, 0] = (int(after[1, 1, 0]) + 1) % 256
    if alpha_out:
        after[3, 4, 3] = (int(after[3, 4, 3]) + 1) % 256
    record = pixel_audit(original, after, selection, "masculine", 3.5, guard_called=guard_called)
    assert record.status == "FAIL"
    assert record.off_mask_changed_count == int(rgb_out)
    assert record.alpha_changed_count == int(alpha_out)
    assert count_only((record,))["failed"] == 1


def test_neutral_level_rejects_effect_even_inside_authorized_mask() -> None:
    original, selection = drawn_frame()
    after = original.copy()
    after[12, 12, 0] += 1
    record = pixel_audit(original, after, selection, "feminine", 1.0, guard_called=True)
    assert record.status == "FAIL"
    assert record.off_mask_changed_count == 0
    assert record.changed_pixel_count == 1


@pytest.mark.parametrize("invalid", [
    np.full((45, 52), -0.01),
    np.full((45, 52), 1.1),
    np.full((45, 52), float("nan")),
    np.full((46, 52), 1.0),
])
def test_invalid_regions_are_refused_without_implicit_full_frame(invalid: np.ndarray) -> None:
    with pytest.raises(ValueError, match="selection"):
        checked_selection(invalid, (45, 52))


def test_duplicate_count_only_records_are_rejected_without_overwriting_results() -> None:
    original, selection = drawn_frame()
    record = pixel_audit(original, original, selection, "masculine", 2.0, guard_called=True)
    with pytest.raises(ValueError, match="duplicate"):
        count_only((record, record))


def test_no_mesh_refusal_is_not_equivalent_to_a_rendered_audit() -> None:
    original, selection = drawn_frame()
    result = GenderLevelEngine(PhotoMasks()).render(original, "feminine", 2, primary_box=None)
    assert result.status == "no_mesh"
    with pytest.raises(ValueError, match="missing-mesh"):
        audit_level_result(original, result, selection)
