"""Admission command line: table, JSON output and exit codes.

Candidate files are written to tmp_path with invented model and data names.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import io
import json
import subprocess
import sys
from pathlib import Path

from lab.ml.identity.cli import main, render_table, table_rows

REPO = Path(__file__).resolve().parents[3]
GOOD = {
    "model_name": "tidepool-embed",
    "version": "2.1",
    "licence_id": "MIT",
    "commercial_use": True,
    "weights_sha256": hashlib.sha256(b"w").hexdigest(),
    "provenance": [{"name": "rendered-heads", "kind": "generator", "licence_id": "MIT",
                    "commercial_use": True}],
}
BAD = {"model_name": "mystery-net", "version": "0", "licence_id": "CC-BY-NC-4.0"}


def write(tmp_path: Path, payload: object) -> Path:
    path = tmp_path / "candidates.json"
    path.write_text(json.dumps(payload), encoding="utf-8")
    return path


def test_all_admitted_exits_zero(tmp_path: Path) -> None:
    out = io.StringIO()
    assert main(["admit", str(write(tmp_path, [GOOD]))], out) == 0
    text = out.getvalue()
    assert "tidepool-embed" in text and "ADMITTED" in text
    assert "1 of 1 candidates admitted" in text


def test_any_refused_exits_one_and_lists_reasons(tmp_path: Path) -> None:
    out = io.StringIO()
    assert main(["admit", str(write(tmp_path, [GOOD, BAD, 7]))], out) == 1
    text = out.getvalue()
    assert "mystery-net" in text and "REFUSED" in text
    assert "not on the commercial allowlist" in text
    assert "candidate[2]" in text
    assert "1 of 3 candidates admitted" in text


def test_json_output(tmp_path: Path) -> None:
    out = io.StringIO()
    main(["admit", "--json", str(write(tmp_path, [BAD]))], out)
    payload = json.loads(out.getvalue())
    assert payload[0]["verdict"] == "REFUSED"
    assert payload[0]["reasons"]


def test_unreadable_files_exit_two(tmp_path: Path) -> None:
    out = io.StringIO()
    assert main(["admit", str(tmp_path / "missing.json")], out) == 2
    broken = tmp_path / "broken.json"
    broken.write_text("{", encoding="utf-8")
    assert main(["admit", str(broken)], out) == 2
    assert "cannot read candidates" in out.getvalue()


def test_empty_list_is_not_a_pass(tmp_path: Path) -> None:
    assert main(["admit", str(write(tmp_path, []))], io.StringIO()) == 1


def test_table_helpers() -> None:
    rows = table_rows(json.dumps([GOOD]))
    assert rows[0][:3] == ("tidepool-embed", "2.1", "ADMITTED")
    assert render_table(rows).splitlines()[0].startswith("model")


def test_module_entry_point_runs(tmp_path: Path) -> None:
    path = write(tmp_path, [BAD])
    done = subprocess.run([sys.executable, "-m", "lab.ml.identity", "admit", str(path)],
                          cwd=REPO, capture_output=True, text=True, check=False)
    assert done.returncode == 1
    assert "REFUSED" in done.stdout
