"""R18B privacy-safe serialization for local upscale calibration. Author: John Khan.

Only timing and memory summaries are stored. Raw samples, photographs, masks,
landmarks, filenames, browser identifiers and network-derived values are never
part of this format.
"""
from __future__ import annotations

import hashlib
import json
import math
from dataclasses import asdict, dataclass

from .device_profile import SCHEMA as PROFILE_SCHEMA
from .device_profile import DeviceProfile, RobustRate

STORE_SCHEMA = "beljour.r18b.upscale-profile-store.v1"


@dataclass(frozen=True)
class StoredProfile:
    schema: str
    profile_schema: str
    sample_count: int
    observed_peak_mb: float
    preview: dict[str, float | int] | None
    export: dict[str, float | int] | None
    profile_sha256: str
    payload_sha256: str

    def validate(self) -> None:
        if self.schema != STORE_SCHEMA:
            raise ValueError("unsupported store schema")
        if self.profile_schema != PROFILE_SCHEMA:
            raise ValueError("unsupported profile schema")
        if self.sample_count < 1:
            raise ValueError("sample_count must be positive")
        if not math.isfinite(self.observed_peak_mb) or self.observed_peak_mb <= 0:
            raise ValueError("observed_peak_mb must be positive finite")
        for digest in (self.profile_sha256, self.payload_sha256):
            if len(digest) != 64 or any(char not in "0123456789abcdef" for char in digest):
                raise ValueError("invalid SHA-256")
        if self.preview is None and self.export is None:
            raise ValueError("stored profile requires a rate")
        for rate in (self.preview, self.export):
            if rate is not None:
                _validate_rate_mapping(rate)


def _rate_mapping(rate: RobustRate | None) -> dict[str, float | int] | None:
    if rate is None:
        return None
    rate.validate()
    return {
        "sample_count": rate.sample_count,
        "kept_count": rate.kept_count,
        "median_ms_per_mp": rate.median_ms_per_mp,
        "mad_ms_per_mp": rate.mad_ms_per_mp,
        "p90_ms_per_mp": rate.p90_ms_per_mp,
        "minimum_ms_per_mp": rate.minimum_ms_per_mp,
        "maximum_ms_per_mp": rate.maximum_ms_per_mp,
    }


def _validate_rate_mapping(mapping: dict[str, float | int]) -> None:
    required = {
        "sample_count",
        "kept_count",
        "median_ms_per_mp",
        "mad_ms_per_mp",
        "p90_ms_per_mp",
        "minimum_ms_per_mp",
        "maximum_ms_per_mp",
    }
    if set(mapping) != required:
        raise ValueError("invalid rate fields")
    sample_count = mapping["sample_count"]
    kept_count = mapping["kept_count"]
    if not isinstance(sample_count, int) or not isinstance(kept_count, int):
        raise ValueError("rate counts must be integers")
    if sample_count < 1 or kept_count < 1 or kept_count > sample_count:
        raise ValueError("invalid rate counts")
    for key in required - {"sample_count", "kept_count"}:
        value = mapping[key]
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError("rate metrics must be numeric")
        if not math.isfinite(float(value)) or float(value) < 0:
            raise ValueError("rate metrics must be finite non-negative")


def _rate_from_mapping(mapping: dict[str, float | int] | None) -> RobustRate | None:
    if mapping is None:
        return None
    _validate_rate_mapping(mapping)
    result = RobustRate(
        sample_count=int(mapping["sample_count"]),
        kept_count=int(mapping["kept_count"]),
        median_ms_per_mp=float(mapping["median_ms_per_mp"]),
        mad_ms_per_mp=float(mapping["mad_ms_per_mp"]),
        p90_ms_per_mp=float(mapping["p90_ms_per_mp"]),
        minimum_ms_per_mp=float(mapping["minimum_ms_per_mp"]),
        maximum_ms_per_mp=float(mapping["maximum_ms_per_mp"]),
    )
    result.validate()
    return result


def _unsigned_payload(
    *,
    sample_count: int,
    observed_peak_mb: float,
    preview: dict[str, float | int] | None,
    export: dict[str, float | int] | None,
    profile_sha256: str,
) -> dict[str, object]:
    return {
        "schema": STORE_SCHEMA,
        "profile_schema": PROFILE_SCHEMA,
        "sample_count": sample_count,
        "observed_peak_mb": observed_peak_mb,
        "preview": preview,
        "export": export,
        "profile_sha256": profile_sha256,
    }


def _canonical_unsigned(payload: dict[str, object]) -> str:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), allow_nan=False)


def store(profile: DeviceProfile) -> StoredProfile:
    profile.validate()
    preview = _rate_mapping(profile.preview_rate)
    export = _rate_mapping(profile.export_rate)
    unsigned = _unsigned_payload(
        sample_count=profile.sample_count,
        observed_peak_mb=profile.observed_peak_mb,
        preview=preview,
        export=export,
        profile_sha256=profile.profile_sha256,
    )
    digest = hashlib.sha256(_canonical_unsigned(unsigned).encode("utf-8")).hexdigest()
    result = StoredProfile(
        schema=STORE_SCHEMA,
        profile_schema=PROFILE_SCHEMA,
        sample_count=profile.sample_count,
        observed_peak_mb=profile.observed_peak_mb,
        preview=preview,
        export=export,
        profile_sha256=profile.profile_sha256,
        payload_sha256=digest,
    )
    result.validate()
    return result


def encode(stored: StoredProfile) -> str:
    stored.validate()
    return json.dumps(asdict(stored), sort_keys=True, separators=(",", ":"), allow_nan=False)


def decode(text: str) -> StoredProfile:
    try:
        payload = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError("invalid calibration JSON") from exc
    if not isinstance(payload, dict):
        raise ValueError("calibration payload must be an object")
    required = {
        "schema",
        "profile_schema",
        "sample_count",
        "observed_peak_mb",
        "preview",
        "export",
        "profile_sha256",
        "payload_sha256",
    }
    if set(payload) != required:
        raise ValueError("unexpected calibration fields")
    preview = payload["preview"]
    export = payload["export"]
    if preview is not None and not isinstance(preview, dict):
        raise ValueError("preview rate must be an object or null")
    if export is not None and not isinstance(export, dict):
        raise ValueError("export rate must be an object or null")
    result = StoredProfile(
        schema=str(payload["schema"]),
        profile_schema=str(payload["profile_schema"]),
        sample_count=int(payload["sample_count"]),
        observed_peak_mb=float(payload["observed_peak_mb"]),
        preview=dict(preview) if isinstance(preview, dict) else None,
        export=dict(export) if isinstance(export, dict) else None,
        profile_sha256=str(payload["profile_sha256"]),
        payload_sha256=str(payload["payload_sha256"]),
    )
    result.validate()
    unsigned = _unsigned_payload(
        sample_count=result.sample_count,
        observed_peak_mb=result.observed_peak_mb,
        preview=result.preview,
        export=result.export,
        profile_sha256=result.profile_sha256,
    )
    expected = hashlib.sha256(_canonical_unsigned(unsigned).encode("utf-8")).hexdigest()
    if expected != result.payload_sha256:
        raise ValueError("calibration payload checksum mismatch")
    return result


def restore(stored: StoredProfile) -> DeviceProfile:
    stored.validate()
    unsigned = _unsigned_payload(
        sample_count=stored.sample_count,
        observed_peak_mb=stored.observed_peak_mb,
        preview=stored.preview,
        export=stored.export,
        profile_sha256=stored.profile_sha256,
    )
    expected = hashlib.sha256(_canonical_unsigned(unsigned).encode("utf-8")).hexdigest()
    if expected != stored.payload_sha256:
        raise ValueError("calibration payload checksum mismatch")
    profile = DeviceProfile(
        schema=stored.profile_schema,
        preview_rate=_rate_from_mapping(stored.preview),
        export_rate=_rate_from_mapping(stored.export),
        observed_peak_mb=stored.observed_peak_mb,
        sample_count=stored.sample_count,
        profile_sha256=stored.profile_sha256,
    )
    profile.validate()
    return profile


def safe_keys() -> tuple[str, ...]:
    return (
        "schema",
        "profile_schema",
        "sample_count",
        "observed_peak_mb",
        "preview",
        "export",
        "profile_sha256",
        "payload_sha256",
    )
