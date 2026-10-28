"""Photo-scoped, explicitly provided face-region readings for Pro Commands.

Landmarks and semantic masks are never guessed from RGB. Only an approved
caller can supply observations; repeated strength changes reuse those bytes.
No photo pixels, landmark coordinates, or source identifiers are serialized.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
from collections.abc import Callable
from dataclasses import dataclass
from typing import Literal

import numpy as np
import numpy.typing as npt

from .errors import CommandUnavailable, CommandValidationError
from .frames import ImageFrame

RegionName = Literal["skin", "eyes", "hair", "protected"]
FloatPlane = npt.NDArray[np.float64]


@dataclass(frozen=True, slots=True, repr=False)
class FaceRegions:
    """Checked byte masks from a separate, commercially cleared vision source."""

    width: int
    height: int
    skin: bytes | None = None
    eyes: bytes | None = None
    hair: bytes | None = None
    protected: bytes | None = None
    evidence: str = "user_checked"

    def __post_init__(self) -> None:
        if type(self.width) is not int or type(self.height) is not int:
            raise CommandValidationError("invalid_regions", "Mask dimensions must be integers.")
        if self.width < 1 or self.height < 1 or self.width * self.height > 24_000_000:
            raise CommandValidationError("invalid_regions", "Region dimensions exceed the image limit.")
        if self.evidence not in ("user_checked", "cleared_local", "synthetic_test"):
            raise CommandValidationError("invalid_regions", "Region evidence source is not accepted.")
        for region in (self.skin, self.eyes, self.hair, self.protected):
            if region is not None and (not isinstance(region, bytes) or len(region) != self.width * self.height):
                raise CommandValidationError("invalid_regions", "A region has incorrect byte dimensions.")

    @property
    def retained_bytes(self) -> int:
        return sum(len(value) for value in (self.skin, self.eyes, self.hair, self.protected) if value is not None)

    def mask(self, name: RegionName) -> bytes | None:
        if name == "skin":
            return self.skin
        if name == "eyes":
            return self.eyes
        if name == "hair":
            return self.hair
        return self.protected

    def public_metadata(self) -> dict[str, object]:
        return {
            "evidence": self.evidence,
            "skin_present": self.skin is not None,
            "eyes_present": self.eyes is not None,
            "hair_present": self.hair is not None,
            "protected_present": self.protected is not None,
        }


@dataclass(frozen=True, slots=True)
class RegionCacheStats:
    reads: int
    hits: int
    generations: int
    retained_bytes: int
    has_photo: bool

    def public_metadata(self) -> dict[str, int | bool]:
        return {
            "reads": self.reads,
            "hits": self.hits,
            "generations": self.generations,
            "retained_bytes": self.retained_bytes,
            "has_photo": self.has_photo,
        }


class PhotoRegionCache:
    """One-photo mask cache, invalidated on source replacement and closure."""

    def __init__(self, *, max_mask_bytes: int = 96 * 1024 * 1024) -> None:
        if type(max_mask_bytes) is not int or not 4096 <= max_mask_bytes <= 192 * 1024 * 1024:
            raise CommandValidationError("invalid_cache_budget", "Mask budget is outside safe limits.")
        self._limit = max_mask_bytes
        self._generation = 0
        self._photo_key: str | None = None
        self._dimensions: tuple[int, int] | None = None
        self._regions: FaceRegions | None = None
        self._reads = 0
        self._hits = 0
        self._resized: dict[tuple[str, int, int], FloatPlane] = {}
        self._resized_bytes = 0

    def open(self, source: ImageFrame, supplier: Callable[[ImageFrame], FaceRegions | None] | None) -> None:
        if not isinstance(source, ImageFrame):
            raise CommandValidationError("invalid_frame", "Photo cache requires a validated frame.")
        digest = hashlib.sha256(source.pixels).hexdigest()
        key = f"{source.width}:{source.height}:{source.channels}:{digest}"
        if key == self._photo_key:
            self._hits += 1
            return
        self.close()
        provided = supplier(source) if supplier is not None else None
        if provided is not None and not isinstance(provided, FaceRegions):
            raise CommandValidationError("invalid_regions", "Region supplier returned invalid evidence.")
        if provided is not None and (provided.width, provided.height) != (source.width, source.height):
            raise CommandValidationError("invalid_regions", "Regions do not belong to this photograph.")
        if provided is not None and provided.retained_bytes > self._limit:
            raise CommandValidationError("invalid_cache_budget", "Region data exceed the memory budget.")
        self._photo_key = key
        self._dimensions = (source.width, source.height)
        self._regions = provided
        if supplier is not None:
            self._reads += 1

    def require_open(self) -> None:
        if self._photo_key is None:
            raise CommandUnavailable("photo_missing", "Open a photo before resolving its masks.")

    @property
    def regions(self) -> FaceRegions | None:
        self.require_open()
        return self._regions

    @property
    def generation(self) -> int:
        return self._generation

    def mask(self, name: RegionName, width: int, height: int) -> FloatPlane | None:
        self.require_open()
        if type(width) is not int or type(height) is not int or width < 1 or height < 1:
            raise CommandValidationError("invalid_regions", "Mask target dimensions are invalid.")
        if width * height > 24_000_000:
            raise CommandValidationError("invalid_regions", "Mask target exceeds 24 MP.")
        found = self._regions
        if found is None:
            return None
        encoded = found.mask(name)
        if encoded is None:
            return None
        key = (name, width, height)
        cached = self._resized.get(key)
        if cached is not None:
            self._hits += 1
            return cached
        if self._dimensions is None:
            raise CommandUnavailable("photo_missing", "Photo dimensions are unavailable.")
        source = np.frombuffer(encoded, dtype=np.uint8).reshape(found.height, found.width)
        if (width, height) == self._dimensions:
            result = np.asarray(source, dtype=np.float64) / 255.0
        else:
            from .numeric import resample_plane

            result = resample_plane(np.asarray(source, dtype=np.float64) / 255.0, width, height)
        result.setflags(write=False)
        size = result.nbytes
        if size + self._resized_bytes <= self._limit:
            self._resized[key] = result
            self._resized_bytes += size
        return result

    def available(self) -> tuple[RegionName, ...]:
        self.require_open()
        found = self._regions
        if found is None:
            return ()
        names: tuple[RegionName, ...] = ("skin", "eyes", "hair", "protected")
        return tuple(name for name in names if found.mask(name) is not None)

    def close(self) -> None:
        self._photo_key = None
        self._dimensions = None
        self._regions = None
        self._resized.clear()
        self._resized_bytes = 0
        self._generation += 1

    @property
    def stats(self) -> RegionCacheStats:
        base = self._regions.retained_bytes if self._regions is not None else 0
        return RegionCacheStats(
            self._reads, self._hits, self._generation,
            base + self._resized_bytes, self._photo_key is not None,
        )
