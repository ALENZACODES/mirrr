"""Automated proxy scores for the built non-hero features, per demographic slice.

Master command v2 wants every feature scored on the same dimensions. People's scores decide
the gate (8+ average on all six, no slice under 7); until people have judged, this bench gives
each built local feature its automated proxy scores on fresh frozen faces, so the report shows
measured numbers (marked * as proxies) instead of blanks, and a feature can't be called
Passed on them (gates.feature_gate needs human scores). Flattering has no proxy, so it stays
"-" here.

Each runner applies the feature's existing engine at its gentle default, the way one tap does
in the app. Features that reshape on request (39, 44, 45) are scored with their request
named, so the slimming check doesn't flag what she asked for. Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
from typing import Any

import numpy as np

from ..engines.beard import strands as beard
from ..engines.proportions import symmetry
from ..engines.repair import restore
from ..engines.repair.face_tone import mask_from_face
from ..engines.shape import geometry
from ..engines.warp import field as warp_field
from ..engines.warp import mesh as warp_mesh
from . import scorer
from .identity import L
from .producers import render_age
from .results import fairness_from_scores, scores_by_slice, slices_for

U8 = np.ndarray
GENTLE = 0.30


@dataclass(frozen=True)
class Output:
    image: U8
    points_after: np.ndarray


def _warp(image: U8, points: np.ndarray, target: np.ndarray) -> Output:
    src = geometry.check_face(points)
    if np.allclose(target, src):
        return Output(image.copy(), src.copy())
    lay = warp_mesh.layout(src, image.shape[1], image.shape[0])
    warp = warp_mesh.mesh_warp(image.shape[0], image.shape[1], src, target, lay=lay)
    moved = src + (np.asarray(target) - src) * warp.strength_used
    return Output(warp_field.apply(image, warp.result.field), moved)


def roll_target(points: np.ndarray, strength: float = 1.0) -> np.ndarray:
    """Points rotated so the pupils sit level (roll straighten), scaled by strength."""
    pts = np.asarray(points, dtype=np.float64)[:, :2]
    right, left = pts[L["right_pupil"]], pts[L["left_pupil"]]
    angle = math.atan2(left[1] - right[1], left[0] - right[0]) * strength
    centre = pts.mean(axis=0)
    c, s = math.cos(-angle), math.sin(-angle)
    rot = np.array([[c, -s], [s, c]])
    return (pts - centre) @ rot.T + centre


def _enhance(mode: str) -> Callable[[U8, np.ndarray], Output]:
    def render(img: U8, pts: np.ndarray) -> Output:
        mask = mask_from_face(pts, img.shape[0], img.shape[1])
        return Output(restore.enhance(img, mode, strength=GENTLE, face_mask=mask).image, pts)
    return render


def _shape(control: str, amount: float) -> Callable[[U8, np.ndarray], Output]:
    return lambda img, pts: _warp(img, pts, geometry.target_mesh(pts, {control: amount * GENTLE}))


def _beard(img: U8, pts: np.ndarray) -> Output:
    return Output(beard.render(img, pts, style="stubble", density=2).image, pts)


def _symmetry(img: U8, pts: np.ndarray) -> Output:
    target = np.asarray(symmetry.safe_targets(pts, GENTLE).points)[:, :2]
    full = np.asarray(pts, dtype=np.float64).copy()
    full[:len(target), :2] = target
    return _warp(img, pts, full)


def _age_slider(img: U8, pts: np.ndarray) -> Output:
    edit = render_age(img, pts, stop=1, strength=1.0, seed=7)
    return Output(edit.image, edit.points_after)


def _roll(img: U8, pts: np.ndarray) -> Output:
    return _warp(img, pts, roll_target(pts))


@dataclass(frozen=True)
class Runner:
    feature: int
    label: str
    run: Callable[[U8, np.ndarray], Output]
    asked: str  # the scorer's filter name: what the feature is asked to change
    whole_photo: bool = False  # edits the whole picture by design (enhance)


RUNNERS: tuple[Runner, ...] = (
    Runner(1, "age slider at +1", _age_slider, "old"),
    Runner(23, "beard, stubble", _beard, "beard"),
    Runner(39, "face width -", _shape("face_width", -100), "face_slim"),
    Runner(43, "symmetry", _symmetry, "symmetry"),
    Runner(44, "chin length +", _shape("chin_length", 100), "face_shape"),
    Runner(45, "forehead height +", _shape("forehead_height", 100), "face_shape"),
    Runner(47, "roll straighten", _roll, "head_pose"),
    Runner(49, "enhance, natural", _enhance("natural"), "enhance", whole_photo=True),
    Runner(53, "enhance, low light", _enhance("low_light"), "enhance", whole_photo=True),
)


def score_feature(runner: Runner, image: U8, points: np.ndarray) -> dict[str, float]:
    out = runner.run(image, points)
    s = scorer.score_image(image, out.image, runner.asked, points_before=points, points_after=out.points_after,
                           whole_photo=runner.whole_photo)
    return {k: v for k, v in s.to_json()["scores"].items() if v is not None}


def bench(faces: Sequence[tuple[str, U8, np.ndarray]], rows: Mapping[str, Mapping[str, str]],
          runners: Sequence[Runner] = RUNNERS, *, on_error: Callable[[str], None] | None = None) -> dict[int, dict[str, Any]]:
    """Proxy scores per feature and slice: {feature: {"source": "proxy", "scores": {slice: {dim: {mean, n}}}}}."""
    face_slices = {fid: slices_for(rows[fid]) for fid, _, _ in faces}
    out: dict[int, dict[str, Any]] = {}
    for runner in runners:
        items = []
        for fid, image, points in faces:
            try:
                items.append(("feature", fid, score_feature(runner, image, points)))
            except Exception as exc:  # noqa: BLE001 - recorded, the rest of the faces still run
                if on_error:
                    on_error(f"#{runner.feature} {runner.label} on {fid}: {type(exc).__name__}: {str(exc)[:100]}")
        by_slice = scores_by_slice(items, face_slices).get("feature", {})
        fair = fairness_from_scores(by_slice)
        if fair:
            by_slice.setdefault("all", {})["fairness"] = {"mean": fair["mean"], "n": 0, "gap": fair["gap"],
                                                          "dimension": fair["dimension"]}
        out[runner.feature] = {"source": "proxy", "label": runner.label, "faces": len(items), "scores": by_slice}
    return out
