"""W69/W70 tests: observed support, sparse truth, grey resistance and transport.

Pass definitions are independent pixel invariants: no changed pixel outside mask,
zero is exact identity, grey reduces actual tint change, lamination is a bounded
permutation and has no interpolation. Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.brows import BrowEvidence, observe_brows, render_brows
from plumb_api.engines.brows.contracts import validate_evidence
from plumb_api.engines.brows.evidence import components
from plumb_api.engines.brows.geometry import brow_frames, union
from plumb_api.engines.brows.synthetic import brow_fixture


@pytest.mark.parametrize("tone", [45, 75, 110, 150, 190, 225])
def test_tint_changes_only_observed_hair_on_every_drawn_tone(tone: int) -> None:
    image, points, evidence = brow_fixture(tone=tone)
    before = image.copy()
    face_before = points.copy()
    result = render_brows(image, points, "W69", {"colour": [54, 35, 27], "amount": 1}, evidence)
    assert np.array_equal(image, before)
    assert np.array_equal(points, face_before)
    assert np.array_equal(result.image[evidence.coverage == 0], image[evidence.coverage == 0])
    assert np.count_nonzero(np.any(result.image != image, axis=2)) > 0
    assert result.metrics["added_hairs"] == 0
    assert result.metrics["biological_hair_count"] is None
    assert result.metrics["skin_gap_unchanged"] is True
    assert "simulation" in result.label.lower()


@pytest.mark.parametrize("feature", ["W69", "W70"])
def test_observed_zero_is_exact_identity_and_owns_output(feature: str) -> None:
    image, points, evidence = brow_fixture(rgba=True)
    result = render_brows(image, points, feature, {"amount": 0}, evidence)
    assert np.array_equal(result.image, image)
    assert np.count_nonzero(result.support) == 0
    assert not np.shares_memory(result.image, image)
    assert not np.shares_memory(result.support, evidence.coverage)
    assert result.metrics["changed_pixels"] == 0


def test_grey_resistance_reduces_change_without_filling_sparse_gaps() -> None:
    image, points, evidence = brow_fixture(grey=True)
    opts = {"amount": 1, "colour": [30, 24, 20]}
    resistant = render_brows(image, points, "W69", {**opts, "greyResistance": 1}, evidence)
    receptive = render_brows(image, points, "W69", {**opts, "greyResistance": 0}, evidence)
    grey = evidence.grey > 0
    nongrey = (evidence.coverage > 0) & ~grey
    assert np.array_equal(resistant.image[grey], image[grey])
    assert np.any(receptive.image[grey] != image[grey])
    assert np.array_equal(resistant.image[nongrey], receptive.image[nongrey])
    assert np.array_equal(resistant.image[evidence.coverage == 0], image[evidence.coverage == 0])


def test_first_week_is_darker_than_settled_and_faded_on_same_photo() -> None:
    image, points, evidence = brow_fixture()
    settings = {"amount": 1, "colour": [0, 0, 0]}
    results = [render_brows(image, points, "W69", {**settings, "state": state}, evidence)
               for state in ("first_week", "settled", "faded")]
    mask = evidence.coverage > 0
    means = [float(np.mean(result.image[mask, :3])) for result in results]
    assert means[0] < means[1] < means[2]
    assert any("duration guarantee" in warning for warning in results[0].warnings)


def test_no_evidence_refuses_tint_and_lamination_instead_of_inventing_hair() -> None:
    image, points, _ = brow_fixture()
    empty = np.zeros(image.shape[:2])
    evidence = BrowEvidence(empty, empty.copy(), "manual", 1)
    for feature in ("W69", "W70"):
        result = render_brows(image, points, feature, {}, evidence)
        assert result.status == "unavailable"
        assert np.array_equal(result.image, image)
        assert result.metrics["added_hairs"] == 0
        assert result.warnings


@pytest.mark.parametrize("angle", [15, 45, 70, 85])
@pytest.mark.parametrize("roll", [-18, 0, 21])
def test_lamination_is_an_exact_rgb_permutation_and_preserves_alpha(angle: int, roll: int) -> None:
    image, points, evidence = brow_fixture(128, roll=roll, rgba=True)
    result = render_brows(image, points, "W70", {"amount": 1, "angle": angle}, evidence)
    for channel in range(3):
        assert np.array_equal(np.sort(image[..., channel].ravel()), np.sort(result.image[..., channel].ravel()))
    assert np.array_equal(image[..., 3], result.image[..., 3])
    assert np.array_equal(result.image[result.support == 0], image[result.support == 0])
    assert result.metrics["smoothing_applied"] is False
    assert result.metrics["length_scale"] == 1
    assert result.metrics["added_hairs"] == 0
    assert result.metrics["maximum_movement_px"] <= max(frame.width for frame in brow_frames(points, 128, 128)) * 0.25
    assert result.metrics["transported_pixels"] * 2 == np.count_nonzero(result.support)


def test_lamination_transports_pixels_in_a_visible_fixture() -> None:
    image, points, evidence = brow_fixture()
    result = render_brows(image, points, "W70", {"amount": 1, "angle": 75}, evidence)
    assert result.status == "simulation"
    assert result.metrics["transported_pixels"] > 0
    assert result.metrics["changed_pixels"] > 0
    assert set(np.unique(result.image[..., 0])).issubset(set(np.unique(image[..., 0])))


def test_lamination_refuses_a_connected_unseparated_brow_patch() -> None:
    image, points, _ = brow_fixture()
    region = union(brow_frames(points, 128, 128))
    evidence = BrowEvidence((region >= 0.5).astype(float), np.zeros_like(region), "manual", 1)
    result = render_brows(image, points, "W70", {"amount": 1}, evidence)
    assert result.status == "unavailable"
    assert result.metrics["refused_components"] == 2
    assert np.array_equal(result.image, image)


def test_observer_reports_heuristic_origin_and_has_no_biological_count() -> None:
    image, points, _ = brow_fixture()
    evidence = observe_brows(image, points)
    region = union(brow_frames(points, 128, 128))
    assert evidence.origin == "contrast"
    assert 0 <= evidence.confidence <= 0.85
    assert np.all(evidence.coverage[region == 0] == 0)
    assert np.all(evidence.grey <= evidence.coverage)
    assert all("estimate" in note or "manual" in note for note in evidence.notes)


def test_uniform_photo_does_not_create_dark_brow_evidence() -> None:
    image, points, _ = brow_fixture()
    image[..., :3] = (80, 67, 58)
    evidence = observe_brows(image, points)
    assert evidence.confidence == 0
    assert not np.any(evidence.coverage)
    assert not np.any(evidence.grey)


def test_manual_mask_outside_brows_is_rejected() -> None:
    image, points, evidence = brow_fixture()
    illegal = evidence.coverage.copy()
    illegal[-1, -1] = 1
    with pytest.raises(ValueError, match="inside"):
        render_brows(image, points, "W69", evidence=BrowEvidence(illegal, evidence.grey, "manual", 1))


def test_grey_coverage_cannot_exceed_hair_coverage() -> None:
    image, points, evidence = brow_fixture()
    grey = evidence.grey.copy()
    grey[0, 0] = 1
    with pytest.raises(ValueError, match="grey coverage"):
        validate_evidence(BrowEvidence(evidence.coverage, grey), image, union(brow_frames(points, 128, 128)))


def test_transparent_pixels_are_never_laminated() -> None:
    image, points, evidence = brow_fixture(rgba=True)
    image[evidence.coverage > 0, 3] = 0
    result = render_brows(image, points, "W70", {"amount": 1}, evidence)
    assert np.array_equal(result.image, image)
    assert result.metrics["transported_pixels"] == 0


def test_component_connectivity_and_limit_are_explicit() -> None:
    cover = np.zeros((8, 8))
    cover[1, 1:4] = 1
    cover[3, 4] = 1
    found = components(cover)
    assert sorted(map(len, found)) == [1, 3]
    assert set(found[0]) == {(1, 1), (2, 1), (3, 1)}
    with pytest.raises(ValueError, match="too many"):
        components(cover, limit=1)
