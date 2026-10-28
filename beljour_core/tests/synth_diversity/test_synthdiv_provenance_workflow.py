"""Corpus provenance workflow: shards, roster, counts, overlap, allowlist, slices.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

from lab.synth_diversity.stress_provenance_checkpoint import CheckpointStore
from lab.synth_diversity.stress_provenance_counts import count_shards
from lab.synth_diversity.stress_provenance_fixtures import (
    FIXTURE_NOW,
    fixture_approvals,
    fixture_records,
    fixture_sketches,
)
from lab.synth_diversity.stress_provenance_ledger import read_shard, write_shard
from lab.synth_diversity.stress_provenance_overlap import scan_overlap, training_allowlist
from lab.synth_diversity.stress_provenance_resume_fixtures import (
    fixture_receipts,
    fixture_spec,
    tags_for,
)
from lab.synth_diversity.stress_provenance_roster import (
    build_roster,
    load_roster,
    reconcile_roster,
    write_roster,
)
from lab.synth_diversity.stress_provenance_slices import slice_audit


def test_end_to_end_fixture_workflow(tmp_path: Path) -> None:
    ledger = tmp_path / "ledger"
    shards = [read_shard(write_shard(ledger, f"{pool}-1",
                                     [r for r in fixture_records() if r.pool == pool]))
              for pool in ("own_render", "sfhq", "research_test")]
    totals = {"own_render": 3, "sfhq": 2, "research_test": 2, "quarantine": 0}
    write_roster(tmp_path / "roster", build_roster(shards, totals))
    verified = reconcile_roster(load_roster(tmp_path / "roster"), ledger)
    records = tuple(record for shard in verified for record in shard.records)
    counts = count_shards([shard.path for shard in verified], fixture_approvals(), FIXTURE_NOW)
    assert counts.to_dict()["by_disposition"]["TRAIN_ELIGIBLE"] == 3
    receipt = scan_overlap(records, fixture_sketches("own-0001"))
    allowed = training_allowlist(records, receipt, fixture_approvals(),
                                 {"own-0001", "own-0002", "own-0003"}, FIXTURE_NOW)
    assert allowed == ("own-0002",)
    audit = slice_audit(records, tags_for(records), set(allowed))
    assert sum(audit.eligible[name] for name in audit.raw if name.startswith("acne=")) == 1
    spec = fixture_spec()
    checkpoint, state = CheckpointStore(tmp_path, spec).commit(
        list(fixture_receipts(spec, 2)), None)
    assert state.completed == 2 and checkpoint.sequence == 0
