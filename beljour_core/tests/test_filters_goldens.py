"""A2 goldens, A3 properties, §3.4 distinctness and A5 parity-file freshness for the FX1 filters."""
from __future__ import annotations

import importlib.util
import json
import unittest
from pathlib import Path

from plumb_api.filters import parity
from plumb_api.filters.qa import distinct, fixtures, goldens
from plumb_api.filters.recipe import registry

REPO = Path(__file__).resolve().parents[2]


def sync_module():  # type: ignore[no-untyped-def]
    spec = importlib.util.spec_from_file_location("sync_filters", REPO / "scripts/sync_filters.py")
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class GoldenTest(unittest.TestCase):
    def test_every_filter_matches_its_golden(self) -> None:
        try:
            import PIL  # noqa: F401
        except ImportError:  # pragma: no cover - Pillow is in requirements.txt
            self.skipTest("Pillow is needed to read golden PNGs")
        self.assertEqual(goldens.check(), [])

    def test_manifest_lists_two_goldens_per_filter(self) -> None:
        listed = goldens.load_manifest()["goldens"]
        self.assertEqual(len(listed), 2 * len(registry.default().recipes))
        for name, row in listed.items():
            self.assertRegex(row["png_sha256"], r"^[0-9a-f]{64}$")
            self.assertRegex(row["output_sha256"], r"^[0-9a-f]{64}$")
            self.assertIn(row["recipe"], registry.default().ids(), name)


class DistinctTest(unittest.TestCase):
    def test_no_two_looks_in_a_tab_are_near_copies(self) -> None:
        close = distinct.too_close()
        self.assertEqual(close, [], [f"{p.tab}: {p.a} vs {p.b} {p.mean_de:.2f}" for p in close])

    def test_the_distinctness_check_catches_a_copy(self) -> None:
        cat = registry.default()
        twin = dict(cat.get("C08"), id="C96", name="Twin", rank=500)
        copy = registry.Catalogue(cat.recipes + (twin,), cat.addons, cat.ranking, cat.files)
        self.assertTrue(any({p.a, p.b} == {"C08", "C96"} for p in distinct.too_close(copy)))


class PropertyTest(unittest.TestCase):
    def test_strength_zero_monotone_deterministic_and_kept_areas(self) -> None:
        face = fixtures.portrait("medium", width=128, height=152)
        problems: list[str] = []
        for recipe in registry.default().ranked():
            problems += distinct.property_problems(recipe, face) + distinct.kept_area_problems(recipe, face)
        self.assertEqual(problems, [])


class ParityFileTest(unittest.TestCase):
    def test_committed_vectors_and_generated_recipes_are_current(self) -> None:
        module = sync_module()
        for path, text in module.outputs().items():
            self.assertTrue(path.exists(), path)
            self.assertEqual(path.read_text(encoding="utf-8"), text, f"{path.name} drifted: run python scripts/sync_filters.py")

    def test_vector_file_covers_every_kernel(self) -> None:
        doc = json.loads(parity.PATH.read_text(encoding="utf-8"))
        self.assertEqual(doc["format"], parity.FORMAT)
        self.assertGreaterEqual(doc["vectorCount"], 40)
        self.assertEqual({v["op"] for v in doc["ops"]}, set(parity.OP_CASES))
        self.assertEqual(len(doc["luts"]), 2 * len(registry.default().recipes))
        self.assertEqual({v["op"] for v in doc["spatial"]}, {"spatial.glow", "spatial.halation", "light.border", "light.vignette", "light.centre", "light.grade"})
        self.assertTrue(any(v["fallback"] for v in doc["renders"]))
        self.assertTrue(any(v["settings"].get("preset") for v in doc["renders"]))
        self.assertIn("no photo of a person", doc["about"])


if __name__ == "__main__":
    unittest.main()
