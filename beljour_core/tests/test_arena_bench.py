"""Parallel generation jobs and the per-feature proxy bench."""
from __future__ import annotations

import json
import math
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import arena_fixtures as F  # noqa: E402

from plumb_api.arena import batch, freeze, registry  # noqa: E402
from plumb_api.arena import feature_bench as B  # noqa: E402
from plumb_api.arena import slots as S  # noqa: E402
from plumb_api.arena.identity import L  # noqa: E402
from plumb_api.arena.synthetic import drawn_face  # noqa: E402


class FeatureBenchTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        tones = ("very_light", "medium", "very_dark")
        cls.faces = []
        cls.rows = {}
        for i, tone in enumerate(tones):
            f = drawn_face(tone, seed=i + 1, width=160, height=192)
            fid = f"LG{i + 1:04d}"
            cls.faces.append((fid, f.image, f.points))
            cls.rows[fid] = {"set": "fairface", "race": ("White", "Indian", "Black")[i], "gender": "Female",
                             "age_band": "30-39", "tags": ""}

    def test_every_runner_belongs_to_a_built_local_feature(self) -> None:
        feats = {f.id: f for f in registry.load()[0]}
        for runner in B.RUNNERS:
            f = feats[runner.feature]
            self.assertEqual(f.status, "Built", runner.feature)
            self.assertEqual(f.provider, "local", runner.feature)
            self.assertFalse(f.hero, "hero filters are judged in the arena, not here")

    def test_bench_scores_every_feature_per_slice_and_never_flattering(self) -> None:
        notes: list[str] = []
        out = B.bench(self.faces, self.rows, on_error=notes.append)
        self.assertEqual(notes, [])
        self.assertEqual(set(out), {r.feature for r in B.RUNNERS})
        for fid, entry in out.items():
            self.assertEqual(entry["source"], "proxy")
            self.assertEqual(entry["faces"], 3)
            overall = entry["scores"]["all"]
            self.assertNotIn("flattering", overall, "no automated proxy exists for Flattering")
            for dim in ("identity", "realism", "artifact_free", "still_her"):
                self.assertTrue(1 <= overall[dim]["mean"] <= 10, (fid, dim))
            self.assertIn("race:Black", entry["scores"])
        self.assertGreater(out[49]["scores"]["all"]["artifact_free"]["mean"], 8,
                           "a whole-photo enhance isn't marked down for changing the background")

    def test_proxy_scores_reach_the_report_but_never_pass_the_gate(self) -> None:
        out = B.bench(self.faces[:2], self.rows, [r for r in B.RUNNERS if r.feature in (49, 23)])
        rows = {r.feature.id: r for r in registry.feature_rows(registry.load()[0], feature_results=out)}
        self.assertEqual(rows[49].source, "proxy")
        self.assertIsNotNone(rows[49].scores["identity"])
        self.assertIsNone(rows[49].scores["flattering"])
        self.assertEqual(rows[49].status, "Built", "proxies alone never make a feature Passed")
        self.assertEqual(rows[49].verdict.status, "UNTESTED")

    def test_roll_target_levels_the_pupils(self) -> None:
        pts = self.faces[0][2].copy()
        centre = pts.mean(axis=0)
        a = math.radians(6)
        tilted = (pts - centre) @ np.array([[math.cos(a), -math.sin(a)], [math.sin(a), math.cos(a)]]).T + centre
        level = B.roll_target(tilted)
        right, left = level[L["right_pupil"]], level[L["left_pupil"]]
        self.assertAlmostEqual(left[1], right[1], places=6)
        half = B.roll_target(tilted, 0.5)
        self.assertLess(abs(half[L["left_pupil"]][1] - half[L["right_pupil"]][1]),
                        abs(tilted[L["left_pupil"]][1] - tilted[L["right_pupil"]][1]))


class BatchTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp(prefix="arena-batch-"))
        self.root = F.build(self.tmp / "faces", per_cell=1)
        freeze.freeze(self.root)
        F.cache_landmarks(self.root)
        self.slots = S.Slots(self.root)
        self.slots.create("ours-b", "ours", "b")

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp, ignore_errors=True)

    def job(self, fid: str, filt: str, *, weapons: bool, row: dict | None = None) -> batch.Job:
        meta = self.slots.rows[fid]
        cached = np.load(self.root / "_arena" / "landmarks" / f"{fid}.npy")
        pts = cached * np.array([int(meta["width"]), int(meta["height"])])
        return batch.Job(str(self.root), "ours-b", fid, filt, row if row is not None else dict(meta),
                         str(self.slots.path(S.ORIGINAL, "old", fid)), pts.tolist(), 768, 5, weapons)

    def test_jobs_write_into_the_slot_and_report_errors_per_job(self) -> None:
        seen: list[dict] = []
        rows = batch.run_jobs([self.job("LG0001", "young", weapons=True), self.job("LG0002", "old", weapons=False),
                               self.job("LG0003", "gender_swap", weapons=False, row={"gender": ""})], 1, on_done=seen.append)
        self.assertEqual(len(rows), 3)
        self.assertEqual(rows, seen)
        self.assertTrue(self.slots.has("ours-b", "young", "LG0001"))
        self.assertTrue(self.slots.has("ours-b", "old", "LG0002"))
        self.assertEqual(len(rows[0]["candidates"]), 4)
        self.assertIn("error", rows[2], "an unlabelled face gets no gender swap, and the run goes on")
        self.assertFalse(self.slots.has("ours-b", "gender_swap", "LG0003"))
        self.assertEqual(json.loads(batch.trace_line(rows[1])), rows[1])


if __name__ == "__main__":
    unittest.main()
