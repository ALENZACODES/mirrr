"""Stretch tools: contact sheet and speed table, written under tmp_path only.

Author: John Khan.
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

from lab.bqa_render import extras
from lab.bqa_render.adapters import PRODUCT_TYPES
from lab.bqa_render.bench import Bench, TortureCase
from lab.bqa_render.faces import FaceSpec
from lab.bqa_render.rows import parse_context


def test_contact_sheet_tiles_every_case(tmp_path: Path) -> None:
    bench = Bench(parse_context({"run_id": "cs", "work_dir": str(tmp_path)}), limit=3)
    path = extras.contact_sheet(bench, columns=2, thumb=64)
    assert path is not None and path.is_relative_to(tmp_path)
    with Image.open(path) as sheet:
        assert sheet.size == (128, 128)
    assert extras.contact_sheet(Bench(parse_context({"run_id": "cs"}))) is None


def test_outlines_mark_zone_edges() -> None:
    bench = Bench(parse_context({"run_id": "cs"}))
    case = TortureCase("synthetic-outline", FaceSpec(mouth_state="open"))
    marked = extras.outlined(bench, case)
    lips = bench.scene(case).subject.masks["lips"]
    assert (marked[lips] == extras.OUTLINES["lips"]).all(axis=1).any()


def test_speed_table_has_every_type_and_size(tmp_path: Path) -> None:
    table = extras.speed_table(sizes=(128,), repeats=1)
    assert set(table) == set(PRODUCT_TYPES)
    assert all(table[k]["128"] > 0 for k in table)
    path = extras.write_speed_table(tmp_path, table)
    assert json.loads(path.read_text(encoding="utf-8")) == table
