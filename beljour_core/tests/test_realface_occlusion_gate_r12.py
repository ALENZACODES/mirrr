"""Protected-boundary evidence cannot be replaced by an empty Q4 success.

Written synthetic contract: annotated scalar faces need four measured turns
against pre-run mask hashes. A 42-face set reproduces a protected-slice regression
hidden by the class aggregate. Missing boundaries stay UNPROVEN; a measured Q4
above 1.5 or any regression fails. These are fabricated measurements, never real
faces or claimed quality observations.
Author: John Khan.
"""
from __future__ import annotations

import copy

import pytest

from .test_realface_gate_r12 import criteria, definitions, gates, observed, planned, run_state


def turn_evidence(classes=("hair", "glasses", "hijab")):
    definition = criteria("warp_turn", len(classes))
    plan = planned(definition)
    rows = []
    for face, name in zip(plan["faces"], classes, strict=True):
        face["labels"]["occlusion"] = name
        face["protected_mask_sha256"] = run_state.digest({"drawn_mask": name})
        face["protected_mask_classes"] = [name]
        for check in definition.content["expected_check_names"]:
            rows.append({"module": "warp_turn", "check": check, "face_id": face["face_id"],
                         "run_id": plan["run_id"], "definition_sha256": definition.sha256,
                         "metric_pass": True, "pass": True, "q1_pass": True, "q3_pass": True,
                         "q4_pass": True, "q4_occluder_pass": True, "fold": False, "nan": False,
                         "shape_ok": True, "strength_used": 0.8, "effect_pass": True,
                         "occluder_mask_supplied": True, "occluder_mask_nonempty": True,
                         "protected_pixels": 40, "q4_occluder_band_pixels": 20,
                         "q4_occluder_measured": True, "q4_occluder_evidence_pass": True,
                         "q4_occluder_ratio_p90": 0.75,
                         "protected_mask_sha256": face["protected_mask_sha256"],
                         "protected_mask_classes": face["protected_mask_classes"]})
    plan["face_set_sha256"] = run_state.digest(plan["faces"])
    return definition, plan, rows


def test_all_three_annotated_boundaries_need_real_measurements_for_a_pass():
    definition, plan, rows = turn_evidence()
    output = observed(definition, plan, rows)
    gate = output["gates"][0]
    assert gate["status"] == "PASS"
    assert {item["class"] for item in gate["occluder_evidence"]} == {"hair", "glasses", "hijab"}
    assert all(item["measured_faces"] == item["annotated_faces"] == item["passed"] == 1
               for item in gate["occluder_evidence"])
    rendered = gates.markdown(output)
    assert "Measured / annotated faces" in rendered
    assert "| glasses | 1/1 | 1/1 | PASS |" in rendered


def test_each_protected_class_keeps_every_registered_slice_and_frozen_annotation_count():
    definition, plan, rows = turn_evidence()
    gate = observed(definition, plan, rows)["gates"][0]
    for item in gate["occluder_evidence"]:
        assert {row["dimension"] for row in item["slices"]} == set(definition.content["slices"])
        for dimension in definition.content["slices"]:
            group = [row for row in item["slices"] if row["dimension"] == dimension]
            assert sum(row["annotated_faces"] for row in group) == item["annotated_faces"]
            assert sum(row["measured_faces"] for row in group) == item["measured_faces"]
            assert sum(row["passed"] for row in group) == item["passed"]
            assert all(row["status"] == "PASS" for row in group)
    assert "Worst registered slice" in gates.markdown(observed(definition, plan, rows))


@pytest.mark.parametrize("change", (
    {"occluder_mask_supplied": False}, {"occluder_mask_nonempty": False},
    {"protected_pixels": 0}, {"q4_occluder_band_pixels": 0},
    {"q4_occluder_band_pixels": True}, {"q4_occluder_measured": False},
    {"q4_occluder_ratio_p90": None}, {"q4_occluder_ratio_p90": float("nan")},
    {"protected_mask_sha256": "different-mask"}, {"protected_mask_classes": ["hijab"]},
    {"protected_pixels": 10**400}, {"q4_occluder_band_pixels": 10**400},
    {"q4_occluder_ratio_p90": 10**400},
))
def test_bare_q4_pass_does_not_replace_a_complete_frozen_boundary(change):
    definition, plan, rows = turn_evidence()
    rows[0].update(change)
    gate = observed(definition, plan, rows)["gates"][0]
    assert gate["overall"]["passed"] == 3, "all geometric quality checks still pass"
    assert gate["status"] == "UNPROVEN"
    hair = next(item for item in gate["occluder_evidence"] if item["class"] == "hair")
    assert hair["measured_faces"] == 0 and hair["status"] == "UNPROVEN"


def test_absent_categories_are_not_inferred_from_unoccluded_faces():
    definition, plan, rows = turn_evidence()
    for face in plan["faces"]:
        face["labels"]["occlusion"] = "none"
        face.pop("protected_mask_classes")
        face.pop("protected_mask_sha256")
    gate = observed(definition, plan, rows)["gates"][0]
    assert gate["status"] == "UNPROVEN"
    assert all(item["annotated_faces"] == item["measured_faces"] == 0
               for item in gate["occluder_evidence"])


def test_annotation_without_a_protection_mask_stays_in_the_coverage_denominator():
    definition, plan, rows = turn_evidence()
    plan["faces"][0].pop("protected_mask_classes")
    plan["faces"][0].pop("protected_mask_sha256")
    gate = observed(definition, plan, rows)["gates"][0]
    hair = next(item for item in gate["occluder_evidence"] if item["class"] == "hair")
    assert hair["annotated_faces"] == 1 and hair["measured_faces"] == 0
    assert gate["status"] == "UNPROVEN"


@pytest.mark.parametrize("label", ("clear glasses", "clear_glasses", "sunglasses"))
def test_reference_glasses_aliases_cannot_hide_unmeasured_occlusion(label):
    definition, plan, rows = turn_evidence()
    plan["faces"][1]["labels"]["occlusion"] = label
    plan["faces"][1].pop("protected_mask_classes")
    gate = observed(definition, plan, rows)["gates"][0]
    glasses = next(item for item in gate["occluder_evidence"] if item["class"] == "glasses")
    assert glasses["annotated_faces"] == 1 and glasses["status"] == "UNPROVEN"


@pytest.mark.parametrize("ratio,expected", ((1.5, "PASS"), (1.50000001, "FAIL")))
def test_protected_q4_threshold_uses_raw_measurement_not_a_rounded_pass_flag(ratio, expected):
    definition, plan, rows = turn_evidence()
    rows[0]["q4_occluder_ratio_p90"] = ratio
    gate = observed(definition, plan, rows)["gates"][0]
    assert gate["overall"]["passed"] == 3
    assert gate["status"] == expected


def test_protected_seam_drop_is_rejected_even_when_the_same_face_already_failed_geometry():
    definition, plan, rows = turn_evidence()
    rows[0]["q1_pass"] = False
    baseline = gates.evaluate(rows, {definition.id: definition}, plan)
    rows[0]["q4_occluder_ratio_p90"] = 2.0
    current = gates.evaluate(rows, {definition.id: definition}, plan, baseline=baseline)
    assert current["gates"][0]["overall"] == baseline["gates"][0]["overall"]
    assert current["regression"]["status"] == "FAIL"
    assert any("protected-boundary pass rate dropped" in note for note in current["regression"]["reasons"])


def test_losing_previous_boundary_measurements_is_a_regression():
    definition, plan, rows = turn_evidence()
    baseline = gates.evaluate(rows, {definition.id: definition}, plan)
    rows[0]["q4_occluder_band_pixels"] = 0
    current = gates.evaluate(rows, {definition.id: definition}, plan, baseline=baseline)
    assert current["regression"]["status"] == "FAIL"
    assert any("coverage dropped" in note for note in current["regression"]["reasons"])


def balanced_turn_evidence():
    """40 hair faces and two other occluders; two fixed Q1 failures stay below 5%."""
    definition, plan, rows = turn_evidence(("hair",) * 40 + ("glasses", "hijab"))
    for index, face in enumerate(plan["faces"]):
        tone = "1" if index < 21 else "10"
        face["labels"].update(monk=tone, monk_gender_age=f"{tone}/female/30-39")
    for row in rows:
        if row["face_id"] in {"synthetic-0", "synthetic-21"}:
            row.update(q1_pass=False, metric_pass=False)
            row["pass"] = False
    plan["face_set_sha256"] = run_state.digest(plan["faces"])
    return definition, plan, rows


@pytest.mark.parametrize("kind", ("rate", "coverage"))
def test_protected_slice_drop_cannot_hide_behind_offsetting_improvement_on_42_faces(kind):
    definition, plan, rows = balanced_turn_evidence()
    old_rows, new_rows = copy.deepcopy(rows), copy.deepcopy(rows)
    for collection, identity in ((old_rows, "synthetic-0"), (new_rows, "synthetic-21")):
        for row in collection:
            if row["face_id"] != identity:
                continue
            if kind == "rate":
                row.update(q4_occluder_ratio_p90=2.0, q4_occluder_pass=False, q4_occluder_evidence_pass=False)
            else:
                row["q4_occluder_band_pixels"] = 0
    baseline = gates.evaluate(old_rows, {definition.id: definition}, plan)
    current = gates.evaluate(new_rows, {definition.id: definition}, plan, baseline=baseline)
    previous, gate = baseline["gates"][0], current["gates"][0]
    assert gate["overall"] == previous["overall"] == {"passed": 40, "total": 42, "rate": 40 / 42}
    assert gate["slices"] == previous["slices"], "the combined geometry slices do not see this drop"
    old_hair = next(item for item in previous["occluder_evidence"] if item["class"] == "hair")
    hair = next(item for item in gate["occluder_evidence"] if item["class"] == "hair")
    for field in ("annotated_faces", "measured_faces", "passed", "total", "rate"):
        assert hair[field] == old_hair[field], "the aggregate class also stays flat"
    old_slice = next(item for item in old_hair["slices"] if item["dimension"] == "monk" and item["value"] == "10")
    new_slice = next(item for item in hair["slices"] if item["dimension"] == "monk" and item["value"] == "10")
    assert old_slice["annotated_faces"] == new_slice["annotated_faces"] == 19
    assert old_slice["measured_faces"] == old_slice["passed"] == 19
    assert new_slice["passed"] == 18
    assert new_slice["status"] == ("FAIL" if kind == "rate" else "UNPROVEN")
    assert gate["metric_status"] == ("FAIL" if kind == "rate" else "UNPROVEN")
    assert current["selected_status"] == current["regression"]["status"] == "FAIL"
    assert any("warp_turn/hair/monk=10" in reason and
               ("pass rate dropped" if kind == "rate" else "coverage dropped") in reason
               for reason in current["regression"]["reasons"])
    assert "monk=10: 18/19 passed" in gates.markdown(current) if kind == "rate" else hair["slices"][0]["value"] == "10"


@pytest.mark.parametrize("mutation", (
    lambda item: item.pop("slices"),
    lambda item: item.update(slices=None),
    lambda item: item.update(slices=[]),
    lambda item: item.update(slices=[None]),
    lambda item: item["slices"].append(copy.deepcopy(item["slices"][0])),
    lambda item: item["slices"].pop(0),
    lambda item: item["slices"][0].update(annotated_faces=True),
    lambda item: item["slices"][0].update(measured_faces=-1),
    lambda item: item["slices"][0].update(rate=0.5),
    lambda item: item["slices"][0].update(dimension=[]),
    lambda item: item["slices"][0].update(status=[]),
    lambda item: item["slices"][0].update(measured_faces=0, passed=0, total=0, rate=None, status="UNPROVEN"),
))
def test_malformed_protected_slice_baseline_is_unproven_without_crashing(mutation):
    definition, plan, rows = turn_evidence()
    current = gates.evaluate(rows, {definition.id: definition}, plan)
    malformed = copy.deepcopy(current)
    mutation(malformed["gates"][0]["occluder_evidence"][0])
    with pytest.raises(ValueError):
        gates.validate_baseline(malformed)
    status, reasons = gates.compare_baseline(current, malformed)
    assert status == "UNPROVEN" and "invalid" in reasons[0]


def test_unmeasured_protected_annotations_still_have_to_partition_the_frozen_class():
    definition, plan, rows = balanced_turn_evidence()
    for row in rows:
        if row["face_id"] == "synthetic-0":
            row["q4_occluder_band_pixels"] = 0
    current = gates.evaluate(rows, {definition.id: definition}, plan)
    malformed = copy.deepcopy(current)
    hair = next(item for item in malformed["gates"][0]["occluder_evidence"] if item["class"] == "hair")
    part = next(item for item in hair["slices"] if item["dimension"] == "monk" and item["value"] == "1")
    assert part["measured_faces"] == 20 and part["annotated_faces"] == 21
    part["annotated_faces"] = 20  # Numerically valid locally, but hides one frozen annotation.
    with pytest.raises(ValueError, match="annotation counts do not partition"):
        gates.validate_baseline(malformed)
    assert gates.compare_baseline(current, malformed)[0] == "UNPROVEN"


@pytest.mark.parametrize("mutation", ("missing", "count", "ratio", "class", "status"))
def test_malformed_occluder_baseline_cannot_authorize_pass(mutation):
    definition, plan, rows = turn_evidence()
    baseline = gates.evaluate(rows, {definition.id: definition}, plan)
    gate = baseline["gates"][0]
    if mutation == "missing":
        gate.pop("occluder_evidence")
    elif mutation == "count":
        gate["occluder_evidence"][0]["measured_faces"] = 100
    elif mutation == "ratio":
        gate["occluder_evidence"][0]["rate"] = 0.7
    elif mutation == "status":
        gate["occluder_evidence"][0]["status"] = []
    else:
        gate["occluder_evidence"][0]["class"] = "invented"
    output = gates.evaluate(rows, {definition.id: definition}, plan, baseline=baseline)
    assert output["selected_status"] == "UNPROVEN"
    assert output["regression"]["status"] == "UNPROVEN"


@pytest.mark.parametrize("change", (
    None, {"classes": ["hair", "glasses"]}, {"classes": ["hair", None, "hijab"]},
    {"minimum_faces_per_class": 0}, {"minimum_boundary_pixels": 0}, {"maximum_q4_ratio": 1.6},
))
def test_written_turn_definition_cannot_omit_or_weaken_protected_boundary_evidence(change):
    definition = definitions.load_definition("warp_turn")
    data = copy.deepcopy(definition.content)
    if change is None:
        data.pop("occluder_evidence")
    else:
        data["occluder_evidence"].update(change)
    with pytest.raises(definitions.DefinitionError, match="warp_turn"):
        definitions.validate(data, "warp_turn")
