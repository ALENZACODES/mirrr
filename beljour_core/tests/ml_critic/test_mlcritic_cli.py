"""Critic command line on drawn fixtures written to tmp_path as PNG.

Author: John Khan.
"""

from __future__ import annotations

import io
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import pytest
from numpy.typing import NDArray
from PIL import Image

from lab.ml.critic import make_sample
from lab.ml.critic.cli import main

REPO = Path(__file__).resolve().parents[3]
SIZE = 80


def save_png(path: Path, array: NDArray[np.float64] | NDArray[np.bool_]) -> Path:
    data = np.asarray(np.round(np.asarray(array, dtype=np.float64) * 255), dtype=np.uint8)
    Image.fromarray(data).save(path)
    return path


def write_pair(folder: Path, artifact: str | None, seed: int) -> tuple[Path, Path, Path]:
    sample = make_sample(np.random.default_rng(seed), artifact, 0.9, SIZE)
    assert sample.mask is not None
    return (save_png(folder / f"before{seed}.png", sample.before),
            save_png(folder / f"after{seed}.png", sample.after),
            save_png(folder / f"mask{seed}.png", sample.mask))


@pytest.fixture(scope="module")
def model(tmp_path_factory: pytest.TempPathFactory) -> Path:
    stem = tmp_path_factory.mktemp("critic") / "critic"
    out = io.StringIO()
    code = main(["train", "--out", str(stem), "--count", "180", "--size", str(SIZE)], out)
    assert code == 0
    assert "wrote" in out.getvalue()
    return stem


def test_clean_pair_passes(model: Path, tmp_path: Path) -> None:
    before, after, mask = write_pair(tmp_path, None, 1)
    out = io.StringIO()
    code = main(["score", str(before), str(after), "--mask", str(mask), "--model", str(model)],
                out)
    assert code == 0, out.getvalue()
    assert "PASS" in out.getvalue()


def test_flawed_pair_fails_with_reasons_in_json(model: Path, tmp_path: Path) -> None:
    before, after, mask = write_pair(tmp_path, "seam", 2)
    out = io.StringIO()
    code = main(["score", str(before), str(after), "--mask", str(mask), "--model", str(model),
                 "--json"], out)
    payload = json.loads(out.getvalue())
    assert code == 1
    assert payload["passed"] is False
    assert payload["reasons"]
    assert "not validated on real faces" in payload["scope"]


def test_threshold_override(model: Path, tmp_path: Path) -> None:
    before, after, mask = write_pair(tmp_path, None, 3)
    args = ["score", str(before), str(after), "--mask", str(mask), "--model", str(model)]
    assert main(args + ["--threshold", "1.01"], io.StringIO()) == 1


def test_mismatched_sizes_exit_two(model: Path, tmp_path: Path) -> None:
    before, _, _ = write_pair(tmp_path, None, 4)
    small = save_png(tmp_path / "small.png", np.zeros((40, 40, 3)))
    out = io.StringIO()
    assert main(["score", str(before), str(small), "--model", str(model)], out) == 2
    assert "same size" in out.getvalue()


def test_missing_model_and_file_exit_two(tmp_path: Path) -> None:
    before, after, _ = write_pair(tmp_path, None, 5)
    out = io.StringIO()
    assert main(["score", str(before), str(after), "--model", str(tmp_path / "x")], out) == 2
    assert main(["score", str(tmp_path / "none.png"), str(after)], out) == 2


def test_report_command_writes_markdown(tmp_path: Path) -> None:
    target = tmp_path / "report.md"
    out = io.StringIO()
    assert main(["report", "--out", str(target), "--count", "120", "--size", "64"], out) == 0
    text = target.read_text(encoding="utf-8")
    assert "weak artifacts" in text
    assert "skin tones" in text
    assert "None of it is a measurement on real faces" in text


def test_module_entry_point(model: Path, tmp_path: Path) -> None:
    before, after, mask = write_pair(tmp_path, None, 6)
    done = subprocess.run(
        [sys.executable, "-m", "lab.ml.critic", "score", str(before), str(after),
         "--mask", str(mask), "--model", str(model)],
        cwd=REPO, capture_output=True, text=True, check=False,
    )
    assert done.returncode == 0, done.stdout + done.stderr
    assert "realism" in done.stdout
