"""Original still-photo ear, nose and tongue artwork. Author: John Khan."""
from __future__ import annotations

from dataclasses import dataclass

from .common import (
    Image,
    Mask,
    Point,
    alpha_blend,
    ellipse_mask,
    line_mask,
    mask_union,
    restore,
    triangle_mask,
    validate_image,
)

LABEL = "Playful Paws — original drawn ears and nose; tongue appears only for an open mouth."


@dataclass(frozen=True)
class FunOptions:
    amount: float = 1.0
    mouth_open: float = 0.0

    def __post_init__(self) -> None:
        if not 0.0 <= self.amount <= 1.0 or not 0.0 <= self.mouth_open <= 1.0:
            raise ValueError("controls must be 0..1")


def render(
    image: Image,
    left_eye: Point,
    right_eye: Point,
    nose: Point,
    mouth: Point,
    options: FunOptions | None = None,
    *,
    iris: Mask | None = None,
    protected: Mask | None = None,
) -> Image:
    options = FunOptions() if options is None else options
    height, width = validate_image(image)
    iod = max(abs(right_eye.x - left_eye.x), 1.0)
    top = min(left_eye.y, right_eye.y) - iod * 0.86
    left_ear = triangle_mask(
        height,
        width,
        Point(left_eye.x - iod * 0.47, left_eye.y - iod * 0.26),
        Point(left_eye.x - iod * 0.22, top),
        Point(left_eye.x + iod * 0.02, left_eye.y - iod * 0.28),
    )
    right_ear = triangle_mask(
        height,
        width,
        Point(right_eye.x - iod * 0.02, right_eye.y - iod * 0.28),
        Point(right_eye.x + iod * 0.22, top),
        Point(right_eye.x + iod * 0.47, right_eye.y - iod * 0.26),
    )
    ears = mask_union(left_ear, right_ear)
    out = alpha_blend(image, (104, 66, 52), ears, int(235 * options.amount))
    inner_left = triangle_mask(
        height,
        width,
        Point(left_eye.x - iod * 0.37, left_eye.y - iod * 0.27),
        Point(left_eye.x - iod * 0.22, top + iod * 0.18),
        Point(left_eye.x - iod * 0.07, left_eye.y - iod * 0.29),
    )
    inner_right = triangle_mask(
        height,
        width,
        Point(right_eye.x + iod * 0.07, right_eye.y - iod * 0.29),
        Point(right_eye.x + iod * 0.22, top + iod * 0.18),
        Point(right_eye.x + iod * 0.37, right_eye.y - iod * 0.27),
    )
    out = alpha_blend(out, (190, 123, 118), mask_union(inner_left, inner_right), int(205 * options.amount))
    nose_mask = ellipse_mask(height, width, nose, iod * 0.105, iod * 0.075)
    out = alpha_blend(out, (63, 48, 45), nose_mask, int(230 * options.amount))
    if options.mouth_open >= 0.35:
        tongue = ellipse_mask(height, width, Point(mouth.x, mouth.y + iod * 0.18), iod * 0.12, iod * 0.22)
        out = alpha_blend(out, (199, 101, 116), tongue, int(225 * options.amount))
        groove = line_mask(
            height,
            width,
            Point(mouth.x, mouth.y + iod * 0.13),
            Point(mouth.x, mouth.y + iod * 0.28),
            max(1.0, iod * 0.012),
        )
        out = alpha_blend(out, (132, 66, 81), groove, int(150 * options.amount))
    if iris is not None:
        out = restore(out, image, iris)
    return restore(out, image, protected)
