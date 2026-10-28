"""R16C sample-commerce routes: session isolation, consent and zero payment processing.

Every live YouCam request enters through the existing SkinMatchService or the existing
gateway. A missing attestation returns 403 *before* any photo or provider access.
Local-only matching and previews are available with YouCam disabled. Author: John Khan.
"""
from __future__ import annotations

import time
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, ConfigDict, Field, field_validator

from ..commerce.catalogue import public_catalogue, require_product
from ..commerce.look_plan import LookPlan
from ..commerce.ranking import Profile
from ..commerce.service import CommerceService
from ..commerce.sessions import CommerceSessions
from ..commerce.strength import DEFAULT_LOCK, to_legacy, validate_level
from ..consent import ConsentIn, require_consent
from ..errors import PlumbError
from ..rate_limit import RATE_LIMIT_RESPONSES
from ..session_ctx import current_session
from ..state import AppState, get_state

router = APIRouter(prefix="/api/commerce", tags=["sample-commerce"])
State = Annotated[AppState, Depends(get_state)]


class MatchIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    photo_id: str = Field(min_length=64, max_length=64)
    local_only: bool = False
    consent: ConsentIn | None = None
    concerns: list[str] | None = Field(default=None, max_length=16)
    finish: Literal["natural", "dewy", "satin", "matte"] = "natural"
    # Manual classification is supported for the static demo and for user correction.
    manual_depth: int | None = Field(default=None, ge=1, le=10, strict=True)
    manual_undertone: Literal["cool", "neutral", "warm", "olive"] | None = None
    sample_budget_cents: int = Field(default=6000, ge=0, le=100_000, strict=True)
    match_goal: Literal["balanced", "lower-cost", "visual-try-on", "shade-first"] = "balanced"


class TryOnIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    photo_id: str = Field(min_length=64, max_length=64)
    product_id: str = Field(min_length=3, max_length=80)
    local_only: bool = False
    strength: int = Field(default=50, ge=0, le=100, strict=True)
    level: float | None = Field(default=None, strict=True)
    lock_level: float = Field(default=DEFAULT_LOCK, strict=True)
    consent: ConsentIn | None = None

    @field_validator("level", "lock_level")
    @classmethod
    def valid_level(cls, value: float | None) -> float | None:
        return None if value is None else validate_level(value)


class LookEffectIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    product_id: str = Field(min_length=3, max_length=80)
    strength: int = Field(default=50, ge=0, le=100, strict=True)
    level: float | None = Field(default=None, strict=True)

    @field_validator("level")
    @classmethod
    def valid_level(cls, value: float | None) -> float | None:
        return None if value is None else validate_level(value)


class LookIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    photo_id: str = Field(min_length=64, max_length=64)
    local_only: bool = False
    consent: ConsentIn | None = None
    steps: list[LookEffectIn] = Field(min_length=1, max_length=3)
    lock_level: float = Field(default=DEFAULT_LOCK, strict=True)

    @field_validator("lock_level")
    @classmethod
    def valid_lock(cls, value: float) -> float:
        return validate_level(value)


class BagItemIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    product_id: str = Field(min_length=3, max_length=80)
    quantity: int = Field(default=1, ge=1, le=5)
    revision: int | None = Field(default=None, ge=0)


class RemoveIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    product_id: str = Field(min_length=3, max_length=80)
    quantity: int | None = Field(default=None, ge=1, le=5)
    revision: int | None = Field(default=None, ge=0)


class WishIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    product_id: str = Field(min_length=3, max_length=80)
    selected: bool = True
    revision: int | None = Field(default=None, ge=0)


class ClearIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    revision: int | None = Field(default=None, ge=0)


class ShadesIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    product_id: str = Field(min_length=3, max_length=80)
    depth: int = Field(ge=1, le=10)
    undertone: Literal["cool", "neutral", "warm", "olive"]


def sessions(request: Request) -> CommerceSessions:
    return request.app.state.commerce_sessions


def require_live_consent(value: ConsentIn | None, photo_id: str, action: str) -> None:
    if value is None:
        raise PlumbError(403, "consent_required", "Consent is required before sending a photo. Nothing was sent.")
    # Existing attestation, timestamp and scope rules remain the single source of truth.
    require_consent(value, photo_id, action, int(time.time() * 1000))


@router.get("/catalogue")
def catalogue() -> dict:
    return public_catalogue()


@router.post("/match", responses=RATE_LIMIT_RESPONSES)
async def match(body: MatchIn, state: State) -> dict:
    service = CommerceService(state)
    if (body.manual_depth is None) != (body.manual_undertone is None):
        raise PlumbError(422, "manual_profile", "Choose both depth and undertone, or leave both empty.")
    manual = (Profile(depth=body.manual_depth, undertone=body.manual_undertone,
                      confidence="manual", evidence="Visitor-selected sample shade class")
              if body.manual_depth is not None and body.manual_undertone is not None else None)
    local = body.local_only or manual is not None or not service.live_enabled() or not state.settings.youcam_skin
    if not local:
        require_live_consent(body.consent, body.photo_id, "skin-match")
    photo = state.photo(body.photo_id)
    response = await service.recommendations(photo, local_only=local,
                                             concerns=body.concerns, finish=body.finish,
                                             profile_override=manual,
                                             sample_budget_cents=body.sample_budget_cents,
                                             match_goal=body.match_goal)
    return {"photo_id": photo.sha, **response}


@router.post("/try-on", responses=RATE_LIMIT_RESPONSES)
async def try_on(body: TryOnIn, request: Request, state: State) -> dict:
    product = require_product(body.product_id)
    if not product.vto:
        raise PlumbError(422, "no_visual_try_on", "This sample item has no visual try-on.")
    # A private session must be validated before any provider task can spend units.
    sessions(request).view(current_session())
    service = CommerceService(state)
    local = body.local_only or not service.live_enabled()
    if not local:
        require_live_consent(body.consent, body.photo_id, "makeup")
    photo = state.photo(body.photo_id)
    strength = to_legacy(body.level) if body.level is not None else body.strength
    result = await service.try_on(
        photo, body.product_id, local_only=local,
        strength=strength, lock_level=body.lock_level,
    )
    sessions(request).preview(current_session(), photo.sha, body.product_id)
    return {"photo_id": photo.sha, **result}


@router.post("/look/try-on", responses=RATE_LIMIT_RESPONSES)
async def try_on_look(body: LookIn, request: Request, state: State) -> dict:
    # Validate the complete fictional recipe before any session or photo work.
    try:
        plan = LookPlan.parse([
            {"product_id": step.product_id,
             "strength": to_legacy(step.level) if step.level is not None else step.strength}
            for step in body.steps
        ])
    except ValueError as exc:
        raise PlumbError(422, "invalid_look", "Choose up to three different fictional makeup types.") from exc
    sessions(request).view(current_session())
    service = CommerceService(state)
    local = body.local_only or not service.live_enabled()
    if not local:
        require_live_consent(body.consent, body.photo_id, "makeup")
    photo = state.photo(body.photo_id)
    result = await service.try_on_look(photo, plan, local_only=local, lock_level=body.lock_level)
    sessions(request).preview(current_session(), photo.sha, plan.steps[0].product.sku)
    return {"photo_id": photo.sha, **result}


@router.post("/shade-swaps")
def shade_swaps(body: ShadesIn, state: State) -> dict:
    from ..commerce.ranking import Profile
    return CommerceService(state).shades(body.product_id, Profile(body.depth, body.undertone, "manual"))


@router.get("/bag")
def bag_get(request: Request) -> dict:
    return sessions(request).view(current_session())


@router.post("/bag/add")
def bag_add(body: BagItemIn, request: Request) -> dict:
    return sessions(request).add(current_session(), body.product_id, body.quantity, body.revision)


@router.post("/bag/remove")
def bag_remove(body: RemoveIn, request: Request) -> dict:
    return sessions(request).remove(current_session(), body.product_id, body.quantity, body.revision)


@router.post("/wishlist")
def wishlist(body: WishIn, request: Request) -> dict:
    return sessions(request).wish(current_session(), body.product_id, body.selected, body.revision)


@router.post("/bag/clear")
def bag_clear(body: ClearIn, request: Request) -> dict:
    return sessions(request).clear(current_session(), body.revision)
