"""The per-filter acceptance sheet (plumb_api/filters/qa/report.py). Drawn fixtures only.
Author: John Khan.
"""
from __future__ import annotations

import unittest

from plumb_api.filters.qa import distinct, report
from plumb_api.filters.recipe import registry


class AcceptanceSheet(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.cat = registry.default()
        cls.ids = [r["id"] for r in cls.cat.ranked()[:3]]
        cls.rows = report.acceptance(cls.cat, ids=cls.ids)

    def test_one_row_per_requested_filter_in_rank_order(self) -> None:
        self.assertEqual([r.id for r in self.rows], self.ids)
        self.assertEqual([r.rank for r in self.rows], sorted(r.rank for r in self.rows))

    def test_shipped_filters_pass_every_check(self) -> None:
        for r in self.rows:
            with self.subTest(r.id):
                self.assertTrue(r.passed, report.markdown([r]))
                self.assertLessEqual(r.worst_lift_over_grey, 1e-9)

    def test_nearest_is_in_the_same_tab_and_symmetric(self) -> None:
        near = report.nearest_in_tab(self.cat)
        tabs = {r["id"]: r["tab"] for r in self.cat.ranked()}
        for a, (b, de) in near.items():
            self.assertEqual(tabs[a], tabs[b])
            self.assertGreaterEqual(de, distinct.MIN_DE)
            self.assertLessEqual(near[b][1], de + 1e-12)

    def test_markdown_counts_and_flags_failures(self) -> None:
        good = self.rows[0]
        bad = report.AcceptanceRow(**{**good.__dict__, "properties": ["X: strength 0 changed pixels"], "golden": None})
        text = report.markdown([good, bad])
        self.assertIn("1 of 2 filters pass", text)
        self.assertIn("## Failing", text)
        self.assertIn("strength 0 changed pixels", text)
        self.assertIn("golden missing", text)
        self.assertNotIn("Clinic", text)

    def test_without_goldens_a_row_cannot_pass(self) -> None:
        rows = report.acceptance(self.cat, ids=self.ids[:1], with_goldens=False)
        self.assertFalse(rows[0].passed)
        self.assertFalse(rows[0].golden_ok)


if __name__ == "__main__":
    unittest.main()
