"""Render adapters over the engines' public exports, on drawn faces only.

Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from lab.bqa_render.adapters import (
    PRODUCT_TYPES,
    MissingExportAdapter,
    Product,
    adapter_for,
    local_adapters,
    public_export,
    render,
    soft_inside,
)
from lab.bqa_render.faces import Scene, portrait


@pytest.fixture(scope="module")
def scene() -> Scene:
    return portrait("synthetic-ad", mouth_state="open", tone=6)


def test_engines_without_public_exports_report_it() -> None:
    names = {a.name: a.available() for a in local_adapters()}
    for name in ("makeup_w", "lips", "eyes", "brows", "hair_women"):
        assert names[name] == (True, "")
    for name in ("haircolour", "concealer_fibre", "youcam_mock"):
        assert names[name] == (False, "no_public_export")
    missing = MissingExportAdapter("x", "plumb_api.engines.haircolour", "recolour", ("brow",))
    out = missing.render(np.zeros((8, 8, 3), np.uint8), portrait("synthetic-n").subject,
                         Product.of("brow"))
    assert out.status == "not_applicable" and out.reason == "no_public_export"


def test_public_export_refuses_private_names() -> None:
    assert public_export("plumb_api.engines.lips", "_feature_warp") is None
    assert public_export("plumb_api.engines.lips", "render") is not None
    assert public_export("plumb_api.no_such_package", "render") is None


@pytest.mark.parametrize("kind", PRODUCT_TYPES)
def test_every_product_type_renders_with_stages(scene: Scene, kind: str) -> None:
    out = render(scene.image, scene.subject, Product.of(kind))
    assert out.status in ("rendered", "unavailable"), out.reason
    assert out.image is not None and out.image.shape == scene.image.shape
    assert set(out.stages) == {"input", "landmarks", "mask", "colour", "blend", "output"}
    assert out.stages["mask"].shape == scene.image.shape[:2]


@pytest.mark.parametrize("kind", PRODUCT_TYPES)
def test_zero_intensity_is_identity(scene: Scene, kind: str) -> None:
    out = render(scene.image, scene.subject, Product.of(kind, intensity=0.0))
    assert out.image is not None and np.array_equal(out.image, scene.image)


def test_product_validation_and_lookup() -> None:
    with pytest.raises(ValueError):
        Product("perfume")
    with pytest.raises(ValueError):
        Product("brow", intensity=1.5)
    assert adapter_for("lipstick").name == "lips"
    assert adapter_for("hair_colour").name == "hair_women"


def test_soft_mask_never_leaves_the_hard_mask() -> None:
    mask = np.zeros((20, 20), dtype=bool)
    mask[5:15, 5:15] = True
    soft = soft_inside(mask)
    assert float(np.max(soft[~mask])) == 0.0 and soft[10, 10] == pytest.approx(1.0)
    assert 0 < soft[5, 5] < 1


def test_engine_refusal_becomes_a_refused_output() -> None:
    tiny = portrait("synthetic-tiny", size=0.02)
    out = render(tiny.image, tiny.subject, Product.of("brow"))
    assert out.status in ("refused", "unavailable", "rendered")
    if out.status == "refused":
        assert out.reason and out.image is None
