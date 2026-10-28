"""arena.py registry --table: --check never writes, and the W section shows the reviewed statuses.

Pass definition: on a copy of docs/FEATURES.md with one W row changed, `registry --check
--table` exits 1, names the file and leaves its bytes unchanged; without --check the same
command writes back exactly the committed doc, whose W1-W100 section is the reviewed view
built from women-100-features.json (not the historical view kept in features.json).
Author: John Khan.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from plumb_api.arena import registry, women

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT / "docs" / "FEATURES.md"
ARENA = ROOT / "api" / "scripts" / "arena.py"


def run(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run([sys.executable, str(ARENA), "registry", *args], capture_output=True, text=True, cwd=ROOT)


def test_check_reports_a_stale_table_and_writes_nothing(tmp_path: Path) -> None:
    stale = tmp_path / "FEATURES.md"
    text = DOC.read_text(encoding="utf-8")
    changed = text.replace("| W5 | Palette For An Outfit | Makeup | built |",
                           "| W5 | Palette For An Outfit | Makeup | planned |", 1)
    assert changed != text
    stale.write_text(changed, encoding="utf-8")
    before = stale.read_bytes()
    out = run("--check", "--table", str(stale))
    assert out.returncode == 1, out.stdout + out.stderr
    assert f"{stale} is out of date" in out.stdout
    assert stale.read_bytes() == before


def test_check_passes_on_the_committed_doc_without_touching_it() -> None:
    before = DOC.read_bytes()
    out = run("--check", "--table", str(DOC))
    assert out.returncode == 0, out.stdout + out.stderr
    assert "nothing written" in out.stdout
    assert DOC.read_bytes() == before


def test_writing_reproduces_the_doc_with_reviewed_w_statuses(tmp_path: Path) -> None:
    target = tmp_path / "FEATURES.md"
    out = run("--table", str(target))
    assert out.returncode == 0, out.stdout + out.stderr
    assert target.read_bytes() == DOC.read_bytes()
    reviewed = women.block()["rows"]
    historical = registry.women_rows()
    section = target.read_text(encoding="utf-8").split("## W1-W100 (women-first list)\n\n", 1)[1]
    assert women.checklist(reviewed) in section
    built = {r["id"] for r in reviewed if r["status"] == "built"}
    assert built == {f["id"] for f in women.load_source()["features"] if f["status"] == "built"}
    # The historical view in features.json claims fewer rows; it must not leak into the doc.
    assert {r["id"] for r in historical if r["status"] == "built"} < built
    assert women.checklist(historical) not in section
