"""Synthetic tiled-oracle tests: bounded scratch, crop anchoring, exact limits."""

from __future__ import annotations

import math
from collections.abc import Sequence
from typing import cast

import pytest

from plumb_api.pro import (
    Crop,
    Linear,
    Point,
    Radial,
    TileResult,
    affine_sampler,
    assemble_tiles,
    inverse_point,
    masked_rgba,
    plan,
    render_tiles,
    tile_plan,
)


def _identity() -> tuple[Sequence[int], Sequence[int], Sequence[int]]:
    channel = tuple(range(256))
    return channel, channel, channel


def _brighten() -> tuple[Sequence[int], Sequence[int], Sequence[int]]:
    channel = tuple(min(255, i + 40) for i in range(256))
    return channel, channel, channel


def _fixture(width: int, height: int, alpha: int = 255) -> bytes:
    output = bytearray()
    for y in range(height):
        for x in range(width):
            output.extend((20 + 5 * x, 30 + 4 * y, 50, alpha))
    return bytes(output)


def test_tile_plan_calculates_bounds_on_partial_tiles() -> None:
    plan0 = tile_plan(31, 19, edge=8)
    assert (plan0.columns, plan0.rows, plan0.count) == (4, 3, 12)
    assert plan0.scratch_limit == 320
    assert tile_plan(4000, 3000, edge=128).scratch_limit == 81920
    assert tile_plan(5, 4, edge=256).scratch_limit == 100


@pytest.mark.parametrize("edge", [0, -1, 1.5, True, 513])
def test_tile_plan_rejects_invalid_sizes(edge: object) -> None:
    with pytest.raises(ValueError):
        tile_plan(16, 16, edge)  # type: ignore[arg-type]


@pytest.mark.parametrize("dimensions", [(0, 1), (1, 0), (16385, 1), (4000, 4000)])
def test_tile_plan_respects_source_bounds(dimensions: tuple[int, int]) -> None:
    with pytest.raises(ValueError):
        tile_plan(*dimensions)


def test_identity_full_frame_is_byte_identical_across_tile_edges() -> None:
    width = 13
    height = 9
    source = _fixture(width, height)
    geometry = plan(width, height, Crop())
    for edge in (1, 2, 3, 5, 16, 512):
        got = assemble_tiles(render_tiles(source, width, height, geometry, (),
                                          _identity(), edge=edge), width, height)
        assert got == source


def test_tiles_do_not_modify_transparent_source_values() -> None:
    width = 6
    height = 5
    source = bytearray(_fixture(width, height))
    source[3] = 0
    source[4 * 7 + 3] = 0
    geom = plan(width, height, Crop())
    got = assemble_tiles(render_tiles(bytes(source), width, height, geom, (), _brighten(),
                                      edge=2), width, height)
    assert got[0:4] == source[0:4]
    assert got[4 * 7:4 * 7 + 4] == source[4 * 7:4 * 7 + 4]
    assert got[4:8] == bytes((65, 70, 90, 255))
    assert source[4:8] == bytes((25, 30, 50, 255))


def test_radial_mask_only_changes_local_source_pixels() -> None:
    width = 11
    height = 11
    geom = plan(width, height, Crop())
    source = _fixture(width, height)
    mask = (Radial(Point(0.5, 0.5), 0.28, 0.28, feather=0),)
    got = assemble_tiles(render_tiles(source, width, height, geom, mask, _brighten(),
                                      edge=4), width, height)
    assert got[0:4] == source[0:4]
    center = (5 * width + 5) * 4
    assert got[center] == source[center] + 40
    assert got[(3 * width + 5) * 4] >= source[(3 * width + 5) * 4]


def test_mask_subtraction_is_applied_after_additive_shape() -> None:
    width = 15
    height = 15
    source = _fixture(width, height)
    geometry = plan(width, height, Crop())
    full = Radial(Point(0.5, 0.5), 1, 1, feather=0)
    erased = Radial(Point(0.5, 0.5), 0.12, 0.12, feather=0, mode="subtract")
    got = assemble_tiles(render_tiles(source, width, height, geometry,
                                      (full, erased), _brighten(), edge=5), width, height)
    corner = 0
    center = (7 * width + 7) * 4
    assert got[center] == source[center]
    assert got[corner] > source[corner]


def test_linear_mask_respects_source_coordinates_after_crop() -> None:
    width = 16
    height = 12
    source = _fixture(width, height)
    geometry = plan(width, height, Crop(x=0.25, y=0.25, width=0.5, height=0.5))
    masked = (Linear(Point(0.4, 0.5), Point(0.6, 0.5), feather=0),)
    got = assemble_tiles(render_tiles(source, width, height, geometry, masked,
                                      _brighten(), edge=3),
                         geometry.out_width, geometry.out_height)
    assert got[0] == source[(3 * width + 4) * 4]
    assert got[(geometry.out_width - 1) * 4] > got[0]


def test_projected_sampling_matches_existing_inverse_point() -> None:
    for degree in (-180, -45, -5, 0, 35, 90, 180):
        geometry = plan(101, 79,
                        Crop(x=0.1, y=0.2, width=0.7, height=0.6,
                             rotation=degree))
        affine = affine_sampler(geometry)
        for x, y in ((0, 0), (3, 5),
                     (geometry.out_width - 1, geometry.out_height - 1)):
            got = affine.at(x, y)
            expected = inverse_point(geometry, x, y)
            assert got == pytest.approx(expected, abs=1e-9)


def test_partially_transparent_rotated_blank_corners_and_matte() -> None:
    source = _fixture(9, 9, alpha=64)
    geom = plan(9, 9, Crop(rotation=45))
    transparent = assemble_tiles(render_tiles(source, 9, 9, geom, (), _identity(),
                                              edge=4), geom.out_width, geom.out_height)
    white = assemble_tiles(render_tiles(source, 9, 9, geom, (), _identity(),
                                        edge=4, matte=True), geom.out_width, geom.out_height)
    assert transparent[0:4] == bytes((0, 0, 0, 0))
    assert white[0:4] == bytes((255, 255, 255, 255))
    middle = (geom.out_width * (geom.out_height // 2) + geom.out_width // 2) * 4
    assert transparent[middle + 3] == 64
    assert white[middle + 3] == 64


def test_tile_generator_keeps_each_allocation_bounded() -> None:
    width = 317
    height = 239
    source = bytes([90, 100, 110, 255] * (width * height))
    geometry = plan(width, height, Crop())
    plan0 = tile_plan(width, height, edge=64)
    sizes = [len(tile.rgba) for tile in render_tiles(source, width, height, geometry,
                                                    (), _identity(), edge=64)]
    assert len(sizes) == plan0.count
    assert max(sizes) <= plan0.scratch_limit / 5 * 4
    assert sum(sizes) == width * height * 4


def test_tile_input_validation_fails_before_yielding_output() -> None:
    geom = plan(4, 4, Crop())
    with pytest.raises(ValueError, match="byte count"):
        list(render_tiles(b"wrong", 4, 4, geom, (), _identity()))
    with pytest.raises(ValueError, match="256"):
        list(render_tiles(_fixture(4, 4), 4, 4, geom, (),
                          (tuple(range(1)), *(_identity()[1:])), edge=2))
    with pytest.raises(ValueError, match="entries"):
        bad = tuple(math.nan if x == 4 else x for x in range(256))
        bad_channel = cast(Sequence[int], bad)
        list(render_tiles(_fixture(4, 4), 4, 4, geom, (),
                          (bad_channel, bad_channel, bad_channel)))



def test_tile_mask_blend_matches_existing_small_image_oracle() -> None:
    width, height = 17, 15
    source = _fixture(width, height)
    geometry = plan(width, height, Crop())
    full = Radial(Point(0.48, 0.4), 0.45, 0.38, feather=0.55, opacity=0.9)
    eraser = Linear(Point(0.2, 0.1), Point(0.6, 0.9), feather=0.5,
                    mode="subtract", opacity=0.3)
    luts = tuple(tuple(min(255, x + step) for x in range(256))
                 for step in (40, 15, 5))
    red, green, blue = luts
    fixed = (red, green, blue)
    reference = masked_rgba(source, width, height, (full, eraser), fixed)
    tiled = assemble_tiles(render_tiles(source, width, height, geometry,
                                        (full, eraser), fixed, edge=7), width, height)
    assert reference == tiled

def test_assemble_rejects_missing_or_overlapping_output() -> None:
    complete = TileResult(0, 0, 2, 2, bytes([0] * 16))
    with pytest.raises(ValueError, match="incomplete"):
        assemble_tiles(iter([complete]), 3, 3)
    with pytest.raises(ValueError, match="overlap"):
        assemble_tiles(iter([complete, complete]), 2, 2)
    with pytest.raises(ValueError, match="invalid"):
        assemble_tiles(iter([TileResult(0, 0, 2, 2, bytes([0] * 4))]), 2, 2)
