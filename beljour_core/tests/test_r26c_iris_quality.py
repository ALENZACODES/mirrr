"""Synthetic iris colour, catchlight and pupil quality measurements.

These measurements do not certify identity or real-face appearance.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.eyes.iris_quality import iris_tone_quality
from plumb_api.engines.eyes.iris_trial import IrisTrialEngine
from tests.r26c_iris_cases import Observed, scene


@pytest.mark.parametrize("tone", [26, 90, 160, 225])
@pytest.mark.parametrize("level", [1.0, 2.0, 3.5, 5.0])
def test_observed_irises_have_separate_texture_and_colour_metrics(
    tone: int, level: float,
) -> None:
    image, observed = scene(tone)
    output = IrisTrialEngine(Observed(observed)).render(image, box=(0, 0, 1, 1), level=level)
    measured = iris_tone_quality(image, output.image, observed.masks)
    assert measured.verdict == "UNPROVEN"
    assert measured.outside_max_abs_diff == 0
    assert measured.alpha_changes == 0
    for iris in (measured.right, measured.left):
        assert iris.status == "MEASURED"
        assert iris.observed_pixels > 12
        assert iris.catchlight_changes == 0
        assert iris.mean_rgb_shift is not None
        assert iris.mean_lightness_shift is not None
        if level == 1:
            assert iris.changed_pixels == 0
            assert iris.mean_rgb_shift == 0.0
        else:
            assert iris.changed_pixels > 0
        if iris.texture_correlation is not None:
            assert iris.texture_correlation >= 0.9
    report = measured.safe_counts()
    assert report["quality_verdict"] == "UNPROVEN"
    assert "image" not in report


@pytest.mark.parametrize("hidden", ["left", "right"])
def test_unobserved_iris_is_reported_not_measured(hidden: str) -> None:
    image, observed = scene(91, hidden=hidden)
    output = IrisTrialEngine(Observed(observed)).render(image, box=(0, 0, 1, 1))
    measured = iris_tone_quality(image, output.image, observed.masks)
    absent = getattr(measured, hidden)
    assert absent.status == "NOT_MEASURED"
    assert absent.observed_pixels == 0
    assert absent.mean_rgb_shift is None
    assert absent.texture_correlation is None
    opposite = measured.right if hidden == "left" else measured.left
    assert opposite.status == "MEASURED"
    assert measured.verdict == "UNPROVEN"


def test_bright_original_catchlight_is_unchanged() -> None:
    image, observed = scene()
    result = IrisTrialEngine(Observed(observed)).render(image, box=(0, 0, 1, 1))
    measured = iris_tone_quality(image, result.image, observed.masks)
    assert measured.right.catchlight_changes == 0
    assert measured.left.catchlight_changes == 0
    assert np.array_equal(result.image[17, 20], image[17, 20])
    assert np.array_equal(result.image[17, 58], image[17, 58])


def test_manual_pupil_mask_is_protected() -> None:
    image, observed = scene()
    pupil = {key: np.zeros(image.shape[:2]) for key in observed.masks}
    pupil["right_iris"][20:22, 21:23] = 1
    pupil["left_iris"][20:22, 59:61] = 1
    output = IrisTrialEngine(Observed(observed)).render(image, box=(0, 0, 1, 1))
    measured = iris_tone_quality(image, output.image, observed.masks, pupil)
    assert measured.right.pupil_changes == 0
    assert measured.left.pupil_changes == 0
    assert measured.verdict == "UNPROVEN"


def test_unprotected_pupil_difference_is_detected() -> None:
    image, observed = scene()
    pupil = {key: np.zeros(image.shape[:2]) for key in observed.masks}
    pupil["right_iris"][20, 21] = 1
    changed = image.copy()
    changed[20, 21, 1] += 1
    result = iris_tone_quality(image, changed, observed.masks, pupil)
    assert result.right.pupil_changes == 1
    assert result.verdict == "FAIL"


def test_changed_background_is_detected_regardless_of_iris_colour() -> None:
    image, observed = scene()
    altered = image.copy()
    altered[0, 0, 2] ^= np.uint8(1)
    result = iris_tone_quality(image, altered, observed.masks)
    assert result.outside_max_abs_diff == 1
    assert result.verdict == "FAIL"


def test_rgba_alpha_changes_are_reported() -> None:
    image, observed = scene(channels=4)
    changed = image.copy()
    changed[0, 0, 3] = 0
    result = iris_tone_quality(image, changed, observed.masks)
    assert result.alpha_changes == 1
    assert result.verdict == "FAIL"


@pytest.mark.parametrize("bad", [float("nan"), -0.2, 1.1, float("inf")])
def test_bad_mask_alpha_is_rejected(bad: float) -> None:
    image, observed = scene()
    observed.masks["right_iris"][20, 21] = bad
    with pytest.raises(ValueError, match="mask"):
        iris_tone_quality(image, image, observed.masks)


def test_mismatched_photo_dimensions_do_not_run_metrics() -> None:
    image, observed = scene()
    with pytest.raises(ValueError, match="identical dimensions"):
        iris_tone_quality(image, image[:30], observed.masks)


def test_malformed_pupil_contract_is_rejected() -> None:
    image, observed = scene()
    with pytest.raises(ValueError, match="both pupil"):
        iris_tone_quality(image, image, observed.masks, {"right_iris": np.zeros(image.shape[:2])})
