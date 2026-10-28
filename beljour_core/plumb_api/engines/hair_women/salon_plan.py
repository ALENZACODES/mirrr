"Neutral salon consultation plans for R17B women's hair previews. Author: John Khan."
from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class ConsultationStep:
    order: int
    title: str
    purpose: str
    required_input: str
    output: str
    limitation: str

@dataclass(frozen=True)
class MaintenanceEstimate:
    service: str
    interval_weeks: float
    low_weeks: float
    high_weeks: float
    user_adjustable: bool
    label: str

def _bounded(value: float, low: float, high: float, name: str) -> float:
    if not math.isfinite(value) or value < low or value > high:
        raise ValueError(f'{name} must be in {low}..{high}')
    return value

def consultation_steps(feature: str) -> tuple[ConsultationStep, ...]:
    base = (ConsultationStep(1, 'Confirm intent', 'Keep the user goal explicit', 'selected preview', 'stated goal', 'No beauty score or age-correction target.'), ConsultationStep(2, 'Check geometry', 'Verify supplied hair/head regions', 'hair mask + head landmarks', 'checked placement', 'Automatic geometry is not fabricated when evidence is missing.'), ConsultationStep(3, 'Compare locally', 'Show original beside simulation', 'local photo', 'before/after preview', 'Screen colour and movement differ from real hair.'))
    feature_steps: dict[str, tuple[ConsultationStep, ...]] = {'W19': (ConsultationStep(4, 'Discuss length', 'Separate stretched from worn length', 'curl strength', 'two length estimates', 'Weight and attachment comfort require in-person review.'),), 'W20': (ConsultationStep(4, 'Discuss attachment', 'Compare tape and sew-in integration zones', 'method', 'placement guide', 'Not a scalp-tension assessment.'),), 'W21': (ConsultationStep(4, 'Check topper footprint', 'Review crown footprint and density', 'crown point', 'topper area', 'Fit and clip comfort are not measured.'),), 'W22': (ConsultationStep(4, 'Check wig fit', 'Discuss cap width and hairline softness', 'temple span', 'fit guide', 'Appearance does not establish cap size.'),), 'W23': (ConsultationStep(4, 'Root band', 'Keep touch-up inside root/scalp band', 'root width', 'root colour preview', 'No formula or allergy claim.'),), 'W24': (ConsultationStep(4, 'Hairline coverage', 'Use conservative scalp-concealer opacity', 'scalp region', 'coverage map', 'Cosmetic appearance only.'),), 'W25': (ConsultationStep(4, 'Fibre density', 'Bound visual fibre gain', 'observed density', 'density estimate', 'Not hair growth.'),), 'W26': (ConsultationStep(4, 'Tint strength', 'Retain observed luminance/texture', 'target colour', 'tint preview', 'No durability claim.'),), 'W29': (ConsultationStep(4, 'Face frame', 'Position procedural money-piece bands', 'head geometry', 'placement map', 'Editable guide only.'),), 'W30': (ConsultationStep(4, 'Foil map', 'Compare procedural section density', 'style + density', 'foil map', 'Not a salon sectioning guarantee.'),), 'W31': (ConsultationStep(4, 'Broad colour', 'Compare chunky and lived-in placement', 'placement style', 'colour zones', 'Movement changes visibility.'),), 'W32': (ConsultationStep(4, 'Grey choice', 'Keep, blend, cover or grow out neutrally', 'observed grey share', 'choice preview', 'No anti-age ranking.'),), 'W33': (ConsultationStep(4, 'Transition estimate', 'Show monotone natural-share timeline', 'growth estimate', 'timeline', 'Actual growth varies.'),), 'W34': (ConsultationStep(4, 'Melt position', 'Choose transition start/softness', 'vertical placement', 'ombre curve', 'Colour only.'),), 'W35': (ConsultationStep(4, 'Part position', 'Set explicit split partition', 'part x-position', 'left/right zones', 'Part can move in real wear.'),), 'W36': (ConsultationStep(4, 'Hidden colour', 'Choose lower-side reveal', 'side + reveal', 'peekaboo zone', 'Movement changes exposure.'),), 'W37': (ConsultationStep(4, 'Fringe geometry', 'Compare original fringe shapes', 'temple/crown points', 'fringe guide', 'Density and movement vary.'),), 'W38': (ConsultationStep(4, 'Cut comparison', 'Show options without best-face claims', 'head geometry', 'cut previews', 'Personal preference is primary.'),), 'W40': (ConsultationStep(4, 'Texture retention', 'Retain curl-frequency energy', 'curl strength', 'definition preview', 'No permanent texture claim.'),), 'W41': (ConsultationStep(4, 'Regrowth visual', 'Show appearance-only timeline', 'month', 'density/length estimate', 'Not medical advice or a growth prediction.'),), 'W42': (ConsultationStep(4, 'Sensitive mode', 'Cap intensity and prioritize comfort', 'user opt-in', 'gentle preview', 'Keeping the current look is an equal option.'),), 'W43': (ConsultationStep(4, 'Heat style', 'Preserve texture floor', 'style + heat shape', 'appearance preview', 'Not a temperature recommendation.'),), 'W44': (ConsultationStep(4, 'Humidity estimate', 'Use only entered humidity/curl values', 'humidity', 'retention estimate', 'Weather and individual response vary.'),)}
    if feature not in feature_steps:
        raise ValueError('unsupported R17B hair feature')
    return base + feature_steps[feature]

def maintenance_estimate(service: str, growth_cm_month: float=1.1, user_interval_weeks: float | None=None) -> MaintenanceEstimate:
    growth = _bounded(growth_cm_month, 0.3, 2.5, 'growth_cm_month')
    defaults = {'root_colour': 6.0, 'extensions': 8.0, 'topper_check': 10.0, 'grey_blend': 8.0, 'fringe_trim': 5.0, 'cut': 10.0}
    if service not in defaults:
        raise ValueError('unsupported service')
    base = defaults[service] * (1.1 / growth) ** 0.35
    interval = _bounded(user_interval_weeks, 1.0, 52.0, 'user_interval_weeks') if user_interval_weeks is not None else base
    spread = max(1.0, interval * 0.22)
    return MaintenanceEstimate(service, interval, max(1.0, interval - spread), min(52.0, interval + spread), user_interval_weeks is not None, "ESTIMATE; adjust to the user's stylist and observed growth")

def annual_visits(estimate: MaintenanceEstimate) -> float:
    return 52.0 / max(estimate.interval_weeks, 1.0)

def plan_summary(feature: str) -> dict[str, object]:
    rows = consultation_steps(feature)
    return {'feature': feature, 'steps': [asdict(row) for row in rows], 'step_count': len(rows), 'network': False, 'medical_advice': False, 'beauty_score': False}

def validate_sequence(rows: Sequence[ConsultationStep]) -> bool:
    return [row.order for row in rows] == list(range(1, len(rows) + 1)) and len({row.title for row in rows}) == len(rows)
