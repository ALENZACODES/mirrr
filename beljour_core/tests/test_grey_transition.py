"""#20 grey removal and #102 Grey Transition previews on drawn hair with known grey strands.

Known truth from engines/haircolour/grey_synthetic.py: which strands are grey, which are
pigmented, and the marked hair area. Cover must take only grey strands to her natural shade;
blend must go part of the way; silver must take only pigmented strands toward her own
measured grey; the strand structure (lightness order) must hold; nothing outside the mask
changes; alpha is kept; strength 0 is a copy; refusals are coded. Author: John Khan.
"""
from __future__ import annotations

import unittest

import numpy as np

from plumb_api.engines.core.refusal import Refusal
from plumb_api.engines.haircolour import grey as G
from plumb_api.engines.haircolour.grey_synthetic import NATURAL_SHADES, grey_hair
from plumb_api.engines.shade.colourspace import srgb_to_lab
from plumb_api.engines.skin.common import SkinResult


def lab(img: np.ndarray) -> np.ndarray:
    return srgb_to_lab(img[..., :3])


def preview(image: np.ndarray, mask: np.ndarray, **kw: object) -> SkinResult:
    out = G.grey_preview(image, mask, **kw)  # type: ignore[arg-type]
    assert isinstance(out, SkinResult), out
    return out


class GreyTransition(unittest.TestCase):
    def test_cover_takes_only_grey_strands_to_her_natural_shade_on_every_shade(self) -> None:
        for shade in NATURAL_SHADES:
            hair = grey_hair(shade, grey_share=0.5)
            out = preview(hair.image, hair.mask, stage="cover", strength=100)
            moved = np.any(out.image != hair.image, axis=2)
            self.assertFalse((moved & hair.pigmented).any(), f"{shade}: a pigmented strand changed")
            self.assertGreater(float(moved[hair.grey].mean()), 0.9, f"{shade}: greys not covered")
            strands = float(np.median(lab(hair.image)[..., 0][hair.pigmented]))
            measured = float(out.metrics["natural_l"])
            silver = float(np.median(lab(hair.image)[..., 0][hair.grey]))
            covered = float(np.median(lab(out.image)[..., 0][hair.grey]))
            self.assertLess(abs(measured - strands), 4.0, f"{shade}: natural read {measured:.1f}, her strands {strands:.1f}")
            closed = (silver - covered) / (silver - measured)
            self.assertGreater(closed, 0.7, f"{shade}: covered greys {covered:.1f}, natural {measured:.1f}, silver {silver:.1f}")
            self.assertEqual(out.metrics["natural_from"], "measured")

    def test_blend_goes_part_of_the_way_and_silver_moves_only_pigmented_strands(self) -> None:
        hair = grey_hair("chestnut", grey_share=0.5)
        before = lab(hair.image)[..., 0]
        cover = lab(preview(hair.image, hair.mask, stage="cover", strength=100).image)[..., 0]
        blend = lab(preview(hair.image, hair.mask, stage="blend", strength=100).image)[..., 0]
        g = hair.grey
        self.assertLess(float(cover[g].mean()), float(blend[g].mean()))
        self.assertLess(float(blend[g].mean()), float(before[g].mean()))
        silver = preview(hair.image, hair.mask, stage="silver", strength=100)
        after = lab(silver.image)[..., 0]
        grey_level = float(np.median(before[g]))
        self.assertLess(abs(float(np.median(after[hair.pigmented])) - grey_level), 6.0)
        self.assertLess(float(np.abs(after[g] - before[g]).mean()), 3.0, "grey strands are kept for silver")

    def test_strand_structure_keeps_its_order(self) -> None:
        hair = grey_hair("dark_brown", grey_share=0.5)
        for stage, group in (("cover", hair.grey), ("silver", hair.pigmented)):
            before = lab(hair.image)[..., 0][group]
            after = lab(preview(hair.image, hair.mask, stage=stage, strength=100).image)[..., 0][group]
            self.assertGreater(float(np.corrcoef(before, after)[0, 1]), 0.9, stage)

    def test_only_the_marked_hair_changes_and_alpha_is_kept(self) -> None:
        hair = grey_hair("black", grey_share=0.4)
        h, w = hair.image.shape[:2]
        alpha = ((np.arange(h * w) * 9) % 256).reshape(h, w).astype(np.uint8)
        rgba = np.dstack([hair.image, alpha])
        for stage in G.STAGES:
            out = preview(rgba, hair.mask, stage=stage, strength=100)
            np.testing.assert_array_equal(out.image[..., 3], alpha)
            np.testing.assert_array_equal(out.image[hair.mask < 0.5], rgba[hair.mask < 0.5])
            np.testing.assert_array_equal(out.image[..., :3], preview(hair.image, hair.mask, stage=stage, strength=100).image)
            self.assertIn(G.LABELS[stage], out.label)
            self.assertIn("not a salon result", out.label)

    def test_a_given_natural_shade_is_used_and_strength_zero_is_a_copy(self) -> None:
        hair = grey_hair("dark_brown", grey_share=0.5)
        given = (30.0, 4.0, 6.0)
        out = preview(hair.image, hair.mask, stage="cover", strength=100, natural_lab=given)
        self.assertEqual(out.metrics["natural_from"], "given")
        self.assertLess(abs(float(np.median(lab(out.image)[..., 0][hair.grey])) - 30.0), 4.0)
        zero = preview(hair.image, hair.mask, strength=0)
        np.testing.assert_array_equal(zero.image, hair.image)
        self.assertTrue(zero.metrics["unchanged"])

    def test_refusals_are_coded_and_bad_arguments_raise(self) -> None:
        none = grey_hair("chestnut", grey_share=0.0)
        all_grey = grey_hair("chestnut", grey_share=1.0)
        cases = ((none.image, none.mask, "no_grey_found"), (all_grey.image, all_grey.mask, "natural_shade_unknown"),
                 (none.image, np.zeros_like(none.mask), "no_hair_marked"))
        for image, mask, code in cases:
            out = G.grey_preview(image, mask, strength=60)
            self.assertIsInstance(out, Refusal, code)
            assert isinstance(out, Refusal)
            self.assertEqual((out.module, out.code), ("haircolour.grey", code))
        rescued = G.grey_preview(all_grey.image, all_grey.mask, strength=60, natural_lab=(28.0, 8.0, 12.0))
        self.assertIsInstance(rescued, SkinResult, "with her natural shade given, all-grey hair can be covered")
        for bad in ({"stage": "dye"}, {"strength": 101}, {"natural_lab": (120.0, 0.0, 0.0)}, {"natural_lab": (1.0, 2.0)}):
            with self.assertRaises(ValueError, msg=str(bad)):
                G.grey_preview(none.image, none.mask, **bad)  # type: ignore[arg-type]
        with self.assertRaises(ValueError):
            G.grey_preview(none.image, none.mask[:4])

    def test_no_age_is_asked_or_inferred(self) -> None:
        self.assertEqual(G.MODE, "Grey Transition")
        params = G.grey_preview.__code__.co_varnames[: G.grey_preview.__code__.co_argcount + G.grey_preview.__code__.co_kwonlyargcount]
        self.assertFalse({"age", "years", "birth_year", "date_of_birth"} & set(params))


if __name__ == "__main__":
    unittest.main()
