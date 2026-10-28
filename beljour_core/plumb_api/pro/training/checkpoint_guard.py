"""Bounded inspection of numeric checkpoint archives before allocation. Author: John Khan."""

from __future__ import annotations

from ast import literal_eval
from io import BytesIO
from math import prod
from pathlib import Path
from zipfile import BadZipFile, LargeZipFile, ZipFile, ZipInfo

import numpy as np

from .patches import PatchPlan

MAX_NPY_HEADER_BYTES = 4096
MAX_MODEL_MEMBERS = 4


def expected_member_shapes(plan: PatchPlan) -> dict[str, tuple[int, ...]]:
    """Return only the four permitted float32 shapes for the committed patch plan."""
    plan.validate()
    return {
        "encoder.npy": (plan.patch_width + 2, plan.hidden_dim),
        "encoder_bias.npy": (plan.hidden_dim,),
        "decoder.npy": (plan.hidden_dim, plan.patch_width),
        "decoder_bias.npy": (plan.patch_width,),
    }


def expected_member_bytes(plan: PatchPlan) -> dict[str, int]:
    """Bound uncompressed float32 payloads before NumPy allocation."""
    return {name: prod(shape) * 4 for name, shape in expected_member_shapes(plan).items()}


def _validate_array_header(
    archive: ZipFile, member: ZipInfo, expected_shape: tuple[int, ...]
) -> None:
    """Inspect a bounded NPY header without allocating its declared array."""
    try:
        with archive.open(member) as stream:
            if stream.read(6) != b"\x93NUMPY":
                raise ValueError("Unexpected masked checkpoint format")
            version = stream.read(2)
            if version == bytes((1, 0)):
                length_size = 2
            elif version == bytes((2, 0)):
                length_size = 4
            else:
                raise ValueError("Unsupported masked checkpoint header version")
            encoded_length = stream.read(length_size)
            if len(encoded_length) != length_size:
                raise ValueError("Truncated masked checkpoint header")
            header_size = int.from_bytes(encoded_length, "little")
            if not 0 < header_size <= MAX_NPY_HEADER_BYTES:
                raise ValueError("Oversized masked checkpoint array header")
            header = stream.read(header_size)
            if len(header) != header_size:
                raise ValueError("Truncated masked checkpoint header")
            metadata = literal_eval(header.decode("latin1"))
    except (ValueError, SyntaxError, EOFError, OSError, UnicodeError, RecursionError) as exc:
        raise ValueError("Invalid masked checkpoint array header") from exc
    if not isinstance(metadata, dict) or set(metadata) != {
        "descr", "fortran_order", "shape"
    }:
        raise ValueError("Invalid masked checkpoint array metadata")
    shape = metadata["shape"]
    if not isinstance(shape, tuple) or any(type(value) is not int for value in shape):
        raise ValueError("Invalid masked checkpoint array shape")
    if shape != expected_shape:
        raise ValueError("Unexpected masked checkpoint array shape")
    descr = metadata["descr"]
    if not isinstance(descr, str) or not 1 <= len(descr) <= 8:
        raise ValueError("Invalid masked checkpoint array dtype")
    if metadata["fortran_order"] is not False or np.dtype(descr) != np.dtype(np.float32):
        raise ValueError("Unexpected masked checkpoint array dtype or order")
    actual = member.file_size
    data_size = prod(expected_shape) * 4
    if actual != 6 + 2 + length_size + header_size + data_size:
        raise ValueError("Unexpected masked checkpoint array payload size")


def validate_numeric_archive(path: Path | BytesIO, plan: PatchPlan) -> None:
    """Reject overlarge or malformed ZIP arrays before calling ``np.load``."""
    shapes = expected_member_shapes(plan)
    expected = expected_member_bytes(plan)
    total_bound = sum(expected.values()) + len(expected) * MAX_NPY_HEADER_BYTES
    total_uncompressed = 0
    try:
        with ZipFile(path, mode="r", allowZip64=True) as archive:
            members = archive.infolist()
            if len(members) != MAX_MODEL_MEMBERS:
                raise ValueError("Unexpected masked checkpoint members")
            names: set[str] = set()
            for member in members:
                name = member.filename
                if name in names or name not in expected:
                    raise ValueError("Unexpected masked checkpoint member name")
                names.add(name)
                if member.flag_bits & 0x1 or member.is_dir():
                    raise ValueError("Unsupported masked checkpoint member")
                if member.compress_type not in (0, 8):
                    raise ValueError("Unsupported masked checkpoint compression")
                if member.file_size < expected[name]:
                    raise ValueError("Truncated masked checkpoint member")
                if member.file_size > expected[name] + MAX_NPY_HEADER_BYTES:
                    raise ValueError("Oversized masked checkpoint member")
                total_uncompressed += member.file_size
                if total_uncompressed > total_bound:
                    raise ValueError("Masked checkpoint allocation exceeded")
                _validate_array_header(archive, member, shapes[name])
            if names != set(expected):
                raise ValueError("Missing masked checkpoint members")
    except (BadZipFile, LargeZipFile, EOFError) as exc:
        raise ValueError("Invalid masked checkpoint archive") from exc


def validate_numeric_payload(payload: bytes | bytearray, plan: PatchPlan) -> None:
    """Apply the identical pre-allocation gate to decrypted memory, without disk I/O."""
    if len(payload) > 200 * 1024 * 1024:
        raise ValueError("Oversized masked checkpoint payload")
    with BytesIO(payload) as stream:
        validate_numeric_archive(stream, plan)
