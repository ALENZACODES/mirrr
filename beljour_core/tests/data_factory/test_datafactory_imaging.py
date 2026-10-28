"""Decoding limits and metadata stripping on drawn images.

Covers corrupted bytes, CMYK, 16-bit, oversize and undersize images, alpha
flattening and EXIF (GPS and camera fields) removal. All images are drawn
in code.
Author: John Khan.
"""

from __future__ import annotations

import io
import struct
import zlib

import numpy as np
import pytest
from PIL import Image

from plumb_api.data_factory import imaging
from plumb_api.data_factory.imaging import DecodedImage, DecodeFailure, DecodeLimits
from plumb_api.data_factory.synthetic import portrait, to_jpeg, to_png


def _chunk(kind: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(kind + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", crc)


def png_16bit_rgb(width: int = 32, height: int = 32) -> bytes:
    """A valid 16-bit-per-channel RGB PNG written by hand."""
    pixels = np.full((height, width, 3), 30000, dtype=">u2")
    raw = b"".join(b"\x00" + pixels[row].tobytes() for row in range(height))
    header = struct.pack(">IIBBBBB", width, height, 16, 2, 0, 0, 0)
    return (b"\x89PNG\r\n\x1a\n" + _chunk(b"IHDR", header)
            + _chunk(b"IDAT", zlib.compress(raw)) + _chunk(b"IEND", b""))


def encoded(image: Image.Image, fmt: str, **options: object) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, format=fmt, **options)
    return buffer.getvalue()


def exif_with_gps_and_camera() -> bytes:
    exif = Image.Exif()
    exif[0x010F] = "MadeUpCam"
    exif[0x0110] = "Model Zero"
    exif[0x0132] = "2026:10:25 01:00:00"
    gps = exif.get_ifd(0x8825)
    gps[1] = "N"
    gps[2] = (43.0, 39.0, 0.0)
    gps[3] = "W"
    gps[4] = (79.0, 23.0, 0.0)
    return exif.tobytes()


def test_accepts_png_and_jpeg() -> None:
    rgb = portrait(1, 96)
    for data in (to_png(rgb), to_jpeg(rgb)):
        result = imaging.decode(data)
        assert isinstance(result, DecodedImage)
        assert (result.width, result.height) == (96, 96)
        assert result.rgb.dtype == np.uint8 and result.rgb.shape == (96, 96, 3)
    png = imaging.decode(to_png(rgb))
    assert isinstance(png, DecodedImage)
    assert np.array_equal(png.rgb, rgb)


@pytest.mark.parametrize(("data", "reason"), [
    (b"", imaging.REASON_EMPTY),
    (b"not an image at all", imaging.REASON_UNREADABLE),
    (png_16bit_rgb(), imaging.REASON_DEEP),
    (encoded(Image.new("I;16", (40, 40)), "PNG"), imaging.REASON_DEEP),
    (encoded(Image.new("CMYK", (40, 40)), "JPEG"), imaging.REASON_CMYK),
    (encoded(Image.new("RGB", (40, 40)), "BMP"), imaging.REASON_FORMAT),
    (encoded(Image.new("RGB", (8, 40)), "PNG"), imaging.REASON_TOO_SMALL_DIM),
])
def test_rejections_have_reasons(data: bytes, reason: str) -> None:
    result = imaging.decode(data)
    assert isinstance(result, DecodeFailure)
    assert result.reason == reason
    assert result.detail


def test_corrupted_body_is_rejected_not_raised() -> None:
    data = to_png(portrait(2, 128))
    broken = data[:60] + bytes(len(data) - 120) + data[-60:]
    result = imaging.decode(broken)
    assert isinstance(result, DecodeFailure)
    assert result.reason in {imaging.REASON_CORRUPT, imaging.REASON_UNREADABLE}
    truncated = imaging.decode(to_jpeg(portrait(2, 128))[:400])
    assert isinstance(truncated, DecodeFailure)


def test_huge_dimensions_rejected_before_decoding() -> None:
    header = struct.pack(">IIBBBBB", 60000, 60000, 8, 2, 0, 0, 0)
    fake = b"\x89PNG\r\n\x1a\n" + _chunk(b"IHDR", header) + _chunk(b"IEND", b"")
    result = imaging.decode(fake)
    assert isinstance(result, DecodeFailure)
    assert result.reason == imaging.REASON_TOO_LARGE_DIM
    small_limit = DecodeLimits(max_pixels=1000)
    limited = imaging.decode(to_png(portrait(3, 64)), small_limit)
    assert isinstance(limited, DecodeFailure)
    assert limited.reason == imaging.REASON_TOO_LARGE_DIM


def test_byte_limit() -> None:
    result = imaging.decode(to_png(portrait(3, 64)), DecodeLimits(max_bytes=100))
    assert isinstance(result, DecodeFailure)
    assert result.reason == imaging.REASON_TOO_LARGE_BYTES


def test_alpha_and_palette_are_flattened() -> None:
    rgba = Image.new("RGBA", (32, 32), (10, 20, 30, 0))
    result = imaging.decode(encoded(rgba, "PNG"))
    assert isinstance(result, DecodedImage)
    assert result.rgb[0, 0].tolist() == [255, 255, 255]
    palette = Image.new("P", (32, 32), 3)
    assert isinstance(imaging.decode(encoded(palette, "PNG")), DecodedImage)
    grey = Image.new("L", (32, 32), 77)
    decoded = imaging.decode(encoded(grey, "PNG"))
    assert isinstance(decoded, DecodedImage)
    assert decoded.rgb[5, 5].tolist() == [77, 77, 77]


def test_animated_images_rejected() -> None:
    frames = [Image.new("RGB", (32, 32), (i * 40, 0, 0)) for i in range(3)]
    data = encoded(frames[0], "WEBP", save_all=True, append_images=frames[1:])
    result = imaging.decode(data)
    assert isinstance(result, DecodeFailure)
    assert result.reason == imaging.REASON_ANIMATED


def test_strip_removes_gps_and_camera_fields() -> None:
    data = to_jpeg(portrait(4, 96), exif=exif_with_gps_and_camera())
    before = imaging.metadata_keys(data)
    assert any(key.startswith("exif-ifd:34853") for key in before)
    assert "exif:271" in before and "exif:272" in before
    decoded = imaging.decode(data)
    assert isinstance(decoded, DecodedImage)
    cleaned = imaging.strip_metadata(decoded)
    assert imaging.metadata_keys(cleaned) == []
    assert b"MadeUpCam" not in cleaned
    again = imaging.decode(cleaned)
    assert isinstance(again, DecodedImage)
    assert np.array_equal(again.rgb, decoded.rgb)


def test_strip_is_deterministic_and_drops_text_chunks() -> None:
    from PIL import PngImagePlugin

    info = PngImagePlugin.PngInfo()
    info.add_text("Comment", "shot at 1 Example Road")
    data = encoded(Image.fromarray(portrait(5, 64)), "PNG", pnginfo=info)
    assert "info:Comment" in imaging.metadata_keys(data)
    decoded = imaging.decode(data)
    assert isinstance(decoded, DecodedImage)
    assert imaging.strip_metadata(decoded) == imaging.strip_metadata(decoded)
    assert imaging.metadata_keys(imaging.strip_metadata(decoded)) == []


def test_exif_orientation_is_applied() -> None:
    rgb = np.zeros((20, 40, 3), dtype=np.uint8)
    rgb[:, :20] = 255
    exif = Image.Exif()
    exif[0x0112] = 6
    data = encoded(Image.fromarray(rgb), "JPEG", exif=exif.tobytes(), quality=95)
    result = imaging.decode(data)
    assert isinstance(result, DecodedImage)
    assert (result.width, result.height) == (20, 40)


def test_limits_to_dict() -> None:
    assert DecodeLimits().to_dict()["max_side"] == 12000
