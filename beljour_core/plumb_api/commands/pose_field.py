"""Bounded, photo-scoped full-dose pose field for rapid decimal-level previews.

The field stores only displacements computed from checked controls. It cannot
outlive its owning photo session; no pixels, filenames or embeddings are kept.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import numpy.typing as npt

from .errors import CommandValidationError
from .pose_geometry import PoseEvidence, displacement

FloatArray = npt.NDArray[np.float64]
MAX_PREPARED_PIXELS = 262_144


@dataclass(frozen=True, slots=True, repr=False)
class PreparedPoseField:
    width: int
    height: int
    dx: FloatArray
    dy: FloatArray

    def __post_init__(self) -> None:
        if (
            type(self.width) is not int
            or type(self.height) is not int
            or self.width < 1
            or self.height < 1
            or self.width * self.height > MAX_PREPARED_PIXELS
            or self.dx.shape != (self.height, self.width)
            or self.dy.shape != (self.height, self.width)
            or self.dx.dtype != np.dtype(np.float64)
            or self.dy.dtype != np.dtype(np.float64)
            or not bool(np.all(np.isfinite(self.dx)))
            or not bool(np.all(np.isfinite(self.dy)))
        ):
            raise CommandValidationError("invalid_pose_field", "Prepared pose field is malformed.")
        self.dx.setflags(write=False)
        self.dy.setflags(write=False)

    @property
    def retained_bytes(self) -> int:
        return self.dx.nbytes + self.dy.nbytes

    def tile(
        self,
        y0: int,
        y1: int,
        x0: int,
        x1: int,
        dose: float,
    ) -> tuple[FloatArray, FloatArray]:
        if (
            not 0 <= y0 < y1 <= self.height
            or not 0 <= x0 < x1 <= self.width
            or not 0.0 <= dose <= 1.0
        ):
            raise CommandValidationError("invalid_pose_field", "Pose tile range is invalid.")
        return (
            np.asarray(self.dx[y0:y1, x0:x1] * dose, dtype=np.float64),
            np.asarray(self.dy[y0:y1, x0:x1] * dose, dtype=np.float64),
        )

    def public_metadata(self) -> dict[str, int | bool]:
        return {
            "width": self.width,
            "height": self.height,
            "retained_bytes": self.retained_bytes,
            "synthetic_quality_only": True,
        }


def prepare_pose_field(
    evidence: PoseEvidence,
    *,
    pixel_limit: int = MAX_PREPARED_PIXELS,
) -> PreparedPoseField | None:
    """Return None, not an over-budget buffer, on full-size export geometry."""
    if not isinstance(evidence, PoseEvidence):
        raise CommandValidationError("invalid_pose_field", "Checked pose control record required.")
    if type(pixel_limit) is not int or not 1 <= pixel_limit <= MAX_PREPARED_PIXELS:
        raise CommandValidationError("invalid_pose_field", "Prepared-field budget is invalid.")
    if evidence.width * evidence.height > pixel_limit:
        return None
    yy, xx = np.indices((evidence.height, evidence.width), dtype=np.float64)
    dx, dy = displacement(evidence, xx, yy, 1.0)
    return PreparedPoseField(
        evidence.width,
        evidence.height,
        np.array(dx, dtype=np.float64, copy=True),
        np.array(dy, dtype=np.float64, copy=True),
    )
