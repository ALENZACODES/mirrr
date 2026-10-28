"""Stage recorder and audit, mask quality typing, edge movement and fallback.

All files are written under tmp_path. Author: John Khan.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

from lab.bqa_render import masks, stages
from lab.bqa_render.adapters import STAGES, Product, render
from lab.bqa_render.bench import Bench
from lab.bqa_render.faces import portrait
from lab.bqa_render.rows import parse_context


def test_stage_record_and_audit_round_trip(tmp_path: Path) -> None:
    scene = portrait("synthetic-s1")
    out = render(scene.image, scene.subject, Product.of("blush"))
    written = stages.record(tmp_path, "S1", "blush", out)
    assert len(written) == len(STAGES)
    assert stages.audit(tmp_path, "S1", "blush", scene.image.shape[:2]).complete
    (tmp_path / "stages" / "bqa_render" / "S1" / "blush" / "mask.npy").write_bytes(b"broken")
    broken = stages.audit(tmp_path, "S1", "blush", scene.image.shape[:2])
    assert broken.present == 6 and broken.readable == 5 and not broken.complete


def test_vto01_needs_a_work_dir(tmp_path: Path) -> None:
    none = Bench(parse_context({"run_id": "st"}), limit=1, variants=1)
    assert stages.check_vto01(none)["status"] == "NOT_APPLICABLE"
    bench = Bench(parse_context({"run_id": "st", "work_dir": str(tmp_path)}), limit=1,
                  variants=1)
    row = stages.check_vto01(bench)
    assert row["n"] == 9 and (tmp_path / "st" / "stages" / "bqa_render" / "index.json").is_file()


def _square(y: int, x: int, size: int = 10) -> np.ndarray:
    mask = np.zeros((60, 60), dtype=bool)
    mask[y:y + size, x:x + size] = True
    return mask


def test_mask_failure_types() -> None:
    scene = portrait("synthetic-s2", edge=60, size=0.3)
    truth = scene.subject.masks["lips"]
    assert masks.mask_qc("a", "lips", truth, scene).passed
    bite = masks.mask_qc("b", "lips", truth & (np.arange(60)[:, None] > 45), scene)
    assert bite.failure_type == "mask_bite"
    bleed = masks.mask_qc("c", "lips", truth | _square(40, 25, 14), scene)
    assert bleed.failure_type in ("mask_bleed", "mask_wrong_class")
    wrong = masks.mask_qc("d", "lips", truth | scene.subject.masks["skin"], scene)
    assert wrong.failure_type == "mask_wrong_class"


def test_edge_distance() -> None:
    a = _square(10, 10)
    assert max(masks.edge_distance(a, a)) == 0.0
    shifted = masks.edge_distance(a, _square(10, 12))
    assert 0 < float(np.mean(shifted)) <= 2.0
    assert masks.edge_distance(a, np.zeros_like(a)) == [99.0]


@pytest.fixture()
def bench() -> Bench:
    return Bench(parse_context({"run_id": "mk", "seed": 4}), limit=2, variants=1)


def test_guard_holds_failed_masks_and_types_them(bench: Bench) -> None:
    row = masks.check_msk02(bench)
    measured = row["measured"]
    assert isinstance(measured, dict) and measured["graded_on_failed_mask"] == 0
    typed = masks.check_msk03(bench)["measured"]
    assert isinstance(typed, dict) and typed["typed_failures"] == typed["failed_masks"]


def test_still_clip_and_fallback_rows(bench: Bench) -> None:
    seg02 = masks.check_seg02(bench)
    assert seg02["triage_only"] is True and seg02["n"] == 12
    seg03 = masks.check_seg03(bench)
    groups = seg03["groups"]
    assert isinstance(groups, list)
    assert {g["value"] for g in groups} == {"closed", "faint", "hidden", "tiny"}
