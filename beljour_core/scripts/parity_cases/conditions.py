"""Generate compact R12 Enhance condition/rescue parity evidence.

Twenty-five bounded, explicitly synthetic inputs: all five conditions in RGB and
RGBA, ten normally lit Monk colour swatches, four mixed defects and protected
highlights. Store full-input compressed bytes and complete-output SHA-256, not
sampled output pixels. Diagnostics retain floating precision without fixture-side
rounding; public step logs retain the engine's report precision. No faces/models.
Author: John Khan.
"""
from __future__ import annotations

import base64
import hashlib
import math
import sys
import zlib
from dataclasses import asdict
from pathlib import Path
from typing import Any

import numpy as np

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "api"))
from plumb_api.engines.repair import restore, safety, synthetic  # noqa: E402

PATH = ROOT / "parity/condition-r12.json"
FORMAT = "beljour-condition-r12/1"
ABS_TOLERANCE = 1e-8
REL_TOLERANCE = 1e-10
MONK = ((246, 237, 228), (243, 231, 219), (247, 234, 208), (234, 218, 186), (215, 189, 150),
        (160, 126, 86), (130, 92, 67), (96, 65, 52), (58, 49, 42), (41, 36, 32))


def faded(image: np.ndarray) -> np.ndarray:
    rgb = image.astype(np.float64)
    luminance = (rgb @ np.array([0.299, 0.587, 0.114]))[..., None]
    return np.clip(np.rint(125 + 0.4 * (luminance - 80) + 0.12 * (rgb - luminance)), 0, 255).astype(np.uint8)


def swatch(tone: int) -> np.ndarray:
    """A geometric colour swatch with a lit surround; labels never infer a person's tone."""
    image = np.full((64, 80, 3), (170, 190, 210), dtype=np.uint8)
    y, x = np.mgrid[:64, :80]
    inside = ((x - 40) / 27) ** 2 + ((y - 34) / 29) ** 2 < 1
    image[inside] = MONK[tone - 1]
    image[inside & (y < 21)] = (24, 20, 18)
    image[inside & (y > 35) & ((x * 11 + y * 17) % 127 == 0)] = np.maximum(np.array(MONK[tone - 1]) - 15, 0)
    image[29:31, 28:32] = image[29:31, 48:52] = (14, 15, 16)
    return image


def alpha_image(image: np.ndarray) -> np.ndarray:
    y, x = np.indices(image.shape[:2])
    alpha = ((x * 13 + y * 29) % 256).astype(np.uint8)
    alpha[:3, :] = 0
    alpha[-3:, :] = 255
    return np.dstack((image, alpha))


def cases() -> list[tuple[str, np.ndarray, str, list[str]]]:
    scene = synthetic.scene(96, 80)
    classes = {"normal": scene, "low_light": synthetic.low_light(scene, 0.4),
               "blurry": synthetic.blur(scene, 2), "noisy": synthetic.add_noise(scene, 16, 3),
               "old": faded(scene)}
    selected = []
    for name, image in classes.items():
        selected.append((f"{name}-rgb", image, "low_light", [name] if name != "normal" else []))
        selected.append((f"{name}-rgba", alpha_image(image), "portrait", [name] if name != "normal" else []))
    for tone in range(1, 11):
        image = swatch(tone)
        selected.append((f"normal-monk-{tone}", alpha_image(image) if tone % 2 == 0 else image, "low_light", []))
    selected += [
        ("mixed-dark-noise", synthetic.add_noise(synthetic.low_light(scene, 0.18), 12, 4), "low_light", ["low_light", "noisy"]),
        ("mixed-dark-blur", alpha_image(synthetic.low_light(synthetic.blur(scene, 2), 0.3)), "backlit", ["low_light", "blurry"]),
        ("mixed-faded-noise", synthetic.add_noise(faded(scene), 8, 7), "natural", ["old", "noisy"]),
        ("mixed-faded-blur", alpha_image(faded(synthetic.blur(scene, 2))), "natural", ["old", "blurry"]),
    ]
    highlight = synthetic.low_light(scene, 0.18)
    highlight[3:5, 3:5] = 255
    selected.append(("dark-protected-highlights", alpha_image(highlight), "low_light", ["low_light"]))
    return selected


def sha256(image: np.ndarray) -> str:
    return hashlib.sha256(np.ascontiguousarray(image).tobytes()).hexdigest()


def measure(image: np.ndarray, mode: str) -> dict[str, Any]:
    result = restore.enhance(image, mode)
    return {"output_sha256": sha256(result.image),
            "alpha_sha256": sha256(result.image[..., 3]) if image.shape[2] == 4 else None,
            "condition": asdict(result.condition), "steps": result.steps,
            "before": asdict(result.before), "after": asdict(result.after),
            "safety": result.safety, "raw_safety": asdict(safety.measure_safety(image, result.image))}


def build() -> dict[str, Any]:
    vectors = []
    for name, image, mode, flags in cases():
        measured = measure(image, mode)
        actual = [key for key in ("low_light", "blurry", "noisy", "old") if measured["condition"][key]]
        if not set(flags) <= set(actual) or (not flags and measured["condition"]["primary"] != "normal"):
            raise ValueError(f"synthetic case {name} no longer exercises its declared condition")
        if flags and measured["output_sha256"] == sha256(image):
            raise ValueError(f"synthetic case {name} no longer exercises a rescue output")
        vectors.append({"id": name, "shape": list(image.shape), "mode": mode, "required_flags": flags,
                        "input_zlib_base64": base64.b64encode(zlib.compress(image.tobytes(), 9)).decode("ascii"),
                        "input_sha256": sha256(image), **measured})
    return {"format": FORMAT, "author": "John Khan", "synthetic_only": True,
            "byte_tolerance": 0, "absolute_tolerance": ABS_TOLERANCE, "relative_tolerance": REL_TOLERANCE,
            "diagnostics": "No fixture rounding; public step logs retain engine report precision.", "cases": vectors}


def same_input(actual: Any, expected: Any, path: str) -> None:
    """Stored inputs are compared as decompressed bytes, exactly. zlib builds (for example
    zlib-ng) may compress identical bytes differently, so the compressed text is not the
    evidence; the bytes it holds are."""
    try:
        first = zlib.decompress(base64.b64decode(str(actual), validate=True))
        second = zlib.decompress(base64.b64decode(str(expected), validate=True))
    except (ValueError, zlib.error) as exc:
        raise ValueError(f"{path}: stored input does not decode") from exc
    if first != second:
        raise ValueError(f"{path}: input bytes differ")


def equivalent(actual: Any, expected: Any, path: str = "fixture") -> None:
    """Exact bytes/labels/keys; small numerical tolerance only for floating reductions."""
    if isinstance(actual, dict) and isinstance(expected, dict):
        if set(actual) != set(expected):
            raise ValueError(f"{path}: keys differ")
        for key in actual:
            if key.endswith("_zlib_base64"):
                same_input(actual[key], expected[key], f"{path}.{key}")
                continue
            equivalent(actual[key], expected[key], f"{path}.{key}")
    elif isinstance(actual, (tuple, list)) and isinstance(expected, (tuple, list)):
        if len(actual) != len(expected):
            raise ValueError(f"{path}: lengths differ")
        for index, (first, second) in enumerate(zip(actual, expected, strict=True)):
            equivalent(first, second, f"{path}[{index}]")
    elif type(actual) in (int, float) and type(expected) in (int, float):
        if not math.isfinite(actual) or not math.isfinite(expected) or not math.isclose(actual, expected, rel_tol=REL_TOLERANCE, abs_tol=ABS_TOLERANCE):
            raise ValueError(f"{path}: numeric diagnostics drifted")
    elif type(actual) is not type(expected) or actual != expected:
        raise ValueError(f"{path}: value differs")
