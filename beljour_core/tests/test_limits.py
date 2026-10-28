import asyncio
import tempfile
import unittest
from datetime import date
from pathlib import Path

from plumb_api.config import Settings, load_settings
from plumb_api.errors import BudgetExceeded
from plumb_api.limits import UnitPolicy
from plumb_api.sessions import (
    ANONYMOUS,
    SessionStore,
    hash_code,
    make_judge_code,
    new_session_id,
    valid_session_id,
)
from plumb_api.youcam.cache import ResultCache

SESSION = "s" * 20
OTHER = "o" * 20


class SessionStoreTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.store = SessionStore(Path(self.tmp.name) / "sessions.sqlite3")

    def tearDown(self):
        self.tmp.cleanup()

    def test_ids(self):
        self.assertTrue(valid_session_id(new_session_id()))
        self.assertFalse(valid_session_id("short"))
        self.assertFalse(valid_session_id("x" * 20 + "!"))
        self.assertFalse(valid_session_id(None))

    def test_spend_and_refund_never_go_negative(self):
        self.assertEqual(self.store.add_spend(SESSION, 3), 3)
        self.assertEqual(self.store.add_spend(SESSION, -5), 0)
        self.assertEqual(self.store.spent(OTHER), 0)

    def test_judge_code(self):
        code = make_judge_code()
        self.assertRegex(code, r"^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$")
        hashes = (hash_code(code),)
        self.assertEqual(hash_code(" " + code.lower() + " "), hashes[0])
        wrong = self.store.try_judge_code(SESSION, "nope", hashes, 3)
        self.assertEqual((wrong.ok, wrong.attempts_left, wrong.locked), (False, 2, False))
        right = self.store.try_judge_code(SESSION, code, hashes, 3)
        self.assertTrue(right.ok)
        self.assertTrue(self.store.is_judge(SESSION))
        again = self.store.try_judge_code(SESSION, "whatever", hashes, 3)
        self.assertTrue(again.ok)   # already a judge session

    def test_lockout_after_too_many_wrong_codes(self):
        hashes = (hash_code("RIGHT-CODE"),)
        for _ in range(2):
            self.store.try_judge_code(SESSION, "bad", hashes, 2)
        locked = self.store.try_judge_code(SESSION, "RIGHT-CODE", hashes, 2)
        self.assertEqual((locked.ok, locked.locked), (False, True))
        self.assertFalse(self.store.is_judge(SESSION))

    def test_empty_code_and_anonymous_never_pass(self):
        hashes = (hash_code(""),)
        self.assertFalse(self.store.try_judge_code(SESSION, "  ", hashes, 5).ok)
        self.assertTrue(self.store.try_judge_code(ANONYMOUS, "x", (hash_code("x"),), 5).locked)

    def test_prune(self):
        clock = [100.0]
        store = SessionStore(Path(self.tmp.name) / "p.sqlite3", clock=lambda: clock[0])
        store.touch(SESSION)
        clock[0] += 1000
        store.touch(OTHER)
        self.assertEqual(store.prune(idle_s=500), 1)


class PolicyTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        tmp = Path(self.tmp.name)
        self.book = ResultCache(tmp / "cache")
        self.sessions = SessionStore(tmp / "sessions.sqlite3")
        self.balance_value: int | None = None

    def tearDown(self):
        self.tmp.cleanup()

    def policy(self, **kw) -> UnitPolicy:
        async def balance():
            return self.balance_value
        settings = Settings(data_dir=Path(self.tmp.name), **kw)
        return UnitPolicy(settings, self.book, self.sessions, balance, today=lambda: date(2026, 10, 22))

    def acquire(self, policy, session, cost):
        return asyncio.run(policy.acquire(session, cost))

    def reason(self, policy, session, cost) -> str:
        with self.assertRaises(BudgetExceeded) as ctx:
            self.acquire(policy, session, cost)
        self.assertEqual(ctx.exception.status, 402)
        return ctx.exception.detail["reason"]

    def test_public_session_cap(self):
        p = self.policy(session_cap_public=6)
        for _ in range(3):
            self.acquire(p, SESSION, 2)
        self.assertEqual(self.reason(p, SESSION, 1), "session_cap")
        self.acquire(p, OTHER, 2)   # another session has its own share
        self.assertEqual(p.status(SESSION)["remaining"], 0)

    def test_judge_session_gets_the_higher_cap(self):
        p = self.policy(session_cap_public=6, session_cap_judge=40,
                        judge_code_hashes=(hash_code("JUDGE-1"),))
        self.sessions.try_judge_code(SESSION, "JUDGE-1", p.settings.judge_code_hashes, 5)
        self.acquire(p, SESSION, 20)
        self.acquire(p, SESSION, 20)
        self.assertEqual(self.reason(p, SESSION, 1), "session_cap")
        status = p.status(SESSION)
        self.assertEqual((status["judge"], status["cap"], status["spent"]), (True, 40, 40))

    def test_zero_cap_turns_the_session_cap_off(self):
        p = self.policy(session_cap_public=0)
        self.acquire(p, ANONYMOUS, 30)
        self.assertIsNone(p.status(ANONYMOUS)["cap"])

    def test_daily_cap(self):
        p = self.policy(session_cap_public=0, daily_unit_cap=5)
        self.acquire(p, SESSION, 4)
        self.assertEqual(self.reason(p, OTHER, 2), "daily_cap")
        self.assertEqual(self.book.spent_on(date(2026, 10, 22)), 4)

    def test_balance_floor_counts_calls_in_flight(self):
        self.balance_value = 205
        p = self.policy(session_cap_public=0, unit_reserve=200)
        r = self.acquire(p, SESSION, 3)
        self.assertEqual(p.inflight, 3)
        self.assertEqual(self.reason(p, SESSION, 3), "balance_floor")
        p.settle(r)
        self.assertEqual(p.inflight, 0)

    def test_kill_switch_stops_everything(self):
        p = self.policy(kill_switch=True)
        self.assertEqual(self.reason(p, SESSION, 1), "kill_switch")
        self.assertEqual(self.sessions.spent(SESSION), 0)

    def test_refund_gives_units_back_once(self):
        p = self.policy(session_cap_public=6)
        r = self.acquire(p, SESSION, 2)
        p.refund(r)
        p.refund(r)
        self.assertEqual(self.sessions.spent(SESSION), 0)
        self.assertEqual(self.book.spent_on(date(2026, 10, 22)), 0)

    def test_settled_reservation_stays_spent(self):
        p = self.policy(session_cap_public=6)
        r = self.acquire(p, SESSION, 2)
        p.settle(r)
        p.refund(r)   # too late: settled
        self.assertEqual(self.sessions.spent(SESSION), 2)

    def test_two_requests_cannot_both_squeeze_under_the_cap(self):
        p = self.policy(session_cap_public=2)

        async def both():
            return await asyncio.gather(p.acquire(SESSION, 2), p.acquire(SESSION, 2), return_exceptions=True)

        results = asyncio.run(both())
        self.assertEqual(sum(isinstance(r, BudgetExceeded) for r in results), 1)


class SettingsTest(unittest.TestCase):
    def test_beljour_names_win_and_plumb_names_still_work(self):
        s = load_settings({"PLUMB_DAILY_UNIT_CAP": "9", "BELJOUR_SESSION_CAP": "4",
                           "BELJOUR_JUDGE_CODE_HASHES": f"sha256:{'a' * 64}, nothex, {'B' * 64}",
                           "BELJOUR_KILL_SWITCH": "1", "PLUMB_UNIT_RESERVE": "180", "BELJOUR_BALANCE_FLOOR": "210",
                           "YOUCAM_API_KEY": "k", "BELJOUR_YOUCAM_STYLING": "0"})
        self.assertEqual((s.daily_unit_cap, s.session_cap_public, s.unit_reserve), (9, 4, 210))
        self.assertEqual(s.judge_code_hashes, ("a" * 64, "b" * 64))
        self.assertTrue(s.kill_switch)
        self.assertFalse(s.live)    # styling flag off means no live calls at all

    def test_defaults_follow_the_plan(self):
        s = load_settings({})
        self.assertEqual((s.unit_reserve, s.session_cap_public, s.session_cap_judge), (200, 6, 40))
        self.assertTrue(s.youcam_styling)
        self.assertFalse(s.youcam_legacy)
        self.assertFalse(s.live)


if __name__ == "__main__":
    unittest.main()
