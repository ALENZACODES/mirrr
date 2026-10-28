"""The identity drift report: statistics, slices, and the gate that stays UNPROVEN.

Uses the PROXY embedder on drawn faces; the gate must never read PASSED with it.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json

import numpy as np
import pytest
from numpy.typing import NDArray

from lab.ml.critic import FaceBox
from lab.ml.identity import (
    FAILED,
    PASSED,
    UNPROVEN,
    AdmissionRecord,
    EditPair,
    GeometryProxyEmbedder,
    ProvenanceLink,
    admit_embedder,
    draw_face,
    drift_report,
    measure_batch,
    nudge,
    random_geometry,
)
from lab.ml.identity.drift import DriftItem

WEIGHTS = b"made-up weights for the drift test"


class ColourSpreadEmbedder:
    """Test-only admitted embedder: normalised per-channel spread of the face box."""

    @property
    def name(self) -> str:
        return "colour-spread-test"

    @property
    def version(self) -> str:
        return "1"

    def embed(self, image: NDArray[np.float64], box: FaceBox) -> NDArray[np.float64]:
        crop = image[box.y:box.y + box.h, box.x:box.x + box.w].reshape(-1, 3)
        vector = np.concatenate([crop.mean(axis=0), [0.2]])
        return np.asarray(vector / np.linalg.norm(vector), dtype=np.float64)


def admitted_spread() -> object:
    record = AdmissionRecord("colour-spread-test", "1", "BSD-3-Clause", True,
                             hashlib.sha256(WEIGHTS).hexdigest(),
                             (ProvenanceLink("drawn-squares", "dataset", "CC0-1.0", True),))
    return admit_embedder(ColourSpreadEmbedder(), record, weights=WEIGHTS, excluded=frozenset())


def edit_batch(count: int, amount: float, seed: int) -> list[EditPair]:
    rng = np.random.default_rng(seed)
    batch = []
    for index in range(count):
        geometry = random_geometry(rng, tone=index % 3)
        source = draw_face(geometry, rng=rng)
        edit = draw_face(nudge(geometry, amount, rng), rng=rng)
        batch.append(EditPair(f"edit-{index}", f"tone-{geometry.tone}", source.image,
                              source.box, edit.image, edit.box))
    return batch


def test_proxy_report_measures_but_stays_unproven() -> None:
    proxy = GeometryProxyEmbedder()
    items = measure_batch(proxy, edit_batch(9, 0.05, 1))
    report = drift_report(items, proxy, limit=0.05)
    assert report.gate == UNPROVEN
    assert not report.admitted
    assert any("PROXY" in reason for reason in report.reasons)
    assert report.count == 9
    assert 0.0 <= report.mean <= report.worst


def test_slices_cover_every_item() -> None:
    proxy = GeometryProxyEmbedder()
    report = drift_report(measure_batch(proxy, edit_batch(9, 0.05, 2)), proxy, 0.05)
    assert [item.name for item in report.slices] == ["tone-0", "tone-1", "tone-2"]
    assert sum(item.count for item in report.slices) == report.count
    assert max(item.worst for item in report.slices) == pytest.approx(report.worst)


def test_statistics_on_known_distances() -> None:
    items = [DriftItem("a", "x", 0.01), DriftItem("b", "x", 0.2), DriftItem("c", "y", 0.05)]
    report = drift_report(items, GeometryProxyEmbedder(), limit=0.1)
    assert report.mean == pytest.approx(0.26 / 3)
    assert (report.worst, report.worst_id, report.over_limit) == (0.2, "b", 1)
    by_name = {item.name: item for item in report.slices}
    assert by_name["x"].mean == pytest.approx(0.105)
    assert by_name["y"].over_limit == 0


def test_admitted_embedder_can_pass_and_fail() -> None:
    embedder = admitted_spread()
    items = [DriftItem("a", "x", 0.01), DriftItem("b", "x", 0.02)]
    assert drift_report(items, embedder, limit=0.05).gate == PASSED
    failing = drift_report(items + [DriftItem("c", "y", 0.4)], embedder, limit=0.05)
    assert failing.gate == FAILED
    assert "1 of 3 edits" in failing.reasons[0]


def test_admitted_embedder_measures_drawn_edits() -> None:
    embedder = admitted_spread()
    assert hasattr(embedder, "embed")
    batch = edit_batch(4, 0.0, 3)
    items = measure_batch(embedder, batch)  # type: ignore[arg-type]
    assert all(item.distance == pytest.approx(0.0, abs=1e-3) for item in items)


def test_empty_batch_is_unproven() -> None:
    report = drift_report([], admitted_spread(), limit=0.1)
    assert report.gate == UNPROVEN
    assert "no edits were measured" in report.reasons
    with pytest.raises(ValueError, match="limit"):
        drift_report([], None, limit=-1.0)


def test_no_embedder_is_unproven() -> None:
    report = drift_report([DriftItem("a", "x", 0.0)], None, limit=0.1)
    assert report.gate == UNPROVEN
    assert report.embedder == "(none)"


def test_markdown_and_json_outputs() -> None:
    proxy = GeometryProxyEmbedder()
    report = drift_report(measure_batch(proxy, edit_batch(3, 0.1, 4)), proxy, 0.05)
    text = report.to_markdown()
    assert "Identity gate: **UNPROVEN**" in text
    assert "NOT admitted" in text
    assert "| tone-0 |" in text
    payload = json.loads(report.to_text())
    assert payload["identity_gate"] == "UNPROVEN"
    assert payload["admitted"] is False
    assert len(payload["slices"]) == 3
