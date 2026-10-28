"""The one door to YouCam. Nothing else in the app may call YouCam.

Scope (decisions.md, 2026-10-22): YouCam is used only for makeup and styling (makeup try on,
hairstyle and hair colour). Everything else uses our own commercial-safe code.
Skin AI (decisions.md, 2026-10-23 10:21 AM ET, approved by John): YouCam skin analysis may
feed product matching, and only through the skin-match channel (services/skin_match.py).
A generic task or route asking for "skin-analysis" is still refused.

  * BELJOUR_YOUCAM_STYLING=0 turns this provider off. The app then runs on saved examples
    and local features only, and nothing else changes.
  * All former legacy endpoints are permanently blocked live, even with old flags.
  * Only approved makeup and hair styling recordings remain in the demo fixtures.

Flow for one task, each step written to the task ledger:
    begin (creating) -> upload photo and references -> create task -> created(task_id)
    -> poll -> download result -> delete task -> succeeded

A lost create reply marks the entry ambiguous and is never retried (ledger.py).

Author: John Khan.
"""
from __future__ import annotations

import asyncio
import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field

import httpx

from ..config import Settings
from ..errors import PlumbError
from ..ledger import AMBIGUOUS, LedgerConflict, TaskLedger
from ..youcam.client import TaskOutcome, YouCamClient, YouCamError

log = logging.getLogger("beljour.youcam")


@dataclass(frozen=True)
class FeatureSpec:
    name: str
    group: str            # "makeup" or "hair"
    verified: bool        # endpoint name and payload checked against the docs
    templates: bool = False


STYLING: dict[str, FeatureSpec] = {s.name: s for s in (
    FeatureSpec("makeup-vto", "makeup", verified=True),
    FeatureSpec("look-vto", "makeup", verified=False),
    FeatureSpec("mu-transfer", "makeup", verified=False),
    FeatureSpec("hair-style", "hair", verified=False, templates=True),
    FeatureSpec("hair-transfer", "hair", verified=False),
    FeatureSpec("hair-color", "hair", verified=False),
    FeatureSpec("hair-bang", "hair", verified=False),
    FeatureSpec("hair-curl", "hair", verified=False),
    FeatureSpec("hair-extension", "hair", verified=False),
    FeatureSpec("hair-volume", "hair", verified=False),
    FeatureSpec("beard-style", "hair", verified=False),
    FeatureSpec("eye-color-vto", "makeup", verified=False),
)}

# Skin AI scope: live only on the "skin-match" channel and only while its own flag is on
# (BELJOUR_YOUCAM_SKIN=0 turns it off). skin-tone-analysis stays legacy: the repo's docs
# list it under Shade, not under Skin AI.
SKIN: frozenset[str] = frozenset({"skin-analysis"})
SKIN_CHANNEL = "skin-match"

LEGACY: frozenset[str] = frozenset({
    "skin-tone-analysis", "face-attr-analysis", "face-reshape", "face-lift",
    "skin-simulation", "aging", "teeth-whiten",
})

# Not decided yet: these are fashion or analysis, not makeup or hair styling. They stay off
# until John decides (HANDOFF.md, open questions).
UNDECIDED: frozenset[str] = frozenset({"hat-vto", "scarf-vto", "hair-density", "cloth-v4", "ai-smile"})


def scope_of(feature: str) -> str:
    if feature in STYLING:
        return "styling"
    if feature in SKIN:
        return "skin"
    if feature in LEGACY:
        return "legacy"
    if feature in UNDECIDED:
        return "undecided"
    return "none"


# Errors the gateway turns into replies ---------------------------------------------------
class OutOfScope(PlumbError):
    def __init__(self, feature: str):
        super().__init__(409, "youcam_scope",
                         "This feature is outside the approved YouCam scope. Use its local tool instead.",
                         {"feature": feature, "scope": scope_of(feature)})


class TaskPending(PlumbError):
    def __init__(self, request_key: str, status: str):
        super().__init__(409, "task_pending",
                         "This exact request is already running. When it finishes, opening it again is free.",
                         {"request_key": request_key, "status": status})


class CheckCreditHistory(PlumbError):
    def __init__(self, request_key: str):
        super().__init__(409, "check_credit_history",
                         "An earlier try of this exact request may or may not have reached YouCam, so it won't be "
                         "sent again until the owner checks the credit history.",
                         {"request_key": request_key})


class TaskError(Exception):
    """A provider failure. `refund` is True only when the task certainly never ran."""

    def __init__(self, code: str, message: str, *, refund: bool, ambiguous: bool = False):
        super().__init__(f"{code}: {message}")
        self.code = code
        self.message = message
        self.refund = refund
        self.ambiguous = ambiguous


@dataclass
class Job:
    request_key: str
    feature: str
    version: str
    image: bytes
    content_type: str
    payload: dict
    want_image: bool = True
    refs: dict[str, tuple[bytes, str]] = field(default_factory=dict)
    session_id: str | None = None
    owner_sha: str | None = None
    units: int = 0
    channel: str | None = None


Done = Callable[[Job, TaskOutcome], Awaitable[None] | None]


def conflict_error(exc: LedgerConflict) -> PlumbError:
    if exc.entry.status == AMBIGUOUS:
        return CheckCreditHistory(exc.entry.request_key)
    return TaskPending(exc.entry.request_key, exc.entry.status)


class YouCamProvider:
    name = "youcam"

    def __init__(self, settings: Settings, client: object | None, ledger: TaskLedger,
                 background_timeout_s: float = 1800.0):
        self.settings = settings
        self.client = client
        self.ledger = ledger
        self.background_timeout_s = background_timeout_s
        self.background: set[asyncio.Task] = set()
        self._polling: dict[str, asyncio.Task] = {}

    def polling(self, task_id: str) -> bool:
        task = self._polling.get(task_id)
        return task is not None and not task.done()

    # scope -----------------------------------------------------------------------------
    @property
    def enabled(self) -> bool:
        return self.settings.live and self.client is not None

    def allowed(self, feature: str, channel: str | None = None) -> bool:
        scope = scope_of(feature)
        if scope == "skin":
            return channel == SKIN_CHANNEL and bool(getattr(self.settings, "youcam_skin", False))
        return scope == "styling"

    def check(self, feature: str, channel: str | None = None) -> None:
        if not self.allowed(feature, channel):
            raise OutOfScope(feature)

    @property
    def stepwise(self) -> bool:
        """True for the real client (and the replay client); False for SyntheticYouCam,
        which only offers a one shot run()."""
        return self.client is not None and hasattr(self.client, "create_task")

    # read only calls ---------------------------------------------------------------------
    async def credit(self) -> int | None:
        if self.client is None:
            return None
        return await self.client.credit()  # type: ignore[attr-defined]

    async def templates(self, feature: str) -> list[dict]:
        spec = STYLING.get(feature)
        if not spec or not spec.templates:
            raise OutOfScope(feature)
        if not self.stepwise:
            raise PlumbError(409, "no_templates", "Template lists need the live or replay client.")
        try:
            return await self.client.list_templates(feature)  # type: ignore[union-attr]
        except YouCamError as exc:
            raise PlumbError(502, "youcam_" + exc.code.lower(), exc.message) from exc

    # one task, start to finish -------------------------------------------------------------
    async def run(self, job: Job, on_late_result: Done | None = None) -> TaskOutcome:
        """Create, poll and collect one task. If polling outlasts our wait, polling carries
        on in the background and `on_late_result` gets the result, so the next identical
        request is a free cache hit."""
        self.check(job.feature, job.channel)
        if not self.stepwise:
            return await self._run_one_shot(job)
        task_id = await self.create(job)
        try:
            return await self.finish(job, task_id)
        except TimeoutError as exc:
            self.finish_later(job, task_id, on_late_result)
            raise TaskError("timeout", "YouCam is taking longer than usual. Please try again in a minute.",
                            refund=False) from exc

    async def _run_one_shot(self, job: Job) -> TaskOutcome:
        try:
            self.ledger.begin(job.request_key, job.feature, job.version, session_id=job.session_id,
                              owner_sha=job.owner_sha, units=job.units)
        except LedgerConflict as exc:
            raise conflict_error(exc) from exc
        try:
            outcome = await self.client.run(  # type: ignore[union-attr]
                job.feature, job.image, job.content_type, job.payload, version=job.version,
                want_image=job.want_image, refs=job.refs or None)
        except YouCamError as exc:
            self.ledger.failed(job.request_key, f"{exc.code}: {exc.message}")
            raise TaskError(exc.code, exc.message, refund=True) from exc
        self.ledger.created(job.request_key, f"{outcome.task_id}:{job.request_key}")
        self.ledger.succeeded(job.request_key)
        return outcome

    async def create(self, job: Job) -> str:
        """Upload and create. Returns the task id. Ledger first, never a blind retry."""
        self.check(job.feature, job.channel)
        client = self.client
        if client is None:
            raise TaskError("no_client", "Live mode is off.", refund=True)
        try:
            self.ledger.begin(job.request_key, job.feature, job.version, session_id=job.session_id,
                              owner_sha=job.owner_sha, units=job.units)
        except LedgerConflict as exc:
            raise conflict_error(exc) from exc
        key = job.request_key
        try:
            ext = job.content_type.split("/")[-1]
            file_id = await client.upload(job.image, job.content_type, f"beljour.{ext}")  # type: ignore[attr-defined]
            body = {**job.payload, "src_file_id": file_id}
            for name, (data, ctype) in job.refs.items():
                body[name] = await client.upload(data, ctype, f"ref.{ctype.split('/')[-1]}")  # type: ignore[attr-defined]
        except (YouCamError, httpx.HTTPError, OSError) as exc:
            # nothing was created yet, so nothing can have been charged
            self.ledger.failed(key, f"upload: {exc}")
            code = exc.code if isinstance(exc, YouCamError) else "upload_failed"
            raise TaskError(code, "The photo couldn't be sent to YouCam. Please try again.", refund=True) from exc
        try:
            task_id = await client.create_task(job.feature, body, job.version)  # type: ignore[attr-defined]
        except (httpx.ConnectError, httpx.ConnectTimeout) as exc:
            # the request never reached YouCam
            self.ledger.failed(key, f"create not sent: {exc}")
            raise TaskError("not_sent", "YouCam couldn't be reached. Please try again.", refund=True) from exc
        except YouCamError as exc:
            if exc.status is not None and 400 <= exc.status < 500:
                self.ledger.failed(key, f"{exc.code}: {exc.message}")
                raise TaskError(exc.code, exc.message, refund=True) from exc
            self.ledger.ambiguous(key, f"{exc.code}: {exc.message}")
            raise TaskError("ambiguous", "YouCam's reply was lost, so this won't be retried until the owner checks.",
                            refund=False, ambiguous=True) from exc
        except (TimeoutError, httpx.HTTPError, OSError) as exc:
            self.ledger.ambiguous(key, f"create reply lost: {exc!r}")
            raise TaskError("ambiguous", "YouCam's reply was lost, so this won't be retried until the owner checks.",
                            refund=False, ambiguous=True) from exc
        self.ledger.created(key, task_id)
        return task_id

    async def finish(self, job: Job, task_id: str, timeout_s: float | None = None) -> TaskOutcome:
        """Poll, collect and delete. Raises TimeoutError if our wait runs out (the task is
        still running at YouCam and the ledger entry stays `created`)."""
        client = self.client
        if client is None:
            raise TaskError("no_client", "Live mode is off.", refund=False)
        try:
            data = await client.poll(job.feature, task_id, job.version, timeout_s=timeout_s)  # type: ignore[attr-defined]
        except httpx.HTTPError as exc:
            # a dropped poll says nothing about the task; keep it open and poll again later
            raise TimeoutError(task_id) from exc
        except YouCamError as exc:
            if exc.status is not None and exc.status >= 500:
                raise TimeoutError(task_id) from exc
            self.ledger.failed(job.request_key, f"{exc.code}: {exc.message}")
            await client.delete_task(task_id)  # type: ignore[attr-defined]
            # the task ran and ended in error; whether it was charged is unknown, so keep the units
            raise TaskError(exc.code, exc.message, refund=False) from exc
        try:
            outcome = await client.collect(task_id, data, job.want_image)  # type: ignore[attr-defined]
        except YouCamError as exc:
            self.ledger.failed(job.request_key, f"download: {exc.code}")
            await client.delete_task(task_id)  # type: ignore[attr-defined]
            raise TaskError(exc.code, "The result couldn't be downloaded. Please try again.", refund=False) from exc
        await client.delete_task(task_id)  # type: ignore[attr-defined]
        self.ledger.succeeded(job.request_key)
        return outcome

    def finish_later(self, job: Job, task_id: str, on_done: Done | None) -> asyncio.Task:
        if self.polling(task_id):
            return self._polling[task_id]

        async def go() -> None:
            try:
                outcome = await self.finish(job, task_id, timeout_s=self.background_timeout_s)
            except (TaskError, TimeoutError) as exc:
                log.warning("background finish for %s ended: %s", task_id, exc)
                return
            if on_done is not None:
                maybe = on_done(job, outcome)
                if asyncio.iscoroutine(maybe):
                    await maybe

        task = asyncio.ensure_future(go())
        self.background.add(task)
        self._polling[task_id] = task
        task.add_done_callback(self.background.discard)
        task.add_done_callback(lambda _t: self._polling.pop(task_id, None))
        return task

    async def start(self, job: Job, on_done: Done) -> str:
        """Create now, finish in the background. Returns the task id at once, so the browser
        can keep a ticket for it."""
        self.check(job.feature, job.channel)
        if not self.stepwise:
            outcome = await self._run_one_shot(job)
            maybe = on_done(job, outcome)
            if asyncio.iscoroutine(maybe):
                await maybe
            entry = self.ledger.get(job.request_key)
            return entry.task_id if entry and entry.task_id else outcome.task_id
        task_id = await self.create(job)
        self.finish_later(job, task_id, on_done)
        return task_id

    def resume(self, job: Job, task_id: str, on_done: Done) -> asyncio.Task:
        """Poll a task created before a restart. Never creates anything."""
        self.check(job.feature, job.channel)
        return self.finish_later(job, task_id, on_done)


def build_client(settings: Settings, http: httpx.AsyncClient | None) -> YouCamClient | None:
    """The live client, or None in demo mode. Only this module constructs it."""
    if not settings.live:
        return None
    return YouCamClient(settings.youcam_api_key, settings.youcam_base_url, http or httpx.AsyncClient(),
                        settings.poll_interval_s, settings.poll_timeout_s)


def friendly(code: str, message: str) -> str:
    return _FRIENDLY.get(code, _FRIENDLY.get(message, message or "YouCam could not process this photo."))


_FRIENDLY = {
    "error_src_face_too_small": "Your face needs to fill more of the photo. Move a little closer so it covers most of the frame's width.",
    "error_src_face_out_of_bound": "Part of your face is outside the photo. Centre your face and try again.",
    "error_lighting_dark": "The photo is too dark. Face a window or a lamp and try again.",
    "error_below_min_image_size": "The photo is too small. Use one at least 480 pixels on the short side.",
    "error_face_not_forward_facing": "Look straight at the camera and try again.",
}
