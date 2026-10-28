"""Original local texture engines: determinism, parity and seam integrity.

Only deterministic synthetic pixels are evaluated here. No external portraits,
model weights, provider calls or photographic assets are required.
Created by John Khan.
"""
from __future__ import annotations

import copy
import math
import unittest

import numpy as np

from plumb_api.filters import oplist
from plumb_api.filters.colour import ops as O
from plumb_api.filters.colour import space as S
from plumb_api.filters.frame import Frame
from plumb_api.filters.recipe import schema
from plumb_api.filters.spatial import grain, structure


class KernelRegistrationTest(unittest.TestCase):
    def test_both_kernels_are_owned_and_registered(self) -> None:
        registered = set(oplist.names())
        self.assertIn("spatial.grain", registered)
        self.assertIn("spatial.structure", registered)
        for name in ("spatial.grain", "spatial.structure"):
            with self.subTest(name=name):
                op = oplist.op(name)
                self.assertEqual(op.family, "spatial")
                self.assertFalse(op.skin_hue)
                self.assertEqual(schema.check_stage({"op": name}, name), [])

    def test_stage_resolution_at_multiple_strengths(self) -> None:
        for name in ("spatial.grain", "spatial.structure"):
            op = oplist.op(name)
            for value in (0.0, 0.1, 0.5, 0.9, 1.0):
                with self.subTest(name=name, value=value):
                    p = O.scale_params(op, {"amount": 0.8}, value)
                    self.assertAlmostEqual(p["amount"], 0.8 * value)
                    self.assertEqual(O.is_neutral(name, p), value == 0)
                    self.assertTrue(all(math.isfinite(float(x)) for x in p.values()))

    def test_zero_and_high_parameter_boundaries(self) -> None:
        spec = oplist.op("spatial.grain")
        for seed in (0, 1, 104729, 0xFFFFFFFF):
            self.assertEqual(schema.check_params(spec, {"seed": seed}, "grain"), [])
        for bad in (float("nan"), float("inf"), -1, 0x100000000, 0.5, 15.6):
            self.assertTrue(schema.check_params(spec, {"seed": bad}, "grain"))
        for val in (-0.001, 1.001, math.inf, math.nan):
            self.assertTrue(schema.check_params(spec, {"amount": val}, "grain"))
        for val in (-0.001, 0.05, float("nan")):
            self.assertTrue(schema.check_params(oplist.op("spatial.structure"),
                                                 {"radius": val}, "structure"))
        for val in (-0.01, 0.061, float("inf")):
            self.assertTrue(schema.check_params(oplist.op("spatial.structure"),
                                                 {"threshold": val}, "structure"))

    def test_nonexistent_ops_fail_by_registry(self) -> None:
        for name in ("spatial.fakeGrain", "spatial.structurePro", "colour.grain"):
            with self.subTest(name=name), self.assertRaises(KeyError):
                oplist.op(name)


class GrainNumericTest(unittest.TestCase):
    def setUp(self) -> None:
        self.img = np.random.default_rng(134).random((19, 27, 3))
        self.params = O.full_params(oplist.op("spatial.grain"), {"amount": 0.72})
        self.frame = Frame(27, 19)

    def test_strength_zero_is_an_exact_copy(self) -> None:
        params = {**self.params, "amount": 0.0}
        output = grain.grain(self.img, params, self.frame)
        np.testing.assert_array_equal(output, self.img)
        self.assertFalse(np.shares_memory(output, self.img))

    def test_source_buffer_is_never_modified(self) -> None:
        original = self.img.copy()
        got = grain.grain(self.img, self.params, self.frame)
        np.testing.assert_array_equal(self.img, original)
        self.assertFalse(np.shares_memory(got, self.img))

    def test_repeated_runs_are_identical(self) -> None:
        expected = grain.grain(self.img, self.params, self.frame)
        for _ in range(5):
            np.testing.assert_array_equal(grain.grain(self.img, self.params, self.frame), expected)

    def test_default_seed_is_stable(self) -> None:
        generated = grain.noise(15, 17, Frame(15, 17))
        explicit = grain.noise(15, 17, Frame(15, 17), grain.DEFAULT_SEED)
        np.testing.assert_array_equal(generated, explicit)

    def test_different_seeds_produce_distinct_deterministic_grain(self) -> None:
        a = grain.noise(32, 33, Frame(32, 33), 100)
        b = grain.noise(32, 33, Frame(32, 33), 101)
        self.assertGreater(np.count_nonzero(a != b), 1000)
        np.testing.assert_array_equal(a, grain.noise(32, 33, Frame(32, 33), 100))

    def test_different_photo_dimensions_change_the_seed_field(self) -> None:
        a = grain.noise(12, 14, Frame(50, 50))
        b = grain.noise(12, 14, Frame(50, 51))
        self.assertGreater(np.count_nonzero(a != b), 150)

    def test_noise_is_bounded_even_at_unsigned_seed_extremes(self) -> None:
        for seed in (0, 1, 0x7FFFFFFF, 0x80000000, 0xFFFFFFFF):
            with self.subTest(seed=seed):
                field = grain.noise(39, 41, Frame(250, 220, 40, 50), seed)
                self.assertTrue(np.isfinite(field).all())
                self.assertTrue(np.all(field >= -1.0))
                self.assertTrue(np.all(field <= 1.0))
                self.assertGreater(float(field.std()), 0.2)

    def test_invalid_seed_does_not_wrap_silently(self) -> None:
        for bad in (-1, 0x100000000, 1.5, "64"):
            with self.subTest(seed=bad), self.assertRaises(ValueError):
                grain.noise(20, 23, Frame(20, 23), bad)

    def test_neutral_whites_and_blacks_stay_exactly_clean(self) -> None:
        image = np.zeros((40, 50, 3), dtype=np.float64)
        image[:, 10:20, :] = 1.0
        image[:, 20:30, :] = 0.5
        out = grain.grain(image, self.params, Frame(50, 40))
        np.testing.assert_array_equal(out[:, :10], image[:, :10])
        np.testing.assert_array_equal(out[:, 10:20], image[:, 10:20])
        self.assertGreater(float(out[:, 20:30].std()), 0)

    def test_grey_remains_grey_and_no_chromatic_grain_is_introduced(self) -> None:
        image = np.full((40, 50, 3), 0.5, dtype=np.float64)
        out = grain.grain(image, self.params, Frame(50, 40))
        np.testing.assert_array_equal(out[..., 0], out[..., 1])
        np.testing.assert_array_equal(out[..., 0], out[..., 2])

    def test_colour_differences_remain_unaltered_away_from_clipping(self) -> None:
        image = np.zeros((25, 29, 3), dtype=np.float64)
        image[:] = (0.46, 0.52, 0.57)
        output = grain.grain(image, self.params, Frame(29, 25))
        np.testing.assert_allclose(output[..., 2] - output[..., 0], 0.11, atol=1e-12)
        np.testing.assert_allclose(output[..., 1] - output[..., 0], 0.06, atol=1e-12)

    def test_bounded_delta_at_every_pixel(self) -> None:
        for amount in (0.01, 0.20, 0.50, 0.90, 1.00):
            with self.subTest(amount=amount):
                output = grain.grain(self.img, {**self.params, "amount": amount}, self.frame)
                bound = grain.MAX_GRAIN * amount + 1e-12
                self.assertLessEqual(float(np.max(np.abs(output - self.img))), bound)
                self.assertTrue(np.all((0 <= output) & (output <= 1)))

    def test_average_noise_does_not_shift_a_neutral_card(self) -> None:
        image = np.full((200, 211, 3), 0.5)
        got = grain.grain(image, self.params, Frame(211, 200))
        self.assertLess(abs(float(got.mean()) - 0.5), 0.0004)
        self.assertGreater(float(got.std()), 0.005)

    def test_original_highlights_remain_neutral_when_coloured(self) -> None:
        image = np.full((31, 43, 3), 0.4)
        image[3:14, 3:14] = 1.0
        image[20:24, 8:25] = 0.0
        result = grain.grain(image, self.params, Frame(43, 31))
        np.testing.assert_array_equal(result[3:14, 3:14], image[3:14, 3:14])
        np.testing.assert_array_equal(result[20:24, 8:25], image[20:24, 8:25])

    def test_full_photo_noise_equals_arbitrary_crops(self) -> None:
        h, w = 73, 91
        full = grain.noise(w, h, Frame(w, h), 53)
        for x, y, tw, th in ((0, 0, 20, 20), (17, 13, 23, 31), (w - 24, h - 25, 24, 25)):
            with self.subTest(rect=(x, y, tw, th)):
                got = grain.noise(tw, th, Frame(w, h, x, y), 53)
                np.testing.assert_array_equal(got, full[y:y + th, x:x + tw])

    def test_offcentre_crop_is_exact_after_grain_render(self) -> None:
        h, w = 82, 96
        image = np.random.default_rng(7).random((h, w, 3))
        full = grain.grain(image, self.params, Frame(w, h))
        for x, y, tw, th in ((0, 0, 16, 24), (24, 20, 33, 37), (w - 29, h - 26, 29, 26)):
            block = grain.grain(image[y:y + th, x:x + tw], self.params, Frame(w, h, x, y))
            np.testing.assert_array_equal(block, full[y:y + th, x:x + tw])

    def test_seed_does_not_depend_on_crop_evaluation_order(self) -> None:
        a = grain.noise(13, 12, Frame(80, 90, 12, 13), 22)
        grain.noise(14, 20, Frame(80, 90, 25, 40), 23)
        b = grain.noise(13, 12, Frame(80, 90, 12, 13), 22)
        np.testing.assert_array_equal(a, b)


class StructureNumericTest(unittest.TestCase):
    def setUp(self) -> None:
        self.image = np.random.default_rng(25).random((45, 59, 3))
        self.params = O.full_params(oplist.op("spatial.structure"), {"amount": 0.74})
        self.frame = Frame(59, 45)

    def test_zero_is_exact_identity_copy(self) -> None:
        p = {**self.params, "amount": 0.0}
        out = structure.structure(self.image, p, self.frame)
        np.testing.assert_array_equal(out, self.image)
        self.assertFalse(np.shares_memory(out, self.image))

    def test_does_not_mutate_input(self) -> None:
        prior = copy.deepcopy(self.image)
        structure.structure(self.image, self.params, self.frame)
        np.testing.assert_array_equal(self.image, prior)

    def test_uniform_field_is_untouched(self) -> None:
        for grey in (0.0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0):
            with self.subTest(grey=grey):
                image = np.full((43, 45, 3), grey)
                out = structure.structure(image, self.params, Frame(45, 43))
                np.testing.assert_allclose(out, image, atol=1e-14)

    def test_black_and_white_reference_regions_are_clean(self) -> None:
        image = np.full((40, 50, 3), 0.5)
        image[0:5, :, :] = 1.0
        image[-5:, :, :] = 0.0
        result = structure.structure(image, self.params, Frame(50, 40))
        np.testing.assert_array_equal(result[0:5], image[0:5])
        np.testing.assert_array_equal(result[-5:], image[-5:])

    def test_local_structure_preserves_clean_grey_channels(self) -> None:
        image = np.full((38, 49, 3), 0.44)
        image[14:22, 13:34] = 0.77
        result = structure.structure(image, self.params, Frame(49, 38))
        np.testing.assert_array_equal(result[..., 0], result[..., 1])
        np.testing.assert_array_equal(result[..., 1], result[..., 2])

    def test_colour_offsets_are_additive_and_uniform(self) -> None:
        image = np.zeros((35, 35, 3), dtype=np.float64)
        image[:] = (0.31, 0.37, 0.41)
        image[10:25, 10:25] = (0.6, 0.66, 0.7)
        result = structure.structure(image, self.params, Frame(35, 35))
        np.testing.assert_allclose(result[..., 2] - result[..., 0], 0.1, atol=1e-12)
        np.testing.assert_allclose(result[..., 1] - result[..., 0], 0.06, atol=1e-12)

    def test_strength_cannot_push_delta_past_bounded_ceiling(self) -> None:
        for amount in (0.01, 0.2, 0.5, 0.9, 1.0):
            with self.subTest(amount=amount):
                result = structure.structure(self.image, {**self.params, "amount": amount}, self.frame)
                self.assertLessEqual(float(np.max(np.abs(result - self.image))), structure.MAX_DELTA + 1e-12)
                self.assertTrue(np.isfinite(result).all())
                self.assertTrue(np.all((0 <= result) & (result <= 1)))

    def test_noise_below_threshold_does_not_get_sharpened(self) -> None:
        image = np.full((39, 43, 3), 0.5)
        image[15, 15] = 0.507
        result = structure.structure(image, self.params, Frame(43, 39))
        np.testing.assert_allclose(result, image, atol=1e-12)

    def test_detail_above_noise_floor_gets_local_lift(self) -> None:
        image = np.full((41, 47, 3), 0.5)
        image[20, 23] = 0.7
        result = structure.structure(image, self.params, Frame(47, 41))
        self.assertGreater(float(result[20, 23, 0]), float(image[20, 23, 0]))
        self.assertLess(float(result[20, 22, 0]), float(image[20, 22, 0]))

    def test_change_is_local_not_a_global_tone_shift(self) -> None:
        image = np.full((67, 67, 3), 0.5)
        image[32, 32] = 0.9
        result = structure.structure(image, self.params, Frame(67, 67))
        np.testing.assert_allclose(result[0:8, 0:8], image[0:8, 0:8], atol=1e-12)

    def test_radius_is_whole_photo_bound_not_crop_size(self) -> None:
        frame = Frame(461, 323)
        same = Frame(461, 323, 100, 75)
        for share in (0.002, 0.012, 0.020, 0.036):
            self.assertEqual(structure.radius_pixels(share, frame),
                             structure.radius_pixels(share, same))
            self.assertGreaterEqual(structure.radius_pixels(share, frame), 1)

    def test_halo_equals_radius_for_single_pass(self) -> None:
        for shape in ((30, 40), (120, 170), (1000, 600)):
            h, w = shape
            f = Frame(w, h)
            self.assertEqual(structure.halo(self.params, f),
                             structure.radius_pixels(self.params["radius"], f))

    def test_whole_frame_matches_padded_inner_tiles(self) -> None:
        h, w = 133, 175
        src = np.random.default_rng(23).random((h, w, 3))
        params = {**self.params, "radius": 0.036}
        full = structure.structure(src, params, Frame(w, h))
        pad = structure.halo(params, Frame(w, h))
        for x, y, tw, th in ((0, 0, 29, 37), (37, 59, 43, 34),
                             (w - 30, h - 23, 30, 23), (w // 2, 0, 22, 47)):
            with self.subTest(rect=(x, y, tw, th)):
                x0, y0 = max(0, x - pad), max(0, y - pad)
                x1, y1 = min(w, x + tw + pad), min(h, y + th + pad)
                outer = src[y0:y1, x0:x1]
                styled = structure.structure(outer, params, Frame(w, h, x0, y0))
                inner = styled[y - y0:y - y0 + th, x - x0:x - x0 + tw]
                np.testing.assert_allclose(inner, full[y:y + th, x:x + tw], atol=2e-14)

    def test_unpadded_block_can_differ_and_requires_halo(self) -> None:
        h, w = 57, 57
        img = np.full((h, w, 3), 0.5)
        img[:, 28:] = 0.82
        params = {**self.params, "radius": 0.036}
        full = structure.structure(img, params, Frame(w, h))
        unpadded = structure.structure(img[:, :28], params, Frame(w, h))
        self.assertFalse(np.allclose(full[:, :28], unpadded))

    def test_all_strengths_keep_neutral_whites(self) -> None:
        image = np.full((38, 38, 3), 0.5)
        image[5:13, 5:13] = 1.0
        for a in np.linspace(0, 1, 11):
            with self.subTest(amount=float(a)):
                result = structure.structure(image, {**self.params, "amount": float(a)}, Frame(38, 38))
                np.testing.assert_array_equal(result[5:13, 5:13], image[5:13, 5:13])

    def test_roundtrip_to_uint8_is_deterministic(self) -> None:
        first = S.unit_to_bytes(structure.structure(self.image, self.params, self.frame))
        for _ in range(5):
            second = S.unit_to_bytes(structure.structure(self.image, self.params, self.frame))
            np.testing.assert_array_equal(first, second)


if __name__ == "__main__":
    unittest.main()
