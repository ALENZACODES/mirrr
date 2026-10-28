"""End-to-end fairness run on code-drawn stress portraits with a deliberately biased check.

A toy "face is bright enough" check fails dark faces. The harness must find
that bias from declared tags alone: Fitzpatrick VI fails, parity flags it,
a fix note goes to the owning lane and the export stays numbers-only.
Everything is drawn in code and written to a temporary folder.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import cv2
import numpy as np
import numpy.typing as npt
import pytest

from lab.facescale_synth.fairness.export import build_export, export_problems
from lab.facescale_synth.fairness.fixnotes import write_notes
from lab.facescale_synth.fairness.report import Thresholds, build_report
from lab.facescale_synth.fairness.rows import ResultRow, join
from lab.facescale_synth.fairness.traits import collect
from lab.facescale_synth.stress.stream import portrait_config, read_manifest, write_shard
from lab.facescale_synth.stress.trait_source import StressTraitSource


def brightness_check(image: npt.NDArray[np.uint8], box: list[float]) -> tuple[bool, str | None]:
    """Biased on purpose: passes only when the face box is bright on average."""
    x0, y0, x1, y1 = (int(round(v)) for v in box)
    height, width = image.shape[:2]
    crop = image[max(0, y0) : min(height, y1), max(0, x0) : min(width, x1)]
    if crop.size == 0:
        return False, "empty_box"
    luma = float(cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY).mean())
    return (True, None) if luma > 95.0 else (False, "too_dark")


@pytest.fixture(scope="module")
def stress_run(tmp_path_factory: pytest.TempPathFactory) -> tuple[Path, list[ResultRow]]:
    out = tmp_path_factory.mktemp("box") / "sets"
    report = write_shard(out, portrait_config(96, 96), 1025, 360, log=lambda _: None)
    folder = Path(report.folder)
    manifest = folder / "manifest.jsonl"
    rows: list[ResultRow] = []
    for row in read_manifest(manifest, "test"):
        label = row["label"]
        assert isinstance(label, dict)
        faces = label["faces"]
        assert isinstance(faces, list) and len(faces) == 1
        data = np.frombuffer((folder / str(row["file"])).read_bytes(), np.uint8)
        decoded = cv2.imdecode(data, cv2.IMREAD_COLOR)
        assert decoded is not None
        image = np.asarray(cv2.cvtColor(decoded, cv2.COLOR_BGR2RGB), dtype=np.uint8)
        passed, reason = brightness_check(image, faces[0]["box"])
        rows.append(ResultRow(str(row["sha256"]), "toy_detect", "bright_face", passed, reason))
    return manifest, rows


def test_tags_come_from_the_manifest(stress_run: tuple[Path, list[ResultRow]]) -> None:
    manifest, rows = stress_run
    source = StressTraitSource((manifest,))
    records = collect([source])
    assert len(records) == len(rows) == 360
    assert source.skipped == 0
    assert all(r.rendering == "stress approximation" for r in records.values())


def test_harness_finds_the_bias_and_writes_notes(stress_run: tuple[Path, list[ResultRow]]) -> None:
    manifest, rows = stress_run
    records = collect([StressTraitSource((manifest,))])
    joined = join(rows, records)
    assert joined.untagged == 0
    report = build_report(
        joined, Thresholds(0.9), families=["fitzpatrick", "head_covering"], holm_correction=True
    )
    status = {c.slice[0][1]: c.status for c in report.cells if c.slice[0][0] == "fitzpatrick"}
    assert status["VI"] == "FAIL"
    assert status["I"] in ("PASS", "UNPROVEN")
    flagged = {(row.family, row.value) for row in report.flagged()}
    assert ("fitzpatrick", "VI") in flagged
    notes = write_notes(
        report, {"toy_detect": "A"}, {"too_dark": "api/plumb_api/quality/ exposure"}
    )
    vi = [n for n in notes if n.slice == [["fitzpatrick", "VI"]] and n.kind == "fail"]
    assert vi and vi[0].lane == "A" and vi[0].top_reasons[0][0] == "too_dark"
    document = build_export(report, notes)
    assert export_problems(document) == []
    assert str(manifest.parent) not in json.dumps(document)
