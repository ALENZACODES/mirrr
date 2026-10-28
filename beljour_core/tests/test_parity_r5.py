"""R5 parity vectors and the warp/fill quality harness: format, freshness, kernel registry
match with TypeScript, Q12 behaviour and the stored Python reports.
The TypeScript half is web/test/parity-r5.test.mjs.
Author: John Khan.
"""
import json
import re
import unittest
from pathlib import Path

import numpy as np

from plumb_api.engines.warp import falloff
from plumb_api.engines.warp import field as fields
from plumb_api.engines.warp.engine import build_field
from plumb_api.quality import metrics, warp_parity, report, warpfill

ROOT = Path(__file__).resolve().parents[2]
VECTORS = ROOT / "parity" / "warp-fill-r5.json"
REPORTS = ROOT / "parity" / "warpfill-report-python.json"
TS_PARITY = ROOT / "web" / "src" / "quality" / "warp-parity.ts"


class ParityR5Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc = json.loads(VECTORS.read_text())

    def test_format_count_and_coverage(self):
        self.assertEqual(warp_parity.validate(self.doc), [])
        self.assertGreaterEqual(len(self.doc["vectors"]), warp_parity.MIN_VECTORS)
        used = {v["kernel"] for v in self.doc["vectors"]}
        self.assertEqual(used, set(warp_parity.KERNELS))
        for name in warp_parity.KERNELS:
            self.assertGreaterEqual(sum(v["kernel"] == name for v in self.doc["vectors"]), 1, name)

    def test_stored_expectations_are_current(self):
        worst = max(warp_parity.compare(self.doc), key=lambda item: item[1])
        self.assertLess(worst[1], 1e-8, worst)

    def test_typescript_registers_the_same_kernels(self):
        names = set(re.findall(r'^\s*"([a-z0-9_]+\.[a-z0-9_]+)":', TS_PARITY.read_text(), re.M))
        self.assertEqual(names, set(warp_parity.KERNELS))

    def test_validate_rejects_bad_documents(self):
        self.assertTrue(warp_parity.validate({"format": "x"}))
        dup = dict(self.doc, vectors=self.doc["vectors"][:1] * 2)
        self.assertTrue(any("duplicate" in p for p in warp_parity.validate(dup)))
        with self.assertRaises(KeyError):
            warp_parity.evaluate({"kernel": "warp.nope", "args": {}})


class Q12Test(unittest.TestCase):
    def setUp(self):
        self.grid = warpfill.grid_scene(40, 48, 8, 4, 1)

    def test_straight_grid_passes_with_zero_deviation(self):
        check = metrics.q12_straight_lines(self.grid, None, spacing=8, offset=4)
        self.assertTrue(check.passed)
        self.assertLess(check.measured["max_deviation"], 1e-3)
        self.assertEqual(check.measured["lines_checked"], 5 + 6)
        self.assertEqual(check.to_json()["name"], "Straight lines kept")

    def test_bent_line_fails_and_a_band_hides_it(self):
        bent = self.grid.copy()
        bent[16:24, 12:28] = np.roll(bent[16:24, 12:28], 2, axis=0)
        self.assertFalse(metrics.q12_straight_lines(bent, None, spacing=8, offset=4).passed)
        band = np.zeros((40, 48), np.float32)
        band[10:30, 8:32] = 1
        self.assertTrue(metrics.q12_straight_lines(bent, band, spacing=8, offset=4).passed)

    def test_no_line_outside_the_band_is_no_evidence(self):
        check = metrics.q12_straight_lines(self.grid, np.ones((40, 48), np.float32), spacing=8, offset=4)
        self.assertFalse(check.passed)
        self.assertEqual(check.measured["lines_checked"], 0)

    def test_grid_lines_validation(self):
        self.assertEqual(metrics.grid_lines(20, 8, 4), [4, 12])
        with self.assertRaises(ValueError):
            metrics.grid_lines(20, 1, 0)
        with self.assertRaises(ValueError):
            metrics.grid_lines(20, 8, 0, thickness=8)


class WarpFillHarnessTest(unittest.TestCase):
    def test_every_scenario_passes(self):
        for scenario in warpfill.run_warp() + warpfill.run_fill():
            for check in scenario.checks:
                self.assertTrue(check.passed, (scenario.id, check.code, check.measured))

    def test_unbanded_warp_bends_the_background_grid(self):
        """Negative control: without the band falloff the same move breaks Q12 and Q1."""
        image, _, band = warpfill.body_scene()
        full = build_field(warpfill.HEIGHT, warpfill.WIDTH, "tps", np.array(warpfill.WARP_FROM) * [1, 1],
                           np.array([[25.0, 30.0], [39.0, 30.0], [32.0, 13.0], [32.0, 47.0]]))
        after = fields.apply(image, full)
        self.assertFalse(metrics.q1_outside_mask(image, after, band).passed)
        banded = fields.apply(image, fields.weighted(full, falloff.band_weights(band, 5)))
        self.assertTrue(metrics.q1_outside_mask(image, banded, band).passed)

    def test_body_scene_and_band(self):
        image, body, band = warpfill.body_scene(2)
        self.assertEqual(image.shape, (warpfill.HEIGHT, warpfill.WIDTH, 3))
        self.assertTrue(np.all(band[body > 0] == 1))
        self.assertGreater(band.sum(), (body > 0).sum())

    def test_stored_python_reports_are_current_and_valid(self):
        stored = json.loads(REPORTS.read_text())
        fresh = warpfill.reports()
        for tool in ("warp", "fill"):
            self.assertEqual(report.validate_report(stored[tool]), [])
            self.assertEqual(stored[tool]["summary"], fresh[tool]["summary"])
            self.assertEqual(stored[tool]["summary"]["failed"], 0)
            self.assertEqual(metrics.max_abs_difference(
                [[c["measured"].get("max_deviation") for c in p["checks"] if c["code"] == "Q12"] for p in stored[tool]["photos"]],
                [[c["measured"].get("max_deviation") for c in p["checks"] if c["code"] == "Q12"] for p in fresh[tool]["photos"]]), 0.0)


if __name__ == "__main__":
    unittest.main()
