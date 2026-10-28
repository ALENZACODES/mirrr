"""Short animated sequences of a light effect, frame by frame.

Light effects keep seeded, closed-form particle state, so frame n is the same
whether it is rendered alone or as part of a clip. This module renders a run
of frames for the reel and video lanes to encode; it never encodes video
itself. Only light looks animate; other kinds are still images.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass

from .apply import apply_look
from .model import LookKind, PackError
from .particles import LOOP_FRAMES
from .raster import ImageArray, check_image
from .registry import DEFAULT_REGISTRY, PackRegistry
from .target import FaceTarget

MAX_FRAMES = 120
FPS_CHOICES = (8, 12, 15, 24, 30)


@dataclass(frozen=True)
class Clip:
    """Rendered frames of one light look and the rate to play them at."""

    occasion: str
    look_id: str
    fps: int
    frames: tuple[ImageArray, ...]

    @property
    def seconds(self) -> float:
        """Running time of the clip."""
        return len(self.frames) / self.fps


def animate_look(
    image: ImageArray,
    occasion: str,
    look_id: str,
    target: FaceTarget,
    *,
    frames: int = 24,
    fps: int = 12,
    loop: bool = False,
    start: int = 0,
    strength: float | None = None,
    seed: int = 0,
    registry: PackRegistry | None = None,
) -> Clip:
    """Render frames start .. start + frames - 1 of a light effect.

    With loop=True the clip is exactly one period (LOOP_FRAMES) long, so it
    plays on repeat without a jump; frames is then ignored.
    """
    check_image(image)
    if loop:
        frames = LOOP_FRAMES
    look = (registry or DEFAULT_REGISTRY).get(occasion).look(look_id)
    if look.kind is not LookKind.LIGHT:
        raise PackError(f"look {look_id} is a {look.kind.value}; only light looks animate")
    if isinstance(frames, bool) or not isinstance(frames, int) or not 1 <= frames <= MAX_FRAMES:
        raise PackError(f"frames must be 1-{MAX_FRAMES}")
    if fps not in FPS_CHOICES:
        raise PackError(f"fps must be one of {FPS_CHOICES}")
    if isinstance(start, bool) or not isinstance(start, int) or start < 0:
        raise PackError("start must be a non-negative frame index")
    rendered = tuple(
        apply_look(
            image,
            occasion,
            look_id,
            target,
            strength=strength,
            seed=seed,
            frame=start + index,
            registry=registry,
        )
        for index in range(frames)
    )
    return Clip(occasion, look_id, fps, rendered)
