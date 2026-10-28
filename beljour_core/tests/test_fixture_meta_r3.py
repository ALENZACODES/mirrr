"""R3 fixture meta version 2: explicit endpoint, version, provider and status on every
recorded result, carried through the cache, the provenance badge and the API replies.
Author: John Khan.
"""
import importlib.util
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

os.environ["PLUMB_NO_AUTOCREATE"] = "1"

from fastapi.testclient import TestClient  # noqa: E402

from plumb_api.consent import attestation  # noqa: E402
from plumb_api.config import Settings  # noqa: E402
from plumb_api.demo import fixture_meta  # noqa: E402
from plumb_api.main import create_app  # noqa: E402
from plumb_api.provenance import REPLACED_FEATURES, from_cache_source  # noqa: E402
from plumb_api.state import result_meta  # noqa: E402
from plumb_api.youcam.cache import CachedResult, ResultCache  # noqa: E402

API = Path(__file__).resolve().parent.parent
FIXTURES = API / "plumb_api" / "demo" / "fixtures"


def load_script(path: Path):
    spec = importlib.util.spec_from_file_location(path.stem + "_r3", path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class DescribeTest(unittest.TestCase):
    def test_styling_result_is_active(self):
        self.assertEqual(fixture_meta.describe("makeup-vto"), {
            "meta_version": 2, "endpoint": "makeup-vto", "endpoint_version": "v2.0",
            "provider": "youcam", "status": "active"})

    def test_retired_results_are_refused_by_the_recorder(self):
        for feature in [*REPLACED_FEATURES, ""]:
            with self.subTest(feature=feature), self.assertRaises(ValueError):
                fixture_meta.describe(feature)

    def test_migrate_is_idempotent_and_keeps_data(self):
        old = {"feature": "makeup-vto", "image_sha": "a", "data": {"x": 1}, "units": 1}
        once = fixture_meta.migrate(old)
        self.assertEqual(fixture_meta.migrate(once), once)
        self.assertEqual(once["data"], {"x": 1})
        self.assertEqual(fixture_meta.problems(once), [])
        self.assertTrue(fixture_meta.problems(old))
        wrong = dict(once, provider="local")
        self.assertIn("provider", fixture_meta.problems(wrong)[0])
        stray = dict(fixture_meta.migrate({"feature": "makeup-vto"}), replaced_in="R2")
        self.assertIn("retired fixture metadata is not allowed", fixture_meta.problems(stray))
        self.assertEqual(fixture_meta.problems({}), ["missing feature"])


class CommittedFixturesTest(unittest.TestCase):
    def test_every_fixture_is_version_2(self):
        paths = sorted(FIXTURES.glob("*.json"))
        self.assertEqual(len(paths), 7)
        for path in paths:
            with self.subTest(fixture=path.name):
                self.assertEqual(fixture_meta.problems(json.loads(path.read_text())), [])

    def test_no_clothes_results_remain(self):
        features = {json.loads(p.read_text())["feature"] for p in FIXTURES.glob("*.json")}
        self.assertNotIn("cloth-v4", features)
        self.assertIn("makeup-vto", features)

    def test_migration_script(self):
        script = load_script(API / "scripts" / "migrate_fixture_meta.py")
        self.assertEqual(script.run(FIXTURES, check=True), 0)
        with tempfile.TemporaryDirectory() as tmp:
            stale = Path(tmp) / "k.json"
            stale.write_text(json.dumps({"feature": "makeup-vto", "image_sha": "s", "data": {}}))
            self.assertEqual(script.run(Path(tmp), check=True), 1)
            self.assertEqual(script.run(Path(tmp), check=False), 0)
            self.assertEqual(json.loads(stale.read_text())["status"], "active")
            self.assertEqual(script.run(Path(tmp), check=True), 0)

    def test_fixture_checker_requires_version_2(self):
        checker = load_script(API.parent / "scripts" / "check_fixtures.py")
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "old.json"
            path.write_text(json.dumps({"feature": "makeup-vto", "image_sha": "s", "data": {}}))
            self.assertIn("missing fixture meta", checker.check_fixture(path)[0])
            bad = dict(fixture_meta.migrate({"feature": "makeup-vto", "image_sha": "s", "data": {}}), status="retired")
            path.write_text(json.dumps(bad))
            self.assertTrue(any("cannot have status" in p for p in checker.check_fixture(path)))


class CarriedThroughTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()

    def tearDown(self):
        self.tmp.cleanup()

    def test_cache_reads_and_writes_the_fields(self):
        cache = ResultCache(Path(self.tmp.name) / "d", Path(self.tmp.name) / "fx")
        result = CachedResult("makeup-vto", "sha", {"_synthetic": True}, 0, None, None, 1.0)
        cache.write_fixture("key1", result)
        written = json.loads((Path(self.tmp.name) / "fx" / "key1.json").read_text())
        self.assertEqual((written["meta_version"], written["status"]), (2, "active"))
        back = cache.get_fixture("key1")
        self.assertEqual((back.endpoint, back.status, back.source), ("makeup-vto", "active", "demo"))

    def test_status_cannot_authorize_retired_endpoints(self):
        kept = from_cache_source("demo", "makeup-vto", units=0, created=None, synthetic=False, status="active")
        self.assertEqual((kept.provider, kept.badge), ("youcam", "Recorded API example"))
        for feature, status in (("aging", "active"), ("aging", None), ("makeup-vto", "being_replaced"),
                                ("makeup-vto", "archived")):
            with self.subTest(feature=feature, status=status), self.assertRaises(ValueError):
                from_cache_source("demo", feature, units=0, created=None, synthetic=False, status=status)

    def test_reply_names_endpoint_and_lifecycle(self):
        live = result_meta(CachedResult("makeup-vto", "s", {}, 1, None, None, 1.0, "live"))
        self.assertEqual((live["endpoint"], live["lifecycle"]), ("makeup-vto", "active"))
        with self.assertRaises(ValueError):
            result_meta(CachedResult("aging", "s", {}, 0, None, None, 1.0, "demo", "aging", "being_replaced"))
        local = result_meta(CachedResult("local-age", "s", {}, 0, None, None, 1.0, "local"))
        self.assertEqual((local["endpoint"], local["lifecycle"]), ("local-age", "active"))
        self.assertEqual(local["provenance"]["badge"], "Local simulation")

    def test_routes_send_the_fields_and_keep_task_status(self):
        c = TestClient(create_app(Settings(data_dir=Path(self.tmp.name), fixtures_dir=FIXTURES)))
        pid = c.get("/api/photos/sample").json()["photo_id"]
        local = c.post("/api/skin/analyze", json={"photo_id": pid}).json()
        self.assertEqual((local["endpoint"], local["lifecycle"]), ("local-photo-check", "active"))
        self.assertEqual(local["provenance"]["provider"], "local")
        top = "F08N"
        mk = c.post("/api/makeup/try", json={"photo_id": pid, "foundation_id": top,
                                             "consent": attestation(pid, "makeup")}).json()
        self.assertEqual((mk["endpoint"], mk["lifecycle"]), ("makeup-vto", "active"))
        start = c.post("/api/tasks/start", json={"photo_id": pid, "action": "makeup", "foundation_id": top,
                                                 "consent": attestation(pid, "makeup")}).json()
        task = c.get(f"/api/tasks/{start['request_key']}").json()
        self.assertEqual((task["status"], task["lifecycle"]), ("done", "active"))


if __name__ == "__main__":
    unittest.main()
