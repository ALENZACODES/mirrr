"""Recompute the W69-W74 drawn-fixture parity corpus. Author: John Khan."""
from __future__ import annotations

import argparse
import base64
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "api"))
from plumb_api.engines.brows import FEATURES, render_brows  # noqa: E402
from plumb_api.engines.brows.annotations import annotate_brows, observation_document  # noqa: E402
from plumb_api.engines.brows.assessment import compare_brow_photos, photo_measurements, shape_options  # noqa: E402
from plumb_api.engines.brows.diary import diary_document, summarize_diary  # noqa: E402
from plumb_api.engines.brows.progress import diary_trend, progress_series  # noqa: E402
from plumb_api.engines.brows.synthetic import brow_fixture  # noqa: E402


def corpus() -> dict:
    cases = []
    settings = {
        "W69": {"amount": 0.8, "colour": [62, 43, 35], "state": "first_week", "greyResistance": 0.7},
        "W70": {"amount": 0.85, "angle": 75},
        "W71": {"adultConfirmed": True, "amount": 0.85, "density": 0.7},
        "W72": {"adultConfirmed": True, "amount": 0.75, "method": "nano", "state": "faded"},
        "W73": {"leftArch": 0.11, "rightArch": 0.04, "peak": 0.7, "thickness": 1.2},
        "W74": {"months": 6, "lengthChange": 12, "densityChange": -5, "site": "lashes"},
    }
    for label, fixture_args in (("neutral", {}), ("deep_grey_rolled", {"tone": 76, "grey": True, "roll": 17, "rgba": True}),
                                ("asymmetric_sparse", {"asymmetric": True, "sparse": True})):
        image, face, evidence = brow_fixture(96, **fixture_args)
        for feature in FEATURES:
            result = render_brows(image, face, feature, settings[feature], evidence)
            cases.append({"name": f"{label}_{feature}", "feature": feature, "width": image.shape[1],
                          "height": image.shape[0], "channels": image.shape[2], "landmarks": face.tolist(),
                          "image": base64.b64encode(image.tobytes()).decode(),
                          "coverage": base64.b64encode(evidence.coverage.astype('uint8').tobytes()).decode(),
                          "grey": base64.b64encode(evidence.grey.astype('uint8').tobytes()).decode(),
                          "settings": settings[feature], "output": base64.b64encode(result.image.tobytes()).decode(),
                          "support": result.support.ravel().tolist(), "metrics": result.metrics,
                          "status": result.status, "details": result.details})
    diary = [{"date": "2026-01-01", "site": "brows", "length": 5, "density": 80, "confidence": 0.7},
             {"date": "2026-03-01", "site": "brows", "length": 5.5, "density": 82, "confidence": 0.8}]
    image, face, evidence = brow_fixture(96)
    mark_cases = [
        [{"mode": "hair", "radius": 0.006, "opacity": 1, "points": [[0.28, 0.31], [0.33, 0.31]]}],
        [{"mode": "grey", "radius": 0.009, "opacity": 0.7, "points": [[0.62, 0.31], [0.7, 0.31]]}],
        [{"mode": "grey", "radius": 0.01, "opacity": 1, "points": [[0.3, 0.31]]},
         {"mode": "erase", "radius": 0.006, "opacity": 0.5, "points": [[0.3, 0.31]]}],
    ]
    manual = []
    for marks in mark_cases:
        observed = annotate_brows(image, face, marks, reviewed=True)
        manual.append({"marks": marks, "coverage": observed.coverage.ravel().tolist(),
                       "grey": observed.grey.ravel().tolist(), "document": observation_document(96, 96, marks, reviewed=True)})
    auxiliary = {"manual": manual, "shape": shape_options(face, 96, 96),
                 "measurements": photo_measurements(image, face, evidence),
                 "comparison": compare_brow_photos(image, face, image, face, before_evidence=evidence, after_evidence=evidence),
                 "diary_document": diary_document(diary), "diary_summary": summarize_diary(diary)}
    return {"auxiliary": auxiliary, "version": "brows-parity/1", "author": "John Khan", "byte_tolerance": 1,
            "float_tolerance": 1e-6, "cases": cases,
            "progress": progress_series({"months": 12, "lengthChange": 15, "densityChange": 10}),
            "diary": diary, "trend": diary_trend(diary)}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    path = ROOT / "parity/brows-r15b.json"
    rendered = json.dumps(corpus(), sort_keys=True, separators=(",", ":")) + "\n"
    if args.check:
        if not path.is_file() or path.read_text() != rendered:
            print("brows parity drift")
            return 1
        print("brows parity: 18 cases unchanged")
    else:
        path.write_text(rendered)
        print("brows parity: 18 cases written")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
