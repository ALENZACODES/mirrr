"""The combined system in the Python engines, end to end, on drawn faces.

The Python half of web/test/system-journey.test.mjs, for the parts whose engines are Python:
gender edit -> filter look -> portrait look -> skin tool, each step handing the face points it
leaves to the next (as arena/presets.py does) -> the recipe kept as settings-only data -> the same
recipe re-applied to a second photo with that photo's own points -> the guarded HD tier -> the
Decision Layer foundation spec and salon pack from the unedited photo -> no socket opened and no
provider loaded. The Save System store and the face-locked Quality Generator export live in the
browser; the web journey covers them.
Drawn faces only; no photograph of a person. Author: John Khan.
"""
from __future__ import annotations

import json
import socket
import sys
from collections.abc import Iterator, Mapping
from dataclasses import dataclass
from datetime import date
from typing import Any

import numpy as np
import pytest

from plumb_api.arena import identity as I
from plumb_api.arena import marks as M
from plumb_api.arena import producers
from plumb_api.arena.synthetic import DrawnFace, drawn_face
from plumb_api.commands.errors import CommandUnavailable
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.identity import IdentityGuard
from plumb_api.commands.levels import DecimalLevel
from plumb_api.commands.quality_tiers import QualityTierRecipe, run_quality_tier
from plumb_api.commands.r2h_session import R2HSession
from plumb_api.engines.core.refusal import Refusal
from plumb_api.engines.shade.finder import find_reliable_shade, reference_table, thresholds
from plumb_api.engines.skin import studio
from plumb_api.engines.skin.common import skin_mask
from plumb_api.engines.workflow_w import decision
from plumb_api.filters import engine
from plumb_api.filters.colour import space as S
from plumb_api.filters.masks import blend
from plumb_api.filters.portrait import compose
from plumb_api.services import salon_pack
from tests.commands.tier_synthetic_benchmark_r13h import SyntheticGeometryEmbedder, _fast_reference

RECIPE = [
    {"tool": "gender", "strength": 60, "settings": {"direction": -1}},
    {"tool": "filters", "strength": 40, "settings": {"recipe": "C02"}},
    {"tool": "portrait", "strength": 30, "settings": {"look": "PL13"}},
    {"tool": "skin", "strength": 40, "settings": {"skin_tool": "tone"}},
]


@dataclass
class Step:
    tool: str
    image: np.ndarray
    points: np.ndarray
    label: str
    metrics: dict[str, Any]


def apply(step: Mapping[str, Any], image: np.ndarray, points: np.ndarray) -> Step:
    """One recipe step through the public engine entry, with the points this step leaves."""
    tool, s, cfg = step["tool"], float(step["strength"]), step["settings"]
    if tool == "gender":
        edit = producers.render_gender(image, points, direction=int(cfg["direction"]), strength=s / 100)
        return Step(tool, edit.image, edit.points_after, "gender simulation", dict(edit.metrics))
    h, w = image.shape[:2]
    if tool == "filters":
        masks = blend.from_landmarks(points, h, w)
        out = engine.render(image, cfg["recipe"], engine.Settings(strength=s), masks)
        return Step(tool, out.image, points, f"Look {cfg['recipe']}", {"guard": True})
    if tool == "portrait":
        r = compose.render(image, points, cfg["look"], s)
        assert r.identity is not None
        return Step(tool, r.image, points, r.label, {"status": r.status, "code": r.code, "marks_found": r.identity.marks_found,
                    "marks_kept": r.identity.marks_kept, "skin_lift": r.identity.skin_lift})
    if tool == "skin":
        res = studio.render(cfg["skin_tool"], image, points, strength=s)
        assert not isinstance(res, Refusal), res
        return Step(tool, res.image, points, res.label, dict(res.metrics))
    raise ValueError(tool)


def run(recipe: list[dict[str, Any]], face: DrawnFace) -> list[Step]:
    steps, image, points = [], face.image, face.points
    for step in recipe:
        done = apply(step, image, points)
        steps.append(done)
        image, points = done.image, done.points
    return steps


def lightness(image: np.ndarray, mask: np.ndarray) -> float:
    return float(S.srgb_to_lab(S.bytes_to_unit(image[..., :3]))[..., 0][mask >= 0.5].mean())


@pytest.fixture(scope="module")
def journey() -> Iterator[dict[str, Any]]:
    attempts: list[str] = []
    real_connect, real_create = socket.socket.connect, socket.create_connection

    def blocked(*args: object, **kwargs: object) -> None:
        attempts.append(repr(args[1:2] or args[:1]))
        raise OSError("network blocked in the system journey")

    socket.socket.connect = blocked  # type: ignore[method-assign,assignment]
    socket.create_connection = blocked  # type: ignore[assignment]
    modules_before = set(sys.modules)
    try:
        a = drawn_face("medium", width=200, height=240, freckles=10)
        original = a.image.copy()
        steps = run(RECIPE, a)
        stored = json.dumps({"format": "beljour-look-recipe/1", "steps": RECIPE})
        b = drawn_face("dark", seed=3, width=400, height=480, freckles=10)
        again = run(json.loads(stored)["steps"], b)
        reading, _audit = find_reliable_shade(a.image, a.points)
        yield {"a": a, "original": original, "steps": steps, "stored": stored, "b": b, "again": again,
               "reading": reading, "attempts": attempts, "imported": set(sys.modules) - modules_before}
    finally:
        socket.socket.connect = real_connect  # type: ignore[method-assign]
        socket.create_connection = real_create  # type: ignore[assignment]


def test_gender_edit_is_guarded_and_hands_on_the_moved_points(journey: dict[str, Any]) -> None:
    a, gender = journey["a"], journey["steps"][0]
    moved = np.abs(gender.points - a.points).max()
    assert 0.5 < moved < 0.12 * I.iod(a.points), "moved, inside the shape cap"
    assert np.array_equal(journey["steps"][1].points, gender.points), "the next step got the moved points"


def test_filter_and_portrait_look_keep_marks_and_skin_and_are_labelled(journey: dict[str, Any]) -> None:
    portrait = journey["steps"][2]
    m = portrait.metrics
    assert (m["status"], m["code"]) == ("applied", "")
    assert m["marks_kept"] == m["marks_found"]
    assert m["skin_lift"] <= compose.LIFT_LIMIT
    assert portrait.label == compose.LABEL and "simulation" in portrait.label


def test_skin_tool_edits_only_the_current_skin_and_never_lightens(journey: dict[str, Any]) -> None:
    graded, skin = journey["steps"][2], journey["steps"][3]
    h, w = skin.image.shape[:2]
    mask = skin_mask(skin.points, h, w)
    moved = np.any(skin.image != graded.image, axis=-1)
    assert not moved[mask <= 0].any(), "inside the face's current skin only"
    assert lightness(skin.image, mask) - lightness(graded.image, mask) <= 0.5
    assert "never lightened" in skin.label and "not medical advice" in skin.label


def test_the_whole_stack_keeps_identity_marks_and_the_original(journey: dict[str, Any]) -> None:
    a, final = journey["a"], journey["steps"][-1]
    assert np.array_equal(a.image, journey["original"]), "her original is untouched"
    score = I.identity_score(a.image, final.image, points_before=a.points, points_after=final.points)
    assert score.score >= I.LOCK_THRESHOLD, score.score
    kept = M.retention(list(M.find_marks(a.image, skin_mask(a.points, *a.image.shape[:2]), I.iod(a.points))),
                       final.image, I.iod(a.points))
    assert kept.found > 0 and kept.kept / kept.found >= 0.9


def test_the_recipe_is_settings_only_and_reapplies_on_the_second_photos_own_points(journey: dict[str, Any]) -> None:
    stored, a, b, again = journey["stored"], journey["a"], journey["b"], journey["again"]
    assert "points" not in stored and "image" not in stored and len(stored) < 1024
    assert not np.array_equal(again[0].points, a.points[: len(again[0].points)]), "photo B's own points"
    assert again[-1].image.shape == b.image.shape
    assert again[2].metrics["status"] == "applied"
    score = I.identity_score(b.image, again[-1].image, points_before=b.points, points_after=again[-1].points)
    assert score.score >= I.LOCK_THRESHOLD
    assert np.array_equal(run(RECIPE, b)[-1].image, again[-1].image), "deterministic re-apply"


def test_hd_tier_is_guarded_meets_1080_and_refuses_without_an_identity_check(journey: dict[str, Any]) -> None:
    final = journey["again"][-1].image
    h, w = final.shape[:2]
    frame = ImageFrame(w, h, 3, np.ascontiguousarray(final).tobytes())
    recipe = QualityTierRecipe("1080", DecimalLevel(10), DecimalLevel(30))
    closed = R2HSession(identity=None)
    closed.open_photo(frame)
    with pytest.raises(CommandUnavailable):
        run_quality_tier(closed, frame, recipe)
    # A drawn face has no person to recognise: the guard runs with the explicitly test-only
    # embedder, which proves the plumbing (two guarded steps, exact aspect), not face identity.
    guard = IdentityGuard(SyntheticGeometryEmbedder(), allow_test_embedder=True, align_original=_fast_reference)
    session = R2HSession(identity=guard, tile_size=256)
    session.open_photo(frame)
    out = run_quality_tier(session, frame, recipe, quality="export")
    image = out.result.image
    assert max(image.width, image.height) >= 1920
    assert image.width * h == image.height * w, "aspect exact"
    meta = out.public_metadata()
    assert meta["guarded_steps"] == 2 and meta["cleanup_before_upscale"] is True
    assert meta["independent_face_gate"] == "NOT_RUN" and meta["release_qualified"] is False


def test_decision_spec_is_from_the_unedited_photo_never_lighter_and_photo_free(journey: dict[str, Any]) -> None:
    reading = journey["reading"]
    assert not reading.refused
    spec = decision.makeup_spec(reading.measured_lab)
    allowance = float(thresholds()["never_lighter_allowance"])
    table = {row["id"]: row for row in reference_table()}
    assert spec["nearest"]
    for row in spec["nearest"]:
        assert table[row["id"]]["lab"][0] - spec["measured_lab"][0] <= allowance, f"{row['id']} is lighter than her skin"
    assert spec["note"] == decision.FOUNDATION_NOTE
    pack = salon_pack.build_pack(
        created=date(2026, 10, 28),
        measured={"skin_lab": spec["measured_lab"], "undertone": spec["undertone"], "depth_band": spec["depth_band"]},
        target={"kind": "makeup", "description": "Foundation, our reference shades", "lab": spec["measured_lab"],
                "nearest_shades": [{"name": r["name"], "lab": table[r["id"]]["lab"], "delta_e": r["delta_e00"]}
                                   for r in spec["nearest"]]},
        plan={"service": spec["service"]})
    assert salon_pack.check_pack(pack) == []
    assert pack["photo_set"] == [] and pack["photos_included"] is False and pack["hosted"] is False
    plan = pack["pages"][1]["sections"][2]
    assert plan["service"] == "foundation_bottle" and plan["estimate_source"]
    text = json.dumps(pack)
    for key in ("image", "mask", "landmark", "points", "pixels"):
        assert f'"{key}' not in text


def test_privacy_nothing_left_the_process(journey: dict[str, Any]) -> None:
    assert journey["attempts"] == [], "no socket was opened"
    network = ("plumb_api.providers", "httpx", "requests", "urllib3", "aiohttp", "http.client", "urllib.request")
    assert not [m for m in journey["imported"] if m.startswith(network)], "no provider or network client was loaded"
