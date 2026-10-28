"""Face part workflows (nose, lips, eyes, brows) on drawn synthetic faces with known landmarks.

Every face here is drawn from made-up coordinates: a skin oval, white eyes with dark irises,
dark brow bands, red lips and a shaded nose on a striped backdrop, with a partly transparent
alpha border. Checks: change stays inside the part's ring, alpha and every unmoved pixel are
byte-identical, strength 0 is a no-op, the 12% eye-opening and 6%-IOD caps hold, the fold
guard holds, the identity proxy finds untouched landmarks in place and refusals are coded.
Author: John Khan.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import pytest

from plumb_api.engines.core import regions
from plumb_api.engines.proportions.synthetic import rolled, symmetric_face
from plumb_api.engines.shape import parts
from plumb_api.engines.warp.fold import Q3_MINIMUM

ROOT = Path(__file__).resolve().parents[2]
WIDTH, HEIGHT = 240, 300
SKIN = (214, 168, 138)
COLOURS = {"nose": (196, 146, 120), "lips": (172, 72, 82), "eyes": (242, 240, 236), "brows": (58, 40, 30),
           "iris": (66, 48, 34)}
EXPECTED_IDS = {"nose_width", "nose_bridge", "nose_tip", "nose_length", "lip_fullness", "upper_lip", "lower_lip",
                "mouth_width", "lip_corners", "eye_size", "eye_opening", "brow_height", "brow_arch", "brow_tail"}


def front_mesh() -> np.ndarray:
    return symmetric_face(WIDTH, HEIGHT, face_width=150.0, face_length=200.0)


def _paint(image: np.ndarray, mask: np.ndarray, colour: tuple[int, int, int]) -> None:
    alpha = np.clip(mask, 0, 1)[..., None]
    image[..., :3] = np.rint(image[..., :3] * (1 - alpha) + np.asarray(colour) * alpha).astype(np.uint8)


def drawn_face(mesh: np.ndarray, *, rgba: bool = True, size: tuple[int, int] = (WIDTH, HEIGHT)) -> np.ndarray:
    """A drawn face whose features sit exactly on the given landmarks."""
    width, height = size
    yy, xx = np.mgrid[:height, :width]
    image = np.zeros((height, width, 4 if rgba else 3), dtype=np.uint8)
    image[..., 0] = 40 + ((xx // 7) % 2) * 60
    image[..., 1] = 70 + ((yy // 9) % 2) * 40
    image[..., 2] = 110
    poly = lambda pts: regions.polygon(height, width, pts, supersample=2)  # noqa: E731
    _paint(image, poly(mesh[list(regions.FACE_OVAL)]), SKIN)
    grain = ((xx * 7 + yy * 11) % 9 - 4).astype(np.int16)
    skin = poly(mesh[list(regions.FACE_OVAL)]) > 0.5
    image[..., 1][skin] = np.clip(image[..., 1][skin] + grain[skin], 0, 255).astype(np.uint8)
    for name, mask in part_masks(mesh, height, width).items():  # the iris is painted last, over the eye
        _paint(image, mask, COLOURS[name])
    for centre in (regions.RIGHT_IRIS[0], regions.LEFT_IRIS[0]):
        cx, cy = mesh[centre]
        image[int(round(cy)), int(round(cx)), :3] = (10, 10, 10)
    if rgba:
        image[..., 3] = 255
        image[:6, :, 3] = 0
        image[:, :5, 3] = 128
    return image


def part_masks(mesh: np.ndarray, height: int = HEIGHT, width: int = WIDTH) -> dict[str, np.ndarray]:
    """Ground-truth coverage of each drawn part, straight from the landmarks."""
    poly = lambda pts: regions.polygon(height, width, pts, supersample=2)  # noqa: E731
    brows = np.zeros((height, width))
    for brow in (regions.RIGHT_BROW, regions.LEFT_BROW):
        pts = mesh[list(brow)]
        brows = np.maximum(brows, poly(np.vstack([pts + (0, -2.5), (pts + (0, 2.5))[::-1]])))
    return {"nose": poly(regions.convex_hull(mesh[list(parts.NOSE_CORE)])),
            "lips": poly(mesh[list(regions.LIPS_OUTER)]),
            "eyes": np.maximum(poly(mesh[list(regions.RIGHT_EYE)]), poly(mesh[list(regions.LEFT_EYE)])),
            "brows": brows,
            "iris": np.maximum(poly(mesh[list(regions.RIGHT_IRIS[1])]), poly(mesh[list(regions.LEFT_IRIS[1])]))}


def region_mask(plan: parts.PartPlan) -> np.ndarray:
    """Independent check: pixels within the ring distance (+1 px) of the part hull."""
    yy, xx = np.mgrid[:HEIGHT, :WIDTH]
    grid = np.column_stack([xx.ravel(), yy.ravel()]).astype(np.float64)
    distance = parts.hull_distance(plan.region.hull, grid).reshape(HEIGHT, WIDTH)
    return distance <= parts.RING_FACTOR * plan.region.margin + 1.0


@pytest.fixture(scope="module")
def face() -> tuple[np.ndarray, np.ndarray]:
    mesh = front_mesh()
    return mesh, drawn_face(mesh)


def test_spec_has_the_part_controls_with_their_features_and_labels() -> None:
    assert set(parts.CONTROL_BY_ID) == EXPECTED_IDS
    assert {name: row["feature"] for name, row in parts.PARTS.items()} == {"nose": 40, "lips": 38, "eyes": 41, "brows": 37}
    assert "decision preview" in parts.LABELS["nose"]
    assert "professional" in parts.LABELS["lips"] and "simulation" in parts.LABELS["lips"]
    assert "12%" in parts.LABELS["eyes"] and "no tint" in parts.LABELS["brows"]
    for row in parts.CONTROLS:
        assert row["part"] in parts.PARTS
        assert 0 < row["cap"] <= (parts.APERTURE_CAP if row["part"] == "eyes" else 15)


def test_typescript_table_and_vectors_match_python() -> None:
    run = subprocess.run([sys.executable, str(ROOT / "api/scripts/make_face_part_vectors.py"), "--check"],
                         capture_output=True, text=True, check=False)
    assert run.returncode == 0, run.stdout + run.stderr


@pytest.mark.parametrize("control", sorted(EXPECTED_IDS))
@pytest.mark.parametrize("amount", [-100.0, 100.0])
def test_each_control_changes_only_its_region_and_keeps_alpha(face, control: str, amount: float) -> None:
    mesh, image = face
    original = image.copy()
    out = parts.render(image, mesh, {control: amount}, opted_in=True)
    np.testing.assert_array_equal(image, original)  # the input is never written
    diff = np.any(out.image != image, axis=2)
    assert diff.any(), control
    allowed = np.zeros((HEIGHT, WIDTH), dtype=bool)
    for plan in out.plans:
        allowed |= region_mask(plan)
    assert not np.any(diff & ~allowed), control
    assert not np.any(diff & ~out.changed)
    np.testing.assert_array_equal(out.image[..., 3], image[..., 3])
    part = parts.CONTROL_BY_ID[control]["part"]
    drawn = part_masks(mesh)
    own_pixels = drawn[part] > 0 if part != "eyes" else (drawn["eyes"] > 0) | (drawn["iris"] > 0)
    assert np.any(diff & own_pixels), control  # the drawn part itself changes
    for name, mask in drawn.items():  # ground truth: every other drawn part keeps its exact pixels
        if name != part and not (part == "eyes" and name == "iris"):
            assert not np.any(diff & (mask > 0)), (control, name)
    own = {i for p, _, core in parts.INSTANCES if p == part for i in core}
    others = sorted({i for p, _, core in parts.INSTANCES if p != part for i in core} - own)
    np.testing.assert_array_equal(out.targets[others], mesh[others])
    np.testing.assert_array_equal(out.targets[list(regions.FACE_OVAL)], mesh[list(regions.FACE_OVAL)])
    assert out.metrics["identity_similarity"] >= parts.IDENTITY_MINIMUM
    assert out.metrics["min_jacobian"] > Q3_MINIMUM and out.metrics["min_area_ratio"] > Q3_MINIMUM
    assert out.metrics["max_move_iod_percent"] <= parts.MAX_MOVE_IOD * 100 + 1e-9
    assert out.labels[0] == parts.SIMULATION and parts.LABELS[part] in out.labels


def test_strength_zero_and_neutral_controls_are_byte_identical_no_ops(face) -> None:
    mesh, image = face
    everything = {name: 100.0 for name in EXPECTED_IDS}
    for values, strength in ((everything, 0.0), ({name: 0.0 for name in EXPECTED_IDS}, 1.0), ({}, 1.0)):
        out = parts.render(image, mesh, values, strength=strength)  # no opt-in needed: nothing applied
        np.testing.assert_array_equal(out.image, image)
        np.testing.assert_array_equal(out.targets, mesh)
        assert out.metrics["changed_pixels"] == 0 and not out.changed.any() and out.plans == ()
    np.testing.assert_array_equal(parts.target_mesh(mesh, everything, strength=0.0), mesh)


def test_strength_scales_the_requested_motion(face) -> None:
    mesh, _ = face
    full = parts.target_mesh(mesh, {"lip_fullness": 80.0}) - mesh
    half = parts.target_mesh(mesh, {"lip_fullness": 80.0}, strength=0.5) - mesh
    np.testing.assert_allclose(half, full * 0.5, atol=1e-12)


def test_scale_controls_hit_their_authored_ratio_on_the_part(face) -> None:
    mesh, _ = face
    out = parts.target_mesh(mesh, {"mouth_width": 100.0})
    width = lambda pts: float(np.hypot(*(pts[61] - pts[291])))  # noqa: E731
    assert width(out) / width(mesh) == pytest.approx(1.08, abs=1e-9)
    out = parts.target_mesh(mesh, {"nose_width": -100.0})
    alae = lambda pts: float(np.hypot(*(pts[129] - pts[358])))  # noqa: E731
    assert alae(out) / alae(mesh) == pytest.approx(0.88, abs=1e-9)
    out = parts.target_mesh(mesh, {"upper_lip": 100.0})
    assert out[17, 1] == mesh[17, 1] and out[0, 1] < mesh[0, 1]  # lower lip edge stays, upper lip edge rises


LARGE = (480, 600)


def _run(mask: np.ndarray, x: int, y: int, *, vertical: bool) -> int:
    """Length in pixels of the unbroken run of `mask` through (x, y)."""
    line = mask[:, x] if vertical else mask[y, :]
    start = end = y if vertical else x
    while line[start - 1]:
        start -= 1
    while line[end + 1]:
        end += 1
    return end - start + 1


def _not_skin(image: np.ndarray) -> np.ndarray:
    return np.asarray(np.abs(image[..., :3].astype(int) - SKIN).sum(axis=2) > 60)


def _colour(image: np.ndarray, part: str) -> np.ndarray:
    return np.asarray(np.abs(image[..., :3].astype(int) - COLOURS[part]).sum(axis=2) <= 24)


def test_drawn_parts_measure_the_requested_change_on_pixels() -> None:
    """Ground truth on a larger drawn face: the painted part, measured in pixels, grows or
    shrinks by the authored cap (one pixel of resampling slack per edge) and never past it."""
    mesh = symmetric_face(*LARGE, face_width=300.0, face_length=400.0)
    image = drawn_face(mesh, size=LARGE)
    L = parts.L
    pupil = np.rint(mesh[L["right_pupil"]]).astype(int)
    mouth_x = int(round(float(mesh[L["right_mouth"], 0] + mesh[L["left_mouth"], 0]) / 2))
    lip_y = int(round(float(mesh[0, 1]))) + 3
    ala_y = int(round(float(mesh[L["right_ala"], 1])))
    nose_x = int(round(float(mesh[L["subnasale"], 0])))

    def eye(img: np.ndarray) -> tuple[int, int]:
        mask = _not_skin(img)
        return (_run(mask, pupil[0], pupil[1], vertical=True), _run(mask, pupil[0], pupil[1], vertical=False))

    def lips(img: np.ndarray) -> int:
        return _run(_colour(img, "lips"), mouth_x, lip_y, vertical=True)

    def nose(img: np.ndarray) -> int:
        return _run(_colour(img, "nose"), nose_x, ala_y, vertical=False)

    before_eye, before_lips, before_nose = eye(image), lips(image), nose(image)
    for amount in (-100.0, 100.0):
        sign = 1 if amount > 0 else -1
        render = lambda values: parts.render(image, mesh, values, opted_in=True).image  # noqa: E731
        height, width = eye(render({"eye_opening": amount}))
        assert width == before_eye[1] and 0 < sign * (height - before_eye[0]) <= 0.12 * before_eye[0] + 2
        height, width = eye(render({"eye_size": amount}))
        assert 0 < sign * (height - before_eye[0]) <= 0.12 * before_eye[0] + 2
        assert 0 < sign * (width - before_eye[1]) <= 0.12 * before_eye[1] + 2
        assert abs(lips(render({"lip_fullness": amount})) - before_lips * (1 + sign * 0.15)) <= 1
        assert abs(nose(render({"nose_width": amount})) - before_nose * (1 + sign * 0.12)) <= 2


def test_eye_opening_cap_holds_both_ways_and_on_combinations(face) -> None:
    mesh, image = face
    for values, expected in (({"eye_size": 100.0}, 12.0), ({"eye_opening": -100.0}, -12.0),
                             ({"eye_size": 100.0, "eye_opening": 100.0}, 12.0),
                             ({"eye_size": -100.0, "eye_opening": -100.0}, -12.0)):
        out = parts.render(image, mesh, values, opted_in=True)
        for side in ("right", "left"):
            change = out.metrics[f"aperture_change_percent_{side}"]
            assert abs(change) <= parts.APERTURE_CAP * 100 + 1e-9
            assert change == pytest.approx(expected * out.metrics["guard_scale"], abs=1e-6)
    pupils = [regions.RIGHT_IRIS[0], regions.LEFT_IRIS[0]]
    np.testing.assert_array_equal(parts.target_mesh(mesh, {"eye_size": 100.0})[pupils], mesh[pupils])


def test_every_control_together_keeps_the_movement_cap_and_the_identity_proxy(face) -> None:
    mesh, image = face
    for sign in (-1.0, 1.0):
        values = {name: sign * 100.0 for name in EXPECTED_IDS}
        out = parts.render(image, mesh, values, opted_in=True)
        assert out.metrics["max_move_iod_percent"] <= parts.MAX_MOVE_IOD * 100 + 1e-9
        assert out.metrics["identity_similarity"] >= parts.IDENTITY_MINIMUM
        allowed = np.zeros((HEIGHT, WIDTH), dtype=bool)
        for plan in out.plans:
            allowed |= region_mask(plan)
        assert not np.any(np.any(out.image != image, axis=2) & ~allowed)
        assert [p.region.part for p in out.plans] == ["brows", "brows", "eyes", "eyes", "nose", "lips"]


def test_rolled_face_follows_its_own_frame() -> None:
    mesh = rolled(front_mesh(), 9.0)
    image = drawn_face(mesh)
    out = parts.render(image, mesh, {"brow_height": 100.0}, opted_in=True)
    frame = parts.frame(mesh)
    for plan in out.plans:
        moved = plan.displacement[np.any(plan.displacement != 0, axis=1)]
        across = moved @ frame.axis_across
        assert np.max(np.abs(across)) < 1e-9  # pure lift along the tilted face axis
    allowed = region_mask(out.plans[0]) | region_mask(out.plans[1])
    assert not np.any(np.any(out.image != image, axis=2) & ~allowed)


def test_fold_guard_reduces_a_crowded_edit_and_the_result_stays_fold_free() -> None:
    vectors = json.loads((ROOT / "api/tests/goldens/face-parts.json").read_text(encoding="utf-8"))
    mesh = np.asarray(vectors["faces"]["crowded"], dtype=np.float64)
    image = drawn_face(mesh)
    values = {"brow_height": -100.0, "brow_arch": -100.0, "brow_tail": -100.0}
    out = parts.render(image, mesh, values, opted_in=True)
    assert 0 < out.metrics["guard_scale"] < 1
    assert out.metrics["strength_used"] == pytest.approx(out.metrics["guard_scale"])
    assert out.metrics["min_jacobian"] > Q3_MINIMUM and out.metrics["min_area_ratio"] >= Q3_MINIMUM
    requested = parts.target_mesh(mesh, values)
    np.testing.assert_allclose(out.targets, mesh + (requested - mesh) * out.metrics["guard_scale"], atol=1e-9)


def test_identity_similarity_detects_moved_untouched_landmarks(face) -> None:
    mesh, _ = face
    moved = mesh.copy()
    moved[regions.LEFT_IRIS[0]] += (3.0, 0.0)
    similarity, ids = parts.identity_similarity(mesh, moved, ("nose",))
    assert similarity < parts.IDENTITY_MINIMUM and regions.LEFT_IRIS[0] in ids
    same, _ = parts.identity_similarity(mesh, mesh.copy(), ("nose",))
    assert same == 1.0


def _refusal(code: str, call) -> parts.PartRefusal:
    with pytest.raises(parts.PartRefusal) as caught:
        call()
    refusal = caught.value
    assert refusal.code == code and str(refusal) == parts.REFUSALS[code]
    assert refusal.to_json()["reason_code"] == code and refusal.to_json()["refused"] is True
    return refusal


def test_refusals_are_coded(face, monkeypatch) -> None:
    mesh, image = face
    original = image.copy()
    _refusal("not_opted_in", lambda: parts.render(image, mesh, {"nose_width": 30.0}))
    _refusal("not_opted_in", lambda: parts.render(image, mesh, {"nose_width": 30.0}, opted_in=1))  # type: ignore[arg-type]
    vectors = json.loads((ROOT / "api/tests/goldens/face-parts.json").read_text(encoding="utf-8"))
    touching = np.asarray(vectors["faces"]["touching"], dtype=np.float64)
    assert _refusal("part_crowded", lambda: parts.render(image, touching, {"brow_height": 50.0}, opted_in=True)).part == "brows"
    closed = np.asarray(vectors["faces"]["closed_eye"], dtype=np.float64)
    _refusal("eye_closed", lambda: parts.render(image, closed, {"eye_size": 50.0}, opted_in=True))
    shifted = mesh + (0.0, 175.0)
    _refusal("part_outside_photo", lambda: parts.render(image, shifted, {"lip_fullness": 50.0}, opted_in=True))
    tiny = mesh.copy()
    tiny[list(regions.LIPS_OUTER)] = mesh[17] + (np.arange(len(regions.LIPS_OUTER))[:, None] % 2) * (0.5, 0.3)
    _refusal("part_too_small", lambda: parts.render(image, tiny, {"lip_fullness": 50.0}, opted_in=True))
    crowded = np.asarray(vectors["faces"]["crowded"], dtype=np.float64)
    monkeypatch.setattr(parts, "MIN_STRENGTH", 0.9)
    _refusal("fold_guard", lambda: parts.render(image, crowded, {"brow_height": -100.0, "brow_arch": -100.0,
                                                                  "brow_tail": -100.0}, opted_in=True))
    monkeypatch.setattr(parts, "IDENTITY_MINIMUM", 1.01)
    _refusal("identity_guard", lambda: parts.render(image, mesh, {"nose_tip": 50.0}, opted_in=True))
    np.testing.assert_array_equal(image, original)
    with pytest.raises(ValueError, match="unknown part refusal"):
        parts.PartRefusal("made_up", "nose")


@pytest.mark.parametrize("values", [{"nose_size": 10.0}, {"nose_width": 101.0}, {"nose_width": float("nan")},
                                    {"nose_width": True}, {"eye_size": "10"}])
def test_invalid_amounts_are_rejected(face, values) -> None:
    mesh, image = face
    with pytest.raises(ValueError):
        parts.render(image, mesh, values, opted_in=True)
    with pytest.raises(ValueError):
        parts.target_mesh(mesh, values)


def test_rgb_images_and_repeat_runs_are_deterministic(face) -> None:
    mesh, _ = face
    image = drawn_face(mesh, rgba=False)
    values = {"nose_tip": 70.0, "lip_corners": -40.0}
    a = parts.render(image, mesh, values, opted_in=True)
    b = parts.render(image, mesh, values, opted_in=True)
    np.testing.assert_array_equal(a.image, b.image)
    assert a.image.shape == image.shape


def test_part_controls_are_never_in_a_default_preset() -> None:
    presets = (ROOT / "api/plumb_api/arena/default_presets.json").read_text(encoding="utf-8")
    assert not any(f'"{name}"' in presets for name in EXPECTED_IDS)
