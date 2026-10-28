"""Version stamps in output images (ARC-02) and debug overlays (ARC-03) on drawn images.

Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from lab.bqa_core.drawn import drawn_face
from lab.bqa_core.replay import (
    audit_stamps,
    debug_marker_hits,
    draw_overlay,
    read_stamp,
    save_overlay,
    stamp_image,
)


def drawn_png(tmp_path: Path, name: str = "drawn_out.png") -> Path:
    path = tmp_path / name
    Image.fromarray(drawn_face(9)["image"]).save(path)
    return path


def test_png_and_jpeg_stamps_round_trip(tmp_path: Path) -> None:
    """ARC-02: build, catalogue and trend versions survive in PNG chunks and JPEG comments."""
    source = drawn_png(tmp_path)
    png = stamp_image(source, tmp_path / "stamped.png", build="c0ffee1", catalogue="CAT-7",
                      trend="TRD-3")
    jpg = stamp_image(source, tmp_path / "stamped.jpg", build="c0ffee1", catalogue="CAT-7",
                      trend="TRD-3")
    expected = {"beljour:build": "c0ffee1", "beljour:catalogue": "CAT-7",
                "beljour:trend": "TRD-3"}
    assert read_stamp(png) == expected
    assert read_stamp(jpg) == expected
    with pytest.raises(ValueError):
        stamp_image(source, tmp_path / "x.gif", build="1", catalogue="2", trend="3")


def test_stamp_audit_counts_missing_and_partial(tmp_path: Path) -> None:
    source = drawn_png(tmp_path)
    good = stamp_image(source, tmp_path / "good.png", build="1", catalogue="2", trend="3")
    partial = stamp_image(source, tmp_path / "partial.png", build="1", catalogue="2", trend="")
    broken = tmp_path / "broken.png"
    broken.write_bytes(b"not an image")
    audit = audit_stamps([good, partial, source, broken])
    assert (audit.total, audit.stamped) == (4, 1)
    assert audit.unstamped == ["partial.png", "drawn_out.png", "broken.png"]


def test_overlay_only_on_test_builds_and_audit_finds_it(tmp_path: Path) -> None:
    """ARC-03: overlay drawn on a copy in a test build; the production scan finds markers."""
    face = drawn_face(10)
    image = face["image"].astype(np.uint8)
    original = image.copy()
    masks = {"skin": face["mask_skin"].astype(np.float32),
             "lips": face["mask_lips"].astype(np.float32)}
    canvas = draw_overlay(image, build_kind="test", points=face["points"].astype(np.float64),
                          masks=masks,
                          swatch=(180, 130, 100), shade_id="S-104")
    assert np.array_equal(image, original)
    assert not np.array_equal(np.asarray(canvas), original)
    with pytest.raises(PermissionError):
        draw_overlay(image, build_kind="production")
    leaked = save_overlay(canvas, tmp_path / "leaked.png")
    clean = drawn_png(tmp_path, "clean.png")
    bundle = tmp_path / "app.js"
    bundle.write_text("const DEBUG_OVERLAY = true;\n")
    hits = debug_marker_hits([leaked, clean, bundle])
    assert hits == {"leaked.png": ["beljour:debug"], "app.js": ["DEBUG_OVERLAY"]}
    assert debug_marker_hits([bundle], markers=("never",)) == {}
