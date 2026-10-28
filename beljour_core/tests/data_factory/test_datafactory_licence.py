"""Licence filter: allowed, blocked, pending, unknown, flags and deny-list.

Deny-list tests use hashes of made-up source names only.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from plumb_api.data_factory.hashing import sha256_text
from plumb_api.data_factory.licence import (
    BUILTIN_DENY_HASHES,
    DEFAULT_POLICY_PATH,
    DenyList,
    LicenceFilter,
    LicencePolicy,
    PolicyError,
    build_filter,
    load_policy,
    reason_counts,
    source_hash,
    source_keys,
)
from plumb_api.data_factory.records import ImageRecord


def record(licence: str = "CC0-1.0", *, source: str = "north-studio", commercial: bool = True,
           consent: bool = True, attribution: str = "", tag: str = "a") -> ImageRecord:
    return ImageRecord(sha256_text(tag), source, licence, attribution, commercial, consent)


@pytest.fixture()
def licence_filter() -> LicenceFilter:
    policy = LicencePolicy(frozenset({"CC0-1.0", "MIT", "Own work"}),
                           frozenset({"Unverified"}), frozenset({"CC-BY-NC-4.0", "Unknown"}))
    return LicenceFilter(policy, DenyList.from_names(["Mirror Lake Faces"]))


def test_repo_policy_is_read_without_change() -> None:
    before = DEFAULT_POLICY_PATH.read_bytes()
    policy = load_policy()
    assert "CC0-1.0" in policy.allowed
    assert "CC-BY-NC-4.0" in policy.blocked
    assert DEFAULT_POLICY_PATH.read_bytes() == before


@pytest.mark.parametrize(("licence", "reason"), [
    ("CC0-1.0", "allowed"),
    ("cc0-1.0", "allowed"),
    ("CC-BY-NC-4.0", "licence-blocked"),
    ("Unverified", "licence-pending"),
    ("CC-BY-SA-9.9", "licence-unknown"),
    ("", "licence-missing"),
    ("MIT OR CC-BY-NC-4.0", "allowed"),
    ("MIT AND CC-BY-NC-4.0", "licence-blocked"),
    ("MIT AND Unverified", "licence-pending"),
    ("MIT AND Mystery-1.0", "licence-unknown"),
])
def test_licence_classes(licence_filter: LicenceFilter, licence: str, reason: str) -> None:
    decision = licence_filter.decide(record(licence))
    assert decision.reason == reason
    assert decision.kept is (reason == "allowed")


def test_flags_and_attribution(licence_filter: LicenceFilter) -> None:
    assert licence_filter.decide(record(commercial=False)).reason == "commercial-use-false"
    assert licence_filter.decide(record(consent=False)).reason == "consent-missing"
    lenient = LicenceFilter(licence_filter.policy, licence_filter.denylist, require_consent=False)
    assert lenient.decide(record(consent=False)).kept
    credit = LicenceFilter(licence_filter.policy.with_extra_allowed(["CC-BY-4.0"]),
                           licence_filter.denylist)
    assert credit.decide(record("CC-BY-4.0")).reason == "attribution-missing"
    assert credit.decide(record("CC-BY-4.0", attribution="Photo: A. Maker")).kept


def test_deny_list_matches_name_variants(licence_filter: LicenceFilter) -> None:
    for source in ("Mirror Lake Faces", "mirror  lake faces", "MIRRORLAKEFACES",
                   "mirror-lake-faces", "archive/mirror lake faces"):
        decision = licence_filter.decide(record(source=source))
        assert decision.reason == "source-denied", source
    assert licence_filter.decide(record(source="Mirror Lake Trees")).kept


def test_deny_list_token_match() -> None:
    deny = DenyList(frozenset({source_hash("quietpond")}))
    assert deny.denies("export: QuietPond / batch 3")
    assert deny.denies("quiet pond")
    assert not deny.denies("quiet ponds")
    assert source_hash("QuietPond") in source_keys("  quietpond ")


def test_deny_list_file_round_trip(tmp_path: Path) -> None:
    deny = DenyList.from_names(["Paper Moon Set"])
    path = tmp_path / "deny.json"
    path.write_text(json.dumps(deny.to_json()))
    assert DenyList.from_file(path) == deny
    path.write_text(json.dumps({"format": "other", "sha256": []}))
    with pytest.raises(PolicyError):
        DenyList.from_file(path)
    path.write_text(json.dumps({"format": "beljour-source-denylist/1", "sha256": ["zz"]}))
    with pytest.raises(PolicyError):
        DenyList.from_file(path)
    path.write_text("{broken")
    with pytest.raises(PolicyError):
        DenyList.from_file(path)


def test_builtin_list_holds_only_hashes() -> None:
    assert len(BUILTIN_DENY_HASHES) >= 10
    assert all(len(value) == 64 for value in BUILTIN_DENY_HASHES)
    assert not DenyList.builtin().denies("north-studio")


def test_extra_allowed_cannot_clear_blocked(licence_filter: LicenceFilter) -> None:
    with pytest.raises(PolicyError):
        licence_filter.policy.with_extra_allowed(["cc-by-nc-4.0"])
    with pytest.raises(PolicyError):
        licence_filter.policy.with_extra_allowed(["Unverified"])
    with pytest.raises(PolicyError):
        LicencePolicy(frozenset({"X"}), frozenset(), frozenset({"x"}))


def test_run_keeps_order_and_logs_every_decision(licence_filter: LicenceFilter) -> None:
    records = [record(tag="1"), record("GPL-3.0", tag="2"), record(tag="3"),
               record(source="Mirror Lake Faces", tag="4")]
    kept, decisions = licence_filter.run(records)
    assert [r.content_sha256 for r in kept] == [records[0].content_sha256,
                                               records[2].content_sha256]
    assert len(decisions) == 4
    assert reason_counts(decisions) == {"allowed": 2, "licence-unknown": 1, "source-denied": 1}
    assert decisions[1].to_dict()["detail"] == "licence GPL-3.0 is unknown"


def test_build_filter_reads_files(tmp_path: Path) -> None:
    policy = tmp_path / "licences.json"
    policy.write_text(json.dumps({"policy": {"allowed": ["CC0-1.0"], "pending": [],
                                             "blocked": ["Unknown"]}}))
    deny = tmp_path / "deny.json"
    deny.write_text(json.dumps(DenyList.from_names(["Glass Harbour"]).to_json()))
    built = build_filter(policy_path=policy, denylist_path=deny, extra_allowed=["CC-BY-4.0"])
    assert built.decide(record(source="glass harbour")).reason == "source-denied"
    assert built.decide(record("CC-BY-4.0", attribution="credit")).kept
    assert built.fingerprint()["deny_count"] > len(BUILTIN_DENY_HASHES)
    plain = build_filter(policy_path=policy, use_builtin_denylist=False)
    assert plain.fingerprint()["deny_count"] == 0


@pytest.mark.parametrize("content", [
    "not json", json.dumps([1]), json.dumps({"policy": {"allowed": []}}),
    json.dumps({"policy": {"allowed": "MIT"}}),
])
def test_bad_policy_files_fail(tmp_path: Path, content: str) -> None:
    path = tmp_path / "licences.json"
    path.write_text(content)
    with pytest.raises(PolicyError):
        load_policy(path)
