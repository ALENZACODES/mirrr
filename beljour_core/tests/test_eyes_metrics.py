"""Evidence, occlusion, export and real-face gate negative controls. Author: John Khan."""
from __future__ import annotations

import copy
import json
import xml.etree.ElementTree as ET
from dataclasses import replace
from pathlib import Path

import numpy as np
import pytest

from plumb_api.engines.eyes import FEATURES, benchmark, render_eyes
from plumb_api.engines.eyes.contracts import parse_request, trace
from plumb_api.engines.eyes.geometry import frames
from plumb_api.engines.eyes.lashes import extension_map
from plumb_api.engines.eyes.maps import lash_map_csv, lash_map_svg, map_document, validate_map
from plumb_api.engines.eyes.observations import photometric_trace_evidence, resample_trace, trace_summary
from plumb_api.engines.eyes.parity import corpus
from plumb_api.engines.eyes.specimens import specimen
from plumb_api.engines.eyes.visibility import canvas_visible_fraction, occlusion_field

ROOT = Path(__file__).resolve().parents[2]


def test_eye_parity_corpus_is_current_and_contains_every_owned_feature() -> None:
    stored = json.loads((ROOT / "parity/eyes-r15b.json").read_text())
    assert stored == corpus()
    assert {c["request"]["feature"] for c in stored["cases"]} == set(FEATURES)


def test_technician_map_is_a_real_portable_svg_with_seven_zones_per_eye() -> None:
    photo, mesh, _ = specimen()
    request = parse_request({"feature": "W59", "style": "hybrid"})
    maps = [extension_map(frame, request) for frame in frames(mesh, photo.shape[1], photo.shape[0])]
    document = map_document(maps)
    root = ET.fromstring(lash_map_svg(maps))
    ns = {"svg": "http://www.w3.org/2000/svg"}
    assert root.tag == "{http://www.w3.org/2000/svg}svg"
    assert len(root.findall(".//svg:path", ns)) > 14
    assert len(document["eyes"]) == 2
    assert document["photo_included"] is False and document["face_coordinates_included"] is False
    assert all("length_px" not in z for eye in document["eyes"] for z in eye["zones"])
    rows = lash_map_csv(maps).splitlines()
    assert len(rows) == 15
    assert all(row.startswith("yes,") for row in rows[1:])
    assert "simulation" in rows[0]


def test_map_export_escapes_text_and_rejects_bad_zone_coverage() -> None:
    photo, mesh, _ = specimen()
    mapping = extension_map(frames(mesh, photo.shape[1], photo.shape[0])[0], parse_request({"feature": "W59"}))
    mapping["style"] = "<script>x</script>"
    svg = lash_map_svg([mapping])
    assert "<script>" not in svg and "&lt;script&gt;" in svg
    bad = copy.deepcopy(mapping)
    bad["zones"][2]["start"] = .9
    with pytest.raises(ValueError, match="cover"):
        validate_map(bad)
    bad = copy.deepcopy(mapping)
    bad["zones"][0]["fan_count"] = 1.5
    with pytest.raises(ValueError, match="integer"):
        validate_map(bad)
    with pytest.raises(ValueError, match="duplicate"):
        map_document([mapping, mapping])
    with pytest.raises(ValueError):
        map_document([])


def test_observation_diagnostics_count_only_evidence_and_reject_duplicates_at_render() -> None:
    photo, mesh, traces = specimen()
    observations = [trace(item) for item in traces]
    summary = trace_summary([*observations, replace(observations[0], confidence=.2)], photo.shape[1], photo.shape[0])
    assert summary["observed"] == {"right_upper": 5, "right_lower": 3, "left_upper": 5, "left_lower": 3}
    assert summary["duplicate_traces"] == 1
    assert summary["low_confidence"] == 1
    assert summary["automatic_lash_count"] is None
    with pytest.raises(ValueError, match="duplicate"):
        render_eyes(photo, mesh, {"feature": "W61", "observed_lashes": [traces[0], traces[0]]})


def test_arc_length_resampling_preserves_endpoints_without_inventing_another_trace() -> None:
    points = [(0., 0.), (3., 0.), (3., 4.)]
    actual = resample_trace(points, 8)
    assert actual[0] == points[0] and actual[-1] == points[-1]
    assert len(actual) == 8
    assert all(np.linalg.norm(np.subtract(a, b)) <= 1 + 1e-12 for a, b in zip(actual, actual[1:], strict=False))
    with pytest.raises(ValueError):
        resample_trace([(1, 1), (1, 1)])
    with pytest.raises(ValueError):
        resample_trace(points, 1)


def test_grey_lash_diagnostic_never_erases_a_low_contrast_trace() -> None:
    photo = np.full((40, 40, 3), 180, dtype=np.uint8)
    item = trace({"side": "right", "points": [[.4, .3], [.4, .7]]})
    flat = photometric_trace_evidence(photo, item)
    assert flat["median_dark_line_contrast"] == 0
    assert flat["trace_removed"] is False
    photo[12:29, 16, :] = 80
    dark = photometric_trace_evidence(photo, item)
    assert dark["median_dark_line_contrast"] > 50
    assert dark["classification"] == "diagnostic_only"


def test_occlusion_mask_is_validated_and_never_mutated() -> None:
    mask = np.zeros((20, 30))
    copied = occlusion_field(mask, 30, 20)
    copied[0, 0] = 1
    assert mask[0, 0] == 0
    assert occlusion_field(None, 30, 20).shape == (20, 30)
    for bad in (np.zeros((19, 30)), np.full((20, 30), np.nan), np.full((20, 30), 1.01)):
        with pytest.raises(ValueError):
            occlusion_field(bad, 30, 20)


@pytest.mark.parametrize("feature", FEATURES)
def test_covered_eye_refuses_a_preview_instead_of_painting_through_an_occluder(feature: str) -> None:
    photo, mesh, traces = specimen()
    full = np.ones(photo.shape[:2])
    result = render_eyes(photo, mesh, {"feature": feature, "observed_lashes": traces}, occlusion_mask=full)
    assert np.array_equal(photo, result.image)
    assert result.report["status"] == "unavailable"
    assert result.report["visibility"]["mask_supplied"]
    assert all(not side["eligible"] for side in result.report["visibility"]["sides"])
    assert any("occlusion mask" in w for w in result.report["warnings"])


def test_partial_occlusion_clips_only_covered_makeup_and_displays_honest_support_metrics() -> None:
    photo, mesh, _ = specimen(144, 176)
    clear = render_eyes(photo, mesh, {"feature": "W66", "colour": [220, 160, 190]})
    mask = np.zeros(photo.shape[:2])
    mask[:, :photo.shape[1] // 2] = .25
    occluded = render_eyes(photo, mesh, {"feature": "W66", "colour": [220, 160, 190]}, occlusion_mask=mask)
    assert np.any(occluded.coverage < clear.coverage)
    assert occluded.report["display_support"][0]["mean_rgb_change"] < clear.report["display_support"][0]["mean_rgb_change"]
    assert all(row["realism_score"] is None for row in occluded.report["display_support"])


def test_tiny_and_out_of_frame_eye_canvases_are_reported_unavailable() -> None:
    photo, mesh, _ = specimen()
    small = mesh * .3 + .35
    result = render_eyes(photo, small, {"feature": "W64"})
    assert result.report["status"] == "unavailable"
    frame = frames(mesh, photo.shape[1], photo.shape[0])[0]
    moved = replace(frame, origin=(-30., -20.))
    assert canvas_visible_fraction(moved, "hooded", photo.shape[1], photo.shape[0]) == 0


@pytest.mark.parametrize("roll", [-62, -45, 45, 62])
def test_extreme_roll_retains_finite_masks_and_eye_protection(roll: float) -> None:
    photo, mesh, _ = specimen(144, 176, roll=roll)
    result = render_eyes(photo, mesh, {"feature": "W64"})
    assert np.all(np.isfinite(result.coverage))
    assert result.report["changed_pixels"] > 0
    assert result.report["protected_eye_pixels"] > 0


def test_realface_modules_are_per_feature_and_never_promote_missing_traces() -> None:
    photo, mesh, _ = specimen()
    results = benchmark.evaluate_face(photo, mesh)
    assert {row["feature"] for row in results} == set(FEATURES)
    for row in results:
        assert row["visual_quality"] == "UNTESTED"
        if row["feature"] in ("W61", "W63", "W76"):
            assert row["status"] == "UNTESTED" and row["passed"] is None
    text = json.dumps(results)
    assert "landmarks" not in text and "points" not in text and "image_data" not in text


def test_realface_gate_rejects_a_deliberately_corrupted_protected_pixel(monkeypatch: pytest.MonkeyPatch) -> None:
    photo, mesh, traces = specimen()
    original = benchmark.render_eyes
    def broken(*args: object, **kwargs: object):
        result = original(*args, **kwargs)
        if result.report["status"] != "identity":
            x, y = (mesh[468] * [photo.shape[1], photo.shape[0]]).astype(int)
            result.image[y, x, 0] = 255 - int(photo[y, x, 0])
        return result
    monkeypatch.setattr(benchmark, "render_eyes", broken)
    results = benchmark.evaluate_face(photo, mesh, {"observed_lashes": traces})
    assert all(row["status"] == "FAIL" for row in results)
    assert all(row["metrics"]["protected_eye_changed_pixels"] > 0 for row in results)


def test_realface_groups_need_count_coverage_and_no_hidden_untested_records() -> None:
    rows = [{"group": "A", "eligible": True, "passed": True} for _ in range(30)]
    assert benchmark.aggregate(rows)["status"] == "PASS"
    assert benchmark.aggregate(rows[:29])["status"] == "UNTESTED"
    assert benchmark.aggregate([])["status"] == "UNTESTED"
    missing = [*rows, {"group": "A", "eligible": False, "passed": None}]
    assert benchmark.aggregate(missing)["status"] == "UNTESTED"
    mixed = [*rows, *[{"group": "B", "eligible": True, "passed": i < 28} for i in range(30)]]
    assert benchmark.aggregate(mixed)["status"] == "FAIL"
    assert benchmark.aggregate(mixed)["maximum_gap"] > .03
