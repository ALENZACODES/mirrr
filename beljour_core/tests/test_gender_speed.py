"""R14 preview speed and exact sparse-Q4 acceptance, written before execution.

Pass definitions: a cold 512px drawn feminine and masculine preview each finishes
in under 1.0 second, retaining the existing 1.5 second product budget. The sparse
search agrees with the full-raster reference to 1e-8 px at landmarks, at most one
8-bit pixel level, and 1e-12 in seam ratio. Every returned candidate has a complete
full-resolution warp guard check. A rejected confirmation invokes the existing
full search; no downsampled or partial raster can pass Q3. These are synthetic
performance/correctness tests, not evidence about real faces or devices.
Author: John Khan.
"""
from __future__ import annotations

import time
from dataclasses import replace
from unittest.mock import patch

import numpy as np
import pytest

from plumb_api.engines.core import regions
from plumb_api.engines.core.distance import dilate
from plumb_api.engines.core.resample import remap
from plumb_api.engines.shape import gender
from plumb_api.engines.shape.gender_preview import SparseSeam, _sample, one_pixel_band
from plumb_api.engines.shape.synthetic_heads import drawn_head
from plumb_api.engines.warp import field, mesh, regularize
from plumb_api.engines.warp.piecewise import piecewise_affine
from plumb_api.quality.metrics import q4_seam


@pytest.mark.parametrize("stop", [-66, 66])
def test_512px_drawn_preview_finishes_under_one_second(stop: int) -> None:
    xyz, image = drawn_head(2, width=512, height=512)
    regularize._graph.cache_clear()
    started = time.perf_counter()
    result = gender.render_targets(image, xyz[:, :2], stop)
    elapsed = time.perf_counter() - started
    assert elapsed < 1.0, f"512px stop {stop}: {elapsed:.3f}s; budget is 1.0s"
    assert result.info["search_method"] == "sparse-seam-full-confirm"
    assert result.info["full_raster_evaluations"] == 1
    assert result.info["render_failed"] == []
    assert result.checks["full_resolution_checked"] is True
    assert result.checks["guard_strength"] == 1.0
    assert 0 < result.info["effect_retention"] <= 1.0
    assert result.info["seam_samples"] < image.shape[0] * image.shape[1] // 4


@pytest.mark.parametrize("seed,stop,size", [(2, -66, 512), (5, -100, 320), (9, 33, 256), (1, 0, 214)])
def test_fast_search_matches_full_reference(seed: int, stop: int, size: int) -> None:
    xyz, image = drawn_head(seed, width=size, height=size)
    fast = gender.render_targets(image, xyz[:, :2], stop)
    reference = gender.render_targets_reference(image, xyz[:, :2], stop)
    np.testing.assert_allclose(fast.targets, reference.targets, rtol=0, atol=1e-8)
    assert np.abs(fast.image.astype(np.int16) - reference.image.astype(np.int16)).max() <= 1
    assert fast.region_scales == reference.region_scales
    assert fast.info["render_failed"] == reference.info["render_failed"]
    assert fast.info["seam_ratio"] == pytest.approx(reference.info["seam_ratio"], abs=1e-12)
    assert fast.info["effect_retention"] == pytest.approx(reference.info["effect_retention"], abs=1e-12)


@pytest.mark.parametrize("seed", [0, 2, 5])
@pytest.mark.parametrize("alpha", [False, True])
def test_sparse_samples_and_q4_are_exact_on_drawn_images(seed: int, alpha: bool) -> None:
    xyz, image = drawn_head(seed, width=204, height=220)
    if alpha:
        yy, xx = np.mgrid[:220, :204]
        alpha_plane = ((xx * 7 + yy * 11) % 256).astype(np.uint8)
        image = np.dstack([image, alpha_plane])
    points = xyz[:, :2]
    mask = regions.region_mask("face_oval", points, 220, 204, normalized=False, supersample=2)
    layout = mesh.layout(points, 204, 220)
    targets, _ = gender.recipe_targets(points, -66)
    moved = layout.points.copy()
    moved[:478] = targets
    full = piecewise_affine(220, 204, layout.points, moved, layout.triangles)
    sample = SparseSeam.prepare(image, mask)
    mx, my = sample.maps(layout, targets)
    y, x = sample.y.astype(np.intp), sample.x.astype(np.intp)
    np.testing.assert_array_equal(mx, full.field.map_x[y, x])
    np.testing.assert_array_equal(my, full.field.map_y[y, x])
    output = field.apply(image, full.field)
    canonical = q4_seam(image, output, mask).measured["ratio"]
    assert sample.ratio(layout, targets) == pytest.approx(canonical, abs=1e-12)
    assert sample.full_ratio(output) == pytest.approx(canonical, abs=1e-12)


@pytest.mark.parametrize("alpha", [False, True])
def test_sparse_sampling_matches_canonical_linear_alpha_remap(alpha: bool) -> None:
    rng = np.random.default_rng(8102)
    channels = 4 if alpha else 3
    image = rng.integers(0, 256, (31, 27, channels), dtype=np.uint8)
    image[:4, :6] = 0
    x = rng.uniform(-6, 34, 500)
    y = rng.uniform(-5, 37, 500)
    actual = _sample(image, x, y)
    expected = remap(image, x[:, None], y[:, None])[:, 0]
    np.testing.assert_array_equal(actual, expected)
    np.testing.assert_array_equal(_sample(image, np.array([0.0, 26.0]), np.array([0.0, 30.0])),
                                  image[[0, 30], [0, 26]])


@pytest.mark.parametrize("shape", [(2, 2), (9, 17), (32, 32), (101, 64)])
def test_fast_contour_band_is_exact_euclidean_radius_one(shape: tuple[int, int]) -> None:
    rng = np.random.default_rng(455)
    edge = rng.random(shape) > 0.86
    expected = dilate(edge.astype(np.float32), 1) > 0
    np.testing.assert_array_equal(one_pixel_band(edge), expected)
    assert one_pixel_band(edge).dtype == np.bool_
    assert not one_pixel_band(np.zeros(shape, dtype=bool)).any()
    assert one_pixel_band(np.ones(shape, dtype=bool)).all()


@pytest.mark.parametrize("kind", ["empty", "full", "border"])
def test_contour_empty_states_and_image_borders_keep_q4_meaning(kind: str) -> None:
    rng = np.random.default_rng(90)
    image = rng.integers(0, 256, (17, 19, 3), dtype=np.uint8)
    mask = np.zeros((17, 19), dtype=np.float32)
    if kind == "full":
        mask[:] = 1.0
    elif kind == "border":
        mask[:8, :9] = 1.0
    changed = image.copy()
    changed[:8, :9] = 110
    seam = SparseSeam.prepare(image, mask)
    expected = q4_seam(image, changed, mask).measured["ratio"]
    assert seam.full_ratio(changed) == pytest.approx(expected, abs=1e-12)
    if kind != "border":
        assert seam.sample_count == 0
        assert expected == 0
    with pytest.raises(ValueError, match="full matching"):
        seam.full_ratio(changed[:2])


def test_rejected_full_confirmation_reverts_to_full_search() -> None:
    xyz, image = drawn_head(3, width=240, height=240)
    points = xyz[:, :2]
    expected = gender.render_targets_reference(image, points, 33)
    original = mesh.mesh_warp
    calls = []

    def rejected_once(*args, **kwargs):
        result = original(*args, **kwargs)
        calls.append((args[0], args[1]))
        if len(calls) == 1:
            return replace(result, strength_used=0.5, reduced=True, guard_reason="raster_q3")
        return result

    with patch.object(mesh, "mesh_warp", side_effect=rejected_once):
        actual = gender.render_targets(image, points, 33)
    assert actual.info["sparse_fallback"] is True
    assert len(calls) >= 2
    assert set(calls) == {(240, 240)}
    assert actual.checks["full_resolution_checked"] is True
    np.testing.assert_array_equal(actual.targets, expected.targets)
    np.testing.assert_array_equal(actual.image, expected.image)


def test_zero_and_disabled_regions_remain_identity_with_alpha() -> None:
    xyz, rgb = drawn_head(8, width=220, height=230)
    image = np.dstack([rgb, np.full(rgb.shape[:2], 255, dtype=np.uint8)])
    original = image.copy()
    for stop, factors in [(0, None), (-100, {name: 0.0 for name in gender.REGIONS})]:
        result = gender.render_targets(image, xyz[:, :2], stop, region_strengths=factors)
        np.testing.assert_array_equal(result.targets, xyz[:, :2])
        np.testing.assert_array_equal(result.image, original)
        assert result.info["effect_retention"] == 1.0
    np.testing.assert_array_equal(image, original)


def test_per_render_shape_cache_does_not_retain_mutable_results() -> None:
    xyz, image = drawn_head(1, width=210, height=224)
    first = gender.render_targets(image, xyz[:, :2], 33)
    target = first.targets.copy()
    pixels = first.image.copy()
    first.targets[:] = 0
    first.image[:] = 0
    second = gender.render_targets(image, xyz[:, :2], 33)
    np.testing.assert_array_equal(second.targets, target)
    np.testing.assert_array_equal(second.image, pixels)
    assert second.info["direction"] == "masculine"


def test_existing_quality_thresholds_and_bisection_depth_stay_fixed() -> None:
    assert gender.SEAM_LIMIT == 1.5
    assert gender.SEAM_MARGIN == 0.95
    assert gender.TRIANGLE_RATIO_MIN == 0.35
    assert gender.REGION_BISECTIONS == 4
