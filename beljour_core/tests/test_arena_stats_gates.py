"""Win rates, Elo, results aggregation, the hero and feature gates, regression and the kill-list rule."""
from __future__ import annotations

import random
import unittest

from plumb_api.arena import constants as C
from plumb_api.arena import gates, results, stats
from plumb_api.arena.judging import JudgementError, Outcome, unblind, validate


def manifest(n_per_race: int = 12) -> list[dict[str, str]]:
    rows = []
    i = 1
    for race in ("Black", "White", "Indian"):
        for k in range(n_per_race):
            rows.append({"face_id": f"LG{i:04d}", "set": "fairface", "race": race, "gender": "Female" if k % 2 else "Male",
                         "age_band": "30-39" if k % 3 else "60+", "tags": ""})
            i += 1
    return rows


def outcomes(rows, *, filt: str = "old", ours: str = "ours-v2", other: str = "baseline", win_by_race=None,
             judges: int = 3, kind: str = "human", seed: int = 3, reason: str = "Too Weak") -> list[Outcome]:
    rng = random.Random(seed)
    out = []
    for row in rows:
        p = (win_by_race or {}).get(row["race"], 0.6)
        for j in range(judges):
            won = rng.random() < p
            winner, loser = (ours, other) if won else (other, ours)
            out.append(Outcome(f"{row['face_id']}{filt}{j}", f"{row['face_id']}{filt}", row["face_id"], filt, winner, loser,
                               reason if not won else "Plastic Skin", f"judge{j}", kind, "proxy/1" if kind == "model" else "",
                               {ours: {"identity": 8.5, "realism": 8.0}}))
    return out


def exact(rows, wins_per_face: int, judges: int = 4, ours: str = "ours-v2", other: str = "baseline") -> list[Outcome]:
    out = []
    for row in rows:
        for j in range(judges):
            won = j < wins_per_face
            winner, loser = (ours, other) if won else (other, ours)
            out.append(Outcome(f"{row['face_id']}{j}", row["face_id"], row["face_id"], "old", winner, loser,
                               "Too Weak" if won else "Lost Identity", f"j{j}", "human", "", {}))
    return out


class StatsTest(unittest.TestCase):
    def test_wilson_matches_known_values(self) -> None:
        r = stats.wilson(55, 100)
        self.assertAlmostEqual(r.rate, 0.55)
        self.assertAlmostEqual(r.low, 0.4524, places=3)
        self.assertAlmostEqual(r.high, 0.6438, places=3)
        self.assertEqual(stats.wilson(0, 0).n, 0)

    def test_bradley_terry_orders_and_elo_matches_odds(self) -> None:
        games = [("a", "b")] * 75 + [("b", "a")] * 25 + [("b", "c")] * 60 + [("c", "b")] * 40
        rating = stats.elo(stats.bradley_terry(games), anchor="c")
        self.assertEqual(rating["c"], 1000.0)
        self.assertGreater(rating["a"], rating["b"])
        self.assertGreater(rating["b"], rating["c"])
        self.assertAlmostEqual(rating["a"] - rating["b"], 400 * __import__("math").log10(75.5 / 25.5), delta=25)
        self.assertAlmostEqual(stats.expected_score(1100, 1000), 0.64, places=2)

    def test_bt_is_order_independent_and_finite_for_unbeaten(self) -> None:
        games = [("a", "b")] * 10
        r1 = stats.elo(stats.bradley_terry(games), anchor="b")
        r2 = stats.elo(stats.bradley_terry(list(reversed(games))), anchor="b")
        self.assertEqual(r1, r2)
        self.assertTrue(all(abs(v) < 5000 for v in r1.values()))

    def test_bootstrap_interval_brackets_the_estimate(self) -> None:
        by_face = {f"f{i}": [("ours", "original")] * 3 + [("original", "ours")] for i in range(30)}
        res = stats.elo_with_ci(by_face, reps=150)
        self.assertLessEqual(res.low["ours"], res.rating["ours"])
        self.assertGreaterEqual(res.high["ours"], res.rating["ours"])
        self.assertEqual(res.rating["original"], 1000.0)
        self.assertEqual(stats.head_to_head([("ours", "original")] * 3, "ours", "original").wins, 3)


class JudgementTest(unittest.TestCase):
    def test_validation(self) -> None:
        ok = validate({"assignment": "a1", "judge": "j", "kind": "human", "winner": "A", "reason": C.REASONS[0],
                       "scores": {"A": {"identity": 9}}})
        self.assertEqual(ok["winner"], "A")
        for bad in ({"winner": "tie"}, {"reason": "Ugly"}, {"kind": "robot"}, {"scores": {"A": {"fairness": 5}}},
                    {"scores": {"A": {"identity": 11}}}, {"kind": "model"}):
            rec = {"assignment": "a1", "judge": "j", "kind": "human", "winner": "A", "reason": C.REASONS[0], **bad}
            with self.assertRaises(JudgementError):
                validate(rec)

    def test_unblind_drops_repeats_and_enforces_still_her(self) -> None:
        key = {"x1": {"pair_id": "p1", "face_id": "LG0001", "filter": "old", "a": "ours", "b": "baseline", "still_her": True},
               "x2": {"pair_id": "p1", "face_id": "LG0001", "filter": "old", "a": "baseline", "b": "ours", "still_her": True},
               "x3": {"pair_id": "p2", "face_id": "LG0002", "filter": "old", "a": "ours", "b": "baseline", "still_her": False}}
        recs = [validate({"assignment": "x1", "judge": "ann", "kind": "human", "winner": "B", "reason": "Too Weak",
                          "scores": {"A": {"still_her": 4}}, "woman_judge": True}),
                validate({"assignment": "x2", "judge": "ann", "kind": "human", "winner": "A", "reason": "Too Weak"}),
                validate({"assignment": "x3", "judge": "ann", "kind": "human", "winner": "A", "reason": "Lost Identity",
                          "scores": {"A": {"still_her": 9, "identity": 7}}, "woman_judge": True}),
                validate({"assignment": "zz", "judge": "ann", "kind": "human", "winner": "A", "reason": "Too Weak"})]
        got, problems = unblind(recs, key)
        self.assertEqual(len(got), 2)
        self.assertEqual(got[0].winner, "baseline")
        self.assertEqual(got[0].scores["ours"], {"still_her": 4.0})
        self.assertEqual(got[1].scores["ours"], {"identity": 7.0}, "Still Her only on a woman's photo")
        self.assertEqual(len(problems), 3)


class ResultsAndGatesTest(unittest.TestCase):
    def setUp(self) -> None:
        self.rows = manifest()

    def summarise(self, outs, **kw):
        return results.summarise(outs, self.rows, ours="ours-v2", previous=kw.pop("previous", None), reps=60, **kw)

    def test_slices_and_killlist(self) -> None:
        self.assertEqual(results.slices_for({"set": "adversarial", "tags": "glasses;beard", "gender": "Female"}),
                         ["all", "set:adversarial", "gender:Female", "adv:glasses", "adv:beard"])
        outs = exact(self.rows, 1)
        kills = results.killlist(outs, "ours-v2")
        self.assertEqual(kills[0]["reason"], "Lost Identity")
        self.assertEqual(kills[0]["share"], 1.0)

    def test_hero_gate_pass(self) -> None:
        res = self.summarise(exact(self.rows, 3))  # 75% everywhere
        v = gates.hero_gate(res, "old")
        self.assertEqual(v.status, gates.PASS, v.reasons)
        self.assertAlmostEqual(v.overall, 0.75)

    def test_hero_gate_fails_on_one_slice(self) -> None:
        outs = []
        for row in self.rows:
            outs += exact([row], 1 if row["race"] == "Black" else 3)
        res = self.summarise(outs)
        v = gates.hero_gate(res, "old")
        self.assertGreaterEqual(v.overall, 0.55)
        self.assertEqual(v.status, gates.FAIL)
        self.assertTrue(any("race:Black" in r for r in v.reasons))
        self.assertEqual(v.worst_slice[0], "race:Black")

    def test_hero_gate_fails_overall(self) -> None:
        res = self.summarise(exact(self.rows, 2))  # exactly 50%
        self.assertEqual(gates.hero_gate(res, "old").status, gates.FAIL)

    def test_thin_slices_cannot_pass(self) -> None:
        rows = manifest(4)
        res = results.summarise(exact(rows, 3), rows, ours="ours-v2", reps=40)
        v = gates.hero_gate(res, "old")
        self.assertEqual(v.status, gates.UNTESTED)
        self.assertTrue(any("under 20 judgements" in r for r in v.reasons))

    def test_no_baseline_is_fail_untested_never_pass(self) -> None:
        res = self.summarise(exact(self.rows, 4, other="original"))
        v = gates.hero_gate(res, "old")
        self.assertEqual(v.status, gates.UNTESTED)
        self.assertEqual(v.label, "FAIL/UNTESTED vs the reference app")

    def test_model_judgements_never_pass(self) -> None:
        outs = [Outcome(o.assignment, o.pair_id, o.face_id, o.filter, o.winner, o.loser, o.reason, o.judge, "model",
                        "proxy-scorer/1", o.scores) for o in exact(self.rows, 4)]
        res = self.summarise(outs)
        self.assertEqual(res["judges"]["model_judgements"], len(outs))
        v = gates.hero_gate(res, "old")
        self.assertEqual(v.status, gates.UNTESTED)
        self.assertEqual(v.judged_by, "model")
        self.assertEqual(v.overall, 1.0)

    def test_elo_is_reported_per_slice_with_intervals(self) -> None:
        outs = exact(self.rows, 3) + exact(self.rows, 2, other="original")
        res = self.summarise(outs)
        elo = res["views"]["human"]["old"]["elo"]
        self.assertIn("race:Indian", elo)
        cell = elo["all"]["ours-v2"]
        self.assertLessEqual(cell["low"], cell["rating"])
        self.assertGreaterEqual(cell["high"], cell["rating"])
        self.assertEqual(elo["all"]["original"]["rating"], 1000.0)

    def test_regression_rejects_any_elo_drop(self) -> None:
        base = exact(self.rows, 2, other="original")
        better = self.summarise(exact(self.rows, 3, other="original"))
        worse = self.summarise(base)
        self.assertTrue(gates.regression_check(worse, better).accept)
        decision = gates.regression_check(better, worse)
        self.assertFalse(decision.accept)
        self.assertTrue(any("old all" in d for d in decision.drops))
        same = gates.regression_check(better, better)
        self.assertTrue(same.accept)
        self.assertGreater(same.checked, 0)

    def test_head_to_head_regression(self) -> None:
        res = self.summarise(exact(self.rows, 1, other="ours-v1"), previous="ours-v1")
        self.assertFalse(gates.head_to_head_regression(res).accept)
        res2 = self.summarise(exact(self.rows, 3, other="ours-v1"), previous="ours-v1")
        self.assertTrue(gates.head_to_head_regression(res2).accept)

    def test_feature_gate(self) -> None:
        good = {d: 8.5 for d in C.DIMENSIONS}
        passing = gates.FeatureScores(good, {"identity": {"race:Black": 7.5}}, "human")
        self.assertEqual(gates.feature_gate(passing).status, gates.PASS)
        low_slice = gates.FeatureScores(good, {"still_her": {"race:Black": 6.9}}, "human")
        self.assertEqual(gates.feature_gate(low_slice).status, gates.FAIL)
        low_avg = gates.FeatureScores({**good, "flattering": 7.9}, {}, "human")
        self.assertEqual(gates.feature_gate(low_avg).status, gates.FAIL)
        missing = gates.FeatureScores({**good, "flattering": None}, {}, "human")
        self.assertEqual(gates.feature_gate(missing).status, gates.UNTESTED)
        proxy = gates.FeatureScores(good, {}, "proxy")
        self.assertEqual(gates.feature_gate(proxy).status, gates.UNTESTED)
        self.assertEqual(gates.feature_gate(None).status, gates.UNTESTED)

    def test_killlist_rule(self) -> None:
        kills = [{"reason": "Too Weak", "losses": 10, "share": 0.5}, {"reason": "Plastic Skin", "losses": 6, "share": 0.3},
                 {"reason": "Lost Identity", "losses": 4, "share": 0.2}]
        self.assertIn("#1", gates.select_fix(kills, "Too Weak"))
        with self.assertRaises(gates.KillListError):
            gates.select_fix(kills, "Plastic Skin")
        self.assertIn("because", gates.select_fix(kills, "Plastic Skin", why_not_first="needs the R19 wrinkle engine"))
        with self.assertRaises(gates.KillListError):
            gates.select_fix(kills, "Lost Identity", why_not_first="any")
        with self.assertRaises(gates.KillListError):
            gates.select_fix(kills, "Fake Teeth")
        tied = [{"reason": "Too Weak", "losses": 5, "share": 0.5}, {"reason": "Too Strong", "losses": 5, "share": 0.5}]
        self.assertIn("tied", gates.select_fix(tied, "Too Strong"))

    def test_fairness_comes_from_slice_spread(self) -> None:
        by_slice = {"all": {"identity": {"mean": 8, "n": 40}},
                    "race:A": {"identity": {"mean": 8.5, "n": 12}}, "race:B": {"identity": {"mean": 7.0, "n": 12}}}
        fair = results.fairness_from_scores(by_slice)
        self.assertEqual(fair["mean"], 7.0)
        self.assertEqual(fair["dimension"], "identity")
        self.assertIsNone(results.fairness_from_scores({"all": {"identity": {"mean": 8, "n": 3}}}))


if __name__ == "__main__":
    unittest.main()
