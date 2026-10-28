"""C16 item (g): pass definitions for the 50,000-face run.

Pass definition: tests/realface/pass_definitions-50000 mirrors
pass_definitions-10000 file for file with the same rules, thresholds,
versions and manifest policy; only face_set differs (frozen-50000, 10 shards
of 5,000); every file loads and the CLI validator accepts the folder; the
gate's shard scope accepts exactly the ten declared shards at 5,000 faces.
No faces are used. Author: John Khan.
"""
from __future__ import annotations

import json
import subprocess
import sys

import pytest
from gatefix_gates import REALFACE

if str(REALFACE) not in sys.path:
    sys.path.insert(0, str(REALFACE))

import definitions  # noqa: E402
import gates  # noqa: E402

TEN = REALFACE / "pass_definitions-10000"
FIFTY = REALFACE / "pass_definitions-50000"
NAMES = sorted(path.stem for path in TEN.glob("*.json"))


def test_folders_hold_the_same_definitions() -> None:
    assert sorted(path.stem for path in FIFTY.glob("*.json")) == NAMES
    assert not (FIFTY / "previous").exists() or not list((FIFTY / "previous").glob("*.json"))


@pytest.mark.parametrize("name", NAMES)
def test_only_the_face_set_differs(name: str) -> None:
    ten = json.loads((TEN / f"{name}.json").read_text(encoding="utf-8"))
    fifty = json.loads((FIFTY / f"{name}.json").read_text(encoding="utf-8"))
    face_set = fifty.pop("face_set")
    original = ten.pop("face_set")
    assert fifty == ten
    if original["number_of_faces"] == 0:
        assert face_set == original
        return
    shards = face_set["shards"]
    assert face_set["id"] == "frozen-50000"
    assert face_set["manifest_policy"] == original["manifest_policy"]
    assert shards == {"ids": list(range(10)), "faces_per_shard": 5000}
    assert len(shards["ids"]) * shards["faces_per_shard"] == face_set["number_of_faces"] == 50000
    loaded = definitions.load_definition(name, FIFTY)
    assert loaded.expected_faces == 50000


def test_cli_validator_accepts_the_folder() -> None:
    command = [sys.executable, str(REALFACE / "run_realface.py"), "--validate-definitions",
               "--definitions", str(FIFTY)]
    done = subprocess.run(command, capture_output=True, text=True, timeout=120)
    assert done.returncode == 0, done.stderr
    assert "Criteria validation only." in done.stdout


def test_shard_scope_accepts_exactly_ten_shards_of_five_thousand() -> None:
    definition = definitions.load_definition("regions", FIFTY)
    counts = {str(i): 5000 for i in range(10)}
    complete = {"shards": list(range(10)), "shard_counts": counts}
    assert gates._shard_scope(definition, complete) == []
    short = {"shards": list(range(9)), "shard_counts": {str(i): 5000 for i in range(9)}}
    assert gates._shard_scope(definition, short)
    uneven = {"shards": list(range(10)), "shard_counts": {**counts, "3": 4999}}
    assert gates._shard_scope(definition, uneven)
