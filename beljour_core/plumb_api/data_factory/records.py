"""ImageRecord: one image in a data factory set, with its declared metadata.

A record names the image by its content SHA-256 and carries the source, the
licence id (SPDX style), attribution, the commercial-use and consent flags and
optional declared attributes. Declared attributes are only ever copied from
the source metadata. Nothing in this package infers them from pixels.
Author: John Khan.
"""

from __future__ import annotations

import re
from collections.abc import Mapping
from dataclasses import dataclass, replace
from typing import Any

from .hashing import is_sha256

RECORD_SCHEMA = "beljour-data-record/1"

AGE_BANDS: tuple[str, ...] = (
    "18-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70+",
)
SKIN_TONE_GROUPS: tuple[str, ...] = tuple(f"tone-{index:02d}" for index in range(1, 11))
LIGHTING: tuple[str, ...] = ("studio", "indoor", "outdoor", "low-light", "mixed")
POSE_BUCKETS: tuple[str, ...] = (
    "frontal", "left-quarter", "right-quarter", "left-profile", "right-profile",
    "up", "down",
)

DECLARED_ATTRIBUTES: dict[str, tuple[str, ...]] = {
    "age_band": AGE_BANDS,
    "skin_tone_group": SKIN_TONE_GROUPS,
    "lighting": LIGHTING,
    "pose_bucket": POSE_BUCKETS,
}

LICENCE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9.+\- ]{0,79}$")
CONTROL_CHARS = re.compile(r"[\x00-\x1f]")
REL_PATH_BAD = re.compile(r"(^/|\\|^\.\.?/|/\.\.?/|/\.\.?$|^\.\.?$|//)")
MAX_TEXT = 500

REQUIRED_FIELDS = ("content_sha256", "source", "licence", "attribution",
                   "commercial_use", "consent")
OPTIONAL_FIELDS = ("path", "width", "height", "face_box") + tuple(DECLARED_ATTRIBUTES)
ALL_FIELDS = frozenset(REQUIRED_FIELDS + OPTIONAL_FIELDS)


class RecordError(ValueError):
    """A record failed validation. `problems` lists every field-level issue."""

    def __init__(self, problems: list[str]) -> None:
        self.problems = list(problems)
        super().__init__("invalid image record: " + "; ".join(self.problems))


@dataclass(frozen=True)
class FaceBox:
    """Face box in pixels, as supplied by the source. Never detected here."""

    x: int
    y: int
    width: int
    height: int

    def to_list(self) -> list[int]:
        """Compact [x, y, width, height] form used in manifests."""
        return [self.x, self.y, self.width, self.height]


@dataclass(frozen=True)
class ImageRecord:
    """One image with licence evidence and optional declared attributes."""

    content_sha256: str
    source: str
    licence: str
    attribution: str
    commercial_use: bool
    consent: bool
    path: str | None = None
    width: int | None = None
    height: int | None = None
    face_box: FaceBox | None = None
    age_band: str | None = None
    skin_tone_group: str | None = None
    lighting: str | None = None
    pose_bucket: str | None = None

    def declared(self, attribute: str) -> str | None:
        """Declared value of one attribute, or None when the source gave none."""
        if attribute not in DECLARED_ATTRIBUTES:
            raise KeyError(f"unknown declared attribute: {attribute}")
        value = getattr(self, attribute)
        return value if isinstance(value, str) else None

    def to_dict(self) -> dict[str, Any]:
        """Plain dict with only the fields that are set, for JSON output."""
        out: dict[str, Any] = {
            "content_sha256": self.content_sha256,
            "source": self.source,
            "licence": self.licence,
            "attribution": self.attribution,
            "commercial_use": self.commercial_use,
            "consent": self.consent,
        }
        for name in ("path", "width", "height") + tuple(DECLARED_ATTRIBUTES):
            value = getattr(self, name)
            if value is not None:
                out[name] = value
        if self.face_box is not None:
            out["face_box"] = self.face_box.to_list()
        return out

    def with_hash(self, content_sha256: str) -> ImageRecord:
        """Copy with a new content hash (used after metadata stripping)."""
        return replace(self, content_sha256=content_sha256)

    def with_size(self, width: int, height: int) -> ImageRecord:
        """Copy with measured pixel dimensions."""
        return replace(self, width=width, height=height)

    @classmethod
    def from_dict(cls, raw: Mapping[str, Any], *, require_hash: bool = True) -> ImageRecord:
        """Validate and build a record. Raises RecordError with every problem."""
        problems = validate_record(raw, require_hash=require_hash)
        if problems:
            raise RecordError(problems)
        box = raw.get("face_box")
        face_box = None
        if box is not None:
            face_box = FaceBox(int(box[0]), int(box[1]), int(box[2]), int(box[3]))
        return cls(
            content_sha256=str(raw.get("content_sha256") or ""),
            source=str(raw["source"]).strip(),
            licence=str(raw["licence"]).strip(),
            attribution=str(raw["attribution"]).strip(),
            commercial_use=bool(raw["commercial_use"]),
            consent=bool(raw["consent"]),
            path=_optional_str(raw.get("path")),
            width=_optional_int(raw.get("width")),
            height=_optional_int(raw.get("height")),
            face_box=face_box,
            age_band=_optional_str(raw.get("age_band")),
            skin_tone_group=_optional_str(raw.get("skin_tone_group")),
            lighting=_optional_str(raw.get("lighting")),
            pose_bucket=_optional_str(raw.get("pose_bucket")),
        )


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _optional_int(value: Any) -> int | None:
    return None if value is None else int(value)


def _is_int(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool)


def _check_text(raw: Mapping[str, Any], name: str, problems: list[str], *,
                allow_empty: bool = False) -> None:
    value = raw.get(name)
    if value is None:
        problems.append(f"{name}: missing")
        return
    if not isinstance(value, str):
        problems.append(f"{name}: must be text")
        return
    if not allow_empty and not value.strip():
        problems.append(f"{name}: must not be empty")
    if len(value) > MAX_TEXT:
        problems.append(f"{name}: longer than {MAX_TEXT} characters")
    if CONTROL_CHARS.search(value):
        problems.append(f"{name}: contains control characters")


def _check_flag(raw: Mapping[str, Any], name: str, problems: list[str]) -> None:
    if name not in raw:
        problems.append(f"{name}: missing")
    elif not isinstance(raw[name], bool):
        problems.append(f"{name}: must be true or false")


def _check_path(value: Any, problems: list[str]) -> None:
    if not isinstance(value, str) or not value:
        problems.append("path: must be non-empty text")
        return
    if REL_PATH_BAD.search(value) or CONTROL_CHARS.search(value):
        problems.append("path: must be a safe relative POSIX path")


def _check_dimension(raw: Mapping[str, Any], name: str, problems: list[str]) -> None:
    value = raw.get(name)
    if value is not None and (not _is_int(value) or value < 1):
        problems.append(f"{name}: must be a positive integer")


def _check_face_box(raw: Mapping[str, Any], problems: list[str]) -> None:
    box = raw.get("face_box")
    if box is None:
        return
    if not isinstance(box, (list, tuple)) or len(box) != 4 or not all(_is_int(v) for v in box):
        problems.append("face_box: must be [x, y, width, height] integers")
        return
    x, y, width, height = box
    if x < 0 or y < 0 or width < 1 or height < 1:
        problems.append("face_box: origin must be >= 0 and size >= 1")
        return
    image_w, image_h = raw.get("width"), raw.get("height")
    if _is_int(image_w) and _is_int(image_h) and (x + width > image_w or y + height > image_h):
        problems.append("face_box: extends outside the image")


def validate_record(raw: Mapping[str, Any], *, require_hash: bool = True) -> list[str]:
    """Every problem with a raw record dict; an empty list means valid."""
    if not isinstance(raw, Mapping):
        return ["record: must be a JSON object"]
    problems: list[str] = []
    unknown = sorted(str(key) for key in raw if key not in ALL_FIELDS)
    if unknown:
        problems.append("unknown fields: " + ", ".join(unknown))
    digest = raw.get("content_sha256")
    if digest is None or digest == "":
        if require_hash:
            problems.append("content_sha256: missing")
    elif not is_sha256(digest):
        problems.append("content_sha256: must be 64 lower-case hex digits")
    _check_text(raw, "source", problems)
    licence = raw.get("licence")
    if licence is None or (isinstance(licence, str) and not licence.strip()):
        problems.append("licence: missing")
    elif not isinstance(licence, str) or not LICENCE_ID.fullmatch(licence.strip()):
        problems.append("licence: must be an SPDX-style licence id")
    _check_text(raw, "attribution", problems, allow_empty=True)
    _check_flag(raw, "commercial_use", problems)
    _check_flag(raw, "consent", problems)
    if raw.get("path") is not None:
        _check_path(raw.get("path"), problems)
    _check_dimension(raw, "width", problems)
    _check_dimension(raw, "height", problems)
    _check_face_box(raw, problems)
    for name, allowed in DECLARED_ATTRIBUTES.items():
        value = raw.get(name)
        if value is None:
            continue
        if not isinstance(value, str) or value.strip() not in allowed:
            problems.append(f"{name}: must be one of {', '.join(allowed)}")
    return problems


def record_key(record: ImageRecord) -> str:
    """Identity used across stages: the content hash."""
    return record.content_sha256
