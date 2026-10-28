"""#26 spot healing, #27 line softening and #28 under-eye brightening on drawn faces.

Known truth comes from tests/skin_touch_up_vectors.py: drawn red blemishes, drawn freckles
and moles (arena/synthetic.drawn_face), drawn fine lines and drawn under-eye crescents.
Each tool must change only its intended region, keep alpha, keep natural marks unless she
marks them, hold the identity check, do nothing at strength 0 and refuse with a code.
Author: John Khan.
"""
from __future__ import annotations

import unittest

import numpy as np

from plumb_api.arena import identity as I
from plumb_api.arena.synthetic import SKIN_TONES
from plumb_api.engines.skin import local_zones as Z
from plumb_api.engines.skin.blemish import heal_blemishes, measure
from plumb_api.engines.skin.under_eye import brighten_under_eyes
from plumb_api.engines.skin.wrinkles import DEFAULT_ZONES, soften_lines
from tests.skin_touch_up_vectors import HEIGHT, WIDTH, Scene, scene


def lab(img: np.ndarray) -> np.ndarray:
    return Z.lab_of(img[..., :3])


def disc(x: float, y: float, r: float) -> np.ndarray:
    yy, xx = np.mgrid[:HEIGHT, :WIDTH]
    return (xx + 0.5 - x) ** 2 + (yy + 0.5 - y) ** 2 <= r * r


def ring(x: float, y: float, r: float) -> np.ndarray:
    return disc(x, y, 3 * r) & ~disc(x, y, 2 * r)


def free_marks(sc: Scene) -> list[tuple[float, float, float]]:
    """Drawn marks clear of every drawn blemish (a blemish on a mole is ambiguous)."""
    return [m for m in sc.marks if all(np.hypot(m[0] - b[0], m[1] - b[1]) > 4 * m[2] + 6 for b in sc.blemishes)]


def contrast(img: np.ndarray, x: float, y: float, r: float, channel: int = 0) -> float:
    lb = lab(img)[..., channel]
    return float(lb[ring(x, y, r)].mean() - lb[disc(x, y, 0.8 * r)].mean())


def skin_of(sc: Scene) -> np.ndarray:
    return Z.skin_region(sc.points, HEIGHT, WIDTH)


class SpotHealing(unittest.TestCase):
    def setUp(self) -> None:
        self.sc = scene()

    def test_blemishes_are_healed_and_natural_marks_kept(self) -> None:
        sc = self.sc
        r = heal_blemishes(sc.image, sc.points)
        self.assertEqual((r.status, r.reason_code), ("edited", "edited"))
        for x, y in sc.blemishes:
            before = -contrast(sc.image, x, y, 2.0, channel=1)
            after = -contrast(r.image, x, y, 2.0, channel=1)
            self.assertGreater(before, 10)
            self.assertLess(after, 0.3 * before, "redness of a drawn blemish stays")
        for x, y, rad in free_marks(sc):
            centre = disc(x, y, rad)
            np.testing.assert_array_equal(r.image[centre], sc.image[centre], "a natural mark was touched")
        self.assertEqual(r.report["healed_spots"], 2)
        self.assertTrue(r.report["identity"]["holds"])
        self.assertLess(r.report["identity"]["mean_delta_e"], 0.5)

    def test_only_skin_changes_and_alpha_is_kept(self) -> None:
        sc = scene("dark", seed=5, alpha=True)
        r = heal_blemishes(sc.image, sc.points, strength=80.0)
        self.assertEqual(r.status, "edited")
        np.testing.assert_array_equal(r.image[..., 3], sc.image[..., 3])
        changed = np.any(r.image != sc.image, axis=2)
        self.assertTrue(changed.any())
        self.assertFalse((changed & ~skin_of(sc)).any(), "pixels outside the skin changed")
        self.assertFalse((changed & (r.alpha == 0)).any(), "a change outside the reported alpha")
        self.assertTrue(np.all(r.alpha[changed] == 0.8))

    def test_every_skin_tone_heals_blemishes_and_keeps_marks(self) -> None:
        for k, tone in enumerate(SKIN_TONES):
            sc = scene(tone, seed=11 + k)
            r = heal_blemishes(sc.image, sc.points)
            self.assertEqual(r.status, "edited", tone)
            for x, y in sc.blemishes:
                self.assertLess(-contrast(r.image, x, y, 2.0, channel=1), 0.35 * -contrast(sc.image, x, y, 2.0, channel=1), tone)
            for x, y, rad in free_marks(sc):
                self.assertGreater(contrast(r.image, x, y, rad), 0.9 * contrast(sc.image, x, y, rad), f"{tone} mark")
            before, after = lab(sc.image)[skin_of(sc)], lab(r.image)[skin_of(sc)]
            self.assertLess(abs(float(after[:, 0].mean() - before[:, 0].mean())), 0.2, f"{tone} lightness drift")

    def test_she_decides_tap_heals_a_mole_and_keep_spares_a_blemish(self) -> None:
        sc = self.sc
        mole = max(free_marks(sc), key=lambda m: contrast(sc.image, *m))
        kept = sc.blemishes[1]
        r = heal_blemishes(sc.image, sc.points, taps=[mole[:2]], keep=[kept])
        self.assertEqual(r.report["taps"][0]["code"], "healed_mark")
        self.assertLess(contrast(r.image, *mole), 0.3 * contrast(sc.image, *mole))
        spot = disc(kept[0], kept[1], 4)
        np.testing.assert_array_equal(r.image[spot], sc.image[spot])
        actions = {s["action"] for s in r.report["spots"]}
        self.assertTrue({"healed_by_request", "kept_by_request", "healed", "kept"} <= actions)
        missed = heal_blemishes(sc.image, sc.points, taps=[(2.0, 2.0)], auto=False)
        self.assertEqual((missed.status, missed.reason_code), ("not_applicable", "nothing_to_heal"))
        self.assertEqual(missed.report["taps"][0]["code"], "outside_skin")

    def test_fast_marching_and_partial_strength(self) -> None:
        sc = self.sc
        full = heal_blemishes(sc.image, sc.points, method="fast-marching")
        half = heal_blemishes(sc.image, sc.points, method="fast-marching", strength=50.0)
        self.assertEqual(full.report["fills"], ["fast-marching", "fast-marching"])
        moved_full = np.abs(full.image.astype(int) - sc.image).sum()
        moved_half = np.abs(half.image.astype(int) - sc.image).sum()
        self.assertLess(moved_half, 0.7 * moved_full)
        self.assertGreater(moved_half, 0.3 * moved_full)

    def test_identity_score_holds_and_result_is_deterministic(self) -> None:
        sc = self.sc
        a, b = heal_blemishes(sc.image, sc.points), heal_blemishes(sc.image, sc.points)
        np.testing.assert_array_equal(a.image, b.image)
        score = I.identity_score(sc.image, a.image, points_before=sc.points, points_after=sc.points)
        self.assertGreater(score.score, 9.5)

    def test_spot_measure_separates_blemishes_from_marks(self) -> None:
        m = measure(self.sc.image, self.sc.points)
        blemishes = [s for s in m.spots if s.kind == "blemish"]
        self.assertEqual(len(blemishes), 2)
        for s, (x, y) in zip(sorted(blemishes, key=lambda s: s.y), sorted(self.sc.blemishes, key=lambda b: b[1]), strict=True):
            self.assertLess(np.hypot(s.x - x, s.y - y), 2.0)
        self.assertTrue(all(s.compact for s in blemishes))


class LineSoftening(unittest.TestCase):
    def setUp(self) -> None:
        self.sc = scene(blemishes=False, lines=True)

    def depth(self, img: np.ndarray) -> float:
        lb = lab(img)[..., 0]
        on = self.sc.lines > 0.6
        near = (Z.polygons_mask([], HEIGHT, WIDTH, skin_of(self.sc), 1) == 0) & (self.sc.lines < 0.02)
        surround = Z.local_mean(lb, near & skin_of(self.sc), 4)
        return float((surround - lb)[on].mean())

    def test_lines_are_softened_not_erased(self) -> None:
        sc = self.sc
        r = soften_lines(sc.image, sc.points, strength=100.0)
        self.assertEqual(r.status, "edited")
        before, after = self.depth(sc.image), self.depth(r.image)
        self.assertGreater(before, 4)
        self.assertLess(after, 0.75 * before, "lines were not softened")
        self.assertGreater(after, 0.3 * before, "lines were erased, not softened")
        gentle = soften_lines(sc.image, sc.points, strength=40.0)
        self.assertGreater(self.depth(gentle.image), after)

    def test_only_the_chosen_zones_change(self) -> None:
        sc = self.sc
        skin = skin_of(sc)
        for zones in (DEFAULT_ZONES, ("forehead",)):
            r = soften_lines(sc.image, sc.points, strength=100.0, zones=zones)
            zone = Z.zone_mask(sc.points, HEIGHT, WIDTH, zones, skin)
            changed = np.any(r.image != sc.image, axis=2)
            self.assertTrue(changed.any())
            self.assertFalse((changed & (zone == 0)).any(), f"{zones}: change outside the zones")
        crow = Z.zone_mask(sc.points, HEIGHT, WIDTH, ("crow_feet",), skin) > 0
        forehead_only = soften_lines(sc.image, sc.points, strength=100.0, zones=("forehead",))
        np.testing.assert_array_equal(forehead_only.image[crow], sc.image[crow])

    def test_marks_in_the_zones_keep_their_contrast_and_skin_is_not_lifted(self) -> None:
        sc = scene("light", seed=3, blemishes=False, lines=True)
        r = soften_lines(sc.image, sc.points, strength=100.0)
        for x, y, rad in sc.marks:
            if sc.lines[disc(x, y, 3 * rad)].max() < 0.05:
                self.assertGreater(contrast(r.image, x, y, rad), 0.9 * contrast(sc.image, x, y, rad))
        skin = skin_of(sc)
        self.assertLess(float(lab(r.image)[skin, 0].mean() - lab(sc.image)[skin, 0].mean()), 0.15)
        moved = r.alpha > 0
        surround_gap = Z.local_mean(lab(sc.image), skin & (sc.lines < 0.02), 4)[..., 0] - lab(r.image)[..., 0]
        self.assertGreater(float(np.median(surround_gap[moved])), 0.0, "a line pixel was lifted past its surround")

    def test_plain_skin_has_little_to_soften(self) -> None:
        sc = scene(blemishes=False)
        r = soften_lines(sc.image, sc.points, strength=100.0)
        if r.status == "edited":
            self.assertLess(r.report["identity"]["mean_delta_e"], 0.05)
        else:
            self.assertEqual(r.reason_code, "no_lines_found")


class UnderEye(unittest.TestCase):
    def setUp(self) -> None:
        self.sc = scene("tan", seed=4, blemishes=False, circles=True, alpha=True)

    def gap(self, img: np.ndarray, side_mask: np.ndarray, cheek: np.ndarray) -> float:
        lb = lab(img)[..., 0]
        return float(np.median(lb[cheek]) - np.median(lb[side_mask]))

    def test_dark_circles_move_toward_the_cheek_and_never_past_it(self) -> None:
        sc = self.sc
        r = brighten_under_eyes(sc.image, sc.points, strength=100.0)
        self.assertEqual(r.status, "edited")
        np.testing.assert_array_equal(r.image[..., 3], sc.image[..., 3])
        frame, skin = Z.face_frame(sc.points), skin_of(sc)
        for side in Z.SIDES:
            core = (Z.polygons_mask([Z.under_eye_polygon(sc.points, frame, side, 0.45)], HEIGHT, WIDTH, skin, 1) >= 0.5)
            core &= sc.crescents > 0.9
            cheek = (Z.polygons_mask([Z.cheek_reference_polygon(sc.points, frame, "right", 0.7)], HEIGHT, WIDTH, skin, 1) >= 0.5)
            before, after = self.gap(sc.image, core, cheek), self.gap(r.image, core, cheek)
            self.assertGreater(before, 3, side)
            self.assertLess(after, 0.5 * before, f"{side}: dark circle not reduced")
            self.assertGreater(after, -1.0, f"{side}: lifted past the cheek")
        changed = np.any(r.image[..., :3] != sc.image[..., :3], axis=2)
        self.assertFalse((changed & (r.alpha == 0)).any())
        self.assertFalse((changed & ~skin).any())

    def test_a_mole_under_the_eye_keeps_its_contrast(self) -> None:
        sc = self.sc
        frame = Z.face_frame(sc.points)
        lid = sc.points[Z.LOWER_LID["right"][4]]
        x, y = float(lid[0]), float(lid[1] + 0.35 * frame.eye_width["right"])
        img = sc.image.copy()
        spot = disc(x, y, 1.6)
        img[spot, :3] = (img[spot, :3] * 0.55).astype(np.uint8)
        r = brighten_under_eyes(img, sc.points, strength=100.0)
        self.assertEqual(r.status, "edited")
        self.assertGreater(contrast(r.image, x, y, 1.6), 0.8 * contrast(img, x, y, 1.6))

    def test_even_skin_is_left_alone_and_bags_option_widens_the_zone(self) -> None:
        plain = scene(blemishes=False)
        r = brighten_under_eyes(plain.image, plain.points, strength=100.0)
        self.assertEqual((r.status, r.reason_code), ("not_applicable", "no_dark_circle"))
        np.testing.assert_array_equal(r.image, plain.image)
        sc = self.sc
        wide = brighten_under_eyes(sc.image, sc.points, strength=100.0, include_bags=True)
        narrow = brighten_under_eyes(sc.image, sc.points, strength=100.0, include_bags=False)
        self.assertGreater(int((wide.alpha > 0).sum()), int((narrow.alpha > 0).sum()))
        hidden = narrow.report["sides"]["left"]
        self.assertEqual(hidden["cheek_from"], "right", "moles hide the left cheek, so the right cheek is the reference")


class SharedRules(unittest.TestCase):
    def setUp(self) -> None:
        self.sc = scene(lines=True, circles=True)

    def calls(self, image: np.ndarray, points: object, strength: float = 100.0) -> list[Z.TouchUpResult]:
        return [heal_blemishes(image, points, strength=strength), soften_lines(image, points, strength=strength),
                brighten_under_eyes(image, points, strength=strength)]

    def test_zero_strength_is_a_no_op(self) -> None:
        for r in self.calls(self.sc.image, self.sc.points, 0.0):
            self.assertEqual((r.status, r.reason_code), ("not_applicable", "zero_strength"))
            np.testing.assert_array_equal(r.image, self.sc.image)
            self.assertFalse(r.alpha.any())

    def test_degenerate_meshes_are_refused_with_codes(self) -> None:
        dup = self.sc.points.copy()
        dup[10] = dup[11]
        off = self.sc.points + np.array([1000.0, 0.0])
        for points, code in ((dup, "duplicate_points"), (off, "outside_frame"), (self.sc.points[:400], "wrong_shape"),
                             (self.sc.points * 0.02, "face_too_small")):
            for r in self.calls(self.sc.image, points):
                self.assertEqual((r.status, r.reason_code), ("refused", code))
                np.testing.assert_array_equal(r.image, self.sc.image)
                self.assertIn("message", r.to_json())

    def test_identity_check_refuses_an_edit_that_changes_the_face_too_much(self) -> None:
        old = Z.GUARD_MEAN_DELTA_E
        Z.GUARD_MEAN_DELTA_E = 1e-6
        try:
            for r in self.calls(self.sc.image, self.sc.points):
                self.assertEqual((r.status, r.reason_code), ("refused", "identity_guard"))
                np.testing.assert_array_equal(r.image, self.sc.image)
        finally:
            Z.GUARD_MEAN_DELTA_E = old

    def test_labels_say_simulation_and_not_medical_advice(self) -> None:
        for r in self.calls(self.sc.image, self.sc.points):
            self.assertIn("simulation", r.label)
            self.assertIn("not medical advice", r.label)

    def test_bad_arguments_raise(self) -> None:
        sc = self.sc
        with self.assertRaises(ValueError):
            heal_blemishes(sc.image, sc.points, strength=120.0)
        with self.assertRaises(ValueError):
            heal_blemishes(sc.image, sc.points, method="smudge")
        with self.assertRaises(ValueError):
            soften_lines(sc.image, sc.points, zones=("cheekbone",))
        with self.assertRaises(ValueError):
            soften_lines(sc.image.astype(np.float32), sc.points)
        with self.assertRaises(ValueError):
            brighten_under_eyes(sc.image, sc.points, include_bags="yes")  # type: ignore[arg-type]


if __name__ == "__main__":
    unittest.main()
