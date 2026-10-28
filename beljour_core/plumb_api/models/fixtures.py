"""Contract 15: privacy-conscious landmark and mask fixtures for released photos.

Landmarks are biometric information even without a JPEG. All real fixtures need
an explicit photo release reference, and are saved on John's own device. The
recorder does not upload images. This validator rejects photo pixels, EXIF,
filenames, unapproved fields, large allocations and malformed masks.

Author: John Khan.
"""
from __future__ import annotations

import base64
import binascii
import hashlib
import json
import math
import re
from collections.abc import Mapping
from pathlib import Path
from typing import Any

FORMAT = "beljour-vision-fixture/1"
SHA = re.compile(r"[0-9a-f]{64}\Z")
SLUG = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]{2,79}\Z")
MASK_NAME = re.compile(r"[a-z][a-z0-9_-]{1,63}\Z")
MAX_SIDE = 4096
MAX_PIXELS = 4_194_304
MAX_FACES = 6
MAX_JSON_BYTES = 28_000_000
FIELDS = frozenset({"format", "version", "source", "image", "faces", "pose", "masks"})
FACE_FIELDS = frozenset({"id", "landmarks", "blendshapes", "pose"})
MASK_FIELDS = frozenset({"name", "width", "height", "encoding", "data", "sha256"})
SOURCE_FIELDS = frozenset({"releaseRef", "released", "captureMode", "author"})
IMAGE_FIELDS = frozenset({"sha256", "width", "height"})
POSE_FIELDS = frozenset({"landmarks"})
POSE_ESTIMATE_FIELDS = frozenset({"rollDegrees", "yawDegrees", "pitchDegrees", "interOcularDistance", "faceWidth", "confidence"})


class FixtureError(ValueError):
    pass


def _map(value: Any, allowed: frozenset[str], label: str) -> Mapping[str, Any]:
    if not isinstance(value, dict) or set(value) != allowed:
        raise FixtureError(f"{label}: missing or extra fields")
    return value


def _number(value: Any, label: str, *, low: float | None = None,
            high: float | None = None) -> float:
    if type(value) not in (int, float) or not math.isfinite(value):
        raise FixtureError(f"{label}: expected a finite number")
    if (low is not None and value < low) or (high is not None and value > high):
        raise FixtureError(f"{label}: outside the allowed range")
    return float(value)


def _dimensions(width: Any, height: Any, label: str) -> tuple[int, int]:
    if (type(width) is not int or type(height) is not int or
            not 1 <= width <= MAX_SIDE or not 1 <= height <= MAX_SIDE or
            width * height > MAX_PIXELS):
        raise FixtureError(f"{label}: dimensions exceed the fixture limit")
    return width, height


def _hash(value: Any, label: str) -> str:
    if not isinstance(value, str) or not SHA.fullmatch(value):
        raise FixtureError(f"{label}: expected 64 lowercase SHA-256 hex characters")
    return value


def _points(values: Any, count: int | None, label: str) -> None:
    if not isinstance(values, list) or (count is not None and len(values) != count):
        raise FixtureError(f"{label}: wrong number of points")
    for index, point in enumerate(values):
        if not isinstance(point, list) or len(point) != 3:
            raise FixtureError(f"{label}[{index}]: expected [x,y,z]")
        for coordinate in point:
            _number(coordinate, label, low=-4, high=4)


def encode_mask(data: bytes | bytearray, width: int, height: int, name: str) -> dict[str, Any]:
    _dimensions(width, height, "mask")
    if not MASK_NAME.fullmatch(name) or len(data) != width * height:
        raise FixtureError("mask name or byte length invalid")
    return {"name": name, "width": width, "height": height, "encoding": "u8-base64",
            "data": base64.b64encode(data).decode('ascii'), "sha256": hashlib.sha256(data).hexdigest()}


def decode_mask(mask: Mapping[str, Any]) -> bytes:
    m = _map(mask, MASK_FIELDS, "mask")
    width, height = _dimensions(m["width"], m["height"], "mask")
    if not isinstance(m['name'], str) or not MASK_NAME.fullmatch(m["name"]):
        raise FixtureError("mask name must be a short slug")
    if m["encoding"] != "u8-base64" or not isinstance(m["data"], str):
        raise FixtureError("unsupported mask encoding")
    _hash(m["sha256"], "mask.sha256")
    try:
        raw = base64.b64decode(m["data"], validate=True)
    except (binascii.Error, ValueError) as exc:
        raise FixtureError("invalid base64 mask") from exc
    if len(raw) != width * height or hashlib.sha256(raw).hexdigest() != m["sha256"]:
        raise FixtureError("mask length or checksum mismatch")
    if base64.b64encode(raw).decode('ascii') != m["data"]:
        raise FixtureError("non-canonical base64 mask")
    return raw


def validate_fixture(data: Any) -> dict[str, Any]:
    root = _map(data, FIELDS, "fixture")
    if root["format"] != FORMAT or root["version"] != 1:
        raise FixtureError("unknown vision fixture format")
    source = _map(root["source"], SOURCE_FIELDS, "source")
    if (source["released"] is not True or source["author"] != "John Khan" or
            source["captureMode"] not in ("manual", "local-model") or
            not isinstance(source["releaseRef"], str) or not SLUG.fullmatch(source["releaseRef"])):
        raise FixtureError("real fixtures require a releaseRef, explicit consent, and John Khan as author")
    image = _map(root["image"], IMAGE_FIELDS, "image")
    width, height = _dimensions(image["width"], image["height"], "image")
    _hash(image["sha256"], "image.sha256")
    faces = root["faces"]
    if not isinstance(faces, list) or len(faces) > MAX_FACES:
        raise FixtureError("up to six faces are allowed")
    seen: set[str] = set()
    for index, face in enumerate(faces):
        f = _map(face, FACE_FIELDS, f"faces[{index}]")
        if not isinstance(f["id"], str) or not SLUG.fullmatch(f["id"]) or f["id"] in seen:
            raise FixtureError("invalid or repeated face ID")
        seen.add(f["id"])
        _points(f["landmarks"], 478, "face.landmarks")
        if not isinstance(f["blendshapes"], dict) or len(f["blendshapes"]) > 100:
            raise FixtureError("invalid blendshapes")
        for name, score in f["blendshapes"].items():
            if not isinstance(name, str) or not MASK_NAME.fullmatch(name.lower()):
                raise FixtureError("invalid blendshape identifier")
            _number(score, "blendshape score", low=0, high=1)
        pose = _map(f["pose"], POSE_ESTIMATE_FIELDS, "face.pose")
        if pose["confidence"] != "estimate":
            raise FixtureError("face pose is an estimate only")
        for key in ("rollDegrees", "yawDegrees", "pitchDegrees"):
            _number(pose[key], key, low=-90, high=90)
        _number(pose["interOcularDistance"], "face.iod", low=0)
        _number(pose["faceWidth"], "face.width", low=0)
    p = _map(root["pose"], POSE_FIELDS, "pose")
    if p["landmarks"] is not None:
        _points(p["landmarks"], 33, "pose.landmarks")
    masks = root["masks"]
    if not isinstance(masks, list) or len(masks) > 32:
        raise FixtureError("at most 32 mask layers")
    seen.clear()
    for item in masks:
        m = _map(item, MASK_FIELDS, "mask")
        if m["width"] != width or m["height"] != height:
            raise FixtureError("mask size must match image")
        if m["name"] in seen:
            raise FixtureError("duplicate mask name")
        seen.add(m["name"])
        decode_mask(m)
    if not (faces or masks or p["landmarks"]):
        raise FixtureError("fixture needs at least one face, pose or mask")
    if source["captureMode"] == "manual" and faces:
        raise FixtureError("manual recorder cannot invent 478-point face landmarks")
    return dict(root)


def load_fixture(path: Path) -> dict[str, Any]:
    if path.stat().st_size > MAX_JSON_BYTES:
        raise FixtureError("fixture exceeds file size limit")
    return validate_fixture(json.loads(path.read_text()))
