"""Drawn test faces: exact, disjoint zones, states, eye shapes, scenes and landmarks.

Every image here is drawn by the package from a seed; no real face is used.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from lab.bqa_render.faces import (
    EYE_SHAPES,
    FaceSpec,
    SceneSpec,
    draw_scene,
    face_geometry,
    portrait,
)
from lab.bqa_render.landmarks import (
    EYE_LOOPS,
    FACE_OVAL,
    hair_geometry,
    key_point_errors,
    mesh_points,
    mirror_face,
    mirror_geometry,
    scale_face,
)


def test_zones_are_disjoint_where_anatomy_says_so() -> None:
    face = portrait("synthetic-a", mouth_state="open", glasses=True, hand=True).subject
    m = face.masks
    for a, b in (("eye_white", "iris"), ("lips", "teeth"), ("skin", "lens"), ("skin", "hand"),
                 ("skin", "lips"), ("skin", "eye"), ("lid", "eye"), ("lash_line", "eye"),
                 ("teeth", "mouth_opening"), ("brows", "skin")):
        assert not (m[a] & m[b]).any(), (a, b)
    assert m["lips"].any() and m["teeth"].any() and m["iris"].any()
    assert (m["lips_upper"] | m["lips_lower"]).sum() == m["lips"].sum()
    assert m["lips_upper"].any() and m["lips_lower"].any()


def test_mouth_and_eye_states() -> None:
    closed = portrait("synthetic-b", mouth_state="closed").subject.masks
    assert not closed["teeth"].any() and not closed["mouth_opening"].any()
    blink = portrait("synthetic-c", eye_state="blink").subject.masks["eye"].sum()
    shut = portrait("synthetic-d", eye_state="closed").subject.masks["eye"].sum()
    opened = portrait("synthetic-e").subject.masks["eye"].sum()
    assert opened > blink > shut


def test_eye_shapes_change_the_lid_not_a_stretched_template() -> None:
    lids = {s: int(portrait(f"synthetic-{s}", eye_shape=s).subject.masks["lid"].sum())
            for s in EYE_SHAPES}
    assert lids["hooded"] < lids["average"] < lids["deep_set"]
    crease = portrait("synthetic-mono", eye_shape="monolid").subject.masks["crease"]
    assert not crease.any()
    close = face_geometry(replace(FaceSpec(), eye_shape="close_set"), 384, 384)
    wide = face_geometry(replace(FaceSpec(), eye_shape="wide_set"), 384, 384)
    gap = [abs(g.eyes["left"].inner[0] - g.eyes["right"].inner[0]) for g in (close, wide)]
    assert gap[0] < gap[1]


def test_marks_hair_styles_and_coverings() -> None:
    marked = portrait("synthetic-m", marks=True).subject.masks
    assert marked["mole"].any() and marked["freckles"].any() and marked["scar"].any()
    assert not (marked["mole"] & ~marked["skin"]).any()
    bald = portrait("synthetic-bald", hair="bald").subject.masks
    assert not bald["hair"].any() and bald["scalp"].any()
    shaved = portrait("synthetic-shaved", hair="shaved").subject.masks
    assert 0 < shaved["hair"].sum() < shaved["scalp"].sum() + shaved["hair"].sum()
    covered = portrait("synthetic-cov", hair="covered").subject.masks
    assert covered["covering"].any() and not covered["hair"].any()


def test_group_scene_owns_each_pixel_once() -> None:
    faces = (FaceSpec("F0", 0.25, 0.5, 0.18, 2), FaceSpec("F1", 0.75, 0.5, 0.2, 9))
    scene = draw_scene(SceneSpec("synthetic-g", 512, 384, faces, 1, 4))
    a, b = (f.masks["footprint"] for f in scene.faces)
    assert not (a & b).any()
    assert (scene.others() == a).all()
    assert scene.subject.spec.face_id == "F1"
    assert not (scene.background & (a | b)).any()


def test_drawing_is_deterministic_for_a_seed() -> None:
    one = portrait("synthetic-s", seed=11, marks=True).image
    two = portrait("synthetic-s", seed=11, marks=True).image
    three = portrait("synthetic-s", seed=12, marks=True).image
    assert np.array_equal(one, two) and not np.array_equal(one, three)


def test_invalid_specs_are_refused() -> None:
    with pytest.raises(ValueError):
        FaceSpec(eye_shape="unknown")
    with pytest.raises(ValueError):
        FaceSpec(tone=11)
    with pytest.raises(ValueError):
        draw_scene(SceneSpec("synthetic-x", faces=(FaceSpec(),), selected=3))


def test_mesh_uses_the_engine_index_layout() -> None:
    scene = portrait("synthetic-l")
    mesh = mesh_points(scene.subject.geometry, 384, 384)
    assert mesh.shape == (478, 2)
    assert float(np.min(mesh)) >= 0 and float(np.max(mesh)) <= 1
    right = mesh[EYE_LOOPS["right"][0]]
    left = mesh[EYE_LOOPS["left"][0]]
    assert right[0] < left[0], "subject's right eye sits on the image left"
    assert mesh[FACE_OVAL[0]][1] < mesh[152][1]
    head = hair_geometry(scene.subject, 384, 384)
    assert head["crown"][1] < head["chin"][1]


def test_mirror_is_an_involution_and_swaps_sides() -> None:
    face = portrait("synthetic-mi", asymmetry=1.0).subject
    geo = face.geometry
    twice = mirror_geometry(mirror_geometry(geo, 384), 384)
    assert np.allclose(twice.eyes["left"].upper, geo.eyes["left"].upper)
    mirrored = mirror_face(face, 384)
    assert np.array_equal(mirrored.masks["lid_left"], face.masks["lid_right"][:, ::-1])
    a = mesh_points(geo, 384, 384)
    b = mesh_points(mirrored.geometry, 384, 384)
    assert b[33][0] == pytest.approx(1 - a[263][0])


def test_scale_face_keeps_masks_on_the_resized_image() -> None:
    face = portrait("synthetic-sc", edge=400).subject
    small = scale_face(face, (400, 400), (200, 200))
    assert small.masks["lips"].shape == (200, 200)
    ratio = int(small.masks["skin"].sum()) / int(face.masks["skin"].sum())
    assert ratio == pytest.approx(0.25, rel=0.05)
    assert small.geometry.half_height == pytest.approx(face.geometry.half_height / 2)


def test_key_point_errors_are_normalised() -> None:
    mesh = mesh_points(portrait("synthetic-k").subject.geometry, 1, 1)
    moved = mesh.copy()
    moved[1] += 0.01
    errors = key_point_errors(mesh, moved, 0.1)
    assert errors["nose_tip"] == pytest.approx(np.hypot(0.01, 0.01) / 0.1)
    assert errors["chin"] == 0.0


def test_extra_shapes_frames_and_accessories() -> None:
    up = face_geometry(replace(FaceSpec(), eye_shape="upturned"), 384, 384).eyes["right"]
    down = face_geometry(replace(FaceSpec(), eye_shape="downturned"), 384, 384).eyes["right"]
    assert up.outer[1] < down.outer[1]
    lips = {s: int(portrait(f"synthetic-lip-{s}", lip_shape=s).subject.masks["lips"].sum())
            for s in ("thin", "average", "full")}
    assert lips["thin"] < lips["average"] < lips["full"]
    thin = portrait("synthetic-fr1", glasses=True).subject.masks["frame"].sum()
    thick = portrait("synthetic-fr2", glasses=True, thick_frames=True).subject.masks["frame"]
    assert int(thick.sum()) > int(thin)
    aid = portrait("synthetic-aid", hearing_aid=True).subject.masks
    assert aid["accessory"].any() and not (aid["accessory"] & aid["skin"]).any()
    plain = portrait("synthetic-cov2", hair="covered").subject.masks
    wrapped = portrait("synthetic-cov3", hair="covered", jaw_wrap=True).subject.masks
    assert int(wrapped["covering"].sum()) > int(plain["covering"].sum())
    assert int(wrapped["skin"].sum()) < int(plain["skin"].sum())
    with pytest.raises(ValueError):
        FaceSpec(lip_shape="square")


def test_accessory_sits_above_hair() -> None:
    m = portrait("synthetic-aid2", hearing_aid=True, hair="long").subject.masks
    for name in ("hair", "scalp", "covering"):
        assert not (m[name] & m["accessory"]).any()
