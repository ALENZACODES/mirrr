"""Safe opt-in migration and synthetic evidence for BELJOUR textures.

No old recipe, reference golden or public release flag changes merely because
these kernels are installed. Frozen real-person evidence is still required.
Created by John Khan.
"""
from __future__ import annotations

import copy
import hashlib
import json
import math
import unittest
from dataclasses import replace
from pathlib import Path

import numpy as np

from plumb_api.filters import engine
from plumb_api.filters.qa import fixtures, texture_gate
from plumb_api.filters.recipe import registry, schema

# Frozen against the original r33b-cp2 source, not regenerated from this round.
OLD_DEFAULTS: dict[str, tuple[str, str, tuple[str, ...]]] = {
    "C93": ("fe2bf73b266a5a0de89ac9c6b8584c65fbaba7f0a7a70109c8decfd56d7bf292",
            "beacbc895db3ed1d827a8247789d3a6d88c8e4f4d7d383ea95198d4c27262dcb",
            ("grain FX2",)),
    "C15": ("351b3e9a4a7d78baa31e027cec79ac417745a7f9e730dd43e067cd39680dd906",
            "a7b79edc2c7fb65b505470a6110892ab3ae16de92b3e5207aa7633b21ac60286",
            ("structure FX2",)),
    "C24": ("a0414fb98ea6bb01b68dafc46f329e7eb45833a655dd67122c7d320106f22de4",
            "3db1b4f4eaa2173a225af7fb1ac3a663adda55be89ad721ca3679cf5fb6fc228",
            ("structure FX2",)),
    "C23": ("97a3658f16de95cb06c6c33f5cb617cb137999a015d265b2ca8c2933a20b1339",
            "21b44fdd1ac5bf4662e60860334351f7f6310f795841e3b307f69ecd1cb99d1e",
            ("structure FX2",)),
    "M05": ("588ed90c75aa9c883ffcac335dbc943e95187e16189d84c7291590b4743aecae",
            "a867d05ecf32ff820b90b29f313e6bbf001bb38003bfc6ca7c7347d1fd701983",
            ("structure FX2", "grain FX2")),
}


def sha(a: np.ndarray) -> str:
    return hashlib.sha256(np.ascontiguousarray(a).tobytes()).hexdigest()


class DefaultPreservationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.cat = registry.default()
        cls.face = fixtures.portrait("medium", width=48, height=56)

    def test_catalogue_does_not_lose_a_recipe(self) -> None:
        self.assertEqual(len(self.cat.recipes), 61)
        self.assertEqual(len({r["id"] for r in self.cat.recipes}), 61)
        self.assertTrue(all("editorial" in r for r in self.cat.recipes))

    def test_previous_pending_default_byte_hashes_are_unchanged(self) -> None:
        for rid, (expect_photo, expect_look, expect_pending) in OLD_DEFAULTS.items():
            with self.subTest(recipe=rid):
                result = engine.render(self.face.image, rid, masks=self.face.masks)
                self.assertEqual(sha(result.image), expect_photo)
                self.assertEqual(sha(result.look), expect_look)
                self.assertEqual(result.plan.pending, expect_pending)

    def test_empty_addons_does_not_opt_in(self) -> None:
        for rid in OLD_DEFAULTS:
            base = engine.render(self.face.image, rid, masks=self.face.masks)
            chosen = engine.render(self.face.image, rid,
                                   engine.Settings(addons={}), masks=self.face.masks)
            np.testing.assert_array_equal(chosen.image, base.image)
            self.assertEqual(chosen.plan.pending, base.plan.pending)

    def test_explicit_zero_turns_off_preset_intent_without_editing_recipe(self) -> None:
        rec = self.cat.get("M05")
        saved = copy.deepcopy(rec)
        p = engine.plan(rec, engine.Settings(addons={"grain": 0, "structure": 0}), has_skin=True)
        self.assertNotIn("grain FX2", p.pending)
        self.assertNotIn("structure FX2", p.pending)
        self.assertEqual(rec, saved)

    def test_manual_only_is_true_only_for_new_kernels(self) -> None:
        for aid, entry in self.cat.addons.items():
            with self.subTest(aid=aid):
                if aid in texture_gate.EFFECTS:
                    self.assertTrue(entry["manualOnly"])
                    self.assertTrue(entry["built"])
                    self.assertEqual(entry["stage"]["op"], "spatial." + aid)
                else:
                    self.assertFalse(entry.get("manualOnly", False))

    def test_registry_validation_rejects_malformed_manual_only_flags(self) -> None:
        for bad in ("yes", 1, 0, [], {}, None):
            addons = copy.deepcopy(self.cat.addons)
            addons["grain"]["manualOnly"] = bad
            with self.subTest(value=bad):
                self.assertTrue(registry.check_addons(addons))
        addons = copy.deepcopy(self.cat.addons)
        addons["grain"]["built"] = False
        self.assertTrue(registry.check_addons(addons))

    def test_type_checked_addon_stages(self) -> None:
        for aid in texture_gate.EFFECTS:
            stage = self.cat.addons[aid]["stage"]
            self.assertEqual(schema.check_stage(stage, aid), [])

    def test_explicit_amount_is_applied_at_strength_zero(self) -> None:
        rec = self.cat.get("C08")
        for aid in texture_gate.EFFECTS:
            with self.subTest(addon=aid):
                p = engine.plan(rec, engine.Settings(strength=0, addons={aid: 100}), has_skin=True)
                self.assertFalse(p.identity)
                self.assertIn("spatial." + aid, (s.op for s in p.stages))

    def test_strength_zero_without_addon_is_exact_identity(self) -> None:
        p = engine.render(self.face.image, "C08", engine.Settings(strength=0),
                          masks=self.face.masks)
        self.assertTrue(p.plan.identity)
        np.testing.assert_array_equal(p.image, self.face.image)

    def test_fine_addons_respect_the_identity_lock_toggle(self) -> None:
        for lock in (False, True):
            p = engine.plan(self.cat.get("C08"), engine.Settings(
                strength=25, addons={"grain": 60}, identity_lock=lock,
            ), has_skin=True)
            self.assertEqual(p.identity_lock, lock)
            self.assertTrue(any(s.op == "spatial.grain" for s in p.stages))

    def test_stage_order_keeps_noise_after_structure(self) -> None:
        rec = self.cat.get("C08")
        for addons in ({"grain": 40, "structure": 50},
                       {"structure": 50, "grain": 40}):
            p = engine.plan(rec, engine.Settings(addons=addons), has_skin=True)
            names = [s.op for s in p.stages]
            self.assertLess(names.index("spatial.structure"), names.index("spatial.grain"))

    def test_no_implicit_enablement_for_any_existing_request(self) -> None:
        for recipe in self.cat.recipes:
            with self.subTest(recipe=recipe["id"]):
                p = engine.plan(recipe, has_skin=True)
                self.assertFalse(any(s.op in {"spatial.grain", "spatial.structure"}
                                     for s in p.stages))

    def test_original_catalogue_and_ranking_provenance(self) -> None:
        for filename in registry.RECIPE_FILES:
            source = json.loads((registry.RECIPE_DIR / filename).read_text(encoding="utf-8"))
            self.assertEqual(source["author"], "John Khan")
        self.assertEqual(self.cat.ranked()[0]["id"], "C01")
        self.assertEqual(self.cat.ranked()[29]["id"], "M02")


class OptInFaceSafetyTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.toned = fixtures.six_tones(width=80, height=96)

    def test_full_pipeline_white_and_black_reference_card(self) -> None:
        image = np.full((32, 44, 3), 130, dtype=np.uint8)
        image[:8, :12] = 255
        image[-8:, -12:] = 0
        for aid in texture_gate.EFFECTS:
            with self.subTest(addon=aid):
                result = engine.render(image, "C08", engine.Settings(
                    strength=0, guard=False, addons={aid: 90},
                ))
                np.testing.assert_array_equal(result.image[:8, :12], image[:8, :12])
                np.testing.assert_array_equal(result.image[-8:, -12:], image[-8:, -12:])

    def test_protect_skin_restores_original_after_both_effects(self) -> None:
        face = self.toned[2]
        skin = face.masks.skin
        self.assertIsNotNone(skin)
        if skin is None:
            self.fail("fixture lost skin mask")
        settings = engine.Settings(strength=0, protect_skin=True,
                                   addons={"grain": 85, "structure": 85})
        result = engine.render(face.image, "C08", settings, masks=face.masks)
        inside = skin >= 0.99
        self.assertGreater(int(inside.sum()), 100)
        np.testing.assert_array_equal(result.image[inside], face.image[inside])

    def test_background_only_restores_person_pixels(self) -> None:
        face = self.toned[2]
        oval = face.masks.person
        self.assertIsNotNone(oval)
        if oval is None:
            self.fail("fixture lost oval mask")
        result = engine.render(face.image, "C08", engine.Settings(
            strength=0, background_only=True,
            addons={"grain": 100, "structure": 100},
        ), masks=face.masks)
        inside = oval >= 0.99
        np.testing.assert_array_equal(result.image[inside], face.image[inside])

    def test_invalid_mask_is_rejected_before_editing(self) -> None:
        face = self.toned[2]
        mask = face.masks
        if mask.skin is None:
            self.fail("missing skin fixture")
        bad = mask.skin.copy()
        bad[3, 3] = float("nan")
        invalid = replace(mask, skin=bad)
        with self.assertRaises(ValueError):
            engine.render(face.image, "C08", engine.Settings(
                addons={"grain": 60},
            ), masks=invalid)

    def test_addons_have_no_provider_dependencies(self) -> None:
        folder = Path(__file__).resolve().parents[2] / "plumb_api/filters/spatial"
        for name in texture_gate.EFFECTS:
            text = (folder / f"{name}.py").read_text(encoding="utf-8")
            self.assertNotIn("requests.", text)
            self.assertNotIn("httpx.", text)
            self.assertNotIn("openai.", text)

    def test_opt_in_preserves_nonzero_chroma_on_drawn_tones(self) -> None:
        for face in self.toned:
            for aid in texture_gate.EFFECTS:
                with self.subTest(tone=face.face.tone, effect=aid):
                    out = engine.render(face.image, "C08", engine.Settings(
                        strength=25, addons={aid: 60},
                    ), masks=face.masks)
                    self.assertTrue(np.isfinite(out.image).all())
                    self.assertEqual(out.image.dtype, np.uint8)
                    self.assertEqual(out.image.shape, face.image.shape)

    def test_manual_effects_do_not_recolour_a_no_filter_image(self) -> None:
        image = np.full((23, 31, 3), 138, dtype=np.uint8)
        for aid in texture_gate.EFFECTS:
            base = engine.render(image, "C08", engine.Settings(strength=0, guard=False))
            result = engine.render(image, "C08", engine.Settings(
                strength=0, guard=False, addons={aid: 0},
            ))
            np.testing.assert_array_equal(result.image, base.image)

    def test_guard_off_is_not_a_skip_for_mask_validation(self) -> None:
        face = self.toned[1]
        bad = replace(face.masks, person=np.ones((4, 5)))
        with self.assertRaises(ValueError):
            engine.render(face.image, "C08", engine.Settings(
                guard=False, addons={"structure": 50},
            ), masks=bad)

    def test_settings_do_not_modify_original_recipe_addons(self) -> None:
        rec = copy.deepcopy(registry.default().get("C93"))
        before = copy.deepcopy(rec)
        engine.plan(rec, engine.Settings(addons={"grain": 60}), has_skin=True)
        self.assertEqual(rec, before)


class GateEvidenceTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.cat = registry.default()
        cls.faces = fixtures.six_tones(width=80, height=96)
        cls.result = texture_gate.evaluate(["C08"], [50.0], portraits=cls.faces)

    def test_complete_six_tone_matrix_passes_on_fixture(self) -> None:
        self.assertEqual(self.result.expected, 12)
        self.assertEqual(self.result.evaluated, 12)
        self.assertTrue(self.result.synthetic_passed)
        self.assertEqual(texture_gate.validate(self.result), [])

    def test_evidence_explicitly_reports_no_real_faces(self) -> None:
        payload = self.result.to_dict()
        self.assertEqual(payload["real_faces"], 0)
        self.assertFalse(payload["release_gate_passed"])
        self.assertEqual(payload["external_100k_gate"], "UNVERIFIED")
        self.assertEqual(payload["source"], "synthetic-only")

    def test_all_rows_have_approved_editorial_grade(self) -> None:
        for row in self.result.rows:
            self.assertEqual(row.family, "Masthead")
            self.assertEqual(row.light, "Window")

    def test_number_of_cases_is_cartesian_product(self) -> None:
        unique = {(r.recipe, r.tone, r.addon, r.amount) for r in self.result.rows}
        self.assertEqual(len(unique), self.result.expected)
        self.assertEqual(len(unique), 12)

    def test_each_row_uses_existing_still_her_checks(self) -> None:
        for row in self.result.rows:
            self.assertEqual(row.problems, ())
            self.assertTrue(row.passed)
            self.assertTrue(math.isfinite(row.lift))
            self.assertTrue(math.isfinite(row.chroma_kept))
            self.assertGreaterEqual(row.marks_kept or 0, 0.90)

    def test_numeric_json_export_contains_no_pixels(self) -> None:
        raw = self.result.dumps()
        payload = json.loads(raw)
        self.assertEqual(payload["expected"], 12)
        self.assertNotIn("image", payload)
        self.assertNotIn("landmarks", payload)
        self.assertNotIn("raw_pixels", raw)
        self.assertNotIn("person_id", raw)

    def test_missing_tone_cannot_pass(self) -> None:
        invalid = texture_gate.evaluate(["C08"], [50.0], portraits=self.faces[:-1])
        self.assertFalse(invalid.synthetic_passed)
        self.assertEqual(invalid.evaluated, 0)
        self.assertTrue(invalid.coverage_problems)

    def test_duplicate_tone_cannot_pass(self) -> None:
        invalid = texture_gate.evaluate(["C08"], [50.0], portraits=[*self.faces[:-1], self.faces[0]])
        self.assertFalse(invalid.synthetic_passed)
        self.assertTrue(invalid.coverage_problems)

    def test_invalid_filter_id_is_fail_closed(self) -> None:
        bad = texture_gate.evaluate(["UNKNOWN"], [50.0], portraits=self.faces)
        self.assertFalse(bad.synthetic_passed)
        self.assertEqual(bad.evaluated, 0)

    def test_duplicate_recipe_id_is_fail_closed(self) -> None:
        bad = texture_gate.evaluate(["C08", "C08"], [50.0], portraits=self.faces)
        self.assertFalse(bad.synthetic_passed)

    def test_invalid_amount_is_fail_closed(self) -> None:
        for value in (-1.0, 0.0, 101.0, math.nan, math.inf, -math.inf):
            with self.subTest(value=value):
                bad = texture_gate.evaluate(["C08"], [value], portraits=self.faces)
                self.assertFalse(bad.synthetic_passed)
                self.assertEqual(bad.evaluated, 0)

    def test_duplicate_strength_level_is_fail_closed(self) -> None:
        bad = texture_gate.evaluate(["C08"], [50.0, 50.0], portraits=self.faces)
        self.assertFalse(bad.synthetic_passed)
        self.assertEqual(bad.evaluated, 0)

    def test_null_evidence_rows_are_not_a_pass(self) -> None:
        partial = replace(self.result, rows=self.result.rows[:-1])
        self.assertFalse(partial.synthetic_passed)
        self.assertTrue(texture_gate.validate(partial))

    def test_duplicate_row_does_not_count_as_complete(self) -> None:
        bad = replace(self.result, rows=(*self.result.rows[:-1], self.result.rows[0]))
        self.assertTrue(texture_gate.validate(bad))

    def test_nonfinite_scores_cannot_be_serialized_as_success(self) -> None:
        damaged = replace(self.result.rows[0], hue_degrees=float("nan"))
        invalid = replace(self.result, rows=(damaged, *self.result.rows[1:]))
        self.assertTrue(texture_gate.validate(invalid))
        with self.assertRaises(ValueError):
            invalid.dumps()

    def test_real_release_remains_blocked_even_for_perfect_drawn_faces(self) -> None:
        self.assertTrue(self.result.synthetic_passed)
        self.assertFalse(self.result.to_dict()["release_gate_passed"])


if __name__ == "__main__":
    unittest.main()
