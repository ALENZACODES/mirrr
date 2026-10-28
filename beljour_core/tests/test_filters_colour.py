"""FX1 colour ops (OKLab/OKLCh, linear light), curves, scaling and the fallback (filters-plan.md §3.3)."""
from __future__ import annotations

import unittest

import numpy as np

from plumb_api.engines.core import colour as core
from plumb_api.filters import oplist
from plumb_api.filters.colour import curves
from plumb_api.filters.colour import ops as O
from plumb_api.filters.colour import space as S

ROUND_TRIP = 2e-6


def palette(n: int = 400, seed: int = 3) -> np.ndarray:
    rng = np.random.default_rng(seed)
    greys = np.repeat(np.linspace(0, 1, 17)[:, None], 3, axis=1)
    return np.vstack([greys, rng.random((n, 3))])


def run(name: str, rgb: np.ndarray, **given: object) -> np.ndarray:
    return O.run(name, rgb, O.full_params(oplist.op(name), given))


class SpaceTest(unittest.TestCase):
    def test_conversions_match_the_scalar_core(self) -> None:
        rgb = palette(60)
        lab = S.srgb_to_oklab(rgb)
        for i in range(0, len(rgb), 7):
            expected = core.rgb_to_oklab(rgb[i] * 255)
            np.testing.assert_allclose(lab[i], expected, atol=1e-7)  # greys are exact here, ~2e-8 off in core
            np.testing.assert_allclose(S.srgb_to_lab(rgb[i:i + 1])[0], core.rgb_to_lab(rgb[i] * 255), atol=1e-9)

    def test_round_trips(self) -> None:
        rgb = palette(200)
        np.testing.assert_allclose(S.oklab_to_srgb(S.srgb_to_oklab(rgb)), rgb, atol=ROUND_TRIP)
        np.testing.assert_allclose(S.lab_to_srgb(S.srgb_to_lab(rgb)), rgb, atol=5e-6)  # 7-digit sRGB matrices
        np.testing.assert_allclose(S.oklch_to_oklab(S.oklab_to_oklch(S.srgb_to_oklab(rgb))), S.srgb_to_oklab(rgb), atol=1e-12)

    def test_greys_are_exactly_neutral(self) -> None:
        greys = np.repeat(np.linspace(0, 1, 33)[:, None], 3, axis=1)
        lab = S.srgb_to_oklab(greys)
        self.assertTrue(np.all(lab[:, 1:] == 0))
        back = S.oklab_to_srgb(lab)
        self.assertTrue(np.all(back[:, 0] == back[:, 1]) and np.all(back[:, 1] == back[:, 2]))

    def test_mid_grey_is_l_star_50(self) -> None:
        self.assertAlmostEqual(S.srgb_to_lab(np.array([[S.MID_GREY_BYTE / 255] * 3]))[0, 0], 50.0, delta=0.05)

    def test_wrap_and_smoothstep(self) -> None:
        np.testing.assert_allclose(S.wrap_degrees(np.array([190, -190, 180, -180, 0, 359])), [-170, 170, 180, 180, 0, -1])
        self.assertEqual(float(S.smoothstep(0, 1, np.array(0.5))), 0.5)
        with self.assertRaises(ValueError):
            S.smoothstep(1, 1, np.array(0.3))

    def test_vectorised_ciede2000_matches_the_reference(self) -> None:
        rng = np.random.default_rng(5)
        a = S.srgb_to_lab(rng.random((40, 3)))
        b = S.srgb_to_lab(rng.random((40, 3)))
        got = S.ciede2000(a, b)
        for i in range(40):
            self.assertAlmostEqual(float(got[i]), core.ciede2000(a[i], b[i]), places=9)

    def test_byte_rounding_is_half_even(self) -> None:
        self.assertEqual(S.unit_to_bytes(np.array([0.5 / 255, 1.5 / 255, 2.5 / 255])).tolist(), [0, 2, 2])


class NeutralTest(unittest.TestCase):
    def test_every_colour_op_at_neutral_is_the_identity(self) -> None:
        # The published OKLab matrices are inverses to about 1e-7, so an OKLab op at neutral
        # moves a colour by at most ~2e-6 (far below one byte level, 3.9e-3).
        rgb = palette()
        for name in oplist.names("colour"):
            out = O.run(name, rgb, O.full_params(oplist.op(name), {}))
            np.testing.assert_allclose(out, rgb, atol=ROUND_TRIP, err_msg=name)

    def test_scale_zero_is_neutral_and_one_is_target(self) -> None:
        for name in oplist.names():
            spec = oplist.op(name)
            zero = O.scale_params(spec, {}, 0.0)
            for key, p in spec.params.items():
                if p.kind in ("number", "fixed", "angle", "stat"):
                    self.assertEqual(zero[key], p.neutral, f"{name}.{key}")
        target = {"amount": 0.4, "pivot": 0.5}
        full = O.scale_params(oplist.op("colour.contrast"), target, 1.0)
        self.assertEqual(full, {"amount": 0.4, "pivot": 0.5})
        half = O.scale_params(oplist.op("colour.contrast"), target, 0.5)
        self.assertAlmostEqual(half["amount"], 0.2)
        self.assertEqual(half["pivot"], 0.5, "fixed settings don't follow strength")

    def test_scale_rules(self) -> None:
        self.assertEqual([O.scale_fraction("linear", s) for s in (0, 0.5, 1)], [0, 0.5, 1])
        self.assertEqual(O.scale_fraction("easeIn", 0.5), 0.25)
        self.assertEqual(O.scale_fraction("easeOut", 0.5), 0.75)
        self.assertEqual([O.scale_fraction("step", s) for s in (0, 0.01, 1)], [0, 1, 1])
        self.assertEqual(O.scale_fraction("linear", 7), 1.0)
        with self.assertRaises(ValueError):
            O.scale_fraction("bounce", 0.5)

    def test_matrix_and_points_scale(self) -> None:
        mono = [[0.3, 0.6, 0.1]] * 3
        full = O.scale_params(oplist.op("colour.channelMixer"), {"matrix": mono}, 1.0)["matrix"]
        self.assertEqual(full[0], full[1], "a full mono mix keeps three identical rows")
        half = O.scale_params(oplist.op("colour.channelMixer"), {"matrix": mono}, 0.5)["matrix"]
        self.assertAlmostEqual(half[0][0], 0.65)
        pts = O.scale_params(oplist.op("colour.curve"), {"master": [[0, 0.1], [1, 0.9]]}, 0.5)["master"]
        self.assertEqual(pts, [(0.0, 0.05), (1.0, 0.95)])


class OpBehaviourTest(unittest.TestCase):
    def test_white_balance_warms_and_keeps_luminance(self) -> None:
        rgb = palette(100)
        out = run("colour.whiteBalance", rgb, temperature=0.6)
        lum_in, lum_out = S.luminance(S.decode(rgb)), S.luminance(S.decode(out))
        inside = (S.decode(out) < 0.999).all(axis=1) & (S.decode(out) > 0.001).all(axis=1)
        np.testing.assert_allclose(lum_out[inside], lum_in[inside], atol=1e-9)
        self.assertGreater(float((out[:, 0] - out[:, 2]).mean()), float((rgb[:, 0] - rgb[:, 2]).mean()))

    def test_exposure_is_stops_in_linear_light(self) -> None:
        rgb = np.array([[0.2, 0.3, 0.4]])
        out = run("colour.exposure", rgb, ev=1.0)
        np.testing.assert_allclose(S.decode(out), S.decode(rgb) * 2, atol=1e-12)

    def test_contrast_fixes_black_white_and_pivot_and_is_monotone(self) -> None:
        light = np.linspace(0, 1, 501)
        for amount in (-0.9, -0.3, 0.3, 0.9):
            curve = O.contrast_curve(light, amount, 0.6)
            self.assertAlmostEqual(float(curve[0]), 0.0, places=12)
            self.assertAlmostEqual(float(curve[-1]), 1.0, places=12)
            self.assertAlmostEqual(float(O.contrast_curve(np.array(0.6), amount, 0.6)), 0.6, places=12)
            self.assertTrue(np.all(np.diff(curve) >= -1e-12), amount)
        steeper = O.contrast_curve(np.array([0.55, 0.65]), 0.5, 0.6)
        self.assertGreater(float(steeper[1] - steeper[0]), 0.1)

    def test_vibrance_sign_targets_quiet_or_strong_colours(self) -> None:
        quiet, strong = np.array([[0.55, 0.5, 0.48]]), np.array([[0.9, 0.1, 0.1]])
        chroma = lambda c: float(S.oklab_to_oklch(S.srgb_to_oklab(c))[0, 1])  # noqa: E731
        up_q = chroma(run("colour.vibrance", quiet, amount=0.5)) / chroma(quiet)
        up_s = chroma(run("colour.vibrance", strong, amount=0.5)) / chroma(strong)
        self.assertGreater(up_q, up_s)
        down_q = chroma(run("colour.vibrance", quiet, amount=-0.5)) / chroma(quiet)
        down_s = chroma(run("colour.vibrance", strong, amount=-0.5)) / chroma(strong)
        self.assertLess(down_s, down_q, "negative vibrance mutes the strongest colours first")

    def test_band_weights_partition_and_peak(self) -> None:
        hues = np.linspace(0, 359.9, 721)
        w = O.band_weights(hues)
        np.testing.assert_allclose(w.sum(axis=1), 1.0, atol=1e-12)
        for k, centre in enumerate(O.BAND_CENTRES):
            self.assertAlmostEqual(float(O.band_weights(np.array([centre]))[0, k]), 1.0)
        self.assertTrue(np.all((w > 0).sum(axis=1) <= 2))

    def test_hsl_turns_only_its_band_and_leaves_greys(self) -> None:
        blue, red, grey = np.array([[0.1, 0.2, 0.9]]), np.array([[0.9, 0.1, 0.12]]), np.array([[0.4, 0.4, 0.4]])
        bands = {"blue": {"hue": 20, "chroma": 0.0, "light": 0.0}}
        hue = lambda c: float(S.oklab_to_oklch(S.srgb_to_oklab(c))[0, 2])  # noqa: E731
        self.assertGreater(S.wrap_degrees(np.array(hue(run("colour.hsl", blue, bands=bands)) - hue(blue))), 5)
        np.testing.assert_allclose(run("colour.hsl", red, bands=bands), red, atol=ROUND_TRIP)
        np.testing.assert_allclose(run("colour.hsl", grey, bands={"red": {"hue": 40, "chroma": 1, "light": 1}}), grey, atol=1e-12)

    def test_tints_push_toward_their_hue_and_spare_black_and_white(self) -> None:
        mid = np.array([[0.5, 0.5, 0.5]])
        out = run("colour.tint", mid, hue=88, amount=0.04)
        lch = S.oklab_to_oklch(S.srgb_to_oklab(out))[0]
        self.assertGreater(lch[1], 0.03)
        self.assertLess(abs(float(S.wrap_degrees(np.array(lch[2] - 88)))), 3)
        ends = np.array([[0.0, 0.0, 0.0], [1.0, 1.0, 1.0]])
        np.testing.assert_allclose(run("colour.tint", ends, hue=88, amount=0.04), ends, atol=1e-9)
        split = run("colour.splitTone", np.array([[0.1, 0.1, 0.1], [0.9, 0.9, 0.9]]), shadowHue=225, shadowAmount=0.05,
                    highlightHue=70, highlightAmount=0.05)
        hues = S.oklab_to_oklch(S.srgb_to_oklab(split))[:, 2]
        self.assertLess(abs(float(S.wrap_degrees(np.array(hues[0] - 225)))), 15)
        self.assertLess(abs(float(S.wrap_degrees(np.array(hues[1] - 70)))), 15)

    def test_fade_rolloff_and_tone_shape_lightness(self) -> None:
        ramp = np.repeat(np.linspace(0, 1, 11)[:, None], 3, axis=1)
        light = lambda c: S.srgb_to_oklab(c)[:, 0]  # noqa: E731
        faded = light(run("colour.fade", ramp, amount=1.0))
        self.assertAlmostEqual(float(faded[0]), O.FADE_BLACK, places=9)
        self.assertAlmostEqual(float(faded[-1]), 1 - O.FADE_WHITE, places=9)
        rolled = light(run("colour.highlightRolloff", ramp, amount=1.0, knee=0.6))
        self.assertAlmostEqual(float(rolled[-1]), 0.8, places=9, msg="whites compressed by half above the knee")
        np.testing.assert_allclose(rolled[light(ramp) <= 0.6], light(ramp)[light(ramp) <= 0.6], atol=1e-12)
        lifted = light(run("colour.tone", ramp, shadows=1.0))
        self.assertTrue(np.all(lifted >= light(ramp) - 1e-12))
        self.assertTrue(np.all(np.diff(O.tone_curve(np.linspace(0, 1, 401), 1.0, -1.0)) > 0))

    def test_clean_whites_remove_colour_above_the_knee_only(self) -> None:
        warm_white, warm_mid = np.array([[1.0, 0.95, 0.85]]), np.array([[0.45, 0.35, 0.3]])
        chroma = lambda c: float(S.oklab_to_oklch(S.srgb_to_oklab(c))[0, 1])  # noqa: E731
        self.assertLess(chroma(run("colour.highlightRolloff", warm_white, chroma=-1.0, knee=0.7)), chroma(warm_white) * 0.5)
        np.testing.assert_allclose(run("colour.highlightRolloff", warm_mid, chroma=-1.0, knee=0.7), warm_mid, atol=ROUND_TRIP)

    def test_channel_mixer_mono_is_exact_grey(self) -> None:
        rgb = palette(50)
        out = run("colour.channelMixer", rgb, matrix=[list(S.LUMA)] * 3)
        self.assertTrue(np.all(out[:, 0] == out[:, 1]) and np.all(out[:, 1] == out[:, 2]))
        np.testing.assert_allclose(S.luminance(S.decode(out[:, :1].repeat(3, 1))), S.luminance(S.decode(rgb)), atol=1e-9)

    def test_grey_world_removes_half_the_cast(self) -> None:
        rng = np.random.default_rng(9)
        neutral = np.clip(0.5 + rng.normal(0, 0.12, (400, 1)), 0, 1).repeat(3, axis=1)
        tinted = S.oklab_to_srgb(S.srgb_to_oklab(neutral) + np.array([0, 0.0, 0.02]))
        a, b = O.photo_cast(tinted)
        self.assertAlmostEqual(a, 0.0, places=3)
        self.assertAlmostEqual(b, 0.02, delta=0.003)
        out = O.run("colour.greyWorld", tinted, {"amount": 1.0, "castA": a, "castB": b})
        after = O.photo_cast(out)
        self.assertLess(abs(after[1] - b / 2), 0.004)
        self.assertEqual(O.photo_cast(np.array([[1.0, 0.0, 0.0]])), (0.0, 0.0), "no quiet pixel, no cast")
        self.assertLessEqual(abs(O.photo_cast(np.array([[0.8, 0.6, 0.5]] * 4))[0]), O.CAST_LIMIT)

    def test_fallback_drops_skin_hue_steps(self) -> None:
        bands = {"orange": {"hue": 10.0, "chroma": 0.2, "light": 0.0}, "blue": {"hue": 10.0, "chroma": 0.0, "light": 0.0}}
        kept = O.without_skin_hue("colour.hsl", {"bands": bands})
        assert kept is not None
        self.assertEqual(kept["bands"]["orange"]["hue"], 0.0)
        self.assertEqual(kept["bands"]["orange"]["chroma"], 0.2)
        self.assertEqual(kept["bands"]["blue"]["hue"], 10.0)
        self.assertIsNone(O.without_skin_hue("colour.splitTone", {}))
        self.assertIsNone(O.without_skin_hue("light.grade", {}))
        self.assertEqual(O.without_skin_hue("colour.exposure", {"ev": 0.1}), {"ev": 0.1})

    def test_registry_names_are_unique_and_grouped(self) -> None:
        self.assertEqual(len(oplist.names("colour")), 14)
        # glow, plus the texture finishes added with the add-on looks (behaviour in tests/r34b)
        self.assertEqual(oplist.names("spatial"), ["spatial.glow", "spatial.grain", "spatial.halation", "spatial.structure"])
        # light.border is the frame finish (behaviour in tests/r33b/test_finishing_fx.py)
        self.assertEqual(oplist.names("light"), ["light.border", "light.centre", "light.grade", "light.vignette"])
        with self.assertRaises(KeyError):
            oplist.op("colour.nothing")
        with self.assertRaises(ValueError):
            O.register(oplist.op("colour.tint"))
        with self.assertRaises(ValueError):
            O.run("spatial.glow", np.zeros((1, 3)), {})


class CurveTest(unittest.TestCase):
    def test_monotone_through_points_with_end_rules(self) -> None:
        pts = curves.check_points([[0.1, 0.0], [0.2, 0.9], [0.3, 0.92], [0.9, 1.0]])
        xs = np.linspace(-0.2, 1.2, 701)
        ys = curves.evaluate(pts, xs)
        self.assertTrue(np.all(np.diff(ys) >= -1e-12), "never dips between rising points")
        for x, y in pts:
            self.assertAlmostEqual(float(curves.evaluate(pts, np.array(x))), y, places=12)
        self.assertEqual(float(ys[0]), 0.0)
        self.assertEqual(float(ys[-1]), 1.0)

    def test_flat_segments_stay_flat(self) -> None:
        pts = curves.check_points([[0, 0.2], [0.4, 0.2], [1, 0.8]])
        self.assertTrue(np.allclose(curves.evaluate(pts, np.linspace(0, 0.4, 20)), 0.2))
        self.assertEqual(curves.tangents(pts)[:2], [0.0, 0.0])

    def test_bad_points(self) -> None:
        for bad in ([[0, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 1.5]], [[0, 0], [1]], "no"):
            with self.assertRaises((ValueError, TypeError)):
                curves.check_points(bad)  # type: ignore[arg-type]
        self.assertTrue(curves.is_identity(curves.IDENTITY))
        self.assertFalse(curves.is_identity([(0, 0.1), (1, 1)]))


if __name__ == "__main__":
    unittest.main()
