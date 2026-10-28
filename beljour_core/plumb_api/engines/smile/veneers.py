'W51 conservative veneer consultation geometry and material appearance. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .annotations import bounds
from .contracts import SmileAnnotation


@dataclass(frozen=True)
class ToothCell:
    index: int
    x0: float
    y0: float
    x1: float
    y1: float
    width: float
    height: float
    character: str

CHARACTERS = {'soft': (0.94, 0.98), 'strong': (1.02, 1.0), 'rounded': (0.96, 0.95)}

def cells(annotation: SmileAnnotation, count: int=8, character: str='soft') -> list[ToothCell]:
    if count not in (6, 8):
        raise ValueError('veneer preview supports six or eight checked smile-zone sections')
    if character not in CHARACTERS:
        raise ValueError('unsupported tooth character')
    x0, y0, x1, y1 = bounds(annotation.teeth)
    width_scale, height_scale = CHARACTERS[character]
    step = (x1 - x0) / count
    centre = (x0 + x1) / 2.0
    out: list[ToothCell] = []
    for index in range(count):
        left = x0 + index * step
        right = left + step
        mid = (left + right) / 2.0
        tapered = 1.0 - min(abs(mid - centre) / max((x1 - x0) / 2.0, 1e-08), 1.0) * 0.08
        cell_width = step * width_scale * tapered
        cell_height = (y1 - y0) * height_scale * (1.0 - 0.03 * abs(index - (count - 1) / 2.0))
        out.append(ToothCell(index=index, x0=mid - cell_width / 2.0, y0=y1 - cell_height, x1=mid + cell_width / 2.0, y1=y1, width=cell_width, height=cell_height, character=character))
    return out

def shade_delta(source: np.ndarray, target: tuple[int, int, int]) -> float:
    if source.size == 0:
        return 0.0
    observed = source[..., :3].astype(np.float64).reshape(-1, 3).mean(axis=0)
    return float(np.linalg.norm(observed - np.asarray(target, dtype=np.float64)) / 441.673)

def shade_warning(target: tuple[int, int, int], observed_mean: tuple[float, float, float] | None=None) -> list[str]:
    warnings = ['This preview avoids a paper-white default and is for consultation only.']
    luminance = 0.2126 * target[0] + 0.7152 * target[1] + 0.0722 * target[2]
    if luminance > 242:
        warnings.append('The selected digital shade is extremely bright; compare a more natural shade before a consultation.')
    if observed_mean is not None:
        delta = float(np.linalg.norm(np.subtract(target, observed_mean)) / 441.673)
        if delta > 0.3:
            warnings.append('The selected digital shade is far from the observed tooth colour; screen calibration can exaggerate the difference.')
    warnings.append('Veneers can involve irreversible enamel removal. A dentist must assess suitability.')
    return warnings

def material_response(material: str, light: float) -> tuple[float, float, float]:
    if not 0.0 <= light <= 1.0:
        raise ValueError('light must be in 0..1')
    if material == 'porcelain_style':
        return (0.62 + light * 0.18, 0.18 + light * 0.12, 0.74)
    if material == 'composite_style':
        return (0.58 + light * 0.12, 0.12 + light * 0.08, 0.66)
    raise ValueError('unsupported veneer material style')
