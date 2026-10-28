"""Resumable frozen-1000 result ledger for R18B makeup. Author: John Khan."""
from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import ClassVar

from plumb_api.engines.r18b_shared import (
    FrozenResultLedger,
    FrozenResultRow,
    merge_result_rows,
    pending_result_keys,
)
from plumb_api.engines.r18b_shared import (
    metrics_sha256 as shared_metrics_sha256,
)
from plumb_api.engines.r18b_shared import (
    statuses as shared_statuses,
)

from .frozen1000 import FrozenManifest
from .realface import registry_feature_ids

FORMAT = "beljour.r18b.makeup.results/1"


@dataclass(frozen=True)
class ResultRow(FrozenResultRow):
    _valid_features: ClassVar[tuple[str, ...]] = registry_feature_ids()
    _domain: ClassVar[str] = "makeup"


@dataclass(frozen=True)
class ResultLedger(FrozenResultLedger):
    _format: ClassVar[str] = FORMAT


def pending(manifest: FrozenManifest, ledger: ResultLedger) -> tuple[tuple[str, str], ...]:
    return pending_result_keys(manifest, ledger)


def merge(manifest: FrozenManifest, ledgers: Sequence[ResultLedger]) -> ResultLedger:
    rows = merge_result_rows(manifest, ledgers)
    result = ResultLedger(manifest.sha256, rows)
    result.validate(manifest)
    return result


def metrics_sha256(metrics: Mapping[str, float | bool]) -> str:
    return shared_metrics_sha256(metrics)


def statuses(ledger: ResultLedger) -> dict[str, int]:
    return shared_statuses(ledger)
