"""Brow intensity, skin-tone neutrality and refusal property regressions.

These are artificial colour and mask combinations, not population evidence.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.brows.trial import BrowTrialSession, PixelGuard
from plumb_api.engines.brows.trial_evidence import audit_brow_trial
from tests.r28c_brow_vectors import DrawnBrowSource, drawn_brows


@pytest.mark.parametrize("tone", [18, 28, 44, 62, 88, 114, 146, 180, 213, 235])
@pytest.mark.parametrize("mode", ["tint", "powder", "lamination"])
def test_local_treatment_never_auto_lightens_any_drawn_tone(tone: int, mode: str) -> None:
    frame, observation = drawn_brows(base=tone)
    source = DrawnBrowSource(observation)
    session = BrowTrialSession(source)
    result = session.render(frame, box=(0, 0, 1, 1), mode=mode, level=5)
    assert np.all(result.image[..., :3] <= frame[..., :3])
    observed = (observation.masks["right_brow"] >= 0.5) | (
        observation.masks["left_brow"] >= 0.5
    )
    np.testing.assert_array_equal(frame[~observed], result.image[~observed])
    assert audit_brow_trial(frame, result, observation.masks).verdict == "UNPROVEN"
    assert source.calls == 1


@pytest.mark.parametrize("mode", ["tint", "powder", "lamination"])
def test_tonal_change_is_nondecreasing_across_decimal_levels(mode: str) -> None:
    frame, observation = drawn_brows(base=220)
    session = BrowTrialSession(DrawnBrowSource(observation))
    previous = 0
    for tenth in range(10, 51):
        result = session.render(frame, box=(0, 0, 1, 1), mode=mode, level=tenth / 10)
        difference = np.abs(frame[..., :3].astype(np.int16) - result.image[..., :3])
        dose = int(np.sum(difference))
        assert dose >= previous
        assert result.guard_called
        previous = dose
    assert previous > 0
    assert session.mask_computations == 1


@pytest.mark.parametrize("scale", [1.0, 2.0, 3.5, 5.0])
def test_hidden_brow_with_protected_mark_preserves_all_context(scale: float) -> None:
    frame, observation = drawn_brows(4, hidden="left", protected=True, base=180)
    result = BrowTrialSession(DrawnBrowSource(observation)).render(
        frame, box=(0, 0, 1, 1), level=scale, shade="warm",
    )
    assert result.visible_brows == 1
    assert result.status in ("rendered", "neutral")
    assert observation.protected is not None
    np.testing.assert_array_equal(frame[observation.protected >= 0.5],
                                  result.image[observation.protected >= 0.5])
    assert audit_brow_trial(frame, result, observation.masks, observation.protected).verdict == "UNPROVEN"


@pytest.mark.parametrize("bad", [-0.02, 1.01, float("inf"), float("nan")])
def test_invalid_alpha_is_rejected_before_any_render(bad: float) -> None:
    frame, observation = drawn_brows()
    observation.masks["right_brow"][10, 8] = bad
    with pytest.raises(ValueError, match="alpha|finite"):
        BrowTrialSession(DrawnBrowSource(observation)).render(frame, box=(0, 0, 1, 1))


def test_actual_edits_are_local_even_after_an_untrusted_guard() -> None:
    frame, observation = drawn_brows(4, base=220)

    class OverreachingGuard:
        def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> object:
            return PixelGuard().guard(np.zeros_like(before), after, lock_level)

    result = BrowTrialSession(DrawnBrowSource(observation), OverreachingGuard()).render(
        frame, box=(0, 0, 1, 1),
    )
    report = audit_brow_trial(frame, result, observation.masks)
    assert report.changed_outside == 0
    assert report.alpha_changes == 0
