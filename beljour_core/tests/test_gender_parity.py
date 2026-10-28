"""R13 P0 gender parity on drawn heads with hard-edged backgrounds.

Pass definition (improve-r12.md item 4, written before the run): 20 drawn meshes
(12 clean heads, 8 with landmark jitter) at -100/-66/-33/+33/+66/+100, rendered by the
product path and re-checked with the bench's own mesh checks. Zero folds, min
Jacobian >= 0.35 on the rendered field, no NaN, Q1/Q3/Q4 pass, and feminine and
masculine failure counts within 20% of each other. The same rules and the same code
run for both directions. Also reproduces the R12 skew on the unchanged recipe path.
Drawn meshes and images only. Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.shape import gender
from plumb_api.engines.shape.synthetic_heads import HEAD_COUNT, drawn_head
from plumb_api.engines.warp import fold
from plumb_api.engines.warp import mesh as warp_mesh
from lab.python.beljour_lab import face_harness as local

STOPS = (-100, -66, -33, 33, 66, 100)
SIZE = (150, 172)


def _faces() -> list[tuple[str, np.ndarray, np.ndarray]]:
    out = []
    for seed in range(HEAD_COUNT):
        xyz, image = drawn_head(seed, width=SIZE[0], height=SIZE[1])
        out.append((f"head-{seed}", xyz[:, :2], image))
    for seed in range(8):
        xyz, image = drawn_head(seed, width=SIZE[0], height=SIZE[1])
        rng = np.random.default_rng(90 + seed)
        jitter = rng.normal(0, 0.006 * SIZE[0], (478, 2))
        jitter[list(gender.IDENTITY_PINS)] = 0
        out.append((f"jitter-{seed}", xyz[:, :2] + jitter, image))
    return out


FACES = _faces()


def _check(points: np.ndarray, image: np.ndarray, target: np.ndarray) -> tuple[bool, dict]:
    gate, output = local.mesh_checks(points, target, image)
    lay = warp_mesh.layout(points, image.shape[1], image.shape[0])
    field = warp_mesh.mesh_warp(image.shape[0], image.shape[1], points, target, lay=lay).result.field
    min_det = float(field.jacobian().min())
    ok = bool(gate["q1"]["passed"] and gate["q3"]["passed"] and gate["q4"]["passed"]
              and gate["triangle_guard_pass"] and gate["strength_used"] >= 0.05
              and output is not None and np.all(np.isfinite(output)))
    return ok, {"gate": gate, "min_det": min_det}


def test_twenty_drawn_meshes() -> None:
    assert len(FACES) == 20


@pytest.fixture(scope="module")
def rendered() -> list[dict]:
    rows = []
    for name, points, image in FACES:
        for stop in STOPS:
            result = gender.render_targets(image, points, stop)
            ok, detail = _check(points, image, result.targets)
            rows.append({"face": name, "stop": stop, "direction": result.info["direction"], "ok": ok,
                         "min_det": detail["min_det"], "gate": detail["gate"], "info": result.info,
                         "scales": result.region_scales})
    return rows


def test_every_render_is_fold_free_with_jacobian_at_least_035(rendered: list[dict]) -> None:
    for row in rendered:
        assert row["gate"]["triangle_guard_pass"], row["face"]
        assert row["gate"]["jacobian_min"] > 0
        assert row["min_det"] >= gender.TRIANGLE_RATIO_MIN - 1e-9, (row["face"], row["stop"], row["min_det"])
        assert row["gate"]["strength_used"] == 1.0, "the warp guard never backs the edit off"


def test_failure_counts_are_within_20_percent(rendered: list[dict]) -> None:
    fails = {"feminine": 0, "masculine": 0}
    for row in rendered:
        fails[row["direction"]] += int(not row["ok"])
    lo, hi = sorted(fails.values())
    assert hi == lo == 0 or (lo > 0 and hi <= 1.2 * lo), fails


def test_reports_say_what_was_scaled(rendered: list[dict]) -> None:
    for row in rendered:
        info = row["info"]
        assert set(row["scales"]) == set(gender.REGIONS)
        assert all(0.0 <= v <= 1.0 for v in row["scales"].values())
        assert 0.0 <= info["effect_retention"] <= 1.0
        assert info["render_failed"] == [] or not row["ok"]
        assert info["render_version"] == gender.VERSION
        assert info["strain"]["max_strain"] <= 0.35 + 1e-9


def test_r12_path_reproduces_the_feminine_skew() -> None:
    """Unchanged recipe targets, no image-aware bisection: inward outline moves
    pull hard background edges into the outline band, so feminine fails more."""
    fails = {"feminine": 0, "masculine": 0}
    for name, points, image in FACES[:12:2]:
        for stop in (-100, -33, 33, 100):
            target, info = gender.recipe_targets(points, stop)
            ok, _ = _check(points, image, target)
            fails[info["direction"]] += int(not ok)
    assert fails["feminine"] > 1.2 * max(fails["masculine"], 1), fails


def test_same_rules_for_both_directions() -> None:
    _, points, image = FACES[3]
    for stop in (-66, 66):
        result = gender.render_targets(image, points, stop)
        assert result.info["render_version"] == gender.VERSION
    assert gender.SEAM_LIMIT == 1.5
    assert gender.TRIANGLE_RATIO_MIN == 0.35
    assert fold.Q3_MINIMUM == 0.2


def test_zero_stop_and_disabled_regions_are_identity() -> None:
    _, points, image = FACES[0]
    zero = gender.render_targets(image, points, 0)
    np.testing.assert_array_equal(zero.targets, points)
    off = gender.render_targets(image, points, -100, region_strengths={r: 0.0 for r in gender.REGIONS})
    np.testing.assert_array_equal(off.targets, points)


def test_render_is_deterministic() -> None:
    _, points, image = FACES[5]
    a = gender.render_targets(image, points, -66)
    b = gender.render_targets(image, points, -66)
    np.testing.assert_array_equal(a.targets, b.targets)
    assert a.region_scales == b.region_scales


def test_bad_photo_is_rejected() -> None:
    _, points, _ = FACES[0]
    with pytest.raises(ValueError, match="uint8"):
        gender.render_targets(np.zeros((20, 20, 3), np.float32), points, 33)
