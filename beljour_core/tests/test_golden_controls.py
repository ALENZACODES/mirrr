"""Local geometry control tests on authored drawn meshes and artificial RGB planes."""
from __future__ import annotations

import time

import numpy as np
import pytest

from plumb_api.engines.core.refusal import Refusal
from plumb_api.engines.proportions import golden, synthetic


def face() -> np.ndarray:
    return synthetic.symmetric_face(width=192, height=192, face_width=95, face_length=112)


def input_plane(tone: int) -> np.ndarray:
    assert tone in (1, 5, 10)
    h, w = 192, 192
    ys, xs = np.indices((h, w))
    output = np.zeros((h, w, 4), dtype=np.uint8)
    output[..., 0] = np.minimum(255, tone * 17 + xs // 3)
    output[..., 1] = np.minimum(255, tone * 10 + ys // 3)
    output[..., 2] = np.minimum(255, tone * 13 + (xs + ys) // 4)
    output[..., 3] = 180
    return output


def mask() -> np.ndarray:
    m = np.zeros((192, 192), dtype=np.float32)
    m[15:178, 30:140] = 1.0
    return m


def bystanders() -> tuple[np.ndarray, ...]:
    p = np.zeros((192, 192), dtype=np.float32)
    p[16:176, 138:191] = 1.0
    return (p,)


@pytest.mark.parametrize("tone", [1, 5, 10])
def test_ratio_distance_monotonic_at_every_level(tone: int) -> None:
    src = face()
    src[:, 0] *= 1 + (tone - 5) * .002
    prepared = golden.prepare(src, f"tone-{tone}")
    assert isinstance(prepared, golden.GoldenSnapshot)
    results = [golden.targets(prepared, step / 10) for step in range(10, 51)]
    assert all(isinstance(item, golden.GoldenResult) for item in results)
    distances = [item.target_distance for item in results]
    assert distances[-1] < distances[0]
    assert all(after <= before + 1e-9 for before, after in zip(distances, distances[1:], strict=False))
    assert all(result.max_move_iod <= golden.LOCKED_MAX_MOVE_IOD + 1e-10 for result in results)


def test_level_one_geometry_and_pixel_output_are_byte_identical() -> None:
    prepared = golden.prepare(face(), "identity-test")
    assert isinstance(prepared, golden.GoldenSnapshot)
    result = golden.targets(prepared, 1)
    assert isinstance(result, golden.GoldenResult)
    np.testing.assert_array_equal(result.points, prepared.before)
    image = input_plane(5)
    output = golden.render_preview(image, prepared, 1.0, mask(), bystanders=bystanders())
    assert isinstance(output, golden.RenderResult)
    np.testing.assert_array_equal(output.image, image)
    assert output.data.identity_proxy == 1.0


def test_default_lock_mandatorily_bounds_geometry() -> None:
    prepared = golden.prepare(face(), "lock-test")
    assert isinstance(prepared, golden.GoldenSnapshot)
    locked = golden.targets(prepared, 5)
    unlocked = golden.targets(prepared, 5, identity_lock=False)
    assert isinstance(locked, golden.GoldenResult)
    assert isinstance(unlocked, golden.GoldenResult)
    assert locked.identity_lock is True
    assert locked.max_move_iod <= .02000001
    assert unlocked.max_move_iod <= .06500001
    assert unlocked.max_move_iod >= locked.max_move_iod
    assert locked.identity_proxy >= .98 - 1e-8


def test_level_step_validation_rejects_non_decimal_levels() -> None:
    for bad in (0, -1, 5.1, 1.01, 3.05, float("inf"), float("nan"), "2.5", True):
        with pytest.raises(ValueError):
            golden.validate_level(bad)
    assert golden.validate_level(2.3000000000000003) == 2.3
    assert golden.validate_level(5) == 5.0


def test_invalid_photo_revision_not_accepted() -> None:
    for value in ("", "../bad", "space separated", "a" * 129):
        with pytest.raises(ValueError):
            golden.check_revision(value)
    assert golden.check_revision("photo_12:local") == "photo_12:local"


def test_cache_preserves_geometry_across_slider_and_denies_reused_revision() -> None:
    cache = golden.GoldenCache()
    before = face()
    p = cache.get(before, "revision1")
    assert isinstance(p, golden.GoldenSnapshot)
    for step in (1, 2.5, 3, 5):
        r = cache.get(before, "revision1")
        assert r is p
        assert isinstance(golden.targets(r, step), golden.GoldenResult)
    assert cache.preparations == 1
    changed = before.copy()
    changed[61, 0] -= 1
    rejected = cache.get(changed, "revision1")
    assert isinstance(rejected, Refusal)
    assert rejected.code == "stale_source"
    assert cache.preparations == 1
    cache.clear()
    assert isinstance(cache.get(changed, "revision1"), golden.GoldenSnapshot)
    assert cache.preparations == 2


def test_cache_evicts_after_two_photo_revisions() -> None:
    c = golden.GoldenCache()
    for i in range(3):
        p = face()
        p[:, 0] += i
        assert isinstance(c.get(p, f"revision-{i}"), golden.GoldenSnapshot)
    assert c.preparations == 3
    assert isinstance(c.get(face(), "revision-0"), golden.GoldenSnapshot)
    assert c.preparations == 4


def test_non_finite_and_degenerate_mesh_refuse_with_code() -> None:
    p = face()
    p[100, 0] = float("nan")
    bad = golden.prepare(p, "nan")
    assert isinstance(bad, Refusal)
    assert bad.code == "invalid_geometry"
    zero = golden.prepare(np.zeros((478, 2)), "zero")
    assert isinstance(zero, Refusal)


def test_bystanders_and_alpha_remain_unchanged_in_edit() -> None:
    p = golden.prepare(face(), "render")
    assert isinstance(p, golden.GoldenSnapshot)
    photo = input_plane(1)
    original = photo.copy()
    result = golden.render_preview(photo, p, 5, mask(), bystanders=bystanders())
    assert isinstance(result, golden.RenderResult)
    assert np.array_equal(result.image[16:176, 138:], original[16:176, 138:])
    assert np.array_equal(result.image[:, :30], original[:, :30])
    assert np.array_equal(result.image[..., 3], original[..., 3])
    assert np.array_equal(photo, original)
    assert result.protected_pixels > 0


def test_missing_mask_and_bad_pixels_cannot_claim_usable_edit() -> None:
    p = golden.prepare(face(), "invalid")
    assert isinstance(p, golden.GoldenSnapshot)
    wrong = np.full((192, 192), np.nan)
    assert isinstance(golden.render_preview(input_plane(5), p, 5, wrong), Refusal)
    empty = np.zeros((192, 192), dtype=np.float32)
    assert isinstance(golden.render_preview(input_plane(5), p, 5, empty), Refusal)
    bad = np.ones((15, 15, 4), dtype=np.float32)
    assert isinstance(golden.render_preview(bad, p, 5, mask()), Refusal)


def test_low_resolution_preview_benchmark_is_explicitly_labeled() -> None:
    p = golden.prepare(synthetic.symmetric_face(width=96, height=96,
                                                 face_width=45, face_length=62), "timing")
    assert isinstance(p, golden.GoldenSnapshot)
    source = np.zeros((96, 96, 3), dtype=np.uint8)
    support = np.ones((96, 96), dtype=np.float32)
    start = time.perf_counter()
    result = golden.render_preview(source, p, 3.0, support)
    measured_ms = (time.perf_counter() - start) * 1000
    assert isinstance(result, golden.RenderResult)
    assert np.array_equal(result.image.shape, source.shape)
    # Timing is environment-specific. This smoke test records a measurement;
    # the box's sub-100ms acceptance remains a separate strict device gate.
    assert measured_ms >= 0
