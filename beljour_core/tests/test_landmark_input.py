"""R13 landmark-input option: luminance-only CLAHE for the mesh input, off by default.

Pass definition: chroma (a*, b*) stays within 2 units; a dim low-contrast drawn face
gains local L* contrast; "none" returns the input untouched; the mode is part of the
frozen run identity, so runs with and without it are never mixed. Drawn images only.
Author: John Khan.
"""
from __future__ import annotations

import sys
from pathlib import Path

import cv2
import numpy as np
import pytest

from plumb_api.vision import landmark_input

REALFACE = Path(__file__).resolve().parents[2] / "tests" / "realface"


def _dim_face(tone: tuple[int, int, int] = (70, 48, 38)) -> np.ndarray:
    yy, xx = np.mgrid[:160, :140]
    base = np.array(tone, dtype=np.float64)
    shade = 1 + 0.06 * np.sin(xx / 6.0) + 0.05 * np.cos(yy / 9.0)
    oval = ((xx - 70) / 45.0) ** 2 + ((yy - 80) / 60.0) ** 2 <= 1
    img = np.where(oval[..., None], base * shade[..., None], base * 0.6)
    return np.clip(img, 0, 255).astype(np.uint8)


@pytest.mark.parametrize("tone", ((70, 48, 38), (40, 28, 22), (120, 90, 70)))
def test_chroma_kept_and_local_contrast_raised(tone: tuple[int, int, int]) -> None:
    rgb = _dim_face(tone)
    out = landmark_input.luminance_clahe(rgb)
    assert out.shape == rgb.shape and out.dtype == np.uint8
    lab_in = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.int32)
    lab_out = cv2.cvtColor(out, cv2.COLOR_RGB2LAB).astype(np.int32)
    assert np.abs(lab_out[..., 1:] - lab_in[..., 1:]).max() <= 2
    assert lab_out[..., 0].std() > lab_in[..., 0].std()


def test_none_mode_is_untouched_and_input_never_modified() -> None:
    rgb = _dim_face()
    copy = rgb.copy()
    assert landmark_input.prepare(rgb, "none") is rgb
    landmark_input.prepare(rgb, "clahe-l")
    np.testing.assert_array_equal(rgb, copy)


@pytest.mark.parametrize("bad", (np.zeros((4, 4), np.uint8), np.zeros((4, 4, 3), np.float32), np.zeros((1, 4, 3), np.uint8)))
def test_bad_input_is_refused(bad: np.ndarray) -> None:
    with pytest.raises(ValueError):
        landmark_input.luminance_clahe(bad)
    with pytest.raises(ValueError, match="mode"):
        landmark_input.prepare(_dim_face(), "sharpen")


def test_mode_is_part_of_the_run_identity(tmp_path: Path) -> None:
    sys.path.insert(0, str(REALFACE))
    import run_state
    from definitions import load_definitions

    import realface_lib as lib

    image = tmp_path / "face.png"
    cv2.imwrite(str(image), _dim_face())
    face = lib.Face(image, "drawn", "own work", "synthetic", row={})
    definitions = load_definitions(("regions",))
    plain = run_state.freeze([face], definitions, lib.API.parent, max_side=lib.MAX_SIDE, include=("drawn",))
    clahe = run_state.freeze([face], definitions, lib.API.parent, max_side=lib.MAX_SIDE, include=("drawn",),
                             landmark_input="clahe-l")
    assert "landmark_input" not in plain
    assert clahe["landmark_input"] == "clahe-l"
    assert plain["run_id"] != clahe["run_id"]
