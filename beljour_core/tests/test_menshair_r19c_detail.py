"""R19 hair contour engine -- mask safety, uniqueness and generated TS parity.

The test vector uses algebraic RGB grids only. Nothing is inferred about people,
style suitability, skin, age, sex, or hair-growth outcome. Author: John Khan.
"""
from __future__ import annotations

import base64
import json
import sys
from dataclasses import replace
from typing import Any

import numpy as np
import pytest

from plumb_api.engines.menshair.detailing import (
    EDGES, NECKLINES, PARTINGS, TEMPLES, HairDetail, detail_field,
)
from plumb_api.engines.menshair.render import (
    HairAnchors, HairRecipe, available_presets, effect_field, render_style,
)


def anchors() -> HairAnchors:
    return HairAnchors.parse({
        "left_temple": [0.27, 0.35], "right_temple": [0.73, 0.35],
        "crown": [0.51, 0.10], "left_ear": [0.24, 0.60],
        "right_ear": [0.76, 0.60], "nape": [0.51, 0.86],
    })


def synthetic_frame(width: int = 43, height: int = 49, *, rgba: bool = True,
                    shift: int = 0) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    yy, xx = np.mgrid[:height, :width]
    channels = 4 if rgba else 3
    image = np.empty((height, width, channels), dtype=np.uint8)
    image[..., 0] = (xx * 7 + yy * 11 + 43 + shift) % 256
    image[..., 1] = (xx * 13 + yy * 5 + 67 + shift) % 256
    image[..., 2] = (xx * 17 + yy * 3 + 131 + shift) % 256
    if rgba:
        image[..., 3] = np.where((xx + yy) % 6 == 0, 125, 255)
    disk = ((xx + .5 - width * .5) / (width * .35)) ** 2 + (
        (yy + .5 - height * .31) / (height * .27)) ** 2
    hair = np.where(disk < .9, 255, np.where(disk < 1.15, 100, 0)).astype(np.uint8)
    scalp = np.where((disk < 1.18) & ((xx + yy) % 3 != 0), 120, 0).astype(np.uint8)
    return image, hair, scalp


def detailed_presets() -> tuple[HairRecipe, ...]:
    return tuple(p for p in available_presets() if p.detail is not None)


def test_every_authored_r19_profile_is_valid_and_contributes_real_pixel_controls() -> None:
    styles = detailed_presets()
    assert len(styles) >= 55
    assert len({r.id for r in styles}) == len(styles)
    assert len({r.name for r in styles}) == len(styles)
    assert all(r.id.startswith("local-r19-") for r in styles)
    assert all(r.detail is not None and r.detail.active() for r in styles)
    for r in styles:
        assert HairRecipe.parse(r.to_json()) == r
        assert r.detail is not None
        r.detail.validate()
    edges = {r.detail.edge for r in styles if r.detail}
    napes = {r.detail.neckline for r in styles if r.detail}
    temples = {r.detail.temple for r in styles if r.detail}
    parts = {r.detail.parting for r in styles if r.detail}
    assert edges >= EDGES - {"natural"}
    assert napes >= NECKLINES - {"natural"}
    assert temples >= TEMPLES - {"natural"}
    assert parts >= PARTINGS - {"none"}
    assert len({(r.family, r.fade, r.fade_shape, r.detail) for r in styles}) == len(styles)


@pytest.mark.parametrize("profile", detailed_presets(), ids=lambda p: p.id)
def test_per_preset_mask_and_alpha_safety(profile: HairRecipe) -> None:
    original, hair, scalp = synthetic_frame()
    untouched, saved_hair, saved_scalp = original.copy(), hair.copy(), scalp.copy()
    after, evidence = render_style(original, hair, anchors(), profile, scalp_mask=scalp)
    outside = (hair == 0) & (scalp == 0)
    assert np.array_equal(after[outside], original[outside])
    assert np.array_equal(after[..., 3], original[..., 3])
    assert np.array_equal(original, untouched)
    assert np.array_equal(hair, saved_hair) and np.array_equal(scalp, saved_scalp)
    assert 0 < evidence["affected_pixels"] <= evidence["mask_support_pixels"]
    assert evidence["provider_calls"] == 0 and evidence["simulation"]
    response = effect_field(original.shape[1], original.shape[0], anchors(), profile)
    assert np.all(np.isfinite(response)) and np.all((response >= 0) & (response <= 1))


@pytest.mark.parametrize("entry", [
    {"edge": "hyper-natural"}, {"neckline": "flat"}, {"temple": "diagnose"},
    {"parting": "live-template"}, {"crown_volume": 101}, {"fringe_drop": -1},
    {"texture_tightness": 60.5}, {"edge_softness": True}, {"temple_width": float("nan")},
    {"nape_height": -12}, {"part_contrast": 102}, {"part_offset": 2.2},
    {"direction": -101}, {"direction": False},
])
def test_boundary_rejects_invalid_detail(entry: dict[str, object]) -> None:
    with pytest.raises((ValueError, TypeError)):
        HairDetail(**entry).validate()
    source = detailed_presets()[0].to_json()
    source["detail"] = entry
    with pytest.raises((ValueError, TypeError)):
        HairRecipe.parse(source)


def test_detail_input_shape_and_legacy_default_are_explicit() -> None:
    frame = np.zeros((26, 29), dtype=np.float64)
    assert not np.any(detail_field(frame, frame, 29, 26, HairDetail()))
    with pytest.raises(ValueError):
        detail_field(frame[:25], frame, 29, 26, HairDetail(edge="square"))
    for r in detailed_presets():
        assert r.detail is not None
        with pytest.raises(ValueError):
            HairRecipe.parse({**r.to_json(), "detail": {"new_unreviewed": 30}})
    # A recipe without R19 controls preserves R16/R17 byte-level behaviour.
    p = available_presets()[0]
    image, hair, scalp = synthetic_frame()
    assert np.array_equal(render_style(image, hair, anchors(), p, scalp_mask=scalp)[0],
                          render_style(image, hair, anchors(), replace(p, detail=HairDetail()),
                                       scalp_mask=scalp)[0])


def test_styles_have_distinct_observable_tonal_configurations() -> None:
    scene, hair, scalp = synthetic_frame(49, 61)
    signatures = set()
    for p in detailed_presets():
        output, _ = render_style(scene, hair, anchors(), p, scalp_mask=scalp)
        signatures.add(output.tobytes())
    assert len(signatures) >= 47, "distinct configurations should visibly alter the synthetic frame"


def build_vectors() -> dict[str, Any]:
    cases: list[dict[str, Any]] = []
    for shift, rgba in ((0, True), (37, False)):
        image, hair, scalp = synthetic_frame(37, 44, rgba=rgba, shift=shift)
        for style in detailed_presets():
            after, evidence = render_style(image, hair, anchors(), style, scalp_mask=scalp)
            cases.append({"id": style.id, "shift": shift,
                          "pixels": base64.b64encode(after.tobytes()).decode(),
                          "affected": evidence["affected_pixels"],
                          "support": evidence["mask_support_pixels"]})
    return {"format": "beljour-r19c-detail-vectors/1", "author": "John Khan",
            "anchors": anchors().to_json(), "width": 37, "height": 44,
            "scenarios": cases, "origin": "generated colour grids, no real faces",
            "provider_calls": 0}


if __name__ == "__main__" and "--emit-vectors" in sys.argv:
    print(json.dumps(build_vectors(), separators=(",", ":")))
