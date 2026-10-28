#!/usr/bin/env python3
"""Assess R7 LS4-LS8 spike reports against the plan's human and device gates (offline).

 cd api && python scripts/review_photos.py --reports ../spike-reports/r7-own --template votes.json
 cd api && python scripts/review_photos.py --reports ../spike-reports/r7-own --votes votes.json \\
     --budget phone-budget.json --out acceptance.json
No photos are read and nothing is sent anywhere. Inspiration for the LS7 face gate:
face-parsing.PyTorch (named regions); concept only, no code copied.
Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from lab.python.beljour_lab.photo_review import evaluate, load_directory, review_template  # noqa: E402


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="R7 acceptance gates from reports and votes")
    ap.add_argument("--reports", type=Path, required=True, help="directory with ls4..ls7-report.json")
    ap.add_argument("--template", type=Path, help="write an unrated vote sheet here and stop")
    ap.add_argument("--votes", type=Path, help="beljour-r7-human-review/1 vote sheet")
    ap.add_argument("--budget", type=Path, action="append", default=[], help="beljour-ls8-budget/1 report(s) from budget.html")
    ap.add_argument("--out", type=Path, help="write the acceptance JSON here")
    args = ap.parse_args(argv)
    reports = load_directory(args.reports)
    if not reports:
        ap.error("no R7 reports found in that directory")
    if args.template:
        args.template.write_text(json.dumps(review_template(reports), indent=2) + "\n", encoding="utf-8")
        print(f"wrote an unrated vote sheet: {args.template}")
        return 0
    if not args.votes:
        ap.error("--votes is required (or use --template)")
    budgets = [json.loads(p.read_text(encoding="utf-8")) for p in args.budget]
    result = evaluate(reports, json.loads(args.votes.read_text(encoding="utf-8")), budgets)
    text = json.dumps(result, indent=2) + "\n"
    if args.out:
        args.out.write_text(text, encoding="utf-8")
    for key in ("LS4", "LS5", "LS6", "LS7", "LS8"):
        if key in result:
            r = result[key]
            verdict = r.get("verdict") or f"front {r.get('front_verdict')}, side {r.get('side_verdict')}"
            print(f"{key}: {verdict}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
