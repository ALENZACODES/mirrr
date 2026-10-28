"""Local Tuesday lock CLI, including honest empty and incomplete templates.

Source fixtures contain no face data. Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from plumb_api.commands.lock_bundle import verify_written_bundle
from plumb_api.commands.lock_pack_cli import run
from tests.commands.test_joint_lock_readiness_r14h import BUILD, RUN, packets


def test_cli_empty_template_contains_all_unmeasured_rows(tmp_path: Path) -> None:
    assert run([
        "--template", "--run-id", RUN, "--renderer-build", BUILD,
        "--output", str(tmp_path),
    ]) == 0
    folder = tmp_path / f"{RUN}-{BUILD}-lock"
    report = verify_written_bundle(folder)
    assert report.observed == 0
    assert len(report.gaps) == 287
    assert report.status == "incomplete"
    assert report.public_metadata()["release_qualified"] is False


def test_cli_existing_verified_packets(tmp_path: Path) -> None:
    commands, tiers = packets()
    inputs = tmp_path / "inputs"
    inputs.mkdir()
    (inputs / "commands.json").write_text(commands, encoding="utf-8")
    (inputs / "tiers.json").write_text(tiers, encoding="utf-8")
    target = tmp_path / "dossier"
    target.mkdir()
    assert run([
        "--commands", str(inputs / "commands.json"),
        "--tiers", str(inputs / "tiers.json"),
        "--output", str(target),
    ]) == 0
    assert verify_written_bundle(target / f"{RUN}-{BUILD}-lock").status == "incomplete"


def test_cli_refuses_overwrite(tmp_path: Path) -> None:
    args = [
        "--template", "--run-id", RUN, "--renderer-build", BUILD,
        "--output", str(tmp_path),
    ]
    assert run(args) == 0
    assert run(args) == 2


@pytest.mark.parametrize("bad", [
    ("--template", "--run-id", "invalid/id", "--renderer-build", BUILD),
    ("--template", "--run-id", RUN, "--renderer-build", "invalid/build"),
    ("--template", "--run-id", RUN, "--renderer-build", BUILD, "--commands", "other"),
    ("--run-id", RUN, "--renderer-build", BUILD),
])
def test_cli_invalid_sources_do_not_export(bad: tuple[str, ...], tmp_path: Path) -> None:
    assert run([*bad, "--output", str(tmp_path)]) == 2
    assert not list(tmp_path.iterdir())


def test_cli_corrupted_packets_refused(tmp_path: Path) -> None:
    inputs = tmp_path / "inputs"
    inputs.mkdir()
    (inputs / "commands.json").write_text("{}", encoding="utf-8")
    (inputs / "tiers.json").write_text("{}", encoding="utf-8")
    assert run([
        "--commands", str(inputs / "commands.json"),
        "--tiers", str(inputs / "tiers.json"),
        "--output", str(tmp_path),
    ]) == 2
    assert not list(tmp_path.glob("*-lock"))


def test_cli_refuses_binary_or_too_large_inputs(tmp_path: Path) -> None:
    commands = tmp_path / "commands.json"
    tiers = tmp_path / "tiers.json"
    commands.write_text("x" * 250_001, encoding="utf-8")
    tiers.write_text("{}", encoding="utf-8")
    assert run([
        "--commands", str(commands), "--tiers", str(tiers),
        "--output", str(tmp_path),
    ]) == 2
    assert not list(tmp_path.glob("*-lock"))


def test_cli_refuses_packet_symlink(tmp_path: Path) -> None:
    commands, tiers = packets()
    original = tmp_path / "original.json"
    original.write_text(commands, encoding="utf-8")
    link = tmp_path / "commands.json"
    link.symlink_to(original)
    second = tmp_path / "tiers.json"
    second.write_text(tiers, encoding="utf-8")
    assert run([
        "--commands", str(link), "--tiers", str(second),
        "--output", str(tmp_path),
    ]) == 2
    assert not list(tmp_path.glob("*-lock"))
