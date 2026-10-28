"""Batch scoring from a JSON manifest of drawn PNG pairs written to tmp_path.

Author: John Khan.
"""

from __future__ import annotations

import io
import json
from pathlib import Path

import numpy as np
import pytest
from numpy.typing import NDArray
from PIL import Image

from lab.ml.critic import Critic, featurise, make_dataset, make_sample, train_critic
from lab.ml.critic.batch import ManifestError, read_manifest, score_batch
from lab.ml.critic.cli import main

SIZE = 80


def png(path: Path, array: NDArray[np.float64] | NDArray[np.bool_]) -> str:
    data = np.asarray(np.round(np.asarray(array, dtype=np.float64) * 255), dtype=np.uint8)
    Image.fromarray(data).save(path)
    return path.name


def write_batch(folder: Path, kinds: list[str | None]) -> Path:
    entries = []
    for index, kind in enumerate(kinds):
        sample = make_sample(np.random.default_rng(100 + index), kind, 0.9, SIZE)
        assert sample.mask is not None
        entries.append({
            "id": f"pair-{index}-{kind or 'clean'}",
            "before": png(folder / f"b{index}.png", sample.before),
            "after": png(folder / f"a{index}.png", sample.after),
            "mask": png(folder / f"m{index}.png", sample.mask),
        })
    manifest = folder / "manifest.json"
    manifest.write_text(json.dumps(entries), encoding="utf-8")
    return manifest


@pytest.fixture(scope="module")
def critic() -> Critic:
    data = featurise(make_dataset(200, seed=61, size=SIZE))
    return train_critic(data.features, data.labels)


def test_batch_summary_counts_and_orders(critic: Critic, tmp_path: Path) -> None:
    manifest = write_batch(tmp_path, [None, None, "seam", "plastic_skin"])
    summary = score_batch(critic, read_manifest(manifest))
    assert len(summary.scored) == 4
    assert summary.pass_rate() == pytest.approx(0.5)
    worst = summary.worst(2)
    assert {row.item_id for row in worst} == {"pair-2-seam", "pair-3-plastic_skin"}
    assert sum(summary.reason_counts().values()) >= 2
    text = summary.to_markdown()
    assert "not validated on real faces" in text
    assert "| pair-2-seam |" in text


def test_unreadable_pairs_are_listed_not_fatal(critic: Critic, tmp_path: Path) -> None:
    manifest = write_batch(tmp_path, [None])
    entries = json.loads(manifest.read_text(encoding="utf-8"))
    entries.append({"id": "missing", "before": "nope.png", "after": "nope.png"})
    manifest.write_text(json.dumps(entries), encoding="utf-8")
    summary = score_batch(critic, read_manifest(manifest))
    assert [row.item_id for row in summary.failed_to_read] == ["missing"]
    assert "Unreadable pairs" in summary.to_markdown()


@pytest.mark.parametrize(
    ("payload", "message"),
    [
        ({}, "JSON list"),
        ([3], "not an object"),
        ([{"before": "a.png"}], "'after'"),
        ([{"before": "a", "after": "b", "mask": 4}], "mask must be"),
        ([{"id": "x", "before": "a", "after": "b"}, {"id": "x", "before": "a", "after": "b"}],
         "duplicate ids"),
    ],
)
def test_bad_manifests_are_rejected(tmp_path: Path, payload: object, message: str) -> None:
    path = tmp_path / "bad.json"
    path.write_text(json.dumps(payload), encoding="utf-8")
    with pytest.raises(ManifestError, match=message):
        read_manifest(path)


def test_missing_manifest_is_rejected(tmp_path: Path) -> None:
    with pytest.raises(ManifestError, match="cannot read manifest"):
        read_manifest(tmp_path / "none.json")


def test_empty_batch_summary(critic: Critic) -> None:
    summary = score_batch(critic, [])
    assert summary.pass_rate() == 0.0
    assert summary.realism().size == 0


def test_batch_command(critic: Critic, tmp_path: Path) -> None:
    stem = tmp_path / "critic"
    critic.save(stem)
    manifest = write_batch(tmp_path, [None, "halo"])
    target = tmp_path / "summary.md"
    out = io.StringIO()
    code = main(["batch", str(manifest), "--model", str(stem), "--out", str(target)], out)
    assert code == 0
    assert "Worst pairs" in target.read_text(encoding="utf-8")
    assert main(["batch", str(tmp_path / "none.json"), "--model", str(stem)], out) == 2
