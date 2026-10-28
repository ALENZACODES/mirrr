"""Identity limit calibration: error rates, equal error rate, and usability rules.

The PROXY on drawn faces supplies realistic-looking distance lists; its limit
must always come back as not usable for the gate.
Author: John Khan.
"""

from __future__ import annotations

import hashlib

import numpy as np
import pytest
from numpy.typing import NDArray

from lab.ml.critic import FaceBox
from lab.ml.identity import (
    AdmissionRecord,
    GeometryProxyEmbedder,
    ProvenanceLink,
    admit_embedder,
    cosine_distance,
    draw_face,
    random_geometry,
)
from lab.ml.identity.calibration import (
    calibrate_limit,
    equal_error_rate,
    error_rates,
)

WEIGHTS = b"made-up calibration weights"


class FlatEmbedder:
    """Test-only embedder used to obtain an AdmittedEmbedder instance."""

    @property
    def name(self) -> str:
        return "flat-test"

    @property
    def version(self) -> str:
        return "1"

    def embed(self, image: NDArray[np.float64], box: FaceBox) -> NDArray[np.float64]:
        return np.array([1.0, 0.0])


def admitted() -> object:
    record = AdmissionRecord("flat-test", "1", "MIT", True, hashlib.sha256(WEIGHTS).hexdigest(),
                             (ProvenanceLink("drawn", "generator", "MIT", True),))
    return admit_embedder(FlatEmbedder(), record, weights=WEIGHTS, excluded=frozenset())


def proxy_distances(count: int, seed: int) -> tuple[list[float], list[float]]:
    rng = np.random.default_rng(seed)
    proxy = GeometryProxyEmbedder()
    same, different = [], []
    for _ in range(count):
        geometry = random_geometry(rng)
        first = draw_face(geometry, 128, rng=rng)
        again = draw_face(geometry, 160, 0.62, (0.47, 0.52), rng=rng)
        other = draw_face(random_geometry(rng), 128, rng=rng)
        base = proxy.embed(first.image, first.box)
        same.append(cosine_distance(base, proxy.embed(again.image, again.box)))
        different.append(cosine_distance(base, proxy.embed(other.image, other.box)))
    return same, different


def test_error_rates_on_known_lists() -> None:
    same = [0.1, 0.2, 0.3, 0.6]
    different = [0.25, 0.5, 0.7, 0.9]
    assert error_rates(same, different, 0.3) == (0.25, 0.25)
    assert error_rates(same, different, 0.0) == (0.0, 1.0)
    assert error_rates(same, different, 1.0) == (1.0, 0.0)


def test_equal_error_rate_of_separated_lists_is_zero() -> None:
    eer, limit = equal_error_rate([0.01, 0.02], [0.5, 0.6])
    assert eer == 0.0
    assert 0.02 <= limit < 0.5


def test_calibrated_limit_respects_the_false_accept_target() -> None:
    rng = np.random.default_rng(1)
    same = np.abs(rng.normal(0.05, 0.03, 2000)).tolist()
    different = np.abs(rng.normal(0.4, 0.1, 2000)).tolist()
    choice = calibrate_limit(same, different, admitted(), max_false_accept=0.01, min_pairs=1000)
    assert choice.false_accept_rate <= 0.01
    assert choice.usable_for_gate
    looser, _ = error_rates(same, different, choice.limit + 0.02)
    assert looser > 0.01 or choice.limit + 0.02 > max(different)


def test_proxy_limit_is_never_usable() -> None:
    same, different = proxy_distances(30, 2)
    choice = calibrate_limit(same, different, GeometryProxyEmbedder(), max_false_accept=0.05)
    assert not choice.usable_for_gate
    assert any("without an admitted embedder" in note for note in choice.notes)
    assert choice.false_accept_rate <= 0.05
    assert choice.false_reject_rate < 0.5
    assert "Usable for the identity gate: NO" in choice.to_markdown()


def test_small_samples_are_not_trusted() -> None:
    choice = calibrate_limit([0.01] * 10, [0.5] * 10, admitted(), min_pairs=100)
    assert not choice.usable_for_gate
    assert any("fewer than 100 pairs" in note for note in choice.notes)


def test_bad_inputs_are_rejected() -> None:
    with pytest.raises(ValueError, match="non-empty"):
        error_rates([], [0.1], 0.1)
    with pytest.raises(ValueError, match="non-negative"):
        error_rates([-0.1], [0.1], 0.1)
    with pytest.raises(ValueError, match="max_false_accept"):
        calibrate_limit([0.1], [0.2], None, max_false_accept=1.0)
