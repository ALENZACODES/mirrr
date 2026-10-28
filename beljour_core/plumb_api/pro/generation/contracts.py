"""Versioned local scene-generation contracts and strict request validation. Author: John Khan."""

from __future__ import annotations

import hashlib
import json
import math
import re
from dataclasses import dataclass
from typing import Any

MODEL_ID = "black-forest-labs/FLUX.1-schnell"
MODEL_LICENCE = "Apache-2.0"
MODEL_SCHEMA = "beljour-schnell-bundle/1"
JOB_SCHEMA = "beljour-local-scene-job/1"
SETTINGS_SCHEMA = "beljour-scene-settings/1"
ALLOWED_PURPOSES = frozenset({"background", "place", "prop"})
HASH_PATTERN = re.compile(r"[0-9a-f]{64}\Z")
REVISION_PATTERN = re.compile(r"[0-9a-f]{40}\Z")
MAX_PROMPT_LENGTH = 600
MAX_BATCH_IMAGES = 4


class GenerationRefused(ValueError):
    """Safe public code which never interpolates private prompts or model paths."""

    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


def checked_digest(value: object) -> str:
    if not isinstance(value, str) or HASH_PATTERN.fullmatch(value) is None:
        raise GenerationRefused("invalid_digest")
    return value


def checked_revision(value: object) -> str:
    if not isinstance(value, str) or REVISION_PATTERN.fullmatch(value) is None:
        raise GenerationRefused("model_revision_unpinned")
    return value


def canonical_json(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("ascii")


@dataclass(frozen=True)
class GenerationSettings:
    """Temporary, operator-supplied settings; never committed as readable presets."""

    width: int
    height: int
    steps: int
    seed: int
    images: int
    requested_rate_usd_per_gpu_hour: float | None

    @classmethod
    def from_mapping(cls, value: object) -> GenerationSettings:
        if not isinstance(value, dict):
            raise GenerationRefused("invalid_generation_settings")
        required = {"schema", "width", "height", "steps", "seed", "images", "gpu_rate"}
        if set(value) != required or value.get("schema") != SETTINGS_SCHEMA:
            raise GenerationRefused("invalid_generation_settings")
        width = value["width"]
        height = value["height"]
        steps = value["steps"]
        seed = value["seed"]
        images = value["images"]
        rate = value["gpu_rate"]
        if any(type(number) is not int for number in (width, height, steps, seed, images)):
            raise GenerationRefused("invalid_generation_settings")
        if not 256 <= width <= 2048 or width % 64 or not 256 <= height <= 2048 or height % 64:
            raise GenerationRefused("invalid_generation_dimensions")
        if width * height > 4_194_304 or not 1 <= steps <= 4:
            raise GenerationRefused("invalid_generation_workload")
        if not 0 <= seed < 2**32 or not 1 <= images <= MAX_BATCH_IMAGES:
            raise GenerationRefused("invalid_generation_workload")
        if rate is not None:
            if (type(rate) not in (int, float) or not math.isfinite(float(rate)) or
                    not 0 <= float(rate) <= 1000):
                raise GenerationRefused("invalid_cost_rate")
            rate = float(rate)
        return cls(width, height, steps, seed, images, rate)

    def digest(self) -> str:
        return hashlib.sha256(canonical_json(vars(self))).hexdigest()


@dataclass(frozen=True)
class SceneRequest:
    purpose: str
    prompt: str
    settings: GenerationSettings

    def validate(self) -> None:
        if self.purpose not in ALLOWED_PURPOSES:
            raise GenerationRefused("unsupported_generation_purpose")
        if not isinstance(self.prompt, str) or not 1 <= len(self.prompt) <= MAX_PROMPT_LENGTH:
            raise GenerationRefused("invalid_prompt")
        if self.prompt.strip() != self.prompt or not self.prompt:
            raise GenerationRefused("invalid_prompt")
        if any(ord(char) < 32 or char in "\u200b\u200c\u200d\ufeff" for char in self.prompt):
            raise GenerationRefused("invalid_prompt")

    def public_audit(self) -> dict[str, Any]:
        self.validate()
        return {
            "schema": JOB_SCHEMA,
            "purpose": self.purpose,
            "prompt_sha256": hashlib.sha256(self.prompt.encode("utf-8")).hexdigest(),
            "settings_sha256": self.settings.digest(),
            "status": "REQUESTED_NOT_SCORED",
        }
