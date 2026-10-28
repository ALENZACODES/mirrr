"""R7 offline harness: synthetic LS4-LS8 reports, released-photo manifest rules, parity drift.

No photos of people, downloads or network. Author: John Khan.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import pytest

from lab.python.beljour_lab import photo_harness as local_r7

ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture(scope="module")
def reports(tmp_path_factory):
    out = tmp_path_factory.mktemp("r7")
    inputs = local_r7.synthetic_set(1)
    return local_r7.evaluate(inputs, out, timing_size=128), out


def test_reports_are_written_and_never_claim_acceptance(reports):
    results, out = reports
    assert set(results) == {"LS4", "LS5", "LS6", "LS7", "LS8"}
    for name, rep in results.items():
        assert (out / f"{name.lower()}-report.json").exists()
        assert rep["human_review"] == "PENDING" and rep["device_runtime"] == "NOT_MEASURED"
        assert rep["decision"] == "UNVERIFIED" and rep["round"] == "R7" and rep["author"] == "John Khan"
        assert rep["fixture_kinds"] in (["synthetic"], ["catalogue"])
        json.dumps(rep)


def test_ls4_ls5_ls7_automatic_checks_pass_on_drawn_inputs(reports):
    results, _ = reports
    for name in ("LS4", "LS5", "LS7"):
        assert results[name]["automated_passed"] == results[name]["automated_total"] > 0, name
    assert "not medical advice" in results["LS4"]["label"]


def test_ls6_estimators_and_known_deblur_gap(reports):
    rows = {r["setting"]: r for r in reports[0]["LS6"]["evaluations"]}
    assert all(r["auto_pass"] for k, r in rows.items() if k.startswith("estimator:"))
    assert rows["Q11:M1"]["auto_pass"] and rows["Q11:M4"]["auto_pass"]
    assert "unsharp fallback" in rows["Q11:M2"]["note"]


def test_ls8_reports_exact_pin_and_permission_status_for_every_model(reports):
    rows = reports[0]["LS8"]["evaluations"]
    models = {r["setting"]: r for r in rows if r["case"] == "catalogue"}
    expected = {
        "face-detector-short": ("allowed", 229746, True, "PASS"),
        "face-landmarker-478": ("allowed", 3758596, True, "PASS"),
        "pose-landmarker-lite": ("pending", 5777746, False, "PASS"),
        "hair-segmenter": ("allowed", 781618, True, "PASS"),
        "selfie-multiclass": ("allowed", 16371837, True, "PASS"),
        "migan-512-places2": ("pending", None, False, "NOT_PINNED"),
    }
    assert set(models) == set(expected)
    assert len([r for r in rows if r["case"] == "catalogue"]) == len(expected)
    for name, (status, size, fetchable, download_gate) in expected.items():
        row = models[name]
        assert row["status"] == status, name
        assert row["fetchable"] is fetchable, name
        assert row["q13_download"] == download_gate, name
        assert row["download_mb"] == (None if size is None else round(size / (1024 * 1024), 3)), name
    # A measured byte pin can satisfy the download-size budget without granting
    # model permission. Inference and device runtime remain unmeasured here.
    assert reports[0]["LS8"]["decision"] == "UNVERIFIED"
    assert reports[0]["LS8"]["device_runtime"] == "NOT_MEASURED"
    server = [r for r in rows if r["case"] == "server"][0]
    assert set(server["python_seconds"]) == {"enhance", "fibre", "beard", "posture", "fill"}


def _png(path: Path, array: np.ndarray) -> None:
    from PIL import Image
    Image.fromarray(array).save(path)


def test_released_manifest_rules(tmp_path):
    from plumb_api.engines.posture import synthetic as figures
    fig = figures.front_figure()
    _png(tmp_path / "body.png", fig.image)
    _png(tmp_path / "dark.png", (fig.image // 3).astype(np.uint8))
    manifest = {"format": local_r7.MANIFEST, "photos": [
        {"spike": "ls4", "image": "body.png", "view": "front", "points": {k: list(v) for k, v in fig.controls.points.items()}},
        {"spike": "ls5", "image": "body.png", "region": [[40, 40], [120, 40], [120, 160], [40, 160]]},
        {"spike": "ls6", "image": "dark.png"}]}
    path = tmp_path / "m.json"
    path.write_text(json.dumps(manifest))
    with pytest.raises(ValueError, match="adult-confirmed"):
        local_r7.released_set(path, adult_confirmed=False)
    inputs = local_r7.released_set(path, adult_confirmed=True)
    assert len(inputs.ls4) == 1 and inputs.ls4[0].person_source == "approximate from points"
    assert inputs.ls4[0].case_id.startswith("released-") and inputs.ls5 and inputs.ls6
    for bad in ({"format": "other", "photos": []},
                {"format": local_r7.MANIFEST, "photos": [{"spike": "ls9", "image": "body.png"}]},
                {"format": local_r7.MANIFEST, "photos": [{"spike": "ls6", "image": "https://x/y.png"}]},
                {"format": local_r7.MANIFEST, "photos": [{"spike": "ls6", "image": "dark.png"}, {"spike": "ls6", "image": "dark.png"}]},
                {"format": local_r7.MANIFEST, "photos": [{"spike": "ls4", "image": "body.png", "view": "top", "points": {}}]}):
        path.write_text(json.dumps(bad))
        with pytest.raises(ValueError):
            local_r7.released_set(path, adult_confirmed=True)


def test_released_ls6_rows_are_no_reference(tmp_path):
    from plumb_api.engines.repair import synthetic as rs
    case = local_r7.EnhanceCase(rs.add_noise(rs.low_light(rs.scene(96, 80), 0.3), 10.0, 2), "released-test", "released")
    rep = local_r7.ls6([case], None)
    assert rep["evaluations"][0]["setting"] == "low_light:no_reference"
    assert rep["fixture_kinds"] == ["released"]


def test_unknown_spike_and_cli_flags(tmp_path):
    with pytest.raises(ValueError, match="unknown spikes"):
        local_r7.evaluate(local_r7.InputSet(), tmp_path, spikes=("LS9",))
    script = ROOT / "api/scripts/spike_local.py"
    done = subprocess.run([sys.executable, str(script), "--round", "r7", "--spikes", "LS8", "--timing-size", "128",
                           "--out", str(tmp_path / "cli")], capture_output=True, text=True, cwd=ROOT / "api")
    assert done.returncode == 0, done.stderr
    assert "LS8:" in done.stdout and (tmp_path / "cli" / "ls8-report.json").exists()
    bad = subprocess.run([sys.executable, str(script), "--round", "r7", "--adult-confirmed", "--out", str(tmp_path / "x")],
                         capture_output=True, text=True, cwd=ROOT / "api")
    assert bad.returncode != 0


def test_parity_vectors_have_not_drifted():
    done = subprocess.run([sys.executable, str(ROOT / "api/scripts/make_parity.py"), "photo", "--check"], capture_output=True,
                          text=True, cwd=ROOT / "api")
    assert done.returncode == 0, done.stderr + done.stdout
