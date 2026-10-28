"""R13 item 11 (code review fix 10): upload and route hardening.

Pass definition: a decompression bomb or an over-limit header is a 413 and never a 500;
GIF, TIFF, BMP and junk are a 415; ids that are not 64 lowercase hex characters are a 400
on get and delete, before any file access; a photo added by one session gives another
session the same 404 as a deleted photo, for reads and deletes; the sample stays public;
an unhandled ValueError replies with a fixed message that holds no exception text.
The service-level tests run without FastAPI. The HTTP tests need FastAPI and skip cleanly
without it (pytest.importorskip), so they never report a pass they did not run.
Author: John Khan.
"""
from __future__ import annotations

import io
import logging
import os
import struct
import tempfile
import unittest
import zlib
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from plumb_api.config import Settings, load_settings
from plumb_api.errors import BAD_REQUEST_MESSAGE, PlumbError, public_value_error
from plumb_api.services import photos

SESSION_A = "uploadSessionAAAAAAAA"
SESSION_B = "uploadSessionBBBBBBBB"


def encoded(fmt: str, w: int = 640, h: int = 800, seed: int = 1) -> bytes:
    arr = (np.random.default_rng(seed).random((h, w, 3)) * 255).astype(np.uint8)
    out = io.BytesIO()
    Image.fromarray(arr).save(out, fmt)
    return out.getvalue()


def png_header(width: int, height: int) -> bytes:
    """A valid PNG signature and IHDR claiming a huge canvas, with a tiny body. Decoding it
    would need width*height*3 bytes; the header check must refuse it before that."""
    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(b"\x00" * 16)) + chunk(b"IEND", b"")


class NormaliseTest(unittest.TestCase):
    def assert_error(self, raw: bytes, status: int, code: str, **kw) -> PlumbError:
        with self.assertRaises(PlumbError) as err:
            photos.normalise(raw, **kw)
        self.assertEqual((err.exception.status, err.exception.code), (status, code))
        return err.exception

    def test_accepted_formats_are_reencoded_as_jpeg(self):
        for fmt in ("JPEG", "PNG", "WEBP"):
            with self.subTest(fmt=fmt):
                data, w, h = photos.normalise(encoded(fmt))
                self.assertEqual((w, h), (640, 800))
                self.assertEqual(Image.open(io.BytesIO(data)).format, "JPEG")

    def test_other_formats_are_415(self):
        for fmt in ("GIF", "TIFF", "BMP"):
            with self.subTest(fmt=fmt):
                err = self.assert_error(encoded(fmt, 64, 64), 415, "bad_image")
                self.assertIn("JPEG, PNG or WEBP", err.message)
        self.assert_error(b"not an image at all", 415, "bad_image")
        self.assert_error(b"", 415, "bad_image")
        self.assert_error(encoded("PNG")[:120], 415, "bad_image")   # truncated body

    def test_pixel_bomb_header_is_413_before_decoding(self):
        err = self.assert_error(png_header(20000, 20000), 413, "too_many_pixels")
        self.assertIn("24 million", err.message)
        # Above Pillow's own bomb limit too: still our 413, not DecompressionBombError.
        self.assert_error(png_header(60000, 60000), 413, "too_many_pixels")

    def test_limit_is_configurable_and_exact(self):
        raw = encoded("PNG", 100, 100)
        photos.normalise(raw, max_pixels=10_000)
        self.assert_error(raw, 413, "too_many_pixels", max_pixels=9_999)
        with self.assertRaises(ValueError):
            photos.normalise(raw, max_pixels=0)

    def test_settings_carry_the_limit(self):
        self.assertEqual(Settings().max_pixels, 24_000_000)
        self.assertEqual(load_settings({"BELJOUR_MAX_PIXELS": "1000"}).max_pixels, 1000)


class IdTest(unittest.TestCase):
    def test_only_64_lowercase_hex(self):
        good = "ab" * 32
        self.assertEqual(photos.check_id(good), good)
        for bad in ("", "a" * 63, "a" * 65, "AB" * 32, "../" + "a" * 61, "g" * 64, "a" * 63 + "/",
                    "a" * 62 + "\x00a", None, 123):
            with self.subTest(bad=bad), self.assertRaises(PlumbError) as err:
                photos.check_id(bad)  # type: ignore[arg-type]
            self.assertEqual((err.exception.status, err.exception.code), (400, "bad_id"))


class StoreScopeTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.store = photos.PhotoStore(Path(self.tmp.name))

    def tearDown(self):
        self.tmp.cleanup()

    def gone(self, fn, *args, **kw) -> None:
        with self.assertRaises(PlumbError) as err:
            fn(*args, **kw)
        self.assertEqual((err.exception.status, err.exception.code), (404, "photo_gone"))

    def test_get_and_delete_check_the_id_first(self):
        outside = Path(self.tmp.name) / "secret.jpg"
        outside.write_bytes(b"x")
        for fn in (self.store.get, self.store.delete):
            for bad in ("../secret", "..%2Fsecret", "A" * 64):
                with self.subTest(fn=fn.__name__, bad=bad), self.assertRaises(PlumbError) as err:
                    fn(bad)
                self.assertEqual(err.exception.status, 400)
        self.assertTrue(outside.exists())

    def test_other_sessions_get_404_for_read_and_delete(self):
        p = self.store.put(encoded("JPEG"), owner=SESSION_A)
        self.assertEqual(self.store.get(p.sha, session=SESSION_A).data, p.data)
        self.gone(self.store.get, p.sha, session=SESSION_B)
        self.gone(self.store.delete, p.sha, session=SESSION_B)
        self.assertEqual(self.store.get(p.sha, session=SESSION_A).sha, p.sha, "B's delete changed nothing")
        self.assertTrue(self.store.delete(p.sha, session=SESSION_A))
        self.gone(self.store.get, p.sha, session=SESSION_A)
        self.assertFalse((self.store.root / f"{p.sha}.owners").exists())

    def test_same_photo_from_two_sessions_is_kept_until_both_delete(self):
        raw = encoded("JPEG", seed=7)
        a = self.store.put(raw, owner=SESSION_A)
        b = self.store.put(raw, owner=SESSION_B)
        self.assertEqual(a.sha, b.sha)
        self.assertFalse(self.store.delete(a.sha, session=SESSION_A), "B still holds it")
        self.gone(self.store.get, a.sha, session=SESSION_A)
        self.assertEqual(self.store.get(a.sha, session=SESSION_B).sha, a.sha)
        self.assertTrue(self.store.delete(a.sha, session=SESSION_B))

    def test_photos_without_owner_record_fail_closed(self):
        p = self.store.put(encoded("JPEG", seed=3))                      # no owner given
        self.gone(self.store.get, p.sha, session=SESSION_A)
        self.assertEqual(self.store.get(p.sha).sha, p.sha, "internal reads without a session still work")

    def test_anonymous_uploads_cannot_create_a_shared_owner(self):
        with self.assertRaises(PlumbError) as err:
            self.store.put(encoded("JPEG", seed=4), owner="anonymous")
        self.assertEqual((err.exception.status, err.exception.code), (428, "session_required"))
        self.assertEqual(list(self.store.root.iterdir()), [])

    def test_pre_r14_anonymous_owner_files_fail_closed(self):
        p = self.store.put(encoded("JPEG", seed=4))
        (self.store.root / f"{p.sha}.owners").write_text('["anonymous"]')
        for session in ("anonymous", SESSION_A, SESSION_B):
            self.gone(self.store.get, p.sha, session=session)
            self.gone(self.store.delete, p.sha, session=session)
        self.assertEqual(self.store.get(p.sha).sha, p.sha, "internal TTL cleanup may still access stale data")

    def test_purge_removes_owner_records(self):
        p = self.store.put(encoded("JPEG", seed=5), owner=SESSION_A)
        self.assertEqual(self.store.purge_expired(now=10**12), 1)
        self.assertFalse((self.store.root / f"{p.sha}.owners").exists())

    def test_put_rejects_bombs_with_413(self):
        with self.assertRaises(PlumbError) as err:
            self.store.put(png_header(20000, 20000), owner=SESSION_A)
        self.assertEqual(err.exception.status, 413)
        self.assertEqual(list(self.store.root.iterdir()), [])


class ValueErrorTest(unittest.TestCase):
    def test_fixed_message_and_detail_only_in_the_log(self):
        secret = "/srv/data/photos/abc.jpg has shape (3, 4)"
        with self.assertLogs("beljour.test", level=logging.WARNING) as logs:
            body, status = public_value_error(ValueError(secret), logging.getLogger("beljour.test"))
        self.assertEqual(status, 422)
        self.assertEqual(body, {"error": {"code": "bad_request", "message": BAD_REQUEST_MESSAGE}})
        self.assertNotIn("srv", str(body))
        self.assertIn("ValueError", logs.output[0])

    def test_main_uses_the_fixed_handler(self):
        source = (Path(__file__).resolve().parents[1] / "plumb_api" / "main.py").read_text()
        self.assertIn("public_value_error(exc, log)", source)
        self.assertNotIn('"message": str(exc)', source)


class HttpTest(unittest.TestCase):
    """End to end through FastAPI. Skips (never passes) where FastAPI is not installed."""

    def setUp(self):
        pytest.importorskip("fastapi")
        os.environ["PLUMB_NO_AUTOCREATE"] = "1"
        from fastapi.testclient import TestClient

        from plumb_api.main import create_app
        self.tmp = tempfile.TemporaryDirectory()
        fixtures = Path(__file__).resolve().parent.parent / "plumb_api" / "demo" / "fixtures"
        self.c = TestClient(create_app(Settings(data_dir=Path(self.tmp.name), fixtures_dir=fixtures)))

    def tearDown(self):
        self.c.close()
        self.tmp.cleanup()

    def upload(self, raw: bytes, session: str, name: str = "me.jpg"):
        return self.c.post("/api/photos", files={"file": (name, raw, "image/jpeg")},
                           headers={"X-Beljour-Session": session})

    def test_missing_or_invalid_upload_session_stores_nothing(self):
        for headers in ({}, {"X-Beljour-Session": "short"}, {"X-Beljour-Session": "anonymous"}):
            response = self.c.post("/api/photos", files={"file": ("drawn.png", encoded("PNG"), "image/png")}, headers=headers)
            self.assertEqual((response.status_code, response.json()["error"]["code"]), (428, "session_required"))
        from plumb_api.services.photos import PhotoStore
        store = PhotoStore(Path(self.tmp.name))
        stored = list(store.root.glob("*.jpg"))
        self.assertEqual(len(stored), 1, "only the public sample may be installed")

    def test_headerless_clients_cannot_read_delete_or_process_another_upload(self):
        pid = self.upload(encoded("JPEG", seed=30), SESSION_A).json()["photo_id"]
        for response in (self.c.get(f"/api/photos/{pid}.jpg"), self.c.delete(f"/api/photos/{pid}"),
                         self.c.post("/api/skin/analyze", json={"photo_id": pid})):
            self.assertEqual((response.status_code, response.json()["error"]["code"]), (404, "photo_gone"))
        self.assertEqual(self.c.get(f"/api/photos/{pid}.jpg", headers={"X-Beljour-Session": SESSION_A}).status_code, 200)

    def test_bomb_and_format_are_clean_4xx(self):
        r = self.upload(png_header(20000, 20000), SESSION_A, "big.png")
        self.assertEqual((r.status_code, r.json()["error"]["code"]), (413, "too_many_pixels"))
        r = self.upload(encoded("GIF", 64, 64), SESSION_A, "x.gif")
        self.assertEqual((r.status_code, r.json()["error"]["code"]), (415, "bad_image"))

    def test_bad_ids_are_400(self):
        for path in ("/api/photos/" + "a" * 63, "/api/photos/" + "A" * 64):
            with self.subTest(path=path):
                self.assertEqual(self.c.delete(path).status_code, 400)
                self.assertEqual(self.c.get(path + ".jpg").status_code, 400)
        self.assertIn(self.c.delete("/api/photos/..").status_code, (400, 404, 405))

    def test_cross_session_read_and_delete_are_404(self):
        pid = self.upload(encoded("JPEG"), SESSION_A).json()["photo_id"]
        a, b = {"X-Beljour-Session": SESSION_A}, {"X-Beljour-Session": SESSION_B}
        self.assertEqual(self.c.get(f"/api/photos/{pid}.jpg", headers=a).status_code, 200)
        self.assertEqual(self.c.get(f"/api/photos/{pid}.jpg?s={SESSION_A}").status_code, 200)
        self.assertEqual(self.c.get(f"/api/photos/{pid}.jpg", headers=b).status_code, 404)
        self.assertEqual(self.c.get(f"/api/photos/{pid}.jpg").status_code, 404)
        self.assertEqual(self.c.delete(f"/api/photos/{pid}", headers=b).status_code, 404)
        self.assertEqual(self.c.post("/api/quote", json={"photo_id": pid, "action": "makeup"}, headers=b).status_code, 404)
        self.assertTrue(self.c.delete(f"/api/photos/{pid}", headers=a).json()["deleted"])
        self.assertEqual(self.c.get(f"/api/photos/{pid}.jpg", headers=a).status_code, 404)

    def test_sample_stays_public(self):
        sample = self.c.get("/api/photos/sample").json()["photo_id"]
        self.assertEqual(self.c.get(f"/api/photos/{sample}.jpg", headers={"X-Beljour-Session": SESSION_B}).status_code, 200)

    def test_skin_match_needs_skin_consent_unless_local_only(self):
        pid = self.upload(encoded("JPEG"), SESSION_A).json()["photo_id"]
        a = {"X-Beljour-Session": SESSION_A}
        r = self.c.post("/api/skin/match", json={"photo_id": pid}, headers=a)
        self.assertEqual((r.status_code, r.json()["error"]["code"]), (428, "consent_required"))
        r = self.c.post("/api/skin/match", json={"photo_id": pid, "local_only": True}, headers=a)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["fallback"], "local_only")
        self.assertEqual(self.c.post("/api/skin/match", json={"photo_id": pid, "local_only": True},
                                     headers={"X-Beljour-Session": SESSION_B}).status_code, 404)


if __name__ == "__main__":
    unittest.main()
