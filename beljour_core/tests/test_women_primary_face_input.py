"""R25c no-mesh refusals and explicit multi-person selection. Author: John Khan."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

from plumb_api.engines.gender_look.levels import GenderLevelEngine, GuardDecision
from plumb_api.engines.hair_women.contracts import HairGeometry
from plumb_api.engines.hair_women.short_sides import render_style

REPO_ROOT = Path(__file__).resolve().parents[2]


def synthetic_two_face() -> tuple[np.ndarray, np.ndarray]:
    yy, xx = np.mgrid[:64, :64]
    photo = np.zeros((64, 64, 4), dtype=np.uint8)
    photo[..., 0] = ((xx * 2 + yy * 4) % 256).astype(np.uint8)
    photo[..., 1] = ((xx * 3 + yy) % 256).astype(np.uint8)
    photo[..., 2] = ((xx + yy * 3) % 256).astype(np.uint8)
    photo[..., 3] = 255
    hair = ((yy < 54) & (yy > 6) & (xx > 7) & (xx < 57)).astype(np.float64)
    return photo, hair


class Masks:
    def masks(self, photo_hash: str, photo: np.ndarray) -> dict[str, np.ndarray]:
        area = np.ones(photo.shape[:2], dtype=np.float64)
        return {"brow": area, "skin": area, "stubble": area}


class AggressiveGuard:
    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> GuardDecision:
        changed = after.copy()
        changed[..., :3] = 240
        return GuardDecision(changed, 0.5, False)


@pytest.mark.parametrize("direction", ["feminine", "masculine"])
def test_gender_primary_selection_cannot_change_second_face_even_with_faulty_guard(direction: str) -> None:
    photo, _ = synthetic_two_face()
    engine = GenderLevelEngine(Masks(), AggressiveGuard())
    result = engine.render(photo, direction, 5, primary_box=(0, 0, 0.5, 1))
    assert result.status == "rendered"
    assert np.array_equal(result.image[:, 32:], photo[:, 32:])
    assert np.array_equal(result.image[..., 3], photo[..., 3])
    refused = engine.render(photo, direction, 5, primary_box=None)
    assert refused.status == "no_mesh"
    assert np.array_equal(refused.image, photo)


def test_hair_primary_selection_retains_every_unselected_pixel() -> None:
    photo, hair = synthetic_two_face()
    geometry = HairGeometry((.5,.06),(.25,.32),(.75,.32),(.5,.91),.5,.85)
    edited = render_style(photo,hair,geometry,"pixie_taper",5,
                          primary_face_box=(0,0,.5,1),identity_guard=AggressiveGuard())
    assert edited.rendered
    assert np.array_equal(edited.image[:,32:],photo[:,32:])
    assert np.array_equal(edited.image[...,3],photo[...,3])
    refused = render_style(photo,hair,None,"pixie_taper",5,primary_face_box=(0,0,1,1))
    assert refused.status == "no_mesh"


def test_no_private_images_or_paths_in_level_acceptance_definitions() -> None:
    root = REPO_ROOT / "tests/realface/pass_definitions_r25c"
    for path in root.glob("*.json"):
        content = path.read_text(encoding="utf-8")
        assert "UNPROVEN" not in content or "unproven" in content.lower()
        assert "file://" not in content
        assert "data:image" not in content
