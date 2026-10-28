"""Seeded property tests: faces near edges, rotated faces and tiny faces.

Each case draws a fresh procedural scene from a fixed seed, so failures are
reproducible. Every face look must stay inside the chosen face's region and
off its eyes and mouth, whatever the box, roll or size.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.seasonal.packs import FaceBox, FaceTarget, apply_look, list_packs
from plumb_api.seasonal.packs.synthetic import SKIN_TONES, PortraitSpec, background, scene
from plumb_api.seasonal.packs.target import protected_mask, region_mask

FACE_LOOKS = [
    (pack.occasion, look.id) for pack in list_packs() for look in pack.looks if look.kind.needs_face
]
SEEDS = range(6)


def random_spec(rng: np.random.Generator, width: int, height: int) -> PortraitSpec:
    face_w = float(rng.uniform(10.0, width * 0.35))
    face_h = face_w * float(rng.uniform(1.05, 1.35))
    # Centres may sit on or just past the border, so regions get clipped.
    cx = float(rng.uniform(-0.1 * face_w, width + 0.1 * face_w))
    cy = float(rng.uniform(-0.1 * face_h, height + 0.1 * face_h))
    roll = float(rng.uniform(-45.0, 45.0))
    skin = SKIN_TONES[int(rng.integers(0, len(SKIN_TONES)))]
    return PortraitSpec(cx, cy, face_w, face_h, skin=skin, roll=roll)


def check_local(image: np.ndarray, out: np.ndarray, target: FaceTarget) -> None:
    height, width = image.shape[:2]
    diff = np.any(image != out, axis=2)
    assert not diff[~region_mask(target, width, height)].any()
    assert not diff[protected_mask(target, width, height)].any()


@pytest.mark.parametrize("seed", SEEDS)
def test_random_faces_near_edges_stay_local(seed: int) -> None:
    rng = np.random.default_rng(seed)
    width, height = 220, 180
    spec = random_spec(rng, width, height)
    image, (target,) = scene(width, height, [spec], seed=seed)
    for occasion, look_id in FACE_LOOKS:
        out = apply_look(image, occasion, look_id, target, strength=5.0, seed=seed)
        check_local(image, out, target)


@pytest.mark.parametrize("roll", [-80.0, -45.0, -20.0, 20.0, 45.0, 80.0])
def test_rotated_faces_stay_local(roll: float) -> None:
    spec = PortraitSpec(120.0, 130.0, 70.0, 88.0, roll=roll)
    image, (target,) = scene(240, 240, [spec], seed=1)
    for occasion, look_id in FACE_LOOKS:
        out = apply_look(image, occasion, look_id, target, strength=3.0)
        check_local(image, out, target)


@pytest.mark.parametrize("size", [4.0, 6.0, 9.0, 14.0])
def test_tiny_faces_do_not_crash_and_stay_local(size: float) -> None:
    image = background(96, 96, seed=2)
    target = FaceTarget(FaceBox(40.0, 50.0, size, size * 1.2))
    for occasion, look_id in FACE_LOOKS:
        out = apply_look(image, occasion, look_id, target, strength=5.0)
        check_local(image, out, target)


@pytest.mark.parametrize("seed", SEEDS)
def test_two_random_faces_never_leak_into_each_other(seed: int) -> None:
    rng = np.random.default_rng(100 + seed)
    width, height = 400, 200
    left = PortraitSpec(
        float(rng.uniform(60, 110)),
        float(rng.uniform(100, 140)),
        46.0,
        56.0,
        roll=float(rng.uniform(-30, 30)),
    )
    right = PortraitSpec(
        float(rng.uniform(290, 340)),
        float(rng.uniform(100, 140)),
        46.0,
        56.0,
        roll=float(rng.uniform(-30, 30)),
    )
    image, (chosen, other) = scene(width, height, [left, right], seed=seed)
    other_region = region_mask(other, width, height) & ~region_mask(chosen, width, height)
    for occasion, look_id in FACE_LOOKS:
        out = apply_look(image, occasion, look_id, chosen, strength=5.0, seed=seed)
        assert np.array_equal(out[other_region], image[other_region])


@pytest.mark.parametrize("seed", SEEDS)
def test_same_inputs_give_identical_outputs(seed: int) -> None:
    rng = np.random.default_rng(seed)
    image, (target,) = scene(160, 160, [random_spec(rng, 160, 160)], seed=seed)
    for pack in list_packs():
        for look in pack.looks:
            first = apply_look(image, pack.occasion, look.id, target, seed=seed)
            again = apply_look(image, pack.occasion, look.id, target, seed=seed)
            assert np.array_equal(first, again)


@pytest.mark.parametrize("shape", [(8, 8), (9, 300), (300, 9), (17, 23)])
def test_whole_image_looks_handle_odd_sizes(shape: tuple[int, int]) -> None:
    image = background(shape[1], shape[0])
    for pack in list_packs():
        for look in pack.looks:
            if look.kind.whole_image:
                out = apply_look(image, pack.occasion, look.id)
                assert out.shape == image.shape
