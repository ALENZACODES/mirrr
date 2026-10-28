'W77-W82 complexion preview strategies. Author: John Khan.'

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass

import numpy as np

from .colorimetry import cast_score, compare_regions, preserve_lightness_target, robust_region_colour
from .masking import alpha_composite, feather, outside_change_fraction, validate_mask


@dataclass(frozen=True)
class TintPlan:
    target_rgb: tuple[int, int, int]
    opacity: float
    coverage_name: str
    preserves_texture: bool
    warning: str

@dataclass(frozen=True)
class TanPlan:
    target_rgb: tuple[int, int, int]
    opacity: float
    style: str
    dry_zone_multiplier: float
    warning: str

@dataclass(frozen=True)
class CorrectionPlan:
    target_rgb: tuple[int, int, int]
    opacity: float
    reason: str
    diagnostic: bool = False

_TINT_OPACITY = {'sheer': 0.12, 'light': 0.2, 'medium': 0.3}

_TAN = {'light': ((164, 112, 79), 0.08, 0.78), 'medium': ((154, 101, 68), 0.14, 0.72), 'dark': ((141, 89, 57), 0.2, 0.66), 'olive': ((139, 111, 69), 0.13, 0.72)}

def tint_plan(base_rgb: tuple[int, int, int], requested_rgb: tuple[int, int, int], style: str, amount: float) -> TintPlan:
    if style not in _TINT_OPACITY:
        raise ValueError('unsupported tint style')
    if not 0 <= amount <= 1:
        raise ValueError('amount must be in [0,1]')
    target = preserve_lightness_target(base_rgb, requested_rgb, min(amount, 0.9))
    return TintPlan(target, _TINT_OPACITY[style] * amount, 'face', True, 'Sheer cosmetic simulation; it does not rate skin tone.')

def apply_tint(photo: np.ndarray, mask: np.ndarray, plan: TintPlan) -> np.ndarray:
    return alpha_composite(photo, plan.target_rgb, feather(validate_mask(mask), 3), plan.opacity)

def tan_plan(style: str, amount: float) -> TanPlan:
    if style not in _TAN:
        raise ValueError('unsupported tan style')
    if not 0 <= amount <= 1:
        raise ValueError('amount must be in [0,1]')
    colour, opacity, dry = _TAN[style]
    return TanPlan(colour, opacity * amount, style, dry, 'Cosmetic colour only; no health or UV-safety implication.')

def apply_tan(photo: np.ndarray, mask: np.ndarray, dry_mask: np.ndarray, plan: TanPlan) -> np.ndarray:
    base = validate_mask(mask)
    dry = validate_mask(dry_mask, base.shape)
    weighted = base * (1.0 - dry * (1.0 - plan.dry_zone_multiplier))
    return alpha_composite(photo, plan.target_rgb, feather(weighted, 2), plan.opacity)

def face_body_match(photo: np.ndarray, source_mask: np.ndarray, target_mask: np.ndarray, amount: float) -> tuple[np.ndarray, dict[str, float]]:
    if not 0 <= amount <= 1:
        raise ValueError('amount must be in [0,1]')
    source = robust_region_colour(photo, source_mask)
    before = compare_regions(photo, source_mask, target_mask)
    target_values = [int(round(v)) for v in source.rgb]
    target_rgb = (target_values[0], target_values[1], target_values[2])
    opacity = min(0.24, before.delta_e76 / 100.0) * amount
    out = alpha_composite(photo, target_rgb, feather(target_mask, 3), opacity)
    after = compare_regions(out, source_mask, target_mask)
    return (out, {'before_delta_e': before.delta_e76, 'after_delta_e': after.delta_e76, 'opacity': opacity})

def spf_cast_preview(photo: np.ndarray, mask: np.ndarray, style: str, amount: float) -> tuple[np.ndarray, dict[str, float | str]]:
    if style not in {'mineral_cast', 'tinted_cast', 'clear_finish'}:
        raise ValueError('unsupported cast style')
    strengths = {'mineral_cast': 0.28, 'tinted_cast': 0.1, 'clear_finish': 0.025}
    target = {'mineral_cast': (242, 244, 246), 'tinted_cast': (207, 173, 148), 'clear_finish': (238, 238, 236)}[style]
    before = cast_score(photo, mask)
    out = alpha_composite(photo, target, feather(mask, 2), strengths[style] * amount)
    after = cast_score(out, mask)
    return (out, {'style': style, 'visual_cast_before': before, 'visual_cast_after': after, 'efficacy_claim': 'none'})

def deeper_pigmentation_plan(style: str, amount: float) -> CorrectionPlan:
    choices = {'orange_corrector': (221, 112, 63), 'peach_corrector': (232, 145, 111), 'neutral_concealer': (181, 142, 120)}
    if style not in choices:
        raise ValueError('unsupported corrector')
    return CorrectionPlan(choices[style], min(0.58, 0.58 * amount), 'user-marked deeper pigmentation', False)

def redness_plan(style: str, amount: float) -> CorrectionPlan:
    choices = {'green_corrector': (157, 187, 144), 'neutral_tint': (180, 159, 141), 'low_coverage': (189, 171, 158)}
    if style not in choices:
        raise ValueError('unsupported redness correction')
    return CorrectionPlan(choices[style], min(0.46, 0.46 * amount), 'user-marked persistent redness appearance', False)

def apply_correction(photo: np.ndarray, mask: np.ndarray, plan: CorrectionPlan) -> np.ndarray:
    return alpha_composite(photo, plan.target_rgb, feather(mask, 2), plan.opacity)

def evaluate_locality(before: np.ndarray, after: np.ndarray, allowed: np.ndarray) -> dict[str, float | bool]:
    fraction = outside_change_fraction(before, after, allowed)
    return {'outside_change_fraction': fraction, 'pass': fraction <= 0.001}

def strength_monotonicity(photo: np.ndarray, mask: np.ndarray, colour: tuple[int, int, int], strengths: Iterable[float]) -> list[float]:
    original = photo[..., :3].astype(np.float32)
    scores = []
    for strength in strengths:
        out = alpha_composite(photo, colour, mask, float(strength))
        scores.append(float(np.mean(np.abs(out[..., :3].astype(np.float32) - original))))
    return scores

def pass_definition(feature: str) -> str:
    definitions = {'W77': 'checked face mask only; no lightening claim; amount zero exact identity; texture remains visible', 'W78': 'bounded colour shift; dry zones receive less colour; no health or UV-safety claim', 'W79': 'face/body checked-region delta decreases without changing unmarked pixels', 'W80': 'visual cast preview changes only checked region and makes no SPF efficacy claim', 'W81': 'user-marked pigmentation only; no diagnosis; corrector remains bounded', 'W82': 'user-marked redness appearance only; no diagnosis; corrector remains bounded'}
    if feature not in definitions:
        raise KeyError(feature)
    return definitions[feature]
