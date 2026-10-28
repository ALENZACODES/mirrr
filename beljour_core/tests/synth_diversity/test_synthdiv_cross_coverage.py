"""End-to-end synthetic stratum combinations with no raster test artifacts.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.synth_diversity.age import apply_age
from lab.synth_diversity.compose import compose_face
from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.mask_checks import overlay_scores
from lab.synth_diversity.overlays import apply_overlays
from lab.synth_diversity.skin_marks import apply_rosacea
from lab.synth_diversity.skin_tone import adjust_skin_tone
from lab.synth_diversity.strata import ChallengeCase, challenge_cases
from lab.synth_diversity.trait_evidence import stage_evidence
from lab.synth_diversity.types import BaseFace


@pytest.mark.parametrize("case", challenge_cases(52), ids=lambda case: case.name)
def test_every_declared_stratum_composes_on_drawing(case: ChallengeCase) -> None:
    face = make_drawn_face(seed=52)
    outcome = compose_face(face, case.plan)
    identical = compose_face(face, case.plan)
    assert outcome.image.dtype == np.uint8
    assert outcome.image.shape == face.image.shape
    assert outcome.base_source_id == "S02"
    assert outcome.plan.tags == case.plan.tags
    np.testing.assert_array_equal(outcome.image, identical.image)
    for label, mask in outcome.trait_masks.items():
        assert np.isfinite(mask).all(), label
        assert float(mask.min(initial=0)) >= 0
        assert float(mask.max(initial=0)) <= 1
    for label, mask in outcome.occlusion_masks.items():
        assert np.isfinite(mask).all(), label
        assert mask.shape == face.skin_mask.shape
    assert outcome.parameters["tone"]["target"] == case.plan.tags["fitzpatrick"]
    assert outcome.parameters["age"]["band"] == case.plan.tags["age_band"]
    for name in ("freckles", "birthmark", "scar", "acne", "rosacea"):
        if case.plan.tags[name] == "none":
            assert not outcome.trait_masks[name].any()
        else:
            assert outcome.trait_masks[name].sum() > 0
    if case.plan.tags["vitiligo"] == "none":
        assert not outcome.trait_masks["vitiligo"].any()
    else:
        assert abs(float(outcome.parameters["vitiligo"]["coverage_measured"])
                   - float(case.plan.tags["vitiligo_coverage"])) < 0.02
    for name in ("freckles", "birthmark", "scar", "acne", "rosacea", "vitiligo"):
        assert not outcome.trait_masks[name][face.skin_mask == 0].any()
    if case.plan.tags["head_covering"] != "none":
        assert outcome.occlusion_masks["head_covering"].sum() > 0
    if case.plan.tags["beard"] != "none":
        assert outcome.occlusion_masks["beard"].sum() > 0
    if case.plan.tags["glasses"] != "none":
        assert outcome.occlusion_masks["glasses"].sum() > 0


@pytest.mark.parametrize("source_id", ["S02", "S05"])
def test_rare_stratum_does_not_change_source_provenance(source_id: str) -> None:
    old = make_drawn_face(seed=8)
    source = BaseFace(
        old.image, old.skin_mask, old.hair_mask, "two_sources",
        old.landmarks, old.groups, old.iris_mask, source_id,
    )
    plan = challenge_cases(10, include=("deep_focal",))[0].plan
    built = compose_face(source, plan)
    assert built.base_source_id == source_id
    assert built.plan.parameters["synthetic_only"] is True
    assert built.plan.parameters["train_allowed"] is False
    assert source.source_id == source_id


@pytest.mark.parametrize("size", [(96, 112), (192, 224), (512, 512)])
def test_older_skin_and_hair_mask_aligned_across_resolution(
    size: tuple[int, int]
) -> None:
    face = make_drawn_face(size=size, seed=3)
    bands = ["0-9", "20-29", "40-49", "60-69", "70+"]
    outcomes = [apply_age(face.image, face, band, 14) for band in bands]
    assert all(item.image.shape == face.image.shape for item in outcomes)
    assert all(item.grey_mask.shape == face.hair_mask.shape for item in outcomes)
    assert outcomes[-1].grey_hair_coverage > outcomes[0].grey_hair_coverage
    assert outcomes[-1].wrinkle_coverage > outcomes[0].wrinkle_coverage
    assert not outcomes[0].grey_mask.any()
    for item in outcomes:
        assert not item.grey_mask[face.hair_mask == 0].any()
        assert not item.wrinkle_mask[face.skin_mask == 0].any()


@pytest.mark.parametrize("kind", ["hijab", "turban", "kippah"])
def test_head_covering_keeps_both_eyes_exposed_with_deep_palette(kind: str) -> None:
    face = make_drawn_face(seed=71)
    dark = adjust_skin_tone(face.image, face.skin_mask, "VI").image
    overlay = apply_overlays(dark, face, kind, "none", "none", 7)
    scores = overlay_scores(
        face, overlay.head_covering_mask, overlay.beard_mask, overlay.glasses_mask
    )
    assert scores.eye_open_fraction > 0.95
    assert scores.mouth_open_fraction > 0.95
    assert scores.headwear_hair_occlusion > 0.1
    assert scores.headwear_around_hairline > 0.1
    for x, y in face.group_points("eyes"):
        assert overlay.head_covering_mask[int(y), int(x)] < 0.1


def test_deep_tone_mild_rosacea_measurement_exposes_low_redness_contrast() -> None:
    face = make_drawn_face(seed=22)
    lighter = adjust_skin_tone(face.image, face.skin_mask, "II").image
    deeper = adjust_skin_tone(face.image, face.skin_mask, "VI").image
    first = apply_rosacea(lighter, face, "mild", seed=19)
    second = apply_rosacea(deeper, face, "mild", seed=19)
    light = stage_evidence(lighter, first.image, face.skin_mask,
                           first.mask, core_threshold=0.1)
    dark = stage_evidence(deeper, second.image, face.skin_mask,
                          second.mask, core_threshold=0.1)
    assert light.changed_outside_allowed_pixels == 0
    assert dark.changed_outside_allowed_pixels == 0
    assert dark.mean_delta_a < light.mean_delta_a
    assert dark.mean_delta_e76 < light.mean_delta_e76
    # Measured limitation: do not misreport similar detectability for every skin tone.
    assert dark.mean_delta_a < 0.25


def test_compound_freckles_vitiligo_scar_preserves_original() -> None:
    case = challenge_cases(8, include=("focal_freckles",))[0]
    face = make_drawn_face(seed=82)
    original = face.image.copy()
    built = compose_face(face, case.plan)
    assert built.trait_masks["vitiligo"].sum() > 0
    assert built.trait_masks["freckles"].sum() > 0
    assert built.plan.tags["freckles"] == "light"
    assert built.plan.tags["vitiligo"] == "focal"
    np.testing.assert_array_equal(face.image, original)
    assert not np.may_share_memory(face.image, built.image)
    assert set(built.occlusion_masks) == {"head_covering", "beard", "glasses"}
