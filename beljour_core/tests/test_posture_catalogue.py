"""R25E catalogue is exactly the executable local seven-fix scope."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from plumb_api.engines.posture.catalogue import SIMULATION_LABEL, PostureRefusal, posture_fixes, require_compatible
from plumb_api.engines.posture.fixes import FIXES
from plumb_api.engines.posture.synthetic import front_figure, side_figure

PARITY = Path(__file__).resolve().parents[2] / "parity/posture-catalogue-r25e.json"


def test_exact_ids_and_fixes_and_unique_modules() -> None:
    entries = posture_fixes()
    assert [e.id for e in entries] == [f"J{n}" for n in range(10, 17)]
    assert {e.fix for e in entries} == set(FIXES)
    assert len({e.id for e in entries}) == len({e.fix for e in entries}) == 7
    assert sum(e.view == "front" for e in entries) == 2
    assert sum(e.view == "side" for e in entries) == 5
    assert all(e.available for e in entries)


@pytest.mark.parametrize("index", range(7))
def test_every_entry_exposes_actual_moved_and_pinned_controls(index: int) -> None:
    entry = posture_fixes()[index]
    registered = FIXES[entry.fix]
    assert entry.moves == tuple(registered["moves"])
    assert entry.pins == tuple(registered["pins"])
    assert entry.id == registered["id"]
    assert set(entry.moves).isdisjoint(entry.pins)
    assert entry.name and entry.name[0].isupper()
    assert entry.label == SIMULATION_LABEL
    assert "Simulation" in entry.label
    assert "not medical advice" in entry.label
    assert "score" not in entry.name.lower()


@pytest.mark.parametrize("index", range(7))
def test_wrong_view_refuses_with_a_code(index: int) -> None:
    entry = posture_fixes()[index]
    other = front_figure().controls if entry.view == "side" else side_figure().controls
    with pytest.raises(PostureRefusal) as caught:
        require_compatible(other, entry.fix)
    assert caught.value.code == "view_required"
    assert entry.view in str(caught.value)


@pytest.mark.parametrize("index", range(7))
def test_correct_view_accepts_without_inventing_missing_landmarks(index: int) -> None:
    entry = posture_fixes()[index]
    sample = front_figure().controls if entry.view == "front" else side_figure().controls
    assert require_compatible(sample, entry.fix) == entry
    assert set(entry.moves).issubset(sample.points)
    assert set(entry.pins).issubset(sample.points)


def test_unknown_fix_refuses_instead_of_substituting() -> None:
    with pytest.raises(PostureRefusal) as caught:
        require_compatible(front_figure().controls, "unknown")
    assert caught.value.code == "fix_unavailable"


def test_canonical_catalogue_parity_is_byte_equal() -> None:
    payload = [entry.to_json() for entry in posture_fixes()]
    expected = json.loads(PARITY.read_text(encoding="utf-8"))
    assert expected["format"] == "beljour-posture-catalogue-r25e/1"
    assert expected["synthetic_only"] is True
    assert json.dumps(payload, separators=(",", ":"), ensure_ascii=True) == expected["canonical_json"]
    assert payload == expected["fixes"]
