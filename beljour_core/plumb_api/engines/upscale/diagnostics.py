'Deterministic quality diagnostics for the R17B classical upscaler. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .metrics import psnr, ssim_proxy
from .ringing import overshoot_fraction


@dataclass(frozen=True)
class DiagnosticReport:
    scale: int
    psnr: float
    ssim: float
    ringing: float
    alpha_exact: bool
    finite: bool
    passed: bool
    label: str = 'synthetic diagnostic; not real-face evidence'

def evaluate(reference: np.ndarray, candidate: np.ndarray, scale: int) -> DiagnosticReport:
    _validate_pair(reference, candidate, scale)
    rgb_ref = reference[..., :3]
    rgb_candidate = candidate[..., :3]
    score_psnr = float(psnr(rgb_ref, rgb_candidate))
    score_ssim = float(ssim_proxy(rgb_ref, rgb_candidate))
    ringing = float(overshoot_fraction(rgb_candidate))
    alpha_exact = _alpha_exact(reference, candidate)
    finite = bool(np.isfinite(score_psnr) and np.isfinite(score_ssim) and np.isfinite(ringing))
    passed = finite and score_ssim >= 0.8 and (ringing <= 0.16) and alpha_exact
    return DiagnosticReport(scale, score_psnr, score_ssim, ringing, alpha_exact, finite, passed)

def compare_to_baseline(reference: np.ndarray, candidate: np.ndarray, baseline: np.ndarray, scale: int) -> dict[str, float | bool | str]:
    ours = evaluate(reference, candidate, scale)
    other = evaluate(reference, baseline, scale)
    return {'scale': scale, 'psnr_gain': ours.psnr - other.psnr, 'ssim_gain': ours.ssim - other.ssim, 'ringing_delta': ours.ringing - other.ringing, 'beats_psnr': ours.psnr > other.psnr, 'beats_ssim': ours.ssim > other.ssim, 'ringing_ok': ours.ringing <= 0.16, 'label': 'synthetic baseline comparison'}

def _validate_pair(reference: np.ndarray, candidate: np.ndarray, scale: int) -> None:
    if scale not in {2, 4}:
        raise ValueError('scale must be 2 or 4')
    if reference.dtype != np.uint8 or candidate.dtype != np.uint8:
        raise ValueError('diagnostic images must be uint8')
    if reference.shape != candidate.shape:
        raise ValueError('diagnostic images must have identical shapes')
    if reference.ndim != 3 or reference.shape[2] not in {3, 4}:
        raise ValueError('diagnostic images must be RGB or RGBA')

def _alpha_exact(reference: np.ndarray, candidate: np.ndarray) -> bool:
    if reference.shape[2] == 3:
        return True
    return bool(np.array_equal(reference[..., 3], candidate[..., 3]))
