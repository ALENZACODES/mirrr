"""Tests for the stress scene composer: counts, sizes, crops, main subject, determinism.

Every scene is composed in code from a master seed and an index.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import math
from dataclasses import replace

import numpy as np
import pytest

from lab.facescale_synth.stress.labels import (
    TIE_SHARE,
    box_area,
    clip_box,
    pick_main,
    scene_from_json,
)
from lab.facescale_synth.stress.scene import CLEAN, SceneConfig, StressRates, compose_scene

SMALL = SceneConfig(width=128, height=128)


def _digest(config: SceneConfig, master: int, index: int) -> str:
    scene = compose_scene(config, master, index)
    return hashlib.sha256(scene.image.tobytes()).hexdigest()


def test_thousand_items_regenerate_byte_for_byte() -> None:
    first = [_digest(SMALL, 77, i) for i in range(1000)]
    second = [_digest(SMALL, 77, i) for i in range(1000)]
    assert first == second
    assert len(set(first)) > 990


def test_master_seed_changes_content() -> None:
    assert _digest(SMALL, 1, 5) != _digest(SMALL, 2, 5)


def test_face_counts_sizes_and_no_face_scenes() -> None:
    counts = []
    sizes: list[float] = []
    for i in range(400):
        label = compose_scene(replace(SMALL, rates=CLEAN), 3, i).label
        counts.append(len(label.faces))
        sizes.extend(f.box[3] - f.box[1] for f in label.faces)
        assert label.scene_type == ("no_face" if not label.faces else "faces")
    assert min(counts) == 0 and max(counts) >= 6
    assert all(c <= 8 for c in counts)
    assert min(sizes) < 16
    assert max(sizes) > 0.75 * 128
    assert all(10 <= s <= 0.9 * 128 + 2 for s in sizes)


def test_no_face_rate_one_gives_only_empty_scenes() -> None:
    config = replace(SMALL, no_face_rate=1.0)
    for i in range(20):
        label = compose_scene(config, 4, i).label
        assert label.faces == [] and label.scene_type == "no_face"
        assert label.main_index is None


def test_edge_crops_happen_on_every_edge() -> None:
    rates = replace(CLEAN, edge_crop=1.0)
    config = replace(SMALL, rates=rates, max_faces=1, no_face_rate=0.0)
    edges: set[str] = set()
    for i in range(80):
        face = compose_scene(config, 8, i).label.faces[0]
        edges.update(face.cropped_edges)
        assert face.in_frame < 1.0
    assert edges == {"left", "right", "top", "bottom"}


def test_overlaps_lower_visibility_of_covered_faces() -> None:
    rates = replace(CLEAN, overlap=1.0)
    config = replace(SMALL, rates=rates, no_face_rate=0.0)
    hidden = 0
    for i in range(60):
        for face in compose_scene(config, 9, i).label.faces:
            assert 0.0 <= face.visible <= 1.0
            hidden += face.visible < 0.9
    assert hidden > 0


def test_main_subject_is_largest_with_centre_tie_break() -> None:
    boxes = [(0.0, 0.0, 10.0, 10.0), (40.0, 40.0, 60.0, 60.0), (90.0, 90.0, 110.0, 110.0)]
    assert pick_main(boxes, 128, 128) == 1
    assert pick_main([(0.0, 0.0, 30.0, 30.0), (40.0, 40.0, 60.0, 60.0)], 128, 128) == 0
    scale = math.sqrt(1.0 - TIE_SHARE / 2)
    near = (49.0, 49.0, 49.0 + 30.0 * scale, 49.0 + 30.0 * scale)
    assert pick_main([(0.0, 0.0, 30.0, 30.0), near], 128, 128) == 1
    assert pick_main([], 128, 128) is None
    assert pick_main([(200.0, 200.0, 300.0, 300.0)], 128, 128) is None


def test_scene_main_flag_follows_the_rule() -> None:
    for i in range(100):
        label = compose_scene(SMALL, 10, i).label
        flagged = [f for f in label.faces if f.main]
        if not label.faces:
            assert not flagged
            continue
        assert len(flagged) == 1
        visible = [f for f in label.faces if f.visible >= 0.5] or label.faces
        areas = [box_area(clip_box(f.box, label.width, label.height)) for f in visible]
        main_area = box_area(clip_box(flagged[0].box, label.width, label.height))
        assert flagged[0] in visible
        assert main_area >= max(areas) * (1.0 - TIE_SHARE) - 1e-9


def test_rotation_moves_keypoints_with_the_face() -> None:
    rates = replace(CLEAN, rotation=1.0, max_rotation_deg=180.0)
    config = replace(SMALL, width=256, height=256, rates=rates, max_faces=1, no_face_rate=0.0)
    rolls = []
    for i in range(30):
        face = compose_scene(config, 12, i).label.faces[0]
        (lx, ly), (rx, ry) = face.keypoints[0], face.keypoints[1]
        measured = math.degrees(math.atan2(-(ry - ly), rx - lx))
        diff = (measured - face.roll_deg + 180.0) % 360.0 - 180.0
        assert abs(diff) < 1.0
        assert face.interocular == pytest.approx(math.dist((lx, ly), (rx, ry)), rel=1e-6)
        rolls.append(abs(face.roll_deg))
    assert max(rolls) > 90.0


def test_rescale_scales_labels_with_the_image() -> None:
    plain_config = replace(SMALL, rates=CLEAN, no_face_rate=0.0)
    config = replace(plain_config, rates=replace(CLEAN, rescale=1.0))
    for i in range(10):
        scene = compose_scene(config, 13, i)
        label = scene.label
        plain = compose_scene(plain_config, 13, i).label
        assert scene.image.shape[:2] == (label.height, label.width)
        assert label.rescale is not None
        sx, sy = label.rescale["sx"], label.rescale["sy"]
        assert label.width == round(plain.width * sx)
        for face, old in zip(label.faces, plain.faces, strict=True):
            expected = (old.box[0] * sx, old.box[1] * sy, old.box[2] * sx, old.box[3] * sy)
            assert face.box == pytest.approx(expected)


def test_scene_stressors_are_recorded() -> None:
    rates = StressRates(lighting=1.0, blur=1.0, jpeg=1.0, decoys=1.0)
    config = replace(SMALL, rates=rates)
    for i in range(20):
        label = compose_scene(config, 14, i).label
        assert label.lighting is not None and label.blur is not None
        assert label.jpeg_quality is not None and 10 <= label.jpeg_quality <= 95
        assert 1 <= len(label.decoys) <= 3


def test_labels_round_trip_through_json() -> None:
    for i in range(30):
        label = compose_scene(SMALL, 15, i).label
        again = scene_from_json(label.to_json())
        assert again.to_json() == label.to_json()


def test_config_validation() -> None:
    with pytest.raises(ValueError):
        SceneConfig(width=16)
    with pytest.raises(ValueError):
        SceneConfig(max_faces=9)
    with pytest.raises(ValueError):
        SceneConfig(min_face_px=4.0)
    with pytest.raises(ValueError):
        StressRates(rotation=1.5)
    with pytest.raises(ValueError):
        StressRates(max_rotation_deg=200.0)


def test_force_traits_reach_every_face() -> None:
    config = replace(SMALL, force_traits=(("head_covering", "hijab"),), no_face_rate=0.0)
    for i in range(10):
        for face in compose_scene(config, 16, i).label.faces:
            assert face.traits["head_covering"] == "hijab"


def test_images_are_rgb_uint8_of_the_labelled_size() -> None:
    for i in range(10):
        scene = compose_scene(SMALL, 17, i)
        assert scene.image.dtype == np.uint8
        assert scene.image.shape == (scene.label.height, scene.label.width, 3)
