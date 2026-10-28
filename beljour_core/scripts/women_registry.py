"""Write (or --check) the `women` block of api/plumb_api/arena/features.json.

Source: api/plumb_api/arena/women-100-features.json plus plumb_api.arena.women.BUILT.
Run from the repo root or api/:
    python api/scripts/women_registry.py           # rewrite the block
    python api/scripts/women_registry.py --check   # fail on drift or rule problems (make check)
Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "api"))
from plumb_api.arena import registry, women  # noqa: E402


def validate_declared_evidence(source: dict | None = None) -> list[str]:
    """Fail if an implemented W row was left Planned or lacks a real test path.

    A reviewed implementation is one with a concrete local engine and a
    test suite, not merely a reference to an externally hosted API. W3,
    W14, W41, W42, W68, W74, W95 and W97 are not treated as completed
    physical, medical or brand-data capabilities.
    """
    if source is None:
        source = women.load_source()
    blocked_or_incomplete = {3, 14, 41, 42, 68, 74, 95, 97}
    problems: list[str] = []
    for feature in source["features"]:
        number = int(feature["number"])
        status = feature["status"]
        paths = feature.get("tests")
        wid = str(feature["id"])
        if number not in blocked_or_incomplete and status == "planned":
            problems.append(f"{wid}: planned despite reviewed engine and test implementation")
        if status == "built":
            if not isinstance(paths, list) or not paths:
                problems.append(f"{wid}: built without authored test paths")
            else:
                for path in paths:
                    if not isinstance(path, str) or not (ROOT / path).is_file():
                        problems.append(f"{wid}: missing authored test {path!r}")
    return problems


def render(data: dict) -> str:
    return json.dumps(data, indent=2, ensure_ascii=False) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args(argv)
    path = registry.REGISTRY_PATH
    current = path.read_text(encoding="utf-8")
    data = json.loads(current)
    data["women"] = women.historical_block()
    expected = render(data)
    problems = women.validate_women(data["women"]["rows"])
    problems.extend(validate_declared_evidence())
    for p in problems:
        print("FAIL", p)
    if args.check:
        if expected != current:
            print("women block drift: run python api/scripts/women_registry.py")
            return 1
    else:
        path.write_text(expected, encoding="utf-8")
    print(women.checklist(data["women"]["rows"]) + f" {len(problems)} problems")
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
