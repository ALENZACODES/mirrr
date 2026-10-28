"""Speed budget tests on CPU. Budgets are ASSUMED; measured numbers go in the hand-off.

Author: John Khan.
"""

from __future__ import annotations

import statistics
import time
from collections.abc import Callable
from functools import partial

import pytest

from plumb_api.seasonal.cards import DesignStore, export_png, make_another, make_card
from plumb_api.seasonal.cards.service import render_card
from plumb_api.seasonal.cards.synthetic import encode_with_metadata, synthetic_portrait

RENDER_BUDGET_MS = 300.0
PNG_BUDGET_MS = 600.0
MAKE_BUDGET_MS = 80.0


def _median_ms(action: Callable[[], object], repeats: int = 5) -> float:
    timings = []
    for _ in range(repeats):
        start = time.perf_counter()
        action()
        timings.append((time.perf_counter() - start) * 1000)
    return statistics.median(timings)


@pytest.fixture(scope="module")
def photo() -> bytes:
    return encode_with_metadata(synthetic_portrait(1200, 1500, seed=9)[0])


@pytest.mark.slow
def test_full_render_at_share_size_is_within_budget(photo: bytes) -> None:
    worst = 0.0
    for seed, occasion in enumerate(("halloween", "christmas", "diwali", "holi", "new_year")):
        card = make_card(occasion, photo, to="Sam", sender="Alex", message="Have fun", seed=seed)
        worst = max(worst, _median_ms(partial(render_card, card, 1080)))
    assert worst < RENDER_BUDGET_MS, f"slowest median render {worst:.0f} ms"


@pytest.mark.slow
def test_png_export_is_within_budget(photo: bytes) -> None:
    card = make_card("halloween", photo, seed=4)
    assert _median_ms(lambda: export_png(card), repeats=3) < PNG_BUDGET_MS


@pytest.mark.slow
def test_make_another_is_interactive(photo: bytes) -> None:
    card = make_card("halloween", photo, seed=5, store=DesignStore())
    state = {"card": card}

    def step() -> None:
        state["card"] = make_another(state["card"])

    assert _median_ms(step, repeats=9) < MAKE_BUDGET_MS
