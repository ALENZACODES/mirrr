"""R17A mask safety: only synthetic alpha fields and drawn geometry.

Tests treat a supplied protection map as externally verified input; none is
fabricated from a head-covering demographic/annotation tag. Author: John Khan.
"""
from __future__ import annotations

import itertools
import json
import sys
from pathlib import Path

import numpy as np
import pytest

from plumb_api.quality import visibility_masks as vm

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tests" / "realface"))
import realface_lib as lib  # noqa: E402


def geometry(height: int = 32, width: int = 48) -> dict[str, np.ndarray]:
    """Drawn face rectangle with partly occluded profile features."""
    oval = np.zeros((height, width), np.float32)
    oval[4:height - 4, 8:width - 8] = 1.0
    masks = {name: np.zeros_like(oval) for name in vm.REGION_KEYS}
    masks["face_oval"] = oval
    for name in vm.CHILD_KEYS:
        masks[name][height // 3:height * 2 // 3, width // 2:width - 3] = .8
    masks["skin"] = oval * .9
    return masks


def covered(height: int = 32, width: int = 48) -> np.ndarray:
    field = np.zeros((height, width), np.float32)
    field[4:height - 4, 8:width // 2] = 1.0
    return field


def test_original_geometry_is_never_mutated_by_profile_or_occlusion():
    input_masks = geometry()
    old = {name: arr.copy() for name, arr in input_masks.items()}
    annotation = covered()
    old_mask = annotation.copy()
    output = vm.prepare(input_masks, protected_mask=annotation, pose="profile", occlusion="hijab")
    assert output.status == "PROTECTED_ANNOTATION"
    for name in vm.REGION_KEYS:
        assert np.array_equal(old[name], input_masks[name])
    assert np.array_equal(annotation, old_mask)


def test_all_edit_masks_are_alpha_in_unit_interval_after_trimming():
    output = vm.prepare(geometry(), protected_mask=covered(), pose="profile", occlusion="hijab")
    assert set(output.editable) == vm.REGION_KEYS
    assert set(output.geometry) == vm.REGION_KEYS
    for mask in output.editable.values():
        assert mask.dtype == np.float32
        assert np.isfinite(mask).all()
        assert np.min(mask) >= 0
        assert np.max(mask) <= 1


def test_geometry_and_edit_layers_are_separate_arrays():
    output = vm.prepare(geometry(), protected_mask=covered())
    for name in vm.REGION_KEYS:
        assert not np.shares_memory(output.editable[name], output.geometry[name])
        assert output.editable[name] is not output.geometry[name]


def test_head_covering_requires_explicit_protected_pixel_evidence():
    for occlusion in ["hijab", "headscarf", "head_covering"]:
        output = vm.prepare(geometry(), occlusion=occlusion)
        assert output.status == "UNPROVEN"
        assert not output.protected_supplied
        assert output.reduced_area == pytest.approx(0)
        assert output.count_only()["protected_mask_supplied"] is False


def test_empty_protected_annotation_does_not_prove_hijab_safety():
    mask = np.zeros((32, 48), np.float32)
    result = vm.prepare(geometry(), protected_mask=mask, occlusion="hijab")
    assert result.status == "UNPROVEN"
    assert result.protected_supplied
    assert result.reduced_area == 0


def test_full_protected_field_never_falls_back_to_unprotected_skin():
    mask = np.ones((32, 48), np.float32)
    result = vm.prepare(geometry(), protected_mask=mask, occlusion="hijab")
    assert all(not np.any(result.editable[name]) for name in vm.REGION_KEYS)
    assert any(np.any(result.geometry[name]) for name in vm.REGION_KEYS)
    assert result.reduced_area == 1.0
    assert result.max_protected_alpha == 0


def test_partial_protection_is_fractional_not_binary():
    mask = covered()
    mask[mask == 1] = .4
    result = vm.prepare(geometry(), protected_mask=mask, occlusion="head_covering")
    for name in vm.REGION_KEYS:
        original = geometry()[name]
        assert np.allclose(result.editable[name], original * (1.0 - mask), atol=1e-7)
    assert 0 < result.reduced_area < 1


def test_hijab_protection_never_invents_new_opaque_surface():
    masks = geometry()
    result = vm.prepare(masks, protected_mask=covered(), pose="profile", occlusion="hijab")
    for name in vm.REGION_KEYS:
        assert np.all(result.editable[name] <= masks[name] + 1e-7)


def test_protected_region_edit_alpha_is_zero_under_full_covering():
    result = vm.prepare(geometry(), protected_mask=covered(), occlusion="hijab")
    for name in vm.REGION_KEYS:
        assert float(np.max(result.editable[name][covered() == 1])) == 0.0


def test_side_profile_child_features_are_bounded_by_visible_silhouette():
    raw = geometry()
    result = vm.prepare(raw, pose="profile", occlusion="none")
    oval = raw["face_oval"]
    for name in vm.CHILD_KEYS:
        assert np.all(result.editable[name] <= oval + 1e-7)
    assert result.silhouette_leak == 0
    assert result.status == "VISIBLE_GEOMETRY_ONLY"


def test_profile_never_expands_far_eye_into_headwear_or_background():
    masks = geometry()
    eye = masks["left_eye"]
    assert np.any(eye > masks["face_oval"])
    visible = vm.prepare(masks, pose="profile")
    assert float(visible.editable["left_eye"].sum()) < float(eye.sum())
    assert np.sum(visible.editable["left_eye"][masks["face_oval"] == 0]) == 0


def test_profile_skin_mask_preserves_face_oval_as_independent_reference():
    masks = geometry()
    visible = vm.prepare(masks, pose="side_profile")
    assert np.array_equal(visible.geometry["face_oval"], masks["face_oval"])
    assert np.all(visible.editable["skin"] <= masks["skin"] + 1e-7)


def test_frontal_without_occluder_keeps_expected_original_mask_values():
    masks = geometry()
    visible = vm.prepare(masks, pose="frontal", occlusion="none")
    for name in vm.REGION_KEYS:
        assert np.array_equal(visible.editable[name], masks[name])
    assert visible.status == "NO_OCCLUSION_REPORTED"
    assert visible.silhouette_leak == 0


def test_safety_helper_never_claims_that_landmark_accuracy_was_measured():
    data = vm.prepare(geometry(), pose="side", occlusion="hijab").count_only()
    assert data["occlusion_evidence"] == "UNPROVEN"
    assert not any(key in data for key in ("landmarks_pass", "identity", "anatomy", "gate_pass"))


def test_aggregate_visibility_metadata_never_contains_raw_masks_or_coords():
    data = vm.prepare(geometry(), protected_mask=covered(), pose="profile", occlusion="hijab").count_only()
    encoded = json.dumps(data, allow_nan=False)
    assert "array" not in encoded
    assert "face_id" not in encoded
    assert "filepath" not in encoded
    assert "vertices" not in encoded
    assert "pixel" not in encoded
    assert all(isinstance(value, (str, float, bool)) for value in data.values())


@pytest.mark.parametrize("pose", ["frontal", "profile", "side", "side_profile", "unknown"])
@pytest.mark.parametrize("occlusion", ["none", "head_covering", "hijab", "headscarf", "unknown"])
def test_supported_pose_covering_combinations_never_create_alpha(pose, occlusion):
    raw = geometry()
    result = vm.prepare(raw, pose=pose, occlusion=occlusion)
    assert set(result.geometry) == set(result.editable)
    assert all(np.all(result.editable[name] <= raw[name] + 1e-7) for name in vm.REGION_KEYS)
    assert 0 <= result.reduced_area <= 1
    assert result.profile == (pose in {"profile", "side", "side_profile"})


@pytest.mark.parametrize("name", sorted(vm.REGION_KEYS))
def test_every_region_is_protected_even_if_only_that_one_overlaps(name):
    raw = geometry()
    result = vm.prepare(raw, protected_mask=covered())
    expected = raw[name] * (1 - covered())
    assert np.allclose(result.editable[name], expected, atol=1e-7)


@pytest.mark.parametrize("removed", sorted(vm.REGION_KEYS))
def test_missing_expected_region_is_refused_not_silently_ignored(removed):
    raw = geometry()
    raw.pop(removed)
    with pytest.raises(ValueError, match="thirteen"):
        vm.prepare(raw)


@pytest.mark.parametrize("extra", ["headwear", "outer_face", "background", "private-image.png"])
def test_unknown_region_names_cannot_be_passed_as_a_validated_set(extra):
    raw = geometry()
    raw[extra] = np.ones((32, 48), np.float32)
    with pytest.raises(ValueError, match="thirteen"):
        vm.prepare(raw)


@pytest.mark.parametrize("value", [-.001, 1.001, float("nan"), float("inf"), float("-inf")])
@pytest.mark.parametrize("name", ["face_oval", "skin", "right_eye", "left_iris"])
def test_bad_or_nonfinite_mask_alpha_rejected_at_boundary(value, name):
    raw = geometry()
    raw[name][4, 10] = value
    with pytest.raises(ValueError):
        vm.prepare(raw)


@pytest.mark.parametrize("shape", [(1, 1), (24, 48), (32, 24), (32, 48, 3)])
def test_protection_dimensions_must_match_exact_region_shape(shape):
    with pytest.raises(ValueError):
        vm.prepare(geometry(), protected_mask=np.zeros(shape, np.float32))


@pytest.mark.parametrize("value", [float("nan"), -.01, 1.01, float("inf")])
def test_unknown_or_unsafe_protection_values_are_rejected(value):
    field = covered()
    field[3, 3] = value
    with pytest.raises(ValueError):
        vm.prepare(geometry(), protected_mask=field)


@pytest.mark.parametrize("bad", ["hijab_image.png", "back_of_head", "unmeasured", "garment_dream"])
def test_unregistered_covering_annotations_fail_closed(bad):
    with pytest.raises(ValueError):
        vm.prepare(geometry(), occlusion=bad)


@pytest.mark.parametrize("bad", ["looking_right_60deg", "nose", "profile.png", "half_face"])
def test_unregistered_pose_annotations_fail_closed(bad):
    with pytest.raises(ValueError):
        vm.prepare(geometry(), pose=bad)


def test_mask_operation_is_deterministic_under_repeated_calls():
    raw = geometry()
    field = covered()
    a = vm.prepare(raw, protected_mask=field, occlusion="hijab", pose="side")
    b = vm.prepare(raw, protected_mask=field, occlusion="hijab", pose="side")
    assert a.count_only() == b.count_only()
    assert all(np.array_equal(a.editable[k], b.editable[k]) for k in vm.REGION_KEYS)


def test_mask_safety_does_not_depend_on_skin_tone_or_rgb_colours():
    first = vm.prepare(geometry(), protected_mask=covered(), occlusion="hijab")
    second = vm.prepare(geometry(), protected_mask=covered(), occlusion="hijab")
    assert first.count_only() == second.count_only()
    # No RGB photo or ethnicity is an argument to this function.
    assert "skin" in first.editable


def test_empty_face_oval_keeps_profile_verdict_unproven():
    masks = geometry()
    masks["face_oval"][:] = 0
    result = vm.prepare(masks, pose="profile")
    assert result.status == "UNPROVEN"
    assert all(np.sum(result.editable[name]) == 0 for name in vm.CHILD_KEYS)


def test_partial_protection_quantization_is_bounded():
    field = covered()
    for intensity in (.125, .25, .5, .75, 1.0):
        mask = field * intensity
        out = vm.prepare(geometry(), protected_mask=mask)
        assert 0 < out.reduced_area <= 1
        assert all(np.isfinite(value).all() for value in out.editable.values())
        for name in vm.REGION_KEYS:
            assert np.all(out.editable[name] >= 0)


def test_all_protection_patterns_are_local_and_do_not_write_images(tmp_path, monkeypatch):
    def forbidden(*args: object, **kwargs: object) -> None:
        raise AssertionError("no disk writes allowed")

    monkeypatch.setattr(Path, "write_bytes", forbidden)
    for pose, occlusion in itertools.product(["frontal", "side"], ["none", "hijab"]):
        result = vm.prepare(geometry(), protected_mask=covered(), pose=pose, occlusion=occlusion)
        assert result.editable
    assert not any(tmp_path.iterdir())


def test_realface_regions_method_keeps_frozen_geometry_rules_unchanged(monkeypatch, tmp_path):
    """Unsafe occluded edit alpha must not be used to declare an R12 gate pass."""
    class Detector:
        def __init__(self, models: object) -> None:
            pass

    monkeypatch.setattr(lib, "Detectors", Detector)
    bench = lib.Bench(tmp_path, modules=("regions",))

    class Regions:
        def region_masks(self, *args: object, **kwargs: object) -> dict[str, np.ndarray]:
            return geometry()

        def region_diagnostics(self, *args: object, **kwargs: object) -> dict[str, object]:
            return {"invalid_geometry": False, "not_visible": {}, "hull_fallback": []}

    bench.m["regions"] = Regions()
    results: list[dict[str, object]] = []

    def add(module: str, check: str, ok: bool, seconds: float, **extra: object) -> None:
        results.append({"module": module, "check": check, "pass": ok, **extra})

    im = np.full((32, 48, 3), 80, np.uint8)
    pts = np.zeros((478, 2), np.float64)
    xyz = np.zeros((478, 3), np.float64)
    bench._regions(im, xyz, pts, 10.0, add, protected_mask=covered(),
                   pose="profile", occlusion="hijab")
    assert len(results) == 1
    row = results[0]
    assert row["protected_mask_supplied"] is True
    assert row["occlusion_evidence"] == "PROTECTED_ANNOTATION"
    assert row["visibility_annotation"] == "hijab"
    assert row["invalid_geometry"] is False
    assert row["skin_share"] == pytest.approx(.9, abs=.1)
    assert not row["pass"]  # drawn raw features extend too far; no gate can be waved through
    assert "editable" not in row
    assert "protected_mask" not in row
