"""Feature-specific lash tests: anchor, density, lift, strip fit and mascara. Author: John Khan."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.eyes import render_eyes
from plumb_api.engines.eyes.contracts import parse_request, polyline_length
from plumb_api.engines.eyes.geometry import frames, interpolate
from plumb_api.engines.eyes.lashes import (
    choose_style,
    extension_map,
    extension_strokes,
    lifted_path,
    mascara_path,
    observed_paths,
    strip_strokes,
    style_profile,
)
from plumb_api.engines.eyes.specimens import specimen


def test_w59_extension_roots_follow_each_measured_lash_line() -> None:
    photo, mesh, _ = specimen(160, 192, roll=23)
    for frame in frames(mesh, 160, 192):
        paths, mapping = extension_strokes(frame, parse_request({"feature": "W59", "style": "volume"}))
        assert len(paths) == 84
        assert len(mapping["zones"]) == 7
        assert mapping["physical_mm"] is None
        for path in paths:
            u, v = frame.local(*path[0])
            assert v == pytest.approx(interpolate(frame.upper, u) + .008)
            assert .04 < u < .96
        assert photo.shape[1] == 160


def test_w59_sparse_volume_warning_is_prominent_and_unknown_density_is_disclosed() -> None:
    photo, mesh, _ = specimen()
    sparse = render_eyes(photo, mesh, {"feature": "W59", "style": "mega", "natural_density": .1})
    assert any("Unrealistic" in text for text in sparse.report["warnings"])
    unknown = render_eyes(photo, mesh, {"feature": "W59", "style": "classic"})
    assert any("unknown" in text for text in unknown.report["warnings"])
    assert sparse.report["rendered_count"] > unknown.report["rendered_count"]


def test_w60_profiles_have_distinct_peaks_and_downturned_guidance() -> None:
    assert style_profile("cat", .9) > style_profile("cat", .1)
    assert style_profile("doll", .5) > style_profile("doll", .9)
    assert style_profile("kitten", .73) > style_profile("kitten", 1)
    assert style_profile("fox", .9) - style_profile("fox", .5) > .3
    values = [style_profile("wispy", u) for u in np.linspace(.2, .8, 31)]
    assert sum(values[i] > values[i - 1] and values[i] > values[i + 1] for i in range(1, 30)) >= 2
    photo, mesh, _ = specimen()
    mesh[263, 1] += .03
    frame = frames(mesh, photo.shape[1], photo.shape[0])[1]
    recommendation = choose_style(frame, "hooded", "cat")
    assert len(recommendation["warnings"]) == 2
    assert "Downturned" in recommendation["warnings"][0]
    assert "Hooded" in recommendation["warnings"][1]
    assert choose_style(frame, "hooded")["style"] == "kitten"


@pytest.mark.parametrize("curl", [0, .25, .55, 1])
def test_w61_lift_preserves_observed_arc_length_root_and_count(curl: float) -> None:
    photo, mesh, traces = specimen(180, 216)
    options = parse_request({"feature": "W61", "curl": curl, "observed_lashes": traces, "lower": True})
    for frame in frames(mesh, 180, 216):
        observed = observed_paths(frame, options, 180, 216)
        for item, path in observed:
            after = lifted_path(frame, path, curl, item.lower)
            assert after[0] == pytest.approx(path[0], abs=1e-10)
            assert polyline_length(after) == pytest.approx(polyline_length(path), abs=1e-10)
    result = render_eyes(photo, mesh, options)
    assert result.report["observed_count"] == result.report["rendered_count"] == 16
    assert result.report["length_error_px"] < 1e-10
    assert result.report["invented_natural_lashes"] == 0


def test_w61_downward_trace_can_lift_without_lengthening() -> None:
    photo, mesh, traces = specimen(160, 192)
    frame = frames(mesh, 160, 192)[0]
    u = .5
    v = interpolate(frame.upper, u)
    downward = [frame.point(u, v), frame.point(u + .02, v - .06), frame.point(u + .04, v - .14)]
    after = lifted_path(frame, downward, .9, False)
    assert frame.local(*after[-1])[1] > v
    assert polyline_length(after) == pytest.approx(polyline_length(downward))
    assert photo.size and traces


@pytest.mark.parametrize("feature", ["W61", "W63"])
def test_own_lash_features_refuse_to_invent_missing_hairs(feature: str) -> None:
    photo, mesh, _ = specimen()
    result = render_eyes(photo, mesh, {"feature": feature})
    assert result.report["status"] == "unavailable"
    assert result.report["observed_count"] == 0
    assert "Trace your visible lashes" in result.report["reason"]
    assert np.array_equal(photo, result.image)


def test_w62_cluster_anchors_follow_roll_and_scale_and_report_glasses_collision() -> None:
    photo, mesh, _ = specimen(120, 144, roll=31)
    for frame in frames(mesh, 120, 144):
        request = parse_request({"feature": "W62", "style": "cluster", "glasses_clearance": .05})
        paths, report = strip_strokes(frame, request)
        assert len(paths) == 28
        assert report["groups"] == 7
        assert any("glasses collision" in text for text in report["warnings"])
        for point in report["anchors"]:
            u, v = frame.local(*point)
            assert v == pytest.approx(interpolate(frame.upper, u), abs=1e-10)
        assert "no product availability" in report["product"]
    assert photo.dtype == np.uint8


def test_half_strip_has_no_inner_corner_anchors() -> None:
    photo, mesh, _ = specimen()
    frame = frames(mesh, photo.shape[1], photo.shape[0])[0]
    paths, _ = strip_strokes(frame, parse_request({"feature": "W62", "style": "half_strip"}))
    assert min(frame.local(*p[0])[0] for p in paths) >= .459999


@pytest.mark.parametrize("style", ["lengthening", "volumising", "tubing"])
def test_w63_mascara_coats_only_observed_lashes(style: str) -> None:
    photo, mesh, traces = specimen(140, 168)
    sparse = traces[:2]
    result = render_eyes(photo, mesh, {"feature": "W63", "style": style, "observed_lashes": sparse, "smudge": .3})
    assert result.report["observed_count"] == result.report["rendered_count"] == 2
    assert result.report["invented_natural_lashes"] == 0
    assert result.report["changed_pixels"] > 0


def test_w63_lower_lashes_are_opt_in_and_lengthening_is_bounded() -> None:
    photo, mesh, traces = specimen()
    upper = render_eyes(photo, mesh, {"feature": "W63", "observed_lashes": traces})
    both = render_eyes(photo, mesh, {"feature": "W63", "observed_lashes": traces, "lower": True})
    assert upper.report["rendered_count"] == 10
    assert both.report["rendered_count"] == 16
    path = [(10., 10.), (11., 12.), (12., 14.)]
    assert polyline_length(mascara_path(path, "lengthening", 1)) == pytest.approx(polyline_length(path) * 1.12)
    assert mascara_path(path, "tubing", 1) == path
    assert mascara_path(path, "volumising", 1) == path


def test_low_confidence_traces_are_not_replaced_with_assumed_ones() -> None:
    photo, mesh, traces = specimen()
    low = [{**item, "confidence": .49} for item in traces]
    result = render_eyes(photo, mesh, {"feature": "W61", "observed_lashes": low})
    assert result.report["status"] == "unavailable"
    assert np.array_equal(photo, result.image)


def test_lash_root_far_from_measured_eye_is_rejected() -> None:
    photo, mesh, _ = specimen()
    with pytest.raises(ValueError, match="lash root"):
        render_eyes(photo, mesh, {"feature": "W63", "observed_lashes": [
            {"side": "right", "points": [[.2, .2], [.21, .21]], "confidence": 1.0}]})


def test_seed_is_deterministic_but_extension_variation_is_real() -> None:
    photo, mesh, _ = specimen(192, 224)
    first = render_eyes(photo, mesh, {"feature": "W59", "seed": 17})
    second = render_eyes(photo, mesh, {"feature": "W59", "seed": 17})
    changed = render_eyes(photo, mesh, {"feature": "W59", "seed": 18})
    assert np.array_equal(first.image, second.image)
    assert not np.array_equal(first.image, changed.image)


def test_lash_map_lengths_are_normalized_and_have_no_unearned_mm_precision() -> None:
    photo, mesh, _ = specimen()
    frame = frames(mesh, photo.shape[1], photo.shape[0])[0]
    mapping = extension_map(frame, parse_request({"feature": "W59"}))
    for index, zone in enumerate(mapping["zones"]):
        assert zone["zone"] == index + 1
        assert zone["start"] == pytest.approx(index / 7)
        assert zone["length_px"] == pytest.approx(zone["length_eye_width"] * frame.width)
    assert mapping["zones"][0]["start"] == 0
    assert mapping["zones"][-1]["end"] == 1
    assert mapping["physical_mm"] is None


def test_extension_fit_reports_actual_root_error_and_visible_brow_clearance() -> None:
    from plumb_api.engines.eyes.lashes import fit_metrics
    photo, mesh, _ = specimen(160, 192, roll=20)
    frame = frames(mesh, 160, 192)[0]
    paths, _ = extension_strokes(frame, parse_request({"feature": "W59", "length": .2}))
    fit = fit_metrics(frame, paths)
    assert fit["strokes"] == len(paths)
    assert fit["root_error_px_max"] < 1e-10
    assert fit["projection_kind"] == "image_plane"
    assert fit["physical_fit_verified"] is False
    assert fit["maximum_arc_length_eye_width"] > .1
    result = render_eyes(photo, mesh, {"feature": "W59", "length": .2})
    assert result.report["maps"][0]["fit"]["strokes"] == len(paths)


def test_fit_diagnostics_surface_brow_overlap_without_claiming_physical_clearance() -> None:
    from plumb_api.engines.eyes.lashes import fit_metrics
    photo, mesh, _ = specimen()
    frame = frames(mesh, photo.shape[1], photo.shape[0])[0]
    root = frame.point(.9, interpolate(frame.upper, .9) + .008)
    path = [root, frame.point(1.3, frame.brow_space + .2)]
    fit = fit_metrics(frame, [path])
    assert fit["brow_clearance_eye_width"] == pytest.approx(-.2)
    assert fit["outer_overhang_eye_width"] == pytest.approx(.3)
    assert len(fit["warnings"]) == 2
    assert fit_metrics(frame, [])["root_error_px_max"] is None


def test_fit_rejects_nonfinite_paths_and_does_not_reposition_the_input() -> None:
    from plumb_api.engines.eyes.lashes import fit_metrics
    photo, mesh, _ = specimen()
    frame = frames(mesh, photo.shape[1], photo.shape[0])[0]
    with pytest.raises(ValueError):
        fit_metrics(frame, [[(1., 1.)]])
    with pytest.raises(ValueError):
        fit_metrics(frame, [[(1., 1.), (np.nan, 2.)]])
    paths, _ = extension_strokes(frame, parse_request({"feature": "W59"}))
    saved = [[tuple(point) for point in path] for path in paths]
    fit_metrics(frame, paths)
    assert paths == saved
