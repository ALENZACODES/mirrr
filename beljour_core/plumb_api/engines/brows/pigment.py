"""W71-W72 original pigment strokes and powder, healed by default.

Pigment deposition is a bounded visual model. It is not a prediction of healing,
retention, candidacy or treatment safety. Author: John Khan.
"""
from __future__ import annotations

import math
from typing import Any

import numpy as np

from .contracts import BrowResult, boolean, byte, choice, colour, finish, number, options
from .evidence import luminance
from .geometry import BrowFrame, draw_path, union

PMU_STATES = ("healed", "fresh", "faded")
PMU_METHODS = ("microblading", "powder", "nano")
CONSULT_NOTE = "For an adult professional consultation. Pigment placement is illustrative; it does not predict a healed result."


def noise(index: int, seed: int) -> float:
    value = (int(index) * 1664525 + int(seed) * 1013904223) & 0xFFFFFFFF
    value ^= value >> 16
    value = (value * 2246822519) & 0xFFFFFFFF
    value ^= value >> 13
    return (value & 0xFFFFFFFF) / 4294967296


def pigment_layer(image: np.ndarray, frames: tuple[BrowFrame, BrowFrame], *, method: str,
                  state: str, density: float, seed: int) -> tuple[np.ndarray, int]:
    height, width = image.shape[:2]
    alpha = np.zeros((height, width), dtype=np.float64)
    state_opacity = {"healed": 0.28, "fresh": 0.45, "faded": 0.12}[state]
    count = 0
    for side_index, frame in enumerate(frames):
        if method == "powder":
            for y, x in zip(*np.nonzero(frame.mask > 0), strict=True):
                u, v = frame.project(x + 0.5, y + 0.5)
                edge = max(0.0, min(1.0, u * 8, (1 - u) * 8))
                texture = 0.65 + 0.35 * noise(y * width + x, seed + 17 * side_index)
                alpha[y, x] = max(alpha[y, x], frame.mask[y, x] * edge * texture * density * state_opacity * 0.72)
            continue
        n = int(math.floor(12 + density * 46))
        for i in range(n):
            u = (i + 0.5) / n
            jitter = (noise(i + side_index * 131, seed) - 0.5) * 0.025
            arch = 0.065 * math.sin(math.pi * u)
            base = frame.point(u, arch - frame.height / frame.width * 0.12)
            length = min(frame.height * 0.80, frame.width * (0.08 + 0.035 * noise(i + 67, seed)))
            direction = 0.35 + 0.45 * u
            tip = (base[0] + (frame.up[0] + frame.across[0] * direction) * length,
                   base[1] + (frame.up[1] + frame.across[1] * direction) * length)
            middle = ((base[0] + tip[0]) / 2 + frame.across[0] * frame.width * jitter,
                      (base[1] + tip[1]) / 2 + frame.across[1] * frame.width * jitter)
            points = []
            for step in range(9):
                t = step / 8
                points.append(((1 - t) ** 2 * base[0] + 2 * (1 - t) * t * middle[0] + t * t * tip[0],
                               (1 - t) ** 2 * base[1] + 2 * (1 - t) * t * middle[1] + t * t * tip[1]))
            stroke_width = max(0.35 if method == "nano" else 0.55, frame.width * (0.009 if method == "nano" else 0.013))
            draw_path(alpha, points, stroke_width, state_opacity * density, frame.mask)
            count += 1
    return alpha, count


def render_pigment(image: np.ndarray, frames: tuple[BrowFrame, BrowFrame], feature: str,
                   settings: dict[str, Any] | None = None) -> BrowResult:
    opts = options(settings, {"amount", "colour", "state", "density", "seed", "method", "adultConfirmed"})
    adult = boolean(opts.get("adultConfirmed", False), "adultConfirmed")
    if not adult:
        raise ValueError("adult self-attestation is required for pigment procedure simulations")
    amount = number(opts.get("amount", 0.5), "amount", 0, 1)
    density = number(opts.get("density", 0.45), "density", 0, 0.75)
    state = choice(opts.get("state", "healed"), "state", PMU_STATES)
    default_method = "microblading" if feature == "W71" else "powder"
    method = choice(opts.get("method", default_method), "method", PMU_METHODS)
    if feature == "W71" and method != "microblading":
        raise ValueError("W71 uses microblading; compare powder or nano with W72")
    target = colour(opts.get("colour", (79, 57, 46)))
    seed_value = number(opts.get("seed", 17), "seed", 0, 2147483647)
    if seed_value != int(seed_value):
        raise ValueError("seed must be an integer")
    alpha, stroke_count = pigment_layer(image, frames, method=method, state=state, density=density, seed=int(seed_value))
    alpha *= amount
    output = image.copy()
    for y, x in zip(*np.nonzero(alpha > 0), strict=True):
        for channel in range(3):
            output[y, x, channel] = byte(image[y, x, channel] * (1 - alpha[y, x]) + target[channel] * alpha[y, x])
    region = union(frames)
    skin_values = luminance(image[..., :3].astype(float))[region >= 0.5]
    skin_light = float(np.mean(skin_values)) if skin_values.size else 0
    pigment_light = float(luminance(np.asarray(target, dtype=float)))
    contrast = abs(skin_light - pigment_light)
    warnings = [CONSULT_NOTE, "Fresh, healed and faded are artistic states, not measured retention rates."]
    if contrast < 25:
        warnings.append("This pigment has low contrast on the observed brow area. Actual payoff and retention need professional assessment.")
    if state == "fresh":
        warnings.append("Fresh pigment is darker here. The default comparison is healed.")
    return finish(image, output, alpha,
                  {"feature": feature, "method": method, "state": state, "adult_confirmed": adult,
                   "pigment_strokes": stroke_count, "new_hair_claim": False,
                   "density": density, "maximum_opacity": float(np.max(alpha)),
                   "observed_pigment_contrast": contrast, "prediction": False}, warnings=tuple(warnings))


def compare_methods(image: np.ndarray, frames: tuple[BrowFrame, BrowFrame],
                    settings: dict[str, Any]) -> dict[str, BrowResult]:
    result = {}
    for method in PMU_METHODS:
        feature = "W71" if method == "microblading" else "W72"
        result[method] = render_pigment(image, frames, feature, {**settings, "method": method})
    return result
