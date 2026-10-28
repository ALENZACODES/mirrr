"""Worked denoising example reaches its stated thresholds; model card writer.

Thresholds: training loss falls below a quarter of its first value, held-out
MSE falls below 0.0075 (noisy input is about 0.0100) and PSNR improves by more
than 1.5 dB over the noisy input. Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

from lab.ml.train import config as C
from lab.ml.train import denoise_example as DE
from lab.ml.train import experiments as X
from lab.ml.train import modelcard as M
from lab.ml.train.data import LicenceError, LicenceRecord
from lab.ml.train.tensor import Tensor


def test_denoise_example_meets_thresholds() -> None:
    result = DE.run()
    assert result.steps == 120
    assert result.final_loss < 0.25 * result.first_loss
    assert result.val_mse < 0.0075
    assert result.noisy_psnr == pytest.approx(20.0, abs=0.3)
    assert result.gain_db > 1.5
    assert "dB denoised" in result.summary()


def test_residual_denoiser_starts_near_identity() -> None:
    model = DE.ResidualDenoiser(np.random.default_rng(0), width=4)
    x = Tensor(np.random.default_rng(1).random((1, 3, 8, 8)).astype(np.float32))
    residual = float(np.abs(model(x).data - x.data).mean())
    assert 0.0 < residual < 0.5 * float(np.abs(x.data).mean())


def test_example_main_prints_summary(capsys: pytest.CaptureFixture[str],
                                     monkeypatch: pytest.MonkeyPatch) -> None:
    fake = DE.DenoiseResult(steps=1, first_loss=1.0, final_loss=0.5, val_mse=0.1,
                            noisy_psnr=20.0, denoised_psnr=21.0)
    monkeypatch.setattr(DE, "run", lambda: fake)
    assert DE.main() == 0
    assert "+1.00 dB" in capsys.readouterr().out


def _card(**changes: object) -> M.ModelCard:
    base: dict[str, object] = {
        "name": "unit", "summary": "Test card.", "intended_use": "Unit tests only.",
        "data": [LicenceRecord("drawn shapes", "CC0-1.0", True)],
        "config": {"model": {"kind": "mlp"}}, "metrics": {"val_loss": 0.25},
    }
    base.update(changes)
    return M.ModelCard(**base)  # type: ignore[arg-type]


def test_card_markdown_sections(tmp_path: Path) -> None:
    text = _card().to_markdown()
    for part in ("# Model card: unit", "Author: John Khan", "## Intended use",
                 "## Training data", "| drawn shapes | CC0-1.0 | yes | - |", "## Metrics",
                 "| val_loss | 0.25 |", "## Limits", "## Configuration", '"kind": "mlp"'):
        assert part in text
    path = _card().write(tmp_path / "card.md")
    assert path.read_text() == text


@pytest.mark.parametrize(
    ("changes", "message"),
    [
        ({"data": []}, "no training data"),
        ({"data": [LicenceRecord("scraped", "CC-BY-NC-4.0", False)]}, "allow list"),
        ({"intended_use": " "}, "intended use"),
        ({"limits": []}, "limits"),
    ],
)
def test_card_refuses_unusable_data_or_missing_text(changes: dict[str, object],
                                                    message: str) -> None:
    with pytest.raises(LicenceError, match=message):
        _card(**changes).to_markdown()


def test_card_from_registry_run(tmp_path: Path) -> None:
    config = C.from_dict({
        "name": "card-run",
        "data": {"task": "regression", "samples": 24, "batch_size": 8, "features": 2},
        "model": {"kind": "mlp", "hidden": [4]},
        "train": {"epochs": 1, "checkpoint_every": 1},
    })
    registry = X.Registry(tmp_path)
    record = X.run(registry, config)
    card = M.from_run(record, intended_use="Demonstrates the card writer.")
    text = card.to_markdown()
    assert record.run_id in text and record.config_hash in text
    assert "regression data drawn in code, 24 samples" in text
    assert "LicenseRef-Synthetic-In-Code" in text
    assert card.weights.startswith("checkpoints/ckpt-")
    assert card.limits == list(M.DEFAULT_LIMITS)
    custom = M.from_run(record, "x", limits=["Only for tests."], summary="Short.")
    assert custom.limits == ["Only for tests."] and custom.summary == "Short."
