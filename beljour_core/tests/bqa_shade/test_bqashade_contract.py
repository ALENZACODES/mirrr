"""Result row and context tests for "beljour-bqa-result/1".

Pass definition: rows built by make_row validate; any non-number in measured,
a path, image name, hash or address in the note, an unknown status or a
reordered key set is rejected; work_dir and inputs_dir inside the repository
are refused. Author: John Khan.
"""
from __future__ import annotations

from pathlib import Path

import pytest

from lab.bqa_shade import contract, stats


def make(context: contract.Context, **overrides: object) -> dict[str, object]:
    row = contract.make_row(
        context, check_key="FND-01", module="M3", evidence_kind="applied",
        status=stats.PENDING, triage_only=False, n=0, note="No applied records were imported.",
        measured={"top1_rate": 0.5}, threshold={"overall_min": 0.8},
        groups=[stats.rate_group("mst_band", "1-2", 18, 20, minimum=0.7)],
        reason_codes=["no_real_records"],
    )
    row.update(overrides)
    return row


@pytest.fixture()
def context(tmp_path: Path) -> contract.Context:
    return contract.parse_context({"run_id": "R-1", "work_dir": str(tmp_path / "w"),
                                   "seed": 4, "thresholds": {"x": 2}})


def test_valid_row(context: contract.Context) -> None:
    row = make(context)
    assert contract.validate_row(row) == []
    assert tuple(row) == contract.ROW_KEYS
    assert row["suite"] == "FND"


@pytest.mark.parametrize(("key", "value"), [
    ("status", "MAYBE"), ("module", "M9"), ("evidence_kind", "vibes"), ("triage_only", 1),
    ("n", -1), ("measured", {"a": "high"}), ("reason_codes", ["Has Spaces"]),
    ("note", "Saved to /home/x/run/face.png."), ("note", "Hash " + "ab" * 20),
    ("note", "Contact p@mail.example"), ("note", ""),
])
def test_invalid_rows(context: contract.Context, key: str, value: object) -> None:
    assert contract.validate_row(make(context, **{key: value}))


def test_reordered_keys_are_rejected(context: contract.Context) -> None:
    row = make(context)
    shuffled = dict(reversed(list(row.items())))
    assert contract.validate_row(shuffled) == ["row keys do not match the contract"]


def test_suite_of_page_keys() -> None:
    assert contract.suite_of("CON-01@27") == "CON"
    assert contract.suite_of("CAT-B2") == "CAT"
    assert contract.suite_of("RB2-01") == "RB2"


def test_context_defaults_and_threshold(context: contract.Context) -> None:
    assert context.seed == 4
    assert context.threshold("x", 1.0) == 2.0
    assert context.threshold("missing", 3.0) == 3.0
    assert context.dataset_id == "none"


@pytest.mark.parametrize("bad", [
    {}, {"run_id": ""}, {"run_id": "R", "seed": "4"}, {"run_id": "R", "seed": True},
    {"run_id": "R", "thresholds": {"a": "x"}}, {"run_id": "R", "thresholds": []},
    {"run_id": "R", "work_dir": str(contract.REPO_ROOT / "lab")},
    {"run_id": "R", "inputs_dir": str(contract.REPO_ROOT)},
])
def test_bad_contexts(bad: dict[str, object]) -> None:
    with pytest.raises(ValueError):
        contract.parse_context(bad)


def test_non_finite_measured_is_refused(context: contract.Context) -> None:
    with pytest.raises(ValueError):
        contract.make_row(context, check_key="FND-01", module="M3", evidence_kind="applied",
                          status=stats.PASS, triage_only=True, n=1, note="x.",
                          measured={"a": float("nan")})
