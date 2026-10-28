"""r35f pieces work together: C18 snapshots, calibration, SKN-03 binding, fibre and book.

Synthetic and in-house data only; nothing here is a released-face result.
Author: John Khan.
"""
from __future__ import annotations

import json
from pathlib import Path

from plumb_api.arena.lane_registry import f
from plumb_api.engines.concealer.parity_contract import VECTORS as FIBRE_VECTORS
from plumb_api.engines.hair_palette.book_audit import audit_book
from plumb_api.engines.shade.c18 import C18_KINDS, check_c18_shades, load_c18_shades
from plumb_api.engines.shade.calibration import assess_calibration_gap, committed_distance_limit, probe_reference
from plumb_api.engines.shade.distance import nearest_shade
from plumb_api.engines.shade.finder import extended_reference_table, thresholds
from plumb_api.engines.shade.loaders import load_hair_shades
from plumb_api.engines.shade.skn03_checkpoint import load_skn03_c18_binding, undertone_boundary_vectors

REPO = Path(__file__).resolve().parents[2]


def test_every_r35f_file_is_present_and_registered() -> None:
    for path in (*f.LANE_F_R35_MODULES, *f.LANE_F_R35_TESTS, *f.LANE_F_R35_EVIDENCE):
        assert (REPO / path).is_file(), path
    rows = f.r35_rows(REPO)
    assert len(rows) == 1 and list(rows[0]["modules"]) == list(f.LANE_F_R35_MODULES)


def test_c18_skin_is_the_w6_matching_table_and_binds_skn03() -> None:
    skin = load_c18_shades("skin")
    assert [r.id for r in skin.records] == [row["id"] for row in extended_reference_table()]
    binding = load_skn03_c18_binding()
    assert binding["digest"] == skin.digest and binding["count"] == 96
    assert all(check_c18_shades(load_c18_shades(kind)).ok for kind in C18_KINDS)


def test_calibration_and_checkpoint_share_the_committed_limit() -> None:
    assert committed_distance_limit() == float(thresholds()["confidence"]["refuse_delta_e_above"])
    for edge in undertone_boundary_vectors(max_pairs=8):
        probe = probe_reference(edge.lab)
        match = nearest_shade(edge.lab, load_c18_shades().records)
        assert match is not None and probe.best_id == match.record.id
        assert probe.best_id in (edge.first_id, edge.second_id)


def test_reported_gap_and_stored_evidence_agree() -> None:
    gap = assess_calibration_gap().public()
    stored = json.loads((REPO / "parity/skn03-calibration-r35f.json").read_text(encoding="utf-8"))
    assert stored["gap"] == gap and stored["c18"]["skin"] == load_c18_shades().digest
    assert gap["status"] == "UNPROVEN"


def test_fibre_contract_and_book_audit_cover_their_sources() -> None:
    contract = json.loads(FIBRE_VECTORS.read_text(encoding="utf-8"))
    assert len(contract["cover"]) == 164 and len(contract["pigments"]) == 91
    audit = audit_book()
    assert audit.ok and audit.count == len(load_hair_shades()) == load_c18_shades("hair").count
