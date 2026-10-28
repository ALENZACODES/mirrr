"""R32F acceptance accounting: identifiers only, no photos or measurements.

Pass definition: a successful reading is counted apart from a correct reference
identity; refusals and missing labels stay in the denominator; synthetic records
can never give a real-face or product-validation pass. Author: John Khan.
"""
from __future__ import annotations

import pytest

from plumb_api.engines.shade.skin_evidence import summarize_accuracy

MIXED: list[dict[str, object]] = [
    {"expected_id": "LG-07N", "predicted_id": "LG-07N"},
    {"expected_id": "LG-07N", "predicted_id": "LG-08N"},
    {"expected_id": "LG-07N", "predicted_id": None},
    {"expected_id": None, "predicted_id": "LG-03W"},
    {"expected_id": None, "predicted_id": None},
]


def test_accepted_and_correct_identity_are_counted_apart() -> None:
    summary = summarize_accuracy(MIXED)
    assert (summary.total, summary.accepted, summary.exact) == (5, 3, 1)
    assert summary.wrong_accepted == 1
    assert summary.accepted_unlabelled == 1
    assert summary.refused == 2
    assert (summary.labelled, summary.missing_labels) == (3, 2)


def test_refusals_and_missing_labels_stay_in_the_denominator() -> None:
    summary = summarize_accuracy(MIXED)
    assert summary.exact_rate == pytest.approx(1 / 5)
    assert summary.acceptance_rate == pytest.approx(3 / 5)
    assert summarize_accuracy(MIXED[:1]).exact_rate == 1.0
    assert summarize_accuracy([]).exact_rate == 0.0


def test_synthetic_records_never_pass_real_face_or_product_validation() -> None:
    perfect = [{"expected_id": "LG-07N", "predicted_id": "LG-07N"}] * 20
    summary = summarize_accuracy(perfect, target=0.95)
    assert summary.meets_target
    public = summary.public()
    assert public["evidence"] == "synthetic"
    assert public["real_face_pass"] is False
    assert public["product_validation"] is False


def test_real_face_pass_needs_full_labels_and_a_met_target() -> None:
    labelled = [{"expected_id": f"S{i}", "predicted_id": f"S{i}", "kind": "released_person"} for i in range(19)]
    miss = {"expected_id": "S19", "predicted_id": "S0", "kind": "released_person"}
    assert summarize_accuracy([*labelled, miss], target=0.95).real_face_pass
    assert not summarize_accuracy([*labelled, miss], target=0.96).real_face_pass
    unlabelled = {"expected_id": None, "predicted_id": None, "kind": "released_person"}
    assert not summarize_accuracy([*labelled, unlabelled], target=0.9).real_face_pass
    assert not summarize_accuracy(labelled).real_face_pass
    one_synthetic = {"expected_id": "X", "predicted_id": "X", "kind": "synthetic"}
    mixed = summarize_accuracy([*labelled, one_synthetic], target=0.95)
    assert mixed.meets_target and not mixed.real_face_pass
    assert mixed.public()["product_validation"] is False


@pytest.mark.parametrize("record", [
    {"expected_id": "", "predicted_id": None},
    {"expected_id": "x" * 65, "predicted_id": None},
    {"expected_id": 7, "predicted_id": None},
    {"expected_id": "A", "predicted_id": "B", "kind": "real"},
])
def test_malformed_records_are_refused(record: dict[str, object]) -> None:
    with pytest.raises(ValueError):
        summarize_accuracy([record])


@pytest.mark.parametrize("target", [0, -0.1, 1.01, float("nan"), True])
def test_target_must_be_a_share(target: float) -> None:
    with pytest.raises(ValueError):
        summarize_accuracy(MIXED, target=target)


def test_public_summary_holds_counts_only() -> None:
    public = summarize_accuracy(MIXED).public()
    assert public["format"] == "beljour-skin-accuracy-summary/1"
    assert public["kinds"] == {"synthetic": 5, "released_person": 0}
    assert "LG-07N" not in repr(public)
