"""Python -> TypeScript contract vectors for the r30f shade and fibre-colour modules.

parity/shade-contract-r30f.json holds 35 nearest selections and four scalar Lab
distance pairs, plus the catalogues, the reference inventory audit, SKN-03 reports,
fibre readings and plans, and colour-stability cases. web/test/r30f-public-parity
checks the browser modules against it. Regenerate with
`cd api && python3 -m tests.test_r30f_public_parity`. Synthetic data only.
Author: John Khan.
"""
from __future__ import annotations

import base64
import csv
import json
import random
from pathlib import Path
from typing import Any

import numpy as np

from plumb_api.engines.concealer.colour_stability import assess_colour_stability
from plumb_api.engines.concealer.shade_support import FibreReading, plan_fibre_colour, read_fibre_colour
from plumb_api.engines.shade.distance import delta_e, rank_shades
from plumb_api.engines.shade.loaders import KINDS, ShadeKind, load_shade_catalogue
from plumb_api.engines.shade.readiness import SkinCheckCase, check_reference_coverage, measure_skn03
from tests.test_r30f_fibre_colour import WARM, drawn_hair

ROOT = Path(__file__).resolve().parents[2]
VECTORS = ROOT / "parity/shade-contract-r30f.json"
SHARMA = ROOT / "lab/bqa_shade/data/sharma2005_pairs.csv"
SHARMA_PAIRS = (1, 7, 17, 34)


def clean(value: Any) -> Any:
    """Floats to 10 decimals so the stored file does not depend on the last ulp."""
    if isinstance(value, float):
        return round(value, 10)
    if isinstance(value, dict):
        return {str(k): clean(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [clean(v) for v in value]
    return value


def b64(array: np.ndarray) -> str:
    return base64.b64encode(np.ascontiguousarray(array).tobytes()).decode("ascii")


def nearest_cases() -> list[dict[str, Any]]:
    rng = random.Random(3030)
    labs: list[tuple[tuple[float, float, float], ShadeKind, bool]] = [
        ((10.0, 5.0, 5.0), "reference", False), ((25.4, 7.23, 3.96), "hair", False), ((25.4, 7.23, 3.96), "hair", True)]
    while len(labs) < 35:
        kind = KINDS[len(labs) % 3]
        if kind == "hair":
            lab = (rng.uniform(5, 80), rng.uniform(-3, 25), rng.uniform(-8, 35))
        else:
            lab = (rng.uniform(18, 84), rng.uniform(0, 22), rng.uniform(2, 30))
        labs.append(((round(lab[0], 4), round(lab[1], 4), round(lab[2], 4)), kind, len(labs) % 5 == 4))
    out = []
    for lab, kind, allow in labs:
        ranked = rank_shades(lab, kind, allow_lighter=allow)
        top = ranked[0] if ranked else None
        out.append({"lab": list(lab), "kind": kind, "allow_lighter": allow, "count": len(ranked),
                    "id": None if top is None else top.record.id,
                    "delta_e": None if top is None else top.delta_e,
                    "lighter_by": None if top is None else top.lighter_by,
                    "measured_level": None if top is None else top.measured_level})
    return out


def distance_pairs() -> list[dict[str, Any]]:
    with SHARMA.open(encoding="utf-8") as handle:
        rows = {int(row["pair"]): row for row in csv.DictReader(handle)}
    out = []
    for pair in SHARMA_PAIRS:
        row = rows[pair]
        first = [float(row["l1"]), float(row["a1"]), float(row["b1"])]
        second = [float(row["l2"]), float(row["a2"]), float(row["b2"])]
        out.append({"pair": pair, "first": first, "second": second, "delta_e": delta_e(first, second),
                    "published": float(row["de00"])})
    return out


SKN_SCENARIOS: tuple[tuple[int, int, int, str, tuple[bool, bool, bool]], ...] = (
    (19, 1, 0, "band 1-2", (False, False, False)),
    (18, 1, 1, "unknown", (True, True, True)),
    (20, 0, 0, "band 5-6", (True, True, True)),
    (20, 0, 0, "band 5-6", (True, False, True)),
)


def skn03_cases() -> list[dict[str, Any]]:
    out = []
    for stable, unstable, refused, group, flags in SKN_SCENARIOS:
        readings: list[tuple[Any, ...]] = [((3, "olive"),) * 3] * stable
        readings += [((3, "olive"), (3, "warm"), (3, "olive"))] * unstable
        readings += [((3, "olive"), None, (3, "olive"))] * refused
        cases = [SkinCheckCase(f"case-{i}", r, group) for i, r in enumerate(readings)]
        report = measure_skn03(cases, independent_labels=flags[0], compatible_baseline=flags[1],
                               human_review=flags[2])
        out.append({"cases": [{"case_id": c.case_id, "group": c.group, "readings": c.readings} for c in cases],
                    "evidence": list(flags), "report": report.public()})
    return out


def fibre_photo() -> dict[str, Any]:
    photo, hair, card = drawn_hair(WARM)
    readings = {
        "neutral": read_fibre_colour(photo, hair, neutral_mask=card),
        "grey_world": read_fibre_colour(photo, hair, background_mask=card),
        "none": read_fibre_colour(photo, hair),
    }
    return {"width": photo.shape[1], "height": photo.shape[0], "channels": photo.shape[2], "image": b64(photo),
            "hair": b64(hair.astype(np.uint8)), "card": b64(card.astype(np.uint8)),
            "readings": {name: r.public() | {"lab": list(r.lab)} for name, r in readings.items()}}


def plan_row(lab: tuple[float, float, float], mode: str, approve: bool, count: int) -> dict[str, Any]:
    plan = plan_fibre_colour(FibreReading(lab, mode), approve_lighter=approve, count=count)
    return {"lab": list(lab), "white_mode": mode, "approve_lighter": approve, "count": count, "code": plan.code,
            "ids": [m.record.id for m in plan.matches], "delta_e": [m.delta_e for m in plan.matches],
            "lighter_option": None if plan.lighter_option is None else plan.lighter_option.record.id}


def fibre_plans() -> list[dict[str, Any]]:
    rows = [plan_row((25.4, 7.23, 3.96), "neutral", False, 3), plan_row((25.4, 7.23, 3.96), "neutral", True, 3),
            plan_row((30.0, 8.0, 12.0), "none", False, 3), plan_row((50.0, -60.0, 60.0), "neutral", False, 3)]
    rng = random.Random(3031)
    for i in range(8):
        lab = (round(rng.uniform(5, 80), 3), round(rng.uniform(-3, 25), 3), round(rng.uniform(-8, 35), 3))
        rows.append(plan_row(lab, "grey_world" if i % 2 else "neutral", i % 3 == 0, 1 + i % 5))
    return rows


STABILITY_SETS: tuple[tuple[tuple[tuple[float, float, float], str], ...], ...] = (
    (((30.0, 8.0, 12.0), "neutral"), ((30.4, 8.1, 12.2), "neutral"), ((29.8, 7.9, 11.9), "grey_world")),
    (((30.0, 8.0, 12.0), "neutral"), ((33.0, 9.0, 14.0), "grey_world")),
    (((30.0, 8.0, 12.0), "neutral"), ((45.0, 8.0, 12.0), "neutral")),
    (((30.0, 8.0, 12.0), "neutral"), ((30.1, 8.0, 12.0), "none")),
    (((25.4, 7.23, 3.96), "neutral"), ((25.5, 7.2, 4.0), "neutral")),
    (((50.0, -60.0, 60.0), "neutral"), ((50.0, -59.0, 60.0), "neutral")),
)


def stability_cases() -> list[dict[str, Any]]:
    out = []
    for readings in STABILITY_SETS:
        for approve in (False, True):
            result = assess_colour_stability([FibreReading(lab, mode) for lab, mode in readings],
                                             approve_lighter=approve)
            best = None if result.plan is None or result.plan.best is None else result.plan.best.record.id
            out.append({"readings": [{"lab": list(lab), "white_mode": mode} for lab, mode in readings],
                        "approve_lighter": approve, "code": result.code, "spread": result.spread,
                        "picks": list(result.picks), "best": best})
    return out


def make_vectors() -> dict[str, Any]:
    return clean({
        "format": "beljour-shade-contract-r30f/1",
        "note": "Synthetic contract vectors; in-house estimates, not product or face results.",
        "tolerance": {"delta_e": 1e-8, "lab": 1e-8},
        "nearest": nearest_cases(),
        "distances": distance_pairs(),
        "catalogues": {kind: load_shade_catalogue(kind).public() for kind in KINDS},
        "coverage": {kind: check_reference_coverage(kind).public() for kind in ("reference", "base")},
        "skn03": skn03_cases(),
        "fibre_photo": fibre_photo(),
        "fibre_plans": fibre_plans(),
        "stability": stability_cases(),
    })


def test_committed_vectors_match_the_python_modules() -> None:
    stored = json.loads(VECTORS.read_text(encoding="utf-8"))
    assert stored == make_vectors()


def test_vector_set_has_the_documented_shape() -> None:
    stored = json.loads(VECTORS.read_text(encoding="utf-8"))
    assert len(stored["nearest"]) == 35 and len(stored["distances"]) == 4
    assert {row["kind"] for row in stored["nearest"]} == set(KINDS)
    assert any(row["id"] is None for row in stored["nearest"])
    assert {row["code"] for row in stored["stability"]} >= {None, "mixed_lighting", "uncorrected_lighting",
                                                             "unstable_swatch", "too_far"}
    for row in stored["distances"]:
        assert abs(row["delta_e"] - row["published"]) < 1e-4
    assert [s["report"]["status"] for s in stored["skn03"]] == [
        "UNPROVEN", "BELOW_TARGET", "BOX_REVIEW_REQUIRED", "UNPROVEN"]


if __name__ == "__main__":
    VECTORS.parent.mkdir(parents=True, exist_ok=True)
    VECTORS.write_text(json.dumps(make_vectors(), separators=(",", ":"), sort_keys=True) + "\n", encoding="utf-8")
