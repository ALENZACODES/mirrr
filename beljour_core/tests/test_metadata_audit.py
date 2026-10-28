"""Offline geometry audit: exact encoding and fail-closed malformed inputs.

All metadata, archives and pins here are synthetic. No model is downloaded or run.
Author: John Khan.
"""
from __future__ import annotations

import hashlib
import io
import json
import stat
import zipfile
from pathlib import Path

import pytest

from api.tests.test_repo_checks import REPO, load

verifier = load(REPO / "scripts/audit_face_metadata.py")
TEXT = """# Original synthetic protocol example, no face geometry.
input_source: FACE_LANDMARK_PIPELINE
procrustes_landmark_basis { landmark_id: 7 weight: 0.5 }
canonical_mesh: {
  vertex_type: VERTEX_PT
  primitive_type: TRIANGLE
  vertex_buffer: 1.25
  vertex_buffer: -2.5
  index_buffer: 0
  index_buffer: 300
}
"""
# Independently specified protobuf wire bytes: one mesh, one weighted reference,
# then input source. Repeated float and uint32 fields are unpacked in proto2.
WIRE = bytes.fromhex("0a13 0800 1000 1d0000a03f 1d000020c0 2000 20ac02 1207 0807 150000003f 1801")


def pin(data: bytes) -> dict:
    return {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}


def fixtures(tmp_path: Path, *, payload: bytes = WIRE, duplicate: bool = False, mode: int = 0) -> tuple:
    source = tmp_path / "synthetic.pbtxt"
    source.write_text(TEXT, encoding="utf-8")
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        member = zipfile.ZipInfo(verifier.MEMBER)
        if mode:
            member.external_attr = mode << 16
        archive.writestr(member, payload)
        if duplicate:
            archive.writestr(verifier.MEMBER, payload)
    bundle = tmp_path / "synthetic.task"
    bundle.write_bytes(buffer.getvalue())
    evidence = {"id": "face-landmarker-478", **pin(bundle.read_bytes()),
                "components": [{"filename": verifier.MEMBER, **pin(WIRE)}],
                "geometryMetadata": {"source": pin(source.read_bytes()), "sourceCommit": "f" * 40}}
    return source, bundle, evidence


def test_complete_schema_encodes_known_wire_bytes_and_all_fields() -> None:
    assert verifier.encode_metadata(TEXT) == WIRE
    reordered = """canonical_mesh { index_buffer: 0 index_buffer: 300
      vertex_buffer: 1.25 vertex_buffer: -2.5 primitive_type: TRIANGLE vertex_type: VERTEX_PT }
    input_source: FACE_LANDMARK_PIPELINE
    procrustes_landmark_basis: { weight: 5e-1 landmark_id: 7 }
    """
    assert verifier.encode_metadata(reordered) == WIRE
    extra = TEXT + "procrustes_landmark_basis {landmark_id: 8 weight: 0.25}"
    encoded = verifier.encode_metadata(extra)
    assert encoded == WIRE[:-2] + bytes.fromhex("1207 0808 150000803e") + WIRE[-2:]
    assert verifier.encode_metadata("canonical_mesh {vertex_buffer: -0.0}") == bytes.fromhex("0a05 1d00000080")


@pytest.mark.parametrize("text,reason", [
    ("# comment only\n", "empty"),
    ("}", "closing brace"),
    ("unknown: 1", "unknown field"),
    ("canonical_mesh { new_field: 2 }", "unknown field"),
    ("canonical_mesh { vertex_buffer: 1", "closing brace"),
    ("input_source", "incomplete"),
    ("input_source FACE_LANDMARK_PIPELINE", "colon"),
    ("input_source: FACE_LANDMARK_PIPELINE;", "unexpected text"),
    ("input_source: UNREVIEWED_PIPELINE", "enum"),
    ("input_source: DEFAULT input_source: DEFAULT", "duplicate singular"),
    ("canonical_mesh: 5", "opening brace"),
    ("canonical_mesh { vertex_buffer: nan }", "finite"),
    ("canonical_mesh { vertex_buffer: 1e999 }", "finite"),
    ("canonical_mesh { vertex_buffer: 4e38 }", "float32"),
    ("canonical_mesh { index_buffer: -1 }", "decimal integer"),
    ("canonical_mesh { index_buffer: 1.5 }", "decimal integer"),
    ("canonical_mesh { index_buffer: 4294967296 }", "out of range"),
    ("canonical_mesh { index_buffer: 999999999999999999999 }", "out of range"),
    ("canonical_mesh { vertex_type: VERTEX_PT vertex_type: VERTEX_PT }", "duplicate singular"),
])
def test_malformed_text_never_silently_drops_or_coerces_fields(text: str, reason: str) -> None:
    with pytest.raises(verifier.AuditError, match=reason):
        verifier.encode_metadata(text)


def test_source_and_token_limits_are_enforced_before_encoding(monkeypatch) -> None:
    with pytest.raises(verifier.AuditError, match="size cap"):
        verifier.encode_metadata("#" + "x" * verifier.MAX_SOURCE_BYTES)
    monkeypatch.setattr(verifier, "MAX_TOKENS", 3)
    with pytest.raises(verifier.AuditError, match="token cap"):
        verifier.encode_metadata(TEXT)


def test_exact_offline_audit_and_cli_make_no_writes(tmp_path: Path, monkeypatch, capsys) -> None:
    source, bundle, evidence = fixtures(tmp_path)
    original_source, original_bundle = source.read_bytes(), bundle.read_bytes()
    result = verifier.audit(source, bundle, evidence)
    assert result["exactByteMatch"] is True and result["offline"] is True
    assert result["metadata"] == pin(WIRE)
    record = tmp_path / "provenance.json"
    record.write_text(json.dumps({"models": [evidence]}))
    monkeypatch.setattr(verifier, "PROVENANCE", record)
    before = set(tmp_path.iterdir())
    assert verifier.main(["--source", str(source), "--bundle", str(bundle)]) == 0
    assert json.loads(capsys.readouterr().out) == result
    assert set(tmp_path.iterdir()) == before
    assert (source.read_bytes(), bundle.read_bytes()) == (original_source, original_bundle)
    source.write_bytes(b"Changed source")
    assert verifier.main(["--source", str(source), "--bundle", str(bundle)]) == 1
    assert "recorded pin" in capsys.readouterr().err


@pytest.mark.parametrize("which", ["source", "bundle"])
def test_changed_input_fails_its_pin_before_parse(tmp_path: Path, which: str) -> None:
    source, bundle, evidence = fixtures(tmp_path)
    changed = source if which == "source" else bundle
    data = changed.read_bytes()
    changed.write_bytes(bytes([data[0] ^ 1]) + data[1:])
    with pytest.raises(verifier.AuditError, match="recorded pin"):
        verifier.audit(source, bundle, evidence)


def test_changed_bundle_metadata_never_passes_even_with_updated_archive_pin(tmp_path: Path) -> None:
    source, bundle, evidence = fixtures(tmp_path, payload=WIRE[:-1] + b"\x02")
    with pytest.raises(verifier.AuditError, match="differs from the encoded"):
        verifier.audit(source, bundle, evidence)
    evidence["components"][0]["sha256"] = "a" * 64
    with pytest.raises(verifier.AuditError, match="recorded metadata"):
        verifier.audit(source, bundle, evidence)


def test_duplicate_and_nonregular_zip_members_are_rejected(tmp_path: Path) -> None:
    with pytest.warns(UserWarning, match="Duplicate name"):
        source, bundle, evidence = fixtures(tmp_path, duplicate=True)
    with pytest.raises(verifier.AuditError, match="exactly one"):
        verifier.audit(source, bundle, evidence)
    for mode in (stat.S_IFLNK | 0o777, stat.S_IFIFO | 0o600):
        source, bundle, evidence = fixtures(tmp_path, mode=mode)
        with pytest.raises(verifier.AuditError, match="regular file"):
            verifier.audit(source, bundle, evidence)


def test_missing_component_evidence_and_linked_inputs_are_rejected(tmp_path: Path) -> None:
    source, bundle, evidence = fixtures(tmp_path)
    link = tmp_path / "link.pbtxt"
    link.symlink_to(source)
    with pytest.raises(verifier.AuditError, match="symlink"):
        verifier.audit(link, bundle, evidence)
    evidence["components"] = []
    with pytest.raises(verifier.AuditError, match="exactly one geometry"):
        verifier.audit(source, bundle, evidence)


def test_cli_refuses_repository_inputs_before_reading(capsys) -> None:
    with pytest.raises(SystemExit) as stopped:
        verifier.main(["--source", str(REPO / "source.pbtxt"), "--bundle", "/tmp/external.task"])
    assert stopped.value.code == 2
    assert "outside the source repository" in capsys.readouterr().err
