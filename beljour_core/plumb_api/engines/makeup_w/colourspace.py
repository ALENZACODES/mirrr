'Small dependency-free CIE Lab/LCh helpers. Author: John Khan.'
from __future__ import annotations

import math

import numpy as np


def _linear(channel: np.ndarray) -> np.ndarray:
    c = channel / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)

def rgb_to_xyz(rgb: np.ndarray) -> np.ndarray:
    data = np.asarray(rgb, dtype=np.float64)
    lin = _linear(data)
    matrix = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.072175], [0.0193339, 0.119192, 0.9503041]])
    return lin @ matrix.T

def _f(t: np.ndarray) -> np.ndarray:
    delta = 6 / 29
    return np.where(t > delta ** 3, np.cbrt(t), t / (3 * delta ** 2) + 4 / 29)

def rgb_to_lab(rgb: np.ndarray) -> np.ndarray:
    xyz = rgb_to_xyz(rgb)
    white = np.array([0.95047, 1.0, 1.08883])
    f = _f(xyz / white)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], axis=-1)

def lab_to_lch(lab: np.ndarray) -> np.ndarray:
    data = np.asarray(lab, dtype=np.float64)
    c = np.hypot(data[..., 1], data[..., 2])
    h = (np.degrees(np.arctan2(data[..., 2], data[..., 1])) + 360) % 360
    return np.stack([data[..., 0], c, h], axis=-1)

def delta_e(a: np.ndarray, b: np.ndarray) -> float:
    aa = np.asarray(a, dtype=np.float64)
    bb = np.asarray(b, dtype=np.float64)
    return float(np.sqrt(np.sum((aa - bb) ** 2)))

def undertone_hue(name: str) -> float:
    return {'cool': 345.0, 'neutral': 25.0, 'warm': 55.0, 'olive': 92.0}[name]

def hue_distance(a: float, b: float) -> float:
    d = abs((a - b) % 360)
    return min(d, 360 - d)

def lch_score(colour: tuple[int, int, int], undertone: str) -> float:
    lch = lab_to_lch(rgb_to_lab(np.asarray(colour, dtype=np.float64)))
    return max(0.0, 1.0 - hue_distance(float(lch[2]), undertone_hue(undertone)) / 180.0) * (0.4 + 0.6 * min(float(lch[1]) / 60.0, 1.0))

def rotate_hue(rgb: tuple[int, int, int], degrees: float) -> tuple[int, int, int]:
    data = np.asarray(rgb, dtype=np.float64) / 255
    angle = math.radians(degrees)
    u = math.cos(angle)
    w = math.sin(angle)
    matrix = np.array([[0.299 + 0.701 * u + 0.168 * w, 0.587 - 0.587 * u + 0.33 * w, 0.114 - 0.114 * u - 0.497 * w], [0.299 - 0.299 * u - 0.328 * w, 0.587 + 0.413 * u + 0.035 * w, 0.114 - 0.114 * u + 0.292 * w], [0.299 - 0.3 * u + 1.25 * w, 0.587 - 0.588 * u - 1.05 * w, 0.114 + 0.886 * u - 0.203 * w]])
    out = np.clip(matrix @ data, 0, 1)
    return (int(round(out[0] * 255)), int(round(out[1] * 255)), int(round(out[2] * 255)))
