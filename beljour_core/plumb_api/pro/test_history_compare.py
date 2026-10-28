"""Recipe history byte cap and split layout semantics (no images stored)."""

from __future__ import annotations

from dataclasses import replace

import pytest

from plumb_api.pro import Brush, Crop, Point, Recipe, RecipeHistory, split_plan


def heavy_recipe(index: int) -> Recipe:
    brush = Brush(tuple(Point(j / 10, (j + index) % 10 / 10) for j in range(8)), 0.05)
    return Recipe(masks=(brush,) * 12, crop=Crop(rotation=float(index)))


def test_history_is_bounded_by_bytes_and_count() -> None:
    history = RecipeHistory(byte_cap=32768, limit=100)
    for number in range(1, 25):
        assert history.commit(heavy_recipe(number))
        assert history.state.estimated_bytes <= history.state.byte_cap
    assert history.state.length < 24
    assert history.current.crop.rotation == 24
    count = history.state.length
    for _ in range(30):
        history.undo()
    assert history.state.position == 0
    assert not history.state.can_undo
    assert history.state.length == count


def test_history_undo_branch_redo_and_reset() -> None:
    history = RecipeHistory()
    assert history.state.length == 1
    assert not history.commit(Recipe())
    history.commit(Recipe(crop=Crop(rotation=10)))
    history.commit(Recipe(crop=Crop(rotation=20)))
    assert history.undo().crop.rotation == 10
    assert history.redo().crop.rotation == 20
    history.undo()
    history.commit(Recipe(crop=Crop(rotation=30)))
    assert not history.state.can_redo
    assert history.current.crop.rotation == 30
    history.reset()
    assert history.current == Recipe()
    assert history.state.length == 1


def test_history_invalid_limits_and_rejected_oversized_edit_does_not_mutate() -> None:
    with pytest.raises(ValueError):
        RecipeHistory(limit=1)
    with pytest.raises(ValueError):
        RecipeHistory(byte_cap=1024)
    history = RecipeHistory(byte_cap=8192)
    initial = history.current
    with pytest.raises(ValueError):
        history.commit(heavy_recipe(1))
    assert history.current == initial
    assert history.state.length == 1
    with pytest.raises(ValueError):
        RecipeHistory(initial=heavy_recipe(1), byte_cap=8192)


def test_split_geometry_extremes_axes_and_invalid_input() -> None:
    assert split_plan(200, 100).before_rect == (0, 0, 100, 100)
    assert split_plan(200, 100, 0.25, "horizontal").before_rect == (0, 0, 200, 25)
    assert split_plan(200, 100, 0).divider == 0
    assert split_plan(200, 100, 1).divider == 200
    with pytest.raises(ValueError):
        split_plan(0, 100)
    with pytest.raises(ValueError):
        split_plan(100, 0)
    with pytest.raises(ValueError):
        split_plan(4000, 4000)
    with pytest.raises(ValueError):
        split_plan(100, 100, float("nan"))
    with pytest.raises(ValueError):
        split_plan(100, 100, 0.5, "diagonal")  # type: ignore[arg-type]
    assert replace(split_plan(100, 100), fraction=0.8).fraction == 0.8
