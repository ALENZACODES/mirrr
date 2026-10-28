"""Executable Python reference-vector producer for TS, never a shipped dump.

For each feature variant two algebraic mask/frame sizes are constructed at
runtime; the browser suite compares every channel within one value and checks
privacy/region/alpha invariants independently. Author: John Khan.
"""
from __future__ import annotations

import base64
import json
import sys
from dataclasses import asdict


from plumb_api.engines.women_styling import (
    FEATURE_SPECS, PASS_DEFINITIONS, PreviewRequest, SWATCHES, apply_preview,
)
from plumb_api.engines.women_styling.operations import layers_for
from test_women_r20c_engine import synthetic_frame, synthetic_masks


def vectors() -> dict[str, object]:
    cases: list[dict[str, object]] = []
    for spec in FEATURE_SPECS:
        for index, variant in enumerate(spec.variants):
            for scene in range(2):
                width, height = (27, 29) if scene == 0 else (35, 26)
                source = synthetic_frame(width, height, channels=4 if scene == 0 else 3)
                masks = synthetic_masks(width, height)
                authorized = {region: masks[region] for region in spec.regions}
                # Nonzero, per-scenario controls exercise a shared typed request
                # contract without creating a large checked-in fixture.
                request = PreviewRequest(
                    spec.id, variant, strength=81 if scene == 0 else 66,
                    undertone=("warm" if index % 2 == 0 else "cool"),
                    depth=("light" if index % 2 == 0 else "deep"),
                    outfit_rgb=(211, 73 + index, 96 + scene),
                    reference_rgb=(145 + index, 101 + scene, 202 - index),
                    primary_rgb=(198 - index, 117 + index, 91 + scene),
                    secondary_rgb=(95 + scene, 163 - index, 188 - index),
                    mix_percent=25 + index * 9,
                    hours=3 + scene * 6,
                )
                result = apply_preview(source, authorized, request)
                assert result.evidence.outside_mask_changed == 0
                assert result.evidence.changed_alpha_pixels == 0
                assert result.evidence.provider_calls == 0
                cases.append({
                    "id": spec.id,
                    "variant": variant,
                    "scenario": scene,
                    "width": width, "height": height,
                    "source": base64.b64encode(source.tobytes()).decode("ascii"),
                    "masks": {k: base64.b64encode(v.tobytes()).decode("ascii") for k, v in authorized.items()},
                    "request": asdict(request),
                    "pixels": base64.b64encode(result.pixels.tobytes()).decode("ascii"),
                    "evidence": asdict(result.evidence),
                    "layer_count": len(layers_for(request)),
                })
    return {
        "format": "beljour-r20c-women-vectors/1",
        "origin": "Generated at test time from algebraic arrays, not from real faces",
        "provider_calls": 0,
        "features": [s.id for s in FEATURE_SPECS],
        "swatches": [asdict(s) for s in SWATCHES],
        "definitions": [asdict(d) for d in PASS_DEFINITIONS],
        "cases": cases,
    }


def test_reference_vectors_are_unique_and_synthetic() -> None:
    cases = vectors()["cases"]
    assert isinstance(cases, list)
    target = sum(len(s.variants) * 2 for s in FEATURE_SPECS)
    assert len(cases) == target
    assert len({(case["id"], case["variant"], case["scenario"]) for case in cases}) == target
    assert all(case["evidence"]["provider_calls"] == 0 for case in cases)
    assert all(case["evidence"]["outside_mask_changed"] == 0 for case in cases)
    assert all(case["evidence"]["changed_alpha_pixels"] == 0 for case in cases)


if __name__ == "__main__" and "--emit-vectors" in sys.argv:
    sys.stdout.write(json.dumps(vectors(), separators=(",", ":"), allow_nan=False))
