"""Skin AI to product matching (improve-r12 item 9; decisions.md 2026-10-23 10:21 AM ET).

Flow for one photo:
  1. Local skin profile (always): depth band and undertone from the central face region,
     measured on this server from the photo itself. Labelled "Local estimate".
  2. YouCam skin analysis (optional, through the gateway and the one adapter only): the
     cosmetic concerns. Same photo + same concerns is a cache hit and costs 0 units.
     Unit caps, the daily cap, the balance floor and the kill switch are the gateway's
     (limits.py). Only errors where the task certainly never ran are retried, with
     exponential backoff; an ambiguous create is never retried (ledger.py).
  3. Product types from data/skin_match_catalogue.json: generic types, our own names,
     no brand shades, cosmetic wording only. Every result says "not tested against
     real products".
When units run out, live mode is off, YouCam fails or times out, the reply is the local
estimate with a plain message. The local tone part is behind `local_skin_profile(rgb)` so
the W6 shade engine (engines/shade/) can replace it without touching this flow.

The photo never leaves this module except through the gateway; nothing here is logged
except error codes. Author: John Khan.
"""
from __future__ import annotations

import asyncio
import io
import json
import logging
import math
from collections.abc import Awaitable, Callable, Sequence
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any, Protocol

import numpy as np

from ..engines.core.colour import rgb_to_lab, srgb_encode
from ..errors import BudgetExceeded, NotInDemo, PlumbError
from ..providers.youcam import SKIN_CHANNEL, OutOfScope
from ..youcam import payloads
from . import skin as skin_text

log = logging.getLogger("beljour.skin_match")

CATALOGUE_PATH = Path(__file__).resolve().parent.parent / "data" / "skin_match_catalogue.json"
FEATURE = "skin-analysis"
# Four concerns cost 9 units on the SD tier (youcam/units.py). The public visit cap is 6,
# so a public visit gets the local estimate and a judge-code visit gets the YouCam result.
DEFAULT_CONCERNS: tuple[str, ...] = ("moisture", "oiliness", "redness", "texture")
NOT_TESTED = "not tested against real products"
LOCAL_LABEL = "Local estimate"
YOUCAM_LABEL = "YouCam Skin Analysis"
RETRYABLE = frozenset({"youcam_not_sent", "youcam_upload_failed"})
MAX_ATTEMPTS = 3
BACKOFF_S = 0.5
TIMEOUT_S = 90.0
MAX_FOCUS = 3
MIN_REGION_PIXELS = 64
# "cache" is a stored live result for this photo; "demo" is a saved example, not a measurement.
MEASURED_SOURCES = frozenset({"live", "cache"})

FALLBACK_MESSAGES = {
    "kill_switch": "Live skin analysis is switched off right now. Showing a local estimate from your photo.",
    "session_cap": "This visit has used its share of live units. Showing a local estimate from your photo. A judge code raises the limit.",
    "daily_cap": "Today's live units are used up. Showing a local estimate from your photo.",
    "balance_floor": "The units kept back for judging are protected. Showing a local estimate from your photo.",
    "not_live": "Live skin analysis is off on this server. Showing a local estimate from your photo.",
    "out_of_scope": "Live skin analysis is turned off for this app. Showing a local estimate from your photo.",
    "provider_error": "YouCam could not analyse this photo just now. Showing a local estimate from your photo.",
    "timeout": "YouCam took too long. Showing a local estimate from your photo; try again in a minute.",
    "pending": "An analysis of this photo is still running. Showing a local estimate; try again in a minute.",
    "local_only": "You chose a local estimate. Nothing was sent.",
}


class Runner(Protocol):
    """What this service needs from YouCamGateway (tests pass a fake with the same shape)."""

    async def run(self, photo: Any, feature: str, payload: dict, *, want_image: bool = True,
                  version: str = "v2.0", refs: dict | None = None, owner: str | None = None,
                  channel: str | None = None) -> Any: ...


@lru_cache(maxsize=1)
def catalogue() -> dict:
    data = json.loads(CATALOGUE_PATH.read_text())
    if data.get("format") != "beljour-skin-match-catalogue/1":
        raise ValueError("unsupported skin match catalogue")
    return data


# Local profile ------------------------------------------------------------------------
@dataclass(frozen=True)
class SkinProfile:
    lightness: float
    a: float
    b: float
    hue_angle: float
    chroma: float
    depth: str
    depth_label: str
    undertone: str
    undertone_label: str
    pixels: int
    source: str = LOCAL_LABEL

    def to_json(self) -> dict:
        return {"lightness": round(self.lightness, 1), "a": round(self.a, 1), "b": round(self.b, 1),
                "hue_angle": round(self.hue_angle, 1), "chroma": round(self.chroma, 1),
                "depth": self.depth, "depth_label": self.depth_label, "undertone": self.undertone,
                "undertone_label": self.undertone_label, "pixels": self.pixels, "source": self.source,
                "note": "Measured from the centre of your photo. Lighting and camera white balance move it."}


def depth_band(lightness: float, cat: dict | None = None) -> dict:
    if not math.isfinite(lightness):
        raise ValueError("lightness must be finite")
    for band in (cat or catalogue())["depth_bands"]:
        if lightness >= band["min_lightness"]:
            return band
    return (cat or catalogue())["depth_bands"][-1]


def undertone_of(a: float, b: float) -> str:
    """Same hue-angle cut points as services/shade.py; olive per the catalogue's ASSUMED rule."""
    angle = math.degrees(math.atan2(b, a))
    if angle >= 62:
        return "olive" if a < 9 and b > 13 else "warm"
    if angle <= 48:
        return "cool"
    return "neutral"


def central_region(height: int, width: int) -> np.ndarray:
    """An upright ellipse over the middle of a portrait: cheeks, nose and forehead centre."""
    yy, xx = np.mgrid[0:height, 0:width]
    cy, cx = height * 0.47, width * 0.5
    ry, rx = height * 0.22, width * 0.17
    return ((yy - cy) / ry) ** 2 + ((xx - cx) / rx) ** 2 <= 1.0


def local_skin_profile(rgb: np.ndarray) -> SkinProfile:
    """Deterministic depth and undertone from the photo's central face region.

    Pixels between the 20th and 80th luminance percentile of the region are kept, which
    drops eyes, brows, nostrils and specular highlights without a colour threshold that
    could treat one skin tone differently from another. Averaging is done in linear light.
    """
    data = np.asarray(rgb)
    if data.ndim != 3 or data.shape[2] < 3 or data.dtype != np.uint8:
        raise ValueError("expected a uint8 RGB image")
    h, w = data.shape[:2]
    if min(h, w) < 16:
        raise ValueError("photo too small for a skin estimate")
    region = central_region(h, w)
    pixels = data[..., :3][region].astype(np.float64) / 255.0
    linear = np.where(pixels <= 0.04045, pixels / 12.92, ((pixels + 0.055) / 1.055) ** 2.4)
    luminance = linear @ np.array([0.2126, 0.7152, 0.0722])
    lo, hi = np.percentile(luminance, [20, 80])
    keep = (luminance >= lo) & (luminance <= hi)
    if int(keep.sum()) < MIN_REGION_PIXELS:
        raise ValueError("not enough skin pixels in the centre of the photo")
    mean_linear = linear[keep].mean(axis=0)
    srgb = [srgb_encode(float(min(1.0, max(0.0, v)))) * 255.0 for v in mean_linear]
    lightness, a, b = rgb_to_lab(srgb)
    cat = catalogue()
    band = depth_band(lightness, cat)
    tone = undertone_of(a, b)
    return SkinProfile(lightness, a, b, math.degrees(math.atan2(b, a)), math.hypot(a, b), band["id"],
                       band["label"], tone, cat["undertones"][tone]["label"], int(keep.sum()))


def decode_rgb(data: bytes) -> np.ndarray:
    from PIL import Image
    with Image.open(io.BytesIO(data)) as img:
        return np.asarray(img.convert("RGB"), dtype=np.uint8)


# Mapping -----------------------------------------------------------------------------
def focus_concerns(scores: Sequence[dict], limit: int = MAX_FOCUS) -> list[dict]:
    """Lowest raw scores under 80 first (the same rule as the routine in services/skin.py)."""
    known = catalogue()["concerns"]
    ranked = sorted((s for s in scores if s.get("concern") in known and float(s["raw_score"]) < 80),
                    key=lambda s: (float(s["raw_score"]), s["concern"]))
    return list(ranked[:limit])


def map_products(profile: SkinProfile, scores: Sequence[dict] = ()) -> dict:
    """Deterministic: the same profile and scores always give the same list, in the same order."""
    cat = catalogue()
    tone_word = cat["undertones"][profile.undertone]["base_word"]
    shade = f"{profile.depth_label}, {tone_word}"
    items: list[dict] = []
    for base in cat["base_products"]:
        items.append({"id": f"{base['id']}:{profile.depth}:{profile.undertone}", "type": base["type"],
                      "name": f"{base['type']}, {shade}", "shade": shade, "coverage": base["coverage"],
                      "why": base["why"], "for": "your measured depth and undertone", "label": NOT_TESTED})
    focus = focus_concerns(scores)
    for score in focus:
        entry = cat["concerns"][score["concern"]]
        for product in entry["products"]:
            name = product["type"]
            if product.get("uses") == "corrector":
                name = f"{product['type']}, {cat['corrector_by_depth'][profile.depth]}"
            elif product.get("uses") == "highlighter":
                name = f"{product['type']}, {cat['highlighter_by_depth'][profile.depth]}"
            items.append({"id": product["id"], "type": product["type"], "name": name, "shade": None,
                          "coverage": None, "why": product["why"], "for": entry["label"], "label": NOT_TESTED})
    return {"products": items, "focus": [cat["concerns"][s["concern"]]["label"] for s in focus],
            "label": NOT_TESTED, "catalogue_version": cat["version"]}


# Service -----------------------------------------------------------------------------
Sleep = Callable[[float], Awaitable[None]]


@dataclass
class SkinMatchService:
    gateway: Runner
    retries: int = MAX_ATTEMPTS
    backoff_s: float = BACKOFF_S
    timeout_s: float = TIMEOUT_S
    sleep: Sleep = asyncio.sleep
    _memo: dict[tuple[str, tuple[str, ...], str], dict] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not 1 <= self.retries <= 5:
            raise ValueError("attempts must be 1..5")
        if not (math.isfinite(self.backoff_s) and 0 <= self.backoff_s <= 10):
            raise ValueError("backoff must be 0..10 seconds")
        if not (math.isfinite(self.timeout_s) and 0 < self.timeout_s <= 600):
            raise ValueError("timeout must be in (0, 600] seconds")

    @staticmethod
    def payload(concerns: Sequence[str] | None) -> dict:
        try:
            return payloads.skin_analysis(list(concerns or DEFAULT_CONCERNS))
        except ValueError as exc:
            raise PlumbError(422, "bad_request", str(exc)) from exc

    async def _analyse(self, photo: Any, payload: dict) -> Any:
        """Bounded retries: only refunded never-sent failures go again, after a backoff."""
        last: PlumbError | None = None
        for attempt in range(self.retries):
            try:
                return await asyncio.wait_for(
                    self.gateway.run(photo, FEATURE, payload, want_image=False, channel=SKIN_CHANNEL),
                    timeout=self.timeout_s)
            except PlumbError as exc:
                if exc.code not in RETRYABLE or attempt == self.retries - 1:
                    raise
                last = exc
                await self.sleep(self.backoff_s * (2 ** attempt))
        raise last or PlumbError(502, "youcam_retry", "YouCam could not be reached.")

    def _reply(self, photo_sha: str, profile: SkinProfile, scores: list[dict], source: str,
               fallback: str | None, units: int, cached: bool, extra: dict | None = None) -> dict:
        mapping = map_products(profile, scores)
        return {"photo_id": photo_sha, "profile": profile.to_json(), "concerns": scores,
                "concerns_source": YOUCAM_LABEL if source == "youcam" else None,
                "source": source, "fallback": fallback,
                "message": FALLBACK_MESSAGES.get(fallback or "", None),
                "units_spent": units, "cached": cached, **mapping, **(extra or {})}

    async def match(self, photo: Any, *, concerns: Sequence[str] | None = None,
                    local_only: bool = False) -> dict:
        """`photo` needs .sha and .data (PhotoRef or StoredPhoto)."""
        payload = self.payload(concerns)
        key = (photo.sha, tuple(payload["dst_actions"]), catalogue()["version"])
        if not local_only and key in self._memo:
            return {**self._memo[key], "cached": True, "units_spent": 0}
        try:
            profile = local_skin_profile(decode_rgb(photo.data))
        except (ValueError, OSError) as exc:
            raise PlumbError(422, "no_skin_region", "We couldn't measure skin in the centre of this photo. "
                             "Use a front-facing photo with your face in the middle.") from exc
        if local_only:
            return self._reply(photo.sha, profile, [], "local", "local_only", 0, False)
        reason: str | None = None
        lookup = getattr(self.gateway, "lookup", None)
        hit = lookup(photo.sha, FEATURE, payload) if callable(lookup) else None
        if hit is not None and getattr(hit, "source", "live") in MEASURED_SOURCES:
            reply = self._from_result(photo.sha, profile, hit, units=0, cached=True)
            self._memo[key] = reply
            return reply
        try:
            result = await self._analyse(photo, payload)
        except BudgetExceeded as exc:
            reason = str(exc.detail.get("reason") or "session_cap")
        except NotInDemo:
            reason = "not_live"
        except OutOfScope:
            reason = "out_of_scope"
        except TimeoutError:
            reason = "timeout"
        except PlumbError as exc:
            log.warning("skin match fell back: %s", exc.code)
            reason = "pending" if exc.code in ("task_pending", "check_credit_history") else \
                "timeout" if exc.code == "youcam_timeout" else "provider_error"
        if reason is not None:
            return self._reply(photo.sha, profile, [], "local", reason, 0, False)
        if getattr(result, "source", "live") not in MEASURED_SOURCES:
            # A saved demo example is not a measurement of this visitor's photo.
            return self._reply(photo.sha, profile, [], "local", "not_live", 0, False)
        reply = self._from_result(photo.sha, profile, result, units=int(getattr(result, "units", 0) or 0),
                                  cached=False)
        self._memo[key] = reply
        return reply

    def _from_result(self, photo_sha: str, profile: SkinProfile, result: Any, *, units: int, cached: bool) -> dict:
        parsed = skin_text.parse(result.data)
        scores = [{"concern": s["concern"], "label": s["label"], "raw_score": s["raw_score"], "band": s["band"]}
                  for s in parsed["scores"]]
        return self._reply(photo_sha, profile, scores, "youcam", None, units, cached)
