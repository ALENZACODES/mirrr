import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from plumb_api import pipeline
from plumb_api.state import makeup_payload
from plumb_api.youcam.cache import (
    CachedResult,
    ResultCache,
    cache_key,
    cache_key_v2,
    key_version,
    legacy_key,
)
from plumb_api.youcam.gateway import YouCamGateway

FIXTURES = Path(__file__).resolve().parent.parent / "plumb_api" / "demo" / "fixtures"


class KeyV2Test(unittest.TestCase):
    def k(self, **kw):
        base = dict(image_sha="a" * 64, endpoint="hair-color", endpoint_version="v2.0",
                    params={"color": "#8A3324", "intensity": 80}, ref_shas=None, pipeline_version="2026.10.22-1")
        base.update(kw)
        return cache_key_v2(**base)

    def test_shape(self):
        key = self.k()
        self.assertTrue(key.startswith("k2"))
        self.assertEqual(len(key), 48)
        self.assertTrue(key.isalnum())
        self.assertEqual(key_version(key), 2)
        self.assertEqual(key_version("0" * 40), 1)

    def test_param_order_does_not_matter(self):
        self.assertEqual(self.k(params={"intensity": 80, "color": "#8A3324"}), self.k())

    def test_every_part_changes_the_key(self):
        base = self.k()
        variants = [
            self.k(image_sha="b" * 64),
            self.k(endpoint="hair-style"),
            self.k(endpoint_version="v2.1"),
            self.k(params={"color": "#8A3324", "intensity": 81}),
            self.k(ref_shas={"ref_file_id": "c" * 64}),
            self.k(pipeline_version="2026.10.23-1"),
        ]
        self.assertEqual(len({base, *variants}), 7)

    def test_reference_names_are_sorted(self):
        a = self.k(ref_shas={"a": "1", "b": "2"})
        b = self.k(ref_shas={"b": "2", "a": "1"})
        self.assertEqual(a, b)

    def test_missing_parts_fail(self):
        with self.assertRaises(ValueError):
            self.k(pipeline_version="")
        with self.assertRaises(ValueError):
            self.k(image_sha="")

    def test_legacy_key_matches_plumb_formula(self):
        params = {"garment_category": "upper_body"}
        self.assertEqual(legacy_key("sha", "cloth-v4", params, {"ref_file_id": "g"}),
                         cache_key("sha", "cloth-v4", {**params, "_ref_file_id": "g"}))


class PipelineTest(unittest.TestCase):
    def test_versions(self):
        self.assertTrue(pipeline.valid_version(pipeline.DEFAULT_VERSION))
        self.assertFalse(pipeline.valid_version("v1"))
        for v in pipeline.all_versions().values():
            self.assertTrue(pipeline.valid_version(v))
        self.assertEqual(pipeline.endpoint_version("makeup-vto"), "v2.0")

    def test_bumping_a_pipeline_version_misses_the_old_result(self):
        k_before, _ = YouCamGateway.keys("sha", "hair-color", {"color": "#000000"})
        pipeline.PIPELINE_VERSIONS["hair-color"] = "2099.01.01-1"
        try:
            k_after, _ = YouCamGateway.keys("sha", "hair-color", {"color": "#000000"})
        finally:
            del pipeline.PIPELINE_VERSIONS["hair-color"]
        self.assertNotEqual(k_before, k_after)


class LookupTest(unittest.TestCase):
    def test_get_first_falls_back_to_v1_fixture(self):
        with tempfile.TemporaryDirectory() as tmp:
            fixtures = Path(tmp) / "fx"
            cache = ResultCache(Path(tmp) / "data", fixtures)
            v1 = cache_key("sha", "makeup-vto", {"a": 1})
            cache.write_fixture(v1, CachedResult("makeup-vto", "sha", {"x": 1}, 1, b"IMG", "image/jpeg", 1.0, "live"))
            v2 = cache_key_v2("sha", "makeup-vto", "v2.0", {"a": 1}, None, "2026.10.22-1")
            key, hit = cache.get_first([v2, v1])
            self.assertEqual((key, hit.source, hit.image), (v1, "demo", b"IMG"))
            cache.put(v2, CachedResult("makeup-vto", "sha", {"x": 2}, 1, None, None, 0, "live"))
            key, hit = cache.get_first([v2, v1])
            self.assertEqual((key, hit.data["x"], hit.source), (v2, 2, "cache"))
            self.assertIsNone(cache.get_first(["nope"]))

    def test_committed_demo_fixtures_are_still_found(self):
        """The Plumb demo set uses v1 keys; the v2 gateway must still serve them for free."""
        sample = (FIXTURES / "sample.jpg").read_bytes()
        sha = hashlib.sha256(sample).hexdigest()
        with tempfile.TemporaryDirectory() as tmp:
            cache = ResultCache(Path(tmp), FIXTURES)
            gw = type("G", (), {"cache": cache, "keys": staticmethod(YouCamGateway.keys)})()
            hit = YouCamGateway.lookup(gw, sha, "makeup-vto", makeup_payload("F08N", None, None, None))  # type: ignore[arg-type]
        self.assertIsNotNone(hit)
        self.assertEqual(hit.source, "demo")

    def test_every_fixture_json_is_readable(self):
        for path in FIXTURES.glob("*.json"):
            data = json.loads(path.read_text())
            self.assertIn("feature", data, path.name)


if __name__ == "__main__":
    unittest.main()
