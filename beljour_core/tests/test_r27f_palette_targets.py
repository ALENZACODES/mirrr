"""Hair palette display targets: guarded output against the expected on-screen composite.

Drawn controlled patches only; not dye calibration. Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.hair_palette import catalogue
from plumb_api.engines.hair_palette.evidence import (
    CONTROL_ANCHORS,
    DISPLAY_TOLERANCE,
    _hair_support,
    audit_palette_targets,
    control_case,
    expected_composite,
    target_evidence,
)


@pytest.mark.parametrize("level", [2.0, 3.5, 5.0])
def test_all_90_swatches_meet_the_display_target(level: float) -> None:
    audit = audit_palette_targets(level)
    body = audit.public()
    assert body["swatches"] == 90 == len(catalogue()) and body["meets_target"] == 90
    assert body["worst_delta_e"] <= DISPLAY_TOLERANCE and body["guard_blended"] == 0


def test_evidence_checks_bytes_alpha_and_source() -> None:
    image, mask = control_case()
    before = image.copy()
    found = target_evidence(image, mask, CONTROL_ANCHORS, catalogue()[20].id, 4.0, allow_lightening=True)
    assert found.status == "meets_target" and found.outside_unchanged and found.alpha_unchanged
    assert found.source_unchanged and np.array_equal(image, before)
    assert found.public()["kind"] == "on_screen_composite_not_dye"


def test_level_one_and_refusals_are_not_targets_met() -> None:
    image, mask = control_case()
    assert target_evidence(image, mask, CONTROL_ANCHORS, "natural-01-n", 1.0).status == "unchanged"
    assert target_evidence(image, mask, None, "natural-01-n").code == "no_mesh"
    lighter = target_evidence(image, mask, CONTROL_ANCHORS, "natural-10-n", 5.0)
    assert (lighter.status, lighter.code) == ("refused", "lightening_not_automatic")


def test_a_large_patch_that_trips_the_identity_guard_is_reported() -> None:
    image = np.full((32, 32, 4), 200, dtype=np.uint8)
    mask = np.zeros((32, 32), dtype=np.uint8)
    mask[4:28, 4:28] = 255
    image[4:28, 4:28, :3] = (20, 15, 12)
    found = target_evidence(image, mask, CONTROL_ANCHORS, "natural-10-n", 5.0, allow_lightening=True)
    assert found.guard_blended and found.status == "misses_target"
    assert found.max_delta_e is not None and found.max_delta_e > DISPLAY_TOLERANCE


def test_composite_and_support_rules() -> None:
    image, mask = control_case()
    allow = _hair_support(mask, 96, 96, (44, 44, 47, 50))
    assert int(allow.sum()) == 3 * 6
    mixed = expected_composite(image, allow, "natural-01-n", 5.0)
    assert np.array_equal(mixed[~allow], image[~allow]) and not np.array_equal(mixed[allow], image[allow])
    assert _hair_support(mask.astype(bool), 96, 96, None).sum() == 36
    for bad in (mask[:-1], mask.astype(np.float64) * 2, mask.astype(np.int32)):
        with pytest.raises(ValueError):
            _hair_support(bad, 96, 96, None)
