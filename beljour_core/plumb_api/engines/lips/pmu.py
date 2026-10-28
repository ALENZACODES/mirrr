'Permanent-makeup appearance states for W47.\n\nNo retention curve in this module is presented as a clinical prediction. The values\nare bounded display states that make fresh/healed/faded differences explicit in the\nconsultation UI. Author: John Khan.\n'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class PmuState:
    name: str
    pigment_strength: float
    saturation_scale: float
    value_scale: float
    edge_softness: float
    label: str

STATES = {'fresh': PmuState('fresh', 0.78, 1.08, 0.92, 0.12, 'Illustrative fresh appearance; swelling and healing are not predicted.'), 'healed': PmuState('healed', 0.48, 0.92, 1.0, 0.2, 'Healed is the default consultation state; retention varies by person and pigment.'), 'month_6': PmuState('month_6', 0.38, 0.86, 1.01, 0.24, 'Illustrative fade state, not a six-month retention promise.'), 'month_12': PmuState('month_12', 0.28, 0.8, 1.02, 0.28, 'Illustrative fade state, not a twelve-month retention promise.'), 'month_18': PmuState('month_18', 0.18, 0.74, 1.03, 0.32, 'Illustrative fade state, not an eighteen-month retention promise.')}

def state(name: str) -> PmuState:
    try:
        return STATES[name]
    except KeyError as exc:
        raise ValueError('unknown permanent-makeup display state') from exc

def healed_default() -> PmuState:
    return STATES['healed']

def ordered_strengths() -> tuple[float, ...]:
    return tuple(STATES[name].pigment_strength for name in ('fresh', 'healed', 'month_6', 'month_12', 'month_18'))

def validate_monotonic_fade() -> bool:
    values = ordered_strengths()
    return all(a > b for a, b in zip(values, values[1:], strict=False))

def pigment_colour(base: tuple[int, int, int], display: PmuState) -> tuple[int, int, int]:
    """Apply a simple chroma/value transform without normalizing lip pigmentation."""
    rgb = np.asarray(base, dtype=np.float64) / 255.0
    mean = float(np.mean(rgb))
    chroma = rgb - mean
    adjusted = mean * display.value_scale + chroma * display.saturation_scale
    values = [int(np.clip(round(v * 255.0), 0, 255)) for v in adjusted]
    return (values[0], values[1], values[2])

def deep_lip_disclosure(two_tone_balance: float, skin_depth: float | None) -> list[str]:
    warnings = ['Patch testing, healing and pigment response need a qualified professional.', 'This preview does not predict retention, scarring, allergy or final healed colour.']
    if two_tone_balance < 0.35 or two_tone_balance > 0.65:
        warnings.append('Visible two-tone lip pigmentation may heal unevenly; the preview preserves the starting difference.')
    if skin_depth is not None and skin_depth >= 0.65:
        warnings.append('Melanin-rich lips can shift and retain pigment differently; a specialist consultation is important.')
    return warnings

def report(name: str, two_tone_balance: float, skin_depth: float | None=None) -> dict[str, object]:
    display = state(name)
    return {'state': display.name, 'pigment_strength': display.pigment_strength, 'saturation_scale': display.saturation_scale, 'value_scale': display.value_scale, 'edge_softness': display.edge_softness, 'label': display.label, 'warnings': deep_lip_disclosure(two_tone_balance, skin_depth), 'prediction': False}
