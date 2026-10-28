"""Streaming decode: sizes, modes, EXIF orientation, failures and memory.

All images are drawn in code at several sizes and modes.
Author: John Khan.
"""

from __future__ import annotations

import io
import tracemalloc

import numpy as np
import pytest
from PIL import Image

from lab.facescale import decode as D
from lab.facescale.synthetic import draw_face


def _encode(image: Image.Image, fmt: str, **kwargs: object) -> bytes:
    out = io.BytesIO()
    image.save(out, format=fmt, **kwargs)
    return out.getvalue()


@pytest.mark.parametrize(("side", "source", "expected"), [
    (256, (1024, 1024), (256, 256)),
    (128, (1024, 512), (128, 64)),
    (640, (300, 200), (300, 200)),
    (256, (2000, 1500), (256, 192)),
])
def test_working_size_never_upscales(
    side: int, source: tuple[int, int], expected: tuple[int, int]
) -> None:
    assert D.working_size(source, side) == expected


@pytest.mark.parametrize("side", [128, 256, 640])
def test_jpeg_uses_draft_and_fits_the_side(side: int) -> None:
    data = draw_face(1, 1024)
    out = D.decode(data, side)
    assert out.rgb.dtype == np.uint8 and out.rgb.shape[2] == 3
    assert max(out.rgb.shape[:2]) <= side
    assert out.source_size == (1024, 1024)
    assert out.source_format == "JPEG"
    assert out.reduced_on_decode is (side <= 512)


def test_png_is_thumbnailed() -> None:
    out = D.decode(draw_face(2, 600, "PNG", height=300), 256)
    assert out.rgb.shape == (128, 256, 3)
    assert out.reduced_on_decode is False


def test_small_image_keeps_its_size() -> None:
    assert D.decode(draw_face(3, 100, "PNG"), 256).rgb.shape == (100, 100, 3)


def test_exif_orientation_is_applied() -> None:
    image = Image.fromarray(np.zeros((40, 80, 3), np.uint8))
    exif = Image.Exif()
    exif[0x0112] = 6  # rotate 90 degrees on display
    data = _encode(image, "JPEG", exif=exif.tobytes())
    out = D.decode(data, 256)
    assert out.rgb.shape[:2] == (80, 40)


def test_grey_palette_and_alpha_become_rgb() -> None:
    grey = _encode(Image.new("L", (50, 30), 90), "PNG")
    assert D.decode(grey, 128).rgb.shape == (30, 50, 3)
    palette = Image.new("RGB", (20, 20), (10, 200, 30)).convert("P")
    pixel = palette.convert("RGB").getpixel((0, 0))
    assert isinstance(pixel, tuple)
    expected = list(pixel)
    assert D.decode(_encode(palette, "PNG"), 128).rgb[0, 0].tolist() == expected
    rgba = Image.new("RGBA", (10, 10), (0, 0, 0, 0))
    out = D.decode(_encode(rgba, "PNG"), 128).rgb
    assert out[0, 0].tolist() == [255, 255, 255]


@pytest.mark.parametrize(("data", "code"), [
    (b"", "open_empty"),
    (b"not an image at all", "open_corrupt"),
    (draw_face(4, 64)[:200], "open_corrupt"),
])
def test_bad_bytes_are_counted_failures(data: bytes, code: str) -> None:
    with pytest.raises(D.DecodeFailure) as info:
        D.decode(data, 256)
    assert info.value.code == code


def test_cmyk_and_16_bit_are_refused() -> None:
    cmyk = _encode(Image.new("CMYK", (30, 30), (0, 50, 50, 0)), "JPEG")
    with pytest.raises(D.DecodeFailure) as info:
        D.decode(cmyk, 256)
    assert info.value.code == "open_cmyk"
    deep = Image.fromarray(np.full((20, 20), 40000, np.uint16))
    with pytest.raises(D.DecodeFailure) as info:
        D.decode(_encode(deep, "PNG"), 256)
    assert info.value.code == "open_16bit"


def test_huge_images_are_refused_before_decoding(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(D, "MAX_PIXELS", 100 * 100)
    with pytest.raises(D.DecodeFailure) as info:
        D.decode(draw_face(5, 200, "PNG"), 256)
    assert info.value.code == "open_huge"
    monkeypatch.setattr(D, "MAX_BYTES", 10)
    with pytest.raises(D.DecodeFailure) as info:
        D.decode(draw_face(5, 20, "PNG"), 256)
    assert info.value.code == "open_huge"


@pytest.mark.parametrize("side", [127, 641, 0])
def test_side_outside_range_is_refused(side: int) -> None:
    with pytest.raises(ValueError):
        D.check_side(side)
    with pytest.raises(ValueError):
        D.check_side(True)


def test_peak_memory_per_batch_stays_bounded() -> None:
    batch = [draw_face(n, 1600) for n in range(6)]
    tracemalloc.start()
    try:
        for data in batch:
            D.decode(data, 256)
        _, peak = tracemalloc.get_traced_memory()
    finally:
        tracemalloc.stop()
    full_frame = 1600 * 1600 * 3
    assert peak < full_frame, f"peak {peak} bytes reached a full-resolution frame"
