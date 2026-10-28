"""#35 local eye makeup and the local Foundation step (#101 match) on drawn faces.

Eye makeup runs on the eyes engine's drawn specimen (known eye frames and traced lashes);
Foundation runs on the arena's drawn faces of six skin tones (known freckles and moles)
with the shade the finder matched on each. Each must change only its intended region,
keep alpha, do nothing at strength 0, refuse with a code, and (Foundation) never make any
pixel lighter. The browser port is checked against api/tests/goldens/local-makeup.json.
Author: John Khan.
"""
from __future__ import annotations

import ast
import json
import unittest
from pathlib import Path
from unittest import mock

import numpy as np

from plumb_api.arena import identity as I
from plumb_api.arena import marks as M
from plumb_api.arena import scorer
from plumb_api.arena.synthetic import SKIN_TONES, DrawnFace, drawn_face
from plumb_api.engines.core import regions
from plumb_api.engines.core.refusal import Refusal
from plumb_api.engines.eyes import makeup as eye_makeup
from plumb_api.engines.eyes.geometry import eye_protection, frames
from plumb_api.engines.eyes.makeup import LOOKS, EyeMakeupResult, render_eye_makeup
from plumb_api.engines.eyes.specimens import specimen
from plumb_api.engines.shade import foundation as F
from plumb_api.engines.shade.colourspace import srgb_to_lab
from plumb_api.engines.shade.finder import ShadeResult, find_reliable_shade
from plumb_api.engines.skin.common import skin_mask

API = Path(__file__).resolve().parents[1]


def lightness(img: np.ndarray) -> np.ndarray:
    return srgb_to_lab(img[..., :3])[..., 0]


def changed(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    return np.any(a[..., :3] != b[..., :3], axis=2)


class EyeMakeup(unittest.TestCase):
    def setUp(self) -> None:
        self.image, self.mesh, self.traces = specimen(120, 144, tone=150, alpha=True)
        self.h, self.w = self.image.shape[:2]
        self.frames = frames(self.mesh, self.w, self.h)

    def render(self, **kwargs: object) -> EyeMakeupResult:
        out = render_eye_makeup(self.image, self.mesh, lashes=self.traces, **kwargs)  # type: ignore[arg-type]
        self.assertIsInstance(out, EyeMakeupResult)
        assert isinstance(out, EyeMakeupResult)
        return out

    def eye_area(self) -> np.ndarray:
        """Ground truth: the lid, lash and wing area of each eye, from its measured frame."""
        yy, xx = np.mgrid[:self.h, :self.w].astype(np.float64)
        area = np.zeros((self.h, self.w), dtype=bool)
        for f in self.frames:
            u, v = f.local(xx + 0.5, yy + 0.5)
            area |= (u > -0.3) & (u < 1.6) & (v > -0.35) & (v < f.brow_space + 0.05)
        return area

    def test_every_look_changes_only_the_eye_area_and_never_the_eyeball(self) -> None:
        eyeball = eye_protection(self.h, self.w, self.frames) > 0
        area = self.eye_area()
        lips = regions.region_mask("lips", self.mesh * np.array((self.w, self.h)), self.h, self.w, normalized=False) > 0
        for look in LOOKS:
            out = self.render(strength=100, look=look)
            moved = changed(self.image, out.image)
            self.assertGreater(int(moved.sum()), 100, look)
            self.assertFalse((moved & eyeball).any(), f"{look}: the iris or sclera changed")
            self.assertFalse((moved & ~area).any(), f"{look}: a pixel outside the eye area changed")
            self.assertFalse((moved & lips).any(), look)
            np.testing.assert_array_equal(out.image[..., 3], self.image[..., 3], err_msg=look)
            self.assertEqual(sorted(out.report["elements"]), ["liner", "mascara", "shadow"])
            self.assertFalse(out.report["eye_colour_changed"])
            self.assertFalse(out.report["geometry_changed"])
            self.assertEqual(out.report["provider"], "local")

    def test_alpha_does_not_change_the_colour_result(self) -> None:
        rgb = self.image[..., :3].copy()
        a = self.render(strength=80)
        b = render_eye_makeup(rgb, self.mesh, strength=80, lashes=self.traces)
        assert isinstance(b, EyeMakeupResult)
        visible = self.image[..., 3] > 0
        np.testing.assert_array_equal(a.image[..., :3][visible], b.image[visible])
        np.testing.assert_array_equal(a.image[~visible], self.image[~visible], "transparent pixels stay untouched")

    def test_strength_zero_and_all_elements_off_are_exact_copies(self) -> None:
        for kwargs, code in (({"strength": 0}, "zero_strength"),
                             ({"strength": 90, "shadow": 0, "liner": 0, "mascara": 0}, "nothing_chosen")):
            out = self.render(**kwargs)
            np.testing.assert_array_equal(out.image, self.image)
            self.assertFalse(out.coverage.any())
            self.assertEqual((out.report["status"], out.report["reason_code"]), ("unchanged", code))

    def test_each_element_is_its_own_layer_and_strength_scales_it(self) -> None:
        shadow = self.render(strength=100, liner=0, mascara=0)
        liner = self.render(strength=100, shadow=0, mascara=0)
        mascara = self.render(strength=100, shadow=0, liner=0)
        for out, name in ((shadow, "shadow"), (liner, "liner"), (mascara, "mascara")):
            self.assertEqual(list(out.report["elements"]), [name])
        self.assertGreater(int(changed(self.image, shadow.image).sum()), int(changed(self.image, liner.image).sum()))
        soft = self.render(strength=30, liner=0, mascara=0)
        diff_soft = np.abs(soft.image[..., :3].astype(int) - self.image[..., :3]).sum()
        diff_full = np.abs(shadow.image[..., :3].astype(int) - self.image[..., :3]).sum()
        self.assertLess(diff_soft, diff_full)

    def test_mascara_needs_traced_lashes_and_never_invents_one(self) -> None:
        untraced = render_eye_makeup(self.image, self.mesh, strength=90)
        assert isinstance(untraced, EyeMakeupResult)
        self.assertEqual(untraced.report["skipped"], {"mascara": "needs_lash_trace"})
        no_mascara = render_eye_makeup(self.image, self.mesh, strength=90, mascara=0)
        assert isinstance(no_mascara, EyeMakeupResult)
        np.testing.assert_array_equal(untraced.image, no_mascara.image)
        self.assertIn("no lash is invented", " ".join(untraced.report["warnings"]))
        alone = render_eye_makeup(self.image, self.mesh, strength=90, shadow=0, liner=0)
        self.assertIsInstance(alone, Refusal)
        assert isinstance(alone, Refusal)
        self.assertEqual(alone.code, "needs_lash_trace")

    def test_anatomy_she_picks_moves_the_placement(self) -> None:
        open_eye = self.render(strength=100, liner=0, mascara=0)
        hooded = self.render(strength=100, liner=0, mascara=0, anatomy={"right": "hooded", "left": "open"})
        right_half = np.zeros((self.h, self.w), dtype=bool)
        right_half[:, : self.w // 2] = True
        self.assertLess(int((changed(self.image, hooded.image) & right_half).sum()),
                        int((changed(self.image, open_eye.image) & right_half).sum()), "a hooded lid gets a narrower band")
        np.testing.assert_array_equal(hooded.image[:, self.w // 2:], open_eye.image[:, self.w // 2:])

    def test_refusals_are_coded(self) -> None:
        dup = self.mesh.copy()
        dup[10] = dup[11]
        for points, code in ((dup, "duplicate_points"), (self.mesh[:468], "wrong_shape"),
                             (self.mesh * 0.01, "face_too_small")):
            out = render_eye_makeup(self.image, points, strength=80, lashes=self.traces)
            self.assertIsInstance(out, Refusal)
            assert isinstance(out, Refusal)
            self.assertEqual((out.module, out.code), ("eyes.makeup", code))
        closed = self.mesh.copy()
        for contour in (regions.RIGHT_EYE, regions.LEFT_EYE):
            idx = list(contour)
            centre = closed[idx, 1].mean()
            closed[idx, 1] = centre + (closed[idx, 1] - centre) * 0.05
        out = render_eye_makeup(self.image, closed, strength=80)
        self.assertIsInstance(out, Refusal)
        assert isinstance(out, Refusal)
        self.assertEqual(out.code, "eyes_closed")

    def test_bad_arguments_raise(self) -> None:
        for kwargs in ({"strength": 120}, {"look": "unknown"}, {"shadow": 1.5}, {"anatomy": {"right": "open"}},
                       {"colours": {"blush": [1, 2, 3]}}, {"colours": {"liner": [1, 2]}}):
            with self.assertRaises(ValueError, msg=str(kwargs)):
                render_eye_makeup(self.image, self.mesh, **kwargs)  # type: ignore[arg-type]
        with self.assertRaises(ValueError):
            render_eye_makeup(self.image.astype(np.float32), self.mesh)

    def test_colour_choice_overrides_the_look_and_the_local_route_never_imports_youcam(self) -> None:
        navy = self.render(strength=100, shadow=0, mascara=0, colours={"liner": [30, 46, 92]})
        plain = self.render(strength=100, shadow=0, mascara=0)
        moved = changed(self.image, navy.image)
        self.assertGreater(float(navy.image[..., 2][moved].mean()), float(plain.image[..., 2][moved].mean()))
        tree = ast.parse(Path(eye_makeup.__file__).read_text(encoding="utf-8"))
        names = [a.name for n in ast.walk(tree) if isinstance(n, ast.Import) for a in n.names]
        names += [n.module or "" for n in ast.walk(tree) if isinstance(n, ast.ImportFrom)]
        self.assertFalse([n for n in names if "youcam" in n or "providers" in n])


def matched(tone: str) -> tuple[DrawnFace, ShadeResult]:
    face = drawn_face(tone, seed=1, width=160, height=192)
    result, _ = find_reliable_shade(face.image, face.points)
    if result.refused:
        raise AssertionError(f"the shade finder refused the drawn {tone} face: {result.reason}")
    return face, result


class Foundation(unittest.TestCase):
    def test_six_tones_never_lighter_only_skin_marks_kept_alpha_untouched(self) -> None:
        for tone in SKIN_TONES:
            face, match = matched(tone)
            self.assertFalse(match.refused, tone)
            assert match.best is not None and match.measured_lab is not None
            h, w = face.image.shape[:2]
            alpha = ((np.arange(h * w) * 7) % 256).reshape(h, w).astype(np.uint8)
            rgba = np.dstack([face.image, alpha])
            skin = skin_mask(face.points, h, w)
            zone = I.zones(face.points, (h, w))["skin"]
            scale = I.iod(face.points)
            found = M.find_marks(face.image, zone, scale)
            for strength in (30, 100):
                out = F.foundation_from_match(rgba, face.points, match, strength=strength)
                self.assertNotIsInstance(out, Refusal, f"{tone} {strength}")
                assert not isinstance(out, Refusal)
                np.testing.assert_array_equal(out.image[..., 3], alpha)
                moved = changed(rgba, out.image)
                self.assertGreater(int(moved.sum()), 100, tone)
                self.assertFalse((moved & (skin <= 0)).any(), f"{tone}: changed outside the skin")
                rise = lightness(out.image) - lightness(rgba)
                self.assertLessEqual(float(rise.max()), 1e-9, f"{tone} {strength}: a pixel got lighter")
                kept = M.retention(found, out.image[..., :3], scale)
                flags, _ = scorer.unrequested_changes(rgba[..., :3], out.image[..., :3], zone, points_before=face.points,
                                                      points_after=face.points, retained=kept, filter_name="foundation")
                self.assertEqual(flags, [], f"{tone} {strength}")

    def test_the_shade_undertone_moves_the_skin_toward_it(self) -> None:
        face, match = matched("medium")
        assert match.best is not None and match.measured_lab is not None
        warmer = [match.measured_lab[0] - 1, match.measured_lab[1], match.measured_lab[2] + 4]
        out = F.apply_foundation(face.image, face.points, warmer, match.measured_lab, strength=100)
        assert not isinstance(out, Refusal)
        inside = skin_mask(face.points, *face.image.shape[:2]) >= 0.5
        before = srgb_to_lab(face.image)[inside]
        after = srgb_to_lab(out.image)[inside]
        self.assertGreater(float(np.median(after[:, 2] - before[:, 2])), 1.5, "b* moves toward the warmer shade")
        self.assertLessEqual(float(np.median(after[:, 0] - before[:, 0])), 0.0)

    def test_strength_zero_is_an_exact_copy(self) -> None:
        face, match = matched("tan")
        out = F.foundation_from_match(face.image, face.points, match, strength=0)
        assert not isinstance(out, Refusal)
        np.testing.assert_array_equal(out.image, face.image)
        self.assertFalse(out.weight.any())

    def test_refusals_are_coded(self) -> None:
        face, match = matched("light")
        assert match.measured_lab is not None and match.best is not None
        img, pts, measured = face.image, face.points, match.measured_lab
        cases = (
            (F.apply_foundation(img, pts, [measured[0] + 3, measured[1], measured[2]], measured), "shade_lighter_than_skin"),
            (F.apply_foundation(img, pts, [measured[0] - 20, measured[1], measured[2]], measured), "shade_too_far"),
            (F.foundation_from_match(img, pts, {"refused": True, "best": None, "measured_lab": None}), "no_shade_match"),
            (F.apply_foundation(img, pts[:400], match.best["lab"], measured), "wrong_shape"),
            (F.apply_foundation(img, pts + np.array([5000.0, 0.0]), match.best["lab"], measured), "outside_frame"),
        )
        for out, code in cases:
            self.assertIsInstance(out, Refusal, code)
            assert isinstance(out, Refusal)
            self.assertEqual((out.module, out.code), ("shade.foundation", code))
        with mock.patch.object(F, "GUARD_MEAN_DELTA_E", 1e-6):
            guarded = F.foundation_from_match(img, pts, match, strength=100)
        self.assertIsInstance(guarded, Refusal)
        assert isinstance(guarded, Refusal)
        self.assertEqual(guarded.code, "identity_guard")
        tiny = drawn_face("light", seed=2, width=48, height=56)
        small = F.apply_foundation(tiny.image, tiny.points, match.best["lab"], measured)
        self.assertIsInstance(small, Refusal)
        assert isinstance(small, Refusal)
        self.assertEqual(small.code, "no_visible_skin")

    def test_bad_arguments_raise(self) -> None:
        face, match = matched("dark")
        assert match.measured_lab is not None
        img, pts = face.image, face.points
        for shade in ([float("nan"), 0, 0], [120, 0, 0], [1, 2]):
            with self.assertRaises(ValueError):
                F.apply_foundation(img, pts, shade, match.measured_lab)
        with self.assertRaises(ValueError):
            F.foundation_from_match(img, pts, match, strength=101)
        with self.assertRaises(ValueError):
            F.foundation_from_match(img, pts, match, choice="third")


class BrowserVectors(unittest.TestCase):
    def test_reference_vectors_match_the_python_source(self) -> None:
        import importlib.util

        spec = importlib.util.spec_from_file_location("local_makeup_vectors", API / "scripts" / "local_makeup_vectors.py")
        assert spec is not None and spec.loader is not None
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        stored = json.loads(module.TARGET.read_text(encoding="utf-8"))
        self.assertEqual(stored, json.loads(json.dumps(module.vectors(), sort_keys=True)))


if __name__ == "__main__":
    unittest.main()
