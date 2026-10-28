"""Score the local engines with the E29 checks and write §17 quality reports.

    cd api && python scripts/quality_report.py              # reports in ../quality-reports/
    cd api && python scripts/quality_report.py --strict     # exit 1 if any check fails

Runs on synthetic photos until released photos and their recorded masks exist
(decisions.md Q11); every report says whether its photos were synthetic.
Author: John Khan.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from plumb_api.engines.core.local import ExposureEngine, TintEngine  # noqa: E402
from plumb_api.quality import harness, report, warpfill  # noqa: E402

OUT = Path(__file__).resolve().parents[2] / "quality-reports"

TOOLS = {
    "exposure": (ExposureEngine, [harness.StopSpec("natural", {"stops": 0.2}),
                                  harness.StopSpec("medium", {"stops": 0.5}),
                                  harness.StopSpec("strong", {"stops": 0.9})], "skin"),
    "tint": (TintEngine, [harness.StopSpec("natural", {"rgb": [180, 40, 60], "strength": 0.3}),
                          harness.StopSpec("full", {"rgb": [180, 40, 60], "strength": 1.0}, target="#B4283C")], None),
}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", type=Path, default=OUT)
    ap.add_argument("--photos", type=int, default=3, help="number of synthetic photos")
    ap.add_argument("--strict", action="store_true", help="fail when any check fails")
    args = ap.parse_args()
    photos = [harness.synthetic_photo(seed) for seed in range(1, args.photos + 1)]
    failed = 0
    for tool, (engine_cls, stops, skin) in TOOLS.items():
        engine = engine_cls()
        result = harness.run(tool, engine.version, engine, photos, stops, skin=skin)
        json_path, _ = report.write(result.report, args.out)
        s = result.report["summary"]
        failed += s["failed"]
        print(f"{tool}: {s['passed']}/{s['checks']} checks passed -> {json_path}")
    # R5: E06 warp and E07 fill on synthetic grid scenes (Q1, Q3, Q4, Q12)
    for tool, data in warpfill.reports(created=None).items():
        json_path, _ = report.write(data, args.out)
        s = data["summary"]
        failed += s["failed"]
        print(f"{tool}: {s['passed']}/{s['checks']} checks passed -> {json_path}")
    return 1 if args.strict and failed else 0


if __name__ == "__main__":
    sys.exit(main())
