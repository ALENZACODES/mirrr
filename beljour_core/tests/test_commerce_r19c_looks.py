"""R19 cosmetic-combination and privacy contract; synthetic images only."""
from __future__ import annotations

import io
import json

import pytest
from PIL import Image

from plumb_api.commerce.catalogue import products
from plumb_api.commerce.look_plan import (
    LookPlan,
    _mime_for_format,
    local_look_preview,
    validate_provider_preview,
)


def a_sku(vto: str) -> str:
    return next(item.sku for item in products() if item.vto == vto)


def items() -> list[dict]:
    return [{"product_id": a_sku("lip"), "strength": 20},
            {"product_id": a_sku("foundation"), "strength": 30},
            {"product_id": a_sku("blush"), "strength": 55}]


def drawn_image(size: int = 96) -> bytes:
    image = Image.new("RGB", (size, size), (167, 113, 98))
    out = io.BytesIO()
    image.save(out, format="PNG")
    return out.getvalue()


def test_three_step_plan_is_sorted_and_priced_in_cents() -> None:
    plan = LookPlan.parse(items())
    assert tuple(s.effect for s in plan.steps) == ("foundation", "blush", "lip")
    assert plan.subtotal == sum(s.product.price_cents for s in plan.steps)
    assert plan.public()["currency"] == "CAD"
    assert plan.public()["checkout_enabled"] is False
    assert plan.public()["image_included"] is False
    assert plan.public()["provider_credentials_included"] is False


def test_import_export_contains_only_fictional_products_and_adjustments() -> None:
    plan = LookPlan.parse(items())
    encoded = plan.export_recipe()
    assert set(json.loads(encoded)) == {"format", "steps"}
    assert "photo" not in encoded and "session" not in encoded and "base64" not in encoded
    assert LookPlan.import_recipe(encoded) == plan
    assert encoded == LookPlan.import_recipe(encoded).export_recipe()


def test_unique_type_no_brand_and_no_unsupported_category() -> None:
    bad = [{"product_id": a_sku("foundation"), "strength": 20}] * 2
    with pytest.raises(ValueError, match="one product"):
        LookPlan.parse(bad)
    for invalid in ([[{"product_id": "not-a-product", "strength": 15}]],
                    [[{"product_id": a_sku("lip"), "strength": True}]],
                    [[{"product_id": a_sku("lip"), "strength": -1}]],
                    [[{"product_id": a_sku("lip"), "strength": 101}]],
                    [[{"product_id": a_sku("lip"), "strength": 10, "url": "https://x"}]]):
        with pytest.raises((ValueError, TypeError, KeyError)):
            LookPlan.parse(invalid[0])


def test_simulation_is_deterministic_and_fully_offline() -> None:
    original = drawn_image()
    plan = LookPlan.parse(items())
    first = local_look_preview(original, plan)
    second = local_look_preview(original, plan)
    assert first.image == second.image
    assert first.source == "local" and first.units_spent == 0 and first.provider_calls == 0
    assert first.public(plan)["simulation"] and first.public(plan)["checkout_enabled"] is False
    assert first.image != original
    assert first.public(plan)["image"].startswith("data:image/jpeg;base64,")
    assert "fictional" in first.public(plan)["notice"].lower()


def test_zero_strength_preserves_exact_original_bytes_and_mime() -> None:
    image = drawn_image()
    plan = LookPlan.parse([{"product_id": a_sku("lip"), "strength": 0}])
    result = local_look_preview(image, plan)
    assert result.image is image
    assert result.image_type == "image/png"
    assert result.provider_calls == 0


def test_dimensions_and_corrupt_images_reject_before_processing() -> None:
    plan = LookPlan.parse(items())
    for payload in (b"", b"not a photo", drawn_image(8)):
        with pytest.raises((ValueError, OSError)):
            local_look_preview(payload, plan)


def test_provider_response_only_accepts_real_decodable_bytes() -> None:
    plan = LookPlan.parse(items())
    payload = drawn_image()
    ok = validate_provider_preview(payload, plan, cached=False, units=1)
    assert ok.provider_calls == 1 and ok.units_spent == 1
    hit = validate_provider_preview(payload, plan, cached=True, units=0)
    assert hit.provider_calls == 0 and hit.units_spent == 0
    with pytest.raises(ValueError, match="cache"):
        validate_provider_preview(payload, plan, cached=True, units=1)
    with pytest.raises((ValueError, OSError)):
        validate_provider_preview(b"<svg>not a photo</svg>", plan, cached=False, units=0)
    with pytest.raises(ValueError):
        LookPlan.import_recipe(json.dumps({"format": "beljour-sample-look/1", "steps": [], "secret": "bad"}))


def test_preview_format_must_be_a_concrete_supported_image_type() -> None:
    for name, mime in (("JPEG", "image/jpeg"), ("PNG", "image/png"), ("WEBP", "image/webp")):
        assert _mime_for_format(name) == mime
    for invalid in (None, "GIF", "SVG", ""):
        with pytest.raises(ValueError, match="encoding unsupported"):
            _mime_for_format(invalid)
