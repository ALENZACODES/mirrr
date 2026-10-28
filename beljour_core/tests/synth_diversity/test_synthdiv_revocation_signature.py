"""Only a trusted rights signer can issue a revocation snapshot.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace
from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_receipts import (
    TrustRoot,
    WitnessReceipt,
    sign_receipt,
)
from lab.synth_diversity.stress_provenance_replay_fixtures import (
    signed_snapshot,
    snapshot_for,
    world_inventory,
)
from lab.synth_diversity.stress_provenance_revocation import (
    REVOCATION_SUBJECT,
    RevocationSnapshot,
    sign_snapshot,
    verify_snapshot,
)
from lab.synth_diversity.stress_provenance_stream_fixtures import StreamWorld, build_world
from lab.synth_diversity.stress_provenance_witness_fixtures import fictional_key, fixture_root
from lab.synth_diversity.types import SyntheticInputError


def verify(world: StreamWorld, receipt: WitnessReceipt) -> RevocationSnapshot:
    return verify_snapshot(receipt, world.trust, world.now, 1, world_inventory(world),
                           world.roster.digest)


def test_rights_signed_snapshot_verifies(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    assert verify(world, signed_snapshot(world, ("own-0002",)))


def test_render_or_source_roots_cannot_sign_revocations(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    snapshot = snapshot_for(world, ("own-0002",))
    for role in ("render", "source"):
        with pytest.raises(SyntheticInputError, match="rights-role"):
            sign_snapshot(fixture_root(role), snapshot, world.now - 1, world.now + 10)
        forged = sign_receipt(fixture_root(role), REVOCATION_SUBJECT, snapshot.claim(),
                              world.now - 1, world.now + 10)
        with pytest.raises(SyntheticInputError, match="expected a rights receipt"):
            verify(world, forged)


def test_untrusted_rights_issuer_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    rogue = TrustRoot("rights", "producer-self-signed", fictional_key("rights", "rogue"))
    receipt = sign_snapshot(rogue, snapshot_for(world, ()), world.now - 1, world.now + 10)
    with pytest.raises(SyntheticInputError, match="not trusted"):
        verify(world, receipt)


def test_tampered_revoked_list_breaks_signature(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    receipt = signed_snapshot(world, ("own-0002",))
    claim = {**receipt.claim, "revoked": []}
    with pytest.raises(SyntheticInputError, match="bad signature"):
        verify(world, replace(receipt, claim=claim))


def test_expired_snapshot_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    receipt = signed_snapshot(world, (), issued_at=world.now - 40 * 86_400)
    with pytest.raises(SyntheticInputError, match="not current"):
        verify(world, receipt)


def test_wrong_subject_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    receipt = sign_receipt(fixture_root("rights"), "approval", snapshot_for(world, ()).claim(),
                           world.now - 1, world.now + 10)
    with pytest.raises(SyntheticInputError, match="subject"):
        verify(world, receipt)
