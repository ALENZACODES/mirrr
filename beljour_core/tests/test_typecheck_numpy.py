"""Exercise the deployed NumPy stubs with the actual production typecheck.

This regression does not install packages, access the network or skip missing
tools. It also guards the tested NumPy pins against requirement/ledger drift.
Author: John Khan.
"""
from __future__ import annotations

import importlib.metadata
import json
import platform
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
API = ROOT / "api"
NUMPY_REQUIREMENTS = [
    'numpy==2.3.5; python_version < "3.12"',
    'numpy==2.5.4; python_version >= "3.12"',
]


def test_numpy_runtime_matches_exact_requirement_and_licence_pin():
    requirements = [line.split("#", 1)[0].strip()
                    for line in (API / "requirements.txt").read_text().splitlines()]
    numpy_requirements = [line for line in requirements if line.startswith("numpy")]
    assert numpy_requirements == NUMPY_REQUIREMENTS, (
        "Keep the tested Python 3.11 and Python 3.12+ NumPy pins explicit."
    )
    assert sys.version_info >= (3, 11), "The application requires Python 3.11 or newer."
    # NumPy 2.5.4 requires Python 3.12+. Keep the supported 3.11 interpreter
    # on its separately tested release; this is a deliberate two-row policy.
    expected = "2.3.5" if sys.version_info < (3, 12) else "2.5.4"
    installed = importlib.metadata.version("numpy")
    assert installed == expected, (
        f"NumPy {installed} is installed; the tested requirement is {expected}. "
        "Install api/requirements.txt before running the quality gates."
    )
    assert np.__version__ == installed, (
        f"Imported NumPy {np.__version__} does not match distribution metadata {installed}."
    )
    ledger = json.loads((ROOT / "licences.json").read_text())
    rows = [row for row in ledger["python"] if row["name"].casefold() == "numpy"]
    assert len(rows) == 1, "Record one NumPy entry in licences.json."
    assert rows[0]["spec"] == ">=2.3.5,<=2.5.4", "Record the tested NumPy version envelope."
    assert rows[0]["requirements"] == NUMPY_REQUIREMENTS, (
        "NumPy interpreter-specific requirements and licence pins must agree."
    )


def test_production_typecheck_with_installed_numpy_stubs(tmp_path: Path):
    versions = (
        f"Python {platform.python_version()}, NumPy {np.__version__}, "
        f"mypy {importlib.metadata.version('mypy')}"
    )
    result = subprocess.run(
        [sys.executable, "-m", "mypy", "--config-file", "mypy.ini",
         "--no-incremental", "--cache-dir", str(tmp_path / "mypy"), "plumb_api"],
        cwd=API,
        capture_output=True,
        text=True,
        timeout=180,
        check=False,
    )
    assert result.returncode == 0, (
        f"Production typecheck failed with {versions}.\n"
        f"stdout:\n{result.stdout}\nstderr:\n{result.stderr}"
    )
    assert "Success: no issues found" in result.stdout, (
        f"Typecheck did not report success with {versions}.\n{result.stdout}\n{result.stderr}"
    )
