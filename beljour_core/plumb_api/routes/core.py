"""System, photo and pricing routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, Response, UploadFile
from pydantic import BaseModel, Field

from .. import __version__
from ..actions import ACTIONS, ActionError, build
from ..errors import PlumbError
from ..pipeline import endpoint_version
from ..routes.quote_scope import LOCAL_ACTIONS, SERVER_LOCAL_ACTIONS, decorate, local_quote
from ..services.photos import check_id
from ..session_ctx import current_session
from ..sessions import ANONYMOUS, valid_session_id
from ..state import AppState, get_state, makeup_payload

State = Annotated[AppState, Depends(get_state)]

router = APIRouter(prefix="/api")


@router.get("/health")
async def health(state: State) -> dict:
    return {"ok": True, "version": __version__, "live": state.settings.live,
            "sample_available": state.sample_sha is not None}


@router.get("/budget")
async def budget(state: State) -> dict:
    return {
        "spent_today": state.cache.spent_on(),
        "spent_total": state.cache.spent_total(),
        "daily_cap": state.settings.daily_unit_cap,
        "reserve": state.settings.unit_reserve,
        "balance": await state.gateway.balance() if state.settings.live else None,
        "live": state.settings.live,
    }


@router.post("/photos")
async def add_photo(file: Annotated[UploadFile, File()], state: State) -> dict:
    owner = current_session()
    if owner == ANONYMOUS:
        raise PlumbError(428, "session_required", "Start a private browser session before uploading a photo. Nothing was stored.")
    raw = await file.read(state.settings.max_upload_bytes + 1)
    if len(raw) > state.settings.max_upload_bytes:
        raise PlumbError(413, "too_big", "That photo is over 8 MB. Please use a smaller one.")
    state.photos.purge_expired(keep={state.sample_sha} if state.sample_sha else set())
    state.cache.purge_expired()
    # The uploading browser session owns the photo; other sessions cannot read or delete it.
    photo = state.photos.put(raw, owner=owner)
    return {"photo_id": photo.sha, "width": photo.width, "height": photo.height, "sample": False}


@router.get("/photos/sample")
async def sample_photo(state: State) -> dict:
    if not state.sample_sha:
        raise PlumbError(404, "no_sample", "No sample photo is installed on this server.")
    photo = state.photo(state.sample_sha)
    return {"photo_id": photo.sha, "width": photo.width, "height": photo.height, "sample": True}


@router.get("/photos/{photo_id}.jpg")
async def photo_image(photo_id: str, state: State,
                      s: Annotated[str | None, Query(max_length=64)] = None) -> Response:
    """An <img> tag cannot send the session header, so the page may pass its session id as
    `?s=`. It is the same per-tab access token the header carries; do not include
    it in public links. It scopes this visit and is not an account login."""
    session = current_session()
    if session == ANONYMOUS and s is not None and valid_session_id(s):
        session = s
    photo = state.photo(photo_id, session=session)
    return Response(photo.data, media_type="image/jpeg",
                    headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"})


@router.delete("/photos/{photo_id}")
async def delete_photo(photo_id: str, state: State) -> dict:
    check_id(photo_id)
    if photo_id == state.sample_sha:
        return {"deleted": False, "results_removed": 0, "note": "The shared sample photo stays."}
    session = current_session()
    ledger = state.gateway.ledger
    try:
        state.photos.delete(photo_id, session=session)
    except PlumbError as exc:
        # A recovered task can outlive both the source file and its owner records.
        # Only revoking this caller's actual private ledger grant authorizes deletion
        # in that case. A stranger's 404 must leave every record and result unchanged.
        if exc.status != 404 or session == ANONYMOUS or not ledger.revoke_photo_session(photo_id, session):
            raise
    else:
        ledger.revoke_photo_session(photo_id, session)
    # Other sessions may still own the photo, or a resumed task whose upload is gone.
    # Keep their results and all task/spend history. Once no reader remains, remove
    # orphan source bytes and cached results as well as this session's access grant.
    shared = bool(state.photos.owners(photo_id) - {ANONYMOUS}) or ledger.has_private_photo_session(photo_id)
    if shared:
        removed = 0
    else:
        state.photos.delete(photo_id)
        removed = state.cache.purge_image(photo_id)
    return {"deleted": True, "results_removed": removed}


class QuoteIn(BaseModel):
    photo_id: str | None = None
    action: str
    options: dict = Field(default_factory=dict)
    reference_photo_id: str | None = Field(default=None, max_length=64)
    reference_rights: bool = False
    concerns: list[str] | None = None
    foundation_id: str | None = None
    lip_id: str | None = None
    blush_id: str | None = None
    intensity: dict[str, int] | None = None
    selection: dict[str, float] = Field(default_factory=dict)
    strengths: dict[str, float] = Field(default_factory=dict)


@router.post("/quote")
async def quote(body: QuoteIn, state: State) -> dict:
    """Scope and *unreserved* per-visit unit allowance for local and YouCam tools.

    The server never accepts a browser's claimed price or available units.
    Local R7 tools require no uploaded photo and never contact the provider.
    Compatibility analysis quotes identify processing on this server without YouCam.
    """
    if body.action in LOCAL_ACTIONS | SERVER_LOCAL_ACTIONS:
        return decorate(local_quote(body.action), state)
    if not body.photo_id:
        raise PlumbError(422, "photo_required", "Choose a photo before requesting a styling quote.")
    sha = state.photo(body.photo_id).sha
    g = state.gateway
    if body.action in ACTIONS:
        if body.action == "makeup" and not body.options:
            q = g.quote(sha, "makeup-vto", makeup_payload(body.foundation_id, body.lip_id,
                                                              body.blush_id, body.intensity))
        else:
            try:
                feature, payload = build(body.action, body.options)
            except ActionError as exc:
                raise PlumbError(422, "bad_request", str(exc)) from exc
            if body.action == "hair-transfer":
                if not body.reference_rights or not body.reference_photo_id or body.reference_photo_id == body.photo_id:
                    raise PlumbError(422, "reference_required", "Choose a separate reference photo and confirm rights before quoting.")
                ref_sha = state.photo(body.reference_photo_id).sha
                q = g.quote(sha, feature, payload, {"ref_file_id": ref_sha},
                            version=endpoint_version(feature))
            elif body.reference_photo_id or body.reference_rights:
                raise PlumbError(422, "reference_unexpected", "Only reference cuts accept a second photo.")
            else:
                q = g.quote(sha, feature, payload)
        return decorate(q, state)
    if body.action == "outfit":
        raise PlumbError(410, "feature_removed", "Clothes and size features are no longer part of BELJOUR.")
    else:
        raise PlumbError(422, "bad_request", f"Unknown action {body.action}.")
