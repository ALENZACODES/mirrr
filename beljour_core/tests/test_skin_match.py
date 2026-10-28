"""R13 item 9: YouCam Skin AI to product matching, behind the one adapter.

Mocked provider only: SyntheticYouCam (no network) behind the real gateway, unit policy,
ledger and sessions, or a scripted fake runner for retries and timeouts. No keys, no units.
Pass definition: a repeat costs 0 units and makes no provider call; the session cap, daily
cap and kill switch stop the call before it is made and fall back to the local estimate;
only never-sent failures are retried, a bounded number of times with backoff; the mapping
is deterministic and uses cosmetic wording, generic product types and the "not tested
against real products" label; skin analysis never runs outside the skin-match channel.
Author: John Khan.
"""
from __future__ import annotations

import asyncio
import hashlib
import io
import json
import re
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

import numpy as np
from PIL import Image

from plumb_api.config import Settings, load_settings
from plumb_api.consent import ConsentIn, attestation, require_consent, scope_for
from plumb_api.demo.synthetic import SyntheticYouCam
from plumb_api.errors import BudgetExceeded, PlumbError
from plumb_api.ledger import TaskLedger
from plumb_api.providers.youcam import LEGACY, SKIN, SKIN_CHANNEL, OutOfScope, YouCamProvider, scope_of
from plumb_api.services import skin_match as sm
from plumb_api.session_ctx import reset_session, set_session
from plumb_api.youcam.gateway import PhotoRef
from tests.replay_helpers import gateway_for

SESSION = "skinMatchSessionAAAAA"
DIAGNOSIS_WORDS = re.compile(r"\b(acne|rosacea|melasma|eczema|psoriasis|dermatitis|diagnos\w*|disease|cure\w*|"
                             r"treat\w*|prescri\w*|medical condition)\b", re.I)


def portrait(colour: tuple[int, int, int], size: tuple[int, int] = (160, 200), seed: int = 0) -> np.ndarray:
    """A drawn portrait: flat background, an oval 'face' of one colour with small dark
    'eyes' and a bright 'highlight' that the percentile trim must ignore."""
    w, h = size
    rng = np.random.default_rng(seed)
    img = np.zeros((h, w, 3), np.uint8) + np.array([235, 236, 240], np.uint8)
    yy, xx = np.mgrid[0:h, 0:w]
    face = ((yy - h * 0.48) / (h * 0.36)) ** 2 + ((xx - w * 0.5) / (w * 0.3)) ** 2 <= 1
    noise = rng.integers(-3, 4, size=(h, w, 3))
    img[face] = np.clip(np.array(colour) + noise[face], 0, 255).astype(np.uint8)
    for ex in (0.4, 0.6):
        eye = ((yy - h * 0.42) / (h * 0.025)) ** 2 + ((xx - w * ex) / (w * 0.04)) ** 2 <= 1
        img[eye] = (30, 25, 25)
    shine = ((yy - h * 0.5) / (h * 0.03)) ** 2 + ((xx - w * 0.5) / (w * 0.03)) ** 2 <= 1
    img[shine] = (255, 255, 255)
    return img


def as_photo(rgb: np.ndarray) -> PhotoRef:
    out = io.BytesIO()
    Image.fromarray(rgb).save(out, "JPEG", quality=95)
    data = out.getvalue()
    return PhotoRef(hashlib.sha256(data).hexdigest(), data)


TONES = {  # drawn swatches from very light to very deep, warm and cool
    "light-cool": (238, 206, 200), "light-warm": (236, 204, 170), "medium-warm": (198, 150, 112),
    "tan-warm": (170, 120, 84), "deep-neutral": (112, 74, 58), "very-deep": (64, 42, 34),
}


def display_text(reply: dict) -> str:
    """Everything a person reads: product names, reasons, labels and the message."""
    parts = [reply.get("message") or "", reply.get("label") or "", " ".join(reply.get("focus", []))]
    for item in reply["products"]:
        parts += [item["name"], item["type"], item["why"], item["for"], item["label"]]
    parts += [c["label"] for c in reply["concerns"]]
    parts.append(reply["profile"]["note"])
    return " ".join(parts)


class FakeRunner:
    """Scripted stand-in for the gateway: each call pops the next action."""

    def __init__(self, actions: list) -> None:
        self.actions = list(actions)
        self.calls: list[tuple[str, dict, str | None]] = []

    async def run(self, photo, feature, payload, *, want_image=True, version="v2.0", refs=None,
                  owner=None, channel=None):
        self.calls.append((feature, payload, channel))
        action = self.actions.pop(0)
        if isinstance(action, Exception):
            raise action
        if action == "hang":
            await asyncio.sleep(10)
        return action


def youcam_result(scores: dict[str, float], units: int = 9) -> SimpleNamespace:
    output = [{"type": k, "raw_score": v, "ui_score": int(v)} for k, v in scores.items()]
    return SimpleNamespace(data={"output": output}, units=units, source="live")


class LocalProfileTest(unittest.TestCase):
    def test_depth_follows_lightness_and_never_reports_lighter_than_measured(self):
        order = [b["id"] for b in sm.catalogue()["depth_bands"]]
        last = -1
        for name in ("light-cool", "medium-warm", "tan-warm", "deep-neutral", "very-deep"):
            profile = sm.local_skin_profile(portrait(TONES[name]))
            index = order.index(profile.depth)
            self.assertGreaterEqual(index, last, name)
            last = index
            band = sm.depth_band(profile.lightness)
            self.assertLessEqual(band["min_lightness"], profile.lightness)
        self.assertEqual(sm.local_skin_profile(portrait(TONES["very-deep"])).depth, "very-deep")

    def test_undertone_uses_the_shade_cut_points(self):
        self.assertEqual(sm.undertone_of(20, 5), "cool")      # hue ~14 degrees
        self.assertEqual(sm.undertone_of(10, 14), "neutral")  # ~54 degrees
        self.assertEqual(sm.undertone_of(12, 30), "warm")     # ~68 degrees, a* >= 9
        self.assertEqual(sm.undertone_of(6, 20), "olive")     # warm hue, low a*
        self.assertEqual(sm.local_skin_profile(portrait(TONES["light-cool"])).undertone, "cool")
        self.assertIn(sm.local_skin_profile(portrait(TONES["medium-warm"])).undertone, ("warm", "olive"))

    def test_eyes_and_highlights_do_not_move_the_estimate(self):
        plain = portrait(TONES["tan-warm"])
        busy = plain.copy()
        h, w = busy.shape[:2]
        busy[int(h * .45):int(h * .47), int(w * .35):int(w * .65)] = (255, 255, 255)
        a, b = sm.local_skin_profile(plain), sm.local_skin_profile(busy)
        self.assertAlmostEqual(a.lightness, b.lightness, delta=1.5)
        self.assertEqual(a.depth, b.depth)

    def test_deterministic_and_input_untouched(self):
        img = portrait(TONES["deep-neutral"], seed=4)
        copy = img.copy()
        self.assertEqual(sm.local_skin_profile(img), sm.local_skin_profile(img))
        np.testing.assert_array_equal(img, copy)

    def test_rejects_bad_input(self):
        for bad in (np.zeros((8, 8, 3), np.uint8), np.zeros((40, 40), np.uint8), np.zeros((40, 40, 3), np.float32)):
            with self.subTest(shape=bad.shape, dtype=bad.dtype), self.assertRaises(ValueError):
                sm.local_skin_profile(bad)


class MappingTest(unittest.TestCase):
    SCORES = [{"concern": "redness", "label": "Redness", "raw_score": 55.0, "band": "worth focusing on"},
              {"concern": "dark_circle_v2", "label": "Dark circles", "raw_score": 62.0, "band": "some room to improve"},
              {"concern": "moisture", "label": "Hydration", "raw_score": 70.0, "band": "some room to improve"},
              {"concern": "texture", "label": "Texture", "raw_score": 90.0, "band": "looking good"},
              {"concern": "acne", "label": "Breakouts", "raw_score": 75.0, "band": "some room to improve"}]

    def profile(self, tone: str = "deep-neutral") -> sm.SkinProfile:
        return sm.local_skin_profile(portrait(TONES[tone]))

    def test_same_inputs_same_list(self):
        p = self.profile()
        a = sm.map_products(p, self.SCORES)
        b = sm.map_products(p, list(reversed(self.SCORES)))
        self.assertEqual(json.dumps(a, sort_keys=True), json.dumps(b, sort_keys=True))

    def test_focus_is_three_lowest_under_80(self):
        out = sm.map_products(self.profile(), self.SCORES)
        self.assertEqual(out["focus"], ["Redness", "Dark circles", "Hydration"])
        self.assertNotIn("Texture", " ".join(i["for"] for i in out["products"]))

    def test_base_matches_measured_depth_and_corrector_follows_depth(self):
        deep = sm.map_products(self.profile("very-deep"), self.SCORES)
        light = sm.map_products(self.profile("light-cool"), self.SCORES)
        self.assertTrue(all("very deep" in i["name"] for i in deep["products"][:3]))
        self.assertTrue(all("very light" in i["name"] or "light" in i["name"] for i in light["products"][:3]))
        deep_corrector = next(i for i in deep["products"] if i["id"] == "correct-under-eye")
        light_corrector = next(i for i in light["products"] if i["id"] == "correct-under-eye")
        self.assertIn("red-orange", deep_corrector["name"])
        self.assertNotEqual(deep_corrector["name"], light_corrector["name"])

    def test_every_item_is_labelled_and_generic(self):
        out = sm.map_products(self.profile(), self.SCORES)
        self.assertEqual(out["label"], "not tested against real products")
        brands = re.compile(r"[®™]|\b(maybelline|fenty|mac|l'?or[eé]al|clinique|dior|nars)\b", re.I)
        for item in out["products"]:
            self.assertEqual(item["label"], "not tested against real products")
            self.assertIsNone(brands.search(item["name"]))

    def test_catalogue_wording_is_cosmetic_only(self):
        text = json.dumps({k: v for k, v in sm.catalogue().items() if k != "concerns"})
        for entry in sm.catalogue()["concerns"].values():
            text += " " + entry["label"] + " " + " ".join(p["type"] + " " + p["why"] for p in entry["products"])
        self.assertIsNone(DIAGNOSIS_WORDS.search(text), DIAGNOSIS_WORDS.search(text))


class ScopeTest(unittest.TestCase):
    def test_skin_analysis_only_on_the_skin_match_channel(self):
        self.assertEqual(scope_of("skin-analysis"), "skin")
        self.assertNotIn("skin-analysis", LEGACY)
        self.assertIn("skin-tone-analysis", LEGACY)
        with tempfile.TemporaryDirectory() as tmp:
            p = YouCamProvider(Settings(data_dir=Path(tmp)), None, TaskLedger(Path(tmp) / "l.sqlite3"))
            self.assertFalse(p.allowed("skin-analysis"))
            self.assertTrue(p.allowed("skin-analysis", SKIN_CHANNEL))
            self.assertFalse(p.allowed("skin-analysis", "tasks"))
            self.assertFalse(p.allowed("face-reshape", SKIN_CHANNEL), "the channel opens skin only")
            with self.assertRaises(OutOfScope):
                p.check("skin-analysis")
            off = YouCamProvider(Settings(data_dir=Path(tmp), youcam_skin=False), None, TaskLedger(Path(tmp) / "m.sqlite3"))
            self.assertFalse(off.allowed("skin-analysis", SKIN_CHANNEL))
        self.assertEqual(SKIN, frozenset({"skin-analysis"}))

    def test_skin_flag_reads_from_env(self):
        self.assertFalse(load_settings({"BELJOUR_YOUCAM_SKIN": "0"}).youcam_skin)
        self.assertTrue(load_settings({}).youcam_skin)

    def test_consent_has_its_own_skin_scope(self):
        self.assertEqual(scope_for("skin-match"), "skin")
        good = attestation("a" * 64, "skin-match")
        self.assertEqual(require_consent(ConsentIn(**good), "a" * 64, "skin-match", good["given_at"]), "skin")
        makeup = attestation("a" * 64, "makeup")
        with self.assertRaises(PlumbError) as err:
            require_consent(ConsentIn(**makeup), "a" * 64, "skin-match", makeup["given_at"])
        self.assertEqual(err.exception.code, "consent_scope")


class GatewayFlowTest(unittest.TestCase):
    """The real gateway, unit policy, ledger and session store with a synthetic client."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)
        self.token = set_session(SESSION)
        self.photo = as_photo(portrait(TONES["medium-warm"]))

    def tearDown(self):
        reset_session(self.token)
        self.tmp.cleanup()

    def service(self, **kw):
        fake = SyntheticYouCam()
        gw, _ = gateway_for(self.dir, None, client=fake, **kw)
        return sm.SkinMatchService(gw, backoff_s=0, sleep=lambda s: asyncio.sleep(0)), gw, fake

    def test_first_call_spends_then_a_repeat_costs_nothing(self):
        service, gw, fake = self.service(session_cap_public=40)
        first = asyncio.run(service.match(self.photo))
        self.assertEqual((first["source"], first["units_spent"], first["cached"]), ("youcam", 9, False))
        self.assertEqual(fake.calls, [("skin-analysis", sm.SkinMatchService.payload(None))])
        self.assertEqual(gw.sessions.spent(SESSION), 9)
        self.assertEqual(first["concerns_source"], "YouCam Skin Analysis")
        self.assertEqual(first["profile"]["source"], "Local estimate")
        second = asyncio.run(service.match(self.photo))
        self.assertEqual((second["units_spent"], second["cached"]), (0, True))
        self.assertEqual(len(fake.calls), 1)
        self.assertEqual(gw.sessions.spent(SESSION), 9)
        # A new service (for example after a restart) still finds the gateway's cached result.
        fresh = sm.SkinMatchService(gw)
        third = asyncio.run(fresh.match(self.photo))
        self.assertEqual((third["units_spent"], third["cached"], third["source"]), (0, True, "youcam"))
        self.assertEqual(len(fake.calls), 1)
        self.assertEqual(third["products"], first["products"])

    def test_public_session_cap_falls_back_without_a_call(self):
        service, gw, fake = self.service()            # public cap 6 < 9 units
        reply = asyncio.run(service.match(self.photo))
        self.assertEqual((reply["source"], reply["fallback"], reply["units_spent"]), ("local", "session_cap", 0))
        self.assertIn("local estimate", reply["message"])
        self.assertEqual(fake.calls, [])
        self.assertEqual(gw.sessions.spent(SESSION), 0)
        self.assertEqual(reply["concerns"], [])
        self.assertTrue(reply["products"], "the local estimate still gives base products")

    def test_daily_cap_and_kill_switch_fall_back(self):
        for kw, reason in (({"session_cap_public": 40, "daily_unit_cap": 5}, "daily_cap"),
                           ({"session_cap_public": 40, "kill_switch": True}, "kill_switch")):
            with self.subTest(reason=reason):
                with tempfile.TemporaryDirectory() as tmp:
                    fake = SyntheticYouCam()
                    gw, _ = gateway_for(Path(tmp), None, client=fake, **kw)
                    reply = asyncio.run(sm.SkinMatchService(gw).match(self.photo))
                    self.assertEqual((reply["fallback"], reply["units_spent"]), (reason, 0))
                    self.assertEqual(fake.calls, [])
                    self.assertEqual(gw.policy.book.spent_on(), 0)

    def test_skin_flag_off_and_demo_mode_fall_back(self):
        for kw, reason in (({"session_cap_public": 40, "youcam_skin": False}, "out_of_scope"),
                           ({"session_cap_public": 40, "youcam_api_key": ""}, "not_live")):
            with self.subTest(reason=reason), tempfile.TemporaryDirectory() as tmp:
                fake = SyntheticYouCam()
                gw, _ = gateway_for(Path(tmp), None, client=fake, **kw)
                reply = asyncio.run(sm.SkinMatchService(gw).match(self.photo))
                self.assertEqual((reply["source"], reply["fallback"]), ("local", reason))
                self.assertEqual(fake.calls, [])

    def test_local_only_never_calls(self):
        service, gw, fake = self.service(session_cap_public=40)
        reply = asyncio.run(service.match(self.photo, local_only=True))
        self.assertEqual((reply["source"], reply["fallback"]), ("local", "local_only"))
        self.assertEqual(reply["message"], "You chose a local estimate. Nothing was sent.")
        self.assertEqual(fake.calls, [])

    def test_generic_gateway_call_without_the_channel_is_refused(self):
        _, gw, fake = self.service(session_cap_public=40)
        with self.assertRaises(OutOfScope):
            asyncio.run(gw.run(self.photo, "skin-analysis", sm.SkinMatchService.payload(None), want_image=False))
        self.assertEqual(fake.calls, [])
        self.assertEqual(gw.sessions.spent(SESSION), 0)

    def test_reply_wording_is_cosmetic(self):
        service, _, _ = self.service(session_cap_public=40)
        reply = asyncio.run(service.match(self.photo, concerns=["redness", "moisture", "oiliness", "texture", "acne"]))
        self.assertEqual(reply["source"], "youcam")
        self.assertIsNone(DIAGNOSIS_WORDS.search(display_text(reply)), display_text(reply))
        self.assertEqual(reply["label"], "not tested against real products")

    def test_bad_concerns_and_unreadable_photos_are_clean_errors(self):
        service, _, fake = self.service(session_cap_public=40)
        with self.assertRaises(PlumbError) as err:
            asyncio.run(service.match(self.photo, concerns=["not-a-concern"]))
        self.assertEqual((err.exception.status, err.exception.code), (422, "bad_request"))
        tiny = as_photo(np.zeros((8, 8, 3), np.uint8))
        with self.assertRaises(PlumbError) as err:
            asyncio.run(service.match(tiny))
        self.assertEqual((err.exception.status, err.exception.code), (422, "no_skin_region"))
        self.assertEqual(fake.calls, [])


class RetryTest(unittest.TestCase):
    def setUp(self):
        self.photo = as_photo(portrait(TONES["tan-warm"]))
        self.slept: list[float] = []

    async def sleep(self, seconds: float) -> None:
        self.slept.append(seconds)

    def service(self, actions, **kw):
        runner = FakeRunner(actions)
        return sm.SkinMatchService(runner, sleep=self.sleep, **kw), runner

    def test_never_sent_failures_are_retried_with_backoff(self):
        ok = youcam_result({"redness": 50.0, "moisture": 70.0})
        service, runner = self.service([PlumbError(502, "youcam_not_sent", "x"),
                                        PlumbError(502, "youcam_upload_failed", "x"), ok], backoff_s=0.5)
        reply = asyncio.run(service.match(self.photo))
        self.assertEqual(reply["source"], "youcam")
        self.assertEqual(len(runner.calls), 3)
        self.assertEqual(self.slept, [0.5, 1.0])
        self.assertTrue(all(call[2] == SKIN_CHANNEL for call in runner.calls))

    def test_retries_are_bounded_then_fall_back(self):
        service, runner = self.service([PlumbError(502, "youcam_not_sent", "x")] * 3, backoff_s=0.25)
        reply = asyncio.run(service.match(self.photo))
        self.assertEqual((reply["source"], reply["fallback"]), ("local", "provider_error"))
        self.assertEqual(len(runner.calls), 3)
        self.assertEqual(self.slept, [0.25, 0.5])

    def test_ambiguous_or_charged_failures_are_never_retried(self):
        for code, reason in (("youcam_ambiguous", "provider_error"), ("youcam_error_lighting_dark", "provider_error"),
                             ("task_pending", "pending"), ("youcam_timeout", "timeout")):
            with self.subTest(code=code):
                self.slept.clear()
                service, runner = self.service([PlumbError(502, code, "x")])
                reply = asyncio.run(service.match(self.photo))
                self.assertEqual(reply["fallback"], reason)
                self.assertEqual(len(runner.calls), 1)
                self.assertEqual(self.slept, [])

    def test_budget_refusal_is_not_retried(self):
        service, runner = self.service([BudgetExceeded("x", {"reason": "balance_floor"})])
        reply = asyncio.run(service.match(self.photo))
        self.assertEqual(reply["fallback"], "balance_floor")
        self.assertEqual(len(runner.calls), 1)

    def test_timeout_is_bounded(self):
        service, runner = self.service(["hang"], timeout_s=0.05)
        reply = asyncio.run(asyncio.wait_for(service.match(self.photo), timeout=5))
        self.assertEqual((reply["source"], reply["fallback"]), ("local", "timeout"))
        self.assertEqual(len(runner.calls), 1)

    def test_saved_demo_examples_are_not_a_measurement(self):
        demo = youcam_result({"redness": 40.0})
        demo.source = "demo"
        service, _ = self.service([demo])
        reply = asyncio.run(service.match(self.photo))
        self.assertEqual((reply["source"], reply["concerns"]), ("local", []))

    def test_settings_are_validated(self):
        for kw in ({"retries": 0}, {"retries": 9}, {"backoff_s": -1}, {"timeout_s": 0}, {"timeout_s": float("nan")}):
            with self.subTest(kw=kw), self.assertRaises(ValueError):
                sm.SkinMatchService(FakeRunner([]), **kw)


if __name__ == "__main__":
    unittest.main()
