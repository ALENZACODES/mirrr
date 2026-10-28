"""Local operator CLI for the Tuesday five-command and tier evidence pack.

This command never reads photos, credentials, embeddings or model binaries.
An empty template is a checklist, not a measurement or release decision.
Author: John Khan.
"""

from __future__ import annotations

import argparse
from collections.abc import Sequence
from pathlib import Path

from .errors import CommandValidationError
from .lock_bundle import prepare_tuesday_lock_bundle, write_tuesday_lock_bundle
from .quality_tier_matrix import build_tier_matrix
from .tuesday_lock import build_tuesday_lock_packet


def _read_packet(path: Path, *, maximum: int) -> str:
    if path.is_symlink() or not path.is_file() or path.suffix != ".json":
        raise CommandValidationError("invalid_lock_input", "An ordinary JSON evidence file is required.")
    size = path.stat().st_size
    if size < 1 or size > maximum:
        raise CommandValidationError("invalid_lock_input", "The evidence file is empty or too large.")
    return path.read_text(encoding="utf-8").rstrip("\n")


def make_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Prepare the photo-free BELJOUR Tuesday lock evidence dossier.",
    )
    parser.add_argument("--commands", type=Path)
    parser.add_argument("--tiers", type=Path)
    parser.add_argument("--studio-pose-annex", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--template", action="store_true")
    parser.add_argument("--run-id")
    parser.add_argument("--renderer-build")
    return parser


def run(args: Sequence[str] | None = None) -> int:
    options = make_parser().parse_args(args)
    try:
        if options.template:
            if (
                options.commands is not None or options.tiers is not None
                or options.studio_pose_annex is not None
                or options.run_id is None or options.renderer_build is None
            ):
                raise CommandValidationError(
                    "invalid_lock_input", "A template requires run and build only.",
                )
            command_json = build_tuesday_lock_packet(
                (), run_id=options.run_id, renderer_build=options.renderer_build,
            ).to_json()
            tier_json = build_tier_matrix(
                (), original_tuesday_json=command_json,
                run_id=options.run_id, renderer_build=options.renderer_build,
            )
            studio_pose_json = None
        else:
            if (
                options.commands is None or options.tiers is None
                or options.run_id is not None or options.renderer_build is not None
            ):
                raise CommandValidationError(
                    "invalid_lock_input", "Provide both checked packet filenames.",
                )
            command_json = _read_packet(options.commands, maximum=250_000)
            tier_json = _read_packet(options.tiers, maximum=120_000)
            studio_pose_json = (
                None if options.studio_pose_annex is None
                else _read_packet(options.studio_pose_annex, maximum=80_000)
            )
        bundle = prepare_tuesday_lock_bundle(
            command_json, tier_json, studio_pose_json=studio_pose_json,
        )
        output = write_tuesday_lock_bundle(bundle, options.output)
        report = bundle.validate()
    except (CommandValidationError, OSError, UnicodeError) as exc:
        code = exc.code if isinstance(exc, CommandValidationError) else "lock_io_error"
        print(f"Lock evidence not exported: {code}")
        return 2
    print(f"Created BELJOUR lock dossier: {output.name}")
    print(
        f"Technical status: {report.status}; observed {report.observed}/287; "
        f"device-measured {report.device_measured}/287; release: NOT APPROVED"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(run())
