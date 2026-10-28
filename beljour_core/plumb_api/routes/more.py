"""Local simulations and explicit retired route responses. Author: John Khan."""
from __future__ import annotations

import asyncio
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import Field

from ..errors import PlumbError
from ..services import local_features
from ..state import AppState, get_state
from .features import PhotoIn

State = Annotated[AppState, Depends(get_state)]

router = APIRouter(prefix="/api")


class SimulateIn(PhotoIn):
    strengths: dict[str, float] = Field(max_length=12)


@router.post("/skin/simulate")
async def skin_simulate(body: SimulateIn, state: State) -> dict:
    photo = state.photo(body.photo_id)
    return await asyncio.to_thread(local_features.texture_preview, photo.data, body.strengths, body.landmarks)


@router.post("/transform/aging")
async def transform_aging(body: PhotoIn, state: State) -> dict:
    photo = state.photo(body.photo_id)
    return await asyncio.to_thread(local_features.age_preview, photo.data, body.landmarks)


# Clothes and size fit (removed in R3) ----------------------------------------------
# Clothes are not in BELJOUR's scope (decisions.md, plan-r3-final §4): the product
# page reader, garment upload, style notes and size charts are gone. Old clients get a
# plain 410 instead of a 404, so their screens can say why.
REMOVED_MESSAGE = "Clothes and size features are no longer part of BELJOUR."


@router.api_route("/fashion/{rest:path}", methods=["GET", "POST", "DELETE"], include_in_schema=False)
@router.api_route("/fit/{rest:path}", methods=["GET", "POST"], include_in_schema=False)
async def clothes_removed(rest: str) -> dict:
    raise PlumbError(410, "feature_removed", REMOVED_MESSAGE)
