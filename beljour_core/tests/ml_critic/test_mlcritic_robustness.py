"""Robustness of the trained critic: no mask, stacked artifacts, odd masks, strength sweeps.

Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.ml.critic import (
    FEATURE_NAMES,
    Critic,
    FaceBox,
    draw_portrait,
    extract,
    make_dataset,
    make_pair,
    make_sample,
    train_default,
)
from lab.ml.critic.synth import clean_edit, corrupt

SIZE = 96
# Artifacts that leave a mark without any mask to compare against.
NO_MASK_KINDS = ("oversharpen", "checkerboard", "banding", "plastic_skin", "fringing",
                 "clipping", "ghosting")


@pytest.fixture(scope="module")
def critic() -> Critic:
    trained, _ = train_default(count=360, seed=17, size=SIZE)
    return trained


def realism(critic: Critic, artifact: str | None, strength: float, seed: int,
            keep_mask: bool = True) -> float:
    sample = make_sample(np.random.default_rng(seed), artifact, strength, SIZE,
                         keep_mask=keep_mask)
    return critic.score(make_pair(sample.before, sample.after, sample.mask, sample.face)).realism


def test_maskless_share_drops_masks_evenly() -> None:
    data = make_dataset(40, seed=3, size=48, maskless_share=0.25)
    without = [s for s in data if s.mask is None]
    assert len(without) == 10
    assert {s.label for s in without} == {0, 1}
    with pytest.raises(ValueError, match="maskless_share"):
        make_dataset(4, seed=1, maskless_share=2.0)


def test_clean_pairs_without_a_mask_still_pass(critic: Critic) -> None:
    scores = [realism(critic, None, 0.0, seed, keep_mask=False) for seed in range(200, 206)]
    assert min(scores) > 0.5


@pytest.mark.parametrize("artifact", NO_MASK_KINDS)
def test_visible_artifacts_are_caught_without_a_mask(critic: Critic, artifact: str) -> None:
    scores = [realism(critic, artifact, 0.8, seed, keep_mask=False) for seed in range(210, 213)]
    assert float(np.mean(scores)) < 0.5


def test_mask_only_features_are_zero_without_a_mask() -> None:
    sample = make_sample(np.random.default_rng(5), "seam", 0.9, SIZE, keep_mask=False)
    values = dict(zip(FEATURE_NAMES, extract(make_pair(sample.before, sample.after)),
                      strict=True))
    for name in ("seam_strength", "noise_inconsistency", "colour_shift_untouched", "edit_leak"):
        assert values[name] == 0.0


def test_stacked_artifacts_score_no_better_than_either(critic: Critic) -> None:
    for seed in range(220, 224):
        rng = np.random.default_rng(seed)
        scene = draw_portrait(rng, SIZE)
        edited = clean_edit(scene, rng)
        seam = corrupt(scene, edited, "seam", 0.5, np.random.default_rng(1))
        both = corrupt(scene, seam, "plastic_skin", 0.5, np.random.default_rng(2))
        alone = critic.score(make_pair(scene.image, seam, scene.mask, scene.face)).realism
        stacked = critic.score(make_pair(scene.image, both, scene.mask, scene.face)).realism
        assert stacked <= alone + 0.05


def test_realism_falls_as_strength_rises(critic: Critic) -> None:
    for artifact in ("seam", "colour_cast", "plastic_skin"):
        means = [
            float(np.mean([realism(critic, artifact, strength, seed) for seed in range(4)]))
            for strength in (0.05, 0.4, 0.9)
        ]
        assert means[0] >= means[1] - 0.05 >= means[2] - 0.1, (artifact, means)


def test_masks_with_holes_and_islands_give_finite_scores(critic: Critic) -> None:
    sample = make_sample(np.random.default_rng(6), "halo", 0.6, SIZE)
    assert sample.mask is not None
    holed = sample.mask.copy()
    holed[40:50, 40:50] = False
    islands = np.zeros_like(holed)
    islands[10:20, 10:20] = True
    islands[70:85, 60:80] = True
    for mask in (holed, islands):
        result = critic.score(make_pair(sample.before, sample.after, mask, sample.face))
        assert 0.0 <= result.realism <= 1.0
        assert all(np.isfinite(v) for v in result.features.values())


def test_face_box_at_the_frame_edge(critic: Critic) -> None:
    sample = make_sample(np.random.default_rng(7), None, 0.0, SIZE)
    for box in (FaceBox(0, 0, SIZE, SIZE), FaceBox(-10, -10, 40, 40), FaceBox(80, 80, 50, 50)):
        result = critic.score(make_pair(sample.before, sample.after, sample.mask, box))
        assert 0.0 <= result.realism <= 1.0


def test_non_square_frames_score(critic: Critic) -> None:
    rng = np.random.default_rng(8)
    before = rng.uniform(0.3, 0.7, (60, 140, 3))
    after = np.clip(before + 0.01, 0.0, 1.0)
    mask = np.zeros((60, 140), dtype=np.bool_)
    mask[15:45, 40:100] = True
    result = critic.score(make_pair(before, after, mask))
    assert 0.0 <= result.realism <= 1.0


def test_uint8_and_float_pairs_score_the_same(critic: Critic) -> None:
    sample = make_sample(np.random.default_rng(9), "seam", 0.5, SIZE)
    as_bytes = [np.asarray(np.round(x * 255), dtype=np.uint8) for x in (sample.before,
                                                                        sample.after)]
    first = critic.score(make_pair(sample.before, sample.after, sample.mask, sample.face))
    second = critic.score(make_pair(as_bytes[0], as_bytes[1], sample.mask, sample.face))
    assert first.realism == pytest.approx(second.realism, abs=1e-6)
