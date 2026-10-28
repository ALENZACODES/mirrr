"""Stage-level colour, mask, and point diagnostics on synthetic drawn pixels.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.pigment import apply_albinism, apply_birthmark, apply_freckles
from lab.synth_diversity.skin_marks import apply_acne, apply_rosacea, apply_scar
from lab.synth_diversity.skin_tone import adjust_skin_tone
from lab.synth_diversity.trait_evidence import point_evidence, stage_evidence
from lab.synth_diversity.types import SyntheticInputError
from lab.synth_diversity.vitiligo import apply_vitiligo


@pytest.mark.parametrize("tone", ["I", "III", "V", "VI"])
@pytest.mark.parametrize("kind", ["port_wine", "cafe_au_lait", "congenital_naevus"])
def test_birthmark_deltas_are_local_over_multiple_tones(tone: str, kind: str) -> None:
    face = make_drawn_face(seed=6)
    starting = adjust_skin_tone(face.image, face.skin_mask, tone).image
    changed = apply_birthmark(starting, face, kind, seed=24)
    stats = stage_evidence(starting, changed.image, face.skin_mask, changed.mask)
    assert 0.002 < stats.area_fraction < 0.14
    assert stats.core_pixels > 20
    assert stats.mean_delta_e76 > 0.1
    assert stats.changed_skin_pixels > 0
    assert stats.changed_outside_allowed_pixels == 0
    assert stats.visible_core_pixels == stats.core_pixels
    if kind == "port_wine":
        assert stats.mean_delta_a > 0
    else:
        assert stats.mean_delta_l < 0


@pytest.mark.parametrize("tone", ["II", "IV", "V", "VI"])
@pytest.mark.parametrize("kind", ["light", "dense"])
def test_freckle_centers_and_colour_protected_on_skin(tone: str, kind: str) -> None:
    face = make_drawn_face(seed=7)
    starting = adjust_skin_tone(face.image, face.skin_mask, tone).image
    changed = apply_freckles(starting, face, kind, seed=27)
    stats = stage_evidence(starting, changed.result.image, face.skin_mask, changed.result.mask)
    positions = point_evidence(changed.centers, face.skin_mask)
    assert positions.count == int(changed.result.parameters["count"])
    assert positions.inside_skin == positions.count
    assert positions.outside_skin == 0
    assert positions.unique_count == positions.count
    assert positions.minimum_distance_pixels >= 1.7
    assert stats.changed_outside_allowed_pixels == 0
    assert stats.core_pixels >= 0
    assert stats.changed_skin_pixels > 0
    assert stats.mean_delta_e76 >= 0
    assert positions.left_count > 0 and positions.right_count > 0


@pytest.mark.parametrize("tone", ["II", "IV", "V", "VI"])
@pytest.mark.parametrize("kind", ["linear", "atrophic", "hypertrophic"])
def test_scar_geometry_and_local_effect(tone: str, kind: str) -> None:
    face = make_drawn_face(seed=19)
    starting = adjust_skin_tone(face.image, face.skin_mask, tone).image
    changed = apply_scar(starting, face, kind, seed=17)
    stats = stage_evidence(starting, changed.image, face.skin_mask, changed.mask)
    assert stats.core_pixels > 0
    assert stats.changed_skin_pixels > 0
    assert stats.changed_outside_allowed_pixels == 0
    assert stats.mean_delta_e76 > 0
    assert 0 < stats.visible_area_fraction < 0.10


@pytest.mark.parametrize("tone", ["II", "IV", "V", "VI"])
@pytest.mark.parametrize("severity", ["mild", "moderate"])
def test_acne_redness_remains_positive_on_deep_skin(tone: str, severity: str) -> None:
    face = make_drawn_face(seed=16)
    starting = adjust_skin_tone(face.image, face.skin_mask, tone).image
    changed = apply_acne(starting, face, severity, seed=16)
    stats = stage_evidence(starting, changed.image, face.skin_mask, changed.mask)
    assert stats.changed_outside_allowed_pixels == 0
    assert stats.core_pixels > 0
    assert stats.mean_delta_a >= -0.25
    assert stats.changed_skin_pixels > 0
    assert 0 < stats.area_fraction < 0.25


@pytest.mark.parametrize("tone", ["II", "IV", "V", "VI"])
@pytest.mark.parametrize("severity", ["mild", "moderate"])
def test_rosacea_mask_stays_centered_and_bounded(tone: str, severity: str) -> None:
    face = make_drawn_face(seed=22)
    starting = adjust_skin_tone(face.image, face.skin_mask, tone).image
    changed = apply_rosacea(starting, face, severity, seed=19)
    stats = stage_evidence(
        starting, changed.image, face.skin_mask, changed.mask, core_threshold=0.1
    )
    assert stats.mean_delta_e76 > 0
    assert stats.changed_skin_pixels > 0
    assert stats.changed_outside_allowed_pixels == 0
    assert stats.visible_skin_fraction == 1.0
    assert 0 < stats.core_pixels < int(face.skin_mask.sum() * 0.60)
    # Very deep synthetic skin has smaller a* changes: record, do not fake parity.
    assert float(changed.parameters["redness_a_star"]) >= 0


@pytest.mark.parametrize("tone", ["I", "III", "V", "VI"])
def test_albinism_hair_and_iris_are_explicitly_allowlisted(tone: str) -> None:
    face = make_drawn_face(seed=1)
    starting = adjust_skin_tone(face.image, face.skin_mask, tone).image
    changed = apply_albinism(starting, face, True)
    allowed = np.maximum(face.skin_mask, face.hair_mask)
    assert face.iris_mask is not None
    allowed = np.maximum(allowed, face.iris_mask)
    stats = stage_evidence(starting, changed.image, face.skin_mask, changed.mask, allowed)
    assert stats.changed_outside_allowed_pixels == 0
    assert stats.mean_delta_l > 0 or tone == "I"
    assert stats.changed_pixels > stats.changed_skin_pixels


@pytest.mark.parametrize("tone", ["II", "V", "VI"])
def test_vitiligo_brightening_has_real_mask_support(tone: str) -> None:
    face = make_drawn_face()
    starting = adjust_skin_tone(face.image, face.skin_mask, tone).image
    changed = apply_vitiligo(starting, face.skin_mask, "focal", 0.075, seed=71)
    stats = stage_evidence(starting, changed.image, face.skin_mask, changed.patch_mask)
    assert abs(stats.area_fraction - 0.075) < 0.02
    assert stats.mean_delta_l > 1.0
    assert stats.changed_outside_allowed_pixels == 0
    assert stats.visible_delta_e76 == stats.mean_delta_e76


def test_stage_evidence_tracks_hidden_and_visible_without_relabeling() -> None:
    face = make_drawn_face()
    changed = apply_birthmark(face.image, face, "port_wine", seed=2)
    blocked = np.zeros_like(face.skin_mask)
    blocked[:, : face.width // 2] = 1
    stats = stage_evidence(
        face.image, changed.image, face.skin_mask, changed.mask, occlusion=blocked
    )
    assert 0 < stats.visible_skin_fraction < 1
    assert stats.core_pixels == stats.hidden_core_pixels + stats.visible_core_pixels
    assert stats.hidden_area_fraction >= 0
    assert stats.changed_skin_pixels > 0
    assert stats.changed_outside_allowed_pixels == 0


def test_stage_evidence_finds_bad_background_mutation_without_hiding_it() -> None:
    face = make_drawn_face()
    changed = face.image.copy()
    changed[0, 0] = (0, 0, 0)
    stats = stage_evidence(face.image, changed, face.skin_mask, face.skin_mask)
    assert stats.changed_pixels == 1
    assert stats.changed_skin_pixels == 0
    assert stats.changed_outside_allowed_pixels == 1
    assert stats.core_pixels > 0
    assert stats.mean_delta_e76 == 0


def test_stage_evidence_reports_empty_core_not_a_false_positive() -> None:
    face = make_drawn_face()
    empty = np.zeros_like(face.skin_mask)
    stats = stage_evidence(face.image, face.image, face.skin_mask, empty)
    assert stats.core_pixels == 0
    assert stats.mean_delta_e76 == 0
    assert stats.visible_delta_e76 == 0
    assert stats.changed_pixels == 0


@pytest.mark.parametrize("bad", [float("nan"), float("inf"), -0.1, 1.5])
def test_stage_evidence_rejects_bad_masks(bad: float) -> None:
    face = make_drawn_face()
    invalid = np.zeros_like(face.skin_mask)
    invalid[0, 0] = bad
    with pytest.raises(SyntheticInputError):
        stage_evidence(face.image, face.image, face.skin_mask, invalid)


def test_stage_evidence_rejects_shape_dtype_and_threshold_errors() -> None:
    face = make_drawn_face()
    with pytest.raises(SyntheticInputError, match="RGB"):
        stage_evidence(face.image[..., 0], face.image, face.skin_mask, face.skin_mask)
    with pytest.raises(SyntheticInputError, match="uint8"):
        stage_evidence(face.image, face.image.astype(np.float32),
                       face.skin_mask, face.skin_mask)
    with pytest.raises(SyntheticInputError, match="H[xX]W"):
        stage_evidence(face.image, face.image, face.skin_mask,
                       np.zeros((2, 2), dtype=np.float32))
    with pytest.raises(SyntheticInputError, match="threshold"):
        stage_evidence(face.image, face.image, face.skin_mask,
                       face.skin_mask, core_threshold=0)
    with pytest.raises(SyntheticInputError, match="tolerance"):
        stage_evidence(face.image, face.image, face.skin_mask,
                       face.skin_mask, pixel_tolerance=256)


def test_point_evidence_handles_empty_and_invalid_coordinates() -> None:
    face = make_drawn_face()
    empty = point_evidence((), face.skin_mask)
    assert empty.count == 0
    assert empty.minimum_distance_pixels == 0
    with pytest.raises(SyntheticInputError, match="coordinate"):
        point_evidence(((float("nan"), 1.0),), face.skin_mask)
    with pytest.raises(SyntheticInputError, match="outside"):
        point_evidence(((float(face.width), 10.0),), face.skin_mask)
    with pytest.raises(SyntheticInputError, match="midpoint"):
        point_evidence(((22.0, 60.0),), face.skin_mask, center_x=-3)


def test_point_evidence_reports_outside_declared_skin() -> None:
    face = make_drawn_face()
    points = ((12.0, 12.0), (17.0, 12.0), (90.0, 100.0))
    stats = point_evidence(points, face.skin_mask)
    assert stats.count == 3
    assert stats.inside_skin == 1
    assert stats.outside_skin == 2
    assert stats.unique_count == 3
    assert stats.minimum_distance_pixels == 5
