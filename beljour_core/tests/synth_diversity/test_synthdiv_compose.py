"""Seeded complete composition and cross-trait invariance tests.
Author: John Khan.
"""

from __future__ import annotations

import hashlib

import numpy as np
import pytest

from lab.synth_diversity.compose import compose_face, compose_many
from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.plan import make_plans
from lab.synth_diversity.types import TraitPlan


def _neutral_plan(seed: int) -> TraitPlan:
    """Construct canonical no-mark controls without inferring labels from pixels."""
    tags = dict(make_plans(1, seed)[0].tags)
    tags.update(
        {
            "vitiligo": "none",
            "vitiligo_coverage": 0.0,
            "albinism": False,
            "freckles": "none",
            "birthmark": "none",
            "scar": "none",
            "acne": "none",
            "rosacea": "none",
            "head_covering": "none",
            "beard": "none",
            "glasses": "none",
            "age_band": "20-29",
        }
    )
    return TraitPlan(seed, tags)


def test_complete_composition_is_byte_deterministic() -> None:
    base = make_drawn_face()
    original = base.image.copy()
    plan = make_plans(1, 90)[0]
    first = compose_face(base, plan)
    second = compose_face(base, plan)
    digest = hashlib.sha256(first.image.tobytes()).hexdigest()
    assert digest == hashlib.sha256(second.image.tobytes()).hexdigest()
    assert first.parameters == second.parameters
    assert first.base_id == base.base_id
    np.testing.assert_array_equal(base.image, original)
    for name, mask in first.occlusion_masks.items():
        np.testing.assert_array_equal(mask, second.occlusion_masks[name])
    for name, mask in first.trait_masks.items():
        np.testing.assert_array_equal(mask, second.trait_masks[name])


def test_complete_output_carries_all_occlusion_and_trait_masks() -> None:
    face = make_drawn_face()
    result = compose_face(face, make_plans(1, 52)[0])
    assert set(result.occlusion_masks) == {"head_covering", "glasses", "beard"}
    assert set(result.trait_masks) == {
        "vitiligo", "vitiligo_rim", "freckles", "birthmark", "scar", "acne",
        "rosacea", "wrinkles", "grey_hair",
    }
    for mask in {**result.occlusion_masks, **result.trait_masks}.values():
        assert mask.shape == face.skin_mask.shape
        assert mask.dtype == np.float32
        assert np.isfinite(mask).all()
    assert result.parameters["tone"]["inside_band"] is True
    assert result.base_source_id == "S02"


def test_seed_changes_and_neutral_effects_leave_background_alone() -> None:
    face = make_drawn_face()
    first = compose_face(face, _neutral_plan(24))
    second = compose_face(face, _neutral_plan(25))
    assert not np.array_equal(first.image, second.image)
    mask = np.maximum(face.skin_mask, face.hair_mask)
    np.testing.assert_array_equal(first.image[mask == 0], face.image[mask == 0])
    assert not any(m.sum() for m in first.occlusion_masks.values())


def test_compose_many_cycles_base_ids() -> None:
    bases = [make_drawn_face(base_id="one"), make_drawn_face(base_id="two", seed=3)]
    plans = make_plans(3, 10)
    results = compose_many(bases, plans)
    assert [result.base_id for result in results] == ["one", "two", "one"]
    with pytest.raises(ValueError):
        compose_many([], plans)
    with pytest.raises(ValueError):
        compose_many(bases, [])


@pytest.mark.parametrize("tone", ["I", "II", "III", "IV", "V", "VI"])
def test_full_pipeline_color_target_is_declared(tone: str) -> None:
    face = make_drawn_face()
    tags = dict(_neutral_plan(101).tags)
    tags["fitzpatrick"] = tone
    result = compose_face(face, TraitPlan(101, tags))
    assert result.parameters["tone"]["target"] == tone
    assert result.parameters["tone"]["inside_band"] is True
