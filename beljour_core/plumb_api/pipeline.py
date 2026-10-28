"""Pipeline versions: one string per feature that changes whenever our recipe for it changes.

The version is part of cache key v2, so bumping it here makes every older cached result for
that feature a miss. Bump the date part and reset the counter, for example
"2026.10.22-1" -> "2026.10.24-1", or bump the counter for a second change on the same day.

Author: John Khan.
"""
from __future__ import annotations

import re

DEFAULT_VERSION = "2026.10.22-1"

# Only list a feature here when its recipe has changed from the default.
PIPELINE_VERSIONS: dict[str, str] = {}

ENDPOINT_VERSIONS: dict[str, str] = {
    # YouCam endpoint version used in the task path, /s2s/<version>/task/<feature>
    "default": "v2.0",
    "hair-transfer": "v2.1",  # reference-hair styling spike S2; endpoint still needs live verification
}

_VERSION = re.compile(r"^\d{4}\.\d{2}\.\d{2}-\d+$")


def pipeline_version(feature: str) -> str:
    return PIPELINE_VERSIONS.get(feature, DEFAULT_VERSION)


def endpoint_version(feature: str) -> str:
    return ENDPOINT_VERSIONS.get(feature, ENDPOINT_VERSIONS["default"])


def valid_version(value: str) -> bool:
    return bool(_VERSION.match(value))


def all_versions() -> dict[str, str]:
    """For /api/health and the provenance badge: every non-default version, plus the default."""
    return {"default": DEFAULT_VERSION, **PIPELINE_VERSIONS}
