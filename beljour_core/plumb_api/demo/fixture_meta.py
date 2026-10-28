"""Versioned metadata for the approved makeup and hair styling demo fixtures.

R14 removes every retired analysis and reshape fixture. Recording or migrating a
non-styling result is now refused, so an old recorder cannot silently reintroduce it.
The approved Skin AI flow operates on the visitor's photo with consent; it does not
reuse a stored skin score from a demo face. Author: John Khan.
"""
from __future__ import annotations

from typing import Any

from ..pipeline import endpoint_version
from ..providers.youcam import STYLING

META_VERSION = 2
STATUSES = ("active",)
FIELDS = ("meta_version", "endpoint", "endpoint_version", "provider", "status")


def describe(feature: str) -> dict[str, Any]:
    if feature not in STYLING:
        raise ValueError("only approved makeup and hair styling results may be demo fixtures")
    return {"meta_version": META_VERSION, "endpoint": feature,
            "endpoint_version": endpoint_version(feature), "provider": "youcam", "status": "active"}


def migrate(meta: dict[str, Any]) -> dict[str, Any]:
    out = {key: value for key, value in meta.items() if key not in FIELDS and key != "replaced_in"}
    out.update(describe(str(meta.get("feature", ""))))
    return out


def problems(meta: dict[str, Any]) -> list[str]:
    feature = meta.get("feature")
    if not isinstance(feature, str) or not feature:
        return ["missing feature"]
    try:
        expected = describe(feature)
    except ValueError as exc:
        return [str(exc)]
    found = [f"{key} should be {value!r}, found {meta.get(key)!r}"
             for key, value in expected.items() if meta.get(key) != value]
    if "replaced_in" in meta:
        found.append("retired fixture metadata is not allowed")
    return found
