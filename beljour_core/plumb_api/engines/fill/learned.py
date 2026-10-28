"""E07 part 2: the learned (MI-GAN) fill method behind the E03 registry gate, Python mirror.

Mirrors web/src/engines/fill/onnx/{runtime,migan}.ts so the crop, tensor and composite
rules are proven in both languages (parity/spikes-r7.json). Inspiration: MI-GAN (Sargsyan
et al., ICCV 2023) for the crop-around-the-hole and masked-input idea; concept only, no
code copied. Nothing here imports onnxruntime or downloads anything: a session object with
onnxruntime's `get_inputs()` / `get_outputs()` / `run(None, feeds)` shape is passed in,
and only after `ModelRegistry.require_allowed` approves the model. MI-GAN is pending
(Places2 data terms), so `fill_any(..., "mi-gan")` falls back to the R5 fill today.

Layouts (see the TypeScript module for what is stated vs ASSUMED):
  "pipeline-uint8": uint8 image [1, 3, H, W], uint8 mask [1, 1, H, W] (255 known, 0 hole).
  "generator-512": float32 [1, 4, 512, 512] = (known - 0.5, masked RGB in [-1, 1]).
Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from typing import Any, Protocol

import numpy as np
from numpy.typing import NDArray

from ...models.registry import ModelRegistry, RegistryError
from ..core.resample import resize
from .fill import METHODS, FillOutcome, fill, grown_hole

MIGAN_ID = "migan-512-places2"
LAYOUTS = ("pipeline-uint8", "generator-512")
GENERATOR_SIDE = 512
MARGIN_SHARE, MIN_SIDE = 0.5, 128
LEARNED_METHODS = ("mi-gan",)
U8 = NDArray[np.uint8]


@dataclass(frozen=True)
class Box:
    left: int
    top: int
    width: int
    height: int

    def to_json(self) -> dict[str, int]:
        return {"left": self.left, "top": self.top, "width": self.width, "height": self.height}


def hole_box(hole: np.ndarray) -> Box | None:
    on = np.asarray(hole) >= 0.5
    if not on.any():
        return None
    ys, xs = np.nonzero(on)
    return Box(int(np.min(xs)), int(np.min(ys)), int(np.max(xs) - np.min(xs) + 1), int(np.max(ys) - np.min(ys) + 1))


def _round_half_up(v: float) -> int:
    """JavaScript Math.round, so both languages place the crop identically."""
    return int(math.floor(v + 0.5))


def crop_box(hole: np.ndarray, margin_share: float = MARGIN_SHARE, min_side: int = MIN_SIDE) -> Box | None:
    b = hole_box(hole)
    if b is None:
        return None
    h, w = np.asarray(hole).shape
    side = max(min_side, int(math.ceil(max(b.width, b.height) * (1 + 2 * margin_share))))
    cw, ch = min(side, w), min(side, h)
    cx, cy = b.left + b.width / 2, b.top + b.height / 2
    left = min(max(0, _round_half_up(cx - cw / 2)), w - cw)
    top = min(max(0, _round_half_up(cy - ch / 2)), h - ch)
    return Box(left, top, cw, ch)


def crop_image(image: np.ndarray, box: Box) -> U8:
    out: U8 = np.ascontiguousarray(np.asarray(image)[box.top:box.top + box.height, box.left:box.left + box.width, :3])
    return out


def crop_hole(hole: np.ndarray, box: Box) -> U8:
    sub = np.asarray(hole)[box.top:box.top + box.height, box.left:box.left + box.width]
    out: U8 = (sub >= 0.5).astype(np.uint8)
    return out


def resize_binary(bits: np.ndarray, to_width: int, to_height: int) -> U8:
    h, w = bits.shape
    sy = np.minimum(h - 1, np.floor((np.arange(to_height) + 0.5) * h / to_height).astype(np.int64))
    sx = np.minimum(w - 1, np.floor((np.arange(to_width) + 0.5) * w / to_width).astype(np.int64))
    out: U8 = np.asarray(bits)[sy][:, sx].astype(np.uint8)
    return out


def build_feeds(crop: np.ndarray, hole: np.ndarray, layout: str) -> dict[str, np.ndarray]:
    """Input arrays for one crop (keys "image" + "mask", or "input")."""
    img = np.asarray(crop)
    if img.ndim != 3 or img.shape[2] != 3 or hole.shape != img.shape[:2]:
        raise ValueError("crop and hole sizes differ")
    if layout == "pipeline-uint8":
        return {"image": np.ascontiguousarray(img.transpose(2, 0, 1)[None]).astype(np.uint8),
                "mask": np.where(hole > 0, 0, 255).astype(np.uint8)[None, None]}
    if layout != "generator-512":
        raise ValueError(f"layout must be one of {', '.join(LAYOUTS)}")
    s = GENERATOR_SIDE
    scaled = img if img.shape[:2] == (s, s) else resize(img, s, s)
    known = 1.0 - resize_binary(hole, s, s).astype(np.float64)
    rgb = (scaled.astype(np.float64) / 127.5 - 1.0) * known[..., None]
    stack = np.concatenate([(known - 0.5)[None], rgb.transpose(2, 0, 1)], axis=0)
    return {"input": stack[None].astype(np.float32)}


def decode_output(out: np.ndarray, layout: str, width: int, height: int) -> U8:
    arr = np.asarray(out)
    if layout == "pipeline-uint8":
        if arr.dtype != np.uint8 or arr.shape != (1, 3, height, width):
            raise ValueError(f"pipeline output must be uint8 [1,3,{height},{width}]")
        result: U8 = np.ascontiguousarray(arr[0].transpose(1, 2, 0))
        return result
    s = GENERATOR_SIDE
    if arr.dtype != np.float32 or arr.shape != (1, 3, s, s):
        raise ValueError(f"generator output must be float32 [1,3,{s},{s}]")
    if not np.all(np.isfinite(arr)):
        raise ValueError("generator output must be finite")
    img = np.clip(np.rint((arr[0].astype(np.float64) + 1) * 127.5), 0, 255).astype(np.uint8).transpose(1, 2, 0)
    img = np.ascontiguousarray(img)
    return img if (width, height) == (s, s) else resize(img, width, height)


def composite_hole(image: np.ndarray, bits: np.ndarray, box: Box, filled: np.ndarray) -> U8:
    out = np.asarray(image).copy()
    region = out[box.top:box.top + box.height, box.left:box.left + box.width]
    on = np.asarray(bits) > 0
    region[on, :3] = np.asarray(filled)[on]
    return out


class SessionLike(Protocol):
    def get_inputs(self) -> list[Any]: ...
    def get_outputs(self) -> list[Any]: ...
    def run(self, output_names: Any, feeds: dict[str, np.ndarray]) -> list[np.ndarray]: ...


def gate(registry: ModelRegistry, ledger: Mapping[str, Any], model_id: str = MIGAN_ID) -> tuple[bool, str]:
    """(ready, reason) from the registry alone; never touches the network."""
    try:
        registry.require_allowed(model_id, ledger)
    except RegistryError as exc:
        return False, str(exc)
    return True, "ready"


class MiganFill:
    """MI-GAN through a session that only exists once the registry approved the model."""
    method = "mi-gan"

    def __init__(self, session_factory: Callable[[], SessionLike] | None, registry: ModelRegistry,
                 ledger: Mapping[str, Any], *, layout: str = "pipeline-uint8", model_id: str = MIGAN_ID) -> None:
        if layout not in LAYOUTS:
            raise ValueError(f"layout must be one of {', '.join(LAYOUTS)}")
        registry.get(model_id)
        self.layout, self.model_id = layout, model_id
        self._factory, self._registry, self._ledger = session_factory, registry, ledger
        self._session: SessionLike | None = None

    def status(self) -> tuple[bool, str]:
        ready, reason = gate(self._registry, self._ledger, self.model_id)
        if ready and self._factory is None:
            return False, "no ONNX runtime session factory was given"
        return ready, reason

    def fill(self, image: np.ndarray, hole: np.ndarray) -> FillOutcome:
        ready, reason = self.status()
        if not ready:
            raise RegistryError(reason)
        box = crop_box(hole)
        if box is None:
            return FillOutcome(np.asarray(image).copy(), np.asarray(hole, np.float32), "mi-gan", 0)
        if self._session is None:
            assert self._factory is not None
            self._session = self._factory()
        crop, bits = crop_image(image, box), crop_hole(hole, box)
        feeds = build_feeds(crop, bits, self.layout)
        names = [i.name for i in self._session.get_inputs()]
        keys = ("image", "mask") if self.layout == "pipeline-uint8" else ("input",)
        inputs = {names[k] if k < len(names) else key: feeds[key] for k, key in enumerate(keys)}
        outputs = self._session.run(None, inputs)
        if not outputs:
            raise ValueError("model returned no output")
        filled = decode_output(outputs[0], self.layout, box.width, box.height)
        details = {"crop_left": float(box.left), "crop_top": float(box.top), "crop_width": float(box.width),
                   "crop_height": float(box.height)}
        return FillOutcome(composite_hole(image, bits, box, filled), np.asarray(hole, np.float32), "mi-gan",
                           int(bits.sum()), details)


@dataclass(frozen=True)
class AnyFillOutcome:
    outcome: FillOutcome
    requested: str
    fallback_reason: str | None


def fill_any(image: np.ndarray, mask: np.ndarray, method: str = "biharmonic", *, learned: MiganFill | None = None,
             fallback: str = "biharmonic", **options: Any) -> AnyFillOutcome:
    """Any fill method; "mi-gan" runs only when ready and falls back to the R5 fill otherwise."""
    if method != "mi-gan":
        return AnyFillOutcome(fill(image, mask, method, **options), method, None)
    if fallback not in METHODS:
        raise ValueError(f"fallback must be one of {', '.join(METHODS)}")
    ready, reason = learned.status() if learned is not None else (False, "no learned fill was configured")
    if learned is not None and ready:
        img = np.asarray(image)
        try:
            hole = grown_hole(mask, img.shape[:2], float(options.get("grow", 0.0)))
            return AnyFillOutcome(learned.fill(img, hole), method, None)
        except (ValueError, RegistryError, RuntimeError) as exc:
            reason = f"learned fill failed: {exc}"
    out = fill(image, mask, fallback, **options)
    details = {**out.details, "fallback": 1.0}
    return AnyFillOutcome(FillOutcome(out.image, out.hole, out.method, out.hole_pixels, details), method, reason)
