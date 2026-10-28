"""Drawn mathematical fixtures for eyes tests; no face photographs. Author: John Khan."""
from __future__ import annotations

import numpy as np

from ..proportions.synthetic import rolled, symmetric_face
from .geometry import frames, interpolate
from .raster import paint, stroke


def specimen(width: int = 96, height: int = 112, *, tone: int = 155, roll: float = 0,
             alpha: bool = False) -> tuple[np.ndarray, np.ndarray, list[dict]]:
    mesh = symmetric_face(400, 480, face_width=320, face_length=384) * np.array((width / 400, height / 480))
    if roll:
        mesh = rolled(mesh, roll, (width / 2, height / 2))
    normalized = mesh / np.array((width, height))
    yy, xx = np.mgrid[:height, :width]
    image = np.empty((height, width, 4 if alpha else 3), dtype=np.uint8)
    for channel, offset in enumerate((8, 0, -7)):
        image[:, :, channel] = np.clip(tone + offset + (xx + 3 * yy) % 11 - 5, 0, 255)
    if alpha:
        image[:, :, 3] = 255
        image[:3, :, 3] = 0
    traces = []
    for frame in frames(normalized, width, height):
        for i, u in enumerate((.18, .35, .53, .70, .85)):
            v = interpolate(frame.upper, u)
            path = [frame.point(u, v + .008), frame.point(u + .01, v + .065), frame.point(u + .03, v + .12 + .01 * (i % 2))]
            traces.append({"side": frame.side, "points": [[x / width, y / height] for x, y in path], "lower": False, "confidence": 1.0})
            image = paint(image, stroke(height, width, path, .4, taper=True), (24, 20, 19))
        for u in (.28, .52, .74):
            v = interpolate(frame.lower, u)
            path = [frame.point(u, v), frame.point(u + .015, v - .06)]
            traces.append({"side": frame.side, "points": [[x / width, y / height] for x, y in path], "lower": True, "confidence": .9})
    return image, normalized, traces
