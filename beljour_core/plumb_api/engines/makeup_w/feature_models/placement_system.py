'Face-shape-aware cosmetic placement plans with no geometry reshaping. Author: John Khan.'
from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class PlacementZone:
    name: str
    centre: tuple[float, float]
    radius: tuple[float, float]
    angle_deg: float
    intensity: float
    instruction: str

def _unit(value: float) -> float:
    if not math.isfinite(value):
        raise ValueError('value must be finite')
    return min(1.0, max(0.0, value))

def concealer_plan(amount: float) -> tuple[PlacementZone, ...]:
    a = _unit(amount)
    return (PlacementZone('left_inner_eye', (0.39, 0.43), (0.055, 0.035), -12.0, 0.26 + 0.42 * a, 'small inner-eye placement'), PlacementZone('right_inner_eye', (0.61, 0.43), (0.055, 0.035), 12.0, 0.26 + 0.42 * a, 'small inner-eye placement'), PlacementZone('centre_face', (0.5, 0.57), (0.07, 0.1), 0.0, 0.12 + 0.25 * a, 'optional centre-face evening'))

def correction_plan(issue: str, amount: float) -> tuple[PlacementZone, ...]:
    a = _unit(amount)
    if issue == 'under_eye':
        return tuple(zone for zone in concealer_plan(a) if 'eye' in zone.name)
    if issue == 'redness':
        return (PlacementZone('left_cheek', (0.34, 0.57), (0.12, 0.09), 0.0, 0.1 + 0.25 * a, 'cosmetic green micro-correction'), PlacementZone('right_cheek', (0.66, 0.57), (0.12, 0.09), 0.0, 0.1 + 0.25 * a, 'cosmetic green micro-correction'))
    if issue == 'deeper_pigmentation':
        return (PlacementZone('checked_region', (0.5, 0.56), (0.18, 0.12), 0.0, 0.12 + 0.28 * a, 'apply only to a user-checked region'),)
    raise ValueError('unsupported correction issue')

def blush_plan(face_shape: str, amount: float) -> tuple[PlacementZone, PlacementZone]:
    a = _unit(amount)
    configurations = {'balanced': ((0.34, 0.56), (0.66, 0.56), 8.0), 'round': ((0.34, 0.54), (0.66, 0.54), 18.0), 'oval': ((0.35, 0.56), (0.65, 0.56), 10.0), 'square': ((0.35, 0.57), (0.65, 0.57), 4.0), 'heart': ((0.36, 0.58), (0.64, 0.58), 2.0), 'long': ((0.34, 0.58), (0.66, 0.58), 0.0)}
    if face_shape not in configurations:
        raise ValueError('unsupported face shape')
    left, right, angle = configurations[face_shape]
    intensity = 0.18 + 0.48 * a
    return (PlacementZone('left_blush', left, (0.105, 0.065), angle, intensity, 'optional placement guide'), PlacementZone('right_blush', right, (0.105, 0.065), -angle, intensity, 'optional placement guide'))

def contour_plan(face_shape: str, amount: float) -> tuple[PlacementZone, ...]:
    a = _unit(amount)
    cheek_y = {'round': 0.61, 'square': 0.6, 'heart': 0.6, 'long': 0.62}.get(face_shape, 0.61)
    intensity = 0.1 + 0.28 * a
    return (PlacementZone('left_bronze', (0.29, cheek_y), (0.1, 0.055), -16.0, intensity, 'colour placement only; no slimming'), PlacementZone('right_bronze', (0.71, cheek_y), (0.1, 0.055), 16.0, intensity, 'colour placement only; no slimming'), PlacementZone('temple_warmth', (0.5, 0.32), (0.23, 0.055), 0.0, intensity * 0.65, 'optional warmth'))
