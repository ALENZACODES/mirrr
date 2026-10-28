"""Generate or verify established parity artifacts through one command.

Each suite keeps its existing serializer and comparison rule. Verification never
rewrites the evidence; existing file names and bytes remain stable after the
source-code relocation. Run `python api/scripts/make_parity.py all --check`.
Author: John Khan.
"""
from __future__ import annotations

import argparse
import importlib
import json
import sys
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "api"))

SUITES = ("warp", "shape", "photo", "conditions", "regions-turn")
ROUNDS = {"r5": "warp", "r6": "shape", "r7": "photo", "r12": "regions-turn"}


@dataclass(frozen=True)
class Artifact:
    path: Path
    text: str
    comparison: str = "bytes"
    compare: Callable[[object, object], None] | None = None

    def verify(self) -> None:
        if self.comparison == "bytes":
            if self.path.read_bytes() != self.text.encode("utf-8"):
                raise ValueError("byte-for-byte drift")
        elif self.comparison == "json":
            if json.loads(self.path.read_text(encoding="utf-8")) != json.loads(self.text):
                raise ValueError("JSON value drift")
        elif self.compare is not None:
            self.compare(json.loads(self.text), json.loads(self.path.read_text(encoding="utf-8")))
        else:
            raise ValueError("missing comparison rule")


def artifacts(suite: str) -> list[Artifact]:
    if suite not in SUITES:
        raise ValueError(f"unknown parity suite: {suite}")
    module = importlib.import_module("parity_cases." + suite.replace("-", "_"))
    value = module.build()
    if suite == "warp":
        problems = module.warp_parity.validate(value)
        if problems:
            raise ValueError("; ".join(problems))
        return [Artifact(module.OUT, module.dump(value)),
                Artifact(module.REPORTS, json.dumps(module.warpfill.reports(), indent=1, sort_keys=True) + "\n")]
    if suite == "shape":
        return [Artifact(module.OUT, json.dumps(value, separators=(",", ":"), ensure_ascii=False) + "\n")]
    if suite == "photo":
        return [Artifact(module.OUT, json.dumps(value, separators=(",", ":")) + "\n", "json")]
    if suite == "conditions":
        return [Artifact(module.PATH, json.dumps(value, separators=(",", ":"), sort_keys=True, allow_nan=False) + "\n",
                         "conditions", module.equivalent)]
    return [Artifact(module.PATH, json.dumps(value, separators=(",", ":"), sort_keys=True) + "\n")]


def run(suites: Sequence[str], *, check: bool) -> int:
    failures = []
    for suite in suites:
        try:
            outputs = artifacts(suite)
            for output in outputs:
                if check:
                    output.verify()
                else:
                    output.path.parent.mkdir(parents=True, exist_ok=True)
                    output.path.write_text(output.text, encoding="utf-8")
            print(f"{suite}: {'verified' if check else 'generated'} {len(outputs)} parity artifact(s)")
        except (OSError, ValueError) as exc:
            failures.append(f"{suite}: {exc}")
    for failure in failures:
        print(f"FAIL {failure}", file=sys.stderr)
    return 1 if failures else 0


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0] if __doc__ else "Parity")
    parser.add_argument("suite", choices=(*SUITES, "all"), nargs="?", default="all")
    parser.add_argument("--round", choices=tuple(ROUNDS), help="Compatibility selector for an earlier round")
    parser.add_argument("--check", action="store_true", help="Read-only comparison, never refresh evidence")
    args = parser.parse_args(argv)
    selected = ROUNDS[args.round] if args.round else args.suite
    return run(SUITES if selected == "all" else (selected,), check=args.check)


if __name__ == "__main__":
    raise SystemExit(main())
