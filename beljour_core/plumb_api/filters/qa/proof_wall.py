"""BELJOUR Proof Wall: measured synthetic Cover Test and local render latency.

Every exported grade is revalidated against the six drawn controls. Latency
must be supplied by a complete, measured Node V8 web-filter-engine run.
No metric here proves results on real faces or target mobile hardware.
Created by John Khan.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
from collections.abc import Iterable, Mapping, Sequence
from datetime import datetime, timedelta
from math import isfinite
from pathlib import Path
from typing import Any

from . import cover

GRADE_FIELDS = (
    "rank", "id", "name", "family", "light", "tab", "recipeVersion",
    "syntheticGrade", "tonesPassed", "tonesTested", "textureRatioMin",
    "textureRatioMax", "identityDriftMax", "textureAlignmentMin",
    "hueTurnMaxDeg", "chromaRatioMin", "whiteLevelMin", "whiteSpreadMax",
    "editorialLiftMin", "editorialLiftMax", "realFacesEvaluated",
)
LATENCY_FIELDS = (
    "rank", "id", "name", "coldMs", "warmP50Ms", "warmP95Ms",
    "warmMinMs", "warmMaxMs", "warmSamples", "pixels", "runtime",
    "source", "mobileOrBrowserBudgetVerified",
)


def _round6(value: float) -> float:
    return round(value, 6)


def _digest(value: Any) -> str:
    content = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"),
                         allow_nan=False).encode("utf-8")
    return hashlib.sha256(content).hexdigest()


def _source_tree_hash() -> str:
    """Fingerprint the actual TypeScript filter sources behind a latency run."""
    root = Path(__file__).resolve().parents[4] / "web" / "src" / "filters"
    paths = sorted(root.rglob("*.ts"))
    if not paths:
        raise ValueError("the web filter source tree is missing")
    digest = hashlib.sha256()
    for path in paths:
        digest.update(path.relative_to(root).as_posix().encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def _manifest_hash(recipes: Sequence[Mapping[str, Any]]) -> str:
    # Uses the same ordered array and compact JSON bytes as the Node benchmark.
    payload = [[r["id"], r["version"], r["rank"]] for r in recipes]
    return hashlib.sha256(json.dumps(payload, separators=(",", ":")).encode()).hexdigest()


def _real_number(value: Any, label: str) -> float:
    if isinstance(value, bool) or not isinstance(value, int | float):
        raise ValueError(f"{label} must be a measured finite number")
    as_float = float(value)
    if not isfinite(as_float) or as_float <= 0:
        raise ValueError(f"{label} must be positive and finite")
    return as_float


def _percentile(samples: Sequence[float], quantile: float) -> float:
    ordered = sorted(samples)
    position = quantile * (len(ordered) - 1)
    low = int(position)
    fraction = position - low
    return ordered[low] + fraction * (ordered[min(low + 1, len(ordered) - 1)] - ordered[low])


def verify_latency(benchmark: Mapping[str, Any],
                   recipes: Sequence[Mapping[str, Any]]) -> list[dict[str, Any]]:
    """Reject missing rows, fictional percentiles and misleading runtime claims."""
    if benchmark.get("format") != "beljour-filter-latency-v1":
        raise ValueError("unrecognized measured latency format")
    if benchmark.get("scope") != "synthetic_node_v8_not_browser_or_real_faces":
        raise ValueError("latency source must be explicitly synthetic and Node-based")
    if benchmark.get("runtime") != "node_v8_web_filter_engine":
        raise ValueError("unrecognized latency runtime")
    if benchmark.get("realFacesEvaluated") != 0:
        raise ValueError("real-face evidence cannot be inferred from this benchmark")
    if benchmark.get("mobileOrBrowserBudgetVerified") is not False:
        raise ValueError("a Node measurement cannot certify a mobile/browser budget")
    frame = benchmark.get("fixture")
    if not isinstance(frame, Mapping) or (
        frame.get("kind") != "code_drawn_portrait"
        or frame.get("width") != 80 or frame.get("height") != 96
        or frame.get("channels") != 3
        or frame.get("skinMask") is not True
        or frame.get("personMask") is not True
    ):
        raise ValueError("benchmark fixture is not the frozen drawn portrait")
    if not _is_sha(frame.get("inputSha256")):
        raise ValueError("benchmark input digest is missing")
    if benchmark.get("recipeManifestSha256") != _manifest_hash(recipes):
        raise ValueError("benchmark recipes no longer match the catalogue")
    if benchmark.get("webSourceSha256") != _source_tree_hash():
        raise ValueError("benchmark web filter source has changed; measure again")
    stamp = benchmark.get("generatedAtUtc")
    if not isinstance(stamp, str):
        raise ValueError("latency measurement timestamp is absent")
    try:
        parsed_stamp = datetime.fromisoformat(stamp.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError("latency measurement timestamp is invalid") from error
    if parsed_stamp.utcoffset() != timedelta(0):
        raise ValueError("latency measurement timestamp must be UTC")
    timing = benchmark.get("timing")
    if not isinstance(timing, Mapping) or (
        timing.get("clock") != "performance.now"
        or timing.get("quantile") != "linear_interpolation_sorted_samples"
        or timing.get("parallelism") != 1
    ):
        raise ValueError("latency methodology differs from the declared benchmark")
    repeats = timing.get("repetitions")
    if isinstance(repeats, bool) or not isinstance(repeats, int) or not 3 <= repeats <= 11:
        raise ValueError("benchmark must have 3..11 measured warm samples")
    platform = benchmark.get("platform")
    if not isinstance(platform, Mapping) or (
        not isinstance(platform.get("node"), str)
        or not isinstance(platform.get("os"), str)
        or not isinstance(platform.get("arch"), str)
    ):
        raise ValueError("benchmark host/runtime metadata is missing")
    entries = benchmark.get("filters")
    if not isinstance(entries, list) or len(entries) != len(recipes):
        raise ValueError("latency benchmark must cover every requested recipe")
    output: list[dict[str, Any]] = []
    for entry, recipe in zip(entries, recipes, strict=True):
        if not isinstance(entry, Mapping):
            raise ValueError("invalid latency row")
        if (entry.get("id"), entry.get("version"), entry.get("rank")) != (
            recipe["id"], recipe["version"], recipe["rank"]
        ):
            raise ValueError("missing, out-of-order or version-mismatched latency recipe")
        samples = entry.get("warmSamplesMs")
        if not isinstance(samples, list) or len(samples) != repeats:
            raise ValueError(f"{recipe['id']}: latency samples are missing")
        parsed = [_real_number(value, "warm sample") for value in samples]
        cold_ms = _real_number(entry.get("coldMs"), "cold render")
        p50 = _real_number(entry.get("warmP50Ms"), "warm p50")
        p95 = _real_number(entry.get("warmP95Ms"), "warm p95")
        if abs(p50 - _percentile(parsed, 0.5)) > 0.00001:
            raise ValueError(f"{recipe['id']}: reported p50 is not supported by samples")
        if abs(p95 - _percentile(parsed, 0.95)) > 0.00001:
            raise ValueError(f"{recipe['id']}: reported p95 is not supported by samples")
        if not _is_sha(entry.get("outputSha256")):
            raise ValueError(f"{recipe['id']}: output pixel digest is missing")
        output.append({
            "rank": recipe["rank"], "id": recipe["id"], "name": recipe["name"],
            "coldMs": round(cold_ms, 3), "warmP50Ms": round(p50, 3),
            "warmP95Ms": round(p95, 3), "warmMinMs": round(min(parsed), 3),
            "warmMaxMs": round(max(parsed), 3), "warmSamples": repeats,
            "pixels": 80 * 96, "runtime": "Node V8 (web filter engine)",
            "source": "drawn synthetic, 80x96, masked", "mobileOrBrowserBudgetVerified": False,
        })
    return output


def _is_sha(value: Any) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(
        char in "0123456789abcdef" for char in value
    )


def build_proof(recipes: Iterable[Mapping[str, Any]],
                results: Iterable[cover.CoverResult],
                benchmark: Mapping[str, Any], *,
                required_filters: int = 61) -> dict[str, Any]:
    """Join complete verified cover readings with measured timing, never estimates."""
    chosen = list(recipes)
    observed = list(results)
    if len(chosen) != required_filters:
        raise ValueError(f"expected {required_filters} built filters, found {len(chosen)}")
    grades = cover.cover_gate(chosen, observed)
    if not grades["complete"]:
        raise ValueError("synthetic Cover Test is incomplete or failed: " +
                         "; ".join(grades["problems"][:4]))
    latency = verify_latency(benchmark, chosen)
    by_id: dict[str, list[cover.CoverResult]] = {}
    for measured in observed:
        by_id.setdefault(measured.filter_id, []).append(measured)
    cover_rows: list[dict[str, Any]] = []
    for recipe in chosen:
        tones = by_id[recipe["id"]]
        metrics = [row.metrics for row in tones]
        if len(tones) != len(cover.TONE_NAMES) or not all(row.passed for row in tones):
            raise ValueError("incomplete synthetic Cover Test grade")
        cover_rows.append({
            "rank": recipe["rank"], "id": recipe["id"], "name": recipe["name"],
            "family": recipe["editorial"]["family"], "light": recipe["editorial"]["light"],
            "tab": recipe["tab"], "recipeVersion": recipe["version"],
            "syntheticGrade": f"S{len(tones)}/{len(cover.TONE_NAMES)}",
            "tonesPassed": len(tones), "tonesTested": len(tones),
            "textureRatioMin": _round6(min(m.texture_ratio for m in metrics)),
            "textureRatioMax": _round6(max(m.texture_ratio for m in metrics)),
            "identityDriftMax": _round6(max(m.identity_drift for m in metrics)),
            "textureAlignmentMin": _round6(min(m.texture_alignment for m in metrics)),
            "hueTurnMaxDeg": _round6(max(m.hue_turn for m in metrics)),
            "chromaRatioMin": _round6(min(m.chroma_ratio for m in metrics)),
            "whiteLevelMin": _round6(min(m.white_level for m in metrics)),
            "whiteSpreadMax": _round6(max(m.white_spread for m in metrics)),
            "editorialLiftMin": _round6(min(m.editorial_lift for m in metrics)),
            "editorialLiftMax": _round6(max(m.editorial_lift for m in metrics)),
            "realFacesEvaluated": 0,
        })
    summary = cover.summary(observed)
    evidence = cover.evidence(observed)
    return {
        "format": "beljour-proof-wall-v1", "product": "BELJOUR",
        "tagline": "Your best day. Still you.",
        "claims": {
            "cover": "synthetic proxy checks only, not biometric identity verification",
            "latency": "local Node V8 complete web render, not browser or mobile timing",
            "release": "100,000-face real-photo gate UNVERIFIED",
        },
        "summary": {**summary, "complete": True, "syntheticGrade": "S6/6"},
        "coverThresholds": evidence["limits"],
        "recipeManifestSha256": benchmark["recipeManifestSha256"],
        "webSourceSha256": benchmark["webSourceSha256"],
        "coverLedgerSha256": _digest(evidence),
        "latencyRunSha256": _digest(benchmark),
        "latencyRun": {k: benchmark[k] for k in (
            "generatedAtUtc", "scope", "runtime", "platform", "timing", "fixture",
            "realFacesEvaluated", "mobileOrBrowserBudgetVerified",
        )},
        "grades": cover_rows,
        "latency": latency,
        "coverLedger": evidence,
    }


def _csv_text(columns: tuple[str, ...], rows: Sequence[Mapping[str, Any]]) -> str:
    stream = io.StringIO(newline="")
    writer = csv.DictWriter(stream, fieldnames=columns, lineterminator="\n",
                            extrasaction="raise")
    writer.writeheader()
    for row in rows:
        writer.writerow(row)
    return stream.getvalue()


def publish(directory: Path, proof: Mapping[str, Any]) -> dict[str, Path]:
    """Write consumer-ready grades and engineer-ready latency side by side."""
    if proof.get("format") != "beljour-proof-wall-v1":
        raise ValueError("only a validated Proof Wall report can be exported")
    grades = proof.get("grades")
    latency = proof.get("latency")
    if not isinstance(grades, list) or not isinstance(latency, list) or len(grades) != len(latency):
        raise ValueError("Proof Wall requires equal grade and latency coverage")
    if any(a.get("id") != b.get("id") for a, b in zip(grades, latency, strict=True)):
        raise ValueError("latency must match the exact graded filter order")
    directory.mkdir(parents=True, exist_ok=True)
    paths = {
        "grades": directory / "BELJOUR_COVER_GRADES.csv",
        "latency": directory / "BELJOUR_FILTER_LATENCY.csv",
        "proof": directory / "BELJOUR_PROOF_WALL.json",
        "summary": directory / "BELJOUR_PROOF_WALL.md",
    }
    paths["grades"].write_text(_csv_text(GRADE_FIELDS, grades), encoding="utf-8")
    paths["latency"].write_text(_csv_text(LATENCY_FIELDS, latency), encoding="utf-8")
    paths["proof"].write_text(json.dumps(proof, indent=2, sort_keys=True,
                                         ensure_ascii=False, allow_nan=False) + "\n", encoding="utf-8")
    p50 = sorted(float(row["warmP50Ms"]) for row in latency)
    p95 = sorted(float(row["warmP95Ms"]) for row in latency)
    notes = [
        "# BELJOUR filter Proof Wall — measured synthetic evidence", "",
        "Your best day. Still you.", "",
        f"- **Cover Test:** {proof['summary']['passes']}/{proof['summary']['evaluated']} "
        f"drawn-tone checks passed on {len(grades)} filters; all are S6/6.",
        "- **Identity drift:** gradient-alignment proxy only, not a biometric identity score.",
        "- **Texture:** retained amplitude and edge orientation on code-drawn skin.",
        "- **Real faces:** 0 evaluated here. Frozen 100,000-face gate UNVERIFIED.",
        "- **Latency:** actual full renders, Node V8, 80×96 RGB synthetic, masked, "
        "single thread, LUT warm; not a browser or mobile-performance claim.",
        "- **Sampling:** seven warm samples per filter with linearly interpolated p95; "
        "diagnostic evidence, not a phone latency budget.",
        f"- **Across-filter warm p50 range:** {p50[0]:.3f}–{p50[-1]:.3f} ms.",
        f"- **Across-filter warm p95 range:** {p95[0]:.3f}–{p95[-1]:.3f} ms.",
        f"- **Timing machine:** {proof['latencyRun']['platform']['os']}, "
        f"{proof['latencyRun']['platform']['arch']}, "
        f"{proof['latencyRun']['platform']['node']}.",
        "- **Not verified:** under-100-ms browser preview, export under 2 seconds, "
        "phone, 12 MP, cold first-load, or the live judge session.",
        "", "For Lane D: use `BELJOUR_COVER_GRADES.csv` as the Proof Wall data source.",
        "For Lane G: use `BELJOUR_FILTER_LATENCY.csv` with the benchmark metadata "
        "in `BELJOUR_PROOF_WALL.json`. Do not transfer these timings to a phone budget.",
        "Raw six-tone readings and thresholds are retained inside the JSON evidence ledger.",
        "",
    ]
    paths["summary"].write_text("\n".join(notes), encoding="utf-8")
    return paths
