"""Photo replacements and stale evidence must not mix command lock receipts.

Generated pixel cases only. Public reports never include photo fingerprints.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from plumb_api.commands.embedders import DeterministicTestEmbedder
from plumb_api.commands.errors import CommandUnavailable, CommandValidationError
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.identity import IdentityGuard
from plumb_api.commands.observed_ledger import ObservationTicket, ObservedLockLedger
from plumb_api.commands.observed_lock import LockCaptureOptions
from plumb_api.commands.pro_plan import parse_pro_commands
from plumb_api.commands.r2h_session import R2HSession


def photo(offset: int = 1) -> ImageFrame:
    values = np.arange(22 * 24 * 3, dtype=np.uint32)
    pixels = np.asarray((values * 13 + offset * 17) % 256, dtype=np.uint8)
    return ImageFrame(22, 24, 3, pixels.tobytes())


def capture(ledger: ObservedLockLedger, frame: ImageFrame, level: str = "2.0") -> None:
    guard = IdentityGuard(DeterministicTestEmbedder(), allow_test_embedder=True)
    session = R2HSession(identity=guard)
    session.open_photo(frame)
    plan = parse_pro_commands(f"/cleanup {level}")
    preview = session.run(plan, quality="preview")
    output = session.run(plan, quality="export")
    ledger.observe(ledger.ticket(), frame, preview, output,
                   options=LockCaptureOptions(checked_protected_regions=True))


def test_photo_open_and_clear_are_atomic() -> None:
    ledger = ObservedLockLedger()
    source = photo()
    with pytest.raises(CommandUnavailable):
        ledger.ticket()
    ticket = ledger.open_photo(source)
    assert ticket.revision == 1
    capture(ledger, source)
    state = ledger.state
    assert state.open
    assert state.observed == 1
    assert state.commands_observed == 1
    assert state.levels_missing == 204
    assert ledger.report().status == "incomplete"
    ledger.close_photo()
    assert not ledger.state.open
    assert ledger.state.observed == 0
    assert ledger.state.revision == 2
    with pytest.raises(CommandUnavailable):
        ledger.report()


def test_repeated_level_refused_without_mutation() -> None:
    ledger = ObservedLockLedger()
    source = photo()
    ledger.open_photo(source)
    capture(ledger, source)
    initial = ledger.snapshot()
    with pytest.raises(CommandValidationError, match="already"):
        capture(ledger, source)
    assert ledger.snapshot() == initial


def test_two_distinct_levels_sorted() -> None:
    ledger = ObservedLockLedger()
    source = photo()
    ledger.open_photo(source)
    capture(ledger, source, "4.0")
    capture(ledger, source, "1.0")
    assert [row.level_tenths for row in ledger.snapshot()] == [10, 40]
    assert ledger.state.observed == 2


def test_replacing_photo_revokes_old_tickets() -> None:
    ledger = ObservedLockLedger()
    one = photo(2)
    two = photo(4)
    old = ledger.open_photo(one)
    ledger.open_photo(two)
    assert ledger.state.observed == 0
    with pytest.raises(CommandUnavailable, match="changed"):
        ledger._check_ticket(old, two)
    with pytest.raises(CommandUnavailable, match="different"):
        ledger._check_ticket(ledger.ticket(), one)
    assert ledger.report().status == "incomplete"


def test_same_image_reopen_still_revokes_ticket() -> None:
    ledger = ObservedLockLedger()
    source = photo()
    original = ledger.open_photo(source)
    ledger.open_photo(source)
    with pytest.raises(CommandUnavailable, match="changed"):
        ledger._check_ticket(original, source)


def test_duplicate_receipt_after_replacing_photo_not_seen() -> None:
    ledger = ObservedLockLedger()
    source = photo()
    ledger.open_photo(source)
    capture(ledger, source)
    ledger.open_photo(photo(5))
    assert ledger.snapshot() == ()
    assert ledger.state.commands_observed == 0


def test_stale_invalid_tickets_do_not_commit() -> None:
    ledger = ObservedLockLedger()
    source = photo()
    ticket = ledger.open_photo(source)
    with pytest.raises(CommandUnavailable):
        ledger._check_ticket(replace(ticket, revision=ticket.revision + 1), source)
    with pytest.raises(CommandValidationError):
        ledger._check_ticket(3, source)
    assert ledger.state.observed == 0


def test_snapshot_does_not_contain_frame_or_digest() -> None:
    ledger = ObservedLockLedger()
    source = photo()
    ledger.open_photo(source)
    capture(ledger, source)
    text = str(ledger.state.public_metadata()) + str(ledger.report().public_metadata())
    assert "pixels" not in text
    assert "digest" not in text
    assert "model_id" not in text
    assert "sha256" not in text
    assert "name" in text
    assert "release_qualified" in text
    assert not ledger.report().release_qualified


def test_ticket_type_is_validated() -> None:
    ledger = ObservedLockLedger()
    source = photo()
    ledger.open_photo(source)
    with pytest.raises(CommandValidationError):
        ledger._check_ticket(ObservationTicket('bad'), source)


def test_invalid_photo_is_refused() -> None:
    ledger = ObservedLockLedger()
    with pytest.raises(CommandValidationError):
        ledger.open_photo('not a frame')
