"""Tests for checker-side expectations and detector scoring by bucket.

The detectors here are fakes that read the exact labels, so every score
is known in advance.
Author: John Khan.
"""

from __future__ import annotations

import pytest

from lab.facescale_synth.stress.expect import ExpectationRules, expect, face_expectation
from lab.facescale_synth.stress.labels import Decoy, FaceLabel, Occluder, SceneLabel
from lab.facescale_synth.stress.scene import SceneConfig, compose_scene
from lab.facescale_synth.stress.scoring import (
    Detection,
    Tally,
    crop_ok,
    iou,
    match,
    mean_iou,
    rotation_bucket,
    score_scene,
    size_bucket,
)


def _face(
    index: int,
    box: tuple[float, float, float, float],
    *,
    visible: float = 1.0,
    in_frame: float = 1.0,
    interocular: float | None = None,
    yaw_deg: float = 0.0,
    occluder: Occluder | None = None,
) -> FaceLabel:
    return FaceLabel(
        index=index,
        box=box,
        keypoints=[(0.0, 0.0)] * 5,
        keypoint_visible=[True] * 5,
        landmarks=[],
        interocular=(box[2] - box[0]) * 0.3 if interocular is None else interocular,
        roll_deg=0.0,
        yaw_deg=yaw_deg,
        pitch_deg=0.0,
        in_frame=in_frame,
        visible=visible,
        cropped_edges=[],
        z=index,
        tone=0.5,
        traits={},
        vitiligo_drawn=0.0,
        occluder=occluder,
    )


def _scene(faces: list[FaceLabel], decoys: list[Decoy] | None = None) -> SceneLabel:
    return SceneLabel(0, 1, 200, 200, "faces" if faces else "no_face", "flat", faces, decoys or [])


def test_iou_and_match() -> None:
    assert iou((0, 0, 10, 10), (0, 0, 10, 10)) == 1.0
    assert iou((0, 0, 10, 10), (5, 0, 15, 10)) == pytest.approx(1 / 3)
    assert iou((0, 0, 10, 10), (20, 20, 30, 30)) == 0.0
    assert iou((0, 0, 0, 0), (0, 0, 0, 0)) == 0.0
    pairs = match([(0, 0, 10, 10), (50, 50, 60, 60)], [(51, 50, 61, 60), (0, 0, 10, 10)], 0.4)
    assert sorted((t, d) for t, d, _ in pairs) == [(0, 1), (1, 0)]
    assert mean_iou(pairs) > 0.8


def test_match_is_one_to_one() -> None:
    pairs = match([(0, 0, 10, 10)], [(0, 0, 10, 10), (0, 0, 10, 10)], 0.5)
    assert len(pairs) == 1


def test_buckets() -> None:
    assert size_bucket(8) == "<12"
    assert size_bucket(12) == "12-24"
    assert size_bucket(100) == "96-192"
    assert size_bucket(500) == "192+"
    assert rotation_bucket(-10) == "0-15"
    assert rotation_bucket(60) == "45-90"
    assert rotation_bucket(179) == "90-180"


def test_face_expectation_reasons() -> None:
    rules = ExpectationRules()
    assert face_expectation(_face(0, (0, 0, 60, 80)), rules).status == "must_detect"
    small = face_expectation(_face(0, (0, 0, 10, 14)), rules)
    assert small.status == "optional" and "small" in small.reasons
    assert small.refuse_too_small
    hidden = face_expectation(_face(0, (0, 0, 60, 80), visible=0.2, in_frame=0.3), rules)
    assert hidden.reasons == ["hidden", "off_frame"]
    occ = _face(0, (0, 0, 60, 80), occluder=Occluder("mask", 0.9))
    assert face_expectation(occ, rules).reasons == ["occluded"]
    turned = face_expectation(_face(0, (0, 0, 60, 80), yaw_deg=44.0), rules)
    assert turned.reasons == ["turned"]


def test_refusal_uses_interocular_and_length() -> None:
    rules = ExpectationRules()
    narrow = face_expectation(_face(0, (0, 0, 40, 40), interocular=7.0), rules)
    assert narrow.refuse_too_small and narrow.status == "must_detect"
    short = face_expectation(_face(0, (0, 0, 40, 23), interocular=12.0), rules)
    assert short.refuse_too_small


def test_scene_outcomes() -> None:
    assert expect(_scene([])).outcome == "no_face"
    big = _face(0, (10, 10, 90, 110))
    assert expect(_scene([big])).outcome == "faces"
    tiny_but_sure = _face(0, (10, 10, 40, 40), interocular=6.0)
    assert expect(_scene([tiny_but_sure])).outcome == "too_small"
    only_optional = _face(0, (10, 10, 20, 20))
    assert expect(_scene([only_optional])).outcome == "uncertain"


def test_expected_main_ignores_optional_and_refused_faces() -> None:
    faces = [
        _face(0, (0, 0, 150, 190), visible=0.3),
        _face(1, (100, 100, 160, 180)),
        _face(2, (10, 10, 40, 40), interocular=5.0),
    ]
    assert expect(_scene(faces)).main_index == 1


def test_perfect_detector_scores_full_marks() -> None:
    faces = [_face(0, (10, 10, 70, 90)), _face(1, (100, 20, 180, 120)), _face(2, (5, 150, 12, 160))]
    label = _scene(faces)
    expectation = expect(label)
    detections = [Detection(f.box) for f in faces]
    score = score_scene(label, expectation, detections, crop=(90.0, 10.0, 190.0, 130.0))
    assert score.tp == 2 and score.fn == 0
    assert score.optional_hits == 1
    assert score.false_positives == []
    assert score.main_correct is True
    assert score.crop_correct is True


def test_misses_false_positives_and_decoys() -> None:
    label = _scene([_face(0, (10, 10, 70, 90))], [Decoy("socket", (120, 120, 180, 180))])
    expectation = expect(label)
    detections = [Detection((122, 118, 178, 182)), Detection((0, 150, 30, 190))]
    score = score_scene(label, expectation, detections, outcome="faces")
    assert score.tp == 0 and score.fn == 1
    assert len(score.false_positives) == 2
    assert score.decoy_hits == 1
    assert score.main_correct is False
    assert score.outcome_correct is True


def test_no_face_scene_outcome_scoring() -> None:
    label = _scene([])
    expectation = expect(label)
    assert score_scene(label, expectation, [], outcome="no_face").outcome_correct is True
    wrong = score_scene(label, expectation, [Detection((0, 0, 9, 9))], outcome="faces")
    assert wrong.outcome_correct is False and wrong.main_correct is None


def test_crop_rule() -> None:
    face = (50.0, 50.0, 100.0, 100.0)
    assert crop_ok((40.0, 40.0, 110.0, 110.0), face, 200, 200)
    assert not crop_ok((60.0, 40.0, 110.0, 110.0), face, 200, 200)
    assert not crop_ok((0.0, 0.0, 2000.0, 2000.0), face, 200, 200)
    assert not crop_ok((0.0, 0.0, 10.0, 10.0), (300.0, 300.0, 310.0, 310.0), 200, 200)


def test_tally_buckets_merge_and_summary() -> None:
    config = SceneConfig(width=128, height=128)
    first, second = Tally(), Tally()
    for i in range(40):
        scene = compose_scene(config, 21, i)
        expectation = expect(scene.label)
        found = [Detection(f.box) for f in scene.label.faces][:1]
        target = first if i % 2 else second
        target.add(scene.label, score_scene(scene.label, expectation, found))
    total = Tally()
    total.merge(first)
    total.merge(second)
    summary = total.summary()
    assert summary["scenes"] == 40
    buckets = summary["buckets"]
    assert isinstance(buckets, dict)
    assert set(buckets) >= {"size", "rotation", "occluder", "lighting"}
    rotation = buckets["rotation"]
    assert isinstance(rotation, dict)
    assert all(row["precision"] is None for row in rotation.values())
    tp = sum(row["tp"] for row in buckets["size"].values())
    fn = sum(row["fn"] for row in buckets["size"].values())
    assert tp > 0 and fn > 0
