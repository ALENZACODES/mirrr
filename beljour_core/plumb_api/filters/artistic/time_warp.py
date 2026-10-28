"""Original in-memory progressive scan for the BELJOUR Studio Play row.

Each accepted camera frame contributes only the next contiguous strip to the
output framebuffer. Already frozen pixels are never resampled or revisited.
This is an optical/temporal effect, not a biometric or geometry model. It
requires a foreground capture initiated by the user; no frames are stored on
disk or sent to any provider. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Literal

import numpy as np
from numpy.typing import NDArray

from .types import MAX_PIXELS, Bytes, photo

Axis = Literal["horizontal", "vertical"]
Direction = Literal["forward", "reverse"]


class ScanState(str, Enum):
    READY = "ready"
    SCANNING = "scanning"
    COMPLETE = "complete"
    CANCELLED = "cancelled"
    DISPOSED = "disposed"


@dataclass(frozen=True)
class ScanOptions:
    axis: Axis = "horizontal"
    direction: Direction = "forward"
    step: int = 1

    def validated(self, width: int, height: int) -> ScanOptions:
        if self.axis not in ("horizontal", "vertical"):
            raise ValueError("scan axis must be horizontal or vertical")
        if self.direction not in ("forward", "reverse"):
            raise ValueError("scan direction must be forward or reverse")
        extent = height if self.axis == "horizontal" else width
        if isinstance(self.step, bool) or not isinstance(self.step, int):
            raise ValueError("scan step must be a positive integer")
        if not 1 <= self.step <= extent:
            raise ValueError("scan step cannot exceed the scan extent")
        return self


@dataclass(frozen=True)
class ScanResult:
    image: Bytes
    state: ScanState
    axis: Axis
    direction: Direction
    progress: float
    frozen: int
    extent: int
    next_line: int | None
    user_review_required: bool = True
    real_faces_evaluated: int = 0


class TimeWarpScan:
    """One bounded framebuffer and one original copy per active scan.

    Each advance() copies a single strip from its caller's current frame.
    Frames may be disposed immediately after the call. No clock, random
    number, external mask, uploaded image, or network service is required.
    """

    def __init__(self, first_frame: NDArray[np.generic], options: ScanOptions = ScanOptions()) -> None:
        original = photo(np.asarray(first_frame), max_pixels=MAX_PIXELS)
        self._width = int(original.shape[1])
        self._height = int(original.shape[0])
        self._channels = int(original.shape[2])
        self._options = options.validated(self._width, self._height)
        self._extent = self._height if options.axis == "horizontal" else self._width
        self._original: Bytes | None = original.copy()
        self._buffer: Bytes | None = original.copy()
        self._frozen = 0
        self._state = ScanState.READY

    @property
    def state(self) -> ScanState:
        return self._state

    @property
    def frozen(self) -> int:
        return self._frozen

    @property
    def extent(self) -> int:
        return self._extent

    @property
    def footprint_bytes(self) -> int:
        if self._state == ScanState.DISPOSED:
            return 0
        return self._width * self._height * self._channels * 2

    def _require_open(self) -> tuple[Bytes, Bytes]:
        if self._state == ScanState.DISPOSED:
            raise RuntimeError("the scan was disposed")
        original = self._original
        buffer = self._buffer
        if original is None or buffer is None:
            raise RuntimeError("scan buffer unavailable")
        return original, buffer

    def _current_line(self) -> int | None:
        if self._frozen >= self._extent or self._state in (
            ScanState.CANCELLED, ScanState.DISPOSED
        ):
            return None
        if self._options.direction == "forward":
            return self._frozen
        return self._extent - self._frozen - 1

    def snapshot(self, *, mark_line: bool = False) -> ScanResult:
        _, buffer = self._require_open()
        image = buffer.copy()
        next_line = self._current_line()
        if mark_line and next_line is not None:
            # Preview marker is drawn only on a copy. Export always remains
            # the exact frozen-strip pixels.
            if self._options.axis == "horizontal":
                image[next_line, :, :3] = [250, 250, 250]
            else:
                image[:, next_line, :3] = [250, 250, 250]
        return ScanResult(
            image=image,
            state=self._state,
            axis=self._options.axis,
            direction=self._options.direction,
            progress=self._frozen / self._extent,
            frozen=self._frozen,
            extent=self._extent,
            next_line=next_line,
        )

    def advance(self, frame: NDArray[np.generic]) -> ScanResult:
        _, buffer = self._require_open()
        if self._state in (ScanState.COMPLETE, ScanState.CANCELLED):
            raise RuntimeError("scan is already finished; restart to capture again")
        incoming = photo(np.asarray(frame), max_pixels=MAX_PIXELS)
        if incoming.shape != (self._height, self._width, self._channels):
            raise ValueError("incoming frame shape must match the initial frame")
        remaining = self._extent - self._frozen
        count = min(self._options.step, remaining)
        if self._options.direction == "forward":
            start = self._frozen
        else:
            start = self._extent - self._frozen - count
        stop = start + count
        if self._options.axis == "horizontal":
            buffer[start:stop, :, :] = incoming[start:stop, :, :]
        else:
            buffer[:, start:stop, :] = incoming[:, start:stop, :]
        self._frozen += count
        self._state = (
            ScanState.COMPLETE if self._frozen == self._extent
            else ScanState.SCANNING
        )
        return self.snapshot()

    def cancel(self) -> ScanResult:
        original, buffer = self._require_open()
        if self._state == ScanState.COMPLETE:
            raise RuntimeError("a completed scan cannot be cancelled")
        buffer[...] = original
        self._frozen = 0
        self._state = ScanState.CANCELLED
        return self.snapshot()

    def restart(self) -> ScanResult:
        original, buffer = self._require_open()
        buffer[...] = original
        self._frozen = 0
        self._state = ScanState.READY
        return self.snapshot()

    def dispose(self) -> None:
        if self._original is not None:
            self._original.fill(0)
        if self._buffer is not None:
            self._buffer.fill(0)
        self._original = None
        self._buffer = None
        self._frozen = 0
        self._state = ScanState.DISPOSED


__all__ = [
    "Axis", "Direction", "ScanOptions", "ScanResult", "ScanState", "TimeWarpScan",
]
