"""R26E acceptance definitions preserve r25e thresholds and stay NOT_RUN.

Author: John Khan.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

import pytest

from plumb_api.engines.posture import body_acceptance as BA
from plumb_api.engines.posture.body_evidence import BodyEvidenceError, load_definitions


def _copy(tmp_path: Path) -> Path:
    target = tmp_path / "defs"
    shutil.copytree(BA.ACCEPTANCE, target)
    return target


def _edit(folder: Path, name: str, **changes: Any) -> None:
    path = folder / f"{name}.json"
    data = json.loads(path.read_text())
    data.update(changes)
    path.write_text(json.dumps(data))


def _row(index: int, view: str, size: str, tone: int) -> dict[str, Any]:
    return {
        "photo_sha256": f"{index:064x}", "source": "owner_consent_study", "source_ancestry": [],
        "licence": "Owner-Consent", "derived_metrics_allowed": True, "released_adult": True,
        "minors_excluded": True, "view": view, "body_size": size, "monk": str(tone),
    }


def test_committed_definitions_load_and_are_not_run() -> None:
    loaded = BA.load_acceptance()
    assert set(loaded) == set(BA.EXPECTED_ACCEPTANCE)
    assert all(item["status"] == "awaiting body set" for item in loaded.values())
    merged = BA.thresholds(loaded)
    r25e = load_definitions()["posture_levels"]["threshold"]
    for key in ("maximum_movement_share", "maximum_lean_degrees", "minimum_identity_similarity",
                "minimum_group_pass_rate", "minimum_reduction", "maximum_overshoot"):
        assert merged[key] == r25e[key]
    assert merged["minimum_jacobian"] == 0.2
    assert merged["default_lock_level"] == 5.0


@pytest.mark.parametrize(("name", "changes"), [
    ("posture_movement", {"threshold": {"maximum_movement_share": 0.08}}),
    ("posture_identity", {"status": "passed"}),
    ("posture_artifacts", {"fix_ids": ["J10"]}),
    ("posture_movement", {"minimum_slice_bodies": 10}),
    ("posture_identity", {"prerequisites": {"definitions": "elsewhere"}}),
    ("posture_artifacts", {"measurements": ["simulation_label"]}),
    ("posture_movement", {"regression": {"required": False, "max_drop": 0.0}}),
    ("posture_identity", {"notes": []}),
])
def test_any_drift_fails_closed(tmp_path: Path, name: str, changes: dict[str, Any]) -> None:
    folder = _copy(tmp_path)
    if "threshold" in changes:
        original = json.loads((folder / f"{name}.json").read_text())["threshold"]
        changes = {"threshold": {**original, **changes["threshold"]}}
    _edit(folder, name, **changes)
    with pytest.raises(BodyEvidenceError):
        BA.load_acceptance(folder)


def test_missing_definition_fails_closed(tmp_path: Path) -> None:
    folder = _copy(tmp_path)
    (folder / "posture_identity.json").unlink()
    with pytest.raises(BodyEvidenceError, match="posture_identity"):
        BA.load_acceptance(folder)


def test_r25e_drift_is_detected_through_the_prerequisites() -> None:
    r25e = load_definitions()
    loosened = {name: {**value, "threshold": {**value["threshold"], "minimum_identity_similarity": 0.9}}
                for name, value in r25e.items()}
    with pytest.raises(BodyEvidenceError):
        BA.load_acceptance(BA.ACCEPTANCE, loosened)


def test_manifest_coverage_never_becomes_pass() -> None:
    assert BA.acceptance_state([]).status == "NOT_RUN"
    thin = [_row(i, "front", "small", 1) for i in range(30)]
    assert BA.acceptance_state(thin).status == "UNPROVEN"
    full = [
        _row(index, view, size, tone)
        for index, (view, size, tone, _) in enumerate(
            (view, size, tone, copy)
            for view in ("front", "side") for size in ("small", "medium", "large")
            for tone in range(1, 11) for copy in range(20)
        )
    ]
    state = BA.acceptance_state(full)
    assert state.status == "NOT_RUN" and state.checked == 1200


def test_cli_reports_not_run(capsys: pytest.CaptureFixture[str], tmp_path: Path) -> None:
    assert BA.main(["--validate-definitions"]) == 0
    lines = capsys.readouterr().out.splitlines()
    assert lines[-1] == "NOT_RUN: no released body manifest supplied"
    manifest = tmp_path / "manifest.json"
    manifest.write_text(json.dumps({"format": "beljour-posture-body-manifest/1", "rows": []}))
    assert BA.main(["--validate-definitions", "--manifest", str(manifest)]) == 0
    assert json.loads(capsys.readouterr().out.splitlines()[-1])["status"] == "NOT_RUN"
    manifest.write_text("[]")
    assert BA.main(["--validate-definitions", "--manifest", str(manifest)]) == 2
