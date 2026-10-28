"""The current browser session for one request, without threading it through every route.

`SessionMiddleware` is plain ASGI (no FastAPI import), so it is tested on its own. It reads
the X-Beljour-Session header, falls back to "anonymous" when the header is missing or
malformed, and sets a context variable that the gateway reads when it spends units.

Author: John Khan.
"""
from __future__ import annotations

import contextvars
from collections.abc import Awaitable, Callable
from typing import Any

from .sessions import ANONYMOUS, SESSION_HEADER, valid_session_id

_current: contextvars.ContextVar[str] = contextvars.ContextVar("beljour_session", default=ANONYMOUS)

Scope = dict[str, Any]
Receive = Callable[[], Awaitable[dict]]
Send = Callable[[dict], Awaitable[None]]
ASGIApp = Callable[[Scope, Receive, Send], Awaitable[None]]


def current_session() -> str:
    return _current.get()


def set_session(session_id: str) -> contextvars.Token[str]:
    return _current.set(session_id if valid_session_id(session_id) else ANONYMOUS)


def reset_session(token: contextvars.Token[str]) -> None:
    _current.reset(token)


def session_from_headers(headers: list[tuple[bytes, bytes]]) -> str:
    wanted = SESSION_HEADER.encode()
    for name, value in headers:
        if name.lower() == wanted:
            text = value.decode("latin-1").strip()
            return text if valid_session_id(text) else ANONYMOUS
    return ANONYMOUS


class SessionMiddleware:
    def __init__(self, app: ASGIApp, on_session: Callable[[str], None] | None = None):
        self.app = app
        self.on_session = on_session

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope.get("type") != "http":
            await self.app(scope, receive, send)
            return
        session_id = session_from_headers(scope.get("headers") or [])
        token = set_session(session_id)
        try:
            if self.on_session and session_id != ANONYMOUS:
                self.on_session(session_id)
            await self.app(scope, receive, send)
        finally:
            reset_session(token)
