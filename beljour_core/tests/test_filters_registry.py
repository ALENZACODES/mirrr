"""The arena registry lists every FX1 filter as Built and Not tested, never with a score (R11 item 9)."""
from __future__ import annotations

import copy
import unittest

from plumb_api.arena import registry, report
from plumb_api.filters.recipe import registry as filters


class FilterRegistryTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.rows = registry.filter_rows()
        cls.recipes = filters.load().ranked()

    def test_every_recipe_registered_once_and_not_tested(self) -> None:
        self.assertEqual(registry.validate_filters(self.rows, self.recipes), [])
        self.assertEqual([r["id"] for r in self.rows], [r["id"] for r in self.recipes], "strip order")
        self.assertTrue(all(r["tested"] == "Not tested" and r["status"] == "Built" for r in self.rows))

    def test_a_score_or_a_drift_is_refused(self) -> None:
        scored = copy.deepcopy(self.rows)
        scored[0]["scores"] = {"identity": 9.0}
        self.assertTrue(any("never written" in p for p in registry.validate_filters(scored, self.recipes)))
        renamed = copy.deepcopy(self.rows)
        renamed[1]["name"] = "Other"
        self.assertTrue(any("differs from the recipe" in p for p in registry.validate_filters(renamed, self.recipes)))
        missing = self.rows[1:]
        self.assertTrue(any("built but not registered" in p for p in registry.validate_filters(missing, self.recipes)))
        extra = copy.deepcopy(self.rows) + [dict(self.rows[0], id="C99")]
        self.assertTrue(any("no recipe" in p for p in registry.validate_filters(extra, self.recipes)))
        passed = copy.deepcopy(self.rows)
        passed[2]["tested"] = "Passed"
        self.assertTrue(any("Not tested" in p for p in registry.validate_filters(passed, self.recipes)))

    def test_filter_modules_are_owned(self) -> None:
        feats, infra = registry.load()
        self.assertIn("web/src/filters", registry.module_universe())
        self.assertIn("api/plumb_api/filters", registry.module_universe())
        self.assertEqual(registry.unowned_modules(feats, infra), [])
        self.assertEqual(registry.validate(feats), [])

    def test_report_names_the_filters_as_not_tested(self) -> None:
        line = registry.filter_checklist(self.rows)
        self.assertIn("61 looks built, 61 Not tested", line)
        feats, _ = registry.load()
        md = report.markdown(None, registry.feature_rows(feats), created="2026-10-23 06:00 ET")
        self.assertIn(line, md)
        self.assertIn("Not tested", report.html_page(None, registry.feature_rows(feats), created="2026-10-23"))


if __name__ == "__main__":
    unittest.main()
