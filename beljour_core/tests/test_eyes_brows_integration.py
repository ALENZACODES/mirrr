"""Lane B integration, registry, private evidence and acceptance accounting.

Only mathematical specimens and temporary metadata are used. No real faces are
claimed to have passed by these tests. Author: John Khan.
"""
from __future__ import annotations

import copy
import importlib.util
import json
import sys
from pathlib import Path

import numpy as np
import pytest

from plumb_api.arena import eyes_brows_registry as extension
from plumb_api.arena import registry, women
from plumb_api.engines.brows import render_brows
from plumb_api.engines.eyes import render_eyes
from plumb_api.engines.eyes.specimens import specimen
from plumb_api.filters.artistic import render

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tests" / "realface"))
from eyes_brows.aggregate import aggregate, compare, markdown, summarize  # noqa: E402
from eyes_brows.checkpoint import Journal, atomic_json  # noqa: E402
from eyes_brows.criteria import FEATURES, definition, definition_hash, normalize_observation  # noqa: E402
from eyes_brows.evaluate import evaluate  # noqa: E402
from eyes_brows.evidence import evidence_hash, group_labels, parse, path_for  # noqa: E402

SHA = "c" * 64
LABELS = {"source": "licensed", "race": "provided", "gender": "female", "age": "30-39", "monk": "6",
          "size": "large", "yaw": "frontal", "occlusion": "none", "anatomy": ["open"]}


def sidecar(**values):
    _, mesh, traces = specimen(64, 80, alpha=True)
    return {"format": "beljour-eyes-brows-evidence/1", "image_sha256": SHA, "width": 64, "height": 80,
            "provenance": "checked_manual", "landmarks": mesh.tolist(), "observed_lashes": traces,
            "anatomy": {"right": "open", "left": "hooded"}, **values}


def payload(value):
    return json.dumps(value).encode()


def rows(sha=SHA, state="PASS"):
    return [{"image_sha256": sha, "feature": feature, "status": state, "labels": copy.deepcopy(LABELS),
             "metrics": {"elapsed_ms": 2.5, "outside_changed_pixels": 0}, "visual_quality": "UNTESTED"}
            for feature in FEATURES]


def plan(sha=SHA):
    return {"format": "test-private-run", "selected": [sha], "criteria": definition_hash(), "code": "first"}


def test_additive_registry_marks_only_lane_b_w_features_built():
    before = registry.women_rows()
    effective = registry.effective_women_rows()
    owned = set(extension.EYE_IDS + extension.BROW_IDS)
    assert len(owned) == 17 and "W68" not in owned
    for old, new in zip(before, effective, strict=True):
        if old["id"] in owned:
            assert new["status"] == "built"
            assert new["tested"] == "Not tested"
            assert new["implementation_provider"] == "local procedural fallback"
        else:
            assert new == old
    assert women.validate_women(effective) == []
    assert extension.validate() == []
    assert registry.women_rows() == before


def test_extension_preserves_other_lane_builds_and_later_measured_result():
    base = registry.women_rows()
    base[67] = {**base[67], "status": "built", "modules": ["lane-a"], "tests": ["lane-a-test"]}
    expected = copy.deepcopy(base[67])
    base[58] = {**base[58], "status": "built", "result": "later-run", "tested": "Passed", "scores": {"realism": 8.2}}
    after = extension.effective_women_rows(base)
    assert after[67] == expected
    assert after[58]["result"] == "later-run" and after[58]["tested"] == "Passed"
    assert base[59]["status"] != after[59]["status"]


def test_four_filters_have_own_names_and_concrete_modules():
    data = extension.artistic_rows()
    assert [row["id"] for row in data] == ["ink-study", "pigment-oil", "rain-expression", "meadow-crown"]
    assert {row["source_row"] for row in data} == {15, 16, 18, 21}
    for row in data:
        assert row["simulation_label"] and row["provider"] == "local"
        assert row["status"] == "Built" and row["tested"] == "Not tested"
        assert all((ROOT / path).exists() for path in row["modules"] + row["tests"])


@pytest.mark.parametrize("feature", extension.EYE_IDS)
def test_eye_public_api_respects_zero_strength_and_observations(feature):
    image, mesh, traces = specimen(64, 80, alpha=True)
    original = image.copy()
    result = render_eyes(image, mesh, {"feature": feature, "amount": 0, "observed_lashes": traces,
                                       "anatomy": {"right": "monolid", "left": "deep_set"}})
    assert np.array_equal(result.image, image)
    assert np.array_equal(image, original)
    assert result.image is not image
    assert "simulation" in result.report["label"].lower()


@pytest.mark.parametrize("feature", extension.BROW_IDS)
def test_brow_public_api_keeps_identity_and_requires_adult_where_needed(feature):
    image, mesh, _ = specimen(64, 80, alpha=True)
    options = {"amount": 0}
    if feature in ("W71", "W72"):
        with pytest.raises(ValueError):
            render_brows(image, mesh, feature, options)
        options["adultConfirmed"] = True
    result = render_brows(image, mesh, feature, options)
    assert np.array_equal(result.image, image)
    assert "simulation" in result.label.lower()


@pytest.mark.parametrize("feature", extension.FILTER_IDS)
def test_artistic_public_api_has_identity_alpha_and_no_source_mutation(feature):
    image, mesh, _ = specimen(64, 80, alpha=True)
    before = image.copy()
    result = render(feature, image, landmarks=mesh, hair_mask=np.zeros(image.shape[:2]),
                    eye_mask=np.zeros(image.shape[:2]), params={"amount": 0, **({"adult_confirmed": True} if feature == "rain-expression" else {})})
    assert np.array_equal(result.image, image)
    assert np.array_equal(image, before)
    assert "simulation" in result.label.lower()


def test_all_box_modules_run_and_missing_evidence_never_becomes_pass():
    image, mesh, traces = specimen(80, 96, alpha=True)
    no_evidence = evaluate(image, None)
    assert [row["feature"] for row in no_evidence] == list(FEATURES)
    assert all(row["status"] != "PASS" for row in no_evidence if row["feature"] != "pigment-oil")
    measured = evaluate(image, mesh, {"anatomy": {"right": "open", "left": "hooded"},
                                     "observed_lashes": traces, "hair_mask": np.zeros(image.shape[:2])}, LABELS)
    assert [row["feature"] for row in measured] == list(FEATURES)
    assert all(row["visual_quality"] == "UNTESTED" for row in measured)
    assert all(row["status"] in {"PASS", "FAIL", "UNPROVEN"} for row in measured)
    assert all(isinstance(row["metrics"], dict) for row in measured)


def test_definition_covers_each_feature_before_inference():
    rules = definition()
    assert set(rules["spec_tests"]) == set(FEATURES)
    assert rules["expected_sets"] == {"frozen-10000": 10000, "frozen-100000": 100000}
    assert rules["minimum_group_faces"] == 30
    assert rules["maximum_group_gap"] == .03
    assert rules["minimum_eligible_rate"] == .95
    assert len(definition_hash()) == 64
    assert rules["missing"] == rules["small_group"] == rules["unknown_metadata"] == "UNPROVEN"


@pytest.mark.parametrize("age,band", [(12, "60+"), (65, "70+"), (19, "20-29"),
                                    (True, "unknown"), (False, "unknown"), (18.0, "unknown"),
                                    (-1, "unknown"), (121, "unknown")])
def test_checked_age_rejects_conflicts_and_coercion_before_rendering(age, band):
    image, _, _ = specimen(64, 80, alpha=True)
    with pytest.raises(ValueError, match="checked exact age"):
        evaluate(image, None, {"age_years": age}, {"age": band})


def test_checked_minor_gets_verified_refusal_not_a_quality_pass():
    image, mesh, _ = specimen(64, 80, alpha=True)
    observations = evaluate(image, mesh, {"age_years": 12}, {"age": "10-19"})
    by_feature = {row["feature"]: row for row in observations}
    for feature in ("W71", "W72", "rain-expression"):
        assert by_feature[feature]["status"] == "NOT_APPLICABLE"
        assert by_feature[feature]["metrics"]["under18_verified"] is True
        assert by_feature[feature]["metrics"]["adult_refusal_verified"] is True
        assert by_feature[feature]["visual_quality"] == "UNTESTED"


def test_private_sidecar_binds_pixels_dimensions_and_checked_provenance():
    data = parse(payload(sidecar()), image_sha256=SHA, width=64, height=80)
    assert data["landmarks"].shape == (478, 2)
    assert data["anatomy"]["left"] == "hooded"
    assert len(data["observed_lashes"]) > 0
    assert "image_sha256" not in data


@pytest.mark.parametrize("change", [
    {"image_sha256": "d" * 64}, {"width": 65}, {"height": 79}, {"format": "unknown"},
    {"provenance": "guessed"}, {"adultConfirmed": True}, {"landmarks": [[0, 0]]},
    {"anatomy": {"right": "open", "left": "invented"}}, {"skin_depth": float("nan")},
    {"natural_density": True}, {"hair_mask": [[2] * 64] * 80}, {"lower": "true"},
])
def test_private_sidecar_rejects_mismatched_or_invented_inputs(change):
    with pytest.raises(ValueError):
        parse(payload(sidecar(**change)), image_sha256=SHA, width=64, height=80)


def test_duplicate_sidecar_keys_and_invalid_hashes_rejected():
    with pytest.raises(ValueError, match="duplicate"):
        parse(b'{"format":1,"format":2}', image_sha256=SHA, width=64, height=80)
    for value in ("../escape", "A" * 64, "a" * 63):
        with pytest.raises(ValueError):
            path_for(Path("/tmp/private"), value)


def test_missing_explicit_zero_mask_and_real_mask_have_distinct_fingerprints(tmp_path):
    before = evidence_hash(tmp_path, [SHA])
    path = path_for(tmp_path, SHA)
    path.write_bytes(payload(sidecar(hair_mask=[0.0] * (64 * 80))))
    zero = evidence_hash(tmp_path, [SHA])
    path.write_bytes(payload(sidecar(hair_mask=[0.5] * (64 * 80))))
    assert before != zero != evidence_hash(tmp_path, [SHA])


def test_group_labels_never_infer_anatomy_or_demographics():
    labels = group_labels({}, {})
    assert set(labels.values()) == {"unknown"}
    enriched = group_labels({"monk": "7", "race": "../../private/photo"}, {"anatomy": {"left": "open", "right": "monolid"}})
    assert enriched["monk"] == "7" and enriched["race"] == "unknown"
    assert enriched["anatomy"] == ["monolid", "open"]


def test_metric_projection_drops_private_arrays_and_rejects_false_pass():
    measured = normalize_observation({"feature": "W59", "status": "PASS", "metrics": {"elapsed_ms": 1.5,
        "landmarks": [[.1, .2]], "file": "private.jpg", "alpha_unchanged": True}})
    assert measured["metrics"] == {"elapsed_ms": 1.5, "alpha_unchanged": True}
    with pytest.raises(ValueError):
        normalize_observation({"feature": "W59", "status": "PASS", "eligible": False})
    with pytest.raises(ValueError):
        normalize_observation({"feature": "W59", "status": "PASS", "metrics": {"elapsed_ms": float("inf")}})


def test_small_unknown_missing_and_partial_groups_are_unproven():
    assert summarize(rows()[:3])["status"] == "UNPROVEN"
    assert summarize(rows() * 2, unknown=True)["status"] == "UNPROVEN"
    report = aggregate(rows(), face_set="frozen-10000", expected_hashes=[SHA], complete_scope=False)
    assert report["engineering_status"] == "UNPROVEN"
    assert report["release_status"] == "UNPROVEN"
    assert report["features"]["W59"]["groups"]["monk"]["1"]["faces"] == 0
    assert report["features"]["W59"]["groups"]["monk"]["1"]["status"] == "UNPROVEN"


def test_declared_full_scope_cannot_hide_wrong_face_count():
    report = aggregate(rows(), face_set="frozen-100000", expected_hashes=[SHA], complete_scope=True, minimum=1)
    assert report["engineering_status"] == "UNPROVEN"
    assert all(item["status"] == "UNPROVEN" for item in report["features"].values())


def test_missing_feature_records_are_counted_and_cannot_pass():
    report = aggregate(rows()[:-1], face_set="frozen-10000", expected_hashes=[SHA], complete_scope=False)
    assert report["features"]["meadow-crown"]["missing_faces"] == 1
    assert report["features"]["meadow-crown"]["eligible"] == 0


def test_observed_failures_cannot_be_hidden_by_insufficient_sample():
    report = aggregate(rows(state="FAIL"), face_set="frozen-10000", expected_hashes=[SHA], complete_scope=False)
    assert report["engineering_status"] == "FAIL"
    assert report["features"]["W59"]["failed"] == 1


def test_aggregation_rejects_duplicate_and_out_of_scope_records():
    with pytest.raises(ValueError, match="duplicate"):
        aggregate(rows() + rows(), face_set="frozen-10000", expected_hashes=[SHA], complete_scope=False)
    with pytest.raises(ValueError, match="outside"):
        aggregate(rows(), face_set="frozen-10000", expected_hashes=["d" * 64], complete_scope=False)
    with pytest.raises(ValueError, match="duplicate"):
        aggregate([], face_set="frozen-10000", expected_hashes=[SHA, SHA], complete_scope=False)


def test_per_group_failure_gap_is_measured_without_inferring_missing_cells():
    good_sha, bad_sha = "1" * 64, "2" * 64
    good, bad = rows(good_sha), rows(bad_sha, "FAIL")
    for row in bad:
        row["labels"]["monk"] = "10"
    report = aggregate(good + bad, face_set="frozen-10000", expected_hashes=[good_sha, bad_sha], complete_scope=False, minimum=1)
    item = report["features"]["W59"]
    assert item["maximum_group_gap"] == 1
    assert item["groups"]["monk"]["6"]["pass_rate"] == 1
    assert item["groups"]["monk"]["10"]["pass_rate"] == 0


def test_aggregate_statistics_use_actual_metrics_and_wilson_bounds():
    data = rows() * 2
    for index, row in enumerate(data):
        row = dict(row, metrics={"elapsed_ms": float(index)})
        data[index] = row
    result = summarize(data)
    assert result["metrics"]["elapsed_ms"]["minimum"] == 0
    assert result["metrics"]["elapsed_ms"]["maximum"] == len(data) - 1
    assert result["metrics"]["elapsed_ms"]["median"] == (len(data) - 1) / 2
    assert 0 < result["wilson_95"][0] < 1
    assert result["wilson_95"][1] == pytest.approx(1)


def test_markdown_report_omits_private_image_id_and_keeps_quality_status():
    report = aggregate(rows(), face_set="frozen-10000", expected_hashes=[SHA], complete_scope=False)
    document = markdown(report)
    assert SHA not in document and "UNTESTED" in document and "UNPROVEN" in document
    assert all(feature in document for feature in FEATURES)


def test_baseline_must_match_inputs_and_reject_every_rate_drop():
    current = aggregate(rows(), face_set="frozen-10000", expected_hashes=[SHA], complete_scope=False)
    current.update({key: "fixed" for key in ("selection_sha256", "labels_sha256", "evidence_sha256", "models_sha256", "runtime_sha256")})
    baseline = copy.deepcopy(current)
    assert compare(current, baseline) == []
    current["features"]["W59"]["pass_rate"] = .9
    assert any("raw pass rate decreased" in issue for issue in compare(current, baseline))
    current["evidence_sha256"] = "changed"
    assert compare(current, baseline) == ["baseline mismatch: evidence_sha256"]


def test_private_journal_resumes_complete_faces_and_repairs_trailing_partial(tmp_path):
    with Journal(tmp_path, plan()) as journal:
        journal.append(SHA, rows())
        assert journal.completed == {SHA}
    with (tmp_path / "observations.jsonl").open("ab") as handle:
        handle.write(b'{"incomplete":')
    with Journal(tmp_path, plan()) as journal:
        assert len(journal.rows) == len(FEATURES)
        assert journal.completed == {SHA}
    assert (tmp_path / "observations.jsonl").read_bytes().endswith(b"\n")


def test_journal_rejects_stale_plan_duplicate_face_and_incomplete_features(tmp_path):
    with Journal(tmp_path, plan()) as journal:
        with pytest.raises(ValueError, match="every feature"):
            journal.append(SHA, rows()[:-1])
        journal.append(SHA, rows())
        with pytest.raises(ValueError, match="duplicate"):
            journal.append(SHA, rows())
    with pytest.raises(ValueError, match="different"):
        with Journal(tmp_path, {**plan(), "code": "second"}):
            pass


def test_journal_detects_corrupted_completed_payload(tmp_path):
    with Journal(tmp_path, plan()) as journal:
        journal.append(SHA, rows())
    path = tmp_path / "observations.jsonl"
    value = json.loads(path.read_bytes())
    value["rows"][0]["status"] = "FAIL"
    path.write_text(json.dumps(value) + "\n")
    with pytest.raises(ValueError, match="digest"):
        with Journal(tmp_path, plan()):
            pass


def test_journal_excludes_concurrent_writer_and_releases_after_error(tmp_path):
    with Journal(tmp_path, plan()):
        with pytest.raises(ValueError, match="another worker"):
            with Journal(tmp_path, plan()):
                pass
    with Journal(tmp_path, plan()) as journal:
        assert not journal.completed


def test_atomic_report_is_complete_json(tmp_path):
    target = tmp_path / "aggregate.json"
    atomic_json(target, {"status": "UNPROVEN", "no_photo": True})
    assert json.loads(target.read_bytes()) == {"status": "UNPROVEN", "no_photo": True}
    assert not target.with_name("aggregate.json.tmp").exists()


def test_missing_box_faces_has_nonpassing_exit_code(tmp_path):
    source = ROOT / "tests/realface/eyes_brows/run.py"
    spec = importlib.util.spec_from_file_location("eyes_brows_cli_test", source)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    args = module.parser().parse_args(["--faces", str(tmp_path / "missing")])
    code, report = module.run(args)
    assert code == 3 and report["engineering_status"] == "UNPROVEN"


def test_box_runner_refuses_repository_faces_even_if_folder_empty():
    source = ROOT / "tests/realface/eyes_brows/run.py"
    spec = importlib.util.spec_from_file_location("eyes_brows_cli_inside", source)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    args = module.parser().parse_args(["--faces", str(ROOT / "tests")])
    with pytest.raises(ValueError, match="outside"):
        module.run(args)
