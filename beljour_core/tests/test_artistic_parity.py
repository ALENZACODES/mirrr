"""Recorded Python evidence and browser mirror drift checks. Author: John Khan."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_artistic_parity_vectors_are_current() -> None:
    done = subprocess.run([sys.executable, str(ROOT / "api/scripts/artistic/make_vectors.py"), "--check"],
                          cwd=ROOT, text=True, capture_output=True, check=False)
    assert done.returncode == 0, done.stdout + done.stderr
    data = json.loads((ROOT / "parity/artistic-local.json").read_text())
    assert {case["effect"] for case in data["cases"]} == {
        "ink-study", "pigment-oil", "rain-expression", "meadow-crown"}
    assert len(data["inputs"]) == 3
    assert len(data["cases"]) == 24
    assert data["source"].startswith("drawn synthetic")
    assert data["author"] == "John Khan"

