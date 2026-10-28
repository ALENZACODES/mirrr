"""R7 E07 part 2: the MI-GAN wrapper behind the registry gate (Python mirror).

The catalogue entry is pending, so every call falls back. A fake allowed registry and a
fake onnxruntime-shaped session drive the full path. No downloads, no onnxruntime import.
Author: John Khan.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import pytest

from plumb_api.engines.core.masks import ellipse
from plumb_api.engines.fill import fill as fills, learned
from plumb_api.models.registry import ModelRegistry, RegistryError, pinned_revision, verify_catalog_licences

ROOT = Path(__file__).resolve().parents[2]
LEDGER = json.loads((ROOT / "licences.json").read_text())
COMMIT = "0123456789abcdef0123456789abcdef01234567"
BYTES = b"not a model"
H, W = 120, 160
IMG = np.stack([*np.meshgrid(np.arange(W) + 40, np.arange(H) + 60), np.full((H, W), 150)], -1).astype(np.uint8)
HOLE = ellipse(H, W, 70, 50, 9, 7)


def allowed(url: str = f"https://huggingface.co/o/r/resolve/{COMMIT}/model.onnx") -> tuple[ModelRegistry, dict]:
    reg = ModelRegistry({"format": "beljour-models/1", "version": 1, "models": [{
        "id": learned.MIGAN_ID, "task": "inpainting", "filename": "model.onnx", "url": url,
        "sha256": hashlib.sha256(BYTES).hexdigest(), "bytes": len(BYTES), "licenceName": "Fake fill", "licence": "MIT",
        "status": "allowed", "runsOn": "browser", "note": "test"}]})
    ledger = {"policy": {"allowed": ["MIT"]}, "runtime": [
        {"name": "Fake fill", "licence": "MIT", "status": "allowed", "urls": ["https://huggingface.co/o/r/"]}]}
    return reg, ledger


class FakeSession:
    def __init__(self, layout: str, bad: bool = False) -> None:
        self.layout, self.bad, self.runs = layout, bad, 0

    def get_inputs(self):
        names = ["image", "mask"] if self.layout == "pipeline-uint8" else ["input"]
        return [SimpleNamespace(name=n) for n in names]

    def get_outputs(self):
        return [SimpleNamespace(name="out")]

    def run(self, output_names, feeds):
        self.runs += 1
        if self.layout == "pipeline-uint8":
            _, _, h, w = feeds["image"].shape
            return [np.full((1, 3, h + int(self.bad), w), 200, np.uint8)]
        return [np.full((1, 3, 512, 512), 0.5, np.float32)]


def test_catalogue_entry_is_pending_and_ledger_coherent():
    reg = ModelRegistry.read()
    entry = reg.get(learned.MIGAN_ID)
    assert entry.status == "pending" and entry.task == "inpainting" and entry.sha256 is None
    assert not verify_catalog_licences(reg, LEDGER)
    ready, reason = learned.gate(reg, LEDGER)
    assert not ready and "pending" in reason


def test_pending_model_falls_back_to_the_exact_r5_fill():
    reg = ModelRegistry.read()
    factory_calls = []
    wrapper = learned.MiganFill(lambda: factory_calls.append(1) or FakeSession("pipeline-uint8"), reg, LEDGER)
    out = learned.fill_any(IMG, HOLE, "mi-gan", learned=wrapper)
    assert out.requested == "mi-gan" and out.outcome.method == "biharmonic" and "pending" in out.fallback_reason
    assert (out.outcome.image == fills.fill(IMG, HOLE, "biharmonic").image).all()
    assert out.outcome.details["fallback"] == 1.0 and factory_calls == []
    with pytest.raises(RegistryError):
        wrapper.fill(IMG, HOLE)
    plain = learned.fill_any(IMG, HOLE, "patchmatch")
    assert plain.fallback_reason is None and plain.outcome.method == "patchmatch"
    nothing = learned.fill_any(IMG, HOLE, "mi-gan", fallback="fast-marching")
    assert nothing.outcome.method == "fast-marching" and "no learned fill" in nothing.fallback_reason
    with pytest.raises(ValueError):
        learned.fill_any(IMG, HOLE, "mi-gan", fallback="mi-gan")


@pytest.mark.parametrize("layout", learned.LAYOUTS)
def test_allowed_model_runs_and_writes_only_hole_pixels(layout):
    reg, ledger = allowed()
    session = FakeSession(layout)
    wrapper = learned.MiganFill(lambda: session, reg, ledger, layout=layout)
    assert wrapper.status() == (True, "ready")
    out = learned.fill_any(IMG, HOLE, "mi-gan", learned=wrapper)
    assert out.fallback_reason is None and out.outcome.method == "mi-gan"
    inside = HOLE >= 0.5
    assert (out.outcome.image[~inside] == IMG[~inside]).all()
    if layout == "pipeline-uint8":
        assert (out.outcome.image[inside] == 200).all()
    learned.fill_any(IMG, HOLE, "mi-gan", learned=wrapper)
    assert session.runs == 2


def test_wrong_output_falls_back_and_branch_urls_cannot_be_allowed():
    reg, ledger = allowed()
    wrapper = learned.MiganFill(lambda: FakeSession("pipeline-uint8", bad=True), reg, ledger)
    out = learned.fill_any(IMG, HOLE, "mi-gan", learned=wrapper)
    assert out.outcome.method == "biharmonic" and "pipeline output must be uint8" in out.fallback_reason
    assert learned.MiganFill(None, reg, ledger).status() == (False, "no ONNX runtime session factory was given")
    with pytest.raises(RegistryError, match="pin a commit"):
        allowed("https://huggingface.co/o/r/resolve/main/model.onnx")
    with pytest.raises(RegistryError, match="resolve"):
        allowed("https://huggingface.co/o/model.onnx")
    assert pinned_revision(f"https://huggingface.co/o/r/resolve/{COMMIT}/m.onnx")
    assert not pinned_revision("https://huggingface.co/o/r/resolve/main/m.onnx")
    with pytest.raises(ValueError, match="layout"):
        learned.MiganFill(None, reg, ledger, layout="wide")


def test_crop_feeds_decode_and_composite():
    assert learned.hole_box(np.zeros((10, 10))) is None
    box = learned.crop_box(HOLE)
    assert (box.width, box.height) == (128, 120)
    crop = np.arange(24, dtype=np.uint8).reshape(2, 4, 3)
    bits = np.array([[0, 1, 0, 0], [0, 0, 1, 0]], np.uint8)
    feeds = learned.build_feeds(crop, bits, "pipeline-uint8")
    assert feeds["image"].shape == (1, 3, 2, 4) and feeds["image"][0, 0, 0].tolist() == [0, 3, 6, 9]
    assert feeds["mask"][0, 0].tolist() == [[255, 0, 255, 255], [255, 255, 0, 255]]
    gen = learned.build_feeds(crop, bits, "generator-512")["input"]
    assert gen.shape == (1, 4, 512, 512) and gen.dtype == np.float32 and np.abs(gen).max() <= 1
    back = learned.decode_output(feeds["image"], "pipeline-uint8", 4, 2)
    assert (back == crop).all()
    for bad in (np.zeros((1, 3, 2, 2), np.float32), np.full((1, 3, 512, 512), np.nan, np.float32)):
        with pytest.raises(ValueError):
            learned.decode_output(bad, "generator-512", 4, 2)
    with pytest.raises(ValueError):
        learned.build_feeds(crop, bits[:1], "pipeline-uint8")
    assert learned.resize_binary(np.array([[1, 0], [0, 1]], np.uint8), 4, 4).tolist() == [
        [1, 1, 0, 0], [1, 1, 0, 0], [0, 0, 1, 1], [0, 0, 1, 1]]
    base = np.zeros((4, 6, 3), np.uint8)
    out = learned.composite_hole(base, bits, learned.Box(1, 1, 4, 2), np.full((2, 4, 3), 9, np.uint8))
    assert out[1, 2, 0] == 9 and out[1, 1, 0] == 0
