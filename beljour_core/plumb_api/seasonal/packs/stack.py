"""Stack several looks of one pack in a fixed, predictable order.

Users often pick a grade, a frame and a hat together. The order does not
depend on the order of taps: grades go first (so later overlays keep their
own colours), then frames, accessories, light effects and finally the
greeting on top. Each step goes through apply_look, so every locality rule
holds for the stack as a whole.
Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

from .apply import apply_look
from .model import LookKind, PackError
from .raster import ImageArray, check_image
from .registry import DEFAULT_REGISTRY, PackRegistry
from .target import FaceTarget

STACK_ORDER: tuple[LookKind, ...] = (
    LookKind.GRADE,
    LookKind.FRAME,
    LookKind.ACCESSORY,
    LookKind.LIGHT,
    LookKind.GREETING,
)
MAX_STACK = 6


@dataclass(frozen=True)
class StackItem:
    """One look in a stack with an optional level (None uses the look default)."""

    look_id: str
    strength: float | None = None


def stack_order(
    occasion: str,
    items: Sequence[StackItem],
    registry: PackRegistry | None = None,
) -> tuple[StackItem, ...]:
    """Items sorted into drawing order; ties keep the caller's order."""
    pack = (registry or DEFAULT_REGISTRY).get(occasion)
    if not items:
        raise PackError("a stack needs at least one look")
    if len(items) > MAX_STACK:
        raise PackError(f"a stack holds at most {MAX_STACK} looks")
    ids = [item.look_id for item in items]
    repeated = sorted({look_id for look_id in ids if ids.count(look_id) > 1})
    if repeated:
        raise PackError(f"looks may appear once in a stack: {repeated}")
    grades = [item for item in items if pack.look(item.look_id).kind is LookKind.GRADE]
    if len(grades) > 1:
        raise PackError("a stack takes one grade; grades on grades drift the colours")
    ranked = sorted(
        enumerate(items),
        key=lambda pair: (STACK_ORDER.index(pack.look(pair[1].look_id).kind), pair[0]),
    )
    return tuple(item for _, item in ranked)


def apply_looks(
    image: ImageArray,
    occasion: str,
    items: Sequence[StackItem | str],
    target: FaceTarget | None = None,
    *,
    seed: int = 0,
    frame: int = 0,
    greeting: str | None = None,
    registry: PackRegistry | None = None,
) -> ImageArray:
    """Apply several looks of one occasion in stack order and return the picture."""
    current = check_image(image)
    normalised = [item if isinstance(item, StackItem) else StackItem(item) for item in items]
    for index, item in enumerate(stack_order(occasion, normalised, registry)):
        current = apply_look(
            current,
            occasion,
            item.look_id,
            target,
            strength=item.strength,
            seed=seed + index,
            frame=frame,
            greeting=greeting,
            registry=registry,
        )
    return current
