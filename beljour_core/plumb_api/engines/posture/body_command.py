"""Offline body-evidence command: freeze an external manifest, then score supplied results.

    python -m plumb_api.engines.posture.body_command freeze \
        --manifest /private/body-manifest.json --out /private/body-run.json [--shards 64]
    python -m plumb_api.engines.posture.body_command report --run /private/body-run.json \
        --results /private/shard-00.jsonl [--results ...] --out /private/body-report.json \
        [--browser-report /private/body-browser.json] [--coverage-plan /private/body-coverage.json]

`--browser-report` writes the counts-only projection the body studio can import;
`--coverage-plan` (also on `freeze`) writes remaining admissions per intersection.

Nothing is uploaded or fetched. Input files are size- and line-capped and schema-checked;
results must carry the frozen run fingerprint and their body's shard. Every output path is
validated before anything is written, must lie outside the source repository and is never
overwritten (files are created owner-only). Invalid input is refused with a fixed code and
is never printed. Standard output carries aggregate counts only. Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Iterator, Sequence
from pathlib import Path
from typing import Any

from ...pro.training.atomic import write_private_json
from .body_coverage import coverage_plan
from .body_evidence import MANIFEST_FORMAT, REPO_ROOT
from .body_freeze import FrozenRun, freeze_manifest, load_private_run
from .body_ledger import BodyLedger
from .body_measurement import parse_measurement
from .body_public import browser_report
from .body_scorecard import build_scorecard

REPORT_FORMAT = "beljour-posture-body-report/1"
# ASSUMED input bounds: generous for 200,000 bodies, small enough to read in memory.
MAX_JSON_BYTES = 64 * 1024 * 1024
MAX_RESULTS_BYTES = 256 * 1024 * 1024
MAX_LINE_BYTES = 4096
MAX_RESULT_FILES = 1024


class CommandRefused(ValueError):
    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


def checked_outputs(paths: Sequence[Path | None]) -> list[Path]:
    """Every output: distinct, outside the repository, parent present, not yet existing."""
    chosen = [path for path in paths if path is not None]
    resolved = [path.expanduser().resolve() for path in chosen]
    if len(set(resolved)) != len(resolved):
        raise CommandRefused("duplicate_output_location")
    for path in resolved:
        if path.is_relative_to(REPO_ROOT.resolve()):
            raise CommandRefused("output_inside_repository")
        if not path.parent.is_dir():
            raise CommandRefused("missing_output_folder")
        if path.exists() or path.is_symlink():
            raise CommandRefused("output_exists")
    return resolved


def _read_json(path: Path) -> Any:
    try:
        if path.is_symlink() or not path.is_file() or path.stat().st_size > MAX_JSON_BYTES:
            raise CommandRefused("invalid_input_file")
        return json.loads(path.read_bytes())
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise CommandRefused("invalid_input_file") from exc


def _result_lines(path: Path) -> Iterator[object]:
    try:
        if path.is_symlink() or not path.is_file() or path.stat().st_size > MAX_RESULTS_BYTES:
            raise CommandRefused("invalid_results_file")
        with path.open("rb") as stream:
            for raw in stream:
                if len(raw) > MAX_LINE_BYTES or not raw.endswith(b"\n"):
                    raise CommandRefused("invalid_results_line")
                if raw.strip():
                    yield json.loads(raw)
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise CommandRefused("invalid_results_line") from exc


def freeze(manifest: Path, out: Path, shards: int) -> FrozenRun:
    raw = _read_json(manifest)
    if not isinstance(raw, dict) or raw.get("format") != MANIFEST_FORMAT or not isinstance(raw.get("rows"), list):
        raise CommandRefused("invalid_manifest_format")
    run = freeze_manifest(raw["rows"], shard_count=shards)
    write_private_json(out, run.private_record(), replace=False)
    return run


def load_ledger(run_file: Path, results: Sequence[Path]) -> BodyLedger:
    if not 1 <= len(results) <= MAX_RESULT_FILES:
        raise CommandRefused("invalid_results_count")
    run = load_private_run(_read_json(run_file))
    ledger = BodyLedger(run)
    for path in results:
        for item in _result_lines(path):
            ledger.record(parse_measurement(item))
    return ledger


def operator_report(ledger: BodyLedger) -> dict[str, Any]:
    """Private operator report: scorecard plus hashed per-shard job receipts."""
    return {"format": REPORT_FORMAT, "scorecard": build_scorecard(ledger), "job_receipts": ledger.shard_receipts()}


def _arguments(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="beljour-body-evidence", description="Offline body evidence")
    actions = parser.add_subparsers(dest="action", required=True)
    frozen = actions.add_parser("freeze")
    frozen.add_argument("--manifest", required=True, type=Path)
    frozen.add_argument("--out", required=True, type=Path)
    frozen.add_argument("--shards", type=int, default=64)
    frozen.add_argument("--coverage-plan", type=Path)
    report = actions.add_parser("report")
    report.add_argument("--run", required=True, type=Path)
    report.add_argument("--results", required=True, type=Path, action="append")
    report.add_argument("--out", required=True, type=Path)
    report.add_argument("--browser-report", type=Path)
    report.add_argument("--coverage-plan", type=Path)
    return parser.parse_args(argv)


def execute(argv: Sequence[str]) -> dict[str, Any]:
    args = _arguments(argv)
    if args.action == "freeze":
        out, *plan_out = checked_outputs([args.out, args.coverage_plan])
        run = freeze(args.manifest, out, args.shards)
        if plan_out:
            write_private_json(plan_out[0], coverage_plan(run), replace=False)
        return run.public()
    outputs = checked_outputs([args.out, args.browser_report, args.coverage_plan])
    ledger = load_ledger(args.run, args.results)
    report = operator_report(ledger)
    # Everything is computed and validated before the first file is written.
    extra = []
    if args.browser_report is not None:
        extra.append(browser_report(report["scorecard"]))
    if args.coverage_plan is not None:
        extra.append(coverage_plan(ledger.run))
    for path, document in zip(outputs, [report, *extra], strict=True):
        write_private_json(path, document, replace=False)
    card = report["scorecard"]
    return {key: card[key] for key in ("format", "run", "set_status", "numeric_status", "release_status",
                                        "row_status_counts", "completion")}


def main(argv: Sequence[str] | None = None) -> int:
    try:
        output = execute(sys.argv[1:] if argv is None else argv)
    except (ValueError, OSError) as exc:
        code = getattr(exc, "code", None)
        reason = code if isinstance(code, str) and code.isidentifier() else "invalid_body_evidence"
        print(json.dumps({"status": "ERROR", "reason": reason}))
        return 2
    print(json.dumps(output, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
