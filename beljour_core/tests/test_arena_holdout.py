"""Holdout scheduler: sealed baseline, fresh draws, tuning records, persistence."""
from __future__ import annotations

import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import arena_fixtures as F  # noqa: E402

from plumb_api.arena import freeze, holdout  # noqa: E402


class HoldoutTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.template = Path(tempfile.mkdtemp(prefix="arena-holdout-template-"))
        freeze.freeze(F.build(cls.template / "faces", per_cell=2, landmarks=False))

    @classmethod
    def tearDownClass(cls) -> None:
        shutil.rmtree(cls.template, ignore_errors=True)

    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp(prefix="arena-holdout-"))
        self.root = self.tmp / "faces"
        shutil.copytree(self.template / "faces", self.root)  # a fresh, frozen set for every test
        self.ticks = iter(f"2026-10-23T06:{m:02d}:00+00:00" for m in range(60))
        self.ledger = holdout.Ledger(self.root, clock=lambda: next(self.ticks))

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_fresh_draws_never_touch_the_sealed_baseline(self) -> None:
        draw = self.ledger.draw_fresh("qa1", 20, seed=1)
        self.assertEqual(len(set(draw.face_ids)), 20)
        self.assertFalse(any(self.ledger.sealed(f) for f in draw.face_ids))
        self.assertEqual(draw.fresh_left, 50 - 20)

    def test_second_fresh_draw_is_disjoint(self) -> None:
        a = self.ledger.draw_fresh("qa1", 20, seed=1)
        b = self.ledger.draw_fresh("qa2", 20, seed=1)
        self.assertFalse(set(a.face_ids) & set(b.face_ids))
        with self.assertRaises(holdout.HoldoutError):
            self.ledger.draw_fresh("qa3", 11, seed=1)

    def test_fresh_draw_spreads_over_slices(self) -> None:
        draw = self.ledger.draw_fresh("qa1", 12, seed=4)
        slices = {self.ledger.meta[f]["slice"] for f in draw.face_ids}
        self.assertEqual(len(slices), 12, "a small draw takes one face per slice before repeating")

    def test_tuning_uses_spent_faces_first_and_never_sealed(self) -> None:
        spent = self.ledger.draw_fresh("qa1", 10, seed=2)
        tune = self.ledger.draw_tuning("tune1", 6, seed=2)
        self.assertTrue(set(tune.face_ids) <= set(spent.face_ids))
        self.assertEqual(tune.fresh_left, 40, "no fresh face was burned for tuning")
        more = self.ledger.draw_tuning("tune2", 15, seed=2)
        self.assertFalse(any(self.ledger.sealed(f) for f in more.face_ids))

    def test_sealed_faces_refused_for_tuning_and_tuned_faces_flagged(self) -> None:
        sealed = next(f for f in self.ledger.order if self.ledger.sealed(f))
        with self.assertRaises(holdout.HoldoutError):
            self.ledger.mark_tuning("look", [sealed])
        fresh = self.ledger.fresh_ids()[0]
        self.ledger.mark_tuning("look", [fresh])
        self.assertTrue(self.ledger.tuned(fresh))
        self.assertIn("used for tuning", self.ledger.check_sample([fresh], "regression")[0])
        self.assertEqual(self.ledger.check_sample(["LG9999"], "gate"), ["LG9999: not in the frozen set"])

    def test_gate_faces_are_the_sealed_block(self) -> None:
        gate = self.ledger.gate_faces("gate1")
        self.assertEqual(len(gate.face_ids), 100)
        self.assertTrue(all(self.ledger.sealed(f) for f in gate.face_ids))
        again = self.ledger.gate_faces("gate2")
        self.assertEqual(gate.face_ids, again.face_ids, "the gate set is reused, it is not fresh-sampled")

    def test_round_ids_are_single_use_per_purpose(self) -> None:
        self.ledger.draw_fresh("qa1", 2, seed=1)
        with self.assertRaises(holdout.HoldoutError):
            self.ledger.draw_fresh("qa1", 2, seed=2)
        with self.assertRaises(holdout.HoldoutError):
            self.ledger.draw_fresh("has space", 2, seed=2)

    def test_ledger_persists_and_logs(self) -> None:
        draw = self.ledger.draw_fresh("qa1", 5, seed=9)
        again = holdout.Ledger(self.root)
        self.assertTrue(all(not again.fresh(f) for f in draw.face_ids))
        self.assertEqual(again.remaining()["fresh"], 45)
        log = (self.root / "_arena" / "holdout.log.jsonl").read_text().splitlines()
        self.assertEqual(len(log), 1)
        self.assertIn('"purpose": "regression"', log[0])


if __name__ == "__main__":
    unittest.main()
