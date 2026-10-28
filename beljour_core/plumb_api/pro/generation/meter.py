"""Aggregate-only measured generation work and cost receipts. Author: John Khan."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

from .contracts import GenerationRefused

MAX_RECEIPTS = 256


@dataclass(frozen=True)
class ImageMeter:
    output_sha256: str
    measured_gpu_ms: float | None
    measured_cost_usd: float | None
    cost_basis: str
    output_bytes: int

    def public(self) -> dict[str, Any]:
        return {
            "output_sha256": self.output_sha256,
            "measured_gpu_ms": self.measured_gpu_ms,
            "measured_cost_usd": self.measured_cost_usd,
            "cost_basis": self.cost_basis,
            "output_bytes": self.output_bytes,
        }


def meter_image(
    digest: str,
    *, output_bytes: int,
    gpu_ms: float | None,
    operator_rate: float | None,
) -> ImageMeter:
    if len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
        raise GenerationRefused("invalid_output_digest")
    if not 1 <= output_bytes <= 20 * 1024**2:
        raise GenerationRefused("invalid_output_size")
    if gpu_ms is not None and (type(gpu_ms) not in (float, int) or
                               not math.isfinite(gpu_ms) or not 0 <= gpu_ms <= 3_600_000):
        raise GenerationRefused("invalid_gpu_measurement")
    if operator_rate is None or gpu_ms is None:
        return ImageMeter(digest, gpu_ms, None, "NOT_MEASURED", output_bytes)
    if type(operator_rate) not in (int, float) or not math.isfinite(operator_rate):
        raise GenerationRefused("invalid_operator_rate")
    if not 0 <= operator_rate <= 1000:
        raise GenerationRefused("invalid_operator_rate")
    value = gpu_ms / 3_600_000 * operator_rate
    return ImageMeter(digest, float(gpu_ms), value, "ACTUAL_GPU_MS_X_DECLARED_RATE", output_bytes)


class CostLedger:
    """Keep only privacy-safe aggregates; never record prompts or image bytes."""

    def __init__(self) -> None:
        self._receipts: list[ImageMeter] = []

    def record(self, item: ImageMeter) -> None:
        self.record_many((item,))

    def record_many(self, items: tuple[ImageMeter, ...]) -> None:
        """Atomic capacity check so a failed multi-image job never partly bills."""
        if len(self._receipts) + len(items) > MAX_RECEIPTS:
            raise GenerationRefused("cost_receipts_full")
        self._receipts.extend(items)

    def public(self) -> dict[str, Any]:
        known = [receipt.measured_cost_usd for receipt in self._receipts if receipt.measured_cost_usd is not None]
        return {
            "schema": "beljour-generation-costs/1",
            "images": len(self._receipts),
            "images_cost_measured": len(known),
            "total_measured_cost_usd": (
                sum(float(cost) for cost in known)
                if len(known) == len(self._receipts) and known else None
            ),
            "unmeasured_images": len(self._receipts) - len(known),
            "quality": "NOT_SCORED",
        }
