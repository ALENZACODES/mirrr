"""Compare two commits' aggregate frozen-face results without accessing faces.

Uses Bonferroni-adjusted Wilson component intervals to construct a
conservative per-comparison 95% difference bound without pairing identifiers.
This is not a paired test; it does not claim simultaneous coverage over all
gates/slices or inference from an unrepresentative frozen population.
An observed drop is flagged; a drop beyond the uncertainty range is a FAIL.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections import defaultdict
from collections.abc import Mapping
from typing import Any

from .realface_summary import MIN_GROUP, _safe_category, wilson_interval

FORMAT = "beljour-realface-regression/1"
SOURCE_FORMAT = "beljour-realface-gates/1"
# Two component intervals of at least 97.5% each bound the difference with
# at least 95% joint coverage by the union bound, even for paired outcomes.
Z_BONFERRONI = 2.241402727604947


def _counts(value: object, where: str) -> tuple[int, int]:
    if not isinstance(value, dict):
        raise ValueError(f"{where}: missing counts")
    passed, total, rate = value.get("passed"), value.get("total"), value.get("rate")
    if type(passed) is not int or type(total) is not int or not 0 <= passed <= total:
        raise ValueError(f"{where}: invalid integer count")
    if total == 0:
        if rate is not None:
            raise ValueError(f"{where}: empty rate must be null")
    elif (isinstance(rate, bool) or not isinstance(rate, (int, float))
          or not math.isfinite(rate) or abs(rate - passed / total) > 1e-12):
        raise ValueError(f"{where}: rate disagrees with counts")
    return passed, total


def _slices(gate: Mapping[str, Any]) -> dict[tuple[str, str], tuple[int, int]]:
    name = _safe_category(str(gate["id"]))
    rows = gate.get("slices")
    if not isinstance(rows, list) or not rows:
        raise ValueError(f"{name}: slice evidence is missing")
    output: dict[tuple[str, str], tuple[int, int]] = {}
    totals: dict[str, list[int]] = defaultdict(lambda: [0, 0])
    for item in rows:
        if not isinstance(item, dict):
            raise ValueError(f"{name}: slice is not an object")
        dimension, value = item.get("dimension"), item.get("value")
        if (not isinstance(dimension, str) or not isinstance(value, str)
                or not 0 < len(dimension) < 128 or not 0 < len(value) < 128):
            raise ValueError(f"{name}: malformed slice")
        key = (_safe_category(dimension), _safe_category(value))
        if key in output:
            raise ValueError(f"{name}: duplicate slice")
        counts = _counts(item, f"{name}/{dimension}={value}")
        output[key] = counts
        totals[key[0]][0] += counts[0]
        totals[key[0]][1] += counts[1]
    whole = _counts(gate["all_faces"], f"{name}/all_faces")
    if any(tuple(values) != whole for values in totals.values()):
        raise ValueError(f"{name}: a slice dimension does not partition the set")
    return output


def validate(report: object) -> dict[str, dict[str, Any]]:
    """Validate a complete count-only report against internal arithmetic."""
    if not isinstance(report, dict) or report.get("format") != SOURCE_FORMAT:
        raise ValueError("report must be a frozen-gate JSON object")
    for key in ("face_set_sha256", "engine_sha256", "run_id"):
        value = report.get(key)
        if not isinstance(value, str) or not value:
            raise ValueError(f"missing report {key}")
    if type(report.get("max_side")) is not int or report["max_side"] <= 0:
        raise ValueError("missing positive max_side")
    models = report.get("model_hashes")
    if not isinstance(models, dict) or any(
        not isinstance(key, str) or not key or not isinstance(value, str) or not value
        for key, value in models.items()
    ):
        raise ValueError("missing or malformed model provenance")
    gates = report.get("gates")
    if not isinstance(gates, list) or not gates:
        raise ValueError("no gates")
    result: dict[str, dict[str, Any]] = {}
    for gate in gates:
        if not isinstance(gate, dict) or not isinstance(gate.get("id"), str) or not gate["id"]:
            raise ValueError("invalid gate ID")
        name = _safe_category(gate["id"])
        if name in result:
            raise ValueError(f"{name}: duplicate gate ID")
        if not isinstance(gate.get("definition_sha256"), str) or not gate["definition_sha256"]:
            raise ValueError(f"{name}: no frozen definition")
        _counts(gate.get("overall"), f"{name}/overall")
        whole = _counts(gate.get("all_faces"), f"{name}/all_faces")
        if gate["overall"]["total"] > whole[1]:
            raise ValueError(f"{name}: primary denominator exceeds total")
        _slices(gate)
        result[name] = gate
    return result


def _compare_counts(before: tuple[int, int], after: tuple[int, int], label: str) -> dict[str, Any]:
    old_pass, old_n = before
    new_pass, new_n = after
    if old_n != new_n:
        return {"scope": label, "status": "UNPROVEN", "reason": "different_denominator",
                "before": {"passed": old_pass, "total": old_n},
                "after": {"passed": new_pass, "total": new_n}}
    old_ci = wilson_interval(old_pass, old_n, z=Z_BONFERRONI)
    new_ci = wilson_interval(new_pass, new_n, z=Z_BONFERRONI)
    old_rate = old_pass / old_n if old_n else None
    new_rate = new_pass / new_n if new_n else None
    change = new_rate - old_rate if new_rate is not None and old_rate is not None else None
    ci = [new_ci[0] - old_ci[1], new_ci[1] - old_ci[0]] if old_ci and new_ci else None
    if old_n < MIN_GROUP:
        verdict, reason = "UNPROVEN", "small_group"
    elif ci is not None and ci[1] < 0:
        verdict, reason = "FAIL", "drop_outside_95pct_uncertainty"
    elif change is not None and change < 0:
        verdict, reason = "UNPROVEN", "observed_drop_within_uncertainty"
    elif ci is not None and ci[0] > 0:
        verdict, reason = "PASS", "improvement_outside_95pct_uncertainty"
    else:
        verdict, reason = "UNPROVEN", "change_not_statistically_resolved"
    return {"scope": label, "before": {"passed": old_pass, "total": old_n, "rate": old_rate},
            "after": {"passed": new_pass, "total": new_n, "rate": new_rate},
            "delta": change, "delta_ci95_conservative": ci,
            "status": verdict, "reason": reason}


def compare(before: Mapping[str, Any], after: Mapping[str, Any]) -> dict[str, Any]:
    """Refuse incomparable sets/models/definitions; never infer missing faces as OK."""
    old = validate(before)
    new = validate(after)
    basis: list[str] = []
    for key in ("face_set_sha256", "max_side", "model_hashes"):
        if before.get(key) != after.get(key):
            basis.append(f"changed_{key}")
    if set(old) != set(new):
        basis.append("gate_membership_changed")
    for name in set(old) & set(new):
        if old[name]["definition_sha256"] != new[name]["definition_sha256"]:
            basis.append(f"changed_definition:{name}")
        if set(_slices(old[name])) != set(_slices(new[name])):
            basis.append(f"slice_membership_changed:{name}")
    if basis:
        return {"format": FORMAT, "status": "UNPROVEN", "comparable": False,
                "reasons": sorted(basis), "gates": [], "significant_drops": 0,
                "observed_drops": 0}
    entries: list[dict[str, Any]] = []
    significant = 0
    observed = 0
    for name in sorted(old):
        scopes = [("all_faces", _counts(old[name]["all_faces"], name),
                   _counts(new[name]["all_faces"], name)),
                  ("primary", _counts(old[name]["overall"], name),
                   _counts(new[name]["overall"], name))]
        before_slices = _slices(old[name])
        after_slices = _slices(new[name])
        scopes += [(f"{dim}={value}", counts, after_slices[(dim, value)])
                   for (dim, value), counts in sorted(before_slices.items())]
        compared = [_compare_counts(a, b, label) for label, a, b in scopes]
        significant += sum(item["status"] == "FAIL" for item in compared)
        observed += sum(item.get("delta") is not None and item["delta"] < 0 for item in compared)
        status = ("FAIL" if any(item["status"] == "FAIL" for item in compared) else
                  "UNPROVEN" if any(item["status"] == "UNPROVEN" for item in compared) else "PASS")
        entries.append({"id": name, "status": status, "comparisons": compared})
    result_status = ("FAIL" if significant else
                     "UNPROVEN" if any(row["status"] == "UNPROVEN" for row in entries) else "PASS")
    return {"format": FORMAT, "comparable": True,
            "status": result_status,
            "reasons": [], "significant_drops": significant,
            "observed_drops": observed, "gates": entries,
            "notes": ["Conservative per-comparison 95% Wilson difference bounds (Bonferroni); no paired identities.",
                      "Multiple gate comparisons are not jointly 95%-covered; no release PASS is inferred."]}



def compare_shared(before: Mapping[str, Any], after: Mapping[str, Any]) -> dict[str, Any]:
    """Inspect common gates when a new round changes the registered module set.

    This is a *diagnostic*, never a full release PASS. Changed populations,
    model hashes, definitions, or slice memberships still fail closed. Missing
    gates are listed by ID but neither counted as improvements nor silently
    removed from the final result. A confirmed shared-gate drop stays FAIL.
    """
    old = validate(before)
    new = validate(after)
    old_names = set(old)
    new_names = set(new)
    shared = old_names & new_names
    missing = sorted(old_names - new_names)
    added = sorted(new_names - old_names)
    if not shared:
        return {
            "format": FORMAT, "status": "UNPROVEN", "comparable": False,
            "partial": True, "reasons": ["no_shared_gates"], "gates": [],
            "missing_gates": missing, "new_gates": added,
            "significant_drops": 0, "observed_drops": 0,
        }
    # The original strict comparator is authoritative over its own fully
    # matching projection. This avoids a second implementation of intervals.
    prior = dict(before)
    later = dict(after)
    prior["gates"] = [old[name] for name in sorted(shared)]
    later["gates"] = [new[name] for name in sorted(shared)]
    matched = compare(prior, later)
    outcome = dict(matched)
    outcome["partial"] = bool(missing or added)
    outcome["missing_gates"] = missing
    outcome["new_gates"] = added
    if not matched["comparable"]:
        return outcome
    if missing or added:
        outcome["reasons"] = ["gate_membership_changed"]
        if outcome["status"] != "FAIL":
            outcome["status"] = "UNPROVEN"
    return outcome


def markdown(comparison: Mapping[str, Any]) -> str:
    lines = [f"## Frozen face regression: {comparison['status']}", "",
             "Comparison uses aggregate counts only; no faces, filenames or identity keys.", ""]
    if not comparison["comparable"]:
        lines.append("Not comparable: " + ", ".join(comparison["reasons"]))
        return "\n".join(lines) + "\n"
    if comparison.get("partial"):
        old_names = comparison.get("missing_gates", [])
        new_names = comparison.get("new_gates", [])
        lines.append("Partial module comparison only; a full release PASS is impossible.")
        lines.append("Absent from newer run: " + (", ".join(old_names) or "none"))
        lines.append("New in newer run: " + (", ".join(new_names) or "none"))
        lines.append("")
    lines += ["| Gate / slice | Before | After | Difference | 95% difference bounds | Status |",
              "|---|---:|---:|---:|---|---|"]
    for gate in comparison["gates"]:
        for row in gate["comparisons"]:
            old, new = row["before"], row["after"]
            diff = "n/a" if row["delta"] is None else f"{100 * row['delta']:+.2f}pp"
            ci = row["delta_ci95_conservative"]
            bounds = "n/a" if ci is None else f"{100 * ci[0]:+.2f} to {100 * ci[1]:+.2f}pp"
            lines.append(f"| {gate['id']}/{row['scope']} | {old['passed']}/{old['total']} | "
                         f"{new['passed']}/{new['total']} | {diff} | {bounds} | "
                         f"{row['status']}: {row['reason']} |")
    return "\n".join(lines) + "\n"
