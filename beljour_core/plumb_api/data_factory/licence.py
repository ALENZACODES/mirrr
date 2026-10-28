"""Licence filter: keep only images whose licence allows commercial use.

The allowed, pending and blocked lists come from the repo's licences.json
policy, which is read and never written. Anything not on the allowed list is
rejected, including missing and unknown licences. Sources can be excluded by a
deny-list of SHA-256 hashes of lower-cased names, so no excluded name has to
appear in code or config. Every image gets one decision record with a reason.
Author: John Khan.
"""

from __future__ import annotations

import json
import re
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from functools import cached_property
from pathlib import Path
from typing import Any

from .hashing import is_sha256, sha256_text
from .records import ImageRecord

DENYLIST_FORMAT = "beljour-source-denylist/1"
REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_POLICY_PATH = REPO_ROOT / "licences.json"

# Built-in source deny-list: hashes of lower-cased names, plain and compact
# (letters and digits only). It covers the face sets the project never uses.
BUILTIN_DENY_HASHES: frozenset[str] = frozenset({
    "05b51cd752cdeada1f67c04b2affb134b28e1e06280eb20ec952271128a833cd",
    "23474691185a3958de0b423f82219ac901909e4c0bc2d2c8136f851ac15392ea",
    "275ea83cd1d51e9c371f7c84ebc3f68ebbc6b878b0176877362236f15a691005",
    "3ddf51a6861778a1315ab4c79ef21ab043bd0f3c9ef97651e8a567e0611c23c2",
    "493e7b16a96fe4682079fae9ec6bec46dc0170494c3034d52ff593db948e08c1",
    "4ef693924aabc7fbf3108ac1a9c75c0a35e4e864abd8171649647c569644212e",
    "711a60b402c3d778c0f5d69b9cd56c2aac033ee3de599a16c1be2ed7a0a4c128",
    "73b29fe0ffd650e62a09cdf8f647ec1f17a87a22e7ad761c53b4f6b2353403ed",
    "a79704900ead0f938f8ba9805080333012790aa5dfa8f5b87aed8d49313cccc4",
    "b135d717a2a9a9aa2ff032bd0e0d12f2cc9a0d4966debf197f536c44daabf359",
    "be47429c3d8b0bc8a5dace57fa5f15e74998199a35242eae768f9efb5f679ca0",
    "d4259ab44bc6dbc9b58a09bcebd18f38ec3a1e405a18e1983fbaa393883d398b",
    "d7348390cb2bf4e67554fd5564ef1aa213aa3e722a10670d03af3280c41c7340",
    "def87070670bf325d3f2de33e3d101117ce4c929825a194dce2f56f20a8a7c03",
    "e26f765e274fe6f7dd6aa2570ef0b2f43df3bf82c887700833559f7ea8750f01",
    "fe15e769e7732611df0761569d3e07638386aa73e93ce3f857fdcdc036a37414",
})

# Image licences that need a credit line to be usable commercially.
ATTRIBUTION_PREFIXES = ("CC-BY-",)
TOKEN_SPLIT = re.compile(r"[\s/:|,;()\[\]]+")
MAX_TOKENS = 16

KEPT = "allowed"
REASON_DENIED = "source-denied"
REASON_MISSING = "licence-missing"
REASON_BLOCKED = "licence-blocked"
REASON_PENDING = "licence-pending"
REASON_UNKNOWN = "licence-unknown"
REASON_COMMERCIAL = "commercial-use-false"
REASON_CONSENT = "consent-missing"
REASON_ATTRIBUTION = "attribution-missing"


class PolicyError(ValueError):
    """The licence policy or deny-list file is unusable."""


def normalise_source(name: str) -> str:
    """Lower-case, trimmed, single-spaced source name."""
    return " ".join(name.strip().lower().split())


def compact_source(name: str) -> str:
    """Source name reduced to lower-case letters and digits."""
    return re.sub(r"[^a-z0-9]", "", name.lower())


def source_hash(name: str) -> str:
    """Deny-list hash of one source name."""
    return sha256_text(normalise_source(name))


def source_keys(name: str) -> set[str]:
    """Every hash a source name is checked under.

    The whole name, and every run of consecutive tokens (split on spaces and
    punctuation), each in plain and compact form. A name inside a longer
    label such as "archive/<name> v2" is still caught.
    """
    base = normalise_source(name)
    tokens = [token for token in TOKEN_SPLIT.split(base) if token][:MAX_TOKENS]
    texts = {base, compact_source(base)}
    for start in range(len(tokens)):
        for end in range(start + 1, len(tokens) + 1):
            phrase = " ".join(tokens[start:end])
            texts.add(phrase)
            texts.add(compact_source(phrase))
    return {sha256_text(text) for text in texts if text}


@dataclass(frozen=True)
class DenyList:
    """Source names excluded by hash."""

    hashes: frozenset[str]

    def __post_init__(self) -> None:
        bad = [value for value in self.hashes if not is_sha256(value)]
        if bad:
            raise PolicyError("deny-list entries must be SHA-256 hex digests")

    def denies(self, source: str) -> bool:
        """True when any form of the source name is on the list."""
        return not self.hashes.isdisjoint(source_keys(source))

    def merged(self, other: DenyList) -> DenyList:
        """Union of two deny-lists."""
        return DenyList(self.hashes | other.hashes)

    @classmethod
    def builtin(cls) -> DenyList:
        """The project's own deny-list."""
        return cls(BUILTIN_DENY_HASHES)

    @classmethod
    def from_names(cls, names: Iterable[str]) -> DenyList:
        """Build a list from plain names (for tests and local tooling)."""
        hashes: set[str] = set()
        for name in names:
            hashes.add(source_hash(name))
            hashes.add(sha256_text(compact_source(normalise_source(name))))
        return cls(frozenset(hashes))

    @classmethod
    def from_file(cls, path: Path) -> DenyList:
        """Read a beljour-source-denylist/1 JSON file."""
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as exc:
            raise PolicyError(f"deny-list unreadable: {path.name}") from exc
        if not isinstance(raw, dict) or raw.get("format") != DENYLIST_FORMAT:
            raise PolicyError(f"deny-list format must be {DENYLIST_FORMAT}")
        values = raw.get("sha256")
        if not isinstance(values, list) or not all(isinstance(v, str) for v in values):
            raise PolicyError("deny-list sha256 must be a list of hex digests")
        return cls(frozenset(values))

    def to_json(self) -> dict[str, Any]:
        """Serialisable form, sorted for stable output."""
        return {"format": DENYLIST_FORMAT, "sha256": sorted(self.hashes)}


@dataclass(frozen=True)
class LicencePolicy:
    """Allowed, pending and blocked licence ids, compared case-insensitively."""

    allowed: frozenset[str]
    pending: frozenset[str]
    blocked: frozenset[str]

    def __post_init__(self) -> None:
        clash = {_fold(v) for v in self.allowed} & {_fold(v) for v in self.blocked}
        if clash:
            raise PolicyError("a licence cannot be both allowed and blocked")

    def classify(self, licence: str) -> str:
        """One of allowed, blocked, pending, unknown or missing."""
        text = licence.strip()
        if not text:
            return "missing"
        direct = self._classify_one(text)
        if direct != "unknown":
            return direct
        alternatives = re.split(r"\s+OR\s+", text)
        results = [self._classify_all(re.split(r"\s+AND\s+", part)) for part in alternatives]
        for status in ("allowed", "pending", "blocked"):
            if status in results:
                return status
        return "unknown"

    def _classify_all(self, parts: Sequence[str]) -> str:
        statuses = [self._classify_one(part.strip().strip("()")) for part in parts]
        if "blocked" in statuses:
            return "blocked"
        if "unknown" in statuses:
            return "unknown"
        if "pending" in statuses:
            return "pending"
        return "allowed"

    @cached_property
    def _folded(self) -> dict[str, str]:
        table = {_fold(v): "pending" for v in self.pending}
        table.update({_fold(v): "allowed" for v in self.allowed})
        table.update({_fold(v): "blocked" for v in self.blocked})
        return table

    def _classify_one(self, licence: str) -> str:
        return self._folded.get(_fold(licence), "unknown")

    def with_extra_allowed(self, extra: Iterable[str]) -> LicencePolicy:
        """Allow more ids (for image licences such as CC-BY-4.0).

        Raises PolicyError if an extra id is blocked or pending in the policy,
        so a config can never quietly clear a licence the project refused.
        """
        extra_set = {value.strip() for value in extra if value.strip()}
        for value in sorted(extra_set):
            status = self._classify_one(value)
            if status in {"blocked", "pending"}:
                raise PolicyError(f"extra licence {value} is {status} in licences.json")
        return LicencePolicy(self.allowed | frozenset(extra_set), self.pending, self.blocked)

    def fingerprint(self) -> dict[str, list[str]]:
        """Sorted lists for config hashing and reports."""
        return {"allowed": sorted(self.allowed), "pending": sorted(self.pending),
                "blocked": sorted(self.blocked)}


def _fold(value: str) -> str:
    return " ".join(value.strip().casefold().split())


def _string_list(raw: Mapping[str, Any], key: str) -> frozenset[str]:
    values = raw.get(key, [])
    if not isinstance(values, list) or not all(isinstance(v, str) for v in values):
        raise PolicyError(f"licences.json policy.{key} must be a list of text ids")
    return frozenset(values)


def load_policy(path: Path | None = None) -> LicencePolicy:
    """Read policy.allowed, policy.pending and policy.blocked from licences.json."""
    target = path or DEFAULT_POLICY_PATH
    try:
        raw = json.loads(target.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise PolicyError(f"licence policy unreadable: {target.name}") from exc
    policy = raw.get("policy") if isinstance(raw, dict) else None
    if not isinstance(policy, dict):
        raise PolicyError("licences.json has no policy object")
    allowed = _string_list(policy, "allowed")
    if not allowed:
        raise PolicyError("licences.json policy.allowed is empty")
    return LicencePolicy(allowed, _string_list(policy, "pending"), _string_list(policy, "blocked"))


@dataclass(frozen=True)
class LicenceDecision:
    """Why one image was kept or rejected by the licence filter."""

    content_sha256: str
    kept: bool
    reason: str
    detail: str

    def to_dict(self) -> dict[str, Any]:
        """JSON form for the decision log."""
        return {"content_sha256": self.content_sha256, "kept": self.kept,
                "reason": self.reason, "detail": self.detail}


@dataclass(frozen=True)
class LicenceFilter:
    """Applies the policy, the flags and the deny-list to records."""

    policy: LicencePolicy
    denylist: DenyList
    require_consent: bool = True

    def decide(self, record: ImageRecord) -> LicenceDecision:
        """Single decision; the first failing rule gives the reason."""
        digest = record.content_sha256
        if self.denylist.denies(record.source):
            return LicenceDecision(digest, False, REASON_DENIED, "source is on the deny-list")
        status = self.policy.classify(record.licence)
        if status != "allowed":
            reason = {"missing": REASON_MISSING, "blocked": REASON_BLOCKED,
                      "pending": REASON_PENDING}.get(status, REASON_UNKNOWN)
            detail = f"licence {record.licence or '(none)'} is {status}"
            return LicenceDecision(digest, False, reason, detail)
        if not record.commercial_use:
            return LicenceDecision(digest, False, REASON_COMMERCIAL,
                                   "source does not grant commercial use")
        if self.require_consent and not record.consent:
            return LicenceDecision(digest, False, REASON_CONSENT, "no recorded consent")
        needs_credit = record.licence.strip().upper().startswith(ATTRIBUTION_PREFIXES)
        if needs_credit and not record.attribution.strip():
            return LicenceDecision(digest, False, REASON_ATTRIBUTION,
                                   f"licence {record.licence} needs an attribution line")
        return LicenceDecision(digest, True, KEPT, f"licence {record.licence} is allowed")

    def run(self, records: Iterable[ImageRecord]
            ) -> tuple[list[ImageRecord], list[LicenceDecision]]:
        """Kept records in input order plus one decision per input record."""
        kept: list[ImageRecord] = []
        decisions: list[LicenceDecision] = []
        for record in records:
            decision = self.decide(record)
            decisions.append(decision)
            if decision.kept:
                kept.append(record)
        return kept, decisions

    def fingerprint(self) -> dict[str, Any]:
        """Stable description used in the filter config hash."""
        return {"policy": self.policy.fingerprint(), "deny_count": len(self.denylist.hashes),
                "deny_sha256": sha256_text("\n".join(sorted(self.denylist.hashes))),
                "require_consent": self.require_consent}


def build_filter(*, policy_path: Path | None = None, extra_allowed: Iterable[str] = (),
                 denylist_path: Path | None = None, require_consent: bool = True,
                 use_builtin_denylist: bool = True) -> LicenceFilter:
    """Assemble a filter from files on disk plus config options."""
    policy = load_policy(policy_path).with_extra_allowed(extra_allowed)
    denylist = DenyList.builtin() if use_builtin_denylist else DenyList(frozenset())
    if denylist_path is not None:
        denylist = denylist.merged(DenyList.from_file(denylist_path))
    return LicenceFilter(policy, denylist, require_consent)


def reason_counts(decisions: Iterable[LicenceDecision]) -> dict[str, int]:
    """Count of decisions per reason, sorted by reason."""
    counts: dict[str, int] = {}
    for decision in decisions:
        counts[decision.reason] = counts.get(decision.reason, 0) + 1
    return dict(sorted(counts.items()))
