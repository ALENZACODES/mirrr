"""Numeric-only shard index: equivalence with scanning, binding and tampering.

Author: John Khan.
"""

from __future__ import annotations

import io
import json
from pathlib import Path

import numpy as np
import pytest

from .atomic import read_private_json, write_private_bytes, write_private_json
from .audit import CorpusInvalid, validate_corpus
from .shard_index import METADATA_NAME, ShardIndex, build_shard_index
from .shard_stream import ShardReader
from .test_support import DrawnCorpus, make_corpus


@pytest.fixture(scope="module")
def built(tmp_path_factory: pytest.TempPathFactory) -> tuple[DrawnCorpus, Path]:
    root = tmp_path_factory.mktemp("index-corpus")
    corpus = make_corpus(root / "corpus")
    build_shard_index(corpus.approved, corpus.photos, corpus.plan, root / "index", shard_count=5)
    return corpus, root / "index"


def _load(corpus: DrawnCorpus, folder: Path) -> ShardIndex:
    audit = validate_corpus(corpus.approved, corpus.photos, corpus.plan, check_image_bytes=False)
    return ShardIndex.load(folder, audit, corpus.plan, approved=corpus.approved)


def _drain(reader: ShardReader) -> list[str]:
    found: list[str] = []
    while batch := reader.next_batch(3):
        found.extend(grant.sha256 for grant in batch)
    return found


def test_report_counts_rows_and_holds_no_private_values(tmp_path: Path) -> None:
    corpus = make_corpus(tmp_path / "corpus", size=18)
    report = build_shard_index(corpus.approved, corpus.photos, corpus.plan, tmp_path / "index",
                               shard_count=4)
    assert report["rows"] == {"train": 12, "eval": 6}
    assert report["contents"] == "NUMERIC_OFFSETS_ONLY"
    written = "".join(path.read_bytes().decode("latin1") for path in (tmp_path / "index").iterdir())
    for record in corpus.records:
        assert record["sha256"] not in written and record["subject_key"] not in written
        assert record["image"] not in written
    for path in (tmp_path / "index").glob("*.npy"):
        assert np.load(path, allow_pickle=False).dtype.kind == "u"


def test_indexed_reading_matches_scanning_for_every_shard(built: tuple[DrawnCorpus, Path]) -> None:
    corpus, folder = built
    index = _load(corpus, folder)
    for split in ("train", "eval"):
        total = 0
        for shard in range(5):
            scanned = _drain(ShardReader(corpus.approved, corpus.photos, corpus.plan,
                                         shard=shard, shard_count=5, split=split))
            indexed_reader = ShardReader(corpus.approved, corpus.photos, corpus.plan, shard=shard,
                                         shard_count=5, split=split, index=index)
            assert _drain(indexed_reader) == scanned
            assert indexed_reader.public()["indexed"] is True
            assert len(index.shard_offsets(split, shard)) == len(scanned)
            total += len(scanned)
        assert total == {"train": 32, "eval": 16}[split]


def test_scan_cursor_resumes_on_the_index(built: tuple[DrawnCorpus, Path], tmp_path: Path) -> None:
    corpus, folder = built
    whole = _drain(ShardReader(corpus.approved, corpus.photos, corpus.plan, shard=2, shard_count=5))
    scanning = ShardReader(corpus.approved, corpus.photos, corpus.plan, shard=2, shard_count=5)
    head = [grant.sha256 for grant in scanning.next_batch(2)]
    scanning.checkpoint(tmp_path / "cursor.json")
    indexed = ShardReader(corpus.approved, corpus.photos, corpus.plan, shard=2, shard_count=5,
                          index=_load(corpus, folder))
    indexed.resume(tmp_path / "cursor.json")
    assert head + _drain(indexed) == whole


def test_index_for_another_shard_count_is_refused(built: tuple[DrawnCorpus, Path]) -> None:
    corpus, folder = built
    with pytest.raises(ValueError, match="shard count"):
        ShardReader(corpus.approved, corpus.photos, corpus.plan, shard=0, shard_count=4,
                    index=_load(corpus, folder))


def test_stale_index_after_a_manifest_change_is_refused(tmp_path: Path) -> None:
    corpus = make_corpus(tmp_path / "corpus", size=18)
    build_shard_index(corpus.approved, corpus.photos, corpus.plan, tmp_path / "index", shard_count=2)
    summary = read_private_json(corpus.approved / "summary.json")
    write_private_json(corpus.approved / "summary.json", {**summary, "manifest_sha256": "0" * 64})
    # The live corpus itself no longer audits, so neither can anything bound to it.
    with pytest.raises(CorpusInvalid):
        _load(corpus, tmp_path / "index")
    write_private_json(corpus.approved / "summary.json", summary)
    metadata = read_private_json(tmp_path / "index" / METADATA_NAME)
    write_private_json(tmp_path / "index" / METADATA_NAME, {**metadata, "manifest_sha256": "1" * 64})
    with pytest.raises(ValueError, match="different corpus"):
        _load(corpus, tmp_path / "index")


def test_tampered_arrays_are_refused(tmp_path: Path) -> None:
    corpus = make_corpus(tmp_path / "corpus", size=18)
    folder = tmp_path / "index"
    build_shard_index(corpus.approved, corpus.photos, corpus.plan, folder, shard_count=2)
    target = folder / "train-offsets.npy"
    values = np.load(target, allow_pickle=False)
    buffer = io.BytesIO()
    np.save(buffer, values[::-1].copy(), allow_pickle=False)
    write_private_bytes(target, buffer.getvalue())
    with pytest.raises(ValueError, match="digest"):
        _load(corpus, folder)


def test_consistently_forged_offsets_are_caught_when_read(tmp_path: Path) -> None:
    """A forger who also rewrites the metadata digest still cannot redirect rows:
    each indexed row is re-parsed and must belong to the requested shard."""
    corpus = make_corpus(tmp_path / "corpus", size=18)
    folder = tmp_path / "index"
    build_shard_index(corpus.approved, corpus.photos, corpus.plan, folder, shard_count=2)
    ids = np.load(folder / "train-shards.npy", allow_pickle=False)
    offsets = np.load(folder / "train-offsets.npy", allow_pickle=False)
    metadata = read_private_json(folder / METADATA_NAME)
    # Claim every row is in shard 0, keeping offsets ordered so the arrays look valid.
    for name, values in (("train-shards.npy", np.zeros_like(ids)),
                         ("train-offsets.npy", np.sort(offsets))):
        buffer = io.BytesIO()
        np.save(buffer, values, allow_pickle=False)
        metadata["arrays"][name] = write_private_bytes(folder / name, buffer.getvalue())
    write_private_json(folder / METADATA_NAME, metadata)
    reader = ShardReader(corpus.approved, corpus.photos, corpus.plan, shard=0, shard_count=2,
                         index=_load(corpus, folder))
    if set(ids.tolist()) == {0}:
        pytest.skip("every drawn subject already maps to shard 0")
    with pytest.raises(CorpusInvalid, match="shard_index_mismatch"):
        _drain(reader)


def test_index_folder_must_be_outside_the_corpus(built: tuple[DrawnCorpus, Path]) -> None:
    corpus, _ = built
    for inside in (corpus.approved / "index", corpus.photos / "index"):
        with pytest.raises(ValueError, match="outside"):
            build_shard_index(corpus.approved, corpus.photos, corpus.plan, inside, shard_count=2)


def test_unknown_metadata_fields_are_refused(tmp_path: Path) -> None:
    corpus = make_corpus(tmp_path / "corpus", size=18)
    folder = tmp_path / "index"
    build_shard_index(corpus.approved, corpus.photos, corpus.plan, folder, shard_count=2)
    metadata = json.loads((folder / METADATA_NAME).read_text())
    write_private_json(folder / METADATA_NAME, {**metadata, "subjects": []})
    with pytest.raises(ValueError, match="Unsupported"):
        _load(corpus, folder)


def test_invalid_lookups(built: tuple[DrawnCorpus, Path]) -> None:
    corpus, folder = built
    index = _load(corpus, folder)
    for split, shard in (("test", 0), ("train", 5), ("train", -1)):
        with pytest.raises(ValueError, match="lookup"):
            index.shard_offsets(split, shard)
