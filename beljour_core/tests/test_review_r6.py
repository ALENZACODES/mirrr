"""R6 acceptance decisions: six distinct adult-photo votes and automatic Q checks.

All reports and votes below are fabricated, synthetic unit data; no real release, photo,
medical outcome, inference model or network is involved. Author: John Khan.
"""
from __future__ import annotations

import copy
import json

import pytest

from lab.python.beljour_lab import face_review as review

CASES = [f"released-{i:016x}" for i in range(6)]
LEVELS = {
    "LS1": review.LARGE + review.SMALL + ("roll_straighten",),
    "LS2": review.NORMAL_EXTRA + review.HYPER + ("0_original",),
    "LS3": ("1", "2", "3", "4", "5", "-1", "-2", "-3"),
}


def mock_data(*, kinds=None):
    """Complete fake mechanical results; these are NOT evidence for a ship decision."""
    reports = {}
    votes = []
    for spike, settings in LEVELS.items():
        rows = []
        for case in CASES:
            for setting in settings:
                entry = {"case": case, "setting": setting, "auto_pass": True,
                         "checks": {name: {"passed": True} for name in (
                             ("q1", "q4", "q7") if spike == "LS3" else ("q1", "q3", "q4"))}}
                if spike == "LS1": entry["reverse_landmark_error_iod"] = 0.001
                if spike == "LS2":
                    entry["max_iod_percent"] = 2.0 if "66" in setting else 3.0 if "100" in setting else 0.8
                rows.append(entry)
                if (spike, setting) not in {("LS1", "roll_straighten"), ("LS2", "0_original")}:
                    vote = {"spike": spike, "case": case, "setting": setting,
                            "natural": True, "same_person": True, "clear_effect": True}
                    if spike == "LS1": vote["browser_seconds"] = 1.2
                    votes.append(vote)
        reports[spike] = {"format": "beljour-local-spike-report/1", "spike": spike,
                          "fixture_kinds": kinds or ["released"], "evaluations": rows}
    return reports, {"format": review.FORMAT, "votes": votes}


def test_valid_six_photo_reviews_produce_three_distinct_level_decisions():
    reports, votes = mock_data()
    result = review.evaluate(reports, votes)
    assert result["format"] == review.VERSION
    assert result["six_released_photos"]
    assert result["photo_count"] == 6
    assert not result["photos_in_report"]
    assert result["results"]["LS1"]["decision"] == "LARGE_YAW_PITCH"
    assert result["results"]["LS2"]["decision"] == "HYPER"
    assert result["results"]["LS3"]["decision"] == "AGE_PLUS_3_GATE"
    assert result["results"]["LS2"]["hyper_geometry_ratio_min"] >= 1.4


def test_synthetic_fixture_can_never_pass_the_human_release_gate():
    reports, votes = mock_data(kinds=["synthetic"])
    verdict = review.evaluate(reports, votes)
    assert not verdict["six_released_photos"]
    assert verdict["synthetic_or_mixed"]
    assert all(value["decision"] == "UNVERIFIED" for value in verdict["results"].values())


def test_incomplete_photo_review_and_runtime_does_not_invent_a_passing_verdict():
    reports, votes = mock_data()
    votes["votes"] = [v for v in votes["votes"] if not (v["case"] == CASES[0] and v["spike"] == "LS1")]
    result = review.evaluate(reports, votes)
    assert result["results"]["LS1"]["decision"] == "UNVERIFIED"
    votes2 = mock_data()[1]
    for vote in votes2["votes"]:
        if vote["spike"] == "LS1": vote.pop("browser_seconds")
    result = review.evaluate(reports, votes2)
    assert result["results"]["LS1"]["decision"] == "UNVERIFIED"
    assert result["results"]["LS1"]["levels"]["yaw_left_8"]["runtime_complete"] is False


def test_fails_high_angles_but_passes_smaller_backup_angles():
    reports, votes = mock_data()
    for row in reports["LS1"]["evaluations"]:
        if row["setting"] in review.LARGE: row["auto_pass"] = False
    verdict = review.evaluate(reports, votes)
    assert verdict["results"]["LS1"]["decision"] == "SMALL_YAW_PITCH"


def test_if_full_and_small_angles_fail_only_roll_is_eligible():
    reports, votes = mock_data()
    for row in reports["LS1"]["evaluations"]:
        if row["setting"] in review.LARGE + review.SMALL: row["auto_pass"] = False
    assert review.evaluate(reports, votes)["results"]["LS1"]["decision"] == "ROLL_ONLY"


def test_slow_device_prevents_turning_gate_even_when_photos_pass():
    reports, votes = mock_data()
    for vote in votes["votes"]:
        if vote["spike"] == "LS1": vote["browser_seconds"] = 4.4
    verdict = review.evaluate(reports, votes)
    assert verdict["results"]["LS1"]["decision"] == "ROLL_ONLY"
    level = verdict["results"]["LS1"]["levels"]["yaw_left_8"]
    assert not level["runtime_pass"] and level["max_browser_seconds"] == 4.4


def test_hyper_requires_measured_ratio_not_only_position_of_slider():
    reports, votes = mock_data()
    for row in reports["LS2"]["evaluations"]:
        if row["setting"] in review.HYPER: row["max_iod_percent"] = 2.1
    verdict = review.evaluate(reports, votes)["results"]["LS2"]
    assert not verdict["hyper_geometry_pass"]
    assert verdict["decision"] == "EXTRA_PLUS_STRONG_CAP"


def test_normal_and_extra_must_both_pass_for_both_directions():
    reports, votes = mock_data()
    for row in reports["LS2"]["evaluations"]:
        if row["setting"] == "-66": row["auto_pass"] = False
    verdict = review.evaluate(reports, votes)
    assert verdict["results"]["LS2"]["decision"] == "RETUNE_NORMAL_EXTRA"
    missing = mock_data()[1]
    missing["votes"] = [v for v in missing["votes"] if v["setting"] != "-66"]
    assert review.evaluate(reports, missing)["results"]["LS2"]["decision"] == "UNVERIFIED"


def test_age_three_requires_six_auto_passes_and_four_human_positives():
    reports, votes = mock_data()
    for v in votes["votes"]:
        if v["spike"] == "LS3" and v["case"] in CASES[:3]: v["clear_effect"] = False
    assert review.evaluate(reports, votes)["results"]["LS3"]["decision"] == "SUBTLE_ONLY"
    for v in votes["votes"]:
        if v["spike"] == "LS3" and v["case"] == CASES[2]: v["clear_effect"] = True
    assert review.evaluate(reports, votes)["results"]["LS3"]["decision"] == "AGE_PLUS_3_GATE"
    for row in reports["LS3"]["evaluations"]:
        if row["setting"] == "3" and row["case"] == CASES[0]: row["auto_pass"] = False
    assert review.evaluate(reports, votes)["results"]["LS3"]["decision"] == "SUBTLE_ONLY"


def test_duplicate_votes_unknown_keys_and_misleading_fields_fail():
    reports, votes = mock_data()
    votes["votes"].append(copy.deepcopy(votes["votes"][0]))
    with pytest.raises(ValueError, match="duplicate vote"):
        review.evaluate(reports, votes)
    votes["votes"].pop()
    for value in ("true", None, 1):
        changed = copy.deepcopy(votes)
        changed["votes"][0]["natural"] = value
        with pytest.raises(ValueError, match="booleans"):
            review.evaluate(reports, changed)
    changed = copy.deepcopy(votes)
    changed["votes"][0]["browser_seconds"] = float("nan")
    with pytest.raises(ValueError, match="browser_seconds"):
        review.parse_votes(changed)
    changed = copy.deepcopy(votes)
    changed["votes"][0]["private_image_bytes"] = "NOT ALLOWED"
    with pytest.raises(ValueError, match="unknown"):
        review.parse_votes(changed)


def test_duplicate_automatic_results_different_cases_and_synthetic_tag_fail_closed():
    reports, votes = mock_data()
    altered = copy.deepcopy(reports)
    altered["LS1"]["evaluations"].append(altered["LS1"]["evaluations"][0])
    with pytest.raises(ValueError, match="duplicate fixture"):
        review.evaluate(altered, votes)
    altered = copy.deepcopy(reports)
    altered["LS3"]["evaluations"][0]["case"] = "released-someother"
    with pytest.raises(ValueError, match="same released photos"):
        review.evaluate(altered, votes)
    altered = copy.deepcopy(reports)
    del altered["LS2"]["fixture_kinds"]
    with pytest.raises(ValueError, match="fixture-kind"):
        review.evaluate(altered, votes)


def test_review_files_roundtrip_reports_without_image_bytes(tmp_path):
    reports, votes = mock_data()
    for code, data in reports.items():
        (tmp_path / f"{code.lower()}-report.json").write_text(json.dumps(data))
    src = tmp_path / "reviews.json"
    src.write_text(json.dumps(votes))
    result = review.report_from_directory(tmp_path, src)
    assert result["results"]["LS1"]["decision"] == "LARGE_YAW_PITCH"
    assert "photo_pixels" not in json.dumps(result)


def test_review_template_has_unrated_placeholders_and_requires_real_six():
    reports, _ = mock_data()
    template = review.review_template(reports)
    assert template["format"] == review.FORMAT
    assert len(template["votes"]) == 6 * (8 + 6 + 1)
    assert all(v["natural"] is None and v["same_person"] is None and v["clear_effect"] is None
               for v in template["votes"])
    assert all("browser_seconds" in v for v in template["votes"] if v["spike"] == "LS1")
    with pytest.raises(ValueError, match="booleans"):
        review.evaluate(reports, template)
    synthetic, _ = mock_data(kinds=["synthetic"])
    with pytest.raises(ValueError, match="released adult"):
        review.review_template(synthetic)


def test_bare_pass_flag_cannot_clear_absent_q_checks_or_pose_error():
    reports, votes = mock_data()
    for row in reports["LS1"]["evaluations"]:
        if row["setting"] == "yaw_left_8": row["reverse_landmark_error_iod"] = .021
    assert review.evaluate(reports, votes)["results"]["LS1"]["decision"] == "SMALL_YAW_PITCH"
    reports, votes = mock_data()
    for row in reports["LS2"]["evaluations"]:
        if row["setting"] == "+66": row["checks"].pop("q3")
    # Signed slider settings are strings without a plus sign.
    for row in reports["LS2"]["evaluations"]:
        if row["setting"] == "66": row["checks"].pop("q3")
    assert review.evaluate(reports, votes)["results"]["LS2"]["decision"] == "RETUNE_NORMAL_EXTRA"
    reports, votes = mock_data()
    for row in reports["LS3"]["evaluations"]:
        if row["setting"] == "3": row["checks"].pop("q7")
    assert review.evaluate(reports, votes)["results"]["LS3"]["decision"] == "SUBTLE_ONLY"


def test_unknown_review_photo_cannot_influence_or_be_discarded_silently():
    reports, votes = mock_data()
    votes["votes"][0]["case"] = "released-notinreport"
    with pytest.raises(ValueError, match="absent from the automatic report"):
        review.evaluate(reports, votes)
