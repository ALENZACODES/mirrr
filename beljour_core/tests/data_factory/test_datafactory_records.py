"""Record validation: every bad field is reported with a clear message.

Records are made-up metadata only. No images and no real faces.
Author: John Khan.
"""

from __future__ import annotations

from typing import Any

import pytest

from plumb_api.data_factory.hashing import (
    RollingHash,
    canonical_json,
    hash_json,
    is_sha256,
    seeded_key,
    sha256_bytes,
    sha256_file,
    shard_of,
)
from plumb_api.data_factory.records import (
    SKIN_TONE_GROUPS,
    FaceBox,
    ImageRecord,
    RecordError,
    validate_record,
)

DIGEST = sha256_bytes(b"record-test")


def raw(**changes: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "content_sha256": DIGEST,
        "source": "own-studio-shoot",
        "licence": "CC0-1.0",
        "attribution": "",
        "commercial_use": True,
        "consent": True,
    }
    base.update(changes)
    return {key: value for key, value in base.items() if value is not ...}


def test_minimal_record_round_trips() -> None:
    record = ImageRecord.from_dict(raw())
    assert record.content_sha256 == DIGEST
    assert record.age_band is None
    assert ImageRecord.from_dict(record.to_dict()) == record
    assert "age_band" not in record.to_dict()


def test_full_record_keeps_declared_values_and_box() -> None:
    record = ImageRecord.from_dict(raw(
        path="set/a.png", width=640, height=480, face_box=[10, 20, 200, 220],
        age_band="30-39", skin_tone_group=SKIN_TONE_GROUPS[4], lighting="studio",
        pose_bucket="frontal"))
    assert record.face_box == FaceBox(10, 20, 200, 220)
    assert record.declared("skin_tone_group") == "tone-05"
    assert record.to_dict()["face_box"] == [10, 20, 200, 220]
    with pytest.raises(KeyError):
        record.declared("mood")


@pytest.mark.parametrize(("changes", "message"), [
    ({"content_sha256": "ABC"}, "content_sha256: must be 64"),
    ({"content_sha256": ...}, "content_sha256: missing"),
    ({"source": ""}, "source: must not be empty"),
    ({"source": 5}, "source: must be text"),
    ({"licence": ...}, "licence: missing"),
    ({"licence": "  "}, "licence: missing"),
    ({"licence": "bad;licence"}, "licence: must be an SPDX-style"),
    ({"commercial_use": "yes"}, "commercial_use: must be true or false"),
    ({"consent": ...}, "consent: missing"),
    ({"path": "/abs/file.png"}, "path: must be a safe relative"),
    ({"path": "a/../b.png"}, "path: must be a safe relative"),
    ({"width": 0}, "width: must be a positive integer"),
    ({"height": True}, "height: must be a positive integer"),
    ({"face_box": [1, 2, 3]}, "face_box: must be"),
    ({"face_box": [-1, 0, 5, 5]}, "face_box: origin"),
    ({"width": 100, "height": 100, "face_box": [50, 50, 80, 10]}, "outside the image"),
    ({"age_band": "teen"}, "age_band: must be one of"),
    ({"lighting": "neon"}, "lighting: must be one of"),
    ({"mood": "happy"}, "unknown fields: mood"),
    ({"attribution": "line\nbreak"}, "attribution: contains control"),
    ({"source": "x" * 501}, "longer than 500"),
])
def test_each_problem_is_named(changes: dict[str, Any], message: str) -> None:
    problems = validate_record(raw(**changes))
    assert any(message in problem for problem in problems), problems
    with pytest.raises(RecordError) as caught:
        ImageRecord.from_dict(raw(**changes))
    assert caught.value.problems == problems


def test_all_problems_reported_together() -> None:
    problems = validate_record(raw(source="", licence=..., consent="no", age_band="x"))
    assert len(problems) == 4


def test_hash_optional_for_intake_rows() -> None:
    record = ImageRecord.from_dict(raw(content_sha256=...), require_hash=False)
    assert record.content_sha256 == ""
    assert record.with_hash(DIGEST).content_sha256 == DIGEST
    assert record.with_size(10, 20).width == 10


def test_non_mapping_is_rejected() -> None:
    assert validate_record([1, 2]) == ["record: must be a JSON object"]  # type: ignore[arg-type]


def test_hash_helpers(tmp_path: Any) -> None:
    path = tmp_path / "blob.bin"
    path.write_bytes(b"abc" * 1000)
    assert sha256_file(path) == sha256_bytes(b"abc" * 1000)
    assert is_sha256(DIGEST) and not is_sha256(DIGEST.upper()) and not is_sha256(3)
    assert canonical_json({"b": 1, "a": [1, 2]}) == '{"a":[1,2],"b":1}'
    assert hash_json({"a": 1, "b": 2}) == hash_json({"b": 2, "a": 1})
    rolling = RollingHash()
    rolling.add_all([{"a": 1}, {"b": 2}])
    assert rolling.count == 2
    assert rolling.hexdigest() == sha256_bytes(b'{"a":1}\n{"b":2}\n')
    assert seeded_key("s", DIGEST) != seeded_key("t", DIGEST)


def test_shard_assignment_is_stable_and_bounded() -> None:
    assert shard_of(DIGEST, 1) == 0
    assert 0 <= shard_of(DIGEST, 16) < 16
    assert shard_of(DIGEST, 16) == int(DIGEST[:16], 16) % 16
    with pytest.raises(ValueError):
        shard_of(DIGEST, 0)
    with pytest.raises(ValueError):
        shard_of("nothex", 4)
