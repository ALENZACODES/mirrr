"""Thin plate spline warps for the procedures YouCam has no parameter for.

Landmarks are MediaPipe Face Mesh points (468 or 478), normalised 0..1, sent by the
browser. We move a few landmarks, pin others, fit a TPS that maps output pixels back to
input pixels, evaluate it on a coarse grid, upsample and remap with OpenCV.

Plumb's legacy face-shape service, replaced by the E08 mesh warp (plan §5.1).
Face-mapping credits (licences.json "concepts"): runtime MediaPipe Face Landmarker
indices (Bucket A) and OpenCV remap (Bucket A runtime); concept only, no code copied:
Bookstein thin-plate splines, from the paper. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np


def _u(r2: np.ndarray) -> np.ndarray:
    with np.errstate(divide="ignore", invalid="ignore"):
        out = r2 * np.log(r2)
    return np.nan_to_num(out)


def _pairwise_sq(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    d = a[:, None, :] - b[None, :, :]
    return (d ** 2).sum(-1)


@dataclass
class TPS:
    ctrl: np.ndarray      # (n, 2) control points in output space
    weights: np.ndarray   # (n, 2)
    affine: np.ndarray    # (3, 2)

    @classmethod
    def fit(cls, out_pts: np.ndarray, in_pts: np.ndarray, reg: float = 1e-6) -> TPS:
        """Fit f with f(out_pts[i]) == in_pts[i] (exactly when reg is tiny)."""
        n = len(out_pts)
        K = _u(_pairwise_sq(out_pts, out_pts)) + reg * np.eye(n)
        P = np.hstack([np.ones((n, 1)), out_pts])
        A = np.zeros((n + 3, n + 3))
        A[:n, :n], A[:n, n:], A[n:, :n] = K, P, P.T
        rhs = np.zeros((n + 3, 2))
        rhs[:n] = in_pts
        sol = np.linalg.solve(A, rhs)
        return cls(out_pts, sol[:n], sol[n:])

    def __call__(self, pts: np.ndarray) -> np.ndarray:
        U = _u(_pairwise_sq(pts, self.ctrl))
        return U @ self.weights + np.hstack([np.ones((len(pts), 1)), pts]) @ self.affine


def warp(image: np.ndarray, moved_from: np.ndarray, moved_to: np.ndarray, pinned: np.ndarray,
         grid_step: int = 8) -> np.ndarray:
    """image: HxWx3 uint8. Points are in pixels. Content at moved_from ends up at moved_to;
    pinned points and the image border stay put."""
    h, w = image.shape[:2]
    scale = float(max(h, w))
    border = np.array([[0, 0], [w / 2, 0], [w - 1, 0], [w - 1, h / 2], [w - 1, h - 1],
                       [w / 2, h - 1], [0, h - 1], [0, h / 2]], dtype=float)
    out_pts = np.vstack([moved_to, pinned, border]) / scale
    in_pts = np.vstack([moved_from, pinned, border]) / scale
    out_pts, idx = np.unique(np.round(out_pts, 6), axis=0, return_index=True)
    in_pts = in_pts[idx]
    tps = TPS.fit(out_pts, in_pts)
    gx = np.arange(0, w + grid_step, grid_step, dtype=float)
    gy = np.arange(0, h + grid_step, grid_step, dtype=float)
    mesh = np.stack(np.meshgrid(gx, gy), -1).reshape(-1, 2)
    src = tps(mesh / scale) * scale
    coarse_x = src[:, 0].reshape(len(gy), len(gx)).astype(np.float32)
    coarse_y = src[:, 1].reshape(len(gy), len(gx)).astype(np.float32)
    # Upsample exactly: full res pixel (x, y) sits at coarse coordinate (x/step, y/step).
    # (cv2.resize uses half pixel centres, which would shift the map by almost half a cell.)
    fx, fy = np.meshgrid(np.arange(w, dtype=np.float32) / grid_step, np.arange(h, dtype=np.float32) / grid_step)
    map_x = cv2.remap(coarse_x, fx, fy, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    map_y = cv2.remap(coarse_y, fx, fy, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return cv2.remap(image, map_x, map_y, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


# MediaPipe Face Mesh indices ------------------------------------------------
# Index choices follow the canonical face mesh map. Visual check on real faces is still
# on the to do list (see docs/PLAN.md, risks).
RIGHT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
LEFT_EYE = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466]
FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400,
             377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
NOSE = [1, 2, 4, 5, 6, 19, 94, 98, 327, 168, 197, 195]
MOUTH_CORNERS = [61, 291]
UPPER_LIP_OUTER = [0, 37, 39, 40, 185, 267, 269, 270, 409]
LOWER_LIP = [17, 84, 181, 91, 314, 405, 321, 14]
RIGHT_BROW = [70, 63, 105, 66, 107, 46, 53, 52, 65, 55]
LEFT_BROW = [300, 293, 334, 296, 336, 276, 283, 282, 295, 285]
BROW_TAILS = {70: 1.0, 46: 1.0, 63: 0.85, 53: 0.85, 300: 1.0, 276: 1.0, 293: 0.85, 283: 0.85}
RIGHT_CHEEK = [50, 205, 187, 207, 216]
LEFT_CHEEK = [280, 425, 411, 427, 436]


def _px(landmarks: np.ndarray, w: int, h: int) -> np.ndarray:
    return landmarks[:, :2] * np.array([w, h], dtype=float)


def interocular(pts: np.ndarray) -> float:
    return float(np.linalg.norm(pts[33] - pts[263]))


def local_moves(proc: str, pts: np.ndarray, amount: float) -> (
    tuple[list[int], np.ndarray, list[int]] | tuple[list[int], np.ndarray, list[int], np.ndarray]
):
    """Return (moved indices, displacement per moved index in px, pinned indices).
    amount is 0..1 of the procedure's full effect."""
    iod = interocular(pts)
    if proc == "brow_lift":
        moved = RIGHT_BROW + LEFT_BROW
        disp = np.array([[0.0, -0.10 * iod * amount * (0.6 + 0.4 * BROW_TAILS.get(i, 0.5))] for i in moved])
        pinned = RIGHT_EYE + LEFT_EYE + NOSE + MOUTH_CORNERS + FACE_OVAL
        return moved, disp, pinned
    if proc == "lip_lift":
        moved = UPPER_LIP_OUTER
        disp = np.array([[0.0, -0.06 * iod * amount] for _ in moved])
        pinned = [2, 94, 98, 327, 19] + MOUTH_CORNERS + LOWER_LIP + RIGHT_EYE + LEFT_EYE + FACE_OVAL
        return moved, disp, pinned
    if proc == "buccal_fat_removal":
        moved = RIGHT_CHEEK + LEFT_CHEEK
        mid_x = pts[1][0]
        disp = np.array([[np.sign(mid_x - pts[i][0]) * 0.045 * iod * amount, 0.0] for i in moved])
        pinned = FACE_OVAL + RIGHT_EYE + LEFT_EYE + NOSE + MOUTH_CORNERS
        return moved, disp, pinned
    if proc == "otoplasty":
        # Virtual points in the ear zone just outside the face outline, pulled towards the head.
        moved_pts: list[list[float]] = []
        ear_displacements: list[list[float]] = []
        for side_idx, inner_idx, sign in ((234, 127, -1.0), (454, 356, 1.0)):
            top, bottom = pts[inner_idx][1] - 0.15 * iod, pts[side_idx][1] + 0.35 * iod
            for t in np.linspace(0, 1, 5):
                y = top + (bottom - top) * t
                for reach in (0.18, 0.32):
                    moved_pts.append([pts[side_idx][0] + sign * reach * iod, y])
                    ear_displacements.append([-sign * 0.10 * iod * amount * (reach / 0.32), 0.0])
        pinned = FACE_OVAL + RIGHT_EYE + LEFT_EYE + NOSE
        return [-1] * len(moved_pts), np.array(ear_displacements), pinned, np.array(moved_pts)
    raise ValueError(f"no local warp for {proc}")


def chin_dimple(image: np.ndarray, pts: np.ndarray, amount: float) -> np.ndarray:
    """Shading, not geometry: a soft vertical shadow with faint highlights either side,
    centred between the lower lip and the chin tip."""
    h, w = image.shape[:2]
    iod = interocular(pts)
    cx = (pts[17][0] + pts[152][0]) / 2
    cy = pts[17][1] + 0.62 * (pts[152][1] - pts[17][1])
    sx, sy = 0.035 * iod, 0.16 * iod
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    shadow = np.exp(-(((xx - cx) / sx) ** 2 + ((yy - cy) / sy) ** 2) / 2)
    light = np.exp(-((((np.abs(xx - cx) - 2.2 * sx)) / (1.4 * sx)) ** 2 + ((yy - cy) / sy) ** 2) / 2)
    gain = 1 - 0.22 * amount * shadow + 0.05 * amount * light
    out = image.astype(np.float32) * gain[..., None]
    return np.clip(out, 0, 255).astype(np.uint8)


def apply_local(image: np.ndarray, landmarks: np.ndarray, proc: str, amount: float) -> np.ndarray:
    h, w = image.shape[:2]
    pts = _px(np.asarray(landmarks, dtype=float), w, h)
    if proc == "cleft_chin":
        return chin_dimple(image, pts, amount)
    moves = local_moves(proc, pts, amount)
    if len(moves) == 4:  # virtual points (otoplasty)
        _, disp, pinned, src = moves
        return warp(image, src, src + disp, pts[pinned])
    moved, disp, pinned = moves
    pinned = [i for i in pinned if i not in set(moved)]
    src = pts[moved]
    return warp(image, src, src + disp, pts[pinned])
