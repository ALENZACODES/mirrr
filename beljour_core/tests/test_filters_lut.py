"""33-point LUT bake and tetrahedral apply (filters-plan.md §3.3; FX1 acceptance: identity, lattice)."""
from __future__ import annotations

import unittest

import numpy as np

from plumb_api.filters import engine
from plumb_api.filters.colour import lut as LUT
from plumb_api.filters.colour import space as S
from plumb_api.filters.recipe import registry


def baked(rid: str, strength: float = 100) -> np.ndarray:
    p = engine.plan(registry.default().get(rid), engine.Settings(strength=strength, guard=False))
    return LUT.bake(engine.colour_transform(p.family("colour")))


class LutTest(unittest.TestCase):
    def test_identity_recipe_bakes_an_identity_lut(self) -> None:
        p = engine.plan(registry.default().get("C08"), engine.Settings(strength=0, guard=False))
        table = LUT.bake(engine.colour_transform(p.family("colour")))
        np.testing.assert_allclose(table, LUT.identity(), atol=1e-6)
        self.assertEqual(table.shape, (LUT.SIZE ** 3 * 3,))

    def test_lattice_layout_is_red_slowest(self) -> None:
        lat = LUT.lattice(3).reshape(-1, 3)
        self.assertEqual(lat[1].tolist(), [0.0, 0.0, 0.5])
        self.assertEqual(lat[3].tolist(), [0.0, 0.5, 0.0])
        self.assertEqual(lat[9].tolist(), [0.5, 0.0, 0.0])
        with self.assertRaises(ValueError):
            LUT.lattice(1)

    def test_tetrahedral_is_exact_on_lattice_points(self) -> None:
        table = baked("C01")
        idx = np.array([[i, j, k] for i in (0, 7, 16, 32) for j in (0, 11, 32) for k in (0, 5, 31, 32)])
        rgb = idx / (LUT.SIZE - 1)
        np.testing.assert_allclose(LUT.apply(table, rgb), LUT.sample(table, idx), atol=1e-12)

    def test_identity_lut_returns_every_byte(self) -> None:
        values = np.arange(256, dtype=np.uint8)
        img = np.stack(np.meshgrid(values, values[::-1], indexing="ij"), axis=-1)[..., [0, 1, 0]]
        out = S.unit_to_bytes(LUT.apply_bytes(LUT.identity(), img))
        np.testing.assert_array_equal(out, img)

    def test_interpolation_tracks_the_direct_transform(self) -> None:
        rng = np.random.default_rng(4)
        rgb = rng.random((500, 3))
        for rid in ("C01", "C30", "C09", "M01"):
            p = engine.plan(registry.default().get(rid), engine.Settings(strength=100, guard=False))
            direct = engine.colour_transform(p.family("colour"))(rgb)
            via = LUT.apply(LUT.bake(engine.colour_transform(p.family("colour"))), rgb)
            err = np.abs(direct - via)
            self.assertLess(float(err.max()), 10 / 255, rid)  # strongest at 100, at saturated corners
            self.assertLess(float(err.mean()), 0.5 / 255, rid)

    def test_greys_stay_grey_through_a_mono_lut(self) -> None:
        table = baked("M01", 30)
        greys = np.repeat(np.linspace(0, 1, 97)[:, None], 3, axis=1)
        out = LUT.apply(table, greys)
        self.assertTrue(np.all(out[:, 0] == out[:, 1]) and np.all(out[:, 1] == out[:, 2]))
        colours = np.random.default_rng(1).random((300, 3))
        mono = LUT.apply(table, colours)
        self.assertLess(float(np.abs(mono[:, 0] - mono[:, 2]).max()), 1e-12, "a step mono mix is black and white at 30")

    def test_tie_cases_choose_consistent_tetrahedra(self) -> None:
        table = baked("C19")
        # ties between fractions sit on shared faces of two tetrahedra; both sides must agree
        base = np.array([[0.4, 0.4, 0.2], [0.2, 0.4, 0.4], [0.4, 0.2, 0.4], [0.3, 0.3, 0.3]])
        eps = 1e-9
        for p in base:
            nudged = np.array([p + [eps, 0, 0], p + [0, eps, 0], p + [0, 0, eps]])
            np.testing.assert_allclose(LUT.apply(table, nudged), LUT.apply(table, p[None].repeat(3, 0)), atol=1e-7)

    def test_bake_rejects_a_broken_transform(self) -> None:
        with self.assertRaises(ValueError):
            LUT.bake(lambda rgb: rgb[:10])
        nan = LUT.bake(lambda rgb: np.clip(rgb * 2, 0, 1))
        self.assertLessEqual(float(nan.max()), 1.0)

    def test_monotone_along_the_grey_axis_for_every_shipped_look(self) -> None:
        greys = np.repeat(np.linspace(0, 1, 65)[:, None], 3, axis=1)
        for r in registry.default().ranked():
            table = baked(r["id"])
            light = S.srgb_to_oklab(LUT.apply(table, greys))[:, 0]
            self.assertTrue(np.all(np.diff(light) >= -2e-3), f"{r['id']} inverts the grey ramp")


if __name__ == "__main__":
    unittest.main()
