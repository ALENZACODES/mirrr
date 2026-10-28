"""Finite, deterministic finishing-effect contracts and synthetic skin gates.

Halation and Border use original kernels and share their parity vectors with
TypeScript. The released family and light tags never alter legacy recipes.
Created by John Khan.
"""
from __future__ import annotations

import copy
import unittest

import numpy as np

from plumb_api.filters import engine, oplist
from plumb_api.filters.colour import ops as O
from plumb_api.filters.colour import space as S
from plumb_api.filters.frame import Frame
from plumb_api.filters.qa import fixtures, still_her
from plumb_api.filters.recipe import registry, schema
from plumb_api.filters.spatial.halation import halo as halation_halo


class EffectsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.cat = registry.load()

    def test_both_new_kernels_are_registered(self) -> None:
        for op, family in (("spatial.halation", "spatial"), ("light.border", "light")):
            with self.subTest(op=op):
                self.assertIn(op, oplist.names())
                self.assertEqual(oplist.op(op).family, family)
                self.assertEqual(schema.check_stage({"op": op}, "sample"), [])

    def test_two_new_addons_are_built_and_type_checked(self) -> None:
        self.assertEqual(registry.check_addons(self.cat.addons), [])
        for name, op in (("halation", "spatial.halation"), ("border", "light.border")):
            addon = self.cat.addons[name]
            self.assertTrue(addon["built"])
            self.assertEqual(addon["stage"]["op"], op)
            self.assertEqual(addon["round"], "FX2")

    def test_boundary_values_and_invalid_params_fail(self) -> None:
        halation = oplist.op("spatial.halation")
        border = oplist.op("light.border")
        for op, key, bad in ((halation, "radius", 0.5),
                             (halation, "amount", 2.0),
                             (border, "width", 0),
                             (border, "amount", float("nan")),
                             (border, "tone", 3.0)):
            with self.subTest(op=op.name, key=key, bad=bad):
                self.assertTrue(schema.check_params(op, {key: bad}, "FX2"))

    def test_halation_zero_is_an_identity_and_returns_a_copy(self) -> None:
        rgb = np.linspace(0, 1, 4 * 5 * 3).reshape(4, 5, 3)
        params = O.full_params(oplist.op("spatial.halation"), {"amount": 0})
        got = oplist.op("spatial.halation").apply(rgb, params, Frame(5, 4))
        np.testing.assert_array_equal(got, rgb)
        self.assertFalse(np.shares_memory(rgb, got))

    def test_border_zero_is_an_identity_and_returns_a_copy(self) -> None:
        rgb = np.linspace(0, 1, 5 * 7 * 3).reshape(5, 7, 3)
        params = O.full_params(oplist.op("light.border"), {"amount": 0})
        got = oplist.op("light.border").apply(rgb, params, Frame(7, 5))
        np.testing.assert_array_equal(got, rgb)
        self.assertFalse(np.shares_memory(rgb, got))

    def test_halation_warms_the_fringe_not_the_white_highlight(self) -> None:
        rgb = np.zeros((45, 45, 3), dtype=np.float64)
        rgb[20:25, 20:25] = 1.0
        params = O.full_params(oplist.op("spatial.halation"),
                               {"amount": 0.9, "threshold": 0.55,
                                "radius": 0.08, "warmth": 1.0})
        out = oplist.op("spatial.halation").apply(rgb, params, Frame(45, 45))
        np.testing.assert_allclose(out[22, 22], [1.0, 1.0, 1.0], atol=1e-12)
        self.assertGreater(out[19, 22, 0], out[19, 22, 1])
        self.assertGreater(out[19, 22, 1], out[19, 22, 2])
        self.assertLess(float(out[0, 0].max()), 1e-12)

    def test_halation_never_changes_an_unlit_photo(self) -> None:
        rgb = np.full((24, 32, 3), 0.19)
        params = O.full_params(oplist.op("spatial.halation"), {"amount": 1})
        got = oplist.op("spatial.halation").apply(rgb, params, Frame(32, 24))
        np.testing.assert_allclose(got, rgb, atol=1e-12)

    def test_halation_is_tile_exact_with_three_radius_halo(self) -> None:
        height, width = 53, 79
        rng = np.random.default_rng(4201)
        source = rng.random((height, width, 3))
        params = O.full_params(oplist.op("spatial.halation"),
                               {"amount": 0.7, "threshold": 0.64,
                                "radius": 0.05, "warmth": 0.85})
        full = oplist.op("spatial.halation").apply(source, params, Frame(width, height))
        pad = halation_halo(params, Frame(width, height))
        for left, top, tile_w, tile_h in ((0, 0, 15, 17), (17, 13, 20, 21),
                                         (width - 19, height - 20, 19, 20)):
            x0, y0 = max(0, left - pad), max(0, top - pad)
            x1, y1 = min(width, left + tile_w + pad), min(height, top + tile_h + pad)
            cut = source[y0:y1, x0:x1]
            got = oplist.op("spatial.halation").apply(cut, params, Frame(width, height, x0, y0))
            cropped = got[top - y0:top - y0 + tile_h, left - x0:left - x0 + tile_w]
            np.testing.assert_allclose(cropped, full[top:top + tile_h, left:left + tile_w],
                                       atol=1e-12)

    def test_border_reads_full_photo_coordinates_not_tile_origin(self) -> None:
        h, w = 52, 73
        rng = np.random.default_rng(6201)
        source = rng.random((h, w, 3))
        for tone in (-1.0, 1.0):
            params = O.full_params(oplist.op("light.border"),
                                   {"amount": 0.82, "width": 0.12, "tone": tone})
            full = oplist.op("light.border").apply(source, params, Frame(w, h))
            for x, y, tw, th in ((0, 0, 22, 17), (10, 10, 17, 23),
                                 (w - 23, h - 21, 23, 21)):
                block = oplist.op("light.border").apply(source[y:y + th, x:x + tw],
                              params, Frame(w, h, x, y))
                np.testing.assert_allclose(block, full[y:y + th, x:x + tw], atol=1e-12)

    def test_white_and_dark_borders_are_opposite_without_moving_centre(self) -> None:
        source = np.full((72, 84, 3), 0.5, dtype=np.float64)
        param = {"amount": 0.9, "width": 0.08}
        white = oplist.op("light.border").apply(source,
                      O.full_params(oplist.op("light.border"), {**param, "tone": 1}), Frame(84, 72))
        black = oplist.op("light.border").apply(source,
                      O.full_params(oplist.op("light.border"), {**param, "tone": -1}), Frame(84, 72))
        self.assertGreater(float(white[0, 0, 0]), 0.5)
        self.assertLess(float(black[0, 0, 0]), 0.5)
        np.testing.assert_array_equal(white[36, 42], source[36, 42])
        np.testing.assert_array_equal(black[36, 42], source[36, 42])

    def test_border_only_has_effect_near_image_edge(self) -> None:
        rgb = S.bytes_to_unit(fixtures.chart_atlas())
        params = O.full_params(oplist.op("light.border"),
                               {"amount": 0.8, "width": 0.06, "tone": -1})
        modified = oplist.op("light.border").apply(rgb, params, Frame(rgb.shape[1], rgb.shape[0]))
        np.testing.assert_allclose(modified[30:-30, 30:-30], rgb[30:-30, 30:-30], atol=1e-12)

    def test_preset_completion_preserves_explicit_original_variants(self) -> None:
        for rid, name, tone in (("C41", "Rosé", -1),
                                ("M02", "White border", 1),
                                ("C43", "Print border", 1)):
            with self.subTest(recipe=rid):
                recipe = self.cat.get(rid)
                preset = next(p for p in recipe["presets"] if p["name"] == name)
                self.assertFalse(any("border FX2" in s for s in preset.get("pending", [])))
                stage = next(s for s in preset["append"] if s["op"] == "light.border")
                self.assertEqual(stage["params"]["tone"], tone)
                p = engine.plan(recipe, engine.Settings(preset=name), has_skin=True)
                self.assertEqual(p.pending, ())
                self.assertTrue(any(s.op == "light.border" for s in p.stages))

    def test_no_addon_preserves_the_original_bytes(self) -> None:
        for recipe_id in ("C01", "C08", "C40", "M02"):
            portrait = fixtures.portrait("medium", width=48, height=56)
            original = engine.render(portrait.image, recipe_id, masks=portrait.masks)
            explicit = engine.render(portrait.image, recipe_id,
                                     engine.Settings(addons={"halation": 0, "border": 0}),
                                     masks=portrait.masks)
            np.testing.assert_array_equal(original.image, explicit.image)

    def test_addons_do_not_bypass_protect_skin(self) -> None:
        portrait = fixtures.portrait("tan", width=48, height=56)
        settings = engine.Settings(strength=0, protect_skin=True,
                                   addons={"halation": 100, "border": 100})
        result = engine.render(portrait.image, "C08", settings, masks=portrait.masks)
        skin = portrait.masks.skin >= 0.99
        np.testing.assert_array_equal(result.image[skin], portrait.image[skin])

    def test_unknown_or_non_finite_addon_values_fail(self) -> None:
        recipe = self.cat.get("C08")
        for bad in (float("nan"), float("inf"), -0.1, 100.01):
            with self.assertRaisesRegex(ValueError, "amounts are 0-100"):
                engine.plan(recipe, engine.Settings(addons={"halation": bad}))
        with self.assertRaisesRegex(ValueError, "unknown add-on"):
            engine.plan(recipe, engine.Settings(addons={"moonshine": 5}))

    def test_optional_effects_keep_still_her_on_six_drawn_tones(self) -> None:
        recipe = self.cat.get("C08")
        for addon in ("halation", "border"):
            for portrait in fixtures.six_tones():
                with self.subTest(addon=addon, tone=portrait.face.tone):
                    setting = engine.Settings(strength=30, addons={addon: 50})
                    row = still_her.measure_image(
                        recipe, portrait.image, portrait.face.points, portrait.masks,
                        portrait.face.tone, settings=setting,
                    )
                    self.assertEqual(still_her.problems(recipe, [row]), [])

    def test_legacy_recipe_metadata_does_not_recolour_golden_reference(self) -> None:
        portrait = fixtures.portrait("medium", width=48, height=56)
        recipe = copy.deepcopy(self.cat.get("C01"))
        original = engine.render(portrait.image, recipe, masks=portrait.masks)
        recipe["editorial"] = {"family": "Salon Suite", "light": "Window"}
        next_result = engine.render(portrait.image, recipe, masks=portrait.masks)
        np.testing.assert_array_equal(original.image, next_result.image)


if __name__ == "__main__":
    unittest.main()
