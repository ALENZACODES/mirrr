"""Synthetic 10/100-shard definition and frozen-plan contracts.

Acceptance is unchanged: only a named frozen-100000 declaration can use IDs
10 through 99. A shard never proves the unsharded release gate. The tests
never read an actual face, image model, or released dataset.
Author: John Khan.
"""

from __future__ import annotations

import copy
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pytest

REALFACE = Path(__file__).resolve().parents[2] / "tests" / "realface"
sys.path.insert(0, str(REALFACE))

import definitions  # noqa: E402
import face_set  # noqa: E402
import gates  # noqa: E402
import run_state  # noqa: E402


@dataclass
class FakeFace:
    path: Path
    row: dict[str, Any]
    source: str = "drawn"
    race: str = "unknown"
    gender: str = "female"
    age: str = "20-39"
    slice: str = "synthetic"


def definition_data(face_set_name: str, ids: list[int], per: int) -> dict[str, Any]:
    """Use the committed quality definition, changing only synthetic set scope."""
    fixture = REALFACE / "pass_definitions-10000" / "regions.json"
    data = json.loads(fixture.read_text(encoding="utf-8"))
    data["face_set"] = {
        "id": face_set_name,
        "number_of_faces": len(ids) * per,
        "shards": {"ids": ids, "faces_per_shard": per},
    }
    return data


def drawn_faces(root: Path, shards: list[int]) -> list[FakeFace]:
    faces: list[FakeFace] = []
    for number, shard in enumerate(shards):
        file = root / f"drawn{number:04d}.png"
        file.write_bytes(f"drawn, deterministic case {number}, shard {shard}".encode())
        faces.append(FakeFace(file, {"shard": str(shard), "gender": "Female", "age_band": "20-39"}))
    return faces


@pytest.mark.parametrize("set_name,expected", [
    (None, 10),
    ("frozen-1000", 10),
    ("frozen-10000", 10),
    ("some-future-set", 10),
    ("frozen-100000", 100),
])
def test_only_declared_large_set_has_large_shard_space(set_name: str | None, expected: int) -> None:
    assert face_set.shard_limit(set_name) == expected


def test_mixed_large_face_set_is_refused() -> None:
    with pytest.raises(face_set.ScopeError, match="cannot mix"):
        face_set.shard_limit(("frozen-1000", "frozen-100000"))
    with pytest.raises(face_set.ScopeError, match="cannot mix"):
        face_set.shard_limit(("frozen-100000", "frozen-10000"))


@pytest.mark.parametrize("raw,expected", [
    ("0", (0,)),
    ("99", (99,)),
    ("1,99,42", (1, 42, 99)),
    (" 98 , 3 ", (3, 98)),
    (list(range(100)), tuple(range(100))),
])
def test_large_shard_parser_canonicalizes_valid_ids(raw: str | list[int], expected: tuple[int, ...]) -> None:
    assert face_set.parse_shards(raw, limit=100) == expected


@pytest.mark.parametrize("raw", [
    "100",
    "-1",
    "0,100",
    "1,1",
    "1,,2",
    "2.5",
    "0,x1",
    "abc",
    [False],
    [0, True],
    [0, 2.5],
])
def test_large_shard_parser_rejects_invalid_or_duplicate_values(raw: Any) -> None:
    with pytest.raises(face_set.ScopeError):
        face_set.parse_shards(raw, limit=100)


@pytest.mark.parametrize("limit", [-1, 0, 11, 99, 101, True, 10.0])
def test_caller_cannot_invent_a_larger_shard_limit(limit: Any) -> None:
    with pytest.raises(face_set.ScopeError, match="declared"):
        face_set.parse_shards("0", limit=limit)


@pytest.mark.parametrize("id_text", ["10", "42", "99"])
def test_legacy_parser_refuses_large_ids(id_text: str) -> None:
    with pytest.raises(face_set.ScopeError):
        face_set.parse_shards(id_text)
    with pytest.raises(face_set.ScopeError):
        face_set.shard_of({"shard": id_text})


@pytest.mark.parametrize("row", [
    {},
    {"shard": ""},
    {"shard": "  "},
    {"shard": "001"},
    {"shard": "-1"},
    {"shard": "100"},
    {"shard": "4.5"},
    {"shard": "unknown"},
])
def test_large_manifest_shards_fail_closed_on_invalid_evidence(row: dict[str, str]) -> None:
    with pytest.raises(face_set.ScopeError, match="shard"):
        face_set.shard_of(row, limit=100)


@pytest.mark.parametrize("id_value", [0, 9, 10, 42, 98, 99])
def test_large_manifest_accepts_legal_shard_ids(id_value: int) -> None:
    assert face_set.shard_of({"shard": str(id_value)}, limit=100) == id_value


def test_select_does_not_silently_drop_a_manifest_without_shard(tmp_path: Path) -> None:
    faces = drawn_faces(tmp_path, [0, 10, 99, 45])
    faces[2].row.pop("shard")
    with pytest.raises(face_set.ScopeError):
        face_set.select_shards(faces, (0, 10), limit=100)


def test_select_does_not_guess_missing_shards_from_path(tmp_path: Path) -> None:
    faces = drawn_faces(tmp_path, [0, 10, 99])
    for face in faces:
        face.row["file"] = "a99-face.png"
    picked = face_set.select_shards(faces, (99,), limit=100)
    assert picked == [faces[2]]


def test_subset_selection_is_stable_and_counts_are_numeric(tmp_path: Path) -> None:
    faces = drawn_faces(tmp_path, [99, 12, 0, 12, 99, 10, 9, 5])
    picked = face_set.select_shards(faces, (10, 99, 12), limit=100)
    assert picked == [faces[0], faces[1], faces[3], faces[4], faces[5]]
    assert face_set.shard_counts(picked, limit=100) == {"10": 1, "12": 2, "99": 2}
    assert face_set.select_shards(faces, None, limit=100) == faces


def test_full_100_shard_definition_is_accepted_without_lowering_other_rules() -> None:
    ids = list(range(100))
    data = definition_data("frozen-100000", ids, 1000)
    original_thresholds = copy.deepcopy(data["threshold"])
    definitions.validate(data, "regions")
    assert data["face_set"]["number_of_faces"] == 100000
    assert data["threshold"] == original_thresholds


@pytest.mark.parametrize("bad", [
    [0, 99, 100],
    [-1, 0, 99],
    [0, 0, 1],
    [True, 1, 99],
    [0, 9, "99"],
])
def test_large_definition_rejects_invalid_ids(bad: list[Any]) -> None:
    with pytest.raises(definitions.DefinitionError, match="shards"):
        definitions.validate(definition_data("frozen-100000", bad, 1000), "regions")


def test_large_ids_never_validate_under_old_set_name() -> None:
    with pytest.raises(definitions.DefinitionError, match="0-9"):
        definitions.validate(definition_data("frozen-10000", [0, 99], 1000), "regions")


def test_wrong_large_definition_denominator_is_rejected() -> None:
    data = definition_data("frozen-100000", list(range(100)), 1000)
    data["face_set"]["number_of_faces"] = 99999
    with pytest.raises(definitions.DefinitionError, match="add up"):
        definitions.validate(data, "regions")


def test_wrong_large_definition_shard_count_is_rejected() -> None:
    data = definition_data("frozen-100000", list(range(100)), 1000)
    data["face_set"]["shards"]["faces_per_shard"] = 999
    with pytest.raises(definitions.DefinitionError, match="add up"):
        definitions.validate(data, "regions")


def test_large_plan_keeps_shard_subset_separate_from_full_plan(tmp_path: Path) -> None:
    faces = drawn_faces(tmp_path, [0, 50, 99, 99, 5])
    repo = Path(__file__).resolve().parents[2]
    complete = run_state.freeze(faces, {}, repo, max_side=640, include=("frozen-100000",))
    selected = face_set.select_shards(faces, (99,), limit=100)
    subset = run_state.freeze(selected, {}, repo, max_side=640, include=("frozen-100000",), shards=(99,))
    assert complete["run_id"] != subset["run_id"]
    assert "shards" not in complete
    assert subset["shards"] == [99]
    assert subset["shard_counts"] == {"99": 2}
    assert [entry["shard"] for entry in subset["faces"]] == [99, 99]


def test_large_plan_refuses_faces_outside_subset(tmp_path: Path) -> None:
    faces = drawn_faces(tmp_path, [0, 10, 99])
    with pytest.raises(ValueError, match="outside"):
        run_state.freeze(faces, {}, tmp_path, max_side=640, include=("frozen-100000",), shards=(99,))


def test_legacy_plan_cannot_take_large_shard_values(tmp_path: Path) -> None:
    faces = drawn_faces(tmp_path, [10, 99])
    with pytest.raises(face_set.ScopeError, match="0-9"):
        run_state.freeze(faces, {}, tmp_path, max_side=640, include=("frozen-10000",), shards=(99,))


def test_large_declared_shard_scope_must_match_exact_counts() -> None:
    data = definition_data("frozen-100000", [98, 99], 1000)
    definitions.validate(data, "regions")
    definition = definitions.Definition("regions", "0" * 64, data, True)
    plan = {"shards": [98, 99], "shard_counts": {"98": 1000, "99": 1000}}
    assert gates._shard_scope(definition, plan) == []
    bad = {"shards": [98, 99], "shard_counts": {"98": 999, "99": 1001}}
    assert gates._shard_scope(definition, bad)
    assert gates._shard_scope(definition, {"shards": [98], "shard_counts": {"98": 1000}})


def test_full_scope_never_accepts_a_shard_substitute() -> None:
    data = definition_data("frozen-100000", [99], 1000)
    data["face_set"].pop("shards")
    definition = definitions.Definition("regions", "0" * 64, data, True)
    assert gates._shard_scope(definition, {"shards": [99]})
    assert gates._shard_scope(definition, {"shards": None}) == []
