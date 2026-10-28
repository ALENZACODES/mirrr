"""End to end through scripts/arena.py on drawn faces: freeze, draw, generate (with and
without the quality weapons), blind run, model judge, results, gate, regression, kill-list,
report and registry. No photo, no network, no YouCam."""
from __future__ import annotations

import contextlib
import io
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / "scripts"))
import arena as cli  # noqa: E402
import arena_fixtures as F  # noqa: E402

from plumb_api.arena import constants as C  # noqa: E402


def run(*args: str) -> tuple[int, str]:
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        code = cli.main(list(args))
    return code, out.getvalue()


class ArenaCliTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.tmp = Path(tempfile.mkdtemp(prefix="arena-cli-"))
        cls.faces = F.build(cls.tmp / "faces", per_cell=2)
        cls.f = ["--faces", str(cls.faces)]

    @classmethod
    def tearDownClass(cls) -> None:
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def test_full_loop(self) -> None:
        code, out = run(*self.f, "freeze")
        self.assertEqual(code, 0, out)
        self.assertIn("frozen set v1: 150 faces", out)
        self.assertEqual(F.cache_landmarks(self.faces), 150)
        self.assertEqual(run(*self.f, "verify")[0], 0)
        self.assertEqual(run(*self.f, "draw", "--round", "qa1", "--n", "3", "--seed", "2")[0], 0)
        code, out = run(*self.f, "draw", "--round", "qa1", "--n", "3")
        self.assertEqual(code, 2, "a round id draws once")
        code, out = run(*self.f, "generate", "--slot", "ours-qa1", "--version", "qa1", "--round", "qa1", "--filters", "old,gender_swap")
        self.assertEqual(code, 0, out)
        code, out = run(*self.f, "generate", "--slot", "ours-r9", "--version", "r9", "--round", "qa1", "--no-weapons",
                        "--filters", "old,gender_swap")
        self.assertEqual(code, 0, out)
        traces = (self.faces / C.ARENA_DIR / "slots" / "ours-qa1" / "trace.jsonl").read_text().splitlines()
        self.assertTrue(traces)
        self.assertEqual(len(json.loads(traces[0])["candidates"]), 4, "Best-of-N with N = 4")
        code, out = run(*self.f, "make-run", "--run", "qa1", "--ours", "ours-qa1", "--previous", "ours-r9", "--round", "qa1",
                        "--filters", "old,gender_swap", "--judgements", "2", "--judges", "2")
        self.assertEqual(code, 0, out)
        self.assertIn("no baseline slot, so FAIL/UNTESTED vs the reference app", out)
        self.assertEqual(run(*self.f, "judge-model", "--run", "qa1")[0], 0)
        self.assertEqual(run(*self.f, "proxy-scores", "--slot", "ours-qa1", "--round", "qa1")[0], 0)
        res = self.tmp / "results-qa1.json"
        proxy = self.faces / C.ARENA_DIR / "results" / "proxy-ours-qa1-qa1.jsonl"
        code, out = run(*self.f, "results", "--runs", "qa1", "--ours", "ours-qa1", "--previous", "ours-r9",
                        "--proxy", str(proxy), "--out", str(res))
        self.assertEqual(code, 0, out)
        data = json.loads(res.read_text())
        self.assertGreater(data["judges"]["model_judgements"], 0)
        self.assertEqual(data["judges"]["human_judgements"], 0)
        code, out = run(*self.f, "gate", "--results", str(res))
        self.assertEqual(code, 1, "no baseline and no people: nothing passes")
        self.assertEqual(out.count("FAIL/UNTESTED vs the reference app"), 3)
        code, out = run(*self.f, "regression", "--current", str(res), "--previous", str(res))
        self.assertEqual(code, 0, out)
        kills = data["views"]["model"]["old"]["killlist"]["all"]
        if kills:
            code, out = run(*self.f, "kill-fix", "--results", str(res), "--filter", "old", "--reason", kills[0]["reason"])
            self.assertEqual(code, 0, out)
        md, html = self.tmp / "report.md", self.tmp / "report.html"
        code, _ = run(*self.f, "report", "--results", str(res), "--md", str(md), "--html", str(html))
        self.assertEqual(code, 0)
        text = md.read_text()
        self.assertIn("model-judged", text)
        self.assertEqual(text.count("FAIL/UNTESTED vs the reference app"), 3)
        self.assertIn("<table class=\"hero\">", html.read_text())
        bundle = self.faces / C.ARENA_DIR / "runs" / "qa1" / "bundles" / "judge-01" / "manifest.json"
        self.assertNotIn("ours-", bundle.read_text())

    def test_registry_command(self) -> None:
        out_json = self.tmp / "registry.json"
        code, out = run(*self.f, "registry", "--check", "--json", str(out_json))
        self.assertEqual(code, 0, out)
        rows = json.loads(out_json.read_text())
        self.assertGreaterEqual(len(rows), 103)
        self.assertEqual(sorted(r["id"] for r in rows), list(range(1, len(rows) + 1)))
        self.assertTrue(all(r["score_source"] == "not tested" for r in rows))


if __name__ == "__main__":
    unittest.main()
