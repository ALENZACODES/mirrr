"""Applied blind-study analysis tests on synthetic records with planted rates.

Pass definition: FND-01 passes at a planted 90% (bands 85%) and fails at 60%;
a missing band keeps it UNPROVEN; FND-02, FND-03 (30-minute drop), CON-01@27,
CON-02@27, CAT-B1, WE1-01, RB2-01, SKN-01, SKN-02 (unsure counted), LGT-01 and
LGT-03 flip at the right numbers; judges are pooled with ties going to the
product. Synthetic records only. Author: John Khan.
"""
from __future__ import annotations

from pathlib import Path

import pytest
from bqashade_synthetic import BANDS, label_rows, trial_rows, write_csv

from lab.bqa_shade import applied, importers, stats


def cases_from(rows: list[dict[str, object]], tmp_path: Path) -> list[applied.Case]:
    path = tmp_path / "trials.csv"
    write_csv(path, [c.name for c in applied.TRIAL_COLUMNS], rows)
    table = importers.read_csv(path, applied.TRIAL_COLUMNS)
    assert table.rejected == 0, table.problems
    return applied.pool_cases(table.rows)


def every_band(rate: float) -> dict[str, float]:
    return {band: rate for band in BANDS}


def test_top1_flips_at_planted_rates(tmp_path: Path) -> None:
    good = cases_from(trial_rows(every_band(0.95), 60), tmp_path)
    assert applied.top1(good).status == stats.PASS
    bad = cases_from(trial_rows(every_band(0.6), 60), tmp_path)
    outcome = applied.top1(bad)
    assert outcome.status == stats.FAIL
    assert outcome.measured["rate"] == pytest.approx(0.6)
    assert [g.value for g in outcome.groups if g.axis == "mst_band"] == list(BANDS)


def test_one_weak_band_fails_the_band_gate(tmp_path: Path) -> None:
    rates = {**every_band(0.95), "9-10": 0.4}
    outcome = applied.top1(cases_from(trial_rows(rates, 60), tmp_path))
    weak = [g for g in outcome.groups if g.value == "9-10"][0]
    assert weak.status == stats.FAIL
    assert outcome.status == stats.FAIL


def test_missing_band_is_unproven(tmp_path: Path) -> None:
    rates = {band: 0.97 for band in BANDS[:4]}
    outcome = applied.top1(cases_from(trial_rows(rates, 80), tmp_path))
    assert outcome.status == stats.UNPROVEN
    assert "band_missing:9-10" in outcome.reason_codes


def test_judges_are_pooled_and_ties_go_to_the_product(tmp_path: Path) -> None:
    rows = trial_rows({"5-6": 1.0}, 1, judges=2)
    rows[1]["acceptable_10min"] = "no"
    cases = cases_from(rows, tmp_path)
    assert len(cases) == 1 and cases[0].judges == 2 and cases[0].acceptable_10 is True
    rows.append({**rows[1], "judge_id": "J-03"})
    assert cases_from(rows, tmp_path)[0].acceptable_10 is False


def test_top3(tmp_path: Path) -> None:
    good = cases_from(trial_rows(every_band(0.9), 60, top3_rate=1.0), tmp_path)
    assert applied.top3(good).status == stats.PASS
    bad = cases_from(trial_rows(every_band(0.9), 60, top3_rate=0.8), tmp_path)
    assert applied.top3(bad).status == stats.FAIL


def test_oxidation_drop(tmp_path: Path) -> None:
    steady = cases_from(trial_rows(every_band(0.9), 200, rate30=every_band(0.9)), tmp_path)
    assert applied.oxidation(steady).status == stats.PASS
    drop = cases_from(trial_rows(every_band(0.9), 200, rate30={**every_band(0.9),
                                                               "7-8": 0.7}), tmp_path)
    outcome = applied.oxidation(drop)
    assert outcome.status == stats.FAIL
    assert outcome.measured["drop_points_7_8"] == pytest.approx(20.0)


def test_concealer_under_eye_and_blemish(tmp_path: Path) -> None:
    good = cases_from(trial_rows(every_band(0.97), 80, product="concealer"), tmp_path)
    assert applied.under_eye(good).status == stats.PASS
    assert applied.blemish(good).status == stats.PASS
    ashy = cases_from(trial_rows({**every_band(0.97), "9-10": 0.5}, 80, product="concealer"),
                      tmp_path)
    assert applied.under_eye(ashy).status == stats.FAIL


def test_catb1_and_we101(tmp_path: Path) -> None:
    rows = trial_rows(every_band(0.97), 300, rate30=every_band(0.97), top3_rate=1.0)
    rows += trial_rows(every_band(0.5), 30, study="sprint", start=900)
    cases = cases_from(rows, tmp_path)
    assert applied.foundation_gates(cases).status == stats.PASS
    assert applied.top1(cases, study="sprint").status == stats.FAIL


def test_bathroom_gap_and_disclosure(tmp_path: Path) -> None:
    rows = trial_rows(every_band(0.9), 40)
    rows += trial_rows(every_band(0.5), 40, bench="bathroom", light="warm_indoor", start=500)
    cases = cases_from(rows, tmp_path)
    assert applied.bathroom(cases).status == stats.FAIL
    disclosed = applied.bathroom(cases, disclosed=True)
    assert disclosed.status == stats.PASS and "limitation_disclosed" in disclosed.reason_codes
    close = trial_rows(every_band(0.9), 40)
    close += trial_rows(every_band(0.92), 40, bench="bathroom", light="warm_indoor", start=500)
    assert applied.bathroom(cases_from(close, tmp_path)).status == stats.PASS


def test_tone_and_undertone_labels(tmp_path: Path) -> None:
    path = tmp_path / "labels.csv"
    write_csv(path, [c.name for c in applied.LABEL_COLUMNS], label_rows(60, 1.0, 0.9, 5))
    rows = importers.read_csv(path, applied.LABEL_COLUMNS).rows
    assert applied.tone_labels(rows).status == stats.PASS
    under = applied.undertone_labels(rows)
    assert under.measured["expert_unsure"] == 25
    assert under.n == 275
    assert under.status == stats.PASS
    write_csv(path, [c.name for c in applied.LABEL_COLUMNS], label_rows(60, 0.6, 0.5))
    rows = importers.read_csv(path, applied.LABEL_COLUMNS).rows
    assert applied.tone_labels(rows).status == stats.FAIL
    assert applied.undertone_labels(rows).status == stats.FAIL


def checker_row(capture: int, light: str, error: float) -> dict[str, object]:
    return {"capture_id": f"C-{capture:03d}", "light": light, "device_tier": "mid",
            "patch": 1, "corrected_l": 50.0 + error, "corrected_a": 0.0, "corrected_b": 0.0,
            "reference_l": 50.0, "reference_a": 0.0, "reference_b": 0.0}


def test_checker_per_light() -> None:
    rows = [checker_row(i, light, 1.0) for i in range(80)
            for light in ("daylight", "cool_office_led")]
    assert applied.checker(rows, 3.0).status == stats.PASS
    rows += [checker_row(500 + i, "dim_evening", 9.0) for i in range(20)]
    outcome = applied.checker(rows, 3.0)
    assert outcome.status == stats.PASS
    assert outcome.measured["chart_de00_mean_dim_evening"] > 3.0
    bad = [checker_row(i, "daylight", 5.0) for i in range(80)]
    assert applied.checker(bad, 3.0).status == stats.FAIL


def light_rows(person: int, steps: list[int | None], explained: bool = False
               ) -> list[dict[str, object]]:
    names = ("daylight", "warm_indoor", "cool_office_led", "backlit", "flash")
    return [{"participant_id": f"P-{person:04d}", "mst_band": "5-6", "undertone": "warm",
             "light": name, "shade_step": step, "change_explained": explained}
            for name, step in zip(names, steps, strict=True)]


def test_light_trials() -> None:
    stable = [r for p in range(40) for r in light_rows(p, [10, 10, 11, 10, 10])]
    assert applied.light_trials(stable).status == stats.PASS
    jumpy = [r for p in range(40) for r in light_rows(p, [10, 13, 10, 10, 10])]
    assert applied.light_trials(jumpy).status == stats.FAIL
    told = [r for p in range(40) for r in light_rows(p, [10, 13, 10, 10, None], True)]
    assert applied.light_trials(told).status == stats.PASS
    partial = light_rows(1, [10, 10, 10, 10, 10])[:3]
    assert applied.light_trials(partial).measured["incomplete_testers"] == 1
