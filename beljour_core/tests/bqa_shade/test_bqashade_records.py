"""Record validator and catalogue check tests (SWA-01..03, LBL-01, LBL-03, COL-02, COL-03,
PDQ-01..03, CON-03@27).

Pass definition: a complete synthetic swatch record has no problems and each
removed field is named; "no record, no recommendation" drops incomplete shades;
the seeded 5% audit sample is stable and at least one; one undertone mismatch
fails the audit; photo-only labels are flagged and kept out of ground truth;
missing provenance and unlabelled repeated claims fail; sweeps must be monthly
with tested replacements. Synthetic records only. Author: John Khan.
"""
from __future__ import annotations

from datetime import date

import pytest
from bqashade_synthetic import catalogue_shade, swatch_record

from lab.bqa_shade import catalogue, records, stats


def test_complete_swatch_record() -> None:
    assert records.swatch_problems(swatch_record("SHD-FND-014")) == []


@pytest.mark.parametrize("field", ["measured_lab", "instrument", "illuminant", "observer",
                                   "verifier_id", "verified_date", "oxidation_photo_id",
                                   "swatch_photo_ids", "price", "measured_undertone"])
def test_each_missing_field_is_named(field: str) -> None:
    record = swatch_record("SHD-FND-014")
    del record[field]
    problems = records.swatch_problems(record)
    assert any(field in p for p in problems)


def test_skin_swatches_need_five_mst_points_and_bad_values_fail() -> None:
    few = swatch_record("SHD-FND-014", skin_swatch_mst_steps=[4, 5, 6])
    assert any("MST points" in p for p in records.swatch_problems(few))
    assert records.swatch_problems(swatch_record("SHD-FND-014", measured_lab=[120, 0, 0]))
    assert records.swatch_problems(swatch_record("SHD-FND-014", verifier_id="Jane"))
    corrector = swatch_record("SHD-COR-001", product_type="corrector")
    del corrector["oxidation_lab"]
    assert records.swatch_problems(corrector) == []


def test_no_record_no_recommendation() -> None:
    index = {"SHD-FND-001": swatch_record("SHD-FND-001"),
             "SHD-FND-002": swatch_record("SHD-FND-002", price=-1)}
    kept, dropped = catalogue.no_record_no_recommendation(
        ["SHD-FND-001", "SHD-FND-002", "SHD-FND-003"], index)
    assert kept == ["SHD-FND-001"]
    assert dropped == ["SHD-FND-002", "SHD-FND-003"]
    outcome = catalogue.complete_records_outcome(["SHD-FND-001", "SHD-FND-002"], index)
    assert outcome.status == stats.FAIL
    assert catalogue.complete_records_outcome(["SHD-FND-001"], index).status == stats.PASS


def test_audit_sample_is_seeded_and_five_percent() -> None:
    ids = [f"SHD-FND-{i:03d}" for i in range(200)]
    first = catalogue.audit_sample(ids, seed=4)
    assert first == catalogue.audit_sample(list(reversed(ids)), seed=4)
    assert len(first) == 10
    assert first != catalogue.audit_sample(ids, seed=5)
    assert len(catalogue.audit_sample(ids[:3], seed=1)) == 1
    assert catalogue.audit_sample([], seed=1) == []


def audit_rows(sample: list[str], mismatch: int = 0) -> list[dict[str, object]]:
    return [{"shade_id": s, "auditor_id": "X-04", "audit_date": date(2026, 10, 20),
             "label_undertone": "warm", "physical_undertone": "cool" if i < mismatch else "warm",
             "record_matches": True} for i, s in enumerate(sample)]


def test_audit_zero_mismatches() -> None:
    sample = catalogue.audit_sample([f"SHD-FND-{i:03d}" for i in range(200)], seed=1)
    assert catalogue.audit_outcome(sample, audit_rows(sample), undertone_only=True).status \
        == stats.PASS
    failed = catalogue.audit_outcome(sample, audit_rows(sample, 1), undertone_only=True)
    assert failed.status == stats.FAIL
    partial = catalogue.audit_outcome(sample, audit_rows(sample[:5]), undertone_only=True)
    assert partial.status == stats.UNPROVEN
    assert "audit_incomplete" in partial.reason_codes
    rows = audit_rows(sample)
    rows[0]["record_matches"] = False
    assert catalogue.audit_outcome(sample, rows, undertone_only=True).status == stats.PASS
    assert catalogue.audit_outcome(sample, rows, undertone_only=False).status == stats.FAIL


def parsed(items: list[dict[str, object]], used: list[str] | None = None
           ) -> tuple[list[catalogue.Shade], list[str]]:
    data = {"format": records.CATALOGUE, "shades": items,
            "recommender_fields": used or ["lab", "undertone"]}
    return catalogue.parse_catalogue(data)


def test_photo_only_labels() -> None:
    items = [catalogue_shade(f"SHD-FND-{i:03d}") for i in range(20)]
    items += [catalogue_shade("SHD-FND-900", evidence="photo", photo_only=True)]
    shades, _ = parsed(items)
    assert catalogue.photo_only_outcome(shades).status == stats.PASS
    assert all(s.shade_id != "SHD-FND-900" for s in catalogue.ground_truth(shades))
    items.append(catalogue_shade("SHD-FND-901", evidence="photo", photo_only=False))
    shades, _ = parsed(items)
    assert catalogue.photo_only_outcome(shades).status == stats.FAIL


def test_field_provenance() -> None:
    shades, used = parsed([catalogue_shade(f"SHD-FND-{i:03d}") for i in range(5)])
    assert catalogue.provenance_outcome(shades, used, seed=1).status == stats.PASS
    shades, used = parsed([catalogue_shade("SHD-FND-001")], ["lab", "finish"])
    outcome = catalogue.provenance_outcome(shades, used, seed=1)
    assert outcome.status == stats.FAIL and outcome.measured["faults"] == 1
    sampled = catalogue.provenance_outcome(*parsed(
        [catalogue_shade(f"SHD-FND-{i:03d}") for i in range(100)]), seed=2, share=0.1)
    assert sampled.n == 20


def test_manufacturer_claims_must_be_labelled() -> None:
    shades, _ = parsed([catalogue_shade("SHD-FND-001", claim="12-hour wear")])
    labelled = [{"shade_id": "SHD-FND-001", "text": "12-hour wear (the brand's claim)."}]
    bare = [{"shade_id": "SHD-FND-001", "text": "Lasts with 12-hour wear."}]
    assert catalogue.claims_outcome(shades, labelled).status == stats.PASS
    assert catalogue.claims_outcome(shades, bare).status == stats.FAIL
    assert catalogue.claims_outcome(shades, []).status == stats.UNPROVEN


def test_devices_correctors_oxidation_and_measured_lab() -> None:
    good = {"device_id": "D-01", "tier": "low", "filters_off_evidence_id": "EV-0001",
            "checked_date": "2026-10-20"}
    assert catalogue.devices_outcome([good]).status == stats.PASS
    assert catalogue.devices_outcome([good, {**good, "filters_off_evidence_id": None}]).status \
        == stats.FAIL
    ok = {"rec_id": "R-1", "validated_mst_steps": [6, 10], "validated_by": "X-05"}
    assert catalogue.correctors_outcome([ok]).status == stats.PASS
    assert catalogue.correctors_outcome([ok, {**ok, "validated_mst_steps": None}]).status \
        == stats.FAIL
    assert catalogue.correctors_outcome([{**ok, "validated_mst_steps": [9, 3]}]).status \
        == stats.FAIL
    index = {"SHD-FND-001": swatch_record("SHD-FND-001")}
    assert catalogue.oxidation_outcome(index).status == stats.PASS
    index["SHD-FND-002"] = swatch_record("SHD-FND-002", oxidation_photo_id=None)
    assert catalogue.oxidation_outcome(index).status == stats.FAIL
    assert catalogue.measured_lab_outcome(["SHD-FND-001"], index).status == stats.PASS
    assert catalogue.measured_lab_outcome(["SHD-FND-001", "SHD-FND-777"], index).status \
        == stats.FAIL


def test_sweep_diff() -> None:
    before, _ = parsed([catalogue_shade("SHD-FND-001"), catalogue_shade("SHD-FND-002"),
                        catalogue_shade("SHD-FND-003", status="discontinued")])
    after, _ = parsed([catalogue_shade("SHD-FND-001", status="discontinued"),
                       catalogue_shade("SHD-FND-003"), catalogue_shade("SHD-FND-004")])
    diff = catalogue.sweep_diff(before, after)
    assert diff == {"discontinued": ["SHD-FND-001", "SHD-FND-002"],
                    "returned": ["SHD-FND-003"], "added": ["SHD-FND-004"]}


def sweep(day: str, tested: bool = True) -> dict[str, object]:
    return {"date": day, "signed_by": "X-06", "discontinued": ["SHD-FND-001"],
            "replacements": [{"old": "SHD-FND-001", "new": "SHD-FND-010", "tested": tested}]}


def test_monthly_sweeps() -> None:
    now = date(2026, 10, 25)
    good = {"format": records.SWEEPS,
            "sweeps": [sweep("2026-08-01"), sweep("2026-09-01"), sweep("2026-10-01")]}
    assert catalogue.sweeps_outcome(good, now).status == stats.PASS
    late = {"format": records.SWEEPS, "sweeps": [sweep("2026-06-01"), sweep("2026-10-01")]}
    assert catalogue.sweeps_outcome(late, now).status == stats.FAIL
    untested = {"format": records.SWEEPS,
                "sweeps": [sweep("2026-08-01"), sweep("2026-09-01"), sweep("2026-10-01", False)]}
    assert catalogue.sweeps_outcome(untested, now).status == stats.FAIL
    few = {"format": records.SWEEPS, "sweeps": [sweep("2026-10-01")]}
    assert catalogue.sweeps_outcome(few, now).status == stats.UNPROVEN
    stale = catalogue.sweeps_outcome(good, date(2027, 1, 1))
    assert stale.status == stats.FAIL
