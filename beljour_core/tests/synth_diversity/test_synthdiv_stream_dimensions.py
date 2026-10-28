"""Summary counts reconcile by pool, generator, source class and disposition.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from lab.synth_diversity.stress_provenance_fixtures import fixture_sketches
from lab.synth_diversity.stress_provenance_stream_fixtures import build_world
from lab.synth_diversity.stress_provenance_stream_verify import verify_and_export


def summary(tmp_path: Path, contaminate: str | None = None,
            shard_size: int = 2) -> dict[str, Any]:
    world = build_world(tmp_path / "w", sketches=fixture_sketches(contaminate),
                        shard_size=shard_size)
    return verify_and_export(world.roster, world.ledger, world.stream, world.trust,
                             world.registry, world.now, tmp_path / "allow.jsonl").to_dict()


def test_every_dimension_sums_to_the_inventory(tmp_path: Path) -> None:
    data = summary(tmp_path)
    for name in ("by_pool", "by_generator", "by_source_class", "by_disposition"):
        assert sum(data[name].values()) == 7
    assert data["by_source_class"] == {"original_3d": 3, "research": 2, "sfhq": 2}


def test_excluded_records_are_still_counted(tmp_path: Path) -> None:
    data = summary(tmp_path, "own-0003")
    assert data["admitted"] == 2
    assert data["excluded_contaminated"] == 1
    assert data["by_disposition"]["TRAIN_ELIGIBLE"] == 3


def test_shard_layout_does_not_change_counts(tmp_path: Path) -> None:
    one = summary(tmp_path / "one", shard_size=1)
    many = summary(tmp_path / "many", shard_size=5)
    for name in ("by_pool", "by_generator", "by_disposition", "admitted",
                 "allowlist_sha256", "inventory_sha256"):
        assert one[name] == many[name]
    assert one["roster_sha256"] != many["roster_sha256"]
