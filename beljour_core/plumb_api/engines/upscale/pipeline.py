'Post-repair classical upscale pipeline contracts and diagnostics. Author: John Khan.'
from __future__ import annotations

import time
from collections.abc import Callable
from dataclasses import dataclass

import numpy as np

from .engine import upscale
from .tiling import recommended_tile_side, upscale_tiled


@dataclass(frozen=True)
class UpscaleReport:
    scale: int
    detail: float
    input_shape: tuple[int, int, int]
    output_shape: tuple[int, int, int]
    mode: str
    tile_side: int | None
    elapsed_ms: float
    alpha_exact: bool
    label: str

def validate_input(image: np.ndarray, scale: int, detail: float) -> None:
    if image.dtype != np.uint8 or image.ndim != 3 or image.shape[2] not in (3, 4):
        raise ValueError('image must be RGB/RGBA uint8')
    if min(image.shape[:2]) < 8:
        raise ValueError('image is too small for edge-directed upscale')
    if scale not in (2, 4):
        raise ValueError('scale must be 2 or 4')
    if not np.isfinite(detail) or detail < 0 or detail > 1:
        raise ValueError('detail must be 0..1')

def expected_alpha(image: np.ndarray, scale: int) -> np.ndarray | None:
    if image.shape[2] != 4:
        return None
    alpha = image[..., 3:4]
    repeated = np.repeat(np.repeat(alpha, scale, axis=0), scale, axis=1)
    return repeated[..., 0]

def run(image: np.ndarray, *, scale: int=2, detail: float=0.55, tiled_threshold_pixels: int=1200000, repair: Callable[[np.ndarray], np.ndarray] | None=None) -> tuple[np.ndarray, UpscaleReport]:
    validate_input(image, scale, detail)
    source = image.copy()
    if repair is not None:
        repaired = repair(source.copy())
        if repaired.shape != source.shape or repaired.dtype != np.uint8:
            raise ValueError('repair stage changed shape or dtype')
        source = repaired
    started = time.perf_counter()
    pixels = source.shape[0] * source.shape[1]
    tile_side: int | None = None
    if pixels > tiled_threshold_pixels:
        tile_side = recommended_tile_side(source.shape[1], source.shape[0], scale)
        output = upscale_tiled(source, scale=scale, detail=detail, tile_side=tile_side)
        mode = 'tiled'
    else:
        output = upscale(source, scale=scale, detail=detail)
        mode = 'full'
    elapsed_ms = (time.perf_counter() - started) * 1000.0
    alpha_exact = True
    if source.shape[2] == 4 and np.all(source[..., 3] == source[0, 0, 3]):
        alpha_exact = bool(np.all(output[..., 3] == source[0, 0, 3]))
    report = UpscaleReport(scale=scale, detail=detail, input_shape=(int(source.shape[0]), int(source.shape[1]), int(source.shape[2])), output_shape=(int(output.shape[0]), int(output.shape[1]), int(output.shape[2])), mode=mode, tile_side=tile_side, elapsed_ms=elapsed_ms, alpha_exact=alpha_exact, label='classical edge-directed upscale after optional local repair; no neural weights')
    return (output, report)

def budget_report(width: int, height: int, scale: int) -> dict[str, int | str]:
    tile = recommended_tile_side(width, height, scale)
    return {'width': width, 'height': height, 'scale': scale, 'recommended_tile_side': tile, 'mode': 'tiled' if width * height > 1200000 else 'full', 'note': 'estimate only; browser and Python allocations differ'}
