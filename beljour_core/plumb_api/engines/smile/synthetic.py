'Drawn dental annotations for deterministic R16B tests. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .contracts import SmileAnnotation


@dataclass(frozen=True)
class SmileFixture:
    image: np.ndarray
    annotation: SmileAnnotation
    name: str
    description: str

def _image(height: int, width: int, tone: tuple[int, int, int]) -> np.ndarray:
    yy, xx = np.mgrid[:height, :width]
    image = np.empty((height, width, 4), dtype=np.uint8)
    image[..., 0] = np.clip(tone[0] + 7 * np.sin(xx * 0.08), 0, 255).astype(np.uint8)
    image[..., 1] = np.clip(tone[1] + 5 * np.cos(yy * 0.09), 0, 255).astype(np.uint8)
    image[..., 2] = np.clip(tone[2] + 4 * np.sin((xx + yy) * 0.04), 0, 255).astype(np.uint8)
    image[..., 3] = 255
    return image

def fixtures() -> list[SmileFixture]:
    rows = [('balanced', (188, 132, 108), SmileAnnotation(teeth=((0.4, 0.63), (0.6, 0.63), (0.59, 0.7), (0.41, 0.7)), gum=((0.41, 0.625), (0.59, 0.625), (0.58, 0.646), (0.42, 0.646)), midline_x=0.5), 'drawn balanced dental annotation'), ('gap', (132, 91, 78), SmileAnnotation(teeth=((0.39, 0.64), (0.61, 0.64), (0.6, 0.705), (0.4, 0.705)), gum=((0.4, 0.632), (0.6, 0.632), (0.59, 0.65), (0.41, 0.65)), midline_x=0.51), 'drawn central-gap consultation annotation'), ('gum-show', (215, 170, 150), SmileAnnotation(teeth=((0.41, 0.65), (0.59, 0.65), (0.58, 0.704), (0.42, 0.704)), gum=((0.42, 0.615), (0.58, 0.615), (0.58, 0.655), (0.42, 0.655)), midline_x=0.5), 'drawn gum-show consultation annotation')]
    return [SmileFixture(_image(112, 112, tone), annotation, name, description) for name, tone, annotation, description in rows]

def motion_sequence() -> list[SmileAnnotation]:
    base = fixtures()[0].annotation
    sequence: list[SmileAnnotation] = []
    for frame in range(6):
        dx = (frame - 2.5) * 0.0015
        dy = np.sin(frame / 5.0 * np.pi) * 0.002
        teeth = tuple((x + dx, y + dy) for x, y in base.teeth)
        gum = tuple((x + dx, y + dy) for x, y in base.gum)
        sequence.append(SmileAnnotation(teeth, gum, None if base.midline_x is None else base.midline_x + dx))
    return sequence
