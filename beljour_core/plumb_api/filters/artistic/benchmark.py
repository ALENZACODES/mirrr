"""Photo-local engineering checks for the four original artistic effects.

This module accepts already-decoded photos and confirmed observations. It does
not discover faces, access a network, save a photo or infer demographic labels.
The outer frozen-set runner owns consent, licensing, sharding and slice labels.
Pass definitions: docs/artistic/PASS_DEFINITIONS.md, written before test runs.
A technical pass is explicitly separate from real-face visual quality.
Author: John Khan.
"""
from __future__ import annotations

import math
import time
from collections import Counter
from collections.abc import Callable, Mapping, Sequence
from typing import Any

import numpy as np

from .dispatch import EFFECTS, render
from .inspection import inspect_output
from .types import EffectUnavailable, photo

DEFINITION_VERSION = "artistic-engineering/1"
COMMON_RULES: dict[str, tuple[str, float | bool]] = {
    "finite": ("eq", True),
    "outside_max_error": ("le", 0.0),
    "alpha_unchanged": ("eq", True),
    "transparent_unchanged": ("eq", True),
    "zero_max_error": ("le", 0.0),
    "repeat_max_error": ("le", 0.0),
    "input_unchanged": ("eq", True),
    "changed_pixels": ("ge", 1.0),
}
EFFECT_RULES: dict[str, dict[str, tuple[str, float | bool]]] = {
    "ink-study": {"hair_max_error": ("le", 0.0), "eye_max_error": ("le", 0.0)},
    "pigment-oil": {"geometry_displacement": ("le", 0.0)},
    "rain-expression": {"min_jacobian": ("ge", 0.75 - 1e-9), "displacement_iod": ("le", 0.07 + 1e-9)},
    "meadow-crown": {"hair_foreground_max_error": ("le", 0.0), "visible_alpha_sum": ("ge", 1.0)},
}


def check_metrics(effect_id: str, metrics: Mapping[str, Any]) -> list[str]:
    if not isinstance(effect_id, str) or effect_id not in EFFECT_RULES:
        raise ValueError("unknown artistic effect")
    failures = []
    for field, (op, expected) in {**COMMON_RULES, **EFFECT_RULES[effect_id]}.items():
        value = metrics.get(field)
        if isinstance(expected, bool):
            valid = isinstance(value, (bool, np.bool_)) and bool(value) is expected
        else:
            valid = isinstance(value, (int, float, np.number)) and not isinstance(value, (bool, np.bool_))
            if valid and isinstance(value, (int, float, np.number)):
                numeric = float(value)
                valid = math.isfinite(numeric)
                if op == "le":
                    valid = valid and numeric <= expected
                elif op == "ge":
                    valid = valid and numeric >= expected
                else:
                    valid = valid and numeric == expected
        if not valid:
            failures.append(field)
    return failures


def evaluate(effect_id: str, image: np.ndarray, landmarks: Any = None, *,
             hair_mask: Any = None, eye_mask: Any = None,
             params: Mapping[str, Any] | None = None,
             redetect: Callable[[np.ndarray], Any] | None = None) -> dict[str, Any]:
    """Return measured scalars only. Missing observations remain unavailable.

    This deliberately returns neither the rendered photo, the landmarks nor
    their paths. Input identity and frozen-set membership belong to the caller.
    """
    if not isinstance(effect_id, str) or effect_id not in EFFECTS:
        raise ValueError("unknown artistic effect")
    source = photo(image)
    original = source.copy()
    start = time.perf_counter()
    kwargs = {"landmarks": landmarks, "hair_mask": hair_mask, "eye_mask": eye_mask}
    base = {"feature": effect_id, "definition": DEFINITION_VERSION,
            "quality_status": "Not tested", "scope": "engineering invariants only"}
    try:
        output = render(effect_id, source, params=params, **kwargs)
        repeat = render(effect_id, source, params=params, **kwargs)
        neutral = render(effect_id, source, params={**(params or {}), "amount": 0.0}, **kwargs)
    except EffectUnavailable as exc:
        return {**base, "status": "unavailable", "reason": exc.code, "metrics": {}, "failures": []}
    except (ValueError, TypeError, OverflowError) as exc:
        # Report only the exception class; messages can contain user data.
        return {**base, "status": "failed", "reason": type(exc).__name__, "metrics": {},
                "failures": ["invalid_input"]}
    metrics = {
        **output.metrics,
        "zero_max_error": float(np.max(np.abs(neutral.image.astype(float) - source.astype(float)))),
        "repeat_max_error": float(np.max(np.abs(output.image.astype(float) - repeat.image.astype(float)))),
        "input_unchanged": bool(np.array_equal(source, original)),
        "elapsed_ms": (time.perf_counter() - start) * 1000,
    }
    failures = check_metrics(effect_id, metrics)
    row: dict[str, Any] = {**base, "status": "passed" if not failures else "failed", "metrics": metrics,
           "failures": failures, "warnings": list(output.warnings)}
    if redetect is not None:
        try:
            output_mesh = redetect(output.image.copy())
        except (ValueError, RuntimeError):
            output_mesh = None
        row["independent_inspection"] = inspect_output(source, output.image, before_mesh=landmarks,
                                                       after_mesh=output_mesh, hair_mask=hair_mask,
                                                       eye_mask=eye_mask)
    return row


def aggregate(records: Sequence[Mapping[str, Any]], *, minimum_group_faces: int = 20,
              required_groups: Sequence[str] = ()) -> dict[str, Any]:
    """Aggregate supplied groups without deriving a skin tone or gender from pixels.

    Records are {group: str, result: evaluate(...)}. Unknown stays unknown.
    Availability remains in the denominator; no unavailable face becomes PASS.
    Small groups are unproven even if every engineering check passes.
    """
    if isinstance(minimum_group_faces, bool) or not isinstance(minimum_group_faces, int) or minimum_group_faces < 1:
        raise ValueError("minimum group size must be a positive integer")
    groups: dict[str, dict[str, Any]] = {}
    for record in records:
        group = record.get("group") or "unknown"
        if not isinstance(group, str) or len(group) > 100 or any(ord(c) < 32 for c in group):
            raise ValueError("group must be a short plain label")
        row = record.get("result")
        if not isinstance(row, Mapping) or row.get("status") not in ("passed", "failed", "unavailable"):
            raise ValueError("each record needs an evaluated result")
        effect = row.get("feature")
        if not isinstance(effect, str) or effect not in EFFECTS or row.get("definition") != DEFINITION_VERSION:
            raise ValueError("mixed effects or definition versions cannot be guessed")
        key = f"{effect} / {group}"
        item = groups.setdefault(key, {"feature": effect, "group": group, "n": 0,
                                       "passed": 0, "failed": 0, "unavailable": 0,
                                       "reasons": Counter(), "durations": []})
        item["n"] += 1
        item[str(row["status"])] += 1
        for failure in row.get("failures", []):
            item["reasons"][str(failure)] += 1
        duration = row.get("metrics", {}).get("elapsed_ms")
        if isinstance(duration, (int, float)) and math.isfinite(duration):
            item["durations"].append(float(duration))
    output = []
    for key in sorted(groups):
        item = groups[key]
        rate = item["passed"] / item["n"]
        enough = item["n"] >= minimum_group_faces and item["group"] != "unknown"
        row = {k: v for k, v in item.items() if k not in ("reasons", "durations")}
        row.update({"pass_rate": rate,
                    "status": "unproven" if not enough else "passed" if rate >= 0.95 else "failed",
                    "failures": dict(sorted(item["reasons"].items())),
                    "elapsed_ms_p50": float(np.median(item["durations"])) if item["durations"] else None,
                    "elapsed_ms_p95": float(np.quantile(item["durations"], 0.95)) if item["durations"] else None})
        output.append(row)
    observed = {str(r["group"]) for r in output}
    missing = sorted(set(required_groups) - observed)
    return {"definition": DEFINITION_VERSION, "groups": output, "missing_groups": missing,
            "status": "unproven" if not output or missing or any(r["status"] == "unproven" for r in output)
            else "failed" if any(r["status"] == "failed" for r in output) else "passed",
            "quality_status": "Not tested", "scope": "engineering invariants only"}
