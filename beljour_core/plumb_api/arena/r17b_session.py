"""Local R17B consultation-session and provenance contracts. Author: John Khan.

The studio keeps photographs and masks in memory, but exports only safe recipe
and provenance metadata. Every render ticket binds to the selected feature,
recipe revision, photo fingerprint, and definition fingerprint so a late worker
result cannot be accepted after any of those inputs change.
"""
from __future__ import annotations

import hashlib
import json
import math
from collections.abc import Mapping
from dataclasses import asdict, dataclass, field
from typing import Any, Literal

from .r17b_definitions import DEFINITIONS
from .r17b_evidence import definitions_fingerprint

RenderState = Literal["pending", "completed", "cancelled", "stale", "failed"]
_ALLOWED_FAMILIES = {"hair_women", "makeup_w", "workflow_w", "upscale", "gender_look", "shave"}
_MAX_TEXT = 240
_MAX_METADATA_KEYS = 24
_MAX_OBSERVATIONS = 256


def _finite(value: Any, name: str, low: float, high: float) -> float:
    if isinstance(value, (bool, str)):
        raise ValueError(f"{name} must be numeric")
    try:
        result = float(value)
    except (TypeError, ValueError, OverflowError) as exc:
        raise ValueError(f"{name} must be numeric") from exc
    if not math.isfinite(result) or not low <= result <= high:
        raise ValueError(f"{name} must be in {low}..{high}")
    return result


def _safe_text(value: Any, name: str, *, allow_empty: bool = False) -> str:
    if not isinstance(value, str):
        raise ValueError(f"{name} must be text")
    text = value.strip()
    if not text and not allow_empty:
        raise ValueError(f"{name} cannot be empty")
    if len(text) > _MAX_TEXT:
        raise ValueError(f"{name} is too long")
    if any(ord(char) < 32 and char not in "\t\n" for char in text):
        raise ValueError(f"{name} contains control characters")
    return text


def _safe_scalar(value: Any, name: str) -> str | float | int | bool | None:
    if value is None or isinstance(value, bool):
        return value
    if isinstance(value, int):
        if abs(value) > 1_000_000_000:
            raise ValueError(f"{name} integer outside safe range")
        return value
    if isinstance(value, float):
        if not math.isfinite(value) or abs(value) > 1_000_000_000:
            raise ValueError(f"{name} number outside safe range")
        return value
    if isinstance(value, str):
        return _safe_text(value, name, allow_empty=True)
    raise ValueError(f"{name} must be a scalar")


def _safe_metadata(value: Mapping[str, Any] | None) -> dict[str, str | float | int | bool | None]:
    if value is None:
        return {}
    if not isinstance(value, Mapping):
        raise ValueError("metadata must be an object")
    if len(value) > _MAX_METADATA_KEYS:
        raise ValueError("metadata has too many keys")
    result: dict[str, str | float | int | bool | None] = {}
    for key, item in value.items():
        name = _safe_text(key, "metadata key")
        if name.startswith("_"):
            raise ValueError("private metadata keys are reserved")
        result[name] = _safe_scalar(item, f"metadata.{name}")
    return result


def photo_fingerprint(data: bytes | bytearray | memoryview, width: int, height: int, channels: int) -> str:
    if channels not in (3, 4):
        raise ValueError("channels must be 3 or 4")
    if width < 1 or height < 1 or width * height > 12_000_000:
        raise ValueError("photo dimensions outside supported range")
    raw = bytes(data)
    if len(raw) != width * height * channels:
        raise ValueError("photo byte length does not match dimensions")
    digest = hashlib.sha256()
    digest.update(b"beljour.r17b.photo.v1\0")
    digest.update(width.to_bytes(4, "big"))
    digest.update(height.to_bytes(4, "big"))
    digest.update(channels.to_bytes(1, "big"))
    digest.update(raw)
    return digest.hexdigest()


@dataclass(frozen=True)
class RecipeSnapshot:
    feature: str
    family: str
    style: str
    amount: float
    humidity: float = 55.0
    direction: str = "neutral"
    level: str = "normal"
    metadata: Mapping[str, str | float | int | bool | None] = field(default_factory=dict)

    def validate(self) -> None:
        if self.feature not in DEFINITIONS:
            raise ValueError("feature has no R17B pass definition")
        if self.family not in _ALLOWED_FAMILIES:
            raise ValueError("unsupported R17B family")
        if DEFINITIONS[self.feature].group != self.family:
            raise ValueError("feature/family mismatch")
        _safe_text(self.style, "style", allow_empty=True)
        _finite(self.amount, "amount", 0, 1)
        _finite(self.humidity, "humidity", 0, 100)
        if self.direction not in {"neutral", "feminine", "masculine"}:
            raise ValueError("invalid direction")
        if self.level not in {"normal", "extra", "hyper"}:
            raise ValueError("invalid level")
        _safe_metadata(self.metadata)

    def canonical(self) -> str:
        self.validate()
        payload = asdict(self)
        payload["metadata"] = dict(sorted(dict(self.metadata).items()))
        return json.dumps(payload, sort_keys=True, separators=(",", ":"))

    @property
    def sha256(self) -> str:
        return hashlib.sha256(self.canonical().encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class Observation:
    sequence: int
    key: str
    value: str | float | int | bool | None
    source: Literal["user", "checked", "engine"]
    assumed: bool

    def validate(self) -> None:
        if self.sequence < 1:
            raise ValueError("observation sequence must be positive")
        _safe_text(self.key, "observation key")
        _safe_scalar(self.value, f"observation.{self.key}")
        if self.source not in {"user", "checked", "engine"}:
            raise ValueError("invalid observation source")
        if self.source == "checked" and self.assumed:
            raise ValueError("checked observation cannot be marked assumed")


@dataclass(frozen=True)
class RenderTicket:
    id: int
    revision: int
    feature: str
    photo_sha256: str
    recipe_sha256: str
    definitions_sha256: str

    def validate(self) -> None:
        if self.id < 1 or self.revision < 1:
            raise ValueError("ticket id/revision must be positive")
        if self.feature not in DEFINITIONS:
            raise ValueError("ticket feature not registered")
        for value in (self.photo_sha256, self.recipe_sha256, self.definitions_sha256):
            if len(value) != 64 or any(char not in "0123456789abcdef" for char in value):
                raise ValueError("ticket hashes must be lowercase sha256")


@dataclass(frozen=True)
class RenderReceipt:
    ticket: RenderTicket
    state: RenderState
    output_sha256: str | None
    elapsed_ms: float | None
    reason: str = ""

    def validate(self) -> None:
        self.ticket.validate()
        if self.state not in {"pending", "completed", "cancelled", "stale", "failed"}:
            raise ValueError("invalid render state")
        if self.state == "completed":
            if self.output_sha256 is None or self.elapsed_ms is None:
                raise ValueError("completed receipt requires output hash and elapsed time")
            if len(self.output_sha256) != 64:
                raise ValueError("output hash must be sha256")
            _finite(self.elapsed_ms, "elapsed_ms", 0, 3_600_000)
        else:
            if self.output_sha256 is not None:
                raise ValueError("non-completed receipt cannot carry output hash")
        _safe_text(self.reason, "reason", allow_empty=True)


class LocalSession:
    """Mutable coordinator whose exported representation excludes pixels/masks."""

    def __init__(self, session_id: str = "local") -> None:
        self.session_id = _safe_text(session_id, "session_id")
        self._photo_sha256: str | None = None
        self._recipe: RecipeSnapshot | None = None
        self._revision = 0
        self._next_ticket = 1
        self._observations: list[Observation] = []
        self._receipts: list[RenderReceipt] = []

    @property
    def revision(self) -> int:
        return self._revision

    @property
    def photo_sha256(self) -> str | None:
        return self._photo_sha256

    @property
    def recipe(self) -> RecipeSnapshot | None:
        return self._recipe

    @property
    def observations(self) -> tuple[Observation, ...]:
        return tuple(self._observations)

    @property
    def receipts(self) -> tuple[RenderReceipt, ...]:
        return tuple(self._receipts)

    def bind_photo(self, digest: str) -> None:
        if len(digest) != 64 or any(char not in "0123456789abcdef" for char in digest):
            raise ValueError("photo digest must be lowercase sha256")
        if digest != self._photo_sha256:
            self._photo_sha256 = digest
            self._revision += 1
            self._recipe = None

    def set_recipe(self, recipe: RecipeSnapshot) -> None:
        recipe.validate()
        if self._photo_sha256 is None and DEFINITIONS[recipe.feature].group not in {"workflow_w"}:
            raise ValueError("photo-backed feature requires a bound photo")
        if self._recipe is None or self._recipe.sha256 != recipe.sha256:
            self._recipe = recipe
            self._revision += 1

    def observe(
        self,
        key: str,
        value: str | float | int | bool | None,
        *,
        source: Literal["user", "checked", "engine"] = "user",
        assumed: bool = False,
    ) -> Observation:
        if len(self._observations) >= _MAX_OBSERVATIONS:
            raise ValueError("observation limit reached")
        observation = Observation(len(self._observations) + 1, key, value, source, assumed)
        observation.validate()
        self._observations.append(observation)
        self._revision += 1
        return observation

    def ticket(self) -> RenderTicket:
        if self._recipe is None:
            raise ValueError("recipe must be selected before rendering")
        definition_group = DEFINITIONS[self._recipe.feature].group
        photo_hash = self._photo_sha256
        if photo_hash is None:
            if definition_group != "workflow_w":
                raise ValueError("photo-backed render requires a photo")
            photo_hash = "0" * 64
        ticket = RenderTicket(
            id=self._next_ticket,
            revision=self._revision,
            feature=self._recipe.feature,
            photo_sha256=photo_hash,
            recipe_sha256=self._recipe.sha256,
            definitions_sha256=definitions_fingerprint(DEFINITIONS),
        )
        ticket.validate()
        self._next_ticket += 1
        return ticket

    def _matches_current(self, ticket: RenderTicket) -> bool:
        if self._recipe is None:
            return False
        if ticket.revision != self._revision or ticket.feature != self._recipe.feature:
            return False
        if ticket.recipe_sha256 != self._recipe.sha256:
            return False
        expected_photo = self._photo_sha256 or "0" * 64
        if ticket.photo_sha256 != expected_photo:
            return False
        return ticket.definitions_sha256 == definitions_fingerprint(DEFINITIONS)

    def complete(self, ticket: RenderTicket, output: bytes, elapsed_ms: float) -> RenderReceipt:
        ticket.validate()
        if not self._matches_current(ticket):
            receipt = RenderReceipt(ticket, "stale", None, None, "session changed before result arrived")
        else:
            receipt = RenderReceipt(
                ticket,
                "completed",
                hashlib.sha256(bytes(output)).hexdigest(),
                _finite(elapsed_ms, "elapsed_ms", 0, 3_600_000),
            )
        receipt.validate()
        self._receipts.append(receipt)
        return receipt

    def cancel(self, ticket: RenderTicket, reason: str = "user cancelled") -> RenderReceipt:
        ticket.validate()
        receipt = RenderReceipt(ticket, "cancelled", None, None, _safe_text(reason, "reason"))
        receipt.validate()
        self._receipts.append(receipt)
        return receipt

    def fail(self, ticket: RenderTicket, reason: str) -> RenderReceipt:
        ticket.validate()
        receipt = RenderReceipt(ticket, "failed", None, None, _safe_text(reason, "reason"))
        receipt.validate()
        self._receipts.append(receipt)
        return receipt

    def safe_export(self) -> dict[str, Any]:
        """Export no photo bytes, mask arrays, landmarks, or raw worker payloads."""

        recipe = None
        if self._recipe is not None:
            recipe = json.loads(self._recipe.canonical())
        return {
            "schema": "beljour.r17b.session.v1",
            "author": "John Khan",
            "session_id": self.session_id,
            "revision": self._revision,
            "photo_sha256": self._photo_sha256,
            "recipe": recipe,
            "observations": [asdict(item) for item in self._observations],
            "receipts": [
                {
                    "ticket": asdict(item.ticket),
                    "state": item.state,
                    "output_sha256": item.output_sha256,
                    "elapsed_ms": item.elapsed_ms,
                    "reason": item.reason,
                }
                for item in self._receipts
            ],
            "privacy": "metadata and hashes only; photo pixels, masks and landmarks excluded",
            "definitions_sha256": definitions_fingerprint(DEFINITIONS),
        }

    def safe_export_text(self) -> str:
        return json.dumps(self.safe_export(), sort_keys=True, separators=(",", ":"))

    @property
    def audit_sha256(self) -> str:
        return hashlib.sha256(self.safe_export_text().encode("utf-8")).hexdigest()
