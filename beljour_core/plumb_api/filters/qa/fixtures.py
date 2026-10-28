"""The filter fixture set (filters-plan.md §5.4), all drawn by code, so no licence questions.

* `chart_atlas()`: one 256 x 192 sheet with a 17-step grey ramp, a smooth hue x lightness
  gradient, 24 OKLCh hues at three lightness levels, the six drawn skin tones as patches,
  and a checker plus edge chart.
* `portrait(tone)`: the arena's drawn face (arena/synthetic.py) with its 478-point mesh, so
  the skin, lips and face-oval masks are known exactly, freckles and moles included.
* `six_tones()`: one drawn face per skin tone, very light to very dark (Still Her checks).

The yaw fixtures (+-15 degrees) the plan lists arrive with the FX4 anchor solver; colour looks
move no landmark, so FX1 needs only frontal faces. The two-face photo is for later rounds.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from ...arena.synthetic import SKIN_TONES, DrawnFace, drawn_face
from ..colour import space as S
from ..masks.blend import FilterMasks, from_landmarks

U8 = NDArray[np.uint8]
ATLAS_W, ATLAS_H = 256, 192
RAMP_STEPS = 17
HUES = 24
LEVELS = (0.45, 0.65, 0.85)
PATCH_CHROMA = 0.1


def grey_ramp_values(steps: int = RAMP_STEPS) -> list[int]:
    return [int(round(i * 255 / (steps - 1))) for i in range(steps)]


def hue_patch(hue: float, light: float, chroma: float = PATCH_CHROMA) -> U8:
    """One OKLCh colour as bytes, clipped into sRGB."""
    lab = S.oklch_to_oklab(np.array([[light, chroma, hue]]))
    return S.unit_to_bytes(S.oklab_to_srgb(lab))[0]


def chart_atlas() -> U8:
    img = np.zeros((ATLAS_H, ATLAS_W, 3), dtype=np.uint8)
    ramp = grey_ramp_values()
    xs = np.arange(ATLAS_W)
    # 0-23: grey ramp
    img[0:24] = np.array(ramp, dtype=np.uint8)[(xs * RAMP_STEPS) // ATLAS_W][None, :, None]
    # 24-47: hue along x, OKLab lightness along y
    hue = xs / ATLAS_W * 360.0
    for row in range(24):
        light = 0.35 + 0.55 * row / 23
        lab = S.oklch_to_oklab(np.stack([np.full(ATLAS_W, light), np.full(ATLAS_W, 0.09), hue], axis=-1))
        img[24 + row] = S.unit_to_bytes(S.oklab_to_srgb(lab))
    # 48-143: 24 hues x 3 lightness levels, 32 px tall each
    for level, light in enumerate(LEVELS):
        for k in range(HUES):
            x0, x1 = k * ATLAS_W // HUES, (k + 1) * ATLAS_W // HUES
            img[48 + 32 * level:80 + 32 * level, x0:x1] = hue_patch(k * 360.0 / HUES, light)
    # 144-167: six skin tones
    tones = list(SKIN_TONES.values())
    for k, rgb in enumerate(tones):
        x0, x1 = k * ATLAS_W // len(tones), (k + 1) * ATLAS_W // len(tones)
        img[144:168, x0:x1] = np.array(rgb, dtype=np.uint8)
    # 168-191: checker (left) and a soft-to-hard edge chart (right)
    yy, xx = np.mgrid[0:24, 0:ATLAS_W // 2]
    img[168:192, :ATLAS_W // 2] = np.where(((xx // 8 + yy // 8) % 2 == 0)[..., None], 230, 25).astype(np.uint8)
    edge_x = np.arange(ATLAS_W // 2)
    edge = np.clip((edge_x - 64) / np.maximum(1, 64 - edge_x / 2), -1, 1) * 0.5 + 0.5
    img[168:192, ATLAS_W // 2:] = np.rint(40 + 180 * edge)[None, :, None].astype(np.uint8)
    return img


@dataclass(frozen=True)
class Portrait:
    face: DrawnFace
    masks: FilterMasks

    @property
    def image(self) -> U8:
        return self.face.image


def portrait(tone: str = "medium", *, seed: int = 1, width: int = 200, height: int = 240, grain: float = 5.0) -> Portrait:
    face = drawn_face(tone, seed=seed, width=width, height=height, grain=grain)
    return Portrait(face, from_landmarks(face.points, height, width))


def six_tones(seeds: tuple[int, ...] = (1,), **kwargs: float) -> list[Portrait]:
    return [portrait(t, seed=s, **kwargs) for t in SKIN_TONES for s in seeds]  # type: ignore[arg-type]


def face_centre(p: Portrait) -> tuple[float, float]:
    """Mean of the face-oval mask, the centre the face-aware centre light follows."""
    oval = p.masks.person
    assert oval is not None
    yy, xx = np.mgrid[0:oval.shape[0], 0:oval.shape[1]]
    w = oval.sum()
    return float((xx * oval).sum() / w + 0.5), float((yy * oval).sum() / w + 0.5)


@dataclass(frozen=True)
class EdgeScene:
    """Synthetic difficult-light or two-person scene, never release evidence."""

    image: U8
    masks: FilterMasks
    faces: tuple[NDArray[np.bool_], ...]
    tones: tuple[str, ...]
    condition: str


def group_scene(first: str = "light", second: str = "very_dark", *,
                low_light: bool = False) -> EdgeScene:
    """Place two independently drawn faces in a single RGB frame.

    Each face keeps its own mask before the union is formed. A group test must
    score both constituent faces, not accept a good average that hides one
    person whose identity was changed. No real image or face is imported.
    """
    one = portrait(first, seed=11, width=96, height=112, grain=5.5)
    two = portrait(second, seed=13, width=96, height=112, grain=5.5)
    height, width, gap = 112, 96, 12
    full_width = width * 2 + gap
    scene = np.full((height, full_width, 3), (219, 224, 233), dtype=np.uint8)
    skin = np.zeros((height, full_width), dtype=np.float64)
    person = np.zeros_like(skin)
    areas: list[NDArray[np.bool_]] = []
    for index, part in enumerate((one, two)):
        x0 = index * (width + gap)
        scene[:, x0:x0 + width] = part.image
        if part.masks.skin is None or part.masks.person is None:
            raise ValueError("the two-person fixture must include both masks")
        region_skin = np.zeros_like(skin, dtype=np.bool_)
        region_skin[:, x0:x0 + width] = part.masks.skin >= 0.75
        areas.append(region_skin)
        skin[:, x0:x0 + width] = part.masks.skin
        person[:, x0:x0 + width] = part.masks.person
    if low_light:
        # Keep the same high-frequency marks in both people while reducing
        # exposure enough to exercise the darker image pipeline.
        scene = np.rint(scene.astype(np.float64) * 0.33 + 7.0).clip(0, 255).astype(np.uint8)
    masks = FilterMasks(skin, person, "segmenter")
    return EdgeScene(scene, masks, tuple(areas), (first, second),
                     "two-person-low-light" if low_light else "two-person")


def dim_scene(tone: str = "dark") -> EdgeScene:
    """One low-light face with a valid mask, using a distinct drawn portrait."""
    part = portrait(tone, seed=17, width=96, height=112, grain=5.5)
    if part.masks.skin is None:
        raise ValueError("the low-light fixture requires skin evidence")
    dim = np.rint(part.image.astype(np.float64) * 0.27 + 5.0).clip(0, 255).astype(np.uint8)
    return EdgeScene(dim, part.masks, (part.masks.skin >= 0.75,),
                     (tone,), "low-light")
