"""Face proportions from YouCam face-attr-analysis, compared with the reference ratios the
YouCam docs list. Wording is about proportion only. We never score attractiveness, and a
ratio away from the reference is described as a difference, not a flaw.

Plumb's legacy proportions reader, replaced by the local E10 module in R17 (plan §5.1).
Face-mapping credits (licences.json "concepts"): concept only, no code copied: YouCam API
documentation (the reference ratios it lists). Author: John Khan.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass

# (result key in data.results.facialratio, label, reference, what the parts are)
REFERENCES: list[tuple[str, str, list[float], str]] = [
    ("horizontal_third", "Face thirds", [33, 33, 33], "hairline to brow, brow to nose base, nose base to chin"),
    ("vertical_fifth", "Face fifths", [20, 20, 20, 20, 20], "face width split by the eyes and the gap between them"),
    ("face_aspect_ratio", "Face length to width", [1, 1.46], "width : length"),
    ("left_eye_aspect_ratio", "Left eye shape", [1, 3], "eye height : eye width"),
    ("right_eye_aspect_ratio", "Right eye shape", [1, 3], "eye height : eye width"),
    ("left_eyebrow_arch_to_eyebrow_width", "Left brow arch", [1, 1.618], "arch : brow width"),
    ("right_eyebrow_arch_to_eyebrow_width", "Right brow arch", [1, 1.618], "arch : brow width"),
    ("nose_aspect_ratio", "Nose shape", [1, 1.618], "nose width : nose length"),
    ("nose_width_to_mouth_width", "Nose to mouth width", [1, 1.618], "nose width : mouth width"),
    ("nose_to_lip_to_chin", "Nose, lips and chin", [1, 1.618], "nose base to lips : lips to chin"),
    ("upper_lip_to_lower_lip", "Upper to lower lip", [1, 1.618], "upper lip : lower lip"),
]


@dataclass
class Ratio:
    key: str
    label: str
    parts: str
    yours: list[float]
    reference: list[float]
    difference_percent: float
    plain: str


def _difference(yours: list[float], ref: list[float]) -> float:
    if len(yours) == 2 and len(ref) == 2:
        a, b = yours[1] / yours[0], ref[1] / ref[0]
        return (a - b) / b * 100
    # thirds and fifths: biggest share difference in percentage points
    total = sum(yours) or 1
    shares = [y / total * 100 for y in yours]
    ref_total = sum(ref)
    return max((s - r / ref_total * 100 for s, r in zip(shares, ref, strict=True)), key=abs)


def _plain(key: str, diff: float) -> str:
    size = abs(diff)
    if size < 3:
        return "Very close to the reference."
    amount = "a little" if size < 8 else "noticeably"
    if key == "face_aspect_ratio":
        return f"Your face is {amount} {'longer' if diff > 0 else 'shorter'} for its width than the reference."
    if key.endswith("eye_aspect_ratio"):
        return f"Your eye is {amount} {'wider and narrower' if diff > 0 else 'rounder'} than the reference shape."
    if key == "upper_lip_to_lower_lip":
        return f"Your lower lip is {amount} {'fuller' if diff > 0 else 'closer in size to the upper lip'} than the reference."
    if key in ("horizontal_third", "vertical_fifth"):
        return f"One section is {amount} {'larger' if diff > 0 else 'smaller'} than an even split."
    return f"{amount.capitalize()} {'above' if diff > 0 else 'below'} the reference."


def parse(results: dict) -> dict:
    ratios_in = results.get("facialratio") or {}
    out: list[Ratio] = []
    for key, label, ref, parts in REFERENCES:
        yours = ratios_in.get(key)
        if not isinstance(yours, list) or len(yours) != len(ref) or not all(isinstance(v, (int, float)) for v in yours):
            continue
        diff = _difference([float(v) for v in yours], ref)
        out.append(Ratio(key, label, parts, [round(float(v), 3) for v in yours], ref, round(diff, 1), _plain(key, diff)))
    return {
        "face_shape": results.get("faceshape"),
        "ratios": [asdict(r) for r in out],
        "note": "Reference ratios are the ones listed in the YouCam documentation. Faces vary, and a difference from a reference is not a problem to fix.",
    }
