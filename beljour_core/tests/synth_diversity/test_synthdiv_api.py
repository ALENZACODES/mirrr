"""Public import contracts and non-image synthetic-only capability smoke tests.
Author: John Khan.
"""

from __future__ import annotations

from lab import synth_diversity
from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.plan import make_plans


def test_public_api_exposes_validation_and_immutable_shards() -> None:
    names = set(synth_diversity.__all__)
    assert len(names) == len(synth_diversity.__all__)
    assert "BaseFace" in names
    assert "TraitPlan" in names
    assert "apply_lighting" in names
    assert "apply_morphology" in names
    assert "tone_diagnostics" in names
    assert "verify_shards" in names
    assert "write_shards" in names
    assert "case_identity" in names
    assert "region_scores" in names
    assert "compose_face" in names
    assert "verify_manifest" in names
    assert all(hasattr(synth_diversity, name) for name in names)


def test_no_public_network_or_training_entrypoint() -> None:
    names = set(synth_diversity.__all__)
    assert not any("train" in name for name in names)
    assert not any("upload" in name for name in names)
    assert not any("cloud" in name for name in names)
    assert not any("download" in name for name in names)
    assert not any("infer" in name for name in names)


def test_public_geometry_and_identity_contract_round_trip() -> None:
    original = make_drawn_face(seed=49)
    varied = synth_diversity.apply_morphology(original, synth_diversity.MorphologySpec())
    assert varied.image.shape == original.image.shape
    assert varied.source_id == "S02"
    plan = make_plans(1, 49)[0]
    identity = synth_diversity.case_identity(varied, plan)
    assert identity.test_only
    assert identity.train_allowed is False
    assert len(identity.slice_labels) == 12
    assert identity.tags == plan.tags


def test_public_lighting_and_gamut_metrics_are_separate_outputs() -> None:
    original = make_drawn_face(seed=10)
    lamp = synth_diversity.apply_lighting(original, synth_diversity.LightingSpec())
    assert lamp.outside_changed_pixels == 0
    assert lamp.image.shape == original.image.shape
    tone = synth_diversity.calibration_grid(((178, 128, 103),), targets=("VI",))
    assert len(tone) == 1
    assert tone[0].target == "VI"
    assert tone[0].texture.non_skin_changed_pixels == 0
