"""Reference trainer: reproducible resume and fail-closed numeric checkpoints.

All inputs are drawn images. These runs are smoke tests of the training and
checkpoint contract, not model-quality evidence. Author: John Khan.
"""

from __future__ import annotations

import io
import json
import os
import zipfile
from dataclasses import replace
from pathlib import Path

import numpy as np
import pytest

from .atomic import write_private_json
from .audit import CorpusAudit, CorpusInvalid, validate_corpus
from .revocations import REVOCATION_SCHEMA
from .test_support import FIXTURE_PLAN, DrawnCorpus, make_corpus
from .train import (
    LATEST_NAME,
    ReferenceWeights,
    decode_weights,
    encode_weights,
    initial_weights,
    load_checkpoint,
    save_checkpoint,
    train,
)


@pytest.fixture
def corpus(tmp_path: Path) -> DrawnCorpus:
    return make_corpus(tmp_path / "corpus")


def _audit(corpus: DrawnCorpus) -> CorpusAudit:
    return validate_corpus(corpus.approved, corpus.photos, corpus.plan, check_image_bytes=False)


def _archive(members: dict[str, np.ndarray], *, compression: int = zipfile.ZIP_STORED) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=compression) as archive:
        for name, array in members.items():
            member = io.BytesIO()
            np.lib.format.write_array(member, array, allow_pickle=False)
            archive.writestr(name, member.getvalue())
    return buffer.getvalue()


def _arrays(corpus: DrawnCorpus) -> dict[str, np.ndarray]:
    return dict(initial_weights(corpus.plan).arrays())


def test_resumed_run_is_byte_identical_to_an_unbroken_run(corpus: DrawnCorpus, tmp_path: Path) -> None:
    whole = train(corpus.approved, corpus.photos, tmp_path / "whole", corpus.plan)
    first = train(corpus.approved, corpus.photos, tmp_path / "split", corpus.plan, steps_this_run=2)
    second = train(corpus.approved, corpus.photos, tmp_path / "split", corpus.plan, resume=True)
    assert (whole["steps"], first["steps"], second["steps"]) == (4, 2, 4)
    assert second["steps_this_run"] == 2
    assert second["heldout_after"] == whole["heldout_after"]
    name = "step-00000004.npz"
    assert (tmp_path / "whole" / name).read_bytes() == (tmp_path / "split" / name).read_bytes()
    assert whole["release_quality"] == "NOT_RUN" and whole["checkpoint"] == "NUMERIC_ONLY"


def test_heldout_error_falls_with_more_steps(tmp_path: Path) -> None:
    corpus = make_corpus(tmp_path / "long", plan=replace(FIXTURE_PLAN, steps=40))
    report = train(corpus.approved, corpus.photos, tmp_path / "checkpoints", corpus.plan)
    assert report["heldout_after"]["mse"] < report["heldout_before"]["mse"]
    assert report["heldout_after"]["psnr_db"] > report["heldout_before"]["psnr_db"]
    assert report["heldout_after"]["count"] == _audit(corpus).eval_count


def test_reports_contain_aggregates_only(corpus: DrawnCorpus, tmp_path: Path) -> None:
    text = json.dumps(train(corpus.approved, corpus.photos, tmp_path / "ck", corpus.plan, steps_this_run=1))
    for row in corpus.records:
        for private in (row["subject_key"], row["sha256"], row["image"]):
            assert private not in text
    assert str(tmp_path) not in text


def test_new_run_cannot_reuse_a_checkpoint_directory(corpus: DrawnCorpus, tmp_path: Path) -> None:
    train(corpus.approved, corpus.photos, tmp_path / "ck", corpus.plan, steps_this_run=1)
    with pytest.raises(ValueError, match="Checkpoint run exists"):
        train(corpus.approved, corpus.photos, tmp_path / "ck", corpus.plan)
    train(corpus.approved, corpus.photos, tmp_path / "ck", corpus.plan, resume=True)
    with pytest.raises(ValueError, match="completed"):
        train(corpus.approved, corpus.photos, tmp_path / "ck", corpus.plan, resume=True)
    with pytest.raises(ValueError, match="step count"):
        train(corpus.approved, corpus.photos, tmp_path / "other", corpus.plan, steps_this_run=0)


def test_written_step_is_immutable(corpus: DrawnCorpus, tmp_path: Path) -> None:
    folder = tmp_path / "ck"
    train(corpus.approved, corpus.photos, folder, corpus.plan, steps_this_run=1)
    audit = _audit(corpus)
    _, saved = load_checkpoint(folder, corpus.plan, audit)
    save_checkpoint(folder, 1, saved, corpus.plan, audit)
    changed = ReferenceWeights(saved.encoder + np.float32(0.25), saved.encoder_bias, saved.decoder, saved.decoder_bias)
    with pytest.raises(ValueError, match="Immutable checkpoint step"):
        save_checkpoint(folder, 1, changed, corpus.plan, audit)
    assert load_checkpoint(folder, corpus.plan, audit)[1].encoder.tobytes() == saved.encoder.tobytes()


@pytest.mark.skipif(os.name == "nt", reason="POSIX permission bits")
def test_checkpoint_files_are_owner_only(corpus: DrawnCorpus, tmp_path: Path) -> None:
    folder = tmp_path / "ck"
    train(corpus.approved, corpus.photos, folder, corpus.plan, steps_this_run=1)
    assert folder.stat().st_mode & 0o077 == 0
    assert sorted(item.name for item in folder.iterdir()) == [LATEST_NAME, "step-00000001.json", "step-00000001.npz"]
    assert all(item.stat().st_mode & 0o777 == 0o600 for item in folder.iterdir())


def test_changed_arrays_or_metadata_block_resume(corpus: DrawnCorpus, tmp_path: Path) -> None:
    folder = tmp_path / "ck"
    train(corpus.approved, corpus.photos, folder, corpus.plan, steps_this_run=1)
    arrays, metadata = folder / "step-00000001.npz", folder / "step-00000001.json"
    original = arrays.read_bytes()
    arrays.write_bytes(original[:-9] + bytes([original[-9] ^ 1]) + original[-8:])
    with pytest.raises(ValueError, match="array digest mismatch"):
        train(corpus.approved, corpus.photos, folder, corpus.plan, resume=True)
    arrays.write_bytes(original)
    metadata.write_bytes(metadata.read_bytes().replace(b'"step":1', b'"step":1 '))
    with pytest.raises(ValueError, match="metadata digest mismatch"):
        train(corpus.approved, corpus.photos, folder, corpus.plan, resume=True)


def test_pointer_cannot_be_redirected(corpus: DrawnCorpus, tmp_path: Path) -> None:
    folder = tmp_path / "ck"
    train(corpus.approved, corpus.photos, folder, corpus.plan, steps_this_run=1)
    pointer = json.loads((folder / LATEST_NAME).read_text())
    for change in ({"step": 2}, {"metadata_sha256": "0" * 64}, {"extra": 1}):
        write_private_json(folder / LATEST_NAME, {**pointer, **change})
        with pytest.raises(ValueError):
            train(corpus.approved, corpus.photos, folder, corpus.plan, resume=True)


def test_changed_plan_or_register_blocks_resume(corpus: DrawnCorpus, tmp_path: Path) -> None:
    folder = tmp_path / "ck"
    train(corpus.approved, corpus.photos, folder, corpus.plan, steps_this_run=1)
    with pytest.raises(ValueError, match="Input or configuration changed"):
        load_checkpoint(folder, replace(corpus.plan, steps=8), _audit(corpus))
    register = tmp_path / "register.json"
    register.write_text(json.dumps({"schema": REVOCATION_SCHEMA, "subjects": [], "images": []}))
    with pytest.raises(CorpusInvalid, match="changed_revocation_register"):
        train(corpus.approved, corpus.photos, folder, corpus.plan, resume=True, revocations=register)


def test_checkpoints_stay_outside_private_inputs(corpus: DrawnCorpus) -> None:
    for inside in (corpus.approved / "ck", corpus.photos / "ck"):
        with pytest.raises(ValueError, match="outside approved manifests"):
            train(corpus.approved, corpus.photos, inside, corpus.plan, steps_this_run=1)


def test_unknown_files_in_checkpoint_directory_are_refused(corpus: DrawnCorpus, tmp_path: Path) -> None:
    folder = tmp_path / "ck"
    folder.mkdir(mode=0o700)
    (folder / "weights.pkl").write_bytes(b"\x80\x04N.")
    with pytest.raises(ValueError, match="Unexpected file"):
        train(corpus.approved, corpus.photos, folder, corpus.plan, steps_this_run=1)


def test_archive_encoding_is_deterministic_and_round_trips(corpus: DrawnCorpus) -> None:
    weights = initial_weights(corpus.plan)
    assert encode_weights(weights) == encode_weights(initial_weights(corpus.plan))
    restored = decode_weights(encode_weights(weights), corpus.plan)
    for name, array in weights.arrays().items():
        assert np.array_equal(restored.arrays()[name], array)


def test_archive_member_names_are_exact(corpus: DrawnCorpus) -> None:
    arrays = _arrays(corpus)
    renamed = {("../" + name if name == "encoder.npy" else name): value for name, value in arrays.items()}
    extra = {**arrays, "notes.npy": np.zeros(1, dtype=np.float32)}
    missing = {name: value for name, value in arrays.items() if name != "decoder_bias.npy"}
    for members in (renamed, extra, missing):
        with pytest.raises(ValueError, match="member names"):
            decode_weights(_archive(members), corpus.plan)


def test_archive_precision_shape_and_values_are_checked(corpus: DrawnCorpus) -> None:
    arrays = _arrays(corpus)
    wide = {**arrays, "encoder_bias.npy": arrays["encoder_bias.npy"].astype(np.float64)}
    with pytest.raises(ValueError, match="float32|Oversized"):
        decode_weights(_archive(wide), corpus.plan)
    half = {**arrays, "encoder_bias.npy": arrays["encoder_bias.npy"].astype(np.float16)}
    with pytest.raises(ValueError, match="float32"):
        decode_weights(_archive(half), corpus.plan)
    short = {**arrays, "decoder_bias.npy": arrays["decoder_bias.npy"][:-1]}
    with pytest.raises(ValueError, match="shape"):
        decode_weights(_archive(short), corpus.plan)
    poisoned = dict(arrays)
    poisoned["decoder.npy"] = arrays["decoder.npy"].copy()
    poisoned["decoder.npy"][0, 0] = np.nan
    with pytest.raises(ValueError, match="nonfinite"):
        decode_weights(_archive(poisoned), corpus.plan)


def test_archive_refuses_objects_compression_and_non_zip(corpus: DrawnCorpus) -> None:
    arrays = _arrays(corpus)
    with pytest.raises(ValueError, match="Unsupported checkpoint member"):
        decode_weights(_archive(arrays, compression=zipfile.ZIP_DEFLATED), corpus.plan)
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        for name in arrays:
            member = io.BytesIO()
            np.lib.format.write_array(member, np.array([{"x": 1}], dtype=object), allow_pickle=True)
            archive.writestr(name, member.getvalue())
    with pytest.raises(ValueError):
        decode_weights(buffer.getvalue(), corpus.plan)
    with pytest.raises(ValueError, match="Invalid checkpoint archive"):
        decode_weights(b"not a zip file", corpus.plan)
