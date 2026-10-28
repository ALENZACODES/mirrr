"""Record paths of the C18 handlers, end to end through run_checks on one synthetic folder.

Pass definition: with a full synthetic inputs folder (manifest "synthetic"),
every check that has records reaches a computed status instead of
PENDING_REAL_DATA, carries triage_only and the "records_not_marked_real"
reason, and the planted faults are found: one audit mismatch (LBL-01), one
unflagged photo label (LBL-03), a device without filters-off evidence (COL-02),
a tested shade without a swatch (COL-03), an unlabelled repeated claim (PDQ-02)
and a late sweep (PDQ-03). Synthetic records only. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import pytest
from bqashade_synthetic import (
    BANDS,
    catalogue_shade,
    inputs_folder,
    label_rows,
    swatch_record,
    trial_rows,
    write_csv,
    write_json,
    write_trials,
)

from lab.bqa_shade import applied, bands, catalogue, checks, records, stats
from lab.bqa_shade.stability import Plan

RECORD_KEYS = ("LBL-01", "LBL-03", "SKN-01", "SKN-02", "COL-02", "COL-03", "LGT-01", "LGT-03",
               "FND-01", "CON-01@27", "CON-02@27", "VTO-02", "RB2-01", "SWA-01", "SWA-02",
               "SWA-03", "PDQ-01", "PDQ-02", "PDQ-03")


def tiny_plan(seed: int = 18) -> Plan:
    cells = tuple(c for c in bands.skin_grid() if (c[0], c[1]) == (6, "warm"))
    return Plan(cells, repeats=1, seed=seed, width=160, height=200)


def build_folder(root: Path) -> Path:
    folder = inputs_folder(root, "synthetic")
    shade_ids = [f"SHD-FND-{i:03d}" for i in range(40)]
    shades = [catalogue_shade(s) for s in shade_ids]
    shades[0] = catalogue_shade("SHD-FND-000", evidence="photo", photo_only=False,
                                claim="12-hour wear")
    write_json(folder, "catalogue.json", {"format": records.CATALOGUE, "shades": shades,
                                          "recommender_fields": ["lab", "undertone"]})
    sample = catalogue.audit_sample(shade_ids, seed=18)
    audit = [{"shade_id": s, "auditor_id": "X-04", "audit_date": "2026-10-20",
              "label_undertone": "warm", "physical_undertone": "cool" if i == 0 else "warm",
              "record_matches": "yes"} for i, s in enumerate(sample)]
    write_csv(folder / "audit_results.csv", [c.name for c in catalogue.AUDIT_COLUMNS], audit)
    write_csv(folder / "expert_labels.csv", [c.name for c in applied.LABEL_COLUMNS],
              label_rows(40, 1.0, 0.95))
    trials = trial_rows({b: 0.95 for b in BANDS}, 40)
    trials += trial_rows({b: 0.95 for b in BANDS}, 40, product="concealer", start=400)
    trials += trial_rows({b: 0.9 for b in BANDS}, 40, bench="bathroom", light="warm_indoor",
                         start=800)
    write_trials(folder, trials)
    swatches = [swatch_record(f"SHD-FND-{i:03d}") for i in range(39)]
    swatches += [swatch_record("SHD-FND-900"), swatch_record("SHD-FND-901")]
    write_json(folder, "swatches.json", {"format": records.SWATCHES, "records": swatches})
    device = {"device_id": "D-01", "tier": "low", "filters_off_evidence_id": "EV-0001",
              "checked_date": "2026-10-20"}
    write_json(folder, "devices.json", {"format": records.DEVICES,
                                        "devices": [device, {**device, "device_id": "D-02",
                                                             "filters_off_evidence_id": None}]})
    write_json(folder, "recommendations.json", {"format": records.RECOMMENDATIONS, "items": [
        {"shade_id": "SHD-FND-000", "text": "Made for 12-hour wear."}]})
    write_json(folder, "sweeps.json", {"format": records.SWEEPS, "sweeps": [
        {"date": "2026-06-01", "signed_by": "X-06", "discontinued": [], "replacements": []}]})
    checker = [{"capture_id": f"C-{i:03d}", "light": light, "device_tier": "mid", "patch": 1,
                "corrected_l": 51.0, "corrected_a": 0.0, "corrected_b": 0.0,
                "reference_l": 50.0, "reference_a": 0.0, "reference_b": 0.0}
               for i in range(80) for light in ("daylight", "cool_office_led")]
    write_csv(folder / "checker_captures.csv", [c.name for c in applied.CHECKER_COLUMNS], checker)
    five = ("daylight", "warm_indoor", "cool_office_led", "backlit", "flash")
    light_trials = [{"participant_id": f"P-{p:04d}", "mst_band": "5-6", "undertone": "warm",
                     "light": name, "shade_step": 10, "change_explained": ""}
                    for p in range(40) for name in five]
    write_csv(folder / "light_trials.csv", [c.name for c in applied.LIGHT_TRIAL_COLUMNS],
              light_trials)
    return root


@pytest.fixture(scope="module")
def rows(tmp_path_factory: pytest.TempPathFactory) -> Iterator[dict[str, dict[str, object]]]:
    root = build_folder(tmp_path_factory.mktemp("inputs"))
    with pytest.MonkeyPatch.context() as patch:
        patch.setattr(Plan, "quick", staticmethod(tiny_plan))
        found = checks.run_checks({"run_id": "R-REC", "quick": True, "inputs_dir": str(root),
                                   "now_utc": "2026-10-25T00:00:00Z"})
        yield {str(r["check_key"]): r for r in found}


def test_record_paths_are_computed_and_triage(rows: dict[str, dict[str, object]]) -> None:
    for key in RECORD_KEYS:
        row = rows[key]
        assert row["status"] not in (stats.PENDING, stats.ERROR), (key, row["reason_codes"])
        assert row["triage_only"] is True, key
        reasons = row["reason_codes"]
        assert isinstance(reasons, list) and "records_not_marked_real" in reasons, key


@pytest.mark.parametrize("key", ["LBL-01", "LBL-03", "COL-02", "COL-03", "PDQ-02", "PDQ-03"])
def test_planted_faults_are_found(rows: dict[str, dict[str, object]], key: str) -> None:
    assert rows[key]["status"] == stats.FAIL


def test_clean_records_pass(rows: dict[str, dict[str, object]]) -> None:
    for key in ("SKN-01", "LGT-01", "LGT-03", "PDQ-01", "SWA-02"):
        assert rows[key]["status"] == stats.PASS, key
    assert rows["SWA-03"]["status"] == stats.FAIL
    measured = rows["SKN-02"]["measured"]
    assert isinstance(measured, dict) and "confusion_5_6_warm_as_cool" in measured


def test_vto_uses_measured_swatches(rows: dict[str, dict[str, object]]) -> None:
    row = rows["VTO-02"]
    groups = row["groups"]
    assert isinstance(groups, list)
    assert {g["value"] for g in groups if g["axis"] == "colour_source"} == {"measured"}
