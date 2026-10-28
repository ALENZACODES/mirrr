"""Skin guard, Protect skin, Background only and mask sources (filters-plan.md §1.2; FX1 acceptance)."""
from __future__ import annotations

import unittest

import numpy as np

from plumb_api.filters import engine
from plumb_api.filters.colour import space as S
from plumb_api.filters.masks import blend
from plumb_api.filters.masks import guard as G
from plumb_api.filters.qa import fixtures as F
from plumb_api.quality import metrics


def lab(img: np.ndarray) -> np.ndarray:
    return S.srgb_to_lab(S.bytes_to_unit(img))


def flat(rgb: tuple[int, int, int], h: int = 20, w: int = 24) -> np.ndarray:
    return np.tile(np.array(rgb, dtype=np.uint8), (h, w, 1))


class GuardTest(unittest.TestCase):
    def setUp(self) -> None:
        rng = np.random.default_rng(2)
        self.before = np.clip(np.array([190, 140, 105]) + rng.normal(0, 6, (20, 24, 3)), 0, 255).astype(np.uint8)
        self.skin = np.zeros((20, 24))
        self.skin[4:16, 5:19] = 1.0
        self.rise = np.zeros((20, 24))

    def test_lift_is_capped_at_mid_grey_rise_plus_one(self) -> None:
        brighter = np.clip(self.before.astype(int) + 25, 0, 255).astype(np.uint8)
        out = G.guard(self.before, brighter, self.skin, self.rise)
        inside = self.skin == 1
        rise = (lab(out)[..., 0] - lab(self.before)[..., 0])[inside]
        self.assertLessEqual(float(rise.max()), G.LIFT_OVER_GREY + 1e-6)
        np.testing.assert_array_equal(out[~inside & (self.skin == 0)], brighter[self.skin == 0])
        big = G.guard(self.before, np.clip(self.before.astype(int) + 60, 0, 255).astype(np.uint8), self.skin,
                      np.full((20, 24), 10.0))
        self.assertLessEqual(float((lab(big)[..., 0] - lab(self.before)[..., 0])[inside].max()), G.LIFT_MAX + 1e-6)

    def test_a_look_that_darkens_grey_leaves_skin_less_room(self) -> None:
        brighter = np.clip(self.before.astype(int) + 10, 0, 255).astype(np.uint8)
        out = G.guard(self.before, brighter, self.skin, np.full((20, 24), -0.6))
        rise = (lab(out)[..., 0] - lab(self.before)[..., 0])[self.skin == 1]
        self.assertLessEqual(float(rise.max()), 0.4 + 1e-6)

    def test_chroma_and_hue_limits(self) -> None:
        grey_skin = np.clip(lab(self.before) * [1, 0.5, 0.5], -128, 128)
        washed = S.unit_to_bytes(S.lab_to_srgb(grey_skin))
        out = G.guard(self.before, washed, self.skin, self.rise)
        inside = self.skin == 1
        cb = np.hypot(*lab(self.before)[inside][:, 1:].T)
        co = np.hypot(*lab(out)[inside][:, 1:].T)
        self.assertGreaterEqual(float((co / cb).mean()), G.CHROMA_KEEP)
        turned_lab = lab(self.before).copy()
        h = np.arctan2(turned_lab[..., 2], turned_lab[..., 1]) + np.radians(25)
        c = np.hypot(turned_lab[..., 1], turned_lab[..., 2])
        turned_lab[..., 1], turned_lab[..., 2] = c * np.cos(h), c * np.sin(h)
        turned = S.unit_to_bytes(S.lab_to_srgb(turned_lab))
        out = G.guard(self.before, turned, self.skin, self.rise)
        hb = np.degrees(np.arctan2(lab(self.before)[..., 2], lab(self.before)[..., 1]))[inside]
        ho = np.degrees(np.arctan2(lab(out)[..., 2], lab(out)[..., 1]))[inside]
        self.assertLessEqual(float(np.abs(S.wrap_degrees(ho - hb)).mean()), G.HUE_TURN_MAX)

    def test_lightness_mode_keeps_mono_neutral_and_skips_colour_limits(self) -> None:
        grey = np.repeat(lab(self.before)[..., :1], 3, axis=-1) * [1, 0, 0]
        mono = S.unit_to_bytes(S.lab_to_srgb(grey))
        mono = np.repeat(mono[..., :1], 3, axis=-1)
        out = G.guard(self.before, mono, self.skin, self.rise, mode="lightness")
        self.assertTrue(np.all(out[..., 0] == out[..., 1]) and np.all(out[..., 1] == out[..., 2]))
        with self.assertRaises(ValueError):
            G.guard(self.before, mono, self.skin, self.rise, mode="half")

    def test_spread_is_held_for_dark_skin(self) -> None:
        dark = F.portrait("very_dark")
        mean = dark.image.reshape(-1, 3).mean(axis=0)
        crushed = np.clip(mean + (dark.image.astype(float) - mean) * 0.4, 0, 255).astype(np.uint8)
        stats = G.spread_stats(dark.image, crushed, dark.masks.skin)
        self.assertIsNotNone(stats.ratio)
        out = G.guard(dark.image, crushed, dark.masks.skin, np.zeros(dark.image.shape[:2]))
        inside = dark.masks.skin >= 0.5
        ratio = lab(out)[..., 0][inside].std() / lab(dark.image)[..., 0][inside].std()
        self.assertGreaterEqual(float(ratio), 0.70)

    def test_stats_add_up_over_tiles(self) -> None:
        p = F.portrait("medium")
        look = engine.look(p.image, engine.plan(engine.registry.default().get("C01"), engine.Settings(strength=100)))
        whole = G.spread_stats(p.image, look, p.masks.skin)
        top = G.spread_stats(p.image[:100], look[:100], p.masks.skin[:100])
        bottom = G.spread_stats(p.image[100:], look[100:], p.masks.skin[100:])
        both = top.plus(bottom)
        self.assertAlmostEqual(both.weight, whole.weight)
        self.assertAlmostEqual(both.ratio, whole.ratio, places=9)
        self.assertEqual(G.spread_scale(G.EMPTY), 1.0)
        self.assertIsNone(G.EMPTY.ratio)

    def test_empty_mask_returns_the_look(self) -> None:
        look = flat((10, 200, 30))
        out = G.guard(flat((100, 100, 100)), look, np.zeros((20, 24)), np.zeros((20, 24)))
        np.testing.assert_array_equal(out, look)
        with self.assertRaises(ValueError):
            G.guard(flat((1, 2, 3)), flat((1, 2, 3), 10, 10), np.zeros((20, 24)), np.zeros((20, 24)))

    def test_grey_rise_reads_the_mid_grey_look(self) -> None:
        self.assertAlmostEqual(float(G.grey_rise(flat((119, 119, 119))).max()), 0.0, places=9)
        self.assertGreater(float(G.grey_rise(flat((130, 130, 130))).min()), 3.0)


class KeepTest(unittest.TestCase):
    def setUp(self) -> None:
        self.p = F.portrait("tan")

    def test_protect_skin_holds_delta_e_two_inside_the_skin(self) -> None:
        for rid in ("C01", "C30", "C19", "M04", "C13"):
            out = engine.render(self.p.image, rid, engine.Settings(strength=100, protect_skin=True), self.p.masks).image
            inside = self.p.masks.skin >= 0.5
            de = S.ciede2000(lab(self.p.image)[inside], lab(out)[inside])
            self.assertLessEqual(float(de.max()), 2.0, rid)

    def test_background_only_passes_q1_on_the_person(self) -> None:
        for rid in ("C28", "C02", "C37"):
            out = engine.render(self.p.image, rid, engine.Settings(strength=100, background_only=True), self.p.masks).image
            person = np.asarray(self.p.masks.person, dtype=np.float64)
            q1 = metrics.q1_outside_mask(self.p.image, out, 1.0 - person, dilate_px=0)
            self.assertTrue(q1.passed, (rid, q1.measured))
            self.assertGreater(float(np.abs(out.astype(int) - self.p.image.astype(int))[person == 0].mean()), 0.5,
                               "the background takes the look")

    def test_keep_mask_rules(self) -> None:
        m = self.p.masks
        shape = self.p.image.shape[:2]
        self.assertIsNone(blend.keep_mask(m, protect_skin=False, background_only=False, shape=shape))
        both = blend.keep_mask(m, protect_skin=True, background_only=True, shape=shape)
        assert both is not None and m.person is not None and m.skin is not None
        np.testing.assert_allclose(both, np.minimum(1.0, 2.0 * np.maximum(m.skin, m.person)))
        none = blend.keep_mask(blend.NO_MASKS, protect_skin=True, background_only=True, shape=shape)
        self.assertIsNone(none)

    def test_keep_original_copies_full_alpha_and_mixes_edges(self) -> None:
        a, b = flat((200, 50, 50)), flat((20, 20, 220))
        keep = np.zeros((20, 24))
        keep[:, :8] = 1.0
        keep[:, 8:12] = 0.5
        out = blend.keep_original(a, b, keep)
        np.testing.assert_array_equal(out[:, :8], a[:, :8])
        np.testing.assert_array_equal(out[:, 12:], b[:, 12:])
        self.assertTrue(np.all((out[:, 9, 0] > 20) & (out[:, 9, 0] < 200)))

    def test_masks_from_landmarks(self) -> None:
        m = blend.from_landmarks(self.p.face.points, *self.p.image.shape[:2])
        self.assertEqual(m.source, "landmarks")
        assert m.skin is not None and m.person is not None
        self.assertTrue(np.all(m.skin <= m.person + 1e-6), "skin sits inside the face oval")
        self.assertIn("Background only", m.note)
        with self.assertRaises(ValueError):
            blend.FilterMasks(source="camera")


if __name__ == "__main__":
    unittest.main()
