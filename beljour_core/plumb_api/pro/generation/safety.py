"""Fail-closed prompt and rendered-output safety gates for scene-only jobs. Author: John Khan."""

from __future__ import annotations

import io
import re
import unicodedata
from collections.abc import Callable
from dataclasses import dataclass
from typing import Protocol

from PIL import Image, ImageDraw

from .contracts import GenerationRefused, SceneRequest

MAX_ENCODED_BYTES = 20 * 1024 * 1024
MAX_IMAGE_PIXELS = 4_194_304
# These words are only a first-stage refusal. Operator moderation is still mandatory.
BLOCKED_WORDS = frozenset({
    "person", "people", "portrait", "face", "child", "children", "baby",
    "nude", "nudity", "sexual", "weapon", "blood", "violent", "gore",
    "identity", "celebrity", "deepfake", "minor", "victim", "logo",
})


@dataclass(frozen=True)
class ReviewVerdict:
    accepted: bool
    reviewed: bool
    code: str
    reviewer_digest: str


class PromptReviewer(Protocol):
    """Independent operator-approved moderation, never implicit success."""

    def review(self, text: str, purpose: str) -> ReviewVerdict: ...


class ImageReviewer(Protocol):
    """Separate visual review of output; not inferred from the prompt alone."""

    def review(self, pixels: Image.Image, purpose: str) -> ReviewVerdict: ...


def _reviewed(verdict: ReviewVerdict) -> bool:
    return (
        verdict.reviewed is True and verdict.accepted is True
        and verdict.code == "approved"
        and bool(re.fullmatch(r"[0-9a-f]{64}", verdict.reviewer_digest))
    )


def check_prompt(request: SceneRequest, reviewer: PromptReviewer) -> str:
    request.validate()
    normalized = unicodedata.normalize("NFKC", request.prompt).casefold()
    tokens = re.findall(r"\w+", normalized, flags=re.UNICODE)
    if any(token in BLOCKED_WORDS for token in tokens):
        raise GenerationRefused("restricted_scene_subject")
    try:
        verdict = reviewer.review(request.prompt, request.purpose)
    except Exception as exc:
        raise GenerationRefused("prompt_review_unavailable") from exc
    if not isinstance(verdict, ReviewVerdict) or not _reviewed(verdict):
        raise GenerationRefused("prompt_review_refused")
    return verdict.reviewer_digest


def verify_and_label_output(
    source: bytes | bytearray,
    *, purpose: str,
    width: int,
    height: int,
    reviewer: ImageReviewer,
    cancelled: Callable[[], bool],
) -> tuple[bytes, str]:
    """Decode, review and re-encode locally; never preserve source EXIF/GPS metadata."""
    if len(source) == 0 or len(source) > MAX_ENCODED_BYTES or cancelled():
        raise GenerationRefused("invalid_generated_image")
    try:
        with Image.open(io.BytesIO(source)) as opened:
            if opened.format not in ("PNG", "JPEG", "WEBP"):
                raise GenerationRefused("unsupported_generated_image")
            if opened.size != (width, height) or opened.width * opened.height > MAX_IMAGE_PIXELS:
                raise GenerationRefused("wrong_generated_image_size")
            image = opened.convert("RGB")
        if cancelled():
            raise GenerationRefused("generation_cancelled")
        try:
            verdict = reviewer.review(image, purpose)
        except Exception as exc:
            raise GenerationRefused("output_review_unavailable") from exc
        if not isinstance(verdict, ReviewVerdict) or not _reviewed(verdict):
            raise GenerationRefused("output_review_refused")
        # A visible, bounded simulation label remains in every released scene.
        canvas = Image.new("RGB", image.size, (255, 255, 255))
        canvas.paste(image)
        footer_height = min(max(24, height // 24), 52)
        painter = ImageDraw.Draw(canvas)
        painter.rectangle((0, height - footer_height, width, height), fill=(20, 22, 34))
        painter.text((12, height - footer_height + 8), "BELJOUR | Generated scene - simulation", fill="white")
        buffer = io.BytesIO()
        canvas.save(buffer, "PNG", optimize=False)
        encoded = buffer.getvalue()
        if len(encoded) > MAX_ENCODED_BYTES:
            raise GenerationRefused("generated_image_size_limit")
        return encoded, verdict.reviewer_digest
    except (OSError, SyntaxError, ValueError) as exc:
        if isinstance(exc, GenerationRefused):
            raise
        raise GenerationRefused("invalid_generated_image") from exc
