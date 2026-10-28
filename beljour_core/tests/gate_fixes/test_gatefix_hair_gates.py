"""C16 item (b): hair gate definitions that can measure what their rule asks.

Pass definition: with no observed hair mask, W28 and W39 rows are NOT MEASURED
(hair_mask_not_supplied) and the gate reads UNPROVEN, never FAIL or PASS; with
a supplied mask the engines pass outside_max_abs_diff == 0 and
highlight_correlation >= 0.9; hair_studio is NOT MEASURED (no_local_render)
because the styling package has no local renderer; a hair_fibre photo whose
crown band is outside the frame is NOT APPLICABLE under the expected check
name; only reasons a definition declares are honoured. Drawn images only.

Wired on main: feature_checks rows claim the declared status (applicability.py),
the definitions declare their reasons (balayage_w28, curl_w39, hair_studio v2;
hair_fibre v2 not applicable crown_outside_photo) and gates.evaluate sets those
faces aside and counts them, thresholds unchanged. The C16 definition-version
checks stay skipped for retirement. Author: John Khan.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import numpy as np
import pytest
from gatefix_gates import REALFACE, frozen_plan, gate, observation, tiny_definition

if str(REALFACE) not in sys.path:
    sys.path.insert(0, str(REALFACE))

import applicability  # noqa: E402
import definitions  # noqa: E402
import feature_checks as fc  # noqa: E402
import hair_masks  # noqa: E402

FOLDERS = ("pass_definitions", "pass_definitions-10000")
# Every definition C16 changed, with the declared-reason key it added (None: text only).
CHANGED = {"balayage_w28": "not_measured_reasons", "curl_w39": "not_measured_reasons",
           "hair_studio": "not_measured_reasons", "hair_fibre": "not_applicable_reasons",
           "regions": None, "iris": "not_applicable_reasons", "teeth": "not_applicable_reasons"}
RETIRE_C16_VERSIONS = (
    "Retire: checks the C16 definition version bumps (v+1 with declared reason lists, filters "
    "field renames) and their previous/ copies. Main reverted those changes: every "
    "previous/<id>.v<N>.json is now byte-for-byte the current definition at the same version.")
RETIRE_REASON_LISTS = (
    "Retire: checks C16's definitions.validate() refusal of malformed not_applicable_reasons / "
    "not_measured_reasons lists. Main's validator has no reason lists and no main definition "
    "declares one (pass_definitions-50000 was made an exact twin of the 10,000 set again).")


def striped_hair(height: int = 160, width: int = 160) -> tuple[np.ndarray, np.ndarray]:
    """Head below, a striped hair cap with sun highlights above it; the mask is the cap only."""
    image = np.full((height, width, 3), (120, 130, 140), dtype=np.uint8)
    yy, xx = np.mgrid[:height, :width].astype(np.float64)
    head = ((xx - 80) / 40.0) ** 2 + ((yy - 100) / 50.0) ** 2 <= 1
    cap = (((xx - 80) / 52.0) ** 2 + ((yy - 70) / 50.0) ** 2 <= 1) & (yy < 75)
    image[head] = (196, 150, 118)
    # Lighter towards the crown (highlights), fine strands, a slow wave.
    strands = 30 + 140 * (1 - yy / 75.0) + 10 * ((xx // 3) % 2) + 8 * np.sin(xx * 0.7 + yy * 0.3)
    strands = np.clip(strands, 0, 255)
    image[cap] = np.stack((strands, strands * 0.8, strands * 0.6), -1)[cap].astype(np.uint8)
    return image, cap.astype(np.float64)


def test_missing_hair_mask_never_passes_w28_or_w39() -> None:
    image, _ = striped_hair()
    rows = [fc.balayage_w28(image, None), *fc.hair_w39(image, None)]
    assert [r.check for r in rows] == ["balayage_lift", "hair_dark", "hair_copper", "hair_ash"]
    for item in rows:
        assert item.passed is False
        assert item.measurements["mask_observed"] is False
        assert item.output is None
    definition = tiny_definition("balayage_w28", 2)
    plan = frozen_plan(definition)
    found = gate(definition, plan, [observation(definition, plan, i, "balayage_lift", False,
                                                **rows[0].measurements) for i in range(2)])
    assert found["status"] != "PASS" and found["overall"]["passed"] == 0


def test_missing_hair_mask_is_not_measured_for_w28_and_w39() -> None:
    image, _ = striped_hair()
    rows = [fc.balayage_w28(image, None), *fc.hair_w39(image, None)]
    assert [r.check for r in rows] == ["balayage_lift", "hair_dark", "hair_copper", "hair_ash"]
    for item in rows:
        assert item.passed is False
        assert item.measurements["applicability"] == "not_measured"
        assert item.measurements["reason_code"] == "hair_mask_not_supplied"
        assert item.measurements["mask_observed"] is False


def test_supplied_mask_runs_the_real_engines_and_meets_the_unchanged_rules() -> None:
    image, mask = striped_hair()
    balayage = fc.balayage_w28(image, mask)
    assert balayage.passed, balayage.measurements
    assert balayage.measurements["outside_max_abs_diff"] == 0
    assert balayage.measurements["highlight_correlation"] >= 0.9
    assert "applicability" not in balayage.measurements
    for item in fc.hair_w39(image, mask):
        assert item.passed, (item.check, item.measurements)
        assert item.measurements["outside_max_abs_diff"] == 0
        assert item.measurements["highlight_correlation"] >= 0.9


def test_hair_studio_without_a_local_render_never_passes_and_is_not_measured() -> None:
    image, _ = striped_hair()
    row = fc.hair_studio(image)
    assert row.check == "style_availability"
    assert row.measurements["actually_rendered"] is False
    assert row.measurements["styles"] >= 1
    definition = tiny_definition("hair_studio", 2)
    plan = frozen_plan(definition)
    rows = [observation(definition, plan, i, row.check, row.passed, **row.measurements)
            for i in range(2)]
    found = gate(definition, plan, rows)
    assert found["status"] == "UNPROVEN" and found["overall"]["total"] == 0
    assert found["applicability"]["not_measured"] == {"no_local_render": 2}


def test_hair_studio_is_not_measured_without_a_local_renderer() -> None:
    image, _ = striped_hair()
    row = fc.hair_studio(image)
    assert row.check == "style_availability"
    assert row.passed is False
    assert row.measurements["actually_rendered"] is False
    assert row.measurements["applicability"] == "not_measured"
    assert row.measurements["reason_code"] == "no_local_render"
    assert row.measurements["styles"] >= 1


def drawn_mask_source(face_path: Path | None, row: Any, shape: tuple[int, int]) -> np.ndarray:
    _, mask = striped_hair(*shape)
    return mask


def test_hair_mask_source_is_pluggable_without_code_changes(
        monkeypatch: pytest.MonkeyPatch) -> None:
    assert hair_masks.hair_mask_source("") is fc._read_mask
    monkeypatch.setenv(hair_masks.ENVIRONMENT, f"{__name__}:drawn_mask_source")
    source = hair_masks.hair_mask_source()
    mask = hair_masks.checked_mask(source, None, {}, (160, 160))
    assert mask is not None and mask.shape == (160, 160) and mask.max() == 1.0
    with pytest.raises(ValueError, match="match the photo"):
        hair_masks.checked_mask(lambda *_: np.ones((5, 5)), None, {}, (160, 160))
    with pytest.raises(ValueError, match="package.module:function"):
        hair_masks.hair_mask_source("no_function_here")


def test_not_measured_hair_gate_reads_unproven_with_its_reason() -> None:
    definition = tiny_definition("balayage_w28", 4)
    plan = frozen_plan(definition)
    rows = [observation(definition, plan, i, "balayage_lift", False, mask_observed=False,
                        highlight_correlation=0.0, outside_max_abs_diff=-1.0,
                        **applicability.row("not_measured", "hair_mask_not_supplied"))
            for i in range(4)]
    found = gate(definition, plan, rows)
    assert found["status"] == "UNPROVEN"
    assert found["failures"] == []
    assert "4 faces not measured (hair_mask_not_supplied); the rule could not run on them." in (
        found["missing_evidence"])
    assert found["applicability"]["not_measured"] == {"hair_mask_not_supplied": 4}
    assert found["kill_list"] == []


def test_undeclared_or_mixed_claims_are_scored_as_before() -> None:
    definition = tiny_definition("balayage_w28", 2)
    plan = frozen_plan(definition)
    rows = [observation(definition, plan, 0, "balayage_lift", False,
                        **applicability.row("not_applicable", "hair_mask_not_supplied")),
            observation(definition, plan, 1, "balayage_lift", False, mask_observed=False,
                        **applicability.row("not_measured", "invented_reason"))]
    found = gate(definition, plan, rows)
    assert found["status"] == "FAIL"
    # Both faces stay in the denominator (main reports no applicability section at all).
    assert found["overall"]["total"] == 2 and found["overall"]["passed"] == 0
    curls = tiny_definition("curl_w39", 1)
    curl_plan = frozen_plan(curls)
    mixed = [observation(curls, curl_plan, 0, "hair_dark", False,
                         **applicability.row("not_measured", "hair_mask_not_supplied")),
             observation(curls, curl_plan, 0, "hair_copper", True, mask_observed=True,
                         highlight_correlation=0.95, outside_max_abs_diff=0.0),
             observation(curls, curl_plan, 0, "hair_ash", True, mask_observed=True,
                         highlight_correlation=0.95, outside_max_abs_diff=0.0)]
    assert gate(curls, curl_plan, mixed)["status"] == "FAIL"


def test_not_applicable_faces_leave_the_denominator_and_are_counted() -> None:
    definition = tiny_definition("hair_fibre", 4)
    plan = frozen_plan(definition)
    good = {"q1_pass": True, "fibre_delta_e": 1.0, "share_ok": True}
    rows = [observation(definition, plan, i, "fibres:medium", True, **good) for i in range(3)]
    rows.append(observation(definition, plan, 3, "fibres:medium", False,
                            **applicability.row("not_applicable", "crown_outside_photo")))
    found = gate(definition, plan, rows)
    assert found["overall"] == {"passed": 3, "total": 3, "rate": 1.0}
    assert found["applicability"] == {"faces": 4, "applicable": 3, "not_measured": {},
                                      "not_applicable": {"crown_outside_photo": 1}}
    assert not any("check names differ" in item["reason"] for item in found["kill_list"])
    lines = applicability.markdown_lines(found["applicability"])
    assert lines == ["- Applicable faces: 3 of 4; not applicable (crown_outside_photo): 1."]
    assert applicability.markdown_lines({"faces": 2, "applicable": 2, "not_applicable": {},
                                         "not_measured": {}}) == []


def test_hair_fibre_crown_outside_the_photo_uses_the_expected_check_name() -> None:
    import realface_lib as lib

    points = np.zeros((478, 2))
    points[:] = (50.0, 50.0)
    points[10], points[152], points[234], points[454] = (50, 0), (50, 100), (10, 50), (90, 50)
    rows: list[dict[str, Any]] = []
    bench: Any = object.__new__(lib.Bench)
    bench.m = {"crown": None, "shades": None, "fibre": None, "q1": None}
    def add(module: str, check: str, ok: bool, *args: Any, **fields: Any) -> None:
        rows.append({"check": check, "ok": ok, **fields})

    bench._hair_fibre(np.zeros((120, 100, 3), np.uint8), None, points, 40.0, add)
    assert rows == [{"check": "fibres:medium", "ok": False, "note": "crown band outside the photo",
                     "applicability": "not_applicable", "reason_code": "crown_outside_photo"}]


@pytest.mark.skip(reason=RETIRE_C16_VERSIONS)
@pytest.mark.parametrize("folder", FOLDERS)
@pytest.mark.parametrize("name", sorted(CHANGED))
def test_changed_definitions_bump_version_and_keep_the_old_file(folder: str, name: str) -> None:
    current = json.loads((REALFACE / folder / f"{name}.json").read_text(encoding="utf-8"))
    old_version = current["version"] - 1
    old = json.loads((REALFACE / folder / "previous" / f"{name}.v{old_version}.json").read_text(
        encoding="utf-8"))
    assert old["version"] == old_version
    key = CHANGED[name]
    assert key is None or (key in current and key not in old)
    assert current["metric"] != old["metric"] or key is not None
    for key in ("threshold", "rules", "expected_checks", "minimum_slice_faces", "regression"):
        assert current[key] == old[key], key
    definitions.validate(current, name)


@pytest.mark.parametrize("folder", FOLDERS)
def test_previous_versions_are_never_loaded_as_definitions(folder: str) -> None:
    loaded = {path.stem for path in (REALFACE / folder).glob("*.json")}
    assert not any(".v" in stem for stem in loaded)
    kept = sorted((REALFACE / folder / "previous").glob("*.json"))
    assert kept and all(".v" in path.stem for path in kept)
    with pytest.raises(definitions.DefinitionError):
        definitions.load_definition("previous", REALFACE / folder)


@pytest.mark.skip(reason=RETIRE_REASON_LISTS)
@pytest.mark.parametrize("bad", ([], ["Bad Code"], ["same", "same"], "mouth_closed"))
def test_malformed_reason_lists_are_refused(bad: object) -> None:
    content = json.loads((REALFACE / "pass_definitions" / "teeth.json").read_text(encoding="utf-8"))
    content["not_applicable_reasons"] = bad
    with pytest.raises(definitions.DefinitionError, match="reason codes"):
        definitions.validate(content, "teeth")
    content["not_applicable_reasons"] = ["mouth_closed"]
    content["not_measured_reasons"] = ["mouth_closed"]
    with pytest.raises(definitions.DefinitionError, match="reason codes"):
        definitions.validate(content, "teeth")


@pytest.mark.skip(reason=RETIRE_C16_VERSIONS)
@pytest.mark.parametrize("folder", FOLDERS)
def test_filters_rules_change_only_field_names_never_limits(folder: str) -> None:
    current = json.loads((REALFACE / folder / "filters.json").read_text(encoding="utf-8"))
    old = json.loads((REALFACE / folder / "previous" / f"filters.v{current['version'] - 1}.json")
                     .read_text(encoding="utf-8"))
    assert current["threshold"] == old["threshold"]
    renamed = {"chroma_ratio": "checked_chroma_ratio", "hue_turn": "checked_hue_turn"}
    for pattern, rules in old["rules"].items():
        expected = [{**rule, "field": renamed.get(rule["field"], rule["field"])} for rule in rules]
        assert current["rules"][pattern] == expected
    definitions.validate(current, "filters")
