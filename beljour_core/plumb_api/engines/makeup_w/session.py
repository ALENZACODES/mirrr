'Local makeup session state and revision-safe render jobs. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass, replace
from typing import Any

from .contracts import MakeupRequest, parse_request


@dataclass(frozen=True)
class Revision:
    image_id: str
    recipe_revision: int
    job_id: int

@dataclass(frozen=True)
class SessionState:
    image_id: str
    recipe_revision: int
    next_job_id: int
    active_job_id: int | None
    request: MakeupRequest | None
    status: str
    last_error: str

def initial(image_id: str='') -> SessionState:
    return SessionState(image_id, 0, 1, None, None, 'idle', '')

def with_image(state: SessionState, image_id: str) -> SessionState:
    if not image_id:
        raise ValueError('image_id required')
    return SessionState(image_id, state.recipe_revision + 1, state.next_job_id, None, state.request, 'ready', '')

def with_request(state: SessionState, value: dict[str, Any] | MakeupRequest) -> SessionState:
    request = parse_request(value)
    return replace(state, request=request, recipe_revision=state.recipe_revision + 1, status='ready', last_error='')

def begin(state: SessionState) -> tuple[SessionState, Revision]:
    if not state.image_id:
        raise ValueError('no image loaded')
    if state.request is None:
        raise ValueError('no makeup request')
    revision = Revision(state.image_id, state.recipe_revision, state.next_job_id)
    return (replace(state, active_job_id=state.next_job_id, next_job_id=state.next_job_id + 1, status='rendering'), revision)

def accepts(state: SessionState, revision: Revision) -> bool:
    return state.active_job_id == revision.job_id and state.image_id == revision.image_id and (state.recipe_revision == revision.recipe_revision)

def complete(state: SessionState, revision: Revision) -> SessionState:
    if not accepts(state, revision):
        return state
    return replace(state, active_job_id=None, status='ready')

def fail(state: SessionState, revision: Revision, message: str) -> SessionState:
    if not accepts(state, revision):
        return state
    return replace(state, active_job_id=None, status='error', last_error=message[:200])

def cancel(state: SessionState) -> SessionState:
    if state.active_job_id is None:
        return state
    return replace(state, active_job_id=None, status='ready')

def snapshot(state: SessionState) -> dict[str, Any]:
    return {'image_id': state.image_id, 'recipe_revision': state.recipe_revision, 'active_job_id': state.active_job_id, 'status': state.status, 'last_error': state.last_error, 'feature': state.request.feature if state.request else None}
