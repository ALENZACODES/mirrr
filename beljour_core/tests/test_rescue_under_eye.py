"""Bad Day Rescue with its under-eye step (#28) on drawn faces of six skin tones.

The Rescue preset (arena/default_presets.json) is a gentle Natural enhance followed by
under-eye brightening at the gentle default. The women-first check (arena/presets.py) must
still find no lightening, slimming or lost marks on every tone, with and without drawn dark
circles; the under-eye step may only change the measured under-eye crescents, must bring
them toward her own cheek and never past it, and must change nothing on a face without a
dark circle. Known truth from tests/skin_touch_up_vectors.py. Author: John Khan.
"""
from __future__ import annotations

import unittest

import numpy as np

from plumb_api.arena import identity as I
from plumb_api.arena import marks as M
from plumb_api.arena import presets, scorer
from plumb_api.arena.synthetic import SKIN_TONES, DrawnFace, drawn_face
from plumb_api.engines.skin import local_zones as Z
from plumb_api.engines.skin.under_eye import BAG_DEPTH, brighten_under_eyes
from tests.skin_touch_up_vectors import HEIGHT, WIDTH, scene


def rescue() -> dict:
    return next(p for p in presets.load_presets()["presets"] if p["id"] == "rescue")


def enhance_only(preset: dict) -> dict:
    return {**preset, "steps": [s for s in preset["steps"] if s["engine"] == "enhance"]}


class RescueUnderEye(unittest.TestCase):
    def test_the_preset_has_the_under_eye_step_at_the_gentle_default(self) -> None:
        data = presets.load_presets()
        steps = rescue()["steps"]
        self.assertEqual([s["engine"] for s in steps], ["enhance", "under-eye"])
        self.assertTrue(all(s["strength"] <= data["gentle_default"] for s in steps))
        self.assertNotIn("dark circles", rescue()["not_built"])

    def test_women_first_check_passes_on_six_tones_and_two_seeds(self) -> None:
        self.assertEqual([f.text() for f in presets.check_preset(rescue(), presets.test_faces((1, 2)))], [])

    def test_with_dark_circles_no_tone_is_lightened_and_marks_are_kept(self) -> None:
        for tone in SKIN_TONES:
            sc = scene(tone, seed=1, blemishes=False, circles=True)
            np.testing.assert_array_equal(drawn_face(tone, seed=1, width=WIDTH, height=HEIGHT).points, sc.points)
            out = presets.apply_preset(DrawnFace(sc.image, sc.points, sc.marks, tone), rescue())
            zone = I.zones(sc.points, (HEIGHT, WIDTH))["skin"]
            scale = I.iod(sc.points)
            found = M.find_marks(sc.image, zone, scale)
            kept = M.retention(found, out.image, scale)
            flags, info = scorer.unrequested_changes(sc.image, out.image, zone, points_before=sc.points,
                                                     points_after=out.points_after, retained=kept, filter_name="rescue")
            self.assertEqual(flags, [], f"{tone}: {info}")
            self.assertGreaterEqual(kept.found, 3, tone)

    def test_under_eye_changes_only_the_crescents_toward_the_cheek_and_never_past_it(self) -> None:
        for tone in SKIN_TONES:
            sc = scene(tone, seed=1, blemishes=False, circles=True)
            face = DrawnFace(sc.image, sc.points, sc.marks, tone)
            full = presets.apply_preset(face, rescue()).image
            base = presets.apply_preset(face, enhance_only(rescue())).image
            frame, skin = Z.face_frame(sc.points), Z.skin_region(sc.points, HEIGHT, WIDTH)
            allowed = np.zeros((HEIGHT, WIDTH), dtype=bool)
            for side in Z.SIDES:
                allowed |= Z.polygons_mask([Z.under_eye_polygon(sc.points, frame, side, BAG_DEPTH)], HEIGHT, WIDTH,
                                           skin, Z.feather_radius(frame)) > 0
            moved = np.any(full != base, axis=2)
            self.assertGreater(int(moved.sum()), 50, f"{tone}: the dark circle was not touched")
            self.assertFalse((moved & ~allowed).any(), f"{tone}: changed outside the under-eye crescents")
            lb_base, lb_full = Z.lab_of(base)[..., 0], Z.lab_of(full)[..., 0]
            # The engine corrects a side only when it measures that crescent at least DARK_MIN
            # darker than the cheek; a side it calls already even must stay exactly as it was.
            actions = brighten_under_eyes(base, sc.points, strength=30.0).report["sides"]
            self.assertIn("brightened", [row["action"] for row in actions.values()], tone)
            for side in Z.SIDES:
                core = (Z.polygons_mask([Z.under_eye_polygon(sc.points, frame, side, 0.45)], HEIGHT, WIDTH, skin, 1) >= 0.5)
                core &= sc.crescents > 0.9
                cheek = Z.polygons_mask([Z.cheek_reference_polygon(sc.points, frame, "right", BAG_DEPTH)], HEIGHT, WIDTH,
                                        skin, 1) >= 0.5
                before = float(np.median(lb_base[cheek]) - np.median(lb_base[core]))
                after = float(np.median(lb_full[cheek]) - np.median(lb_full[core]))
                if actions[side]["action"] == "brightened":
                    self.assertLess(after, before, f"{tone} {side}: not brought toward the cheek")
                else:
                    np.testing.assert_array_equal(lb_full[core], lb_base[core], err_msg=f"{tone} {side}")
                self.assertGreater(after, -1.0, f"{tone} {side}: lifted past the cheek")

    def test_without_a_dark_circle_the_under_eye_step_changes_nothing(self) -> None:
        for face in presets.test_faces((1,)):
            full = presets.apply_preset(face, rescue()).image
            base = presets.apply_preset(face, enhance_only(rescue())).image
            np.testing.assert_array_equal(full, base, err_msg=face.tone)


if __name__ == "__main__":
    unittest.main()
