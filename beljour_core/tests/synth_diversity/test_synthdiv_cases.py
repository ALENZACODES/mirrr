"""Stable trait slices and image-free regression forwarding schema tests.
Author: John Khan.
"""

from __future__ import annotations

import json

import pytest

from lab.synth_diversity.cases import (
    FAILURE_CODES,
    case_identity,
    declared_slice_labels,
    observation_jsonl,
    pair_slice_label,
    regression_observation,
)
from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.plan import make_plans
from lab.synth_diversity.types import TRAIT_VALUES, SyntheticInputError


def test_case_identity_is_stable_across_equal_inputs() -> None:
    face = make_drawn_face(seed=3)
    plans = make_plans(2, 123)
    first = case_identity(face, plans[0])
    again = case_identity(face, plans[0])
    different = case_identity(face, plans[1])
    assert first == again
    assert first.key.startswith("S21-")
    assert first.key != different.key
    assert first.test_only is True
    assert first.train_allowed is False
    assert first.source_id == "S02"
    assert first.base_id == face.base_id
    assert first.seed == plans[0].seed
    assert first.tags == plans[0].tags


def test_slices_use_exact_declared_vocabulary_and_order() -> None:
    plan = make_plans(1, 19)[0]
    names = declared_slice_labels(plan)
    assert len(names) == len(TRAIT_VALUES) == 12
    assert [name.partition("=")[0] for name in names] == list(TRAIT_VALUES)
    assert names[0].startswith("fitzpatrick=")
    assert any(name.startswith("vitiligo=") for name in names)
    assert any(name.startswith("albinism=") for name in names)
    assert not any("vitiligo_coverage" in name for name in names)


def test_pair_slice_order_is_canonical_and_commutative() -> None:
    plan = make_plans(1, 20)[0]
    first = pair_slice_label(plan, "fitzpatrick", "vitiligo")
    second = pair_slice_label(plan, "vitiligo", "fitzpatrick")
    assert first == second
    assert first.startswith("fitzpatrick=")
    assert "|vitiligo=" in first
    with pytest.raises(SyntheticInputError, match="distinct"):
        pair_slice_label(plan, "scar", "scar")
    with pytest.raises(SyntheticInputError, match="distinct"):
        pair_slice_label(plan, "unknown", "scar")


def test_observation_is_only_schema_whitelisted_nonimage_metadata() -> None:
    face = make_drawn_face()
    identity = case_identity(face, make_plans(1, 12)[0])
    record = regression_observation(
        identity,
        owner_lane="B",
        effect_id="tone_model",
        failure_code="SKIN_HUE_DRIFT",
        measured_value=17.3,
        limit_value=15.0,
        units="degrees",
    )
    payload = observation_jsonl([record])
    parsed = json.loads(payload)
    assert parsed["source_id"] == "S21"
    assert parsed["train_allowed"] is False
    assert parsed["test_only"] is True
    assert parsed["failure_code"] == "SKIN_HUE_DRIFT"
    assert parsed["measured_value"] == 17.3
    assert parsed["limit_value"] == 15.0
    assert parsed["case_key"] == identity.key
    assert "image" not in parsed
    assert "path" not in parsed
    assert "pixel" not in parsed
    assert "landmarks" not in parsed
    assert "faces" not in parsed


def test_observation_bytes_are_deterministic_and_terminated() -> None:
    face = make_drawn_face()
    identity = case_identity(face, make_plans(1, 24)[0])
    observations = [
        regression_observation(identity, "S", "fx1", failure, 1.2, 0.9, "fraction")
        for failure in FAILURE_CODES
    ]
    assert observation_jsonl(observations) == observation_jsonl(observations)
    assert observation_jsonl(observations).count(b"\n") == len(FAILURE_CODES)
    assert observation_jsonl(observations).endswith(b"\n")
    assert observation_jsonl([]) == b""


@pytest.mark.parametrize("failure", ["unclassified", "SKIN_DEPTH", "", "BAD_TAG"])
def test_invalid_failure_label_is_never_forwarded(failure: str) -> None:
    identity = case_identity(make_drawn_face(), make_plans(1, 25)[0])
    with pytest.raises(SyntheticInputError, match="unknown"):
        regression_observation(identity, "B", "fx1", failure, 1.0, 0.5, "ratio")


def test_no_personal_identifiers_or_url_paths_in_routing_tokens() -> None:
    identity = case_identity(make_drawn_face(), make_plans(1, 26)[0])
    for owner, effect in (("https://example.invalid", "fx"), ("B", "../../photo.png")):
        with pytest.raises(SyntheticInputError, match="ASCII"):
            regression_observation(
                identity,
                owner,
                effect,
                "RENDER_ERROR",
                measured_value=1.0,
                limit_value=0.0,
                units="count",
            )


def test_nonfinite_observations_cannot_be_serialized() -> None:
    identity = case_identity(make_drawn_face(), make_plans(1, 27)[0])
    with pytest.raises(SyntheticInputError, match="finite"):
        regression_observation(identity, "B", "tone", "SKIN_HUE_DRIFT", float("nan"), 15, "deg")
    with pytest.raises(SyntheticInputError, match="finite"):
        regression_observation(identity, "B", "tone", "SKIN_HUE_DRIFT", 18, float("inf"), "deg")
