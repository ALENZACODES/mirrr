"""Source-balanced, stateless minibatch selection for the reference trainer.

Batch slots are dealt to licence sources in turn, so a large source cannot crowd
out a small one. Within a source, rows are drawn without replacement from a
seeded permutation that is reshuffled every time the source is exhausted. The
selection for any step is a pure function of (rows, seed, step, batch size),
which is what makes a resumed run identical to an uninterrupted one.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
from collections.abc import Sequence
from typing import Protocol, TypeVar

import numpy as np


class SourcedRow(Protocol):
    @property
    def source(self) -> str: ...


Row = TypeVar("Row", bound=SourcedRow)
MAX_BATCH = 4096


def _source_seed(seed: int, source: str, epoch: int) -> list[int]:
    digest = hashlib.sha256(f"beljour-sampler/1\x00{seed}\x00{source}".encode()).digest()
    return [int.from_bytes(digest[:8], "big"), epoch]


def _draws_before(slot: int, position: int, sources: int) -> int:
    """Slots k < slot with k % sources == position (one source's previous draws)."""
    return 0 if slot <= position else (slot - position - 1) // sources + 1


def balanced_batch(
    rows: Sequence[Row], *, step: int, seed: int, batch_size: int,
) -> tuple[tuple[Row, ...], dict[str, int]]:
    """Return the rows for ``step`` and how many came from each source."""
    if not rows:
        raise ValueError("No training rows to sample")
    if type(step) is not int or step < 0 or not 1 <= batch_size <= MAX_BATCH:
        raise ValueError("Invalid sampling step or batch size")
    by_source: dict[str, list[Row]] = {}
    for row in rows:
        by_source.setdefault(row.source, []).append(row)
    names = sorted(by_source)
    first_slot = step * batch_size
    selected: list[Row] = []
    counts: dict[str, int] = {}
    permutations: dict[tuple[str, int], np.ndarray] = {}
    for slot in range(first_slot, first_slot + batch_size):
        position = slot % len(names)
        source = names[position]
        members = by_source[source]
        draw = _draws_before(slot, position, len(names))
        epoch, offset = divmod(draw, len(members))
        key = (source, epoch)
        if key not in permutations:
            rng = np.random.default_rng(_source_seed(seed, source, epoch))
            permutations[key] = rng.permutation(len(members))
        selected.append(members[int(permutations[key][offset])])
        counts[source] = counts.get(source, 0) + 1
    return tuple(selected), dict(sorted(counts.items()))
