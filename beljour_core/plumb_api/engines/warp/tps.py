"""E06 thin plate spline: exact interpolation of 2-D control points, with its Jacobian.

f(p) = a0 + A p + sum_i w_i U(|p - c_i|^2), U(s) = s log s (U(0) = 0), so f maps every
control point c_i exactly onto its target (or nearly, with `smooth` > 0) and bends as
little as possible elsewhere. Concept: Bookstein, "Principal warps: thin-plate splines
and the decomposition of deformations" (IEEE PAMI, 1989); our own code.

The (n + 3) square system is solved with Gaussian elimination and partial pivoting
(NumPy's LAPACK solve here, the same elimination written out in
`web/src/engines/warp/tps.ts`). Singular systems (repeated or all-collinear points)
raise ValueError rather than return a meaningless warp.

Weights are laid out as rows [w_1 .. w_n, a0, a_x, a_y], each row an (x, y) pair, so
`services/tps.Spline` keeps its old shape.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from . import field as fields

Floats = NDArray[np.float64]
MAX_CONTROL_POINTS = 2048


def kernel(r2: np.ndarray) -> Floats:
    """U(r^2) = r^2 log r^2, with U = 0 at r = 0."""
    r2 = np.asarray(r2, dtype=np.float64)
    out = np.zeros_like(r2)
    pos = r2 > 0
    out[pos] = r2[pos] * np.log(r2[pos])
    return out


def kernel_slope(r2: np.ndarray) -> Floats:
    """dU/d(r^2) * 2 = 2 (log r^2 + 1): multiply by (p - c) for the gradient; 0 at r = 0."""
    r2 = np.asarray(r2, dtype=np.float64)
    out = np.zeros_like(r2)
    pos = r2 > 0
    out[pos] = 2.0 * (np.log(r2[pos]) + 1.0)
    return out


def points(value: object, name: str = "points") -> Floats:
    arr = np.asarray(value, dtype=np.float64)
    if arr.ndim != 2 or arr.shape[1] != 2:
        raise ValueError(f"{name} must be an (n, 2) array of (x, y)")
    if not np.all(np.isfinite(arr)):
        raise ValueError(f"{name} must be finite")
    return arr


def degenerate(src: Floats) -> bool:
    """True when two points coincide or all of them lie on one line (no unique spline)."""
    centred = src - src.mean(0)
    scale2 = float((centred ** 2).sum())
    if scale2 == 0.0:
        return True
    d2 = ((src[:, None, :] - src[None, :, :]) ** 2).sum(-1)
    np.fill_diagonal(d2, np.inf)
    if float(np.min(d2)) <= 1e-18 * scale2:
        return True
    sxx = float((centred[:, 0] ** 2).sum())
    syy = float((centred[:, 1] ** 2).sum())
    sxy = float((centred[:, 0] * centred[:, 1]).sum())
    return sxx * syy - sxy * sxy <= 1e-12 * scale2 * scale2


@dataclass(frozen=True)
class ThinPlateSpline:
    """A fitted spline from `centres` (n, 2) with `weights` (n + 3, 2)."""
    centres: Floats
    weights: Floats

    @classmethod
    def fit(cls, src: object, dst: object, smooth: float = 0.0) -> ThinPlateSpline:
        s = points(src, "src")
        d = points(dst, "dst")
        if s.shape != d.shape:
            raise ValueError("src and dst must have the same number of points")
        n = len(s)
        if n < 3:
            raise ValueError("a thin plate spline needs at least 3 points")
        if n > MAX_CONTROL_POINTS:
            raise ValueError(f"at most {MAX_CONTROL_POINTS} control points")
        if not np.isfinite(smooth) or smooth < 0:
            raise ValueError("smooth must be finite and non-negative")
        if degenerate(s):
            raise ValueError("control points are degenerate (repeated or all on one line)")
        system = cls.system(s, smooth)
        rhs = np.zeros((n + 3, 2))
        rhs[:n] = d
        try:
            weights = np.asarray(np.linalg.solve(system, rhs), dtype=np.float64)
        except np.linalg.LinAlgError as exc:
            raise ValueError("control points are degenerate (repeated or all on one line)") from exc
        if not np.all(np.isfinite(weights)):
            raise ValueError("control points are degenerate (repeated or all on one line)")
        return cls(s, weights)

    @staticmethod
    def system(src: Floats, smooth: float = 0.0) -> Floats:
        n = len(src)
        d2 = ((src[:, None, :] - src[None, :, :]) ** 2).sum(-1)
        a = np.zeros((n + 3, n + 3))
        a[:n, :n] = kernel(d2) + smooth * np.eye(n)
        a[:n, n] = 1.0
        a[:n, n + 1:] = src
        a[n, :n] = 1.0
        a[n + 1:, :n] = src.T
        return a

    @property
    def size(self) -> int:
        return len(self.centres)

    def __call__(self, pts: object) -> Floats:
        p = points(pts)
        n = self.size
        d2 = ((p[:, None, :] - self.centres[None, :, :]) ** 2).sum(-1)
        out: Floats = kernel(d2) @ self.weights[:n] + self.weights[n] + p @ self.weights[n + 1:]
        return out

    def map_xy(self, x: Floats, y: Floats) -> tuple[Floats, Floats]:
        out = self(np.stack([np.ravel(x), np.ravel(y)], 1))
        return out[:, 0], out[:, 1]

    def jacobian(self, pts: object) -> Floats:
        """(m, 2, 2): J[k] = [[dfx/dx, dfx/dy], [dfy/dx, dfy/dy]] at each point."""
        p = points(pts)
        n = self.size
        diff = p[:, None, :] - self.centres[None, :, :]          # (m, n, 2)
        slope = kernel_slope((diff ** 2).sum(-1))                  # (m, n)
        grad = slope[..., None] * diff                             # (m, n, 2) = dU/dx, dU/dy
        jac = np.einsum("mnk,nc->mck", grad, self.weights[:n])     # (m, 2 out, 2 in)
        jac = jac + self.weights[n + 1:].T[None, :, :]
        return jac

    def determinant(self, pts: object) -> Floats:
        j = self.jacobian(pts)
        out: Floats = j[:, 0, 0] * j[:, 1, 1] - j[:, 0, 1] * j[:, 1, 0]
        return out

    def bending_energy(self) -> float:
        """trace(W^T K W): zero for a pure affine map, larger for stronger bending."""
        n = self.size
        d2 = ((self.centres[:, None, :] - self.centres[None, :, :]) ** 2).sum(-1)
        w = self.weights[:n]
        return float(np.trace(w.T @ kernel(d2) @ w))


def border_pins(width: int, height: int, per_side: int = 4) -> Floats:
    """Points along the image border that stay still (corners included once)."""
    if width < 2 or height < 2 or per_side < 1:
        raise ValueError("border pins need an image of at least 2 x 2 and per_side >= 1")
    xs = np.linspace(0, width - 1, per_side + 1)
    ys = np.linspace(0, height - 1, per_side + 1)
    top = np.stack([xs, np.zeros_like(xs)], 1)
    bottom = np.stack([xs, np.full_like(xs, height - 1)], 1)
    left = np.stack([np.zeros_like(ys[1:-1]), ys[1:-1]], 1)
    right = np.stack([np.full_like(ys[1:-1], width - 1), ys[1:-1]], 1)
    out: Floats = np.vstack([top, bottom, left, right])
    return out


def control_sets(moved_from: object, moved_to: object, pins: object | None) -> tuple[Floats, Floats, Floats]:
    a = points(moved_from, "moved_from")
    b = points(moved_to, "moved_to")
    if a.shape != b.shape:
        raise ValueError("moved_from and moved_to must have the same number of points")
    p = np.zeros((0, 2)) if pins is None else points(pins, "pins")
    return a, b, p


def tps_field(height: int, width: int, moved_from: object, moved_to: object, *,
              pins: object | None = None, step: int = 4, smooth: float = 0.0,
              pin_border: bool = True) -> fields.Field:
    """Backward field that moves `moved_from` to `moved_to`; pins (and the border) stay put."""
    a, b, p = control_sets(moved_from, moved_to, pins)
    if pin_border:
        p = np.vstack([p, border_pins(width, height)])
    back = ThinPlateSpline.fit(np.vstack([b, p]), np.vstack([a, p]), smooth)
    return fields.from_function(height, width, back.map_xy, step)


def forward_spline(moved_from: object, moved_to: object, *, pins: object | None = None,
                   width: int | None = None, height: int | None = None,
                   smooth: float = 0.0) -> ThinPlateSpline:
    """The forward map (source -> output), for analytic fold checks on the control layout."""
    a, b, p = control_sets(moved_from, moved_to, pins)
    if width is not None and height is not None:
        p = np.vstack([p, border_pins(width, height)])
    return ThinPlateSpline.fit(np.vstack([a, p]), np.vstack([b, p]), smooth)
