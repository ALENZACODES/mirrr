"""E06 moving least squares deformation: affine, similarity and rigid.

For a point v, each handle i gets weight w_i = 1 / |p_i - v|^(2 alpha). With the weighted
centroids p*, q* and centred handles p^ = p - p*, q^ = q - q*, d = v - p*:

  affine      f(v) = d (sum w p^T p^)^-1 (sum w p^T q^) + q*
  similarity  f(v) = (1 / mu) sum w (q^x s - q^y c, q^x c + q^y s) + q*,  mu = sum w |p^|^2
  rigid       f(v) = |d| fr / |fr| + q*,  fr = sum w (q^x s - q^y c, q^x c + q^y s)
  with s = p^ . d and c = p^x d^y - p^y d^x.

Each mode reproduces its own kind of global transform exactly; at a handle (|p_i - v| <
1e-6 px) the result is that handle's target. One handle is a pure translation. Affine
needs at least three handles not all on one line; similarity and rigid need two distinct
handles. Concept: Schaefer, McPhail and Warren, "Image deformation using moving least
squares" (SIGGRAPH 2006); our own code.

A backward warp uses the moved positions as handles p and the original positions as
targets q, evaluated on the field grid (`field.from_function`).
Mirrored in `web/src/engines/warp/mls.ts`.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from . import field as fields
from .tps import border_pins, control_sets, points

Floats = NDArray[np.float64]
MODES = ("affine", "similarity", "rigid")
HIT = 1e-12          # squared distance at which v counts as sitting on a handle
MAX_HANDLES = 4096


def _check(p: Floats, q: Floats, mode: str, alpha: float) -> None:
    if mode not in MODES:
        raise ValueError(f"mode must be one of {', '.join(MODES)}")
    if p.shape != q.shape or len(p) < 1:
        raise ValueError("handles and targets must be matching, non-empty (n, 2) arrays")
    if len(p) > MAX_HANDLES:
        raise ValueError(f"at most {MAX_HANDLES} handles")
    if not (np.isfinite(alpha) and 0.25 <= alpha <= 4):
        raise ValueError("alpha must be between 0.25 and 4")
    if len(p) > 1:
        d2 = ((p[:, None, :] - p[None, :, :]) ** 2).sum(-1)
        np.fill_diagonal(d2, np.inf)
        if np.min(d2) <= HIT:
            raise ValueError("handles must be distinct")
    if mode == "affine" and len(p) > 1:
        centred = p - p.mean(0)
        if len(p) < 3 or abs(np.linalg.det(centred.T @ centred)) <= 1e-9 * max(1.0, float((centred ** 2).sum()) ** 2):
            raise ValueError("affine needs at least three handles not all on one line")


def deform(v: object, handles: object, targets: object, mode: str = "similarity",
           alpha: float = 1.0) -> Floats:
    """Deform points `v` (m, 2) by the handle -> target pairs."""
    pts = points(v)
    p = points(handles, "handles")
    q = points(targets, "targets")
    _check(p, q, mode, alpha)
    if len(p) == 1:
        out1: Floats = pts + (q[0] - p[0])
        return out1
    diff = p[None, :, :] - pts[:, None, :]                    # (m, n, 2)
    d2 = (diff ** 2).sum(-1)                                  # (m, n)
    hit = d2 < HIT
    safe = np.where(hit, 1.0, d2)
    w = 1.0 / safe ** alpha
    total = w.sum(1)
    p_star = (w @ p) / total[:, None]
    q_star = (w @ q) / total[:, None]
    ph = p[None, :, :] - p_star[:, None, :]                   # (m, n, 2)
    qh = q[None, :, :] - q_star[:, None, :]
    d = pts - p_star                                          # (m, 2)
    if mode == "affine":
        m_mat = np.einsum("mn,mni,mnj->mij", w, ph, ph)
        b_mat = np.einsum("mn,mni,mnj->mij", w, ph, qh)
        out = np.einsum("mi,mij->mj", d, np.linalg.solve(m_mat, b_mat)) + q_star
    else:
        s = ph[..., 0] * d[:, None, 0] + ph[..., 1] * d[:, None, 1]
        c = ph[..., 0] * d[:, None, 1] - ph[..., 1] * d[:, None, 0]
        fx = (w * (qh[..., 0] * s - qh[..., 1] * c)).sum(1)
        fy = (w * (qh[..., 0] * c + qh[..., 1] * s)).sum(1)
        if mode == "similarity":
            mu = (w * (ph ** 2).sum(-1)).sum(1)
            out = np.stack([fx / mu, fy / mu], 1) + q_star
        else:
            length = np.hypot(fx, fy)
            dlen = np.hypot(d[:, 0], d[:, 1])
            ok = length > 0
            ratio = np.where(ok, dlen / np.where(ok, length, 1.0), 0.0)
            out = np.stack([fx * ratio, fy * ratio], 1) + q_star
    if hit.any():
        rows = np.flatnonzero(hit.any(1))
        first = hit[rows].argmax(1)
        out[rows] = q[first]
    result: Floats = out
    return result


def mls_field(height: int, width: int, moved_from: object, moved_to: object, *,
              mode: str = "similarity", alpha: float = 1.0, pins: object | None = None,
              step: int = 4, pin_border: bool = False) -> fields.Field:
    """Backward field moving `moved_from` to `moved_to` (pins hold still as handles)."""
    a, b, p = control_sets(moved_from, moved_to, pins)
    if pin_border:
        p = np.vstack([p, border_pins(width, height)])
    handles = np.vstack([b, p])
    targets = np.vstack([a, p])

    def back(x: Floats, y: Floats) -> tuple[Floats, Floats]:
        out = deform(np.stack([x, y], 1), handles, targets, mode, alpha)
        return out[:, 0], out[:, 1]

    return fields.from_function(height, width, back, step)
