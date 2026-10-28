"""Editorial Ivy filter release contract, all inputs drawn locally.

This suite does not evaluate photographs or grant real-face release approval.
Created by John Khan.
"""
from __future__ import annotations

import copy
import json
import math
import tempfile
import unittest
from dataclasses import replace
from pathlib import Path

import numpy as np

from plumb_api.filters import engine
from plumb_api.filters.qa import cover
from plumb_api.filters.recipe import registry, schema


class EditorialMetadataTest(unittest.TestCase):
    def setUp(self) -> None:
        self.cat = registry.load()

    def test_every_shipped_recipe_declares_family_and_light(self) -> None:
        self.assertEqual(len(self.cat.recipes), 61)
        for recipe in self.cat.recipes:
            grade = recipe["editorial"]
            self.assertIn(grade["family"], schema.EDITORIAL_FAMILIES)
            self.assertIn(grade["light"], schema.EDITORIAL_LIGHTS)
            self.assertEqual(set(grade), {"family", "light"})
            self.assertEqual(schema.check_recipe(recipe, self.cat.addons), [])

    def test_every_source_file_declares_metadata_explicitly(self) -> None:
        for filename in registry.RECIPE_FILES:
            data = json.loads((registry.RECIPE_DIR / filename).read_text(encoding="utf-8"))
            for recipe in data["recipes"]:
                self.assertIn("editorial", recipe, recipe["id"])
                self.assertEqual(set(recipe["editorial"]), {"family", "light"})

    def test_top_thirty_are_the_first_built_ranked_rows(self) -> None:
        rows = cover.top_thirty(self.cat)
        self.assertEqual(len(rows), 30)
        self.assertEqual(rows, self.cat.ranked()[:30])
        self.assertEqual(len({row["id"] for row in rows}), 30)
        self.assertEqual(rows[0]["id"], "C01")
        self.assertEqual(rows[-1]["id"], "M02")

    def test_missing_editorial_block_fails_closed(self) -> None:
        recipe = copy.deepcopy(self.cat.get("C08"))
        del recipe["editorial"]
        self.assertIn("C08: missing field editorial", schema.check_recipe(recipe))

    def test_malformed_editorial_blocks_are_rejected(self) -> None:
        bad: tuple[tuple[object, str], ...] = (
            (None, "must declare"),
            ({}, "editorial.family"),
            ({"family": "fashion", "light": "Window"}, "editorial.family"),
            ({"family": "Masthead", "light": "Flash"}, "editorial.light"),
            ({"family": "Masthead", "light": "Window", "unused": True}, "only declares"),
            ("Masthead Window", "must declare"),
            ({"family": "Masthead", "light": None}, "editorial.light"),
            ({"family": "Studio", "light": "Studio"}, "editorial.family"),
        )
        for grade, expected in bad:
            with self.subTest(grade=grade):
                recipe = copy.deepcopy(self.cat.get("C08"))
                recipe["editorial"] = grade
                self.assertTrue(any(expected in p for p in schema.check_recipe(recipe)))

    def test_loading_edited_recipe_file_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            for filename in (*registry.RECIPE_FILES, registry.ADDON_FILE, registry.RANKING_FILE):
                source = registry.RECIPE_DIR / filename
                Path(folder, filename).write_bytes(source.read_bytes())
            path = Path(folder) / "colour.json"
            data = json.loads(path.read_text(encoding="utf-8"))
            del data["recipes"][0]["editorial"]
            path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
            with self.assertRaisesRegex(registry.CatalogueError, "missing field editorial"):
                registry.load(Path(folder))

    def test_editorial_labels_are_source_owned_and_do_not_change_recipe_ops(self) -> None:
        recipe = copy.deepcopy(self.cat.get("C08"))
        before = engine.plan(recipe, has_skin=True)
        recipe["editorial"] = {"family": "Heritage", "light": "Evening"}
        self.assertEqual(schema.check_recipe(recipe, self.cat.addons), [])
        after = engine.plan(recipe, has_skin=True)
        self.assertEqual(before, after)


class CoverTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.cat = registry.load()
        cls.all_results = [
            result for recipe in cls.cat.ranked()
            for result in cover.evaluate(recipe)
        ]

    def test_top_thirty_pass_cover_gate_on_all_six_drawn_skin_tones(self) -> None:
        priority_ids = {row["id"] for row in cover.top_thirty(self.cat)}
        results = [row for row in self.all_results if row.filter_id in priority_ids]
        status = cover.summary(results)
        self.assertEqual(status["fixture"], "synthetic")
        self.assertEqual(status["filters"], 30)
        self.assertEqual(status["evaluated"], 180)
        self.assertEqual(status["passes"], 180, status)
        self.assertEqual(status["failingFilters"], [])
        self.assertEqual(status["realFacesEvaluated"], 0)
        for result in results:
            self.assertIn(result.tone, cover.TONE_NAMES)
            self.assertGreaterEqual(result.metrics.texture_edges, 12)
            self.assertGreaterEqual(result.metrics.white_pixels, 12)
            self.assertGreaterEqual(result.metrics.skin_pixels, 20)

    def test_every_built_filter_passes_the_synthetic_cover_gate(self) -> None:
        status = cover.summary(self.all_results)
        self.assertEqual(status["fixture"], "synthetic")
        self.assertEqual(status["filters"], 61)
        self.assertEqual(status["evaluated"], 366)
        self.assertEqual(status["passes"], 366, status)
        self.assertEqual(status["failingFilters"], [])
        self.assertEqual(status["realFacesEvaluated"], 0)
        self.assertEqual(len({r.filter_id for r in self.all_results}), 61)

    def test_evening_filter_iteration_keeps_royan_studio_whites_clean(self) -> None:
        rows = [row for row in self.all_results if row.filter_id == "C33"]
        self.assertEqual(len(rows), len(cover.TONE_NAMES))
        self.assertTrue(all(row.passed for row in rows))
        self.assertTrue(all(row.metrics.white_spread <= cover.WHITE_SPREAD_MAX
                            for row in rows))
        self.assertAlmostEqual(
            self.cat.get("C33")["stages"][0]["params"]["highlightAmount"],
            0.045,
        )

    def test_cover_ledger_includes_all_tones_limits_and_individual_metrics(self) -> None:
        ledger = cover.evidence(self.all_results)
        self.assertEqual(len(ledger["results"]), 366)
        self.assertEqual(ledger["passes"], 366)
        self.assertEqual(ledger["coverageFailures"], [])
        self.assertEqual(ledger["realFacesEvaluated"], 0)
        self.assertEqual(ledger["limits"]["whiteSpreadMax"], 15.0)
        self.assertEqual(ledger["limits"]["hueTurnMaxDegrees"], 6.0)
        self.assertEqual(set(ledger["families"]), set(schema.EDITORIAL_FAMILIES))
        self.assertEqual(set(ledger["lights"]), set(schema.EDITORIAL_LIGHTS))
        for breakdown in (ledger["families"], ledger["lights"]):
            self.assertEqual(sum(part["evaluated"] for part in breakdown.values()), 366)
            self.assertEqual(sum(part["passes"] for part in breakdown.values()), 366)
        expected_keys = {
            "textureRatio", "hueTurnDegrees", "chromaRatio", "whiteLevel",
            "whiteSpread", "editorialLift", "whitePixels", "skinPixels",
            "textureEdges", "identityDrift", "textureAlignment",
        }
        for row in ledger["results"]:
            self.assertTrue(row["passed"])
            self.assertEqual(row["problems"], [])
            self.assertIn(row["tone"], cover.TONE_NAMES)
            self.assertEqual(set(row["metrics"]), expected_keys)
            self.assertTrue(all(math.isfinite(value) for value in row["metrics"].values()))
        serialized = json.dumps(ledger, allow_nan=False, sort_keys=True)
        self.assertNotIn("face_image", serialized)
        self.assertNotIn("landmarks", serialized)
        self.assertEqual(ledger, cover.evidence(self.all_results))

    def test_incomplete_duplicate_or_inconsistent_tone_shards_cannot_pass(self) -> None:
        first = self.all_results[:6]
        for malformed, phrase in (
            (first[:-1], "incomplete or repeated"),
            (first + first[:1], "incomplete or repeated"),
            ([replace(first[0], tone="unknown")] + first[1:], "incomplete or repeated"),
            ([replace(first[0], light="Studio" if first[0].light != "Studio" else "Window")]
             + first[1:], "inconsistent editorial grade"),
        ):
            with self.subTest(reason=phrase):
                status = cover.summary(malformed)
                self.assertEqual(status["failingFilters"], [])
                self.assertTrue(any(phrase in failure
                                    for failure in status["coverageFailures"]))

    def test_failed_metric_is_counted_even_with_complete_tone_coverage(self) -> None:
        first = self.all_results[:6]
        wrong = [replace(first[0], problems=("studio whites are not clean",)), *first[1:]]
        status = cover.summary(wrong)
        self.assertEqual(status["passes"], 5)
        self.assertEqual(status["evaluated"], 6)
        self.assertEqual(status["failedChecks"], ["studio whites are not clean"])
        self.assertEqual(status["failingFilters"], [first[0].filter_id])
        self.assertEqual(status["coverageFailures"], [])

    def test_non_finite_metrics_cannot_be_exported_as_valid_evidence(self) -> None:
        sample = self.all_results[0]
        invalid = replace(sample, metrics=replace(sample.metrics, white_level=float("nan")))
        with self.assertRaisesRegex(ValueError, "must be finite"):
            cover.evidence([invalid])
        invalid_inf = replace(sample, metrics=replace(sample.metrics,
                                                     editorial_lift=float("inf")))
        with self.assertRaisesRegex(ValueError, "must be finite"):
            cover.evidence([invalid_inf])

    def test_control_photo_is_deterministic_and_non_destructive(self) -> None:
        a, masks, whites = cover.control_photo("very_dark")
        b, other_masks, other_whites = cover.control_photo("very_dark")
        np.testing.assert_array_equal(a, b)
        np.testing.assert_array_equal(whites, other_whites)
        self.assertFalse(np.shares_memory(a, b))
        self.assertTrue(np.all(a[whites] == 244))
        self.assertTrue(np.all(masks.skin[whites] < 0.75))
        self.assertIsNot(masks, other_masks)

    def test_measurement_does_not_mutate_caller_buffers(self) -> None:
        image, masks, whites = cover.control_photo("medium")
        frozen = image.copy()
        result = engine.render(image, self.cat.get("C08"), masks=masks)
        output = result.image.copy()
        first = cover.measure(image, result.image, masks, whites)
        second = cover.measure(image, result.image, masks, whites)
        self.assertEqual(first, second)
        np.testing.assert_array_equal(image, frozen)
        np.testing.assert_array_equal(result.image, output)

    def test_rejects_absent_and_malformed_control_regions(self) -> None:
        image, masks, whites = cover.control_photo("medium")
        empty = whites & False
        with self.assertRaisesRegex(ValueError, "enough skin and white-card"):
            cover.measure(image, image, masks, empty)
        with self.assertRaisesRegex(ValueError, "boolean"):
            cover.measure(image, image, masks, whites.astype(np.uint8))
        with self.assertRaisesRegex(ValueError, "matching uint8"):
            cover.measure(image, image.astype(np.float32), masks, whites)
        with self.assertRaisesRegex(ValueError, "matching uint8"):
            cover.measure(image, image[:4], masks, whites)
        inside_skin = masks.skin >= 0.75
        with self.assertRaisesRegex(ValueError, "outside the face"):
            cover.measure(image, image, masks, inside_skin)

    def test_missing_skin_outline_is_not_a_pass(self) -> None:
        image, masks, white = cover.control_photo("tan")
        no_skin = replace(masks, skin=None)
        with self.assertRaisesRegex(ValueError, "requires a skin mask"):
            cover.measure(image, image, no_skin, white)

    def test_rejects_blurred_texture(self) -> None:
        image, masks, whites = cover.control_photo("medium")
        flattened = image.copy()
        skin = masks.skin >= 0.75
        flattened[skin] = np.rint(image[skin].mean(axis=0)).astype(np.uint8)
        metrics = cover.measure(image, flattened, masks, whites)
        self.assertIn("texture not preserved", cover.problems(metrics))

    def test_rejects_skin_hue_rotation(self) -> None:
        image, masks, whites = cover.control_photo("tan")
        recoloured = image.copy()
        skin = masks.skin >= 0.75
        recoloured[skin] = recoloured[skin][:, [1, 2, 0]]
        metrics = cover.measure(image, recoloured, masks, whites)
        self.assertIn("skin hue changed", cover.problems(metrics))
        self.assertNotIn("skin hue changed", cover.problems(metrics, monochrome=True))

    def test_rejects_white_card_tint(self) -> None:
        image, masks, whites = cover.control_photo("light")
        tinted = image.copy()
        tinted[whites] = [245, 200, 174]
        metrics = cover.measure(image, tinted, masks, whites)
        self.assertIn("studio whites are not clean", cover.problems(metrics))

    def test_rejects_over_exposed_white_card(self) -> None:
        image, masks, whites = cover.control_photo("very_light")
        dark = image.copy()
        dark[whites] = 115
        metrics = cover.measure(image, dark, masks, whites)
        self.assertIn("studio whites are not clean", cover.problems(metrics))

    def test_rejects_unstyled_and_excessive_lift(self) -> None:
        image, masks, whites = cover.control_photo("medium")
        identity = cover.measure(image, image, masks, whites)
        self.assertIn("editorial lift is absent or too strong", cover.problems(identity))
        excessive = image.copy()
        excessive[~whites] = 0
        metrics = cover.measure(image, excessive, masks, whites)
        self.assertIn("editorial lift is absent or too strong", cover.problems(metrics))

    def test_very_subtle_highlight_look_still_has_local_lift(self) -> None:
        results = cover.evaluate(self.cat.get("C106"))
        self.assertEqual(len(results), 6)
        self.assertTrue(all(result.passed for result in results))
        self.assertTrue(all(result.metrics.editorial_lift >= cover.LIFT_MIN for result in results))

    def test_monochrome_exempts_hue_but_not_texture_or_whites(self) -> None:
        result = cover.evaluate(self.cat.get("M02"), tones=["very_dark"])[0]
        self.assertTrue(result.passed)
        self.assertGreater(result.metrics.hue_turn, cover.HUE_TURN_MAX)
        self.assertLess(result.metrics.white_spread, cover.WHITE_SPREAD_MAX)


if __name__ == "__main__":
    unittest.main()
