"""Planned scalp-cover and pigment-distance contract (parity/fibre-coverage-r35f.json).

Source-derived numbers from the production fibre functions; no photographs.
Author: John Khan.
"""
from __future__ import annotations

import json

import pytest

from plumb_api.engines.concealer import parity_contract as pc
from plumb_api.engines.concealer.crown import LEVEL_LIMITS, level
from plumb_api.engines.concealer.shades import SHADES
from plumb_api.engines.concealer.strands import cut_for_level
from plumb_api.engines.core.colour import ciede2000


def test_committed_contract_is_in_sync(capsys: pytest.CaptureFixture[str]) -> None:
    assert json.loads(pc.VECTORS.read_text(encoding="utf-8")) == json.loads(json.dumps(pc.contract()))
    assert pc.main(["--check"]) == 0
    assert "in sync" in capsys.readouterr().out


def test_vector_counts_and_grid() -> None:
    vectors = pc.cover_vectors()
    assert len(pc.COVER_LEVELS) == 41 and pc.COVER_LEVELS[0] == 1.0 and pc.COVER_LEVELS[-1] == 5.0
    assert pc.START_SHARES == (*LEVEL_LIMITS, 1.0)
    assert len(vectors) == 164
    assert len(pc.pigment_pairs()) == 91 == len(SHADES) * (len(SHADES) - 1) // 2


def test_vectors_use_the_production_cut_and_labels() -> None:
    for v in pc.cover_vectors():
        assert v.cut == cut_for_level(v.level)
        assert v.planned_share == pytest.approx(v.start_share * (1 - v.cut), abs=1e-15)
        assert (v.start_label, v.planned_label) == (level(v.start_share), level(v.planned_share))
    one = pc.planned_cover(1.0, 0.45)
    assert one.cut == 0.0 and one.planned_share == 0.45 and one.planned_label == one.start_label
    five = pc.planned_cover(5.0, 1.0)
    assert five.cut == pytest.approx(0.8) and five.planned_share == pytest.approx(0.2)


def test_more_fibre_never_reveals_more_scalp() -> None:
    for share in pc.START_SHARES:
        planned = [pc.planned_cover(lv, share).planned_share for lv in pc.COVER_LEVELS]
        assert all(b <= a for a, b in zip(planned, planned[1:], strict=False))


def test_pigment_pairs_are_ciede2000() -> None:
    for first, second, d in pc.pigment_pairs():
        lab = {sid: value for sid, _, value in SHADES}
        assert d == ciede2000(lab[first], lab[second]) and d > 0


@pytest.mark.parametrize(("lv", "share"), [(0.9, 0.2), (5.1, 0.2), (1.05, 0.2), (2.0, -0.1), (2.0, 1.1), (2.0, True)])
def test_inputs_are_checked(lv: float, share: float) -> None:
    with pytest.raises(ValueError):
        pc.planned_cover(lv, share)
