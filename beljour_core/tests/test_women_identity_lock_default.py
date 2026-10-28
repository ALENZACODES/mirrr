"""Mandatory identity guard calls, clampback, source immutability and refusals.

Guard similarity is an RGB proxy, not a biometric identity or attractiveness score.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from plumb_api.engines.women_styling.identity import ConservativeGuard
from plumb_api.engines.women_styling.identity import GuardDecision
from plumb_api.engines.women_styling.identity import guarded_edit


def example() -> tuple[np.ndarray, np.ndarray]:
    pixels = np.zeros((24, 32, 4), dtype=np.uint8)
    pixels[:, :, :3] = 71
    pixels[:, :, 3] = 190
    mask = np.zeros((24, 32), dtype=np.uint8)
    mask[4:20, 6:26] = 255
    return pixels, mask


def stronger(frame: np.ndarray, mask: np.ndarray, strength: float) -> np.ndarray:
    out = frame.copy()
    increased = min(255, 71 + round(strength * 150))
    out[mask > 0, :3] = increased
    return out


class CountingGuard:
    def __init__(self) -> None:
        self.levels: list[float] = []
        self.delegate = ConservativeGuard()

    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> GuardDecision:
        self.levels.append(lock_level)
        return self.delegate.guard(before, after, lock_level)


def test_default_call_always_uses_guard_even_on_level_one() -> None:
    frame, mask = example()
    guard = CountingGuard()
    for level in (1, 2.0, 3.0, 4.0, 5.0):
        result = guarded_edit(frame, mask, stronger, level=level, guard=guard)
        assert result.lock_level == 5.0
        assert result.still_her_score == 100
        assert result.disclosure.startswith("Screen simulation")
    assert guard.levels == [5.0] * 5


def test_excessive_edits_are_blended_back_unless_lock_is_explicitly_lowered() -> None:
    frame, mask = example()
    locked = guarded_edit(frame, mask, stronger, level=5.0)
    lowered = guarded_edit(frame, mask, stronger, level=5.0, lock_level=1.0)
    assert locked.blended is True
    assert lowered.similarity < locked.similarity
    assert np.mean(lowered.pixels[mask > 0, 0]) > np.mean(locked.pixels[mask > 0, 0])
    np.testing.assert_array_equal(locked.pixels[mask == 0], frame[mask == 0])
    np.testing.assert_array_equal(lowered.pixels[..., 3], frame[..., 3])


def test_default_guard_is_not_bypassed_when_none_is_explicitly_given() -> None:
    frame, mask = example()
    result = guarded_edit(frame, mask, stronger, guard=None, level=5.0)
    assert result.blended
    assert result.similarity > 0.96


def test_guard_and_renderer_do_not_mutate_inputs() -> None:
    frame, mask = example()
    before = frame.copy()
    initial_mask = mask.copy()
    result = guarded_edit(frame, mask, stronger)
    np.testing.assert_array_equal(frame, before)
    np.testing.assert_array_equal(mask, initial_mask)
    result.pixels[:] = 0
    np.testing.assert_array_equal(frame, before)


class ForgedGuard:
    def __init__(self, flaw: str) -> None:
        self.flaw = flaw

    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> GuardDecision:
        modified = after.copy()
        if self.flaw == "alpha":
            modified[..., 3] = 0
        if self.flaw == "outside":
            modified[0, 0, :3] = 255
        if self.flaw == "type":
            modified = modified.astype(np.float64)
        decision = GuardDecision(modified, 1.0, False)
        if self.flaw == "score":
            return replace(decision, similarity=float("nan"))
        return decision


@pytest.mark.parametrize("flaw", ["alpha", "outside", "type", "score"])
def test_malformed_or_breached_guard_results_are_rejected(flaw: str) -> None:
    frame, mask = example()
    with pytest.raises(ValueError):
        guarded_edit(frame, mask, stronger, guard=ForgedGuard(flaw))


def test_empty_mask_and_invalid_strength_fail_before_guard() -> None:
    frame, mask = example()
    guard = CountingGuard()
    with pytest.raises(ValueError):
        guarded_edit(frame, mask * 0, stronger, guard=guard)
    with pytest.raises(ValueError):
        guarded_edit(frame, mask, stronger, level=2.25, guard=guard)
    assert guard.levels == []
