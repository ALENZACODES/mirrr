"""Trans and non-binary presets (round 2 plan section 11) on drawn meshes.

Pass definition (written before the run): the five presets exist, each is a valid blend of the
existing controls (nonzero slider in -100..100, every region named, factors 0..1, so every
effective band lies within the authored band of its direction), each runs through the shared
gender recipe with the same 12%-IOD cap, finite targets and pinned irises, and the TS mirror
carries the same presets. Real-face parity for presets stays with the gender parity gate.
Author: John Khan.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pytest

from plumb_api.engines.proportions.synthetic import symmetric_face
from plumb_api.engines.shape import gender, presets
from plumb_api.engines.shape.geometry import frame

ROOT = Path(__file__).resolve().parents[2]
FACE = symmetric_face(400, 500, face_width=220, face_length=300)


def test_exactly_the_five_presets_and_valid() -> None:
    assert presets.validate() == []
    assert [r["id"] for r in presets.rows()] == list(presets.REQUIRED)
    assert all("label" in r and r["description"] for r in presets.rows())


@pytest.mark.parametrize("preset_id", presets.REQUIRED)
def test_effective_bands_stay_inside_the_authored_band(preset_id: str) -> None:
    row = presets.preset(preset_id)
    direction = "masculine" if row["slider"] > 0 else "feminine"
    authored = gender.RECIPE[direction]
    for name, value in presets.blended_bands(preset_id).items():
        lo, hi = min(authored[name]), max(authored[name])
        assert lo - 1e-12 <= value <= hi + 1e-12, (preset_id, name, value)


@pytest.mark.parametrize("preset_id", presets.REQUIRED)
def test_preset_runs_through_the_shared_recipe_with_the_same_caps(preset_id: str) -> None:
    points, report = presets.apply(FACE, preset_id)
    assert points.shape == FACE.shape and np.all(np.isfinite(points))
    iod = frame(FACE).iod
    assert np.linalg.norm(points - FACE, axis=1).max() <= 0.12 * iod + 1e-9
    np.testing.assert_allclose(points[list(gender.IDENTITY_PINS)], FACE[list(gender.IDENTITY_PINS)], atol=1e-12)
    assert report["preset"] == preset_id
    assert report["preset_note"].startswith("Gender-affirming preview")
    assert report["direction"] == ("masculine" if presets.preset(preset_id)["slider"] > 0 else "feminine")
    assert report["max_iod_percent"] > 0


def test_androgynous_moves_less_than_the_affirming_presets() -> None:
    def moved(pid: str) -> float:
        return float(np.linalg.norm(presets.apply(FACE, pid)[0] - FACE, axis=1).mean())
    assert moved("androgynous") < moved("soft-feminine") < moved("affirming-feminine")
    assert moved("soft-masculine") < moved("affirming-masculine")
    brows = presets.blended_bands("androgynous")
    assert brows["brow_height_iod"] == 0 and brows["brow_arch_iod"] == 0


def test_validation_catches_bad_presets() -> None:
    good = presets.rows()
    bad = [dict(good[0], regions={**good[0]["regions"], "jaw": 1.4})] + good[1:]
    assert any("0..1" in p for p in presets.validate(bad))
    assert any("exactly" in p for p in presets.validate(good[:4]))
    assert any("slider" in p for p in presets.validate([dict(good[0], slider=0)] + good[1:]))
    assert any("region" in p for p in presets.validate([dict(good[0], regions={"jaw": 1.0})] + good[1:]))
    with pytest.raises(ValueError, match="unknown preset"):
        presets.preset("hyper-glam")


def test_typescript_mirror_carries_the_presets() -> None:
    generated = (ROOT / "web/src/engines/shape/generated/gender.ts").read_text(encoding="utf-8")
    payload = json.loads(generated.split("export const GENDER = ", 1)[1].rsplit(" as const;", 1)[0])
    assert payload["presets"] == gender.RECIPE["presets"]
