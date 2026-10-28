"""Uniqueness engine tests: fingerprints, near matches, SQLite persistence and scale.

The 10,000-per-occasion run uses the fast path (fingerprints and parameter distance only).
The 200-card run uses the full path with perceptual hashes of rendered designs.
Author: John Khan.
"""

from __future__ import annotations

import dataclasses
import itertools
from collections import defaultdict
from pathlib import Path

import pytest
from PIL import Image

from plumb_api.seasonal.cards import OCCASION_IDS, DesignStore, UniquenessExhaustedError
from plumb_api.seasonal.cards.fingerprint import (
    NEAR_HAMMING,
    NEAR_PARAM,
    design_key,
    design_phash,
    design_vector,
    hamming,
    param_distance,
    perceptual_scope,
    phash64,
)
from plumb_api.seasonal.cards.grammar import CardDesign, PatternSpec, design_from_seed
from plumb_api.seasonal.cards.patterns import PATTERN_SPECS
from plumb_api.seasonal.cards.uniqueness import UniquenessEngine, attempt_seed

FAST_PER_OCCASION = 10_000


def _nudged(seed: int, fraction: float) -> tuple[CardDesign, CardDesign]:
    design = design_from_seed("halloween", seed)
    spec = PATTERN_SPECS[design.pattern.family][0]
    delta = (spec.hi - spec.lo) * fraction
    params = tuple((name, value + delta if i == 0 else value)
                   for i, (name, value) in enumerate(design.pattern.params))
    other = dataclasses.replace(design, pattern=PatternSpec(design.pattern.family, params,
                                                            design.pattern.seed))
    return design, other


def test_fingerprint_is_stable_and_sensitive() -> None:
    a = design_key(design_from_seed("diwali", 5))
    assert a == design_key(design_from_seed("diwali", 5))
    assert len(a.fingerprint) == 32 and len(a.bucket) == 24
    assert a.fingerprint != design_key(design_from_seed("diwali", 6)).fingerprint


def test_fingerprint_ignores_sub_quantum_noise() -> None:
    design, other = _nudged(9, 1e-7)
    assert design_key(design).fingerprint == design_key(other).fingerprint


def test_small_parameter_change_is_a_near_match_not_an_exact_one() -> None:
    design, other = _nudged(9, 0.015)
    key_a, key_b = design_key(design), design_key(other)
    assert key_a.fingerprint != key_b.fingerprint
    assert key_a.bucket == key_b.bucket
    assert param_distance(key_a.vector, key_b.vector) < NEAR_PARAM
    store = DesignStore()
    store.add(key_a, "halloween", "x", 9)
    assert not store.has_fingerprint(key_b.fingerprint)
    assert store.nearest_param(key_b) < NEAR_PARAM


def test_param_distance_is_l_infinity() -> None:
    assert param_distance((0.0, 0.5), (0.1, 0.45)) == pytest.approx(0.1)
    assert param_distance((0.0,), (0.0, 1.0)) == float("inf")
    assert all(-0.01 <= v <= 1.6 for v in design_vector(design_from_seed("holi", 4)))


def test_phash_and_hamming_basics() -> None:
    design = design_from_seed("christmas", 12)
    assert design_phash(design) == design_phash(design)
    assert 0 <= design_phash(design) < 2 ** 64
    assert hamming(0, 2 ** 64 - 1) == 64
    assert hamming(0b1011, 0b0001) == 2
    assert phash64(Image.new("RGB", (64, 64))) == 0


def test_attempt_seeds_are_distinct() -> None:
    seeds = {attempt_seed(77, a) for a in range(50)}
    assert len(seeds) == 50
    assert attempt_seed(77, 0) == 77


def test_engine_refuses_the_same_seed_twice_and_redraws() -> None:
    engine = UniquenessEngine(DesignStore(), perceptual=False)
    first = engine.reserve("halloween", 42)
    second = engine.reserve("halloween", 42)
    assert first.attempts == 1
    assert second.attempts >= 2 and second.refusals["exact"] >= 1
    assert first.key.fingerprint != second.key.fingerprint


def test_engine_raises_a_clear_error_when_exhausted() -> None:
    engine = UniquenessEngine(DesignStore(), perceptual=False, max_attempts=1)
    engine.reserve("easter", 3)
    with pytest.raises(UniquenessExhaustedError) as info:
        engine.reserve("easter", 3)
    assert info.value.attempts == 1
    assert "easter" in str(info.value)
    with pytest.raises(ValueError):
        UniquenessEngine(DesignStore(), max_attempts=0)


def test_store_persists_across_reopen(tmp_path: Path) -> None:
    path = tmp_path / "designs.sqlite"
    with DesignStore(path) as store:
        engine = UniquenessEngine(store)
        issued = [engine.reserve("kwanzaa", seed) for seed in range(25)]
        assert len(store) == 25
    with DesignStore(path) as reopened:
        assert len(reopened) == 25
        assert set(reopened.fingerprints("kwanzaa")) == {r.key.fingerprint for r in issued}
        assert reopened.fingerprints("halloween") == []
        engine = UniquenessEngine(reopened)
        again = engine.reserve("kwanzaa", 0)
        assert again.attempts >= 2
        assert again.key.fingerprint not in {r.key.fingerprint for r in issued}
        first = issued[0]
        assert first.phash is not None
        assert reopened.nearest_phash("kwanzaa", perceptual_scope(first.design), first.phash) == 0


def test_empty_store_reports_no_neighbours() -> None:
    store = DesignStore()
    key = design_key(design_from_seed("hanukkah", 1))
    assert store.nearest_param(key) == float("inf")
    assert store.nearest_phash("hanukkah", "festival_lights", 123) == 65
    assert len(store) == 0


@pytest.mark.slow
@pytest.mark.parametrize("occasion_id", OCCASION_IDS)
def test_ten_thousand_cards_per_occasion_fast_path_has_zero_collisions(occasion_id: str) -> None:
    store = DesignStore()
    engine = UniquenessEngine(store, perceptual=False)
    keys = []
    refused = 0
    with store.batch():
        for seed in range(FAST_PER_OCCASION):
            reservation = engine.reserve(occasion_id, seed)
            keys.append(reservation.key)
            refused += reservation.attempts - 1
    fingerprints = [k.fingerprint for k in keys]
    assert len(set(fingerprints)) == FAST_PER_OCCASION
    assert len(store) == FAST_PER_OCCASION
    buckets: dict[str, list[tuple[float, ...]]] = defaultdict(list)
    for key in keys:
        buckets[key.bucket].append(key.vector)
    for vectors in buckets.values():
        for a, b in itertools.combinations(vectors, 2):
            assert param_distance(a, b) >= NEAR_PARAM
    assert refused < FAST_PER_OCCASION * 0.05


@pytest.mark.slow
def test_two_hundred_full_renders_have_no_perceptual_near_duplicates() -> None:
    store = DesignStore()
    engine = UniquenessEngine(store, perceptual=True)
    issued = [engine.reserve("halloween", 10_000 + seed) for seed in range(200)]
    by_look: dict[str, list[int]] = defaultdict(list)
    for reservation in issued:
        assert reservation.phash is not None
        recomputed = design_phash(reservation.design)
        assert recomputed == reservation.phash
        by_look[reservation.design.look].append(recomputed)
    for hashes in by_look.values():
        for a, b in itertools.combinations(hashes, 2):
            assert hamming(a, b) > NEAR_HAMMING
    assert len({r.key.fingerprint for r in issued}) == 200


def test_invisible_choices_do_not_create_distance() -> None:
    for seed in range(300):
        design = design_from_seed("halloween", seed)
        if design.layout.photo_shape == "rect" and design.frame.style == "none":
            break
    other = dataclasses.replace(
        design,
        layout=dataclasses.replace(design.layout, corner=design.layout.corner + 0.3),
        frame=dataclasses.replace(design.frame, inset=design.frame.inset + 9, width=6.5))
    assert design_vector(other) == design_vector(design)
    assert design_key(other).fingerprint == design_key(design).fingerprint


def test_perceptual_scope_separates_formats_and_looks() -> None:
    portrait = design_from_seed("diwali", 4, "diya_glow")
    square = design_from_seed("diwali", 4, "diya_glow", card_format="square")
    assert perceptual_scope(portrait) == "diya_glow@1080x1350"
    assert perceptual_scope(square) == "diya_glow@1080x1080"


def test_exclusive_section_rolls_back_on_error() -> None:
    store = DesignStore()
    key = design_key(design_from_seed("easter", 2))
    with pytest.raises(RuntimeError):
        with store.exclusive():
            store.add(key, "easter", "x", 2)
            raise RuntimeError("boom")
    assert len(store) == 0
    with store.exclusive():
        assert store.add(key, "easter", "x", 2)
    assert len(store) == 1
