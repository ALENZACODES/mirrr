"""Unchanged report bytes and face-scoped preparation for the R30B face gate.

Only drawn, in-memory portraits. The hashes below were recorded from the
untouched 389cb26 implementation before changing its cache layout. They lock
the exact JSON record, not a tolerance or an image-derived identity. No photo,
mesh, segmentation mask or local filesystem test asset is emitted.
Author: John Khan.
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, replace
from unittest.mock import patch

import numpy as np
import pytest

from plumb_api.filters import engine
from plumb_api.filters.masks import blend
from plumb_api.filters.qa import fixtures, performance, report, still_her
from plumb_api.filters.recipe import registry

FIXTURE_SEED = 31
FIXTURE_WIDTH = 84
FIXTURE_HEIGHT = 104
IDS = ("C01", "C03", "C08", "M02", "C23")
FROZEN: dict[str, tuple[str, ...]] = {
    "very_light": (
        "81df316f6a9df9faf70f510a5708cfc9f907542abb1ad96c53bd62eba89cdea4",
        "c86c2daf36f524d74cd5c74b06c24ece869eb15640769f3fa6bae62bde98a46d",
        "24b820ccf01d8b1de98112aff373e9273e9e7483c8e97f4235c234b33a6914f1",
        "321cf93a00e66d33b589efd93f4fbb17b339ec6d84e9f0eb551b4323fc095752",
        "2bad6e8ac54103db9450ccf2048be85e1e9f3b389d35ae55ddecef6f8712f148",
    ),
    "medium": (
        "9419e6cce6d94360d254f62ec06e0050d5373107fa29f1708660867e79364c3a",
        "3d0d1897cda2323d5160a3df9ed11b809810fecbe3e4502bc74f09e43553c0e9",
        "047255afc5d0c798560e32daa72f43c3daa19289232d17c359cf541962207023",
        "85e12f6a875303f04a4dafbdb23d2032783c46a71886ba423e3ba0ae6f18e73b",
        "39adfb1a3688af3d21db990a8dbb568b39f8597c911a33cf4cea8729b0f42a8b",
    ),
    "dark": (
        "26f1c82eb937cad4b5118fc8b79e3a72aec33853ab94fc690eebe1460ca8cedb",
        "ec64e6c7887dc7aca2c93e64dbf8785ce2ebbd1c8857152f9ccf7ce9a2c02596",
        "07284169da8e24e5110f0ad30c00a47d77a316ceaa0f39265b2a64313c607a31",
        "ac661d9be88e9267f266b7ca443394d31f4e0ed92319e3ec698fa8cf21f24c0f",
        "a17890ced23448d5081c058dc232dbca6a3b591ccd794a9faab33bac3fb446a2",
    ),
    "very_dark": (
        "6c3efeced352682fe1394b7831df8fbc93669e0a63ad4e18495320a1c783a266",
        "4173992331ccd9671ece3d767df9793b32fa346a38de430ac7366b9166848972",
        "b4b728e80778c6b0b49769989e730c1ed898abd7f996acfdfcaa30305fcaf655",
        "8aba6539505170cfb6629887609af967c6ea2cd596dc4f54819420598b611a9d",
        "2db033589a0a346f14f341c6fd834a0b9abedfce91a4fe60526db14982c64920",
    ),
}


def record_bytes(item: still_her.ToneReport) -> bytes:
    """Capture all floating-point fields and ordered flags exactly."""
    return json.dumps(
        asdict(item),
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=True,
        allow_nan=False,
    ).encode("utf-8")


def face(tone: str = "medium") -> fixtures.Portrait:
    """Return a new generated fixture, never a stored or uploaded face."""
    return fixtures.portrait(
        tone,
        seed=FIXTURE_SEED,
        width=FIXTURE_WIDTH,
        height=FIXTURE_HEIGHT,
        grain=5,
    )


def recipes() -> list[dict[str, object]]:
    return [registry.default().get(code) for code in IDS]


@pytest.mark.parametrize("tone", list(FROZEN))
def test_original_base_row_bytes_stay_frozen_on_cached_and_uncached_paths(tone: str) -> None:
    portrait = face(tone)
    source = still_her.prepare_face(portrait.image, portrait.face.points, portrait.masks)
    assert source.face_centre == fixtures.face_centre(portrait)
    before = portrait.image.copy()
    for code, golden in zip(IDS, FROZEN[tone], strict=True):
        recipe = registry.default().get(code)
        original = still_her.measure_image(
            recipe, portrait.image, portrait.face.points, portrait.masks, tone,
            face_centre=source.face_centre,
        )
        reused = still_her.measure_image(
            recipe, portrait.image, portrait.face.points, portrait.masks, tone,
            face_centre=source.face_centre, inputs=source,
        )
        legacy_bytes = record_bytes(original)
        assert legacy_bytes == record_bytes(reused), (tone, code)
        assert hashlib.sha256(legacy_bytes).hexdigest() == golden, (tone, code)
        assert still_her.problems(recipe, [original]) == still_her.problems(recipe, [reused])
    np.testing.assert_array_equal(portrait.image, before)


def test_prepared_features_are_byte_consistent_and_immutable() -> None:
    portrait = face("dark")
    original = still_her.prepare_face(portrait.image, portrait.face.points, portrait.masks)
    assert original.skin_chroma == float(original.before_chroma.mean())
    assert original.skin_chroma >= 0
    assert original.hue_rule_applies == (
        original.skin_chroma >= still_her.CHROMA_HUE_FLOOR
    )
    assert original.before_spread == float(original.skin_lab[:, 0].std())
    np.testing.assert_array_equal(
        original.before_chroma,
        np.hypot(original.skin_lab[:, 1], original.skin_lab[:, 2]),
    )
    np.testing.assert_array_equal(
        original.before_hue,
        np.degrees(np.arctan2(original.skin_lab[:, 2], original.skin_lab[:, 1])),
    )
    for value in (
        original.skin_pixels,
        original.skin_lab,
        original.before_chroma,
        original.before_hue,
        original.scorer_background_mask,
    ):
        assert not value.flags.writeable
        with pytest.raises(ValueError):
            value.flat[0] = 1


def test_prepared_face_rejects_photo_mask_or_mesh_from_another_revision() -> None:
    portrait = face()
    original = still_her.prepare_face(portrait.image, portrait.face.points, portrait.masks)
    recipe = registry.default().get("C03")
    mutated = portrait.image.copy()
    mutated[0, 0, 0] ^= 1
    with pytest.raises(ValueError, match="another photo|different photo"):
        still_her.measure_image(
            recipe, mutated, portrait.face.points, portrait.masks, "medium",
            inputs=original,
        )
    skin = portrait.masks.skin
    assert skin is not None
    changed = skin.copy()
    changed[0, 0] = 0.25
    masks = blend.FilterMasks(changed, portrait.masks.person, "landmarks")
    with pytest.raises(ValueError, match="another photo|different photo|another mask"):
        still_her.measure_image(
            recipe, portrait.image, portrait.face.points, masks, "medium",
            inputs=original,
        )
    points = portrait.face.points.copy()
    points[8, 0] += 1
    with pytest.raises(ValueError, match="another landmark mesh"):
        still_her.measure_image(
            recipe, portrait.image, points, portrait.masks, "medium",
            inputs=original,
        )


def test_landmark_revision_rejected_even_when_photo_mask_are_unchanged() -> None:
    portrait = face()
    saved = still_her.prepare_face(portrait.image, portrait.face.points, portrait.masks)
    points = portrait.face.points.copy()
    points[1, 1] += 0.5
    preset = registry.default().get("C03")
    with pytest.raises(ValueError, match="landmark mesh"):
        still_her.measure_image(
            preset, portrait.image, points, portrait.masks, "medium",
            settings=engine.Settings(guard=False), inputs=saved,
        )


def test_greyscale_face_has_defined_spread_but_no_hue_rule() -> None:
    portrait = face("dark")
    neutral = np.rint(
        portrait.image.astype(np.float64) @ (0.2126, 0.7152, 0.0722)
    ).astype(np.uint8)
    photo = np.broadcast_to(neutral[..., None], portrait.image.shape).copy()
    source = still_her.prepare_face(photo, portrait.face.points, portrait.masks)
    assert not source.hue_rule_applies
    assert source.skin_chroma < still_her.CHROMA_HUE_FLOOR
    item = still_her.measure_image(
        registry.default().get("C03"), photo, portrait.face.points,
        portrait.masks, "dark", inputs=source,
    )
    assert not item.hue_rule_applies
    assert item.skin_chroma == source.skin_chroma
    assert item.spread >= 0


def test_face_centre_is_computed_once_per_face_before_many_recipes() -> None:
    portraits = [face("very_light"), face("very_dark")]
    chosen = recipes()
    with patch.object(
        performance.SH,
        "face_centre",
        wraps=performance.SH.face_centre,
    ) as centre:
        result = performance.compare(portraits, chosen, repeats=2, warm_luts=False)
    assert result.passed
    # One original feature scan in the cached path; the legacy comparator
    # intentionally reconstructs its centre during every uncached preparation.
    assert centre.call_count == len(portraits) * (1 + len(chosen) * 2)


def test_speed_path_prepares_original_features_once_per_face() -> None:
    portraits = [face("medium"), face("very_dark")]
    chosen = recipes()
    with patch.object(
        performance.SH,
        "prepare_face",
        wraps=performance.SH.prepare_face,
    ) as prepare:
        result = performance.compare(portraits, chosen, repeats=2, warm_luts=False)
    assert result.passed
    assert prepare.call_count == len(portraits) * (1 + len(chosen) * 2)
    assert all(row.trials == 4 for row in result.rows)
    assert all(row.byte_identical for row in result.rows)


def test_report_keeps_one_cached_original_per_tone() -> None:
    cat = registry.default()
    # A small selected suite still prepares its six input portraits once.
    with patch.object(
        report.still_her,
        "prepare_face",
        wraps=report.still_her.prepare_face,
    ) as prepare:
        rows = report.acceptance(cat, ids=("C01", "C03"), with_goldens=False)
    assert [row.id for row in rows] == ["C01", "C03"]
    assert prepare.call_count == 6


def test_face_gate_never_exempts_identity_checks_for_neutral_skin() -> None:
    portrait = face("very_dark")
    report_row = still_her.measure(registry.default().get("C03"), portrait)
    flags = still_her.problems(registry.default().get("C03"), [report_row])
    assert isinstance(flags, list)
    altered = replace(report_row, hue_rule_applies=False, hue_turn=360, chroma_ratio=0)
    modified = still_her.problems(registry.default().get("C03"), [altered])
    assert all("hue turned" not in value for value in modified)
    assert all("chroma kept" not in value for value in modified)
    changed = replace(altered, lift=7, grey_lift=0, marks_kept=0.0)
    violations = still_her.problems(registry.default().get("C03"), [changed])
    assert any("skin L* rose" in violation for violation in violations)
    assert any("kept" in violation for violation in violations)


def test_performance_summary_never_contains_pixel_or_mesh_payloads() -> None:
    outcome = performance.compare([face()], recipes()[:2], warm_luts=False)
    exported = json.dumps(outcome.to_dict(), sort_keys=True)
    assert outcome.passed
    assert set(outcome.to_dict()) == {
        "mode", "face_count", "recipe_count", "repeats", "face_preparation_ms",
        "rows", "passed",
    }
    for prohibited in (
        "image", "photo", "pixel", "landmark", "base64", "mask", "mesh",
    ):
        assert f'"{prohibited}"' not in exported
    for row in outcome.rows:
        assert len(row.content_digest) == 64
        assert row.legacy_median_ms >= 0
        assert row.cached_median_ms >= 0


def test_lip_skin_comparison_prepared_once_for_all_recipes() -> None:
    drawn = face("medium")
    baseline = still_her.prepare_region_aim(drawn)
    assert baseline.flat.shape == drawn.image.shape
    for array in (baseline.flat, baseline.lips, baseline.ring):
        assert not array.flags.writeable
    assert baseline.lips.any()
    assert baseline.ring.any()
    for recipe in recipes():
        expected = still_her.region_aim(recipe, drawn)
        actual = still_her.region_aim(recipe, prepared=baseline)
        assert expected == actual
    with pytest.raises(ValueError, match="portrait or an already prepared"):
        still_her.region_aim(recipes()[0], drawn, prepared=baseline)


def test_acceptance_prepares_one_lip_ring_for_multiple_recipes() -> None:
    with patch.object(
        report.still_her,
        "prepare_region_aim",
        wraps=report.still_her.prepare_region_aim,
    ) as prepare:
        rows = report.acceptance(
            registry.default(), ids=("C01", "C08", "M02"), with_goldens=False,
        )
    assert [row.id for row in rows] == ["C01", "C08", "M02"]
    assert prepare.call_count == 1


CAST_FROZEN = {
    "very_light": "722e06c6e23e30a9e1e9293dc44da87c4dead2d0050a0b6e1c4a57ab05ead67e",
    "medium": "e97d3b93de6c3adf49221bae1d63d60a0deee5d077fdc8e5b19235983755e153",
    "dark": "d9bfdfca58957b54564d0900d92aab139e7c1e5d39fb396af2bb6b93695e7f87",
    "very_dark": "567e58e0709d626bb076b8502892d8e2728775f040bfe4b710a23499f0bacf39",
}


@pytest.mark.parametrize("tone", list(CAST_FROZEN))
def test_colour_cast_look_is_byte_identical_to_unmodified_base(tone: str) -> None:
    portrait = face(tone)
    recipe = registry.default().get("C53")
    prepared = still_her.prepare_face(
        portrait.image, portrait.face.points, portrait.masks,
    )
    assert prepared.cast_stats == engine.O.photo_cast(
        engine.S.bytes_to_unit(portrait.image),
    )
    for cached in [None, prepared]:
        row = still_her.measure_image(
            recipe, portrait.image, portrait.face.points,
            portrait.masks, tone, inputs=cached,
            face_centre=prepared.face_centre,
        )
        assert hashlib.sha256(record_bytes(row)).hexdigest() == CAST_FROZEN[tone]


def test_cast_photo_statistic_is_computed_once_per_prepared_face() -> None:
    portrait = face("very_dark")
    chosen = [registry.default().get("C53") for _ in range(4)]
    with patch.object(
        still_her.O,
        "photo_cast",
        wraps=still_her.O.photo_cast,
    ) as photo_cast:
        inputs = still_her.prepare_face(
            portrait.image, portrait.face.points, portrait.masks,
        )
        assert photo_cast.call_count == 1
        for recipe in chosen:
            still_her.measure_image(
                recipe, portrait.image, portrait.face.points,
                portrait.masks, portrait.face.tone, inputs=inputs,
                face_centre=inputs.face_centre,
            )
        assert photo_cast.call_count == 1
