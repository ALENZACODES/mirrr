"""W74 user-selected hypothetical trajectories and a local measurement diary.

There are no empirical serum-effect estimates in this module. The default assumed
change is zero. The curve is an illustration of the user's input, never a claim
about a named product or typical response. Author: John Khan.
"""
from __future__ import annotations

import datetime as dt
import math
from typing import Any

import numpy as np

from .contracts import BrowEvidence, BrowResult, choice, finish, number, options
from .evidence import evidence_summary
from .geometry import BrowFrame, union

SAFETY_NOTE = ("Some prostaglandin analogue products can cause eyelid darkening and iris pigmentation changes. "
               "Ask a qualified professional about ingredients and risks.")
SAFETY_SOURCE = "https://www.accessdata.fda.gov/drugsatfda_docs/label/2021/022369s014lbl.pdf"
SCENARIO_NOTE = ("Hypothetical changes chosen by you. There is no product efficacy estimate here; "
                 "your result may differ. This is not medical advice.")


def progress_series(settings: dict[str, Any] | None = None) -> dict[str, Any]:
    opts = options(settings, {"amount", "months", "lengthChange", "densityChange", "site", "baselineLength", "baselineDensity"})
    months = number(opts.get("months", 6), "months", 0, 12)
    if months != int(months):
        raise ValueError("months must be an integer")
    length = number(opts.get("lengthChange", 0), "lengthChange", -20, 30)
    density = number(opts.get("densityChange", 0), "densityChange", -20, 30)
    site = choice(opts.get("site", "brows"), "site", ("brows", "lashes"))
    baseline_length = number(opts.get("baselineLength", 1), "baselineLength", 0.1, 30)
    baseline_density = number(opts.get("baselineDensity", 1), "baselineDensity", 0, 1000)
    rows = []
    for month in range(int(months) + 1):
        t = month / max(1, int(months))
        fraction = t * t * (3 - 2 * t)
        length_scale = 1 + length / 100 * fraction
        density_scale = 1 + density / 100 * fraction
        rows.append({"month": month, "length_scale": length_scale, "density_scale": density_scale,
                     "length_from_user_baseline": baseline_length * length_scale,
                     "density_from_user_baseline": baseline_density * density_scale})
    return {"site": site, "assumed": True, "empirical": False, "rows": rows,
            "endpoint_length_change_pct": length, "endpoint_density_change_pct": density,
            "baseline_units": "user supplied; unit consistency required",
            "note": SCENARIO_NOTE, "safety_note": SAFETY_NOTE, "safety_source": SAFETY_SOURCE}


def validate_diary(entries: Any) -> list[dict[str, Any]]:
    """Bounded measurements only: no image, identifier, product or free-text fields."""
    if not isinstance(entries, list) or len(entries) > 120:
        raise ValueError("diary must contain at most 120 observations")
    out = []
    dates: set[str] = set()
    for entry in entries:
        if not isinstance(entry, dict) or set(entry) - {"date", "site", "length", "density", "confidence"}:
            raise ValueError("unknown diary field")
        if not isinstance(entry.get("date"), str):
            raise ValueError("diary date must be YYYY-MM-DD")
        try:
            date = dt.date.fromisoformat(entry["date"])
        except ValueError as exc:
            raise ValueError("diary date must be YYYY-MM-DD") from exc
        if date.isoformat() != entry["date"]:
            raise ValueError("diary date must be YYYY-MM-DD")
        site = choice(entry.get("site"), "site", ("brows", "lashes"))
        key = f"{date.isoformat()}:{site}"
        if key in dates:
            raise ValueError("duplicate diary date and site")
        dates.add(key)
        out.append({"date": date.isoformat(), "site": site,
                    "length": number(entry.get("length"), "length", 0, 30),
                    "density": number(entry.get("density"), "density", 0, 1000),
                    "confidence": number(entry.get("confidence", 1), "confidence", 0, 1)})
    return sorted(out, key=lambda item: (item["date"], item["site"]))


def diary_trend(entries: Any, site: str = "brows") -> dict[str, Any]:
    choice(site, "site", ("brows", "lashes"))
    selected = [entry for entry in validate_diary(entries) if entry["site"] == site]
    if len(selected) < 2:
        return {"status": "insufficient", "observations": len(selected), "attribution": False}
    first, last = selected[0], selected[-1]
    days = (dt.date.fromisoformat(last["date"]) - dt.date.fromisoformat(first["date"])).days
    return {"status": "observed", "observations": len(selected), "days": days,
            "length_change": last["length"] - first["length"],
            "density_change": last["density"] - first["density"],
            "minimum_confidence": min(entry["confidence"] for entry in selected),
            "attribution": False,
            "note": "Measurement changes can reflect angle, lighting or technique. They do not establish a product effect."}


def render_progress(image: np.ndarray, evidence: BrowEvidence, frames: tuple[BrowFrame, BrowFrame],
                    settings: dict[str, Any] | None = None) -> BrowResult:
    series = progress_series(settings)
    if settings is not None:
        number(settings.get("amount", 0.5), "amount", 0, 1)
    metrics = evidence_summary(evidence, union(frames))
    final = series["rows"][-1]
    metrics.update(feature="W74", efficacy_claim=False, hypothetical=True,
                   length_scale=final["length_scale"], density_scale=final["density_scale"],
                   photo_prediction=False, diary_local_only=True)
    # Display the unchanged photo alongside the numerical trajectory. Without a
    # measured strand annotation, synthesising photographic growth is dishonest.
    return finish(image, image.copy(), np.zeros(image.shape[:2], dtype=float), metrics,
                  warnings=(SCENARIO_NOTE, SAFETY_NOTE,
                            "The photo stays unchanged. The trajectory is a numerical scenario, not a simulated treatment outcome."),
                  details=series)


def compare_measurement(a: float, b: float, *, relative_tolerance: float = 0.05) -> bool:
    """A diary consistency aid, with an explicit user-selected tolerance."""
    first = number(a, "first measurement", 0, 1000)
    second = number(b, "second measurement", 0, 1000)
    tolerance = number(relative_tolerance, "relative_tolerance", 0, 1)
    return math.isclose(first, second, rel_tol=tolerance, abs_tol=1e-12)
