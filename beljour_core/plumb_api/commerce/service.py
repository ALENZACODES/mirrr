"""Orchestrator: W6 local colour class + existing consented Skin AI + makeup VTO.

The one and only provider path remains services/skin_match.py -> YouCamGateway and
YouCamGateway -> providers/youcam.py. On disable or budget failure the same session
keeps working, without network calls to the provider.
Author: John Khan.
"""
from __future__ import annotations

import logging
from collections.abc import Sequence
from typing import Any

from ..errors import BudgetExceeded, NotInDemo, PlumbError
from ..providers.youcam import OutOfScope
from ..services import imaging
from ..services.skin_match import SkinMatchService, decode_rgb, local_skin_profile
from ..state import AppState
from ..youcam import payloads
from .catalogue import Product, require_product, source
from .evidence import Origin, build_evidence, parse_signals
from .identity import IdentityGuard, guard_public_preview
from .look_plan import LookPlan, LookPreview, local_look_preview, validate_provider_preview
from .preview import public_preview
from .preview_cache import ProviderImage, ProviderImageCache
from .preview_levels import relevel_provider_image
from .ranking import Profile, alternatives, concerns_from_skin, from_skin_profile, rank
from .shortlist import Goal, ShortlistOptions, shortlist
from .strength import DEFAULT_LOCK, from_legacy

log = logging.getLogger("beljour.commerce")
# Only VTO image results are used for product previews. The provider adapter is not
# duplicated; its cache and unit-limit semantics are respected on every live call.
RETRY_WITH_LOCAL = (BudgetExceeded, NotInDemo, OutOfScope)
CONCERN_ALIASES = {"wrinkle": "wrinkles", "age_spot": "spots", "dark_circle_v2": "dark_circle", "pore": "pore"}


class CommerceService:
    def __init__(self, state: AppState):
        self.state = state
        # The same app-wide Skin AI service owns its result memo. No parallel analysis.
        if state.skin_match is None:
            state.skin_match = SkinMatchService(state.gateway)
        self.skin_match: SkinMatchService = state.skin_match
        # A cache shared across request-scoped services, owned by this AppState.
        # Never access on feature-flag-off requests: no live result is shown then.
        existing: object = getattr(state, "_lane_f_provider_cache", None)
        if not isinstance(existing, ProviderImageCache):
            existing = ProviderImageCache()
            state.__dict__["_lane_f_provider_cache"] = existing
        self.preview_cache: ProviderImageCache = existing

    def live_enabled(self) -> bool:
        settings = self.state.settings
        return bool(settings.live and settings.youcam_styling and not settings.kill_switch)

    async def recommendations(self, photo: Any, *, local_only: bool,
                              concerns: Sequence[str] | None, finish: str,
                              profile_override: Profile | None = None,
                              sample_budget_cents: int = 6000,
                              match_goal: Goal = "balanced") -> dict[str, Any]:
        if finish not in source()["finishes"]:
            raise PlumbError(422, "finish", "Choose a listed sample finish.")
        # Turning the provider flag off must take precedence over any cached live data.
        local = local_only or not self.live_enabled() or not self.state.settings.youcam_skin
        if profile_override is not None:
            # The manual profile path never calls Skin AI; the user selected the tone.
            from .ranking import verify_profile
            try:
                verify_profile(profile_override)
            except ValueError as exc:
                raise PlumbError(422, "profile", "Choose a depth from one to ten and a listed undertone.") from exc
            match = {
                "source": "manual",
                "concerns": [],
                "message": "You set your shade details; no photo was analysed.",
                "units_spent": 0,
                "cached": False,
                "fallback": "manual",
            }
            profile = profile_override
        else:
            match = await self.skin_match.match(self.state.ref(photo), concerns=concerns, local_only=local)
            profile = from_skin_profile(local_skin_profile(decode_rgb(photo.data)))
        raw_scores = match.get("concerns", [])
        # Provider content is untrusted: keep only bounded, correctly shaped scores.
        mapped: list[dict[str, Any]] = []
        if isinstance(raw_scores, list):
            for item in raw_scores[:32]:
                if not isinstance(item, dict):
                    continue
                name = item.get("concern")
                if not isinstance(name, str) or not name:
                    continue
                mapped.append({**item, "concern": CONCERN_ALIASES.get(name, name)})
        # R19: canonicalize untrusted provider observations before they can rank
        # fictional products; keep a public-only explanation proof alongside the
        # ranked list. No raw pixels or provider-written product copy are retained.
        # Validate untrusted provenance explicitly; never reinterpret an unknown
        # provider source as a local result with misleading zero-call accounting.
        raw_origin: object = match.get("source")
        origin: Origin
        if raw_origin == "youcam":
            origin = "youcam"
        elif raw_origin == "manual":
            origin = "manual"
        elif raw_origin == "local":
            origin = "local"
        else:
            raise PlumbError(502, "source", "Skin analysis returned unsupported provenance.")
        raw_units: object = match.get("units_spent", 0)
        if not isinstance(raw_units, int) or isinstance(raw_units, bool):
            raise PlumbError(502, "units", "Skin analysis returned invalid provider usage.")
        if not 0 <= raw_units <= 1000:
            raise PlumbError(502, "units", "Skin analysis returned invalid provider usage.")
        units: int = raw_units
        signals = parse_signals(mapped if origin == "youcam" else [], source=origin)
        cosmetic = concerns_from_skin(signals.observations_for_rank())
        items = rank(profile, cosmetic, finish=finish)
        # A consumer can compare price/try-on tradeoffs without altering the
        # provider rank or ever accepting vendor-supplied catalogue metadata.
        shopping = shortlist(items, ShortlistOptions(budget_cents=sample_budget_cents,
                            goal=match_goal))
        evidence = build_evidence(origin, profile.to_json(), signals.observations_for_rank(), items,
                                  units=units,
                                  cached=bool(match.get("cached", False)),
                                  local_fallback=local)
        return {"catalogue_version": source()["version"], "source": match["source"],
                "fallback": match.get("fallback"), "message": match.get("message"),
                "units_spent": match.get("units_spent", 0), "cached": match.get("cached", False),
                "profile": profile.to_json(), "cosmetic_concerns": cosmetic,
                "skin_analysis_provenance": (
                    "YouCam Skin AI via existing adapter" if match["source"] == "youcam" else None
                ),
                "recommendations": items, "matches": len(items),
                "shopping_shortlist": shopping.public(),
                "evidence": evidence.public(),
                "note": source()["note"], "simulated": True}

    @staticmethod
    def _payload(product: Product, strength: int) -> dict[str, Any]:
        if not product.vto:
            raise PlumbError(
                422, "no_visual_try_on", "This item has no visual try-on; add it to your sample bag instead."
            )
        try:
            if product.vto == "foundation":
                effect = payloads.foundation_effect(product.swatch, intensity=strength)
            elif product.vto == "lip":
                effect = payloads.lip_effect(product.swatch, intensity=strength, texture="satin")
            elif product.vto == "blush":
                effect = payloads.blush_effect(product.swatch, intensity=strength)
            else:
                raise ValueError("unsupported VTO")
            return payloads.makeup([effect])
        except ValueError as exc:
            raise PlumbError(422, "vto", "That sample colour cannot be previewed.") from exc

    async def try_on(
        self,
        photo: Any,
        sku: str,
        *,
        local_only: bool,
        strength: int,
        lock_level: float = DEFAULT_LOCK,
        guard: IdentityGuard | None = None,
    ) -> dict[str, Any]:
        """Guard every rendered result; one fixed provider task for all levels."""
        product = require_product(sku)
        if not product.vto:
            raise PlumbError(422, "no_visual_try_on", "This sample item has no visual try-on.")
        try:
            level = from_legacy(strength)
        except ValueError as exc:
            raise PlumbError(422, "strength", "Choose strength between zero and one hundred.") from exc
        if local_only or not self.live_enabled():
            local = public_preview(photo.data, product, strength)
            checked = guard_public_preview(photo.data, local, guard=guard, lock_level=lock_level)
            return {**checked, "strength_level": level}
        # The remote intensity does NOT depend on the slider: one fixed preview,
        # then local interpolation. This bounds provider usage for level changes.
        payload = self._payload(product, 100)
        key = self.preview_cache.key(photo.sha, sku, payload)
        stored = self.preview_cache.get(key)
        reason = "provider_error"
        used_units = 0
        if stored is None:
            try:
                result = await self.state.gateway.run(self.state.ref(photo), "makeup-vto", payload)
                if result.image and result.source in ("live", "cache"):
                    stored = ProviderImage(result.image, result.image_type or "image/jpeg")
                    self.preview_cache.put(key, stored)
                    if result.source == "live":
                        used_units = result.units
                else:
                    reason = "result_unavailable"
            except BudgetExceeded as exc:
                reason = str(exc.detail.get("reason") or "unit_budget")
            except NotInDemo:
                reason = "not_live"
            except OutOfScope:
                reason = "out_of_scope"
            except PlumbError as exc:
                log.warning("commerce VTO fallback: %s", exc.code)
                reason = (
                    "provider_pending" if exc.code in ("task_pending", "check_credit_history") else "provider_error"
                )
        if stored is not None:
            try:
                adjusted = relevel_provider_image(photo.data, stored.image, level, image_type=stored.mime)
                remote = {
                    "image": imaging.data_url(adjusted, stored.mime),
                    "image_type": stored.mime,
                    "source": "youcam",
                    "simulation": True,
                    "provider_calls": 1 if used_units else 0,
                    "units_spent": used_units,
                    "cached": used_units == 0,
                    "product": product.to_json(),
                    "label": "YouCam makeup VTO simulation",
                    "notice": "Locally adjusted from one cached provider simulation; no physical product claim.",
                }
                checked = guard_public_preview(photo.data, remote, guard=guard, lock_level=lock_level)
                return {**checked, "strength_level": level}
            except (ValueError, OSError):
                reason = "unsupported_preview"
        local = public_preview(photo.data, product, strength)
        local["fallback"] = reason
        local["notice"] = f"Live try-on unavailable ({reason}); approximate local simulation shown instead."
        checked = guard_public_preview(photo.data, local, guard=guard, lock_level=lock_level)
        return {**checked, "strength_level": level}

    async def try_on_look(
        self, photo: Any, plan: LookPlan, *, local_only: bool,
        lock_level: float = DEFAULT_LOCK, guard: IdentityGuard | None = None,
    ) -> dict[str, Any]:
        """R19: one consented provider task for a 1–3 item invented makeup look.

        Routes validate user intent and consent before this method sees the photo.
        No new provider client exists: even composite looks use the existing
        `self.state.gateway` with the same unit ledger, cache and kill switch.
        """
        if local_only or not self.live_enabled():
            return guard_public_preview(
                photo.data, local_look_preview(photo.data, plan).public(plan),
                guard=guard, lock_level=lock_level,
            )
        effects: list[dict[str, Any]] = []
        for step in plan.steps:
            product = step.product
            try:
                if product.vto == "foundation":
                    effects.append(payloads.foundation_effect(product.swatch, intensity=step.strength))
                elif product.vto == "lip":
                    effects.append(payloads.lip_effect(product.swatch, intensity=step.strength, texture="satin"))
                elif product.vto == "blush":
                    effects.append(payloads.blush_effect(product.swatch, intensity=step.strength))
                else:
                    raise ValueError("unknown makeup effect")
            except ValueError as exc:
                raise PlumbError(422, "look_effect", "Choose sample effects from the fictional catalogue.") from exc
        try:
            # One combined makeup task; never three separately billed requests.
            result = await self.state.gateway.run(self.state.ref(photo), "makeup-vto", payloads.makeup(effects))
            if result.image and result.source in ("live", "cache"):
                mime = result.image_type or "image/jpeg"
                if mime not in ("image/jpeg", "image/png", "image/webp"):
                    raise ValueError("unknown image encoding")
                preview: LookPreview = validate_provider_preview(result.image, plan,
                                     cached=result.source == "cache",
                                     units=result.units if result.source == "live" else 0)
                from dataclasses import replace
                return guard_public_preview(
                    photo.data, replace(preview, image_type=mime).public(plan),
                    guard=guard, lock_level=lock_level,
                )
            fallback = "result_unavailable"
        except BudgetExceeded as exc:
            fallback = str(exc.detail.get("reason") or "unit_budget")
        except NotInDemo:
            fallback = "provider_disabled"
        except OutOfScope:
            fallback = "out_of_scope"
        except (PlumbError, ValueError) as exc:
            fallback = "provider_error"
            # Error types only: never log original/processed images or a raw result.
            log.warning("commerce multi-look fallback: %s", type(exc).__name__)
        local = local_look_preview(photo.data, plan).public(plan) | {
            "fallback": fallback,
            "notice": "Provider look unavailable; approximate local simulation shown.",
        }
        return guard_public_preview(photo.data, local, guard=guard, lock_level=lock_level)

    def shades(self, sku: str, profile: Profile) -> dict[str, Any]:
        return {"requested": require_product(sku).to_json(), "alternatives": alternatives(sku, profile),
                "note": "Sample shades are invented. Nearby options are not validated against real products."}
