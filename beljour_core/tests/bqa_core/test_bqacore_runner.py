"""Runner isolation (MOD-03): fake packages in tmp_path that crash, hang or return bad rows.

A healthy package's results file must be byte-for-byte the same whether or not
its neighbours fail.
Author: John Khan.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from pathlib import Path

import pytest

from lab.bqa_core import runner
from lab.bqa_core.paths import REPO_ROOT, InsideRepoError
from lab.bqa_core.registry import load_registry
from lab.bqa_core.runner import discover_packages, known_packages, run_all

GOOD = '''
from lab.bqa_core.registry import load_registry
from lab.bqa_core.results import make_row


def run_checks(context):
    reg = load_registry()
    return [make_row(context, check, "UNPROVEN", n=3, note="Synthetic fake package.")
            for check in reg.by_owner("C21")]
'''
CRASH = "def run_checks(context):\n    raise RuntimeError('boom')\n"
HANG = "import time\n\n\ndef run_checks(context):\n    time.sleep(60)\n    return []\n"
EXIT = "import os\n\n\ndef run_checks(context):\n    print('noise')\n    os._exit(3)\n"
BAD = '''
from lab.bqa_core.registry import load_registry
from lab.bqa_core.results import make_row


def run_checks(context):
    reg = load_registry()
    rows = [make_row(context, check, "PASS", n=50) for check in reg.by_owner("C23")]
    rows[0]["status"] = "GREEN"
    rows[1]["check_key"] = "FND-01"
    rows.pop()
    return rows
'''
OWNERS = {"bqa_good": "C21", "bqa_crash": "C18", "bqa_hang": "C19", "bqa_exit": "C20",
          "bqa_bad": "C23"}


def fake_root(tmp_path: Path) -> Path:
    root = tmp_path / "fakes"
    for name, body in (("bqa_good", GOOD), ("bqa_crash", CRASH), ("bqa_hang", HANG),
                       ("bqa_exit", EXIT), ("bqa_bad", BAD)):
        folder = root / "lab" / name
        folder.mkdir(parents=True)
        (folder / "__init__.py").write_text('"""Fake package for runner tests."""\n')
        (folder / "checks.py").write_text(body)
    (root / "lab" / "bqa_nochecks").mkdir()
    (root / "lab" / "bqa_nochecks" / "__init__.py").write_text("")
    return root


def test_discovery_finds_checks_modules_only(tmp_path: Path) -> None:
    root = fake_root(tmp_path)
    assert discover_packages([root]) == ["bqa_bad", "bqa_crash", "bqa_exit", "bqa_good",
                                         "bqa_hang"]
    assert discover_packages([REPO_ROOT])[-1] == "bqa_core"


def test_crashing_neighbours_do_not_change_good_rows(tmp_path: Path,
                                                     context: dict[str, object]) -> None:
    """MOD-03: crash, hang, hard exit and bad rows stay inside their own package."""
    root = fake_root(tmp_path)
    alone = run_all(dict(context, run_id="R-alone"), search_roots=[root], owners=OWNERS,
                    packages=["bqa_good"], include_missing=False)
    mixed = run_all(dict(context, run_id="R-mixed"), search_roots=[root], owners=OWNERS,
                    timeout_s=4.0, include_missing=False)
    good_alone = (alone.run_dir / "results" / "bqa_good.jsonl").read_bytes()
    good_mixed = (mixed.run_dir / "results" / "bqa_good.jsonl").read_bytes()
    assert good_alone.replace(b"R-alone", b"R-mixed") == good_mixed
    outcomes = {p["name"]: p["outcome"] for p in mixed.run["packages"]}
    assert outcomes == {"bqa_bad": "bad_rows", "bqa_crash": "crashed", "bqa_exit": "crashed",
                        "bqa_good": "ok", "bqa_hang": "timeout"}
    by_package = {p.name: p for p in mixed.packages}
    reg = load_registry()
    crash_rows = by_package["bqa_crash"].rows
    assert len(crash_rows) == len(reg.by_owner("C18"))
    assert {row["status"] for row in crash_rows} == {"ERROR"}
    assert crash_rows[0]["reason_codes"] == ["exception:RuntimeError", "runner:crashed"]
    assert by_package["bqa_hang"].rows[0]["reason_codes"] == ["runner:timeout"]
    bad = {row["check_key"]: row for row in by_package["bqa_bad"].rows}
    keys = [check.key for check in reg.by_owner("C23")]
    assert bad[keys[0]]["reason_codes"] == ["runner:invalid_row"]
    assert bad[keys[1]]["reason_codes"] == ["runner:no_row"]
    assert bad[keys[2]]["status"] == "PASS"
    assert bad[keys[-1]]["reason_codes"] == ["runner:no_row"]
    assert "FND-01" not in bad


def test_run_folder_layout_and_missing_packages(tmp_path: Path,
                                                context: dict[str, object]) -> None:
    root = fake_root(tmp_path)
    outcome = run_all(context, search_roots=[root], packages=["bqa_good"],
                      owners={"bqa_good": "C21", "bqa_absent": "C24"})
    run = json.loads((outcome.run_dir / "run.json").read_text())
    assert run["format"] == "beljour-bqa-run/1"
    assert [p["name"] for p in run["packages"]] == ["bqa_good", "bqa_absent"]
    absent = (outcome.run_dir / "results" / "bqa_absent.jsonl").read_text().splitlines()
    assert len(absent) == len(load_registry().by_owner("C24"))
    assert all('"NOT_APPLICABLE"' in line for line in absent)
    with pytest.raises(FileExistsError):
        run_all(context, search_roots=[root], packages=["bqa_good"], owners=OWNERS)


def test_work_dir_inside_repo_and_bad_run_id_refused(context: dict[str, object]) -> None:
    with pytest.raises(InsideRepoError):
        run_all(dict(context, work_dir=str(REPO_ROOT / "tmp-run")), packages=[])
    with pytest.raises(ValueError, match="run_id"):
        run_all(dict(context, run_id="../escape"), packages=[])
    with pytest.raises(ValueError, match="work_dir"):
        run_all({"run_id": "R-1"}, packages=[])


def test_package_table_schema() -> None:
    """data/packages.json: every package is lab.bqa_* and owned by a known C17-C24 task."""
    table = known_packages()
    assert len(table) == 8
    assert all(name.startswith("bqa_") for name in table)
    assert sorted(table.values()) == [f"C{n}" for n in range(17, 25)]
    assert table["bqa_core"] == "C17"


def test_rows_that_are_not_json_become_errors(tmp_path: Path,
                                              context: dict[str, object]) -> None:
    root = tmp_path / "nan"
    folder = root / "lab" / "bqa_nan"
    folder.mkdir(parents=True)
    (folder / "__init__.py").write_text("")
    (folder / "checks.py").write_text("def run_checks(context):\n"
                                      "    return [{'n': float('nan')}]\n")
    outcome = run_all(context, search_roots=[root], owners={"bqa_nan": "C24"},
                      include_missing=False)
    package = outcome.packages[0]
    assert package.outcome == "crashed"
    assert package.rows[0]["reason_codes"] == ["exception:ValueError", "runner:crashed"]


PID_HANG = '''import os
import time


def run_checks(context):
    with open(os.path.join(context["work_dir"], "worker.pid"), "w") as handle:
        handle.write(str(os.getpid()))
    time.sleep(120)
    return []
'''


def _alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    return Path(f"/proc/{pid}/stat").is_file() and " Z " not in Path(
        f"/proc/{pid}/stat").read_text(encoding="utf-8")[:64]


def _pid_hang_root(tmp_path: Path) -> Path:
    root = tmp_path / "pidroot"
    folder = root / "lab" / "bqa_pidhang"
    folder.mkdir(parents=True)
    (folder / "__init__.py").write_text('"""Fake package for worker lifetime tests."""\n')
    (folder / "checks.py").write_text(PID_HANG)
    return root


def _wait_for(path: Path, seconds: float) -> None:
    deadline = time.monotonic() + seconds
    while not path.is_file() or not path.read_text(encoding="utf-8"):
        assert time.monotonic() < deadline, "worker never started"
        time.sleep(0.05)


@pytest.mark.skipif(sys.platform == "win32", reason="POSIX process groups")
def test_timed_out_worker_is_killed(tmp_path: Path) -> None:
    work = tmp_path / "work"
    work.mkdir()
    started = time.monotonic()
    outcome, payload = runner._call_package(
        "bqa_pidhang", {"run_id": "R-1", "work_dir": str(work)}, [_pid_hang_root(tmp_path)],
        work, 3.0)
    assert (outcome, payload) == ("timeout", "runner:timeout")
    assert time.monotonic() - started < 30
    pid = int((work / "worker.pid").read_text(encoding="utf-8"))
    assert not _alive(pid)


@pytest.mark.skipif(sys.platform == "win32", reason="POSIX process groups")
def test_worker_never_outlives_its_parent(tmp_path: Path) -> None:
    """Kill the runner process outright: its worker must exit on its own within seconds."""
    work = tmp_path / "work"
    work.mkdir()
    root = _pid_hang_root(tmp_path)
    context = {"run_id": "R-1", "work_dir": str(work)}
    script = ("from pathlib import Path; from lab.bqa_core import runner; "
              f"runner._call_package('bqa_pidhang', {context!r}, "
              f"[Path({str(root)!r})], Path({str(work)!r}), 600.0)")
    env = dict(os.environ)
    env["PYTHONPATH"] = os.pathsep.join([str(REPO_ROOT), str(REPO_ROOT / "api")])
    parent = subprocess.Popen([sys.executable, "-c", script], env=env, cwd=tmp_path)
    try:
        _wait_for(work / "worker.pid", 60)
        pid = int((work / "worker.pid").read_text(encoding="utf-8"))
        assert _alive(pid)
    finally:
        parent.kill()
        parent.wait(timeout=10)
    deadline = time.monotonic() + 10
    while _alive(pid) and time.monotonic() < deadline:
        time.sleep(0.1)
    assert not _alive(pid)
