"""Uniqueness engine: issue only designs that no earlier card has used or nearly used.

For each attempt a seed is turned into a design. The design is refused and redrawn with the
next derived seed when its exact fingerprint is stored, when a stored design of the same
bucket lies within NEAR_PARAM, or (on the full path) when a stored design of the same look
has a perceptual hash within NEAR_HAMMING bits. After max_attempts refusals the engine raises
UniquenessExhaustedError.
Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass, field

from .errors import UniquenessExhaustedError
from .fingerprint import (
    NEAR_HAMMING,
    NEAR_PARAM,
    DesignKey,
    design_key,
    design_phash,
    perceptual_scope,
)
from .grammar import CardDesign, design_from_seed, sub_seed
from .provider import MotifProvider
from .store import DesignStore

DEFAULT_ATTEMPTS = 24


@dataclass(frozen=True)
class Reservation:
    """A design accepted by the engine and recorded in the store."""

    design: CardDesign
    key: DesignKey
    phash: int | None
    attempts: int
    refusals: dict[str, int] = field(default_factory=dict)


def attempt_seed(seed: int, attempt: int) -> int:
    """Seed for a retry; attempt 0 is the caller's seed itself."""
    if attempt == 0:
        return seed
    return sub_seed(seed, f"retry:{attempt}")


class UniquenessEngine:
    """Draws designs from seeds and refuses exact or near repeats."""

    def __init__(self, store: DesignStore, provider: MotifProvider | None = None,
                 perceptual: bool = True, max_attempts: int = DEFAULT_ATTEMPTS,
                 near_param: float = NEAR_PARAM, near_hamming: int = NEAR_HAMMING) -> None:
        if max_attempts < 1:
            raise ValueError("max_attempts must be at least 1")
        self.store = store
        self.provider = provider
        self.perceptual = perceptual
        self.max_attempts = max_attempts
        self.near_param = near_param
        self.near_hamming = near_hamming

    def _motif_ids(self, occasion: str) -> Sequence[str] | None:
        if self.provider is None:
            return None
        return self.provider.motif_ids(occasion)

    def _refusal(self, key: DesignKey, occasion: str, scope: str,
                 phash: int | None) -> str | None:
        if self.store.has_fingerprint(key.fingerprint):
            return "exact"
        if self.store.nearest_param(key) < self.near_param:
            return "param"
        if phash is not None and self.store.nearest_phash(occasion, scope, phash) <= \
                self.near_hamming:
            return "perceptual"
        return None

    def reserve(self, occasion: str, seed: int, look: str | None = None,
                card_format: str = "portrait") -> Reservation:
        """Find, record and return the first acceptable design for this seed."""
        refusals = {"exact": 0, "param": 0, "perceptual": 0}
        motif_ids = self._motif_ids(occasion)
        for attempt in range(self.max_attempts):
            design = design_from_seed(occasion, attempt_seed(seed, attempt), look, motif_ids,
                                      card_format)
            key = design_key(design)
            # Render the hash outside the lock; the checks and the insert happen inside it.
            phash = design_phash(design, self.provider) if self.perceptual else None
            scope = perceptual_scope(design)
            with self.store.exclusive():
                reason = self._refusal(key, design.occasion, scope, phash)
                if reason is None and not self.store.add(key, design.occasion, scope,
                                                         design.seed, phash):
                    reason = "exact"
            if reason is not None:
                refusals[reason] += 1
                continue
            return Reservation(design, key, phash, attempt + 1, refusals)
        raise UniquenessExhaustedError(occasion, self.max_attempts)
