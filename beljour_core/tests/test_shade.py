import unittest

from plumb_api.services import shade

# Sharma, Wu and Dalal (2005), Table 1: (L1, a1, b1, L2, a2, b2, expected ΔE00)
SHARMA_PAIRS = [
    (50.0000, 2.6772, -79.7751, 50.0000, 0.0000, -82.7485, 2.0425),
    (50.0000, 3.1571, -77.2803, 50.0000, 0.0000, -82.7485, 2.8615),
    (50.0000, 2.8361, -74.0200, 50.0000, 0.0000, -82.7485, 3.4412),
    (50.0000, -1.3802, -84.2814, 50.0000, 0.0000, -82.7485, 1.0000),
    (50.0000, -1.1848, -84.8006, 50.0000, 0.0000, -82.7485, 1.0000),
    (50.0000, -0.9009, -85.5211, 50.0000, 0.0000, -82.7485, 1.0000),
    (50.0000, 0.0000, 0.0000, 50.0000, -1.0000, 2.0000, 2.3669),
    (50.0000, -1.0000, 2.0000, 50.0000, 0.0000, 0.0000, 2.3669),
    (50.0000, 2.4900, -0.0010, 50.0000, -2.4900, 0.0009, 7.1792),
    (50.0000, 2.4900, -0.0010, 50.0000, -2.4900, 0.0010, 7.1792),
    (50.0000, 2.4900, -0.0010, 50.0000, -2.4900, 0.0011, 7.2195),
    (50.0000, 2.4900, -0.0010, 50.0000, -2.4900, 0.0012, 7.2195),
    (50.0000, -0.0010, 2.4900, 50.0000, 0.0009, -2.4900, 4.8045),
    (50.0000, -0.0010, 2.4900, 50.0000, 0.0011, -2.4900, 4.7461),
    (50.0000, 2.5000, 0.0000, 50.0000, 0.0000, -2.5000, 4.3065),
    (50.0000, 2.5000, 0.0000, 73.0000, 25.0000, -18.0000, 27.1492),
    (50.0000, 2.5000, 0.0000, 61.0000, -5.0000, 29.0000, 22.8977),
    (50.0000, 2.5000, 0.0000, 56.0000, -27.0000, -3.0000, 31.9030),
    (50.0000, 2.5000, 0.0000, 58.0000, 24.0000, 15.0000, 19.4535),
    (50.0000, 2.5000, 0.0000, 50.0000, 3.1736, 0.5854, 1.0000),
    (50.0000, 2.5000, 0.0000, 50.0000, 3.2972, 0.0000, 1.0000),
    (50.0000, 2.5000, 0.0000, 50.0000, 1.8634, 0.5757, 1.0000),
    (50.0000, 2.5000, 0.0000, 50.0000, 3.2592, 0.3350, 1.0000),
    (60.2574, -34.0099, 36.2677, 60.4626, -34.1751, 39.4387, 1.2644),
    (63.0109, -31.0961, -5.8663, 62.8187, -29.7946, -4.0864, 1.2630),
    (61.2901, 3.7196, -5.3901, 61.4292, 2.2480, -4.9620, 1.8731),
    (35.0831, -44.1164, 3.7933, 35.0232, -40.0716, 1.5901, 1.8645),
    (22.7233, 20.0904, -46.6940, 23.0331, 14.9730, -42.5619, 2.0373),
    (36.4612, 47.8580, 18.3852, 36.2715, 50.5065, 21.2231, 1.4146),
    (90.8027, -2.0831, 1.4410, 91.1528, -1.6435, 0.0447, 1.4441),
    (90.9257, -0.5406, -0.9208, 88.6381, -0.8985, -0.7239, 1.5381),
    (6.7747, -0.2908, -2.4247, 5.8714, -0.0985, -2.2286, 0.6377),
    (2.0776, 0.0795, -1.1350, 0.9033, -0.0636, -0.5514, 0.9082),
]


class CIEDE2000Test(unittest.TestCase):
    def test_sharma_reference_pairs(self):
        for L1, a1, b1, L2, a2, b2, expected in SHARMA_PAIRS:
            got = shade.ciede2000((L1, a1, b1), (L2, a2, b2))
            self.assertAlmostEqual(got, expected, places=4, msg=f"pair {(L1, a1, b1)} vs {(L2, a2, b2)}")

    def test_symmetry_and_zero(self):
        lab = shade.hex_to_lab("#C4967A")
        self.assertEqual(shade.ciede2000(lab, lab), 0.0)
        other = shade.hex_to_lab("#8C5A40")
        self.assertAlmostEqual(shade.ciede2000(lab, other), shade.ciede2000(other, lab), places=9)


class ConversionTest(unittest.TestCase):
    def test_white_and_black(self):
        L, a, b = shade.hex_to_lab("#FFFFFF")
        self.assertAlmostEqual(L, 100.0, places=2)
        self.assertAlmostEqual(a, 0.0, places=2)
        self.assertAlmostEqual(b, 0.0, places=2)
        self.assertAlmostEqual(shade.hex_to_lab("#000000")[0], 0.0, places=6)

    def test_round_trip(self):
        for hx in ("#C4967A", "#5A341D", "#E8CCC1", "#990000", "#011F5B"):
            self.assertEqual(shade.rgb_to_hex(shade.lab_to_rgb(shade.hex_to_lab(hx))), hx)

    def test_bad_hex(self):
        with self.assertRaises(ValueError):
            shade.hex_to_rgb("#12345")


class MatchingTest(unittest.TestCase):
    def test_exact_catalogue_colour_matches_itself(self):
        item = shade.catalogue()["products"]["foundation"][10]
        best = shade.match(item["hex"], "foundation", top=1)[0]
        self.assertEqual(best["id"], item["id"])
        self.assertEqual(best["delta_e"], 0.0)

    def test_matches_are_sorted_and_beat_the_median(self):
        target = "#C4967A"
        matches = shade.match(target, top=3)
        self.assertEqual([m["delta_e"] for m in matches], sorted(m["delta_e"] for m in matches))
        stats = shade.catalogue_stats(target)
        self.assertLess(stats["best"], stats["median"])
        self.assertEqual(stats["count"], len(shade.catalogue()["products"]["foundation"]))

    def test_undertone_labels(self):
        self.assertIn(shade.undertone("#C4967A")["depth"], {"light", "medium", "deep"})
        self.assertIn(shade.undertone("#C4967A")["undertone"], {"warm (golden)", "cool (pink)", "neutral"})

    def test_shop_link_only_with_template(self):
        item = {"name": "Sample Base 5N", "search": "foundation neutral"}
        self.assertIsNone(shade.shop_link(item, None))
        self.assertIsNone(shade.shop_link(item, "https://store.test/search"))
        self.assertEqual(shade.shop_link(item, "https://store.test/s?q={q}"),
                         "https://store.test/s?q=foundation+neutral")


if __name__ == "__main__":
    unittest.main()
