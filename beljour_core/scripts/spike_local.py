#!/usr/bin/env python3
"""Offline LS1-LS3 (R6) and LS4-LS8 (R7) reports; synthetic by default, released photos with consent.

 cd api && python scripts/spike_local.py --out ../spike-reports/r6
 cd api && python scripts/spike_local.py --fixture /private/fixture.json \\
     --image /private/photo.jpg --adult-confirmed --out ../spike-reports/own
 cd api && python scripts/spike_local.py --round r7 --out ../spike-reports/r7
 cd api && python scripts/spike_local.py --round r7 --manifest /private/r7-manifest.json \\
     --adult-confirmed --out ../spike-reports/r7-own
Photos never leave this process; optional previews are created only on request.
Face-mapping inspiration: FLAME and 3DDFA_V2; concept only, no code copied.
Author: John Khan.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from lab.python.beljour_lab import photo_harness as local_r7  # noqa: E402
from lab.python.beljour_lab.face_harness import (  # noqa: E402
    Input,
    evaluate,
    released_case,
    released_manifest,
    synthetic_case,
)


def run_r7(options: argparse.Namespace, parser: argparse.ArgumentParser) -> int:
    if options.fixture or options.image or options.face_id:
        parser.error("R7 released photos go through --manifest (beljour-r7-photo-manifest/1)")
    spikes = tuple(s.strip().upper() for s in options.spikes.split(",") if s.strip())
    if options.manifest:
        inputs = local_r7.released_set(options.manifest, adult_confirmed=options.adult_confirmed)
    else:
        if options.adult_confirmed:
            parser.error("--adult-confirmed requires a released-photo manifest")
        if not 1 <= options.synthetic_cases <= 6:
            parser.error("synthetic cases must be 1..6")
        inputs = local_r7.synthetic_set(options.synthetic_cases if options.synthetic_cases != 3 else 6)
    results = local_r7.evaluate(inputs, options.out, spikes=spikes, previews=options.previews,
                                timing_size=options.timing_size)
    for name, result in results.items():
        print(f"{name}: {result['automated_passed']}/{result['automated_total']} automatic (not a human acceptance result); "
              f"human: {result['human_review']}; decision: {result['decision']}; {options.out / (name.lower() + '-report.json')}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="R6: LS1 turning, LS2 appearance, LS3 age: local reports")
    parser.add_argument("--fixture", type=Path, help="contract-15 JSON containing one or more released face meshes")
    parser.add_argument("--image", type=Path, help="the exact local photo recorded by the fixture")
    parser.add_argument("--face-id", help="face ID if a fixture has more than one detected face")
    parser.add_argument("--manifest", type=Path, help="private beljour-r6-photo-manifest/1 of 1..12 released photo/fixture pairs")
    parser.add_argument("--adult-confirmed", action="store_true", help="confirm adult subject and signed image release")
    parser.add_argument("--out", type=Path, default=Path(__file__).resolve().parents[2] / "spike-reports" / "r6")
    parser.add_argument("--previews", action="store_true", help="save local photo previews for human inspection")
    parser.add_argument("--synthetic-cases", type=int, default=3, help="1..6 synthetic cases; default 3 (R7: all six)")
    parser.add_argument("--round", choices=("r6", "r7"), default="r6", help="r6: LS1-LS3; r7: LS4-LS8")
    parser.add_argument("--spikes", default="LS4,LS5,LS6,LS7,LS8", help="R7 spikes to run, comma separated")
    parser.add_argument("--timing-size", type=int, default=512, help="R7 LS8 Python timing image side (px)")
    options = parser.parse_args(argv)
    if options.round == "r7":
        return run_r7(options, parser)
    if options.manifest and (options.fixture or options.image or options.face_id):
        parser.error("--manifest cannot be mixed with --fixture, --image or --face-id")
    if (options.fixture is None) != (options.image is None):
        parser.error("--fixture and --image are required together")
    if options.manifest:
        inputs = released_manifest(options.manifest, adult_confirmed=options.adult_confirmed)
    elif options.fixture:
        inputs = [released_case(options.fixture, options.image, face_id=options.face_id,
                                adult_confirmed=options.adult_confirmed)]
    else:
        if options.face_id or options.adult_confirmed:
            parser.error("--face-id and --adult-confirmed require a real released-photo fixture")
        if not 1 <= options.synthetic_cases <= 6:
            parser.error("synthetic cases must be 1..6")
        inputs = []
        for seed in range(1, options.synthetic_cases + 1):
            xyz, image = synthetic_case(seed)
            inputs.append(Input(xyz, image, "synthetic", f"synthetic-{seed}"))
    results = evaluate(inputs, options.out, previews=options.previews)
    for name, result in results.items():
        print(f"{name}: {result['automated_passed']}/{result['automated_total']} automatic (not a human acceptance result); "
              f"human: {result['human_review']}; decision: {result['decision']}; {options.out / (name.lower() + '-report.json')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
