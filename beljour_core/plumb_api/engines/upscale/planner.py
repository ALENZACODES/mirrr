"""R18B deterministic upscale execution planner. Author: John Khan."""
from __future__ import annotations

import math
from dataclasses import dataclass

from .tiling import memory_budget


@dataclass(frozen=True)
class DeviceBudget:
    maximum_peak_mb: float
    target_preview_ms: float
    target_export_ms: float

    def validate(self) -> None:
        for value in (self.maximum_peak_mb, self.target_preview_ms, self.target_export_ms):
            if not math.isfinite(value) or value <= 0:
                raise ValueError("device budgets must be positive finite")
        if self.maximum_peak_mb < 16:
            raise ValueError("maximum_peak_mb must be at least 16")


@dataclass(frozen=True)
class Candidate:
    scale: int
    tile_side: int
    overlap: int
    estimated_peak_mb: float
    estimated_work_mp: float
    estimated_ms: float
    within_memory: bool
    within_time: bool

    @property
    def viable(self) -> bool:
        return self.within_memory and self.within_time


@dataclass(frozen=True)
class Plan:
    width: int
    height: int
    scale: int
    mode: str
    tile_side: int
    overlap: int
    estimated_peak_mb: float
    estimated_ms: float
    reason: str

    def validate(self) -> None:
        if self.width < 1 or self.height < 1:
            raise ValueError("dimensions must be positive")
        if self.scale not in (2, 4):
            raise ValueError("scale must be 2 or 4")
        if self.mode not in {"full", "tiled"}:
            raise ValueError("unsupported plan mode")
        if self.tile_side < 64 or self.overlap < 2:
            raise ValueError("invalid tile geometry")
        if self.estimated_peak_mb <= 0 or self.estimated_ms < 0:
            raise ValueError("invalid plan estimates")


def output_megapixels(width: int, height: int, scale: int) -> float:
    if width < 1 or height < 1 or scale not in (2, 4):
        raise ValueError("invalid upscale geometry")
    return width * height * scale * scale / 1_000_000.0


def estimate_runtime_ms(width: int, height: int, scale: int, milliseconds_per_output_mp: float) -> float:
    if not math.isfinite(milliseconds_per_output_mp) or milliseconds_per_output_mp <= 0:
        raise ValueError("runtime rate must be positive finite")
    return output_megapixels(width, height, scale) * milliseconds_per_output_mp


def candidates(
    width: int,
    height: int,
    scale: int,
    budget: DeviceBudget,
    *,
    milliseconds_per_output_mp: float,
    preview: bool,
) -> tuple[Candidate, ...]:
    budget.validate()
    total_ms = estimate_runtime_ms(width, height, scale, milliseconds_per_output_mp)
    deadline = budget.target_preview_ms if preview else budget.target_export_ms
    result: list[Candidate] = []
    for tile_side in (1024, 768, 640, 512, 384, 256, 192, 128):
        if tile_side > max(width, height) and tile_side != 128:
            continue
        footprint = memory_budget(tile_side, 12, scale)
        peak_mb = footprint["peak_bytes_estimate"] / (1024 * 1024)
        output_mp = output_megapixels(min(tile_side, width), min(tile_side, height), scale)
        overhead = 1.0 + max(0.0, 0.035 * (math.ceil(width / tile_side) * math.ceil(height / tile_side) - 1))
        estimated_ms = total_ms * overhead
        result.append(
            Candidate(
                scale=scale,
                tile_side=tile_side,
                overlap=12,
                estimated_peak_mb=peak_mb,
                estimated_work_mp=output_mp,
                estimated_ms=estimated_ms,
                within_memory=peak_mb <= budget.maximum_peak_mb,
                within_time=estimated_ms <= deadline,
            )
        )
    return tuple(result)


def choose(
    width: int,
    height: int,
    scale: int,
    budget: DeviceBudget,
    *,
    milliseconds_per_output_mp: float,
    preview: bool = False,
) -> Plan:
    options = candidates(
        width,
        height,
        scale,
        budget,
        milliseconds_per_output_mp=milliseconds_per_output_mp,
        preview=preview,
    )
    viable = [candidate for candidate in options if candidate.viable]
    if viable:
        selected = max(viable, key=lambda item: item.tile_side)
        full_frame = selected.tile_side >= max(width, height)
        plan = Plan(
            width=width,
            height=height,
            scale=scale,
            mode="full" if full_frame else "tiled",
            tile_side=selected.tile_side,
            overlap=selected.overlap,
            estimated_peak_mb=selected.estimated_peak_mb,
            estimated_ms=selected.estimated_ms,
            reason="largest tile within memory and time budgets",
        )
        plan.validate()
        return plan
    memory_safe = [candidate for candidate in options if candidate.within_memory]
    if memory_safe:
        selected = min(memory_safe, key=lambda item: item.estimated_ms)
        reason = "time budget not met; selected fastest memory-safe plan"
    elif options:
        selected = min(options, key=lambda item: item.estimated_peak_mb)
        reason = "memory and time budgets not met; selected lowest-memory plan"
    else:
        raise ValueError("no execution candidates")
    plan = Plan(
        width=width,
        height=height,
        scale=scale,
        mode="tiled",
        tile_side=selected.tile_side,
        overlap=selected.overlap,
        estimated_peak_mb=selected.estimated_peak_mb,
        estimated_ms=selected.estimated_ms,
        reason=reason,
    )
    plan.validate()
    return plan
