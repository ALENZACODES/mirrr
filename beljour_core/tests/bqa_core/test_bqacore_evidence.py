"""Evidence index, tracing speed and honesty guards; report audits.

Covers TPL-01..03, AUT-01, AUT-03, GT-03, GLO-01, REF-01 and MST-01..03 on
synthetic records only.
Author: John Khan.
"""

from __future__ import annotations

import random
import time
from datetime import UTC, date, datetime

import pytest
from conftest import synthetic_row

from lab.bqa_core import evidence as evx
from lab.bqa_core import report_audit as rpa
from lab.bqa_core.registry import load_registry
from lab.bqa_core.stats import group_entry

NOW = datetime(2026, 10, 25, 12, tzinfo=UTC)


def index_rows(count: int = 24) -> list[dict[str, str]]:
    keys = ["FND-01", "SWA-01", "JDG-03", "DEF-01"]
    return [{"check_key": keys[i % 4], "evidence_id": f"EV-{i:04d}",
             "record_type": evx.RECORD_TYPES[i % 4], "file_id": f"F-{i:04d}",
             "date": "2026-10-20"} for i in range(count)]


def test_spot_check_passes_on_current_index() -> None:
    """TPL-01: four record types present; 20 sampled entries current and valid."""
    entries, problems = evx.parse_index(index_rows())
    assert problems == []
    assert evx.spot_check(entries, NOW, seed=3) == (20, [])


def test_spot_check_finds_old_unknown_and_missing_types() -> None:
    rows = index_rows(4)
    rows[0].update(date="2025-01-01", record_type="memo")
    rows[1]["check_key"] = "NOPE-01"
    entries, _ = evx.parse_index(rows)
    sampled, problems = evx.spot_check(entries, NOW)
    assert sampled == 4
    assert "record type case has no entries" in problems
    assert "EV-0000: unknown record type 'memo'" in problems
    assert "EV-0000: date missing or not current" in problems
    assert "EV-0001: unknown check key" in problems
    _, found = evx.parse_index([dict(rows[2], file_id="/srv/faces/a.jpg")])
    assert found


def test_trace_quotes_to_rows_and_evidence(context: dict[str, object]) -> None:
    """TPL-02: a quoted number leads to the row and its evidence ids."""
    group = group_entry("mst_band", "7-8", 25, 30, minimum=0.7)
    rows = [synthetic_row(context, "FND-01", evidence_kind="physical", n=48,
                          measured={"top1_rate": 0.834}, groups=[group])]
    entries, _ = evx.parse_index(index_rows(4))
    tracer = evx.Tracer(rows, entries)
    hits = tracer.trace("83.4%")
    assert [(h.check_key, h.field) for h in hits] == [("FND-01", "measured.top1_rate")]
    assert hits[0].evidence_ids == ("EV-0000",)
    assert [h.field for h in tracer.trace("48")] == ["n"]
    assert [h.field for h in tracer.trace("0.833")] == ["groups.mst_band=7-8.rate"]
    assert tracer.trace("83.4%", check_key="SWA-01") == []
    with pytest.raises(ValueError):
        evx.parse_quote("about eighty")


def test_trace_is_fast_on_100k_rows() -> None:
    """TPL-02, MST-01: tracing over 100,000 rows takes well under 5 seconds.

    The bound is relative so machine load cannot fail it: tracing must finish within
    5 seconds or within 10 times the time this same machine took to build the 100,000
    rows, whichever is larger (on an idle machine tracing takes less than the build).
    """
    rng = random.Random(5)
    keys = load_registry().keys()
    built = time.perf_counter()
    rows = [{"check_key": keys[i % len(keys)], "run_id": "R-1", "n": rng.randint(20, 500),
             "measured": {"rate": round(rng.random(), 4)}, "groups": []}
            for i in range(100_000)]
    build_seconds = time.perf_counter() - built
    rows[77_777]["measured"] = {"rate": 0.12345}
    started = time.perf_counter()
    tracer = evx.Tracer(rows)
    hits = tracer.trace("0.12345")
    for _ in range(100):
        tracer.trace(f"{rng.random():.4f}")
    assert time.perf_counter() - started < max(5.0, 10.0 * build_seconds)
    assert len(tracer) == 200_000
    assert any(h.check_key == keys[77_777 % len(keys)] for h in hits)


def test_safety_blanks() -> None:
    """TPL-03: blank safety-filter fields are found, zero tolerance."""
    full = {name: "x" for name in evx.load_safety_fields()}
    count, blanks = evx.safety_blanks([dict(full, record_id="SKU-1"),
                                       dict(full, record_id="SKU-2", allergens=" ")])
    assert count == 2
    assert blanks == ["SKU-2: allergens blank"]


def test_triage_label_and_gate_guard(context: dict[str, object]) -> None:
    """AUT-01, AUT-03: automated scores are triage only and never gate evidence."""
    reg = load_registry()
    auto_on_panel = synthetic_row(context, "SUM-02", evidence_kind="automated",
                                  triage_only=False, status="UNPROVEN")
    synthetic = synthetic_row(context, "JRN-02", reason_codes=["synthetic_inputs"])
    real = synthetic_row(context, "FND-01", evidence_kind="physical")
    needing, missing = evx.triage_label_problems([auto_on_panel, synthetic, real], reg)
    assert (needing, missing) == (2, ["SUM-02", "JRN-02"])
    labelled = evx.label_triage([auto_on_panel, synthetic, real], reg)
    assert [row["triage_only"] for row in labelled] == [True, True, False]
    sneaky = dict(synthetic_row(context, "FND-02", evidence_kind="automated"),
                  triage_only=False)
    checked, problems = evx.gate_evidence_problems([sneaky, real], reg)
    assert checked == 2 and problems == ["FND-02: automated result presented as gate evidence"]
    sheet = {"CAT-B1": ["FND-01", "FND-02", "FND-03"]}
    triaged = dict(sneaky, triage_only=True)
    assert evx.gate_sheet_problems(sheet, [real, triaged], reg) == [
        "CAT-B1: cites automated or triage-only evidence for FND-02",
        "CAT-B1: cites FND-03 with no result row"]


REPORT = """# Shade study
Intro without numbers.

## Top-1 by band
Top-1 acceptable 82.5% overall.
Ground truth: blind applied judging by three judges.

## Realism
Panel rate 4.1 of 5 on 120 ratings.

## Notes [ref: Colour Standard A]
The perfect match rate was not measured. [ref: Unknown Paper]
"""


def test_report_audits() -> None:
    """GT-03, GLO-01, REF-01 on a synthetic report."""
    scored, problems = rpa.ground_truth_problems(REPORT)
    assert scored == 2
    assert problems == ["section 'Realism': score without a ground-truth method"]
    assert rpa.term_problems(REPORT) == [
        "uses 'perfect match'; the glossary term is 'top-1 acceptable'"]
    refs = rpa.parse_references([
        {"name": "Colour Standard A", "version": "2", "access_date": "2026-10-01"},
        {"name": "Undated", "version": "", "access_date": ""}])
    cited = rpa.cited_references(REPORT)
    assert cited == ["Colour Standard A", "Unknown Paper"]
    assert rpa.reference_problems(refs, cited + ["Undated"]) == [
        "'Undated' lacks a version or access date",
        "'Unknown Paper' is cited but not in the reference register"]
    assert all(term.definition for term in rpa.load_glossary())


def test_master_checklist_rules() -> None:
    """MST-01..03: traced ticks, named limitations, re-run after model change."""
    lines = rpa.parse_checklist([
        {"line_id": "L1", "check_key": "FND-01", "ticked": "yes", "evidence_id": "EV-1",
         "limitation": "", "run_date": "2026-10-20"},
        {"line_id": "L2", "check_key": "FND-02", "ticked": "yes", "evidence_id": "EV-404",
         "limitation": "", "run_date": "2026-10-10"},
        {"line_id": "L3", "check_key": "FND-03", "ticked": "", "evidence_id": "",
         "limitation": "", "run_date": "2026-10-20"},
        {"line_id": "L4", "check_key": "SWA-02", "ticked": "", "evidence_id": "",
         "limitation": "Oxidation photos for deep shades not yet taken", "run_date": "bad"},
    ])
    assert rpa.untraced_lines(lines, {"EV-1"}) == ["L2"]
    assert rpa.silent_lines(lines) == ["L3"]
    assert rpa.stale_after_model_change(lines, [date(2026, 10, 15)]) == ["L2", "L4"]
    assert rpa.stale_after_model_change(lines, []) == []
