'R17B classical upscale pipeline, tiling and quality tests. Author: John Khan.'
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.upscale import upscale
from plumb_api.engines.upscale.benchmark import PASS_DEFINITION
from plumb_api.engines.upscale.pipeline import budget_report, run, validate_input
from plumb_api.engines.upscale.reference import synthetic_detail
from plumb_api.engines.upscale.tiling import memory_budget, plan, recommended_tile_side, seam_error, upscale_tiled

def rgba(width: int=96, height: int=80) -> np.ndarray:
    yy, xx = np.mgrid[:height, :width]
    image = np.zeros((height, width, 4), dtype=np.uint8)
    image[..., 0] = np.clip(40 + xx * 140 / width + 15 * np.sin(yy / 5), 0, 255)
    image[..., 1] = np.clip(35 + yy * 120 / height + 11 * np.cos(xx / 7), 0, 255)
    image[..., 2] = np.clip(55 + (xx + yy) * 70 / (width + height), 0, 255)
    image[..., 3] = 255
    return image

def test_tile_plan_covers_entire_image_once_at_core() -> None:
    width, height = (913, 701)
    tiles = plan(width, height, 256, 12)
    coverage = np.zeros((height, width), dtype=np.int16)
    for tile in tiles:
        coverage[tile.y0:tile.y1, tile.x0:tile.x1] += 1
    assert np.all(coverage == 1)

def test_tile_plan_read_regions_contain_core() -> None:
    for tile in plan(1031, 811, 256, 12):
        assert tile.read_x0 <= tile.x0 < tile.x1 <= tile.read_x1
        assert tile.read_y0 <= tile.y0 < tile.y1 <= tile.read_y1
        assert tile.width > 0
        assert tile.height > 0

def test_tile_plan_has_overlap_at_internal_boundaries() -> None:
    tiles = plan(600, 500, 256, 12)
    internal = [tile for tile in tiles if tile.x0 > 0 or tile.y0 > 0]
    assert internal
    assert all((tile.read_x0 < tile.x0 or tile.read_y0 < tile.y0 for tile in internal))

@pytest.mark.parametrize('tile_side', [64, 128, 256, 512, 1024])
def test_memory_budget_is_positive_and_monotone_with_scale(tile_side: int) -> None:
    two = memory_budget(tile_side, 12, 2)
    four = memory_budget(tile_side, 12, 4)
    assert two['peak_bytes_estimate'] > 0
    assert four['peak_bytes_estimate'] > two['peak_bytes_estimate']
    assert two['working_bytes_estimate'] > two['input_bytes']

def test_memory_budget_rejects_bad_scale() -> None:
    with pytest.raises(ValueError):
        memory_budget(256, 12, 3)

def test_memory_budget_rejects_bad_channels() -> None:
    with pytest.raises(ValueError):
        memory_budget(256, 12, 2, channels=5)

def test_recommended_tile_side_respects_smaller_budget() -> None:
    generous = recommended_tile_side(1800, 1400, 4, max_peak_mb=160)
    tight = recommended_tile_side(1800, 1400, 4, max_peak_mb=32)
    assert tight <= generous
    assert 128 <= tight <= 1024

def test_recommended_tile_side_rejects_tiny_budget() -> None:
    with pytest.raises(ValueError):
        recommended_tile_side(1000, 1000, 4, max_peak_mb=4)

def test_tiled_upscale_matches_shape_of_full_upscale() -> None:
    source = rgba(72, 68)
    full = upscale(source, scale=2, detail=0.55)
    tiled = upscale_tiled(source, scale=2, detail=0.55, tile_side=64, overlap=12)
    assert tiled.shape == full.shape == (136, 144, 4)

def test_tiled_upscale_preserves_opaque_alpha() -> None:
    source = rgba(36, 32)
    tiled = upscale_tiled(source, scale=4, detail=0.55, tile_side=64, overlap=12)
    assert np.all(tiled[..., 3] == 255)

def test_tiled_upscale_seams_are_close_to_full_frame() -> None:
    source = rgba(72, 68)
    tiles = plan(source.shape[1], source.shape[0], 64, 12)
    full = upscale(source, scale=2, detail=0.55)
    tiled = upscale_tiled(source, scale=2, detail=0.55, tile_side=64, overlap=12)
    error = seam_error(full, tiled, tiles, 2)
    assert error['mean'] < 2.5
    assert error['p99'] < 12

def test_seam_error_zero_for_identical_frames() -> None:
    source = rgba(64, 64)
    output = upscale(source, scale=2, detail=0.55)
    error = seam_error(output, output.copy(), plan(64, 64, 64, 12), 2)
    assert error == {'mean': 0.0, 'max': 0.0, 'p99': 0.0}

def test_pipeline_full_mode_for_small_image() -> None:
    source = rgba(40, 36)
    output, report = run(source, scale=2, detail=0.55, tiled_threshold_pixels=1000000)
    assert output.shape == (72, 80, 4)
    assert report.mode == 'full'
    assert report.tile_side is None
    assert report.alpha_exact is True
    assert 'no neural weights' in report.label

def test_pipeline_tiled_mode_when_threshold_is_forced_low() -> None:
    source = rgba(72, 68)
    output, report = run(source, scale=2, detail=0.55, tiled_threshold_pixels=1)
    assert output.shape == (136, 144, 4)
    assert report.mode == 'tiled'
    assert report.tile_side is not None
    assert report.alpha_exact is True

def test_pipeline_repair_stage_runs_before_upscale() -> None:
    source = rgba(40, 36)
    seen: list[tuple[int, int, int]] = []

    def repair(image: np.ndarray) -> np.ndarray:
        seen.append(image.shape)
        result = image.copy()
        result[..., :3] = np.clip(result[..., :3].astype(int) - 1, 0, 255).astype(np.uint8)
        return result
    output, report = run(source, scale=2, repair=repair)
    assert seen == [source.shape]
    assert output.shape[:2] == (source.shape[0] * 2, source.shape[1] * 2)
    assert report.input_shape == source.shape

def test_pipeline_rejects_repair_shape_change() -> None:
    source = rgba(40, 36)

    def bad(image: np.ndarray) -> np.ndarray:
        return image[:-1]
    with pytest.raises(ValueError):
        run(source, scale=2, repair=bad)

def test_pipeline_rejects_repair_dtype_change() -> None:
    source = rgba(40, 36)

    def bad(image: np.ndarray) -> np.ndarray:
        return image.astype(np.float32)
    with pytest.raises(ValueError):
        run(source, scale=2, repair=bad)

@pytest.mark.parametrize('scale', [2, 4])
def test_pipeline_scale_contract(scale: int) -> None:
    source = rgba(40, 36)
    output, report = run(source, scale=scale)
    assert output.shape[0] == source.shape[0] * scale
    assert output.shape[1] == source.shape[1] * scale
    assert report.scale == scale

def test_validate_input_rejects_invalid_scale() -> None:
    with pytest.raises(ValueError):
        validate_input(rgba(), 3, 0.5)

def test_validate_input_rejects_invalid_detail() -> None:
    with pytest.raises(ValueError):
        validate_input(rgba(), 2, 1.1)

def test_validate_input_rejects_non_uint8() -> None:
    with pytest.raises(ValueError):
        validate_input(rgba().astype(np.float32), 2, 0.5)

def test_budget_report_is_honest_estimate() -> None:
    report = budget_report(4032, 3024, 4)
    assert report['mode'] == 'tiled'
    assert 128 <= int(report['recommended_tile_side']) <= 1024
    assert 'estimate' in str(report['note'])

def test_pass_definition_names_psnr_ssim_and_ringing() -> None:
    text = PASS_DEFINITION.lower()
    assert 'psnr' in text
    assert 'ssim' in text
    assert 'ringing' in text
    assert 'neural' not in text

def test_classical_quality_target_fixture_is_deterministic() -> None:
    a = synthetic_detail(80, 96)
    b = synthetic_detail(80, 96)
    assert np.array_equal(a, b)

def test_output_is_deterministic_for_same_input() -> None:
    source = rgba(40, 36)
    first, _ = run(source, scale=2, detail=0.63)
    second, _ = run(source, scale=2, detail=0.63)
    assert np.array_equal(first, second)
