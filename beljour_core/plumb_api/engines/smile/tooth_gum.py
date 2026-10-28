'W53 tooth-character and gum-line consultation helpers. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .annotations import stats
from .contracts import SmileAnnotation
from .veneers import ToothCell, cells


@dataclass(frozen=True)
class GumLineGuide:
    points: tuple[tuple[float, float], ...]
    amplitude: float
    surgical_context: bool
    label: str

def gum_line(annotation: SmileAnnotation, amount: float, samples: int=33) -> GumLineGuide:
    if not 0.0 <= amount <= 1.0:
        raise ValueError('amount must be in 0..1')
    measured = stats(annotation)
    if not annotation.gum:
        raise ValueError('checked gum polygon is required for a gum-line guide')
    gum = np.asarray(annotation.gum, dtype=np.float64)
    x0 = float(np.min(gum[:, 0]))
    x1 = float(np.max(gum[:, 0]))
    baseline = float(gum[:, 1].mean())
    amplitude = min(measured.gum_height * 0.3 * amount, 0.012)
    x = np.linspace(x0, x1, samples)
    phase = np.linspace(0.0, np.pi * 8.0, samples)
    y = baseline + np.sin(phase) * amplitude
    points = tuple((float(px), float(py)) for px, py in zip(x, y, strict=True))
    return GumLineGuide(points=points, amplitude=amplitude, surgical_context=True, label='Consultation guide only. Gum-line changes can be surgical and require a dentist.')

def tooth_character(annotation: SmileAnnotation, style: str, amount: float) -> list[ToothCell]:
    if not 0.0 <= amount <= 1.0:
        raise ValueError('amount must be in 0..1')
    base = cells(annotation, 8, style)
    if amount == 1.0:
        return base
    neutral = cells(annotation, 8, 'soft')
    out: list[ToothCell] = []
    for styled, plain in zip(base, neutral, strict=True):

        def mix(a: float, b: float) -> float:
            return b + (a - b) * amount
        out.append(ToothCell(index=styled.index, x0=mix(styled.x0, plain.x0), y0=mix(styled.y0, plain.y0), x1=mix(styled.x1, plain.x1), y1=mix(styled.y1, plain.y1), width=mix(styled.width, plain.width), height=mix(styled.height, plain.height), character=style))
    return out

def report(annotation: SmileAnnotation, style: str, amount: float) -> dict[str, object]:
    guide = gum_line(annotation, amount)
    teeth = tooth_character(annotation, style, amount)
    return {'style': style, 'tooth_sections': len(teeth), 'gum_line_samples': len(guide.points), 'gum_line_amplitude': guide.amplitude, 'surgical_context': guide.surgical_context, 'label': guide.label, 'diagnosis': False}
