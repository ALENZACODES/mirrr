import asyncio
import unittest

from plumb_api.session_ctx import SessionMiddleware, current_session, session_from_headers
from plumb_api.sessions import ANONYMOUS

GOOD = "abcdEFGH1234_-xyzABC"


def http_scope(headers):
    return {"type": "http", "headers": [(k.encode(), v.encode()) for k, v in headers]}


class MiddlewareTest(unittest.TestCase):
    def call(self, scope):
        seen = {}
        touched = []

        async def app(scope, receive, send):
            seen["session"] = current_session()

        async def receive():
            return {}

        async def send(_msg):
            return None

        mw = SessionMiddleware(app, on_session=touched.append)
        asyncio.run(mw(scope, receive, send))
        return seen.get("session"), touched

    def test_header_sets_the_session(self):
        session, touched = self.call(http_scope([("X-Beljour-Session", GOOD)]))
        self.assertEqual(session, GOOD)
        self.assertEqual(touched, [GOOD])

    def test_missing_or_bad_header_is_anonymous(self):
        self.assertEqual(self.call(http_scope([]))[0], ANONYMOUS)
        session, touched = self.call(http_scope([("x-beljour-session", "bad id!")]))
        self.assertEqual((session, touched), (ANONYMOUS, []))

    def test_context_is_reset_after_the_request(self):
        self.call(http_scope([("x-beljour-session", GOOD)]))
        self.assertEqual(current_session(), ANONYMOUS)

    def test_other_scopes_pass_through(self):
        session, touched = self.call({"type": "lifespan"})
        self.assertEqual((session, touched), (ANONYMOUS, []))

    def test_header_lookup_is_case_insensitive(self):
        self.assertEqual(session_from_headers([(b"X-BELJOUR-SESSION", GOOD.encode())]), GOOD)


if __name__ == "__main__":
    unittest.main()
