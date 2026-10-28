"""The SYNTHETIC arena dry run end to end through scripts/arena.py, and the judge-session check
on its run: drawn faces, stand-in reference outputs and scripted judges only. Nothing here is a
result, and every guard that keeps it from being counted is exercised. Author: John Khan.
"""
from __future__ import annotations

import contextlib
import importlib.util
import io
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "scripts"))
import arena as cli  # noqa: E402

from plumb_api.arena import constants as C  # noqa: E402
from plumb_api.arena import dry_run, intake, session_check  # noqa: E402

_spec = importlib.util.spec_from_file_location("panel_for_dry_run", HERE.parent / "scripts" / "instrument_panel.py")
assert _spec is not None and _spec.loader is not None
panel = importlib.util.module_from_spec(_spec)
sys.modules[_spec.name] = panel
_spec.loader.exec_module(panel)


def run(*args: str) -> tuple[int, str]:
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        try:
            code = cli.main(list(args))
        except SystemExit as exc:
            print(exc)
            code = 2
    return code, out.getvalue()


class DryRunTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = Path(tempfile.mkdtemp(prefix="arena-dry-"))
        cls.root = cls.tmp / "dry"
        cls.f = ["--faces", str(cls.root)]
        cls.code, cls.out = run(*cls.f, "dry-run", "--filters", "old", "--quick", "--sfhq", "3", "--adversarial", "3",
                                "--judgements", "3")
        cls.results = cls.root / C.ARENA_DIR / "results" / "results-dry-gate.json"

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def test_every_step_behaves_as_a_real_run_would(self):
        self.assertEqual(self.code, 0, self.out)
        self.assertNotIn("BAD ", self.out)
        self.assertIn("capture intake: READY (SYNTHETIC dry-run capture)", self.out)
        self.assertTrue(intake.is_synthetic_root(self.root))

    def test_results_are_stamped_and_the_gate_says_synthetic(self):
        data = json.loads(self.results.read_text())
        self.assertEqual(data["synthetic"]["label"], dry_run.LABEL)
        self.assertGreater(data["judges"]["human_judgements"], 0)   # scripted judges take the human path
        code, out = run(*self.f, "gate", "--results", str(self.results))
        self.assertEqual(code, 3)
        self.assertIn("SYNTHETIC Older", out)

    def test_synthetic_results_are_refused_everywhere_else(self):
        res = str(self.results)
        for args in (("report", "--results", res), ("regression", "--current", res),
                     ("kill-fix", "--results", res, "--filter", "old", "--reason", "Too Weak"),
                     ("registry", "--results", res, "--json", str(self.tmp / "rows.json"))):
            code, out = run(*self.f, *args)
            self.assertEqual(code, 2, args)
            self.assertIn("SYNTHETIC dry-run results file", out)

    def test_instrument_panel_keeps_real_numbers_not_run(self):
        doc = panel.Panel(panel.REPO, [self.results]).build()
        self.assertEqual({h["status"] for h in doc["quality"]["heroes"]}, {panel.NOT_RUN})
        self.assertEqual(doc["slices"]["cells_at_minimum"], panel.NOT_RUN)
        self.assertEqual([r["path"] for r in doc["refused_results_files"]], [self.results.name])

    def test_session_check_on_the_dry_run(self):
        rep = session_check.check_run(self.root, "dry-gate")
        self.assertTrue(rep["synthetic"])
        self.assertEqual(rep["blinding"]["status"], "OK", rep["blinding"])
        self.assertEqual(rep["order"]["status"], "OK", rep["order"])
        quotas = rep["quotas"]["filters"]["old"]
        self.assertEqual(rep["quotas"]["status"], "SHORT")           # one face per adversarial tag x 3
        self.assertTrue(any(k.startswith("adv:") for k in quotas["short"]))
        self.assertFalse([k for k in quotas["short"] if k.split(":")[0] in ("race", "gender", "age")])
        self.assertEqual(rep["judgements"]["model"], 0)
        gate = rep["gate"]["old"]
        self.assertEqual(gate["overall"]["n"], quotas["planned"])
        self.assertEqual(gate["rule"], "UNTESTED")                    # thin slices can't PASS
        self.assertIn("SYNTHETIC UNTESTED", session_check.text(rep))
        self.assertEqual(rep["gate"]["young"]["rule"], "UNTESTED")   # not judged at all
        code, _ = run(*self.f, "check-session", "--run", "dry-gate")
        self.assertEqual(code, 1)

    def copy_run(self, name):
        runs = self.root / C.ARENA_DIR / "runs"
        shutil.rmtree(runs / name, ignore_errors=True)
        shutil.copytree(runs / "dry-gate", runs / name)
        return runs / name

    def test_session_check_catches_leaks_order_and_side_bias(self):
        folder = self.copy_run("tamper")
        manifest = next((folder / "bundles").glob("*/manifest.json"))
        data = json.loads(manifest.read_text())
        data["assignments"].sort(key=lambda a: a["id"])
        data["question"] += " ours-dry"
        manifest.write_text(json.dumps(data))
        key = json.loads((folder / "key.json").read_text())
        for row in key["assignments"]:
            if "ours-dry" in (row["a"], row["b"]):
                row["a"], row["b"] = "ours-dry", row["b"] if row["a"] == "ours-dry" else row["a"]
        (folder / "key.json").write_text(json.dumps(key))
        rep = session_check.check_run(self.root, "tamper")
        self.assertEqual(rep["blinding"]["status"], "LEAKS")
        self.assertTrue(any("not shuffled" in p for p in rep["order"]["problems"]))
        self.assertTrue(any("ours-dry is on side A" in p for p in rep["order"]["problems"]))

    def test_plan_quotas_on_the_sealed_block(self):
        code, out = run(*self.f, "plan-quotas", "--filters", "old")
        self.assertEqual(code, 0)   # no --judgements: the plan says what is needed
        self.assertIn(f"{C.MIN_SLICE_JUDGEMENTS} judgements per pair needed", out)
        code, out = run(*self.f, "plan-quotas", "--filters", "old", "--judgements", "3")
        self.assertEqual(code, 1)

    def test_real_capture_never_enters_the_dry_run_folder(self):
        capture = self.root / "capture-synthetic"
        sidecar = json.loads((capture / intake.SIDECAR).read_text())
        sidecar["synthetic"] = False
        real = self.tmp / "real-capture"
        shutil.copytree(capture, real, dirs_exist_ok=True)
        (real / intake.SIDECAR).write_text(json.dumps(sidecar))
        report = intake.check_capture(self.root, real)
        self.assertEqual(report.status, intake.REFUSED)
        self.assertTrue(any("real capture never goes into it" in p for p in report.problems))

    def test_dry_run_needs_an_empty_folder_and_stand_ins_differ(self):
        with self.assertRaises(FileExistsError):
            dry_run.build_faces(self.root)
        image = np.full((8, 8, 3), 120, dtype=np.uint8)
        image[2:5, 2:5] = (200, 90, 60)
        for filt in C.FILTERS:
            out = dry_run.stand_in(image, filt)
            self.assertEqual(out.shape, image.shape)
            self.assertFalse(np.array_equal(out, image), filt)
            self.assertTrue(np.array_equal(out, dry_run.stand_in(image, filt)))


if __name__ == "__main__":
    unittest.main()
