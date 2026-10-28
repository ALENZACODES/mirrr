"""apply_look: the one call the photo editor makes to put a look on a picture.

The caller passes the picture, the occasion and look ids, and for accessories
and light effects the chosen face from the multi-face picker. The input array
is never modified; a new array of the same shape is returned.
Author: John Khan.
"""

from __future__ import annotations

from .model import PackError, validate_strength
from .particles import MAX_FRAME
from .raster import ImageArray, check_image
from .registry import DEFAULT_REGISTRY, PackRegistry
from .render import RenderRequest, render
from .target import FaceTarget


def apply_look(
    image: ImageArray,
    occasion: str,
    look_id: str,
    target: FaceTarget | None = None,
    *,
    strength: float | None = None,
    seed: int = 0,
    frame: int = 0,
    greeting: str | None = None,
    registry: PackRegistry | None = None,
) -> ImageArray:
    """Apply one look of an occasion's pack and return the new picture.

    strength is the app level (1.0-5.0, 0.1 steps); None uses the look default.
    seed fixes the random layout; frame steps light effects for animation.
    greeting replaces the pack's default text for greeting looks.
    """
    checked = check_image(image)
    if isinstance(seed, bool) or not isinstance(seed, int):
        raise PackError("seed must be an integer")
    if isinstance(frame, bool) or not isinstance(frame, int) or not 0 <= frame <= MAX_FRAME:
        raise PackError(f"frame must be an integer from 0 to {MAX_FRAME}")
    pack = (registry or DEFAULT_REGISTRY).get(occasion)
    look = pack.look(look_id)
    level = look.default_strength if strength is None else validate_strength(strength)
    request = RenderRequest(
        image=checked,
        look=look,
        palette=pack.palette,
        occasion=pack.occasion,
        amount=look.amount(level),
        seed=seed,
        target=target,
        frame=frame,
        greeting=pack.greeting if greeting is None else greeting,
    )
    return render(request)
