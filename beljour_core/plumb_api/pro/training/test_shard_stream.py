"""Subject-isolated, resumable shard streaming over drawn approved corpora.

Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from .atomic import read_private_json, write_private_json
from .audit import CorpusInvalid
from .pipeline import ingest
from .shard_stream import ShardReader, subject_shard
from .test_support import FIXTURE_PLAN, SOURCE_CYCLE, DrawnCorpus, draw_record, make_corpus


@pytest.fixture(scope="module")
def corpus(tmp_path_factory: pytest.TempPathFactory) -> DrawnCorpus:
    return make_corpus(tmp_path_factory.mktemp("stream-corpus"))


def _drain(reader: ShardReader, size: int) -> list[str]:
    seen: list[str] = []
    while batch := reader.next_batch(size):
        seen.extend(grant.sha256 for grant in batch)
    return seen


def test_subject_shard_is_stable_and_bounded() -> None:
    subject = "f" * 64
    assert subject_shard(subject, 1, 8) == subject_shard(subject, 1, 8)
    shards = {subject_shard(hashlib.sha256(str(i).encode()).hexdigest(), 2026, 8) for i in range(200)}
    assert shards == set(range(8))
    for count in (0, 4097, True):
        with pytest.raises(ValueError):
            subject_shard(subject, 1, count)  # type: ignore[arg-type]


def test_shards_partition_each_split_exactly(corpus: DrawnCorpus) -> None:
    for split, expected in (("train", 32), ("eval", 16)):
        everything: list[str] = []
        for shard in range(3):
            everything += _drain(ShardReader(
                corpus.approved, corpus.photos, corpus.plan, shard=shard, shard_count=3, split=split,
            ), 4)
        assert len(everything) == expected == len(set(everything))


def test_every_image_of_a_subject_lands_in_one_shard(tmp_path: Path) -> None:
    root = tmp_path / "corpus"
    photos, rights = root / "photos", root / "rights"
    rows = []
    for index in range(24):
        source, licence = SOURCE_CYCLE[index % len(SOURCE_CYCLE)]
        subject = hashlib.sha256(f"person-{index % 6}".encode()).hexdigest()
        rows.append(draw_record(photos, rights, index, source=source, licence=licence,
                                subject_key=subject))
    corpus = DrawnCorpus(root, photos, rights, root / "approved", FIXTURE_PLAN, rows)
    ingest(corpus.write_source(rows), photos, rights, corpus.approved, plan=FIXTURE_PLAN)
    owner: dict[str, int] = {}
    streamed = 0
    for split in ("train", "eval"):
        for shard in range(4):
            reader = ShardReader(corpus.approved, photos, FIXTURE_PLAN, shard=shard,
                                 shard_count=4, split=split)
            while batch := reader.next_batch(3):
                streamed += len(batch)
                for grant in batch:
                    assert owner.setdefault(grant.subject_key, shard) == shard
    assert (streamed, len(owner)) == (24, 6)


def test_resume_neither_repeats_nor_skips(corpus: DrawnCorpus, tmp_path: Path) -> None:
    whole = _drain(ShardReader(corpus.approved, corpus.photos, corpus.plan, shard=0, shard_count=2), 3)
    reader = ShardReader(corpus.approved, corpus.photos, corpus.plan, shard=0, shard_count=2)
    head = [grant.sha256 for grant in reader.next_batch(3)]
    cursor = tmp_path / "cursor.json"
    reader.checkpoint(cursor)
    later = ShardReader(corpus.approved, corpus.photos, corpus.plan, shard=0, shard_count=2)
    later.resume(cursor)
    assert head + _drain(later, 5) == whole
    assert later.public()["complete"] is True
    assert later.public()["yielded"] == len(whole)


def test_cursor_and_progress_hold_no_private_values(corpus: DrawnCorpus, tmp_path: Path) -> None:
    reader = ShardReader(corpus.approved, corpus.photos, corpus.plan, shard=1, shard_count=2)
    batch = reader.next_batch(2)
    cursor = tmp_path / "cursor.json"
    reader.checkpoint(cursor)
    text = cursor.read_text() + json.dumps(reader.public())
    for grant in batch:
        assert grant.sha256 not in text and grant.subject_key not in text and grant.path not in text
    assert reader.public()["image_bytes"] == "VERIFIED_PER_ITEM"


@pytest.mark.parametrize("change", [
    {"shard": 1}, {"shard_count": 3}, {"split": "eval"}, {"manifest_sha256": "0" * 64},
    {"plan_sha256": "0" * 64}, {"extra": 1},
])
def test_foreign_or_edited_cursors_are_refused(
    corpus: DrawnCorpus, tmp_path: Path, change: dict[str, object],
) -> None:
    reader = ShardReader(corpus.approved, corpus.photos, corpus.plan, shard=0, shard_count=2)
    reader.next_batch(2)
    cursor = tmp_path / "cursor.json"
    reader.checkpoint(cursor)
    write_private_json(cursor, {**read_private_json(cursor), **change})
    fresh = ShardReader(corpus.approved, corpus.photos, corpus.plan, shard=0, shard_count=2)
    with pytest.raises(ValueError, match="different corpus"):
        fresh.resume(cursor)


@pytest.mark.parametrize("offset", [1, 10**9, -1])
def test_cursor_offsets_must_be_row_boundaries_inside_the_file(
    corpus: DrawnCorpus, tmp_path: Path, offset: int,
) -> None:
    reader = ShardReader(corpus.approved, corpus.photos, corpus.plan, shard=0, shard_count=2)
    cursor = tmp_path / "cursor.json"
    reader.checkpoint(cursor)
    write_private_json(cursor, {**read_private_json(cursor), "offset": offset})
    with pytest.raises(ValueError, match="cursor"):
        reader.resume(cursor)


def test_cursors_inside_the_corpus_are_refused(corpus: DrawnCorpus) -> None:
    reader = ShardReader(corpus.approved, corpus.photos, corpus.plan, shard=0, shard_count=2)
    for folder in (corpus.approved, corpus.photos):
        with pytest.raises(ValueError, match="outside"):
            reader.checkpoint(folder / "cursor.json")


def test_changed_image_bytes_fail_the_batch_without_advancing(tmp_path: Path) -> None:
    corpus = make_corpus(tmp_path / "corpus", size=18)
    reader = ShardReader(corpus.approved, corpus.photos, corpus.plan, shard=0, shard_count=1)
    first = reader.next_batch(1)[0]
    rows = [json.loads(line) for line in (corpus.approved / "train.jsonl").read_text().splitlines()]
    following = rows[1]["path"]
    (corpus.photos / following).write_bytes(b"replaced")
    with pytest.raises(CorpusInvalid, match="changed_approved_image"):
        reader.next_batch(4)
    assert reader.public()["yielded"] == 1
    assert first.sha256 == rows[0]["sha256"]


def test_manifest_changed_after_audit_is_refused(tmp_path: Path) -> None:
    corpus = make_corpus(tmp_path / "corpus", size=18)
    reader = ShardReader(corpus.approved, corpus.photos, corpus.plan, shard=0, shard_count=1)
    manifest = corpus.approved / "train.jsonl"
    manifest.write_bytes(manifest.read_bytes() + manifest.read_bytes().splitlines(True)[0])
    with pytest.raises(CorpusInvalid, match="changed_filtered_manifest"):
        reader.next_batch(1)


@pytest.mark.parametrize(("arguments", "message"), [
    ({"shard": 2, "shard_count": 2}, "shard number"),
    ({"shard": 0, "shard_count": 0}, "shard count"),
    ({"shard": 0, "shard_count": 1, "split": "test"}, "split"),
])
def test_invalid_reader_arguments(corpus: DrawnCorpus, arguments: dict[str, object], message: str) -> None:
    with pytest.raises(ValueError, match=message):
        ShardReader(corpus.approved, corpus.photos, corpus.plan, **arguments)  # type: ignore[arg-type]


@pytest.mark.parametrize("size", [0, 4097])
def test_invalid_batch_sizes(corpus: DrawnCorpus, size: int) -> None:
    reader = ShardReader(corpus.approved, corpus.photos, corpus.plan, shard=0, shard_count=1)
    with pytest.raises(ValueError, match="batch size"):
        reader.next_batch(size)
