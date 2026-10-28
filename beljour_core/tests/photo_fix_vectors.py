"""Drawn scenes and live Python vectors for the local photo-fix tools.

Faces come from arena/synthetic.drawn_face (made-up mesh, drawn skin, drawn freckles and
moles at known places). On top of them this module draws known-truth defects with exact
masks: irises with a pupil and a catchlight, a red flash glow in the pupils, white glare
patches on glasses lenses, thin bright scratches and dust specks, and a drawn "photobomber"
block. Run as a script it prints the Python results as JSON for the browser mirror test
(web/test/photo-fix.test.mjs); nothing is written to disk. No photographs.
Author: John Khan.
"""
from __future__ import annotations

import base64
import json
from dataclasses import dataclass, field
from typing import Any

import numpy as np

from plumb_api.arena.synthetic import drawn_face
from plumb_api.engines.eyes.mesh_colour import eye_colour
from plumb_api.engines.repair import eye_geometry as E
from plumb_api.engines.repair.glare import remove_glare
from plumb_api.engines.repair.id_crop import guide_overlay, id_crop
from plumb_api.engines.repair.object_removal import brush_mask, remove_object
from plumb_api.engines.repair.old_photo import restore_old_photo
from plumb_api.engines.repair.photo_fix import FixResult
from plumb_api.engines.repair.red_eye import fix_red_eye

WIDTH, HEIGHT = 320, 384
IRIS_RGB = (92, 120, 70)      # a green-hazel iris
PUPIL_RGB = (22, 18, 16)
GLOW_RGB = (205, 48, 42)      # red flash glow
CATCHLIGHT_RGB = (250, 250, 248)


@dataclass(frozen=True)
class Scene:
    image: np.ndarray
    points: np.ndarray
    marks: tuple[tuple[float, float, float], ...]
    truth: dict[str, np.ndarray] = field(default_factory=dict)


def _bytes(img: np.ndarray) -> np.ndarray:
    return np.clip(np.rint(img), 0, 255).astype(np.uint8)


def _disk(cx: float, cy: float, r: float) -> np.ndarray:
    yy, xx = np.mgrid[:HEIGHT, :WIDTH]
    out: np.ndarray = (xx + 0.5 - cx) ** 2 + (yy + 0.5 - cy) ** 2 <= r * r
    return out


def scene(tone: str = "medium", *, seed: int = 3, red_eye: bool = False, closed: str | None = None,
          alpha: bool = False, glare: bool = False) -> Scene:
    """A drawn face with painted irises (pupil, catchlight); optional red glow, a closed eye
    or white glasses-glare patches (one beside each eye, one crossing the right eye)."""
    face = drawn_face(tone, seed=seed, width=WIDTH, height=HEIGHT, freckles=10)
    pts = face.points.copy()
    img = face.image.astype(np.float64)
    truth: dict[str, np.ndarray] = {}
    for side in E.SIDES:
        if side == closed:
            # A red patch where the iris would be: the closed eye must still never be edited.
            cx, cy, r = E.iris_circle(pts, side)
            glow = _disk(cx, cy, r * 0.6)
            img[glow] = GLOW_RGB
            truth[side + "_closed_glow"] = glow
            top, bottom, _, _ = E.EYE_LIDS[side]
            mid = (pts[top][1] + pts[bottom][1]) / 2
            for i in (159, 158, 157, 160, 161, 145, 144, 153, 154, 163) if side == "right" else \
                    (386, 385, 384, 387, 388, 374, 373, 380, 381, 390):
                pts[i][1] = mid + (pts[i][1] - mid) * 0.05
            continue
        opening = E.eye_opening(pts, side, HEIGHT, WIDTH)
        cx, cy, r = E.iris_circle(pts, side)
        iris = _disk(cx, cy, r) & opening
        pupil = _disk(cx, cy, r * 0.4) & opening
        catch = _disk(cx + r * 0.3, cy - r * 0.3, max(1.2, r * 0.18)) & opening
        img[iris] = IRIS_RGB
        img[pupil] = GLOW_RGB if red_eye else PUPIL_RGB
        img[catch] = CATCHLIGHT_RGB
        truth[side + "_iris"] = iris
        truth[side + "_pupil"] = pupil & ~catch
        truth[side + "_catchlight"] = catch
    if glare:
        eyes = np.zeros((HEIGHT, WIDTH), dtype=bool)
        for side in E.SIDES:
            eyes |= E.eye_coverage(pts, side, HEIGHT, WIDTH) > 0
        yy, xx = np.mgrid[:HEIGHT, :WIDTH]
        patches = np.zeros((HEIGHT, WIDTH), dtype=bool)
        for side, sign in (("right", -1.0), ("left", 1.0)):
            ew = E.eye_width(pts, side)
            cx, cy, _ = E.iris_circle(pts, side)
            gx, gy = cx + sign * 0.45 * ew, cy + 0.38 * ew
            patches |= ((xx + 0.5 - gx) / (0.16 * ew)) ** 2 + ((yy + 0.5 - gy) / (0.08 * ew)) ** 2 <= 1
        cx, cy, r = E.iris_circle(pts, "right")
        patches |= ((xx + 0.5 - cx) / (r * 1.6)) ** 2 + ((yy + 0.5 - cy + r * 0.2) / (r * 0.5)) ** 2 <= 1
        img[patches] = (248, 248, 246)
        truth["glare_outside"] = patches & ~eyes
        truth["glare_over_eye"] = patches & eyes
        truth["eyes"] = eyes
    out = _bytes(img)
    if alpha:
        yy, xx = np.mgrid[:HEIGHT, :WIDTH]
        out = np.dstack([out, ((xx * 7 + yy * 3) % 200 + 55).astype(np.uint8)])
    return Scene(out, pts, face.marks, truth)


def old_scene(seed: int = 7, *, faded: bool = True, scratches: bool = True) -> Scene:
    """A drawn face aged like an old print: faded sepia contrast and grain, thin bright
    scratches (one across the background, one across the forehead) and bright dust specks."""
    sc = scene("medium", seed=seed)
    img = sc.image.astype(np.float64)
    if faded:
        grey = img @ np.array([0.299, 0.587, 0.114])
        sepia = np.stack([grey * 1.07, grey * 0.95, grey * 0.78], axis=-1)
        img = 150 + 0.45 * (sepia - 128)
        img += np.random.default_rng(seed).normal(0, 3.0, img.shape[:2])[..., None]
    truth = dict(sc.truth)
    lines = np.zeros((HEIGHT, WIDTH), dtype=bool)
    specks = np.zeros((HEIGHT, WIDTH), dtype=bool)
    if scratches:
        lines[20:300, 30] = True
        top = sc.points[10]
        for t in range(60):
            x = int(top[0] - 30 + t)
            y = int(top[1] + 14 + t * 0.25)
            lines[y, x] = True
        for x, y in ((280, 40), (290, 330), (20, 350), (300, 200)):
            specks[y, x] = True
        img[lines | specks] = np.maximum(img[lines | specks], 0) * 0 + 238
    truth["scratches"] = lines
    truth["specks"] = specks
    return Scene(_bytes(img), sc.points, sc.marks, truth)


BOMBER_TAPS = ((28.0, 318.0), (36.0, 330.0), (44.0, 342.0))
BOMBER_RADIUS = 9.0


def bomber_scene(alpha: bool = False) -> Scene:
    """A drawn face with a magenta "photobomber" blob in the lower-left background; the
    removal mask is the brush stroke that covers it."""
    sc = scene("tan", seed=8, alpha=alpha)
    img = sc.image.copy()
    yy, xx = np.mgrid[:HEIGHT, :WIDTH]
    blob = np.zeros((HEIGHT, WIDTH), dtype=bool)
    for x, y in BOMBER_TAPS:
        blob |= (xx + 0.5 - x) ** 2 + (yy + 0.5 - y) ** 2 <= 6.0 ** 2
    img[blob, 0], img[blob, 1], img[blob, 2] = 210, 40, 190
    truth = dict(sc.truth)
    truth["bomber"] = blob
    truth["brush"] = brush_mask(HEIGHT, WIDTH, BOMBER_TAPS, BOMBER_RADIUS) >= 0.5
    return Scene(img, sc.points, sc.marks, truth)


def id_scene(*, dx: int = 160, dy: int = 150, alpha: bool = False) -> Scene:
    """The drawn face placed on a plain light backdrop with room around the head."""
    sc = scene("dark", seed=9, alpha=alpha)
    big = np.zeros((HEIGHT + 300, WIDTH + 320, sc.image.shape[2]), dtype=np.uint8)
    big[..., :3] = (226, 228, 230)
    if alpha:
        big[..., 3] = 255
    big[dy:dy + HEIGHT, dx:dx + WIDTH] = sc.image
    return Scene(big, sc.points + np.array([dx, dy], dtype=np.float64), sc.marks, {})


def _b64(a: np.ndarray) -> str:
    return base64.b64encode(np.ascontiguousarray(a).tobytes()).decode("ascii")


def case(kind: str, sc: Scene, params: dict[str, Any], result: FixResult,
         extra: dict[str, Any] | None = None) -> dict[str, Any]:
    return {"kind": kind, "params": params, "width": int(sc.image.shape[1]), "height": int(sc.image.shape[0]),
            "channels": int(sc.image.shape[2]), "image": _b64(sc.image), "points": sc.points.tolist(),
            "out": _b64(result.image), "status": result.status, "reason_code": result.reason_code,
            **(extra or {})}


def red_eye_cases() -> list[dict[str, Any]]:
    out = []
    red = scene(red_eye=True)
    for params in ({"strength": 100.0}, {"strength": 40.0}):
        out.append(case("red_eye", red, params, fix_red_eye(red.image, red.points, **params)))
    one = scene("dark", seed=5, red_eye=True, closed="left", alpha=True)
    out.append(case("red_eye", one, {"strength": 100.0}, fix_red_eye(one.image, one.points)))
    plain = scene("light", seed=2)
    out.append(case("red_eye", plain, {"strength": 100.0}, fix_red_eye(plain.image, plain.points)))
    return out


def eye_colour_cases() -> list[dict[str, Any]]:
    out = []
    base = scene(alpha=True)
    for params in ({"shade": "ocean", "strength": 100.0}, {"shade": "amber", "strength": 50.0}):
        out.append(case("eye_colour", base, params, eye_colour(base.image, base.points, **params)))
    one = scene("very_dark", seed=6, closed="right")
    out.append(case("eye_colour", one, {"shade": "forest", "strength": 65.0},
                    eye_colour(one.image, one.points, shade="forest")))
    return out


def glare_cases() -> list[dict[str, Any]]:
    out = []
    lit = scene(glare=True, alpha=True)
    for params in ({"strength": 100.0}, {"strength": 60.0}):
        out.append(case("glare", lit, params, remove_glare(lit.image, lit.points, **params)))
    plain = scene("very_light", seed=4)
    out.append(case("glare", plain, {"strength": 100.0}, remove_glare(plain.image, plain.points)))
    return out


def old_photo_cases() -> list[dict[str, Any]]:
    out = []
    old = old_scene()
    for params in ({"strength": 100.0}, {"strength": 60.0}):
        out.append(case("old_photo", old, params, restore_old_photo(old.image, old.points, **params)))
    out.append(case("old_photo", old, {"strength": 100.0, "mesh": False}, restore_old_photo(old.image, None)))
    return out


def object_cases() -> list[dict[str, Any]]:
    out = []
    sc = bomber_scene(alpha=True)
    mask = sc.truth["brush"].astype(np.float32)
    for params in ({"strength": 100.0}, {"strength": 100.0, "method": "fast-marching"}, {"strength": 70.0, "seed": 9}):
        result = remove_object(sc.image, mask, landmarks=sc.points, **params)
        out.append(case("object", sc, params, result, {"taps": [list(t) for t in BOMBER_TAPS],
                                                       "radius": BOMBER_RADIUS}))
    face = [[float(sc.points[1][0]), float(sc.points[1][1])]]
    covered = remove_object(sc.image, brush_mask(HEIGHT, WIDTH, face, 8.0), landmarks=sc.points)
    out.append(case("object", sc, {"strength": 100.0}, covered, {"taps": face, "radius": 8.0}))
    return out


def id_cases() -> list[dict[str, Any]]:
    out = []
    for sc, preset in ((id_scene(alpha=True), "35x45mm"), (id_scene(), "2x2in"), (scene(), "35x45mm")):
        r = id_crop(sc.image, sc.points, preset=preset)
        out.append({"kind": "id_crop", "params": {"preset": preset}, "width": int(sc.image.shape[1]),
                    "height": int(sc.image.shape[0]), "channels": int(sc.image.shape[2]),
                    "image": _b64(sc.image), "points": sc.points.tolist(), "out": _b64(guide_overlay(r)),
                    "status": r.status, "reason_code": r.reason_code, "box": list(r.box) if r.box else None,
                    "guides": r.guides, "checks": r.checks})
    return out


def vectors() -> dict[str, Any]:
    return {"format": "beljour-photo-fix-vectors/1", "author": "John Khan", "synthetic": True,
            "byte_tolerance": 1, "cases": red_eye_cases() + eye_colour_cases() + glare_cases() + old_photo_cases() + object_cases() + id_cases()}


if __name__ == "__main__":
    print(json.dumps(vectors()))
