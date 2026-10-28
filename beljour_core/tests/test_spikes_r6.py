"""R6 LS1/LS2/LS3 independent, deterministic, consent-safe offline spike tests.

No model downloads, live YouCam requests, external fixtures or user photos.
Author: John Khan.
"""
from __future__ import annotations

import json
import math
import tempfile
from pathlib import Path

import numpy as np
import pytest

from plumb_api.engines.shape import age, gender, turn, geometry
from lab.python.beljour_lab import face_harness as local


@pytest.fixture(scope="module")
def sample():
    return local.synthetic_case(2)


@pytest.mark.parametrize("yaw,pitch,roll", [(-8, 0, 0), (8, 0, 0), (0, -6, 0),
                                            (0, 6, 0), (4, -3, 2), (0, 0, 0)])
def test_turn_projection_preserves_shape_and_uses_bounded_angles(yaw, pitch, roll, sample):
    xyz, _ = sample
    out = turn.project(xyz, yaw, pitch, roll)
    assert np.isfinite(out.points).all()
    assert out.points.shape == (478, 2)
    assert out.depth.shape == (478,)
    if (yaw, pitch, roll) == (0, 0, 0):
        np.testing.assert_allclose(out.points, xyz[:, :2], atol=1e-12)
    else:
        assert np.max(np.abs(out.points - xyz[:, :2])) > 0.01


def test_turn_rejects_excess_angles_and_nonfinite_mesh(sample):
    xyz, _ = sample
    for args in ((8.01, 0, 0), (-8.1, 0, 0), (0, 6.1, 0), (0, 0, 26),
                 (float("nan"), 0, 0)):
        with pytest.raises(ValueError): turn.project(xyz, *args)
    bad = xyz.copy(); bad[10, 2] = np.inf
    with pytest.raises(ValueError): turn.project(bad, 4, 0, 0)


def test_roll_fallback_remains_available_and_unchanged(sample):
    xyz, _ = sample
    angle = turn.roll_from_eyes(xyz)
    assert math.isfinite(angle) and -25 <= angle <= 25
    out = turn.project(xyz, 0, 0, angle)
    assert out.points.shape == (478, 2)


def test_seven_stops_and_sign_aware_interpolation(sample):
    xyz, _ = sample
    assert gender.STOPS == (-100, -66, -33, 0, 33, 66, 100)
    for stop in gender.STOPS:
        par = gender.parameters(stop)
        assert len(par) >= 10
        assert all(math.isfinite(v) for v in par.values())
        out, report = gender.recipe_targets(xyz[:, :2], stop)
        assert out.shape == (478, 2)
        assert report["requested_bands"] == par
        assert report["max_iod_percent"] <= 12 + 1e-6
        assert not report["validated_on_released_photos"]
    a = gender.parameters(33)["jaw_width_fw"]
    b = gender.parameters(66)["jaw_width_fw"]
    c = gender.parameters(49.5)["jaw_width_fw"]
    assert math.isclose(c, (a + b) / 2, abs_tol=1e-12)


def test_gender_stop_zero_original_and_strength_overrides(sample):
    xyz, _ = sample
    original = xyz[:, :2]
    out, r = gender.recipe_targets(original, 0)
    np.testing.assert_allclose(out, original, atol=1e-12)
    assert r["stop"] == "Original"
    a, _ = gender.recipe_targets(original, 66)
    b, _ = gender.recipe_targets(original, 66, region_strengths={name: 0 for name in gender.REGIONS})
    assert np.linalg.norm(a - original) > 0
    np.testing.assert_allclose(b, original, atol=1e-12)
    for scope in gender.SCOPE:
        _, record = gender.recipe_targets(original, 33, scope=scope)
        assert record["styling_pending"] == (scope != "face_only")


def test_gender_rejects_bad_strengths_and_regions(sample):
    face = sample[0][:, :2]
    for value in (-101, 101, float("nan"), True):
        with pytest.raises(ValueError): gender.parameters(value)
    with pytest.raises(ValueError): gender.recipe_targets(face, 33, scope="invalid")
    for factors in ({"invalid": .4}, {"nose": -0.1}, {"nose": 1.51}, {"nose": float("inf")}):
        with pytest.raises(ValueError): gender.recipe_targets(face, -33, region_strengths=factors)


def test_age_strength_stops_and_invalid_parameters():
    for stop in (-3, -2, -1, 1, 2, 3, 4, 5):
        older, fraction, raw = age.age_strength(stop)
        assert older == (stop > 0)
        assert 0 < fraction <= 1
        assert raw == stop
    for bad in (-4, 0, 6, 2.5, True):
        with pytest.raises(ValueError): age.age_strength(bad)
    for value in (-1, 1.01, float("nan")):
        with pytest.raises(ValueError): age.age_strength(3, value)


def test_seeded_spots_repeat_and_mismatched_seed_changes_output(sample):
    xyz, img = sample
    x, mask, m = age.render(img, xyz[:, :2], stop=3, seed=123)
    y, mask2, m2 = age.render(img, xyz[:, :2], stop=3, seed=123)
    np.testing.assert_array_equal(x, y)
    np.testing.assert_array_equal(mask, mask2)
    assert m == m2
    assert m["label"] == age.LABEL and not m["released_photo_validated"]
    z, _, _ = age.render(img, xyz[:, :2], stop=3, seed=124)
    assert np.count_nonzero(x != z) > 0
    assert np.count_nonzero(mask) > 0
    assert not np.any(mask[0, :]) and not np.any(mask[-1, :])


def test_age_zero_strength_is_identity_and_shape_is_guarded(sample):
    xyz, img = sample
    output, edit, report = age.render(img, xyz[:, :2], stop=5, strength=0)
    np.testing.assert_array_equal(output, img)
    assert not np.any(edit)
    assert report["strength_used"] == 0
    for stop in (-3, 5):
        result, mask, stats = age.render(img, xyz[:, :2], stop=stop, seed=1)
        assert result.shape == img.shape and result.dtype == np.uint8
        assert 0 < stats["strength_used"] <= 1
        assert mask.min() >= 0 and mask.max() <= 1
        np.testing.assert_array_equal(result[0, 0], img[0, 0])


def test_age_layer_overrides_validate_and_hair_is_opt_in(sample):
    xyz, img = sample
    for options in ({"unknown": .5}, {"hair": 1.2}, {"texture": float("nan")}):
        with pytest.raises(ValueError): age.layer_settings(options)
    mask = np.zeros(img.shape[:2]); mask[10:30, 15:40] = 1
    _, _, without = age.render(img, xyz[:, :2], stop=3, layers={"hair": 0}, hair_mask=mask)
    _, _, with_hair = age.render(img, xyz[:, :2], stop=3, hair_mask=mask)
    assert without["grey_pixels"] == 0
    assert with_hair["grey_pixels"] > 0
    with pytest.raises(ValueError): age.render(img, xyz[:, :2], stop=3, hair_mask=np.ones((5, 5)))


def test_local_reports_are_atomic_private_synthetic_only(sample, tmp_path):
    xyz, img = sample
    data = [local.Input(xyz, img, "synthetic", "synthetic-2")]
    reports = local.evaluate(data, tmp_path)
    assert set(reports) == {"LS1", "LS2", "LS3"}
    for name, record in reports.items():
        assert record["format"] == "beljour-local-spike-report/1"
        assert record["simulation"] and record["human_review"] == "PENDING"
        assert record["decision"] == "UNVERIFIED"
        assert record["device_runtime"] == "NOT_MEASURED"
        assert record["fixtures_evaluated"] == 1
        assert record["automated_passed"] <= record["automated_total"]
        text = (tmp_path / f"{name.lower()}-report.json").read_text()
        assert "base64" not in text and "YOUCAM_API_KEY" not in text
        assert "synthetic-2" in text
        assert json.loads(text) == record
    assert not (tmp_path / "previews").exists()


def test_released_mode_requires_explicit_consent_before_file_access(tmp_path):
    with pytest.raises(ValueError, match="adult-confirmed"):
        local.released_case(tmp_path / "unknown.json", tmp_path / "unknown.jpg", face_id=None, adult_confirmed=False)


def test_invalid_synthetic_case_seeds_fail():
    for seed in (0, 10, -1):
        with pytest.raises(ValueError): local.synthetic_case(seed)


def test_manifest_can_select_six_distinct_released_photos_without_live_services(monkeypatch, tmp_path, sample):
    document = {"format": "beljour-r6-photo-manifest/1", "photos": [
        {"fixture": f"fixture-{i}.json", "image": f"picture-{i}.png", "face_id": "main"}
        for i in range(1, 7)]}
    path = tmp_path / "photos.json"
    path.write_text(json.dumps(document))
    calls = []

    def fake_released(fixture_path, photo_path, *, face_id, adult_confirmed):
        assert face_id == "main" and adult_confirmed
        assert fixture_path.parent == tmp_path and photo_path.parent == tmp_path
        calls.append((fixture_path, photo_path))
        number = fixture_path.stem.rsplit("-", 1)[-1]
        return local.Input(*sample, "released", f"released-{number}")

    monkeypatch.setattr(local, "released_case", fake_released)
    with pytest.raises(ValueError, match="adult-confirmed"):
        local.released_manifest(path, adult_confirmed=False)
    result = local.released_manifest(path, adult_confirmed=True)
    assert len(result) == len(calls) == 6
    assert len({r.case_id for r in result}) == 6
    assert all(r.kind == "released" for r in result)


def test_manifest_rejects_missing_wrong_or_duplicate_entries(monkeypatch, tmp_path, sample):
    path = tmp_path / "photos.json"
    documents = [
        {}, {"format": "other", "photos": []},
        {"format": "beljour-r6-photo-manifest/1", "photos": []},
        {"format": "beljour-r6-photo-manifest/1", "photos": [{"image": "only.png"}]},
        {"format": "beljour-r6-photo-manifest/1", "photos": [{"fixture": "https://bad.test/file", "image": "photo.png"}]},
        {"format": "beljour-r6-photo-manifest/1", "photos": [{"fixture": "f.json", "image": "i.png", "secret": "not allowed"}]},
    ]
    for record in documents:
        path.write_text(json.dumps(record))
        with pytest.raises(ValueError): local.released_manifest(path, adult_confirmed=True)
    valid = {"format": "beljour-r6-photo-manifest/1", "photos": [
        {"fixture": "f1.json", "image": "a.png"}, {"fixture": "f2.json", "image": "a.png"}]}
    path.write_text(json.dumps(valid))
    monkeypatch.setattr(local, "released_case", lambda *a, **k: local.Input(*sample, "released", "same"))
    with pytest.raises(ValueError, match="same released photo"):
        local.released_manifest(path, adult_confirmed=True)


def test_manifest_cli_requires_consent_without_calling_any_external_provider(tmp_path):
    from lab.python.beljour_lab.face_harness import released_manifest
    with pytest.raises(ValueError, match="adult-confirmed"):
        released_manifest(tmp_path / "does-not-exist.json", adult_confirmed=False)
