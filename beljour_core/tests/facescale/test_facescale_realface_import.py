"""Importing a realface JSONL stream into a facescale shard result.

The stream is written here in the realface format with drawn-free rows.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from lab.facescale import cli
from lab.facescale import realface_import as RI
from lab.facescale import schema as SC
from lab.facescale.merge import THRESHOLD_FORMAT
from lab.facescale.metrics import FACE_CHECK
from lab.facescale.results import cells_of
from lab.facescale.resume import read_json, shard_name


def _face(face_id: str, ok: bool) -> list[dict[str, Any]]:
    base = {"face_id": face_id, "run_id": "rf-1", "source": "S01", "group": "a/male/20-29"}
    return [{**base, "module": "landmarks", "check": "detect", "pass": True, "seconds": 0.1},
            {**base, "module": "gender", "check": "identity", "pass": ok, "seconds": 0.5,
             "reason_code": "" if ok else "identity_drift"},
            {**base, "module": "regions", "check": "refused", "pass": False,
             "reason_code": "mesh_flat"}]


def _stream(path: Path, faces: int, *, torn: bool = False, bad: bool = False) -> Path:
    lines = [json.dumps({"record_type": "run", "run_id": "rf-1", "format": RI.REALFACE_FORMAT})]
    for n in range(faces):
        rows = _face(f"face{n}", n % 3 != 0)
        lines += [json.dumps(r, sort_keys=True) for r in rows]
        digest = "0" * 64 if bad and n == 0 else RI.row_digest(rows)
        lines.append(json.dumps({"record_type": "face_complete", "face_id": f"face{n}",
                                 "rows_sha256": digest}))
    if torn:
        lines.append('{"face_id": "face99", "modu')
    path.write_text("\n".join(lines) + "\n")
    return path


def test_complete_faces_become_one_shard(tmp_path: Path) -> None:
    stream = RI.read_stream(_stream(tmp_path / "run.jsonl", 9))
    assert len(stream.faces) == 9 and not stream.torn_tail and stream.bad_checksums == 0
    body = RI.to_result(stream, side=640, tier="full", modules=("landmarks", "gender"))
    assert body["complete"] is True and body["items"] == 9
    cells = cells_of(body)
    gender = cells[("gender", FACE_CHECK, "S01", "a/male/20-29")]
    assert gender.counts.tolist() == [6, 3, 0, 0]
    regions = cells[("regions", FACE_CHECK, "S01", "a/male/20-29")]
    assert regions.counts.tolist() == [0, 0, 9, 0]
    assert SC.validate(body, SC.load_schema()) == []


def test_torn_tail_and_bad_checksums_are_left_out(tmp_path: Path) -> None:
    before = _stream(tmp_path / "run.jsonl", 4, torn=True, bad=True).read_text()
    stream = RI.read_stream(tmp_path / "run.jsonl")
    assert stream.torn_tail is True and stream.bad_checksums == 1
    assert len(stream.faces) == 3
    assert (tmp_path / "run.jsonl").read_text() == before
    body = RI.to_result(stream, side=640, tier="full", modules=("gender",))
    assert body["complete"] is False and body["import"]["bad_checksums"] == 1


@pytest.mark.parametrize("text", ["", '{"format": "other"}\n', "not json\n",
                                  '{"format": "beljour-realface-run/1"}\nbad\n{}\n'])
def test_not_a_stream_is_refused(tmp_path: Path, text: str) -> None:
    (tmp_path / "x.jsonl").write_text(text)
    with pytest.raises(RI.StreamError):
        RI.read_stream(tmp_path / "x.jsonl")


def test_cli_import_then_merge(tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
                               capsys: pytest.CaptureFixture[str]) -> None:
    monkeypatch.chdir(tmp_path)
    _stream(tmp_path / "run.jsonl", 30)
    assert cli.main(["import-realface", "--stream", str(tmp_path / "run.jsonl"),
                     "--out", str(tmp_path / "imported")]) == 0
    assert "30 complete faces from run rf-1" in capsys.readouterr().out
    assert read_json(tmp_path / "imported" / shard_name(0))["tier"] == "full"
    (tmp_path / "t.json").write_text(json.dumps({"format": THRESHOLD_FORMAT, "modules": {},
                                                 "default": 0.5}))
    assert cli.main(["merge", "--results", str(tmp_path / "imported"), "--thresholds",
                     str(tmp_path / "t.json"), "--out-json", str(tmp_path / "m.json")]) == 0
    modules = {r["module"]: r for r in read_json(tmp_path / "m.json")["modules"]}
    assert modules["gender"]["n"] == 30 and modules["gender"]["passed"] == 20
