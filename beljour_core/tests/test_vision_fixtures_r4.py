"""Contract 15: released-only, no-photo landmark/mask fixtures.

Only synthetic test pixels are used, no image downloads or people.
Author: John Khan.
"""
from __future__ import annotations

import base64
import copy
import hashlib
import json
from pathlib import Path

import pytest

from plumb_api.models.fixtures import (FixtureError, decode_mask, encode_mask,
                                       load_fixture, validate_fixture)


def fixture() -> dict:
    pixels = bytes(range(35))
    return {
        "format": "beljour-vision-fixture/1", "version": 1,
        "source": {"releaseRef": "release-test-001", "released": True,
                   "captureMode": "manual", "author": "John Khan"},
        "image": {"sha256": "a" * 64, "width": 7, "height": 5},
        "faces": [], "pose": {"landmarks": None}, "masks": [encode_mask(pixels, 7, 5, "manual_selection")],
    }


def test_mask_encoding_is_exact_and_integrity_protected() -> None:
    content = bytes(range(35))
    encoded = encode_mask(content, 7, 5, "test_mask")
    assert encoded["encoding"] == "u8-base64"
    assert decode_mask(encoded) == content
    assert encoded["sha256"] == hashlib.sha256(content).hexdigest()
    assert base64.b64decode(encoded["data"]) == content


def test_validate_released_manual_fixture_and_load(tmp_path: Path) -> None:
    data = fixture()
    assert validate_fixture(data) == data
    path = tmp_path / "test.json"
    path.write_text(json.dumps(data))
    assert load_fixture(path) == data
    assert "jpg" not in json.dumps(data).lower()


def test_full_478_mesh_and_33_pose_points() -> None:
    data = fixture()
    data["source"]["captureMode"] = "local-model"
    data["faces"] = [{
        "id": "face-1", "landmarks": [[0.5, 0.4, -0.1] for _ in range(478)],
        "blendshapes": {"eyeBlinkLeft": 0.4, "mouthSmileRight": 0.3},
        "pose": {"rollDegrees": 3.0, "yawDegrees": -5.0, "pitchDegrees": 2.0,
                 "interOcularDistance": 0.2, "faceWidth": 0.6, "confidence": "estimate"},
    }]
    data["pose"]["landmarks"] = [[0.5, 0.5, 0] for _ in range(33)]
    assert len(validate_fixture(data)["faces"][0]["landmarks"]) == 478
    data["source"]["captureMode"] = "manual"
    with pytest.raises(FixtureError, match="cannot invent"):
        validate_fixture(data)


@pytest.mark.parametrize("edit,message", [
    (lambda d: d.update(format="fake"), "format"),
    (lambda d: d["source"].update(released=False), "release"),
    (lambda d: d["source"].update(releaseRef="Jane Smith"), "release"),
    (lambda d: d["source"].update(author="Somebody else"), "release"),
    (lambda d: d["source"].update(captureMode="imported"), "release"),
    (lambda d: d["source"].update(originalFilename="photo.jpg"), "fields"),
    (lambda d: d.update(photo="base64 PII"), "fields"),
    (lambda d: d["image"].update(width=0), "dimensions"),
    (lambda d: d["image"].update(width=10000), "dimensions"),
    (lambda d: d["image"].update(sha256="Z" * 64), "SHA-256"),
    (lambda d: d["masks"].append(copy.deepcopy(d["masks"][0])), "duplicate"),
    (lambda d: d["masks"][0].update(width=2), "size"),
    (lambda d: d["masks"][0].update(encoding="float32"), "encoding"),
    (lambda d: d["masks"][0].update(data="?"), "base64"),
    (lambda d: d["masks"][0].update(data=base64.b64encode(b'bad').decode()), "length"),
    (lambda d: d["masks"][0].update(sha256="b" * 64), "checksum"),
    (lambda d: d["masks"].clear(), "at least"),
])
def test_reject_bad_or_sensitive_fixture(edit, message: str) -> None:
    data = fixture()
    edit(data)
    with pytest.raises(FixtureError, match=message):
        validate_fixture(data)


def test_missing_pose_or_empty_landmark_is_rejected() -> None:
    data = fixture()
    data["pose"]["landmarks"] = [[0, 0, 0] for _ in range(32)]
    with pytest.raises(FixtureError, match="wrong number of points"):
        validate_fixture(data)
    data["pose"]["landmarks"] = [[0.0, 0.0, float('nan')] for _ in range(33)]
    with pytest.raises(FixtureError, match="finite"):
        validate_fixture(data)


def test_noncanonical_encoding_rejected() -> None:
    data = fixture()
    data["masks"][0]["data"] += "A"
    with pytest.raises(FixtureError, match="base64"):
        validate_fixture(data)
    with pytest.raises(FixtureError, match="mask name"):
        encode_mask(b"12", 2, 1, "../danger")


def test_fixture_size_ceiling(tmp_path: Path) -> None:
    path = tmp_path / "huge.json"
    path.write_bytes(b"x" * (28_000_000 + 1))
    with pytest.raises(FixtureError, match="size limit"):
        load_fixture(path)
