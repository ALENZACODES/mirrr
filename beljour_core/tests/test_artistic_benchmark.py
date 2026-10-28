"""Fail-closed local metrics, no-photo reporting and honest slices. Author: John Khan."""
from __future__ import annotations

import json

import numpy as np
import pytest

from plumb_api.filters.artistic import EFFECTS
from plumb_api.filters.artistic.benchmark import DEFINITION_VERSION, aggregate, check_metrics, evaluate
from tests.artistic_helpers import drawn


@pytest.mark.parametrize("effect", EFFECTS)
def test_evaluator_measures_neutral_repeat_and_input_lock(effect: str) -> None:
    image, mesh, hair, eyes = drawn()
    params = {"adult_confirmed": True} if effect == "rain-expression" else {}
    row = evaluate(effect, image, mesh, hair_mask=hair, eye_mask=eyes, params=params)
    assert row["status"] == "passed", row
    assert row["quality_status"] == "Not tested"
    assert row["metrics"]["zero_max_error"] == 0
    assert row["metrics"]["repeat_max_error"] == 0
    assert row["metrics"]["input_unchanged"] is True
    assert row["metrics"]["elapsed_ms"] > 0
    serialized = json.dumps(row, allow_nan=False)
    assert "displacement_x" not in serialized and "landmarks" not in serialized
    assert "image" not in row and "path" not in row


def test_missing_hair_is_unavailable_not_a_silent_pass() -> None:
    image, mesh, _, _ = drawn()
    row = evaluate("meadow-crown", image, mesh)
    assert row["status"] == "unavailable"
    assert row["reason"] == "missing_hair_mask"
    assert row["metrics"] == {}


def test_unknown_age_expression_is_unavailable_and_never_inferred_from_pixels() -> None:
    image, mesh, _, _ = drawn()
    row = evaluate("rain-expression", image, mesh)
    assert row["status"] == "unavailable"
    assert row["reason"] == "adult_confirmation_required"
    assert row["quality_status"] == "Not tested"


def test_noop_is_not_counted_as_successful_default_art() -> None:
    image, mesh, _, _ = drawn()
    row = evaluate("meadow-crown", image, mesh, hair_mask=np.ones(image.shape[:2]))
    assert row["status"] == "failed"
    assert "changed_pixels" in row["failures"]


@pytest.mark.parametrize("value", [None, "0", True, float("nan"), float("inf"), 0.1])
def test_metrics_cannot_replace_exact_protection_with_a_success_flag(value: object) -> None:
    image, mesh, hair, eyes = drawn()
    row = evaluate("ink-study", image, mesh, hair_mask=hair, eye_mask=eyes)
    metrics = {**row["metrics"], "hair_max_error": value}
    assert "hair_max_error" in check_metrics("ink-study", metrics)


def test_invalid_input_error_does_not_echo_user_supplied_data() -> None:
    image, mesh, _, _ = drawn()
    row = evaluate("rain-expression", image, mesh, params={"sensitive-filename.jpg": 2})
    assert row["status"] == "failed"
    assert "sensitive" not in json.dumps(row)
    assert row["reason"] == "ValueError"


def test_group_availability_remains_in_denominator() -> None:
    image, mesh, hair, _ = drawn()
    okay = evaluate("meadow-crown", image, mesh, hair_mask=hair)
    unavailable = evaluate("meadow-crown", image, mesh)
    rows = [{"group": "monk:8", "result": okay} for _ in range(18)]
    rows += [{"group": "monk:8", "result": unavailable} for _ in range(2)]
    report = aggregate(rows, required_groups=["monk:8"])
    assert report["groups"][0]["n"] == 20
    assert report["groups"][0]["pass_rate"] == 0.9
    assert report["status"] == "failed"
    assert report["quality_status"] == "Not tested"


def test_small_unknown_missing_and_empty_groups_stay_unproven() -> None:
    image, _, _, _ = drawn()
    row = evaluate("pigment-oil", image)
    small = aggregate([{"group": "monk:2", "result": row}])
    unknown = aggregate([{"result": row}] * 20)
    missing = aggregate([{"group": "monk:2", "result": row}] * 20, required_groups=["monk:10"])
    for report in (small, unknown, missing, aggregate([])):
        assert report["status"] == "unproven"
    assert missing["missing_groups"] == ["monk:10"]


def test_aggregate_rejects_wrong_definition_and_invalid_labels() -> None:
    base = {"feature": "pigment-oil", "definition": DEFINITION_VERSION, "status": "passed", "metrics": {}}
    with pytest.raises(ValueError):
        aggregate([{"group": "name\nprivate", "result": base}])
    with pytest.raises(ValueError):
        aggregate([{"group": "monk:2", "result": {**base, "definition": "old"}}])
    with pytest.raises(ValueError):
        aggregate([], minimum_group_faces=0)

