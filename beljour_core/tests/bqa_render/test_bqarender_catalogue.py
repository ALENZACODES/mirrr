"""Schema tests for the C19 check, torture and robustness tables, and key coverage.

Every owned key must have a check function whose docstring names the key, so the
box can grep a key and find its code. Synthetic tables only. Author: John Khan.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.bqa_render import catalogue
from lab.bqa_render.bench import load_torture
from lab.bqa_render.checks import CHECKS
from lab.bqa_render.robustness import load_families

EXPECTED = (
    "JRN-02 MSK-02 MSK-03 DET-02 DET-03 LMK-02 LMK-03 SEG-02 SEG-03 VTO-01 VTO-03 PAL-01 "
    "PAL-02 PRD-01 PRD-02 PRD-03 OPA-01 OPA-03 RLS-01 RLS-03 VID-03 PHO-01 PHO-02 PHO-03 "
    "HAR-02 HAR-03 ROB-01 ROB-02 ROB-03 RB2-02 RB2-03 CAT-A1 CAT-A3 CAT-C2 CAT-C3 NEG-01 "
    "NEG-02 CSF-03 WE2-01 WE2-03").split()
NOT_AUTOMATABLE = {"PAL-01": "physical", "OPA-01": "panel", "RLS-01": "physical",
                   "WE2-03": "physical"}


def test_check_table_holds_exactly_the_forty_owned_keys() -> None:
    specs = catalogue.load()
    assert [s.key for s in specs] == EXPECTED
    for spec in specs:
        expected_kind = NOT_AUTOMATABLE.get(spec.key, "automated")
        assert spec.evidence_kind == expected_kind
        assert spec.suite == spec.key.split("-")[0]


def test_every_owned_key_has_a_check_naming_it() -> None:
    assert set(CHECKS) == set(EXPECTED)
    for key, check in CHECKS.items():
        assert check.__doc__ is not None and key in check.__doc__


@pytest.mark.parametrize("change", [
    {"format": "other"},
    {"checks": []},
])
def test_bad_tables_are_refused(tmp_path: Path, change: dict[str, object]) -> None:
    raw = json.loads(catalogue.DATA.read_text(encoding="utf-8"))
    raw.update(change)
    path = tmp_path / "synthetic_checks.json"
    path.write_text(json.dumps(raw), encoding="utf-8")
    with pytest.raises(ValueError):
        catalogue.load(path)


def test_duplicate_or_malformed_keys_are_refused(tmp_path: Path) -> None:
    raw = json.loads(catalogue.DATA.read_text(encoding="utf-8"))
    raw["checks"].append(dict(raw["checks"][0]))
    path = tmp_path / "synthetic_dupe.json"
    path.write_text(json.dumps(raw), encoding="utf-8")
    with pytest.raises(ValueError, match="duplicate"):
        catalogue.load(path)
    raw["checks"] = [dict(raw["checks"][0], key="bad key")]
    path.write_text(json.dumps(raw), encoding="utf-8")
    with pytest.raises(ValueError, match="bad check key"):
        catalogue.load(path)


def test_torture_table_is_valid_and_covers_the_hard_cases() -> None:
    cases = load_torture()
    assert len(cases) >= 20
    faces = [c.face for c in cases]
    assert {f.tone for f in faces} == set(range(1, 11))
    assert {"open", "smile", "talk", "closed"} <= {f.mouth_state for f in faces}
    assert {"blink", "closed"} <= {f.eye_state for f in faces}
    assert any(f.glasses for f in faces) and any(f.hand for f in faces)
    assert {"bald", "shaved", "covered"} <= {f.hair for f in faces}
    assert {15.0, 30.0} <= {abs(f.yaw) for f in faces}


def test_robustness_table_has_at_least_150_cases() -> None:
    families = load_families()
    assert sum(f.count for f in families) >= 150
    group = next(f for f in families if f.family == "group")
    assert group.count >= 100 and "wrong_face" in group.zero_tolerance
