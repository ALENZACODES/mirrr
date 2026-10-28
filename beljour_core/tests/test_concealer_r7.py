"""R7 LS5 crown reading, shade card and fibre strands on drawn crowns with known truth.

Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.concealer import CoverResult, CoverSession, crown, shades, strands, synthetic
from plumb_api.engines.core.masks import ellipse
from plumb_api.engines.menshair import HairAnchors
from plumb_api.quality.metrics import digest, q1_outside_mask

LOCAL_HEAD = HairAnchors.parse({
    "left_temple": (.28, .34), "right_temple": (.72, .34), "crown": (.5, .11),
    "left_ear": (.24, .59), "right_ear": (.76, .59), "nape": (.5, .83),
})


@pytest.fixture(scope="module")
def case():
    c = synthetic.crown(200, 200, seed=7)
    region = ellipse(200, 200, 100, 104, 53, 48)
    return c, region, crown.read(c.image, region)


def test_two_means_stable_and_ordered():
    labels, centres = crown.two_means(np.array([[10, 0, 0], [12, 1, 0], [80, 5, 5], [82, 4, 6], [11, 0, 1]], float))
    assert labels.tolist() == [0, 0, 1, 1, 0]
    assert centres[0, 0] < centres[1, 0]
    with pytest.raises(ValueError):
        crown.two_means(np.zeros((1, 3)))


def test_zone_grid_layout_and_validation():
    grid = crown.ZoneGrid((0, 0, 60, 100))
    index = grid.zone_index(100, 60)
    assert sorted(set(index.ravel().tolist())) == [0, 1, 2, 3, 4, 5]
    assert index[5, 5] == 0 and index[5, 55] == 2 and index[95, 30] == 5
    assert crown.ZoneGrid((0, 0, 60, 100), frontal_at="bottom").zone_index(100, 60)[95, 5] == 0
    for bad in ({"box": (0, 0, 2, 100)}, {"box": (0, 0, 60, 100), "rows": (0.5, 0.4, 0.8)},
                {"box": (0, 0, 60, 100), "cols": (0.7, 0.2)}, {"box": (0, 0, 60, 100), "frontal_at": "left"}):
        with pytest.raises(ValueError):
            crown.ZoneGrid(**bad)
    with pytest.raises(ValueError, match="brush"):
        crown.grid_for(np.zeros((10, 10)))
    assert [crown.level(v) for v in (0.05, 0.2, 0.3, 0.6)] == list(crown.LEVELS)
    assert [crown.level(v) for v in crown.LEVEL_LIMITS] == list(crown.LEVELS[1:])
    assert crown.level(1.0) == crown.LEVELS[-1]


def test_reading_matches_truth_and_coverage_map(case):
    c, region, reading = case
    truth = float(c.scalp[region >= 0.5].mean())
    assert abs(reading.overall_scalp_share - truth) < 0.01
    assert sum(z.pixels for z in reading.zones) == int((region >= 0.5).sum())
    assert reading.copy == crown.COPY and "Not a diagnosis" in crown.COPY
    rgba = crown.coverage_map(reading, region)
    assert rgba.shape == (200, 200, 4) and rgba[0, 0, 3] == 0
    other = reading.split.classify(c.image)
    assert (other[region >= 0.5] == reading.split.scalp[region >= 0.5]).all()


def test_light_hair_on_darker_scalp():
    c = synthetic.crown(120, 120, hair=(205.0, 178.0, 132.0), scalp=(150.0, 104.0, 86.0))
    region = ellipse(120, 120, 60, 62, 36, 34)
    split = crown.split(c.image, region, hair_is_darker=False)
    inside = region >= 0.5
    assert (split.hair[inside] == c.hair[inside]).mean() > 0.98


def test_shade_card_and_mix():
    assert len(shades.SHADES) == 14 and len({s[0] for s in shades.SHADES}) == 14
    exact = shades.shade_card(shades.shade_lab("S07"))
    assert exact["top"][0]["id"] == "S07" and exact["top"][0]["delta_e"] == 0 and exact["mix"] is None
    between = shades.shade_card((30.0, 30.0, 25.0))
    assert between["top"][0]["delta_e"] > 3 and between["mix"]["delta_e"] <= between["top"][0]["delta_e"]
    assert 0.1 <= between["mix"]["second_share"] <= 0.9
    with pytest.raises(ValueError):
        shades.shade_lab("S00")
    with pytest.raises(ValueError, match="too few"):
        shades.hair_colour(np.zeros((4, 4, 3), np.uint8), np.zeros((4, 4), bool))


def test_poisson_seeds_keep_distance_and_weights():
    rng = strands.XorShift32(3)
    cand = np.ones((40, 40), bool)
    seeds = strands.poisson_seeds(cand, np.ones((40, 40)), 3.0, 1000, rng)
    pts = np.array(seeds)
    d = np.hypot(*(pts[:, None, :] - pts[None, :, :]).transpose(2, 0, 1))
    np.fill_diagonal(d, np.inf)
    assert d.min() >= 3.0 and len(seeds) > 60
    none = strands.poisson_seeds(cand, np.zeros((40, 40)), 1.0, 1000, strands.XorShift32(3))
    assert none == []


@pytest.mark.parametrize("level", ["light", "medium", "full"])
def test_fibres_hit_target_keep_colour_and_stay_inside(case, level):
    c, region, reading = case
    zone = region >= 0.5
    out = strands.render(c.image, zone, reading.split.scalp, (22.0, 4.0, 6.0), amount=level)
    m = out.metrics
    assert m["reached"]
    assert abs(m["scalp_share_after"] - m["scalp_share_target"]) <= 0.07
    assert m["fibre_delta_e"] <= 2.0
    assert q1_outside_mask(c.image, out.image, out.edit_mask).passed


def test_products_determinism_and_errors(case):
    c, region, reading = case
    zone = region >= 0.5
    a = strands.render(c.image, zone, reading.split.scalp, (22.0, 4.0, 6.0), amount=50, seed=3)
    b = strands.render(c.image, zone, reading.split.scalp, (22.0, 4.0, 6.0), amount=50, seed=3)
    assert digest(a.image) == digest(b.image)
    for product in ("spray", "powder"):
        out = strands.render(c.image, zone, reading.split.scalp, (22.0, 4.0, 6.0), product=product)
        assert q1_outside_mask(c.image, out.image, out.edit_mask).passed
        assert out.metrics["fibre_delta_e"] <= 2.0
    rgba = np.concatenate([c.image, np.full((200, 200, 1), 128, np.uint8)], axis=2)
    assert strands.render(rgba, zone, reading.split.scalp, (22.0, 4.0, 6.0), amount=20).image.shape == (200, 200, 4)
    assert strands.render(c.image, zone, reading.split.scalp, (22.0, 4.0, 6.0), amount=0).metrics["fibres_used"] == 0
    with pytest.raises(ValueError):
        strands.cut_for(101)
    with pytest.raises(ValueError):
        strands.cut_for("heavy")
    with pytest.raises(ValueError, match="product"):
        strands.render(c.image, zone, reading.split.scalp, (22.0, 4.0, 6.0), product="paint")
    with pytest.raises(ValueError, match="empty"):
        strands.render(c.image, np.zeros_like(zone), reading.split.scalp, (22.0, 4.0, 6.0))
    with pytest.raises(ValueError, match="Lab"):
        strands.render(c.image, zone, reading.split.scalp, (22.0, float("nan"), 6.0))


def test_orientation_follows_drawn_flow():
    c = synthetic.crown(320, 320, seed=6)
    o = strands.orientation(c.image, c.hair, radius=9)
    sel = c.hair & (o.coherence >= 0.2)
    err = np.abs(((o.theta - c.flow + np.pi / 2) % np.pi) - np.pi / 2)[sel]
    assert np.median(err) < np.radians(20)


def test_new_topical_cover_preserves_old_concealer_core_on_drawn_crown(case):
    c, region, reading = case
    session = CoverSession()
    # The recorded six-zone layout and split still drive the typed 1..5 UI.
    result = session.render(c.image, region, reading.split.scalp.astype(np.uint8) * 255,
                            landmarks=LOCAL_HEAD, zone="crown", level=4.0)
    assert isinstance(result, CoverResult)
    assert result.provider_calls == 0
    assert result.after_share < result.before_share
    assert np.array_equal(result.image[region < 0.5], c.image[region < 0.5])
    assert session.zone_grid_calls == session.split_calls == session.energy_calls == 1
    assert strands.cut_for_level(1) == 0.0
    assert strands.cut_for_level(5) == strands.MAX_CUT
