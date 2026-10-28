"""Private encrypted numeric model checkpoints and guarded resume. Author: John Khan."""

from __future__ import annotations

import hmac
import io
import json
import re
from pathlib import Path
from typing import Any

import numpy as np

from .checkpoint_guard import validate_numeric_payload
from .patch_model import PatchWeights
from .patches import PatchPlan
from .sealed_store import ArtefactProtectionError, SealedStore

CHECKPOINT_VERSION = "beljour-sealed-numeric/1"
LATEST_NAME = "sealed-latest.bjev"
STEP_PATTERN = re.compile(r"sealed-checkpoint-([0-9]{8})\.bjev\Z")
MAX_RECEIPT_BYTES = 8192


def _context(
    *, patch_plan: PatchPlan, training_digest: str, manifest_digest: str,
    revocation_digest: str | None,
) -> bytes:
    patch_plan.validate()
    for field in (training_digest, manifest_digest):
        if re.fullmatch(r"[0-9a-f]{64}", field) is None:
            raise ArtefactProtectionError("invalid_checkpoint_binding")
    if revocation_digest is not None and re.fullmatch(r"[0-9a-f]{64}", revocation_digest) is None:
        raise ArtefactProtectionError("invalid_checkpoint_binding")
    return json.dumps({
        "schema": CHECKPOINT_VERSION,
        "patch": patch_plan.sha256(),
        "training": training_digest,
        "manifest": manifest_digest,
        "revocations": revocation_digest,
    }, separators=(",", ":"), sort_keys=True).encode("ascii")


def _encode_arrays(weights: PatchWeights, plan: PatchPlan) -> bytearray:
    weights.verify(plan)
    with io.BytesIO() as stream:
        np.savez_compressed(
            stream, encoder=weights.encoder,
            encoder_bias=weights.encoder_bias,
            decoder=weights.decoder,
            decoder_bias=weights.decoder_bias,
        )
        return bytearray(stream.getvalue())


def _decode_arrays(payload: bytearray, plan: PatchPlan) -> PatchWeights:
    validate_numeric_payload(payload, plan)
    with io.BytesIO(payload) as stream:
        with np.load(stream, allow_pickle=False) as source:
            if set(source.files) != {"encoder", "encoder_bias", "decoder", "decoder_bias"}:
                raise ArtefactProtectionError("unexpected_checkpoint_members")
            weights = PatchWeights(
                source["encoder"].copy(), source["encoder_bias"].copy(),
                source["decoder"].copy(), source["decoder_bias"].copy(),
            )
    weights.verify(plan)
    return weights


class SealedNumericCheckpoints:
    """Model bytes, tuning digests and pointer metadata remain encrypted on disk."""

    def __init__(
        self, directory: Path, store: SealedStore, *, patch_plan: PatchPlan,
        training_digest: str, manifest_digest: str,
        revocation_digest: str | None = None,
    ) -> None:
        self.directory = directory
        self.store = store
        self.plan = patch_plan
        self.binding = _context(
            patch_plan=patch_plan, training_digest=training_digest,
            manifest_digest=manifest_digest, revocation_digest=revocation_digest,
        )

    def _path(self, step: int) -> Path:
        if not 1 <= step <= 99_999_999:
            raise ArtefactProtectionError("invalid_checkpoint_step")
        return self.directory / f"sealed-checkpoint-{step:08d}.bjev"

    def save(self, step: int, weights: PatchWeights) -> str:
        """Publish authenticated model first; last-good pointer changes only afterward."""
        destination = self._path(step)
        self.directory.mkdir(parents=True, exist_ok=True, mode=0o700)
        payload = _encode_arrays(weights, self.plan)
        try:
            digest = self.store.put(
                destination, payload, kind="checkpoint", binding=self.binding,
                replace=False,
            )
        finally:
            payload[:] = b"\x00" * len(payload)
        receipt = json.dumps({
            "schema": CHECKPOINT_VERSION,
            "step": step,
            "sha256": digest,
            "key_id": self.store.key_id,
        }, sort_keys=True, separators=(",", ":")).encode("ascii")
        self.store.put(
            self.directory / LATEST_NAME, receipt, kind="tuning",
            binding=self.binding, replace=True,
        )
        return digest

    def resume(self) -> tuple[int, PatchWeights]:
        """Open the latest encrypted pointer and checkpoint, validating both."""
        with self.store.opened(
            self.directory / LATEST_NAME, kind="tuning", binding=self.binding,
        ) as receipt:
            if len(receipt) > MAX_RECEIPT_BYTES:
                raise ArtefactProtectionError("invalid_checkpoint_receipt")
            try:
                value: object = json.loads(receipt)
            except (UnicodeError, ValueError) as exc:
                raise ArtefactProtectionError("invalid_checkpoint_receipt") from exc
        if not isinstance(value, dict) or set(value) != {"schema", "step", "sha256", "key_id"}:
            raise ArtefactProtectionError("invalid_checkpoint_receipt")
        record: dict[str, Any] = value
        step = record["step"]
        if (record["schema"] != CHECKPOINT_VERSION or type(step) is not int or
            record["key_id"] != self.store.key_id or
            not isinstance(record["sha256"], str) or
            re.fullmatch(r"[0-9a-f]{64}", record["sha256"]) is None):
            raise ArtefactProtectionError("invalid_checkpoint_receipt")
        location = self._path(step)
        if self.store.ciphertext_digest(location) != record["sha256"]:
            raise ArtefactProtectionError("checkpoint_digest_mismatch")
        with self.store.opened(location, kind="checkpoint", binding=self.binding) as plain:
            return step, _decode_arrays(plain, self.plan)

    def confirms_inputs(
        self, *, training_digest: str, manifest_digest: str,
        revocation_digest: str | None,
    ) -> bool:
        """Bind the encrypted writer to the current independent corpus audit."""
        expected = _context(
            patch_plan=self.plan,
            training_digest=training_digest,
            manifest_digest=manifest_digest,
            revocation_digest=revocation_digest,
        )
        return hmac.compare_digest(self.binding, expected)

    def latest_exists(self) -> bool:
        return (self.directory / LATEST_NAME).is_file()
