"""Particle field tests: seeded frame-by-frame state that never covers the eyes.

Author: John Khan.
"""

from __future__ import annotations

import math

import numpy as np
import pytest

from plumb_api.seasonal.packs import Look, LookKind, PackError, apply_look, list_packs
from plumb_api.seasonal.packs.particles import (
    BURST_LIFE,
    LOOP_FRAMES,
    Motion,
    ParticleField,
    ParticleSpec,
    cyclic_rate,
    spec_for,
)
from plumb_api.seasonal.packs.synthetic import single
from plumb_api.seasonal.packs.target import REGION_BOTTOM, REGION_TOP, protected_mask

LIGHTS = [
    (pack.occasion, look.id)
    for pack in list_packs()
    for look in pack.looks
    if look.kind is LookKind.LIGHT
]


def spec(motion: Motion, count: int = 40) -> ParticleSpec:
    return ParticleSpec(motion, ("snowflake",), count, 0.08, 0.03)


@pytest.mark.parametrize("motion", list(Motion))
def test_same_seed_same_frame_same_state(motion: Motion) -> None:
    first = ParticleField(spec(motion), 42).state(17)
    again = ParticleField(spec(motion), 42).state(17)
    assert first == again
    other = ParticleField(spec(motion), 43).state(17)
    assert first != other


@pytest.mark.parametrize("motion", list(Motion))
def test_frames_can_be_read_in_any_order(motion: Motion) -> None:
    field = ParticleField(spec(motion), 5)
    forward = [field.state(n) for n in range(6)]
    backward = [field.state(n) for n in reversed(range(6))]
    assert forward == list(reversed(backward))


def test_falling_particles_move_down_and_wrap() -> None:
    field = ParticleField(spec(Motion.FALL, 30), 1)
    before, after = field.state(0), field.state(1)
    moved_down = sum(1 for a, b in zip(before, after, strict=True) if b.v > a.v)
    assert moved_down >= 25
    for frame in (0, 50, 500):
        for particle in field.state(frame):
            assert REGION_TOP <= particle.v <= REGION_BOTTOM


def test_orbiting_particles_circle_the_head() -> None:
    field = ParticleField(spec(Motion.ORBIT, 20), 2)
    for particle in field.state(9):
        distance = (particle.u**2 + ((particle.v + 0.3) / 0.85) ** 2) ** 0.5
        assert distance <= 1.0 + 1e-9
    assert field.state(0) != field.state(4)


def test_twinkle_alpha_changes_but_positions_stay() -> None:
    field = ParticleField(spec(Motion.TWINKLE, 10), 3)
    a, b = field.state(0), field.state(3)
    assert [(p.u, p.v) for p in a] == [(p.u, p.v) for p in b]
    assert [p.alpha for p in a] != [p.alpha for p in b]
    assert all(0.0 <= p.alpha <= 1.0 for p in a + b)


def test_burst_cycles_with_its_life() -> None:
    field = ParticleField(spec(Motion.BURST, 8), 4)
    assert field.state(3) == field.state(3 + BURST_LIFE)


def test_negative_frames_are_rejected() -> None:
    with pytest.raises(PackError):
        ParticleField(spec(Motion.FALL), 0).state(-1)


def test_spec_validation() -> None:
    with pytest.raises(PackError, match="motif"):
        ParticleSpec(Motion.FALL, (), 5, 0.1, 0.01)
    with pytest.raises(PackError, match="count"):
        ParticleSpec(Motion.FALL, ("a",), 0, 0.1, 0.01)
    with pytest.raises(PackError, match="size"):
        ParticleSpec(Motion.FALL, ("a",), 5, 0.9, 0.01)
    with pytest.raises(PackError, match="speed"):
        ParticleSpec(Motion.FALL, ("a",), 5, 0.1, 0.9)


def test_spec_from_look_scales_count_with_amount() -> None:
    look = Look(
        "snow",
        LookKind.LIGHT,
        "Snow",
        "light.particles",
        {"motion": "fall", "motifs": ("snowflake",), "count": 100},
        motifs=("snowflake",),
    )
    assert spec_for(look, 0.2).count < spec_for(look, 1.0).count == 100
    bad = Look("bad", LookKind.LIGHT, "Bad", "light.particles", {"motion": "spin"})
    with pytest.raises(PackError, match="motion"):
        spec_for(bad, 1.0)


@pytest.mark.parametrize(("occasion", "look_id"), LIGHTS)
def test_visible_particles_keep_clear_of_eyes_and_mouth(occasion: str, look_id: str) -> None:
    image, target = single(300)
    look = next(look for pack in list_packs() for look in pack.looks if look.id == look_id)
    field = ParticleField(spec_for(look, 1.0), 9)
    for frame in range(0, 40, 3):
        for particle in field.visible(frame, target):
            x, y = target.to_image(particle.u, particle.v)
            reach = particle.size * target.box.width * 0.5
            for region in target.protected_regions():
                assert not region.contains(x, y, pad=reach)


@pytest.mark.parametrize(("occasion", "look_id"), LIGHTS)
def test_animated_frames_never_touch_the_eyes(occasion: str, look_id: str) -> None:
    image, target = single(240)
    eyes = protected_mask(target, image.shape[1], image.shape[0])
    frames = []
    for frame in range(0, 30, 6):
        out = apply_look(image, occasion, look_id, target, strength=5.0, seed=2, frame=frame)
        assert np.array_equal(out[eyes], image[eyes])
        frames.append(out)
    assert any(not np.array_equal(frames[0], other) for other in frames[1:])


@pytest.mark.parametrize("motion", list(Motion))
def test_fields_repeat_exactly_after_one_loop(motion: Motion) -> None:
    field = ParticleField(spec(motion, 25), 8)
    for frame in (0, 5, 47):
        assert field.state(frame) == field.state(frame + LOOP_FRAMES)
        assert field.state(frame) == field.state(frame + 3 * LOOP_FRAMES)
    assert field.state(1) != field.state(0)


def test_cyclic_rates_fit_whole_cycles() -> None:
    for rate in (0.15, 0.3, 0.45, 0.7, 1.9):
        snapped = cyclic_rate(rate)
        cycles = snapped * LOOP_FRAMES / (2 * math.pi)
        assert cycles == pytest.approx(round(cycles))
        assert abs(snapped - rate) <= math.pi / LOOP_FRAMES + 1e-12
    assert cyclic_rate(0.0) == 0.0


def test_still_particles_stay_still() -> None:
    field = ParticleField(ParticleSpec(Motion.FALL, ("snowflake",), 5, 0.1, 0.0, sway=0.0), 2)
    assert [(p.u, p.v) for p in field.state(0)] == [(p.u, p.v) for p in field.state(30)]
