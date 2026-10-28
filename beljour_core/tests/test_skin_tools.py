"""Skin tools (Freckles, Tan add/remove, Matte, Glow, Even tone) on drawn faces with known ground truth.

Checks: changes stay inside the landmark skin region, alpha is untouched, strength 0 is an
exact no-op, the identity proxy holds, drawn freckles and moles survive, nothing lightens
skin except tan removal (opt-in, refused without it), and refusals carry reason codes.
Author: John Khan.
"""
from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path

import numpy as np

from plumb_api.arena import identity as I
from plumb_api.arena import marks as M
from plumb_api.arena import scorer
from plumb_api.arena.synthetic import SKIN_TONES, drawn_face
from plumb_api.engines.core.refusal import Refusal, inspect_mesh
from plumb_api.engines.shade.colourspace import srgb_to_lab
from plumb_api.engines.skin import studio
from plumb_api.engines.skin.common import frame, skin_mask
from plumb_api.engines.skin.finish import GLOWS, glow, high_points, matte
from plumb_api.engines.skin.freckles import place
from plumb_api.engines.skin.synthetic import skin_face
from plumb_api.engines.skin.tan import LighteningNotChosen, tan
from plumb_api.engines.skin.tone import even_tone

API = Path(__file__).resolve().parents[1]
CALLS: tuple[tuple[str, dict[str, object]], ...] = (("freckles", {}), ("tan", {}), ("matte", {}), ("glow", {}), ("glow", {"style": "collioure"}), ("tone", {}))
REMOVE: dict[str, object] = {"direction": "remove", "allow_lightening": True}


def lab(image: np.ndarray) -> np.ndarray:
    return srgb_to_lab(image[..., :3])


def disc(shape: tuple[int, int], x: float, y: float, r: float) -> np.ndarray:
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]]
    return (xx + 0.5 - x) ** 2 + (yy + 0.5 - y) ** 2 <= r * r


class RegionAndIdentityTest(unittest.TestCase):
    def test_every_tool_changes_only_the_skin_and_keeps_identity_on_six_tones(self) -> None:
        for tone in SKIN_TONES:
            face = drawn_face(tone, seed=2, width=160, height=192)
            h, w = face.image.shape[:2]
            skin = skin_mask(face.points, h, w)
            for tool, params in (*CALLS, ("tan", REMOVE)):
                out = studio.render(tool, face.image, face.points, strength=100, **params)
                assert not isinstance(out, Refusal)
                changed = np.any(out.image != face.image, axis=2)
                self.assertTrue(changed.any(), f"{tone} {tool} changed nothing")
                self.assertFalse((changed & (skin <= 0)).any(), f"{tone} {tool} changed pixels outside the skin")
                score = I.identity_score(face.image, out.image, points_before=face.points, points_after=face.points)
                self.assertGreaterEqual(score.score, I.LOCK_THRESHOLD + 3, f"{tone} {tool} identity {score.score:.2f}")

    def test_strength_zero_is_an_exact_no_op(self) -> None:
        face = skin_face("tan", width=120, height=144)
        for tool, params in (*CALLS, ("tan", REMOVE)):
            out = studio.render(tool, face.image, face.points, strength=0, **params)
            assert not isinstance(out, Refusal)
            np.testing.assert_array_equal(out.image, face.image, err_msg=tool)
            self.assertFalse(out.weight.any())

    def test_alpha_is_untouched(self) -> None:
        face = skin_face("light", width=120, height=144)
        h, w = face.image.shape[:2]
        alpha = ((np.arange(h * w).reshape(h, w) * 37) % 256).astype(np.uint8)
        rgba = np.dstack([face.image, alpha])
        for tool, params in (*CALLS, ("tan", REMOVE)):
            out = studio.render(tool, rgba, face.points, strength=80, **params)
            assert not isinstance(out, Refusal)
            self.assertEqual(out.image.shape, rgba.shape)
            np.testing.assert_array_equal(out.image[..., 3], alpha, err_msg=tool)
            rgb = studio.render(tool, face.image, face.points, strength=80, **params)
            assert not isinstance(rgb, Refusal)
            np.testing.assert_array_equal(out.image[..., :3], rgb.image, err_msg=f"{tool}: alpha changed the colour result")


class WomenFirstRulesTest(unittest.TestCase):
    """The default-preset check (arena/presets.py) applied to each tool: no unasked lightening,
    slimming or mark loss. Tan removal is the one tool that lightens, which is why it is opt-in."""

    def test_no_tool_lightens_slims_or_erases_marks_except_chosen_tan_removal(self) -> None:
        for tone in SKIN_TONES:
            face = drawn_face(tone, seed=1, width=160, height=192)
            shape = face.image.shape[:2]
            zone = I.zones(face.points, shape)["skin"]
            scale = I.iod(face.points)
            found = M.find_marks(face.image, zone, scale)
            self.assertGreater(len(found), 3)
            for strength in (30, 100):
                for tool, params in (*CALLS, ("tan", REMOVE)):
                    out = studio.render(tool, face.image, face.points, strength=strength, **params)
                    assert not isinstance(out, Refusal)
                    kept = M.retention(found, out.image, scale)
                    flags, _ = scorer.unrequested_changes(face.image, out.image, zone, points_before=face.points,
                                                          points_after=face.points, retained=kept, filter_name=tool)
                    lightened = [f for f in flags if "lighten" in f]
                    others = [f for f in flags if "lighten" not in f]
                    self.assertEqual(others, [], f"{tone} {tool} {strength}")
                    if params is not REMOVE:
                        self.assertEqual(lightened, [], f"{tone} {tool} {strength} lightened skin")
                if strength == 100:
                    removed = studio.render("tan", face.image, face.points, strength=100, **REMOVE)
                    assert not isinstance(removed, Refusal)
                    self.assertGreater(np.median(lab(removed.image)[zone >= 0.5, 0] - lab(face.image)[zone >= 0.5, 0]), 2.0)

    def test_darkening_tools_never_raise_any_pixel_lightness(self) -> None:
        for tone in ("very_light", "medium", "very_dark"):
            face = skin_face(tone, width=160, height=192)
            before = lab(face.image)[..., 0]
            for tool, params in (("freckles", {}), ("tan", {}), ("matte", {}), ("tone", {"redness": 100})):
                out = studio.render(tool, face.image, face.points, strength=100, **params)
                assert not isinstance(out, Refusal)
                self.assertLessEqual(float((lab(out.image)[..., 0] - before).max()), 1e-9, f"{tone} {tool}")

    def test_tan_removal_is_opt_in_and_never_a_default(self) -> None:
        face = skin_face("medium", width=120, height=144)
        refused = studio.render("tan", face.image, face.points, strength=50, direction="remove")
        self.assertIsInstance(refused, Refusal)
        assert isinstance(refused, Refusal)
        self.assertEqual(refused.code, "lightening_needs_opt_in")
        self.assertEqual(refused.to_json()["reason_code"], "lightening_needs_opt_in")
        skin = skin_mask(face.points, *face.image.shape[:2])
        with self.assertRaises(LighteningNotChosen):
            tan(face.image, skin, direction="remove", strength=50, allow_lightening="yes")  # type: ignore[arg-type]
        default = studio.render("tan", face.image, face.points)
        assert not isinstance(default, Refusal)
        self.assertEqual(default.metrics["direction"], "add")
        presets = json.loads((API / "plumb_api" / "arena" / "default_presets.json").read_text(encoding="utf-8"))
        for preset in presets["presets"]:
            for step in preset["steps"]:
                self.assertNotEqual(step.get("direction"), "remove", preset["id"])
                self.assertNotIn(step["engine"], ("tan", "skin"), "skin tools are her choice, never a default preset")


class ToolBehaviourTest(unittest.TestCase):
    def setUp(self) -> None:
        self.face = skin_face("medium", width=200, height=240)
        self.h, self.w = self.face.image.shape[:2]
        self.skin = skin_mask(self.face.points, self.h, self.w)
        self.frame = frame(self.face.points)

    def test_freckles_are_seeded_inside_the_nose_and_cheek_zone(self) -> None:
        placed = place(self.frame, self.skin, 60, 7)
        self.assertEqual(len(placed), 54)
        self.assertEqual(placed, place(self.frame, self.skin, 60, 7))
        self.assertNotEqual(placed, place(self.frame, self.skin, 60, 8))
        self.assertEqual(place(self.frame, self.skin, 0, 7), [])
        for f in placed:
            a, b = self.frame.local(f.x, f.y)
            self.assertTrue(-1.15 <= a <= 1.15 and 0.05 <= b <= 0.95, (a, b))
            self.assertGreaterEqual(self.skin[int(f.y), int(f.x)], 0.5)
        out = studio.render("freckles", self.face.image, self.face.points, strength=100, density=60, seed=7)
        assert not isinstance(out, Refusal)
        darker = lab(self.face.image)[..., 0] - lab(out.image)[..., 0]
        for f in placed:
            self.assertGreater(darker[int(f.y), int(f.x)], 1.0)
        less = studio.render("freckles", self.face.image, self.face.points, strength=100, density=20, seed=7)
        assert not isinstance(less, Refusal)
        self.assertLess(int(less.metrics["freckles"]), int(out.metrics["freckles"]))
        with self.assertRaises(ValueError):
            place(self.frame, self.skin, 101, 7)

    def test_even_tone_reduces_the_red_blotch_and_redness_adds_to_it(self) -> None:
        bx, by, br = self.face.blotch
        spot = disc((self.h, self.w), bx, by, br * 0.5) & (self.skin >= 0.5)
        ring = disc((self.h, self.w), bx, by, br * 2.2) & ~disc((self.h, self.w), bx, by, br * 1.4) & (self.skin >= 0.5)
        before = lab(self.face.image)

        def excess(image: np.ndarray) -> float:
            a = lab(image)[..., 1]
            return float(np.median(a[spot]) - np.median(a[ring]))

        start = excess(self.face.image)
        self.assertGreater(start, 4.0)
        plain = even_tone(self.face.image, self.skin, self.frame, strength=100, redness=0)
        red = even_tone(self.face.image, self.skin, self.frame, strength=100, redness=100)
        self.assertLess(excess(plain.image), start * 0.7)
        self.assertLess(excess(red.image), excess(plain.image))
        self.assertLessEqual(float((lab(red.image)[..., 0] - before[..., 0]).max()), 1e-9)
        # a drawn mole inside the region keeps its contrast against its own surround
        scale = I.iod(self.face.points)
        found = M.find_marks(self.face.image, self.skin, scale)
        kept = M.retention(found, red.image, scale)
        self.assertGreater(kept.found, 3)
        self.assertGreaterEqual(kept.share or 0.0, 0.9)
        with self.assertRaises(ValueError):
            even_tone(self.face.image, self.skin, self.frame, redness=-1)

    def test_matte_takes_down_the_shine_spot_only(self) -> None:
        sx, sy, sr = self.face.shine
        spot = disc((self.h, self.w), sx, sy, sr * 0.4)
        far = (self.skin >= 0.5) & ~disc((self.h, self.w), sx, sy, sr * 2.5)
        before = lab(self.face.image)
        out = matte(self.face.image, self.skin, self.frame, strength=100)
        after = lab(out.image)
        self.assertLess(float(np.mean(after[spot, 0] - before[spot, 0])), -2.0)
        chroma = lambda p: np.hypot(p[..., 1], p[..., 2])  # noqa: E731
        self.assertGreater(float(np.mean(chroma(after)[spot] - chroma(before)[spot])), 0.5, "colour returns under the shine")
        self.assertLess(float(np.mean(np.abs(after[far, 0] - before[far, 0]))), 0.1)
        self.assertGreater(float(out.metrics["peak_bump"]), 4.0)
        plain = skin_face("medium", width=200, height=240, shine=False, blotch=False)
        flat = matte(plain.image, self.skin, self.frame, strength=100)
        self.assertGreater(float(np.mean(lab(flat.image)[spot, 0] - lab(plain.image)[spot, 0])), -0.5,
                           "without a shine spot there is nothing there to take down")

    def test_glow_lifts_high_points_and_keeps_average_skin_lightness(self) -> None:
        inside = self.skin >= 0.5
        before = lab(self.face.image)[..., 0]
        peaks = high_points(self.frame, (self.h, self.w))
        top = inside & (peaks > 0.6)
        low = inside & (peaks == 0)
        results = {}
        for style in GLOWS:
            out = glow(self.face.image, self.skin, self.frame, strength=100, style=style)
            change = lab(out.image)[..., 0] - before
            self.assertGreater(float(change[top].mean()), 1.0, style)
            self.assertLess(float(change[low].mean()), 0.0, style)
            self.assertLess(abs(float(change[inside].mean())), 0.3, f"{style}: average skin lightness moved")
            self.assertIn(GLOWS[style].name, out.label)
            results[style] = out.image
        self.assertFalse(np.array_equal(results["cassis"], results["collioure"]))
        with self.assertRaises(ValueError):
            glow(self.face.image, self.skin, self.frame, style="unknown")

    def test_tan_add_darkens_and_warms_by_undertone(self) -> None:
        inside = self.skin >= 0.5
        before = lab(self.face.image)
        olive = tan(self.face.image, self.skin, strength=100, undertone="olive")
        cool = tan(self.face.image, self.skin, strength=100, undertone="cool")
        for out in (olive, cool):
            delta = lab(out.image) - before
            self.assertLess(float(np.median(delta[inside, 0])), -3.0)
        self.assertGreater(float(np.median((lab(olive.image) - before)[inside, 2])),
                           float(np.median((lab(cool.image) - before)[inside, 2])))
        with self.assertRaises(ValueError):
            tan(self.face.image, self.skin, direction="sideways")


class RefusalTest(unittest.TestCase):
    def setUp(self) -> None:
        self.face = skin_face("dark", width=120, height=144)

    def test_degenerate_meshes_are_refused_with_codes(self) -> None:
        pts = self.face.points.copy()
        cases = {"wrong_shape": pts[:400], "duplicate_points": pts.copy(), "outside_frame": pts + 1000.0}
        cases["duplicate_points"][5] = cases["duplicate_points"][6]
        for code, points in cases.items():
            for tool in studio.TOOLS:
                out = studio.render(tool, self.face.image, points)
                self.assertIsInstance(out, Refusal, f"{tool} {code}")
                assert isinstance(out, Refusal)
                self.assertEqual((out.module, out.code), (f"skin.{tool}", code))

    def test_a_face_with_almost_no_visible_skin_is_refused(self) -> None:
        # A small, valid face (the mesh checks pass) with too little skin for the tools.
        small = skin_face("dark", width=48, height=58)
        image, shifted = small.image, small.points
        self.assertEqual(inspect_mesh(shifted, *image.shape[:2]), [])
        out = studio.render("tone", image, shifted)
        self.assertIsInstance(out, Refusal)
        assert isinstance(out, Refusal)
        self.assertEqual(out.code, studio.NO_SKIN)

    def test_bad_arguments_raise(self) -> None:
        for kwargs in ({"strength": 101}, {"strength": float("nan")}):
            with self.assertRaises(ValueError):
                studio.render("glow", self.face.image, self.face.points, **kwargs)
        with self.assertRaises(ValueError):
            studio.render("blush", self.face.image, self.face.points)
        with self.assertRaises(ValueError):
            studio.render("tone", self.face.image.astype(np.float32), self.face.points)


class CrossLanguageVectorsTest(unittest.TestCase):
    def test_stored_vectors_match_the_python_tools(self) -> None:
        script = API / "scripts" / "skin_tools_vectors.py"
        run = subprocess.run([sys.executable, str(script), "--check"], capture_output=True, text=True, check=False)
        self.assertEqual(run.returncode, 0, run.stdout + run.stderr)
        data = json.loads((API / "tests" / "goldens" / "skin-tools.json").read_text(encoding="utf-8"))
        self.assertEqual({c["tool"] for c in data["cases"]}, set(studio.TOOLS))


if __name__ == "__main__":
    unittest.main()
