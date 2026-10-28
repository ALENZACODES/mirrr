"""#24 beard removal for stubble and short beards on drawn faces of six skin tones.

Known truth from engines/shave/synthetic.py: the clean face before the beard was drawn and
the strand coverage of the drawn beard. Only the beard area may change; hair pixels must
move toward the clean skin; no pixel may end above both its own L* and her cheek's; alpha
is kept; strength 0 is an exact copy; full beards, clean faces and bad meshes are refused
with codes; a mark she taps to keep is kept. Author: John Khan.
"""
from __future__ import annotations

import unittest

import numpy as np

from plumb_api.arena.synthetic import SKIN_TONES, drawn_face
from plumb_api.engines.core.refusal import Refusal
from plumb_api.engines.shade.colourspace import srgb_to_lab
from plumb_api.engines.shave import remove as R
from plumb_api.engines.shave.synthetic import bearded_face
from plumb_api.engines.skin.common import SkinResult


def lightness(img: np.ndarray) -> np.ndarray:
    return srgb_to_lab(img[..., :3])[..., 0]


def edited(image: np.ndarray, points: np.ndarray, strength: float = 100, **kw: object) -> SkinResult:
    out = R.remove_beard(image, points, strength=strength, **kw)  # type: ignore[arg-type]
    assert isinstance(out, SkinResult), out
    return out


class BeardRemoval(unittest.TestCase):
    def test_stubble_and_short_beards_move_toward_the_clean_skin_on_six_tones(self) -> None:
        for tone in SKIN_TONES:
            for style, length, density in (("stubble", 1, 2), ("stubble", 3, 4), ("short_boxed", 5, 4)):
                face = bearded_face(tone, style=style, length=length, density=density)
                out = edited(face.image, face.points)
                hair = face.hair > 0.3
                before = np.abs(lightness(face.image) - lightness(face.clean))[hair].mean()
                after = np.abs(lightness(out.image) - lightness(face.clean))[hair].mean()
                self.assertLess(after, 0.8 * before, f"{tone} {style} {length}{density}: hair not removed")
                moved = np.any(out.image != face.image, axis=2)
                self.assertFalse((moved & ~face.area).any(), f"{tone} {style}: changed outside the beard area")
                self.assertIn(out.metrics["scope"], ("stubble", "short_beard"))

    def test_never_lifted_past_her_cheek_and_skin_between_hairs_barely_moves(self) -> None:
        face = bearded_face("tan", style="stubble", length=3, density=4)
        out = edited(face.image, face.points)
        ceiling = np.maximum(lightness(face.image), float(out.metrics["cheek_l"])) + 1e-3
        self.assertTrue(np.all(lightness(out.image) <= ceiling))
        skin = face.area & (face.hair < 0.02)
        self.assertLess(float(np.abs(lightness(out.image) - lightness(face.clean))[skin].mean()), 1.5)

    def test_full_beards_are_refused_on_every_tone(self) -> None:
        for tone in SKIN_TONES:
            face = bearded_face(tone, style="full")
            out = R.remove_beard(face.image, face.points, strength=80)
            self.assertIsInstance(out, Refusal, tone)
            assert isinstance(out, Refusal)
            self.assertEqual((out.module, out.code), ("shave.remove", "full_beard"), tone)

    def test_clean_faces_have_nothing_to_remove_on_every_tone(self) -> None:
        for tone in SKIN_TONES:
            for seed in (1, 2):
                face = drawn_face(tone, seed=seed)
                out = R.remove_beard(face.image, face.points, strength=80)
                self.assertIsInstance(out, Refusal, f"{tone} {seed}")
                assert isinstance(out, Refusal)
                self.assertEqual(out.code, "no_beard_found", f"{tone} {seed}")

    def test_a_mark_she_taps_to_keep_is_kept(self) -> None:
        face = bearded_face("light", style="stubble", length=2, density=3)
        image = face.image.copy()
        x, y = (face.points[61] + face.points[152]) / 2 + np.array([-10.0, 0.0])
        yy, xx = np.mgrid[: image.shape[0], : image.shape[1]]
        mole = (xx + 0.5 - x) ** 2 + (yy + 0.5 - y) ** 2 <= 2.2 ** 2
        self.assertTrue(face.area[mole].all())
        image[mole] = (70, 48, 40)
        kept = edited(image, face.points, keep=[[float(x), float(y)]])
        np.testing.assert_array_equal(kept.image[mole], image[mole])
        self.assertEqual(kept.metrics["kept_taps"], 1)

    def test_alpha_kept_strength_zero_copy_and_coded_refusals(self) -> None:
        face = bearded_face("dark", style="stubble", length=2, density=3)
        h, w = face.image.shape[:2]
        alpha = ((np.arange(h * w) * 11) % 256).reshape(h, w).astype(np.uint8)
        rgba = np.dstack([face.image, alpha])
        out = edited(rgba, face.points, 70)
        np.testing.assert_array_equal(out.image[..., 3], alpha)
        np.testing.assert_array_equal(out.image[..., :3], edited(face.image, face.points, 70).image)
        zero = edited(face.image, face.points, 0)
        np.testing.assert_array_equal(zero.image, face.image)
        self.assertTrue(zero.metrics["unchanged"])
        dup = face.points.copy()
        dup[10] = dup[11]
        for points, code in ((dup, "duplicate_points"), (face.points[:400], "wrong_shape"),
                             (face.points + np.array([5000.0, 0.0]), "outside_frame")):
            refused = R.remove_beard(face.image, points, strength=50)
            self.assertIsInstance(refused, Refusal, code)
            assert isinstance(refused, Refusal)
            self.assertEqual(refused.code, code)
        for bad in ({"strength": 101}, {"strength": float("nan")}, {"keep": [[-1, 2]]}, {"keep": [[1]]}):
            with self.assertRaises(ValueError, msg=str(bad)):
                R.remove_beard(face.image, face.points, **bad)  # type: ignore[arg-type]
        self.assertIn("not invented", R.LABEL)


if __name__ == "__main__":
    unittest.main()
