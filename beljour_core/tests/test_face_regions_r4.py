"""R4 Python authority for 478-point named Face Mesh masks and parity vectors.

The TypeScript test independently recomputes all 39 full masks on the same
artificial faces; this Python test protects the expected dataset from drift.
Author: John Khan.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import pytest

from plumb_api.engines.core.regions import (REGIONS, CONTOURS, FACE_OVAL,
                                           region_mask, landmark_points)

ROOT = Path(__file__).resolve().parents[2]
PARITY = ROOT / "parity/face-regions-r4.json"


def test_all_named_masks_against_python_vectors() -> None:
    data = json.loads(PARITY.read_text())
    assert data["format"] == "beljour-regions-parity/1"
    assert data["source"].endswith("regions.py")
    assert len(data["cases"]) == 3
    for case in data["cases"]:
        assert len(case["landmarks"]) == 478
        assert set(case["expected"]) == set(REGIONS)
        for name in REGIONS:
            expected = case["expected"][name]
            observed = region_mask(name, case["landmarks"], case["height"], case["width"],
                                   supersample=case["supersample"])
            assert list(observed.shape) == expected["shape"]
            np.testing.assert_allclose(observed.ravel(), expected["data"], atol=1e-10)
            assert np.min(observed) >= 0 and np.max(observed) <= 1


def test_iris_requires_refined_mesh() -> None:
    case = json.loads(PARITY.read_text())["cases"][0]
    with pytest.raises(ValueError, match="478-point"):
        region_mask("left_iris", case["landmarks"][:468], 10, 10)
    for name in ("right_iris", "left_iris", "irises"):
        assert region_mask(name, case["landmarks"], 32, 32).shape == (32, 32)


def test_478_mesh_contours_all_reference_valid_indices() -> None:
    assert FACE_OVAL is CONTOURS["face_oval"]
    assert set(REGIONS) == {"face_oval", "lips", "mouth_opening", "right_eye", "left_eye", "eyes",
                            "right_brow", "left_brow", "brows", "right_iris", "left_iris", "irises", "skin"}
    assert all(len(indices) >= 3 and len(set(indices)) == len(indices) for indices in CONTOURS.values())
    assert max(idx for indices in CONTOURS.values() for idx in indices) < 468


def test_pixel_and_normalized_landmarks_agree() -> None:
    case = json.loads(PARITY.read_text())["cases"][1]
    w, h = case["width"], case["height"]
    pixels = landmark_points(case["landmarks"], h, w)
    for name in REGIONS:
        normal = region_mask(name, case["landmarks"], h, w, supersample=2)
        absolute = region_mask(name, pixels, h, w, normalized=False, supersample=2)
        np.testing.assert_array_equal(normal, absolute)


def test_exported_topology_and_vectors_have_not_drifted() -> None:
    for command in (["scripts/sync_r4_data.py", "--check"],
                    ["api/scripts/generate_region_parity.py", "--check"]):
        result = subprocess.run([sys.executable, *command], cwd=ROOT,
                                capture_output=True, text=True, timeout=30, check=False)
        assert result.returncode == 0, result.stdout + result.stderr
