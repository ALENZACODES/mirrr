"""R25E level contract, guarded head edits, stable bounded reuse and validation."""
from __future__ import annotations

import hashlib
import math

import numpy as np
import pytest

from plumb_api.engines.posture.catalogue import SIMULATION_LABEL
from plumb_api.engines.posture.identity import (
    FACE_MOVING,
    FaceIdentityGuard,
    GuardDecision,
    IdentityLockUnavailable,
    guarded_render,
    identity_floor,
)
from plumb_api.engines.posture.levels import (
    ANCHORS,
    DEFAULT_LEVEL,
    LevelMemory,
    checked_level,
    level_plan,
    level_to_strength,
    nudge,
    strength_to_level,
)
from plumb_api.engines.posture.session import PostureCache, preview_size
from plumb_api.engines.posture.synthetic import front_figure, truth_cases

HASH = hashlib.sha256(b"r25e-one-drawn-body").hexdigest()


@pytest.mark.parametrize("level", [1.0, 1.1, 1.5, 2.0, 2.3, 3.5, 4.9, 5.0])
def test_valid_levels_are_representable_tenths(level: float) -> None:
    assert checked_level(level) == level


@pytest.mark.parametrize("level", [0.95, 5.1, 2.25, -1.0, 100.0, float("nan"), float("inf"), True])
def test_bad_levels_refuse_without_clamping(level: float) -> None:
    with pytest.raises(ValueError, match="level"):
        checked_level(level)


def test_old_stops_map_exactly_to_documented_new_anchors() -> None:
    assert ANCHORS == ((1.0, 0.0), (2.0, 0.33), (3.5, 0.66), (5.0, 1.0))
    assert DEFAULT_LEVEL == 3.5
    assert level_to_strength(1.0) == 0.0
    assert level_to_strength(2.0) == 0.33
    assert level_to_strength(3.5) == 0.66
    assert level_to_strength(5.0) == 1.0
    for legacy in ("subtle", "normal", "full"):
        mapped = strength_to_level(legacy)
        assert level_to_strength(mapped) == {"subtle": 0.33, "normal": 0.66, "full": 1.0}[legacy]


def test_level_and_effect_are_monotone_for_each_fix() -> None:
    for fix, fig in truth_cases().items():
        measured: list[float] = []
        moves: list[float] = []
        for tick in range(10, 51):
            value = tick / 10
            planned = level_plan(fig.controls, fix, value)
            assert planned.largest_move_px <= planned.cap_px + 1e-8
            assert planned.label == SIMULATION_LABEL
            assert planned.cap_px == pytest.approx(0.06 * fig.controls.torso_height)
            measured.append(planned.reduction)
            moves.append(planned.largest_move_px)
        assert all(a <= b + 1e-7 for a, b in zip(measured, measured[1:], strict=False)), fix
        assert all(a <= b + 1e-7 for a, b in zip(moves, moves[1:], strict=False)), fix
        assert measured[0] == pytest.approx(0.0, abs=1e-9)
        assert moves[0] == pytest.approx(0.0, abs=1e-9)


@pytest.mark.parametrize("fix", list(truth_cases()))
def test_identity_level_does_not_mutate_source_controls(fix: str) -> None:
    fig = truth_cases()[fix]
    before = dict(fig.controls.points)
    p = level_plan(fig.controls, fix, 1.0)
    assert p.largest_move_px <= 1e-9
    assert p.after.points == before
    assert fig.controls.points == before
    assert p.reduction == pytest.approx(0.0, abs=1e-9)


def test_memory_is_per_fix_and_nudge_is_bounded() -> None:
    levels = LevelMemory()
    assert levels.get("lean") == DEFAULT_LEVEL
    assert levels.set("lean", 4.7) == 4.7
    assert levels.get("uneven_shoulders") == DEFAULT_LEVEL
    assert levels.adjust("lean", -1) == 4.6
    assert levels.set("lean", 5.0) == 5.0
    assert levels.adjust("lean", 1) == 5.0
    assert levels.set("lean", 1.0) == 1.0
    assert levels.adjust("lean", -1) == 1.0
    with pytest.raises(ValueError, match="direction"):
        nudge(2.0, 0)
    with pytest.raises(ValueError, match="unknown"):
        levels.get("does_not_exist")


def test_keypoints_cached_across_five_strength_changes() -> None:
    counter = 0
    fig = front_figure(lean=4.0)

    def create() -> object:
        nonlocal counter
        counter += 1
        return fig.controls

    cache = PostureCache()
    for level in (1.0, 2.0, 3.0, 4.0, 5.0):
        p = cache.plan(HASH, "lean", level, create)
        assert p.fix == "lean"
    assert counter == 1
    assert cache.plan_count == 5
    cached = cache.plan(HASH, "lean", 3.0, create)
    assert cached is cache.plan(HASH, "lean", 3.0, create)
    assert counter == 1


def test_body_band_cached_across_five_level_changes_and_copied_for_mutation() -> None:
    fig = front_figure(lean=4.0)
    cache = PostureCache()
    calls = 0

    def build() -> np.ndarray:
        nonlocal calls
        calls += 1
        return fig.person

    for value in (1.0, 2.0, 3.0, 4.0, 5.0):
        cache.plan(HASH, "lean", value, lambda: fig.controls)
        band = cache.band(HASH, "lean", build)
        assert band.shape == fig.person.shape
        band[:] = 0.0
    assert calls == 1
    assert cache.band_bytes > 0
    assert cache.band(HASH, "lean", build).max() > 0
    cache.clear()
    assert cache.band_bytes == 0
    assert cache.plan_count == 0


def test_cache_rejects_bad_hash_and_memory_budget_without_corruption() -> None:
    fig = front_figure(lean=4.0)
    cache = PostureCache(max_band_bytes=2048)
    with pytest.raises(ValueError, match="hash"):
        cache.plan("not-a-hash", "lean", 2.0, lambda: fig.controls)
    with pytest.raises(ValueError, match="budget"):
        cache.band(HASH, "lean", lambda: fig.person)
    assert cache.band_bytes == 0
    with pytest.raises(ValueError, match="small"):
        PostureCache(max_band_bytes=1)


def test_preview_drag_and_release_do_not_guess_timing() -> None:
    drag = preview_size(3000, 4000, released=False)
    release = preview_size(3000, 4000, released=True)
    assert drag.width == 384
    assert drag.height == 512
    assert drag.scale == pytest.approx(512 / 4000)
    assert not drag.full_resolution
    assert release.width == 3000 and release.height == 4000
    assert release.full_resolution
    assert preview_size(200, 300, released=False).scale == 1


class TestGuard(FaceIdentityGuard):
    def __init__(self, similarity: float) -> None:
        self.similarity = similarity
        self.calls = 0
        self.seen: list[float] = []

    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> GuardDecision:
        self.calls += 1
        self.seen.append(lock_level)
        return GuardDecision(after.copy(), self.similarity)


@pytest.mark.parametrize("fix", ["lean", "rounded_shoulders", "forward_head"])
def test_face_touching_edit_cannot_skip_identity_guard(fix: str) -> None:
    assert fix in FACE_MOVING
    fig = truth_cases()[fix]
    with pytest.raises(IdentityLockUnavailable):
        guarded_render(fig.image, fig.person, fig.controls, fix, 1.0)


def test_default_guard_called_and_low_similarity_reverts_pixels() -> None:
    fig = truth_cases()["lean"]
    test_guard = TestGuard(0.85)
    result = guarded_render(fig.image, fig.person, fig.controls, "lean", 2.0, guard=test_guard)
    assert test_guard.calls == 1
    assert test_guard.seen == [5.0]
    assert result.identity_recovered
    assert np.array_equal(result.image, fig.image)
    assert result.export_metadata()["simulation"] is True
    assert result.export_metadata()["identity_lock_on"] is True
    assert result.label == SIMULATION_LABEL


def test_user_lowered_lock_can_keep_guarded_result() -> None:
    fig = truth_cases()["lean"]
    test_guard = TestGuard(0.85)
    result = guarded_render(fig.image, fig.person, fig.controls, "lean", 2.0, guard=test_guard, lock_level=1.0)
    assert test_guard.calls == 1
    assert test_guard.seen == [1.0]
    assert not result.identity_recovered
    assert result.lock_level == 1.0
    assert identity_floor(1.0) == pytest.approx(0.80)
    assert identity_floor(5.0) == pytest.approx(0.95)


@pytest.mark.parametrize("similarity", [-0.5, math.inf, math.nan, 2.0])
def test_guard_with_invalid_similarity_fails_closed(similarity: float) -> None:
    fig = truth_cases()["lean"]
    with pytest.raises(IdentityLockUnavailable, match="similarity"):
        guarded_render(fig.image, fig.person, fig.controls, "lean", 1.0, guard=TestGuard(similarity))
