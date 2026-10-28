"""Consent attestation for styling routes (plan N22: consent required before any YouCam call).

The browser's consent gate (web/src/ui/shell/consent.ts) only lets a styling request through
after visit consent (adult, understood) and a photo consent the person ticked for that photo
and scope. With the request it sends an attestation:

    {"version": "beljour-consent/1", "adult": true, "scope": "makeup" | "hair",
     "photo_id": "<the uploaded photo>", "given_at": <ms since epoch>}

Every route that can send a photo to the provider (POST /api/tasks/start, POST /api/makeup/try)
calls require_consent() before the gateway, so an old client, a script or a bug that skips the
gate is refused with 428 and nothing is spent or sent. The server can't see the tick box; this
records that the client's gate was passed for this photo and scope, and that the person said
they are an adult. It stores nothing: no consent data is written to the ledger or disk.

Author: John Khan.
"""
from __future__ import annotations

import time
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from .errors import PlumbError

CONSENT_VERSION = "beljour-consent/1"
MAKEUP_ACTIONS = frozenset({"makeup"})
HAIR_ACTIONS = frozenset({"hair-color", "hair-style", "hair-transfer", "hair-bang", "hair-curl", "hair-extension", "hair-volume"})
# Skin AI to product matching (decisions.md 2026-10-23 10:21 AM ET): its own consent scope.
SKIN_ACTIONS = frozenset({"skin-match"})
# The browser grant lasts 30 minutes; the server allows clock skew around that.
MAX_AGE_MS = 24 * 3600 * 1000
MAX_AHEAD_MS = 10 * 60 * 1000


class ConsentIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: str = Field(max_length=40)
    adult: bool
    scope: Literal["makeup", "hair", "skin"]
    photo_id: str = Field(max_length=64)
    given_at: int = Field(ge=0)


def scope_for(action: str) -> str:
    if action in MAKEUP_ACTIONS:
        return "makeup"
    if action in HAIR_ACTIONS:
        return "hair"
    if action in SKIN_ACTIONS:
        return "skin"
    raise PlumbError(422, "bad_request", "Only makeup, hair styling and skin match actions can be sent to the provider.")


def require_consent(consent: ConsentIn | None, photo_id: str, action: str, now_ms: int) -> str:
    """Return the scope when the attestation fits this photo and action; otherwise raise 428."""
    scope = scope_for(action)
    if consent is None:
        raise PlumbError(428, "consent_required",
                         "Tick the box to send this photo to YouCam before starting a styling preview. Nothing was sent.")
    if consent.version != CONSENT_VERSION:
        raise PlumbError(428, "consent_outdated", "The consent form has changed. Reload the page and agree again. Nothing was sent.")
    if consent.adult is not True:
        raise PlumbError(428, "consent_adult", "BELJOUR is for adults. Nothing was sent.")
    if consent.photo_id != photo_id:
        raise PlumbError(428, "consent_photo", "Consent was given for a different photo. Tick the box for this photo. Nothing was sent.")
    if consent.scope != scope:
        raise PlumbError(428, "consent_scope", f"This photo was cleared for {consent.scope} only. Tick the box for this action. Nothing was sent.")
    if consent.given_at < now_ms - MAX_AGE_MS or consent.given_at > now_ms + MAX_AHEAD_MS:
        raise PlumbError(428, "consent_expired", "Consent to send this photo has expired. Tick the box again. Nothing was sent.")
    return scope


def attestation(photo_id: str, action: str, given_at: int | None = None) -> dict:
    """The JSON a client sends once its consent gate has passed (used by tests and scripts)."""
    return {"version": CONSENT_VERSION, "adult": True, "scope": scope_for(action), "photo_id": photo_id,
            "given_at": int(time.time() * 1000) if given_at is None else given_at}
