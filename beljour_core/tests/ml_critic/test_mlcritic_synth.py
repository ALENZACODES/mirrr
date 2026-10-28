"""The synthetic corruption generator: exact labels, known strengths, determinism.

Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.ml.critic import ARTIFACT_NAMES, SKIN_TONES, draw_portrait, make_dataset, make_sample
from lab.ml.critic.synth import corrupt, quantise


def test_portrait_is_valid_and_deterministic() -> None:
    first = draw_portrait(np.random.default_rng(5), 96)
    second = draw_portrait(np.random.default_rng(5), 96)
    assert first.image.shape == (96, 96, 3)
    assert float(np.min(first.image)) >= 0.0
    assert float(np.max(first.image)) <= 1.0
    assert np.array_equal(first.image, second.image)
    assert 0.1 < float(first.mask.mean()) < 0.6
    assert first.face.w > 0 and first.face.h > 0


def test_portrait_values_sit_on_8bit_levels() -> None:
    scene = draw_portrait(np.random.default_rng(1), 64)
    assert np.allclose(scene.image * 255.0, np.round(scene.image * 255.0))
    assert np.array_equal(quantise(scene.image), scene.image)


@pytest.mark.parametrize("tone", range(len(SKIN_TONES)))
def test_requested_tone_is_drawn(tone: int) -> None:
    scene = draw_portrait(np.random.default_rng(2), 96, tone=tone)
    skin = scene.image[scene.mask].mean(axis=0)
    assert scene.tone == tone
    target = np.asarray(SKIN_TONES[tone])
    assert float(np.abs(skin - target).max()) < 0.2


def test_skin_tones_run_light_to_deep() -> None:
    luma = [0.299 * r + 0.587 * g + 0.114 * b for r, g, b in SKIN_TONES]
    assert luma == sorted(luma, reverse=True)
    assert len(SKIN_TONES) == 6


@pytest.mark.parametrize("artifact", ARTIFACT_NAMES)
def test_every_artifact_changes_the_edit(artifact: str) -> None:
    rng = np.random.default_rng(3)
    clean = make_sample(np.random.default_rng(3), None, 0.0, 80)
    flawed = make_sample(rng, artifact, 0.8, 80)
    assert np.array_equal(clean.before, flawed.before)
    assert float(np.abs(flawed.after - clean.after).mean()) > 1e-4
    assert flawed.label == 1
    assert clean.label == 0
    assert flawed.artifact == artifact
    assert flawed.strength == 0.8


def test_zero_strength_is_a_clean_edit() -> None:
    scene = draw_portrait(np.random.default_rng(4), 64)
    after = scene.image.copy()
    out = corrupt(scene, after, "seam", 0.0, np.random.default_rng(0))
    assert out is after
    sample = make_sample(np.random.default_rng(4), "seam", 0.0, 64)
    assert sample.label == 0


def test_strength_controls_size_of_change() -> None:
    changes = []
    for strength in (0.2, 0.6, 1.0):
        scene = draw_portrait(np.random.default_rng(6), 80)
        out = corrupt(scene, scene.image, "seam", strength, np.random.default_rng(1))
        changes.append(float(np.abs(out - scene.image).mean()))
    assert changes[0] < changes[1] < changes[2]


def test_corrupt_rejects_unknown_kind_and_bad_strength() -> None:
    scene = draw_portrait(np.random.default_rng(7), 64)
    rng = np.random.default_rng(0)
    with pytest.raises(KeyError, match="unknown artifact"):
        corrupt(scene, scene.image, "smudge", 0.5, rng)
    with pytest.raises(ValueError, match="strength"):
        corrupt(scene, scene.image, "seam", 1.5, rng)


def test_dataset_is_balanced_labelled_and_reproducible() -> None:
    data = make_dataset(48, seed=11, size=64)
    again = make_dataset(48, seed=11, size=64)
    labels = [s.label for s in data]
    assert sum(labels) == 24
    kinds = {s.artifact for s in data if s.artifact}
    assert kinds == set(ARTIFACT_NAMES)
    assert all(0.2 <= s.strength <= 1.0 for s in data if s.artifact)
    assert all(s.strength == 0.0 for s in data if s.artifact is None)
    assert all(np.array_equal(a.after, b.after) for a, b in zip(data, again, strict=True))


def test_dataset_rejects_bad_arguments() -> None:
    with pytest.raises(ValueError, match="count"):
        make_dataset(0, seed=1)
    with pytest.raises(ValueError, match="artifact_share"):
        make_dataset(4, seed=1, artifact_share=1.5)


def test_sample_without_mask() -> None:
    sample = make_sample(np.random.default_rng(8), "halo", 0.5, 64, keep_mask=False)
    assert sample.mask is None
