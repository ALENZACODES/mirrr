"""Women-first neutral-defaults check (women-first brief rule 8, "Arena change").

Runs every default preset in default_presets.json on drawn faces of six skin tones (very
light to very dark) and fails a preset that, without being asked:

* lightens skin: skin L* rises more than LIGHTEN_DL beyond whatever the background did,
* slims the face: face width / IOD shrinks by more than 1.5%,
* erases freckles or moles: fewer than 70% of the drawn marks keep half their contrast.

A preset may list what it is asked to change ("face_shape" for the gender swap, which reshapes
by design), and only that check is skipped. Rescue's under-eye step (engines/skin/under_eye.py)
lifts only a measured under-eye shadow toward her own cheek, never past it, so it is checked
like every other step and is not exempt from the lightening check. Thresholds come from scorer.py and are ASSUMED.
Drawn faces stand in for real ones here because CI can't hold photos; the real-face bench
repeats the check on the frozen set on the box. Author: John Khan.
"""
from __future__ import annotations

import json
from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np

from ..engines.repair import restore
from ..engines.repair.face_tone import mask_from_face
from ..engines.skin.under_eye import brighten_under_eyes
from . import identity as I
from . import marks as M
from . import producers, scorer
from .synthetic import SKIN_TONES, DrawnFace, drawn_face

PRESETS_PATH = Path(__file__).with_name("default_presets.json")


def load_presets(path: Path = PRESETS_PATH) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("format") != "beljour-default-presets/1":
        raise ValueError("unknown default preset format")
    gentle = data["gentle_default"]
    for preset in data["presets"]:
        for step in preset["steps"]:
            if not 0 <= step["strength"] <= gentle:
                raise ValueError(f"{preset['id']}: default strength {step['strength']} is above the gentle default {gentle}")
    return data


@dataclass
class Applied:
    image: np.ndarray
    points_after: np.ndarray


def apply_step(image: np.ndarray, points: np.ndarray, step: Mapping[str, Any], *, seed: int = 1) -> Applied:
    s = step["strength"] / 100.0
    engine = step["engine"]
    if engine == "enhance":
        mask = mask_from_face(points, image.shape[0], image.shape[1])
        return Applied(restore.enhance(image, step["mode"], strength=s, face_mask=mask).image, points)
    if engine == "age":
        edit = producers.render_age(image, points, stop=int(step["stop"]), strength=s, seed=seed)
        return Applied(edit.image, edit.points_after)
    if engine == "gender":
        edit = producers.render_gender(image, points, direction=int(step["direction"]), strength=s)
        return Applied(edit.image, edit.points_after)
    if engine == "under-eye":
        # Not applicable (no dark circle) and refusals return the photo unchanged.
        return Applied(brighten_under_eyes(image, points, strength=float(step["strength"])).image, points)
    raise ValueError(f"unknown engine {engine}")


def apply_preset(face: DrawnFace, preset: Mapping[str, Any], *, seed: int = 1) -> Applied:
    current = Applied(face.image, face.points)
    for step in preset["steps"]:
        current = apply_step(current.image, current.points_after, step, seed=seed)
    return current


@dataclass
class Finding:
    preset: str
    tone: str
    seed: int
    problem: str
    measured: dict[str, Any] = field(default_factory=dict)

    def text(self) -> str:
        return f"{self.preset} on {self.tone} skin (seed {self.seed}): {self.problem} {self.measured}"


def check_preset(preset: Mapping[str, Any], faces: Iterable[DrawnFace], *, seed: int = 1) -> list[Finding]:
    asked = set(preset.get("requested", []))
    findings: list[Finding] = []
    for face in faces:
        out = apply_preset(face, preset, seed=seed)
        shape = face.image.shape[:2]
        skin = I.zones(face.points, shape)["skin"]
        scale = I.iod(face.points)
        found = M.find_marks(face.image, skin, scale)
        kept = M.retention(M.displaced(found, face.points, out.points_after), out.image, scale)
        flags, info = scorer.unrequested_changes(face.image, out.image, skin, points_before=face.points,
                                                 points_after=out.points_after, retained=kept,
                                                 filter_name="face_slim" if "face_shape" in asked else preset["id"])
        for flag in flags:
            findings.append(Finding(preset["id"], face.tone, seed, flag, info))
    return findings


def test_faces(seeds: Iterable[int] = (1, 2)) -> list[DrawnFace]:
    return [drawn_face(tone, seed=s) for tone in SKIN_TONES for s in seeds]


def check_all(path: Path = PRESETS_PATH, seeds: Iterable[int] = (1, 2)) -> list[Finding]:
    data = load_presets(path)
    faces = test_faces(seeds)
    out: list[Finding] = []
    for preset in data["presets"]:
        out.extend(check_preset(preset, faces))
    return out
