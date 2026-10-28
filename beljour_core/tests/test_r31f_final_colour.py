"""R31F final-pixel colour evidence on drawn pixels only: no photographs or products.

Pass definition: changes outside the allowed region or to alpha refuse; untouched
output is reported as unchanged; a rendered region is measured against the chosen
swatch before and after, and moving away from it is recorded as an adverse shift.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.concealer.colour_evidence import audit_final_colour
from plumb_api.engines.concealer.colour_workflow import TintedFibreWorkflow, plan_tint
from plumb_api.engines.concealer.cover import CoverDecision
from plumb_api.engines.hair_palette.catalogue import require_shade
from tests.r31f_fibre_scene import HEAD, scene

TARGET = require_shade("natural-04-n").lab


def allowed() -> np.ndarray:
    _, region, scalp = scene()
    return (region > 0) & (scalp > 0)


def tinted(share: float = 0.6) -> np.ndarray:
    image, _, _ = scene()
    out = image.copy()
    mask = allowed()
    out[mask] = np.rint(image[mask] * (1 - share) + np.asarray(require_shade("natural-04-n").rgb) * share)
    return out


def test_closer_render_is_measured_against_the_chosen_swatch() -> None:
    image, _, _ = scene()
    found = audit_final_colour(image, tinted(), allowed(), TARGET)
    assert found.status == "rendered_closer" and found.code is None
    assert (found.region_pixels, found.changed_pixels, found.outside_changed) == (820, 820, 0)
    assert found.after_delta_e is not None and found.before_delta_e is not None
    assert found.after_delta_e < found.before_delta_e
    assert found.shift is not None and found.shift < 0


def test_untouched_output_is_unchanged_not_improved() -> None:
    image, _, _ = scene()
    found = audit_final_colour(image, image.copy(), allowed(), TARGET)
    assert (found.status, found.changed_pixels, found.before_delta_e) == ("unchanged", 0, None)


def test_change_outside_the_allowed_region_refuses() -> None:
    image, _, _ = scene()
    after = tinted()
    after[0, 0] = (0, 0, 0)
    found = audit_final_colour(image, after, allowed(), TARGET)
    assert (found.status, found.code, found.outside_changed) == ("refused", "protected_region_changed", 1)
    assert found.after_delta_e is None


def test_alpha_change_refuses() -> None:
    image, _, _ = scene(alpha=True)
    after = image.copy()
    after[allowed(), :3] = 90
    after[50, 50, 3] = 0
    assert audit_final_colour(image, after, allowed(), TARGET).code == "alpha_changed"


def test_empty_region_and_bad_inputs_refuse() -> None:
    image, _, _ = scene()
    empty = np.zeros(image.shape[:2], dtype=bool)
    assert audit_final_colour(image, image, empty, TARGET).code == "empty_region"
    with pytest.raises(ValueError):
        audit_final_colour(image, image[:10], allowed(), TARGET)
    with pytest.raises(ValueError):
        audit_final_colour(image.astype(np.float64), image, allowed(), TARGET)
    with pytest.raises(ValueError):
        audit_final_colour(image, image, allowed(), (120.0, 0.0, 0.0))


class AwayGuard:
    """A test guard that pushes the shown pixels towards white, away from a deep swatch."""

    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> CoverDecision:
        return CoverDecision(np.full_like(after, 250), 0.5, True)


def test_adverse_shift_from_the_real_renderer_is_recorded_not_hidden() -> None:
    from tests.r31f_fibre_scene import readings

    image, region, scalp = scene()
    receipt = TintedFibreWorkflow().render(plan_tint(readings()), image, region, scalp,
                                           landmarks=HEAD, level=4.0, guard=AwayGuard())
    assert receipt.status == "adverse_shift"
    assert receipt.evidence is not None and receipt.evidence.shift is not None
    assert receipt.evidence.shift > 0


def test_public_evidence_holds_counts_and_distances_only() -> None:
    image, _, _ = scene()
    public = audit_final_colour(image, tinted(), allowed(), TARGET).public()
    assert set(public) == {"format", "status", "code", "region_pixels", "changed_pixels", "outside_changed",
                           "before_delta_e", "after_delta_e", "shift_delta_e", "label",
                           "tested_against_real_products"}
    assert public["tested_against_real_products"] is False
