"""Feature 37 end to end: brow reshape (part warp) then a local brow tint on the reshaped brows.

Uses the drawn face of the face part tests (dark brow bands painted from made-up landmarks).
The brows are reshaped with the guarded part warp, the brow hair is observed on the reshaped
photo at the moved points, and the local tint (brows engine, W69) is applied. Checks: the tint
changes only observed brow hair, inside the reshaped brow ring; alpha is untouched; amount 0 is
an exact no-op; the suggested colour never lightens the brows; the whole path is local (no
provider module is imported). Author: John Khan.
"""
from __future__ import annotations

import sys

import numpy as np
import pytest

from plumb_api.engines.brows import observe_brows, render_brows
from plumb_api.engines.shape import parts
from tests.test_face_parts import HEIGHT, WIDTH, drawn_face, front_mesh, region_mask


def _normalized(points: np.ndarray) -> np.ndarray:
    """The brows engine takes face points as shares of the photo size; the part warp uses pixels."""
    return np.asarray(points / np.array([WIDTH, HEIGHT], dtype=np.float64))


def _luma(pixels: np.ndarray) -> np.ndarray:
    rgb = pixels[..., :3].astype(np.float64)
    return np.asarray(0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2])


@pytest.fixture(scope="module")
def reshaped() -> tuple[np.ndarray, np.ndarray, parts.PartOutcome]:
    mesh = front_mesh()
    image = drawn_face(mesh)
    out = parts.render(image, mesh, {"brow_height": 60.0, "brow_arch": 50.0}, opted_in=True)
    return image, mesh, out


@pytest.mark.parametrize("amount", [0.5, 1.0])
def test_tint_on_reshaped_brows_changes_only_brow_hair_and_keeps_alpha(reshaped, amount: float) -> None:
    _, _, out = reshaped
    evidence = observe_brows(out.image, _normalized(out.targets))
    assert np.count_nonzero(evidence.coverage > 0) > 50, "the drawn brows are observed after the reshape"
    result = render_brows(out.image, _normalized(out.targets), "W69", {"amount": amount}, evidence)
    changed = np.any(result.image != out.image, axis=2)
    assert changed.any()
    assert not np.any(changed & (evidence.coverage <= 0)), "only observed brow hair changes"
    allowed = np.zeros((HEIGHT, WIDTH), dtype=bool)
    for plan in out.plans:
        allowed |= region_mask(plan)
    assert not np.any(changed & ~allowed), "the tint stays inside the reshaped brow rings"
    np.testing.assert_array_equal(result.image[..., 3], out.image[..., 3])
    assert np.all(_luma(result.image[changed]) <= _luma(out.image[changed]) + 1e-9), "the suggested tint never lightens"
    assert "simulation" in result.label.lower()


def test_amount_zero_is_an_exact_no_op_and_inputs_are_never_written(reshaped) -> None:
    image, mesh, out = reshaped
    before, points = out.image.copy(), out.targets.copy()
    evidence = observe_brows(out.image, _normalized(out.targets))
    result = render_brows(out.image, _normalized(out.targets), "W69", {"amount": 0}, evidence)
    np.testing.assert_array_equal(result.image, out.image)
    np.testing.assert_array_equal(out.image, before)
    np.testing.assert_array_equal(out.targets, points)
    np.testing.assert_array_equal(image[..., 3], out.image[..., 3])
    assert not np.array_equal(out.targets, mesh), "the brows were reshaped first"


def test_the_reshape_and_tint_path_is_local() -> None:
    assert not any(name.endswith("providers.youcam") for name in sys.modules)
