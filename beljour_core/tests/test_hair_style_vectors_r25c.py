"""Author: John Khan. Stored small artificial image vectors are reproducible from Python source."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pytest

from plumb_api.engines.gender_look.levels import GuardDecision
from plumb_api.engines.hair_women.contracts import HairGeometry
from plumb_api.engines.hair_women.style_guides import STYLE_KEYS, TEXTURES, fields
from plumb_api.engines.hair_women.style_preview import render_style_guide

ROOT = Path(__file__).resolve().parents[2]
VECTORS = json.loads((ROOT / "parity/women-style-guide-r25c.json").read_text(encoding="utf-8"))


class NoReduction:
    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> GuardDecision:
        return GuardDecision(after.copy(), 1.0, False)


def source() -> tuple[np.ndarray, np.ndarray, HairGeometry]:
    yy, xx = np.mgrid[:64, :64]
    photo = np.zeros((64, 64, 4), dtype=np.uint8)
    photo[..., 0] = ((54 + 2 * xx + 3 * yy) % 256).astype(np.uint8)
    photo[..., 1] = ((54 + xx + yy) % 256).astype(np.uint8)
    photo[..., 2] = ((54 + 2 * yy) % 256).astype(np.uint8)
    photo[..., 3] = ((xx + 2 * yy + 101) % 256).astype(np.uint8)
    mask = np.zeros((64, 64), dtype=np.float64)
    mask[5:58, 5:59] = 1
    geometry = HairGeometry((0.5, 0.06), (0.25, 0.32), (0.75, 0.32), (0.5, 0.91), 0.5, 0.85)
    return photo, mask, geometry


def test_parity_case_set_contains_every_style_and_texture() -> None:
    assert VECTORS["format"] == "women-style-guide-parity/1"
    assert VECTORS["width"] == VECTORS["height"] == 64
    assert len(VECTORS["cases"]) == len(STYLE_KEYS) * (len(TEXTURES) + 1)
    assert set(row["style"] for row in VECTORS["cases"]) == set(STYLE_KEYS)
    assert set(row["texture"] for row in VECTORS["cases"]) == set(TEXTURES)
    assert "artificial" in VECTORS["provenance"]


@pytest.mark.parametrize("row", VECTORS["cases"], ids=lambda value: str(value["style"]) + "-" + str(value["level"]))
def test_parity_fixture_recomputes_its_own_pixels_and_guide(row: dict[str, object]) -> None:
    original, mask, head = source()
    style = str(row["style"])
    texture = str(row["texture"])
    level = float(row["level"])
    output = render_style_guide(original, mask, head, style, level,
                                texture=texture, primary_box=(0, 0, 1, 1), identity_guard=NoReduction())
    assert abs(output.changed_pixel_share - float(row["share"])) < 1e-9
    computed = fields(style, head, 64, 64)
    samples = VECTORS["samples"]
    for index, (y, x) in enumerate(samples):
        assert output.image[y, x].tolist() == row["pixels"][index]
        for channel, observed in enumerate((computed.zone[y, x], computed.grade[y, x], computed.tone[y, x])):
            assert abs(float(observed) - row["guide"][index][channel]) < 0.000001
