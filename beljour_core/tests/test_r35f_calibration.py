"""SKN-03 source calibration: probes, 288 boundary vectors, negative controls and the gap.

Source-derived synthetic Lab vectors only; never person observations. Also writes and
checks parity/skn03-calibration-r35f.json (regenerate with
`cd api && python3 -m tests.test_r35f_calibration`). Author: John Khan.
"""
from __future__ import annotations

import dataclasses
import json
import random
from pathlib import Path
from typing import Any

import pytest

from plumb_api.engines import shade
from plumb_api.engines.shade.c18 import C18_KINDS, load_c18_shades
from plumb_api.engines.shade.calibration import (
    BOUNDARY_FRACTIONS,
    assess_calibration_gap,
    audit_probes,
    audit_synthetic_boundary_vectors,
    committed_distance_limit,
    negative_controls,
    probe_reference,
    synthetic_boundary_vectors,
)
from plumb_api.engines.shade.distance import nearest_shade

ROOT = Path(__file__).resolve().parents[2]
VECTORS = ROOT / "parity/skn03-calibration-r35f.json"


def test_committed_limit_is_unchanged() -> None:
    assert committed_distance_limit() == 6.0


def test_probe_statuses() -> None:
    matched = probe_reference((60, 12, 18))
    assert (matched.status, matched.named, matched.runner_up_id) == ("matched", "LG-08N", "LG-09N")
    assert matched.margin is not None and matched.margin > 0
    assert probe_reference((10, 5, 5)).status == "too_deep"
    far = probe_reference((50, -60, 60))
    assert far.status == "too_far" and far.named is None and far.best_id is not None
    record = load_c18_shades().records[5]
    twin = dataclasses.replace(record, id="ZZ-TWIN")
    tie = probe_reference(record.lab, (record, twin))
    assert (tie.status, tie.named, tie.best_id, tie.margin) == ("tie", None, record.id, 0.0)
    with pytest.raises(ValueError):
        probe_reference((float("nan"), 0, 0))


def test_288_boundary_vectors_map_back_to_their_source() -> None:
    vectors = synthetic_boundary_vectors()
    assert len(vectors) == 288 == 3 * 96
    assert {v.fraction for v in vectors} == set(BOUNDARY_FRACTIONS)
    by_id = {r.id: r for r in load_c18_shades().records}
    for v in vectors:
        assert by_id[v.source_id].undertone != by_id[v.toward_id].undertone
        assert 0 <= by_id[v.source_id].lab[0] - v.lab[0] <= 0.8 + 1e-9  # inside the 1.0 L* allowance
    audit = audit_synthetic_boundary_vectors()
    assert (audit.total, audit.exact, audit.wrong_accepted, audit.refused) == (288, 288, 0, 0)
    assert audit.minimum_exact == 274 and audit.additional_required == 0


def test_negative_controls_all_hold() -> None:
    controls = negative_controls()
    assert len(controls) == 192
    assert all(c.passed for c in controls)
    assert {c.probe.status for c in controls if c.kind == "tie"} == {"tie"}
    for c in controls:
        if c.kind == "no_lightening":
            assert c.probe.best_id != c.reference_id


def test_audit_keeps_every_case_in_the_denominator() -> None:
    records = load_c18_shades().records
    cases = [(records[0].lab, records[0].id), (records[0].lab, records[1].id), ((50, -60, 60), records[2].id)]
    audit = audit_probes(cases)
    assert (audit.total, audit.exact, audit.wrong_accepted, audit.refused) == (3, 1, 1, 1)
    assert audit.minimum_exact == 3 and audit.additional_required == 2
    for bad in ([], "ab", [((50, 0, 0),)], [((50, 0, 0), 7)]):
        with pytest.raises(ValueError):
            audit_probes(bad)  # type: ignore[arg-type]


def test_synthetic_audit_never_closes_the_real_gap() -> None:
    body = assess_calibration_gap().public()
    assert body["reported_percent"] == 93.9 and body["percentage_point_gap"] == 1.1
    assert body["synthetic"]["exact"] == 288 and body["negative_controls"] == {"passed": 192, "total": 192}
    assert body["status"] == "UNPROVEN" and body["synthetic_closes_real_gap"] is False and body["release_pass"] is False
    assert assess_calibration_gap(95.0).gap_percentage_points == 0.0
    for bad in (float("nan"), -1.0, 101.0, True, "93.9"):
        with pytest.raises(ValueError):
            assess_calibration_gap(bad)  # type: ignore[arg-type]
    assert shade.assess_calibration_gap is assess_calibration_gap and shade.probe_reference is probe_reference


def make_vectors() -> dict[str, Any]:
    rng = random.Random(3535)
    probes = []
    for _ in range(40):
        lab = (round(rng.uniform(15, 85), 4), round(rng.uniform(-2, 24), 4), round(rng.uniform(0, 32), 4))
        probes.append(probe_reference(lab).public())
    return {
        "format": "beljour-skn03-calibration-vectors/1",
        "note": "Source-derived synthetic Lab vectors; not person observations.",
        "limit": committed_distance_limit(),
        "c18": {kind: load_c18_shades(kind).digest for kind in C18_KINDS},
        "boundary": [v.public() | {"named": probe_reference(v.lab).named} for v in synthetic_boundary_vectors()],
        "controls": [{"kind": c.kind, "reference": c.reference_id, "status": c.probe.status,
                      "best": c.probe.best_id, "passed": c.passed} for c in negative_controls()],
        "probes": probes,
        "gap": assess_calibration_gap().public(),
    }


def test_committed_calibration_vectors_match() -> None:
    stored = json.loads(VECTORS.read_text(encoding="utf-8"))
    assert stored == json.loads(json.dumps(make_vectors()))
    assert len(stored["boundary"]) == 288 and len(stored["controls"]) == 192


def test_probes_agree_with_nearest_shade() -> None:
    for row in json.loads(VECTORS.read_text(encoding="utf-8"))["probes"]:
        match = nearest_shade(row["lab"], load_c18_shades().records)
        assert (match.record.id if match else None) == row["best"]


if __name__ == "__main__":
    VECTORS.write_text(json.dumps(make_vectors(), separators=(",", ":"), sort_keys=True) + "\n", encoding="utf-8")
