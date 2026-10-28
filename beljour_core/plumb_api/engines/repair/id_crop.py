"""#64 ID photo crop helper: head-size guides for a common photo size, with no compliance claim.

From the face mesh: the chin (152), the top of the face oval (10) and an allowance above it
for the crown and hair (CROWN_ALLOWANCE of the chin-to-forehead height) give the head
height. The crop is sized so the head fills the middle of the preset's head-height band,
centred on the face (234-454), with TOP_SHARE of the spare height above the crown. Nothing
is rotated, scaled or retouched: the result is a plain crop of the original pixels (alpha
kept) plus guide lines (crown, chin, eye line, centre) and two plain checks: the eye line is
level within ROLL_LIMIT degrees and the nose sits within FRONTAL_LIMIT of the face centre.
A crop that would need pixels outside the photo is refused, never padded.

The presets are common published guide figures (ASSUMED, not checked against any issuing
office), and the label says so. Mirrored in web/src/engines/local/id-crop.ts.
Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any

import numpy as np
from numpy.typing import NDArray

from .photo_fix import MESSAGES, Status, check_photo, mesh_points, mesh_refusal

PRESETS: dict[str, dict[str, float]] = {
    "35x45mm": {"aspect": 35 / 45, "head_min": 0.70, "head_max": 0.80},
    "2x2in": {"aspect": 1.0, "head_min": 0.50, "head_max": 0.69},
}
CROWN_ALLOWANCE = 0.15
TOP_SHARE = 0.45
ROLL_LIMIT = 5.0
FRONTAL_LIMIT = 0.06
GUIDE_RGB = (0, 140, 255)
LABEL = ("Crop guide only: head size and centring for a common photo size. It does not check "
         "any official rules; confirm the size, background and head height your issuing office asks for.")


@dataclass(frozen=True)
class IdCrop:
    image: NDArray[np.uint8]
    status: Status
    reason_code: str
    label: str
    box: tuple[int, int, int, int] | None = None          # left, top, width, height in the photo
    guides: dict[str, float] = field(default_factory=dict)  # crop coordinates
    checks: dict[str, Any] = field(default_factory=dict)

    @property
    def message(self) -> str:
        return MESSAGES[self.reason_code]


def _half_up(x: float) -> int:
    return math.floor(x + 0.5)


def id_crop(image: object, landmarks: object, *, preset: str = "35x45mm") -> IdCrop:
    img = check_photo(image, 100.0)
    points = mesh_points(landmarks)
    h, w = img.shape[:2]
    if preset not in PRESETS:
        return IdCrop(img.copy(), "refused", "unknown_preset", LABEL)
    code = mesh_refusal(points, h, w)
    if code:
        return IdCrop(img.copy(), "refused", code, LABEL)
    spec = PRESETS[preset]
    top_face, chin = float(points[10][1]), float(points[152][1])
    crown = top_face - CROWN_ALLOWANCE * (chin - top_face)
    head = chin - crown
    share = (spec["head_min"] + spec["head_max"]) / 2
    crop_h = head / share
    crop_w = crop_h * spec["aspect"]
    cx = (float(points[234][0]) + float(points[454][0])) / 2
    left = _half_up(cx - crop_w / 2)
    top = _half_up(crown - TOP_SHARE * (crop_h - head))
    width, height = _half_up(crop_w), _half_up(crop_h)
    r, le = points[468], points[473]
    roll = math.degrees(math.atan2(float(le[1] - r[1]), float(le[0] - r[0])))
    face_width = float(points[454][0] - points[234][0])
    offset = (float(points[1][0]) - cx) / face_width if face_width > 0 else 0.0
    checks = {"preset": preset, "head_share": round(head / height, 4),
              "head_band": [spec["head_min"], spec["head_max"]],
              "roll_degrees": round(roll, 2), "level": abs(roll) <= ROLL_LIMIT,
              "nose_offset": round(offset, 4), "frontal": abs(offset) <= FRONTAL_LIMIT}
    box = (left, top, width, height)
    if left < 0 or top < 0 or left + width > w or top + height > h:
        return IdCrop(img.copy(), "refused", "not_enough_margin", LABEL, box, {}, checks)
    eye_y = (float(r[1]) + float(le[1])) / 2
    guides = {"crown_y": crown - top, "chin_y": chin - top, "eye_y": eye_y - top, "centre_x": cx - left}
    crop = img[top:top + height, left:left + width].copy()
    return IdCrop(crop, "edited", "edited", LABEL, box, guides, checks)


def guide_overlay(crop: IdCrop) -> NDArray[np.uint8]:
    """The crop with 1 px guide lines (crown, chin, eye line, centre) for display only."""
    out = crop.image.copy()
    if crop.status != "edited":
        return out
    h, w = out.shape[:2]
    for key in ("crown_y", "chin_y", "eye_y"):
        y = _half_up(crop.guides[key])
        if 0 <= y < h:
            out[y, :, :3] = GUIDE_RGB
    x = _half_up(crop.guides["centre_x"])
    if 0 <= x < w:
        out[:, x, :3] = GUIDE_RGB
    return out
