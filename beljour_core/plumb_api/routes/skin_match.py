"""Skin AI to product matching route (improve-r12 item 9).

    POST /api/skin/match   {photo_id, concerns?, local_only?, consent?}
        -> local profile, YouCam concerns (when sent and affordable), generic product types

The photo goes to YouCam only with a matching "skin" consent attestation (consent.py), and
only through the gateway on the skin-match channel. `local_only: true` never contacts the
provider and needs no consent. All logic lives in services/skin_match.py.
Author: John Khan.
"""
from __future__ import annotations

import time

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field

from ..consent import ConsentIn, require_consent
from ..rate_limit import RATE_LIMIT_RESPONSES
from ..services.skin_match import SkinMatchService
from ..state import AppState, get_state

router = APIRouter(prefix="/api")
STATE = Depends(get_state)    # module-level dependency (ruff B008)
ACTION = "skin-match"


class SkinMatchIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    photo_id: str = Field(max_length=64)
    concerns: list[str] | None = Field(default=None, max_length=16)
    local_only: bool = False
    consent: ConsentIn | None = None


def service_for(state: AppState) -> SkinMatchService:
    """One service per app, so its result memo is shared by every request."""
    if state.skin_match is None:
        state.skin_match = SkinMatchService(state.gateway)
    service: SkinMatchService = state.skin_match
    return service


@router.post("/skin/match", responses=RATE_LIMIT_RESPONSES)
async def skin_match(body: SkinMatchIn, state: AppState = STATE) -> dict:
    photo = state.photo(body.photo_id)
    if not body.local_only:
        require_consent(body.consent, body.photo_id, ACTION, int(time.time() * 1000))
    return await service_for(state).match(state.ref(photo), concerns=body.concerns, local_only=body.local_only)
