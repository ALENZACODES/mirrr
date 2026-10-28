"""R12 turn gate: drawn high-contrast silhouettes and invented 478-point meshes.

Pass definition: original Q1, determinant >0.2 everywhere, original Q4 <=1.5,
protected pixels unchanged, meaningful nonzero motion for each requested turn.
Four yaw/pitch settings; hair, glasses, hijab and plain-background cases. Full
protection must be reported as a refusal, never an identity-output success.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.core import regions
from plumb_api.engines.core.distance import distance_inside, distance_to
from plumb_api.engines.shape import turn
from plumb_api.engines.shape.turn_blend import support, protect_field, applied_targets
from plumb_api.engines.warp import field as fields
from plumb_api.engines.warp import fold
from plumb_api.engines.warp import mesh as warp_mesh
from plumb_api.quality.metrics import q4_seam, q1_outside_mask
from lab.python.beljour_lab.face_harness import synthetic_case

WIDTH, HEIGHT = 144, 160
TURNS = ((8, 0), (-8, 0), (0, 6), (0, -6))


def scene(kind: str = "plain", *, alpha: bool = False) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    xyz, _ = synthetic_case(1, width=WIDTH, height=HEIGHT)
    yy, xx = np.mgrid[:HEIGHT, :WIDTH]
    oval = regions.region_mask("face_oval", xyz[:, :2], HEIGHT, WIDTH,
                               normalized=False, supersample=2)
    face = 65 + (xx % 20) * 3 + (yy % 17) * 0.1
    backdrop = 140 + (xx % 20) * 3
    luminance = np.where(oval >= 0.5, face, backdrop)
    image = np.repeat(luminance[..., None], 3, axis=2).astype(np.uint8)
    protected = np.zeros((HEIGHT, WIDTH), dtype=np.float32)
    if kind == "hair":
        # A diagonal lock crosses the brow and the original oval.
        protected[(yy < 80) & (np.abs(xx - (45 + yy * 0.25)) < 3)] = 1
    elif kind == "glasses":
        eye_y = xyz[468, 1]
        for centre in (xyz[468, 0], xyz[473, 0]):
            rx = np.abs(xx - centre)
            ry = np.abs(yy - eye_y)
            protected[((rx >= 9) & (rx <= 12) & (ry <= 8)) |
                      ((ry >= 6) & (ry <= 8) & (rx <= 12))] = 1
        protected[(np.abs(yy - eye_y) < 1.2) & (xx > 60) & (xx < 84)] = 1
    elif kind == "hijab":
        protected[((oval >= 0.5) & (xx < 44)) | ((yy > 126) & (oval >= 0.5))] = 1
    elif kind != "plain":
        raise ValueError("unknown drawn case")
    image[protected > 0] = np.array([20, 28, 40], dtype=np.uint8)
    if alpha:
        image = np.concatenate([image, (80 + (xx + yy) % 176).astype(np.uint8)[..., None]], axis=2)
    return xyz, image, protected


def assert_checks(result: turn.TurnOutcome) -> None:
    assert result.checks["q1"]["passed"]
    assert result.checks["q3"]["passed"]
    assert result.checks["q3"]["minimum"] == 0.2
    assert result.checks["q3"]["min_det"] > 0.2
    assert result.checks["q4"]["passed"]
    assert result.checks["q4"]["thresholds"]["maximum"] == 1.5
    assert result.checks["q4_occluder"]["passed"]
    assert result.checks["effect_pass"]
    assert result.checks["triangle_guard_pass"]


@pytest.mark.parametrize("yaw,pitch", TURNS)
def test_reproduces_unblended_oval_seam_and_fixes_it(yaw: float, pitch: float) -> None:
    xyz, image, _ = scene()
    proposed = turn.project(xyz, yaw, pitch).points
    # Reconstruct the previous production path, independently of the new renderer.
    old_warp = warp_mesh.mesh_warp(HEIGHT, WIDTH, xyz[:, :2], proposed)
    old = fields.apply(image, old_warp.result.field)
    oval = regions.region_mask("face_oval", xyz[:, :2], HEIGHT, WIDTH,
                               normalized=False, supersample=2)
    before = q4_seam(image, old, oval)
    assert before.measured["ratio"] > 1.5
    assert not before.passed, "the fixture must trigger the existing Q4 gate"
    result = turn.render_turn(image, xyz, yaw=yaw, pitch=pitch)
    assert_checks(result)
    assert result.metrics["max_move_px"] > 0.2
    assert np.any(result.image != image)
    assert 0 < result.metrics["strength_used"] <= 1
    assert result.checks["q4"]["measured"]["ratio"] < before.measured["ratio"]


@pytest.mark.parametrize("kind", ("plain", "hair", "glasses", "hijab"))
@pytest.mark.parametrize("yaw,pitch", TURNS)
def test_occluder_and_silhouette_gate(kind: str, yaw: float, pitch: float) -> None:
    xyz, image, protected = scene(kind)
    original, points, mask = image.copy(), xyz.copy(), protected.copy()
    result = turn.render_turn(image, xyz, yaw=yaw, pitch=pitch, protected_mask=protected)
    assert_checks(result)
    assert not result.metrics["refused"]
    assert result.metrics["max_move_px"] > 0.05
    np.testing.assert_array_equal(result.image[protected > 0], image[protected > 0])
    np.testing.assert_array_equal(image, original)
    np.testing.assert_array_equal(xyz, points)
    np.testing.assert_array_equal(protected, mask)
    assert result.metrics["strip_pixels"] == 0
    assert result.target.shape == (478, 2)
    assert np.all(np.isfinite(result.target))


def test_support_does_not_extend_outside_face_to_hide_seams() -> None:
    xyz, image, protected = scene("hijab")
    masks = support(HEIGHT, WIDTH, xyz[:, :2], protected_mask=protected)
    result = turn.render_turn(image, xyz, yaw=8, protected_mask=protected)
    exterior = masks.oval < 0.5
    np.testing.assert_array_equal(result.image[exterior], image[exterior])
    assert np.all(result.field.move()[exterior] == 0)
    assert q1_outside_mask(image, result.image, masks.oval, dilate_px=0).passed
    assert np.all(masks.weights[protected > 0] == 0)


def test_preserved_rim_is_byte_identical() -> None:
    xyz, image, _ = scene()
    masks = support(HEIGHT, WIDTH, xyz[:, :2])
    result = turn.render_turn(image, xyz, pitch=-6)
    rim = distance_inside(masks.oval) <= 3
    np.testing.assert_array_equal(result.image[rim], image[rim])
    assert np.any(masks.weights > 0.99)


def test_source_sampling_never_drags_in_a_protected_object() -> None:
    xyz, image, protected = scene("hair")
    result = turn.render_turn(image, xyz, yaw=-8, protected_mask=protected)
    moved = result.field.move() > 1e-6
    sampled_mask = fields.sample_plane(protected, result.field.map_x, result.field.map_y)
    assert np.all(sampled_mask[moved] == 0)
    clearance = distance_to(protected)
    assert np.all(result.field.move()[moved] < clearance[moved])


def test_total_protection_is_explicit_refusal_for_requested_turn() -> None:
    xyz, image, _ = scene()
    result = turn.render_turn(image, xyz, yaw=8, protected_mask=np.ones((HEIGHT, WIDTH), np.float32))
    np.testing.assert_array_equal(result.image, image)
    assert result.metrics["refused"]
    assert result.metrics["strength_used"] == 0
    assert result.metrics["effective_yaw_degrees"] == 0
    assert not result.checks["effect_pass"]
    assert result.checks["q3"]["passed"], "quality alone does not prove an edit happened"


def test_zero_request_is_exact_copy_without_refusal() -> None:
    xyz, image, _ = scene()
    result = turn.render_turn(image, xyz)
    assert_checks(result)
    np.testing.assert_array_equal(result.image, image)
    np.testing.assert_allclose(result.target, xyz[:, :2], atol=1e-12)
    assert result.image is not image
    assert not np.any(result.edit_mask)
    assert not result.metrics["refused"]


def test_partial_alpha_protection_locks_its_whole_sample_footprint() -> None:
    xyz, image, protected = scene("glasses", alpha=True)
    protected *= 0.1
    result = turn.render_turn(image, xyz, pitch=6, protected_mask=protected)
    assert_checks(result)
    assert result.image.shape[2] == 4
    np.testing.assert_array_equal(result.image[protected > 0], image[protected > 0])


@pytest.mark.parametrize("supplied", (False, True), ids=("omitted", "empty"))
def test_unmeasured_occluders_do_not_masquerade_as_seam_evidence(supplied: bool) -> None:
    xyz, image, empty = scene()
    result = turn.render_turn(image, xyz, yaw=8, protected_mask=empty if supplied else None)
    assert_checks(result)
    assert result.metrics["max_move_px"] > 0.2
    assert np.any(result.image != image), "ordinary geometric turning remains available"
    assert result.metrics["occluder_mask_supplied"] is supplied
    assert result.metrics["occluder_mask_nonempty"] is False
    assert result.metrics["protected_pixels"] == 0
    assert result.metrics["q4_occluder_band_pixels"] == 0
    assert result.metrics["q4_occluder_measured"] is False
    assert result.checks["q4_occluder_measured"] is False
    assert result.checks["q4_occluder_evidence_pass"] is False


@pytest.mark.parametrize("kind", ("hair", "glasses", "hijab"))
def test_real_protected_boundaries_have_exact_seam_evidence(kind: str) -> None:
    xyz, image, protected = scene(kind)
    result = turn.render_turn(image, xyz, yaw=-8, protected_mask=protected)
    measured = q4_seam(image, result.image, protected)
    assert measured.measured["band_pixels"] > 0
    assert result.metrics["occluder_mask_supplied"] is True
    assert result.metrics["occluder_mask_nonempty"] is True
    assert result.metrics["protected_pixels"] == int(np.count_nonzero(protected))
    assert result.metrics["q4_occluder_band_pixels"] == measured.measured["band_pixels"]
    assert result.metrics["q4_occluder_ratio_p90"] == measured.measured["ratio"]
    assert result.metrics["q4_occluder_measured"] is True
    assert result.checks["q4_occluder_measured"] is True
    assert result.checks["q4_occluder_evidence_pass"] is measured.passed
    assert result.checks["q4_occluder"] == measured.to_json()
    np.testing.assert_array_equal(result.image[protected > 0], image[protected > 0])


@pytest.mark.parametrize("kind", ("full_frame", "fractional"))
def test_nonempty_protection_without_q4_contour_is_not_seam_evidence(kind: str) -> None:
    xyz, image, protected = scene("glasses")
    protected = np.ones_like(protected) if kind == "full_frame" else protected * 0.1
    result = turn.render_turn(image, xyz, pitch=6, protected_mask=protected)
    assert result.metrics["occluder_mask_supplied"] is True
    assert result.metrics["occluder_mask_nonempty"] is True
    assert result.metrics["protected_pixels"] == int(np.count_nonzero(protected))
    assert result.metrics["q4_occluder_band_pixels"] == 0
    assert result.metrics["q4_occluder_measured"] is False
    assert result.checks["q4_occluder_measured"] is False
    assert result.checks["q4_occluder_evidence_pass"] is False
    np.testing.assert_array_equal(result.image[protected > 0], image[protected > 0])


def test_cropped_face_uses_image_edge_as_support_boundary() -> None:
    xyz, image, _ = scene()
    xyz[:, 0] -= 40
    masks = support(HEIGHT, WIDTH, xyz[:, :2])
    assert np.all(masks.weights[:, :3] == 0)
    assert np.all(np.isfinite(masks.weights))
    result = turn.render_turn(image, xyz, yaw=8)
    assert_checks(result)
    np.testing.assert_array_equal(result.image[:, :3], image[:, :3])


def test_blend_is_resolution_aware_and_can_only_widen_inward() -> None:
    xyz, _, _ = scene()
    a = support(HEIGHT, WIDTH, xyz[:, :2])
    scaled = xyz[:, :2] * 2
    b = support(HEIGHT * 2, WIDTH * 2, scaled)
    assert b.blend_px == pytest.approx(a.blend_px * 2)
    wider = support(HEIGHT, WIDTH, xyz[:, :2], blend_px=a.blend_px * 2)
    np.testing.assert_array_equal(wider.oval, a.oval)
    assert np.all(wider.weights <= a.weights + 1e-12)


def test_weighted_displacement_is_guarded_after_local_blending() -> None:
    xyz, _, _ = scene()
    masks = support(HEIGHT, WIDTH, xyz[:, :2])
    aggressive = fields.from_function(HEIGHT, WIDTH, lambda x, y: (x + 40, y), 1)
    candidate = protect_field(aggressive, masks)
    guarded = fold.safe_strength(fold.scaled_builder(candidate))
    assert guarded.report.passed
    assert guarded.report.min_det > 0.2
    assert guarded.field.move().max() > 0
    assert np.all(guarded.field.move()[masks.oval < 0.5] == 0)


def test_output_is_repeatable_on_identical_inputs() -> None:
    xyz, image, protected = scene("glasses")
    a = turn.render_turn(image, xyz, yaw=-8, protected_mask=protected)
    b = turn.render_turn(image, xyz, yaw=-8, protected_mask=protected)
    np.testing.assert_array_equal(a.image, b.image)
    np.testing.assert_array_equal(a.field.map_x, b.field.map_x)
    assert a.metrics == b.metrics
    assert a.checks == b.checks


@pytest.mark.parametrize("kwargs", ({"yaw": 8.1}, {"pitch": 6.1}, {"roll": 25.1}, {"yaw": float("nan")}))
def test_turn_angle_validation_remains_strict(kwargs: dict) -> None:
    xyz, image, _ = scene()
    with pytest.raises(ValueError, match="supports yaw"):
        turn.render_turn(image, xyz, **kwargs)


@pytest.mark.parametrize("bad", (np.ones((4, 4)), np.full((HEIGHT, WIDTH), -1), np.full((HEIGHT, WIDTH), np.nan)))
def test_invalid_protection_cannot_silently_pass(bad: np.ndarray) -> None:
    xyz, image, _ = scene()
    with pytest.raises(ValueError, match="mask"):
        turn.render_turn(image, xyz, yaw=8, protected_mask=bad)


@pytest.mark.parametrize("ramp", (0, 3.9, float("nan"), float("inf")))
def test_blend_does_not_allow_a_sharp_or_nonfinite_transition(ramp: float) -> None:
    xyz, image, _ = scene()
    with pytest.raises(ValueError, match="blend"):
        turn.render_turn(image, xyz, yaw=8, blend_px=ramp)


def test_support_cannot_reduce_the_preserved_rim() -> None:
    xyz, _, _ = scene()
    with pytest.raises(ValueError, match="rim"):
        support(HEIGHT, WIDTH, xyz[:, :2], rim_px=2.9)


def test_targets_report_spatial_attenuation_not_full_requested_mesh() -> None:
    xyz, _, protected = scene("glasses")
    before = xyz[:, :2]
    proposed = turn.project(xyz, 8).points
    masks = support(HEIGHT, WIDTH, before, protected_mask=protected)
    target = applied_targets(before, proposed, masks, 0.5)
    movement = np.linalg.norm(target - before, axis=1)
    requested = np.linalg.norm(proposed - before, axis=1)
    assert np.all(movement <= requested * 0.5 + 1e-9)
    assert movement.max() > 0
    with pytest.raises(ValueError, match="strength"):
        applied_targets(before, proposed, masks, 2)
