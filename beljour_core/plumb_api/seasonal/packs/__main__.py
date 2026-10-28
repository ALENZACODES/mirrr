"""Command line for reviewing and exporting the seasonal packs.

    python -m plumb_api.seasonal.packs sheets --out DIR [--tile 256]
    python -m plumb_api.seasonal.packs gallery --out DIR
    python -m plumb_api.seasonal.packs catalogue --out DIR [--today YYYY-MM-DD]
    python -m plumb_api.seasonal.packs calendar --out DIR --year 2027 [--region CA]
    python -m plumb_api.seasonal.packs audit

Every command writes into --out (created when missing) and prints one line per
file. Nothing is downloaded; all images are drawn on procedural portraits.
Author: John Khan.
"""

from __future__ import annotations

import argparse
import sys
from collections.abc import Sequence
from datetime import UTC, date, datetime
from pathlib import Path

from PIL import Image

from .audit import audit
from .calendar import DEFAULT_REGION, REGIONS, CalendarError, occurrences_between
from .calendar_ics import occurrences_ics
from .catalogue import catalogue_json
from .model import PackError
from .preview import all_sheets, motif_gallery_svg


def _out_dir(raw: str) -> Path:
    path = Path(raw)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _day(raw: str) -> date:
    try:
        return date.fromisoformat(raw)
    except ValueError as error:
        raise argparse.ArgumentTypeError(f"{raw!r} is not a YYYY-MM-DD date") from error


def cmd_sheets(args: argparse.Namespace) -> list[Path]:
    """One PNG contact sheet per registered pack."""
    out = _out_dir(args.out)
    written = []
    for occasion, sheet in all_sheets(args.tile).items():
        path = out / f"sheet_{occasion}.png"
        Image.fromarray(sheet).save(path)
        written.append(path)
    return written


def cmd_gallery(args: argparse.Namespace) -> list[Path]:
    """The motif gallery as one SVG document."""
    path = _out_dir(args.out) / "motif_gallery.svg"
    path.write_text(motif_gallery_svg(), encoding="utf-8")
    return [path]


def cmd_catalogue(args: argparse.Namespace) -> list[Path]:
    """The picker catalogue as JSON, with suggestions when --today is given."""
    path = _out_dir(args.out) / "seasonal_catalogue.json"
    path.write_text(catalogue_json(today=args.today, region=args.region), encoding="utf-8")
    return [path]


def cmd_calendar(args: argparse.Namespace) -> list[Path]:
    """Every occasion of one year as an iCalendar file."""
    year = int(args.year)
    occurrences = occurrences_between(date(year, 1, 1), date(year, 12, 31), args.region)
    stamp = datetime(year, 1, 1, tzinfo=UTC)
    path = _out_dir(args.out) / f"occasions_{year}_{args.region}.ics"
    path.write_bytes(occurrences_ics(occurrences, stamp).encode("utf-8"))
    return [path]


def parser() -> argparse.ArgumentParser:
    """Argument parser with one sub-command per export."""
    root = argparse.ArgumentParser(prog="python -m plumb_api.seasonal.packs")
    commands = root.add_subparsers(dest="command", required=True)
    sheets = commands.add_parser("sheets", help="contact sheet PNG per pack")
    sheets.add_argument("--out", required=True)
    sheets.add_argument("--tile", type=int, default=256)
    sheets.set_defaults(run=cmd_sheets)
    gallery = commands.add_parser("gallery", help="SVG sheet of every motif")
    gallery.add_argument("--out", required=True)
    gallery.set_defaults(run=cmd_gallery)
    picker = commands.add_parser("catalogue", help="picker JSON for the web lane")
    picker.add_argument("--out", required=True)
    picker.add_argument("--today", type=_day, default=None)
    picker.add_argument("--region", choices=REGIONS, default=DEFAULT_REGION)
    picker.set_defaults(run=cmd_catalogue)
    yearly = commands.add_parser("calendar", help="iCalendar file for one year")
    yearly.add_argument("--out", required=True)
    yearly.add_argument("--year", type=int, required=True)
    yearly.add_argument("--region", choices=REGIONS, default=DEFAULT_REGION)
    yearly.set_defaults(run=cmd_calendar)
    checker = commands.add_parser("audit", help="respect-rule audit; non-zero exit on findings")
    checker.set_defaults(run=None)
    return root


def main(argv: Sequence[str] | None = None) -> int:
    """Run one command; returns the process exit code."""
    args = parser().parse_args(argv)
    if args.command == "audit":
        findings = audit()
        for finding in findings:
            print(f"FAIL {finding}")
        print(f"audit: {len(findings)} findings")
        return 1 if findings else 0
    try:
        written = args.run(args)
    except (PackError, CalendarError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 2
    for path in written:
        print(path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
