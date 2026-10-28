import tempfile
import unittest
from pathlib import Path

from plumb_api.ledger import (
    AMBIGUOUS,
    CREATED,
    CREATING,
    FAILED,
    SUCCEEDED,
    BadTransition,
    LedgerConflict,
    TaskLedger,
)


class Clock:
    def __init__(self, t: float = 1000.0):
        self.t = t

    def __call__(self) -> float:
        return self.t


class LedgerTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.clock = Clock()
        self.path = Path(self.tmp.name) / "ledger.sqlite3"
        self.ledger = TaskLedger(self.path, clock=self.clock)

    def tearDown(self):
        self.ledger.close()
        self.tmp.cleanup()

    def test_begin_writes_creating_before_any_call(self):
        e = self.ledger.begin("k1", "makeup-vto", "v2.0", session_id="s", owner_sha="o", units=1)
        self.assertEqual((e.status, e.task_id, e.attempts, e.units), (CREATING, None, 1, 1))
        self.assertTrue(e.open)

    def test_open_entry_blocks_a_second_create(self):
        self.ledger.begin("k1", "makeup-vto", "v2.0")
        with self.assertRaises(LedgerConflict) as ctx:
            self.ledger.begin("k1", "makeup-vto", "v2.0")
        self.assertEqual(ctx.exception.entry.status, CREATING)
        self.ledger.created("k1", "T1")
        with self.assertRaises(LedgerConflict) as ctx:
            self.ledger.begin("k1", "makeup-vto", "v2.0")
        self.assertEqual(ctx.exception.entry.task_id, "T1")

    def test_finished_entry_can_run_again(self):
        self.ledger.begin("k1", "makeup-vto", "v2.0")
        self.ledger.created("k1", "T1")
        self.ledger.succeeded("k1")
        again = self.ledger.begin("k1", "makeup-vto", "v2.0")
        self.assertEqual((again.status, again.attempts, again.task_id), (CREATING, 2, None))
        self.ledger.failed("k1", "refused")
        self.assertEqual(self.ledger.begin("k1", "makeup-vto", "v2.0").attempts, 3)

    def test_transitions_are_checked(self):
        self.ledger.begin("k1", "f", "v2.0")
        with self.assertRaises(BadTransition):
            self.ledger.succeeded("k1")          # never created
        with self.assertRaises(BadTransition):
            self.ledger.created("k1", "")        # needs a task id
        with self.assertRaises(BadTransition):
            self.ledger.failed("missing", "x")

    def test_ambiguous_is_never_retried_until_cleared(self):
        self.ledger.begin("k1", "f", "v2.0")
        self.ledger.ambiguous("k1", "reply lost")
        with self.assertRaises(LedgerConflict) as ctx:
            self.ledger.begin("k1", "f", "v2.0")
        self.assertEqual(ctx.exception.entry.status, AMBIGUOUS)
        with self.assertRaises(BadTransition):
            self.ledger.created("k1", "T1")
        cleared = self.ledger.clear("k1", "no charge found")
        self.assertEqual((cleared.status, cleared.error), (FAILED, "no charge found"))
        self.assertEqual(self.ledger.begin("k1", "f", "v2.0").status, CREATING)

    def test_only_ambiguous_or_creating_can_be_cleared(self):
        self.ledger.begin("k1", "f", "v2.0")
        self.ledger.created("k1", "T1")
        with self.assertRaises(BadTransition):
            self.ledger.clear("k1")
        with self.assertRaises(BadTransition):
            self.ledger.clear("nope")

    def test_task_ids_are_unique(self):
        self.ledger.begin("k1", "f", "v2.0")
        self.ledger.created("k1", "T1")
        self.ledger.begin("k2", "f", "v2.0")
        with self.assertRaises(Exception):
            self.ledger.created("k2", "T1")
        self.assertEqual(self.ledger.by_task_id("T1").request_key, "k1")

    def test_ledger_survives_a_restart(self):
        self.ledger.begin("k1", "makeup-vto", "v2.0", session_id="s1")
        self.ledger.created("k1", "T1")
        self.ledger.close()
        reopened = TaskLedger(self.path, clock=self.clock)
        entry = reopened.get("k1")
        self.assertEqual((entry.status, entry.task_id, entry.session_id), (CREATED, "T1", "s1"))
        self.assertEqual([e.request_key for e in reopened.pending("s1")], ["k1"])
        self.ledger = reopened

    def test_adopt_after_the_disk_was_wiped(self):
        e = self.ledger.adopt("k9", "hair-color", "v2.0", "T9", session_id="s", owner_sha="o", units=1)
        self.assertEqual((e.status, e.task_id, e.error), (CREATED, "T9", "adopted after restart"))
        self.assertEqual(self.ledger.adopt("k9", "hair-color", "v2.0", "T9").status, CREATED)  # idempotent
        with self.assertRaises(BadTransition):
            self.ledger.adopt("k9", "hair-color", "v2.0", "OTHER")
        with self.assertRaises(BadTransition):
            self.ledger.adopt("k10", "hair-color", "v2.0", "T9")  # task belongs to k9

    def test_adopt_completes_an_interrupted_create(self):
        self.ledger.begin("k1", "f", "v2.0")
        self.assertEqual(self.ledger.adopt("k1", "f", "v2.0", "T1").status, CREATED)

    def test_sweep_marks_interrupted_creates_ambiguous(self):
        self.ledger.begin("old", "f", "v2.0")
        self.clock.t += 700
        self.ledger.begin("new", "f", "v2.0")
        self.assertEqual(self.ledger.sweep(older_than_s=600), 1)
        self.assertEqual(self.ledger.get("old").status, AMBIGUOUS)
        self.assertEqual(self.ledger.get("new").status, CREATING)

    def test_prune_keeps_open_entries(self):
        for key, end in (("done", SUCCEEDED), ("bad", FAILED), ("open", CREATED)):
            self.ledger.begin(key, "f", "v2.0")
            if end in (SUCCEEDED, CREATED):
                self.ledger.created(key, f"T-{key}")
            if end == SUCCEEDED:
                self.ledger.succeeded(key)
            if end == FAILED:
                self.ledger.failed(key, "x")
        self.clock.t += 10_000
        self.assertEqual(self.ledger.prune(older_than_s=5_000), 2)
        self.assertEqual([e.request_key for e in self.ledger.entries()], ["open"])

    def test_counts_and_json(self):
        self.ledger.begin("k1", "f", "v2.0", units=2)
        counts = self.ledger.counts()
        self.assertEqual(counts[CREATING], 1)
        self.assertEqual(counts[SUCCEEDED], 0)
        self.assertEqual(self.ledger.get("k1").to_json()["units"], 2)
        self.assertEqual(self.ledger.entries(status=CREATING)[0].request_key, "k1")


if __name__ == "__main__":
    unittest.main()
