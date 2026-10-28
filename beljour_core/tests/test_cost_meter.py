"""Cost-per-edit meter (plumb_api.metering): measured local compute, enforced provider units and
ASSUMED prices stay apart, and nothing unmeasured turns into a number. Code-drawn inputs only.
Author: John Khan.
"""
import copy
import json
import tempfile
import unittest
from pathlib import Path

from plumb_api.config import Settings
from plumb_api.metering import meter

CAPS = {"session_cap_public": Settings.session_cap_public, "session_cap_judge": Settings.session_cap_judge,
        "daily_unit_cap": Settings.daily_unit_cap}


class MeasureTest(unittest.TestCase):
    def test_quantile_interpolates_sorted_samples(self):
        self.assertEqual(meter.quantile([3.0, 1.0, 2.0], 0.5), 2.0)
        self.assertAlmostEqual(meter.quantile([0.0, 10.0], 0.95), 9.5)
        with self.assertRaises(ValueError):
            meter.quantile([], 0.5)

    def test_measure_reports_cold_warm_cpu_and_heap(self):
        calls = []

        def edit():
            calls.append(1)
            return bytearray(256 * 1024)
        row = meter.measure(edit, repeats=3)
        self.assertEqual(len(calls), 1 + 3 + 1)    # cold, warm, traced
        self.assertEqual(row["warm_samples"], 3)
        self.assertGreaterEqual(row["peak_heap_kib"], 256)
        self.assertLessEqual(row["warm_p50_ms"], row["warm_p95_ms"])
        with self.assertRaises(ValueError):
            meter.measure(edit, repeats=0)

    def test_every_probe_measures_a_real_edit(self):
        record = meter.run(repeats=1)
        self.assertEqual(record["format"], meter.RUN_FORMAT)
        for row in record["probes"]:
            self.assertEqual(row["status"], "measured", row)
            self.assertGreater(row["pixels"], 0)
            self.assertGreater(row["warm_cpu_p50_ms"], 0)
            self.assertEqual(row["source_sha256"], meter.source_digest(row["sources"]))

    def test_a_failing_or_refusing_engine_is_recorded_not_timed(self):
        def broken():
            raise RuntimeError("refused the drawn face: no_face")
        probe = meter.Probe("broken", "Broken", (), ("api/plumb_api/metering/meter.py",), broken)
        row = meter.run([probe], repeats=1)["probes"][0]
        self.assertEqual(row["status"], "failed")
        self.assertIn("no_face", row["error"])
        self.assertNotIn("warm_p50_ms", row)

    def test_source_digest_follows_the_engine_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "a.py").write_text("x = 1\n")
            before = meter.source_digest(["a.py"], root)
            (root / "a.py").write_text("x = 2\n")
            self.assertNotEqual(before, meter.source_digest(["a.py"], root))


class PriceTest(unittest.TestCase):
    def setUp(self):
        self.prices = meter.read_prices()

    def test_repo_table_is_cad_and_every_price_is_assumed(self):
        self.assertEqual(self.prices["currency"], "CAD")
        self.assertTrue(self.prices["prices"])
        self.assertTrue(all(e["basis"] == "ASSUMED" for e in self.prices["prices"].values()))

    def test_bad_tables_are_refused(self):
        for key, value in (("basis", "invoice"), ("cad", -1), ("cad", True), ("cad", "0.1")):
            data = copy.deepcopy(self.prices)
            data["prices"]["youcam_unit"][key] = value
            with tempfile.TemporaryDirectory() as tmp:
                path = Path(tmp) / "prices.json"
                path.write_text(json.dumps(data))
                with self.assertRaises(ValueError, msg=(key, value)):
                    meter.read_prices(path)

    def test_money_never_invents(self):
        self.assertEqual(meter.money(None, 0.1), meter.NOT_RUN)
        self.assertEqual(meter.money(3, None), meter.NOT_SET)
        self.assertAlmostEqual(meter.money(3, 0.1), 0.3)

    def test_compute_cost_needs_a_measured_row(self):
        measured = {"status": "measured", "warm_cpu_p50_ms": 360.0}
        rate = meter.price(self.prices, "server_cpu_hour")
        self.assertAlmostEqual(meter.compute_cost(measured, self.prices)["server_cad_per_edit"], 360.0 / 3_600_000 * rate)
        for row in (None, {"status": "failed"}):
            cost = meter.compute_cost(row, self.prices)
            self.assertEqual(cost["server_cad_per_edit"], meter.NOT_RUN)
        self.assertEqual(meter.compute_cost(measured, self.prices)["browser_ms"], meter.NOT_RUN)
        unset = copy.deepcopy(self.prices)
        unset["prices"]["server_cpu_hour"]["cad"] = None
        self.assertEqual(meter.compute_cost(measured, unset)["server_cad_per_edit"], meter.NOT_SET)


class ProviderUnitsTest(unittest.TestCase):
    def setUp(self):
        self.prices = meter.read_prices()
        self.rows = {r["action"]: r for r in meter.provider_rows(self.prices, **CAPS)}

    def test_units_come_from_the_enforced_table_and_caps(self):
        makeup = self.rows["makeup"]
        self.assertEqual((makeup["feature"], makeup["units_per_edit"], makeup["units_if_cached"]), ("makeup-vto", 1, 0))
        self.assertEqual(makeup["edits_per_public_session"], Settings.session_cap_public)
        self.assertEqual(makeup["payload_shape"], "confirmed")
        self.assertAlmostEqual(makeup["cad_per_edit"], meter.price(self.prices, "youcam_unit"))
        self.assertEqual(self.rows["hair-transfer"]["units_per_edit"], 3)
        self.assertEqual(self.rows["hair-transfer"]["unit_price_on_file"], "unconfirmed")
        self.assertEqual(self.rows["hair-transfer"]["payload_shape"], "ASSUMED")
        self.assertTrue(all(r["server_compute"] == meter.NOT_RUN for r in self.rows.values()))

    def test_skin_match_does_not_fit_a_public_visit(self):
        skin = self.rows["skin-match"]
        self.assertEqual(skin["units_per_edit"], 9)            # four SD concerns
        self.assertEqual(skin["edits_per_public_session"], 0)  # so a public visit gets the local estimate
        self.assertEqual(skin["edits_per_judge_session"], Settings.session_cap_judge // 9)

    def test_skin_match_constants_are_read_from_the_service_source(self):
        self.assertEqual(meter.module_constant(meter.SKIN_MATCH, "FEATURE"), "skin-analysis")
        with self.assertRaises(KeyError):
            meter.module_constant(meter.SKIN_MATCH, "NO_SUCH_NAME")

    def test_unset_unit_price_shows_not_set(self):
        unset = copy.deepcopy(self.prices)
        unset["prices"]["youcam_unit"]["cad"] = None
        rows = meter.provider_rows(unset, **CAPS)
        self.assertTrue(all(r["cad_per_edit"] == meter.NOT_SET for r in rows))


if __name__ == "__main__":
    unittest.main()
