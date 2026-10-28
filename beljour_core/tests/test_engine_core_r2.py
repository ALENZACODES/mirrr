"""R2 deterministic local engine, alpha, colour and recipe contract tests.
Author: John Khan.
"""
import unittest

import numpy as np
from plumb_api.engines.core import colour, masks, composite, recipe, engine
from plumb_api.engines.core.local import ExposureEngine, TintEngine


class ColourVectors(unittest.TestCase):
    # Published Sharma et al. CIEDE2000 supplementary test data, first ten pairs.
    PAIRS = [
        ((50, 2.6772, -79.7751), (50, 0, -82.7485), 2.0425),
        ((50, 3.1571, -77.2803), (50, 0, -82.7485), 2.8615),
        ((50, 2.8361, -74.0200), (50, 0, -82.7485), 3.4412),
        ((50, -1.3802, -84.2814), (50, 0, -82.7485), 1.0000),
        ((50, -1.1848, -84.8006), (50, 0, -82.7485), 1.0000),
        ((50, -0.9009, -85.5211), (50, 0, -82.7485), 1.0000),
        ((50, 0, 0), (50, -1, 2), 2.3669),
        ((50, -1, 2), (50, 0, 0), 2.3669),
        ((50, 2.49, -0.001), (50, -2.49, 0.0009), 7.1792),
        ((50, 2.49, -0.001), (50, -2.49, 0.001), 7.1792),
    ]

    def test_reference_differences(self):
        for a, b, expected in self.PAIRS:
            with self.subTest(a=a, b=b):
                self.assertAlmostEqual(colour.ciede2000(a, b), expected, places=4)

    def test_rgb_roundtrip(self):
        for rgb in [(0, 0, 0), (255, 255, 255), (255, 0, 0),
                    (25, 125, 205), (128, 128, 128), (2, 7, 15)]:
            got = colour.lab_to_rgb(colour.rgb_to_lab(rgb))
            self.assertLess(max(abs(x - y) for x, y in zip(rgb, got)), 0.01)
            self.assertEqual(colour.hex_to_rgb(colour.rgb_to_hex(rgb)), rgb)

    def test_validation(self):
        for args in [(float('nan'), 1, 2), (1, 2)]:
            with self.assertRaises(ValueError):
                colour.rgb_to_lab(args)
        with self.assertRaises(ValueError):
            colour.ciede2000((50, 1, 1), (40, 1, 2), kH=0)


class AlphaAndComposite(unittest.TestCase):
    def setUp(self):
        self.a = np.zeros((8, 10, 3), np.uint8)
        self.b = np.full_like(self.a, 255)

    def test_alpha_endpoints(self):
        self.assertTrue(np.array_equal(composite.blend(self.a, self.b, masks.empty(8, 10)), self.a))
        self.assertTrue(np.array_equal(composite.blend(self.a, self.b, masks.full(8, 10)), self.b))

    def test_linear_light_halfway(self):
        m = np.full((8, 10), 0.5, np.float32)
        result = composite.blend(self.a, self.b, m)
        self.assertEqual(int(result[0, 0, 0]), 188)
        self.assertEqual(int(composite.blend(self.a, self.b, m, linear_light=False)[0, 0, 0]), 128)

    def test_dimensions_and_nan_rejected(self):
        with self.assertRaises(ValueError):
            composite.blend(self.a, self.b, np.ones((2, 2)))
        with self.assertRaises(ValueError):
            masks.as_mask(np.full((8, 10), np.nan))

    def test_mask_combinations(self):
        a = masks.rectangle(8, 10, 1, 1, 5, 5)
        b = masks.rectangle(8, 10, 3, 3, 7, 7)
        self.assertAlmostEqual(masks.coverage(masks.union(a, b)), 28 / 80)
        self.assertAlmostEqual(masks.coverage(masks.intersection(a, b)), 4 / 80)
        self.assertEqual(masks.bounding_box(a), (1, 1, 5, 5))
        self.assertAlmostEqual(float(masks.blur(masks.full(8, 10), 2).min()), 1)

    def test_exposure_keeps_input(self):
        original = np.full((8, 10, 3), 100, np.uint8)
        copy = original.copy()
        output = engine.run_engine(ExposureEngine(), original, None, {}, {"stops": 1})
        self.assertEqual(output.provenance, "local")
        self.assertTrue(np.array_equal(original, copy))
        self.assertEqual(output.pipelineVersion, "1.0.0")

    def test_tint_with_one_region(self):
        selected = masks.rectangle(8, 10, 2, 2, 6, 6)
        output = engine.run_engine(TintEngine(), self.a, None, {"selection": selected},
                                   {"rgb": [255, 0, 0], "strength": 1})
        self.assertAlmostEqual(output.metrics["coverage"], 16 / 80)
        self.assertEqual(output.image[0, 0].tolist(), [0, 0, 0])

    def test_engine_rejects_undeclared_edit(self):
        class Bad:
            def run(self, image, landmarks, masks, params, seed):
                altered = image.copy()
                altered[0, 0] = 22
                return engine.EngineResult(altered, np.zeros(image.shape[:2], np.float32),
                                           {}, "local", "1")
        with self.assertRaises(ValueError):
            engine.run_engine(Bad(), self.a, None, {}, {})


class Recipes(unittest.TestCase):
    def setUp(self):
        self.data = {"name": "soft-light", "version": "1.0.0",
                     "params": {"stops": .5},
                     "stops": [{"engine": "exposure"}],
                     "caps": {"stops": {"minimum": -2, "maximum": 2, "default": 0}}}

    def test_round_trip(self):
        original = recipe.validate_recipe(self.data)
        self.assertEqual(recipe.validate_recipe(original.to_dict()), original)
        self.assertEqual(original.resolve({"stops": 1})["stops"], 1)

    def test_reject_unknown_and_out_of_range(self):
        r = recipe.validate_recipe(self.data)
        for override in [{"unknown": 3}, {"stops": 3}, {"stops": float('inf')}]:
            with self.assertRaises(ValueError):
                r.resolve(override)

    def test_unsafe_schema_rejected(self):
        data = dict(self.data, command="curl")
        with self.assertRaises(ValueError):
            recipe.validate_recipe(data)


if __name__ == "__main__":
    unittest.main()
