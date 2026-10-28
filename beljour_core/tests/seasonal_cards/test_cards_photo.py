"""Photo intake tests: metadata stripping, orientation, fit modes, masks and stress shapes.

All photos are procedural portraits drawn in code.
Author: John Khan.
"""

from __future__ import annotations

import base64
import io

import numpy as np
import pytest
from PIL import Image, ImageCms

from plumb_api.seasonal.cards import CardPhotoError
from plumb_api.seasonal.cards.photo import (
    FaceBox,
    encode_tile,
    fit_photo,
    is_opaque,
    load_photo,
    mask_image,
    prepare_image,
    strip_metadata,
)
from plumb_api.seasonal.cards.synthetic import encode_with_metadata, synthetic_portrait


def _portrait(width: int = 320, height: int = 400, alpha: bool = False) -> Image.Image:
    return synthetic_portrait(width, height, seed=5, alpha=alpha)[0]


@pytest.mark.parametrize("fmt", ["JPEG", "PNG", "WEBP"])
def test_all_metadata_is_stripped(fmt: str) -> None:
    data = encode_with_metadata(_portrait(), fmt)
    assert b"metadata-that-must-not-survive" in data
    image = load_photo(data)
    assert image.info == {}
    assert len(image.getexif()) == 0
    assert image.mode == "RGB"


def test_exif_orientation_is_applied_before_stripping() -> None:
    source = _portrait(320, 200)
    rotated = load_photo(encode_with_metadata(source, "PNG", orientation=6))
    assert rotated.size == (200, 320)
    plain = load_photo(encode_with_metadata(source, "PNG", orientation=1))
    assert plain.size == (320, 200)


def test_transparency_is_kept_as_rgba() -> None:
    buffer = io.BytesIO()
    _portrait(alpha=True).save(buffer, format="PNG")
    image = load_photo(buffer.getvalue())
    assert image.mode == "RGBA"
    assert not is_opaque(image)


def test_greyscale_and_palette_inputs_become_rgb() -> None:
    for mode in ("L", "P", "1"):
        buffer = io.BytesIO()
        _portrait().convert(mode).save(buffer, format="PNG")
        assert load_photo(buffer.getvalue()).mode == "RGB"


@pytest.mark.parametrize("data", [b"", b"not an image at all", b"\x89PNG\r\n\x1a\n broken"])
def test_bad_bytes_raise_photo_error(data: bytes) -> None:
    with pytest.raises(CardPhotoError):
        load_photo(data)


def test_unsupported_format_and_tiny_images_are_refused() -> None:
    buffer = io.BytesIO()
    _portrait().save(buffer, format="BMP")
    with pytest.raises(CardPhotoError):
        load_photo(buffer.getvalue())
    with pytest.raises(CardPhotoError):
        strip_metadata(Image.new("RGB", (8, 300)))


def test_cover_fills_the_box_and_contain_letterboxes() -> None:
    wide = _portrait(800, 200)
    cover = fit_photo(wide, 300, 400, "cover")
    assert cover.size == (300, 400)
    assert is_opaque(cover)
    contain = fit_photo(wide, 300, 400, "contain")
    assert contain.size == (300, 400)
    alpha = np.asarray(contain.getchannel("A"))
    assert alpha[0, 150] == 0 and alpha[200, 150] == 255
    with pytest.raises(CardPhotoError):
        fit_photo(wide, 300, 400, "stretch")


def test_same_size_cover_is_a_pixel_identical_copy() -> None:
    source = _portrait(300, 400)
    tile = fit_photo(source, 300, 400, "cover")
    assert np.array_equal(np.asarray(tile.convert("RGB")), np.asarray(source))


def test_face_box_steers_the_cover_crop() -> None:
    image, faces = synthetic_portrait(1200, 400, seed=2, people=3)
    right = faces[2]
    tile = fit_photo(image, 300, 400, "cover", right)
    crop = np.asarray(image.crop((int(right.x + right.w / 2 - 150), 0,
                                  int(right.x + right.w / 2 + 150), 400)))
    diff = np.abs(np.asarray(tile.convert("RGB")).astype(int) - crop.astype(int)).mean()
    assert diff < 12.0
    centred = fit_photo(image, 300, 400, "cover")
    assert not np.array_equal(np.asarray(centred), np.asarray(tile))


def test_face_near_edge_is_clamped_inside_the_photo() -> None:
    image = _portrait(1000, 400)
    tile = fit_photo(image, 300, 400, "cover", FaceBox(-50, 10, 60, 60))
    assert np.array_equal(np.asarray(tile.convert("RGB")), np.asarray(image.crop((0, 0, 300, 400))))


@pytest.mark.parametrize("size", [(4000, 300), (300, 4000), (20, 20), (17, 900)])
def test_extreme_aspect_and_tiny_photos_fit(size: tuple[int, int]) -> None:
    image = _portrait(*size)
    for mode in ("cover", "contain"):
        assert fit_photo(image, 400, 500, mode).size == (400, 500)


@pytest.mark.parametrize("shape", ["rect", "rounded", "arch", "circle", "oval"])
def test_masks_cover_the_centre_and_clip_corners(shape: str) -> None:
    mask = np.asarray(mask_image(shape, 200, 260, 0.1))
    assert mask.shape == (260, 200)
    assert mask[130, 100] == 255
    if shape == "rect":
        assert mask[0, 0] == 255
    else:
        assert mask[0, 0] == 0
    if shape == "arch":
        assert mask[259, 0] == 255


def test_encode_tile_is_lossless_png_without_metadata() -> None:
    for alpha in (False, True):
        tile = fit_photo(_portrait(alpha=alpha), 100, 120)
        uri = encode_tile(tile)
        assert uri.startswith("data:image/png;base64,")
        with Image.open(io.BytesIO(base64.b64decode(uri.split(",", 1)[1]))) as decoded:
            assert decoded.info == {}
            mode = "RGBA" if alpha else "RGB"
            assert np.array_equal(np.asarray(decoded.convert(mode)),
                                  np.asarray(tile.convert(mode)))


def test_sixteen_bit_grey_is_scaled_not_clipped() -> None:
    buffer = io.BytesIO()
    Image.fromarray(np.full((40, 40), 32768, dtype=np.uint16)).save(buffer, format="PNG")
    assert load_photo(buffer.getvalue()).getpixel((5, 5)) == (128, 128, 128)


def test_rgb_png_transparency_key_is_kept() -> None:
    buffer = io.BytesIO()
    Image.new("RGB", (40, 40), (10, 20, 30)).save(buffer, format="PNG", transparency=(10, 20, 30))
    image = load_photo(buffer.getvalue())
    assert image.mode == "RGBA" and not is_opaque(image)


def test_multi_picture_jpeg_is_accepted() -> None:
    first = _portrait(64, 80)
    second = _portrait(64, 80).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    buffer = io.BytesIO()
    first.save(buffer, format="MPO", save_all=True, append_images=[second])
    with Image.open(io.BytesIO(buffer.getvalue())) as probe:
        assert probe.format == "MPO"
    assert load_photo(buffer.getvalue()).size == (64, 80)


def test_non_finite_face_box_is_ignored() -> None:
    image = _portrait(400, 200)
    for bad in (FaceBox(float("nan"), 0, 10, 10), FaceBox(0, 0, float("inf"), 10)):
        assert np.array_equal(np.asarray(fit_photo(image, 100, 100, "cover", bad)),
                              np.asarray(fit_photo(image, 100, 100, "cover")))


def test_pillow_image_input_is_oriented_like_bytes() -> None:
    oriented = Image.open(io.BytesIO(encode_with_metadata(_portrait(400, 200), "JPEG", 6)))
    assert prepare_image(oriented).size == (200, 400)


def test_profile_tagged_photo_is_converted_and_the_profile_dropped() -> None:
    srgb = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB"))
    image = Image.new("RGB", (32, 32), (200, 40, 40))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG", icc_profile=srgb.tobytes())
    clean = load_photo(buffer.getvalue())
    assert clean.info == {}
    pixel = clean.getpixel((3, 3))
    assert isinstance(pixel, tuple)
    assert max(abs(a - b) for a, b in zip(pixel, (200, 40, 40), strict=True)) <= 2
