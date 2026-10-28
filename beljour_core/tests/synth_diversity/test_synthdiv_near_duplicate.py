"""Four-bit difference-hash boundaries and slice-confined index behaviour.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.stress_near_duplicate import (
    BLOCKS,
    MAX_DISTANCE,
    NearDuplicateIndex,
    difference_hash,
    hamming,
    slice_key,
)
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.types import SyntheticInputError


def flip(value: int, *bits: int) -> int:
    for bit in bits:
        value ^= 1 << bit
    return value


def test_blocks_partition_all_sixty_four_bits() -> None:
    covered = [bit for low, high in BLOCKS for bit in range(low, high)]
    assert covered == list(range(64))
    assert len(BLOCKS) == MAX_DISTANCE + 1


def test_hash_of_identical_drawing_is_stable() -> None:
    image = make_drawn_face().image
    assert difference_hash(image) == difference_hash(image.copy())


def test_hash_is_insensitive_to_uniform_brightness_but_not_to_mirroring() -> None:
    image = make_drawn_face().image
    brighter = np.clip(image.astype(np.int16) + 12, 0, 255).astype(np.uint8)
    assert hamming(difference_hash(image), difference_hash(brighter)) <= MAX_DISTANCE
    gradient = np.tile(np.arange(64, dtype=np.uint8) * 4, (64, 1))
    assert difference_hash(gradient) == 0
    assert difference_hash(gradient[:, ::-1].copy()) == (1 << 64) - 1


def test_grey_and_rgb_inputs_are_both_accepted() -> None:
    grey = np.tile(np.arange(32, dtype=np.uint8)[::-1] * 8, (32, 1))
    rgb = np.repeat(grey[:, :, None], 3, axis=2)
    assert difference_hash(grey) == difference_hash(rgb)


@pytest.mark.parametrize("bad", (
    np.zeros((4, 4), dtype=np.uint8),
    np.zeros((32, 32, 4), dtype=np.uint8),
    np.zeros((32, 32, 3), dtype=np.float32),
))
def test_unsupported_arrays_are_refused(bad: np.ndarray) -> None:
    with pytest.raises(SyntheticInputError):
        difference_hash(bad)


@pytest.mark.parametrize("distance", range(0, 7))
def test_index_boundary_four_inclusive_five_exclusive(distance: int) -> None:
    index = NearDuplicateIndex()
    base = 0x0123_4567_89AB_CDEF
    assert index.add(0, base, "slice") is None
    candidate = flip(base, *range(0, distance * 9, 9))
    match = index.add(1, candidate, "slice")
    if distance <= MAX_DISTANCE:
        assert match is not None and match.distance == distance
        assert match.reference_ordinal == 0
    else:
        assert match is None


def test_matches_spread_over_block_boundaries_are_found() -> None:
    index = NearDuplicateIndex()
    base = 0
    index.add(0, base, "s")
    edge_bits = (12, 13, 51, 52)
    match = index.add(1, flip(base, *edge_bits), "s")
    assert match is not None and match.distance == 4


def test_different_slices_never_suppress_each_other() -> None:
    first = slice_key(ALL_PROFILES[0].tags())
    second = slice_key(ALL_PROFILES[5].tags())
    assert first != second
    index = NearDuplicateIndex()
    assert index.add(0, 77, first) is None
    assert index.add(1, 77, second) is None
    assert index.add(2, 77, first) is not None


def test_closest_reference_is_reported() -> None:
    index = NearDuplicateIndex()
    index.add(0, flip(0, 1, 2, 3), "s")
    index.add(5, flip(0, 40, 41, 42, 43, 44, 45), "s")
    index.add(9, flip(0, 60, 61), "s")
    match = index.add(10, 0, "s")
    assert match is not None
    assert (match.reference_ordinal, match.distance) == (9, 2)
    assert [ordinal for ordinal, _ in index.query(0, "s")] == [9, 0]


def test_report_has_counts_and_ordinals_but_no_hash_values() -> None:
    index = NearDuplicateIndex()
    secret = 0xDEAD_BEEF_DEAD_BEEF
    index.add(3, secret, "s")
    index.add(4, secret, "s")
    report = index.report()
    assert report["accepted"] == 1 and report["rejected"] == 1
    assert report["matches"] == [{"ordinal": 4, "reference_ordinal": 3, "distance": 0}]
    assert str(secret) not in str(report) and hex(secret) not in str(report)


def test_rejected_entries_are_not_used_as_references() -> None:
    index = NearDuplicateIndex()
    index.add(0, 0, "s")
    index.add(1, flip(0, 0, 1, 2, 3), "s")
    assert index.query(flip(0, 0, 1, 2, 3, 4, 5, 6), "s") == []
    assert len(index) == 1


@pytest.mark.parametrize("bad", (-1, 1 << 64, True, 1.0, "1"))
def test_hash_values_must_be_unsigned_64_bit(bad: object) -> None:
    with pytest.raises(SyntheticInputError):
        NearDuplicateIndex().add(0, bad, "s")  # type: ignore[arg-type]


def test_ordinals_cannot_be_reused_and_capacity_is_bounded() -> None:
    index = NearDuplicateIndex(max_entries=2)
    index.add(0, 0, "s")
    with pytest.raises(SyntheticInputError):
        index.add(0, 1 << 40, "s")
    index.add(1, (1 << 64) - 1, "s")
    with pytest.raises(SyntheticInputError, match="capacity"):
        index.add(2, 0xFFFF_0000_FFFF_0000, "s")
