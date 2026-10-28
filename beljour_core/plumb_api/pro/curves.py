"""Monotone cubic Hermite tone curves and a small RGBA reference implementation.

This is not a pixel-service endpoint; exported routines make fixture and
cross-language tests possible without handling anybody's photographs.
"""

from __future__ import annotations

from collections.abc import Sequence
from functools import lru_cache

from .contracts import CurvePoint, ToneCurves, validate_points


def slopes(points: tuple[CurvePoint, ...]) -> tuple[float, ...]:
    """PCHIP/Fritsch-Carlson derivatives; monotone data cannot overshoot."""
    validate_points(points)
    n = len(points)
    dx = [points[i + 1].x - points[i].x for i in range(n - 1)]
    delta = [(points[i + 1].y - points[i].y) / dx[i] for i in range(n - 1)]
    if n == 2:
        return (delta[0], delta[0])

    def endpoint(h0: float, h1: float, d0: float, d1: float) -> float:
        slope = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1)
        if slope * d0 <= 0:
            return 0.0
        if d0 * d1 < 0 and abs(slope) > 3 * abs(d0):
            return 3 * d0
        return slope

    out = [0.0] * n
    out[0] = endpoint(dx[0], dx[1], delta[0], delta[1])
    out[-1] = endpoint(dx[-1], dx[-2], delta[-1], delta[-2])
    for i in range(1, n - 1):
        left = delta[i - 1]
        right = delta[i]
        if left <= 0 or right <= 0:
            out[i] = 0
        else:
            a = 2 * dx[i] + dx[i - 1]
            b = dx[i] + 2 * dx[i - 1]
            out[i] = (a + b) / (a / left + b / right)
    return tuple(out)


def _interpolate(points: tuple[CurvePoint, ...], derivatives: tuple[float, ...], value: float) -> float:
    if value <= 0:
        return points[0].y
    if value >= 1:
        return points[-1].y
    for i in range(len(points) - 1):
        a, b = points[i], points[i + 1]
        if value > b.x:
            continue
        h = b.x - a.x
        t = (value - a.x) / h
        t2 = t * t
        t3 = t2 * t
        result = ((2 * t3 - 3 * t2 + 1) * a.y + (t3 - 2 * t2 + t) * h * derivatives[i]
                  + (-2 * t3 + 3 * t2) * b.y + (t3 - t2) * h * derivatives[i + 1])
        return min(1.0, max(0.0, result))
    return points[-1].y


def evaluate(points: tuple[CurvePoint, ...], value: float) -> float:
    """Bound output to [0, 1], with stable exact endpoints."""
    return _interpolate(points, slopes(points), value)


@lru_cache(maxsize=128)
def make_lut(points: tuple[CurvePoint, ...]) -> tuple[int, ...]:
    """Create a deterministic byte table once for each immutable curve."""
    derivatives = slopes(points)
    return tuple(min(255, max(0, int(_interpolate(points, derivatives, i / 255) * 255 + 0.5)))
                 for i in range(256))


def channel_luts(curves: ToneCurves) -> tuple[tuple[int, ...], ...]:
    master = make_lut(curves.master)
    return tuple(tuple(make_lut(getattr(curves, channel))[v] for v in master) for channel in ("red", "green", "blue"))


def apply_rgba(data: Sequence[int], width: int, height: int, curves: ToneCurves) -> bytes:
    """Small-image CPU oracle, not the production 12 MP browser edit path."""
    if not 1 <= width <= 4096 or not 1 <= height <= 4096:
        raise ValueError("invalid reference image dimensions")
    if len(data) != width * height * 4:
        raise ValueError("reference image must contain RGBA pixels")
    red, green, blue = channel_luts(curves)
    output = bytearray(data)
    for i in range(0, len(output), 4):
        if output[i + 3] == 0:
            continue
        output[i] = red[output[i]]
        output[i + 1] = green[output[i + 1]]
        output[i + 2] = blue[output[i + 2]]
    return bytes(output)
