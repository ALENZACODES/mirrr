import unittest

from plumb_api.tickets import TicketSigner


class TicketTest(unittest.TestCase):
    def setUp(self):
        self.signer = TicketSigner("secret-1")
        self.ticket = self.signer.issue("k2abc", "task-1", "hair-color", "v2.0", "owner", 1)

    def test_round_trip(self):
        back = self.signer.verify(self.ticket.to_json())
        self.assertEqual(back, self.ticket)
        self.assertFalse(self.signer.ephemeral)

    def test_any_edit_breaks_the_signature(self):
        for field, value in (("request_key", "k2xyz"), ("task_id", "task-2"), ("feature", "hair-style"),
                             ("version", "v2.1"), ("owner", "other"), ("units", 0)):
            data = {**self.ticket.to_json(), field: value}
            self.assertIsNone(self.signer.verify(data), field)

    def test_other_secret_and_bad_shapes(self):
        self.assertIsNone(TicketSigner("secret-2").verify(self.ticket.to_json()))
        self.assertIsNone(self.signer.verify({"request_key": "x"}))
        self.assertIsNone(self.signer.verify({**self.ticket.to_json(), "sig": ""}))
        self.assertIsNone(self.signer.verify({**self.ticket.to_json(), "units": "many"}))
        self.assertIsNone(self.signer.verify({**self.ticket.to_json(), "v": 9}))

    def test_without_a_secret_tickets_only_last_one_process(self):
        a, b = TicketSigner(""), TicketSigner("")
        self.assertTrue(a.ephemeral)
        t = a.issue("k", "t", "f", "v2.0", "o", 1)
        self.assertIsNotNone(a.verify(t.to_json()))
        self.assertIsNone(b.verify(t.to_json()))


if __name__ == "__main__":
    unittest.main()
