"""The filter pipeline: plan, fallback, presets, add-ons, cache, light by position (filters-plan.md §3.3)."""
from __future__ import annotations

import unittest

import numpy as np

from plumb_api.filters import engine
from plumb_api.filters.colour import ops as O
from plumb_api.filters.colour import space as S
from plumb_api.filters.frame import Frame, whole
from plumb_api.filters.light import position as L
from plumb_api.filters.masks import blend
from plumb_api.filters.qa import fixtures as F
from plumb_api.filters.recipe import registry
from plumb_api.filters.spatial import glow as GL


def cat() -> registry.Catalogue:
    return registry.default()


def mean_b_outside(before: np.ndarray, after: np.ndarray, skin: np.ndarray) -> float:
    out = skin < 0.5
    return float((S.srgb_to_lab(S.bytes_to_unit(after))[..., 2] - S.srgb_to_lab(S.bytes_to_unit(before))[..., 2])[out].mean())


class PlanTest(unittest.TestCase):
    def test_strength_zero_is_bit_identical_and_has_no_stage(self) -> None:
        p = F.portrait("light")
        for r in cat().ranked():
            res = engine.render(p.image, r, engine.Settings(strength=0), p.masks)
            self.assertTrue(res.plan.identity, r["id"])
            self.assertEqual(res.plan.stages, ())
            np.testing.assert_array_equal(res.image, p.image)

    def test_default_strength_and_limits(self) -> None:
        plan = engine.plan(cat().get("C08"), has_skin=True)
        self.assertEqual(plan.strength, 30)
        self.assertFalse(plan.fallback)
        self.assertEqual([s.op for s in plan.stages], ["colour.exposure", "colour.contrast", "colour.saturation"])
        self.assertAlmostEqual(plan.stages[0].params["ev"], 0.045)
        with self.assertRaises(ValueError):
            engine.plan(cat().get("C08"), engine.Settings(strength=120))

    def test_fixed_pipeline_order(self) -> None:
        plan = engine.plan(cat().get("C19"), engine.Settings(strength=100), has_skin=True)
        families = [s.family for s in plan.stages]
        self.assertEqual(families, sorted(families, key=("colour", "spatial", "light").index))
        self.assertEqual(plan.family("light")[0].op, "light.centre", "recipe order kept inside a family")

    def test_missing_skin_mask_caps_strength_and_drops_skin_hue_steps(self) -> None:
        plan = engine.plan(cat().get("C01"), engine.Settings(strength=90), has_skin=False)
        self.assertTrue(plan.fallback)
        self.assertEqual(plan.strength, engine.FALLBACK_STRENGTH)
        self.assertNotIn("colour.splitTone", [s.op for s in plan.stages])
        self.assertTrue(any("capped at 30" in n for n in plan.notes))
        hsl = engine.plan(cat().get("C02"), has_skin=False).family("colour")[0]
        self.assertEqual(hsl.params["bands"]["orange"]["hue"], 0.0)
        off = engine.plan(cat().get("C01"), engine.Settings(strength=90, guard=False), has_skin=False)
        self.assertFalse(off.fallback, "with the guard off she chose the full look")
        self.assertEqual(off.strength, 90)

    def test_background_only_needs_an_outline(self) -> None:
        img = F.portrait("medium").image
        with self.assertRaises(engine.FilterUnavailable):
            engine.render(img, "C28")
        ok = engine.render(img, "C28", engine.Settings(background_only=False))
        self.assertEqual(ok.image.shape, img.shape)
        p = F.portrait("medium")
        res = engine.render(p.image, "C28", masks=p.masks)
        self.assertTrue(any("face as you see it" in n for n in res.notes))

    def test_protect_skin_without_skin_says_so(self) -> None:
        img = F.portrait("medium").image
        res = engine.render(img, "C39")
        self.assertTrue(any("Protect skin needs a skin outline" in n for n in res.notes))

    def test_presets_append_and_report_pending_parts(self) -> None:
        plain = engine.plan(cat().get("C40"), engine.Settings(strength=60), has_skin=True)
        framed = engine.plan(cat().get("C40"), engine.Settings(strength=60, preset="Framed"), has_skin=True)
        self.assertNotIn("light.vignette", [s.op for s in plain.stages])
        self.assertIn("light.vignette", [s.op for s in framed.stages])
        rose = engine.plan(cat().get("C41"), engine.Settings(preset="Rosé"), has_skin=True)
        self.assertNotIn("border FX2", rose.pending)
        self.assertTrue(any(stage.op == "light.border" for stage in rose.stages))
        with self.assertRaises(ValueError):
            engine.plan(cat().get("C41"), engine.Settings(preset="Nope"))

    def test_fade_add_on_and_pending_add_ons(self) -> None:
        plan = engine.plan(cat().get("C08"), engine.Settings(strength=0, addons={"fade": 50}), has_skin=True)
        self.assertFalse(plan.identity, "a built add-on runs even at strength 0")
        fade = [s for s in plan.stages if s.op == "colour.fade"]
        self.assertEqual(len(fade), 1)
        self.assertAlmostEqual(fade[0].params["amount"], 0.3)
        palavas = engine.plan(cat().get("C93"), has_skin=True)
        self.assertIn("grain FX2", palavas.pending)
        with self.assertRaises(ValueError):
            engine.plan(cat().get("C08"), engine.Settings(addons={"sparkle": 10}))
        with self.assertRaises(ValueError):
            engine.plan(cat().get("C08"), engine.Settings(addons={"fade": 140}))

    def test_photo_cast_reaches_grey_world(self) -> None:
        ramp = F.chart_atlas()[:24]
        warm = np.clip(ramp.astype(int) + [12, 0, -10], 0, 255).astype(np.uint8)
        res = engine.render(warm, "C53", engine.Settings(strength=100, guard=False))
        stage = [s for s in res.plan.stages if s.op == "colour.greyWorld"][0]
        self.assertGreater(stage.params["castB"], 0.005, "a warm cast is measured as positive b")
        b_before = S.srgb_to_lab(S.bytes_to_unit(warm))[..., 2].mean()
        b_after = S.srgb_to_lab(S.bytes_to_unit(res.image))[..., 2].mean()
        self.assertLess(float(b_after), float(b_before) - 1.0, "Granville takes part of the cast out")
        self.assertTrue(engine.needs_cast(cat().get("C53")))
        self.assertFalse(engine.needs_cast(cat().get("C08")))

    def test_lut_cache_reuses_bakes(self) -> None:
        cache = engine.LutCache(limit=2)
        img = F.portrait("medium").image
        for _ in range(3):
            engine.render(img, "C14", engine.Settings(guard=False), cache=cache)
        self.assertEqual(cache.bakes, 1)
        engine.render(img, "C14", engine.Settings(strength=31, guard=False), cache=cache)
        engine.render(img, "C02", engine.Settings(guard=False), cache=cache)
        self.assertEqual(cache.bakes, 3)
        self.assertEqual(len(cache.items), 2)
        a = engine.plan(cat().get("C14"), engine.Settings(strength=30))
        b = engine.plan(cat().get("C14"), engine.Settings(strength=30))
        self.assertEqual(a.key, b.key)


class AcceptanceTest(unittest.TestCase):
    def test_mono_looks_keep_a_and_b_within_half_a_unit(self) -> None:
        atlas = F.chart_atlas()
        for r in cat().in_tab("Monochrome"):
            if not r["limits"].get("neutralMono"):
                continue
            for s in (30, 100):
                out = engine.render(atlas, r, engine.Settings(strength=s, guard=False)).image
                ab = np.abs(S.srgb_to_lab(S.bytes_to_unit(out))[..., 1:])
                self.assertLessEqual(float(ab.max()), 0.5, (r["id"], s))

    def test_warm_looks_raise_mean_b_outside_the_skin(self) -> None:
        # On the chart atlas (every hue, no skin) and on the drawn portrait's background. The
        # portrait's background is blue, so a look that also cools blues (Biarritz) is checked on
        # the atlas only.
        atlas = F.chart_atlas()
        none = np.zeros(atlas.shape[:2])
        p = F.portrait("medium")
        assert p.masks.skin is not None
        for r in cat().in_tab("Warm"):
            out = engine.render(atlas, r, engine.Settings(guard=False)).image
            self.assertGreater(mean_b_outside(atlas, out, none), 0.2, r["id"])
            if r["id"] != "C02":
                face = engine.render(p.image, r, engine.Settings(), p.masks, face_centre=F.face_centre(p)).image
                self.assertGreater(mean_b_outside(p.image, face, p.masks.skin), 0.2, r["id"])

    def test_cool_looks_lower_mean_b_outside_the_skin(self) -> None:
        p = F.portrait("medium")
        assert p.masks.skin is not None
        for rid in ("C13", "C34"):
            out = engine.render(p.image, rid, engine.Settings(), p.masks).image
            self.assertLess(mean_b_outside(p.image, out, p.masks.skin), -0.2, rid)

    def test_output_is_rgb_bytes_and_alpha_is_dropped(self) -> None:
        p = F.portrait("medium")
        rgba = np.dstack([p.image, np.full(p.image.shape[:2], 255, np.uint8)])
        res = engine.render(rgba, "C08", engine.Settings(), p.masks)
        self.assertEqual(res.image.shape, p.image.shape)
        self.assertEqual(res.image.dtype, np.uint8)
        with self.assertRaises(ValueError):
            engine.render(p.image.astype(np.float32), "C08")


class PositionTest(unittest.TestCase):
    def setUp(self) -> None:
        self.img = S.bytes_to_unit(F.chart_atlas())
        self.h, self.w = self.img.shape[:2]

    def tile_equals_whole(self, name: str, params: dict) -> None:
        op = engine.oplist.op(name)
        full = O.full_params(op, params)
        fr = whole(self.img, (100.0, 80.0))
        out = op.apply(self.img, full, fr)
        part = op.apply(self.img[40:120, 64:200], full, Frame(self.w, self.h, 64, 40, (100.0, 80.0)))
        np.testing.assert_allclose(part, out[40:120, 64:200], atol=1e-12, err_msg=name)

    def test_position_ops_tile_without_a_halo(self) -> None:
        self.tile_equals_whole("light.vignette", {"amount": 0.6})
        self.tile_equals_whole("light.centre", {"amount": 0.5, "warmth": 0.4, "follow": 1})
        self.tile_equals_whole("light.grade", {"topHue": 270, "topAmount": 0.05, "bottomHue": 65, "bottomAmount": 0.05})

    def test_vignette_darkens_corners_not_the_centre(self) -> None:
        grey = np.full((101, 101, 3), 0.6)
        out = L.vignette(grey, O.full_params(engine.oplist.op("light.vignette"), {"amount": 0.5}), Frame(101, 101))
        self.assertAlmostEqual(float(out[50, 50, 0]), 0.6, places=9)
        lin_ratio = S.decode(out[0, 0, :1]) / S.decode(np.array([0.6]))
        self.assertAlmostEqual(float(lin_ratio[0]), 1 - 0.6 * 0.5 * float(S.smoothstep(0.35, 1.0, np.array(0.99)) ), delta=0.02)

    def test_centre_light_follows_the_face(self) -> None:
        params = O.full_params(engine.oplist.op("light.centre"), {"amount": 0.6, "follow": 1})
        near = L.centre_point(params, Frame(200, 200, face_centre=(40.0, 60.0)))
        self.assertEqual(near, (40.0, 60.0))
        fixed = L.centre_point({**params, "follow": 0}, Frame(200, 200, face_centre=(40.0, 60.0)))
        self.assertEqual(fixed, (100.0, 90.0))

    def test_glow_adds_light_near_highlights_only_and_tiles_with_its_halo(self) -> None:
        img = np.full((80, 80, 3), 0.25)
        img[30:50, 30:50] = 0.98
        params = O.full_params(engine.oplist.op("spatial.glow"), {"amount": 0.5, "radius": 0.06})
        fr = Frame(80, 80)
        out = GL.glow(img, params, fr)
        self.assertTrue(np.all(out >= img - 1e-12), "screening never darkens")
        self.assertGreater(float(out[28, 40, 0]), 0.26)
        np.testing.assert_allclose(out[0, 0], img[0, 0], atol=1e-3)
        pad = GL.halo(params, fr)
        tile = GL.glow(img[20 - pad:60 + pad if 60 + pad <= 80 else 80, :], params, Frame(80, 80, 0, 20 - pad))
        np.testing.assert_allclose(tile[pad:pad + 40], out[20:60], atol=1e-12)
        self.assertEqual(GL.glow(img, {**params, "amount": 0.0}, fr).tolist(), img.tolist())

    def test_face_centre_from_the_oval(self) -> None:
        p = F.portrait("medium")
        cx, cy = F.face_centre(p)
        self.assertAlmostEqual(cx, p.image.shape[1] / 2, delta=1.5)
        self.assertTrue(p.image.shape[0] * 0.3 < cy < p.image.shape[0] * 0.7)
        self.assertEqual(blend.NO_MASKS.source, "none")


if __name__ == "__main__":
    unittest.main()
