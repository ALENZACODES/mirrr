import asyncio
import json
import unittest

import httpx

from plumb_api.youcam.client import RateLimiter, YouCamClient, YouCamError, _extract_credit, find_result_image_url


class FakeYouCam:
    """Mimics the documented reply shapes of the YouCam S2S v2 API."""

    def __init__(self, polls_before_success: int = 2, fail_with: str | None = None):
        self.polls_left = polls_before_success
        self.fail_with = fail_with
        self.log: list[str] = []
        self.uploaded: bytes | None = None
        self.deleted: list[str] = []
        self.task_body: dict | None = None

    def __call__(self, request: httpx.Request) -> httpx.Response:
        path, method = request.url.path, request.method
        self.log.append(f"{method} {request.url.host}{path}")
        if request.url.host == "storage.test":
            self.uploaded = request.content
            return httpx.Response(200)
        if request.url.host == "results.test":
            return httpx.Response(200, content=b"JPEGDATA", headers={"content-type": "image/jpeg"})
        assert request.headers["Authorization"] == "Bearer k123"
        if path == "/s2s/v2.0/file":
            body = json.loads(request.content)
            f = body["files"][0]
            return httpx.Response(200, json={"status": 200, "data": {"files": [{
                **f, "file_id": "FILE1",
                "requests": [{"method": "PUT", "url": "https://storage.test/up",
                              "headers": {"Content-Type": f["content_type"]}}]}]}})
        if path == "/s2s/v2.0/task/makeup-vto" and method == "POST":
            self.task_body = json.loads(request.content)
            return httpx.Response(200, json={"status": 200, "data": {"task_id": "T1"}})
        if path == "/s2s/v2.0/task/makeup-vto/T1":
            if self.polls_left > 0:
                self.polls_left -= 1
                return httpx.Response(200, json={"status": 200, "data": {"task_status": "running"}})
            if self.fail_with:
                return httpx.Response(200, json={"status": 200, "data": {"task_status": "error", "error": self.fail_with}})
            return httpx.Response(200, json={"status": 200, "data": {"task_status": "success",
                                                                     "results": {"url": "https://results.test/r.jpg"}}})
        if path == "/s2s/v2.0/task/delete":
            self.deleted.append(json.loads(request.content)["task_id"])
            return httpx.Response(200, json={"status": 200, "data": {}})
        if path == "/s2s/v2.0/task/bad-feature":
            return httpx.Response(400, json={"status": 400, "error": "Not available dst_action abc", "error_code": "InvalidParameters"})
        return httpx.Response(404, json={"status": 404, "error": "not found"})


def make_client(fake: FakeYouCam, timeout: float = 60.0) -> tuple[YouCamClient, list[float]]:
    sleeps: list[float] = []
    clock = [0.0]

    async def fake_sleep(s: float) -> None:
        sleeps.append(s)
        clock[0] += s

    http = httpx.AsyncClient(transport=httpx.MockTransport(fake))
    client = YouCamClient("k123", "https://api.test", http, poll_interval_s=3.0, poll_timeout_s=timeout,
                          sleep=fake_sleep, clock=lambda: clock[0])
    return client, sleeps


class ClientFlowTest(unittest.TestCase):
    def test_full_run_uploads_polls_downloads_and_deletes(self):
        fake = FakeYouCam(polls_before_success=2)
        client, sleeps = make_client(fake)
        out = asyncio.run(client.run("makeup-vto", b"IMG", "image/jpeg", {"effects": []}))
        self.assertEqual(out.image, b"JPEGDATA")
        self.assertEqual(fake.uploaded, b"IMG")
        self.assertEqual(fake.task_body["src_file_id"], "FILE1")
        self.assertEqual(fake.deleted, ["T1"])
        self.assertEqual(sleeps, [3.0, 4.5])  # backs off between polls

    def test_task_error_raises_and_is_not_retried(self):
        fake = FakeYouCam(polls_before_success=0, fail_with="error_src_face_too_small")
        client, _ = make_client(fake)
        with self.assertRaises(YouCamError) as ctx:
            asyncio.run(client.run("makeup-vto", b"IMG", "image/jpeg", {}))
        self.assertEqual(ctx.exception.code, "error_src_face_too_small")

    def test_api_error_shape(self):
        client, _ = make_client(FakeYouCam())
        with self.assertRaises(YouCamError) as ctx:
            asyncio.run(client.create_task("bad-feature", {}))
        self.assertEqual(ctx.exception.code, "InvalidParameters")

    def test_timeout_keeps_polling_in_background(self):
        fake = FakeYouCam(polls_before_success=50)

        async def go():
            client, _ = make_client(fake, timeout=5.0)
            with self.assertRaises(YouCamError):
                await client.run("makeup-vto", b"IMG", "image/jpeg", {})
            self.assertEqual(len(client.background), 1)
            await asyncio.gather(*client.background)
            return fake.deleted

        self.assertEqual(asyncio.run(go()), ["T1"])


class HelpersTest(unittest.TestCase):
    def test_find_result_image_url(self):
        self.assertEqual(find_result_image_url({"url": "u"}), "u")
        self.assertEqual(find_result_image_url([{"download_url": "d"}]), "d")
        self.assertIsNone(find_result_image_url({"output": []}))

    def test_extract_credit_rejects_unknown_shapes(self):
        self.assertIsNone(_extract_credit({"credit": 870}))
        self.assertIsNone(_extract_credit([{"amount": 500}]))
        self.assertEqual(_extract_credit({"results": [{"amount": 500}, {"amount_dec": 370.4}]}), 870)

    def test_rate_limiter_waits_when_full(self):
        clock = [0.0]
        waits = []

        async def sleep(s):
            waits.append(s)
            clock[0] += s

        async def go():
            rl = RateLimiter(max_calls=2, window_s=10, clock=lambda: clock[0], sleep=sleep)
            for _ in range(3):
                await rl.acquire()

        asyncio.run(go())
        self.assertEqual(len(waits), 1)
        self.assertGreaterEqual(clock[0], 10)


if __name__ == "__main__":
    unittest.main()
