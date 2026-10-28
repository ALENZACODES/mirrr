'Neutral full-look signal presets with identity-preserving bounds. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SignalPreset:
    level: str
    brow_tint: float
    brow_density: float
    skin_texture: float
    stubble_signal: float
    geometry_change: float
PRESETS = {'normal': SignalPreset('normal', 0.16, 0.12, 0.08, 0.13, 0.0), 'extra': SignalPreset('extra', 0.26, 0.2, 0.13, 0.21, 0.0), 'hyper': SignalPreset('hyper', 0.38, 0.3, 0.18, 0.28, 0.0)}

def preset(level: str, amount: float=1.0) -> SignalPreset:
    if level not in PRESETS:
        raise ValueError('level must be normal, extra or hyper')
    if not 0 <= amount <= 1:
        raise ValueError('amount must be 0..1')
    base = PRESETS[level]
    return SignalPreset(level=level, brow_tint=base.brow_tint * amount, brow_density=base.brow_density * amount, skin_texture=base.skin_texture * amount, stubble_signal=base.stubble_signal * amount, geometry_change=0.0)

def compare_levels() -> bool:
    rows = [PRESETS[name] for name in ('normal', 'extra', 'hyper')]
    return all(a.brow_tint < b.brow_tint and a.brow_density < b.brow_density and (a.skin_texture < b.skin_texture) and (a.stubble_signal < b.stubble_signal) and (a.geometry_change == b.geometry_change == 0) for a, b in zip(rows[:-1], rows[1:], strict=True))

def disclosure(direction: str, level: str) -> tuple[str, ...]:
    if direction not in {'feminine', 'masculine', 'neutral'}:
        raise ValueError('unsupported direction')
    if level not in PRESETS:
        raise ValueError('unsupported level')
    return (f'{direction} full-look signal preview at {level} intensity.', 'Brow tint/density, local texture and imported stubble signals only.', 'Face geometry and identity landmarks are not moved.', 'These presentation signals do not determine gender identity.')
