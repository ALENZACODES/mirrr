"""R19 cross-boundary evidence tests. All inputs are synthetic and non-identifying."""
from __future__ import annotations

import itertools
import math

import pytest

from plumb_api.commerce.evidence import (
    CosmeticSignal,
    ShadeEvidence,
    build_evidence,
    explain_ranking,
    parse_signals,
    stable_evidence_id,
    validate_evidence,
)


def sample_product(depth: int = 4, undertone: str = "warm") -> dict:
    return {"id": f"quiet-veil-{depth:02d}-{undertone}", "formula_id": "quiet-veil",
            "category": "complexion", "depth": depth, "undertone": undertone,
            "finish": "natural", "vto": "foundation", "concerns": ["redness"]}


def sample_profile() -> dict:
    return {"depth": 4, "undertone": "warm", "confidence": "manual", "lightness": None}


def sample_rows() -> list[dict]:
    return [{"product": sample_product(), "score": 151}]


def test_provider_aliases_are_bounded_validated_and_sorted() -> None:
    scores = parse_signals([{"concern": "wrinkle", "raw_score": 18.49},
                            {"concern": "wrinkles", "raw_score": 31},
                            {"concern": "sebum", "raw_score": 61},
                            {"concern": "unlicensed-scanner", "raw_score": 4},
                            {"concern": "texture", "raw_score": float("nan")},
                            {"concern": "redness", "raw_score": True},
                            {}, None])
    assert scores.scores() == {"oiliness": 61, "wrinkles": 18}
    assert scores.rejected.duplicate == 1
    assert scores.rejected.unknown == 1
    assert scores.rejected.malformed == 3
    assert scores.rejected.missing == 1
    assert len(scores.observations) == 2
    assert scores.observations[-1].aliases_seen == 1


@pytest.mark.parametrize("source", ["manual", "local", "youcam"])
def test_source_without_provider_does_not_claim_server_cost(source: str) -> None:
    evidence = build_evidence(source, sample_profile(), [], sample_rows())
    public = evidence.public()
    assert public["simulation"] and public["product_tested"] is False
    assert public["clinical_claims"] is False
    assert public["provider_calls"] == 0
    assert validate_evidence(public)
    assert not any(k in str(public).lower() for k in ("photo_id", "base64", "landmark"))


def test_provider_cache_cannot_claim_new_units() -> None:
    with pytest.raises(ValueError, match="cached"):
        build_evidence("youcam", sample_profile(), [], sample_rows(), units=1, cached=True)
    cached = build_evidence("youcam", sample_profile(), [], sample_rows(), cached=True)
    assert cached.public()["provider_calls"] == 0
    spent = build_evidence("youcam", sample_profile(), [], sample_rows(), units=2)
    assert spent.public()["provider_calls"] == 1
    assert spent.public()["units_spent"] == 2
    with pytest.raises(ValueError, match="nonprovider"):
        build_evidence("manual", sample_profile(), [], sample_rows(), units=1)


def test_unmatched_foundation_is_an_error_not_a_nearby_product() -> None:
    shade = ShadeEvidence.from_profile(sample_profile(), "local", ())
    with pytest.raises(ValueError, match="unmatched"):
        explain_ranking([{"product": sample_product(5), "score": 170}],
                        shade, parse_signals([]))
    with pytest.raises(ValueError, match="unmatched"):
        explain_ranking([{"product": sample_product(4, "cool"), "score": 170}],
                        shade, parse_signals([]))


def test_evidence_id_is_stable_for_nonidentifying_metadata() -> None:
    first = build_evidence("manual", sample_profile(), [], sample_rows())
    second = build_evidence("manual", {**sample_profile(), "lightness": 73.5}, [], sample_rows())
    assert first.evidence_id == second.evidence_id
    different = build_evidence("manual", {**sample_profile(), "undertone": "cool"}, [],
                               [{"product": sample_product(4, "cool"), "score": 160}])
    assert first.evidence_id != different.evidence_id
    assert first.evidence_id == stable_evidence_id(first.shade, first.signals, first.ranking)


def test_reject_missing_input_and_unbounded_scores() -> None:
    bad = [float("nan"), math.inf, -1, 101, True, "42", {}, None]
    for value in bad:
        result = parse_signals([{"concern": "redness", "raw_score": value}])
        assert result.scores() == {}
    with pytest.raises(ValueError):
        parse_signals([], limit=33)
    with pytest.raises(ValueError):
        CosmeticSignal("diagnosis", 10, "youcam")
    with pytest.raises(ValueError):
        CosmeticSignal("pore", 10.1, "youcam")


def test_fake_score_vectors_are_idempotent_when_duplicated() -> None:
    names = ("redness", "texture", "oiliness", "moisture", "spots", "wrinkles")
    for group in itertools.combinations(names, 3):
        rows = [{"concern": name, "raw_score": (idx * 13 + 8) % 100} for idx, name in enumerate(group)]
        first = parse_signals(rows)
        twice = parse_signals(rows + rows)
        assert first.scores() == twice.scores()
        assert twice.rejected.duplicate == 3
        assert [x.name for x in first.observations] == sorted(group)


def test_signal_cap_is_deterministic_and_does_not_read_later_rows() -> None:
    values = [{"concern": "redness", "raw_score": 70}] * 32 + [
        {"concern": "redness", "raw_score": 1}]
    found = parse_signals(values)
    assert found.scores()["redness"] == 70
    assert found.rejected.overflow == 1


def test_public_output_cannot_validate_without_simulation_disclosure() -> None:
    envelope = build_evidence("local", sample_profile(), [], sample_rows()).public()
    for changed in ({"simulation": False}, {"product_tested": True},
                    {"clinical_claims": True}, {"evidence_id": "x"}):
        assert not validate_evidence({**envelope, **changed})


def test_provider_numeric_scores_reject_huge_integers_and_other_nonfinite_values() -> None:
    rows = [
        {"concern": "texture", "raw_score": 10 ** 400},
        {"concern": "pore", "raw_score": float("-inf")},
        {"concern": "spots", "raw_score": False},
        {"concern": "oiliness", "raw_score": 75.5},
    ]
    batch = parse_signals(rows)
    assert batch.scores() == {"oiliness": 76}
    assert batch.rejected.malformed == 3
