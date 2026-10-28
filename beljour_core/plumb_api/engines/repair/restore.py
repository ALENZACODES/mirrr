"""LS6 steps 3-4 and the one-tap pipeline (plan §8.3, M1, M2, M4, M7).

* Deblur fallback (until LS8 clears NAFNet): unsharp mask on luma with halo control.
  The detail layer is luma minus a Gaussian of the estimated blur sigma (along one axis
  for motion blur that runs close to horizontal or vertical); the boosted luma is clamped
  to the 3 x 3 neighbourhood's range plus a small margin, so edges sharpen without bright
  or dark rims.
* R12 condition gate: normal photos keep their pixels, including in Low light mode.
  Noise, blur, low illumination and faded-scan evidence enable only their own steps.
* Exposure is bounded at 1.65x linear gain with a highlight shoulder, then measured
  against the existing mean-change and clipping limits. No automatic grey-world
  correction without a trusted neutral reference, and no skin-tone classification.
* Modes set strengths within those gates. Every stage can still be switched off.
Every factor here is ASSUMED until LS6 runs on released photos.
Mirrored in web/src/engines/local/enhance.ts. Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ..core.composite import decode, encode
from ..core.filters import convolve
from .analyse import Analysis, analyse, gaussian_kernel
from .condition import PhotoCondition, classify_photo, plan_rescue
from .denoise import denoise, from_ycc, to_ycc
from .face_tone import face_weights, metered_luminance
from .safety import MAX_EXPOSURE_GAIN, bounded_exposure, guard_output, restore_faded_contrast

Floats = NDArray[np.float64]
U8 = NDArray[np.uint8]
HALO_MARGIN = 0.02
AXIS_TOLERANCE = 22.5
STEPS = ("white_balance", "exposure", "denoise", "deblur", "sharpen", "colour")
MODES: dict[str, dict[str, float]] = {
    "natural": {"denoise": 1.0, "sharpen": 0.6, "exposure_target": 0.18, "exposure_weight": 0.5, "wb_weight": 0.7, "saturation": 1.0},
    "portrait": {"denoise": 1.2, "sharpen": 0.4, "exposure_target": 0.2, "exposure_weight": 0.5, "wb_weight": 0.7, "saturation": 0.95},
    "low_light": {"denoise": 1.3, "sharpen": 0.3, "exposure_target": 0.18, "exposure_weight": 0.9, "wb_weight": 0.8, "saturation": 1.0},
    "backlit": {"denoise": 1.0, "sharpen": 0.5, "exposure_target": 0.22, "exposure_weight": 0.8, "wb_weight": 0.6, "saturation": 1.0},
    "vivid": {"denoise": 0.9, "sharpen": 0.8, "exposure_target": 0.18, "exposure_weight": 0.5, "wb_weight": 0.7, "saturation": 1.15},
}
LABEL = "Local enhancement on this photo; no detail is invented."


def _neighbour_range(plane: Floats) -> tuple[Floats, Floats]:
    h, w = plane.shape
    pad = np.pad(plane, 1, mode="edge")
    stack = np.stack([pad[1 + dy:1 + dy + h, 1 + dx:1 + dx + w]
                      for dy in (-1, 0, 1) for dx in (-1, 0, 1)], axis=0)
    return np.min(stack, axis=0), np.max(stack, axis=0)


def unsharp(image: np.ndarray, sigma: float, amount: float, *, direction: float | None = None) -> U8:
    """Unsharp mask on luma with halo control; `direction` (degrees) blurs along one axis."""
    if not (math.isfinite(amount) and 0 <= amount <= 3):
        raise ValueError("amount must be 0..3")
    y, cb, cr = to_ycc(image)
    k = gaussian_kernel(min(max(sigma, 0.6), 4.0))
    if direction is not None and abs(direction) <= AXIS_TOLERANCE:
        soft = convolve(y, k, 1)
    elif direction is not None and abs(abs(direction) - 90) <= AXIS_TOLERANCE:
        soft = convolve(y, k, 0)
    else:
        soft = convolve(convolve(y, k, 0), k, 1)
    boosted = y + amount * (y - soft)
    lo, hi = _neighbour_range(y)
    out = np.clip(boosted, lo - HALO_MARGIN, hi + HALO_MARGIN)
    return from_ycc(out, cb, cr)


def tone(image: np.ndarray, a: Analysis, *, wb_weight: float, exposure_target: float, exposure_weight: float,
         saturation: float = 1.0, white_balance: bool = True, exposure: bool = True,
         face_mask: object | None = None) -> U8:
    """Tone with optional measured face exposure and a rounded-output L* cap.

    The mask meters luminance, never a neutral white-balance reference. Automatic
    Enhance still uses its condition plan and does not enable grey-world correction.
    """
    lin = decode(image)
    weights = face_weights(face_mask, lin.shape[:2]) if face_mask is not None else None
    gains = np.ones(3)
    if white_balance:
        raw = np.clip(np.array(a.grey_gains), 0.5, 2.0)
        raw = raw / (0.2126 * raw[0] + 0.7152 * raw[1] + 0.0722 * raw[2])
        gains = 1 + wb_weight * (raw - 1)
    lin = lin * gains[None, None, :]
    if exposure:
        mean = metered_luminance(lin, weights)
        gain = min(MAX_EXPOSURE_GAIN, max(0.25, exposure_target / max(mean, 1e-6)))
        lin = lin * (1 + exposure_weight * (gain - 1))
    if saturation != 1.0:
        lum = (0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2])[..., None]
        lin = lum + saturation * (lin - lum)
    return guard_output(image, encode(np.clip(lin, 0.0, 1.0)), face_mask=weights).image


@dataclass(frozen=True)
class Enhanced:
    image: U8
    before: Analysis
    after: Analysis
    steps: dict[str, Any] = field(default_factory=dict)
    label: str = LABEL
    condition: PhotoCondition | None = None
    safety: dict[str, Any] = field(default_factory=dict)


def enhance(image: np.ndarray, mode: str = "natural", *, strength: float = 1.0,
            steps: dict[str, bool] | None = None, method: str = "auto",
            face_mask: object | None = None) -> Enhanced:
    """Classify, then rescue measured defects. A mode cannot override the condition gate."""
    if mode not in MODES:
        raise ValueError(f"mode must be one of {', '.join(MODES)}")
    source = np.asarray(image)
    before = analyse(source)
    weights = face_weights(face_mask, source.shape[:2]) if face_mask is not None else None
    condition = classify_photo(source, before)
    plan = plan_rescue(condition, mode, strength, steps)
    if method not in ("auto", "none", "guided", "bilateral", "nlm"):
        raise ValueError("unknown denoise method")
    img = source[..., :3].copy()
    p = MODES.get(plan.effective_mode, MODES["natural"])
    log: dict[str, Any] = {"mode": mode, "strength": strength, "condition": condition.primary,
                           "effective_mode": plan.effective_mode, "exposure_applied": False,
                           "tone_applied": False, "normal_preserved": condition.primary == "normal"}
    if plan.denoise:
        img, used = denoise(img, before.noise_sigma, method=method, strength=p["denoise"] * strength)
        log["denoise"] = used
    if plan.deblur:
        direction = before.motion_degrees if before.blur_type == "motion" else None
        img = unsharp(img, before.blur_sigma, 1.2 * strength, direction=direction)
        log["deblur"] = f"unsharp ({before.blur_type})"
    if plan.exposure:
        exposure_result = bounded_exposure(img, target=p["exposure_target"], weight=p["exposure_weight"] * strength,
                                           face_mask=weights)
        img = exposure_result.image
        log.update({"exposure_applied": True, "tone_applied": True,
                    "exposure_gain": round(exposure_result.applied_gain, 8),
                    "highlight_pixels_protected": exposure_result.rolled_off_pixels})
    if plan.fade:
        img = restore_faded_contrast(img, strength)
        log.update({"fade_contrast": True, "tone_applied": True})
    safe = guard_output(source, img, face_mask=weights)
    log["output_mix"] = round(safe.applied_mix, 8)
    img = safe.image
    if safe.face_tone is not None:
        log.update({"face_metering": "supplied_face_mask", "skin_lstar_max_rise": safe.face_tone.max_rise})
    if source.shape[2] == 4:
        img = np.dstack((img, source[..., 3]))
    log["unchanged"] = bool(np.array_equal(img, source))
    return Enhanced(img, before, analyse(img), log, LABEL, condition,
                    {**safe.to_json(), "plan": plan.to_json()})
