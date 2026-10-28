"""Drawn-only repeatability, lighting and region-isolation stress tests.

This suite verifies input boundaries and refusal behavior, not visual quality.
Author: John Khan.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
import pytest

from plumb_api.engines.concealer.cover import CoverDecision
from plumb_api.engines.core import regions
from plumb_api.engines.proportions.synthetic import symmetric_face
from plumb_api.engines.shade import colourspace as cs
from plumb_api.engines.shade.measurement import measure_shade, measure_shade_with_audit
from plumb_api.engines.shade.session import ShadeSession
from plumb_api.styling.local_demo import DemoRefusal, DemoRender, demo_catalogue, render_demo_style

HEIGHT = 192
WIDTH = 160
MESH = symmetric_face(WIDTH, HEIGHT, face_width=88, face_length=126)
OVAL = regions.region_mask(
    "face_oval", MESH, HEIGHT, WIDTH, normalized=False, supersample=2,
) >= 0.5


def portrait(
    lightness: float,
    hue: float,
    seed: int,
    *,
    noise: float = 0.0,
    background: tuple[int, int, int] = (128, 128, 128),
) -> np.ndarray:
    angle = math.radians(hue)
    lab = [lightness, 18 * math.cos(angle), 18 * math.sin(angle)]
    rng = np.random.default_rng(seed)
    picture = np.empty((HEIGHT, WIDTH, 3), dtype=np.uint8)
    picture[:] = background
    values = cs.lab_to_srgb(lab)
    grad = rng.normal(0.0, noise, (int(np.count_nonzero(OVAL)), 3))
    picture[OVAL] = cs.to_bytes(values + grad)
    return picture


@pytest.mark.parametrize("hue", [40, 45, 52, 59, 64, 72, 82])
@pytest.mark.parametrize("lightness", [24, 34, 46, 59, 70, 81])
def test_reproducibility_with_bounded_synthetic_texture(lightness: int, hue: int) -> None:
    source = portrait(lightness, hue, seed=13, noise=1.5)
    first = measure_shade(source, MESH)
    second = measure_shade(source.copy(), MESH.copy())
    assert first.to_json() == second.to_json()
    assert first.white.mode == "grey_world"
    assert first.confidence["overall"] >= 0.0
    if first.best is not None:
        assert first.measured_lab is not None
        assert first.best["lab"][0] <= first.measured_lab[0] + 1.0


def test_background_from_other_person_does_not_rewrite_first_face() -> None:
    left = portrait(40, 53, seed=7)
    right = portrait(80, 66, seed=9)
    frame = np.concatenate([left, right], axis=1)
    original = frame.copy()
    reading, audit, _ = measure_shade_with_audit(frame, MESH)
    assert reading.measured_lab is not None
    assert reading.to_json()["tested_against_real_products"] is False
    assert audit.reason is None or isinstance(audit.reason, str)
    np.testing.assert_array_equal(frame, original)


def test_repeated_reading_uses_session_cache_without_additional_spend() -> None:
    source = portrait(60, 53, seed=4, noise=0.7)
    session = ShadeSession()
    prepared = [session.prepare(source, MESH) for _ in range(5)]
    assert session.reading_computes == 1
    assert prepared[0].reading.to_json() == prepared[-1].reading.to_json()
    assert prepared[0].reading.white.mode == "grey_world"
    assert prepared[0].photo_hash == prepared[-1].photo_hash
    assert prepared[0].audit.usable


def test_session_cache_does_not_return_previous_photo_reading() -> None:
    session = ShadeSession()
    a = portrait(28, 53, seed=5)
    b = portrait(70, 53, seed=6)
    old = session.prepare(a, MESH)
    new = session.prepare(b, MESH)
    assert old.photo_hash != new.photo_hash
    assert session.reading_computes == 2
    assert old.reading.measured_lab is not None
    assert new.reading.measured_lab is not None
    assert old.reading.measured_lab[0] < new.reading.measured_lab[0]


def test_shade_cannot_use_arbitrary_user_coloured_background_as_truth() -> None:
    image = portrait(55, 64, seed=2)
    yy, xx = np.mgrid[:HEIGHT, :WIDTH]
    bands = ((xx // 8) % 3) == 0
    image[~OVAL] = np.where(
        bands[..., None],
        np.array([18, 80, 200], dtype=np.uint8),
        np.array([220, 60, 18], dtype=np.uint8),
    )[~OVAL]
    reading = measure_shade(image, MESH)
    assert reading.white.mode == "none"
    assert reading.confidence["lighting"] == 0.7


@dataclass
class GuardCounter:
    calls: int = 0
    last_level: float = 0.0

    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> CoverDecision:
        self.calls += 1
        self.last_level = lock_level
        return CoverDecision(after.copy(), 1.0, False)


@pytest.mark.parametrize("level", [1.0, 2.0, 3.0, 4.0, 5.0])
def test_all_twelve_styling_routes_invoke_one_explicit_identity_guard(level: float) -> None:
    image = portrait(55, 65, seed=9)
    guard = GuardCounter()
    for row in demo_catalogue():
        result = render_demo_style(image, MESH, row.id, level, guard=guard)
        assert isinstance(result, DemoRender)
        assert result.provider_calls == 0
        assert result.rendered is (level > 1.0)
        assert result.image.shape == image.shape
    assert guard.calls == 12
    assert guard.last_level == 5.0


def test_unusable_mesh_does_not_trigger_guard_or_provider() -> None:
    guard = GuardCounter()
    image = portrait(50, 53, seed=1)
    result = render_demo_style(image, None, "tpl-bob", guard=guard)
    assert isinstance(result, DemoRefusal)
    assert result.code == "no_mesh"
    assert guard.calls == 0


def test_two_person_primary_region_edits_only_the_selected_head() -> None:
    left = portrait(53, 40, seed=8)
    right = portrait(78, 82, seed=4)
    combined = np.concatenate([left, right], axis=1)
    output = render_demo_style(
        combined, MESH, "tpl-curtain", 4.0,
        primary_box=(0, 0, WIDTH, HEIGHT),
    )
    assert isinstance(output, DemoRender)
    assert output.rendered
    np.testing.assert_array_equal(output.image[:, WIDTH:], combined[:, WIDTH:])
    np.testing.assert_array_equal(combined[:, :WIDTH], left)


def test_identity_guard_refusal_does_not_escape_as_unhandled_render() -> None:
    image = portrait(55, 53, seed=6)

    class BrokenGuard:
        def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> CoverDecision:
            return CoverDecision(after.astype(np.float32), float("nan"), False)

    output = render_demo_style(image, MESH, "tpl-bob", 4.0, guard=BrokenGuard())
    assert isinstance(output, DemoRefusal)
    assert output.code == "guard_rejected"


def test_invalid_concave_head_cannot_claim_appearance_render() -> None:
    image = portrait(55, 53, seed=1)
    mesh = MESH.copy()
    mesh[regions.FACE_OVAL[0]] = mesh[regions.FACE_OVAL[8]]
    mesh[list(regions.RIGHT_BROW)] = mesh[152]
    output = render_demo_style(image, mesh, "tpl-low-fade", 4.0)
    assert not isinstance(output, DemoRender) or output.provider_calls == 0
    if isinstance(output, DemoRefusal):
        assert output.code in {"invalid_mesh", "no_hair_region"}
