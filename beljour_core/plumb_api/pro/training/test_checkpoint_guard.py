"""Pre-allocation guard against malformed numeric checkpoint archives.

Every archive here is assembled in memory from synthetic arrays. Author: John Khan.
"""

from __future__ import annotations

import io
import zipfile
from collections.abc import Callable
from pathlib import Path

import numpy as np
import pytest

from .checkpoint_guard import (
    expected_member_bytes,
    expected_member_shapes,
    validate_numeric_archive,
    validate_numeric_payload,
)
from .patch_model import initial_weights
from .patches import PatchPlan

PLAN = PatchPlan()
# zipfile warns while writing the duplicate-name case; the guard must still refuse it.
pytestmark = pytest.mark.filterwarnings("ignore:Duplicate name")


def _npy(array: np.ndarray) -> bytes:
    stream = io.BytesIO()
    np.save(stream, array, allow_pickle=False)
    return stream.getvalue()


def _members() -> dict[str, bytes]:
    return {name: _npy(value) for name, value in initial_weights(PLAN).members().items()}


def _archive(members: dict[str, bytes] | list[tuple[str, bytes]],
             *, compression: int = zipfile.ZIP_DEFLATED) -> bytes:
    stream = io.BytesIO()
    items = members.items() if isinstance(members, dict) else members
    with zipfile.ZipFile(stream, "w", compression=compression) as archive:
        for name, data in items:
            archive.writestr(name, data)
    return stream.getvalue()


def _header(shape: tuple[int, ...], *, descr: str = "<f4", fortran: bool = False,
            extra: str = "", version: bytes = b"\x01\x00") -> bytes:
    text = f"{{'descr': '{descr}', 'fortran_order': {fortran}, 'shape': {shape}, {extra}}}"
    body = text.encode("latin1")
    body += b" " * ((64 - (10 + len(body) + 1) % 64) % 64) + b"\n"
    size = len(body).to_bytes(2 if version == b"\x01\x00" else 4, "little")
    return b"\x93NUMPY" + version + size + body


def test_numpy_savez_archive_passes() -> None:
    stream = io.BytesIO()
    weights = initial_weights(PLAN)
    np.savez_compressed(
        stream, encoder=weights.encoder, encoder_bias=weights.encoder_bias,
        decoder=weights.decoder, decoder_bias=weights.decoder_bias,
    )
    validate_numeric_payload(stream.getvalue(), PLAN)


def test_file_archive_passes(tmp_path: Path) -> None:
    path = tmp_path / "weights.npz"
    path.write_bytes(_archive(_members(), compression=zipfile.ZIP_STORED))
    validate_numeric_archive(path, PLAN)


def test_shapes_and_byte_bounds_follow_the_plan() -> None:
    plan = PatchPlan(hidden_dim=16, patch_edge=2)
    shapes = expected_member_shapes(plan)
    assert shapes["encoder.npy"] == (14, 16)
    assert expected_member_bytes(plan)["decoder.npy"] == 16 * 12 * 4


def _replace(name: str, data: bytes) -> dict[str, bytes]:
    members = _members()
    members[name] = data
    return members


Mutation = Callable[[], bytes]
CASES: dict[str, Mutation] = {
    "not_a_zip": lambda: b"PK\x03\x04 not really a zip",
    "missing_member": lambda: _archive({k: v for k, v in _members().items() if k != "decoder.npy"}),
    "extra_member": lambda: _archive({**_members(), "notes.npy": _npy(np.zeros(1, np.float32))}),
    "unknown_name": lambda: _archive({
        **{k: v for k, v in _members().items() if k != "decoder.npy"},
        "../decoder.npy": _members()["decoder.npy"],
    }),
    "duplicate_member": lambda: _archive([
        *list(_members().items())[:3], ("encoder.npy", _members()["encoder.npy"]),
    ]),
    "directory_member": lambda: _archive({
        **{k: v for k, v in _members().items() if k != "decoder.npy"}, "decoder.npy/": b"",
    }),
    "bzip2_member": lambda: _archive(_members(), compression=zipfile.ZIP_BZIP2),
    "bad_magic": lambda: _archive(_replace("encoder_bias.npy", b"\x93NUMPZ" + _members()["encoder_bias.npy"][6:])),
    "header_version_3": lambda: _archive(_replace(
        "encoder_bias.npy", _header((32,), version=b"\x03\x00") + b"\x00" * 128)),
    "truncated_header": lambda: _archive(_replace(
        "encoder_bias.npy", b"\x93NUMPY\x01\x00" + (300).to_bytes(2, "little") + b" " * 200)),
    "oversized_header": lambda: _archive(_replace(
        "encoder_bias.npy", b"\x93NUMPY\x02\x00" + (5000).to_bytes(4, "little") + b" " * 200)),
    "not_a_literal": lambda: _archive(_replace(
        "encoder_bias.npy", b"\x93NUMPY\x01\x00\x10\x00__import__('os')" + b"\x00" * 128)),
    "wrong_shape": lambda: _archive(_replace("encoder_bias.npy", _npy(np.zeros(31, np.float32)))),
    "float_shape": lambda: _archive(_replace(
        "encoder_bias.npy", _header((32.0,)) + b"\x00" * 128)),  # type: ignore[arg-type]
    "float64_dtype": lambda: _archive(_replace("encoder_bias.npy", _npy(np.zeros(32, np.float64)))),
    "object_dtype": lambda: _archive(_replace(
        "encoder_bias.npy", _header((32,), descr="|O") + b"\x00" * 256)),
    "fortran_order": lambda: _archive(_replace(
        "encoder_bias.npy", _header((32,), fortran=True) + b"\x00" * 128)),
    "extra_header_key": lambda: _archive(_replace(
        "encoder_bias.npy", _header((32,), extra="'note': 1, ") + b"\x00" * 128)),
    "short_payload": lambda: _archive(_replace("decoder_bias.npy", _npy(np.zeros(48, np.float32))[:-4])),
    "long_payload": lambda: _archive(_replace("decoder_bias.npy", _npy(np.zeros(48, np.float32)) + b"\x00" * 8)),
    "oversized_member": lambda: _archive(_replace(
        "decoder_bias.npy", _header((48,)) + b"\x00" * (192 + 8192))),
    "huge_declared_shape": lambda: _archive(_replace(
        "encoder.npy", _header((2**31, 2**31)) + b"\x00" * (50 * 32 * 4))),
}


REASONS = {
    "not_a_zip": "archive", "missing_member": "members", "extra_member": "members",
    "unknown_name": "member name", "duplicate_member": "member name",
    "directory_member": "member name", "bzip2_member": "compression",
    "bad_magic": "array header", "header_version_3": "array header",
    "truncated_header": "array header", "oversized_header": "array header",
    "not_a_literal": "array header", "wrong_shape": "shape", "float_shape": "shape",
    "float64_dtype": "dtype", "object_dtype": "dtype", "fortran_order": "order",
    "extra_header_key": "metadata", "short_payload": "payload size",
    "long_payload": "payload size", "oversized_member": "Oversized",
    "huge_declared_shape": "shape",
}


def test_every_case_has_an_expected_reason() -> None:
    assert set(REASONS) == set(CASES)


@pytest.mark.parametrize("case", sorted(CASES))
def test_malformed_archives_are_refused_before_loading(case: str) -> None:
    payload = CASES[case]()
    with pytest.raises(ValueError, match=REASONS[case]):
        validate_numeric_payload(payload, PLAN)


def test_encrypted_flag_is_refused() -> None:
    payload = bytearray(_archive(_members(), compression=zipfile.ZIP_STORED))
    # Set bit 0 (encrypted) in every central directory record.
    start = 0
    while (start := payload.find(b"PK\x01\x02", start)) >= 0:
        payload[start + 8] |= 0x1
        start += 4
    with pytest.raises(ValueError):
        validate_numeric_payload(bytes(payload), PLAN)


def test_wrong_plan_is_refused() -> None:
    with pytest.raises(ValueError):
        validate_numeric_payload(_archive(_members()), PatchPlan(hidden_dim=16))


def test_oversized_payload_is_refused_without_parsing() -> None:
    with pytest.raises(ValueError, match="Oversized"):
        validate_numeric_payload(b"\x00" * (200 * 1024 * 1024 + 1), PLAN)
