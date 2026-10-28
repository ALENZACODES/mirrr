"""LS7 beard regions from the 478-point face mesh: full beard area, moustache, neckline, edge.

Built from the R4 canonical contours (engines/core/regions.py) and R5's named anatomy
points; no second landmark table. In the face frame (engines/shape/geometry.frame):
* jaw = the face-oval loop from landmark 323 down round the chin to landmark 93;
* the cheek line runs from each end of the jaw 60% of the way to the mouth corner;
* the moustache top sits 55% of the way from each mouth corner up to the nose wing,
  and 5% of the inter-ocular distance (IOD) under the nose base in the middle;
* the lips (outer contour) grown by 5% IOD are cut out;
* neckline: "high" stops at the jaw, "natural" and "low" add a band under the jaw
  18% or 40% IOD deep; edge "sharp" feathers 0.75 px, "faded" 10% IOD (3% IOD on the
  narrow moustache band, which would otherwise have no fully weighted core).
Inspiration (licences.json "concepts"): MediaPipe Face Landmarker mesh indices (runtime
data); face-parsing.PyTorch (named facial regions such as a beard area);
concept only, no code copied. Mirrored in web/src/engines/local/beard.ts.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ..core.distance import dilate, feather
from ..core.masks import subtract, union
from ..core.regions import FACE_OVAL, LIPS_OUTER, polygon
from ..proportions.anatomy import LANDMARKS
from ..shape.geometry import Frame, check_face, frame

JAW_START, JAW_END = FACE_OVAL.index(323), FACE_OVAL.index(93)
NECK_START, NECK_END = FACE_OVAL.index(288), FACE_OVAL.index(58)
UPPER_LIP = (291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61)
NECKLINES = {"high": 0.0, "natural": 0.18, "low": 0.40}
EDGES = {"sharp": None, "faded": 0.10}
MOUSTACHE_FEATHER = 0.3
CHEEK_SHARE, TOP_SHARE, NOSE_GAP, LIP_MARGIN, CORNER_OUT = 0.60, 0.55, 0.05, 0.05, 0.12
Mask = NDArray[np.float32]


@dataclass(frozen=True)
class BeardArea:
    hard: Mask          # 0/1 area
    weight: Mask        # feathered weight (edge style)
    frame: Frame


def _p(face: np.ndarray, name_or_index: str | int) -> np.ndarray:
    i = LANDMARKS[name_or_index] if isinstance(name_or_index, str) else name_or_index
    return face[i]


def _lerp(a: np.ndarray, b: np.ndarray, t: float) -> np.ndarray:
    return a + t * (b - a)


def outline(face: np.ndarray, f: Frame, style_region: str) -> list[np.ndarray]:
    """Polygon of the full beard area ("full") or the moustache ("moustache")."""
    across, down, iod = f.axis_across, f.axis_down, f.iod
    mouth_r, mouth_l = _p(face, "right_mouth"), _p(face, "left_mouth")
    top_r = _lerp(mouth_r, _p(face, "right_ala"), TOP_SHARE)
    top_l = _lerp(mouth_l, _p(face, "left_ala"), TOP_SHARE)
    nose = _p(face, "subnasale") + down * NOSE_GAP * iod
    if style_region == "moustache":
        lip = [face[i] - down * 0.015 * iod for i in UPPER_LIP]
        corner_l, corner_r = mouth_l + across * 0.05 * iod, mouth_r - across * 0.05 * iod
        return [corner_l, *lip, corner_r, top_r, nose, top_l]
    if style_region != "full":
        raise ValueError("region must be full or moustache")
    jaw = [face[i] for i in FACE_OVAL[JAW_START:JAW_END + 1]]
    cheek_r = _lerp(face[93], mouth_r, CHEEK_SHARE)
    cheek_l = _lerp(face[323], mouth_l, CHEEK_SHARE)
    corner_r, corner_l = mouth_r - across * CORNER_OUT * iod, mouth_l + across * CORNER_OUT * iod
    return [*jaw, cheek_r, corner_r, top_r, nose, top_l, corner_l, cheek_l]


def area(face: object, height: int, width: int, *, region: str = "full", neckline: str = "natural",
         edge: str = "faded") -> BeardArea:
    """Beard area masks for one face (pixel landmarks)."""
    pts = check_face(face)
    if neckline not in NECKLINES:
        raise ValueError(f"neckline must be one of {', '.join(NECKLINES)}")
    if edge not in EDGES:
        raise ValueError(f"edge must be one of {', '.join(EDGES)}")
    f = frame(pts)
    hard = polygon(height, width, np.array(outline(pts, f, region)), 4)
    depth = NECKLINES[neckline] * f.iod
    if region == "full" and depth > 0:
        jaw = [pts[i] for i in FACE_OVAL[NECK_START:NECK_END + 1]]
        band = [*jaw, *[p + f.axis_down * depth for p in reversed(jaw)]]
        hard = union(hard, polygon(height, width, np.array(band), 4))
    lips = polygon(height, width, pts[list(LIPS_OUTER)], 2)
    hard = subtract(hard, dilate(lips, LIP_MARGIN * f.iod))
    on = (hard >= 0.5).astype(np.float32)
    if not on.any():
        raise ValueError("the beard area is empty for this face")
    radius = EDGES[edge]
    if radius is not None and region == "moustache":
        radius *= MOUSTACHE_FEATHER
    weight = feather(on, 0.75 if radius is None else max(1.0, radius * f.iod), "inside")
    return BeardArea(on, weight.astype(np.float32), f)
