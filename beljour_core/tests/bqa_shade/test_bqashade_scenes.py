"""Drawn scene and light-model tests (synth.py, lights.py).

Pass definition: the drawn mesh has 478 points with the face loops inside the
frame; skin pixels carry the Lab we set; the Planckian locus matches known
points; tint moves towards green; a daylight capture keeps skin within a small
CIEDE2000 of truth; dim light hits the gain limit; split light differs across
the face; captures are deterministic per seed. All images drawn in memory.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from lab.bqa_shade import bands, colour, lights, synth


@pytest.fixture(scope="module")
def scene() -> synth.Scene:
    return synth.draw_face(bands.skin_lab(6, "warm"), width=200, height=250, seed=2,
                           with_chart=True)


def test_mesh_shape_and_loops_in_frame() -> None:
    points = synth.drawn_mesh(200, 250)
    assert points.shape == (478, 2)
    for name, loop in synth.topology().loops.items():
        xy = points[list(loop)]
        assert np.all((xy[:, 0] > 0) & (xy[:, 0] < 200)), name
        assert np.all((xy[:, 1] > 0) & (xy[:, 1] < 250)), name


def test_skin_pixels_carry_the_set_lab(scene: synth.Scene) -> None:
    rgb = scene.linear[scene.skin]
    lab = colour.xyz_to_lab(colour.linear_to_xyz(np.median(rgb, axis=0)))
    assert colour.ciede2000_one(lab, scene.skin_lab) < 2.0
    assert scene.skin.sum() > 2000
    assert not (scene.skin & scene.background).any()
    assert len(scene.chart_cells) == 24


def test_draw_face_rejects_tiny_frames() -> None:
    with pytest.raises(ValueError):
        synth.draw_face((50.0, 10.0, 15.0), width=60, height=80)


def test_patch_is_flat_without_grain() -> None:
    patch = synth.draw_patch((60.0, 12.0, 18.0), size=8)
    assert patch.shape == (8, 8, 3)
    assert np.allclose(patch, patch[0, 0])


@pytest.mark.parametrize(("cct", "x", "y"), [(6500.0, 0.3135, 0.3237), (2856.0, 0.4476, 0.4074)])
def test_planck_locus_known_points(cct: float, x: float, y: float) -> None:
    px, py = lights.planck_xy(cct)
    assert px == pytest.approx(x, abs=0.001)
    assert py == pytest.approx(y, abs=0.001)


def test_tint_is_green_positive() -> None:
    plain = lights.Lamp(5000.0, 500.0, 0.0).white()
    green = lights.Lamp(5000.0, 500.0, 0.02).white()
    magenta = lights.Lamp(5000.0, 500.0, -0.02).white()
    green_rgb = colour.xyz_to_linear(green)
    magenta_rgb = colour.xyz_to_linear(magenta)
    plain_rgb = colour.xyz_to_linear(plain)
    ratios = [rgb[1] / rgb[0] for rgb in (green_rgb, plain_rgb, magenta_rgb)]
    assert ratios[0] > ratios[1] > ratios[2]
    with pytest.raises(ValueError):
        lights.planck_xy(1000.0)


def test_light_tables_load() -> None:
    assert tuple(item.name for item in lights.standard_lights()) == lights.LIGHTS
    assert len(lights.five_standard()) == 5
    kinds = {case.kind for case in lights.poor_cases()}
    assert kinds == {"too_dim", "strong_colour"}
    assert lights.bathroom().name == "warm_indoor"


def _skin_lab(scene: synth.Scene, shot: lights.Capture) -> np.ndarray:
    lab = colour.srgb8_to_lab(np.median(shot.image[scene.skin], axis=0))
    return lab


def test_daylight_capture_keeps_skin_close(scene: synth.Scene) -> None:
    shot = lights.capture(scene, lights.light("daylight"), seed=1)
    assert shot.image.dtype == np.uint8
    assert colour.ciede2000_one(_skin_lab(scene, shot), scene.skin_lab) < 2.5


def test_dim_light_hits_gain_limit_and_darkens(scene: synth.Scene) -> None:
    dim = [case for case in lights.poor_cases() if case.case == "dim-3lux"][0]
    shot = lights.capture(scene, dim, seed=1)
    assert shot.gain == pytest.approx(lights.camera().max_gain)
    assert _skin_lab(scene, shot)[0] < scene.skin_lab[0] - 10


def test_split_light_differs_across_the_face(scene: synth.Scene) -> None:
    shot = lights.capture(scene, lights.light("mixed"), seed=1)
    half = scene.width // 2
    left = scene.skin.copy()
    left[:, half:] = False
    right = scene.skin.copy()
    right[:, :half] = False
    left_lab = colour.srgb8_to_lab(np.median(shot.image[left], axis=0))
    right_lab = colour.srgb8_to_lab(np.median(shot.image[right], axis=0))
    assert colour.ciede2000_one(left_lab, right_lab) > 3.0


def test_capture_is_deterministic_per_seed(scene: synth.Scene) -> None:
    first = lights.capture(scene, lights.light("flash"), seed=9).image
    again = lights.capture(scene, lights.light("flash"), seed=9).image
    other = lights.capture(scene, lights.light("flash"), seed=10).image
    assert np.array_equal(first, again)
    assert not np.array_equal(first, other)
