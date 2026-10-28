"""Local exact-byte admission gate for the optional Quality Generator model chain.

The browser chain (SwinIR pre-clean, Real-ESRGAN upscale, optional MODNet matte
diagnostic) only runs weights that carry a rights record of the
``beljour-model-rights/1`` format. This module is where such a record is made,
offline, from files staged on this machine:

* the staged weight file is hashed (SHA-256) and measured byte for byte;
* the independently archived rights-review document is hashed the same way;
* exactly one entry in the ``runtime`` or ``models`` section of the current
  ``licences.json`` must name that weight digest, and it must be ``allowed``,
  carry a commercially allowed licence that is the licence of the reviewed
  upstream project for that role, and agree on byte size, role, model ID,
  upstream commit and review digest.

Anything else fails closed: no entry, two entries, a ``pending`` entry, an entry
the ledger has since ``blocked`` (revoked), a different licence or any mismatched
field. The gate reads the ledger and never writes it; adding an entry is a human
licence decision. Nothing is downloaded and no model is executed here.

Ledger fields beyond the existing ``name``/``licence``/``status``/``sha256``/
``bytes`` are ASSUMED names for this gate: ``role``, ``modelId``,
``upstreamCommit`` and ``reviewSha256``. Author: John Khan.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from ...models.registry import COMMIT, IDENT, MAX_MODEL_BYTES, SHA

RIGHTS_FORMAT = "beljour-model-rights/1"
STAGING_FORMAT = "beljour-model-staging/1"
# Must stay equal to RECORD_KEYS in web/src/engines/upscale/quality-model-rights.ts.
RECORD_KEYS = (
    "format", "gateDecision", "licence", "modelId", "reviewSha256", "role",
    "upstreamCommit", "weightsBytes", "weightsSha256",
)
# Upstream project licence per role, as graded in the r38e adoption notes.
ROLE_LICENCES: Mapping[str, str] = {
    "swinir_preclean": "Apache-2.0",
    "realesrgan_upscale": "BSD-3-Clause",
    "modnet_matte": "Apache-2.0",
}
PIPELINE_ORDER = ("swinir_preclean", "realesrgan_upscale", "modnet_matte")
REQUIRED_ROLES = ("swinir_preclean", "realesrgan_upscale")
LEDGER_SECTIONS = ("runtime", "models")
# ASSUMED: an archived rights review is a document, not a bundle; 8 MiB is ample.
MAX_REVIEW_BYTES = 8 * 1024 * 1024
DEFAULT_LEDGER = Path(__file__).resolve().parents[4] / "licences.json"


class ModelGateError(ValueError):
    """A model candidate, its review or its ledger entry does not clear the gate."""


@dataclass(frozen=True)
class ModelCandidate:
    """One staged model: the role it fills and the local files that back it."""

    role: str
    model_id: str
    upstream_commit: str
    weights: Path
    review: Path


def _digest_file(path: Path, limit: int, what: str) -> tuple[str, int]:
    """SHA-256 and size of a regular, unlinked local file read into a buffer that is then zeroed."""
    if path.is_symlink() or not path.is_file():
        raise ModelGateError(f"{what} file is missing or linked")
    size = path.stat().st_size
    if size < 1 or size > limit:
        raise ModelGateError(f"{what} file size is outside the accepted range")
    buffer = bytearray(size)
    try:
        with path.open("rb") as opened:
            read = opened.readinto(buffer)
            if read != size or opened.read(1):
                raise ModelGateError(f"{what} file changed while it was read")
        return hashlib.sha256(buffer).hexdigest(), size
    finally:
        buffer[:] = bytes(size)


def read_ledger(path: Path = DEFAULT_LEDGER) -> dict[str, Any]:
    """Read licences.json; the policy lists are required for any decision."""
    try:
        ledger = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise ModelGateError("licences.json could not be read") from exc
    policy = ledger.get("policy") if isinstance(ledger, dict) else None
    if not isinstance(policy, dict) or not isinstance(policy.get("allowed"), list):
        raise ModelGateError("licences.json has no policy.allowed list")
    return ledger


def _exact_entries(ledger: Mapping[str, Any], digest: str) -> list[Mapping[str, Any]]:
    found: list[Mapping[str, Any]] = []
    for section in LEDGER_SECTIONS:
        items = ledger.get(section, [])
        if not isinstance(items, list):
            raise ModelGateError(f"licences.json {section} must be a list")
        found.extend(item for item in items if isinstance(item, dict) and item.get("sha256") == digest)
    return found


def _check_candidate(candidate: ModelCandidate) -> None:
    if candidate.role not in ROLE_LICENCES:
        raise ModelGateError(f"unknown model role {candidate.role!r}")
    if not isinstance(candidate.model_id, str) or not IDENT.fullmatch(candidate.model_id):
        raise ModelGateError("invalid model identifier")
    if not isinstance(candidate.upstream_commit, str) or not COMMIT.fullmatch(candidate.upstream_commit):
        raise ModelGateError(f"model {candidate.model_id}: an immutable 40-hex upstream commit is required")


def admit_model(candidate: ModelCandidate, ledger: Mapping[str, Any]) -> dict[str, Any]:
    """Return the browser rights record for one staged model, or raise ModelGateError."""
    _check_candidate(candidate)
    name = candidate.model_id
    weights_sha, weights_bytes = _digest_file(candidate.weights, MAX_MODEL_BYTES, "weights")
    review_sha, _ = _digest_file(candidate.review, MAX_REVIEW_BYTES, "rights review")
    matches = _exact_entries(ledger, weights_sha)
    if not matches:
        raise ModelGateError(f"model {name}: no exact ledger entry for these weights; the classical engine stays active")
    if len(matches) > 1:
        raise ModelGateError(f"model {name}: the ledger lists these weights more than once")
    entry = matches[0]
    status = entry.get("status")
    if status == "blocked":
        raise ModelGateError(f"model {name}: the ledger has revoked these weights")
    if status != "allowed":
        raise ModelGateError(f"model {name}: rights review is {status}; the classical engine stays active")
    licence = entry.get("licence")
    allowed = ledger.get("policy", {}).get("allowed", [])
    if not isinstance(licence, str) or licence not in allowed:
        raise ModelGateError(f"model {name}: commercial licence not approved")
    if licence != ROLE_LICENCES[candidate.role]:
        raise ModelGateError(f"model {name}: licence does not match the reviewed upstream release")
    expected = {
        "bytes": weights_bytes, "role": candidate.role, "modelId": name,
        "upstreamCommit": candidate.upstream_commit, "reviewSha256": review_sha,
    }
    for field, value in expected.items():
        if entry.get(field) != value:
            raise ModelGateError(f"model {name}: ledger {field} does not match the staged files")
    record = {
        "format": RIGHTS_FORMAT, "role": candidate.role, "modelId": name,
        "upstreamCommit": candidate.upstream_commit, "licence": licence,
        "weightsSha256": weights_sha, "weightsBytes": weights_bytes,
        "reviewSha256": review_sha, "gateDecision": "allowed",
    }
    if tuple(sorted(record)) != RECORD_KEYS or not SHA.fullmatch(weights_sha):
        raise ModelGateError("internal record shape differs from the browser contract")
    return record


def admit_chain(candidates: Sequence[ModelCandidate], ledger: Mapping[str, Any]) -> list[dict[str, Any]]:
    """Admit a whole chain: pre-clean and upscale required, matte optional, each once, own weights."""
    roles = [candidate.role for candidate in candidates]
    if len(set(roles)) != len(roles):
        raise ModelGateError("each model role may be staged only once")
    missing = [role for role in REQUIRED_ROLES if role not in roles]
    if missing:
        raise ModelGateError(f"missing {', '.join(missing)}; the classical engine stays active")
    by_role = {candidate.role: candidate for candidate in candidates}
    records = [admit_model(by_role[role], ledger) for role in PIPELINE_ORDER if role in by_role]
    if len({record["weightsSha256"] for record in records}) != len(records):
        raise ModelGateError("each model stage needs its own reviewed weights")
    return records


def _inside(base: Path, value: Any) -> Path:
    if not isinstance(value, str) or not value or Path(value).is_absolute():
        raise ModelGateError("staging paths must be relative file names")
    resolved = (base / value).resolve()
    if not resolved.is_relative_to(base.resolve()):
        raise ModelGateError("staging paths must stay inside the staging folder")
    return base / value


def read_staging(manifest: Path) -> list[ModelCandidate]:
    """Parse a local staging manifest; file paths are relative to its folder."""
    try:
        document = json.loads(manifest.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise ModelGateError("staging manifest could not be read") from exc
    if not isinstance(document, dict) or document.get("format") != STAGING_FORMAT or \
            not isinstance(document.get("models"), list):
        raise ModelGateError("unknown staging manifest format")
    keys = {"role", "modelId", "upstreamCommit", "weights", "review"}
    candidates: list[ModelCandidate] = []
    for item in document["models"]:
        if not isinstance(item, dict) or set(item) != keys:
            raise ModelGateError("staging manifest entry is malformed")
        candidates.append(ModelCandidate(
            role=item["role"], model_id=item["modelId"], upstream_commit=item["upstreamCommit"],
            weights=_inside(manifest.parent, item["weights"]), review=_inside(manifest.parent, item["review"]),
        ))
    return candidates


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Admit staged Quality Generator models against licences.json.")
    parser.add_argument("manifest", type=Path, help="local staging manifest (beljour-model-staging/1)")
    parser.add_argument("--ledger", type=Path, default=DEFAULT_LEDGER)
    args = parser.parse_args(argv)
    try:
        records = admit_chain(read_staging(args.manifest), read_ledger(args.ledger))
    except ModelGateError as exc:
        print(f"model gate: {exc}", file=sys.stderr)
        return 1
    print(json.dumps({"records": records}, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
