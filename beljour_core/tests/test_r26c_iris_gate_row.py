"""Iris criterion-row compatibility without changing committed thresholds.

All cases are synthetic, and a row never asserts a human-quality PASS.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from plumb_api.engines.eyes.iris_quality import iris_tone_quality, measured_gate_row
from plumb_api.engines.eyes.iris_trial import IrisTrialEngine
from tests.r26c_iris_cases import Observed, scene


@pytest.mark.parametrize("hidden", [None, "left", "right"])
def test_measured_criterion_fields_match_existing_iris_schema(hidden: str | None) -> None:
    image, observation = scene(hidden=hidden)
    trial = IrisTrialEngine(Observed(observation)).render(image, box=(0, 0, 1, 1))
    quality = iris_tone_quality(image, trial.image, observation.masks)
    row = measured_gate_row(
        quality, visible_irises=trial.visible_irises,
        undeclared_missing=trial.undeclared_missing,
        shape_observed=True, guard_called=trial.guard_called,
    )
    assert row["outside_unchanged"] is True
    assert row["catchlight_unchanged"] is True
    assert row["shape_ok"] is True
    assert row["visible_irises"] == (1 if hidden else 2)
    assert row["undeclared_missing"] == []
    assert row["guard_called"] is True
    assert row["quality_verdict"] == "UNPROVEN"


def test_no_mesh_quality_cannot_create_a_shape_pass() -> None:
    image, observation = scene()
    trial = IrisTrialEngine(Observed(observation)).render(image, box=(0, 0, 1, 1))
    quality = iris_tone_quality(image, trial.image, observation.masks)
    unknown = measured_gate_row(
        quality, visible_irises=trial.visible_irises, undeclared_missing=(),
        shape_observed=None, guard_called=True,
    )
    assert unknown["shape_ok"] is None
    assert unknown["quality_verdict"] == "UNPROVEN"


def test_declared_unobserved_side_is_not_reported_as_full_two_eye_coverage() -> None:
    image, observation = scene(hidden="right")
    trial = IrisTrialEngine(Observed(observation)).render(image, box=(0, 0, 1, 1))
    quality = iris_tone_quality(image, trial.image, observation.masks)
    evidence = measured_gate_row(
        quality, visible_irises=trial.visible_irises,
        undeclared_missing=trial.undeclared_missing,
        shape_observed=True, guard_called=trial.guard_called,
    )
    assert evidence["visible_irises"] == 1
    assert evidence["undeclared_missing"] == []
    assert quality.right.status == "NOT_MEASURED"


@pytest.mark.parametrize("bad", [-1, 3, 2.3, "2", None])
def test_visible_iris_count_must_be_measured_and_bounded(bad: object) -> None:
    image, observation = scene()
    trial = IrisTrialEngine(Observed(observation)).render(image, box=(0, 0, 1, 1))
    quality = iris_tone_quality(image, trial.image, observation.masks)
    with pytest.raises(ValueError, match="visible iris count"):
        measured_gate_row(
            quality, visible_irises=bad, undeclared_missing=(),
            shape_observed=True, guard_called=True,
        )


def test_quality_row_rejects_fabricated_missing_geometry() -> None:
    image, observation = scene()
    trial = IrisTrialEngine(Observed(observation)).render(image, box=(0, 0, 1, 1))
    quality = iris_tone_quality(image, trial.image, observation.masks)
    with pytest.raises(ValueError, match="shape evidence"):
        measured_gate_row(
            quality, visible_irises=2, undeclared_missing=(),
            shape_observed="assumed", guard_called=True,
        )


def test_old_iris_definition_file_is_left_untouched() -> None:
    root = Path(__file__).resolve().parents[2]
    file = root / "tests" / "realface" / "pass_definitions_gatefixc" / "iris.json"
    assert file.exists(), "the previously committed iris definition must remain present"
    content = json.loads(file.read_text(encoding="utf-8"))
    assert content["threshold"]["overall"] == 0.95
    assert content["threshold"]["every_slice"] == 0.95
    assert content["rules"]["*"][3]["field"] == "visible_irises"
    assert content["rules"]["*"][4]["field"] == "undeclared_missing"
