"""api/scripts/instrument_panel.py: the committed panel is current, nothing unmeasured shows as a
number, made-up arena results move the gates and slices, and a changed engine makes its cost
run STALE. Every results file here is made up. Author: John Khan.
"""
import copy
import importlib.util
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

from plumb_api.arena import constants as C
from plumb_api.metering import meter

API = Path(__file__).resolve().parents[1]
REPO = API.parent
_spec = importlib.util.spec_from_file_location("instrument_panel_under_test", API / "scripts" / "instrument_panel.py")
assert _spec is not None and _spec.loader is not None
panel = importlib.util.module_from_spec(_spec)
sys.modules[_spec.name] = panel
_spec.loader.exec_module(panel)


def results_file(folder: Path, *, n: int = 25, rate: float = 0.6, thin: str | None = None) -> Path:
    """A made-up arena results file with every gate slice judged n times at `rate`."""
    rows = {"all": {"n": n * 14, "rate": rate}}
    for key in panel.gate_slices():
        rows[key] = {"n": 5 if key == thin else n, "rate": rate}
    view = {f: {"matchups": {"ours-x|baseline": copy.deepcopy(rows)}} for f in ("old", "young", "gender_swap")}
    path = folder / "results-made-up.json"
    path.write_text(json.dumps({"ours": "ours-x", "baseline": "baseline", "views": {"human": view}}))
    return path


def mini_root(tmp: Path, *, with_run: bool = True) -> Path:
    """The panel's inputs, the probes' engine sources and (optionally) the committed cost run."""
    files = [panel.FEATURES, panel.PROOF_WALL, panel.CERTIFICATE, panel.PRICES]
    files += sorted({Path(s) for probe in meter.PROBES for s in probe.sources})
    if with_run:
        files.append(panel.RUN_PATH)
    for rel in files:
        (tmp / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(REPO / rel, tmp / rel)
    return tmp


class ThisRepoTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc, cls.outputs = panel.render(REPO)

    def test_committed_panel_is_current(self):
        for rel, text in self.outputs.items():
            self.assertEqual((REPO / rel).read_text(), text, f"{rel} is stale: run make instrument-panel")
        self.assertEqual(panel.main(["--root", str(REPO), "--check"]), 0)

    def test_without_results_every_gate_and_slice_is_not_run(self):
        self.assertEqual([h["status"] for h in self.doc["quality"]["heroes"]], [panel.NOT_RUN] * 3)
        self.assertEqual(self.doc["slices"]["cells"], 3 * (len(C.FAIRFACE_RACES) + len(C.FAIRFACE_GENDERS) + len(C.ADULT_BANDS)))
        self.assertEqual(self.doc["slices"]["cells_at_minimum"], panel.NOT_RUN)
        self.assertTrue(all(v == panel.NOT_RUN for r in self.doc["slices"]["rows"] for v in r["judgements"].values()))
        self.assertNotIn("None", self.outputs[panel.MD_PATH])

    def test_side_by_side_sections_come_from_their_instruments(self):
        wall = json.loads((REPO / panel.PROOF_WALL).read_text())
        cert = json.loads((REPO / panel.CERTIFICATE).read_text())
        self.assertEqual(self.doc["proof_wall"]["passes"], wall["summary"]["passes"])
        self.assertEqual(sum(t["evaluated"] for t in self.doc["proof_wall"]["tones"].values()), wall["summary"]["evaluated"])
        self.assertEqual(self.doc["licences"]["open_items"], cert["verdict"]["open_items"])
        self.assertEqual(self.doc["licences"]["current"], "yes")
        local = self.doc["costs"]["local"]
        self.assertEqual([r["id"] for r in local], [p.id for p in meter.PROBES])
        self.assertTrue(all(r["browser_ms"] == panel.NOT_RUN for r in local))
        self.assertEqual(self.doc["costs"]["caps"]["live_spend"], panel.NOT_RUN)
        names = [i["instrument"] for i in self.doc["instruments"]]
        for name in ("Arena hero gates", "Proof Wall", "YouCam unit caps", "Cost-per-edit meter", "Licence certificate"):
            self.assertTrue(any(n.startswith(name) for n in names), name)


class MiniRootTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp)

    def test_results_drive_gates_and_slice_coverage(self):
        root = mini_root(self.tmp)
        doc = panel.Panel(root, [results_file(self.tmp)]).build()
        self.assertEqual([h["status"] for h in doc["quality"]["heroes"]], ["PASS"] * 3)
        self.assertEqual(doc["slices"]["cells_at_minimum"], doc["slices"]["cells"])
        doc = panel.Panel(root, [results_file(self.tmp, rate=0.4)]).build()
        self.assertEqual({h["status"] for h in doc["quality"]["heroes"]}, {"FAIL"})
        doc = panel.Panel(root, [results_file(self.tmp, thin="race:Indian")]).build()
        self.assertEqual({h["status"] for h in doc["quality"]["heroes"]}, {"UNTESTED"})
        row = next(r for r in doc["slices"]["rows"] if r["slice"] == "race:Indian")
        self.assertEqual(set(row["judgements"].values()), {5})
        self.assertEqual(doc["slices"]["cells_at_minimum"], doc["slices"]["cells"] - 3)

    def test_measured_run_then_stale_after_an_engine_edit(self):
        root = mini_root(self.tmp)
        rows = {r["id"]: r for r in panel.Panel(root).build()["costs"]["local"]}
        self.assertEqual({r["status"] for r in rows.values()}, {panel.MEASURED})
        self.assertIsInstance(rows["part-nose"]["server_cad_per_1000_edits"], float)
        engine = root / "api/plumb_api/engines/shape/parts.py"
        engine.write_text(engine.read_text() + "\n# edited\n")
        rows = {r["id"]: r for r in panel.Panel(root).build()["costs"]["local"]}
        for probe in ("part-nose", "part-lips", "part-eyes"):
            self.assertEqual(rows[probe]["status"], panel.STALE)
            self.assertEqual(rows[probe]["warm_p50_ms"], panel.NOT_RUN)
            self.assertEqual(rows[probe]["server_cad_per_edit"], panel.NOT_RUN)
        self.assertEqual(rows["skin-tan"]["status"], panel.MEASURED)
        engine.unlink()
        self.assertEqual({r["id"]: r for r in panel.Panel(root).build()["costs"]["local"]}["part-eyes"]["status"], panel.STALE)

    def test_failed_probe_and_missing_run_show_no_numbers(self):
        root = mini_root(self.tmp)
        run = json.loads((root / panel.RUN_PATH).read_text())
        run["probes"][0] = {**{k: run["probes"][0][k] for k in ("id", "label", "features", "sources", "source_sha256")},
                            "status": "failed", "error": "RuntimeError: refused"}
        (root / panel.RUN_PATH).write_text(json.dumps(run))
        first = panel.Panel(root).build()["costs"]["local"][0]
        self.assertEqual((first["status"], first["cold_ms"]), ("FAILED", panel.NOT_RUN))
        (root / panel.RUN_PATH).unlink()
        doc = panel.Panel(root).build()
        self.assertEqual(doc["costs"]["run"], {"status": panel.NOT_RUN})
        self.assertEqual({r["status"] for r in doc["costs"]["local"]}, {panel.NOT_RUN})
        self.assertEqual(doc["licences"]["current"], panel.NOT_RUN)   # no certificate script in this root

    def test_unset_price_and_missing_instruments(self):
        root = mini_root(self.tmp)
        prices = json.loads((root / panel.PRICES).read_text())
        prices["prices"]["youcam_unit"]["cad"] = None
        (root / panel.PRICES).write_text(json.dumps(prices))
        (root / panel.PROOF_WALL).unlink()
        (root / panel.CERTIFICATE).unlink()
        doc, outputs = panel.render(root)
        self.assertEqual({r["cad_per_edit"] for r in doc["costs"]["provider"]}, {panel.NOT_SET})
        self.assertEqual(doc["proof_wall"]["status"], panel.NOT_RUN)
        self.assertEqual(doc["licences"]["status"], panel.NOT_RUN)
        self.assertIn("NOT_SET", outputs[panel.MD_PATH])

    def test_check_mode_follows_the_files_and_the_results(self):
        root = mini_root(self.tmp)
        self.assertEqual(panel.main(["--root", str(root), "--check"]), 1)
        self.assertEqual(panel.main(["--root", str(root)]), 0)
        self.assertEqual(panel.main(["--root", str(root), "--check"]), 0)
        results = str(results_file(self.tmp))
        self.assertEqual(panel.main(["--root", str(root), "--check", "--results", results]), 1)
        md = root / panel.MD_PATH
        self.assertEqual(panel.main(["--root", str(root), "--results", results]), 0)
        self.assertIn("PASS", md.read_text())
        md.write_text(md.read_text() + "edited\n")
        self.assertEqual(panel.main(["--root", str(root), "--check", "--results", results]), 1)


if __name__ == "__main__":
    unittest.main()
