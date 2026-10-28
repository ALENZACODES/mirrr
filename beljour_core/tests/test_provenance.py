import unittest

from plumb_api.provenance import BADGES, combine, from_cache_source, is_simulation, local


class ProvenanceTest(unittest.TestCase):
    def test_sources_map_to_three_badges(self):
        live = from_cache_source("live", "makeup-vto", units=1, created=1_700_000_000, synthetic=False)
        self.assertEqual((live.source, live.provider, live.units, live.cache_hit), ("live", "youcam", 1, False))
        self.assertEqual(live.badge, BADGES["live"])
        self.assertEqual(live.endpoint_version, "v2.0")
        self.assertEqual(live.created, "2023-11-14")
        cached = from_cache_source("cache", "makeup-vto", units=1, created=None, synthetic=False)
        self.assertEqual((cached.source, cached.units, cached.cache_hit), ("live", 0, True))
        demo = from_cache_source("demo", "makeup-vto", units=1, created=None, synthetic=False)
        self.assertEqual((demo.source, demo.units, demo.badge), ("recorded", 0, BADGES["recorded"]))
        made = from_cache_source("local", "local-warp", units=0, created=None, synthetic=False)
        self.assertEqual((made.source, made.provider, made.endpoint_version), ("local", "local", None))

    def test_synthetic_says_so(self):
        p = from_cache_source("demo", "makeup-vto", units=12, created=None, synthetic=True)
        self.assertTrue(p.synthetic)
        self.assertEqual(p.badge, BADGES["synthetic"])

    def test_unknown_source_fails(self):
        with self.assertRaises(ValueError):
            from_cache_source("mystery", "x", units=0, created=None, synthetic=False)

    def test_combine_takes_the_most_external_source(self):
        steps = [local("local-warp"), from_cache_source("live", "face-reshape", units=1, created=1.0,
                                                        synthetic=False, simulation=True)]
        c = combine(steps)
        self.assertEqual((c.source, c.units, c.endpoint), ("live", 1, "local-warp+face-reshape"))
        self.assertTrue(c.simulation)
        self.assertFalse(c.cache_hit)
        recorded = combine([from_cache_source("demo", "hair-style", units=1, created=None, synthetic=True),
                            local("local-warp")])
        self.assertEqual((recorded.source, recorded.synthetic, recorded.badge), ("recorded", True, BADGES["synthetic"]))
        only_local = combine([local("local-warp")])
        self.assertEqual(only_local.source, "local")
        with self.assertRaises(ValueError):
            combine([])

    def test_cache_hit_only_when_every_youcam_step_was(self):
        a = from_cache_source("cache", "face-reshape", units=1, created=None, synthetic=False)
        b = from_cache_source("live", "face-lift", units=1, created=None, synthetic=False)
        self.assertFalse(combine([a, b]).cache_hit)
        self.assertTrue(combine([a, a]).cache_hit)

    def test_simulation_features(self):
        self.assertTrue(is_simulation("hair-style"))
        self.assertTrue(is_simulation("face-reshape+face-lift"))
        self.assertFalse(is_simulation("makeup-vto"))
        self.assertFalse(is_simulation("hair-color"))

    def test_json_has_every_field_the_badge_needs(self):
        data = local("resize", simulation=False).to_json()
        for key in ("source", "provider", "endpoint", "pipeline_version", "units", "synthetic", "badge", "simulation"):
            self.assertIn(key, data)


if __name__ == "__main__":
    unittest.main()


def test_old_recorded_skin_has_no_youcam_badge():
    with unittest.TestCase().assertRaises(ValueError):
        from_cache_source("demo", "skin-analysis", units=0, created=None, synthetic=False)
