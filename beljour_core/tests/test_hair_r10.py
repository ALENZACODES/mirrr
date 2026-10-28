"""R10 Hair Studio catalogue, pose, variant and synthetic Q15/Q16 regression checks.

Only hand-drawn fixture images. No installed real-face corpus, network request, model
weights, YouCam keys or third-party photo enters this test module.
Author: John Khan.
"""
from __future__ import annotations

import copy
import io
import json
import unittest

from PIL import Image, ImageDraw

from plumb_api.actions import ACTIONS, ActionError, build
from plumb_api.styling.catalogue import (
    CATALOGUE_FORMAT, DATA_PATH, GROUPS, LENGTHS, TEXTURES, CatalogueError,
    catalogue, cassette_templates, filtered, parse_catalogue, summary,
)
from plumb_api.styling.pose import evaluate
from plumb_api.styling.replay_quality import (
    REPLAY_IMAGE, face_outside_hair_ssim, inspect_replay, synthetic_quality,
)
from plumb_api.styling.variants import build as board, parse_modifiers, strength
from plumb_api.consent import scope_for
from plumb_api.demo.synthetic import draw_sample_face
from plumb_api.pipeline import endpoint_version
from plumb_api.providers.youcam import STYLING, LEGACY


def example_mesh() -> list[list[float]]:
    """Invented normalized 478-point geometry (not derived from an actual face)."""
    values = [[0.5, 0.5, 0.0] for _ in range(478)]
    for index, xy in {
        33: (0.38, 0.38), 263: (0.62, 0.38), 1: (0.50, 0.51),
        10: (0.5, 0.16), 152: (0.5, 0.88),
        234: (0.22, 0.48), 454: (0.78, 0.48),
    }.items():
        values[index][:2] = xy
    return values


class HairCatalogueR10(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.record = json.loads(DATA_PATH.read_text(encoding="utf-8"))
        cls.hairs = catalogue()

    def test_schema_is_pinned(self):
        self.assertEqual(self.record["format"], CATALOGUE_FORMAT)
        self.assertEqual(tuple(item["id"] for item in self.record["groups"]), GROUPS)

    def test_synthetic_s1_items_equal_the_existing_cassette_not_a_guess(self):
        seed = cassette_templates()
        self.assertEqual(len(seed), 12)
        self.assertEqual({item.template_id: item.name for item in self.hairs if item.source == "synthetic-s1"}, seed)

    def test_more_styles_with_short_sides_in_the_reference_library(self):
        self.assertGreaterEqual(len(self.hairs), 60)
        self.assertGreaterEqual(len([s for s in self.hairs if s.group == "short-sides"]), 10)
        self.assertGreaterEqual(len([s for s in self.hairs if s.group in {"pixie", "bob", "layers"}]), 20)
        self.assertEqual(len(set(item.id for item in self.hairs)), len(self.hairs))

    def test_no_generated_image_claim_for_each_style(self):
        self.assertTrue(all(not item.verified_for_live for item in self.hairs))
        self.assertTrue(all(item.source == "inspiration" or item.can_render_demo for item in self.hairs))
        self.assertTrue(all(item.template_id is None for item in self.hairs if item.is_idea))
        self.assertEqual(summary(self.hairs)["live_verified"], 0)

    def test_basic_query_and_search(self):
        for group in GROUPS:
            with self.subTest(group=group):
                got = filtered(self.hairs, group=group)
                self.assertTrue(got)
                self.assertTrue(all(s.group == group for s in got))
        self.assertTrue(filtered(self.hairs, search="crop"))
        self.assertTrue(filtered(self.hairs, search="fade"))
        self.assertTrue(filtered(self.hairs, search="BOB"))
        self.assertFalse(filtered(self.hairs, search="no-match-xyz-123"))

    def test_texture_and_length_intersection(self):
        for texture in TEXTURES:
            selected = filtered(self.hairs, texture=texture)
            self.assertTrue(selected)
            self.assertTrue(all(texture in s.textures for s in selected))
        for length in LENGTHS:
            selected = filtered(self.hairs, length=length)
            self.assertTrue(selected)
            self.assertTrue(all(length in s.lengths for s in selected))
        both = filtered(self.hairs, texture="coily", length="short")
        self.assertTrue(both)
        self.assertTrue(all("coily" in s.textures and "short" in s.lengths for s in both))

    def test_demo_only_is_not_a_live_template_eligibility_filter(self):
        got = filtered(self.hairs, demos_only=True)
        self.assertEqual(len(got), 12)
        self.assertTrue(all(s.can_render_demo and not s.verified_for_live for s in got))

    def test_reject_non_catalogue_search(self):
        for selection in ({"group": "faces"}, {"texture": "unknown"}, {"length": "unknown"}, {"search": "a" * 81}):
            with self.subTest(selection=selection), self.assertRaises(CatalogueError):
                filtered(self.hairs, **selection)

    def test_reject_duplicate_style_id(self):
        raw = copy.deepcopy(self.record)
        raw["styles"].append(copy.deepcopy(raw["styles"][0]))
        with self.assertRaisesRegex(CatalogueError, "duplicate"):
            parse_catalogue(raw, cassette=cassette_templates())

    def test_reject_unlisted_template_id(self):
        raw = copy.deepcopy(self.record)
        synthetic = next(s for s in raw["styles"] if s["source"] == "synthetic-s1")
        synthetic["template_id"] = "tpl-imaginary"
        with self.assertRaises(CatalogueError):
            parse_catalogue(raw, cassette=cassette_templates())

    def test_reject_inspiration_with_provider_id(self):
        raw = copy.deepcopy(self.record)
        concept = next(s for s in raw["styles"] if s["source"] == "inspiration")
        concept["template_id"] = "tpl-bob"
        with self.assertRaises(CatalogueError):
            parse_catalogue(raw, cassette=cassette_templates())

    def test_reject_inspiration_spoofing_s1_source(self):
        raw = copy.deepcopy(self.record)
        concept = next(s for s in raw["styles"] if s["source"] == "inspiration")
        concept["source"] = "synthetic-s1"
        with self.assertRaises(CatalogueError):
            parse_catalogue(raw, cassette=cassette_templates())

    def test_reject_s1_manifest_that_was_not_verified(self):
        with self.assertRaises(CatalogueError):
            parse_catalogue(self.record, cassette=cassette_templates(), verified_ids=frozenset({"unknown"}))

    def test_explicit_verified_set_is_not_default(self):
        rows = catalogue(frozenset({"tpl-bob"}))
        self.assertEqual(summary(rows)["live_verified"], 1)
        self.assertEqual(summary(catalogue())["live_verified"], 0)
        self.assertFalse(next(s for s in rows if s.is_idea).verified_for_live)

    def test_catalogue_copy_is_original_neutral_and_women_first(self):
        words = " ".join(s.name + " " + s.description for s in self.hairs).casefold()
        for banned in ("fix your flaw", "whiter skin", "slim your face", "skin bleaching"):
            self.assertNotIn(banned, words)
        self.assertIn("bob", words)
        self.assertIn("fade", words)
        self.assertIn("layers", words)


class HairPoseR10(unittest.TestCase):
    def test_good_synthetic_mesh_is_accepted(self):
        result = evaluate(example_mesh(), width=900, height=1100)
        self.assertTrue(result.acceptable, result.reasons)
        self.assertEqual(result.roll_degrees, 0)
        self.assertLess(result.yaw_proxy, 0.1)
        self.assertEqual(result.confidence, "geometric proxy")

    def test_missing_points_fail_closed(self):
        for pts in (None, [], [[0.5, 0.5]] * 454):
            with self.subTest(length=len(pts) if pts else 0):
                r = evaluate(pts, width=900, height=1100)
                self.assertFalse(r.acceptable)
                self.assertEqual(r.confidence, "unavailable")

    def test_roll_over_safety_limit_blocks(self):
        mesh = example_mesh()
        mesh[263][1] = 0.52
        result = evaluate(mesh, width=900, height=1100)
        self.assertFalse(result.acceptable)
        self.assertGreater(abs(result.roll_degrees), 14)
        self.assertIn("tilted", " ".join(result.reasons))

    def test_turning_proxy_is_not_a_measured_head_pose(self):
        mesh = example_mesh()
        mesh[1][0] = 0.67
        r = evaluate(mesh, width=900, height=1100)
        self.assertFalse(r.acceptable)
        self.assertGreater(r.yaw_proxy, 0.3)
        self.assertIn("turned", " ".join(r.reasons))

    def test_small_face_is_retake(self):
        mesh = example_mesh()
        mesh[33][0] = 0.496
        mesh[263][0] = 0.504
        self.assertFalse(evaluate(mesh, width=900, height=1100).acceptable)

    def test_face_at_edge_is_retake(self):
        mesh = example_mesh()
        mesh[234][0] = 0.001
        self.assertFalse(evaluate(mesh, width=900, height=1100).acceptable)

    def test_nonfinite_landmark_is_retake(self):
        for bad in (float("nan"), float("inf"), -0.2, 1.3):
            mesh = example_mesh()
            mesh[1][0] = bad
            self.assertFalse(evaluate(mesh, width=900, height=1100).acceptable)

    def test_dimensions_outside_range_rejected(self):
        for width, height in ((31, 100), (100, 20), (100, 30001)):
            with self.assertRaises(ValueError):
                evaluate(example_mesh(), width=width, height=height)

    def test_pose_is_never_a_person_quality_rating(self):
        r = evaluate(example_mesh(), width=900, height=1100).as_dict()
        self.assertEqual(set(r), {"acceptable", "roll_degrees", "yaw_proxy", "face_share", "reasons", "confidence"})
        self.assertNotIn("beauty", r)
        self.assertNotIn("age", r)


class HairVariantsR10(unittest.TestCase):
    def test_grid_is_four_slots_without_provider_calls(self):
        grid = board(catalogue()[:2])
        self.assertEqual(len(grid), 4)
        self.assertEqual(grid[0].slot, 0)
        self.assertEqual(grid[-1].state, "empty")
        self.assertTrue(all(s.estimated_units is None for s in grid))

    def test_nine_slots_and_no_duplicate_photograph(self):
        grid = board(catalogue()[:6], size=9)
        self.assertEqual(len(grid), 9)
        self.assertEqual(sum(s.state == "empty" for s in grid), 3)
        self.assertTrue(all(s.state != "ready" for s in grid))

    def test_live_ready_requires_verified_id_and_explicit_mode(self):
        example = catalogue(frozenset({"tpl-bob"}))
        first = [next(s for s in example if s.id == "tpl-bob"), *[s for s in example if s.id != "tpl-bob"]]
        no = board(first, permit_live=False)
        yes = board(first, permit_live=True)
        self.assertTrue(all(s.estimated_units is None for s in no))
        self.assertEqual(sum(s.state == "ready" for s in yes), 1)
        self.assertEqual(sum(s.state == "ready" for s in board(catalogue(), permit_live=True)), 0)

    def test_strength_is_strict_0_to_100_and_gender_neutral(self):
        for value in (0, 1, 25, 30, 80, 100):
            self.assertEqual(strength(value), value)
        for value in (True, None, "90", 101, -1, float("nan"), float("inf")):
            with self.subTest(value=value), self.assertRaises(ValueError):
                strength(value)

    def test_modifiers_only_nonzero_create_extra_tasks(self):
        self.assertEqual(parse_modifiers({"bangs": 0, "curl": 25, "volume": 30}), (("curl", 25), ("volume", 30)))
        self.assertEqual(parse_modifiers({"bangs": 0, "curl": 0}), ())
        self.assertRaises(ValueError, parse_modifiers, {"shape": 99})
        self.assertRaises(ValueError, parse_modifiers, ["bangs"])

    def test_provider_units_are_only_provisional_and_only_on_ready_cells(self):
        records = catalogue(frozenset({"tpl-bob"}))
        first = [next(s for s in records if s.id == "tpl-bob"), *[s for s in records if s.id != "tpl-bob"]]
        rendered = board(first, size=4, permit_live=True,
                         modifiers={"curl": 10, "volume": 20})
        ready = [s for s in rendered if s.state == "ready"]
        self.assertEqual(len(ready), 1)
        self.assertEqual(ready[0].estimated_units, 4)
        self.assertTrue(all(s.estimated_units is None for s in rendered if s.state != "ready"))

    def test_inspiration_stays_inspiration_even_when_live_requested(self):
        ideas = [s for s in catalogue() if s.is_idea]
        self.assertTrue(ideas)
        self.assertTrue(all(s.state == "inspiration" and s.estimated_units is None for s in board(ideas, permit_live=True)))

    def test_every_cell_has_explanatory_provenance_copy(self):
        for size in (4, 9):
            with self.subTest(grid=size):
                out = board(catalogue(), size=size)
                self.assertTrue(all(s.reason for s in out))
                self.assertFalse(any("real person" in s.reason.lower() for s in out))


class HairCassetteR10(unittest.TestCase):
    def test_q15_replay_has_12_templates_valid_sequence_and_no_api_call(self):
        result = inspect_replay()
        self.assertEqual(result["template_count"], 12)
        self.assertTrue(result["synthetic"])
        self.assertEqual(result["image_blob"], REPLAY_IMAGE.name)

    def test_q16_facial_skin_was_not_reconstructed(self):
        result = synthetic_quality()
        self.assertTrue(result.q15_passed)
        self.assertTrue(result.q16_passed)
        self.assertGreaterEqual(result.ssim, 0.95)
        self.assertIn("synthetic", result.note)
        self.assertNotIn("reference app PASS", result.note)

    def test_corrupting_face_detects_changed_pixels(self):
        raw = draw_sample_face()
        with Image.open(io.BytesIO(raw)) as base:
            im = base.convert("RGB")
        g = ImageDraw.Draw(im)
        g.rectangle((300, 460, 520, 750), fill=(0, 0, 0))
        output = io.BytesIO()
        im.save(output, format="JPEG", quality=93)
        result, diff = face_outside_hair_ssim(raw, output.getvalue())
        self.assertLess(result, 0.95)
        self.assertGreater(diff, 3)

    def test_reject_mismatched_synthetic_image_dimensions(self):
        raw = draw_sample_face()
        with Image.open(io.BytesIO(raw)) as original:
            output = io.BytesIO()
            original.resize((200, 200)).save(output, format="JPEG")
        with self.assertRaises(ValueError):
            face_outside_hair_ssim(raw, output.getvalue())

    def test_reject_undeclared_or_tiny_mask(self):
        raw = draw_sample_face()
        for box in ((0.4, 0.4, 0.4, 0.7), (-1, 0.4, 0.9, 0.7), (0.1, 0.1, 1.4, 0.7),
                    (float("nan"), 0.1, 0.9, 0.7), (0.4, 0.4, 0.403, 0.404)):
            with self.subTest(box=box), self.assertRaises(ValueError):
                face_outside_hair_ssim(raw, raw, box=box)

    def test_q15_rejects_tampered_replay(self):
        from tempfile import TemporaryDirectory
        from pathlib import Path
        with TemporaryDirectory() as dirname:
            payload = json.loads((REPLAY_IMAGE.parent / "s2_hairstyle.json").read_text())
            payload["synthetic"] = False
            test_path = Path(dirname) / "bad.json"
            test_path.write_text(json.dumps(payload))
            with self.assertRaises(ValueError):
                inspect_replay(test_path)


class HairScopeR10(unittest.TestCase):
    def test_reference_is_one_allowed_styling_action(self):
        self.assertIn("hair-transfer", ACTIONS)
        self.assertIn("hair-transfer", STYLING)
        self.assertNotIn("hair-transfer", LEGACY)
        self.assertEqual(scope_for("hair-transfer"), "hair")

    def test_reference_keeps_source_and_reference_distinct(self):
        feature, payload = build("hair-transfer", {})
        self.assertEqual(feature, "hair-transfer")
        self.assertEqual(payload, {})
        self.assertEqual(endpoint_version(feature), "v2.1")

    def test_reference_options_not_an_arbitrary_provider_payload(self):
        for options in ({"face_resize": 50}, {"template_id": "tpl-synthetic"}, {"ref_file_id": "anything"}):
            with self.subTest(options=options), self.assertRaises(ActionError):
                build("hair-transfer", options)
