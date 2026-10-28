"""BELJOUR API. FastAPI app factory. Run with:  uvicorn plumb_api.main:app --no-proxy-headers --port 8000"""
from __future__ import annotations

import hashlib
import logging
import os

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import __version__
from .config import Settings, load_settings
from .errors import PlumbError, public_value_error
from .providers.youcam import build_client
from .rate_limit import BucketPolicy, ClientIP, RateLimitMiddleware, TokenBuckets
from .routes import commerce, core, features, more, skin_match, tasks  # R16 Lane C route
from .services.photos import PhotoStore
from .session_ctx import SessionMiddleware
from .sessions import SESSION_HEADER
from .state import AppState
from .youcam.cache import ResultCache
from .youcam.gateway import YouCamGateway

log = logging.getLogger("beljour")
APP_NAME = "BELJOUR API"


def _install_sample(state: AppState) -> None:
    """The sample photo ships already normalised, so its hash (and every demo fixture key)
    is the same on every machine, whatever Pillow version is installed."""
    path = state.settings.fixtures_dir / "sample.jpg"
    if not path.exists():
        return
    data = path.read_bytes()
    sha = hashlib.sha256(data).hexdigest()
    (state.photos.root / f"{sha}.jpg").write_bytes(data)
    state.sample_sha = sha


def create_app(settings: Settings | None = None, http: httpx.AsyncClient | None = None,
               client: object | None = None) -> FastAPI:
    """`client` lets tests and the demo recorder swap in SyntheticYouCam."""
    settings = settings or load_settings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    cache = ResultCache(settings.data_dir, settings.fixtures_dir, settings.result_ttl_seconds)
    if client is None:
        client = build_client(settings, http)
    state = AppState(settings, cache, PhotoStore(settings.data_dir, settings.photo_ttl_seconds, settings.max_pixels),
                     YouCamGateway(settings, cache, client),
                     store_search_template=os.environ.get("PLUMB_STORE_SEARCH_URL") or None)
    _install_sample(state)

    app = FastAPI(title=APP_NAME, version=__version__)
    app.state.plumb = state
    app.add_middleware(SessionMiddleware, on_session=state.gateway.sessions.touch)
    if settings.rate_limit_enabled:
        buckets = TokenBuckets(BucketPolicy(settings.rate_limit_capacity, settings.rate_limit_refill_s),
                               max_entries=settings.rate_limit_max_entries)
        app.state.rate_limits = buckets
        app.add_middleware(RateLimitMiddleware, buckets=buckets,
                           client_ip=ClientIP(settings.trusted_proxy_header, settings.trusted_proxy_networks))
    app.add_middleware(CORSMiddleware, allow_origins=list(settings.allowed_origins),
                       allow_methods=["GET", "POST", "DELETE"], allow_headers=["Content-Type", SESSION_HEADER],
                       expose_headers=["Retry-After"])

    @app.exception_handler(PlumbError)
    async def plumb_error(_: Request, exc: PlumbError) -> JSONResponse:
        return JSONResponse(exc.to_json(), status_code=exc.status)

    @app.exception_handler(ValueError)
    async def value_error(_: Request, exc: ValueError) -> JSONResponse:
        body, status = public_value_error(exc, log)
        return JSONResponse(body, status_code=status)

    app.include_router(core.router)
    app.include_router(skin_match.router)
    app.include_router(features.router)
    app.include_router(more.router)
    app.include_router(tasks.router)
    # R16 Lane C: additive commerce route and session registry. No other route changed.
    from .commerce.sessions import CommerceSessions
    app.state.commerce_sessions = CommerceSessions()
    app.include_router(commerce.router)
    return app


app = create_app() if os.environ.get("PLUMB_NO_AUTOCREATE") != "1" else None  # type: ignore[assignment]
