"""Command line: python -m plumb_api.data_factory <command>.

Commands:
  intake      convert a contributor CSV into intake JSONL
  run         build a set from a config (resumable by stage)
  status      show which stages of a config's work folder are done
  verify      check a data lock against its manifest (and config)
  leak-check  check a manifest against frozen test-set locks
  diff        list records added, removed or changed between two manifests
  takedown    remove images by content hash from published sets
  datacard    write the data card of a locked set
  provenance  write the provenance register of a locked set
  shards      write per-shard file lists for loaders (and check them)
  perf        measure the metadata stages on synthetic records
  example     write a starter config next to an intake file

Exit codes: 0 success, 1 a check failed, 2 bad input or config.
Author: John Khan.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Callable, Sequence
from dataclasses import replace
from pathlib import Path
from typing import TextIO

from .config import CONFIG_SCHEMA, ConfigError, load_config
from .datacard import write_card
from .holdout import HoldoutError, HoldoutGuard
from .intake_csv import IntakeError, batch_defaults, convert_csv
from .integrity import diff_manifests, verify_exports
from .licence import PolicyError
from .lockfile import verify_lock
from .manifest import ManifestError
from .perf import perf_report, render_perf
from .pipeline import WORK_STAGES, Pipeline
from .provenance_register import load_reviews, needs_review, register_rows, write_register
from .report import build_report, write_report
from .shard_lists import verify_shard_lists, write_shard_lists
from .stages import StageError
from .takedown import (
    REASONS,
    TakedownError,
    TakedownRegistry,
    TakedownRequest,
    apply_takedown,
)

EXIT_OK = 0
EXIT_FAILED = 1
EXIT_USAGE = 2


def _yes_no(value: str | None) -> bool | None:
    return None if value is None else value == "yes"


def _intake(args: argparse.Namespace, out: TextIO) -> int:
    defaults = batch_defaults(source=args.source, licence=args.licence,
                              attribution=args.attribution,
                              commercial_use=_yes_no(args.commercial_use),
                              consent=_yes_no(args.consent))
    result = convert_csv(Path(args.csv), Path(args.out), defaults=defaults,
                         ignore_columns=args.ignore or ())
    for line, problem in result.problems:
        out.write(f"line {line}: {problem}\n")
    out.write(f"wrote {result.written} row(s), {len(result.problems)} problem(s)\n")
    return EXIT_OK if result.clean else EXIT_FAILED


def _run(args: argparse.Namespace, out: TextIO) -> int:
    config = load_config(Path(args.config))
    if args.workers is not None:
        config = replace(config, workers=int(args.workers))
    pipeline = Pipeline(config, fresh=args.fresh, from_stage=args.from_stage,
                        until=args.until, relock=args.relock)
    result = pipeline.run()
    report = build_report(result)
    json_path, md_path = write_report(report, config.output_dir)
    for stage in result.stages:
        rejected = sum(stage.reject_reasons.values())
        out.write(f"{stage.name:<12} {stage.status:<9} in {stage.count_in:>8} "
                  f"out {stage.count_out:>8} rejected {rejected:>7}\n")
    out.write(f"report: {json_path.name}, {md_path.name}\n")
    if result.lock_sha256 is not None and result.lock_path is not None:
        out.write(f"lock: {result.lock_path.name} {result.lock_status} {result.lock_sha256}\n")
    return EXIT_OK


def _status(args: argparse.Namespace, out: TextIO) -> int:
    pipeline = Pipeline(load_config(Path(args.config)))
    for name, state, kept in pipeline.status():
        line = f"{name:<12} {state:<8} {'' if kept is None else kept}"
        out.write(line.rstrip() + "\n")
    return EXIT_OK


def _verify(args: argparse.Namespace, out: TextIO) -> int:
    config_hash = None
    if args.config:
        config = load_config(Path(args.config))
        config_hash = config.filter_config_sha256(config.licence.build())
    problems = verify_lock(Path(args.lock),
                           manifest_path=Path(args.manifest) if args.manifest else None,
                           filter_config_sha256=config_hash,
                           require_tool_version=not args.any_tool_version)
    if not problems and args.images:
        problems = verify_exports(Path(args.lock))
    for problem in problems:
        out.write(f"FAIL {problem}\n")
    if problems:
        return EXIT_FAILED
    out.write("lock ok\n" if not args.images else "lock and images ok\n")
    return EXIT_OK


def _diff(args: argparse.Namespace, out: TextIO) -> int:
    result = diff_manifests(Path(args.before), Path(args.after))
    out.write(f"added {len(result.added)}, removed {len(result.removed)}, "
              f"changed {len(result.changed)}\n")
    for label, values in (("+", result.added), ("-", result.removed), ("~", result.changed)):
        for digest in values:
            out.write(f"{label} {digest}\n")
    return EXIT_OK


def _leak_check(args: argparse.Namespace, out: TextIO) -> int:
    guard = HoldoutGuard.from_paths([Path(value) for value in args.frozen])
    report = guard.check_manifest(Path(args.manifest))
    out.write(f"checked {report.checked} records against {report.frozen_hashes} frozen "
              f"hashes in {len(report.frozen_sets)} sets\n")
    for leak in report.leaks:
        out.write(f"LEAK {leak.content_sha256} in {', '.join(leak.frozen_sets)}\n")
    return EXIT_OK if report.clean else EXIT_FAILED


def _takedown(args: argparse.Namespace, out: TextIO) -> int:
    requests = [TakedownRequest(digest, args.reason, args.received, args.reference or "")
                for digest in args.hash]
    if args.registry:
        added = TakedownRegistry(Path(args.registry)).add(requests)
        out.write(f"registry: {added} new request(s)\n")
    for lock in args.lock:
        result = apply_takedown(Path(lock), requests)
        state = f"version {result.version}" if result.changed else "unchanged"
        out.write(f"{Path(lock).name}: removed {len(result.removed)} ({state})\n")
    return EXIT_OK


def _datacard(args: argparse.Namespace, out: TextIO) -> int:
    report = Path(args.report) if args.report else None
    md_path, json_path = write_card(Path(args.lock), Path(args.out), report)
    out.write(f"wrote {md_path.name}, {json_path.name}\n")
    return EXIT_OK


def _provenance(args: argparse.Namespace, out: TextIO) -> int:
    reviews = load_reviews(Path(args.reviews)) if args.reviews else None
    csv_path, json_path = write_register(Path(args.lock), Path(args.out), reviews)
    pending = needs_review(register_rows(Path(args.lock), reviews))
    out.write(f"wrote {csv_path.name}, {json_path.name}; {len(pending)} source(s) need review\n")
    return EXIT_OK


def _shards(args: argparse.Namespace, out: TextIO) -> int:
    index = write_shard_lists(Path(args.lock), Path(args.out))
    problems = verify_shard_lists(Path(args.lock), index)
    for problem in problems:
        out.write(f"FAIL {problem}\n")
    out.write(f"wrote {index.name}\n")
    return EXIT_FAILED if problems else EXIT_OK


def _perf(args: argparse.Namespace, out: TextIO) -> int:
    report = perf_report([int(count) for count in args.records])
    folder = Path(args.out)
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "perf.json").write_text(json.dumps(report, indent=1) + "\n", encoding="utf-8")
    (folder / "perf.md").write_text(render_perf(report), encoding="utf-8")
    for run in report["runs"]:
        out.write(f"{run['records']} records: {run['total_seconds']} s\n")
    return EXIT_OK


def starter_config(intake: str, image_root: str, set_name: str) -> dict[str, object]:
    """A complete config with every default written out."""
    return {
        "schema": CONFIG_SCHEMA,
        "set_name": set_name,
        "intake": intake,
        "image_root": image_root,
        "work_dir": "work",
        "output_dir": "out",
        "licence": {"extra_allowed": [], "require_consent": True,
                    "use_builtin_denylist": True},
        "strip_metadata": True,
        "export_images": True,
        "quality": {"min_score": 0.5},
        "near_dedup": {"phash_threshold": 10, "dhash_threshold": 14},
        "balance": None,
        "manifest": {"shards": 16, "gzip": False},
        "holdout": {"locks": [], "on_leak": "fail", "near": True},
        "workers": 1,
    }


def _example(args: argparse.Namespace, out: TextIO) -> int:
    target = Path(args.out)
    if target.exists():
        out.write(f"{target.name} exists; not overwritten\n")
        return EXIT_USAGE
    config = starter_config(args.intake, args.image_root, args.set_name)
    target.write_text(json.dumps(config, indent=1) + "\n", encoding="utf-8")
    out.write(f"wrote {target.name}\n")
    return EXIT_OK


def build_parser() -> argparse.ArgumentParser:
    """Argument parser for all commands."""
    parser = argparse.ArgumentParser(prog="python -m plumb_api.data_factory",
                                     description="Build licence-clean, locked image sets.")
    commands = parser.add_subparsers(dest="command", required=True)
    intake = commands.add_parser("intake", help="convert a CSV into intake JSONL")
    intake.add_argument("--csv", required=True)
    intake.add_argument("--out", required=True)
    intake.add_argument("--source")
    intake.add_argument("--licence")
    intake.add_argument("--attribution")
    intake.add_argument("--commercial-use", choices=("yes", "no"))
    intake.add_argument("--consent", choices=("yes", "no"))
    intake.add_argument("--ignore", nargs="+", help="CSV columns to ignore")
    run = commands.add_parser("run", help="build or resume a set")
    run.add_argument("--config", required=True)
    run.add_argument("--fresh", action="store_true", help="ignore saved stage state")
    run.add_argument("--from-stage", choices=WORK_STAGES, help="rerun from this stage")
    run.add_argument("--until", choices=WORK_STAGES, help="stop after this stage")
    run.add_argument("--relock", action="store_true", help="lock a changed set as a new version")
    run.add_argument("--workers", type=int, help="override the config worker count")
    status = commands.add_parser("status", help="show stage state of a work folder")
    status.add_argument("--config", required=True)
    verify = commands.add_parser("verify", help="check a lock and its manifest")
    verify.add_argument("--lock", required=True)
    verify.add_argument("--manifest")
    verify.add_argument("--config")
    verify.add_argument("--any-tool-version", action="store_true")
    verify.add_argument("--images", action="store_true", help="also check exported images")
    diff = commands.add_parser("diff", help="compare two manifests")
    diff.add_argument("--before", required=True)
    diff.add_argument("--after", required=True)
    leak = commands.add_parser("leak-check", help="check a manifest against frozen locks")
    leak.add_argument("--manifest", required=True)
    leak.add_argument("--frozen", required=True, nargs="+")
    takedown = commands.add_parser("takedown", help="remove images from published sets")
    takedown.add_argument("--lock", required=True, nargs="+")
    takedown.add_argument("--hash", required=True, nargs="+")
    takedown.add_argument("--reason", required=True, choices=REASONS)
    takedown.add_argument("--received", required=True, help="date as YYYY-MM-DD")
    takedown.add_argument("--reference", help="short ticket id")
    takedown.add_argument("--registry", help="takedown registry to append to")
    card = commands.add_parser("datacard", help="write the data card of a locked set")
    card.add_argument("--lock", required=True)
    card.add_argument("--report")
    card.add_argument("--out", required=True)
    register = commands.add_parser("provenance", help="write the provenance register")
    register.add_argument("--lock", required=True)
    register.add_argument("--reviews", help="CSV of reviewed evidence fields by source")
    register.add_argument("--out", required=True)
    shard_cmd = commands.add_parser("shards", help="write per-shard file lists")
    shard_cmd.add_argument("--lock", required=True)
    shard_cmd.add_argument("--out", required=True)
    perf = commands.add_parser("perf", help="measure stages on synthetic records")
    perf.add_argument("--records", nargs="+", type=int, default=[100_000])
    perf.add_argument("--out", required=True)
    example = commands.add_parser("example", help="write a starter config")
    example.add_argument("--out", required=True)
    example.add_argument("--intake", default="intake.jsonl")
    example.add_argument("--image-root", default="images")
    example.add_argument("--set-name", default="train-set")
    return parser


Handler = Callable[[argparse.Namespace, TextIO], int]
HANDLERS: dict[str, Handler] = {
    "intake": _intake, "run": _run, "status": _status, "verify": _verify, "leak-check": _leak_check,
    "diff": _diff, "takedown": _takedown, "datacard": _datacard,
    "provenance": _provenance, "shards": _shards, "perf": _perf, "example": _example,
}
EXPECTED_ERRORS = (ConfigError, PolicyError, ManifestError, HoldoutError, StageError,
                   TakedownError, IntakeError, ValueError, OSError)


def main(argv: Sequence[str] | None = None, out: TextIO | None = None) -> int:
    """Entry point; returns the exit code."""
    stream = out or sys.stdout
    args = build_parser().parse_args(argv)
    try:
        return HANDLERS[args.command](args, stream)
    except StageError as exc:
        stream.write(f"FAILED: {exc}\n")
        return EXIT_FAILED
    except EXPECTED_ERRORS as exc:
        stream.write(f"ERROR: {exc}\n")
        return EXIT_USAGE
