"""Closed-mouth expressions (features 8 and 46) on drawn synthetic faces with known landmarks.

Uses the drawn face of the face part tests: skin oval, eyes with irises, brows, lips and nose
painted from made-up landmarks. Checks: each expression changes only inside the rings of the
parts it moves, every other drawn part keeps its exact pixels, alpha is untouched, amount 0 and
strength 0 are byte-identical no-ops, the eye-opening and movement caps hold, the lip gap never
widens, the labels say expression simulation, and refusals are coded. Author: John Khan.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import numpy as np
import pytest

from plumb_api.engines.core import regions
from plumb_api.engines.shape import expressions as E
from plumb_api.engines.shape import parts
from tests.test_face_parts import HEIGHT, WIDTH, drawn_face, front_mesh, part_masks, region_mask

ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture(scope="module")
def face() -> tuple[np.ndarray, np.ndarray]:
    mesh = front_mesh()
    return mesh, drawn_face(mesh)


def test_vectors_and_the_typescript_table_match_python() -> None:
    run = subprocess.run([sys.executable, str(ROOT / "api/scripts/make_expression_vectors.py"), "--check"],
                         capture_output=True, text=True, check=False)
    assert run.returncode == 0, run.stdout + run.stderr


def test_the_set_names_features_8_and_46_and_never_needs_new_content() -> None:
    assert {row["id"] for row in E.catalogue(8)} == {"neutral", "serious"}
    assert {row["id"] for row in E.catalogue(46)} == {"surprise", "soft_smile", "raised_brows"}
    for row in E.catalogue():
        assert set(row["values"]) <= set(parts.CONTROL_BY_ID)
        assert all(-100 <= v <= 100 for v in row["values"].values())
    assert "mouth stays closed" in E.LABEL and "nothing new is drawn" in E.LABEL


@pytest.mark.parametrize("expression", sorted(E.EXPRESSIONS))
def test_each_expression_moves_only_its_parts_and_keeps_alpha(face, expression: str) -> None:
    mesh, image = face
    original = image.copy()
    out = E.render(image, mesh, expression)
    np.testing.assert_array_equal(image, original)
    diff = np.any(out.image != image, axis=2)
    assert diff.any()
    moved_parts = {parts.CONTROL_BY_ID[name]["part"] for name in out.values}
    allowed = np.zeros((HEIGHT, WIDTH), dtype=bool)
    for plan in parts.plan_parts(mesh, out.values):
        allowed |= region_mask(plan)
    assert not np.any(diff & ~allowed)
    drawn = part_masks(mesh)
    for name, mask in drawn.items():
        if name not in moved_parts and not (name == "iris" and "eyes" in moved_parts):
            assert not np.any(diff & (mask > 0)), (expression, name)
    np.testing.assert_array_equal(out.image[..., 3], image[..., 3])
    assert out.metrics["lip_gap_after_px"] <= out.metrics["lip_gap_before_px"] + E.GAP_TOLERANCE
    assert out.metrics["max_move_iod_percent"] <= parts.MAX_MOVE_IOD * 100 + 1e-9
    assert out.metrics["identity_similarity"] >= parts.IDENTITY_MINIMUM
    assert out.labels == (parts.SIMULATION, E.LABEL)


def test_neutral_lowers_the_mouth_corners_and_surprise_opens_the_eyes_within_the_cap(face) -> None:
    mesh, image = face
    corners = [regions.MOUTH_LIPS[2], regions.MOUTH_LIPS[3]]
    neutral = E.render(image, mesh, "neutral")
    assert np.all(neutral.targets[corners, 1] > mesh[corners, 1])  # image y grows downward
    smile = E.render(image, mesh, "soft_smile")
    assert np.all(smile.targets[corners, 1] < mesh[corners, 1])
    surprise = E.render(image, mesh, "surprise")
    for side in ("right", "left"):
        assert surprise.metrics[f"aperture_change_percent_{side}"] == pytest.approx(12.0, abs=1e-6)
    brows = list(regions.RIGHT_BROW) + list(regions.LEFT_BROW)
    assert np.all(surprise.targets[brows, 1] <= mesh[brows, 1])


def test_amount_and_strength_scale_and_zero_is_a_no_op(face) -> None:
    mesh, image = face
    for kwargs in ({"amount": 0.0}, {"strength": 0.0}):
        out = E.render(image, mesh, "surprise", **kwargs)
        np.testing.assert_array_equal(out.image, image)
        assert out.metrics["changed_pixels"] == 0
    half = E.render(image, mesh, "serious", amount=50.0).targets - mesh
    full = E.render(image, mesh, "serious").targets - mesh
    assert np.abs(half).max() < np.abs(full).max()
    assert E.values_for("serious", 50.0) == {k: v / 2 for k, v in E.values_for("serious").items()}


def test_refusals_are_coded(face) -> None:
    mesh, image = face
    with pytest.raises(E.ExpressionRefusal) as caught:
        E.render(image, mesh, "wink")
    assert caught.value.code == "unknown_expression"
    open_mouth = mesh.copy()
    open_mouth[regions.MOUTH_LIPS[1], 1] += 9.0
    with pytest.raises(E.ExpressionRefusal) as caught:
        E.render(image, open_mouth, "neutral")
    assert caught.value.code == "mouth_open" and str(caught.value) == E.REFUSALS["mouth_open"]
    closed_eye = mesh.copy()
    upper, lower = regions.EYE_LIDS["left"][:2]
    closed_eye[upper, 1] = closed_eye[lower, 1] - 0.3
    with pytest.raises(parts.PartRefusal) as part_refusal:
        E.render(image, closed_eye, "surprise")
    assert part_refusal.value.code == "eye_closed"
    with pytest.raises(ValueError):
        E.values_for("neutral", 120.0)
    with pytest.raises(ValueError, match="unknown expression refusal"):
        E.ExpressionRefusal("made_up")
