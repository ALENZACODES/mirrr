"""Tests for declared trait sampling and the coded trait shapes on stress faces.

The shapes are a stress approximation; these tests check that each one is
drawn where it should be and that declared tags never come from pixels.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.facescale_synth.fairness.traits import parse_tags
from lab.facescale_synth.stress.face import draw_face
from lab.facescale_synth.stress.geometry import FaceSpec
from lab.facescale_synth.stress.trait_plan import sample_tags


def _spec(**traits: object) -> FaceSpec:
    raw: dict[str, object] = {"fitzpatrick": "V", "age_band": "30-39"}
    raw.update(traits)
    tags = parse_tags(raw)
    return FaceSpec(size=192, tone=0.75, tags=tags, hair_style="short", detail_seed=4)


def test_sampled_tags_follow_the_rules() -> None:
    rng = np.random.default_rng(1)
    tags = [sample_tags(rng) for _ in range(3000)]
    assert {t.fitzpatrick for t in tags} == {"I", "II", "III", "IV", "V", "VI"}
    assert all(t.beard == "none" for t in tags if t.age_band == "0-9")
    assert all(t.fitzpatrick == "I" for t in tags if t.albinism)
    vitiligo = [t for t in tags if t.vitiligo != "none"]
    assert 0.1 < len(vitiligo) / len(tags) < 0.2
    assert all(t.vitiligo_coverage > 0 for t in vitiligo)


def test_force_pins_a_family_and_keeps_the_rest() -> None:
    free = sample_tags(np.random.default_rng(5))
    pinned = sample_tags(np.random.default_rng(5), {"head_covering": "turban"})
    assert pinned.head_covering == "turban"
    assert pinned.fitzpatrick == free.fitzpatrick
    assert pinned.age_band == free.age_band
    for seed in range(300):
        bearded = sample_tags(np.random.default_rng(seed), {"beard": "full"})
        assert bearded.beard == "full" and bearded.age_band != "0-9"
    with pytest.raises(ValueError):
        sample_tags(np.random.default_rng(0), {"beard": "full", "age_band": "0-9"})
    vit = sample_tags(np.random.default_rng(5), {"vitiligo": "generalised"})
    assert vit.vitiligo == "generalised" and vit.vitiligo_coverage > 0.25


@pytest.mark.parametrize(
    ("kind", "coverage"), [("focal", 0.04), ("segmental", 0.15), ("generalised", 0.4)]
)
def test_vitiligo_coverage_reaches_the_declared_share(kind: str, coverage: float) -> None:
    render = draw_face(_spec(vitiligo=kind, vitiligo_coverage=coverage))
    assert coverage <= render.vitiligo_drawn < coverage + 0.25


def test_segmental_vitiligo_stays_on_one_side() -> None:
    plain = draw_face(_spec())
    render = draw_face(_spec(vitiligo="segmental", vitiligo_coverage=0.15))
    changed = np.abs(render.image.astype(int) - plain.image.astype(int)).sum(axis=2) > 60
    changed &= render.skin > 0
    cx = int(render.geometry.centre[0])
    left, right = changed[:, :cx].sum(), changed[:, cx:].sum()
    assert min(left, right) <= 0.05 * max(left, right)


def test_vitiligo_patches_are_lighter_than_skin() -> None:
    plain = draw_face(_spec())
    render = draw_face(_spec(vitiligo="generalised", vitiligo_coverage=0.4))
    assert render.image.mean() > plain.image.mean() + 5


@pytest.mark.parametrize(
    "traits",
    [
        {"freckles": True},
        {"birthmark": "port-wine"},
        {"birthmark": "cafe-au-lait"},
        {"birthmark": "congenital-naevus"},
        {"scars": True},
        {"acne": True},
        {"rosacea": True},
        {"age_band": "70+"},
    ],
)
def test_skin_traits_change_skin_only(traits: dict[str, object]) -> None:
    plain = draw_face(_spec())
    render = draw_face(_spec(**traits))
    diff = np.abs(render.image.astype(int) - plain.image.astype(int)).sum(axis=2) > 12
    assert diff.sum() > 10
    assert np.array_equal(render.hair, plain.hair)


def test_full_beard_is_hair_below_the_nose() -> None:
    render = draw_face(_spec(beard="full"))
    geo = render.geometry
    rows = np.nonzero(render.hair.any(axis=1))[0]
    beard_rows = rows[rows > geo.nose_tip[1]]
    assert len(beard_rows) > 10
    assert render.other[int(geo.mouth_top[1]) + 1, int(geo.mouth_top[0])] == 255


def test_hijab_hides_hair_and_ears_but_not_the_face() -> None:
    render = draw_face(_spec(head_covering="hijab"))
    geo = render.geometry
    assert render.hair.sum() == 0
    assert geo.ear_l is not None
    assert render.skin[int(geo.ear_l[1]), int(geo.ear_l[0])] == 0
    for x, y in geo.keypoints:
        assert render.other[int(y), int(x)] == 255 or render.skin[int(y), int(x)] == 255


@pytest.mark.parametrize("kind", ["turban", "kippah"])
def test_head_coverings_sit_above_the_eyes(kind: str) -> None:
    render = draw_face(_spec(head_covering=kind))
    geo = render.geometry
    plain = draw_face(_spec())
    added = (render.other > 0) & (plain.other == 0)
    rows = np.nonzero(added.any(axis=1))[0]
    assert len(rows) > 0
    assert rows.max() < geo.eye_l[1]


def test_glasses_frame_the_eyes_without_hiding_them() -> None:
    render = draw_face(_spec(glasses=True))
    geo = render.geometry
    plain = draw_face(_spec())
    centre = (int(geo.eye_l[1]), int(geo.eye_l[0]))
    assert np.array_equal(render.image[centre], plain.image[centre])
    assert ((render.other > 0) & (plain.other == 0)).sum() > 50
