"""Where every image and number came from, so the badge can say it plainly.

Three sources, matching the badge in the web app:
  * live      a YouCam result made for this request (or an earlier identical request,
              served from the cache at no cost)
  * recorded  a saved YouCam result from the demo pack (no units used)
  * local     made by our own code on our server or in the browser, no YouCam call

A recorded or cached result can also be `synthetic`: made up by the offline stand-in for
demos and tests, never a real YouCam output. The badge says so.

Author: John Khan.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from typing import Literal

from .pipeline import endpoint_version, pipeline_version

Source = Literal["live", "recorded", "local"]

BADGES: dict[str, str] = {
    "live": "Live result",
    "recorded": "Recorded API example",
    "local": "Local simulation",
    "synthetic": "Sample, not a real result",
}

PROVIDERS = ("youcam", "local")
REPLACED_FEATURES = frozenset({"skin-analysis", "skin-tone-analysis", "face-attr-analysis",
    "face-reshape", "face-lift", "skin-simulation", "aging", "teeth-whiten"})


@dataclass(frozen=True)
class Provenance:
    source: Source
    provider: str                 # "youcam" or "local"
    endpoint: str | None          # e.g. "makeup-vto", or a local step name such as "local-warp"
    endpoint_version: str | None
    pipeline_version: str
    units: int                    # units this request spent (0 for cache hits and recordings)
    cache_hit: bool
    synthetic: bool
    created: str | None           # ISO 8601 date the result was first made, UTC
    badge: str
    simulation: bool = False      # true for edits that change how a face or body looks

    def to_json(self) -> dict:
        return asdict(self)


def _iso(ts: float | None) -> str | None:
    if not ts:
        return None
    return datetime.fromtimestamp(ts, tz=UTC).date().isoformat()


def badge_for(source: str, synthetic: bool) -> str:
    if synthetic:
        return BADGES["synthetic"]
    return BADGES.get(source, BADGES["local"])


def from_cache_source(cache_source: str, feature: str, *, units: int, created: float | None,
                      synthetic: bool, simulation: bool = False,
                      status: str | None = None) -> Provenance:
    """Map ResultCache's source ("live", "cache", "demo", "local") onto the three badges.

    Recorded results are accepted only for active styling fixtures. Retired examples
    cannot acquire a local badge merely by changing their metadata."""
    if cache_source in ("live", "cache"):
        source: Source = "live"
    elif cache_source == "demo":
        source = "recorded"
    elif cache_source == "local":
        source = "local"
    else:
        raise ValueError(f"unknown result source {cache_source!r}")
    spent = units if cache_source == "live" else 0
    if status not in (None, "active"):
        raise ValueError("retired recorded results are not available")
    if source == "recorded" and feature in REPLACED_FEATURES:
        raise ValueError("retired recorded results are not available")
    provider = "local" if source == "local" else "youcam"
    return Provenance(
        source=source,
        provider=provider,
        endpoint=feature,
        endpoint_version=None if provider == "local" else endpoint_version(feature),
        pipeline_version=pipeline_version(feature),
        units=spent,
        cache_hit=cache_source == "cache",
        synthetic=synthetic,
        created=_iso(created),
        badge=badge_for(source, synthetic),
        simulation=simulation,
    )


def local(step: str, *, simulation: bool = True, created: float | None = None) -> Provenance:
    """For results our own code makes (warps, overlays, resizes)."""
    return Provenance(
        source="local", provider="local", endpoint=step, endpoint_version=None,
        pipeline_version=pipeline_version(step), units=0, cache_hit=False, synthetic=False,
        created=_iso(created), badge=BADGES["local"], simulation=simulation,
    )


def combine(steps: list[Provenance]) -> Provenance:
    """A chained result (YouCam step, then a local step) takes the most external source:
    live beats recorded beats local. Units add up; synthetic if any step was."""
    if not steps:
        raise ValueError("nothing to combine")
    order = {"live": 0, "recorded": 1, "local": 2}
    lead = min(steps, key=lambda p: order[p.source])
    synthetic = any(p.synthetic for p in steps)
    return Provenance(
        source=lead.source,
        provider=lead.provider,
        endpoint="+".join(p.endpoint or "?" for p in steps),
        endpoint_version=lead.endpoint_version,
        pipeline_version=lead.pipeline_version,
        units=sum(p.units for p in steps),
        cache_hit=all(p.cache_hit for p in steps if p.provider == "youcam") and any(p.provider == "youcam" for p in steps),
        synthetic=synthetic,
        created=max((p.created for p in steps if p.created), default=None),
        badge=badge_for(lead.source, synthetic),
        simulation=any(p.simulation for p in steps),
    )


# Features whose output changes how a face or body looks. Their images carry the
# simulation label and their provenance says so.
SIMULATION_FEATURES = frozenset({
    "face-reshape", "face-lift", "skin-simulation", "aging", "local-warp", "hair-style",
    "hair-bang", "hair-curl", "hair-extension", "hair-volume",
})


def is_simulation(feature: str) -> bool:
    return any(part in SIMULATION_FEATURES for part in feature.split("+"))
