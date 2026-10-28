"""Feature registry (103 rows), the mapping table, the one-page report and the neutral-defaults check."""
from __future__ import annotations

import dataclasses
import json
import re
import unittest
from pathlib import Path
from unittest import mock

import numpy as np

from plumb_api.arena import constants as C
from plumb_api.arena import presets, registry, report, results
from plumb_api.arena.judging import Outcome

REPO = Path(__file__).resolve().parents[2]


def hero_results(win_faces: int, judges: int = 4, *, with_baseline: bool = True) -> dict:
    rows = []
    i = 1
    for race in ("Black", "White", "Indian"):
        for k in range(12):
            rows.append({"face_id": f"LG{i:04d}", "set": "fairface", "race": race, "gender": "Female" if k % 2 else "Male",
                         "age_band": "30-39", "tags": ""})
            i += 1
    outs = []
    other = "baseline" if with_baseline else "original"
    for filt in C.FILTERS:
        for row in rows:
            for j in range(judges):
                won = j < win_faces
                winner, loser = ("ours-qa", other) if won else (other, "ours-qa")
                scores = {"ours-qa": {d: 8.6 for d in ("identity", "realism", "artifact_free", "flattering", "still_her")}}
                outs.append(Outcome(f"{row['face_id']}{filt}{j}", f"{row['face_id']}{filt}", row["face_id"], filt, winner, loser,
                                    "Lost Identity" if won else "Too Weak", f"j{j}", "human", "", scores))
    return results.summarise(outs, rows, ours="ours-qa", reps=40, runs=["qa1"], created="2026-10-23T06:00:00+00:00")


class RegistryTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.features, cls.infra = registry.load()
        cls.raw = json.loads(registry.REGISTRY_PATH.read_text(encoding="utf-8"))
        cls.by_id = {f.id: f for f in cls.features}

    def test_registry_is_valid_and_complete(self) -> None:
        self.assertEqual(registry.validate(self.features, raw=self.raw), [])
        self.assertGreaterEqual(len(self.features), 103)
        gap = [f for f in self.features if f.id != 1] + [dataclasses.replace(self.features[0], id=len(self.features) + 2)]
        self.assertIn("no gaps", " ".join(registry.validate(gap)))

    def test_every_existing_module_is_wired(self) -> None:
        self.assertEqual(registry.unowned_modules(self.features, self.infra), [])
        universe = registry.module_universe()
        self.assertIn("api/plumb_api/engines/shape", universe)
        self.assertIn("web/src/engines/local/age.ts", universe)

    def test_specific_mappings_the_brief_asked_to_check(self) -> None:
        for fid in (12, 61, 65, 69, 70, 74, 75, 76, 77, 85, 86, 87):
            self.assertEqual(self.by_id[fid].plan_state, "blocked", fid)
        self.assertIn("publicity", self.by_id[12].plan["reason"])
        self.assertIn("face-swap", self.by_id[76].plan["reason"])
        for fid in (9, 10, 11):
            f = self.by_id[fid]
            self.assertTrue(f.simulation_label or f.plan_state == "blocked", fid)
        for fid in (2, 3, 5):
            self.assertTrue(self.by_id[fid].hero)
            self.assertEqual(self.by_id[fid].provider, "local", "no YouCam for the hero filters")
        youcam = {f.id for f in self.features if f.provider == "youcam"}
        self.assertTrue(youcam <= registry.YOUCAM_ALLOWED)
        self.assertTrue({f.id for f in self.features if f.core_priority} == {60, 92, 95, 96})
        self.assertTrue(self.by_id[10].opt_in and self.by_id[39].opt_in and self.by_id[30].opt_in)

    def test_validation_catches_hand_written_scores_and_bad_rows(self) -> None:
        raw = json.loads(json.dumps(self.raw))
        raw["features"][0]["scores"] = {"identity": 9}
        self.assertTrue(any("never written" in p for p in registry.validate(self.features, raw=raw)))
        broken = [registry.Feature(**{**f.__dict__, "provider": "youcam"}) if f.id == 25 else f for f in self.features]
        self.assertTrue(any("makeup and styling only" in p for p in registry.validate(broken)))
        built_missing = [registry.Feature(**{**f.__dict__, "modules": ("web/src/nope.ts",)}) if f.id == 2 else f
                         for f in self.features]
        self.assertTrue(any("does not exist" in p for p in registry.validate(built_missing)))

    def test_mapping_table_has_every_row_and_docs_are_in_sync(self) -> None:
        table = registry.mapping_markdown(self.features)
        ids = re.findall(r"^\| (\d+) \|", table, flags=re.M)
        self.assertEqual([int(i) for i in ids], list(range(1, len(self.features) + 1)))
        docs = (REPO / "docs" / "FEATURES.md").read_text(encoding="utf-8")
        self.assertIn(table, docs, "docs/FEATURES.md is out of date: run make features-doc (python api/scripts/arena.py registry --table docs/FEATURES.md, which rewrites the whole doc from the registry and the reviewed W source; preview with --check, which never writes)")

    def test_no_results_means_not_tested(self) -> None:
        rows = registry.feature_rows(self.features)
        self.assertTrue(all(all(v is None for v in r.scores.values()) for r in rows))
        self.assertEqual({r.status for r in rows}, {"Built", "Blocked"})

    def test_hero_status_comes_from_the_gate(self) -> None:
        passing = registry.feature_rows(self.features, [hero_results(3)])
        by = {r.feature.id: r for r in passing}
        self.assertEqual(by[2].status, "Passed")
        self.assertEqual(by[2].source, "human")
        self.assertAlmostEqual(by[2].scores["identity"], 8.6)
        failing = {r.feature.id: r for r in registry.feature_rows(self.features, [hero_results(2)])}
        self.assertEqual(failing[3].status, "Failed")
        untested = {r.feature.id: r for r in registry.feature_rows(self.features, [hero_results(4, with_baseline=False)])}
        self.assertEqual(untested[5].status, "Built")
        self.assertEqual(untested[5].verdict.label, "FAIL/UNTESTED vs the reference app")

    def test_non_hero_feature_results_go_through_the_six_score_gate(self) -> None:
        good = {d: {"mean": 8.4, "n": 30} for d in C.DIMENSIONS}
        slices = {"all": good, "race:Black": {d: {"mean": 7.6, "n": 12} for d in C.DIMENSIONS}}
        rows = {r.feature.id: r for r in registry.feature_rows(self.features, feature_results={92: {"source": "human", "scores": slices}})}
        self.assertEqual(rows[92].status, "Passed")
        bad = {**slices, "race:White": {**slices["race:Black"], "still_her": {"mean": 6.5, "n": 12}}}
        rows = {r.feature.id: r for r in registry.feature_rows(self.features, feature_results={92: {"source": "human", "scores": bad}})}
        self.assertEqual(rows[92].status, "Failed")
        proxy = {r.feature.id: r for r in registry.feature_rows(self.features, feature_results={92: {"source": "proxy", "scores": slices}})}
        self.assertEqual(proxy[92].status, "Built")
        self.assertEqual(registry.to_json(list(proxy.values()))[91]["score_source"], "proxy")


class ReportTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.features, _ = registry.load()

    def test_one_page_without_any_run(self) -> None:
        rows = registry.feature_rows(self.features)
        md = report.markdown(None, rows, created="2026-10-23 02:00 EDT")
        self.assertEqual(md.count("FAIL/UNTESTED vs the reference app"), 3)
        self.assertNotIn("PASS**", md)
        feature_lines = re.findall(r"^\| (\d+) \| .* \| (Built|Blocked|Not started|Passed|Failed) \|", md, flags=re.M)
        self.assertEqual(len(feature_lines), len(self.features))
        self.assertNotRegex(md.split("## Feature checklist")[1], r"\| \d+\.\d\*? \|", "no score without results")

    def test_report_with_results_marks_model_and_proxy_numbers(self) -> None:
        res = hero_results(4, with_baseline=False)
        res["views"]["model"] = res["views"]["human"]
        res["views"]["human"] = {}
        res["judges"].update(human_judgements=0, human_judges=0, model_judgements=432, models=["proxy-scorer/1"])
        rows = registry.feature_rows(self.features, [res])
        md = report.markdown(res, rows, created="2026-10-23 02:00 EDT")
        self.assertIn("model-judged", md)
        self.assertIn("UNTESTED (no reference app baseline)", md)
        self.assertIn("vs original photo: 100.0%", md)

    def test_passing_report_and_html_page(self) -> None:
        res = hero_results(3)
        rows = registry.feature_rows(self.features, [res])
        md = report.markdown(res, rows, created="2026-10-23 02:00 EDT", fresh_left=812)
        self.assertEqual(md.count("**PASS**"), 3)
        self.assertIn("75.0% (n=144)", md)
        self.assertIn("Fresh faces left: 812", md)
        page = report.html_page(res, rows, created="2026-10-23 02:00 EDT")
        self.assertEqual(page.count("<tr><td>"), 3 + len(self.features))
        self.assertIn("#000091", page)
        self.assertIn("column-count: 3", page)
        self.assertIn("8.6", page)


class NeutralDefaultsTest(unittest.TestCase):
    """Women-first: no default preset may lighten skin, slim the face or erase freckles/moles."""

    def test_every_default_preset_is_neutral_on_six_skin_tones(self) -> None:
        findings = presets.check_all(seeds=(1,))
        self.assertEqual([f.text() for f in findings], [])

    def test_defaults_are_gentle(self) -> None:
        data = presets.load_presets()
        self.assertTrue(all(s["strength"] <= data["gentle_default"] for p in data["presets"] for s in p["steps"]))
        bad = json.loads(presets.PRESETS_PATH.read_text())
        bad["presets"][0]["steps"][0]["strength"] = 66
        path = REPO / "api" / "tests" / "_tmp_presets.json"
        try:
            path.write_text(json.dumps(bad))
            with self.assertRaises(ValueError):
                presets.load_presets(path)
        finally:
            path.unlink(missing_ok=True)

    def test_the_check_catches_slimming_lightening_and_erasing(self) -> None:
        faces = presets.test_faces((1,))[2:3]
        slim = presets.check_preset({"id": "fem-full", "steps": [{"engine": "gender", "direction": -1, "strength": 100}]}, faces)
        self.assertIn("face slimmed", [f.problem for f in slim])
        asked = presets.check_preset({"id": "fem-full", "requested": ["face_shape"],
                                      "steps": [{"engine": "gender", "direction": -1, "strength": 100}]}, faces)
        self.assertNotIn("face slimmed", [f.problem for f in asked])

        def lighten(image, points, step, *, seed=1):
            from plumb_api.arena import identity as I
            skin = I.zones(points, image.shape[:2])["skin"]
            out = np.clip(image.astype(float) + 30 * skin[..., None], 0, 255).astype(np.uint8)
            return presets.Applied(out, points)

        with mock.patch.object(presets, "apply_step", lighten):
            found = presets.check_preset({"id": "glow", "steps": [{"engine": "x", "strength": 30}]}, faces)
        self.assertIn("skin lightened", [f.problem for f in found])

        def erase(image, points, step, *, seed=1):
            from plumb_api.engines.core.filters import box_mean
            out = np.stack([box_mean(image[..., c].astype(float), 4) for c in range(3)], axis=-1)
            return presets.Applied(np.clip(np.rint(out), 0, 255).astype(np.uint8), points)

        with mock.patch.object(presets, "apply_step", erase):
            found = presets.check_preset({"id": "airbrush", "steps": [{"engine": "x", "strength": 30}]}, faces)
        self.assertIn("marks erased", [f.problem for f in found])


if __name__ == "__main__":
    unittest.main()
