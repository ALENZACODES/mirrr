"""Tone curves for the colour ops: monotone cubic splines through control points.

A curve is a list of (x, y) points with x strictly increasing in [0, 1] and y in [0, 1].
Tangents follow Fritsch and Carlson (1980), "Monotone piecewise cubic interpolation": a
curve through rising points never dips, so a tone curve can't invert shadows. Outside the
first and last x the curve holds the end y. The tangent pass runs left to right in one fixed
order (the TypeScript port, web/src/filters/colour/curves.ts, does the same), so both
languages give the same numbers.

`at_strength` moves every control point from the identity (y = x) to its target, which is
how a curve stage follows the 0-100 slider: strength recomputes the curve, never a cross-fade.
Fritsch and Carlson monotone cubic interpolation; concept only, no code copied.
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Sequence

import numpy as np
from numpy.typing import NDArray

Floats = NDArray[np.float64]
Point = tuple[float, float]
MAX_POINTS = 16
IDENTITY: tuple[Point, ...] = ((0.0, 0.0), (1.0, 1.0))


def check_points(points: Sequence[Sequence[float]]) -> list[Point]:
    """Validate and copy a control-point list; raises ValueError with the reason."""
    if not isinstance(points, list | tuple) or not 2 <= len(points) <= MAX_POINTS:
        raise ValueError(f"a curve needs 2 to {MAX_POINTS} points")
    out: list[Point] = []
    for p in points:
        if not isinstance(p, list | tuple) or len(p) != 2:
            raise ValueError("curve points are [x, y] pairs")
        x, y = float(p[0]), float(p[1])
        if not (np.isfinite(x) and np.isfinite(y) and 0 <= x <= 1 and 0 <= y <= 1):
            raise ValueError("curve points must lie in [0, 1]")
        if out and x <= out[-1][0]:
            raise ValueError("curve x values must strictly increase")
        out.append((x, y))
    return out


def tangents(points: Sequence[Point]) -> list[float]:
    """Fritsch-Carlson tangents, adjusted left to right so each segment stays monotone."""
    n = len(points)
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    d = [(ys[k + 1] - ys[k]) / (xs[k + 1] - xs[k]) for k in range(n - 1)]
    m = [0.0] * n
    m[0], m[-1] = d[0], d[-1]
    for k in range(1, n - 1):
        m[k] = (d[k - 1] + d[k]) / 2 if d[k - 1] * d[k] > 0 else 0.0
    for k in range(n - 1):
        if d[k] == 0:
            m[k] = 0.0
            m[k + 1] = 0.0
            continue
        alpha, beta = m[k] / d[k], m[k + 1] / d[k]
        norm = alpha * alpha + beta * beta
        if norm > 9:
            tau = 3 / np.sqrt(norm)
            m[k] = tau * alpha * d[k]
            m[k + 1] = tau * beta * d[k]
    return m


def evaluate(points: Sequence[Point], values: np.ndarray) -> Floats:
    """The curve at every value (any shape); values outside [x0, xn] take the end y."""
    pts = list(points)
    xs = np.array([p[0] for p in pts], dtype=np.float64)
    ys = np.array([p[1] for p in pts], dtype=np.float64)
    m = np.array(tangents(pts), dtype=np.float64)
    v = np.asarray(values, dtype=np.float64)
    k = np.clip(np.searchsorted(xs, v, side="right") - 1, 0, len(pts) - 2)
    x0, x1 = xs[k], xs[k + 1]
    h = x1 - x0
    t = np.clip((v - x0) / h, 0.0, 1.0)
    t2, t3 = t * t, t * t * t
    out = ((2 * t3 - 3 * t2 + 1) * ys[k] + (t3 - 2 * t2 + t) * h * m[k]
           + (-2 * t3 + 3 * t2) * ys[k + 1] + (t3 - t2) * h * m[k + 1])
    out = np.where(v <= xs[0], ys[0], np.where(v >= xs[-1], ys[-1], out))
    return out


def at_strength(points: Sequence[Point], fraction: float) -> list[Point]:
    """Each point's y moved `fraction` of the way from x (identity) to its target."""
    return [(x, x + (y - x) * fraction) for x, y in points]


def is_identity(points: Sequence[Point]) -> bool:
    return all(abs(x - y) < 1e-15 for x, y in points)
