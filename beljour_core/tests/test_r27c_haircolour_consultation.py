"""Safety and contract tests for local, observed-mask W28/W39 previews.

All inputs are hand-drawn numeric scenes. No real faces are processed.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from plumb_api.engines.haircolour.consultation import (
    CACHE_LIMIT,
    MAX_PIXELS,
    Choice,
    GuardDecision,
    HairColourSession,
    checked_level,
    level_weight,
    parse_recipe,
)


def scene(
    *,
    tone: int = 70,
    channels: int = 4,
    height: int = 42,
    width: int = 52,
    texture: int = 3,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    image = np.empty((height, width, channels), dtype=np.uint8)
    hair = np.zeros((height, width), dtype=float)
    strokes = np.zeros((height, width), dtype=float)
    for y in range(height):
        for x in range(width):
            signal = ((x * texture + y * (texture + 1)) % 9) * 4
            v = min(255, tone + signal)
            image[y, x, :3] = (v, max(0, v - 12), max(0, v - 24))
            if channels == 4:
                image[y, x, 3] = (13 * x + 7 * y) % 256
            if 4 <= y < height - 7 and 8 <= x < width - 8:
                hair[y, x] = 1.0
                strokes[y, x] = float(x >= width // 2)
            if x == 5 and 12 < y < 24:
                hair[y, x] = 0.49
    return image, hair, strokes


class CountingGuard:
    def __init__(self) -> None:
        self.calls: list[float] = []

    def guard(self, before: np.ndarray, candidate: np.ndarray, lock_level: float) -> GuardDecision:
        self.calls.append(lock_level)
        return GuardDecision(candidate.copy(), 0.99, False)


class MaliciousGuard:
    def guard(self, before: np.ndarray, candidate: np.ndarray, lock_level: float) -> GuardDecision:
        edited = candidate.copy()
        edited[:, :, :] = 255
        return GuardDecision(edited, 0.01, False)


@pytest.mark.parametrize("level", [1.0, 1.1, 2.0, 2.5, 3.5, 4.9, 5.0])
def test_level_accepts_declared_tenths(level: float) -> None:
    assert checked_level(level) == level
    assert 0 <= level_weight(level) <= 1


@pytest.mark.parametrize("level", [0.9, 0.95, 2.25, 5.01, 5.1, float("nan"), True, "2.0", None])
def test_level_rejects_unsafe_values(level: object) -> None:
    with pytest.raises(ValueError):
        checked_level(level)


@pytest.mark.parametrize("mode", ["W28", "W39"])
@pytest.mark.parametrize("channels", [3, 4])
def test_neutral_is_bit_identical_and_guarded(mode: str, channels: int) -> None:
    original, mask, strokes = scene(channels=channels)
    snapshot = original.copy()
    session = HairColourSession(original, mask)
    guard = CountingGuard()
    result = session.render(
        Choice(mode=mode, level=1.0, target_level=7, base_level=4),
        strokes=strokes if mode == "W28" else None,
        guard=guard,
    )
    assert np.array_equal(result.image, original)
    assert np.array_equal(original, snapshot)
    assert result.changed_share == 0
    assert result.mean_delta == 0
    assert result.lock_applied
    assert guard.calls == [1.0]
    assert session.operation_counts["effect_computations"] == 0


@pytest.mark.parametrize("mode", ["W28", "W39"])
@pytest.mark.parametrize("tone", [45, 95, 175, 225])
@pytest.mark.parametrize("texture", [1, 3, 5])
def test_full_colours_stay_inside_observed_hair(mode: str, tone: int, texture: int) -> None:
    original, mask, strokes = scene(tone=tone, texture=texture)
    before = original.copy()
    session = HairColourSession(original, mask)
    result = session.render(
        Choice(mode=mode, level=5.0, shade="copper", base_level=4, target_level=7),
        strokes=strokes if mode == "W28" else None,
        guard=CountingGuard(),
    )
    assert np.array_equal(original, before)
    assert np.array_equal(result.image[mask < 0.5], original[mask < 0.5])
    assert np.array_equal(result.image[..., 3], original[..., 3])
    assert result.changed_share > 0
    assert result.realface_status == "unproven"
    assert "simulation" in result.label.lower()


@pytest.mark.parametrize("mode", ["W28", "W39"])
def test_malicious_guard_cannot_touch_another_region(mode: str) -> None:
    original, mask, strokes = scene()
    primary = np.zeros(mask.shape)
    primary[4:27, 8:26] = 1
    session = HairColourSession(original, mask, primary_mask=primary)
    result = session.render(
        Choice(mode=mode, level=5.0, base_level=4, target_level=7),
        strokes=strokes if mode == "W28" else None,
        guard=MaliciousGuard(),
    )
    assert np.array_equal(result.image[primary < 0.5], original[primary < 0.5])
    assert np.array_equal(result.image[..., 3], original[..., 3])
    assert result.lock_applied


def test_mask_replacement_does_not_escape_primary_face() -> None:
    original, mask, strokes = scene()
    primary = np.zeros(mask.shape)
    primary[6:24, 10:26] = 1
    session = HairColourSession(original, mask, primary_mask=primary)
    session.render(Choice("W39", level=3.0, shade="copper"))
    session.replace_observed_mask(np.ones(mask.shape))
    output = session.render(Choice("W39", level=5.0, shade="copper"), guard=CountingGuard())
    assert np.array_equal(output.image[primary < 0.5], original[primary < 0.5])
    assert session.operation_counts["mask_computations"] == 2


def test_invalid_mask_replacement_is_atomic() -> None:
    original, mask, _ = scene()
    session = HairColourSession(original, mask)
    session.render(Choice("W39", level=3.0, shade="gold"))
    before = session.operation_counts.copy()
    with pytest.raises(ValueError):
        session.replace_observed_mask(np.zeros(mask.shape))
    assert session.operation_counts == before
    assert session.render(Choice("W39", level=3.0, shade="gold")).changed_share > 0


def test_cache_reuses_expensive_result_across_all_slider_levels() -> None:
    image, mask, _ = scene()
    session = HairColourSession(image, mask)
    for level in (1.0, 2.0, 2.5, 3.5, 5.0):
        output = session.render(Choice("W39", level=level, shade="ash"))
        assert output.level == level
    assert session.operation_counts["mask_computations"] == 1
    assert session.operation_counts["effect_computations"] == 1
    assert session.operation_counts["guard_calls"] == 5
    assert session.last_level("W39") == 5.0


def test_different_shades_are_independent_cache_entries() -> None:
    image, mask, _ = scene()
    session = HairColourSession(image, mask, max_effect_cache=2)
    for shade in ("copper", "deep", "gold", "deep"):
        session.render(Choice("W39", level=5.0, shade=shade))
    assert session.operation_counts["effect_computations"] == 3
    assert session.operation_counts["cached_effects"] == 2


def test_stroke_changes_invalidate_w28_effect() -> None:
    image, mask, strokes = scene()
    session = HairColourSession(image, mask)
    choice = Choice("W28", level=4.0, base_level=4, target_level=7, softness=1)
    session.render(choice, strokes=strokes)
    new_strokes = strokes.copy()
    new_strokes[:, : image.shape[1] // 2] = 0.7
    session.render(choice, strokes=new_strokes)
    assert session.operation_counts["effect_computations"] == 2


def test_full_and_preview_share_one_cached_render() -> None:
    image, mask, _ = scene(height=80, width=100)
    session = HairColourSession(image, mask)
    choice = Choice("W39", level=3.5, shade="copper")
    preview = session.render(choice, preview_edge=48)
    full = session.render(choice)
    assert preview.preview and not full.preview
    assert preview.image.shape[0] < full.image.shape[0]
    assert preview.image.shape[1] < full.image.shape[1]
    assert session.operation_counts["effect_computations"] == 1


def test_recipe_does_not_include_photo_or_segmentation() -> None:
    choice = Choice("W39", level=4.3, shade="ash")
    data = choice.safe_recipe()
    assert parse_recipe(data) == choice
    assert "pixels" not in str(data) and "landmarks" not in str(data)
    assert "photo" not in str(data) and "mask" not in str(data)
    assert "simulation" in data


@pytest.mark.parametrize("bad_key", ["image", "mask", "landmarks", "photo_sha256", "provider_id"])
def test_recipe_rejects_extra_sensitive_fields(bad_key: str) -> None:
    raw = Choice("W39").safe_recipe()
    raw[bad_key] = "forged"
    with pytest.raises(ValueError):
        parse_recipe(raw)


@pytest.mark.parametrize("bad_value", ["W40", "colour", "", None, True, []])
def test_recipe_rejects_unknown_mode(bad_value: object) -> None:
    raw = Choice("W39").safe_recipe()
    raw["mode"] = bad_value
    with pytest.raises(ValueError):
        parse_recipe(raw)


@pytest.mark.parametrize("channels", [3, 4])
def test_session_close_clears_owned_arrays(channels: int) -> None:
    original, mask, _ = scene(channels=channels)
    session = HairColourSession(original, mask)
    session.render(Choice("W39", level=5.0))
    session.close()
    assert session.operation_counts["cached_effects"] == 0
    assert original.any()
    assert session._image.max() == 0
    assert session._hair.max() == 0


def test_extreme_mask_is_refused_without_inventing_hair() -> None:
    image, mask, _ = scene()
    mask[:] = 0.0
    with pytest.raises(ValueError, match="observed hair"):
        HairColourSession(image, mask)


@pytest.mark.parametrize("bad", [float("nan"), float("inf"), -0.1, 1.1])
def test_malformed_observed_mask_is_refused(bad: float) -> None:
    image, mask, _ = scene()
    mask[10, 10] = bad
    with pytest.raises(ValueError):
        HairColourSession(image, mask)


def test_non_numeric_image_is_refused() -> None:
    image, mask, _ = scene()
    with pytest.raises(ValueError):
        HairColourSession(image.astype(np.float64), mask)


def test_empty_placement_refuses_lift() -> None:
    image, mask, _ = scene()
    with pytest.raises(ValueError):
        HairColourSession(image, mask).render(
            Choice("W28", level=5, target_level=8, base_level=4),
            strokes=np.zeros(mask.shape),
        )


def test_lower_user_lock_allows_more_colour_than_default() -> None:
    image, mask, _ = scene(tone=150)
    session = HairColourSession(image, mask)
    choice = Choice("W39", level=5, shade="deep")
    strong = session.render(choice, lock_level=1.0)
    relaxed = session.render(choice, lock_level=0.0)
    assert relaxed.mean_delta >= strong.mean_delta
    assert relaxed.changed_share >= strong.changed_share


def test_bad_guard_output_fails_closed() -> None:
    image, mask, _ = scene()

    class BadGuard:
        def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> GuardDecision:
            return GuardDecision(np.zeros((2, 2, 3), dtype=np.uint8), 0.8, False)

    with pytest.raises(ValueError):
        HairColourSession(image, mask).render(
            Choice("W39", level=3), guard=BadGuard()
        )


def test_reused_request_preserves_recorded_mode_level() -> None:
    image, mask, strokes = scene()
    session = HairColourSession(image, mask)
    base = Choice("W39", level=2.0)
    upgraded = replace(base, level=3.5)
    session.render(base)
    session.render(upgraded)
    session.render(Choice("W28", level=2.5, base_level=4, target_level=7), strokes=strokes)
    assert session.last_level("W39") == 3.5
    assert session.last_level("W28") == 2.5
    assert session.operation_counts["mask_computations"] == 1


def test_limit_constants_are_bounded() -> None:
    assert 1 <= CACHE_LIMIT <= 8
    assert MAX_PIXELS <= 16_777_216
    assert MAX_PIXELS > 0


@pytest.mark.parametrize("toner", ["none", "pearl", "ash", "violet"])
def test_w28_accepts_only_current_authored_toners(toner: str) -> None:
    image, mask, strokes = scene()
    session = HairColourSession(image, mask)
    choice = Choice("W28", level=3, base_level=4, target_level=7, toner=toner)
    rendered = session.render(choice, strokes=strokes)
    assert rendered.lock_applied
    assert rendered.changed_share > 0


@pytest.mark.parametrize("toner", ["neutral", "warm", "unlisted"])
def test_unknown_w28_toners_fail_at_the_boundary(toner: str) -> None:
    with pytest.raises(ValueError, match="toner"):
        Choice("W28", level=3, toner=toner)
