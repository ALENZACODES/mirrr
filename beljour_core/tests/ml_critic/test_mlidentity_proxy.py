"""The PROXY geometry embedder on drawn faces, and the drawn-face generator.

The proxy must tell drawn faces apart by proportion, ignore size, position and
skin tone, and always declare itself a PROXY.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.ml.critic import SKIN_TONES, FaceBox
from lab.ml.identity import (
    FaceGeometry,
    GeometryProxyEmbedder,
    ProxyDetectionError,
    cosine_distance,
    draw_face,
    nudge,
    random_geometry,
)
from lab.ml.identity.proxy import PROXY_NAME, dark_blobs, descriptor, landmarks


def test_proxy_declares_itself() -> None:
    proxy = GeometryProxyEmbedder()
    assert proxy.is_proxy is True
    assert proxy.name == PROXY_NAME
    assert "PROXY" in proxy.name


def test_drawn_face_landmarks_match_geometry() -> None:
    geometry = FaceGeometry(eye_spacing=0.4, eye_y=0.4)
    face = draw_face(geometry, size=200, face_height=0.7)
    right_x, eye_y = face.landmarks["right_eye"]
    left_x, _ = face.landmarks["left_eye"]
    assert left_x - right_x == pytest.approx(0.4 * face.box.w, rel=0.02)
    assert eye_y - face.box.y == pytest.approx(0.4 * face.box.h, rel=0.03)


def test_detected_landmarks_sit_on_drawn_ones() -> None:
    face = draw_face(FaceGeometry(), size=160, rng=np.random.default_rng(0))
    right, left, mouth = landmarks(face.image, face.box)
    assert right.x + face.box.x == pytest.approx(face.landmarks["right_eye"][0], abs=1.0)
    assert left.x + face.box.x == pytest.approx(face.landmarks["left_eye"][0], abs=1.0)
    assert mouth.y + face.box.y == pytest.approx(face.landmarks["mouth"][1], abs=1.0)


def test_embedding_is_unit_length() -> None:
    face = draw_face(random_geometry(np.random.default_rng(1)), rng=np.random.default_rng(2))
    vector = GeometryProxyEmbedder().embed(face.image, face.box)
    assert float(np.linalg.norm(vector)) == pytest.approx(1.0)
    assert vector.shape == (8,)


def test_same_geometry_at_new_size_and_place_stays_close() -> None:
    rng = np.random.default_rng(3)
    proxy = GeometryProxyEmbedder()
    for _ in range(10):
        geometry = random_geometry(rng)
        first = draw_face(geometry, 128, rng=rng)
        second = draw_face(geometry, 176, 0.6, (0.45, 0.55), rng=rng)
        distance = cosine_distance(proxy.embed(first.image, first.box),
                                   proxy.embed(second.image, second.box))
        assert distance < 0.03


def test_different_geometry_is_far_on_average() -> None:
    rng = np.random.default_rng(4)
    proxy = GeometryProxyEmbedder()
    distances = []
    for _ in range(20):
        first = draw_face(random_geometry(rng), rng=rng)
        second = draw_face(random_geometry(rng), rng=rng)
        distances.append(cosine_distance(proxy.embed(first.image, first.box),
                                         proxy.embed(second.image, second.box)))
    assert float(np.mean(distances)) > 0.15


def test_distance_grows_with_nudge_size() -> None:
    proxy = GeometryProxyEmbedder()
    means = []
    for amount in (0.02, 0.08, 0.2):
        rng = np.random.default_rng(5)
        values = []
        for _ in range(12):
            geometry = random_geometry(rng)
            base = draw_face(geometry, rng=rng)
            moved = draw_face(nudge(geometry, amount, rng), rng=rng)
            values.append(cosine_distance(proxy.embed(base.image, base.box),
                                          proxy.embed(moved.image, moved.box)))
        means.append(float(np.mean(values)))
    assert means[0] < means[1] < means[2]


@pytest.mark.parametrize("tone", range(len(SKIN_TONES)))
def test_skin_tone_alone_does_not_move_the_proxy(tone: int) -> None:
    proxy = GeometryProxyEmbedder()
    reference = draw_face(FaceGeometry(tone=0), rng=np.random.default_rng(6))
    toned = draw_face(FaceGeometry(tone=tone), rng=np.random.default_rng(6))
    distance = cosine_distance(proxy.embed(reference.image, reference.box),
                               proxy.embed(toned.image, toned.box))
    assert distance < 0.01


def test_blank_face_box_is_rejected() -> None:
    blank = np.full((64, 64, 3), 0.7)
    with pytest.raises(ProxyDetectionError, match="eye-like"):
        GeometryProxyEmbedder().embed(blank, FaceBox(8, 8, 48, 48))
    with pytest.raises(ProxyDetectionError, match="too small"):
        GeometryProxyEmbedder().embed(blank, FaceBox(0, 0, 8, 8))


def test_dark_blobs_ignore_specks() -> None:
    crop = np.full((30, 30, 3), 0.8)
    crop[5, 5] = 0.0
    crop[10:16, 10:16] = 0.0
    blobs = dark_blobs(crop)
    assert len(blobs) == 1
    assert blobs[0].area >= 30


def test_descriptor_is_scale_free() -> None:
    # Blob widths are whole pixels, so small faces carry about one pixel of error.
    small = draw_face(FaceGeometry(), size=120)
    large = draw_face(FaceGeometry(), size=240)
    assert np.allclose(descriptor(small.image, small.box),
                       descriptor(large.image, large.box), atol=0.08)


def test_draw_face_checks_height() -> None:
    with pytest.raises(ValueError, match="face_height"):
        draw_face(FaceGeometry(), face_height=0.1)
