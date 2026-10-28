"""FX1 recipe schema v1, validator, registry and ranking (filters-plan.md §3, §2.22, A8)."""
from __future__ import annotations

import copy
import json
import tempfile
import unittest
from pathlib import Path

from plumb_api.filters.recipe import registry, schema

FX1_COLOUR = [f"C{i:02d}" for i in range(1, 44)]
FX1_MONO = [f"M{i:02d}" for i in range(1, 7)]
FX1_ORIGINALS = ["C50", "C53", "C54", "C55", "C63", "C77", "C93", "C102", "C103", "C105", "C106", "C107"]
# filters-plan.md §2.22, the FX1 rows of ranks 1-60
PLAN_RANKS = {"C01": 1, "C02": 6, "C03": 7, "C05": 8, "C06": 9, "C07": 10, "C08": 11, "C09": 12, "C102": 13, "C103": 14,
              "C105": 15, "C106": 16, "C107": 17, "C14": 18, "C16": 19, "C26": 20, "C28": 21, "C30": 22, "C38": 23,
              "C39": 24, "C40": 25, "C41": 26, "C50": 27, "C53": 28, "C54": 29, "C55": 30, "C63": 31, "C77": 32,
              "C93": 33, "M02": 34, "C04": 52, "C10": 53, "C11": 54, "C12": 55, "C13": 56, "C15": 57, "C20": 58,
              "C24": 59, "C27": 60}


class CatalogueTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.cat = registry.load()

    def test_every_fx1_filter_is_built_once(self) -> None:
        ids = self.cat.ids()
        self.assertEqual(sorted(ids), sorted(FX1_COLOUR + FX1_MONO + FX1_ORIGINALS))
        self.assertEqual(len(ids), len(set(ids)))
        self.assertTrue(all(r["round"] == "FX1" and r["status"] == "Build" for r in self.cat.recipes))

    def test_ranks_follow_the_plan_and_are_unique(self) -> None:
        for rid, rank in PLAN_RANKS.items():
            self.assertEqual(self.cat.get(rid)["rank"], rank, rid)
        ranked = [r["id"] for r in self.cat.ranked()]
        self.assertEqual(ranked[0], "C01")
        self.assertEqual(ranked[-1], "C29")
        scores = [r["like"]["score"] for r in self.cat.ranked()]
        self.assertEqual(scores, sorted(scores, reverse=True), "strip order is score first")
        provisional = [r for r in self.cat.recipes if r["provenance"].get("rankProvisional")]
        self.assertTrue(all(r["rank"] > 60 for r in provisional))
        self.assertEqual(len(provisional), 22)

    def test_women_first_defaults(self) -> None:
        for r in self.cat.recipes:
            self.assertEqual(r["defaults"]["strength"], 30, r["id"])
            self.assertTrue(r["defaults"]["guard"], r["id"])
            self.assertEqual(r["limits"]["geometry"], "none")
            self.assertFalse(r["limits"]["funTab"])
            self.assertFalse(r["limits"]["simulationLabel"], "a colour look is not a simulation")
        self.assertTrue(self.cat.get("C28")["defaults"]["backgroundOnly"], "Fontainebleau defaults to Background only")
        self.assertTrue(self.cat.get("C39")["defaults"]["protectSkin"], "Talloires defaults to Protect skin")
        others = [r for r in self.cat.recipes if r["id"] not in ("C28", "C39")]
        self.assertFalse(any(r["defaults"]["backgroundOnly"] or r["defaults"]["protectSkin"] for r in others))

    def test_names_descriptions_and_provenance(self) -> None:
        names = [r["name"].casefold() for r in self.cat.recipes]
        self.assertEqual(len(names), len(set(names)))
        for r in self.cat.recipes:
            self.assertLessEqual(len(r["description"]), schema.MAX_DESCRIPTION)
            self.assertIn("filters-plan.md", r["provenance"]["writtenFrom"])
            self.assertNotIn("clinic", r["description"].lower(), "copy rule: the look is clinic-like, the words are not")

    def test_mono_looks_use_lightness_guard_and_a_step_mix(self) -> None:
        for rid in FX1_MONO:
            r = self.cat.get(rid)
            self.assertEqual(r["tab"], "Monochrome")
            self.assertEqual(r["limits"]["guardMode"], "lightness")
            mix = [s for s in r["stages"] if s["op"] == "colour.channelMixer"]
            self.assertEqual(len(mix), 1)
            self.assertEqual(mix[0].get("scale"), "linear" if rid == "M06" else "step",
                             "only Montparnasse lets colour return below 100")

    def test_tabs_and_lookups(self) -> None:
        self.assertIn("Clean", self.cat.tabs())
        self.assertNotIn("Clinic", schema.TABS)
        self.assertEqual({r["tab"] for r in self.cat.in_tab("Monochrome")}, {"Monochrome"})
        self.assertEqual(len(self.cat.for_round("FX1")), 61)
        with self.assertRaises(KeyError):
            self.cat.get("Z99")

    def test_export_is_rank_ordered_and_json_clean(self) -> None:
        data = registry.export_catalogue(self.cat)
        self.assertEqual([r["rank"] for r in data["recipes"]], sorted(r["rank"] for r in data["recipes"]))
        self.assertEqual(json.loads(json.dumps(data, ensure_ascii=False)), data)
        self.assertEqual({a["id"] for a in data["addons"]},
                         {"fade", "grain", "vignette", "centre-light", "glow", "halation", "structure", "border"})
        self.assertEqual([a["id"] for a in data["addons"] if a["built"]],
                         ["border", "centre-light", "fade", "glow", "grain",
                          "halation", "structure", "vignette"])
        self.assertEqual([a["id"] for a in data["addons"] if a.get("manualOnly")],
                         ["grain", "structure"])


def good() -> dict:
    return copy.deepcopy(registry.load().get("C08"))


class ValidatorTest(unittest.TestCase):
    def problems(self, recipe: dict) -> list[str]:
        return schema.check_recipe(recipe, registry.load().addons)

    def test_shipped_recipe_is_clean(self) -> None:
        self.assertEqual(self.problems(good()), [])

    def test_catches_each_broken_field(self) -> None:
        cases = [
            (lambda r: r.update(id="c8"), "id must look like"),
            (lambda r: r.update(tab="Clinic"), "unknown tab"),
            (lambda r: r["defaults"].update(strength=60), "start at 30"),
            (lambda r: r.update(description="x" * 81), "description"),
            (lambda r: r["stages"].append({"op": "colour.sparkle", "params": {}}), "unknown op"),
            (lambda r: r["stages"].append({"op": "colour.exposure", "params": {"ev": 9}}), "outside"),
            (lambda r: r["stages"].append({"op": "colour.tint", "params": {"hue": 10, "amount": 0.01, "lips": 1}}), "face region"),
            (lambda r: r["stages"].append({"op": "colour.greyWorld", "params": {"amount": 0.5, "castA": 0.01}}), "measured from the photo"),
            (lambda r: r["stages"].append({"op": "colour.exposure", "params": {"ev": 0.1}, "scale": "wobble"}), "scale must be"),
            (lambda r: r["limits"].update(geometry="fun"), "only in the Fun tab"),
            (lambda r: r["needs"].update(depth=True), "ruling R3"),
            (lambda r: r["provenance"].update(writtenFrom="another app"), "cite filters-plan.md"),
            (lambda r: r["like"].update(source="vibes"), "like needs"),
            (lambda r: r["defaults"]["addons"].append({"id": "sparkles", "amount": 10}), "unknown add-on"),
            (lambda r: r.update(presets=[{"name": "A", "patch": {"nope": {"ev": 0.1}}}]), "unknown stage"),
            (lambda r: r.update(presets=[{"name": "A", "pending": ["border soon"]}]), "which round"),
            (lambda r: r.update(presets=[{"name": "A"}, {"name": "A"}]), "used twice"),
            (lambda r: r["stages"].append({"op": "colour.curve", "params": {"master": [[0, 0], [0, 1]]}}), "strictly increase"),
            (lambda r: r["stages"].append({"op": "colour.hsl", "params": {"bands": {"teal": {"hue": 3}}}}), "unknown band"),
            (lambda r: r["stages"].append({"op": "colour.hsl", "params": {"bands": {"red": {"hue": 90}}}}), "within"),
            (lambda r: r["stages"].append({"op": "colour.channelMixer", "params": {"matrix": [[1, 0], [0, 1]]}}), "3 x 3"),
            (lambda r: r.update(seed="random"), "seed"),
        ]
        for change, expected in cases:
            r = good()
            change(r)
            found = self.problems(r)
            self.assertTrue(any(expected in p for p in found), f"{expected!r} not in {found}")

    def test_missing_fields_are_named(self) -> None:
        r = good()
        del r["stages"]
        self.assertIn("C08: missing field stages", self.problems(r))

    def test_catalogue_rules_across_recipes(self) -> None:
        a, b = good(), good()
        b["name"] = "ÈZE"
        problems = schema.check_catalogue([a, b])
        self.assertTrue(any("used 2 times" in p for p in problems))
        self.assertTrue(any("rank 11 is also" in p for p in problems))

    def test_ranking_must_agree(self) -> None:
        cat = registry.load()
        ranking = copy.deepcopy(cat.ranking)
        ranking["rows"][0]["rank"] = 2
        self.assertTrue(schema.check_ranking(ranking, cat.recipes))
        self.assertEqual(schema.check_ranking(cat.ranking, cat.recipes), [])


class BaseAndFilesTest(unittest.TestCase):
    def test_base_and_stage_patch(self) -> None:
        base = good()
        base["stages"][0]["id"] = "lift"
        child = {"id": "C99", "base": "C08", "name": "Test child", "rank": 999,
                 "stagePatch": {"lift": {"ev": 0.3}}, "description": "child"}
        out = registry.resolve_bases([base, child])
        self.assertEqual(out[1]["stages"][0]["params"]["ev"], 0.3)
        self.assertEqual(out[0]["stages"][0]["params"]["ev"], 0.15, "the base is not changed")
        self.assertEqual(out[1]["tab"], "Natural")
        with self.assertRaises(registry.CatalogueError):
            registry.resolve_bases([{**good(), "id": "C90", "base": "C91"}, {**good(), "id": "C91", "base": "C90"}])
        with self.assertRaises(registry.CatalogueError):
            registry.resolve_bases([base, {**child, "stagePatch": {"missing": {}}}])

    def test_broken_files_fail_to_load(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            for name in (*registry.RECIPE_FILES, registry.ADDON_FILE, registry.RANKING_FILE):
                (folder / name).write_text((registry.RECIPE_DIR / name).read_text(encoding="utf-8"), encoding="utf-8")
            self.assertEqual(len(registry.load(folder).recipes), 61)
            data = json.loads((folder / "colour.json").read_text(encoding="utf-8"))
            data["recipes"][0]["defaults"]["strength"] = 80
            (folder / "colour.json").write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
            with self.assertRaises(registry.CatalogueError) as caught:
                registry.load(folder)
            self.assertIn("gentle default", str(caught.exception))
            data["format"] = "other/1"
            (folder / "colour.json").write_text(json.dumps(data), encoding="utf-8")
            with self.assertRaises(registry.CatalogueError):
                registry.load(folder)


if __name__ == "__main__":
    unittest.main()
