"""Conservative hair-colour suggestions from a reliable, caller-marked reading.

A suggestion needs all of:

* validated primary-head landmarks supplied by the caller (no mesh, no suggestion);
* a caller-marked hair mask with at least ``minimum_zone_pixels`` pixels, clipped to
  an optional primary-face box;
* a lighting-corrected reading: an explicit neutral card first, else a labelled
  grey-world background estimate (``concealer.shade_support.read_fibre_colour``). An
  uncorrected or clamped (extreme) correction is ``unreliable_lighting``.

Swatches come from the original in-house palette (``matching.suggest``) and never
exceed the measured level unless the visitor explicitly allows lightening. The
session cache is bounded and holds only derived colour readings (Lab, lighting mode,
pixel count), keyed by a digest of the photo, the brush masks and the options; a new
photo or brush stroke gives a new key, and ``invalidate`` clears it. No photo, mask
or landmark is retained. Digital swatches are estimates, not physical dye results.
Mirrored in web/src/engines/hair_palette/consultation.ts. Author: John Khan.
"""
from __future__ import annotations

import hashlib
from collections import OrderedDict
from dataclasses import dataclass
from typing import Any, Literal

import numpy as np

from ..concealer.cover import HeadLandmarks
from ..concealer.shade_support import FibreReading, read_fibre_colour
from ..shade.finder import thresholds
from .matching import ShadeSuggestion, measured_level, suggest

Code = Literal["no_mesh", "invalid_mask", "too_few_pixels", "unreliable_lighting"]
MAX_CAPACITY = 16
LABEL = "In-house hair-colour estimate from a corrected reading; not a physical dye result."


@dataclass(frozen=True, slots=True)
class Consultation:
    code: Code | None
    reading: FibreReading | None
    measured_level: int | None
    suggestions: tuple[ShadeSuggestion, ...]
    allow_lightening: bool
    cached: bool

    @property
    def usable(self) -> bool:
        return self.code is None and bool(self.suggestions)

    def public(self) -> dict[str, Any]:
        return {"format": "beljour-hair-consultation/1", "usable": self.usable, "code": self.code,
                "reading": None if self.reading is None else self.reading.public(),
                "measured_level": self.measured_level,
                "suggestions": [s.public() for s in self.suggestions],
                "allow_lightening": self.allow_lightening, "cached": self.cached, "label": LABEL,
                "tested_against_real_products": False}


def _bool_mask(value: object, shape: tuple[int, int]) -> np.ndarray | None:
    data = np.asarray(value)
    if data.shape != shape:
        return None
    if data.dtype == np.bool_:
        return data.copy()
    if data.dtype == np.uint8:
        return data >= 128
    if data.dtype.kind == "f" and np.all(np.isfinite(data)) and data.min() >= 0 and data.max() <= 1:
        return data >= 0.5
    return None


class HairColourConsultation:
    """One visitor's bounded, in-memory consultation cache of derived readings."""

    def __init__(self, *, capacity: int = 8) -> None:
        if type(capacity) is not int or not 1 <= capacity <= MAX_CAPACITY:
            raise ValueError(f"capacity must be 1..{MAX_CAPACITY}")
        self._capacity = capacity
        self._readings: OrderedDict[str, FibreReading] = OrderedDict()
        self.reading_computes = 0

    def __len__(self) -> int:
        return len(self._readings)

    def invalidate(self) -> None:
        self._readings.clear()

    def suggest(self, image: object, hair_mask: object, landmarks: object | None, *,
                neutral_mask: object | None = None, background_mask: object | None = None,
                primary_box: tuple[int, int, int, int] | None = None,
                allow_lightening: bool = False, count: int = 3) -> Consultation:
        if type(allow_lightening) is not bool:
            raise ValueError("allow_lightening must be a boolean")

        def refuse(code: Code) -> Consultation:
            return Consultation(code, None, None, (), allow_lightening, False)

        if not isinstance(landmarks, HeadLandmarks):
            return refuse("no_mesh")
        try:
            landmarks.validate()
        except ValueError:
            return refuse("no_mesh")
        img = np.asarray(image)
        if img.dtype != np.uint8 or img.ndim != 3 or img.shape[2] not in (3, 4):
            raise ValueError("Hair consultation needs a uint8 RGB or RGBA photo")
        shape = (int(img.shape[0]), int(img.shape[1]))
        mask = _bool_mask(hair_mask, shape)
        if mask is None:
            return refuse("invalid_mask")
        if primary_box is not None:
            x0, y0, x1, y1 = primary_box
            if any(type(v) is not int for v in primary_box) or not (0 <= x0 < x1 <= shape[1] and 0 <= y0 < y1 <= shape[0]):
                return refuse("invalid_mask")
            clip = np.zeros(shape, dtype=bool)
            clip[y0:y1, x0:x1] = True
            mask &= clip
        if int(mask.sum()) < int(thresholds()["minimum_zone_pixels"]):
            return refuse("too_few_pixels")
        key = self._key(img, mask, neutral_mask, background_mask)
        cached = key in self._readings
        if cached:
            self._readings.move_to_end(key)
            reading = self._readings[key]
        else:
            reading = read_fibre_colour(img, mask, neutral_mask=neutral_mask, background_mask=background_mask)
            self.reading_computes += 1
            self._readings[key] = reading
            while len(self._readings) > self._capacity:
                self._readings.popitem(last=False)
        if reading.white_mode == "none" or reading.clamped:
            return Consultation("unreliable_lighting", reading, None, (), allow_lightening, cached)
        rows = suggest(reading.lab, allow_lightening=allow_lightening, count=count)
        return Consultation(None, reading, measured_level(reading.lab), rows, allow_lightening, cached)

    @staticmethod
    def _key(image: np.ndarray, mask: np.ndarray, neutral: object | None, background: object | None) -> str:
        digest = hashlib.sha256()
        digest.update(repr(image.shape).encode())
        digest.update(np.ascontiguousarray(image).tobytes())
        digest.update(np.packbits(mask).tobytes())
        for extra in (neutral, background):
            digest.update(b"|" if extra is None else np.packbits(np.asarray(extra) >= 0.5).tobytes())
        return digest.hexdigest()
