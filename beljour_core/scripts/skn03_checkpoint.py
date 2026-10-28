"""Evaluate only frozen-set aggregate corrections against the unchanged SKN-03 gate.

No image input, path lists, person identifiers or demographic inference.
Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from plumb_api.engines.shade.skn03_checkpoint import (
    TransitionCounts,
    build_skn03_checkpoint,
    pending_checkpoint_note,
)

REQUIRED = frozenset({
    "counts", "frozen_manifest_digest", "c18_digest", "causes",
    "independently_labelled", "compatible_baseline", "human_review_complete",
})
COUNTS = frozenset({"still_correct", "corrected", "regressed", "still_incorrect"})


def process_payload(source: object) -> dict[str, object]:
    """Reject unexpected fields before loading operator-supplied aggregate data."""
    if not isinstance(source, dict) or set(source) != REQUIRED:
        raise ValueError("Expected only the seven supported aggregate fields")
    counted = source["counts"]
    if not isinstance(counted, dict) or set(counted) != COUNTS:
        raise ValueError("Transition counts are incomplete or have unexpected fields")
    causes = source["causes"]
    if not isinstance(causes, dict):
        raise ValueError("Cause counts must be a plain mapping")
    result = build_skn03_checkpoint(
        counts=TransitionCounts(**counted),
        frozen_manifest_digest=source["frozen_manifest_digest"],
        c18_digest=source["c18_digest"],
        causes=causes,
        independently_labelled=source["independently_labelled"],
        compatible_baseline=source["compatible_baseline"],
        human_review_complete=source["human_review_complete"],
    )
    return result.public()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Offline SKN-03 aggregate evidence check")
    parser.add_argument("aggregate", nargs="?", type=Path)
    args = parser.parse_args(argv)
    if args.aggregate is None:
        result = pending_checkpoint_note()
    else:
        try:
            if args.aggregate.stat().st_size > 64_000:
                raise ValueError("Aggregate input exceeds the 64 KB limit")
            payload: Any = json.loads(args.aggregate.read_text(encoding="utf-8"))
            result = process_payload(payload)
        except (OSError, ValueError, TypeError) as exc:
            print(f"SKN-03 evidence rejected: {exc}", file=sys.stderr)
            return 2
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    # Exit 3 means below target or missing verified evidence, not a successful gate.
    return 0 if result.get("status") == "BOX_REVIEW_REQUIRED" else 3


if __name__ == "__main__":
    raise SystemExit(main())
