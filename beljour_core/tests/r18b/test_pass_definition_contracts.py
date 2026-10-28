"""R18B pass-definition completeness and evaluation contracts. Author: John Khan."""
from __future__ import annotations

import pytest

from plumb_api.arena.r17b_evidence import evaluate_definition, summarize_group
from plumb_api.engines.gender_look import realface as gender
from plumb_api.engines.hair_women import realface as hair
from plumb_api.engines.lips import realface as lips
from plumb_api.engines.makeup_w import realface as makeup
from plumb_api.engines.skin_more import realface as skin
from plumb_api.engines.smile import realface as smile


SHA = "f" * 64


def _metric_values(definition: object, *, pass_values: bool) -> dict[str, float | bool]:
    values: dict[str, float | bool] = {}
    for rule in definition.rules:
        if isinstance(rule.threshold, bool):
            values[rule.name] = rule.threshold if pass_values else not rule.threshold
        elif rule.direction == "max":
            values[rule.name] = float(rule.threshold) - 0.01 if pass_values else float(rule.threshold) + 1.0
        elif rule.direction == "min":
            values[rule.name] = float(rule.threshold) + 0.01 if pass_values else float(rule.threshold) - 1.0
        else:
            values[rule.name] = float(rule.threshold) if pass_values else float(rule.threshold) + 1.0
    return values


def test_hair_definitions_exactly_cover_registry_owned_features() -> None:
    definitions = hair.definitions()
    ids = tuple(item.id.split(".")[-1].upper() for item in definitions)
    assert ids == hair.registry_feature_ids()
    assert len({item.sha256 for item in definitions}) == len(definitions)
    assert all(item.author == "John Khan" for item in definitions)


def test_makeup_definitions_exactly_cover_registry_owned_features() -> None:
    definitions = makeup.definitions()
    ids = tuple(item.id.split(".")[-1].upper() for item in definitions)
    assert ids == makeup.registry_feature_ids()
    assert all(item.group == "makeup_w" for item in definitions)
    assert all(item.rules for item in definitions)


def test_lip_definitions_exactly_cover_registry_owned_features() -> None:
    definitions = lips.definitions()
    ids = tuple(item.id.split(".")[-1].upper() for item in definitions)
    assert ids == lips.registry_feature_ids()
    assert "W54" in ids
    assert "W57" in ids


def test_smile_definitions_exactly_cover_dental_and_motion_features() -> None:
    definitions = smile.definitions()
    ids = tuple(item.id.split(".")[-1].upper() for item in definitions)
    assert ids == smile.registry_feature_ids()
    assert set(ids) == {"W50", "W51", "W52", "W53", "W58"}


def test_skin_definitions_exactly_cover_w77_to_w92() -> None:
    definitions = skin.definitions()
    ids = tuple(item.id.split(".")[-1].upper() for item in definitions)
    assert ids == skin.registry_feature_ids()
    assert ids[0] == "W77"
    assert ids[-1] == "W92"
    assert len(ids) == 16


def test_gender_definitions_cover_normal_extra_hyper() -> None:
    definitions = gender.definitions()
    assert tuple(item.id.rsplit(".", 1)[-1] for item in definitions) == ("normal", "extra", "hyper")
    assert set(gender.definition_map()) == {"normal", "extra", "hyper"}


@pytest.mark.parametrize(
    "definitions",
    (hair.definitions(), makeup.definitions(), lips.definitions(), smile.definitions(), skin.definitions(), gender.definitions()),
)
def test_every_definition_has_unique_metric_names_and_required_evidence(definitions: tuple[object, ...]) -> None:
    for definition in definitions:
        definition.validate()
        assert len({rule.name for rule in definition.rules}) == len(definition.rules)
        assert len(set(definition.required_evidence)) == len(definition.required_evidence)
        assert all(rule.description.strip() for rule in definition.rules)


@pytest.mark.parametrize(
    "definition",
    (
        hair.definitions()[0],
        makeup.definitions()[0],
        lips.definitions()[0],
        smile.definitions()[0],
        skin.definitions()[0],
        gender.definitions()[0],
    ),
)
def test_missing_prerequisite_is_not_tested_not_failed(definition: object) -> None:
    record = evaluate_definition(
        definition,
        case_id="case",
        input_sha256=SHA,
        available_evidence=(),
        metrics=_metric_values(definition, pass_values=True),
    )
    assert record.status == "not_tested"
    assert record.missing
    assert record.metrics == {}


@pytest.mark.parametrize(
    "definition",
    (
        hair.definitions()[0],
        makeup.definitions()[0],
        lips.definitions()[0],
        smile.definitions()[0],
        skin.definitions()[0],
        gender.definitions()[0],
    ),
)
def test_passing_metrics_produce_pass_record(definition: object) -> None:
    record = evaluate_definition(
        definition,
        case_id="case",
        input_sha256=SHA,
        available_evidence=definition.required_evidence,
        metrics=_metric_values(definition, pass_values=True),
    )
    assert record.status == "passed"
    assert record.definition_sha256 == definition.sha256
    assert set(record.metrics) == {rule.name for rule in definition.rules}


@pytest.mark.parametrize(
    "definition",
    (
        hair.definitions()[0],
        makeup.definitions()[0],
        lips.definitions()[0],
        smile.definitions()[0],
        skin.definitions()[0],
        gender.definitions()[0],
    ),
)
def test_failing_metric_produces_failed_record(definition: object) -> None:
    metrics = _metric_values(definition, pass_values=True)
    first = definition.rules[0]
    if isinstance(first.threshold, bool):
        metrics[first.name] = not first.threshold
    elif first.direction == "max":
        metrics[first.name] = float(first.threshold) + 100
    elif first.direction == "min":
        metrics[first.name] = float(first.threshold) - 100
    else:
        metrics[first.name] = float(first.threshold) + 100
    record = evaluate_definition(
        definition,
        case_id="case",
        input_sha256=SHA,
        available_evidence=definition.required_evidence,
        metrics=metrics,
    )
    assert record.status == "failed"
    assert record.missing == ()


def test_group_summary_keeps_not_tested_distinct_from_failed() -> None:
    definition = makeup.definitions()[0]
    passed = evaluate_definition(
        definition,
        case_id="pass",
        input_sha256=SHA,
        available_evidence=definition.required_evidence,
        metrics=_metric_values(definition, pass_values=True),
    )
    not_tested = evaluate_definition(
        definition,
        case_id="missing",
        input_sha256=SHA,
        available_evidence=(),
        metrics={},
    )
    summary = summarize_group("makeup", (passed, not_tested))
    assert summary.total == 2
    assert summary.tested == 1
    assert summary.passed == 1
    assert summary.failed == 0
    assert summary.not_tested == 1
    assert summary.ready is False
