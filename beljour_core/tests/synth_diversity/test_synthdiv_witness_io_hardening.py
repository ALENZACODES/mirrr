"""Interrupted, duplicated, nonfinite, linked and noncanonical metadata IO fails.
Author: John Khan.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance_witness_fixtures import fixture_witness_receipts
from lab.synth_diversity.stress_provenance_witness_io import (
    parse_exact,
    publish_bytes,
    read_bundle,
    read_exact,
    write_bundle,
)
from lab.synth_diversity.types import SyntheticInputError


def test_duplicate_keys_are_refused() -> None:
    with pytest.raises(SyntheticInputError, match="duplicate JSON key"):
        parse_exact(b'{"a":1,"a":2}\n')


@pytest.mark.parametrize("token", (b"NaN", b"Infinity", b"-Infinity"))
def test_nonfinite_numbers_are_refused(token: bytes) -> None:
    with pytest.raises(SyntheticInputError, match="nonfinite"):
        parse_exact(b'{"a":' + token + b"}\n")


@pytest.mark.parametrize("data", (b'{"b":1, "a":2}\n', b'{"a":1}', b"[1]\n", b"\xff\n"))
def test_noncanonical_or_non_object_documents_are_refused(data: bytes) -> None:
    with pytest.raises(SyntheticInputError):
        parse_exact(data)


def test_linked_and_oversized_documents_are_refused(tmp_path: Path) -> None:
    real = tmp_path / "real.json"
    real.write_bytes(b'{"a":1}\n')
    link = tmp_path / "link.json"
    link.symlink_to(real)
    with pytest.raises(SyntheticInputError, match="linked"):
        read_exact(link)
    with pytest.raises(SyntheticInputError, match="size"):
        read_exact(real, limit=3)


def test_unsorted_bundle_is_refused(tmp_path: Path) -> None:
    receipts = fixture_witness_receipts()
    path = tmp_path / "b.json"
    rows = [item.to_dict() for item in reversed(receipts)]
    document = {"format": 1, "schema": "S21-WITNESS-BUNDLE", "receipts": rows}
    path.write_text(json.dumps(document, sort_keys=True, separators=(",", ":")) + "\n")
    with pytest.raises(SyntheticInputError, match="canonical order"):
        read_bundle(path)


def test_failed_publication_leaves_no_staged_files(tmp_path: Path,
                                                   monkeypatch: pytest.MonkeyPatch) -> None:
    def refuse(source: object, target: object) -> None:
        raise FileExistsError("simulated race")

    monkeypatch.setattr(os, "link", refuse)
    with pytest.raises(SyntheticInputError, match="appeared"):
        publish_bytes(tmp_path / "x.json", b"{}\n")
    assert list(tmp_path.iterdir()) == []


def test_interrupted_write_leaves_no_target(tmp_path: Path,
                                            monkeypatch: pytest.MonkeyPatch) -> None:
    def crash(handle: int) -> None:
        raise OSError("simulated disk failure")

    monkeypatch.setattr(os, "fsync", crash)
    with pytest.raises(OSError):
        write_bundle(tmp_path / "bundle.json", fixture_witness_receipts())
    assert list(tmp_path.iterdir()) == []


def test_symlinked_target_name_is_refused(tmp_path: Path) -> None:
    (tmp_path / "dangling.json").symlink_to(tmp_path / "nowhere.json")
    with pytest.raises(SyntheticInputError, match="already exists"):
        publish_bytes(tmp_path / "dangling.json", b"{}\n")
