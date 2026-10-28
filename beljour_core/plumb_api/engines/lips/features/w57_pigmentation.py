'W57 real-lip-pigmentation-aware colour preview. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from ..geometry import lip_mask
from ..pigmentation import analyse, disclosure, opacity_map


@dataclass(frozen=True)
class Result:
    image: np.ndarray
    luminance_range: float
    mean_luminance: float
    adaptive_opacity: bool
    passed: bool
    disclosures: tuple[str, ...]

def preview(photo: np.ndarray, points: np.ndarray, colour: tuple[int, int, int]=(148, 55, 76), amount: float=0.6) -> Result:
    mask = lip_mask(photo.shape[0], photo.shape[1], points)
    stats = analyse(photo, mask)
    op = opacity_map(mask, stats, amount)
    out = photo.copy()
    target = np.asarray(colour, np.float32)
    rgb = photo[..., :3].astype(np.float32)
    alpha = op[..., None]
    out[..., :3] = np.clip(rgb * (1 - alpha) + target * alpha, 0, 255).astype(np.uint8)
    passed = bool(np.all(op[mask <= 0] == 0))
    return Result(out, max(stats.side_delta, stats.vertical_delta), float(sum(stats.mean_rgb) / 3.0), True, passed, tuple(disclosure(stats)))

def pass_definition() -> str:
    return 'adaptive opacity responds only inside lips and never treats natural pigmentation as a defect'
