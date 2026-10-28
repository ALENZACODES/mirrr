"""Per-source scans: threaded hashing, plans from scans, Kaggle scan kernels.

Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.facescale import cli
from lab.facescale import kaggle_gen as KG
from lab.facescale import scanfile as SF
from lab.facescale.loaders import loader_for
from lab.facescale.registry import load_local
from lab.facescale.shards import build_plan, scan, write_members
from lab.facescale.synthetic import all_layouts, sources_file


@pytest.fixture()
def local(tmp_path: Path) -> dict[str, object]:
    return dict(load_local(sources_file(tmp_path / "s.json", all_layouts(tmp_path / "sets"))))


def test_threaded_scan_matches_the_plain_scan(local: dict[str, object], tmp_path: Path) -> None:
    from lab.facescale.registry import LocalSource

    entries = [e for e in local.values() if isinstance(e, LocalSource)]
    for entry in entries:
        threaded = list(SF.scan_members(loader_for(entry), threads=3))
        plain = list(scan([loader_for(entry)]))
        assert threaded == plain
    with pytest.raises(SF.ScanError):
        list(SF.scan_members(loader_for(entries[0]), threads=0))


def test_plan_from_scans_equals_plan_from_sources(local: dict[str, object],
                                                  tmp_path: Path) -> None:
    from lab.facescale.registry import LocalSource

    entries = [e for e in local.values() if isinstance(e, LocalSource)]
    for entry in entries:
        summary = SF.write_scan(tmp_path / "scans", loader_for(entry), threads=2)
        assert summary["format"] == SF.SCAN_FORMAT
    direct = build_plan(scan([loader_for(e) for e in entries]), shard_size=10)
    from_scans = build_plan(SF.members_from_scans([tmp_path / "scans"]), shard_size=10)
    assert from_scans.plan_hash == direct.plan_hash


def test_damaged_or_mixed_scans_are_refused(local: dict[str, object], tmp_path: Path) -> None:
    from lab.facescale.registry import LocalSource

    entry = local["S04"]
    assert isinstance(entry, LocalSource)
    SF.write_scan(tmp_path, loader_for(entry))
    data, meta = SF.scan_paths(tmp_path, "S04")
    _, members = SF.read_scan(meta)
    write_members(data, members[:-1])
    with pytest.raises(SF.ScanError, match="does not match"):
        SF.read_scan(meta)
    (tmp_path / "x.json").write_text('{"format": "other"}')
    with pytest.raises(SF.ScanError, match="not a"):
        SF.read_scan(tmp_path / "x.json")
    (tmp_path / "empty").mkdir()
    with pytest.raises(SF.ScanError, match="no scan"):
        SF.scans_in([tmp_path / "empty"])
    with pytest.raises(SF.ScanError, match="does not exist"):
        SF.scans_in([tmp_path / "missing"])


def test_duplicate_scan_for_one_source_is_refused(local: dict[str, object],
                                                  tmp_path: Path) -> None:
    from lab.facescale.registry import LocalSource

    entry = local["S08"]
    assert isinstance(entry, LocalSource)
    SF.write_scan(tmp_path / "a", loader_for(entry))
    SF.write_scan(tmp_path / "b", loader_for(entry))
    with pytest.raises(SF.ScanError, match="two scans"):
        list(SF.members_from_scans([tmp_path / "a", tmp_path / "b"]))


def test_cli_scan_then_plan(tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
                            capsys: pytest.CaptureFixture[str]) -> None:
    monkeypatch.chdir(tmp_path)
    sources = sources_file(tmp_path / "sources.local.json", all_layouts(tmp_path / "sets"))
    for sid in ("S04", "S08"):
        assert cli.main(["scan", "--sources", str(sources), "--source", sid,
                         "--out", str(tmp_path / "scans"), "--threads", "2"]) == 0
    assert "scan S08: 3 items" in capsys.readouterr().out
    assert cli.main(["plan", "--scans", str(tmp_path / "scans"), "--out", str(tmp_path / "p"),
                     "--guard-dir", str(tmp_path / "g")]) == 0
    assert "5 items in 1 shards" in capsys.readouterr().out
    assert cli.main(["plan", "--out", str(tmp_path / "q")]) == 2
    assert cli.main(["scan", "--sources", str(sources), "--source", "S10",
                     "--out", str(tmp_path / "scans")]) == 2


def test_scan_kernels_are_private_and_offline(tmp_path: Path) -> None:
    entries = {"S06": {"name": "six", "kaggle_slug": "box-owner/set-six", "enabled": True}}
    local = load_local(sources_file(tmp_path / "s.json", entries), kaggle=True,
                       check_roots=False)
    options = KG.KaggleOptions("box-owner", "box-owner/code", "box-owner/plan")
    (folder,) = KG.write_scan_kernels(tmp_path / "k", local, options, ["S06"])
    meta = json.loads((folder / "kernel-metadata.json").read_text())
    assert meta["id"] == "box-owner/beljour-facescale-scan-s06"
    assert meta["is_private"] is True and meta["enable_internet"] is False
    assert meta["dataset_sources"] == ["box-owner/code", "box-owner/set-six"]
    script = (folder / "run_kernel.py").read_text()
    assert '"scan", "--sources", "@SOURCES", "--kaggle", "--source", "S06"' in script
    assert KG.network_tokens(script) == []


def test_cli_writes_scan_kernels_without_a_plan(tmp_path: Path,
                                                monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.chdir(tmp_path)
    sources = sources_file(tmp_path / "s.json",
                           {"S06": {"kaggle_slug": "box-owner/set-six", "enabled": True}})
    args = ["kaggle-gen", "--sources", str(sources), "--out", str(tmp_path / "k"),
            "--owner", "box-owner", "--code-slug", "box-owner/code",
            "--plan-slug", "box-owner/plan"]
    assert cli.main([*args, "--scan-sources", "S06"]) == 0
    assert cli.main(args) == 2
