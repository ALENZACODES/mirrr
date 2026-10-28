"""Frozen-1000 evidence twin for R18B smile features. Author: John Khan."""
from __future__ import annotations

import hashlib
import json
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import asdict, dataclass

from plumb_api.engines.r18b_shared import parse_int

from .realface import registry_feature_ids

EXPECTED_CASES = 1000
FORMAT = "beljour.r18b.smile.frozen1000/1"


@dataclass(frozen=True)
class FrozenCase:
    case_id: str
    input_sha256: str
    feature_ids: tuple[str, ...]

    def validate(self) -> None:
        if not self.case_id.strip():
            raise ValueError("case_id required")
        if len(self.input_sha256) != 64 or any(char not in "0123456789abcdef" for char in self.input_sha256):
            raise ValueError("input_sha256 must be lowercase sha256")
        if not self.feature_ids or not set(self.feature_ids) <= set(registry_feature_ids()):
            raise ValueError("feature_ids must be built smile ids")
        if len(set(self.feature_ids)) != len(self.feature_ids):
            raise ValueError("feature_ids must be unique")


@dataclass(frozen=True)
class FrozenManifest:
    dataset_id: str
    cases: tuple[FrozenCase, ...]
    expected_cases: int = EXPECTED_CASES
    author: str = "John Khan"

    def validate(self, *, require_complete: bool = True) -> None:
        if self.author != "John Khan" or not self.dataset_id.strip():
            raise ValueError("invalid manifest identity")
        if self.expected_cases != EXPECTED_CASES:
            raise ValueError("frozen-1000 twin must declare exactly 1000 cases")
        if require_complete and len(self.cases) != EXPECTED_CASES:
            raise ValueError(f"expected 1000 cases, found {len(self.cases)}")
        if len({case.case_id for case in self.cases}) != len(self.cases):
            raise ValueError("duplicate case_id")
        for case in self.cases:
            case.validate()

    def canonical(self) -> str:
        self.validate(require_complete=False)
        return json.dumps(
            {
                "format": FORMAT,
                "author": self.author,
                "dataset_id": self.dataset_id,
                "expected_cases": self.expected_cases,
                "registry_features": registry_feature_ids(),
                "cases": [asdict(case) for case in self.cases],
            },
            sort_keys=True,
            separators=(",", ":"),
        )

    @property
    def sha256(self) -> str:
        return hashlib.sha256(self.canonical().encode("utf-8")).hexdigest()


def parse_manifest(value: Mapping[str, object], *, require_complete: bool = True) -> FrozenManifest:
    if value.get("format") != FORMAT:
        raise ValueError("unsupported frozen manifest format")
    raw_cases = value.get("cases")
    if not isinstance(raw_cases, Sequence) or isinstance(raw_cases, (str, bytes)):
        raise ValueError("cases must be an array")
    parsed: list[FrozenCase] = []
    for raw in raw_cases:
        if not isinstance(raw, Mapping):
            raise ValueError("case must be an object")
        features = raw.get("feature_ids")
        if not isinstance(features, Sequence) or isinstance(features, (str, bytes)):
            raise ValueError("feature_ids must be an array")
        parsed.append(
            FrozenCase(
                case_id=str(raw.get("case_id", "")),
                input_sha256=str(raw.get("input_sha256", "")),
                feature_ids=tuple(str(item) for item in features),
            )
        )
    manifest = FrozenManifest(
        dataset_id=str(value.get("dataset_id", "")),
        cases=tuple(parsed),
        expected_cases=parse_int(value.get("expected_cases"), field="expected_cases", default=EXPECTED_CASES),
        author=str(value.get("author", "")),
    )
    manifest.validate(require_complete=require_complete)
    return manifest


def shard(cases: Sequence[FrozenCase], shard_index: int, shard_count: int) -> tuple[FrozenCase, ...]:
    if shard_count < 1 or not 0 <= shard_index < shard_count:
        raise ValueError("invalid shard")
    return tuple(case for index, case in enumerate(cases) if index % shard_count == shard_index)


def required_evaluations(manifest: FrozenManifest) -> int:
    manifest.validate(require_complete=False)
    return sum(len(case.feature_ids) for case in manifest.cases)


def feature_case_counts(manifest: FrozenManifest) -> dict[str, int]:
    manifest.validate(require_complete=False)
    counts = {feature_id: 0 for feature_id in registry_feature_ids()}
    for case in manifest.cases:
        for feature_id in case.feature_ids:
            counts[feature_id] += 1
    return counts


def completeness(manifest: FrozenManifest, completed: Iterable[tuple[str, str]]) -> dict[str, object]:
    manifest.validate(require_complete=False)
    required = {(case.case_id, feature) for case in manifest.cases for feature in case.feature_ids}
    done = set(completed)
    return {
        "required": len(required),
        "completed": len(required & done),
        "missing": tuple(sorted(required - done)),
        "unexpected": tuple(sorted(done - required)),
        "complete": required == done and len(manifest.cases) == EXPECTED_CASES,
    }
