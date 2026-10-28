"""Synthetic regressions for exact invariant scopes and preregistration ordering.

Written test criteria: missing/changed criteria, a shortened face set, mixed runs,
dropped module evidence and invented measurement names must never authorize PASS.
Cases use scalar records, a drawn chart or temporary directories only. Commit
status is explicitly mocked for unit isolation, never as real-face evidence.
Author: John Khan.
"""
from __future__ import annotations

import copy
import importlib.util
import sys
from dataclasses import replace
from pathlib import Path

import pytest

REALFACE = Path(__file__).resolve().parents[2] / "tests" / "realface"
sys.path.insert(0, str(REALFACE))
import definitions as criteria  # noqa: E402
import invariant_contract as contract  # noqa: E402
import realface_lib as lib  # noqa: E402
import run_realface as cli  # noqa: E402


@pytest.fixture
def declared():
    definition = criteria.load_definition("engine_crashes")
    return replace(definition, committed=True)


def test_a_smoke_sample_cannot_pass_a_full_set_invariant(declared):
    with pytest.raises(criteria.DefinitionError, match="983 faces.*selected 12"):
        contract.require_face_count({declared.id: declared}, 12)
    contract.require_face_count({declared.id: declared}, 983)


@pytest.mark.parametrize("count", [0, 982, 984, 983.0, True])
def test_invariant_count_is_exact_including_type(declared, count):
    with pytest.raises(criteria.DefinitionError):
        criteria.validate_invariant_scope(declared, count)


def test_uncommitted_criteria_refuse_before_any_image_work(declared):
    with pytest.raises(criteria.DefinitionError, match="commit"):
        contract.require_committed({declared.id: replace(declared, committed=False)})
    contract.require_committed({declared.id: declared})


def test_invariants_cannot_disagree_about_the_selected_face_count(declared):
    content = copy.deepcopy(declared.content)
    content["face_set"]["number_of_faces"] = 20
    second = replace(declared, id="finite_output", content=content)
    with pytest.raises(criteria.DefinitionError, match="declares 20"):
        contract.require_face_count({declared.id: declared, second.id: second}, 983)


def test_a_quality_definition_is_not_an_invariant(declared):
    quality = replace(criteria.load_definition("regions"), committed=True)
    with pytest.raises(criteria.DefinitionError, match="own invariant"):
        criteria.validate_invariant_scope(quality, 983)
    with pytest.raises(criteria.DefinitionError, match="no written face invariant"):
        contract.require_face_count({quality.id: quality}, 983)


def test_missing_folder_declares_zero_faces_and_one_structural_case():
    definition = replace(criteria.load_definition("missing_folder"), committed=True)
    assert definition.expected_faces == 0
    criteria.validate_invariant_scope(definition, 0)
    with pytest.raises(criteria.DefinitionError, match="case count"):
        criteria.validate_invariant_scope(definition, 0, case_count=2)
    with pytest.raises(criteria.DefinitionError, match="declares 0 faces"):
        criteria.validate_invariant_scope(definition, 1)


def _complete_rows():
    return [{"face_id": face, "module": module, "check": "dependency_missing", "run_id": "run",
             "metric_pass": False} for face in ("drawn-a", "drawn-b") for module in ("regions", "gender")]


def test_explicit_refusals_keep_complete_invariant_coverage_without_becoming_edit_passes():
    rows = _complete_rows()
    contract.require_observation_coverage(rows, ["drawn-a", "drawn-b"], ["regions", "gender"], "run")
    assert not any(row["metric_pass"] for row in rows)


def test_dropped_face_or_module_does_not_produce_a_vacuous_success():
    with pytest.raises(criteria.DefinitionError, match="face/module pairs"):
        contract.require_observation_coverage(_complete_rows()[:-1], ["drawn-a", "drawn-b"],
                                             ["regions", "gender"], "run")


@pytest.mark.parametrize("change", [
    {"face_id": "unregistered"}, {"module": "invented"}, {"run_id": "old"}, {"check": ""},
])
def test_coverage_rejects_evidence_from_outside_the_frozen_contract(change):
    rows = _complete_rows()
    rows[0].update(change)
    with pytest.raises(criteria.DefinitionError):
        contract.require_observation_coverage(rows, ["drawn-a", "drawn-b"], ["regions", "gender"], "run")


def test_repeated_face_ids_cannot_pad_the_declared_set():
    with pytest.raises(criteria.DefinitionError, match="distinct"):
        contract.require_observation_coverage(_complete_rows(), ["drawn-a", "drawn-a"],
                                             ["regions", "gender"], "run")


def test_quality_definition_cannot_be_downgraded_to_a_zero_face_structural_check():
    data = copy.deepcopy(criteria.load_definition("regions").content)
    data.update(test_kind="structural", number_of_cases=1)
    data["face_set"]["number_of_faces"] = 0
    with pytest.raises(criteria.DefinitionError, match="reclassified"):
        criteria.validate(data, "regions")


@pytest.mark.parametrize("names", [None, [], ["masks", "masks"], ["masks", "invented"]])
def test_quality_definition_requires_distinct_exact_measurement_names(names):
    data = copy.deepcopy(criteria.load_definition("regions").content)
    data["expected_check_names"] = names
    with pytest.raises(criteria.DefinitionError):
        criteria.validate(data, "regions")


def test_validation_command_checks_the_invariant_definitions_too(tmp_path, capsys):
    for path in criteria.DEFAULT_DEFINITIONS.glob("*.json"):
        if path.stem != "missing_folder":
            (tmp_path / path.name).write_bytes(path.read_bytes())
    code = cli.main(["--modules", "regions", "--definitions", str(tmp_path), "--validate-definitions"])
    output = capsys.readouterr()
    assert code == 2 and "missing_folder" in output.err
    assert "No real-face quality result has been measured" not in output.out


def test_every_registered_definition_has_a_readable_pre_run_contract():
    found = criteria.load_definitions(criteria.REGISTERED_IDS)
    assert len(found) == len(criteria.REGISTERED_IDS)
    assert found["missing_folder"].expected_faces == 0
    assert all(d.expected_faces == 983 for name, d in found.items() if name != "missing_folder")


def _invariant_suite():
    spec = importlib.util.spec_from_file_location("r12_external_invariant_suite", REALFACE / "test_realface.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_session_criteria_skip_before_faces_and_detectors_when_uncommitted(monkeypatch):
    suite = _invariant_suite()
    defs = criteria.load_definitions(lib.MODULES + criteria.INVARIANT_IDS)
    defs = {name: replace(d, committed=False) for name, d in defs.items()}
    monkeypatch.setattr(suite, "load_definitions", lambda *_: defs)
    monkeypatch.setattr(lib, "discover", lambda *_a, **_k: pytest.fail("faces opened before criteria"))
    monkeypatch.setattr(lib, "Detectors", lambda *_a, **_k: pytest.fail("runtime loaded before criteria"))
    with pytest.raises(pytest.skip.Exception, match="commit"):
        suite.criteria.__wrapped__()


def test_short_face_set_skips_before_image_hashing_or_model_loading(tmp_path, monkeypatch, declared):
    suite = _invariant_suite()
    fake = lib.Face(tmp_path / "drawn.png", "synthetic", "own work", "synthetic")
    monkeypatch.setattr(suite, "PER_GROUP", 0)
    monkeypatch.setattr(lib, "DEFAULT_FACES", tmp_path)
    monkeypatch.setattr(lib, "discover", lambda *_a, **_k: [fake])
    monkeypatch.setattr(suite.run_state, "file_hash", lambda *_: pytest.fail("count mismatch must stop first"))
    with pytest.raises(pytest.skip.Exception, match="declares 983"):
        suite.faces.__wrapped__({declared.id: declared})


def test_acceptance_uses_unrounded_jacobian_at_the_strict_q3_boundary(monkeypatch):
    from types import SimpleNamespace

    from plumb_api.engines.warp import field, fold
    from lab.python.beljour_lab import face_harness as local

    xyz, photo = local.synthetic_case(3, width=48, height=56)
    identity = field.identity(56, 48)
    actual = field.Field(identity.map_x * 0.20000001, identity.map_y)
    measured = fold.fold_report(actual)
    assert measured.passed and round(measured.min_det, 6) == 0.2
    rendered = SimpleNamespace(
        result=SimpleNamespace(field=actual), strength_used=1.0, guard_reason=None,
        refused=False, evaluations=1, flips=fold.FlipReport((), (), 1.0),
    )
    monkeypatch.setattr(local.warp_mesh, "mesh_warp", lambda *_a, **_k: rendered)
    gate, _ = local.mesh_checks(xyz[:, :2], xyz[:, :2], photo)
    assert gate["q3"]["passed"] is True
    assert gate["jacobian_min"] == measured.min_det > 0.2
