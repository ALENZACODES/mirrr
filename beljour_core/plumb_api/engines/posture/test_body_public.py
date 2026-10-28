"""R29E browser projection: counts-only, validated, and accepted by the CLI. Author: John Khan."""
from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

import pytest

from . import body_command as C
from . import body_freeze as F
from .body_ledger import BodyLedger
from .body_measurement import FACE_FIX_IDS, measurement_record, parse_measurement
from .body_public import EVIDENCE_FORMAT, PublicReportError, browser_report
from .body_scorecard import build_scorecard


@pytest.fixture(scope="module")
def card() -> dict[str, Any]:
    run = F.freeze_manifest(F.control_rows(1), shard_count=2)
    ledger = BodyLedger(run)
    for body in run.bodies[:40]:
        for fix in F.FIX_IDS_BY_VIEW[body.view]:
            similarity = 0.99 if fix in FACE_FIX_IDS else None
            ledger.record(parse_measurement(measurement_record(
                run.fingerprint, body.shard, body.photo_sha256, fix, identity_similarity=similarity)))
    return build_scorecard(ledger)


def test_projection_has_exactly_the_browser_fields(card: dict[str, Any]) -> None:
    report = browser_report(card)
    assert set(report) == {"format", "run", "definitions_sha256", "set_status", "numeric_status",
                           "release_status", "human_review", "completion", "rows"}
    assert report["format"] == EVIDENCE_FORMAT
    assert (report["release_status"], report["human_review"]) == ("NOT_RUN", "NOT_RUN")
    assert len(report["rows"]) == 308
    assert all(set(row) == {"fix", "view", "slice", "group", "bodies", "expected_jobs", "measured_jobs",
                            "refused_jobs", "passed_jobs", "status"} for row in report["rows"])
    assert "duplicates_ignored" not in report["completion"]
    assert report["numeric_status"] == "UNPROVEN"


def test_projection_contains_no_per_subject_values(card: dict[str, Any]) -> None:
    text = json.dumps(browser_report(card))
    run = F.freeze_manifest(F.control_rows(1), shard_count=2)
    assert not any(body.photo_sha256 in text for body in run.bodies)
    assert "owner_consent_control" not in text and "jobs_sha256" not in text


@pytest.mark.parametrize(("mutate", "code"), [
    (lambda c: c["rows"].pop(), "missing_group_rows"),
    (lambda c: c["rows"].__setitem__(1, dict(c["rows"][0])), "duplicate_group_row"),
    (lambda c: c["rows"][0].__setitem__("status", "CHECKS_OK"), "inconsistent_row_status"),
    (lambda c: c["rows"][0].__setitem__("passed_jobs", 999), "impossible_row_counts"),
    (lambda c: c["rows"][0].__setitem__("bodies", -1), "invalid_row_count"),
    (lambda c: c.__setitem__("numeric_status", "CHECKS_OK"), "inconsistent_numeric_status"),
    (lambda c: c.__setitem__("release_status", "PASS"), "invalid_scorecard"),
])
def test_an_unsafe_scorecard_is_never_projected(card: dict[str, Any], mutate: Any, code: str) -> None:
    broken = copy.deepcopy(card)
    mutate(broken)
    with pytest.raises(PublicReportError, match=code):
        browser_report(broken)


def test_cli_writes_operator_browser_and_coverage_outputs(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    manifest = tmp_path / "manifest.json"
    manifest.write_text(json.dumps({"format": "beljour-posture-body-manifest/1", "rows": F.control_rows(1)}))
    run_file = tmp_path / "run.json"
    assert C.main(["freeze", "--manifest", str(manifest), "--out", str(run_file)]) == 0
    run = F.load_private_run(json.loads(run_file.read_text()))
    results = tmp_path / "results.jsonl"
    body = run.bodies[0]
    results.write_text("".join(json.dumps(measurement_record(run.fingerprint, body.shard, body.photo_sha256, fix,
                                                               identity_similarity=0.99)) + "\n"
                               for fix in F.FIX_IDS_BY_VIEW[body.view]))
    outputs = [tmp_path / name for name in ("report.json", "browser.json", "coverage.json")]
    assert C.main(["report", "--run", str(run_file), "--results", str(results), "--out", str(outputs[0]),
                   "--browser-report", str(outputs[1]), "--coverage-plan", str(outputs[2])]) == 0
    assert json.loads(outputs[1].read_text())["format"] == EVIDENCE_FORMAT
    assert json.loads(outputs[2].read_text())["additional_needed"] == 1140
    capsys.readouterr()


def test_cli_validates_every_destination_before_writing(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    manifest = tmp_path / "manifest.json"
    manifest.write_text(json.dumps({"format": "beljour-posture-body-manifest/1", "rows": F.control_rows(1)}))
    out = tmp_path / "run.json"
    assert C.main(["freeze", "--manifest", str(manifest), "--out", str(out),
                   "--coverage-plan", str(C.REPO_ROOT / "coverage.json")]) == 2
    assert json.loads(capsys.readouterr().out)["reason"] == "output_inside_repository"
    assert not out.exists(), "nothing is written when any destination is refused"
    assert C.main(["freeze", "--manifest", str(manifest), "--out", str(out), "--coverage-plan", str(out)]) == 2
    assert json.loads(capsys.readouterr().out)["reason"] == "duplicate_output_location"
