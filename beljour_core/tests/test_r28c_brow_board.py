"""Original-first brow board and strictly photo-free recipe tests.

Cases use artificial colours and independent mask observations.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from plumb_api.engines.brows.trial import BrowTrialSession
from plumb_api.engines.brows.trial_board import (
    BrowChoice,
    compare_brow_styles,
    parse_brow_recipe,
)
from tests.r28c_brow_vectors import DrawnBrowSource, drawn_brows


def choices() -> tuple[BrowChoice, ...]:
    return (
        BrowChoice("tint", "deep", 5.0),
        BrowChoice("powder", "ash", 3.5),
        BrowChoice("lamination", "neutral", 2.0),
        BrowChoice("tint", "warm", 4.0),
    )


@pytest.mark.parametrize("count", [1, 2, 3, 4])
def test_original_first_board_does_not_stack_or_modify_source(count: int) -> None:
    frame, observation = drawn_brows(base=180)
    source = DrawnBrowSource(observation)
    session = BrowTrialSession(source)
    baseline = frame.copy()
    board = compare_brow_styles(session, frame, (0, 0, 1, 1), choices()[:count])
    assert board.status == "ready"
    assert len(board.panels) == count
    np.testing.assert_array_equal(frame, baseline)
    np.testing.assert_array_equal(board.original, baseline)
    assert source.calls == 1
    for panel in board.panels:
        result = BrowTrialSession(DrawnBrowSource(observation)).render(
            frame, box=(0, 0, 1, 1),
            mode=panel.choice.mode, shade=panel.choice.shade, level=panel.choice.level,
        )
        np.testing.assert_array_equal(result.image, panel.result.image)
        assert "simulation" in result.label.lower()


def test_no_geometry_refuses_entire_board_atomically() -> None:
    frame, observation = drawn_brows()
    source = DrawnBrowSource(observation)
    board = compare_brow_styles(BrowTrialSession(source), frame, None, choices())
    assert board.status == "refused"
    assert not board.panels
    np.testing.assert_array_equal(board.original, frame)
    assert source.calls == 0


@pytest.mark.parametrize("bad", [(), (BrowChoice("tint", "deep", 5),) * 5])
def test_options_must_be_one_to_four(bad: tuple[BrowChoice, ...]) -> None:
    frame, observation = drawn_brows()
    with pytest.raises(ValueError, match="one to four"):
        compare_brow_styles(BrowTrialSession(DrawnBrowSource(observation)), frame, (0, 0, 1, 1), bad)


def test_duplicate_choices_are_refused_before_mask_observation() -> None:
    frame, observation = drawn_brows()
    source = DrawnBrowSource(observation)
    with pytest.raises(ValueError, match="identical"):
        compare_brow_styles(BrowTrialSession(source), frame, (0, 0, 1, 1), (choices()[0], choices()[0]))
    assert source.calls == 0


def test_recipe_contains_only_original_brow_controls() -> None:
    frame, observation = drawn_brows()
    board = compare_brow_styles(BrowTrialSession(DrawnBrowSource(observation)), frame, (0, 0, 1, 1), choices())
    safe = board.safe_recipe()
    assert safe["simulation"] is True
    assert set(safe) == {"format", "options", "simulation"}
    assert len(safe["options"]) == 4
    assert parse_brow_recipe(safe) == choices()
    assert "image" not in str(safe)
    assert "landmark" not in str(safe)
    assert "mask" not in str(safe)
    assert "hash" not in str(safe)


@pytest.mark.parametrize("bad", [
    {"format": "other", "simulation": True, "options": []},
    {"format": "beljour-brow-consultation/1", "simulation": False, "options": []},
    {"format": "beljour-brow-consultation/1", "simulation": True, "options": [], "image": "x"},
    {"format": "beljour-brow-consultation/1", "simulation": True, "options": [
        {"mode": "tint", "shade": "deep", "level": 2.25}
    ]},
    {"format": "beljour-brow-consultation/1", "simulation": True, "options": [
        {"mode": "tint", "shade": "deep", "level": 2.0, "photo": "x"}
    ]},
])
def test_imported_recipe_rejects_forgery_or_unsupported_values(bad: dict[str, object]) -> None:
    with pytest.raises(ValueError):
        parse_brow_recipe(bad)


def test_false_brow_state_cannot_export_a_partial_board() -> None:
    frame, observation = drawn_brows()
    malformed = replace(observation, states={**observation.states, "right_brow": "not_visible:occluded"})
    board = compare_brow_styles(
        BrowTrialSession(DrawnBrowSource(malformed)), frame, (0, 0, 1, 1), choices(),
    )
    assert board.status == "refused"
    assert not board.panels
    with pytest.raises(ValueError, match="cannot be exported"):
        board.safe_recipe()
