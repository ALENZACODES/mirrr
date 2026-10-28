"""The committed 144-case skin lighting vectors match the Python modules.

Synthetic drawn colours under integer casts. Author: John Khan.
"""
from __future__ import annotations

import json

import numpy as np
import pytest

from plumb_api.engines.shade import sensitivity_parity as sp


def test_committed_vectors_are_in_sync(capsys: pytest.CaptureFixture[str]) -> None:
    stored = json.loads(sp.VECTORS.read_text(encoding="utf-8"))
    assert stored == json.loads(json.dumps(sp.contract()))
    assert sp.main(["--check"]) == 0
    assert "Local skin lighting vectors in sync" in capsys.readouterr().out


def test_matrix_shape() -> None:
    stored = json.loads(sp.VECTORS.read_text(encoding="utf-8"))
    assert len(stored["cases"]) == 144 == len(sp.base_colours()) * len(sp.CASTS)
    assert {c["cast"] for c in stored["cases"]} == set(sp.CASTS)
    assert all(len(c["base"]) == 3 for c in stored["cases"])


def test_pixels_are_integer_and_follow_the_documented_formula() -> None:
    base, cast = (120, 90, 70), sp.CASTS["warm"]
    pixels = sp.case_inputs(base, cast)
    assert pixels["cheek_left"].dtype == np.int64 and pixels["cheek_left"].shape == (sp.ZONE_PIXELS, 3)
    k, z, c = 5, 1, 2
    v = min(255, max(0, base[c] + (7 * k + 3 * z + 5 * c) % 9 - 4))
    assert pixels["cheek_left"][k, c] == min(255, (v * cast[c] + 128) >> 8)
    assert (pixels["card"] == pixels["card"][0]).all()


def test_daylight_cases_recover_their_reference() -> None:
    stored = json.loads(sp.VECTORS.read_text(encoding="utf-8"))
    day = [c for c in stored["cases"] if c["cast"] == "daylight"]
    assert len(day) == 24 and all(c["best"] == c["reference"] for c in day)
