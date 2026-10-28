"""R28E frozen body runs: r25e admission, provenance fingerprint and deterministic shards.

Manifests here are artificial counter-derived controls. Author: John Khan.
"""
from __future__ import annotations

import json

import pytest

from ...arena.constants import BANNED_SOURCES
from . import body_freeze as F


def _rows(per_group: int = 1) -> list[dict[str, object]]:
    return F.control_rows(per_group)


def test_balanced_control_freezes_to_1200_bodies_and_4200_jobs() -> None:
    run = F.freeze_manifest(F.control_rows(), shard_count=16)
    assert (len(run.bodies), run.job_count) == (1200, 4200)
    assert run.set_status() == "NOT_RUN"
    assert all(0 <= body.shard < 16 for body in run.bodies)
    assert len({body.shard for body in run.bodies}) == 16


@pytest.mark.parametrize(("field", "value"), [
    ("licence", "All-Rights-Reserved"), ("derived_metrics_allowed", False), ("released_adult", False),
    ("minors_excluded", False), ("monk", "11"), ("view", "back"), ("photo_sha256", "A" * 64),
    ("source_ancestry", [next(iter(BANNED_SOURCES))]),
])
def test_rows_failing_r25e_admission_are_refused(field: str, value: object) -> None:
    rows = _rows()
    rows[5][field] = value
    with pytest.raises(F.FreezeError, match="inadmissible_manifest_row"):
        F.freeze_manifest(rows)


def test_extra_or_missing_fields_and_duplicates_are_refused() -> None:
    rows = _rows()
    rows[0]["filename"] = "body.jpg"
    with pytest.raises(F.FreezeError, match="invalid_manifest_row"):
        F.freeze_manifest(rows)
    rows = _rows()
    rows.append(dict(rows[3]))
    with pytest.raises(F.FreezeError, match="duplicate_body"):
        F.freeze_manifest(rows)


def test_fingerprint_covers_original_provenance_but_not_row_order() -> None:
    rows = _rows()
    base = F.freeze_manifest(rows).fingerprint
    assert F.freeze_manifest(list(reversed(rows))).fingerprint == base
    changed = [dict(row) for row in rows]
    changed[7]["source_ancestry"] = ["owner_consent_original_upload"]
    assert F.freeze_manifest(changed).fingerprint != base
    assert F.freeze_manifest(rows, shard_count=8).fingerprint != base


def test_shards_depend_on_the_photo_hash_alone() -> None:
    small = F.freeze_manifest(_rows(1), shard_count=32)
    large = F.freeze_manifest(_rows(2), shard_count=32)
    by_hash = {body.photo_sha256: body.shard for body in large.bodies}
    assert all(by_hash[body.photo_sha256] == body.shard for body in small.bodies)


@pytest.mark.parametrize("count", [0, F.MAX_SHARDS + 1, True, 2.0])
def test_shard_count_is_bounded(count: object) -> None:
    with pytest.raises(F.FreezeError, match="invalid_shard_count"):
        F.freeze_manifest(_rows(), shard_count=count)  # type: ignore[arg-type]


def test_public_view_is_aggregate_only() -> None:
    rows = _rows()
    public = F.freeze_manifest(rows).public()
    text = json.dumps(public)
    assert not any(str(row["photo_sha256"]) in text for row in rows)
    assert "owner_consent_control" not in text
    assert len(public["groups"]) == 60
    assert sum(item["bodies"] for item in public["groups"]) == len(rows)
    assert public["set_status"] == "UNPROVEN"


def test_private_run_round_trips_and_refuses_definition_drift() -> None:
    run = F.freeze_manifest(_rows(), shard_count=4)
    record = run.private_record()
    assert F.load_private_run(json.loads(json.dumps(record))) == run
    with pytest.raises(F.FreezeError, match="definitions_changed"):
        F.load_private_run({**record, "definitions_sha256": "0" * 64})
    tampered = {**record, "bodies": [*record["bodies"], record["bodies"][0]]}
    with pytest.raises(F.FreezeError, match="invalid_frozen_run"):
        F.load_private_run(tampered)


def test_definitions_digest_tracks_committed_bytes() -> None:
    assert F.definitions_digest() == F.definitions_digest()
    assert len(F.definitions_digest()) == 64
