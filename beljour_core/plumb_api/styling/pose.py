"""Conservative hairstyle pose gate from user-supplied face landmarks.

MediaPipe Face Landmarker: landmark index topology only (runtime).
OpenFace: 2D alignment and coarse pose-suitability concepts only.
concept only, no code copied. Original mathematical implementation; no external weights.
The pose guard is a *photo suitability check*, not a person's physical assessment.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass

LEFT_EYE = 33
RIGHT_EYE = 263
NOSE = 1
CHIN = 152
FOREHEAD = 10
LEFT_SIDE = 234
RIGHT_SIDE = 454


@dataclass(frozen=True)
class PoseCheck:
    acceptable: bool
    roll_degrees: float | None
    yaw_proxy: float | None
    face_share: float | None
    reasons: tuple[str, ...]
    confidence: str

    def as_dict(self) -> dict:
        return {"acceptable": self.acceptable, "roll_degrees": self.roll_degrees,
                "yaw_proxy": self.yaw_proxy, "face_share": self.face_share,
                "reasons": list(self.reasons), "confidence": self.confidence}


def evaluate(points: Sequence[Sequence[float]] | None, *, width: int, height: int,
             max_roll: float = 14.0, max_yaw: float = 0.30, min_face_share: float = 0.20,
             min_border: float = 0.015) -> PoseCheck:
    """Check landmark geometry without inferring demographics or 'attractiveness'.

    ``yaw_proxy`` is normalised nose displacement relative to the eye midpoint; it is
    NOT a measured yaw angle. True pose requires a calibrated 3D head-pose estimate.
    A missing or malformed landmark set fails closed for a live hair request.
    """
    if width < 32 or height < 32 or width > 30000 or height > 30000:
        raise ValueError("Invalid image dimensions")
    if points is None or len(points) < 455:
        return PoseCheck(False, None, None, None, ("Face landmarks unavailable; choose a clear front-facing photo.",), "unavailable")
    needed = (LEFT_EYE, RIGHT_EYE, NOSE, CHIN, FOREHEAD, LEFT_SIDE, RIGHT_SIDE)
    parsed: dict[int, tuple[float, float]] = {}
    for index in needed:
        p = points[index]
        if len(p) < 2:
            return PoseCheck(False, None, None, None, ("Face points are incomplete.",), "unavailable")
        x, y = p[0], p[1]
        if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
            return PoseCheck(False, None, None, None, ("Face points are not numeric.",), "unavailable")
        if not math.isfinite(x) or not math.isfinite(y) or x < 0 or x > 1 or y < 0 or y > 1:
            return PoseCheck(False, None, None, None, ("Face points are outside the photograph.",), "unavailable")
        parsed[index] = (float(x), float(y))
    eye_l, eye_r = parsed[LEFT_EYE], parsed[RIGHT_EYE]
    iod_x = (eye_r[0] - eye_l[0]) * width
    iod_y = (eye_r[1] - eye_l[1]) * height
    iod = math.hypot(iod_x, iod_y)
    if iod < 12:
        return PoseCheck(False, None, None, None, ("Face is too small; move closer to the camera.",), "low")
    roll = math.degrees(math.atan2(iod_y, iod_x))
    nose_x = parsed[NOSE][0] * width
    mid_x = (eye_l[0] + eye_r[0]) * 0.5 * width
    yaw_proxy = abs(nose_x - mid_x) / iod
    side = abs(parsed[RIGHT_SIDE][0] - parsed[LEFT_SIDE][0])
    vertical = abs(parsed[CHIN][1] - parsed[FOREHEAD][1])
    face_share = max(0.0, min(side * vertical, 1.0)) ** 0.5
    extreme = any(value < min_border or value > 1 - min_border for idx in needed for value in parsed[idx])
    reasons = []
    if abs(roll) > max_roll:
        reasons.append("Head is tilted; straighten the photo or retake facing forward.")
    if yaw_proxy > max_yaw:
        reasons.append("Face is turned too far for a dependable haircut preview.")
    if face_share < min_face_share:
        reasons.append("Face is small in the frame; a closer portrait will work better.")
    if extreme:
        reasons.append("Head is near the picture edge; leave more space around the hair.")
    return PoseCheck(not reasons, round(roll, 2), round(yaw_proxy, 4), round(face_share, 4),
                     tuple(reasons), "geometric proxy")
