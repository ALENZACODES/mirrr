"""Local photo tools and the consented YouCam makeup route. Author: John Khan."""
from __future__ import annotations

import asyncio
import time
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field

from ..consent import ConsentIn, require_consent
from ..errors import PlumbError
from ..rate_limit import RATE_LIMIT_RESPONSES
from ..services import imaging, local_features, shade
from ..state import AppState, get_state, makeup_payload, result_meta

State = Annotated[AppState, Depends(get_state)]

router = APIRouter(prefix="/api")


class PhotoIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    photo_id: str = Field(max_length=64)
    landmarks: list[list[float]] | None = Field(default=None, max_length=478)


class SkinIn(PhotoIn):
    concerns: list[str] | None = Field(default=None, max_length=16)


@router.post("/skin/analyze")
async def skin_analyze(body: SkinIn, state: State) -> dict:
    photo = state.photo(body.photo_id)
    return await asyncio.to_thread(local_features.skin_analysis, photo.data)


@router.get("/shade/catalogue")
async def shade_catalogue() -> dict:
    return shade.catalogue()


@router.post("/shade/analyze")
async def shade_analyze(body: PhotoIn, state: State) -> dict:
    photo = state.photo(body.photo_id)
    return await asyncio.to_thread(local_features.shade_analysis, photo.data, body.landmarks)


# Makeup -------------------------------------------------------------------------
class MakeupIn(PhotoIn):
    foundation_id: str | None = None
    lip_id: str | None = None
    blush_id: str | None = None
    intensity: dict[str, int] | None = None
    consent: ConsentIn | None = None


@router.post("/makeup/try", responses=RATE_LIMIT_RESPONSES)
async def makeup_try(body: MakeupIn, state: State) -> dict:
    require_consent(body.consent, body.photo_id, "makeup", int(time.time() * 1000))
    photo = state.photo(body.photo_id)
    payload = makeup_payload(body.foundation_id, body.lip_id, body.blush_id, body.intensity)
    result = await state.gateway.run(state.ref(photo), "makeup-vto", payload)
    if not result.image:
        raise PlumbError(502, "no_image", "The try on finished without an image. Please try again.")
    return {"image": imaging.data_url(result.image, result.image_type or "image/jpeg"),
            "honesty": imaging.honesty_meter(photo.data, result.image), **result_meta(result)}


# All former analysis/reshape routes now call the existing local engines.
@router.post("/face/proportions")
async def face_proportions(body: PhotoIn, state: State) -> dict:
    photo = state.photo(body.photo_id)
    return await asyncio.to_thread(local_features.proportion_analysis, photo.data, body.landmarks)


@router.get("/surgery/procedures")
async def surgery_procedures() -> dict:
    return {"procedures": local_features.procedure_catalogue(), "step": 10,
            "label": local_features.LOCAL_LABEL}


class SurgeryIn(PhotoIn):
    selection: dict[str, float] = Field(default_factory=dict, max_length=29)


@router.post("/surgery/preview")
async def surgery_preview(body: SurgeryIn, state: State) -> dict:
    photo = state.photo(body.photo_id)
    return await asyncio.to_thread(local_features.procedure_preview, photo.data, body.selection, body.landmarks)
