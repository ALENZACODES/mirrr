"""Renderer registry and the single entry point that applies one look.

Each look names a renderer. Built-in renderers cover the five look kinds;
other packages may add their own with register_renderer. Whatever a renderer
does, render() re-applies the locality rule afterwards: for accessories and
light effects every pixel outside the chosen face's allowed area is copied
back from the input, so bystanders, eyes and the mouth stay pixel-identical.
Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, replace

from .accessories import render_accessory
from .facepaint import render_paint
from .frames import render_frame
from .grades import apply_grade
from .greeting import render_greeting
from .model import Look, LookKind, PackError, Palette
from .particles import render_light
from .raster import ImageArray, check_image, keep_only
from .target import FaceTarget, allowed_mask


@dataclass(frozen=True)
class RenderRequest:
    """Everything a renderer may use. The target is None for whole-image looks."""

    image: ImageArray
    look: Look
    palette: Palette
    occasion: str
    amount: float
    seed: int
    target: FaceTarget | None
    frame: int
    greeting: str

    def face(self) -> FaceTarget:
        """The chosen face, required by face-anchored renderers."""
        if self.target is None:
            raise PackError(f"look {self.look.id} needs the chosen face (a FaceTarget)")
        return self.target


Renderer = Callable[[RenderRequest], ImageArray]


def _frame(request: RenderRequest) -> ImageArray:
    return render_frame(
        request.image, request.look, request.palette, request.occasion, request.amount, request.seed
    )


def _grade(request: RenderRequest) -> ImageArray:
    return apply_grade(request.image, request.look, request.palette, request.amount)


def _wear(request: RenderRequest) -> ImageArray:
    return render_accessory(
        request.image,
        request.look,
        request.palette,
        request.occasion,
        request.face(),
        request.amount,
        request.seed,
    )


def _paint(request: RenderRequest) -> ImageArray:
    return render_paint(
        request.image,
        request.look,
        request.palette,
        request.occasion,
        request.face(),
        request.amount,
        request.seed,
    )


def _light(request: RenderRequest) -> ImageArray:
    return render_light(
        request.image,
        request.look,
        request.palette,
        request.occasion,
        request.face(),
        request.amount,
        request.seed,
        request.frame,
    )


def _banner(request: RenderRequest) -> ImageArray:
    return render_greeting(
        request.image,
        request.look,
        request.palette,
        request.occasion,
        request.greeting,
        request.amount,
        request.seed,
    )


_RENDERERS: dict[str, tuple[LookKind, Renderer]] = {
    "frame.border": (LookKind.FRAME, _frame),
    "grade.split_tone": (LookKind.GRADE, _grade),
    "accessory.wear": (LookKind.ACCESSORY, _wear),
    "accessory.paint": (LookKind.ACCESSORY, _paint),
    "light.particles": (LookKind.LIGHT, _light),
    "greeting.banner": (LookKind.GREETING, _banner),
}


def register_renderer(name: str, kind: LookKind, renderer: Renderer) -> None:
    """Add a renderer under a new name; looks of that kind may then use it."""
    if not name or "." not in name:
        raise PackError("renderer names look like 'kind.name'")
    if name in _RENDERERS:
        raise PackError(f"renderer {name!r} is already registered")
    if not isinstance(kind, LookKind):
        raise PackError("renderer kind must be a LookKind")
    _RENDERERS[name] = (kind, renderer)


def renderer_names() -> tuple[str, ...]:
    """Registered renderer names."""
    return tuple(_RENDERERS)


def check_look_renderer(look: Look) -> None:
    """Fail when a look names a missing renderer or one of another kind."""
    entry = _RENDERERS.get(look.renderer)
    if entry is None:
        raise PackError(f"look {look.id}: unknown renderer {look.renderer!r}")
    if entry[0] is not look.kind:
        raise PackError(
            f"look {look.id}: renderer {look.renderer} draws {entry[0].value}, "
            f"not {look.kind.value}"
        )


def render(request: RenderRequest) -> ImageArray:
    """Run a look's renderer and enforce the locality rule on the result."""
    check_image(request.image)
    check_look_renderer(request.look)
    _, renderer = _RENDERERS[request.look.renderer]
    # Renderers get a read-only copy: the caller's array can never be changed,
    # and the guard below compares against pixels no renderer could touch.
    original = request.image.copy()
    original.setflags(write=False)
    if request.look.kind.needs_face:
        target = request.face()
        height, width = original.shape[:2]
        target.check_on_image(width, height)
    result = check_image(renderer(replace(request, image=original)))
    if result.shape != original.shape:
        raise PackError(f"renderer {request.look.renderer} changed the image size")
    if request.look.kind.needs_face:
        assert request.target is not None
        allowed = allowed_mask(request.target, original.shape[1], original.shape[0])
        return keep_only(original, result, allowed)
    if result is original or not result.flags.writeable:
        return result.copy()
    return result
