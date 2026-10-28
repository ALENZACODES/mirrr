"""Independent W28/W39 pixel-evidence and aggregate contract tests.

Images are synthetic arrays created in this file. No source photo is retained.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.haircolour.consultation import Choice, HairColourSession
from plumb_api.engines.haircolour.consultation_audit import (
    GroupCount,
    audit_pixels,
    merge_group_counts,
    structure_correlation,
)


def synthetic_strands(channels: int = 4) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    h, w = 64, 64
    yy, xx = np.mgrid[0:h, 0:w]
    waviness = np.rint(15 * np.sin(xx / 2.0) + 12 * np.cos(yy / 4.0))
    image = np.zeros((h, w, channels), dtype=np.uint8)
    image[..., 0] = 110 + waviness.astype(np.int16)
    image[..., 1] = 94 + waviness.astype(np.int16)
    image[..., 2] = 80 + waviness.astype(np.int16)
    if channels == 4:
        image[..., 3] = 240
    observed = np.zeros((h, w), dtype=float)
    observed[6:54, 10:54] = 1.0
    observed[6:54, 10] = 0.49
    strokes = np.zeros((h, w), dtype=float)
    strokes[10:50, 18:48] = 1
    return image, observed, strokes


def test_same_source_is_not_a_quality_pass() -> None:
    original, mask, _ = synthetic_strands()
    evidence = audit_pixels(
        original, original.copy(), mask, guard_invoked=True,
        simulation_disclosed=True,
    )
    assert evidence.changed_pixels == 0
    assert evidence.outside_changed_pixels == 0
    assert evidence.alpha_changed_pixels == 0
    assert evidence.realface_status == "not_tested"
    assert evidence.structure_correlation == pytest.approx(1.0, abs=1e-8)


@pytest.mark.parametrize("mode", ["W28", "W39"])
@pytest.mark.parametrize("shade", ["deep", "ash", "copper", "chestnut", "gold"])
def test_measured_renderer_preserves_observed_structure(mode: str, shade: str) -> None:
    image, hair, paint_mask = synthetic_strands()
    session = HairColourSession(image, hair)
    choice = Choice(mode=mode, level=3.5, shade=shade, base_level=4, target_level=7)
    trial = session.render(choice, strokes=paint_mask if mode == "W28" else None)
    evidence = audit_pixels(
        image, trial.image, hair, guard_invoked=trial.lock_applied,
        simulation_disclosed=True,
    )
    assert evidence.observed_pixels > 500
    assert evidence.changed_pixels > 0
    assert evidence.leakage_free
    assert evidence.max_outside_delta == 0
    assert evidence.structure_samples > 16
    assert evidence.realface_status == "not_tested"
    assert evidence.count_only()["guard_invoked"]


def test_adversarial_outside_edits_are_detected() -> None:
    image, hair, _ = synthetic_strands()
    altered = image.copy()
    altered[0, 0, :3] = (0, 0, 0)
    evidence = audit_pixels(
        image, altered, hair, guard_invoked=False,
        simulation_disclosed=False,
    )
    assert evidence.outside_changed_pixels == 1
    assert evidence.max_outside_delta > 0
    assert not evidence.leakage_free
    assert evidence.realface_status == "not_tested"


def test_alpha_changes_are_detected_even_when_rgb_unchanged() -> None:
    image, hair, _ = synthetic_strands()
    altered = image.copy()
    altered[16, 20, 3] = 0
    evidence = audit_pixels(
        image, altered, hair, guard_invoked=True,
        simulation_disclosed=True,
    )
    assert evidence.changed_pixels == 0
    assert evidence.alpha_changed_pixels == 1
    assert not evidence.leakage_free


def test_fractional_mask_outside_boundary_is_authoritative() -> None:
    image, hair, _ = synthetic_strands()
    altered = image.copy()
    altered[12, 10, 0] = 255
    evidence = audit_pixels(
        image, altered, hair, guard_invoked=True,
        simulation_disclosed=True,
    )
    assert hair[12, 10] == 0.49
    assert evidence.outside_changed_pixels == 1
    assert evidence.max_outside_delta > 0


def test_no_source_metadata_is_exported() -> None:
    image, hair, _ = synthetic_strands()
    evidence = audit_pixels(
        image, image, hair, guard_invoked=False,
        simulation_disclosed=True,
    )
    row = evidence.count_only()
    assert all("photo" not in key for key in row)
    assert all("landmark" not in key for key in row)
    assert all("image" not in key for key in row)
    assert set(row) == {
        "observed_pixels", "changed_pixels", "outside_changed_pixels",
        "alpha_changed_pixels", "mean_rgb_delta", "max_outside_delta",
        "structure_correlation", "structure_samples", "guard_invoked",
        "simulation_disclosed", "realface_status",
    }


@pytest.mark.parametrize("bad_mask", [float("nan"), float("inf"), -0.1, 1.01])
def test_audit_rejects_malformed_mask(bad_mask: float) -> None:
    image, hair, _ = synthetic_strands()
    hair[12, 12] = bad_mask
    with pytest.raises(ValueError):
        audit_pixels(image, image, hair, guard_invoked=True, simulation_disclosed=True)


@pytest.mark.parametrize("channels", [3, 4])
def test_audit_never_modifies_input_buffers(channels: int) -> None:
    image, hair, _ = synthetic_strands(channels)
    original = image.copy()
    observed = hair.copy()
    audit_pixels(image, image.copy(), hair, guard_invoked=False, simulation_disclosed=False)
    assert np.array_equal(image, original)
    assert np.array_equal(hair, observed)


@pytest.mark.parametrize("radius", [0, 9, -1])
def test_structure_radius_validation(radius: int) -> None:
    image, hair, _ = synthetic_strands()
    with pytest.raises(ValueError):
        structure_correlation(image, image, hair, radius=radius)


def test_small_support_refuses_false_certainty() -> None:
    image, hair, _ = synthetic_strands()
    hair[:] = 0
    hair[0, 0] = 1
    with pytest.raises(ValueError):
        audit_pixels(image, image, hair, guard_invoked=True, simulation_disclosed=True)


def test_flat_frame_has_unknown_structure_not_a_pass() -> None:
    image, hair, _ = synthetic_strands()
    image[:, :, :3] = 105
    evidence = audit_pixels(image, image, hair, guard_invoked=True, simulation_disclosed=True)
    assert evidence.structure_correlation is None
    assert evidence.structure_samples == 0
    assert evidence.realface_status == "not_tested"


def test_both_identical_and_recoloured_remain_unproven() -> None:
    image, hair, _ = synthetic_strands()
    session = HairColourSession(image, hair)
    choices = (Choice("W39", level=1.0), Choice("W39", level=4.0, shade="copper"))
    rows = []
    for choice in choices:
        preview = session.render(choice)
        rows.append(
            audit_pixels(
                image, preview.image, hair,
                guard_invoked=preview.lock_applied,
                simulation_disclosed=True,
            )
        )
    assert rows[0].changed_pixels == 0
    assert rows[1].changed_pixels > 0
    assert all(row.realface_status == "not_tested" for row in rows)


def test_group_counts_merge_permitted_labels_only() -> None:
    rows = [
        GroupCount("hair_texture", "coily", 9, 8, 1, 0, 0),
        GroupCount("hair_texture", "coily", 10, 9, 0, 1, 1),
        GroupCount("monk", "deep", 5, 4, 0, 0, 1),
    ]
    merged = merge_group_counts(rows)
    assert len(merged) == 2
    coily = next(row for row in merged if row["label"] == "coily")
    assert coily["observed"] == 19
    assert coily["evaluated"] == 17
    assert coily["refusals"] == 1
    assert coily["unmeasured"] == 1
    assert coily["quality_status"] == "not_tested"


@pytest.mark.parametrize(
    "row",
    [
        GroupCount("gender", "sample/name", 2, 2, 0, 0, 0),
        GroupCount("gender", "", 2, 2, 0, 0, 0),
        GroupCount("gender", "entry@example", 2, 2, 0, 0, 0),
        GroupCount("monk", "tone", 2, 3, 0, 0, 0),
        GroupCount("age", "adult", 5, 1, 1, 0, 1),
        GroupCount("yaw", "left", 5, 3, 1, 4, 1),
        GroupCount("monk", "level", -1, -1, 0, 0, 0),
    ],
)
def test_aggregate_rejects_sensitive_or_inconsistent_rows(row: GroupCount) -> None:
    with pytest.raises(ValueError):
        merge_group_counts([row])


def test_group_report_is_order_independent() -> None:
    rows = [
        GroupCount("hair_texture", "wavy", 6, 4, 1, 0, 1),
        GroupCount("monk", "light", 7, 5, 2, 0, 0),
        GroupCount("hair_texture", "wavy", 3, 2, 1, 1, 0),
    ]
    assert merge_group_counts(rows) == merge_group_counts(list(reversed(rows)))


def test_aggregates_do_not_claim_frozen_release_quality() -> None:
    for n in (0, 10, 983, 100000):
        group = GroupCount("monk", "supplied", n, n, 0, 0, 0)
        row = merge_group_counts([group])[0]
        assert row["quality_status"] == "not_tested"
        assert "pass" not in row
        assert "similarity" not in row
