'Curl, heat, humidity and fibre diagnostics for R17B. Author: John Khan.'
from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class TexturePlan:
    curl_strength: float
    smoothing: float
    definition: float
    humidity_risk: float
    texture_floor: float
    warning: str

def _unit(value: float, name: str) -> float:
    if not math.isfinite(value):
        raise ValueError(f'{name} must be finite')
    return min(1.0, max(0.0, value))

def curl_definition(curl_strength: float, amount: float) -> TexturePlan:
    curl = _unit(curl_strength, 'curl_strength')
    a = _unit(amount, 'amount')
    definition = 0.18 + 0.62 * a
    smoothing = min(0.42, 0.08 + 0.28 * a)
    texture_floor = max(0.72, 0.94 - 0.16 * a)
    return TexturePlan(curl, smoothing, definition, 0.0, texture_floor, 'preserve observed curl frequency; appearance only')

def heat_style(curl_strength: float, heat_shape: float, amount: float) -> TexturePlan:
    curl = _unit(curl_strength, 'curl_strength')
    shape = _unit(heat_shape, 'heat_shape')
    a = _unit(amount, 'amount')
    smoothing = min(0.55, 0.12 + 0.34 * shape * a)
    definition = max(0.12, curl * (1.0 - 0.45 * shape * a))
    texture_floor = max(0.68, 0.92 - 0.22 * shape * a)
    warning = 'heat-style appearance only; use appropriate heat protection and temperature guidance from the tool manufacturer'
    return TexturePlan(curl, smoothing, definition, 0.0, texture_floor, warning)

def humidity_response(humidity: float, curl_strength: float, porosity: float=0.5) -> TexturePlan:
    h = _unit(humidity / 100.0 if humidity > 1 else humidity, 'humidity')
    curl = _unit(curl_strength, 'curl_strength')
    por = _unit(porosity, 'porosity')
    risk = _unit(0.12 + 0.55 * h + 0.21 * curl + 0.12 * por, 'risk')
    smoothing = max(0.0, 0.24 - 0.16 * risk)
    definition = max(0.1, curl * (1.0 - 0.22 * risk))
    return TexturePlan(curl, smoothing, definition, risk, 0.72, 'estimate from user-entered humidity; weather and hair response vary')

def fibre_density(base_density: float, amount: float, scalp_sensitivity: bool) -> dict[str, float | str | bool]:
    base = _unit(base_density, 'base_density')
    a = _unit(amount, 'amount')
    cap = 0.32 if scalp_sensitivity else 0.58
    gain = min(cap, 0.08 + 0.45 * a)
    return {'observed_density': base, 'visual_gain': gain, 'preview_density': min(1.0, base + gain * (1.0 - base)), 'sensitive_mode': scalp_sensitivity, 'label': 'visual fibre density estimate; not hair growth'}

def texture_retained(before_energy: float, after_energy: float, floor: float=0.7) -> tuple[float, bool]:
    if before_energy < 0 or after_energy < 0:
        raise ValueError('energy must be non-negative')
    ratio = 1.0 if before_energy <= 1e-09 else after_energy / before_energy
    return (ratio, ratio >= floor)
