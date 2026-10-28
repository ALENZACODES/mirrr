"""R18B makeup real-face and frozen-1000 contracts. Author: John Khan."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.makeup_w import frozen1000, realface

from .conftest import digest, inset, tint


def make_case(image: np.ndarray, mask: np.ndarray, feature: str = "W1") -> realface.MakeupCase:
    effect = inset(mask, 5)
    after = tint(image, effect, (3, 0, 1))
    protected = np.zeros_like(mask)
    protected[10:14, 12:40] = 1.0
    return realface.MakeupCase(
        case_id="makeup-1",
        feature_id=feature,
        before=image,
        after=after,
        skin_mask=mask,
        effect_mask=effect,
        protected_mask=protected,
        depth_slice="deep",
        undertone_slice="olive",
    )


def test_registry_feature_count_is_derived() -> None:
    ids = realface.registry_feature_ids()
    assert len(ids) == 15
    assert ids == ("W1", "W2", "W4", "W5", "W7", "W8", "W9", "W10", "W11", "W12", "W13", "W14", "W16", "W17", "W18")


def test_every_makeup_feature_has_valid_written_definition() -> None:
    definitions = realface.definitions()
    assert len(definitions) == 15
    for definition in definitions:
        definition.validate()
        assert definition.author == "John Khan"
        assert "not_tested" in " ".join(definition.notes)


def test_makeup_metrics_keep_depth_chroma_texture_and_alpha(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    metrics = realface.measure(make_case(rgba_image, center_mask))
    assert metrics.outside_change_fraction == 0
    assert metrics.protected_max_delta == 0
    assert metrics.alpha_max_delta == 0
    assert metrics.skin_lightening_delta < 2
    assert metrics.deep_skin_chroma_retention > 0.72
    assert metrics.texture_retention > 0.62
    assert metrics.effect_changed_fraction > 0


def test_makeup_evaluation_passes_localized_change(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = make_case(rgba_image, center_mask)
    record = realface.evaluate(case)
    record.validate()
    assert record.status == "passed"


def test_reference_feature_requires_checked_reference_regions(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = make_case(rgba_image, center_mask, "W13")
    record = realface.evaluate(case)
    assert record.status == "not_tested"
    assert "checked_reference_regions" in record.missing
    complete = realface.evaluate(case, available_evidence=("before", "after", "skin_mask", "effect_mask", "checked_reference_regions"))
    assert complete.status == "passed"


def test_global_lightening_fails_guardrail(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = make_case(rgba_image, center_mask)
    after = rgba_image.copy()
    active = center_mask > 0.5
    rgb = after[..., :3].astype(np.int16)
    rgb[active] = np.clip(rgb[active] + 20, 0, 255)
    after[..., :3] = rgb.astype(np.uint8)
    bad = realface.MakeupCase(**{**case.__dict__, "after": after, "effect_mask": center_mask.copy()})
    assert realface.measure(bad).skin_lightening_delta > 2
    assert realface.evaluate(bad).status == "failed"


def test_summary_tracks_deep_olive_slice(rgba_image: np.ndarray, center_mask: np.ndarray) -> None:
    case = make_case(rgba_image, center_mask)
    summary = realface.summarize(((case, realface.evaluate(case)),))
    assert summary["registry_feature_count"] == 15
    assert summary["per_slice"]["depth=deep|undertone=olive"]["passed"] == 1
    assert summary["ready"] is False


def test_frozen_makeup_manifest_uses_registry_count() -> None:
    case = frozen1000.FrozenCase("one", digest(2), ("W1", "W18"), "deep", "olive")
    manifest = frozen1000.FrozenManifest("makeup-set", (case,))
    manifest.validate(require_complete=False)
    counts = frozen1000.feature_case_counts(manifest)
    assert set(counts) == set(realface.registry_feature_ids())
    assert counts["W1"] == 1
    assert frozen1000.required_evaluations(manifest) == 2


def test_frozen_makeup_parse_round_trip_partial() -> None:
    raw = {
        "format": frozen1000.FORMAT,
        "author": "John Khan",
        "dataset_id": "makeup-set",
        "expected_cases": 1000,
        "cases": [{"case_id": "one", "input_sha256": digest(1), "feature_ids": ["W1"], "depth_slice": "deep", "undertone_slice": "olive"}],
    }
    manifest = frozen1000.parse_manifest(raw, require_complete=False)
    assert manifest.cases[0].feature_ids == ("W1",)
    assert len(manifest.sha256) == 64


def test_frozen_makeup_rejects_unknown_feature() -> None:
    with pytest.raises(ValueError, match="registry ids"):
        frozen1000.FrozenCase("one", digest(1), ("W3",), "deep", "olive").validate()


def test_frozen_makeup_completeness_is_exact() -> None:
    case = frozen1000.FrozenCase("one", digest(1), ("W1",), "deep", "olive")
    manifest = frozen1000.FrozenManifest("makeup-set", (case,))
    report = frozen1000.completeness(manifest, (("one", "W1"),))
    assert report["missing"] == ()
    assert report["unexpected"] == ()
    assert report["complete"] is False
