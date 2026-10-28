"""Deterministic TypeScript mirror for the original JSON palette (no network)."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from .catalogue import CATALOGUE_PATH

REPO_ROOT = Path(__file__).resolve().parents[4]
TS_OUTPUT = REPO_ROOT / "web/src/engines/hair_palette/generated/data.ts"


def render_source() -> str:
    data = json.loads(CATALOGUE_PATH.read_text(encoding="utf-8"))
    text = json.dumps(data, ensure_ascii=True, indent=2)
    return ("/** GENERATED from api/plumb_api/engines/hair_palette/catalogue.json. "
            "Never edit this file by hand. */\n"
            f"export const RAW_HAIR_PALETTE: unknown = {text};\n")


def write_or_check(path: Path = TS_OUTPUT, *, check: bool) -> bool:
    output = render_source()
    if check:
        return path.is_file() and path.read_text(encoding="utf-8") == output
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(output, encoding="utf-8")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Export in-house palette for browser runtime")
    parser.add_argument("--check", action="store_true", help="Fail if generated mirror drifts")
    args = parser.parse_args()
    okay = write_or_check(check=args.check)
    print("hair palette mirror: " + ("in sync" if okay else "out of sync"))
    return 0 if okay else 1


if __name__ == "__main__":
    raise SystemExit(main())
