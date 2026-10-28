'User-entered foundation oxidation and seasonal rematch estimates. Author: John Khan.'
from __future__ import annotations


def oxidation_curve(delta: float, hours: int=8) -> tuple[dict[str, float | str], ...]:
    n = max(1, min(int(hours), 12))
    rows: list[dict[str, float | str]] = []
    for hour in range(n + 1):
        progress = 1 - 2 ** (-hour / 1.8) if hour else 0.0
        rows.append({'hour': float(hour), 'delta_l_estimate': delta * progress, 'label': 'estimate from user-entered formula behaviour'})
    return tuple(rows)

def seasonal_mix(shift: float) -> dict[str, float | str]:
    value = max(-1.0, min(float(shift), 1.0))
    if value >= 0:
        deep = 0.5 + 0.5 * value
        light = 1 - deep
    else:
        light = 0.5 + 0.5 * -value
        deep = 1 - light
    return {'lighter_ratio': light, 'deeper_ratio': deep, 'season_shift': value, 'label': 'mixing estimate; verify on skin'}
