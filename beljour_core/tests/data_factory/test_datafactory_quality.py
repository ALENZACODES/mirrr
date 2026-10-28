"""Quality scoring on drawn portraits and their degraded copies.

Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.data_factory import synthetic
from plumb_api.data_factory.quality_score import (
    QualityConfig,
    analysis_grey,
    laplacian_variance,
    noise_sigma,
    score_image,
)
from plumb_api.data_factory.records import FaceBox


@pytest.fixture(scope="module")
def sharp() -> np.ndarray:
    return synthetic.portrait(11, 512)


def test_clean_portrait_passes(sharp: np.ndarray) -> None:
    result = score_image(sharp)
    assert result.passed
    assert result.score > 0.9
    assert result.reasons == ["no quality issues found"]
    assert set(result.subscores) == {"blur", "exposure", "noise", "resolution"}


def test_blur_is_rejected(sharp: np.ndarray) -> None:
    result = score_image(synthetic.blurred(sharp, 6))
    assert not result.passed
    assert any(reason.startswith("blurred") for reason in result.rejects)
    assert result.subscores["blur"] == 0.0


def test_heavy_noise_is_rejected(sharp: np.ndarray) -> None:
    light = score_image(synthetic.noisy(sharp, 3.0, seed=1))
    heavy = score_image(synthetic.noisy(sharp, 30.0, seed=1))
    assert light.passed
    assert heavy.measures.noise_sigma > light.measures.noise_sigma
    assert any(reason.startswith("noisy") for reason in heavy.rejects)


def test_clipped_exposure(sharp: np.ndarray) -> None:
    bright = np.clip(sharp.astype(np.int64) + 200, 0, 255).astype(np.uint8)
    dark = (sharp * 0.02).astype(np.uint8)
    assert any("overexposed" in r for r in score_image(bright).rejects)
    assert any("underexposed" in r for r in score_image(dark).rejects)


def test_low_resolution(sharp: np.ndarray) -> None:
    small = score_image(synthetic.resized(sharp, 0.2))
    assert any("resolution too low" in r for r in small.rejects)
    medium = score_image(synthetic.resized(sharp, 0.5))
    assert medium.passed
    assert any("modest resolution" in r for r in medium.reasons)


def test_face_box_only_counts_when_supplied(sharp: np.ndarray) -> None:
    tiny = score_image(sharp, face_box=FaceBox(10, 10, 30, 30))
    assert any("face box too small" in r for r in tiny.rejects)
    assert "face" in tiny.subscores
    good = score_image(sharp, face_box=FaceBox(100, 100, 300, 300))
    assert good.passed and good.subscores["face"] == 1.0
    small_share = score_image(sharp, face_box=FaceBox(0, 0, 100, 100))
    assert any("face covers only" in r for r in small_share.reasons)


def test_measures_are_resolution_stable(sharp: np.ndarray) -> None:
    big = synthetic.resized(sharp, 2.0)
    a = score_image(sharp).measures.blur_variance
    b = score_image(big).measures.blur_variance
    assert b > a * 0.3
    assert analysis_grey(big, 512).shape == (512, 512)


def test_helpers_on_tiny_and_flat_images() -> None:
    assert laplacian_variance(np.zeros((2, 2))) == 0.0
    assert noise_sigma(np.zeros((2, 5))) == 0.0
    flat = np.full((64, 64), 128.0)
    assert laplacian_variance(flat) == 0.0
    assert noise_sigma(flat) == 0.0


def test_config_validation_and_round_trip() -> None:
    config = QualityConfig(min_score=0.7, weights={"blur": 1.0})
    again = QualityConfig.from_dict(config.to_dict())
    assert again == config
    for bad in ({"blur_good": 1.0}, {"clipped_good": 0.5}, {"noise_good": 50.0},
                {"min_side_good": 10}, {"face_min_side_good": 1}, {"min_score": 2.0},
                {"analysis_side": 8}, {"weights": {"mood": 1.0}}):
        with pytest.raises(ValueError):
            QualityConfig.from_dict(bad)
    with pytest.raises(ValueError):
        QualityConfig.from_dict({"unknown": 1})


def test_min_score_reject(sharp: np.ndarray) -> None:
    strict = QualityConfig(min_score=1.0)
    result = score_image(synthetic.resized(sharp, 0.5), strict)
    assert not result.passed
    assert any("overall score" in r for r in result.rejects)
    zero = QualityConfig(weights={"blur": 0.0, "exposure": 0.0, "noise": 0.0,
                                  "resolution": 0.0, "face": 0.0}, min_score=0.0)
    assert score_image(sharp, zero).score == 0.0


def test_result_json_is_rounded(sharp: np.ndarray) -> None:
    payload = score_image(sharp).to_dict()
    assert set(payload) == {"score", "passed", "subscores", "reasons", "rejects", "measures"}
    assert payload["measures"]["min_side"] == 512
