"""Look at the task ledger, and clear an entry after checking the YouCam credit history.

  python scripts/ledger.py list                 every entry, newest first
  python scripts/ledger.py list --status ambiguous
  python scripts/ledger.py clear KEY --note "no charge in credit history on Oct 23"

An ambiguous entry means a create call may or may not have reached YouCam. Look for the
time in the credit history first: if a charge is there, the task exists and its result can
still be fetched within 30 days; if not, clear the entry so the request can run again.

Reads BELJOUR_DATA_DIR (or PLUMB_DATA_DIR), default /tmp/plumb. Run from the api/ folder.
Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from plumb_api.config import load_settings  # noqa: E402
from plumb_api.ledger import STATES, BadTransition, TaskLedger  # noqa: E402


def main(argv: list[str] | None = None, out=print) -> int:
    ap = argparse.ArgumentParser(description="Task ledger")
    ap.add_argument("--data-dir", type=Path, help="defaults to the app's data dir")
    sub = ap.add_subparsers(dest="cmd", required=True)
    ls = sub.add_parser("list")
    ls.add_argument("--status", choices=STATES)
    ls.add_argument("--json", action="store_true")
    cl = sub.add_parser("clear")
    cl.add_argument("key")
    cl.add_argument("--note", default="cleared by hand after checking the credit history")
    args = ap.parse_args(argv)
    data_dir = args.data_dir or load_settings().data_dir
    ledger = TaskLedger(Path(data_dir) / "ledger.sqlite3")
    if args.cmd == "list":
        entries = ledger.entries(status=args.status)
        if args.json:
            out(json.dumps([e.to_json() for e in entries], indent=1))
        else:
            out(f"{len(entries)} entries; by status: {ledger.counts()}")
            for e in entries:
                out(f"{e.status:10} {e.request_key} {e.feature:16} task={e.task_id or '-'} units={e.units} {e.error or ''}")
        return 0
    try:
        entry = ledger.clear(args.key, args.note)
    except BadTransition as exc:
        out(f"Not cleared: {exc}")
        return 1
    out(f"Cleared {entry.request_key}: now {entry.status}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
