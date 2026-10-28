"""Fuzz and edge cases for the identity package: random records, odd names, odd vectors.

Seeded randomness only; every model and dataset name is invented.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
import random

import numpy as np
import pytest

from lab.ml.critic import FaceBox
from lab.ml.identity import (
    AdmissionFormatError,
    GeometryProxyEmbedder,
    ProxyDetectionError,
    admit,
    cosine_distance,
    draw_face,
    finite_difference_check,
    identity_loss,
    random_geometry,
    records_from_json,
)
from lab.ml.identity.excluded import matches, name_key

GOOD = {
    "model_name": "tidepool-embed",
    "version": "2.1",
    "licence_id": "MIT",
    "commercial_use": True,
    "weights_sha256": hashlib.sha256(b"w").hexdigest(),
    "provenance": [{"name": "rendered-heads", "kind": "generator", "licence_id": "MIT",
                    "commercial_use": True}],
}
JUNK: list[object] = [None, 0, 1.5, "", "x", [], {}, True, False, "CC-BY-NC-4.0"]


def mutated(rng: random.Random) -> tuple[dict[str, object], bool]:
    """A damaged copy of GOOD, and whether any change could matter to the gate.

    Renaming the model or version to other non-empty text is harmless; every
    other removal or replacement takes away something the gate needs.
    """
    record = json.loads(json.dumps(GOOD))
    harmful = False
    for _ in range(rng.randint(1, 3)):
        key = rng.choice(list(GOOD))
        if rng.random() < 0.5:
            record.pop(key, None)
            harmful = True
        else:
            value = rng.choice(JUNK)
            record[key] = value
            renamed = key in ("model_name", "version") and isinstance(value, str) and value
            harmful = harmful or not renamed
    return record, harmful


def test_random_damage_never_admits_and_never_crashes() -> None:
    rng = random.Random(7)
    checked = 0
    for _ in range(300):
        record, harmful = mutated(rng)
        parsed = records_from_json(json.dumps([record]))[0]
        if isinstance(parsed, AdmissionFormatError):
            continue
        checked += 1
        assert admit(parsed).admitted is not harmful, record
    assert checked > 100


def test_the_undamaged_record_is_admitted() -> None:
    parsed = records_from_json(json.dumps([GOOD]))[0]
    assert not isinstance(parsed, AdmissionFormatError)
    assert admit(parsed).admitted


@pytest.mark.parametrize("name", ["Ünïcödé Heads 2", "x" * 500, "  spaced   out  ", "a/b\\c"])
def test_odd_names_are_handled(name: str) -> None:
    record = dict(GOOD, model_name=name)
    parsed = records_from_json(json.dumps([record]))[0]
    assert not isinstance(parsed, AdmissionFormatError)
    assert isinstance(admit(parsed).admitted, bool)
    assert name_key(name) == name_key(name.upper())


def test_separator_variants_of_an_excluded_name_all_match() -> None:
    listed = frozenset({hashlib.sha256(b"zorbset9").hexdigest()})
    for variant in ("Zorbset9", "zorb-set-9", "ZORB_SET 9", "the zorb set 9 mix"):
        assert matches(variant, listed), variant
    assert not matches("zorb 8", listed)


def test_proxy_handles_boxes_at_the_frame_edge() -> None:
    face = draw_face(random_geometry(np.random.default_rng(1)), 128, 0.7, (0.5, 0.5))
    proxy = GeometryProxyEmbedder()
    inside = proxy.embed(face.image, face.box)
    padded = FaceBox(max(face.box.x - 4, 0), max(face.box.y - 4, 0), face.box.w + 8,
                     face.box.h + 8)
    assert cosine_distance(inside, proxy.embed(face.image, padded)) < 0.05
    with pytest.raises(ProxyDetectionError):
        proxy.embed(face.image, FaceBox(0, 0, 20, 20))


def test_proxy_on_wide_frames() -> None:
    rng = np.random.default_rng(2)
    geometry = random_geometry(rng)
    square = draw_face(geometry, 128, rng=rng)
    wide = np.concatenate([np.full((128, 64, 3), 0.75), square.image, np.full((128, 64, 3),
                                                                            0.75)], axis=1)
    box = FaceBox(square.box.x + 64, square.box.y, square.box.w, square.box.h)
    proxy = GeometryProxyEmbedder()
    assert cosine_distance(proxy.embed(square.image, square.box), proxy.embed(wide, box)) < 1e-9


@pytest.mark.parametrize("dimension", [2, 16, 512])
def test_gradients_hold_in_any_dimension(dimension: int) -> None:
    rng = np.random.default_rng(dimension)
    source = rng.normal(0.0, 1.0, dimension)
    edit = rng.normal(0.0, 1.0, dimension)
    value = identity_loss(source, edit, "squared_hinge", margin=0.0)
    sample = rng.choice(dimension, size=min(dimension, 16), replace=False)

    def partial(point: np.ndarray) -> float:
        full = edit.copy()
        full[sample] = point
        return identity_loss(source, full, "squared_hinge", margin=0.0).loss

    assert finite_difference_check(partial, edit[sample], value.grad_edit[sample]) < 1e-5


def test_parallel_and_opposite_vectors() -> None:
    source = np.array([0.3, 0.4, 0.5])
    same = identity_loss(source, 7.0 * source, "cosine")
    opposite = identity_loss(source, -source, "cosine")
    assert same.distance == pytest.approx(0.0, abs=1e-12)
    assert float(np.abs(same.grad_edit).max()) < 1e-12
    assert opposite.distance == pytest.approx(2.0)
    assert np.all(np.isfinite(opposite.grad_edit))


def test_tiny_but_non_zero_vectors_still_work() -> None:
    source = np.array([1e-9, 0.0])
    edit = np.array([0.0, 1e-9])
    assert identity_loss(source, edit, "cosine").distance == pytest.approx(1.0)
