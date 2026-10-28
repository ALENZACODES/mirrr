"""Result and run formats, privacy rule, JSONL round trip and shared statistics.

Author: John Khan.
"""

from __future__ import annotations

import random
from pathlib import Path
from typing import Any

import pytest
from conftest import synthetic_row

from lab.bqa_core.results import (
    STATUSES,
    dumps_row,
    read_jsonl,
    read_run_rows,
    result_problems,
    run_problems,
    text_problems,
    write_jsonl,
)
from lab.bqa_core.stats import (
    group_entry,
    median,
    rate_status,
    wilson,
    zero_tolerance_status,
)


def test_valid_row_passes(context: dict[str, object]) -> None:
    assert result_problems(synthetic_row(context, "MOD-01")) == []


@pytest.mark.parametrize("field, value, message", [
    ("status", "GREEN", "not in"),
    ("module", "M4", "module: must be"),
    ("suite", "XYZ", "suite: must be"),
    ("n", -1, "below 0"),
    ("measured", {"rate": "high"}, "expected number"),
    ("check_key", "ZZZ-01", "unknown check key"),
    ("triage_only", "yes", "expected boolean"),
    ("note", "Saved under /home/x/faces", "file path"),
    ("note", "see face_0001.png", "image file name"),
    ("note", "owner p.one@example.org", "e-mail"),
    ("dataset_id", "f" * 40, "hash digest"),
    ("reason_codes", ["has space"], "bad code"),
])
def test_bad_rows_are_rejected(context: dict[str, object], field: str, value: object,
                               message: str) -> None:
    row = synthetic_row(context, "MOD-01")
    row[field] = value
    problems = result_problems(row)
    assert any(message in problem for problem in problems), problems


def test_extra_and_missing_fields(context: dict[str, object]) -> None:
    row = synthetic_row(context, "MOD-01")
    row["face_path"] = "x"
    assert any("unexpected field" in p for p in result_problems(row))
    del row["face_path"]
    del row["note"]
    assert any("missing note" in p for p in result_problems(row))
    assert result_problems(["not", "a", "row"]) == ["$: expected object"]


def test_build_may_be_a_full_git_sha(context: dict[str, object]) -> None:
    sha = "0123456789abcdef" * 2 + "01234567"
    assert result_problems(synthetic_row(context, "MOD-01", build=sha)) == []


def test_automated_pass_on_human_check_must_be_triage(context: dict[str, object]) -> None:
    row = synthetic_row(context, "FND-01", evidence_kind="automated")
    assert any("triage" in p for p in result_problems(row))
    row["triage_only"] = True
    assert result_problems(row) == []


def test_error_rows_need_a_reason(context: dict[str, object]) -> None:
    row = synthetic_row(context, "MOD-03", "ERROR")
    assert any("ERROR rows" in p for p in result_problems(row))
    row["reason_codes"] = ["exception:ValueError"]
    assert result_problems(row) == []


def test_group_rules(context: dict[str, object]) -> None:
    good = group_entry("mst_band", "9-10", 28, 30, minimum=0.7)
    row = synthetic_row(context, "MOD-01", groups=[good])
    assert result_problems(row) == []
    bad = dict(good, value="11-12")
    assert any("unknown mst_band" in p for p in result_problems(dict(row, groups=[bad])))
    small = dict(good, n=10, passed=10, status="PASS")
    assert any("n < 20" in p for p in result_problems(dict(row, groups=[small])))
    with pytest.raises(ValueError):
        group_entry("light", "moonlight", 1, 2, minimum=0.5)


def test_text_rule_allows_check_vocabulary() -> None:
    for text in ("CON-01@27", "pass / fail per suite", "FND-01/case-003", "M4 render v1.2"):
        assert text_problems(text, "$") == [], text
    assert text_problems("C:\\faces\\a", "$") != []
    assert text_problems("data:image/png;base64,AAAA", "$") != []


def test_jsonl_round_trip_is_canonical(context: dict[str, object], tmp_path: Path) -> None:
    rows = [synthetic_row(context, key) for key in ("MOD-01", "MOD-02")]
    path = tmp_path / "run" / "results" / "bqa_core.jsonl"
    assert write_jsonl(path, rows) == 2
    assert read_jsonl(path) == rows
    assert path.read_text().splitlines()[0] == dumps_row(rows[0])
    assert read_run_rows(tmp_path / "run") == rows
    path.write_text("{}\nnot json\n")
    with pytest.raises(ValueError, match="line 2"):
        read_jsonl(path)


def test_run_summary_rules() -> None:
    run: dict[str, Any] = {
           "format": "beljour-bqa-run/1", "run_id": "R-1", "build": "abc", "dataset_id": "D",
           "snapshots": {"catalogue": "c", "trend": "t"}, "started_utc": "2026-10-25T10:00:00Z",
           "finished_utc": "2026-10-25T10:01:00Z", "settings_sha256": "0" * 64,
           "packages": [{"name": "bqa_core", "outcome": "ok", "rows": 40, "seconds": 1.5}]}
    assert run_problems(run) == []
    assert any("before" in p for p in run_problems(dict(run, finished_utc="2026-10-24")))
    assert any("duplicate" in p for p in run_problems(dict(run, packages=run["packages"] * 2)))
    assert any("outcome" in p for p in run_problems(
        dict(run, packages=[dict(run["packages"][0], outcome="fine")])))


def test_wilson_and_statuses() -> None:
    interval = wilson(80, 100)
    assert interval.low == pytest.approx(0.7111, abs=1e-3)
    assert interval.high == pytest.approx(0.8666, abs=1e-3)
    assert rate_status(19, 19, minimum=0.8)[0] == "UNPROVEN"
    assert rate_status(95, 100, minimum=0.8)[0] == "PASS"
    assert rate_status(80, 100, minimum=0.8)[0] == "UNPROVEN"
    assert rate_status(50, 100, minimum=0.8)[0] == "FAIL"
    assert rate_status(1, 100, maximum=0.1)[0] == "PASS"
    assert rate_status(40, 100, maximum=0.1)[0] == "FAIL"
    with pytest.raises(ValueError):
        rate_status(1, 2)
    assert zero_tolerance_status(0, 200, min_n=200) == "PASS"
    assert zero_tolerance_status(0, 199, min_n=200) == "UNPROVEN"
    assert zero_tolerance_status(1, 1000) == "FAIL"
    assert median([3.0, 1.0, 2.0, 10.0]) == 2.5


def test_wilson_properties_on_seeded_counts() -> None:
    rng = random.Random(17)
    for _ in range(500):
        n = rng.randint(0, 400)
        k = rng.randint(0, n)
        interval = wilson(k, n)
        assert 0.0 <= interval.low <= interval.high <= 1.0
        if n:
            assert interval.low <= k / n <= interval.high


def test_validator_never_raises_on_seeded_garbage(context: dict[str, object]) -> None:
    """Property test: random mutations of a valid row give problems, never exceptions."""
    rng = random.Random(23)
    base = synthetic_row(context, "ARC-01")
    junk: list[object] = [None, 1, -5, 2.5, float("inf"), "x", "", [], {}, True, ["a"], {"k": 1}]
    for _ in range(400):
        row = dict(base)
        for _ in range(rng.randint(1, 3)):
            row[rng.choice(list(base))] = rng.choice(junk)
        problems = result_problems(row)
        assert isinstance(problems, list)
        if row["status"] not in STATUSES or not isinstance(row["groups"], list):
            assert problems
