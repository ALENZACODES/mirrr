"""Deterministic synthetic parity vectors for the six R19B easy filters. Author: John Khan."""
from __future__ import annotations

import base64
from typing import Any

import numpy as np

from . import bridal, eye_colour, fun, glasses, retro, summer
from .common import Image, Mask, Point, ellipse_mask, image_sha256, mask_union, ring_mask

WIDTH = 28
HEIGHT = 24


def _b64(array: np.ndarray) -> str:
    return base64.b64encode(np.asarray(array, dtype=np.uint8).tobytes()).decode("ascii")


def fixture() -> tuple[Image, dict[str, Mask], dict[str, Point]]:
    yy, xx = np.mgrid[0:HEIGHT, 0:WIDTH]
    image = np.zeros((HEIGHT, WIDTH, 4), dtype=np.uint8)
    image[..., 0] = np.clip(58 + xx * 5 + yy * 2, 0, 255)
    image[..., 1] = np.clip(49 + xx * 4 + yy * 3, 0, 255)
    image[..., 2] = np.clip(44 + xx * 3 + yy * 2, 0, 255)
    image[..., 3] = 255
    points = {
        "left_eye": Point(9.0, 9.0),
        "right_eye": Point(19.0, 9.0),
        "nose": Point(14.0, 12.5),
        "mouth": Point(14.0, 17.0),
    }
    left_iris = ellipse_mask(HEIGHT, WIDTH, points["left_eye"], 2.3, 1.7)
    right_iris = ellipse_mask(HEIGHT, WIDTH, points["right_eye"], 2.3, 1.7)
    iris = mask_union(left_iris, right_iris)
    pupil = mask_union(
        ellipse_mask(HEIGHT, WIDTH, points["left_eye"], 0.75, 0.75),
        ellipse_mask(HEIGHT, WIDTH, points["right_eye"], 0.75, 0.75),
    )
    highlight = np.zeros((HEIGHT, WIDTH), dtype=np.uint8)
    highlight[8, 9] = 255
    highlight[8, 19] = 255
    skin = ellipse_mask(HEIGHT, WIDTH, Point(14.0, 12.0), 9.0, 10.5)
    lips = ellipse_mask(HEIGHT, WIDTH, points["mouth"], 3.2, 1.2)
    eyes = mask_union(
        ring_mask(HEIGHT, WIDTH, points["left_eye"], 3.2, 2.5, 0.66),
        ring_mask(HEIGHT, WIDTH, points["right_eye"], 3.2, 2.5, 0.66),
    )
    cheeks = mask_union(
        ellipse_mask(HEIGHT, WIDTH, Point(8.4, 13.8), 2.8, 2.0),
        ellipse_mask(HEIGHT, WIDTH, Point(19.6, 13.8), 2.8, 2.0),
    )
    cheek_nose = ellipse_mask(HEIGHT, WIDTH, Point(14.0, 13.0), 7.0, 4.0)
    protected = np.zeros((HEIGHT, WIDTH), dtype=np.uint8)
    protected[13, 10] = 255
    protected[15, 17] = 255
    background = np.where(skin > 0, 0, 255).astype(np.uint8)
    return image, {
        "iris": iris,
        "pupil": pupil,
        "highlight": highlight,
        "skin": skin,
        "lips": lips,
        "eyes": eyes,
        "cheeks": cheeks,
        "cheek_nose": cheek_nose,
        "protected": protected,
        "background": background,
    }, points


def vectors() -> dict[str, Any]:
    image, masks, points = fixture()
    retro_out = retro.render(
        image,
        retro.RetroOptions(strength=0.68, grain=0.32, backdrop=0.22, seed=31),
        protected=masks["protected"],
        background=masks["background"],
        iris=masks["iris"],
    )
    eye_out = eye_colour.render(
        image,
        masks["iris"],
        masks["pupil"],
        masks["highlight"],
        eye_colour.EyeColourOptions((88, 126, 144), 0.70),
        protected=masks["protected"],
    )
    glasses_out = glasses.render(
        image,
        points["left_eye"],
        points["right_eye"],
        glasses.GlassesOptions("round", (44, 39, 37), 1.02, 0.055),
        iris=masks["iris"],
        protected=masks["protected"],
    )
    fun_out = fun.render(
        image,
        points["left_eye"],
        points["right_eye"],
        points["nose"],
        points["mouth"],
        fun.FunOptions(0.92, 0.72),
        iris=masks["iris"],
        protected=masks["protected"],
    )
    summer_out = summer.render(
        image,
        masks["skin"],
        summer.SummerOptions("olive", 0.30, 0.65, 27),
        cheek_nose=masks["cheek_nose"],
        iris=masks["iris"],
        protected=masks["protected"],
    )
    bridal_out = bridal.render(
        image,
        masks["skin"],
        masks["lips"],
        masks["eyes"],
        masks["cheeks"],
        bridal.BridalOptions(0.14, 0.34, 0.24, 0.16),
        iris=masks["iris"],
        protected=masks["protected"],
    )
    report = bridal.flash_check(bridal_out, masks["skin"], masks["lips"])
    encoded_masks = {name: _b64(mask) for name, mask in masks.items()}
    point_values = {name: [point.x, point.y] for name, point in points.items()}
    outputs = {
        "retro": retro_out,
        "eye_colour": eye_out,
        "glasses": glasses_out,
        "fun": fun_out,
        "summer": summer_out,
        "bridal": bridal_out,
    }
    return {
        "format": "beljour.r19b.easy-parity/1",
        "width": WIDTH,
        "height": HEIGHT,
        "image": _b64(image),
        "masks": encoded_masks,
        "points": point_values,
        "outputs": {name: {"bytes": _b64(value), "sha256": image_sha256(value)} for name, value in outputs.items()},
        "flash": {
            "daylight": report.daylight_drift,
            "venue": report.venue_drift,
            "flash": report.flash_drift,
            "passed": report.passed,
        },
        "tolerance": {"byte": 1, "float": 1e-9},
    }
