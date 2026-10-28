"""Consumer-side face-fixer quality hook for the existing repair engine.

Only inspected measurements, never a competing repair algorithm. The hook is
injected into guarded Pro execution and does not modify engines/repair. Real
face acceptance stays UNPROVEN until the frozen, authorized face gate runs.
Author: John Khan.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

from .errors import CommandValidationError
from .frames import ImageFrame
from .identity import IdentityDecision
from .types import CommandName

GateStatus = Literal["pass", "fail", "unproven"]


def _lstar(red: int, green: int, blue: int) -> float:
    def channel(value: int) -> float:
        srgb = value / 255.0
        if srgb <= 0.04045:
            return srgb / 12.92
        return ((srgb + 0.055) / 1.055) ** 2.4

    luminance = 0.2126729 * channel(red) + 0.7151522 * channel(green) + 0.0721750 * channel(blue)
    proportion = luminance
    if proportion > 216.0 / 24389.0:
        return 116.0 * proportion ** (1.0 / 3.0) - 16.0
    return (24389.0 / 27.0) * proportion


@dataclass(frozen=True, slots=True)
class RegionEvidence:
    """Explicit pixel-aligned 0..255 annotations; no inferred demographic tags."""

    width: int
    height: int
    skin: bytes | None = None
    protected: bytes | None = None
    provenance: str = "synthetic"

    def __post_init__(self) -> None:
        if type(self.width) is not int or type(self.height) is not int:
            raise CommandValidationError("invalid_gate_mask", "Mask dimensions must be integers.")
        if self.width <= 0 or self.height <= 0 or self.width * self.height > 24_000_000:
            raise CommandValidationError("invalid_gate_mask", "Mask dimensions are invalid.")
        for mask in (self.skin, self.protected):
            if mask is not None and (
                not isinstance(mask, bytes) or len(mask) != self.width * self.height
            ):
                raise CommandValidationError("invalid_gate_mask", "Mask byte count is incorrect.")
        if self.provenance not in ("synthetic", "authorized_external"):
            raise CommandValidationError("invalid_gate_source", "Gate evidence provenance is invalid.")


@dataclass(frozen=True, slots=True)
class FaceFixerLimits:
    """Predeclared conservative checks, not measured real-face thresholds."""

    max_lstar_rise: float = 2.5
    protected_tolerance: int = 0
    require_identity: bool = True

    def __post_init__(self) -> None:
        if not math.isfinite(self.max_lstar_rise) or not 0.0 <= self.max_lstar_rise <= 10:
            raise CommandValidationError("invalid_gate_limits", "Lstar limit is invalid.")
        if type(self.protected_tolerance) is not int or not 0 <= self.protected_tolerance <= 255:
            raise CommandValidationError("invalid_gate_limits", "Protected pixel tolerance is invalid.")
        if type(self.require_identity) is not bool:
            raise CommandValidationError("invalid_gate_limits", "Identity requirement is invalid.")


@dataclass(frozen=True, slots=True)
class FaceFixerReport:
    status: GateStatus
    reasons: tuple[str, ...]
    modified_pixels: int
    protected_violations: int
    alpha_violations: int
    skin_samples: int
    maximum_lstar_rise: float | None
    identity_meter: int | None
    realface_qualified: bool = False

    def public_metadata(self) -> dict[str, object]:
        return {
            "status": self.status,
            "reasons": list(self.reasons),
            "modified_pixels": self.modified_pixels,
            "protected_violations": self.protected_violations,
            "alpha_violations": self.alpha_violations,
            "skin_samples": self.skin_samples,
            "maximum_lstar_rise": self.maximum_lstar_rise,
            "identity_match": self.identity_meter,
            "realface_qualified": False,
        }


class FaceFixerGate:
    """Read-only engine/repair hook; no photo serialization or model lookup."""

    def __init__(
        self,
        regions: RegionEvidence | None = None,
        *,
        limits: FaceFixerLimits | None = None,
        max_reports: int = 25,
    ) -> None:
        if type(max_reports) is not int or not 1 <= max_reports <= 100:
            raise CommandValidationError("invalid_gate_limits", "Gate history limit is invalid.")
        self.regions = regions
        self.limits = limits if limits is not None else FaceFixerLimits()
        self._max_reports = max_reports
        self._reports: list[FaceFixerReport] = []

    def evaluate(
        self,
        original: ImageFrame,
        edited: ImageFrame,
        identity: IdentityDecision | None,
    ) -> FaceFixerReport:
        if not isinstance(original, ImageFrame) or not isinstance(edited, ImageFrame):
            raise CommandValidationError("invalid_gate_frame", "Gate requires validated frames.")
        if not original.same_layout(edited):
            raise CommandValidationError("invalid_gate_frame", "Repair cannot resize its input frame.")
        regions = self.regions
        if regions is not None and (regions.width, regions.height) != (original.width, original.height):
            raise CommandValidationError("invalid_gate_mask", "Regions do not fit this input frame.")
        protected_violations = 0
        alpha_violations = 0
        modified = 0
        skin_samples = 0
        max_rise = 0.0
        skin_mask = regions.skin if regions is not None else None
        protected_mask = regions.protected if regions is not None else None
        for index in range(original.width * original.height):
            offset = index * original.channels
            start = original.pixels[offset:offset + 3]
            end = edited.pixels[offset:offset + 3]
            if start != end:
                modified += 1
            if original.channels == 4 and original.pixels[offset + 3] != edited.pixels[offset + 3]:
                alpha_violations += 1
            if protected_mask is not None and protected_mask[index] > 0:
                if any(
                    abs(start[channel] - end[channel]) > self.limits.protected_tolerance
                    for channel in range(3)
                ):
                    protected_violations += 1
            if skin_mask is not None and skin_mask[index] > 0:
                skin_samples += 1
                before = _lstar(start[0], start[1], start[2])
                after = _lstar(end[0], end[1], end[2])
                max_rise = max(max_rise, after - before)
        failed: list[str] = []
        unknown: list[str] = []
        if alpha_violations:
            failed.append("alpha_changed")
        if protected_violations:
            failed.append("protected_region_changed")
        if skin_mask is None or skin_samples == 0:
            unknown.append("skin_mask_missing")
        elif max_rise > self.limits.max_lstar_rise:
            failed.append("skin_lightness_exceeded")
        if protected_mask is None:
            unknown.append("protected_mask_missing")
        if self.limits.require_identity and identity is None:
            unknown.append("identity_evidence_missing")
        if identity is not None and identity.status == "warned":
            failed.append("identity_warned")
        if regions is None or regions.provenance != "authorized_external":
            unknown.append("realface_evidence_missing")
        status: GateStatus = "fail" if failed else "unproven"
        # Even complete local observations cannot self-certify the external
        # frozen real-face release requirements. Only a separate runner can.
        report = FaceFixerReport(
            status, tuple([*failed, *unknown]), modified, protected_violations,
            alpha_violations, skin_samples, max_rise if skin_samples else None,
            identity.identity_match if identity is not None else None,
        )
        return report

    def observe(
        self,
        original: ImageFrame,
        output: ImageFrame,
        command: CommandName,
        identity: IdentityDecision | None,
    ) -> None:
        if command is not CommandName.CLEANUP:
            return
        self._reports.append(self.evaluate(original, output, identity))
        if len(self._reports) > self._max_reports:
            self._reports.pop(0)

    @property
    def reports(self) -> tuple[FaceFixerReport, ...]:
        return tuple(self._reports)

    def clear(self) -> None:
        self._reports.clear()
