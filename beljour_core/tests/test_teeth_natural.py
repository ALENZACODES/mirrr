"""#31 teeth whitening with a natural cap on drawn smiles of six skin tones.

Known truth from engines/teeth/synthetic.py: the drawn teeth, the dark gaps between them,
the tongue and the closed-mouth mesh. Only drawn tooth pixels may change; no tooth goes
above the natural cap or below the warm floor; alpha is kept; strength 0 is an exact copy;
closed mouths, tongue-only mouths and bad meshes are refused with codes. The browser port
is checked against api/tests/goldens/hair-beard-teeth.json. Author: John Khan.
"""
from __future__ import annotations

import ast
import importlib.util
import json
import unittest
from pathlib import Path

import numpy as np

from plumb_api.arena.synthetic import SKIN_TONES
from plumb_api.engines.core.refusal import Refusal
from plumb_api.engines.shade.colourspace import srgb_to_lab
from plumb_api.engines.skin.common import SkinResult
from plumb_api.engines.teeth import natural as N
from plumb_api.engines.teeth.synthetic import TEETH_SHADES, smile_face

API = Path(__file__).resolve().parents[1]


def edited(image: np.ndarray, points: np.ndarray, strength: float) -> SkinResult:
    out = N.whiten_teeth(image, points, strength=strength)
    assert isinstance(out, SkinResult), out
    return out


class NaturalTeeth(unittest.TestCase):
    def test_only_teeth_change_on_every_tone_and_shade(self) -> None:
        for tone in SKIN_TONES:
            for shade in TEETH_SHADES:
                face = smile_face(tone, teeth=shade)
                out = edited(face.image, face.points, 100)
                moved = np.any(out.image != face.image, axis=2)
                self.assertFalse((moved & ~face.teeth).any(), f"{tone} {shade}: gaps, tongue, lips or skin changed")
                if shade != "white":
                    self.assertGreater(int(moved.sum()), 0.8 * int(face.teeth.sum()), f"{tone} {shade}")

    def test_natural_cap_and_warm_floor_hold_after_rounding(self) -> None:
        for shade in TEETH_SHADES:
            face = smile_face("tan", teeth=shade)
            before = srgb_to_lab(face.image)[face.teeth]
            after = srgb_to_lab(edited(face.image, face.points, 100).image)[face.teeth]
            self.assertTrue(np.all(after[:, 0] <= np.maximum(before[:, 0], N.NATURAL_L_CAP) + 1e-9), shade)
            self.assertTrue(np.all(after[:, 2] >= np.minimum(before[:, 2], N.WARM_B) - 1e-9), f"{shade} turned cold")
            self.assertTrue(np.all(after[:, 0] >= before[:, 0] - 1e-9), f"{shade}: a tooth got darker")
            self.assertLessEqual(float((after[:, 0] - before[:, 0]).max()), N.MAX_LIFT + 0.6, shade)
        white = smile_face("tan", teeth="white")
        np.testing.assert_array_equal(edited(white.image, white.points, 100).image, white.image,
                                      "teeth already past the cap and the floor stay as they are")

    def test_yellow_teeth_lighten_and_lose_some_yellow_but_stay_warm(self) -> None:
        face = smile_face("medium", teeth="yellowish")
        before = srgb_to_lab(face.image)[face.teeth].mean(axis=0)
        soft = srgb_to_lab(edited(face.image, face.points, 30).image)[face.teeth].mean(axis=0)
        full = srgb_to_lab(edited(face.image, face.points, 100).image)[face.teeth].mean(axis=0)
        self.assertGreater(full[0], soft[0])
        self.assertGreater(soft[0], before[0])
        self.assertLess(full[2], soft[2])
        self.assertLess(soft[2], before[2])
        self.assertGreater(full[2], N.WARM_B - 0.5)

    def test_alpha_is_kept_and_does_not_change_the_colour(self) -> None:
        face = smile_face("dark", teeth="ivory")
        h, w = face.image.shape[:2]
        alpha = ((np.arange(h * w) * 5) % 256).reshape(h, w).astype(np.uint8)
        rgba = np.dstack([face.image, alpha])
        out = edited(rgba, face.points, 80)
        np.testing.assert_array_equal(out.image[..., 3], alpha)
        np.testing.assert_array_equal(out.image[..., :3], edited(face.image, face.points, 80).image)

    def test_strength_zero_is_an_exact_copy(self) -> None:
        face = smile_face("light", teeth="yellowish")
        out = edited(face.image, face.points, 0)
        np.testing.assert_array_equal(out.image, face.image)
        self.assertFalse(out.weight.any())
        self.assertTrue(out.metrics["unchanged"])

    def test_refusals_are_coded(self) -> None:
        closed = smile_face("medium", gap=0)
        dup = smile_face("medium").points.copy()
        dup[10] = dup[11]
        tongue = smile_face("medium")
        no_teeth = tongue.image.copy()
        no_teeth[tongue.teeth | tongue.gaps] = (44, 24, 26)
        for image, points, code in ((closed.image, closed.points, "mouth_closed"),
                                    (tongue.image, dup, "duplicate_points"),
                                    (tongue.image, tongue.points[:400], "wrong_shape"),
                                    (no_teeth, tongue.points, "no_teeth_visible")):
            out = N.whiten_teeth(image, points, strength=80)
            self.assertIsInstance(out, Refusal, code)
            assert isinstance(out, Refusal)
            self.assertEqual((out.module, out.code), ("teeth.natural", code))

    def test_bad_arguments_raise_and_the_local_route_never_calls_youcam(self) -> None:
        face = smile_face()
        for strength in (-1, 101, float("nan"), True):
            with self.assertRaises(ValueError):
                N.whiten_teeth(face.image, face.points, strength=strength)  # type: ignore[arg-type]
        with self.assertRaises(ValueError):
            N.whiten_teeth(face.image.astype(np.float32), face.points)
        tree = ast.parse(Path(N.__file__).read_text(encoding="utf-8"))
        names = [a.name for n in ast.walk(tree) if isinstance(n, ast.Import) for a in n.names]
        names += [n.module or "" for n in ast.walk(tree) if isinstance(n, ast.ImportFrom)]
        self.assertFalse([n for n in names if "youcam" in n or "providers" in n])
        self.assertIn("not dental treatment", N.LABEL)


class BrowserVectors(unittest.TestCase):
    def test_reference_vectors_match_the_python_source(self) -> None:
        spec = importlib.util.spec_from_file_location("hbt_vectors", API / "scripts" / "hair_beard_teeth_vectors.py")
        assert spec is not None and spec.loader is not None
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        stored = json.loads(module.TARGET.read_text(encoding="utf-8"))
        self.assertEqual(stored, json.loads(json.dumps(module.vectors(), sort_keys=True)))


if __name__ == "__main__":
    unittest.main()
