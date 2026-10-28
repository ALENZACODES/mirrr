'Deterministic drawn lip fixtures for engine/property tests. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class LipFixture:
    image: np.ndarray
    landmarks: np.ndarray
    name: str
    description: str

def _mesh(lip: np.ndarray) -> np.ndarray:
    points = np.full((478, 2), 0.5, dtype=np.float64)
    outer_ids = (61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308)
    for index, landmark_id in enumerate(outer_ids):
        points[landmark_id] = lip[index]
    extra_ids = (324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415)
    for index, landmark_id in enumerate(extra_ids):
        points[landmark_id] = lip[index % len(lip)]
    return points

def _image(height: int, width: int, tone: tuple[int, int, int], two_tone: bool) -> np.ndarray:
    yy, xx = np.mgrid[:height, :width]
    image = np.empty((height, width, 4), dtype=np.uint8)
    image[..., 0] = np.clip(tone[0] + 8 * np.sin(xx * 0.09), 0, 255).astype(np.uint8)
    image[..., 1] = np.clip(tone[1] + 6 * np.sin(yy * 0.07), 0, 255).astype(np.uint8)
    image[..., 2] = np.clip(tone[2] + 5 * np.cos((xx + yy) * 0.05), 0, 255).astype(np.uint8)
    image[..., 3] = 255
    if two_tone:
        band = (yy > height * 0.64) & (yy < height * 0.71) & (xx > width * 0.36) & (xx < width * 0.64)
        image[band & (xx < width * 0.5), 0] = np.clip(image[band & (xx < width * 0.5), 0].astype(int) - 28, 0, 255)
        image[band & (xx >= width * 0.5), 2] = np.clip(image[band & (xx >= width * 0.5), 2].astype(int) + 18, 0, 255)
    return image

def fixtures() -> list[LipFixture]:
    shapes = [('balanced', np.array([[0.39, 0.66], [0.43, 0.64], [0.47, 0.635], [0.5, 0.64], [0.53, 0.635], [0.57, 0.64], [0.61, 0.66], [0.58, 0.69], [0.54, 0.705], [0.5, 0.71], [0.46, 0.705], [0.42, 0.69]]), (183, 126, 105), False, 'balanced drawn lip geometry'), ('two-tone', np.array([[0.37, 0.665], [0.42, 0.645], [0.46, 0.638], [0.5, 0.642], [0.54, 0.638], [0.58, 0.645], [0.63, 0.665], [0.59, 0.695], [0.55, 0.714], [0.5, 0.721], [0.45, 0.714], [0.41, 0.695]]), (129, 88, 75), True, 'melanin-rich two-tone drawn fixture'), ('asymmetric', np.array([[0.38, 0.67], [0.42, 0.647], [0.46, 0.64], [0.5, 0.643], [0.54, 0.637], [0.58, 0.641], [0.62, 0.658], [0.59, 0.69], [0.55, 0.707], [0.5, 0.715], [0.45, 0.711], [0.41, 0.697]]), (217, 171, 151), False, 'mildly asymmetric drawn lip geometry')]
    return [LipFixture(_image(112, 112, tone, two_tone), _mesh(lip), name, description) for name, lip, tone, two_tone, description in shapes]

def assert_no_real_faces(rows: list[LipFixture]) -> None:
    if not rows:
        raise ValueError('at least one synthetic fixture is required')
    for fixture in rows:
        if 'drawn' not in fixture.description and 'fixture' not in fixture.description:
            raise ValueError('synthetic fixture disclosure is required')
        if fixture.image.shape != (112, 112, 4):
            raise ValueError('unexpected fixture dimensions')
