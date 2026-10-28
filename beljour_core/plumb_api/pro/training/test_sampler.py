"""Source-balanced, resumable minibatch selection. Author: John Khan."""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass

import pytest

from .sampler import balanced_batch


@dataclass(frozen=True)
class Row:
    name: str
    source: str


def _rows() -> list[Row]:
    # Deliberately unbalanced: 20 / 5 / 2 rows.
    sizes = {"large": 20, "medium": 5, "small": 2}
    return [Row(f"{source}-{index}", source) for source, count in sizes.items()
            for index in range(count)]


def test_selection_is_a_pure_function_of_step_and_seed() -> None:
    rows = _rows()
    first = balanced_batch(rows, step=7, seed=11, batch_size=6)
    assert first == balanced_batch(rows, step=7, seed=11, batch_size=6)
    assert first != balanced_batch(rows, step=8, seed=11, batch_size=6)
    assert first != balanced_batch(rows, step=7, seed=12, batch_size=6)


def test_sources_share_slots_evenly_despite_size() -> None:
    rows = _rows()
    totals: Counter[str] = Counter()
    for step in range(30):
        selected, counts = balanced_batch(rows, step=step, seed=1, batch_size=4)
        assert len(selected) == 4 and sum(counts.values()) == 4
        assert counts == dict(sorted(Counter(row.source for row in selected).items()))
        totals.update(counts)
    assert max(totals.values()) - min(totals.values()) <= 1


def test_each_source_is_drawn_without_replacement_per_epoch() -> None:
    rows = _rows()
    drawn: dict[str, list[str]] = {"large": [], "medium": [], "small": []}
    for step in range(20):
        for row in balanced_batch(rows, step=step, seed=3, batch_size=3)[0]:
            drawn[row.source].append(row.name)
    # 60 slots over 3 sources: 20 draws each.
    assert sorted(drawn["large"]) == sorted(f"large-{i}" for i in range(20))
    for epoch in range(4):
        chunk = drawn["medium"][epoch * 5:(epoch + 1) * 5]
        assert sorted(chunk) == sorted(f"medium-{i}" for i in range(5))
    assert len(set(drawn["small"][:2])) == 2


def test_batch_boundaries_do_not_change_the_draw_sequence() -> None:
    rows = _rows()
    by_two = [row for step in range(6) for row in balanced_batch(rows, step=step, seed=9, batch_size=2)[0]]
    by_four = [row for step in range(3) for row in balanced_batch(rows, step=step, seed=9, batch_size=4)[0]]
    assert by_two == by_four


def test_single_source_cycles_through_all_rows() -> None:
    rows = [Row(f"only-{i}", "only") for i in range(7)]
    picked = balanced_batch(rows, step=0, seed=4, batch_size=7)[0]
    assert sorted(row.name for row in picked) == sorted(row.name for row in rows)


@pytest.mark.parametrize(("step", "size"), [(-1, 2), (0, 0), (0, 4097), (1.5, 2)])
def test_invalid_arguments(step: object, size: int) -> None:
    with pytest.raises(ValueError):
        balanced_batch(_rows(), step=step, seed=1, batch_size=size)  # type: ignore[arg-type]


def test_empty_rows_are_refused() -> None:
    with pytest.raises(ValueError, match="No training rows"):
        balanced_batch([], step=0, seed=1, batch_size=1)
