"""R18B classical-upscale benchmark suite with quality-preserving budgets. Author: John Khan."""
from __future__ import annotations

import hashlib
import json
import math
import time
from collections.abc import Sequence
from dataclasses import asdict, dataclass

import numpy as np

from .engine import upscale
from .kernels import cubic_resize, cubic_resize_reference
from .metrics import psnr, ssim_proxy
from .perf import TimingSummary, benchmark
from .ringing import edge_overshoot_share


@dataclass(frozen=True)
class BenchmarkCase:
    case_id: str
    source: np.ndarray
    scale: int
    detail: float

    def validate(self) -> None:
        if not self.case_id.strip():
            raise ValueError("case_id required")
        if self.source.dtype != np.uint8 or self.source.ndim != 3 or self.source.shape[2] not in (3, 4):
            raise ValueError("source must be RGB/RGBA uint8")
        if min(self.source.shape[:2]) < 8:
            raise ValueError("source is too small")
        if self.scale not in (2, 4):
            raise ValueError("scale must be 2 or 4")
        if not math.isfinite(self.detail) or not 0 <= self.detail <= 1:
            raise ValueError("detail must be 0..1")

    @property
    def input_sha256(self) -> str:
        self.validate()
        digest = hashlib.sha256()
        raw = np.ascontiguousarray(self.source).tobytes()
        digest.update(len(raw).to_bytes(8, "big"))
        digest.update(raw)
        digest.update(str(self.scale).encode("ascii"))
        digest.update(f"{self.detail:.12g}".encode("ascii"))
        return digest.hexdigest()


@dataclass(frozen=True)
class BenchmarkResult:
    case_id: str
    input_sha256: str
    scale: int
    detail: float
    elapsed_ms: float
    psnr_value: float
    ssim_value: float
    ringing_fraction: float
    alpha_exact: bool

    def validate(self) -> None:
        if len(self.input_sha256) != 64:
            raise ValueError("input hash invalid")
        if self.scale not in (2, 4):
            raise ValueError("scale invalid")
        for value in (self.elapsed_ms, self.psnr_value, self.ssim_value, self.ringing_fraction):
            if not math.isfinite(value):
                raise ValueError("benchmark metric must be finite")
        if self.elapsed_ms < 0 or not 0 <= self.ssim_value <= 1 or not 0 <= self.ringing_fraction <= 1:
            raise ValueError("benchmark metric outside supported range")


@dataclass(frozen=True)
class SuiteReport:
    results: tuple[BenchmarkResult, ...]
    timing: TimingSummary
    author: str = "John Khan"

    def validate(self) -> None:
        if self.author != "John Khan":
            raise ValueError("author must be John Khan")
        self.timing.validate()
        if not self.results:
            raise ValueError("suite needs results")
        seen: set[str] = set()
        for result in self.results:
            result.validate()
            if result.case_id in seen:
                raise ValueError("duplicate benchmark case")
            seen.add(result.case_id)

    def canonical(self) -> str:
        self.validate()
        return json.dumps(
            {
                "author": self.author,
                "results": [asdict(result) for result in self.results],
                "timing": asdict(self.timing),
            },
            sort_keys=True,
            separators=(",", ":"),
        )

    @property
    def sha256(self) -> str:
        return hashlib.sha256(self.canonical().encode("utf-8")).hexdigest()


def _downsample_box(image: np.ndarray, scale: int) -> np.ndarray:
    height = image.shape[0] // scale * scale
    width = image.shape[1] // scale * scale
    crop = image[:height, :width, :3].astype(np.float64)
    reshaped = crop.reshape(height // scale, scale, width // scale, scale, 3)
    return np.rint(reshaped.mean(axis=(1, 3))).clip(0, 255).astype(np.uint8)


def synthetic_target(width: int = 96, height: int = 80) -> np.ndarray:
    if width < 32 or height < 32:
        raise ValueError("synthetic target must be at least 32x32")
    yy, xx = np.mgrid[:height, :width]
    image = np.zeros((height, width, 3), dtype=np.uint8)
    image[..., 0] = np.clip(42 + xx * 1.7 + 18 * np.sin(yy / 5.0), 0, 255)
    image[..., 1] = np.clip(35 + yy * 2.1 + 14 * np.cos(xx / 7.0), 0, 255)
    image[..., 2] = np.clip(28 + (xx + yy) * 0.8, 0, 255)
    checker = ((xx // 8 + yy // 8) % 2) == 0
    image[checker, 1] = np.clip(image[checker, 1].astype(np.int16) + 18, 0, 255).astype(np.uint8)
    return image


def quality_case(scale: int, detail: float = 0.55) -> tuple[BenchmarkCase, np.ndarray]:
    target = synthetic_target(96 if scale == 2 else 128, 80 if scale == 2 else 96)
    source = _downsample_box(target, scale)
    return BenchmarkCase(f"synthetic-{scale}x", source, scale, detail), target


def evaluate(case: BenchmarkCase, target: np.ndarray) -> BenchmarkResult:
    case.validate()
    if target.dtype != np.uint8 or target.ndim != 3 or target.shape[2] not in (3, 4):
        raise ValueError("target must be RGB/RGBA uint8")
    started = time.perf_counter()
    output = upscale(case.source, scale=case.scale, detail=case.detail)
    elapsed_ms = (time.perf_counter() - started) * 1000.0
    if output.shape[:2] != target.shape[:2]:
        raise ValueError("target/output dimensions mismatch")
    alpha_exact = True
    if case.source.shape[2] == 4:
        alpha_exact = bool(np.all(output[..., 3] == np.repeat(np.repeat(case.source[..., 3], case.scale, 0), case.scale, 1)))
    return BenchmarkResult(
        case_id=case.case_id,
        input_sha256=case.input_sha256,
        scale=case.scale,
        detail=case.detail,
        elapsed_ms=elapsed_ms,
        psnr_value=float(psnr(target[..., :3], output[..., :3])),
        ssim_value=float(ssim_proxy(target[..., :3], output[..., :3])),
        ringing_fraction=float(
            np.mean(
                np.asarray(
                    [
                        edge_overshoot_share(output[..., channel], target[..., channel])
                        for channel in range(3)
                    ],
                    dtype=np.float64,
                )
            )
        ),
        alpha_exact=alpha_exact,
    )


def vectorized_kernel_speed(channel: np.ndarray, scale: int, *, repeats: int = 5) -> tuple[TimingSummary, TimingSummary]:
    source = np.asarray(channel)
    fast = benchmark(lambda: cubic_resize(source, scale), warmups=1, repeats=repeats)
    reference = benchmark(lambda: cubic_resize_reference(source, scale), warmups=0, repeats=max(1, min(3, repeats)))
    return fast, reference


def run_suite(cases: Sequence[tuple[BenchmarkCase, np.ndarray]]) -> SuiteReport:
    if not cases:
        raise ValueError("cases required")
    results = tuple(evaluate(case, target) for case, target in cases)
    samples = tuple(result.elapsed_ms for result in results)
    timing = TimingSummary(
        samples_ms=samples,
        median_ms=float(np.median(np.asarray(samples, dtype=np.float64))),
        minimum_ms=min(samples),
        maximum_ms=max(samples),
        p90_ms=float(np.quantile(np.asarray(samples, dtype=np.float64), 0.90)),
    )
    report = SuiteReport(results, timing)
    report.validate()
    return report


def quality_gate(report: SuiteReport, *, minimum_psnr: float = 20.0, minimum_ssim: float = 0.80, maximum_ringing: float = 0.03) -> bool:
    report.validate()
    if not math.isfinite(minimum_psnr) or not 0 <= minimum_ssim <= 1 or not 0 <= maximum_ringing <= 1:
        raise ValueError("invalid quality threshold")
    return all(
        result.psnr_value >= minimum_psnr
        and result.ssim_value >= minimum_ssim
        and result.ringing_fraction <= maximum_ringing
        and result.alpha_exact
        for result in report.results
    )


def compare_runtime(reference: TimingSummary, candidate: TimingSummary, *, minimum_speedup: float = 1.0) -> dict[str, float | bool]:
    reference.validate()
    candidate.validate()
    if not math.isfinite(minimum_speedup) or minimum_speedup <= 0:
        raise ValueError("minimum_speedup must be positive finite")
    ratio = reference.median_ms / max(candidate.median_ms, 1e-12)
    return {
        "reference_median_ms": reference.median_ms,
        "candidate_median_ms": candidate.median_ms,
        "speedup": ratio,
        "minimum_speedup": minimum_speedup,
        "passes": ratio >= minimum_speedup,
    }
