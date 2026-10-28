"""Name scanner v1, asset guard and the filters boundary rule (filters-plan.md §6.5, A7).

The scanner's own tests use made-up names only (never a real one), hashed into temp lists."""
from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from plumb_api.filters.qa import assets, names
from plumb_api.filters.recipe import registry

REPO = Path(__file__).resolve().parents[2]
MADE_UP = ["Zorblaxine", "Quvette Plume", "Mirth-o-Matic", "Flizzard Glow 2"]


def boundaries():  # type: ignore[no-untyped-def]
    spec = importlib.util.spec_from_file_location("check_boundaries", REPO / "scripts/check_boundaries.py")
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class NormaliseTest(unittest.TestCase):
    def test_normalise_folds_case_accents_and_separators(self) -> None:
        self.assertEqual(names.normalise("Étretat-Bleu_Clair"), "etretat bleu clair")
        self.assertEqual(names.normalise("mirthOMatic"), "mirth o matic")
        self.assertEqual(names.words("  Saint—Malo!! "), ["saint", "malo"])

    def test_variants_cover_spacing_joins_and_numerals(self) -> None:
        v = names.variants("Flizzard Glow 2")
        self.assertIn("flizzard glow 2", v)
        self.assertIn("flizzardglow2", v)
        self.assertIn("flizzard glow ii", v)
        self.assertEqual(names.variants(""), set())

    def test_hash_file_round_trip_and_count_line(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "list.sha256"
            names.write_hashes(path, names.hashes_for(MADE_UP), "made-up test names")
            got = names.read_hashes(path)
            self.assertEqual(got, names.hashes_for(MADE_UP))
            self.assertNotIn("zorblaxine", path.read_text())
            path.write_text(path.read_text().replace(f"count {len(got)}", "count 2"))
            with self.assertRaises(ValueError):
                names.read_hashes(path)
            path.write_text("count 1\nnot-a-hash\n")
            with self.assertRaises(ValueError):
                names.read_hashes(path)
        self.assertEqual(names.read_hashes(Path(tmp) / "missing.sha256"), set())


class ScannerTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tier_a = names.hashes_for(MADE_UP)
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp)
        (self.tmp / "web/src").mkdir(parents=True)
        (self.tmp / "api/plumb_api").mkdir(parents=True)

    def scan(self, catalogue: dict | None = None, **kw: set[str]) -> names.Report:
        return names.scan_repo(self.tmp, catalogue or {"recipes": [], "ranking": [], "addons": []},
                               tier_a=kw.get("tier_a", self.tier_a), tier_b=kw.get("tier_b", set()),
                               caution=kw.get("caution", set()))

    def test_planted_names_are_caught_in_code_strings_and_identifiers(self) -> None:
        (self.tmp / "web/src/look.ts").write_text('const ok = 1;\nconst label = "Quvette-Plume";\nexport const zorblaxineLut = 2;\n')
        (self.tmp / "api/plumb_api/look.py").write_text('"""A note."""\nNAME = "mirth o matic"\n')
        report = self.scan()
        found = sorted((h.path, h.line) for h in report.hits)
        self.assertEqual(found, [("api/plumb_api/look.py", 2), ("web/src/look.ts", 2), ("web/src/look.ts", 3)])
        text = "\n".join(h.text() for h in report.hits)
        self.assertNotIn("quvette", text.lower(), "a hit reports the hash, never the name")
        self.assertFalse(report.ok)

    def test_real_words_and_our_names_pass(self) -> None:
        (self.tmp / "web/src/clean.ts").write_text('export const looks = ["Deauville", "soft glow", "contrast"];\n')
        self.assertTrue(self.scan().ok)
        shipped = names.scan_repo(REPO, registry.export_catalogue(registry.load()), tier_a=self.tier_a,
                                  tier_b=names.hashes_for(["Plume"]), caution=set())
        self.assertEqual(shipped.hits, [])

    def test_tier_b_blocks_only_exact_display_names(self) -> None:
        generic = names.hashes_for(["Soft Plume"])
        (self.tmp / "web/src/code.ts").write_text('const softPlumeBlur = "soft plume";\n')
        cat = {"recipes": [{"id": "C99", "name": "Soft Plume", "description": "x", "presets": []}], "ranking": [], "addons": []}
        report = self.scan(cat, tier_a=set(), tier_b=generic)
        self.assertEqual([h.path for h in report.hits], ["catalogue: C99 name"], "code may use the word; a name may not")
        ok = {"recipes": [{"id": "C99", "name": "Soft Plume Bay", "description": "x", "presets": []}], "ranking": [], "addons": []}
        self.assertTrue(self.scan(ok, tier_a=set(), tier_b=generic).ok)

    def test_caution_names_warn_and_do_not_fail(self) -> None:
        cat = {"recipes": [{"id": "C99", "name": "Zorblaxine", "description": "x", "presets": [{"name": "Strong"}]}],
               "ranking": [], "addons": []}
        report = self.scan(cat, tier_a=set(), caution=names.hashes_for(["Zorblaxine"]))
        self.assertTrue(report.ok)
        self.assertEqual(len(report.warnings), 1)
        self.assertIn("sign-off", report.warnings[0])

    def test_shipped_lists_and_catalogue(self) -> None:
        caution = names.read_hashes(names.CAUTION)
        self.assertGreaterEqual(len(caution), 12, "the twelve renamed names of §1.6 are caution entries")
        report = names.scan_repo(REPO, registry.export_catalogue(registry.load()))
        self.assertEqual(report.hits, [])
        self.assertEqual(report.warnings, [], "no shipped name is a brand-caution name")
        for r in registry.load().recipes:
            self.assertIsNone(names.scan_display_name(r["name"], caution), r["id"])

    def test_scan_skips_build_output_and_own_lists(self) -> None:
        (self.tmp / "web/dist").mkdir(parents=True)
        (self.tmp / "web/dist/x.js").write_text('"zorblaxine"\n')
        (self.tmp / "web/src/node_modules").mkdir()
        (self.tmp / "web/src/node_modules/y.ts").write_text('"zorblaxine"\n')
        self.assertTrue(self.scan().ok)


class AssetGuardTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp)
        for d in ("web/src/filters", "api/plumb_api/filters/recipes", "api/tests/goldens/filters"):
            (self.tmp / d).mkdir(parents=True)

    def test_planted_cube_file_is_caught(self) -> None:
        (self.tmp / "api/plumb_api/filters/recipes/look.cube").write_text("LUT_3D_SIZE 2\n")
        problems = assets.check(self.tmp)
        self.assertEqual(len(problems), 1)
        self.assertIn("colour preset or LUT", problems[0])

    def test_images_fonts_presets_and_effects_are_caught(self) -> None:
        for name in ("a.png", "b.woff2", "c.xmp", "d.lrtemplate", "e.arproj", "f.3dl", "g.JPG"):
            (self.tmp / "web/src/filters" / name).write_bytes(b"x")
        (self.tmp / "web/src/filters/ok.ts").write_text("export {};\n")
        self.assertEqual(len(assets.check(self.tmp)), 7)

    def test_goldens_must_be_listed_and_match(self) -> None:
        folder = self.tmp / "api/tests/goldens/filters"
        (folder / "C01-face.png").write_bytes(b"png bytes")
        self.assertIn("not listed", assets.check(self.tmp)[0])
        manifest = {"goldens": {"C01-face.png": {"png_sha256": assets.sha256(folder / "C01-face.png")}}}
        (folder / "manifest.json").write_text(json.dumps(manifest))
        self.assertEqual(assets.check(self.tmp), [])
        (folder / "C01-face.png").write_bytes(b"changed")
        self.assertIn("does not match", assets.check(self.tmp)[0])
        (folder / "extra.cube").write_text("x")
        self.assertTrue(any("only golden PNGs" in p for p in assets.check(self.tmp)))

    def test_the_shipped_tree_passes(self) -> None:
        self.assertEqual(assets.check(REPO), [])


class BoundaryTest(unittest.TestCase):
    def test_shipped_filter_modules_never_reach_youcam(self) -> None:
        self.assertEqual(boundaries().filter_problems(REPO), [])

    def test_planted_imports_are_caught(self) -> None:
        module = boundaries()
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "api/plumb_api/filters").mkdir(parents=True)
            (root / "web/src/filters").mkdir(parents=True)
            (root / "api/plumb_api/filters/bad.py").write_text("from ..providers import youcam\nimport plumb_api.youcam.client\n")
            (root / "web/src/filters/bad.ts").write_text('import { quote } from "../api.js";\nexport const x = fetch("/x");\n'
                                                         'import "../../ui/styling-tasks.js";\n')
            (root / "web/src/filters/ok.ts").write_text('import { op } from "./colour/ops.js";\n')
            problems = module.filter_problems(root)
            self.assertEqual(len(problems), 5, problems)
            self.assertTrue(all("ok.ts" not in p for p in problems))


if __name__ == "__main__":
    unittest.main()
