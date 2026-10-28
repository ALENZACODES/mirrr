"""Shared objects for one running app, plus the action builders used by both the quote
endpoint and the real endpoints, so the price shown is the price paid."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import Request

from .config import Settings
from .errors import PlumbError
from .provenance import from_cache_source, is_simulation
from .services import procedures, shade
from .services.photos import PhotoStore, StoredPhoto, check_id
from .session_ctx import current_session
from .youcam import payloads
from .youcam.cache import CachedResult, ResultCache
from .youcam.gateway import PhotoRef, YouCamGateway


@dataclass
class AppState:
    settings: Settings
    cache: ResultCache
    photos: PhotoStore
    gateway: YouCamGateway
    sample_sha: str | None = None
    store_search_template: str | None = None
    skin_match: Any = None           # services.skin_match.SkinMatchService, made on first use

    def photo(self, photo_id: str, session: str | None = None) -> StoredPhoto:
        """The shared sample is public. Every other photo is readable only by a browser session
        that added it (R13 security fix); others get the same 404 as a deleted photo."""
        check_id(photo_id)
        if self.sample_sha is not None and photo_id == self.sample_sha:
            return self.photos.get(photo_id)
        return self.photos.get(photo_id, session=current_session() if session is None else session)

    @staticmethod
    def ref(photo: StoredPhoto) -> PhotoRef:
        return PhotoRef(photo.sha, photo.data, photo.content_type)


def get_state(request: Request) -> AppState:
    return request.app.state.plumb


def result_meta(result: CachedResult) -> dict:
    """`source`, `units_spent` and `synthetic` are Plumb's fields and stay for the old screens.
    `provenance` is the BELJOUR model the badge renders from (CONTRACTS.md)."""
    synthetic = bool(result.data.get("_synthetic"))
    prov = from_cache_source(result.source, result.feature, units=result.units, created=result.created,
                             synthetic=synthetic, simulation=is_simulation(result.feature),
                             status=result.status if result.source == "demo" else None)
    # `endpoint` and `lifecycle` repeat the provenance at the top level so a reply cached by an
    # older browser build, or read by an older screen, still names what made it. (Not
    # "status": task replies merge this dict and keep their own task status.)
    return {"source": result.source, "units_spent": result.units if result.source == "live" else 0,
            "synthetic": synthetic, "endpoint": result.endpoint or result.feature,
            "lifecycle": "active",
            "provenance": prov.to_json()}


# Action builders -------------------------------------------------------------
def skin_payload(concerns: list[str] | None) -> dict:
    try:
        return payloads.skin_analysis(concerns or payloads.DEFAULT_SKIN_CONCERNS)
    except ValueError as exc:
        raise PlumbError(422, "bad_request", str(exc)) from exc


def makeup_payload(foundation_id: str | None, lip_id: str | None, blush_id: str | None,
                   intensity: dict[str, int] | None) -> dict:
    cat = shade.catalogue()["products"]
    intensity = intensity or {}
    effects = []

    def find(kind: str, item_id: str) -> dict:
        for item in cat[kind]:
            if item["id"] == item_id:
                return item
        raise PlumbError(404, "unknown_shade", f"No {kind} shade called {item_id}.")

    if foundation_id:
        effects.append(payloads.foundation_effect(find("foundation", foundation_id)["hex"], intensity.get("foundation", 60)))
    if lip_id:
        effects.append(payloads.lip_effect(find("lip", lip_id)["hex"], intensity.get("lip", 70)))
    if blush_id:
        effects.append(payloads.blush_effect(find("blush", blush_id)["hex"], intensity.get("blush", 40)))
    try:
        return payloads.makeup(effects)
    except ValueError as exc:
        raise PlumbError(422, "bad_request", str(exc)) from exc


def surgery_plan(selection: dict[str, float]) -> procedures.Plan:
    try:
        return procedures.build_plan(selection)
    except ValueError as exc:
        raise PlumbError(422, "bad_request", str(exc)) from exc


def simulation_defaults(scores: list[dict]) -> dict[str, float]:
    """The preview the skin screen offers first: up to three lowest measured concerns under
    80, each at half strength. Mirrored in web/src/screens/skin.ts (simulationDefaults)."""
    picks = [s for s in sorted(scores, key=lambda s: s["raw_score"]) if s["raw_score"] < 80][:3]
    out = {}
    for s in picks:
        key = payloads.CONCERN_TO_SIMULATION.get(s["concern"])
        if key:
            out[key] = 0.5
    return out
