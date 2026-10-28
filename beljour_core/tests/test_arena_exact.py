"""Exact gate maths and slice quotas (arena/exact.py): known Clopper-Pearson values, agreement
with gates.hero_gate on made-up results, and the quota the sealed 100-face block really needs.
All rows are made up. Author: John Khan.
"""
import random
import unittest

from plumb_api.arena import constants as C
from plumb_api.arena import exact as E
from plumb_api.arena import gates


def sealed_block_rows():
    """The shape of the sealed baseline block: one FairFace face per cell, 20 SFHQ, 10 adversarial
    faces with different tags (half with a gender label)."""
    rows = []
    for race in C.FAIRFACE_RACES:
        for gender in C.FAIRFACE_GENDERS:
            for band in C.ADULT_BANDS:
                rows.append({"set": "fairface", "race": race, "gender": gender, "age_band": band, "tags": ""})
    rows += [{"set": "sfhq", "race": "", "gender": "", "age_band": "", "tags": ""} for _ in range(20)]
    rows += [{"set": "adversarial", "race": "", "gender": "Female" if i % 2 else "", "age_band": "",
              "tags": C.ADVERSARIAL_TAGS[i]} for i in range(10)]
    return rows


class ExactIntervalTest(unittest.TestCase):
    def test_known_clopper_pearson_values(self):
        for (wins, n), (low, high) in {(5, 10): (0.187086, 0.812914), (0, 10): (0.0, 0.308497),
                                       (10, 10): (0.691503, 1.0), (1, 20): (0.001265, 0.248733)}.items():
            got = E.clopper_pearson(wins, n)
            self.assertAlmostEqual(got[0], low, places=5)
            self.assertAlmostEqual(got[1], high, places=5)
        self.assertEqual(E.clopper_pearson(0, 0), (0.0, 1.0))
        with self.assertRaises(ValueError):
            E.clopper_pearson(11, 10)

    def test_interval_covers_and_cdf_is_a_distribution(self):
        self.assertAlmostEqual(E.binomial_cdf(30, 30, 0.4), 1.0)
        self.assertAlmostEqual(E.binomial_cdf(4, 9, 0.5), 0.5)
        self.assertEqual(E.binomial_cdf(-1, 5, 0.5), 0.0)
        low, high = E.clopper_pearson(3300, 6000)
        self.assertLess(low, 0.55)
        self.assertGreater(high, 0.55)

    def test_wins_needed(self):
        self.assertEqual(E.wins_to_meet(20, C.HERO_SLICE_MIN), 10)
        self.assertEqual(E.wins_to_meet(40, C.HERO_OVERALL_MIN), 22)
        clear = E.wins_to_clear(20, C.HERO_SLICE_MIN)
        self.assertGreaterEqual(E.clopper_pearson(clear, 20)[0], C.HERO_SLICE_MIN)
        self.assertLess(E.clopper_pearson(clear - 1, 20)[0], C.HERO_SLICE_MIN)
        self.assertIsNone(E.wins_to_clear(3, C.HERO_SLICE_MIN))   # three judgements can't prove 48%


class GateMathsTest(unittest.TestCase):
    def matchup(self, rng, *, n, rate):
        rows = {}
        for key in ["race:" + r for r in C.FAIRFACE_RACES] + ["gender:Female", "gender:Male", "age:20-29"]:
            size = n if key != "age:20-29" else rng.choice([n, 5])
            wins = sum(rng.random() < rate for _ in range(size))
            rows[key] = {"wins": wins, "n": size, "rate": wins / size}
        total = sum(v["n"] for v in rows.values())
        wins = sum(v["wins"] for v in rows.values())
        rows["all"] = {"wins": wins, "n": total, "rate": wins / total}
        return rows

    def test_rule_agrees_with_the_ship_gate(self):
        rng = random.Random(4)
        for trial in range(60):
            rows = self.matchup(rng, n=rng.choice([10, 20, 30]), rate=rng.choice([0.4, 0.5, 0.56, 0.7]))
            results = {"ours": "ours", "baseline": "baseline", "views": {"human": {"old": {"matchups": {"ours|baseline": rows}}}}}
            verdict = gates.hero_gate(results, "old")
            self.assertEqual(E.gate_maths(rows)["rule"], verdict.status, (trial, rows))

    def test_report_marks_thin_and_separable_slices(self):
        rows = {"all": {"wins": 60, "n": 100}, "race:Black": {"wins": 3, "n": 3}, "race:White": {"wins": 30, "n": 40},
                "race:Indian": {"wins": 4, "n": 30}}
        out = E.gate_maths(rows)
        states = {s["key"]: (s["state"], s["evidence"]) for s in out["slices"]}
        self.assertEqual(states["race:Black"], ("thin", "not separable"))
        self.assertEqual(states["race:White"], ("meets", "clearly above"))
        self.assertEqual(states["race:Indian"], ("below", "clearly below"))
        self.assertEqual(out["rule"], "FAIL")
        self.assertEqual(out["coin_flip"], "not separable")   # 60 of 100 is not clear of 50%


class QuotaTest(unittest.TestCase):
    def test_sealed_block_needs_twenty_judgements_per_pair(self):
        plan = E.plan_quotas(sealed_block_rows())
        old = plan["filters"]["old"]
        self.assertEqual(old["faces"], 100)
        self.assertEqual(old["slices"]["race:Black"], 10)
        self.assertEqual(old["slices"]["adv:glasses"], 1)
        self.assertEqual(old["judgements_per_pair_needed"], C.MIN_SLICE_JUDGEMENTS)
        self.assertEqual(plan["judges_needed"], C.MIN_SLICE_JUDGEMENTS)
        self.assertEqual(plan["filters"]["gender_swap"]["faces"], 75)   # no unlabelled faces
        self.assertEqual(plan["total_judgements"], (100 + 100 + 75) * C.MIN_SLICE_JUDGEMENTS)

    def test_default_three_judgements_leave_slices_short(self):
        plan = E.plan_quotas(sealed_block_rows(), judgements_per_pair=3)
        short = plan["filters"]["old"]["slices_short"]
        self.assertEqual(set(short), {f"adv:{t}" for t in C.ADVERSARIAL_TAGS[:10]})
        self.assertNotIn("race:Black", short)                 # 10 faces x 3 = 30
        self.assertEqual(short["adv:glasses"], 3)


if __name__ == "__main__":
    unittest.main()
