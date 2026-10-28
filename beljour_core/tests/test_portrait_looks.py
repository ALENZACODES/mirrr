"""Named portrait looks: behaviour on drawn faces with known ground truth. Author: John Khan."""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pytest

from plumb_api.arena import identity as I
from plumb_api.arena import marks as M
from plumb_api.arena.synthetic import SKIN_TONES
from plumb_api.engines.core.pyramid import high_frequency
from plumb_api.filters.colour import space as S
from plumb_api.filters.portrait import compose, looks, polish, sparkle, vectors
from plumb_api.filters.qa import fixtures as F
from plumb_api.filters.recipe import registry

ROOT = Path(__file__).resolve().parents[2]


def face(tone: str = "medium", width: int = 64, height: int = 76) -> F.Portrait:
    return F.portrait(tone, width=width, height=height, grain=3.0)


def changed(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    return np.any(a[..., :3] != b[..., :3], axis=-1)


def test_vectors_file_is_exactly_what_python_renders_now() -> None:
    assert json.loads(vectors.PATH.read_text(encoding="utf-8")) == json.loads(vectors.dumps(vectors.build()))


def test_browser_copy_of_the_looks_is_current() -> None:
    assert looks.TS_PATH.read_text(encoding="utf-8") == looks.export_ts()


def test_thirteen_own_looks_validate_and_sit_beside_the_core_catalogue() -> None:
    all_looks = looks.default()
    assert len(all_looks) == 13
    assert looks.validate(all_looks) == []
    core = {r["name"].casefold() for r in registry.default().recipes}
    assert not core & {look.name.casefold() for look in all_looks}
    assert len(registry.default().recipes) == 61, "the core strip is unchanged"
    assert [look.sparkle is not None for look in all_looks].count(True) == 1
    for look in all_looks:
        assert look.recipe["limits"]["simulationLabel"] is True
        assert look.recipe["defaults"]["strength"] == 30
        assert 0 < look.polish <= looks.POLISH_MAX


def test_validation_rejects_lightening_geometry_heavy_polish_and_core_names() -> None:
    base = looks.default()[0]
    bad_recipe = dict(base.recipe, stages=[{"op": "colour.exposure", "params": {"ev": 0.3}}])
    lifted = looks.Look(base.id, base.name, base.description, base.polish, base.emphasis, None, bad_recipe)
    assert any("lifts skin" in p for p in looks.validate([lifted]))
    erased = looks.Look(base.id, base.name, base.description, 0.9, base.emphasis, None, base.recipe)
    assert any("soften, not erase" in p for p in looks.validate([erased]))
    core_name = registry.default().recipes[0]["name"]
    clash = looks.Look(base.id, core_name, base.description, base.polish, base.emphasis, None,
                       dict(base.recipe, name=core_name))
    assert any("already a core filter" in p for p in looks.validate([clash]))


def test_label_says_simulation_and_not_medical_advice() -> None:
    assert "simulation" in compose.LABEL and "not medical advice" in compose.LABEL
    r = compose.render(face().image, face().face.points, "PL01", 30)
    assert r.label == compose.LABEL and r.status == "applied"


def test_strength_zero_is_a_byte_identity_with_alpha_kept() -> None:
    p = face("dark")
    rgba = vectors.with_alpha(p.image)
    for look in looks.default():
        r = compose.render(rgba, p.face.points, look.id, 0)
        assert r.status == "identity"
        assert np.array_equal(r.image, rgba)


def test_alpha_is_untouched_when_the_look_runs() -> None:
    p = face("light")
    rgba = vectors.with_alpha(p.image)
    r = compose.render(rgba, p.face.points, "PL13", 100)
    assert r.status == "applied"
    assert np.array_equal(r.image[..., 3], rgba[..., 3])
    assert changed(r.image, rgba).any()


def test_refusals_are_coded() -> None:
    p = face()
    cases = [
        (lambda: compose.render(p.image[:8, :8], p.face.points, "PL01", 30), "bad_photo"),
        (lambda: compose.render(p.image.astype(np.float32), p.face.points, "PL01", 30), "bad_photo"),
        (lambda: compose.render(p.image, None, "PL01", 30), "no_face_points"),
        (lambda: compose.render(p.image, p.face.points[:468], "PL01", 30), "no_face_points"),
        (lambda: compose.render(p.image, np.full((478, 2), np.nan), "PL01", 30), "no_face_points"),
        (lambda: compose.render(p.image, p.face.points, "nope", 30), "unknown_look"),
        (lambda: compose.render(p.image, p.face.points, "PL01", 101), "bad_strength"),
        (lambda: compose.render(p.image, p.face.points, "PL01", float("nan")), "bad_strength"),
    ]
    for call, code in cases:
        with pytest.raises(compose.PortraitRefused) as err:
            call()
        assert err.value.code == code
        assert code in compose.REFUSALS


@pytest.mark.parametrize("tone", list(SKIN_TONES))
def test_no_look_lightens_skin_on_any_tone_at_any_strength(tone: str) -> None:
    p = face(tone)
    for look in looks.default():
        for strength in (30, 100):
            r = compose.render(p.image, p.face.points, look.id, strength)
            assert r.status == "applied", (look.id, strength, r.code)
            assert r.identity is not None and r.identity.skin_lift <= compose.LIFT_LIMIT, (look.id, strength)


def test_identity_guard_holds_marks_irises_and_the_proxy_score() -> None:
    for tone in ("very_light", "medium", "very_dark"):
        p = face(tone, 96, 112)
        masks = compose.face_masks(p.image, p.face.points)
        irises = masks.features.irises >= 1.0
        for look in looks.default():
            r = compose.render(p.image, p.face.points, look.id, 30)
            ident = r.identity
            assert ident is not None and ident.passed
            assert ident.marks_found >= 3 and ident.marks_kept == ident.marks_found
            assert ident.iris_kept == 1.0
            assert np.array_equal(r.image[irises], p.image[irises]), "eye colour never changes"
            score = I.identity_score(p.image, r.image, points_before=p.face.points, points_after=p.face.points)
            assert score.score >= I.LOCK_THRESHOLD, (look.id, tone, score.score)


def test_guard_refuses_and_returns_the_photo_when_marks_would_be_lost(monkeypatch: pytest.MonkeyPatch) -> None:
    p = face("medium", 96, 112)

    def erase(rgb: np.ndarray, skin: np.ndarray, protect: np.ndarray, iod: float, amount: float) -> np.ndarray:
        blurred = polish.skin_mean(rgb.astype(np.float64), np.clip(skin, 0, 1), 6)
        return np.rint(np.clip(blurred, 0, 255)).astype(np.uint8)  # a regression that wipes marks

    monkeypatch.setattr(compose.P, "polish", erase)
    r = compose.render(p.image, p.face.points, "PL01", 100)
    assert (r.status, r.code) == ("refused", "marks_not_kept")
    assert np.array_equal(r.image, p.image)
    assert len(r.notes) == 3 and "eased" in r.notes[0]


def test_guard_refuses_a_grade_that_would_lighten_skin(monkeypatch: pytest.MonkeyPatch) -> None:
    p = face("dark")
    base = looks.get("PL01")
    lifted = dict(base.recipe, stages=[{"op": "colour.exposure", "params": {"ev": 1.0}}])
    bright = looks.Look(base.id, base.name, base.description, base.polish, base.emphasis, None, lifted)
    monkeypatch.setattr(compose.L, "get", lambda _id: bright)
    r = compose.render(p.image, p.face.points, "PL01", 100)
    assert (r.status, r.code) == ("refused", "skin_lightened")
    assert np.array_equal(r.image, p.image)


def blotched(p: F.Portrait) -> tuple[np.ndarray, list[tuple[float, float]]]:
    """The drawn face plus two soft darker blotches on the cheeks (mid-scale unevenness)."""
    img = p.image.astype(np.float64)
    pts = p.face.points
    iod = I.iod(pts)
    yy, xx = np.mgrid[0:img.shape[0], 0:img.shape[1]]
    centres = [(float(pts[50, 0]), float(pts[50, 1]) + 0.08 * iod), (float(pts[280, 0]), float(pts[280, 1]) + 0.08 * iod)]
    for cx, cy in centres:
        img -= 14.0 * np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * (0.12 * iod) ** 2))[..., None]
    return np.clip(np.rint(img), 0, 255).astype(np.uint8), centres


def blotch_depth(image: np.ndarray, centre: tuple[float, float], iod: float) -> float:
    """Mean luma of a ring round the blotch minus the mean luma of its core."""
    yy, xx = np.mgrid[0:image.shape[0], 0:image.shape[1]]
    d = np.hypot(xx - centre[0], yy - centre[1])
    luma = M.luma(image)
    return float(luma[(d > 0.3 * iod) & (d < 0.4 * iod)].mean() - luma[d < 0.06 * iod].mean())


def test_polish_softens_blotches_keeps_pores_and_marks_and_stays_in_the_skin() -> None:
    p = face("medium", 160, 190)
    image, centres = blotched(p)
    masks = compose.face_masks(image, p.face.points)
    out = polish.polish(image, masks.skin, masks.protect, masks.iod, 0.6)
    assert not changed(out, image)[masks.skin <= 0].any(), "polish acts only inside the skin"
    clean = polish.polish(p.image, masks.skin, masks.protect, masks.iod, 0.6)
    for centre in centres:
        before = blotch_depth(image, centre, masks.iod) - blotch_depth(p.image, centre, masks.iod)
        after = blotch_depth(out, centre, masks.iod) - blotch_depth(clean, centre, masks.iod)
        assert before > 5.0, "the drawn blotch is there to soften"
        assert after < 0.75 * before, "blotch softened by at least a quarter"
        assert after > 0.15 * before, "softened, not erased"
    skin = masks.skin >= 1.0
    fine_in = float((high_frequency(image.astype(np.float64)) ** 2)[skin].mean())
    fine_out = float((high_frequency(out.astype(np.float64)) ** 2)[skin].mean())
    assert fine_out >= 0.8 * fine_in, "pores and grain stay"
    kept = M.retention(list(masks.marks), out, masks.iod)
    assert kept.found >= 5 and kept.kept == kept.found
    lab = lambda img: S.srgb_to_lab(S.bytes_to_unit(img))[..., 0][skin].mean()  # noqa: E731
    assert lab(out) - lab(image) <= 0.5, "smoothing keeps the skin's own lightness"


def test_definition_changes_only_eyes_brows_and_lips_and_never_the_iris() -> None:
    p = face("light", 128, 152)
    masks = compose.face_masks(p.image, p.face.points)
    mask = polish.feature_mask(masks.features, masks.iod, 1.0, 1.0, 1.0)
    out = polish.define(p.image, mask, 1.0)
    moved = changed(out, p.image)
    assert moved.any()
    assert not moved[mask <= 0].any()
    assert not moved[masks.features.irises >= 1.0].any()
    assert np.array_equal(polish.define(p.image, mask, 0.0), p.image)


def test_sparkle_is_procedural_local_and_shows_on_very_dark_skin() -> None:
    spec = looks.get("PL13").sparkle
    assert spec is not None
    for tone in ("very_light", "very_dark"):
        p = face(tone, 160, 190)
        masks = compose.face_masks(p.image, p.face.points)
        out, g = sparkle.render(p.image, masks.sparkle, masks.iod, spec, 1.0)
        again, _ = sparkle.render(p.image, masks.sparkle, masks.iod, spec, 1.0)
        assert np.array_equal(out, again), "deterministic"
        assert g.count >= 10
        moved = changed(out, p.image)
        assert moved.any() and not moved[masks.sparkle <= 0].any(), "glints only on lids and cheekbones"
        f = masks.features
        for name, part in (("eyes", f.eyes), ("irises", f.irises), ("lips", f.lips), ("brows", f.brows)):
            assert not moved[part >= 0.5].any(), name
        skin = masks.skin >= 0.5
        assert float(moved[skin].mean()) <= 0.05, "small accents, not a skin change"
        lum_in = S.srgb_to_lab(S.bytes_to_unit(p.image))[..., 0][skin]
        lum_out = S.srgb_to_lab(S.bytes_to_unit(out))[..., 0][skin]
        assert np.median(lum_out) - np.median(lum_in) <= 0.25, "the skin's tone is not lifted"
        assert float((lum_out - lum_in).max()) > 5.0, "glints show"
        none, _ = sparkle.render(p.image, masks.sparkle, masks.iod, spec, 0.0)
        assert np.array_equal(none, p.image)


def test_strength_slider_moves_every_look_further_and_looks_differ() -> None:
    p = face("medium")
    renders = {}
    for look in looks.default():
        diffs = []
        for strength in (15, 50, 100):
            r = compose.render(p.image, p.face.points, look.id, strength)
            diffs.append(float(np.abs(r.image.astype(np.int16) - p.image.astype(np.int16)).mean()))
            renders[(look.id, strength)] = r.image
        assert diffs[0] < diffs[1] < diffs[2], look.id
    ids = [look.id for look in looks.default()]
    for i, a in enumerate(ids):
        for b in ids[i + 1:]:
            assert not np.array_equal(renders[(a, 100)], renders[(b, 100)]), (a, b)


def test_no_look_moves_geometry_or_aims_a_stage_at_a_face_region() -> None:
    for look in looks.default():
        for stage in look.recipe["stages"]:
            assert not set(stage.get("params", {})) & {"lips", "brows", "lashes", "eyelids", "cheeks", "region"}
        assert look.recipe["limits"]["geometry"] == "none"


def test_registry_row_and_lane_b_claim_every_portrait_module() -> None:
    from plumb_api.arena import registry as arena_registry
    from plumb_api.arena.lane_registry import b as lane_b

    features, _ = arena_registry.load()
    row = next(f for f in features if f.name.startswith("Named portrait looks"))
    assert (row.status, row.provider, row.simulation_label) == ("Built", "local", True)
    assert "api/tests/test_portrait_looks.py" in row.tests and "web/test/portrait-looks.test.mjs" in row.tests
    for module in row.modules:
        assert (ROOT / module).exists(), module
    claimed = set(lane_b.portrait_look_modules())
    code = [str(f.relative_to(ROOT)) for folder in ("api/plumb_api/filters/portrait", "web/src/filters/portrait")
            for f in sorted((ROOT / folder).iterdir()) if f.suffix in (".py", ".ts") and f.name != "__init__.py"]
    assert claimed == set(code), "every portrait module is registered with Lane B"
    assert arena_registry.validate(features) == []
    assert arena_registry.unowned_modules(features, arena_registry.load()[1]) == []
