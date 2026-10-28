"""R3 E29 quality checks Q1, Q3-Q6, Q9, Q10, the §17 report format and the harness.
Author: John Khan.
"""
import json
import tempfile
import unittest
from pathlib import Path

import numpy as np

from plumb_api.engines.core import composite, distance, masks, resample
from plumb_api.engines.core.engine import EngineResult
from plumb_api.engines.core.local import ExposureEngine, TintEngine
from plumb_api.quality import harness, metrics, report

RNG = np.random.default_rng(11)


def photo(h=40, w=40):
    return RNG.integers(40, 200, (h, w, 3), dtype=np.uint8)


class Q1Test(unittest.TestCase):
    def setUp(self):
        self.before = photo()
        self.mask = masks.rectangle(40, 40, 15, 15, 25, 25)

    def test_change_inside_mask_passes(self):
        after = self.before.copy()
        after[15:25, 15:25] = 255
        check = metrics.q1_outside_mask(self.before, after, self.mask)
        self.assertTrue(check.passed)
        self.assertEqual(check.measured["max"], 0.0)

    def test_change_within_the_dilation_is_allowed(self):
        after = self.before.copy()
        after[20, 30] = 0                                   # 5 px outside the mask, inside 8 px
        self.assertTrue(metrics.q1_outside_mask(self.before, after, self.mask).passed)

    def test_change_far_outside_fails(self):
        after = self.before.copy()
        after[2, 2] = np.minimum(255, after[2, 2].astype(int) + 9)
        check = metrics.q1_outside_mask(self.before, after, self.mask)
        self.assertFalse(check.passed)
        self.assertAlmostEqual(check.measured["max"], 9 / 255)
        self.assertEqual(check.code, "Q1")
        self.assertIn("8 px", check.rule)

    def test_small_noise_everywhere_fails_on_mean(self):
        after = np.clip(self.before.astype(int) + 2, 0, 255).astype(np.uint8)
        check = metrics.q1_outside_mask(self.before, after, self.mask)
        self.assertFalse(check.passed)
        self.assertLessEqual(check.measured["max"], 4 / 255)

    def test_empty_mask_means_nothing_may_change(self):
        empty = masks.empty(40, 40)
        self.assertTrue(metrics.q1_outside_mask(self.before, self.before, empty).passed)
        self.assertEqual(metrics.q1_outside_mask(self.before, self.before, empty).measured["outside_share"], 1.0)

    def test_size_mismatch(self):
        with self.assertRaises(ValueError):
            metrics.q1_outside_mask(self.before, photo(30, 40), self.mask)


class Q3Test(unittest.TestCase):
    def test_identity_and_gentle_warp_pass(self):
        mx, my = resample.identity(20, 20)
        self.assertTrue(metrics.q3_fold_free(mx, my).passed)
        bump = 1.5 * np.exp(-((mx - 10) ** 2 + (my - 10) ** 2) / 20)
        self.assertTrue(metrics.q3_fold_free(mx + bump, my).passed)

    def test_fold_fails(self):
        mx, my = resample.identity(20, 20)
        folded = mx.copy()
        folded[:, 8:12] = folded[:, 8:12][:, ::-1]
        check = metrics.q3_fold_free(folded, my)
        self.assertFalse(check.passed)
        self.assertGreater(check.measured["folded_share"], 0)
        squeeze = metrics.q3_fold_free(mx * 0.1, my)
        self.assertFalse(squeeze.passed)
        self.assertEqual(squeeze.measured["below_share"], 1.0)


class Q4Test(unittest.TestCase):
    def setUp(self):
        yy, xx = np.mgrid[0:48, 0:48]
        base = np.stack([90 + xx, 100 + 0.5 * yy, 120 + 0 * xx], -1) + RNG.integers(0, 4, (48, 48, 3))
        self.before = np.clip(base, 0, 255).astype(np.uint8)
        self.hard = masks.ellipse(48, 48, 24, 24, 12, 12)

    def brighten(self, mask):
        target = composite.exposure(self.before, 0.3)
        return composite.blend(self.before, target, mask)

    def test_hard_edge_fails_soft_edge_passes(self):
        hard = metrics.q4_seam(self.before, self.brighten(self.hard), self.hard)
        soft_mask = distance.feather(self.hard, 8, "centered")
        soft = metrics.q4_seam(self.before, self.brighten(soft_mask), soft_mask)
        self.assertFalse(hard.passed)
        self.assertTrue(soft.passed, soft.measured)
        self.assertLess(soft.measured["ratio"], hard.measured["ratio"])

    def test_unchanged_and_edge_free(self):
        self.assertEqual(metrics.q4_seam(self.before, self.before, self.hard).measured["seam"], 0.0)
        flat = metrics.q4_seam(self.before, self.before, masks.full(48, 48))
        self.assertTrue(flat.passed)
        self.assertEqual(flat.measured["band_pixels"], 0)

    def test_mask_edge(self):
        edge = metrics.mask_edge(masks.rectangle(6, 6, 2, 2, 4, 4))
        self.assertTrue(edge[2, 1] and edge[2, 2] and edge[3, 3] and edge[3, 4])
        self.assertFalse(edge[0, 0] or edge[2, 0] or edge[5, 5])
        self.assertFalse(metrics.mask_edge(masks.full(5, 5)).any())


class Q5Test(unittest.TestCase):
    def test_determinism(self):
        img = photo()
        self.assertTrue(metrics.q5_determinism(lambda: composite.exposure(img, 0.4)).passed)
        counter = iter(range(10))
        check = metrics.q5_determinism(lambda: np.full((2, 2), next(counter)), runs=3)
        self.assertFalse(check.passed)
        self.assertEqual(check.measured["distinct_outputs"], 3)
        with self.assertRaises(ValueError):
            metrics.q5_determinism(lambda: 1, runs=1)

    def test_digest_sees_dtype_and_shape(self):
        a = np.zeros((2, 3), np.uint8)
        self.assertNotEqual(metrics.digest(a), metrics.digest(a.astype(np.float32)))
        self.assertNotEqual(metrics.digest(a), metrics.digest(a.reshape(3, 2)))

    def test_parity_and_differences(self):
        self.assertTrue(metrics.q5_parity([1.0, {"x": 2.0}], [1.001, {"x": 2.0}]).passed)
        self.assertFalse(metrics.q5_parity([1.0], [1.01]).passed)
        self.assertEqual(metrics.max_abs_difference(None, None), 0.0)
        self.assertEqual(metrics.max_abs_difference(None, 1.0), float("inf"))
        self.assertEqual(metrics.max_abs_difference([1, 2], [1]), float("inf"))
        self.assertEqual(metrics.max_abs_difference({"a": 1}, {"b": 1}), float("inf"))
        self.assertEqual(metrics.max_abs_difference(True, True), 0.0)


class Q6Test(unittest.TestCase):
    def test_exact_and_wrong_colour(self):
        img = photo()
        mask = masks.rectangle(40, 40, 5, 5, 20, 20)
        painted = composite.solid(img, (180, 40, 60), mask)
        self.assertTrue(metrics.q6_colour_accuracy(painted, mask, "#B4283C").passed)
        self.assertLess(metrics.q6_colour_accuracy(painted, mask, (180, 40, 60)).measured["delta_e"], 0.01)
        self.assertFalse(metrics.q6_colour_accuracy(painted, mask, "#3C28B4").passed)
        empty = metrics.q6_colour_accuracy(painted, masks.empty(40, 40), "#B4283C")
        self.assertFalse(empty.passed)
        self.assertEqual(empty.measured["reason"], "empty mask")

    def test_mean_is_in_linear_light(self):
        img = np.zeros((1, 2, 3), np.uint8)
        img[0, 1] = 255
        mean = metrics.masked_mean_colour(img, masks.full(1, 2))
        self.assertAlmostEqual(mean[0], 187.5, delta=0.5)


class Q9Q10Test(unittest.TestCase):
    def test_monotonic(self):
        self.assertTrue(metrics.q9_monotonic([1, 2, 3.5]).passed)
        self.assertFalse(metrics.q9_monotonic([1, 2, 2]).passed)
        self.assertFalse(metrics.q9_monotonic([1, 2, 2.5], min_step=1).passed)
        with self.assertRaises(ValueError):
            metrics.q9_monotonic([1])

    def test_effect_strength(self):
        img = photo()
        self.assertEqual(metrics.effect_strength(img, img), 0.0)
        weak, strong = composite.exposure(img, 0.2), composite.exposure(img, 0.6)
        self.assertLess(metrics.effect_strength(img, weak), metrics.effect_strength(img, strong))
        self.assertEqual(metrics.effect_strength(img, strong, masks.empty(40, 40)), 0.0)

    def test_texture_kept(self):
        img = photo()
        skin = masks.full(40, 40)
        self.assertTrue(metrics.q10_texture_kept(img, img, skin).passed)
        smooth = np.rint(np.stack([masks.blur(img[..., c] / 255, 3) * 255 for c in range(3)], -1)).astype(np.uint8)
        check = metrics.q10_texture_kept(img, smooth, skin)
        self.assertFalse(check.passed)
        self.assertLess(check.measured["ratio"], 0.35)
        flat = np.full((20, 20, 3), 128, np.uint8)
        no_texture = metrics.q10_texture_kept(flat, flat, masks.full(20, 20))
        self.assertTrue(no_texture.passed)
        self.assertIsNone(no_texture.measured["ratio"])


class ReportTest(unittest.TestCase):
    def sample(self, **overrides):
        checks = [metrics.q9_monotonic([1, 2]), metrics.q9_monotonic([2, 1])]
        photos = [report.PhotoResult("p1", True, checks[:1], "natural"), report.PhotoResult("p2", True, checks[1:])]
        built = report.build_report("tint", "1.0.0", photos, created="2026-10-22")
        built.update(overrides)
        return built

    def test_build_and_summary(self):
        r = self.sample()
        self.assertEqual(r["format"], "beljour-quality/1")
        self.assertEqual(r["summary"], {"checks": 2, "passed": 1, "failed": 1, "passed_all": False,
                                        "by_code": {"Q9": {"passed": 1, "failed": 1}}})
        self.assertTrue(r["synthetic"])
        self.assertEqual(report.validate_report(json.loads(json.dumps(r))), [])

    def test_validation_catches_problems(self):
        cases = {"format": "other/1", "tool": "Tint Tool", "tool_version": "1.0", "language": "go",
                 "created": "22 Oct", "synthetic": False}
        for key, value in cases.items():
            with self.subTest(key=key):
                self.assertTrue(report.validate_report(self.sample(**{key: value})))
        r = self.sample()
        r["photos"][0]["checks"][0]["name"] = "Something else"
        self.assertIn("name must be", " ".join(report.validate_report(r)))
        r = self.sample()
        r["summary"]["passed"] = 2
        self.assertIn("summary does not match the checks", report.validate_report(r))
        self.assertTrue(report.validate_report(self.sample(photos=[])))
        self.assertEqual(report.validate_report([]), ["a report must be a JSON object"])

    def test_markdown_and_write(self):
        r = self.sample()
        md = report.to_markdown(r)
        self.assertIn("1 of 2 checks passed on synthetic photos only.", md)
        self.assertIn("| p2 |  | Q9 Monotonic strength | FAIL |", md)
        with tempfile.TemporaryDirectory() as tmp:
            json_path, md_path = report.write(r, Path(tmp))
            self.assertEqual(json.loads(json_path.read_text())["tool"], "tint")
            self.assertTrue(md_path.read_text().startswith("### tint 1.0.0"))
            with self.assertRaises(ValueError):
                report.write({"format": "nope"}, Path(tmp))


class HarnessTest(unittest.TestCase):
    def test_synthetic_photo_is_deterministic(self):
        a, b = harness.synthetic_photo(3), harness.synthetic_photo(3)
        np.testing.assert_array_equal(a.image, b.image)
        self.assertEqual(set(a.masks), {"selection", "skin"})
        self.assertTrue(a.synthetic)

    def test_hash_noise_is_fixed(self):
        noise = harness.hash_noise(3, 4, 5)
        self.assertEqual(noise.shape, (4, 5))
        self.assertTrue(np.all((noise >= -0.5) & (noise < 0.5)))
        np.testing.assert_array_equal(noise, harness.hash_noise(3, 4, 5))
        self.assertFalse(np.array_equal(noise, harness.hash_noise(4, 4, 5)))
        # pinned values; web/test/harness.test.mjs pins the same numbers for the TypeScript port
        pinned = [[0.23478565004496854, -0.26606375537124016, 0.400069951034276],
                  [-0.12856000799440392, -0.34310982312381333, -0.4513340661536924]]
        np.testing.assert_array_equal(harness.hash_noise(1, 2, 3), pinned)

    def test_texture_thresholds(self):
        self.assertEqual(harness.texture_minimum(0, 3), 0.60)
        self.assertEqual(harness.texture_minimum(2, 3), 0.35)
        self.assertAlmostEqual(harness.texture_minimum(1, 3), 0.475)
        self.assertEqual(harness.texture_minimum(0, 1), 0.60)

    def test_tint_report(self):
        photos = [harness.synthetic_photo(1), harness.synthetic_photo(2)]
        stops = [harness.StopSpec("natural", {"rgb": [180, 40, 60], "strength": 0.3}),
                 harness.StopSpec("full", {"rgb": [180, 40, 60], "strength": 1.0}, target="#B4283C")]
        result = harness.run("tint", "1.0.0", TintEngine(), photos, stops, created="2026-10-22")
        r = result.report
        self.assertEqual(report.validate_report(r), [])
        codes = [c.code for _, _, c in result.checks]
        self.assertEqual(codes.count("Q1"), 4)
        self.assertEqual(codes.count("Q6"), 2)
        self.assertEqual(codes.count("Q9"), 2)
        for _, _, c in result.checks:
            if c.code in ("Q1", "Q5", "Q6", "Q9"):
                self.assertTrue(c.passed, c.to_json())

    def test_extra_checks_and_errors(self):
        p = harness.synthetic_photo(4)
        mx, my = resample.identity(*p.image.shape[:2])
        result = harness.run("exposure", "1.0.0", ExposureEngine(), [p],
                             [harness.StopSpec("natural", {"stops": 0.2})], skin="skin",
                             extra={p.photo: [metrics.q3_fold_free(mx, my)]}, created="2026-10-22")
        self.assertIn("Q3", result.report["summary"]["by_code"])
        self.assertIn("Q10", result.report["summary"]["by_code"])
        with self.assertRaises(ValueError):
            harness.run("exposure", "1.0.0", ExposureEngine(), [], [harness.StopSpec("a", {})])

    def test_leaky_engine_fails_q1(self):
        class Leaky:
            version = "0.0.1"

            def run(self, image, landmarks, masks_in, params, seed):
                out = image.copy()
                out[0, 0] = 255 - out[0, 0]
                edit = np.ones(image.shape[:2], np.float32)          # honest edit mask, so run_engine accepts it
                return EngineResult(out, edit, {}, "local", self.version)

        p = harness.synthetic_photo(5)
        checks = harness.score_photo(Leaky(), p, [harness.StopSpec("only", {})])[0][1]
        q1 = next(c for c in checks if c.code == "Q1")
        self.assertTrue(q1.passed, "Q1 measures against the engine's own declared mask")
        strict = metrics.q1_outside_mask(p.image, Leaky().run(p.image, None, {}, {}, 0).image, p.masks["selection"])
        self.assertFalse(strict.passed, "against the selection, the corner change is caught")


if __name__ == "__main__":
    unittest.main()
