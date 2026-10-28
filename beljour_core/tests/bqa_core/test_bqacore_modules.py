"""Module isolation on drawn faces (MOD-01, MOD-02) and replay determinism (ARC-01).

Every input is drawn by code into tmp_path; no photos.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from lab.bqa_core.adapters import ShadeProbe, default_probes, public
from lab.bqa_core.drawn import drawn_face, save_drawn_face
from lab.bqa_core.modules import (
    ProbeOutput,
    UnavailableProbe,
    load_input,
    run_probe,
    sidecar_problems,
    source_version,
)
from lab.bqa_core.paths import REPO_ROOT, InsideRepoError
from lab.bqa_core.replay import replay

BUILD = "b" * 40


def test_drawn_face_is_seeded_and_complete() -> None:
    first, again, other = drawn_face(4), drawn_face(4), drawn_face(5)
    assert set(first) == {"image", "mask_skin", "mask_lips", "mask_hair", "points"}
    assert np.array_equal(first["image"], again["image"])
    assert not np.array_equal(first["image"], other["image"])
    assert first["points"].shape == (478, 2)
    with pytest.raises(ValueError):
        drawn_face(1, 32, 32)


def test_each_available_probe_runs_alone_with_complete_sidecar(tmp_path: Path) -> None:
    """MOD-01, MOD-02: M2, M3 and M4 run alone on a saved input; M1, M5, M6 say why not."""
    source = save_drawn_face(tmp_path / "inputs" / "drawn_s1.npz", seed=1)
    outcomes = {}
    for probe in default_probes():
        record = run_probe(probe, source, tmp_path / "out", build=BUILD)
        sidecar = json.loads((record.folder / "sidecar.json").read_text())
        assert sidecar_problems(sidecar) == [], (probe.module, sidecar)
        outcomes[probe.module] = (record.status, record.reason)
        if record.status == "ok":
            assert sidecar["input_sha256"] == record.sidecar["input_sha256"]
            assert (record.folder / "decision.json").is_file()
    assert outcomes == {"M1": ("not_applicable", "no_public_export"), "M2": ("ok", ""),
                        "M3": ("ok", ""), "M4": ("ok", ""),
                        "M5": ("not_applicable", "no_public_export"),
                        "M6": ("not_applicable", "no_engine")}
    assert (tmp_path / "out" / "M4" / "drawn_s1" / "output.png").is_file()


def test_png_input_and_module_error_are_recorded(tmp_path: Path) -> None:
    png = tmp_path / "drawn_s2.png"
    Image.fromarray(drawn_face(2)["image"]).save(png)
    assert load_input(png)["image"].shape == (192, 160, 3)
    record = run_probe(ShadeProbe(), png, tmp_path / "out", build=BUILD)
    assert (record.status, record.reason) == ("error", "exception:ValueError")
    assert sidecar_problems(record.sidecar) == []
    with pytest.raises(ValueError):
        load_input(tmp_path / "x.bmp")


def test_settings_change_the_settings_hash(tmp_path: Path) -> None:
    source = save_drawn_face(tmp_path / "drawn_s3.npz", seed=3)
    probe = default_probes()[3]
    one = run_probe(probe, source, tmp_path / "a", build=BUILD)
    two = run_probe(probe, source, tmp_path / "b", build=BUILD, settings={"amount": 0.0})
    assert one.sidecar["settings_sha256"] != two.sidecar["settings_sha256"]
    assert one.sidecar["output_sha256"] != two.sidecar["output_sha256"]


def test_out_dir_inside_repo_is_refused(tmp_path: Path) -> None:
    source = save_drawn_face(tmp_path / "drawn_s1.npz", seed=1)
    with pytest.raises(InsideRepoError):
        run_probe(default_probes()[1], source, REPO_ROOT / "probe-out", build=BUILD)


def test_sidecar_problems_and_versions() -> None:
    assert "missing build" in sidecar_problems({"format": "beljour-bqa-probe/1"})
    assert source_version("plumb_api.engines.shade").startswith("src-")
    assert source_version("plumb_api.no_such_package_here") == "missing"
    assert public("plumb_api.engines.shade", "_private") is None
    assert public("plumb_api.engines.shade", "colourspace") is None
    assert public("plumb_api.no_such_package_here", "render") is None
    with pytest.raises(RuntimeError):
        UnavailableProbe("M1", "detect", "no_public_export").run({}, {})


def test_replay_is_deterministic_on_drawn_input(tmp_path: Path) -> None:
    """ARC-01 code path: identical outputs and decisions over repeated replays."""
    source = save_drawn_face(tmp_path / "drawn_s6.npz", seed=6)
    for probe in default_probes()[1:4]:
        report = replay(probe, source, replays=12)
        assert (report.matching, report.distinct_outputs, report.errors) == (12, 1, 0)
        assert report.rate == 1.0


class Flaky:
    """A probe whose output changes on every second call."""

    module = "M3"
    name = "flaky"

    def __init__(self) -> None:
        self.calls = 0

    def availability(self) -> str:
        return ""

    def version(self) -> str:
        return "test"

    def defaults(self) -> dict[str, object]:
        return {}

    def run(self, inputs: object, settings: object) -> ProbeOutput:
        self.calls += 1
        if self.calls == 5:
            raise RuntimeError("one failure")
        return ProbeOutput(None, {"shade_id": "S" + str(self.calls % 2)})


def test_replay_counts_changes_and_errors(tmp_path: Path) -> None:
    source = save_drawn_face(tmp_path / "drawn_s7.npz", seed=7)
    report = replay(Flaky(), source, replays=10)
    assert report.errors == 1
    assert report.decision_changes == 5
    assert report.matching == 4
    assert report.distinct_outputs == 2
    assert report.rate == 0.4
    with pytest.raises(ValueError):
        replay(Flaky(), source, replays=0)
