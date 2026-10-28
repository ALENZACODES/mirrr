"""Cache first, then the unit policy, then the YouCam provider.

Order for every request:
  1. same photo + feature + settings already done?  -> return it, 0 units
     (cache key v2 first, then the v1 key the Plumb demo fixtures use)
  2. demo only, or no key, or the styling flag off? -> NotInDemo
  3. feature outside YouCam's scope?                -> OutOfScope (providers/youcam.py)
  4. kill switch, session cap, daily cap, floor?    -> BudgetExceeded, nothing spent
  5. ledger: a task for this key already open?      -> TaskPending / CheckCreditHistory
  6. run, store under the v2 key, settle the units (or refund them if the task never ran)
A per key lock stops two identical clicks in one process from paying twice; the ledger
stops it across restarts.

This module never imports the YouCam client. Only providers/youcam.py does.
"""
from __future__ import annotations

import asyncio
import base64
import time
from dataclasses import dataclass

from ..config import Settings
from ..errors import NotInDemo, PlumbError
from ..ledger import CREATED, CREATING, SUCCEEDED, BadTransition, TaskLedger
from ..limits import UnitPolicy
from ..pipeline import pipeline_version
from ..providers.youcam import Job, TaskError, YouCamProvider, friendly
from ..session_ctx import current_session
from ..sessions import SessionStore
from ..tickets import Ticket, TicketSigner
from . import units
from .cache import CachedResult, ResultCache, cache_key_v2, legacy_key


@dataclass
class PhotoRef:
    sha: str
    data: bytes
    content_type: str = "image/jpeg"


class YouCamGateway:
    def __init__(self, settings: Settings, cache: ResultCache, client: object | None = None, *,
                 provider: YouCamProvider | None = None, ledger: TaskLedger | None = None,
                 sessions: SessionStore | None = None, policy: UnitPolicy | None = None,
                 signer: TicketSigner | None = None):
        self.settings = settings
        self.cache = cache
        self.ledger = ledger or TaskLedger(settings.data_dir / "ledger.sqlite3")
        self.provider = provider or YouCamProvider(settings, client, self.ledger)
        self.sessions = sessions or SessionStore(settings.data_dir / "sessions.sqlite3")
        self.policy = policy or UnitPolicy(settings, cache, self.sessions, self.balance)
        self.signer = signer or TicketSigner(settings.resume_secret)
        self._locks: dict[str, asyncio.Lock] = {}
        self._balance: tuple[float, int | None] = (0.0, None)
        self.ledger.sweep()

    @property
    def client(self) -> object | None:
        return self.provider.client

    # keys ----------------------------------------------------------------------------
    @staticmethod
    def keys(photo_sha: str, feature: str, payload: dict, ref_shas: dict[str, str] | None = None,
             version: str = "v2.0") -> tuple[str, str]:
        """(v2 key, v1 key). Results are written under v2; v1 is read for old fixtures."""
        k2 = cache_key_v2(photo_sha, feature, version, payload, ref_shas, pipeline_version(feature))
        return k2, legacy_key(photo_sha, feature, payload, ref_shas)

    def lookup(self, photo_sha: str, feature: str, payload: dict, ref_shas: dict[str, str] | None = None,
               version: str = "v2.0") -> CachedResult | None:
        hit = self.cache.get_first(list(self.keys(photo_sha, feature, payload, ref_shas, version)))
        return hit[1] if hit else None

    def quote(self, photo_sha: str, feature: str, payload: dict, ref_shas: dict[str, str] | None = None,
              version: str = "v2.0") -> dict:
        hit = self.lookup(photo_sha, feature, payload, ref_shas, version)
        return {"feature": feature, "units": 0 if hit else units.estimate(feature, payload),
                "cached": bool(hit), "live": self.settings.live}

    # balance -------------------------------------------------------------------------
    async def balance(self, max_age_s: float = 60.0) -> int | None:
        fetched, value = self._balance
        if self.provider.client is None:
            return None
        if time.monotonic() - fetched > max_age_s or value is None:
            value = await self.provider.credit()
            self._balance = (time.monotonic(), value)
        return value

    def _spent(self, cost: int) -> None:
        if self._balance[1] is not None:
            self._balance = (self._balance[0], self._balance[1] - cost)

    # one request, blocking -------------------------------------------------------------
    def _job(self, photo: PhotoRef, feature: str, payload: dict, version: str, want_image: bool,
             refs: dict[str, PhotoRef], owner: str | None, key: str, cost: int,
             channel: str | None = None) -> Job:
        return Job(request_key=key, feature=feature, version=version, image=photo.data,
                   content_type=photo.content_type, payload=payload, want_image=want_image,
                   refs={k: (r.data, r.content_type) for k, r in refs.items()},
                   session_id=current_session(), owner_sha=owner or photo.sha, units=cost,
                   channel=channel)

    def _store(self, job: Job, outcome: object) -> CachedResult:
        data = dict(outcome.results)  # type: ignore[attr-defined]
        series = getattr(outcome, "series", None)
        if series:
            # image series (aging) are kept inside the cached JSON as base64
            data["_series"] = [{"meta": s["meta"], "image_type": s["image_type"],
                                "b64": base64.b64encode(s["image"]).decode()} for s in series]
        result = CachedResult(job.feature, job.owner_sha or "", data, job.units,
                              getattr(outcome, "image", None), getattr(outcome, "image_type", None),
                              time.time(), "live")
        self.cache.put(job.request_key, result)
        return result

    async def run(self, photo: PhotoRef, feature: str, payload: dict, *, want_image: bool = True,
                  version: str = "v2.0", refs: dict[str, PhotoRef] | None = None,
                  owner: str | None = None, channel: str | None = None) -> CachedResult:
        """`owner` is the photo a chained step belongs to, so deleting that photo deletes
        this result too. `channel` names the one caller allowed a non-styling scope
        (only "skin-match" for skin analysis, providers/youcam.py)."""
        refs = refs or {}
        ref_shas = {k: r.sha for k, r in refs.items()}
        k2, k1 = self.keys(photo.sha, feature, payload, ref_shas, version)
        lock = self._locks.setdefault(k2, asyncio.Lock())
        async with lock:
            hit = self.cache.get_first([k2, k1])
            if hit:
                return hit[1]
            if not self.settings.live or self.provider.client is None:
                raise NotInDemo(feature)
            self.provider.check(feature, channel)
            cost = units.estimate(feature, payload)
            reservation = await self.policy.acquire(current_session(), cost)
            job = self._job(photo, feature, payload, version, want_image, refs, owner, k2, cost, channel)
            try:
                outcome = await self.provider.run(job, on_late_result=self._late)
            except TaskError as exc:
                (self.policy.refund if exc.refund else self.policy.settle)(reservation)
                if exc.ambiguous:
                    raise PlumbError(502, "youcam_ambiguous", exc.message, {"request_key": k2}) from exc
                raise PlumbError(502, "youcam_" + exc.code.lower(), friendly(exc.code, exc.message)) from exc
            except PlumbError:
                self.policy.refund(reservation)
                raise
            self.policy.settle(reservation)
            self._spent(cost)
            return self._store(job, outcome)

    async def _late(self, job: Job, outcome: object) -> None:
        self._store(job, outcome)

    # one request, in the background (styling screens use this) --------------------------
    async def start(self, photo: PhotoRef, feature: str, payload: dict, *, want_image: bool = True,
                    version: str = "v2.0", refs: dict[str, PhotoRef] | None = None,
                    owner: str | None = None) -> dict:
        """Create the task and return at once with a signed ticket. The browser polls
        task_status() and keeps the ticket in sessionStorage in case the server restarts."""
        refs = refs or {}
        ref_shas = {k: r.sha for k, r in refs.items()}
        k2, k1 = self.keys(photo.sha, feature, payload, ref_shas, version)
        lock = self._locks.setdefault(k2, asyncio.Lock())
        async with lock:
            hit = self.cache.get_first([k2, k1])
            if hit:
                return {"status": "done", "request_key": hit[0], "ticket": None}
            if not self.settings.live or self.provider.client is None:
                raise NotInDemo(feature)
            self.provider.check(feature)
            cost = units.estimate(feature, payload)
            reservation = await self.policy.acquire(current_session(), cost)
            job = self._job(photo, feature, payload, version, want_image, refs, owner, k2, cost)
            try:
                task_id = await self.provider.start(job, self._late)
            except TaskError as exc:
                (self.policy.refund if exc.refund else self.policy.settle)(reservation)
                code = "youcam_ambiguous" if exc.ambiguous else "youcam_" + exc.code.lower()
                raise PlumbError(502, code, friendly(exc.code, exc.message), {"request_key": k2}) from exc
            except PlumbError:
                self.policy.refund(reservation)
                raise
            self.policy.settle(reservation)
            self._spent(cost)
            ticket = self.signer.issue(k2, task_id, feature, version, job.owner_sha or "", cost)
            done = self.cache.get(k2) is not None
            return {"status": "done" if done else "running", "request_key": k2, "ticket": ticket.to_json()}

    def task_status(self, request_key: str) -> dict:
        result = self.cache.get(request_key)
        entry = self.ledger.get(request_key)
        if result is not None:
            return {"request_key": request_key, "status": "done", "feature": result.feature}
        if entry is None:
            return {"request_key": request_key, "status": "unknown"}
        status = {CREATING: "running", CREATED: "running", SUCCEEDED: "expired"}.get(entry.status, entry.status)
        out: dict[str, str | None] = {"request_key": request_key, "status": status, "feature": entry.feature}
        if entry.status in ("failed", "ambiguous"):
            out["error"] = entry.error
        return out

    def result(self, request_key: str) -> CachedResult | None:
        return self.cache.get(request_key)

    async def resume(self, tickets: list[dict]) -> list[dict]:
        """Hand back pending tasks after a restart. Each ticket must carry a valid signature;
        a bad one is reported, never polled. Nothing is ever created here."""
        out: list[dict] = []
        for raw in tickets[:20]:
            ticket = self.signer.verify(raw)
            if ticket is None:
                out.append({"request_key": str(raw.get("request_key", ""))[:64], "status": "rejected",
                            "reason": "signature" if not self.signer.ephemeral else "server_restarted_without_secret"})
                continue
            out.append(self._resume_one(ticket))
        return out

    def _resume_one(self, ticket: Ticket) -> dict:
        if self.cache.get(ticket.request_key) is not None:
            return {"request_key": ticket.request_key, "status": "done"}
        if not self.settings.live or self.provider.client is None:
            return {"request_key": ticket.request_key, "status": "offline"}
        known = self.ledger.get(ticket.request_key)
        if known and known.status in ("failed", "ambiguous"):
            return {"request_key": ticket.request_key, "status": known.status, "error": known.error}
        if known and known.status == SUCCEEDED:
            return {"request_key": ticket.request_key, "status": "expired"}
        already_polling = self.provider.polling(ticket.task_id)
        try:
            entry = self.ledger.adopt(ticket.request_key, ticket.feature, ticket.version, ticket.task_id,
                                      session_id=current_session(), owner_sha=ticket.owner, units=ticket.units)
        except BadTransition as exc:
            return {"request_key": ticket.request_key, "status": "rejected", "reason": str(exc)}
        if known is None:
            # the server forgot this spend in the restart; count it again so today's cap stays honest
            self.cache.record_spend(ticket.units)
        if already_polling:
            return {"request_key": ticket.request_key, "status": "running"}
        job = Job(request_key=ticket.request_key, feature=ticket.feature, version=ticket.version, image=b"",
                  content_type="image/jpeg", payload={}, session_id=entry.session_id,
                  owner_sha=ticket.owner or None, units=ticket.units)
        try:
            self.provider.resume(job, ticket.task_id, self._late)
        except PlumbError as exc:
            return {"request_key": ticket.request_key, "status": "rejected", "reason": exc.code}
        return {"request_key": ticket.request_key, "status": "running"}
