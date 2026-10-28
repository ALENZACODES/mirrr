"""R19B Lane B EASY filter behaviour and identity-lock tests. Author: John Khan."""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pytest

from plumb_api.filters import easy
from plumb_api.filters.easy import bridal, eye_colour, fun, glasses, parity, retro, summer
from plumb_api.filters.easy.common import Point, unchanged_fraction

ROOT = Path(__file__).resolve().parents[3]
PARITY_PATH = ROOT / "parity" / "r19b-easy-filters.json"


def _fixture() -> tuple[np.ndarray, dict[str, np.ndarray], dict[str, Point]]:
    return parity.fixture()


def _changed(before: np.ndarray, after: np.ndarray) -> int:
    return int(np.count_nonzero(np.any(before[..., :3] != after[..., :3], axis=2)))


def _skin_mean(image: np.ndarray, mask: np.ndarray) -> float:
    return float(image[..., :3][mask > 0].astype(np.float64).mean())


def test_parity_file_is_exactly_regenerated_by_python() -> None:
    expected = parity.vectors()
    actual = json.loads(PARITY_PATH.read_text(encoding="utf-8"))
    assert actual == expected


def test_adult_only_contract_is_explicit() -> None:
    assert easy.ADULT_ONLY is True


def test_plain_labels_are_one_line_and_own_names() -> None:
    labels = [retro.LABEL, eye_colour.LABEL, glasses.LABEL, fun.LABEL, summer.LABEL, bridal.LABEL]
    assert len(labels) == 6
    assert all("\n" not in label and 20 <= len(label) <= 120 for label in labels)
    assert [label.split(" — ", 1)[0] for label in labels] == [
        "Archive Flash", "Iris Tint", "Atelier Frames", "Playful Paws", "Sunlit Skin", "Ceremony Light Check"
    ]


def test_retro_changes_photo_but_preserves_identity_and_iris_exactly() -> None:
    image, masks, _ = _fixture()
    out = retro.render(
        image,
        retro.RetroOptions(0.75, 0.4, 0.3, 11),
        protected=masks["protected"],
        background=masks["background"],
        iris=masks["iris"],
    )
    assert _changed(image, out) > image.shape[0] * image.shape[1] // 3
    assert unchanged_fraction(image, out, masks["protected"]) == 1.0
    assert unchanged_fraction(image, out, masks["iris"]) == 1.0
    assert np.array_equal(out[..., 3], image[..., 3])


def test_retro_is_deterministic_and_seed_changes_only_grain_pattern() -> None:
    image, masks, _ = _fixture()
    kwargs = dict(protected=masks["protected"], background=masks["background"], iris=masks["iris"])
    first = retro.render(image, retro.RetroOptions(seed=9), **kwargs)
    second = retro.render(image, retro.RetroOptions(seed=9), **kwargs)
    other = retro.render(image, retro.RetroOptions(seed=10), **kwargs)
    assert np.array_equal(first, second)
    assert not np.array_equal(first, other)
    assert np.array_equal(first[masks["iris"] > 0], other[masks["iris"] > 0])


def test_retro_rejects_invalid_controls() -> None:
    with pytest.raises(ValueError, match="0..1"):
        retro.RetroOptions(strength=1.1)


def test_eye_colour_changes_only_editable_iris_and_keeps_pupil_highlight() -> None:
    image, masks, _ = _fixture()
    out = eye_colour.render(
        image,
        masks["iris"],
        masks["pupil"],
        masks["highlight"],
        eye_colour.EyeColourOptions((82, 130, 146), 0.8),
        protected=masks["protected"],
    )
    editable = (masks["iris"] > 0) & (masks["pupil"] == 0) & (masks["highlight"] == 0)
    outside = masks["iris"] == 0
    assert np.count_nonzero(np.any(out[editable, :3] != image[editable, :3], axis=1)) > 0
    assert np.array_equal(out[outside], image[outside])
    assert np.array_equal(out[masks["pupil"] > 0], image[masks["pupil"] > 0])
    assert np.array_equal(out[masks["highlight"] > 0], image[masks["highlight"] > 0])
    assert unchanged_fraction(image, out, masks["protected"]) == 1.0


def test_eye_colour_zero_amount_is_identity() -> None:
    image, masks, _ = _fixture()
    out = eye_colour.render(
        image,
        masks["iris"],
        masks["pupil"],
        masks["highlight"],
        eye_colour.EyeColourOptions((90, 120, 130), 0.0),
    )
    assert np.array_equal(out, image)


@pytest.mark.parametrize("style", ("round", "soft_square", "wire"))
def test_glasses_front_view_changes_frame_area_but_keeps_iris(style: glasses.FrameStyle) -> None:
    image, masks, points = _fixture()
    out = glasses.render(
        image,
        points["left_eye"],
        points["right_eye"],
        glasses.GlassesOptions(style, (40, 38, 36), 1.0, 0.055),
        iris=masks["iris"],
        protected=masks["protected"],
    )
    assert _changed(image, out) > 10
    assert unchanged_fraction(image, out, masks["iris"]) == 1.0
    assert unchanged_fraction(image, out, masks["protected"]) == 1.0


def test_glasses_scale_validation() -> None:
    with pytest.raises(ValueError, match="scale"):
        glasses.GlassesOptions(scale=1.4)


def test_fun_tongue_absent_when_mouth_closed_and_present_when_open() -> None:
    image, masks, points = _fixture()
    closed = fun.render(
        image,
        points["left_eye"],
        points["right_eye"],
        points["nose"],
        points["mouth"],
        fun.FunOptions(1.0, 0.0),
        iris=masks["iris"],
    )
    opened = fun.render(
        image,
        points["left_eye"],
        points["right_eye"],
        points["nose"],
        points["mouth"],
        fun.FunOptions(1.0, 0.8),
        iris=masks["iris"],
    )
    lower = slice(int(points["mouth"].y), image.shape[0])
    assert _changed(closed[lower], opened[lower]) > 0
    assert unchanged_fraction(image, opened, masks["iris"]) == 1.0


def test_fun_anchor_geometry_scales_with_eye_distance() -> None:
    image, masks, points = _fixture()
    base = fun.render(image, points["left_eye"], points["right_eye"], points["nose"], points["mouth"], fun.FunOptions(1.0, 0.7))
    wider_right = Point(points["right_eye"].x + 3.0, points["right_eye"].y)
    wider = fun.render(image, points["left_eye"], wider_right, points["nose"], points["mouth"], fun.FunOptions(1.0, 0.7))
    assert _changed(image, wider) > _changed(image, base)
    assert unchanged_fraction(image, wider, masks["protected"]) == 1.0


def test_summer_glow_never_lightens_skin_mean_and_preserves_iris_marks() -> None:
    image, masks, _ = _fixture()
    out = summer.render(
        image,
        masks["skin"],
        summer.SummerOptions("olive", 0.42, 0.7, 27),
        cheek_nose=masks["cheek_nose"],
        iris=masks["iris"],
        protected=masks["protected"],
    )
    assert _skin_mean(out, masks["skin"]) <= _skin_mean(image, masks["skin"]) + 0.01
    assert unchanged_fraction(image, out, masks["iris"]) == 1.0
    assert unchanged_fraction(image, out, masks["protected"]) == 1.0


@pytest.mark.parametrize("undertone", ("cool", "neutral", "warm", "olive"))
def test_summer_undertones_are_local_and_deterministic(undertone: summer.Undertone) -> None:
    image, masks, _ = _fixture()
    options = summer.SummerOptions(undertone, 0.3, 0.4, 9)
    first = summer.render(image, masks["skin"], options, cheek_nose=masks["cheek_nose"])
    second = summer.render(image, masks["skin"], options, cheek_nose=masks["cheek_nose"])
    outside = masks["skin"] == 0
    assert np.array_equal(first, second)
    assert np.array_equal(first[outside], image[outside])


def test_bridal_bundle_keeps_iris_and_identity_marks() -> None:
    image, masks, _ = _fixture()
    out = bridal.render(
        image,
        masks["skin"],
        masks["lips"],
        masks["eyes"],
        masks["cheeks"],
        iris=masks["iris"],
        protected=masks["protected"],
    )
    assert _changed(image, out) > 0
    assert unchanged_fraction(image, out, masks["iris"]) == 1.0
    assert unchanged_fraction(image, out, masks["protected"]) == 1.0


def test_bridal_flash_check_is_bounded_and_plain() -> None:
    image, masks, _ = _fixture()
    out = bridal.render(image, masks["skin"], masks["lips"], masks["eyes"], masks["cheeks"])
    report = bridal.flash_check(out, masks["skin"], masks["lips"])
    assert 0.0 <= report.daylight_drift < report.flash_drift < 8.0
    assert 0.0 <= report.venue_drift < 8.0
    assert report.passed is True


def test_alpha_channel_is_preserved_across_every_filter() -> None:
    image, masks, points = _fixture()
    outputs = [
        retro.render(image, iris=masks["iris"]),
        eye_colour.render(image, masks["iris"], masks["pupil"], masks["highlight"]),
        glasses.render(image, points["left_eye"], points["right_eye"], iris=masks["iris"]),
        fun.render(image, points["left_eye"], points["right_eye"], points["nose"], points["mouth"], iris=masks["iris"]),
        summer.render(image, masks["skin"], iris=masks["iris"]),
        bridal.render(image, masks["skin"], masks["lips"], masks["eyes"], masks["cheeks"], iris=masks["iris"]),
    ]
    assert all(np.array_equal(output[..., 3], image[..., 3]) for output in outputs)


def test_assets_are_procedural_and_no_third_party_files_are_added() -> None:
    package = ROOT / "api" / "plumb_api" / "filters" / "easy"
    forbidden = {".png", ".jpg", ".jpeg", ".svg", ".cube", ".lut", ".webp"}
    assert not [path for path in package.rglob("*") if path.suffix.lower() in forbidden]


def test_pass_definitions_are_complete_and_strict() -> None:
    from plumb_api.filters.easy import evaluation

    assert evaluation.validate_definitions() == ()
    assert {item.filter_id for item in evaluation.PASS_DEFINITIONS} == {
        "playful_paws",
        "archive_flash",
        "iris_tint",
        "atelier_frames",
        "sunlit_skin",
        "ceremony_light_check",
    }
    assert all(item.protected_unchanged == 1.0 for item in evaluation.PASS_DEFINITIONS)
    assert all(item.alpha_unchanged == 1.0 for item in evaluation.PASS_DEFINITIONS)


def test_identity_evaluator_accepts_retro_fixture() -> None:
    from plumb_api.filters.easy import evaluation

    image, masks, _ = _fixture()
    out = retro.render(
        image,
        retro.RetroOptions(0.75, 0.4, 0.3, 11),
        protected=masks["protected"],
        background=masks["background"],
        iris=masks["iris"],
    )
    result = evaluation.evaluate(
        "archive_flash",
        image,
        out,
        masks["protected"],
        iris=masks["iris"],
    )
    assert result.passed is True
    assert result.failures == ()
    assert result.metrics.protected_unchanged == 1.0
    assert result.metrics.iris_unchanged == 1.0


def test_identity_evaluator_requires_iris_evidence_for_non_eye_filters() -> None:
    from plumb_api.filters.easy import evaluation

    image, masks, _ = _fixture()
    out = retro.render(image)
    result = evaluation.evaluate("archive_flash", image, out, masks["protected"])
    assert result.passed is False
    assert "iris evidence missing" in result.failures


def test_identity_evaluator_allows_iris_change_only_for_iris_tint() -> None:
    from plumb_api.filters.easy import evaluation

    image, masks, _ = _fixture()
    out = eye_colour.render(image, masks["iris"], masks["pupil"], masks["highlight"])
    result = evaluation.evaluate("iris_tint", image, out, masks["protected"])
    assert result.passed is True
    assert result.metrics.iris_unchanged is None


def test_identity_evaluator_detects_protected_pixel_change() -> None:
    from plumb_api.filters.easy import evaluation

    image, masks, _ = _fixture()
    altered = image.copy()
    y, x = np.argwhere(masks["protected"] > 0)[0]
    altered[y, x, 0] ^= 1
    result = evaluation.evaluate("archive_flash", image, altered, masks["protected"], iris=masks["iris"])
    assert result.passed is False
    assert "protected identity pixels changed" in result.failures


def test_identity_evaluator_detects_alpha_change() -> None:
    from plumb_api.filters.easy import evaluation

    image, masks, _ = _fixture()
    altered = image.copy()
    altered[0, 0, 3] = 0
    result = evaluation.evaluate("archive_flash", image, altered, masks["protected"], iris=masks["iris"])
    assert result.passed is False
    assert "alpha channel changed" in result.failures


def test_catalogue_maps_exact_built_and_skipped_gap_rows() -> None:
    from plumb_api.filters.easy import catalogue

    assert catalogue.validate_catalogue() == ()
    assert [item.gap_row for item in catalogue.FILTERS] == [14, 20, 25, 26, 27, 30]
    assert [item.gap_row for item in catalogue.SKIPPED] == [4, 28]
    assert all(item.provider == "local" and item.adult_only for item in catalogue.FILTERS)


def test_catalogue_identity_policy_allows_only_iris_tint_to_change_eye_colour() -> None:
    from plumb_api.filters.easy import catalogue

    for item in catalogue.FILTERS:
        expected = "change_iris_preserve_marks" if item.filter_id == "iris_tint" else "preserve_iris_and_marks"
        assert item.identity_policy == expected


def test_catalogue_lookup_is_total_for_built_rows_and_rejects_other_rows() -> None:
    from plumb_api.filters.easy import catalogue

    for item in catalogue.FILTERS:
        assert catalogue.by_id(item.filter_id) == item
        assert catalogue.by_gap_row(item.gap_row) == item
    with pytest.raises(ValueError, match="not built"):
        catalogue.by_gap_row(4)
