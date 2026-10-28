"""Intensity curves, off state, mark visibility, hidden beautification and record imports.

Records are written by the test into tmp_path and named synthetic. Author: John Khan.
"""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
import pytest

from lab.bqa_render import intensity
from lab.bqa_render.adapters import Product, RenderOutput
from lab.bqa_render.bench import Bench, TortureCase
from lab.bqa_render.checks import check_pal01
from lab.bqa_render.faces import FaceSpec
from lab.bqa_render.records import RecordError
from lab.bqa_render.rows import parse_context


def make_bench(tmp_path: Path, **extra: object) -> Bench:
    ctx = parse_context({"run_id": "int", "seed": 5, **extra})
    return Bench(ctx, limit=2, variants=1)


def test_curve_rules() -> None:
    good = intensity.Curve("c", "blush", (0.0, 2.0, 4.0, 6.0, 8.0))
    assert good.monotone and good.even
    jump = intensity.Curve("c", "blush", (0.0, 0.1, 0.2, 0.3, 8.0))
    assert jump.monotone and not jump.even
    back = intensity.Curve("c", "blush", (0.0, 3.0, 2.0, 4.0, 5.0))
    assert not back.monotone


def test_off_state_and_opa01_pending_without_panel(tmp_path: Path) -> None:
    bench = make_bench(tmp_path)
    row = intensity.check_opa03(bench)
    measured = row["measured"]
    assert isinstance(measured, dict) and measured["identical_cases"] > 0
    assert row["status"] in ("PASS", "UNPROVEN")
    pending = intensity.check_opa01(bench)
    assert pending["status"] == "PENDING_REAL_DATA" and pending["triage_only"] is True


def test_opa01_from_synthetic_panel_records(tmp_path: Path) -> None:
    folder = tmp_path / "inputs" / "bqa_render"
    folder.mkdir(parents=True)
    lines = ["comparison_id,judge_id,correct,mst_band"]
    lines += [f"C-{i:03d},J-0{i % 3 + 1},1,{('1-2', '9-10')[i % 2]}" for i in range(60)]
    (folder / "panel_OPA-01.csv").write_text("\n".join(lines) + "\n", encoding="utf-8")
    bench = make_bench(tmp_path, inputs_dir=str(tmp_path / "inputs"))
    row = intensity.check_opa01(bench)
    assert row["status"] == "PASS" and row["n"] == 60
    measured = row["measured"]
    assert isinstance(measured, dict) and "proxy_monotone_share" in measured


def test_records_refuse_personal_columns(tmp_path: Path) -> None:
    folder = tmp_path / "inputs" / "bqa_render"
    folder.mkdir(parents=True)
    (folder / "pans.csv").write_text("pan_id,palette_id,pan_record,swatch_record,on_eye_record,"
                                     "email\nPAN-1,PAL-1,R-1,R-2,R-3,x\n", encoding="utf-8")
    bench = make_bench(tmp_path, inputs_dir=str(tmp_path / "inputs"))
    with pytest.raises(RecordError):
        check_pal01(bench)


def test_pan_records_complete_and_incomplete(tmp_path: Path) -> None:
    folder = tmp_path / "inputs" / "bqa_render"
    folder.mkdir(parents=True)
    path = folder / "pans.csv"
    header = "pan_id,palette_id,pan_record,swatch_record,on_eye_record\n"
    path.write_text(header + "PAN-1,PAL-1,R-1,R-2,R-3\nPAN-2,PAL-1,R-4,R-5,R-6\n",
                    encoding="utf-8")
    bench = make_bench(tmp_path, inputs_dir=str(tmp_path / "inputs"))
    assert check_pal01(bench)["status"] == "PASS"
    path.write_text(header + "PAN-1,PAL-1,R-1,,R-3\n", encoding="utf-8")
    assert check_pal01(bench)["status"] == "FAIL"
    assert check_pal01(make_bench(tmp_path))["status"] == "PENDING_REAL_DATA"


def test_visibility_curve_starts_at_full_contrast(tmp_path: Path) -> None:
    curve = intensity.visibility_curve(make_bench(tmp_path), (5,))
    assert set(curve) == {"mole", "freckles", "scar"}
    for values in curve.values():
        assert len(values) == len(intensity.STEPS)
        assert values[0] == pytest.approx(1.0)
        assert all(0.0 <= v < 1.5 for v in values)


def test_rls01_from_synthetic_visibility_records(tmp_path: Path) -> None:
    folder = tmp_path / "inputs" / "bqa_render"
    folder.mkdir(parents=True)
    rows = ["feature_id,feature_type,coverage_level,predicted_visible,observed_visible"]
    rows += [f"F-{i:03d},mole,light,0.9,1" for i in range(40)]
    rows += [f"G-{i:03d},scar,full,0.9,{int(i % 2 == 0)}" for i in range(40)]
    (folder / "visibility.csv").write_text("\n".join(rows) + "\n", encoding="utf-8")
    row = intensity.check_rls01(make_bench(tmp_path, inputs_dir=str(tmp_path / "inputs")))
    found = row["groups"]
    assert isinstance(found, list)
    groups = {g["value"]: g["status"] for g in found}
    assert groups == {"mole": "PASS", "scar": "FAIL"} and row["status"] == "FAIL"


def test_hidden_smoothing_outside_the_zone_is_detected(tmp_path: Path,
                                                       monkeypatch: pytest.MonkeyPatch) -> None:
    bench = make_bench(tmp_path)
    case = TortureCase("synthetic-blur", FaceSpec(marks=True))
    scene = bench.scene(case)

    def smoothing(case: TortureCase, product: Product) -> RenderOutput:
        blurred = np.asarray(cv2.GaussianBlur(scene.image, (0, 0), 1.5), dtype=np.uint8)
        cover = scene.subject.masks["lips"].astype(np.float64)
        return RenderOutput("synthetic", "rendered", blurred, cover)

    monkeypatch.setattr(bench, "render", smoothing)
    found = intensity.honesty(bench, case, "lipstick")
    assert found is not None and not found.clean and found.texture_ratio < 0.97
