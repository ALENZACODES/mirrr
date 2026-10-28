"""Model admission gate tests on short made-up byte files, never real weights."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

import pytest

from plumb_api.engines.upscale.model_gate import (
    DEFAULT_LEDGER,
    RECORD_KEYS,
    ROLE_LICENCES,
    STAGING_FORMAT,
    ModelCandidate,
    ModelGateError,
    admit_chain,
    admit_model,
    main,
    read_ledger,
    read_staging,
)

REPO = Path(__file__).resolve().parents[4]
RIGHTS_TS = REPO / "web" / "src" / "engines" / "upscale" / "quality-model-rights.ts"
POLICY = {"allowed": ["Apache-2.0", "BSD-3-Clause", "MIT"], "pending": ["Unverified"], "blocked": ["Research only"]}


def _sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _commit(role: str) -> str:
    return _sha(f"synthetic upstream {role}".encode())[:40]


def _stage(folder: Path, role: str, weights: bytes | None = None) -> tuple[ModelCandidate, dict[str, Any]]:
    """Write a synthetic weight and review file and the ledger entry that matches them."""
    data = weights if weights is not None else f"synthetic weights {role}".encode()
    review = f"synthetic rights review {role}".encode()
    (folder / f"{role}.bin").write_bytes(data)
    (folder / f"{role}.review.txt").write_bytes(review)
    model_id = f"synthetic-{role.replace('_', '-')}"
    candidate = ModelCandidate(role, model_id, _commit(role), folder / f"{role}.bin", folder / f"{role}.review.txt")
    entry = {
        "name": f"{model_id} weights", "licence": ROLE_LICENCES[role], "status": "allowed",
        "sha256": _sha(data), "bytes": len(data), "role": role, "modelId": model_id,
        "upstreamCommit": _commit(role), "reviewSha256": _sha(review),
    }
    return candidate, entry


def _ledger(*entries: dict[str, Any], section: str = "models") -> dict[str, Any]:
    return {"policy": POLICY, "runtime": [], "models": [], section: list(entries)}


def test_allowed_exact_entry_produces_browser_record(tmp_path: Path) -> None:
    candidate, entry = _stage(tmp_path, "realesrgan_upscale")
    record = admit_model(candidate, _ledger(entry))
    assert tuple(sorted(record)) == RECORD_KEYS
    assert record["format"] == "beljour-model-rights/1"
    assert record["gateDecision"] == "allowed"
    assert record["licence"] == "BSD-3-Clause"
    assert record["weightsSha256"] == entry["sha256"]
    assert record["weightsBytes"] == entry["bytes"]
    assert record["reviewSha256"] == entry["reviewSha256"]


def test_runtime_section_entries_also_count(tmp_path: Path) -> None:
    candidate, entry = _stage(tmp_path, "swinir_preclean")
    assert admit_model(candidate, _ledger(entry, section="runtime"))["role"] == "swinir_preclean"


def test_missing_entry_keeps_classical_engine(tmp_path: Path) -> None:
    candidate, _ = _stage(tmp_path, "swinir_preclean")
    with pytest.raises(ModelGateError, match="no exact ledger entry"):
        admit_model(candidate, _ledger())


def test_pending_entry_fails_closed(tmp_path: Path) -> None:
    candidate, entry = _stage(tmp_path, "swinir_preclean")
    with pytest.raises(ModelGateError, match="rights review is pending"):
        admit_model(candidate, _ledger({**entry, "status": "pending"}))


def test_entry_revoked_by_ledger_fails_closed(tmp_path: Path) -> None:
    candidate, entry = _stage(tmp_path, "swinir_preclean")
    with pytest.raises(ModelGateError, match="revoked"):
        admit_model(candidate, _ledger({**entry, "status": "blocked"}))


def test_duplicate_entries_fail_closed_across_sections(tmp_path: Path) -> None:
    candidate, entry = _stage(tmp_path, "swinir_preclean")
    ledger = _ledger(entry)
    ledger["runtime"] = [dict(entry)]
    with pytest.raises(ModelGateError, match="more than once"):
        admit_model(candidate, ledger)


def test_licence_outside_policy_is_refused(tmp_path: Path) -> None:
    candidate, entry = _stage(tmp_path, "swinir_preclean")
    with pytest.raises(ModelGateError, match="commercial licence not approved"):
        admit_model(candidate, _ledger({**entry, "licence": "Research only"}))


def test_allowed_but_different_licence_is_refused(tmp_path: Path) -> None:
    candidate, entry = _stage(tmp_path, "swinir_preclean")
    with pytest.raises(ModelGateError, match="does not match the reviewed upstream"):
        admit_model(candidate, _ledger({**entry, "licence": "MIT"}))


@pytest.mark.parametrize("field, value", [
    ("bytes", 3),
    ("role", "modnet_matte"),
    ("modelId", "another-model"),
    ("upstreamCommit", "0" * 40),
    ("reviewSha256", "f" * 64),
])
def test_mismatched_ledger_fields_fail_closed(tmp_path: Path, field: str, value: Any) -> None:
    candidate, entry = _stage(tmp_path, "swinir_preclean")
    with pytest.raises(ModelGateError, match=f"ledger {field} does not match"):
        admit_model(candidate, _ledger({**entry, field: value}))


def test_edited_review_document_no_longer_matches(tmp_path: Path) -> None:
    candidate, entry = _stage(tmp_path, "modnet_matte")
    candidate.review.write_bytes(b"a different review")
    with pytest.raises(ModelGateError, match="reviewSha256"):
        admit_model(candidate, _ledger(entry))


def test_changed_weights_no_longer_match(tmp_path: Path) -> None:
    candidate, entry = _stage(tmp_path, "realesrgan_upscale")
    candidate.weights.write_bytes(b"tampered")
    with pytest.raises(ModelGateError, match="no exact ledger entry"):
        admit_model(candidate, _ledger(entry))


def test_linked_empty_or_missing_files_are_refused(tmp_path: Path) -> None:
    candidate, entry = _stage(tmp_path, "realesrgan_upscale")
    link = tmp_path / "link.bin"
    link.symlink_to(candidate.weights)
    with pytest.raises(ModelGateError, match="missing or linked"):
        admit_model(ModelCandidate(candidate.role, candidate.model_id, candidate.upstream_commit,
                                   link, candidate.review), _ledger(entry))
    candidate.review.write_bytes(b"")
    with pytest.raises(ModelGateError, match="size"):
        admit_model(candidate, _ledger(entry))
    with pytest.raises(ModelGateError, match="missing"):
        admit_model(ModelCandidate(candidate.role, candidate.model_id, candidate.upstream_commit,
                                   tmp_path / "absent.bin", candidate.review), _ledger(entry))


@pytest.mark.parametrize("role, model_id, commit, message", [
    ("gfp_restore", "synthetic-x", "a" * 40, "unknown model role"),
    ("swinir_preclean", "Bad Name", "a" * 40, "invalid model identifier"),
    ("swinir_preclean", "synthetic-x", "main", "immutable"),
])
def test_candidate_identity_is_checked_first(tmp_path: Path, role: str, model_id: str, commit: str,
                                             message: str) -> None:
    with pytest.raises(ModelGateError, match=message):
        admit_model(ModelCandidate(role, model_id, commit, tmp_path / "a.bin", tmp_path / "a.txt"), _ledger())


def test_chain_requires_preclean_and_upscale(tmp_path: Path) -> None:
    upscale, entry = _stage(tmp_path, "realesrgan_upscale")
    with pytest.raises(ModelGateError, match="missing swinir_preclean"):
        admit_chain([upscale], _ledger(entry))


def test_chain_returns_records_in_pipeline_order(tmp_path: Path) -> None:
    staged = [_stage(tmp_path, role) for role in ("modnet_matte", "realesrgan_upscale", "swinir_preclean")]
    records = admit_chain([candidate for candidate, _ in staged], _ledger(*(entry for _, entry in staged)))
    assert [record["role"] for record in records] == ["swinir_preclean", "realesrgan_upscale", "modnet_matte"]


def test_chain_refuses_repeated_roles_and_shared_weights(tmp_path: Path) -> None:
    pre, pre_entry = _stage(tmp_path, "swinir_preclean")
    with pytest.raises(ModelGateError, match="only once"):
        admit_chain([pre, pre], _ledger(pre_entry))
    up, up_entry = _stage(tmp_path, "realesrgan_upscale", weights=b"same synthetic bytes")
    matte, matte_entry = _stage(tmp_path, "modnet_matte", weights=b"same synthetic bytes")
    with pytest.raises(ModelGateError, match="more than once"):
        admit_chain([pre, up, matte], _ledger(pre_entry, up_entry, matte_entry))


def test_current_repo_ledger_admits_nothing(tmp_path: Path) -> None:
    """The reconstructed licences.json has no allowed exact-model entries yet."""
    ledger = read_ledger(DEFAULT_LEDGER)
    candidate, _ = _stage(tmp_path, "swinir_preclean")
    with pytest.raises(ModelGateError, match="no exact ledger entry"):
        admit_model(candidate, ledger)


def test_ledger_without_policy_is_refused(tmp_path: Path) -> None:
    path = tmp_path / "licences.json"
    path.write_text(json.dumps({"models": []}), encoding="utf-8")
    with pytest.raises(ModelGateError, match="policy.allowed"):
        read_ledger(path)


def test_staging_manifest_paths_stay_inside_folder(tmp_path: Path) -> None:
    manifest = tmp_path / "staging.json"
    row = {"role": "swinir_preclean", "modelId": "synthetic-a", "upstreamCommit": "a" * 40,
           "weights": "../outside.bin", "review": "review.txt"}
    manifest.write_text(json.dumps({"format": STAGING_FORMAT, "models": [row]}), encoding="utf-8")
    with pytest.raises(ModelGateError, match="inside the staging folder"):
        read_staging(manifest)
    manifest.write_text(json.dumps({"format": "other", "models": []}), encoding="utf-8")
    with pytest.raises(ModelGateError, match="unknown staging manifest"):
        read_staging(manifest)


def test_cli_prints_records_and_never_writes_ledger(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    staged = [_stage(tmp_path, role) for role in ("swinir_preclean", "realesrgan_upscale")]
    ledger_path = tmp_path / "licences.json"
    ledger_text = json.dumps(_ledger(*(entry for _, entry in staged)))
    ledger_path.write_text(ledger_text, encoding="utf-8")
    rows = [{"role": c.role, "modelId": c.model_id, "upstreamCommit": c.upstream_commit,
             "weights": c.weights.name, "review": c.review.name} for c, _ in staged]
    manifest = tmp_path / "staging.json"
    manifest.write_text(json.dumps({"format": STAGING_FORMAT, "models": rows}), encoding="utf-8")
    assert main([str(manifest), "--ledger", str(ledger_path)]) == 0
    printed = json.loads(capsys.readouterr().out)
    assert [record["role"] for record in printed["records"]] == ["swinir_preclean", "realesrgan_upscale"]
    assert ledger_path.read_text(encoding="utf-8") == ledger_text
    ledger_path.write_text(json.dumps(_ledger()), encoding="utf-8")
    assert main([str(manifest), "--ledger", str(ledger_path)]) == 1
    assert "model gate:" in capsys.readouterr().err


def test_record_contract_matches_browser_checker() -> None:
    source = RIGHTS_TS.read_text(encoding="utf-8")
    keys = re.search(r'const RECORD_KEYS = "([^"]+)"', source)
    assert keys is not None and tuple(keys.group(1).split(",")) == RECORD_KEYS
    for role, licence in ROLE_LICENCES.items():
        assert re.search(rf'{role}: Object\.freeze\(\{{[^}}]*licence: "{re.escape(licence)}"', source), role
