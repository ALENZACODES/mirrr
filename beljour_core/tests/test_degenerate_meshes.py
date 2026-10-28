"""R13 gate 10: degenerate meshes give typed refusals, never exceptions.

Pass definition (improve-r12.md item 6, written before the run): for every engine the
real-face bench runs (regions, proportions, turn, gender, shape, age, beard, hair
fibre), duplicate landmarks, collapsed zones, coincident eyes and tiny faces return a
Refusal object with a known reason code, and nothing raises. Old callers that catch
ValueError still work. The bench records "refused" rows, not "exception" rows.
Drawn meshes and images only. Author: John Khan.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from plumb_api.engines.beard import strands as beard
from plumb_api.engines.concealer import strands as fibre
from plumb_api.engines.core import refusal, regions
from plumb_api.engines.proportions import ratios, symmetry
from plumb_api.engines.proportions.synthetic import symmetric_face
from plumb_api.engines.shape import age, gender, geometry, turn
from plumb_api.engines.warp.triangulate import delaunay
from lab.python.beljour_lab import face_harness as local
from plumb_api.vision.box_first import DetectionResult, FaceBox

H, W = 500, 400
PHOTO = np.full((H, W, 3), (180, 140, 120), np.uint8)
PHOTO[::7] = (90, 70, 60)


def _xyz(points: np.ndarray) -> np.ndarray:
    return np.column_stack([points, np.zeros(len(points))])


def _duplicate() -> np.ndarray:
    face = symmetric_face()
    face[200] = face[201]
    return face


def _tiny() -> np.ndarray:
    face = symmetric_face()
    centre = face.mean(axis=0)
    return centre + (face - centre) * 0.03


def _eyes_together() -> np.ndarray:
    face = symmetric_face()
    face[473] = face[468] + 1e-12
    return face


def _flat() -> np.ndarray:
    face = symmetric_face()
    face[:, 1] = 250.0 + np.arange(478) * 1e-3
    return face


DEGENERATE = {"duplicate": _duplicate, "tiny": _tiny, "eyes_together": _eyes_together, "flat": _flat}


def _engines(points: np.ndarray) -> dict[str, tuple]:
    xyz = _xyz(points)
    return {
        "regions": (regions.region_masks, (points, H, W), {"normalized": False, "supersample": 2}),
        "proportions": (symmetry.safe_targets, (points, 0.5), {}),
        "ratios": (ratios.measure, (points, "golden"), {}),
        "warp_turn": (turn.render_turn, (PHOTO, xyz), {"yaw": 8}),
        "gender": (gender.recipe_targets, (points, -100), {}),
        "gender_render": (gender.render_targets, (PHOTO, points, 66), {}),
        "shape": (geometry.target_mesh, (points, {"chin_width": 50}), {}),
        "mesh_warp": (local.mesh_checks, (points, points, PHOTO), {}),
        "age": (age.render, (PHOTO, points), {"stop": 2, "seed": 1}),
        "beard": (beard.render, (PHOTO, points), {"style": "stubble", "density": 2}),
    }


@pytest.mark.parametrize("kind", sorted(DEGENERATE))
def test_every_engine_refuses_a_degenerate_mesh_without_raising(kind: str) -> None:
    points = DEGENERATE[kind]()
    codes = refusal.inspect_mesh(points, H, W)
    assert codes, kind
    assert all(code in refusal.REASONS for code in codes)
    for module, (fn, args, kwargs) in _engines(points).items():
        result = refusal.run_guarded(module, fn, *args, points=points, height=H, width=W, **kwargs)
        assert isinstance(result, refusal.Refusal), (kind, module)
        assert result.refused and result.module == module
        assert result.code == codes[0]
        assert result.message == refusal.REASONS[result.code]
        assert result.to_json()["reason_code"] == result.code


def test_a_usable_mesh_runs_every_engine() -> None:
    points = symmetric_face()
    assert refusal.inspect_mesh(points, H, W) == []
    for module, (fn, args, kwargs) in _engines(points).items():
        result = refusal.run_guarded(module, fn, *args, points=points, height=H, width=W, **kwargs)
        assert not isinstance(result, refusal.Refusal), module


def test_collapsed_zone_in_hair_fibre_is_a_typed_refusal() -> None:
    points = symmetric_face()
    zone = np.zeros((H, W), bool)
    zone[100:102, 100:102] = True
    scalp = zone.copy()
    result = refusal.run_guarded("hair_fibre", fibre.render, PHOTO, zone, scalp, (40.0, 10.0, 15.0),
                                 points=points, height=H, width=W, amount="medium", product="fibres")
    assert isinstance(result, refusal.Refusal)
    assert result.code == "zone_too_small"
    assert "too small for its feather" in result.message


def test_engine_errors_stay_value_errors_for_old_callers() -> None:
    with pytest.raises(ValueError, match="points must be distinct"):
        delaunay([[0, 0], [1, 0], [0, 1], [0, 0]])
    with pytest.raises(refusal.DegenerateInput) as caught:
        delaunay([[0, 0], [1, 0], [0, 1], [1, 0]])
    assert caught.value.code == "duplicate_points"
    face = symmetric_face()
    face[152] = face[10]
    with pytest.raises(refusal.DegenerateInput) as no_length:
        geometry.frame(face)
    assert no_length.value.code == "no_face_length"
    with pytest.raises(ValueError, match="unknown refusal code"):
        refusal.DegenerateInput("made_up")


def test_other_bugs_are_never_swallowed() -> None:
    def broken() -> None:
        raise KeyError("a real bug")

    with pytest.raises(KeyError):
        refusal.run_guarded("regions", broken, points=symmetric_face(), height=H, width=W)


@pytest.mark.parametrize("bad", ([1, 2, 3], np.zeros((477, 2)), np.full((478, 2), np.nan), np.full((478, 2), 1e9)))
def test_malformed_meshes_have_codes(bad: object) -> None:
    codes = refusal.inspect_mesh(bad)
    assert codes and codes[0] in ("wrong_shape", "not_finite")


def test_face_mostly_outside_the_photo() -> None:
    face = symmetric_face() + np.array([380.0, 0.0])
    assert "outside_frame" in refusal.inspect_mesh(face, H, W)
    assert "outside_frame" not in refusal.inspect_mesh(face)


REALFACE = Path(__file__).resolve().parents[2] / "tests" / "realface"


def test_bench_records_refused_rows_not_exceptions(tmp_path, monkeypatch) -> None:
    sys.path.insert(0, str(REALFACE))
    import realface_lib as lib

    width, height = 120, 140
    face = symmetric_face(width, height, face_width=60, face_length=80)
    face[300] = face[301]
    normalized = _xyz(face) / np.array([width, height, width])

    class Detector:
        def __init__(self, models: object) -> None:
            pass

        def detect(self, rgb: np.ndarray) -> DetectionResult:
            return DetectionResult([normalized.copy()], [{}], [FaceBox(10, 10, 100, 120)], [], False)

    monkeypatch.setattr(lib, "Detectors", Detector)
    path = tmp_path / "drawn.png"
    Image.fromarray(np.full((height, width, 3), 150, np.uint8)).save(path)
    record = lib.Face(path, "drawn", "own work", "synthetic", gender="female", age="30-39",
                      row={"face_id": "degenerate", "monk": "5", "size_slice": "large",
                           "yaw_slice": "frontal", "occlusion": "none"})
    modules = ("landmarks", "regions", "proportions", "warp_turn", "gender", "shape", "age", "enhance")
    bench = lib.Bench(tmp_path / "absent-models", modules, run_id="synthetic-run")
    rows = bench.run(record)
    assert not [r for r in rows if r["check"] == "exception"]
    refused = {r["module"]: r for r in rows if r["check"] == "refused"}
    assert set(refused) == {"regions", "proportions", "warp_turn", "gender", "shape", "age"}
    for row in refused.values():
        assert row["pass"] is False
        assert row["reason_code"] == "duplicate_points"
    assert any(r["module"] == "enhance" and r["check"] != "refused" for r in rows)
