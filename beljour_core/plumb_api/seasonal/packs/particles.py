"""Seeded particle fields for light effects: snow, leaves, bats, sparkles, bokeh.

Particles live in face-local box units, so the field follows the chosen face.
Motion is closed form: state(n) depends only on the seed and the frame index,
which makes every frame reproducible and lets a later animation step in any
order. Particles that would cover an eye or the mouth are dropped before
drawing, and the composite is masked as well.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from enum import StrEnum

import numpy as np

from .model import Look, PackError, Palette
from .motifs import motif_shapes
from .raster import BlendMode, ImageArray, Layer, composite
from .shapes import stamp
from .target import REGION_BOTTOM, REGION_TOP, REGION_U, FaceTarget, allowed_mask


class Motion(StrEnum):
    """How particles move from frame to frame."""

    FALL = "fall"
    ORBIT = "orbit"
    TWINKLE = "twinkle"
    BURST = "burst"


@dataclass(frozen=True)
class ParticleSpec:
    """The knobs of one particle field."""

    motion: Motion
    motifs: tuple[str, ...]
    count: int
    size: float
    speed: float
    sway: float = 0.05

    def __post_init__(self) -> None:
        if not self.motifs:
            raise PackError("a particle field needs at least one motif")
        if not 1 <= self.count <= 400:
            raise PackError("particle count must be 1-400")
        if not 0.01 <= self.size <= 0.6:
            raise PackError("particle size must be 0.01-0.6 box widths")
        if not 0.0 <= self.speed <= 0.5:
            raise PackError("particle speed must be 0-0.5 box units per frame")


@dataclass(frozen=True)
class Particle:
    """One particle at one frame, in face-local box units."""

    u: float
    v: float
    size: float
    angle: float
    alpha: float
    motif: str


BURST_LIFE = 24
# Every field repeats exactly after LOOP_FRAMES (4 s at 24 fps), so clips loop
# without a jump. All rates are rounded to whole cycles per loop.
LOOP_FRAMES = 96
# About 11 hours at 24 fps; larger indices are rejected rather than overflowing.
MAX_FRAME = 1_000_000
SPAN = REGION_BOTTOM - REGION_TOP
TAU = 2.0 * math.pi


def cyclic_rate(rate: float, period: int = LOOP_FRAMES) -> float:
    """The angular rate (radians per frame) nearest to rate that fits whole cycles."""
    return TAU * round(rate * period / TAU) / period


def _whole_cycles(values: np.ndarray, cycle: float, minimum: int) -> np.ndarray:
    """Per-frame rates rounded so each particle makes whole cycles per loop."""
    counts = np.maximum(minimum, np.rint(values * LOOP_FRAMES / cycle))
    rates: np.ndarray = counts * cycle / LOOP_FRAMES
    return rates


class ParticleField:
    """A deterministic field: the same seed and frame give the same particles."""

    def __init__(self, spec: ParticleSpec, seed: int):
        self.spec = spec
        self.seed = seed
        rng = np.random.default_rng(np.random.SeedSequence([abs(int(seed)), spec.count, 7]))
        n = spec.count
        self._u = rng.uniform(-REGION_U, REGION_U, n)
        self._v = rng.uniform(REGION_TOP, REGION_BOTTOM, n)
        speed = spec.speed * rng.uniform(0.6, 1.4, n)
        self._fall = _whole_cycles(speed, SPAN, 1 if spec.speed > 0 else 0)
        self._orbit = _whole_cycles(2.0 * speed, TAU, 1 if spec.speed > 0 else 0)
        self._phase = rng.uniform(0.0, TAU, n)
        self._spin = _whole_cycles(rng.uniform(-6.0, 6.0, n), 360.0, -LOOP_FRAMES)
        self._angle = rng.uniform(0.0, 360.0, n)
        self._size = spec.size * rng.uniform(0.6, 1.3, n)
        self._motif = rng.integers(0, len(spec.motifs), n)
        self._radius_u = rng.uniform(0.62, 0.9, n)
        self._radius_v = rng.uniform(0.55, 0.85, n)
        self._offset = rng.integers(0, BURST_LIFE, n)

    def _position(self, index: int, t: float) -> tuple[float, float, float, float]:
        spec = self.spec
        phase = float(self._phase[index])
        size = float(self._size[index])
        alpha = 1.0
        if spec.motion is Motion.FALL:
            travel = (float(self._v[index]) - REGION_TOP + float(self._fall[index]) * t) % SPAN
            v = REGION_TOP + travel
            u = float(self._u[index]) + spec.sway * math.sin(phase + cyclic_rate(0.15) * t)
        elif spec.motion is Motion.ORBIT:
            theta = phase + float(self._orbit[index]) * t
            u = float(self._radius_u[index]) * math.cos(theta)
            v = -0.3 + float(self._radius_v[index]) * math.sin(theta)
            size *= 1.0 - 0.18 * abs(math.sin(phase + cyclic_rate(0.7) * t))
        elif spec.motion is Motion.TWINKLE:
            u, v = float(self._u[index]), float(self._v[index])
            alpha = 0.55 + 0.45 * math.sin(phase + cyclic_rate(0.45) * t)
        else:
            life = (int(t) + int(self._offset[index])) % BURST_LIFE
            u, v = float(self._u[index]), float(self._v[index])
            size *= 0.45 + 0.55 * life / BURST_LIFE
            alpha = 1.0 - life / BURST_LIFE
        return (u, v, size, alpha)

    def state(self, frame: int) -> tuple[Particle, ...]:
        """All particles at a frame index (0 for a still photo)."""
        if not 0 <= frame <= MAX_FRAME:
            raise PackError(f"frame index must be 0-{MAX_FRAME}")
        # The field is periodic, so only the position inside the loop matters.
        t = float(frame % LOOP_FRAMES)
        particles: list[Particle] = []
        for index in range(self.spec.count):
            u, v, size, alpha = self._position(index, t)
            angle = float(self._angle[index])
            if self.spec.motion is Motion.FALL:
                # Only falling particles tumble; glows and bursts hold their turn.
                angle = (angle + float(self._spin[index]) * t) % 360.0
            elif self.spec.motion is Motion.ORBIT:
                angle = 10.0 * math.sin(float(self._phase[index]) + cyclic_rate(0.3) * t)
            motif = self.spec.motifs[int(self._motif[index])]
            particles.append(Particle(u, v, size, angle, max(0.0, min(1.0, alpha)), motif))
        return tuple(particles)

    def visible(self, frame: int, target: FaceTarget) -> tuple[Particle, ...]:
        """Particles inside the region that keep clear of the eyes and mouth."""
        kept: list[Particle] = []
        protected = target.protected_regions()
        for particle in self.state(frame):
            if abs(particle.u) > REGION_U or not REGION_TOP <= particle.v <= REGION_BOTTOM:
                continue
            if particle.alpha <= 0.02:
                continue
            x, y = target.to_image(particle.u, particle.v)
            reach = particle.size * target.box.width * 0.5
            if any(region.contains(x, y, pad=reach) for region in protected):
                continue
            kept.append(particle)
        return tuple(kept)


def spec_for(look: Look, amount: float) -> ParticleSpec:
    """Build a field spec from a light look; amount scales how many particles show."""
    try:
        motion = Motion(look.param_str("motion", "fall"))
    except ValueError as error:
        raise PackError(f"look {look.id}: unknown particle motion") from error
    base = int(max(1, min(400, look.param_float("count", 40))))
    count = max(1, int(round(base * (0.35 + 0.65 * amount))))
    return ParticleSpec(
        motion=motion,
        motifs=look.param_names("motifs", look.motifs),
        count=count,
        size=look.param_float("size", 0.12),
        speed=look.param_float("speed", 0.03),
        sway=look.param_float("sway", 0.05),
    )


def render_light(
    image: ImageArray,
    look: Look,
    palette: Palette,
    occasion: str,
    target: FaceTarget,
    amount: float,
    seed: int,
    frame: int = 0,
) -> ImageArray:
    """Draw one frame of a light effect around the chosen face."""
    spec = spec_for(look, amount)
    field = ParticleField(spec, seed)
    height, width = image.shape[:2]
    x0, y0, x1, y1 = target.region_bounds(width, height)
    layer = Layer(x0, y0, x1, y1)
    for index, particle in enumerate(field.visible(frame, target)):
        x, y = target.to_image(particle.u, particle.v)
        shapes = motif_shapes(occasion, particle.motif, seed * 31 + index)
        size = particle.size * target.box.width
        stamp(layer, shapes, x, y, size, particle.angle + target.roll, particle.alpha)
    glow = spec.motion in (Motion.TWINKLE, Motion.BURST)
    mode = BlendMode.SCREEN if glow else BlendMode.OVER
    mask = allowed_mask(target, width, height)
    return composite(image, layer, opacity=0.6 + 0.4 * amount, mode=mode, allowed=mask)
