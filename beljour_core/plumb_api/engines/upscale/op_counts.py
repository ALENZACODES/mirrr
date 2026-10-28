"""Deterministic tiling work plan without noisy sub-10ms wall-clock assertions.

The existing R18B tiler remains authoritative. This small reference counts the
expected calls for uniform nonoverlapping output tiles and is suitable for
instrumentation rather than speed claims. No image buffers are allocated.
"""

from __future__ import annotations

from dataclasses import dataclass

MAX_EDGE = 16384


@dataclass(frozen=True)
class TileOperations:
    width: int
    height: int
    tile_edge: int
    columns: int
    rows: int
    tile_calls: int
    source_reads: int
    output_writes: int


def tile_operation_plan(width: int, height: int, tile_edge: int = 512) -> TileOperations:
    for value in (width, height, tile_edge):
        if type(value) is not int or value < 1 or value > MAX_EDGE:
            raise ValueError("invalid tile dimensions")
    if width * height > 64_000_000:
        raise ValueError("upscale tile plan exceeds 64 MP output")
    columns = (width + tile_edge - 1) // tile_edge
    rows = (height + tile_edge - 1) // tile_edge
    count = columns * rows
    return TileOperations(width, height, tile_edge, columns, rows, count, count, count)


def verify_operation_counts(plan: TileOperations, read_calls: int, write_calls: int) -> None:
    if type(read_calls) is not int or type(write_calls) is not int:
        raise ValueError("tile operation counts must be integers")
    if read_calls != plan.source_reads or write_calls != plan.output_writes:
        raise ValueError("tiling operation count differs from deterministic plan")
