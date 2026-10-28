"""Unit policy: every live call asks here first, and nothing is spent if the answer is no.

Checks, in order, each with its own reason code in the error:
  kill_switch    BELJOUR_KILL_SWITCH=1 stops all live calls
  session_cap    this browser session has used its share (6 public, 40 with a judge code)
  daily_cap      today's share of units is used
  balance_floor  the call would take the live YouCam balance below the floor (200)

Units are reserved when a call is allowed and refunded if the call definitely did not
happen (YouCam refused it, or it never left this server). An ambiguous call keeps its
reservation, because it may have been charged.

Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import date
from typing import Protocol

from .config import Settings
from .errors import BudgetExceeded
from .sessions import SessionStore


class SpendBook(Protocol):
    """What limits.py needs from the cache's daily ledger. ResultCache implements it."""

    def spent_on(self, day: date | None = None) -> int: ...

    def record_spend(self, units: int, day: date | None = None) -> None: ...


@dataclass
class Reservation:
    session_id: str
    units: int
    day: date
    settled: bool = False


MESSAGES = {
    "kill_switch": "Live results are switched off right now, so the app is showing saved examples only.",
    "session_cap": "This visit has used its share of live results. Saved examples still work, and a judge code raises the limit.",
    "daily_cap": "Today's share of live results is used up, so the app shows saved examples until tomorrow.",
    "balance_floor": "The units kept back for judging are protected, so live results are paused.",
}


class UnitPolicy:
    def __init__(self, settings: Settings, book: SpendBook, sessions: SessionStore,
                 balance: Callable[[], Awaitable[int | None]],
                 today: Callable[[], date] = date.today):
        self.settings = settings
        self.book = book
        self.sessions = sessions
        self._balance = balance
        self._today = today
        self.inflight = 0

    def session_cap(self, session_id: str) -> int | None:
        """None means no per-session cap."""
        if self.sessions.is_judge(session_id):
            return self.settings.session_cap_judge or None
        return self.settings.session_cap_public or None

    def _refuse(self, reason: str, **detail: object) -> BudgetExceeded:
        return BudgetExceeded(MESSAGES[reason], {"reason": reason, **detail})

    async def acquire(self, session_id: str, cost: int) -> Reservation:
        """Check everything, then reserve. No await happens between the cap checks and the
        reservation, so two requests on the same event loop can't both squeeze under a cap."""
        if self.settings.kill_switch:
            raise self._refuse("kill_switch", cost=cost)
        balance = await self._balance()
        cap = self.session_cap(session_id)
        used = self.sessions.spent(session_id)
        if cap is not None and used + cost > cap:
            raise self._refuse("session_cap", spent=used, cap=cap, cost=cost,
                               judge=self.sessions.is_judge(session_id))
        day = self._today()
        today = self.book.spent_on(day)
        if today + cost > self.settings.daily_unit_cap:
            raise self._refuse("daily_cap", spent_today=today, daily_cap=self.settings.daily_unit_cap, cost=cost)
        if balance is not None and balance - self.inflight - cost < self.settings.unit_reserve:
            raise self._refuse("balance_floor", balance=balance, reserve=self.settings.unit_reserve,
                               cost=cost, inflight=self.inflight)
        self.sessions.add_spend(session_id, cost)
        self.book.record_spend(cost, day)
        self.inflight += cost
        return Reservation(session_id, cost, day)

    def settle(self, reservation: Reservation) -> None:
        """The call happened (or may have). The reservation stands as spend."""
        if reservation.settled:
            return
        reservation.settled = True
        self.inflight = max(0, self.inflight - reservation.units)

    def refund(self, reservation: Reservation) -> None:
        """The call definitely didn't happen. Give the units back to the session and the day."""
        if reservation.settled:
            return
        reservation.settled = True
        self.inflight = max(0, self.inflight - reservation.units)
        self.sessions.add_spend(reservation.session_id, -reservation.units)
        self.book.record_spend(-reservation.units, reservation.day)

    def status(self, session_id: str) -> dict:
        cap = self.session_cap(session_id)
        used = self.sessions.spent(session_id)
        return {
            "session": session_id,
            "anonymous": session_id == "anonymous",
            "judge": self.sessions.is_judge(session_id),
            "spent": used,
            "cap": cap,
            "remaining": None if cap is None else max(0, cap - used),
            "kill_switch": self.settings.kill_switch,
            "daily_cap": self.settings.daily_unit_cap,
            "spent_today": self.book.spent_on(self._today()),
        }
