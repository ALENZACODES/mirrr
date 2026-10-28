"""A4 Still Her proxy on six drawn skin tones, and the §3.4 no-makeup rule (FX1 acceptance:
the skin-guard limits hold on all six tones). Drawn faces only; real faces run in `make realface`."""
from __future__ import annotations

import unittest

from plumb_api.arena.synthetic import SKIN_TONES
from plumb_api.filters import engine
from plumb_api.filters.qa import fixtures as F
from plumb_api.filters.qa import still_her as SH
from plumb_api.filters.recipe import registry


class StillHerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.faces = F.six_tones()

    def test_six_tones_very_dark_included(self) -> None:
        self.assertEqual([p.face.tone for p in self.faces], list(SKIN_TONES))
        dark = self.faces[-1]
        assert dark.masks.skin is not None
        skin = dark.image[dark.masks.skin >= 0.5]
        self.assertLess(float(skin.mean()), 70, "the darkest drawn tone is very dark")

    def test_every_shipped_filter_keeps_her_on_all_six_tones(self) -> None:
        failures: list[str] = []
        for recipe in registry.default().ranked():
            failures += SH.check(recipe, self.faces)
        self.assertEqual(failures, [])

    def test_the_check_catches_a_lightening_look(self) -> None:
        recipe = registry.default().get("C08")
        brighter = {**recipe, "id": "C98", "stages": [{"op": "colour.exposure", "params": {"ev": 1.0}}]}
        off = [SH.measure(brighter, p, engine.Settings(strength=100, guard=False)) for p in self.faces[:2]]
        self.assertTrue(any("skin L* rose" in x for x in SH.problems(brighter, off)))
        on = [SH.measure(brighter, p, engine.Settings(strength=100)) for p in self.faces[:2]]
        self.assertEqual([x for x in SH.problems(brighter, on) if "rose" in x], [], "the guard pulls her skin back")

    def test_the_check_catches_hue_and_chroma_changes(self) -> None:
        recipe = registry.default().get("C08")
        shift = {**recipe, "id": "C97", "stages": [{"op": "colour.hsl", "params": {"bands": {
            "orange": {"hue": 30, "chroma": -0.6}, "red": {"hue": 30, "chroma": -0.6}, "yellow": {"hue": 30, "chroma": -0.6}}}}]}
        off = [SH.measure(shift, p, engine.Settings(strength=100, guard=False)) for p in self.faces[1:3]]
        found = SH.problems(shift, off)
        self.assertFalse(any("hue turned" in x for x in found), "mandatory hue lock runs even with guard off")
        self.assertTrue(any("chroma kept" in x for x in found), "optional chroma guard still switches off")

    def test_mono_looks_are_exempt_from_chroma_but_must_stay_neutral(self) -> None:
        recipe = registry.default().get("M01")
        reports = [SH.measure(recipe, p) for p in self.faces[:2]]
        self.assertTrue(all(r.chroma_ratio < 0.1 for r in reports))
        self.assertEqual(SH.problems(recipe, reports), [])

    def test_marks_are_kept(self) -> None:
        for rid in ("C39", "C105", "C07", "C63"):
            reports = [SH.measure(registry.default().get(rid), p) for p in self.faces]
            kept = [r.marks_kept for r in reports if r.marks_kept is not None]
            self.assertTrue(kept and min(kept) >= SH.MARKS_KEPT, (rid, kept))


class NoMakeupTest(unittest.TestCase):
    def test_no_look_treats_the_lips_apart_from_the_skin(self) -> None:
        face = F.portrait("medium")
        worst = max((SH.region_aim(r, face), r["id"]) for r in registry.default().ranked())
        self.assertLessEqual(worst[0], SH.REGION_DE, worst)


if __name__ == "__main__":
    unittest.main()
