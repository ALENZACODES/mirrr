"""Versioned R18B performance-regression records for classical upscale. Author: John Khan."""
from __future__ import annotations

import hashlib
import json
import math
from collections.abc import Mapping, Sequence
from dataclasses import dataclass

FORMAT = "beljour.r18b.upscale.perf/1"


@dataclass(frozen=True)
class Sample:
    case_id: str
    scale: int
    width: int
    height: int
    median_ms: float
    p90_ms: float
    psnr: float
    ssim: float
    ringing: float

    def validate(self) -> None:
        if not self.case_id.strip():
            raise ValueError("case_id required")
        if self.scale not in (2, 4):
            raise ValueError("scale must be 2 or 4")
        if self.width < 1 or self.height < 1:
            raise ValueError("dimensions must be positive")
        for value in (self.median_ms, self.p90_ms, self.psnr, self.ssim, self.ringing):
            if not math.isfinite(value):
                raise ValueError("metrics must be finite")
        if self.median_ms < 0 or self.p90_ms < self.median_ms:
            raise ValueError("timing metrics invalid")
        if not 0 <= self.ssim <= 1 or not 0 <= self.ringing <= 1:
            raise ValueError("quality metric outside range")

    @property
    def megapixels_out(self) -> float:
        return self.width * self.height * self.scale * self.scale / 1_000_000.0

    @property
    def milliseconds_per_output_megapixel(self) -> float:
        return self.median_ms / max(self.megapixels_out, 1e-12)


@dataclass(frozen=True)
class Baseline:
    implementation_id: str
    environment_id: str
    samples: tuple[Sample, ...]
    author: str = "John Khan"

    def validate(self) -> None:
        if self.author != "John Khan":
            raise ValueError("author must be John Khan")
        if not self.implementation_id.strip() or not self.environment_id.strip():
            raise ValueError("implementation and environment ids required")
        if not self.samples:
            raise ValueError("baseline must contain samples")
        seen: set[str] = set()
        for sample in self.samples:
            sample.validate()
            if sample.case_id in seen:
                raise ValueError("duplicate case_id")
            seen.add(sample.case_id)

    def canonical(self) -> str:
        self.validate()
        return json.dumps(
            {
                "format": FORMAT,
                "author": self.author,
                "implementation_id": self.implementation_id,
                "environment_id": self.environment_id,
                "samples": [
                    {
                        "case_id": sample.case_id,
                        "scale": sample.scale,
                        "width": sample.width,
                        "height": sample.height,
                        "median_ms": float(sample.median_ms),
                        "p90_ms": float(sample.p90_ms),
                        "psnr": float(sample.psnr),
                        "ssim": float(sample.ssim),
                        "ringing": float(sample.ringing),
                    }
                    for sample in sorted(self.samples, key=lambda item: item.case_id)
                ],
            },
            sort_keys=True,
            separators=(",", ":"),
        )

    @property
    def sha256(self) -> str:
        return hashlib.sha256(self.canonical().encode("utf-8")).hexdigest()


def parse(value: Mapping[str, object]) -> Baseline:
    if value.get("format") != FORMAT:
        raise ValueError("unsupported performance format")
    raw_samples = value.get("samples")
    if not isinstance(raw_samples, Sequence) or isinstance(raw_samples, (str, bytes)):
        raise ValueError("samples must be an array")
    samples: list[Sample] = []
    for raw in raw_samples:
        if not isinstance(raw, Mapping):
            raise ValueError("each sample must be an object")
        samples.append(
            Sample(
                case_id=str(raw.get("case_id", "")),
                scale=int(raw.get("scale", 0)),
                width=int(raw.get("width", 0)),
                height=int(raw.get("height", 0)),
                median_ms=float(raw.get("median_ms", math.nan)),
                p90_ms=float(raw.get("p90_ms", math.nan)),
                psnr=float(raw.get("psnr", math.nan)),
                ssim=float(raw.get("ssim", math.nan)),
                ringing=float(raw.get("ringing", math.nan)),
            )
        )
    baseline = Baseline(
        implementation_id=str(value.get("implementation_id", "")),
        environment_id=str(value.get("environment_id", "")),
        samples=tuple(samples),
        author=str(value.get("author", "")),
    )
    baseline.validate()
    return baseline


def compare(
    baseline: Baseline,
    candidate: Baseline,
    *,
    maximum_median_regression: float = 0.10,
    maximum_p90_regression: float = 0.15,
    minimum_psnr_delta: float = -0.01,
    minimum_ssim_delta: float = -0.001,
    maximum_ringing_delta: float = 0.001,
) -> dict[str, object]:
    baseline.validate()
    candidate.validate()
    if baseline.environment_id != candidate.environment_id:
        raise ValueError("performance baselines require the same environment")
    if maximum_median_regression < 0 or maximum_p90_regression < 0:
        raise ValueError("runtime regression limits must be nonnegative")
    old = {item.case_id: item for item in baseline.samples}
    new = {item.case_id: item for item in candidate.samples}
    if old.keys() != new.keys():
        raise ValueError("candidate case set differs from baseline")
    rows: list[dict[str, float | str | bool]] = []
    for case_id in sorted(old):
        before = old[case_id]
        after = new[case_id]
        if (before.scale, before.width, before.height) != (after.scale, after.width, after.height):
            raise ValueError("case geometry changed")
        median_ratio = after.median_ms / max(before.median_ms, 1e-12)
        p90_ratio = after.p90_ms / max(before.p90_ms, 1e-12)
        psnr_delta = after.psnr - before.psnr
        ssim_delta = after.ssim - before.ssim
        ringing_delta = after.ringing - before.ringing
        passed = (
            median_ratio <= 1 + maximum_median_regression
            and p90_ratio <= 1 + maximum_p90_regression
            and psnr_delta >= minimum_psnr_delta
            and ssim_delta >= minimum_ssim_delta
            and ringing_delta <= maximum_ringing_delta
        )
        rows.append(
            {
                "case_id": case_id,
                "median_ratio": median_ratio,
                "p90_ratio": p90_ratio,
                "psnr_delta": psnr_delta,
                "ssim_delta": ssim_delta,
                "ringing_delta": ringing_delta,
                "passed": passed,
            }
        )
    return {
        "baseline_sha256": baseline.sha256,
        "candidate_sha256": candidate.sha256,
        "environment_id": baseline.environment_id,
        "rows": tuple(rows),
        "passed": all(bool(row["passed"]) for row in rows),
    }


def throughput_summary(baseline: Baseline) -> dict[str, float]:
    baseline.validate()
    normalized = [item.milliseconds_per_output_megapixel for item in baseline.samples]
    return {
        "minimum_ms_per_output_mp": min(normalized),
        "maximum_ms_per_output_mp": max(normalized),
        "mean_ms_per_output_mp": sum(normalized) / len(normalized),
    }
