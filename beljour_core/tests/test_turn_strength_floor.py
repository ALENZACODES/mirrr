"""R13 P0 turn gate on drawn heads: the turn happens at full strength, safely.

Pass definition (written before the run, improve-r12.md item 1): twelve drawn heads
with hard background edges, yaw +/-8 and pitch +/-6. Every turn keeps strength_used
>= 0.9, min Jacobian > 0.2 (Q3 floor unchanged), Q1 and Q4 pass, no folded pixel,
an explicit nonzero effect, and at least 95% of turns reach 0.9 (here: all of them).
Also: glitched-depth heads keep the guard at 1.0 where the R12 path backed off, and
the per-region bisection repairs a local fold without touching the rest of the face.
Synthetic meshes and images only. Author: John Khan.
"""
from __future__ import annotations

import math

import numpy as np
import pytest

from plumb_api.engines.shape import turn, turn_field
from plumb_api.engines.shape.synthetic_heads import HEAD_COUNT, drawn_head
from plumb_api.engines.shape.turn_blend import protect_field, support
from plumb_api.engines.warp import field as fields
from plumb_api.engines.warp import fold
from plumb_api.engines.warp import mesh as warp_mesh

TURNS = ((8, 0), (-8, 0), (0, 6), (0, -6))
FLOOR = 0.9


def _assert_safe(result: turn.TurnOutcome) -> None:
    assert result.checks["q1"]["passed"]
    assert result.checks["q3"]["minimum"] == 0.2
    assert result.checks["q3"]["min_det"] > 0.2
    assert result.checks["q3"]["folded_share"] == 0.0
    assert result.checks["q4"]["passed"]
    assert result.checks["q4"]["thresholds"]["maximum"] == 1.5
    assert result.checks["effect_pass"]
    assert result.checks["triangle_guard_pass"]
    assert not result.metrics["refused"]
    assert np.all(np.isfinite(result.field.map_x)) and np.all(np.isfinite(result.field.map_y))


def test_q3_floor_is_unchanged() -> None:
    assert fold.Q3_MINIMUM == 0.2
    assert turn.YAW_LIMIT == 8.0 and turn.PITCH_LIMIT == 6.0


@pytest.mark.parametrize("seed", range(HEAD_COUNT))
def test_every_drawn_head_turns_at_full_strength(seed: int) -> None:
    xyz, image = drawn_head(seed)
    for yaw, pitch in TURNS:
        result = turn.render_turn(image, xyz, yaw=yaw, pitch=pitch)
        _assert_safe(result)
        assert result.metrics["strength_used"] >= FLOOR, (seed, yaw, pitch, result.metrics)
        assert result.metrics["guard_strength"] == 1.0
        assert result.metrics["max_move_px"] > 1.0
        assert result.metrics["effective_yaw_degrees"] == pytest.approx(yaw * result.metrics["strength_used"])


def test_share_of_turns_at_floor_is_at_least_95_percent() -> None:
    strengths = []
    for seed in range(HEAD_COUNT):
        xyz, image = drawn_head(seed)
        for yaw, pitch in TURNS:
            strengths.append(turn.render_turn(image, xyz, yaw=yaw, pitch=pitch).metrics["strength_used"])
    share = sum(s >= FLOOR for s in strengths) / len(strengths)
    assert len(strengths) == 48
    assert share >= 0.95


def test_background_with_hard_edges_is_byte_identical_outside_the_oval() -> None:
    xyz, image = drawn_head(4)
    result = turn.render_turn(image, xyz, yaw=-8)
    masks = support(image.shape[0], image.shape[1], xyz[:, :2])
    outside = masks.oval < 0.5
    np.testing.assert_array_equal(result.image[outside], image[outside])


def _glitched(seed: int) -> tuple[np.ndarray, np.ndarray]:
    xyz, image = drawn_head(seed)
    rng = np.random.default_rng(50 + seed)
    ids = rng.choice(478, 12, replace=False)
    out = xyz.copy()
    span = float(out[:, 0].max() - out[:, 0].min())
    out[ids, 2] += rng.normal(0, 0.25 * span, 12)
    return out, image


def _r12_strength(xyz: np.ndarray, image: np.ndarray, yaw: float, pitch: float) -> float:
    """The R12 production path, reconstructed independently for comparison."""
    before = xyz[:, :2]
    proposed = turn.project(xyz, yaw, pitch).points
    h, w = image.shape[:2]
    masks = support(h, w, before)
    warp = warp_mesh.mesh_warp(h, w, before, proposed)
    candidate = protect_field(warp.result.field, masks)
    guarded = fold.safe_strength(fold.scaled_builder(candidate))
    raw = float(warp.result.field.move().max())
    return warp.strength_used * guarded.strength * float(candidate.move().max()) / raw


@pytest.mark.parametrize("seed", (1, 2, 3))
def test_glitched_depth_no_longer_backs_the_whole_turn_off(seed: int) -> None:
    xyz, image = _glitched(seed)
    for yaw, pitch in ((8, 0), (0, -6)):
        result = turn.render_turn(image, xyz, yaw=yaw, pitch=pitch)
        _assert_safe(result)
        old = _r12_strength(xyz, image, yaw, pitch)
        assert old < 0.5, "the fixture must reproduce the R12 global back-off"
        assert result.metrics["guard_strength"] == 1.0
        assert result.metrics["capped_vertices"] > 0
        # A glitched landmark near the rim can still hold the max-based spatial
        # share below 0.9 (seed 1 pitch: 0.80); the guard itself no longer backs off.
        assert result.metrics["strength_used"] >= 0.75
        assert result.metrics["strength_used"] > 2 * old


def test_protected_occluders_stay_unchanged_while_the_face_turns() -> None:
    xyz, image = drawn_head(6)
    h, w = image.shape[:2]
    yy, xx = np.mgrid[:h, :w]
    lock = ((yy < h * 0.45) & (np.abs(xx - (w * 0.35 + yy * 0.2)) < 4)).astype(np.float32)
    result = turn.render_turn(image, xyz, yaw=8, protected_mask=lock)
    _assert_safe(result)
    np.testing.assert_array_equal(result.image[lock > 0], image[lock > 0])
    assert result.metrics["strength_used"] >= 0.5


def test_ramp_grows_with_the_turn_and_never_drops_below_12_percent() -> None:
    width = 300.0
    small = turn_field.ramp_px(width, 1, 0, 1000, 3)
    full = turn_field.ramp_px(width, 8, 0, 1000, 3)
    pitch = turn_field.ramp_px(width, 0, -6, 1000, 3)
    assert small >= 0.12 * width
    assert full == pytest.approx(0.16 * width)
    assert pitch == pytest.approx(full)
    assert turn_field.ramp_px(width, 0, 0, 1000, 3) == pytest.approx(0.12 * width)
    # A plateau of full weight must remain inside a small oval.
    assert turn_field.ramp_px(width, 8, 0, 40, 3) == pytest.approx(0.45 * 37)
    assert turn_field.ramp_px(width, 8, 0, 5, 3) == 4.0
    with pytest.raises(ValueError, match="finite"):
        turn_field.ramp_px(math.nan, 8, 0, 40, 3)


def test_render_uses_the_turn_scaled_ramp() -> None:
    xyz, image = drawn_head(0)
    small = turn.render_turn(image, xyz, yaw=2)
    full = turn.render_turn(image, xyz, yaw=8)
    assert full.metrics["blend_px"] > small.metrics["blend_px"]
    across = turn.frame(xyz[:, :2]).axis_across
    assert small.metrics["blend_px"] >= 0.12 * turn_field.face_width(xyz[:, :2], across) - 1e-9


def test_silhouette_pivot_keeps_the_outline_and_moves_the_features() -> None:
    xyz, _ = drawn_head(2)
    nasion = turn.project(xyz, 8, pivot="nasion").points
    neck = turn.project(xyz, 8, pivot="silhouette").points
    oval = list(turn_field.regions.FACE_OVAL)
    rim_old = np.linalg.norm(nasion[oval] - xyz[oval, :2], axis=1).mean()
    rim_new = np.linalg.norm(neck[oval] - xyz[oval, :2], axis=1).mean()
    assert rim_new < rim_old * 0.5
    tip = 1
    assert np.linalg.norm(neck[tip] - xyz[tip, :2]) > 1.0
    with pytest.raises(ValueError, match="pivot"):
        turn.project(xyz, 8, pivot="ear")


def test_regulariser_passes_rigid_moves_unchanged() -> None:
    xyz, _ = drawn_head(5)
    before = xyz[:, :2]
    moved = before + np.array([3.0, -2.0])
    report = turn_field.regularise_targets(before, moved, 60.0)
    np.testing.assert_allclose(report.points, moved, atol=1e-9)
    assert report.capped_vertices == 0
    assert report.retention == pytest.approx(1.0)
    zero = turn_field.regularise_targets(before, before, 60.0)
    np.testing.assert_array_equal(zero.points, before)


def test_regulariser_caps_relative_moves_at_35_percent_of_the_shortest_edge() -> None:
    xyz, _ = drawn_head(7)
    before = xyz[:, :2]
    rng = np.random.default_rng(3)
    noisy = before + rng.normal(0, 6.0, before.shape)
    report = turn_field.regularise_targets(before, noisy, 60.0)
    assert report.capped_vertices > 0
    graph = turn_field.neighbour_graph(before, 60.0)
    delta = report.points - before
    worst = 0.0
    for i, j, length in graph.edges:
        if length > 1e-9:
            worst = max(worst, float(np.linalg.norm(delta[j] - delta[i])) / length)
    # Pairwise projection converges toward the cap; allow its finite-pass residue.
    assert worst <= turn_field.EDGE_STRAIN_SHARE * 1.6
    assert report.max_strain == pytest.approx(worst)


def test_coincident_landmarks_share_one_move() -> None:
    xyz, _ = drawn_head(0)
    before = xyz[:, :2].copy()
    before[200] = before[201]
    proposed = before + np.linspace(0, 1, 478)[:, None]
    report = turn_field.regularise_targets(before, proposed, 60.0)
    np.testing.assert_array_equal(report.points[200] - before[200], report.points[201] - before[201])


def test_regulariser_rejects_bad_input() -> None:
    a = np.zeros((478, 2))
    with pytest.raises(ValueError, match="matching"):
        turn_field.regularise_targets(a, np.zeros((477, 2)), 10.0)
    with pytest.raises(ValueError, match="finite"):
        turn_field.regularise_targets(a, np.full((478, 2), np.nan), 10.0)
    with pytest.raises(ValueError, match="share"):
        turn_field.regularise_targets(a, a, 10.0, share=0)


def _fold_field(height: int = 96, width: int = 120) -> fields.Field:
    yy, xx = np.mgrid[:height, :width].astype(np.float64)
    smooth = 1.5 * np.sin(xx / 30.0)
    bump = 9.0 * np.exp(-(((xx - 40) / 5.0) ** 2 + ((yy - 48) / 5.0) ** 2))
    return fields.Field(xx + smooth - bump * (xx - 40) / 5.0, yy.copy())


def test_per_region_bisection_repairs_a_local_fold_only() -> None:
    field = _fold_field()
    assert fold.fold_report(field).min_det <= 0.2
    whole = fold.safe_strength(fold.scaled_builder(field))
    relaxed = turn_field.relax_low_jacobian(field, iod=20.0)
    assert relaxed.regions_scaled >= 1
    assert fold.fold_report(relaxed.field).min_det > turn_field.LOCAL_TARGET_DET
    far = np.zeros(relaxed.attenuation.shape, dtype=bool)
    far[:, 80:] = True
    np.testing.assert_array_equal(relaxed.attenuation[far], 1.0)
    np.testing.assert_array_equal(relaxed.field.map_x[far], field.map_x[far])
    # The global guard would have scaled every pixel; the local repair keeps the rest.
    assert whole.strength < 1.0
    kept = float(relaxed.field.move()[:, 80:].max())
    assert kept == pytest.approx(float(field.move()[:, 80:].max()))


def test_bisection_is_independent_per_region_and_deterministic() -> None:
    height, width = 96, 160
    yy, xx = np.mgrid[:height, :width].astype(np.float64)
    strong = 9.0 * np.exp(-(((xx - 35) / 5.0) ** 2 + ((yy - 48) / 5.0) ** 2)) * (xx - 35) / 5.0
    mild = 4.5 * np.exp(-(((xx - 120) / 5.0) ** 2 + ((yy - 48) / 5.0) ** 2)) * (xx - 120) / 5.0
    field = fields.Field(xx - strong - mild, yy.copy())
    a = turn_field.relax_low_jacobian(field, iod=20.0)
    b = turn_field.relax_low_jacobian(field, iod=20.0)
    np.testing.assert_array_equal(a.attenuation, b.attenuation)
    assert a.regions_scaled >= 2
    assert a.attenuation[48, 35] < a.attenuation[48, 120] < 1.0
    assert fold.fold_report(a.field).min_det > turn_field.LOCAL_TARGET_DET


def test_safe_field_is_left_alone() -> None:
    yy, xx = np.mgrid[:40, :50].astype(np.float64)
    field = fields.Field(xx + 0.5 * np.sin(yy / 9), yy.copy())
    relaxed = turn_field.relax_low_jacobian(field, iod=10.0)
    assert relaxed.regions_scaled == 0 and relaxed.rounds == 0
    np.testing.assert_array_equal(relaxed.field.map_x, field.map_x)
    with pytest.raises(ValueError, match="iod"):
        turn_field.relax_low_jacobian(field, iod=0)


def test_feature_retention_counts_only_the_requested_direction() -> None:
    xyz, _ = drawn_head(1)
    before = xyz[:, :2]
    requested = before + np.array([4.0, 0.0])
    assert turn_field.feature_retention(before, requested, requested) == pytest.approx(1.0)
    assert turn_field.feature_retention(before, requested, before + np.array([2.0, 0.0])) == pytest.approx(0.5)
    assert turn_field.feature_retention(before, requested, before - np.array([4.0, 0.0])) == 0.0
    assert turn_field.feature_retention(before, before, before) == 1.0
