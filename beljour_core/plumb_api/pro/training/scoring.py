"""Independently checked heldout MSE/PSNR aggregates by source. Author: John Khan.

An evaluator reports one row per heldout source: the number of heldout images
scored and their mean squared error on pixels scaled to [0, 1]. The rows are
accepted only when they cover exactly the audited heldout population, source
by source, so a score cannot be computed on a different, smaller or easier set.
Only aggregates are returned. A score card is measurement, not release approval.
"""

from __future__ import annotations

import math
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from .audit import CorpusAudit

SCORE_SCHEMA = "beljour-heldout-scores/1"
MAX_SCORE_SOURCES = 64
# ASSUMED floor: PSNR is reported for MSE no lower than 1e-10 (100 dB), so a
# perfect reconstruction gives a finite JSON number rather than infinity.
MIN_REPORTED_MSE = 1e-10


class ScoreInvalid(ValueError):
    """A rejected score submission, with a constant code only."""

    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


def psnr_db(mse: float) -> float:
    """Peak signal-to-noise ratio for unit-range pixels."""
    if not math.isfinite(mse) or mse < 0:
        raise ScoreInvalid("invalid_mse")
    return 10.0 * math.log10(1.0 / max(mse, MIN_REPORTED_MSE))


@dataclass(frozen=True)
class SourceScore:
    source: str
    count: int
    mse: float

    @property
    def psnr_db(self) -> float:
        return psnr_db(self.mse)

    def public(self) -> dict[str, Any]:
        return {"count": self.count, "mse": round(self.mse, 9), "psnr_db": round(self.psnr_db, 6)}


@dataclass(frozen=True)
class ScoreCard:
    manifest_sha256: str
    sources: tuple[SourceScore, ...]

    @property
    def count(self) -> int:
        return sum(item.count for item in self.sources)

    @property
    def mse(self) -> float:
        """Image-weighted mean, so every heldout image counts once."""
        return sum(item.mse * item.count for item in self.sources) / self.count

    def by_source(self) -> dict[str, SourceScore]:
        return {item.source: item for item in self.sources}

    def public(self) -> dict[str, Any]:
        return {
            "schema": SCORE_SCHEMA,
            "overall": {
                "count": self.count,
                "mse": round(self.mse, 9),
                "psnr_db": round(psnr_db(self.mse), 6),
            },
            "sources": {item.source: item.public() for item in self.sources},
            "population": "AUDITED_HELDOUT_EXACT",
            "release_quality": "NOT_RUN",
            "real_face_evaluation": "NOT_RUN",
        }


def _row(value: object) -> SourceScore:
    if not isinstance(value, Mapping) or set(value) != {"source", "count", "mse"}:
        raise ScoreInvalid("invalid_score_row")
    source, count, mse = value["source"], value["count"], value["mse"]
    if not isinstance(source, str) or not source.isidentifier() or len(source) > 48:
        raise ScoreInvalid("invalid_score_row")
    if type(count) is not int or count < 1:
        raise ScoreInvalid("invalid_score_count")
    if isinstance(mse, bool) or not isinstance(mse, (int, float)):
        raise ScoreInvalid("invalid_mse")
    mse = float(mse)
    # Unit-range pixels bound every squared error by 1.
    if not math.isfinite(mse) or not 0.0 <= mse <= 1.0:
        raise ScoreInvalid("invalid_mse")
    return SourceScore(source, count, mse)


def score_aggregates(audit: CorpusAudit, rows: object) -> ScoreCard:
    """Accept per-source heldout rows only if they match the audited heldout counts."""
    if not isinstance(rows, list) or not 1 <= len(rows) <= MAX_SCORE_SOURCES:
        raise ScoreInvalid("invalid_score_rows")
    parsed = [_row(item) for item in rows]
    names = [item.source for item in parsed]
    if len(set(names)) != len(names):
        raise ScoreInvalid("duplicate_score_source")
    reported = {item.source: item.count for item in parsed}
    if reported != audit.eval_sources:
        raise ScoreInvalid("score_population_mismatch")
    return ScoreCard(audit.manifest_sha256, tuple(sorted(parsed, key=lambda item: item.source)))


def compare_aggregates(prior: ScoreCard, current: ScoreCard) -> dict[str, Any]:
    """Compare two cards measured on the identical audited heldout population.

    Lower MSE is better. Equal values within 1e-12 are reported as unchanged.
    """
    if prior.manifest_sha256 != current.manifest_sha256:
        raise ScoreInvalid("comparison_population_mismatch")
    before, after = prior.by_source(), current.by_source()
    if {name: item.count for name, item in before.items()} != {
        name: item.count for name, item in after.items()
    }:
        raise ScoreInvalid("comparison_population_mismatch")
    improved = regressed = 0
    sources: dict[str, Any] = {}
    for name in sorted(after):
        delta = after[name].mse - before[name].mse
        if delta < -1e-12:
            improved += 1
        elif delta > 1e-12:
            regressed += 1
        sources[name] = {
            "mse_delta": round(delta, 9),
            "psnr_db_delta": round(after[name].psnr_db - before[name].psnr_db, 6),
        }
    overall = current.mse - prior.mse
    if improved and regressed:
        status = "MIXED"
    elif improved:
        status = "IMPROVED"
    elif regressed:
        status = "REGRESSED"
    else:
        status = "UNCHANGED"
    return {
        "schema": "beljour-heldout-comparison/1",
        "overall_mse_delta": round(overall, 9),
        "overall_psnr_db_delta": round(psnr_db(current.mse) - psnr_db(prior.mse), 6),
        "sources": sources,
        "improved_sources": improved,
        "regressed_sources": regressed,
        "status": status,
        "release_quality": "NOT_RUN",
    }
