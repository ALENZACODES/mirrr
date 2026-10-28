'Classical upscale quality sweeps across synthetic structures. Author: John Khan.'
from __future__ import annotations

from collections.abc import Iterable
from dataclasses import asdict, dataclass

import numpy as np

from .engine import upscale
from .metrics import psnr, ringing_score, ssim_proxy
from .reference import downsample_box, resize_image


@dataclass(frozen=True)
class SweepCase:
    name: str
    scale: int
    ours_psnr: float
    baseline_psnr: float
    ours_ssim: float
    baseline_ssim: float
    ringing: float
    passed: bool

def _canvas(kind: str, size: int=64) -> np.ndarray:
    yy, xx = np.mgrid[:size, :size]
    image = np.zeros((size, size, 3), dtype=np.uint8)
    if kind == 'diagonal':
        edge = (xx > yy).astype(float)
        image[..., 0] = 55 + edge * 140
        image[..., 1] = 45 + edge * 115
        image[..., 2] = 50 + edge * 90
    elif kind == 'checker':
        tile = ((xx // 4 + yy // 4) % 2).astype(float)
        image[..., 0] = 60 + tile * 110
        image[..., 1] = 55 + tile * 90
        image[..., 2] = 50 + tile * 70
    elif kind == 'rings':
        radius = np.hypot(xx - size / 2, yy - size / 2)
        wave = 0.5 + 0.5 * np.sin(radius * 0.75)
        image[..., 0] = 50 + wave * 130
        image[..., 1] = 55 + wave * 100
        image[..., 2] = 65 + wave * 80
    elif kind == 'hairlike':
        wave = 0.5 + 0.5 * np.sin(xx * 0.9 + 0.6 * np.sin(yy * 0.35))
        gradient = yy / max(size - 1, 1)
        image[..., 0] = 45 + wave * 65 + gradient * 25
        image[..., 1] = 35 + wave * 52 + gradient * 20
        image[..., 2] = 30 + wave * 40 + gradient * 15
    elif kind == 'skinlike':
        texture = 3 * np.sin(xx * 0.55) + 2 * np.cos(yy * 0.47) + 1.5 * np.sin((xx + yy) * 0.31)
        image[..., 0] = 125 + texture
        image[..., 1] = 87 + texture * 0.8
        image[..., 2] = 73 + texture * 0.7
    else:
        raise ValueError('unknown synthetic structure')
    return np.clip(np.rint(image), 0, 255).astype(np.uint8)

def evaluate_case(name: str, scale: int) -> SweepCase:
    truth = _canvas(name)
    low = downsample_box(truth, scale)
    ours = upscale(low, scale=scale, detail=0.45)
    baseline = resize_image(low, scale)
    target = truth[:ours.shape[0], :ours.shape[1]]
    op = psnr(target, ours)
    bp = psnr(target, baseline)
    os = ssim_proxy(target, ours)
    bs = ssim_proxy(target, baseline)
    ring = ringing_score(ours)
    return SweepCase(name, scale, op, bp, os, bs, ring, op >= bp and os >= bs and (ring <= 0.55))

def sweep(scales: Iterable[int]=(2, 4)) -> tuple[SweepCase, ...]:
    rows: list[SweepCase] = []
    for scale in scales:
        if scale not in (2, 4):
            raise ValueError('scale must be 2 or 4')
        for name in ('diagonal', 'checker', 'rings', 'hairlike', 'skinlike'):
            rows.append(evaluate_case(name, scale))
    return tuple(rows)

def summary(rows: tuple[SweepCase, ...]) -> dict[str, object]:
    if not rows:
        raise ValueError('quality sweep is empty')
    return {'count': len(rows), 'passed': sum(row.passed for row in rows), 'failed': sum(not row.passed for row in rows), 'psnr_margin_mean': sum(row.ours_psnr - row.baseline_psnr for row in rows) / len(rows), 'ssim_margin_mean': sum(row.ours_ssim - row.baseline_ssim for row in rows) / len(rows), 'ringing_max': max(row.ringing for row in rows), 'rows': [asdict(row) for row in rows]}
