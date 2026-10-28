"""Two-stage local editor plan: small drag preview, full release render.

No render occurs here, so image data stays with its owner. Stale tokens are
invalidated on photo replacement or an intervening edit. Bounds are strict.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

from .strength import validate_level

Stage = Literal["drag", "release"]
DRAG_MAX_EDGE = 512
FULL_MAX_PIXELS = 12_000_000


@dataclass(frozen=True)
class PreviewJob:
    revision: int
    photo_hash: str
    level: float
    stage: Stage
    width: int
    height: int

    @property
    def full_resolution(self) -> bool:
        return self.stage == "release"


def plan_resolution(width: int, height: int, stage: Stage) -> tuple[int, int]:
    if type(width) is not int or type(height) is not int:
        raise ValueError("image dimensions must be integers")
    if width < 1 or height < 1 or width * height > FULL_MAX_PIXELS:
        raise ValueError("image exceeds the 12 MP limit")
    if stage not in ("drag", "release"):
        raise ValueError("unknown render stage")
    if stage == "release":
        return width, height
    ratio = min(1.0, DRAG_MAX_EDGE / max(width, height))
    return max(1, int(math.floor(width * ratio + 0.5))), max(1, int(math.floor(height * ratio + 0.5)))


class ProgressivePreview:
    """Revisions and image identity, not pixels, survive an edit gesture."""

    def __init__(self) -> None:
        self._revision = 0
        self._photo_hash: str | None = None

    @property
    def revision(self) -> int:
        return self._revision

    def request(self, photo_hash: str, width: int, height: int, level: float, stage: Stage) -> PreviewJob:
        if len(photo_hash) != 64 or any(char not in "0123456789abcdef" for char in photo_hash):
            raise ValueError("photo identity must be SHA-256")
        checked = validate_level(level)
        output = plan_resolution(width, height, stage)
        self._revision += 1
        self._photo_hash = photo_hash
        return PreviewJob(self._revision, photo_hash, checked, stage, *output)

    def is_current(self, job: PreviewJob) -> bool:
        return job.revision == self._revision and job.photo_hash == self._photo_hash

    def cancel(self) -> None:
        self._revision += 1
        self._photo_hash = None
