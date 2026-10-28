"""Release-evidence CLI: merge, gate and compare exit codes and refusals.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.synth_diversity.stress_evidence import CHECKS, CheckOutcome, write_evidence
from lab.synth_diversity.stress_manifest import write_stress_manifest
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_release_cli import main
from lab.synth_diversity.stress_schedule import StressSchedule

SCHEDULE = StressSchedule(seed=63, count=len(ALL_PROFILES))


def evidence(root: Path, name: str, ordinals: range, fail: frozenset[int] = frozenset()) -> str:
    if not (root / "plan").exists():
        write_stress_manifest(root / "plan", SCHEDULE)
    rows = [CheckOutcome(i, SCHEDULE.at(i).identity,
                         dict.fromkeys(CHECKS, "fail" if i in fail else "pass"))
            for i in ordinals]
    write_evidence(root / name, root / "plan", rows, name)
    return str(root / name)


def policy_file(root: Path, bound: float, **extra: object) -> str:
    content = {"minimum_wilson_lower": dict.fromkeys(CHECKS, bound),
               "minimum_observations": 5, "required_slices": ["overall"],
               "excluded_checks": [], **extra}
    (root / "gate.json").write_text(json.dumps(content))
    return str(root / "gate.json")


def last_json(capsys: pytest.CaptureFixture[str]) -> dict[str, object]:
    return json.loads(capsys.readouterr().out)


def test_merge_then_gate_pass(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    first = evidence(tmp_path, "a", range(0, 20))
    second = evidence(tmp_path, "b", range(20, len(ALL_PROFILES)))
    code = main(["merge", "--plan", str(tmp_path / "plan"), "--shard", first, "--shard", second,
                 "--out", str(tmp_path / "m"), "--runner-id", "merge", "--require-complete"])
    assert code == 0 and last_json(capsys)["coverage"] == "COMPLETE"
    code = main(["gate", "--plan", str(tmp_path / "plan"), "--evidence", str(tmp_path / "m"),
                 "--policy", policy_file(tmp_path, 0.5)])
    assert code == 0 and last_json(capsys)["status"] == "PASS"


def test_gate_failure_exits_one(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    run = evidence(tmp_path, "a", range(len(ALL_PROFILES)), frozenset(range(10)))
    code = main(["gate", "--plan", str(tmp_path / "plan"), "--evidence", run,
                 "--policy", policy_file(tmp_path, 0.9)])
    assert code == 1 and last_json(capsys)["status"] == "FAIL"


def test_malformed_gate_policy_exits_two(tmp_path: Path,
                                         capsys: pytest.CaptureFixture[str]) -> None:
    run = evidence(tmp_path, "a", range(len(ALL_PROFILES)))
    path = policy_file(tmp_path, 0.5, unexpected=True)
    assert main(["gate", "--plan", str(tmp_path / "plan"), "--evidence", run,
                 "--policy", path]) == 2
    assert "field inventory" in capsys.readouterr().err


def test_compare_detects_regression(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    base = evidence(tmp_path, "base", range(len(ALL_PROFILES)))
    cand = evidence(tmp_path, "cand", range(len(ALL_PROFILES)), frozenset({4}))
    args = ["compare", "--plan", str(tmp_path / "plan"), "--baseline", base,
            "--candidate", cand]
    assert main(args) == 1 and last_json(capsys)["status"] == "REGRESSION"
    assert main([*args, "--max-regressions", "1"]) == 0


def test_overlapping_merge_exits_two(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    first = evidence(tmp_path, "a", range(0, 5))
    second = evidence(tmp_path, "b", range(4, 8))
    code = main(["merge", "--plan", str(tmp_path / "plan"), "--shard", first, "--shard", second,
                 "--out", str(tmp_path / "m"), "--runner-id", "merge"])
    assert code == 2 and "overlap" in capsys.readouterr().err
