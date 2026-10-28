"""Source signature roles, issuers, expiry and roster binding gate stream trust.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace
from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_receipts import TrustRoot, TrustStore
from lab.synth_diversity.stress_provenance_stream_fixtures import build_world
from lab.synth_diversity.stress_provenance_stream_io import open_stream, verify_source
from lab.synth_diversity.stress_provenance_witness_fixtures import (
    fictional_key,
    fixture_root,
    fixture_trust,
)
from lab.synth_diversity.types import SyntheticInputError


def test_valid_source_signature_is_accepted(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    verify_source(open_stream(world.stream), world.trust, world.roster.digest, world.now)


def test_stream_for_another_roster_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    with pytest.raises(SyntheticInputError, match="different frozen roster"):
        verify_source(open_stream(world.stream), world.trust, "0" * 64, world.now)


def test_missing_source_role_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    trust = fixture_trust(("render", "rights", "overlap"))
    with pytest.raises(SyntheticInputError, match="not trusted"):
        verify_source(open_stream(world.stream), trust, world.roster.digest, world.now)


def test_rotated_source_key_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    rotated = TrustStore([fixture_root("render"), fixture_root("rights"),
                          fixture_root("overlap"),
                          TrustRoot("source", fixture_root("source").issuer,
                                    fictional_key("source", "rotated"))])
    with pytest.raises(SyntheticInputError, match="bad signature"):
        verify_source(open_stream(world.stream), rotated, world.roster.digest, world.now)


def test_expired_source_signature_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    with pytest.raises(SyntheticInputError, match="not current"):
        verify_source(open_stream(world.stream), world.trust, world.roster.digest,
                      world.now + 30 * 86_400)


def test_signature_must_cover_header_counts(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    header = replace(open_stream(world.stream), rows=6)
    with pytest.raises(SyntheticInputError, match="does not cover"):
        verify_source(header, world.trust, world.roster.digest, world.now)


def test_source_subject_is_fixed(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    header = open_stream(world.stream)
    moved = replace(header, source=replace(header.source, subject="other"))
    with pytest.raises(SyntheticInputError, match="subject"):
        verify_source(moved, world.trust, world.roster.digest, world.now)
