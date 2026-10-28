"""Private shard input contracts, tamper refusals and safe result accounting.

No real photographs, identities, model weights or raw biometric vectors.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import io
import json
from collections.abc import Sequence
from dataclasses import asdict, replace

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.identity_pair_shards import (
    PrivatePairShard,
    combine_private_pair_shards,
    read_private_pair_shard,
)
from plumb_api.commands.identity_pairs import IdentityPair, IdentityPolicy, RequiredSlice


DIMENSIONS = ("source", "tone", "gender", "yaw", "occlusion", "image_size")
LABELS = tuple(RequiredSlice(dimension, letter)
               for dimension in DIMENSIONS for letter in ("A", "B"))


def fixed_policy() -> IdentityPolicy:
    return IdentityPolicy(
        name="private_test_policy",
        manifest_sha256="a" * 64,
        model_sha256="b" * 64,
        preprocessing_sha256="c" * 64,
        definitions_sha256="d" * 64,
        baseline_sha256="e" * 64,
        threshold=0.7,
        minimum_genuine=10,
        minimum_impostor=10,
        minimum_genuine_per_slice=5,
        minimum_impostor_per_slice=5,
        max_false_accept_rate=0.2,
        min_true_accept_rate=0.8,
        max_true_accept_gap=0.1,
        required_slices=LABELS,
        independent_threshold_commit=True,
    )


def pair(index: int, *, genuine: bool = True, group: str = "A",
         split: str = "frozen") -> IdentityPair:
    return IdentityPair(
        pair_id=f"pair_{index}_{'g' if genuine else 'i'}",
        source_a=f"source_{index}_a",
        source_b=f"source_{index}_b",
        subject_a=f"subject_{index}",
        subject_b=f"subject_{index}" if genuine else f"other_{index}",
        genuine=genuine,
        cosine=0.95 if genuine else 0.2,
        slices=tuple(RequiredSlice(dim, group) for dim in DIMENSIONS),
        consent_and_rights_checked=True,
        reference_labels_checked=True,
        split=split,
    )


def canonical(value: object) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True,
                      allow_nan=False)


def record(pair_: IdentityPair) -> dict[str, object]:
    payload: dict[str, object] = asdict(pair_)
    payload["slices"] = [asdict(tag) for tag in pair_.slices]
    return payload


def source_for(
    rows: Sequence[IdentityPair],
    *,
    policy: IdentityPolicy | None = None,
    shard_index: int = 0,
    shard_count: int = 1,
    kind: str = "synthetic",
    run_id: str = "private_test",
) -> io.StringIO:
    frozen = fixed_policy() if policy is None else policy
    content = "".join(canonical(record(row)) + "\n" for row in rows)
    rows_sha256 = hashlib.sha256(content.encode("ascii")).hexdigest()
    header: dict[str, object] = {
        "version": "beljour-private-identity-pairs/1",
        "run_id": run_id,
        "policy_sha256": frozen.fingerprint(),
        "manifest_sha256": frozen.manifest_sha256,
        "model_sha256": frozen.model_sha256,
        "preprocessing_sha256": frozen.preprocessing_sha256,
        "definitions_sha256": frozen.definitions_sha256,
        "shard_index": shard_index,
        "shard_count": shard_count,
        "row_count": len(rows),
        "rows_sha256": rows_sha256,
        "source_kind": kind,
    }
    return io.StringIO(canonical(header) + "\n" + content)


def edit_header(text: str, key: str, value: object) -> io.StringIO:
    lines = text.splitlines(keepends=True)
    header = json.loads(lines[0])
    header[key] = value
    return io.StringIO(canonical(header) + "\n" + "".join(lines[1:]))


def edit_row(text: str, key: str, value: object) -> io.StringIO:
    lines = text.splitlines(keepends=True)
    row = json.loads(lines[1])
    row[key] = value
    return io.StringIO(lines[0] + canonical(row) + "\n" + "".join(lines[2:]))


def test_reads_exactly_bound_private_shard() -> None:
    policy = fixed_policy()
    sample = (pair(0), pair(1, genuine=False))
    parsed = read_private_pair_shard(source_for(sample, policy=policy), policy)
    assert parsed.shard_index == 0
    assert parsed.shard_count == 1
    assert parsed.expected_count == 2
    assert parsed.rows == sample
    assert parsed.source_kind == "synthetic"
    assert parsed.policy_sha256 == policy.fingerprint()


def test_private_status_exposes_no_row_content() -> None:
    policy = fixed_policy()
    parsed = read_private_pair_shard(source_for((pair(0),)), policy)
    public = canonical(parsed.public_status())
    assert json.loads(public)["rows_read"] == 1
    for private in ("subject_0", "source_0", "pair_0"):
        assert private not in public
    assert "cosine" not in public


def test_single_shard_combines_only_to_nonrelease_audit() -> None:
    policy = fixed_policy()
    input_ = (pair(0), pair(1, genuine=False))
    parsed = read_private_pair_shard(source_for(input_), policy)
    report = combine_private_pair_shards([parsed], policy)
    assert report.status == "unproven"
    assert report.release_qualified is False
    assert report.all_pairs.genuine == 1
    assert report.all_pairs.impostor == 1


def test_reverse_order_shards_match_forward_order() -> None:
    policy = fixed_policy()
    groups = (pair(0), pair(1, genuine=False))
    left = read_private_pair_shard(source_for(groups[:1], shard_count=2), policy)
    right = read_private_pair_shard(source_for(groups[1:], shard_index=1, shard_count=2), policy)
    forward = combine_private_pair_shards([left, right], policy)
    reversed_ = combine_private_pair_shards([right, left], policy)
    assert forward.public_metadata() == reversed_.public_metadata()


def test_synthetic_and_private_source_classes_are_separate() -> None:
    policy = fixed_policy()
    synthetic = read_private_pair_shard(source_for((pair(0),)), policy)
    released = read_private_pair_shard(
        source_for((pair(0),), kind="authorized_private"), policy,
    )
    assert not combine_private_pair_shards([synthetic], policy).measured_on_external_faces
    assert combine_private_pair_shards([released], policy).measured_on_external_faces
    assert not combine_private_pair_shards([released], policy).release_qualified


@pytest.mark.parametrize("field,bad", [
    ("version", "wrong-version"),
    ("policy_sha256", "f" * 64),
    ("manifest_sha256", "f" * 64),
    ("model_sha256", "f" * 64),
    ("preprocessing_sha256", "f" * 64),
    ("definitions_sha256", "f" * 64),
    ("run_id", "../raw_photo"),
    ("shard_index", -1),
    ("shard_index", 1),
    ("shard_index", False),
    ("shard_count", 0),
    ("shard_count", 5000),
    ("row_count", -1),
    ("row_count", 2),
    ("row_count", True),
    ("rows_sha256", "F" * 64),
    ("source_kind", "unverified_external"),
    ("source_kind", False),
])
def test_header_invalid_values_fail_closed(field: str, bad: object) -> None:
    text = source_for((pair(0),)).getvalue()
    with pytest.raises(CommandValidationError):
        read_private_pair_shard(edit_header(text, field, bad), fixed_policy())


@pytest.mark.parametrize("field,bad", [
    ("genuine", False),
    ("cosine", 1.1),
    ("cosine", "0.5"),
    ("cosine", True),
    ("subject_a", "private/person.png"),
    ("source_a", "source_0_b"),
    ("split", "training"),
    ("reference_labels_checked", 1),
    ("consent_and_rights_checked", "yes"),
    ("slices", [{"dimension": "tone", "label": "A"},
                {"dimension": "tone", "label": "B"}]),
])
def test_modified_private_record_is_rejected(field: str, bad: object) -> None:
    text = source_for((pair(0),)).getvalue()
    with pytest.raises(CommandValidationError):
        read_private_pair_shard(edit_row(text, field, bad), fixed_policy())


def test_torn_record_and_extra_record_are_rejected() -> None:
    text = source_for((pair(0),)).getvalue()
    for broken in (text[:-1].replace("}", "", 1),
                   text + canonical(record(pair(1))) + "\n",
                   text.splitlines()[0] + "\n"):
        with pytest.raises(CommandValidationError):
            read_private_pair_shard(io.StringIO(broken), fixed_policy())


def test_duplicate_json_fields_rejected_before_validation() -> None:
    text = source_for((pair(0),)).getvalue()
    lines = text.splitlines(keepends=True)
    duplicate = lines[0].replace('"version":', '"version":"x","version":')
    with pytest.raises(CommandValidationError):
        read_private_pair_shard(io.StringIO(duplicate + "".join(lines[1:])), fixed_policy())


def test_nan_constant_rejected_at_json_boundary() -> None:
    text = source_for((pair(0),)).getvalue()
    lines = text.splitlines(keepends=True)
    altered = lines[1].replace("0.95", "NaN")
    with pytest.raises(CommandValidationError):
        read_private_pair_shard(io.StringIO(lines[0] + altered), fixed_policy())


def test_unexpected_raw_photo_field_is_rejected() -> None:
    text = source_for((pair(0),)).getvalue()
    lines = text.splitlines(keepends=True)
    extra = lines[1].replace('"cosine":', '"photo_path":"/private.jpg","cosine":')
    with pytest.raises(CommandValidationError):
        read_private_pair_shard(io.StringIO(lines[0] + extra), fixed_policy())


def test_empty_shard_is_still_incomplete_qualification() -> None:
    policy = fixed_policy()
    empty = read_private_pair_shard(source_for(()), policy)
    assert empty.rows == ()
    report = combine_private_pair_shards([empty], policy)
    assert report.status == "unproven"


def test_blank_lines_are_rejected() -> None:
    text = source_for((pair(0),)).getvalue()
    with pytest.raises(CommandValidationError):
        read_private_pair_shard(io.StringIO(text + "\n"), fixed_policy())


def test_non_utf8_character_is_not_permitted_for_identifier() -> None:
    text = source_for((pair(0),)).getvalue()
    with pytest.raises(CommandValidationError):
        read_private_pair_shard(edit_row(text, "pair_id", "name✨"), fixed_policy())


def test_oversized_line_is_refused_without_reading_everything() -> None:
    text = source_for((pair(0),)).getvalue()
    large = text + "x" * 20_000 + "\n"
    with pytest.raises(CommandValidationError):
        read_private_pair_shard(io.StringIO(large), fixed_policy())


def test_combine_rejects_missing_shards() -> None:
    policy = fixed_policy()
    one = read_private_pair_shard(source_for((pair(0),), shard_count=2), policy)
    with pytest.raises(CommandValidationError):
        combine_private_pair_shards([one], policy)


def test_combine_rejects_repeated_shard_indexes() -> None:
    policy = fixed_policy()
    one = read_private_pair_shard(source_for((pair(0),), shard_count=2), policy)
    with pytest.raises(CommandValidationError):
        combine_private_pair_shards([one, one], policy)


def test_combine_rejects_mixed_run_identity() -> None:
    policy = fixed_policy()
    one = read_private_pair_shard(source_for((pair(0),), shard_count=2), policy)
    two = read_private_pair_shard(source_for((pair(1),), shard_count=2,
                                                  shard_index=1, run_id="new_run"), policy)
    with pytest.raises(CommandValidationError):
        combine_private_pair_shards([one, two], policy)


def test_combine_rejects_mixed_source_class() -> None:
    policy = fixed_policy()
    one = read_private_pair_shard(source_for((pair(0),), shard_count=2), policy)
    two = read_private_pair_shard(source_for((pair(1),), shard_count=2,
                                                  shard_index=1, kind="authorized_private"), policy)
    with pytest.raises(CommandValidationError):
        combine_private_pair_shards([one, two], policy)


def test_combine_rejects_same_pair_in_two_shards() -> None:
    policy = fixed_policy()
    one = read_private_pair_shard(source_for((pair(0),), shard_count=2), policy)
    two = read_private_pair_shard(source_for((pair(0),), shard_count=2, shard_index=1), policy)
    with pytest.raises(CommandValidationError):
        combine_private_pair_shards([one, two], policy)


def test_combine_checks_row_count_even_after_in_memory_mutation() -> None:
    policy = fixed_policy()
    one = read_private_pair_shard(source_for((pair(0),)), policy)
    changed: PrivatePairShard = replace(one, expected_count=2)
    with pytest.raises(CommandValidationError):
        combine_private_pair_shards([changed], policy)


def test_combine_checks_frozen_policy_fingerprint() -> None:
    policy = fixed_policy()
    one = read_private_pair_shard(source_for((pair(0),)), policy)
    modified = replace(policy, threshold=0.81)
    with pytest.raises(CommandValidationError):
        combine_private_pair_shards([one], modified)


def test_private_shard_digest_depends_on_content_not_json_spacing() -> None:
    policy = fixed_policy()
    source = source_for((pair(0),))
    split = source.getvalue().splitlines()
    row = json.loads(split[1])
    pretty = io.StringIO(split[0] + "\n" + json.dumps(row, sort_keys=False) + "\n")
    assert read_private_pair_shard(pretty, policy).row_digest == read_private_pair_shard(
        source_for((pair(0),)), policy,
    ).row_digest
