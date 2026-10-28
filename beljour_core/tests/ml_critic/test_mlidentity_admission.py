"""The admission gate fails closed, and the hashed excluded list works on made-up names.

Every dataset and model name here is invented for the test.
Author: John Khan.
"""

from __future__ import annotations

import dataclasses
import hashlib
import json
from pathlib import Path

import pytest

from lab.ml.identity import (
    EXCLUDED_SHA256,
    AdmissionFormatError,
    AdmissionRecord,
    ProvenanceLink,
    admit,
    name_hash,
    name_key,
    proxy_record,
    record_from_dict,
    records_from_json,
)
from lab.ml.identity.excluded import candidate_keys, first_match, matches

MADE_UP_BANNED = "Blorpface 7K"
BANNED_HASHES = frozenset({hashlib.sha256(b"blorpface7k").hexdigest()})
CHECKSUM = hashlib.sha256(b"weights").hexdigest()


def good_record() -> AdmissionRecord:
    return AdmissionRecord(
        model_name="tidepool-embed",
        version="2.1",
        licence_id="Apache-2.0",
        commercial_use=True,
        weights_sha256=CHECKSUM,
        provenance=(
            ProvenanceLink("rendered-heads-v3", "generator", "MIT", True, "in-house renderer"),
            ProvenanceLink("rendered-heads-v3-set", "dataset", "CC0-1.0", True),
        ),
    )


def test_a_complete_commercial_record_is_admitted() -> None:
    decision = admit(good_record(), BANNED_HASHES)
    assert decision.admitted
    assert decision.reasons == ()
    assert decision.summary().startswith("ADMITTED tidepool-embed 2.1")


@pytest.mark.parametrize(
    ("change", "reason"),
    [
        ({"licence_id": "CC-BY-NC-4.0"}, "not on the commercial allowlist"),
        ({"licence_id": ""}, "licence is unknown"),
        ({"commercial_use": False}, "marked non-commercial"),
        ({"commercial_use": None}, "commercial use is unknown"),
        ({"weights_sha256": ""}, "checksum is missing"),
        ({"weights_sha256": "abc123"}, "checksum is missing"),
        ({"provenance": ()}, "provenance is missing"),
        ({"model_name": ""}, "model name is missing"),
        ({"version": " "}, "version is missing"),
        ({"role": "proxy"}, "PROXY embedders are never admitted"),
        ({"role": "judge"}, "role 'judge'"),
    ],
)
def test_each_gap_refuses(change: dict[str, object], reason: str) -> None:
    record = dataclasses.replace(good_record(), **change)  # type: ignore[arg-type]
    decision = admit(record, BANNED_HASHES)
    assert not decision.admitted
    assert any(reason in item for item in decision.reasons), decision.reasons


def test_provenance_must_name_training_data() -> None:
    code_only = (ProvenanceLink("trainer-scripts", "code", "MIT", True),)
    record = dataclasses.replace(good_record(), provenance=code_only)
    assert "names no training dataset" in admit(record, BANNED_HASHES).summary()


@pytest.mark.parametrize(
    ("link", "reason"),
    [
        (ProvenanceLink("open-set", "dataset", "CC-BY-NC-SA-4.0", True), "allowlist"),
        (ProvenanceLink("open-set", "dataset", "MIT", None), "commercial use is unknown"),
        (ProvenanceLink("open-set", "dataset", "MIT", False), "non-commercial"),
        (ProvenanceLink("", "dataset", "MIT", True), "has no name"),
        (ProvenanceLink("open-set", "rumour", "MIT", True), "kind 'rumour'"),
    ],
)
def test_every_ancestor_is_checked(link: ProvenanceLink, reason: str) -> None:
    record = dataclasses.replace(good_record(), provenance=good_record().provenance + (link,))
    decision = admit(record, BANNED_HASHES)
    assert not decision.admitted
    assert any(reason in item for item in decision.reasons), decision.reasons


def test_excluded_ancestor_refuses_even_with_clean_licence() -> None:
    banned = ProvenanceLink(MADE_UP_BANNED, "dataset", "MIT", True)
    record = dataclasses.replace(good_record(), provenance=(banned,))
    decision = admit(record, BANNED_HASHES)
    assert "excluded-data list" in decision.summary()


def test_excluded_alias_and_derivative_names_are_caught() -> None:
    alias = ProvenanceLink("heads-mix", "dataset", "MIT", True, aliases=("blorp-face-7k",))
    derived = ProvenanceLink("Blorpface-7K HQ 512px", "dataset", "MIT", True)
    for link in (alias, derived):
        record = dataclasses.replace(good_record(), provenance=(link,))
        assert not admit(record, BANNED_HASHES).admitted


def test_excluded_model_name_refuses() -> None:
    record = dataclasses.replace(good_record(), model_name="blorpface7k-net")
    assert not admit(record, BANNED_HASHES).admitted


def test_name_key_and_hash() -> None:
    assert name_key("Blorp-Face 7K!") == "blorpface7k"
    assert name_hash("BLORPFACE_7k") in BANNED_HASHES
    assert matches("the blorpface 7k set", BANNED_HASHES)
    assert not matches("blorp 7k", BANNED_HASHES)
    assert first_match(["fine", "Blorpface7K", "other"], BANNED_HASHES) == "Blorpface7K"
    assert first_match(["fine"], BANNED_HASHES) is None


def test_candidate_keys_cover_token_runs() -> None:
    keys = candidate_keys("a b-c d")
    assert {"a", "ab", "abc", "bcd", "abcd", "d"} <= set(keys)
    assert candidate_keys("") == []


def test_shipped_list_is_hashes_only() -> None:
    assert len(EXCLUDED_SHA256) >= 8
    assert all(len(item) == 64 and int(item, 16) >= 0 for item in EXCLUDED_SHA256)
    source = Path(__file__).resolve().parents[3] / "lab/ml/identity/excluded.py"
    text = source.read_text(encoding="utf-8").lower()
    assert all(item in text for item in EXCLUDED_SHA256)
    assert not matches("tidepool rendered heads", EXCLUDED_SHA256)


def test_proxy_record_is_refused_by_design() -> None:
    decision = admit(proxy_record())
    assert not decision.admitted
    assert any("PROXY" in reason for reason in decision.reasons)


def test_record_round_trips_through_dict() -> None:
    record = good_record()
    again = record_from_dict(json.loads(json.dumps(record.to_dict())))
    assert again == record


def test_missing_fields_parse_as_gaps_that_fail() -> None:
    record = record_from_dict({"model_name": "half-filled"})
    decision = admit(record, BANNED_HASHES)
    assert not decision.admitted
    assert len(decision.reasons) >= 4


@pytest.mark.parametrize(
    ("payload", "message"),
    [
        ([], None),
        ([1], "must be a JSON object"),
        ([{"commercial_use": "yes"}], "true, false or null"),
        ([{"model_name": 3}], "must be text"),
        ([{"provenance": {}}], "must be a list"),
        ([{"provenance": [5]}], "must be an object"),
        ([{"provenance": [{"aliases": "x"}]}], "aliases"),
    ],
)
def test_candidate_lists_report_bad_entries(payload: list[object], message: str | None) -> None:
    parsed = records_from_json(json.dumps(payload))
    if message is None:
        assert parsed == []
        return
    assert isinstance(parsed[0], AdmissionFormatError)
    assert message in str(parsed[0])


def test_candidate_file_must_be_a_json_list() -> None:
    with pytest.raises(AdmissionFormatError, match="not valid JSON"):
        records_from_json("{")
    with pytest.raises(AdmissionFormatError, match="JSON list"):
        records_from_json("{}")
