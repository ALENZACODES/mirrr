"""Release-evidence boundary cases for opt-in BELJOUR texture finish.

A malformed request is not a successful evaluation. The synthetic-only
results are never converted into a real-face green status.
Created by John Khan.
"""
from __future__ import annotations

import copy
import math
import unittest
from dataclasses import replace
from typing import Any

from plumb_api.filters.frame import Frame
from plumb_api.filters.qa import fixtures, texture_gate
from plumb_api.filters.recipe import registry
from plumb_api.filters.spatial import grain


class InvalidRequestTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.faces = fixtures.six_tones(width=64, height=80)

    def test_non_numeric_amounts_are_rejected_before_evaluation(self) -> None:
        invalid: tuple[Any, ...] = (None, True, False, "50", "0", "nan", [], {}, 1j)
        for value in invalid:
            with self.subTest(value=type(value).__name__):
                result = texture_gate.evaluate(["C08"], [value], portraits=self.faces)
                self.assertFalse(result.synthetic_passed)
                self.assertEqual(result.rows, ())
                self.assertTrue(result.coverage_problems)

    def test_unbounded_integer_is_rejected_without_overflow(self) -> None:
        oversized = 10 ** 1200
        result = texture_gate.evaluate(["C08"], [oversized], portraits=self.faces)
        self.assertFalse(result.synthetic_passed)
        self.assertEqual(result.evaluated, 0)

    def test_empty_recipe_and_amount_sequences_cannot_pass(self) -> None:
        for ids, amounts in (([], [50.0]), (["C08"], []), ([], [])):
            with self.subTest(ids=ids, amounts=amounts):
                result = texture_gate.evaluate(ids, amounts, portraits=self.faces)
                self.assertFalse(result.synthetic_passed)
                self.assertEqual(result.evaluated, 0)

    def test_boolean_seed_is_not_a_valid_integer_seed(self) -> None:
        for seed in (True, False):
            with self.subTest(seed=seed):
                with self.assertRaises(ValueError):
                    grain.noise(3, 4, Frame(3, 4), seed)

    def test_missing_manual_only_declaration_fails_closed(self) -> None:
        catalogue = registry.default()
        damaged = copy.deepcopy(catalogue)
        damaged.addons["grain"]["manualOnly"] = False
        invalid = texture_gate.evaluate(
            ["C08"], [50.0], portraits=self.faces, catalogue=damaged,
        )
        self.assertFalse(invalid.synthetic_passed)
        self.assertEqual(invalid.evaluated, 0)
        self.assertIn("grain must be built and opt-in", invalid.coverage_problems)

    def test_effect_not_built_cannot_be_reported_as_passed(self) -> None:
        catalogue = copy.deepcopy(registry.default())
        catalogue.addons["structure"]["built"] = False
        invalid = texture_gate.evaluate(
            ["C08"], [50.0], portraits=self.faces, catalogue=catalogue,
        )
        self.assertFalse(invalid.synthetic_passed)
        self.assertEqual(invalid.evaluated, 0)

    def test_missing_record_is_exposed_by_coverage_validation(self) -> None:
        result = texture_gate.evaluate(["C08"], [50.0], portraits=self.faces)
        self.assertEqual(texture_gate.validate(result), [])
        damaged = replace(result, rows=(*result.rows[:2], *result.rows[3:]))
        problems = texture_gate.validate(damaged)
        self.assertTrue(any("missing" in problem for problem in problems))

    def test_successful_synthetic_records_never_clear_real_release(self) -> None:
        result = texture_gate.evaluate(["C08"], [50.0], portraits=self.faces)
        self.assertTrue(result.synthetic_passed)
        public = result.to_dict()
        self.assertEqual(public["real_faces"], 0)
        self.assertEqual(public["external_100k_gate"], "UNVERIFIED")
        self.assertIs(public["release_gate_passed"], False)

    def test_finite_metrics_are_required_on_all_records(self) -> None:
        original = texture_gate.evaluate(["C08"], [50.0], portraits=self.faces)
        for field in ("hue_degrees", "texture_spread", "chroma_kept", "lift"):
            with self.subTest(metric=field):
                altered = replace(original.rows[0], **{field: math.inf})
                damaged = replace(original, rows=(altered, *original.rows[1:]))
                self.assertFalse(damaged.synthetic_passed)
                self.assertTrue(texture_gate.validate(damaged))
                with self.assertRaises(ValueError):
                    damaged.dumps()


if __name__ == "__main__":
    unittest.main()
