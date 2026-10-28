"""Invariants of the r34f reviews over all 144 drawn skin-lighting cases.

Synthetic drawn colours only; nothing here is a face result. Author: John Khan.
"""
from __future__ import annotations

from plumb_api.engines.shade.distance import rank_shades
from plumb_api.engines.shade.finder import thresholds
from plumb_api.engines.shade.illumination_sensitivity import audit_illumination_sensitivity
from plumb_api.engines.shade.reference_ambiguity import inspect_reference_ambiguity
from plumb_api.engines.shade.sensitivity_parity import CASTS, base_colours, case_reading
from plumb_api.engines.shade.shade_safety import assess_shade_safety

ALLOWANCE = float(thresholds()["never_lighter_allowance"])


def matrix():  # type: ignore[no-untyped-def]
    for _, base in base_colours():
        for name, cast in CASTS.items():
            result, sample, estimates = case_reading(base, cast)
            sens = audit_illumination_sensitivity(result, sample, estimates)
            amb = inspect_reference_ambiguity(result)
            yield name, result, sens, amb, assess_shade_safety(result, sens, amb)


def test_no_review_changes_selection_or_raises_confidence() -> None:
    count = 0
    for _, result, sens, amb, safety in matrix():
        count += 1
        selected = None if result.refused or result.best is None else result.best["id"]
        assert sens.selected_id in (selected, None)
        assert amb.confidence == result.confidence["overall"]
        assert safety.selected_id in (selected, None)
        if result.refused:
            assert sens.status == amb.status == safety.status == "refused"
    assert count == 144


def test_alternatives_and_selections_respect_no_lightening() -> None:
    for _, result, _, amb, _ in matrix():
        if result.refused:
            continue
        assert result.best is not None and result.best["lighter_by"] <= ALLOWANCE
        assert all(alt.lighter_by <= ALLOWANCE for alt in amb.alternatives)
        assert [m.record.id for m in rank_shades(result.measured_lab)][:1] == [result.best["id"]]


def test_uncorrected_casts_are_flagged_and_daylight_mostly_consistent() -> None:
    by_cast: dict[str, list[str]] = {}
    for name, _, sens, _, safety in matrix():
        by_cast.setdefault(name, []).append(safety.status)
        if name in ("green", "magenta"):
            assert sens.status == "sensitive"
    assert by_cast["daylight"].count("consistent") >= 12
    assert "refused" not in by_cast["daylight"]


def test_refusals_stay_counted() -> None:
    statuses = [safety.status for *_, safety in matrix()]
    assert len(statuses) == 144
    assert statuses.count("refused") + statuses.count("review") + statuses.count("consistent") == 144
