"""Record a run against a fake YouCam that uses real looking ids and signed URLs, check the
cassette is redacted, then replay it through the real client and get the same result."""
import asyncio
import json
import tempfile
import unittest
from pathlib import Path

import httpx

from plumb_api.providers.replay import (
    FORMAT,
    Cassette,
    RecordingTransport,
    Redactor,
    ReplayMiss,
    find_secrets,
    replay_client,
)
from plumb_api.youcam.client import YouCamClient

KEY = "live-key-ABCDEFGHIJKLMNOP"
SIGNED_UP = "https://s3.example-storage.com/up/abc?X-Amz-Signature=deadbeef&X-Amz-Expires=600"  # gitleaks:allow (made up)
SIGNED_DOWN = "https://cdn.example-results.com/out/r.jpg?Expires=99&Signature=cafe"  # gitleaks:allow (made up)
IMAGE = b"\xff\xd8JPEGRESULT"


def real_handler(request: httpx.Request) -> httpx.Response:
    url = str(request.url)
    if url == SIGNED_UP:
        return httpx.Response(200)
    if url == SIGNED_DOWN:
        return httpx.Response(200, content=IMAGE, headers={"content-type": "image/jpeg"})
    assert request.headers["Authorization"] == f"Bearer {KEY}"
    path = request.url.path
    if path == "/s2s/v2.0/file":
        return httpx.Response(200, json={"status": 200, "data": {"files": [{
            "file_id": "REALFILE123", "requests": [{"method": "PUT", "url": SIGNED_UP, "headers": {"Content-Type": "image/jpeg"}}]}]}})
    if path == "/s2s/v2.0/task/hair-color" and request.method == "POST":
        body = json.loads(request.content)
        assert body["src_file_id"] == "REALFILE123"
        return httpx.Response(200, json={"status": 200, "data": {"task_id": "REALTASK999"}})
    if path == "/s2s/v2.0/task/hair-color/REALTASK999":
        return httpx.Response(200, json={"status": 200, "data": {"task_status": "success",
                                                                 "results": {"url": SIGNED_DOWN}}})
    if path == "/s2s/v2.0/task/delete":
        assert json.loads(request.content)["task_id"] == "REALTASK999"
        return httpx.Response(200, json={"status": 200, "data": {}})
    return httpx.Response(404, json={"status": 404, "error": "not found"})


async def _no_sleep(_s: float) -> None:
    return None


class RecordReplayTest(unittest.TestCase):
    def record(self) -> Cassette:
        recorder = RecordingTransport(httpx.MockTransport(real_handler), "hair_test", secrets=(KEY,))
        client = YouCamClient(KEY, "https://yce.example-api.com", httpx.AsyncClient(transport=recorder),
                              poll_interval_s=0, sleep=_no_sleep)
        out = asyncio.run(client.run("hair-color", b"PHOTO", "image/jpeg", {"color": "#8A3324"}))
        self.assertEqual(out.image, IMAGE)
        return recorder.cassette

    def test_recording_is_redacted(self):
        cassette = self.record()
        text = json.dumps(cassette.to_json())
        self.assertNotIn(KEY, text)
        self.assertNotIn("X-Amz-Signature", text)
        self.assertNotIn("Signature=", text)
        self.assertNotIn("REALFILE123", text)
        self.assertNotIn("REALTASK999", text)
        self.assertEqual(find_secrets(text, (KEY,)), [])
        hosts = [i.host for i in cassette.interactions]
        self.assertEqual(hosts, ["api", "storage", "api", "api", "results", "api"])
        create = cassette.interactions[2]
        self.assertEqual(create.request_json["src_file_id"], "file-1")
        self.assertEqual(cassette.interactions[3].path, "/s2s/v2.0/task/hair-color/task-1")
        self.assertEqual(len(cassette.blobs), 1)

    def test_saved_recording_replays_through_the_real_client(self):
        cassette = self.record()
        with tempfile.TemporaryDirectory() as tmp:
            path = cassette.save(Path(tmp) / "hair_test.json")
            loaded = Cassette.load(path)
            self.assertFalse(loaded.synthetic)
            client, transport = replay_client(loaded)
            out = asyncio.run(client.run("hair-color", b"OTHER PHOTO", "image/jpeg", {"color": "#8A3324"}))
        self.assertEqual(out.image, IMAGE)
        self.assertEqual(out.task_id, "task-1")
        self.assertEqual(transport.unused(), [])

    def test_unrecorded_request_is_an_error_not_a_network_call(self):
        client, _ = replay_client(Cassette("empty", []))
        with self.assertRaises(ReplayMiss):
            asyncio.run(client.create_task("makeup-vto", {}))

    def test_wrong_format_is_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "x.json"
            path.write_text(json.dumps({"format": "other", "name": "x", "interactions": []}))
            with self.assertRaises(ValueError):
                Cassette.load(path)
            path.write_text(json.dumps({"format": FORMAT, "name": "x", "interactions": []}))
            self.assertEqual(Cassette.load(path).interactions, [])

    def test_missing_blob_is_reported(self):
        c = Cassette("c", [], root=Path("/nonexistent"))
        with self.assertRaises(ReplayMiss):
            c.blob("nope.jpg")


class RedactorTest(unittest.TestCase):
    def test_ids_and_urls_map_consistently(self):
        red = Redactor(("sekrit",))
        out = red.walk({"task_id": "T1", "nested": {"task_id": "T1", "src_file_id": "F1"},
                        "results": {"url": "https://x/y.jpg?sig=1"}, "headers": {"Authorization": "x"},
                        "note": "key sekrit inside"})
        self.assertEqual(out["task_id"], "task-1")
        self.assertEqual(out["nested"], {"task_id": "task-1", "src_file_id": "file-1"})
        self.assertEqual(out["results"]["url"], "https://results.replay/1")
        self.assertNotIn("headers", out)
        self.assertEqual(out["note"], "key [redacted] inside")
        self.assertEqual(red.text("/task/T1"), "/task/task-1")

    def test_find_secrets(self):
        self.assertEqual(find_secrets('{"h": "Bearer abcdefghijkl"}'), ["bearer token"])
        self.assertEqual(find_secrets('"https://a/b?X-Amz-Signature=1"'), ["signed url"])  # gitleaks:allow
        self.assertEqual(find_secrets('{"k": "my-key"}', ("my-key",)), ["api key"])


if __name__ == "__main__":
    unittest.main()
