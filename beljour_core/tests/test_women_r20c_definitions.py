"""Every W feature has an independently falsifiable, preregistered pass contract.

These are synthetic contract checks, not claims about any face cohort.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from plumb_api.engines.women_styling import FEATURE_SPECS, PASS_DEFINITIONS, PreviewRequest, apply_preview, evaluate_frame
from test_women_r20c_engine import synthetic_frame, synthetic_masks


def test_definitions_cover_registry_without_duplicate_or_unreviewed_ids() -> None:
    assert [d.id for d in PASS_DEFINITIONS] == [s.id for s in FEATURE_SPECS]
    assert len({d.id for d in PASS_DEFINITIONS}) == len(PASS_DEFINITIONS) == len(FEATURE_SPECS)
    for definition, spec in zip(PASS_DEFINITIONS, FEATURE_SPECS, strict=True):
        assert definition.target_regions == spec.regions
        assert definition.outside_mask_changed_limit == 0
        assert definition.max_alpha_changed == 0
        assert definition.provider_call_limit == 0
        assert definition.max_rgb_channel_delta == spec.max_channel_delta
        assert definition.feature_name and definition.should_change
        assert definition.must_not_change and definition.claimed_scope
        assert "UNPROVEN" in definition.real_face_status
        assert "mask" in definition.must_not_change.lower()
        assert "simulation" in definition.must_not_change.lower() or "photo" in definition.must_not_change.lower()


@pytest.mark.parametrize("spec", FEATURE_SPECS, ids=lambda s: s.id)
def test_pass_definitions_score_one_synthetic_success_and_four_failures(spec: object) -> None:
    from plumb_api.engines.women_styling.specs import FeatureSpec
    assert isinstance(spec, FeatureSpec)
    source = synthetic_frame()
    masks = synthetic_masks()
    result = apply_preview(source, masks, PreviewRequest(spec.id, spec.variants[0], 98))
    good = evaluate_frame(spec.id, source, result.pixels, masks, result.evidence)
    assert good.accepted and good.changed_pixels > 0
    # No-effect must fail unless the examiner explicitly opts out of the effect requirement.
    zero = evaluate_frame(spec.id, source, source.copy(), masks)
    assert "NO_VISIBLE_EFFECT" in zero.failures
    assert evaluate_frame(spec.id, source, source.copy(), masks, require_effect=False).accepted
    # Alter exactly one fully unauthorized pixel, independent of input skin colour.
    breach = result.pixels.copy()
    breach[0, 0, 0] = (int(breach[0, 0, 0]) + 8) % 256
    forbidden = evaluate_frame(spec.id, source, breach, masks)
    assert "OUTSIDE_MASK_EDIT" in forbidden.failures
    # Alpha preservation is mandatory, even inside a permitted region.
    faded = result.pixels.copy()
    faded[1, 1, 3] = (int(faded[1, 1, 3]) + 11) % 256
    assert "ALPHA_MODIFIED" in evaluate_frame(spec.id, source, faded, masks).failures
    # Forged values in the evidence may not launder privacy risks.
    forged = replace(result.evidence, provider_calls=1, simulated=False,
                     changed_pixels=result.evidence.changed_pixels + 1)
    questionable = evaluate_frame(spec.id, source, result.pixels, masks, forged)
    assert "UNEXPECTED_PROVIDER_USE" in questionable.failures
    assert "SIMULATION_DISCLOSURE_MISSING" in questionable.failures
    assert "EVIDENCE_MISMATCH" in questionable.failures


def test_unregistered_feature_is_not_silently_accepted_by_real_face_audit() -> None:
    source = synthetic_frame()
    with pytest.raises(ValueError, match="Unregistered"):
        evaluate_frame("W14", source, source, synthetic_masks())


def test_wrong_output_dimensions_and_masks_fail_instead_of_comparing_cropped_regions() -> None:
    source = synthetic_frame()
    with pytest.raises(ValueError, match="dimensions differ"):
        evaluate_frame("W4", source, source[1:], synthetic_masks())
    with pytest.raises(ValueError, match="exact image size"):
        evaluate_frame("W4", source, source, {"cheek_left": np.ones((2, 3), dtype=np.uint8)})
