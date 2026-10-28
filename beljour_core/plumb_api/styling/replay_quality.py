"""Hair cassette Q15 schema checks and Q16 face-outside-hair SSIM.

Uses the existing synthetic input face and synthetic cassette only. The quality
score says whether the replay edits untouched face skin; it says nothing about
photographic hair realism. Before a real YouCam render is added, the report must
continue to say "synthetic Q16" and competitive scores stay "Not tested".
Author: John Khan.
"""
from __future__ import annotations

import io
import json
import math
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image

from ..demo.synthetic import draw_sample_face
from .catalogue import CASSETTE_PATH, cassette_templates

REPLAY_IMAGE = CASSETTE_PATH.with_name("s2_hairstyle.blob1.jpeg")


@dataclass(frozen=True)
class CassetteCheck:
    q15_passed: bool
    q16_passed: bool
    ssim: float
    face_mean_absolute_difference: float
    ignored_hair_top: int
    note: str

    def as_dict(self) -> dict:
        return dict(q15_passed=self.q15_passed, q16_passed=self.q16_passed,
                    ssim=self.ssim, face_mean_absolute_difference=self.face_mean_absolute_difference,
                    ignored_hair_top=self.ignored_hair_top, note=self.note)


def inspect_replay(path: Path = CASSETTE_PATH) -> dict[str, object]:
    """Check offline cassette response sequence and synthetic provenance (Q15)."""
    raw = json.loads(path.read_text(encoding="utf-8"))
    if raw.get("format") != "beljour-cassette/1" or raw.get("synthetic") is not True:
        raise ValueError("The S1 hair cassette is not an explicitly synthetic replay")
    steps = raw.get("interactions", [])
    if not isinstance(steps, list) or len(steps) < 8:
        raise ValueError("The S1 replay lacks the full task lifecycle")
    templates = cassette_templates(path)
    posts = [s for s in steps if s.get("request", {}).get("method") == "POST"]
    task_posts = [s for s in posts if s.get("request", {}).get("path") == "/s2s/v2.0/task/hair-style"]
    if len(task_posts) != 1:
        raise ValueError("Replay must contain one hairstyle task creation")
    polls = [s for s in steps if s.get("request", {}).get("method") == "GET" and
             "/task/hair-style/task-" in s.get("request", {}).get("path", "")]
    statuses = [s.get("response", {}).get("json", {}).get("data", {}).get("task_status") for s in polls]
    if not statuses or statuses[-1] != "success" or statuses.count("success") != 1:
        raise ValueError("Replay has no successful task completion")
    if not any(s.get("request", {}).get("path") == "/s2s/v2.0/task/delete" for s in posts):
        raise ValueError("Replay is missing the deletion step")
    downloads = [s for s in steps if s.get("request", {}).get("host") == "results"]
    if len(downloads) != 1 or downloads[0].get("response", {}).get("blob") != REPLAY_IMAGE.name:
        raise ValueError("Replay must name exactly the checked synthetic image")
    if REPLAY_IMAGE.stat().st_size < 1000:
        raise ValueError("The synthetic hair result image is absent or too small")
    return {"template_count": len(templates), "poll_count": len(polls),
            "synthetic": True, "image_blob": REPLAY_IMAGE.name}


def _box_mean(img: np.ndarray, win: int) -> np.ndarray:
    """Mean over every ``win`` x ``win`` window (valid region only), per channel."""
    summed = np.cumsum(np.cumsum(img, axis=0), axis=1)
    summed = np.pad(summed, ((1, 0), (1, 0), (0, 0)))
    total = summed[win:, win:] - summed[:-win, win:] - summed[win:, :-win] + summed[:-win, :-win]
    return total / float(win * win)


def structural_similarity(a: np.ndarray, b: np.ndarray, *, data_range: float = 255.0, win: int = 7) -> float:
    """Mean SSIM (Wang et al. 2004) with a uniform 7x7 window, averaged over RGB channels.

    Own NumPy code (no scikit-image dependency). Same constants as the paper
    (K1=0.01, K2=0.03) and sample covariance over each window; only windows fully
    inside the image are scored.
    """
    x = a.astype(np.float64)
    y = b.astype(np.float64)
    n = win * win
    cov_norm = n / (n - 1.0)
    ux, uy = _box_mean(x, win), _box_mean(y, win)
    vx = cov_norm * (_box_mean(x * x, win) - ux * ux)
    vy = cov_norm * (_box_mean(y * y, win) - uy * uy)
    vxy = cov_norm * (_box_mean(x * y, win) - ux * uy)
    c1 = (0.01 * data_range) ** 2
    c2 = (0.03 * data_range) ** 2
    s_map = ((2 * ux * uy + c1) * (2 * vxy + c2)) / ((ux * ux + uy * uy + c1) * (vx + vy + c2))
    return float(s_map.mean())


def face_outside_hair_ssim(before: bytes, after: bytes, *, box: tuple[float, float, float, float] =
                           (0.24, 0.36, 0.76, 0.82)) -> tuple[float, float]:
    """Evaluate a conservative central face rectangle, excluding hair and SAMPLE banner.

    The supported replay fixture is a drawn oval. A more detailed mask from the real
    segmentation model belongs to the external ``make realface`` suite. Q16 passes at
    >=0.95 SSIM on *only the non-hair face* at this synthetic resolution.
    """
    with Image.open(io.BytesIO(before)) as source, Image.open(io.BytesIO(after)) as result:
        left = np.asarray(source.convert("RGB"), dtype=np.uint8)
        right = np.asarray(result.convert("RGB"), dtype=np.uint8)
    if left.shape != right.shape or left.ndim != 3 or left.shape[2] != 3:
        raise ValueError("Q16 images must share width, height and RGB channels")
    height, width = left.shape[:2]
    x0, y0, x1, y1 = box
    if any(not math.isfinite(v) for v in box) or not (0 <= x0 < x1 <= 1 and 0 <= y0 < y1 <= 1):
        raise ValueError("Face region must fit the image")
    x0p, x1p = int(width * x0), int(width * x1)
    y0p, y1p = int(height * y0), int(height * y1)
    a, b = left[y0p:y1p, x0p:x1p], right[y0p:y1p, x0p:x1p]
    if min(a.shape[:2]) < 7:
        raise ValueError("Q16 face region is too small")
    ssim = structural_similarity(a, b, data_range=255.0)
    difference = float(np.abs(a.astype(np.float32) - b.astype(np.float32)).mean())
    return ssim, difference


def synthetic_quality() -> CassetteCheck:
    lifecycle = inspect_replay()
    score, diff = face_outside_hair_ssim(draw_sample_face(), REPLAY_IMAGE.read_bytes())
    return CassetteCheck(bool(lifecycle), score >= 0.95, round(score, 6), round(diff, 4),
                         int(0.36 * 1100), "S1 synthetic illustration only; no verified YouCam outcome or human score")
