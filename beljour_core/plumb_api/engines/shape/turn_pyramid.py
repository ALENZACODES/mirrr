"""Bounded Laplacian-pyramid composite for R15A visible-face small turns.

The warp remains the geometrically guarded rendering from turn_field; this
module replaces only the final colour blend. No unseen-side photo pixels are
synthesised. Every disallowed pixel is restored byte-for-byte after pyramid
reconstruction, even when a coarse Gaussian level bleeds across that edge.

Concept: Burt and Adelson Laplacian pyramid (1983), The Laplacian Pyramid as a Compact Image Code; concept only, no code copied.
The pyramid runs in float32 with a capped depth and original sRGB inputs; this
is a non-photometric visual blend, *not* a linear-light relighting algorithm.
An alpha channel, when present, is blended like a colour channel then locked
outside support; no hidden RGB is exposed by a transparent border.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np

KERNEL = (1.0, 4.0, 6.0, 4.0, 1.0)
MAX_LEVELS = 4


def _blur(image: np.ndarray) -> np.ndarray:
    """Separable five-tap near-Gaussian with reflected rather than black borders."""
    if image.ndim not in (2, 3):
        raise ValueError("pyramid blur expects a plane or RGB(A) image")
    pad = ((2, 2), (2, 2)) + (((0, 0),) if image.ndim == 3 else ())
    source = np.pad(image.astype(np.float32, copy=False), pad, mode="reflect")
    x = np.zeros_like(image, dtype=np.float32)
    for offset, weight in enumerate(KERNEL):
        x += np.float32(weight) * source[2:2 + image.shape[0], offset:offset + image.shape[1]]
    x /= np.float32(16.0)
    # Along rows, the same kernel, using the already horizontally blurred data.
    y_pad = ((2, 2), (0, 0)) + (((0, 0),) if x.ndim == 3 else ())
    xp = np.pad(x, y_pad, mode="reflect")
    y = np.zeros_like(x, dtype=np.float32)
    for offset, weight in enumerate(KERNEL):
        y += np.float32(weight) * xp[offset:offset + image.shape[0]]
    return y / np.float32(16.0)


def _upsample(coarse: np.ndarray, target: tuple[int, int]) -> np.ndarray:
    """Bilinear expand on the original even-pixel downsampling grid."""
    h, w = target
    ch, cw = coarse.shape[:2]
    if h < 1 or w < 1 or ch < 1 or cw < 1:
        raise ValueError("pyramid dimensions must be positive")
    ys = np.arange(h, dtype=np.float32) / 2
    xs = np.arange(w, dtype=np.float32) / 2
    lo_y, lo_x = np.minimum(np.floor(ys).astype(int), ch - 1), np.minimum(np.floor(xs).astype(int), cw - 1)
    hi_y, hi_x = np.minimum(lo_y + 1, ch - 1), np.minimum(lo_x + 1, cw - 1)
    wy, wx = ys - lo_y, xs - lo_x
    if coarse.ndim == 3:
        vertical = coarse[lo_y, :] * (1 - wy[:, None, None]) + coarse[hi_y, :] * wy[:, None, None]
        return vertical[:, lo_x] * (1 - wx[None, :, None]) + vertical[:, hi_x] * wx[None, :, None]
    vertical = coarse[lo_y, :] * (1 - wy[:, None]) + coarse[hi_y, :] * wy[:, None]
    return vertical[:, lo_x] * (1 - wx[None, :]) + vertical[:, hi_x] * wx[None, :]


def _gaussian_levels(image: np.ndarray, levels: int) -> list[np.ndarray]:
    out = [image.astype(np.float32, copy=True)]
    for _ in range(levels - 1):
        down = _blur(out[-1])[::2, ::2]
        out.append(down)
    return out


def _laplacian_levels(gaussians: list[np.ndarray]) -> list[np.ndarray]:
    result = [image - _upsample(gaussians[i + 1], image.shape[:2])
              for i, image in enumerate(gaussians[:-1])]
    result.append(gaussians[-1])
    return result


def composite(original: np.ndarray, turned: np.ndarray, support: np.ndarray, *,
              levels: int = MAX_LEVELS) -> np.ndarray:
    """Blend a field-rendered face with its source, preserving hard safety edges.

    `support` is the *actual* ramp after geometric guards, so a nominal inside
    face-oval pixel with zero displacement is not erroneously changed. A fully
    supported original and turned image are copied exactly. Hard-zero pixels
    are always original, no matter what the Laplacian bands do.
    """
    if (original.dtype != np.uint8 or turned.dtype != np.uint8 or original.shape != turned.shape or
            original.ndim != 3 or original.shape[2] not in (3, 4) or min(original.shape[:2]) < 2):
        raise ValueError("pyramid composite needs equal-size uint8 RGB(A) photos")
    if support.shape != original.shape[:2] or not np.isfinite(support).all() or np.any((support < 0) | (support > 1)):
        raise ValueError("pyramid support must be a finite 0..1 image plane")
    if not isinstance(levels, int) or not 1 <= levels <= MAX_LEVELS:
        raise ValueError("pyramid levels out of range")
    if not np.any(support > 0) or np.array_equal(original, turned):
        return original.copy()
    if np.all(support == 1):
        return turned.copy()
    levels = min(levels, max(1, int(np.floor(np.log2(min(original.shape[:2])))) - 2))
    a = _gaussian_levels(original, levels)
    b = _gaussian_levels(turned, levels)
    masks = _gaussian_levels(support.astype(np.float32), levels)
    details_a = _laplacian_levels(a)
    details_b = _laplacian_levels(b)
    def mix(i: int) -> np.ndarray:
        alpha = np.clip(masks[i], 0, 1)[..., None]
        return details_a[i] * (1 - alpha) + details_b[i] * alpha
    current = mix(levels - 1)
    for i in range(levels - 2, -1, -1):
        current = _upsample(current, a[i].shape[:2]) + mix(i)
    out = np.clip(np.rint(current), 0, 255).astype(np.uint8)
    out[support <= 0] = original[support <= 0]
    out[support >= 1] = turned[support >= 1]
    return out


def valid_weights(support: object, expected: tuple[int, int]) -> bool:
    """Fail-closed finite mask validation before any warp/pyramid allocation."""
    try:
        weights = np.asarray(support, dtype=np.float64)
    except (TypeError, ValueError):
        return False
    return bool(weights.shape == expected and np.isfinite(weights).all()
                and np.all((weights >= 0) & (weights <= 1)))
