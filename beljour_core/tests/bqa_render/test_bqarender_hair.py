"""Hair colour containment and bare-head handling on drawn heads.

Author: John Khan.
"""
from __future__ import annotations

import pytest

from lab.bqa_render import hair
from lab.bqa_render.bench import Bench
from lab.bqa_render.rows import parse_context


@pytest.fixture()
def bench() -> Bench:
    return Bench(parse_context({"run_id": "hair", "seed": 6}), limit=2, variants=1)


def test_hair_cases_cover_styles_and_tones() -> None:
    cases = hair.hair_cases(hair.BARE_STYLES, (1, 10))
    assert {c.face.hair for c in cases} == {"bald", "shaved", "covered"}
    assert {c.face.tone for c in cases} == {1, 10}


def test_har02_reports_per_hair_group(bench: Bench) -> None:
    row = hair.check_har02(bench)
    groups = row["groups"]
    assert isinstance(groups, list) and {"long", "short"} <= {g["value"] for g in groups}
    measured = row["measured"]
    assert isinstance(measured, dict) and measured["violating_cases"] == 0


def test_har03_bare_heads_have_no_phantom_hair(bench: Bench) -> None:
    row = hair.check_har03(bench)
    measured = row["measured"]
    assert isinstance(measured, dict) and measured["clean_cases"] == row["n"]
