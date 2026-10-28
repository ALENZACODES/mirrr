"""Spikes S1 to S6 run end to end on the committed cassettes and drawn images."""
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from plumb_api.providers.replay import Cassette
from lab.python.beljour_lab import CASSETTES, SpikeReport, write_reports
from lab.python.beljour_lab.smoke_local import STOPS, s5_face_stops, s6_fibre_cover, stop_moves
from lab.python.beljour_lab.runner import main
from lab.python.beljour_lab.youcam_spikes import hair_focus, template_id, template_text

import numpy as np


class RunnerTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.out = Path(self.tmp.name)
        self.lines: list[str] = []

    def tearDown(self):
        self.tmp.cleanup()

    def run_main(self, *args):
        return main(["--out", str(self.out), *args], out=self.lines.append)

    def test_all_six_replay_and_report(self):
        self.assertEqual(self.run_main(), 0)
        summary = (self.out / "SPIKES.md").read_text()
        for n in ("S1", "S2", "S3", "S4", "S5", "S6"):
            report = json.loads((self.out / f"{n.lower()}.json").read_text())
            self.assertTrue(report["go"], n)
            self.assertTrue(report["synthetic"], n)     # nothing real has been recorded yet
            self.assertEqual(report["units"], 0, n)     # replay and local spend nothing
            self.assertIn(n, summary)
        s1 = json.loads((self.out / "s1.json").read_text())
        self.assertEqual(s1["measurements"]["template_count"], 12)
        self.assertGreaterEqual(len(s1["measurements"]["short_sides"]), 3)
        s3 = json.loads((self.out / "s3.json").read_text())
        self.assertEqual(s3["measurements"]["units_if_live"], 2)
        self.assertTrue((self.out / "images" / "s6-full.png").exists())
        self.assertTrue(any("synthetic" in line for line in self.lines))

    def test_live_needs_a_key(self):
        with mock.patch.dict(os.environ, {"YOUCAM_API_KEY": ""}):
            self.assertEqual(self.run_main("--only", "S2", "--live", "--spend", "5"), 2)
        self.assertIn("needs YOUCAM_API_KEY", self.lines[-1])

    def test_live_needs_a_spend_limit_that_covers_the_estimate(self):
        with mock.patch.dict(os.environ, {"YOUCAM_API_KEY": "not-used-because-refused"}):
            self.assertEqual(self.run_main("--only", "S2,S3", "--live", "--spend", "1"), 2)
        self.assertIn("estimated at 4 units", self.lines[-1])

    def test_bad_arguments(self):
        self.assertEqual(self.run_main("--only", "S9"), 2)
        self.assertEqual(self.run_main("--only", "S1", "--record"), 2)

    def test_missing_cassette_is_skipped(self):
        self.assertEqual(self.run_main("--only", "S1", "--cassettes", str(self.out / "none")), 0)
        self.assertTrue(any("skipped" in line for line in self.lines))

    def test_committed_cassettes_are_marked_synthetic(self):
        for path in CASSETTES.glob("*.json"):
            self.assertTrue(Cassette.load(path).synthetic, path.name)


class LocalSpikeTest(unittest.TestCase):
    def test_s5_reach_grows_with_the_stop(self):
        report = s5_face_stops()
        rows = {r["stop"]: r for r in report.measurements["stops"]}
        self.assertLess(rows["Normal masculine"]["max_move_share"], rows["Extra masculine"]["max_move_share"])
        self.assertLess(rows["Extra masculine"]["max_move_share"], rows["Hyper masculine"]["max_move_share"])
        self.assertGreater(rows["Normal feminine"]["min_jacobian"], rows["Hyper feminine"]["min_jacobian"])
        self.assertEqual(len(STOPS), 7)

    def test_stop_moves_mirror_each_other(self):
        src, masc = stop_moves(1.0)
        _, fem = stop_moves(-1.0)
        np.testing.assert_allclose(masc - src, -(fem - src))
        np.testing.assert_allclose(stop_moves(0.0)[1], src)

    def test_s6_report(self):
        report = s6_fibre_cover()
        self.assertTrue(report.go)
        self.assertEqual(len(report.measurements["shade_matches"]), 3)


class HelpersTest(unittest.TestCase):
    def test_hair_focus(self):
        mask = np.zeros((100, 10), bool)
        mask[:40] = True
        self.assertEqual(hair_focus(mask), float("inf"))
        mask[90:] = True
        self.assertAlmostEqual(hair_focus(mask), 1.0 / 0.4)
        self.assertEqual(hair_focus(np.zeros((100, 10), bool)), 0.0)

    def test_template_fields(self):
        self.assertEqual(template_id({"id": "tpl-1"}), "tpl-1")
        self.assertEqual(template_id({"template_id": "a", "id": "b"}), "a")
        self.assertIsNone(template_id({"id": "../bad"}))
        self.assertIn("low fade", template_text({"title": "Low Fade"}))

    def test_report_markdown_and_verdict(self):
        r = SpikeReport("SX", "Example", "local", synthetic=False)
        self.assertFalse(r.go)          # no gates, no go
        r.gate("one", True, 1, "== 1")
        self.assertTrue(r.go)
        r.gate("two", False, 0, "== 1")
        self.assertFalse(r.go)
        md = r.to_markdown()
        self.assertIn("NO-GO", md)
        self.assertIn("| two | 0 | == 1 | no |", md)
        with tempfile.TemporaryDirectory() as tmp:
            summary = write_reports([r.finish()], Path(tmp))
            self.assertIn("SX", summary.read_text())


if __name__ == "__main__":
    unittest.main()
