"""Permanent R12 Enhance parity contract on 25 generated images.

Pass: complete output and alpha SHA-256 exact; all diagnostic fields agree with
the shared, unrounded evidence within 1e-8 absolute + 1e-10 relative tolerance.
All five conditions use RGB and RGBA; mixed defects and normally lit Monk 1-10
swatches stay in the fixture. No model, network or real face. Author: John Khan.
"""
from __future__ import annotations

import base64
import importlib.util
import json
import zlib
from pathlib import Path

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("r12_condition_parity", ROOT / "api/scripts/parity_cases/conditions.py")
assert SPEC and SPEC.loader
PARITY = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PARITY)
VECTORS = json.loads(PARITY.PATH.read_text(encoding="utf-8"))


def test_condition_parity_fixture_declares_complete_bounded_synthetic_coverage():
    assert VECTORS["format"] == PARITY.FORMAT and VECTORS["synthetic_only"] is True
    assert VECTORS["author"] == "John Khan" and VECTORS["byte_tolerance"] == 0
    cases = VECTORS["cases"]
    assert len(cases) == 25 and len({case["id"] for case in cases}) == 25
    pairs = {(case["condition"]["primary"], case["shape"][2]) for case in cases}
    assert pairs == {(name, channels) for name in ("normal", "low_light", "blurry", "noisy", "old") for channels in (3, 4)}
    assert {case["id"] for case in cases if "monk" in case["id"]} == {f"normal-monk-{tone}" for tone in range(1, 11)}
    assert sum(len(case["required_flags"]) > 1 for case in cases) == 4
    assert all(4 <= min(case["shape"][:2]) and max(case["shape"][:2]) <= 96 for case in cases)


@pytest.mark.parametrize("vector", VECTORS["cases"], ids=lambda row: row["id"])
def test_python_complete_output_and_diagnostics_match_condition_fixture(vector):
    payload = zlib.decompress(base64.b64decode(vector["input_zlib_base64"], validate=True))
    source = np.frombuffer(payload, dtype=np.uint8).reshape(vector["shape"]).copy()
    assert PARITY.sha256(source) == vector["input_sha256"]
    measured = PARITY.measure(source, vector["mode"])
    PARITY.equivalent(measured, {key: vector[key] for key in measured}, vector["id"])
    assert PARITY.sha256(source) == vector["input_sha256"], "input ownership must survive the complete rescue pipeline"
    if source.shape[2] == 4:
        assert 0 in source[..., 3] and 255 in source[..., 3]
        assert measured["alpha_sha256"] == PARITY.sha256(source[..., 3])
    if vector["required_flags"]:
        assert measured["output_sha256"] != vector["input_sha256"], "rescue coverage must not collapse into a no-op"
