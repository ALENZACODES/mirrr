"""Original-first W28/W39 board tests on synthetic hair regions.

Only local controls may enter exported comparison recipes.
Author: John Khan.
"""

from __future__ import annotations

import json

import numpy as np
import pytest

from plumb_api.engines.haircolour.consultation import Choice, GuardDecision, HairColourSession
from plumb_api.engines.haircolour.consultation_board import (
    Selection,
    build_board,
    parse_board_recipe,
    safe_board_recipe,
)


def setup() -> tuple[HairColourSession, np.ndarray, np.ndarray]:
    h, w = 40, 40
    image = np.full((h, w, 4), 90, dtype=np.uint8)
    image[..., 3] = 180
    for y in range(h):
        for x in range(w):
            image[y, x, 0] = 70 + (x * 3 + y) % 36
            image[y, x, 1] = 60 + (x * 3 + y) % 36
            image[y, x, 2] = 50 + (x * 3 + y) % 36
    mask = np.zeros((h, w), dtype=float)
    mask[3:34, 4:36] = 1.0
    paint = np.zeros((h, w), dtype=float)
    paint[8:30, 20:35] = 1.0
    return HairColourSession(image, mask), image, paint


class GuardCounter:
    def __init__(self) -> None:
        self.calls = 0

    def guard(self, before: np.ndarray, after: np.ndarray, level: float) -> GuardDecision:
        self.calls += 1
        return GuardDecision(after.copy(), 0.99, False)


def test_board_original_first_and_independent_edits() -> None:
    session, original, strokes = setup()
    choices = [
        Selection("copper", Choice("W39", level=3.0, shade="copper")),
        Selection("ash", Choice("W39", level=4.0, shade="ash")),
        Selection("balayage", Choice("W28", level=5.0, base_level=4, target_level=7), strokes),
    ]
    guard = GuardCounter()
    result = build_board(session, choices, guard=guard)
    assert np.array_equal(result.original, original)
    assert len(result.tiles) == 3
    assert guard.calls == 3
    assert all(t.guard_applied for t in result.tiles)
    assert all(t.changed_share > 0 for t in result.tiles)
    assert not np.array_equal(result.tiles[0].image, result.tiles[1].image)
    assert np.array_equal(session.original(), original)
    assert result.realface_status == "unproven"
    assert result.counts_only()["guarded_tiles"] == 3


def test_board_reusing_same_style_does_not_recompute_full_effect() -> None:
    session, _, _ = setup()
    selections = [
        Selection("a", Choice("W39", level=2.0, shade="gold")),
        Selection("b", Choice("W39", level=4.0, shade="gold")),
    ]
    result = build_board(session, selections)
    assert len(result.tiles) == 2
    assert session.operation_counts["effect_computations"] == 1
    assert session.operation_counts["guard_calls"] == 2


def test_board_recipe_contains_no_images_or_strokes() -> None:
    _, _, paint = setup()
    choices = [
        Selection("paint", Choice("W28", level=3.0, base_level=4, target_level=7), paint),
        Selection("colour", Choice("W39", level=3.5, shade="ash")),
    ]
    serialized = safe_board_recipe(choices)
    text = json.dumps(serialized)
    for forbidden in ("image", "pixels", "photo", "mask", "strokes", "landmarks"):
        assert forbidden not in text
    restored = parse_board_recipe(serialized)
    assert [row.choice for row in restored] == [row.choice for row in choices]
    assert all(row.strokes is None for row in restored)
    assert serialized["format"] == "beljour-hair-board/1"


@pytest.mark.parametrize("keys", [("same", "same"), ("bad/key", "okay"), ("A", "okay")])
def test_duplicate_and_invalid_board_ids_are_refused(keys: tuple[str, str]) -> None:
    first, second = keys
    selections = [
        Selection(first, Choice("W39")),
        Selection(second, Choice("W39")),
    ] if first != "bad/key" and first != "A" else None
    if selections is None:
        with pytest.raises(ValueError):
            Selection(first, Choice("W39"))
    else:
        with pytest.raises(ValueError):
            safe_board_recipe(selections)


@pytest.mark.parametrize("count", [0, 5, 10])
def test_board_refuses_invalid_option_counts(count: int) -> None:
    selections = [Selection(f"item-{i}", Choice("W39")) for i in range(count)]
    with pytest.raises(ValueError):
        safe_board_recipe(selections)


def test_board_rejects_unmarked_w28_import_until_repainted() -> None:
    session, _, paint = setup()
    choice = Selection("paint", Choice("W28", level=3, base_level=4, target_level=7), paint)
    stored = safe_board_recipe([choice])
    imported = parse_board_recipe(stored)
    with pytest.raises(ValueError, match="placement"):
        build_board(session, imported)
    rendered = build_board(session, [Selection("paint", imported[0].choice, paint)])
    assert rendered.tiles[0].changed_share > 0


@pytest.mark.parametrize("key", ["photo", "image", "landmark", "sensitive"])
def test_board_rejects_unexpected_fields(key: str) -> None:
    stored = safe_board_recipe([Selection("shade", Choice("W39"))])
    stored[key] = "unexpected"
    with pytest.raises(ValueError):
        parse_board_recipe(stored)


def test_board_does_not_accept_strokes_on_plain_recolour() -> None:
    _, _, paint = setup()
    with pytest.raises(ValueError, match="W39"):
        Selection("ash", Choice("W39"), paint)


def test_board_original_cannot_be_mutated_through_caller_copy() -> None:
    session, source, _ = setup()
    original = session.original()
    original[:] = 0
    assert np.array_equal(session.original(), source)
    before = session.operation_counts.copy()
    board = build_board(session, [Selection("warm", Choice("W39", level=4, shade="copper"))])
    board.original.fill(0)
    assert np.array_equal(session.original(), source)
    assert session.operation_counts["effect_computations"] == before["effect_computations"] + 1
