"""A stand in for YouCamClient that never touches the network.

Used by the test suite and by scripts/make_demo.py --synthetic, so the demo works before a
real recording exists. Every synthetic result carries "_synthetic": true and image results
get a visible "Sample" banner, so nobody mistakes them for real output.
"""
from __future__ import annotations

import io

from PIL import Image, ImageDraw

from ..services.imaging import burn_label
from ..youcam.client import TaskOutcome

SKIN_RAW = {"acne": 84.2, "moisture": 52.7, "oiliness": 63.1, "pore": 71.5, "redness": 68.4,
            "texture": 77.9, "wrinkle": 81.0, "dark_circle_v2": 58.3, "eye_bag": 74.0,
            "age_spot": 88.0, "radiance": 70.5, "firmness": 86.1, "droopy_upper_eyelid": 82.0,
            "droopy_lower_eyelid": 80.2, "tear_trough": 75.5}


def draw_sample_face(width: int = 900, height: int = 1100) -> bytes:
    """An illustrated face (not a person) for the synthetic demo."""
    img = Image.new("RGB", (width, height), (236, 238, 242))
    d = ImageDraw.Draw(img)
    cx, cy = width // 2, height // 2
    d.ellipse([cx - 330, cy - 420, cx + 330, cy + 430], fill=(196, 150, 122))          # face
    d.pieslice([cx - 360, cy - 520, cx + 360, cy - 40], 180, 360, fill=(58, 40, 32))  # hair
    for side in (-1, 1):
        ex = cx + side * 140
        d.ellipse([ex - 70, cy - 120, ex + 70, cy - 70], fill=(250, 250, 250))
        d.ellipse([ex - 26, cy - 121, ex + 26, cy - 69], fill=(70, 50, 40))
        d.line([ex - 85, cy - 175, ex + 85, cy - 190 if side > 0 else cy - 175], fill=(70, 50, 40), width=14)
    d.polygon([(cx, cy - 60), (cx - 45, cy + 90), (cx + 45, cy + 90)], fill=(184, 138, 110))
    d.chord([cx - 120, cy + 140, cx + 120, cy + 240], 0, 180, fill=(170, 84, 90))
    d.chord([cx - 120, cy + 120, cx + 120, cy + 200], 180, 360, fill=(160, 80, 86))
    out = io.BytesIO()
    img.save(out, "JPEG", quality=92)
    return out.getvalue()


def _banner(image: bytes, text: str) -> bytes:
    return burn_label(image, text)


class SyntheticYouCam:
    """Implements the slice of YouCamClient that the gateway uses."""

    def __init__(self) -> None:
        self.calls: list[tuple[str, dict]] = []

    async def credit(self) -> int | None:
        return None

    async def run(self, feature: str, image: bytes, content_type: str, payload: dict,
                  version: str = "v2.0", want_image: bool = True,
                  refs: dict[str, tuple[bytes, str]] | None = None) -> TaskOutcome:
        self.calls.append((feature, payload))
        if feature == "skin-analysis":
            output = [{"type": c, "raw_score": SKIN_RAW.get(c, 75.0),
                       "ui_score": min(99, int(SKIN_RAW.get(c, 75.0) * 0.6 + 40)), "mask_urls": []}
                      for c in payload["dst_actions"] if c != "skin_type"]
            return TaskOutcome("synthetic", {"output": output, "all": {"score": 72.4}, "skin_age": 31,
                                             "_synthetic": True})
        if feature == "skin-tone-analysis":
            return TaskOutcome("synthetic", {"color": {
                "skin_color": "#C4967A", "lip_color": "#A8545A", "eye_color": "#46302A",
                "eye_color_name": "Brown", "eyebrow_color": "#46302A", "hair_color": "#3A2820",
                "hair_color_name": "Brown"}, "_synthetic": True})
        if feature == "face-attr-analysis":
            return TaskOutcome("synthetic", {"faceshape": "Oval", "_synthetic": True, "facialratio": {
                "horizontal_third": [31, 35, 34], "vertical_fifth": [19, 21, 20, 21, 19],
                "face_aspect_ratio": [1, 1.38], "left_eye_aspect_ratio": [1, 2.9],
                "right_eye_aspect_ratio": [1, 3.05], "left_eyebrow_arch_to_eyebrow_width": [1, 1.52],
                "right_eyebrow_arch_to_eyebrow_width": [1, 1.49], "nose_aspect_ratio": [1, 1.21],
                "nose_width_to_mouth_width": [1, 1.44], "nose_to_lip_to_chin": [1, 2.02],
                "upper_lip_to_lower_lip": [1, 1.32]}})
        if feature in ("makeup-vto", "face-reshape", "face-lift", "skin-simulation"):
            what = {"makeup-vto": "try on"}.get(feature, "preview")
            return TaskOutcome("synthetic", {"url": "synthetic", "_synthetic": True},
                               _banner(image, f"Sample {what}: not a real YouCam result"), "image/jpeg")
        if feature == "aging":
            series: list[dict] = [{"meta": {"res_age": age}, "image": _banner(image, f"Sample age {age}: not a real YouCam result"),
                       "image_type": "image/jpeg"} for age in (20, 40, 60)]
            out = TaskOutcome("synthetic", {"output": [{"res_age": a} for a in (20, 40, 60)], "age": 32,
                                            "_synthetic": True}, series[0]["image"], "image/jpeg")
            out.series = series
            return out
        raise ValueError(f"synthetic client has no {feature}")
