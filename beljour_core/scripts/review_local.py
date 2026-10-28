#!/usr/bin/env python3
"""Evaluate six released adult-photo LS1/LS2/LS3 reports against human and runtime gates.

No network, no photo read, no model inference or API calls. All output is provisional.
Inspired by 3DDFA_V2 and FLAME evaluation concepts: concept only, no code copied.
Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from lab.python.beljour_lab.face_review import FORMAT, report_from_directory, review_template  # noqa: E402


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Assess R6 photo spike reports and human votes without external calls")
    parser.add_argument("--reports", type=Path, required=True, help="folder with ls1/ls2/ls3-report.json")
    parser.add_argument("--reviews", type=Path, help=f"a private {FORMAT} JSON file")
    parser.add_argument("--template-out", type=Path, help="create six-photo rating worksheet with unrated/null votes")
    parser.add_argument("--out", type=Path, help="optional aggregate verdict JSON; do not commit private reports")
    opts = parser.parse_args(argv)
    if bool(opts.reviews) == bool(opts.template_out):
        parser.error("provide either --reviews or --template-out")
    try:
        if opts.template_out:
            reports = {code: json.loads((opts.reports / f"{code.lower()}-report.json").read_text())
                       for code in ("LS1", "LS2", "LS3")}
            template = review_template(reports)
            opts.template_out.parent.mkdir(parents=True, exist_ok=True)
            opts.template_out.write_text(json.dumps(template, indent=2) + "\n")
            print(f"R6 unrated review worksheet: {opts.template_out}; fill every null vote before assessing")
            return 0
        outcome = report_from_directory(opts.reports, opts.reviews)
    except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        parser.error(f"invalid or missing review: {exc}")
    for name, entry in outcome["results"].items():
        print(f"{name}: {entry['decision']} (released six={outcome['six_released_photos']})")
    if opts.out:
        opts.out.parent.mkdir(parents=True, exist_ok=True)
        opts.out.write_text(json.dumps(outcome, indent=2) + "\n", encoding="utf-8")
        print(f"wrote local decision report: {opts.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
