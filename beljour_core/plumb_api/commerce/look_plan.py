"""R19 privacy-preserving, fictional multistep makeup look planner.

A look is a *recipe* of at most three synthetic catalogue items, not a photograph,
customer identity, provider preview or purchase. It never refers to a real brand.
Every effect is tied to an approved local sample product and an explicit strength.
The plan can be executed locally without a network, or passed to the single
existing makeup-VTO gateway after a separate, route-level consent check.
"""
from __future__ import annotations

import base64
import io
import json
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any, Literal

from PIL import Image

from .catalogue import Product, by_id
from .preview import MAX_SIMULATION_PIXELS, preview_local

Effect = Literal["foundation", "blush", "lip"]
EFFECTS: tuple[Effect, ...] = ("foundation", "blush", "lip")
MAX_ITEMS = 3
MAX_JSON_BYTES = 2048
MIN_STRENGTH = 0
MAX_STRENGTH = 100


@dataclass(frozen=True, slots=True)
class LookStep:
    product: Product
    strength: int

    def __post_init__(self) -> None:
        if self.product.vto not in EFFECTS:
            raise ValueError("Only virtual-try-on items can be used in a look")
        if type(self.strength) is not int or not MIN_STRENGTH <= self.strength <= MAX_STRENGTH:
            raise ValueError("Effect strength must be an integer 0..100")

    @property
    def effect(self) -> Effect:
        kind = self.product.vto
        if kind == "foundation":
            return "foundation"
        if kind == "blush":
            return "blush"
        return "lip"

    def public(self) -> dict[str, Any]:
        return {"product_id": self.product.sku, "effect": self.effect,
                "strength": self.strength, "swatch": self.product.swatch,
                "sample": True, "price_cents": self.product.price_cents}


@dataclass(frozen=True, slots=True)
class LookPlan:
    steps: tuple[LookStep, ...]

    def __post_init__(self) -> None:
        if not 1 <= len(self.steps) <= MAX_ITEMS:
            raise ValueError("Choose between one and three sample effects")
        effects = [item.effect for item in self.steps]
        if len(effects) != len(set(effects)):
            raise ValueError("Choose at most one product from each effect family")
        if effects != sorted(effects, key=EFFECTS.index):
            raise ValueError("Effects must follow the canonical complexion-cheek-lip order")

    @classmethod
    def parse(cls, raw: object) -> LookPlan:
        if not isinstance(raw, (list, tuple)) or not 1 <= len(raw) <= MAX_ITEMS:
            raise ValueError("Expected one to three effect steps")
        rows: list[LookStep] = []
        for item in raw:
            if not isinstance(item, Mapping) or set(item) != {"product_id", "strength"}:
                raise ValueError("Look steps require product_id and strength only")
            sku, strength = item["product_id"], item["strength"]
            if not isinstance(sku, str) or len(sku) > 80 or type(strength) is not int:
                raise ValueError("Malformed sample product step")
            selected = by_id().get(sku)
            if selected is None:
                raise ValueError("Unknown fictional sample product")
            rows.append(LookStep(selected, strength))
        rows.sort(key=lambda entry: EFFECTS.index(entry.effect))
        return cls(tuple(rows))

    def public(self) -> dict[str, Any]:
        return {"format": "beljour-sample-look/1", "steps": [s.public() for s in self.steps],
                "total_cents": self.subtotal, "currency": "CAD", "checkout_enabled": False,
                "image_included": False, "provider_credentials_included": False,
                "notice": "Fictional products, simulated colours; no checkout, physical shade test or clinical result."}

    @property
    def subtotal(self) -> int:
        return sum(entry.product.price_cents for entry in self.steps)

    def export_recipe(self) -> str:
        """User-initiated, compact and portable; contains no photo, IDs or session data."""
        payload = {"format": "beljour-sample-look/1",
                   "steps": [{"product_id": x.product.sku, "strength": x.strength} for x in self.steps]}
        out = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
        if len(out.encode("utf8")) > MAX_JSON_BYTES:
            raise ValueError("Look recipe exceeded the export budget")
        return out

    @classmethod
    def import_recipe(cls, text: str) -> LookPlan:
        if not isinstance(text, str) or len(text.encode("utf8")) > MAX_JSON_BYTES:
            raise ValueError("Look recipe is too large")
        try:
            raw = json.loads(text)
        except (ValueError, TypeError) as exc:
            raise ValueError("Invalid sample recipe") from exc
        if not isinstance(raw, dict) or set(raw) != {"format", "steps"} or raw.get("format") != "beljour-sample-look/1":
            raise ValueError("Wrong sample recipe version")
        return cls.parse(raw["steps"])

    def make_effects(self) -> list[dict[str, Any]]:
        """Build a provider-neutral recipe; specific API encoding stays in one adapter."""
        return [{"effect": row.effect, "color": row.product.swatch,
                 "strength": row.strength, "sku": row.product.sku} for row in self.steps]


@dataclass(frozen=True, slots=True)
class LookPreview:
    image: bytes
    image_type: str
    source: str
    units_spent: int
    provider_calls: int
    cached: bool
    labels: tuple[str, ...]
    fallback: str | None = None

    def public(self, plan: LookPlan) -> dict[str, Any]:
        encoded = base64.b64encode(self.image).decode("ascii")
        return {"image": f"data:{self.image_type};base64,{encoded}", "image_type": self.image_type,
                "source": self.source, "simulation": True,
                "product": plan.steps[0].product.to_json(),
                "products": [step.product.to_json() for step in plan.steps],
                "steps": [s.public() for s in plan.steps], "provider_calls": self.provider_calls,
                "units_spent": self.units_spent, "cached": self.cached,
                "fallback": self.fallback, "labels": list(self.labels),
                "sample_subtotal_cents": plan.subtotal, "checkout_enabled": False,
                "label": ("YouCam makeup VTO simulation" if self.source == "youcam" else
                          "Local multi-effect cosmetic simulation"),
                "notice": "Fictional products and approximate cosmetic effects. No real product has been tested."}


def _mime_for_format(format_name: str | None) -> str:
    """Decode only supported, concrete Pillow format names (which may be None)."""
    formats = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}
    if not isinstance(format_name, str) or format_name not in formats:
        raise ValueError("Preview image encoding unsupported")
    return formats[format_name]


def local_look_preview(image_bytes: bytes, plan: LookPlan) -> LookPreview:
    """Overlay no more than three guarded local effects in a stable order.

    JPEG encoding for each local step is a known lossy approximation, and is
    disclosed as such. This is not a calibrated colour match or a face tracker.
    """
    if not isinstance(image_bytes, bytes) or not image_bytes:
        raise ValueError("Expected an original photo in memory")
    with Image.open(io.BytesIO(image_bytes)) as opened:
        width, height = opened.size
        if width < 16 or height < 16 or width * height > MAX_SIMULATION_PIXELS:
            raise ValueError("Original photo dimensions out of range")
        if opened.format not in ("JPEG", "PNG", "WEBP"):
            raise ValueError("Unsupported local image format")
        if opened.mode not in ("RGB", "RGBA", "L"):
            raise ValueError("Unsupported local image mode")
    current = image_bytes
    messages: list[str] = []
    for step in plan.steps:
        if step.strength == 0:
            messages.append(f"{step.effect}: no change (zero intensity)")
            continue
        current, _meta = preview_local(current, step.product, step.strength)
        messages.append(f"{step.effect}: approximate centred-photo mask")
    if current is image_bytes:
        # When all strengths are zero, preserve the exact original bytes and MIME.
        with Image.open(io.BytesIO(image_bytes)) as opened:
            mime = _mime_for_format(opened.format)
        return LookPreview(current, mime, "local", 0, 0, False, tuple(messages))
    return LookPreview(current, "image/jpeg", "local", 0, 0, False, tuple(messages))


def validate_provider_preview(raw: object, plan: LookPlan, *, cached: bool, units: int) -> LookPreview:
    """Accept a response only after the shared gateway supplied verified provenance.

    This function never accepts a URL, markup, a bare base64 string or a provider
    claim of an unknown product. The gateway caller supplies trusted cache status.
    """
    if not isinstance(raw, (bytes, bytearray)) or not raw:
        raise ValueError("Provider result lacks encoded image bytes")
    if len(raw) > 20_000_000:
        raise ValueError("Provider image exceeded bounded size")
    if type(cached) is not bool or type(units) is not int or not 0 <= units <= 100:
        raise ValueError("Invalid provider accounting")
    if cached and units:
        raise ValueError("A cache hit cannot consume new provider units")
    if len(plan.steps) < 1:
        raise ValueError("Missing verified look")
    with Image.open(io.BytesIO(raw)) as image:
        if image.width * image.height > MAX_SIMULATION_PIXELS or image.width < 16 or image.height < 16:
            raise ValueError("Provider preview exceeds local pixel bounds")
        try:
            mime = _mime_for_format(image.format)
        except ValueError as exc:
            raise ValueError("Provider image encoding unsupported") from exc
        image.verify()
    return LookPreview(bytes(raw), mime, "youcam", units,
                       0 if cached else 1, cached,
                       ("Remote makeup simulation; not a physical product test",))
