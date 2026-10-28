"""Independent detector/pixel checks detect broken claims. Author: John Khan."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.filters.artistic import render
from plumb_api.filters.artistic.benchmark import evaluate
from plumb_api.filters.artistic.inspection import (
    alpha_edges,
    geometry_observation,
    inspect_output,
    protected_pixels,
    texture_observation,
)
from tests.artistic_helpers import drawn


def test_independent_mesh_keeps_rigid_pose_out_of_shape_measurements() -> None:
    image, mesh, _, _ = drawn(100, 120)
    pixels = mesh * (100, 120)
    angle = 0.15
    rot = np.array([[np.cos(angle), -np.sin(angle)], [np.sin(angle), np.cos(angle)]])
    transformed = ((pixels - (50, 60)) @ rot.T * 0.8 + (48, 62)) / (100, 120)
    result = geometry_observation(mesh, transformed, image.shape[:2])
    assert result["status"] == "passed"
    assert result["metrics"]["aligned_rms_iod"] < 1e-12
    assert abs(result["metrics"]["global_scale_ratio"] - 0.8) < 1e-12


def test_independent_shape_stretch_is_not_erased_by_an_affine_fit() -> None:
    image, mesh, _, _ = drawn()
    altered = mesh.copy()
    altered[:, 1] = (altered[:, 1] - 0.5) * 1.2 + 0.5
    result = geometry_observation(mesh, altered, image.shape[:2])
    assert result["status"] == "failed"
    assert "face_height_relative_change" in result["failures"]
    assert result["metrics"]["face_height_relative_change"] > 0.19


def test_independent_mouth_width_shift_is_caught() -> None:
    image, mesh, _, _ = drawn()
    altered = mesh.copy()
    altered[61, 0] -= 0.03
    altered[291, 0] += 0.03
    result = geometry_observation(mesh, altered, image.shape[:2])
    assert result["status"] == "failed"
    assert "mouth_width_relative_change" in result["failures"]


def test_no_independent_detection_never_uses_original_mesh_as_fake_output() -> None:
    image, mesh, _, _ = drawn()
    absent = geometry_observation(mesh, None, image.shape[:2])
    invalid = geometry_observation(mesh, np.zeros((478, 2)), image.shape[:2])
    assert absent["status"] == invalid["status"] == "unproven"
    assert absent["reason"] == "no_independent_output_mesh"


def test_empty_protection_is_unobserved_and_a_real_pixel_error_is_measured() -> None:
    image, _, hair, _ = drawn()
    changed = image.copy()
    changed[0, 0, 0] = (int(image[0, 0, 0]) + 25) % 256
    result = protected_pixels(image, changed, hair)
    assert result["observed"] is True and result["exact"] is False
    assert result["max_error"] == 25
    absent = protected_pixels(image, image, np.zeros(hair.shape))
    assert absent["observed"] is False and absent["exact"] is False


def test_protection_inspection_is_independent_of_renderer_success_flags() -> None:
    image, mesh, hair, eyes = drawn()
    output = render("ink-study", image, landmarks=mesh, hair_mask=hair, eye_mask=eyes)
    output.image[0, 0, 0] = (int(image[0, 0, 0]) + 1) % 256
    assert output.metrics["hair_max_error"] == 0
    assert protected_pixels(image, output.image, hair)["max_error"] == 1


def test_texture_observation_reports_smoothing_without_rating_it() -> None:
    yy, xx = np.mgrid[:20, :20]
    checker = (((xx + yy) % 2) * 100 + 70).astype(np.uint8)
    image = np.repeat(checker[..., None], 3, axis=2)
    flat = np.full_like(image, 120)
    measured = texture_observation(image, flat, np.ones(image.shape[:2]))
    assert measured["status"] == "measured"
    assert measured["source_laplacian_energy"] > 0
    assert measured["output_laplacian_energy"] == 0
    assert measured["energy_ratio"] == 0
    assert "score" not in measured
    small = texture_observation(image, flat, np.zeros(image.shape[:2]))
    assert small["status"] == "unproven"


def test_alpha_inspection_catches_edited_invisible_rgb_and_alpha() -> None:
    image, _, _, _ = drawn(rgba=True)
    modified = image.copy()
    modified[0, 0, 0] = (int(image[0, 0, 0]) + 2) % 256
    modified[1, 4, 3] += 1
    result = alpha_edges(image, modified)
    assert result["alpha_max_error"] == 1
    assert result["transparent_rgb_max_error"] == 2
    assert result["fractional_alpha_pixels"] > 0
    assert alpha_edges(image[..., :3], image[..., :3])["status"] == "not_applicable"


def test_wrong_comparison_shapes_do_not_broadcast_silently() -> None:
    image, _, hair, _ = drawn()
    for call in (lambda: alpha_edges(image, image[:, :-1]),
                 lambda: protected_pixels(image, image[:, :-1], hair),
                 lambda: texture_observation(image, image[:, :-1], hair)):
        with pytest.raises(ValueError, match="same shape"):
            call()


def test_redetect_callback_sees_actual_output_copy_without_mutating_render() -> None:
    image, mesh, _, _ = drawn()
    expected = render("pigment-oil", image).image
    seen = []

    def detector(output: np.ndarray) -> np.ndarray:
        np.testing.assert_array_equal(output, expected)
        seen.append(output.copy())
        output[:] = 0
        return mesh.copy()

    row = evaluate("pigment-oil", image, mesh, redetect=detector)
    assert len(seen) == 1
    assert row["status"] == "passed"
    assert row["independent_inspection"]["geometry"]["status"] == "passed"
    assert row["quality_status"] == "Not tested"


def test_detector_failure_stays_unproven_and_measurements_remain_local_scalars() -> None:
    image, mesh, _, _ = drawn()

    def unavailable(_: np.ndarray) -> None:
        raise RuntimeError("local model absent")

    row = evaluate("pigment-oil", image, mesh, redetect=unavailable)
    assert row["independent_inspection"]["geometry"]["status"] == "unproven"
    missing = inspect_output(image, image)
    assert missing["hair"]["status"] == "unproven"
    assert missing["eyes"]["status"] == "unproven"
    assert missing["detail"]["status"] == "unproven"

