"""Typed and defensively validated public control surface for R20c.

A request cannot specify an arbitrary upload destination, model name, URL,
brand, medically framed treatment, or unrestricted pixel operation.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

from .palette import RGB, checked_rgb
from .specs import FeatureSpec, spec_for


@dataclass(frozen=True, slots=True)
class PreviewRequest:
    feature_id: str
    variant: str
    strength: int = 55
    undertone: str = "neutral"
    depth: str = "medium"
    outfit_rgb: RGB = (132, 104, 143)
    reference_rgb: RGB = (181, 115, 132)
    primary_rgb: RGB = (180, 136, 120)
    secondary_rgb: RGB = (150, 110, 112)
    mix_percent: int = 35
    hours: int = 6

    def validate(self) -> FeatureSpec:
        spec = spec_for(self.feature_id)
        if self.variant not in spec.variants:
            raise ValueError(f"Unsupported {self.feature_id} variant {self.variant!r}")
        for label, value in (
            ("strength", self.strength), ("mix_percent", self.mix_percent),
        ):
            if type(value) is not int or not 0 <= value <= 100:
                raise ValueError(f"{label} must be an integer percentage 0..100")
        if type(self.hours) is not int or not 0 <= self.hours <= 12:
            raise ValueError("hours must be an integer from 0 to 12")
        if self.undertone not in {"warm", "cool", "neutral"}:
            raise ValueError("Select warm, cool or neutral display undertone")
        if self.depth not in {"light", "medium", "deep"}:
            raise ValueError("Select a display depth")
        checked_rgb(self.outfit_rgb, name="outfit_rgb")
        checked_rgb(self.reference_rgb, name="reference_rgb")
        checked_rgb(self.primary_rgb, name="primary_rgb")
        checked_rgb(self.secondary_rgb, name="secondary_rgb")
        return spec
