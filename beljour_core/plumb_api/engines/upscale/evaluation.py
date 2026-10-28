'Objective upscale comparison report. Author: John Khan.'
from __future__ import annotations

from dataclasses import asdict, dataclass

import numpy as np

from .engine import upscale
from .metrics import psnr, ringing_score, ssim_proxy
from .reference import downsample_box, resize_image, synthetic_detail


@dataclass(frozen=True)
class UpscaleReport:
    scale: int
    ours_psnr: float
    baseline_psnr: float
    ours_ssim: float
    baseline_ssim: float
    ringing: float
    passed: bool

def evaluate(scale: int=2) -> UpscaleReport:
    truth = synthetic_detail(64, 64)
    low = downsample_box(truth, scale)
    ours = upscale(low, scale, 0.45)
    baseline = resize_image(low, scale)
    target = truth[:ours.shape[0], :ours.shape[1]]
    op = psnr(target, ours)
    bp = psnr(target, baseline)
    os = ssim_proxy(target, ours)
    bs = ssim_proxy(target, baseline)
    ring = ringing_score(ours)
    return UpscaleReport(scale, op, bp, os, bs, ring, op >= bp and os >= bs and (ring <= 0.55))

def to_json(report: UpscaleReport) -> dict[str, float | int | bool]:
    return asdict(report)

@dataclass(frozen=True)
class PairReport:
    psnr: float
    ssim: float
    ringing: float
    passed: bool

def evaluate_pair(reference: np.ndarray, candidate: np.ndarray) -> PairReport:
    """Score a checked high-resolution target against one candidate output."""
    if reference.shape != candidate.shape:
        raise ValueError('reference and candidate shapes must match')
    if reference.dtype != np.uint8 or candidate.dtype != np.uint8:
        raise ValueError('reference and candidate must be uint8')
    value_psnr = psnr(reference, candidate)
    value_ssim = ssim_proxy(reference, candidate)
    value_ringing = ringing_score(candidate)
    passed = value_psnr >= 24.0 and value_ssim >= 0.7 and (value_ringing <= 0.55)
    return PairReport(value_psnr, value_ssim, value_ringing, passed)
