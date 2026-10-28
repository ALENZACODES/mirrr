"""384 drawn renders (8 cases x 48 styles) plus 48 counted missing-mesh refusals.

Drawn heads only; a synthetic matrix, not a quality or likeness result. Author: John Khan.
"""
from __future__ import annotations

import pytest

from plumb_api.engines.menshair.portfolio_matrix import BACKGROUNDS, TEXTURES, drawn_case, run_matrix


def test_every_drawn_case_renders_every_style_and_missing_mesh_refuses_all() -> None:
    body = run_matrix(3.0).public()
    assert body["attempted"] == 432 and body["verified"] == 384 and body["refused"] == 48
    assert body["unchanged"] == 0 and body["provider_calls"] == 0
    assert len(body["cases"]) == len(BACKGROUNDS) * len(TEXTURES) + 1
    for name, row in body["cases"].items():
        expected = {"attempted": 48, "verified": 0, "unchanged": 0, "refused": 48} if name == "no-mesh" else \
            {"attempted": 48, "verified": 48, "unchanged": 0, "refused": 0}
        assert row == expected, name


def test_level_one_matrix_changes_nothing_and_claims_nothing() -> None:
    body = run_matrix(1.0).public()
    assert body["verified"] == 0 and body["unchanged"] == 384 and body["refused"] == 48


def test_drawn_cases_differ_and_reject_unknown_names() -> None:
    images = {(b, t): drawn_case(b, t)[0].tobytes() for b in BACKGROUNDS for t in TEXTURES}
    assert len(set(images.values())) == 8
    with pytest.raises(ValueError):
        drawn_case("blue", "flat")
