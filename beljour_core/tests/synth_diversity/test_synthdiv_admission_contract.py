"""Admitted identity and count invariants of the admission result.
Author: John Khan.
"""

from __future__ import annotations

from lab.synth_diversity.stress_provenance import DISPOSITIONS
from lab.synth_diversity.stress_provenance_admission import (
    ADMISSION_SCHEMA,
    AdmissionResult,
    admit_records,
)
from lab.synth_diversity.stress_provenance_fixtures import (
    FIXTURE_NOW,
    fixture_approvals,
    fixture_records,
    fixture_sketches,
)
from lab.synth_diversity.stress_provenance_witness_fixtures import (
    fixture_trust,
    fixture_witness_receipts,
)


def result(contaminate: str | None = None) -> AdmissionResult:
    receipts = fixture_witness_receipts(sketches=fixture_sketches(contaminate))
    return admit_records(fixture_records(), "e" * 64, receipts, fixture_trust(),
                         fixture_approvals(), FIXTURE_NOW)


def test_allowlist_is_sorted_unique_and_own_render_only() -> None:
    for contaminate in (None, "own-0001", "own-0003"):
        allowed = result(contaminate).allowlist
        assert list(allowed) == sorted(set(allowed))
        pools = {r.record_id: r.pool for r in fixture_records()}
        assert all(pools[name] == "own_render" for name in allowed)


def test_counts_reconcile_with_inventory() -> None:
    data = result("own-0002").to_dict()
    assert sum(data["by_pool"].values()) == len(fixture_records())
    assert sum(data["by_disposition"].values()) == len(fixture_records())
    assert set(data["by_disposition"]) == set(DISPOSITIONS)
    eligible = data["by_disposition"]["TRAIN_ELIGIBLE"]
    assert data["admitted"] + data["eligible_but_excluded"] == eligible


def test_document_holds_ids_and_digests_only() -> None:
    data = result().to_dict()
    assert data["schema"] == ADMISSION_SCHEMA
    assert data["contains_image_data"] is False
    assert not {"sketch", "pixels", "path", "key"} & set(data)


def test_result_digest_is_deterministic() -> None:
    assert result().digest == result().digest
    assert result().digest != result("own-0001").digest
