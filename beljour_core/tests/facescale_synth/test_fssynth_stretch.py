"""Tests for the stress curriculum, per-trait contact sheets and the extra stressors.

All images are drawn in code; files go to temporary folders only.
Author: John Khan.
"""

from __future__ import annotations

from collections import Counter
from pathlib import Path

import numpy as np
import pytest

from lab.facescale_synth import policy
from lab.facescale_synth.curriculum import (
    CURRICULUM_FORMAT,
    build_curriculum,
    focus_rates,
    iter_curriculum,
    trait_weights,
    write_curriculum,
)
from lab.facescale_synth.fairness.traits import TraitTags
from lab.facescale_synth.stress import lighting
from lab.facescale_synth.stress.contact import FOOTER, contact_sheet, write_contact_sheet
from lab.facescale_synth.stress.face import draw_face
from lab.facescale_synth.stress.geometry import FaceSpec
from lab.facescale_synth.stress.occluders import add_occluder
from lab.facescale_synth.stress.scene import StressRates
from lab.facescale_synth.stress.stream import portrait_config


def _cell(family: str, value: str, status: str, n: int = 100) -> dict[str, object]:
    return {"slice": [[family, value]], "status": status, "n": n}


REPORT: dict[str, object] = {
    "cells": [
        _cell("fitzpatrick", "VI", "FAIL"),
        _cell("fitzpatrick", "I", "PASS"),
        _cell("vitiligo", "generalised", "UNPROVEN", n=8),
        _cell("glasses", "yes", "PASS"),
        _cell("vitiligo_coverage", ">30%", "FAIL"),
        {"slice": [["fitzpatrick", "VI"], ["beard", "full"]], "status": "FAIL", "n": 50},
    ]
}


def test_trait_weights_favour_failing_and_thin_values() -> None:
    weights = trait_weights(REPORT)
    assert weights[("fitzpatrick", "VI")] == 4.0
    assert weights[("vitiligo", "generalised")] == 2.0
    assert weights[("fitzpatrick", "I")] == 1.0
    assert ("vitiligo_coverage", ">30%") not in weights
    assert all(len(key) == 2 for key in weights)


def test_focus_rates_raise_low_recall_families() -> None:
    summary = {
        "buckets": {
            "rotation": {"0-15": {"recall": 0.95}, "90-180": {"recall": 0.4}},
            "lighting": {"none": {"recall": 0.99}},
        }
    }
    base = StressRates()
    rates = focus_rates(summary, base)
    assert rates.rotation == pytest.approx(min(1.0, base.rotation * 2))
    assert rates.lighting == base.lighting
    assert focus_rates(None, base) == base


def test_curriculum_document_is_stamped_and_weighted(tmp_path: Path) -> None:
    document = build_curriculum(REPORT, 77, 2000)
    assert document["format"] == CURRICULUM_FORMAT
    policy.check_stamp(document)
    assert "never used for training" in str(document["note"])
    items = document["items"]
    assert isinstance(items, list) and len(items) == 2000
    picked = Counter(tuple(item["force"].items())[0] for item in items)
    assert picked[("fitzpatrick", "VI")] > 2 * picked[("fitzpatrick", "I")]
    assert picked[("glasses", True)] > 0
    path = write_curriculum(tmp_path / "plan" / "curriculum.json", document)
    assert path.exists()
    with pytest.raises(policy.UsageRefused):
        write_curriculum(policy.REPO_ROOT / "docs" / "curriculum.json", document)


def test_curriculum_streams_pinned_faces_for_test_use_only() -> None:
    document = build_curriculum(REPORT, 5, 12)
    base = portrait_config(64, 64)
    items = list(iter_curriculum(document, base, "test"))
    assert [item.index for item in items] == list(range(12))
    plan = document["items"]
    assert isinstance(plan, list)
    for item, wanted in zip(items, plan, strict=True):
        family, value = next(iter(wanted["force"].items()))
        assert item.label.faces[0].traits[family] == value
    with pytest.raises(policy.UsageRefused):
        next(iter_curriculum(document, base, "train"))
    tampered = dict(document)
    tampered["train_allowed"] = True
    with pytest.raises(policy.UsageRefused):
        next(iter_curriculum(tampered, base, "test"))


def test_contact_sheet_rows_and_footer(tmp_path: Path) -> None:
    sheet = contact_sheet("head_covering", per_value=3, size=48)
    assert sheet.shape == (4 * 48 + 24, 150 + 3 * 48, 3)
    assert sheet[-12:, :].mean() < sheet[:-24, 150:].mean()
    assert FOOTER.endswith("test only")
    path = write_contact_sheet(tmp_path / "debug" / "covering", sheet)
    assert path.suffix == ".png" and path.read_bytes()[:4] == b"\x89PNG"
    with pytest.raises(policy.UsageRefused):
        write_contact_sheet(tmp_path / "demo" / "covering", sheet)


def test_contact_sheet_validation() -> None:
    with pytest.raises(ValueError):
        contact_sheet("eye_colour")
    with pytest.raises(ValueError):
        contact_sheet("fitzpatrick", ["VII"])
    with pytest.raises(ValueError):
        contact_sheet("vitiligo_coverage", per_value=1, size=32)
    flags = contact_sheet("glasses", per_value=1, size=40)
    assert flags.shape[0] == 2 * 40 + 24


@pytest.mark.parametrize("kind", ["microphone", "phone"])
def test_extra_occluders(kind: str) -> None:
    tags = TraitTags(fitzpatrick="IV", age_band="30-39")
    render = draw_face(FaceSpec(size=160, tone=0.5, tags=tags))
    before = render.image.copy()
    record = add_occluder(render, kind, 1.0, np.random.default_rng(2))
    changed = np.abs(render.image.astype(int) - before.astype(int)).sum(axis=2) > 0
    assert changed.sum() > 100
    assert record.kind == kind
    if kind == "microphone":
        x, y = render.geometry.mouth_top
        assert changed[int(y), int(x)]
        assert render.other[int(y), int(x)] == 255


def test_extra_lighting_models() -> None:
    grey = np.full((64, 64, 3), 128, np.uint8)
    spot, record = lighting.light(grey, "spotlight", 1.0, np.random.default_rng(0))
    assert int(np.max(spot)) > int(np.min(spot)) + 60 and "centre" in record
    split, _ = lighting.light(grey, "split_tone", 1.0, np.random.default_rng(0))
    red_minus_blue = split[..., 0].astype(int) - split[..., 2].astype(int)
    assert red_minus_blue.max() > 40 and red_minus_blue.min() < -40
