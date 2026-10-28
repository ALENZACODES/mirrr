"""Session, judge code and background task routes (BELJOUR round 1).

    GET  /api/session                  this browser session: spend, cap, judge, remaining
    POST /api/session/judge            {code} -> raises the session cap when the code is right
    GET  /api/styling/scope            which YouCam features run live, and why
    POST /api/tasks/start              {photo_id, action, consent, ...} -> {status, request_key, ticket}
                                       (428 without a matching consent attestation; see consent.py)
    GET  /api/tasks/{request_key}      status, and the image once it is done
    POST /api/tasks/resume             {tickets: [...]} after a restart -> statuses

All the logic lives in the gateway, ledger, sessions and limits modules; these routes only
parse and reply.

Author: John Khan.
"""
from __future__ import annotations

import time
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ..actions import ACTIONS, ActionError, build
from ..consent import ConsentIn, require_consent
from ..errors import PlumbError
from ..pipeline import endpoint_version
from ..providers.youcam import LEGACY, SKIN, SKIN_CHANNEL, STYLING, UNDECIDED
from ..rate_limit import RATE_LIMIT_RESPONSES
from ..services import imaging
from ..session_ctx import current_session
from ..sessions import ANONYMOUS
from ..state import AppState, get_state, makeup_payload, result_meta

State = Annotated[AppState, Depends(get_state)]

router = APIRouter(prefix="/api")


@router.get("/session")
async def session_status(state: State) -> dict:
    return state.gateway.policy.status(current_session())


class JudgeIn(BaseModel):
    code: str = Field(max_length=64)


@router.post("/session/judge")
async def judge_code(body: JudgeIn, state: State) -> dict:
    session = current_session()
    if session == "anonymous":
        raise PlumbError(400, "no_session", "Judge codes need a browser session. Reload the page and try again.")
    s = state.settings
    attempt = state.gateway.sessions.try_judge_code(session, body.code, s.judge_code_hashes, s.judge_attempts)
    if attempt.locked:
        raise PlumbError(429, "judge_locked", "Too many wrong codes for this visit. Open the app in a new tab to try again.")
    if not attempt.ok:
        raise PlumbError(403, "judge_wrong", "That code isn't right. Check it and try again.",
                         {"attempts_left": attempt.attempts_left})
    return state.gateway.policy.status(session)


@router.get("/styling/scope")
async def styling_scope(state: State) -> dict:
    p = state.gateway.provider
    return {
        "live": state.settings.live,
        "styling_flag": state.settings.youcam_styling,
        "legacy_flag": False,
        "styling": {name: p.allowed(name) for name in sorted(STYLING)},
        "legacy": {name: p.allowed(name) for name in sorted(LEGACY)},
        # Skin AI runs only on the skin-match channel (POST /api/skin/match), never as a task.
        "skin": {name: p.allowed(name) for name in sorted(SKIN)},
        "skin_match": {name: p.allowed(name, SKIN_CHANNEL) for name in sorted(SKIN)},
        "undecided": sorted(UNDECIDED),
        "actions": sorted(ACTIONS),
    }


class StartIn(BaseModel):
    photo_id: str
    action: str
    foundation_id: str | None = None
    lip_id: str | None = None
    blush_id: str | None = None
    intensity: dict[str, int] | None = None
    options: dict = Field(default_factory=dict)
    reference_photo_id: str | None = Field(default=None, max_length=64)
    reference_rights: bool = False
    consent: ConsentIn | None = None


@router.post("/tasks/start", responses=RATE_LIMIT_RESPONSES)
async def task_start(body: StartIn, state: State) -> dict:
    if body.action not in ACTIONS:
        raise PlumbError(422, "bad_request", f"{body.action} isn't a styling action this app can start.")
    # R9 consent gate: before the photo lookup, the quote or any provider call.
    require_consent(body.consent, body.photo_id, body.action, int(time.time() * 1000))
    photo = state.photo(body.photo_id)
    if body.action == "makeup" and not body.options:
        feature, payload = "makeup-vto", makeup_payload(body.foundation_id, body.lip_id, body.blush_id, body.intensity)
    else:
        try:
            feature, payload = build(body.action, body.options)
        except ActionError as exc:
            raise PlumbError(422, "bad_request", str(exc)) from exc
    refs = {}
    if body.action == "hair-transfer":
        if not body.reference_rights:
            raise PlumbError(422, "reference_rights", "Confirm you own or may use the reference haircut photo. Nothing was sent.")
        if not body.reference_photo_id:
            raise PlumbError(422, "reference_required", "Choose a reference cut before continuing. Nothing was sent.")
        if body.reference_photo_id == body.photo_id:
            raise PlumbError(422, "reference_same", "Use a separate haircut reference, not the portrait being styled.")
        refs["ref_file_id"] = state.ref(state.photo(body.reference_photo_id))
    elif body.reference_photo_id or body.reference_rights:
        raise PlumbError(422, "reference_unexpected", "Reference images belong to reference-cut tasks only.")
    # Version is carried through gateway, ledger and signed resume ticket. Both source
    # and reference SHA are part of its idempotency key; no blind double-bill retry.
    return await state.gateway.start(state.ref(photo), feature, payload, refs=refs,
                                     version=endpoint_version(feature))


@router.get("/tasks/{request_key}")
async def task_get(request_key: str, state: State) -> dict:
    if not request_key.isalnum() or len(request_key) > 64:
        raise PlumbError(400, "bad_id", "That task id isn't valid.")
    result = state.gateway.result(request_key)
    entry = state.gateway.ledger.get(request_key)
    if result is not None or entry is not None:
        owner = result.image_sha if result is not None else entry.owner_sha if entry is not None else None
        session = current_session()
        public_sample = owner is not None and owner == state.sample_sha
        # A signed resume re-enters the ledger with its current private session.
        # It must still work when a restart has erased the original upload. An
        # explicit photo deletion revokes this ledger grant in delete_photo().
        ledger_owner = (session != ANONYMOUS and entry is not None and
                        entry.session_id == session and entry.owner_sha == owner and owner is not None)
        photo_owner = (session != ANONYMOUS and owner is not None and
                       state.photos.owned_by(owner, session))
        if not (public_sample or ledger_owner or photo_owner):
            raise PlumbError(404, "task_gone", "That task is not available in this browser session.")
    status = state.gateway.task_status(request_key)
    if status["status"] != "done":
        return status
    if result is None:
        return {**status, "status": "expired"}
    out = {**status, **result_meta(result)}
    if result.image:
        image, ctype = result.image, result.image_type or "image/jpeg"
        if out["provenance"]["simulation"]:
            image, ctype = imaging.burn_label(image), "image/jpeg"
        out["image"] = imaging.data_url(image, ctype)
    return out


class ResumeIn(BaseModel):
    tickets: list[dict] = Field(default_factory=list, max_length=20)


@router.post("/tasks/resume", responses=RATE_LIMIT_RESPONSES)
async def task_resume(body: ResumeIn, state: State) -> dict:
    return {"tasks": await state.gateway.resume(body.tickets)}
