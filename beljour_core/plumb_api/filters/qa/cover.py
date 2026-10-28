"""Ivy Cover Test for synthetic filters, separate from real-face evidence.

A cover-grade look keeps fine details, does not repaint a person's skin hue,
retains clean neutral whites and gives a measurable but restrained colour grade.
The fixture supplies a white studio card, a marked face and real gradients.
These proxy thresholds are release criteria only for the drawn fixture. Every
filter still needs the frozen real-face gate before a public quality claim.
Created by John Khan.
"""
from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from math import isfinite
from typing import Any

import numpy as np
from numpy.typing import NDArray

from .. import engine
from ..colour import space as S
from ..masks.blend import FilterMasks
from ..recipe import registry, schema
from . import fixtures

U8 = NDArray[np.uint8]
Bool = NDArray[np.bool_]

# Studio-card neutrality is measured in byte channels, not white balance alone.
WHITE_MIN = 188.0
WHITE_SPREAD_MAX = 15.0
TEXTURE_MIN = 0.62
TEXTURE_MAX = 1.85
# Structural identity proxies on drawn fixture gradients, not biometric scores.
IDENTITY_DRIFT_MAX = 0.42
TEXTURE_ALIGNMENT_MIN = 0.58
HUE_TURN_MAX = 6.0
CHROMA_KEEP_MIN = 0.82
LIFT_MIN = 0.25
LIFT_MAX = 32.0
TONE_NAMES = ("very_light", "light", "medium", "tan", "dark", "very_dark")


@dataclass(frozen=True)
class CoverMetrics:
    """Measured properties of a local, synthetic, identity-locked filter render."""

    texture_ratio: float
    hue_turn: float
    chroma_ratio: float
    white_level: float
    white_spread: float
    editorial_lift: float
    white_pixels: int
    skin_pixels: int
    texture_edges: int
    identity_drift: float = 0.0
    texture_alignment: float = 1.0


@dataclass(frozen=True)
class CoverResult:
    filter_id: str
    family: str
    light: str
    tone: str
    metrics: CoverMetrics
    problems: tuple[str, ...]

    @property
    def passed(self) -> bool:
        return not self.problems


def control_photo(tone: str, *, width: int = 80, height: int = 96) -> tuple[U8, FilterMasks, Bool]:
    """Put a neutral white card only into known background of a drawn face.

    The card belongs to the QA input, never a saved filter or a user's picture.
    A failing shape or missing background is an error, not a vacuous pass.
    """
    face = fixtures.portrait(tone, seed=7, width=width, height=height, grain=5.5)
    img = face.image.copy()
    person = face.masks.person
    if person is None:
        raise ValueError("the Cover Test requires a person outline")
    yy, xx = np.indices(img.shape[:2])
    white = (person < 0.01) & (yy < height // 3) & (xx < width // 3)
    if int(np.count_nonzero(white)) < 12:
        white = (person < 0.01) & (yy < height // 4)
    if int(np.count_nonzero(white)) < 12:
        raise ValueError("the Cover Test needs at least twelve clean background pixels")
    img[white] = 244
    return img, face.masks, white


def _texture(original: U8, edited: U8, skin: Bool) -> tuple[float, int]:
    first = original.astype(np.float64).mean(axis=2)
    final = edited.astype(np.float64).mean(axis=2)
    before: list[NDArray[np.float64]] = []
    after: list[NDArray[np.float64]] = []
    for axis in (0, 1):
        paired = np.take(skin, range(1, skin.shape[axis]), axis=axis)
        paired &= np.take(skin, range(skin.shape[axis] - 1), axis=axis)
        a = np.abs(np.diff(first, axis=axis))
        b = np.abs(np.diff(final, axis=axis))
        useful = paired & (a >= 1.5)
        before.append(a[useful])
        after.append(b[useful])
    old = np.concatenate(before)
    new = np.concatenate(after)
    if old.size < 12:
        raise ValueError("insufficient in-skin texture edges for the Cover Test")
    return float(new.mean() / old.mean()), int(old.size)


def _skin_colour(original: U8, edited: U8, skin: Bool) -> tuple[float, float]:
    a = S.srgb_to_oklab(S.bytes_to_unit(original))[skin]
    b = S.srgb_to_oklab(S.bytes_to_unit(edited))[skin]
    chroma_a = np.hypot(a[:, 1], a[:, 2])
    chroma_b = np.hypot(b[:, 1], b[:, 2])
    mean_chroma = float(chroma_b.mean() / max(1e-6, chroma_a.mean()))
    valid = chroma_a >= 0.018
    if not np.any(valid):
        return 0.0, mean_chroma
    radians = np.arctan2(b[valid, 2], b[valid, 1]) - np.arctan2(a[valid, 2], a[valid, 1])
    degrees = np.abs(np.degrees(np.arctan2(np.sin(radians), np.cos(radians))))
    return float(np.average(degrees, weights=chroma_a[valid])), mean_chroma


def _structure(original: U8, edited: U8, skin: Bool) -> tuple[float, float]:
    """Compare corresponding facial detail edges after global tone adjustments.

    Edge orientation is largely invariant to colour grading, so mismatched
    features, local displacement, heavy blur or swapped texture reduce
    alignment. This is a synthetic structure proxy, never identity recognition.
    """
    before = original.astype(np.float64).mean(axis=2)
    after = edited.astype(np.float64).mean(axis=2)
    components_a: list[NDArray[np.float64]] = []
    components_b: list[NDArray[np.float64]] = []
    for axis in (0, 1):
        inside = (np.take(skin, range(1, skin.shape[axis]), axis=axis)
                  & np.take(skin, range(skin.shape[axis] - 1), axis=axis))
        a = np.diff(before, axis=axis)[inside]
        b = np.diff(after, axis=axis)[inside]
        strong = np.abs(a) >= 1.5
        components_a.append(a[strong])
        components_b.append(b[strong])
    original_edges = np.concatenate(components_a)
    output_edges = np.concatenate(components_b)
    if original_edges.size < 12:
        raise ValueError("insufficient structure evidence")
    mag_a = float(np.linalg.norm(original_edges))
    mag_b = float(np.linalg.norm(output_edges))
    if mag_a < 1e-6 or mag_b < 1e-6:
        return 1.0, 0.0
    alignment = float(np.clip(np.dot(original_edges, output_edges) / (mag_a * mag_b), -1, 1))
    return max(0.0, 1.0 - alignment), alignment


def measure(original: U8, edited: U8, masks: FilterMasks, white: Bool) -> CoverMetrics:
    """Fail closed on missing colour controls, skin masks or invalid outputs."""
    if original.dtype != np.uint8 or edited.dtype != np.uint8 or original.shape != edited.shape:
        raise ValueError("the Cover Test requires matching uint8 inputs and outputs")
    if original.ndim != 3 or original.shape[2] != 3:
        raise ValueError("the Cover Test requires three-channel RGB")
    if white.dtype != np.bool_ or white.shape != original.shape[:2]:
        raise ValueError("the Cover Test requires a boolean white-card mask")
    if masks.skin is None or masks.skin.shape != white.shape:
        raise ValueError("the Cover Test requires a skin mask")
    if not np.all(np.isfinite(masks.skin)):
        raise ValueError("the Cover Test skin mask must be finite")
    skin = masks.skin >= 0.75
    if int(np.count_nonzero(skin)) < 20 or int(np.count_nonzero(white)) < 12:
        raise ValueError("the Cover Test requires enough skin and white-card pixels")
    if np.any(white & skin):
        raise ValueError("white control pixels must lie outside the face")
    texture, edges = _texture(original, edited, skin)
    hue_turn, chroma_ratio = _skin_colour(original, edited, skin)
    drift, alignment = _structure(original, edited, skin)
    white_rgb = edited[white].astype(np.float64)
    level = float(white_rgb.mean())
    spread = float(np.mean(white_rgb.max(axis=1) - white_rgb.min(axis=1)))
    excludes_white = ~white
    delta = np.abs(edited.astype(np.float64) - original.astype(np.float64))
    # The high-percentile local change captures deliberately restrained
    # highlight-only looks without pretending that every pixel must change.
    local_change = delta.mean(axis=2)[excludes_white]
    lift = float(np.percentile(local_change, 99) / 255.0 * 100.0)
    return CoverMetrics(texture, hue_turn, chroma_ratio, level, spread, lift,
                        int(np.count_nonzero(white)), int(np.count_nonzero(skin)), edges,
                        drift, alignment)


def problems(metrics: CoverMetrics, *, monochrome: bool = False) -> tuple[str, ...]:
    """Fixed proxy limits; failures block the synthetic Cover Test only."""
    issues: list[str] = []
    if not TEXTURE_MIN <= metrics.texture_ratio <= TEXTURE_MAX:
        issues.append("texture not preserved")
    if metrics.identity_drift > IDENTITY_DRIFT_MAX:
        issues.append("facial detail no longer aligns with the original")
    if metrics.texture_alignment < TEXTURE_ALIGNMENT_MIN:
        issues.append("facial texture alignment is too weak")
    if not monochrome:
        if metrics.hue_turn > HUE_TURN_MAX:
            issues.append("skin hue changed")
        if metrics.chroma_ratio < CHROMA_KEEP_MIN:
            issues.append("skin colour was flattened")
    if metrics.white_level < WHITE_MIN or metrics.white_spread > WHITE_SPREAD_MAX:
        issues.append("studio whites are not clean")
    if not LIFT_MIN <= metrics.editorial_lift <= LIFT_MAX:
        issues.append("editorial lift is absent or too strong")
    return tuple(issues)


def evaluate(recipe: Mapping[str, Any], tones: Iterable[str] = TONE_NAMES) -> list[CoverResult]:
    """Apply the declared filter at its actual default, with its skin guard on."""
    grade = recipe.get("editorial")
    if not isinstance(grade, Mapping):
        raise ValueError("a filter must declare an editorial family and light")
    if grade.get("family") not in schema.EDITORIAL_FAMILIES:
        raise ValueError("unrecognized editorial family")
    if grade.get("light") not in schema.EDITORIAL_LIGHTS:
        raise ValueError("unrecognized editorial light")
    results: list[CoverResult] = []
    for tone in tones:
        original, masks, whites = control_photo(tone)
        result = engine.render(original, recipe, masks=masks)
        metrics = measure(original, result.image, masks, whites)
        issues = problems(metrics, monochrome=recipe["tab"] == "Monochrome")
        results.append(CoverResult(str(recipe["id"]), str(grade["family"]),
                                   str(grade["light"]), tone, metrics, issues))
    return results


def evaluate_many(recipes: Iterable[Mapping[str, Any]],
                  tones: Iterable[str] = TONE_NAMES) -> list[CoverResult]:
    """Prepare each drawn face once for any number of recipes, without caching photos.

    Every recipe still renders independently; its actual defaults, masking,
    editorial grade and output bytes are unchanged. Controls live only within
    this call and are not persisted or shared across user sessions.
    """
    chosen = list(recipes)
    requested = tuple(tones)
    if not requested or len(requested) != len(set(requested)):
        raise ValueError("each requested tone must occur exactly once")
    if len({str(recipe.get("id")) for recipe in chosen}) != len(chosen):
        raise ValueError("each requested recipe must occur exactly once")
    controls = {tone: control_photo(tone) for tone in requested}
    rows: list[CoverResult] = []
    for recipe in chosen:
        grade = recipe.get("editorial")
        if not isinstance(grade, Mapping):
            raise ValueError("a filter must declare editorial metadata")
        if grade.get("family") not in schema.EDITORIAL_FAMILIES:
            raise ValueError("unrecognized editorial family")
        if grade.get("light") not in schema.EDITORIAL_LIGHTS:
            raise ValueError("unrecognized editorial light")
        for tone in requested:
            original, masks, white = controls[tone]
            output = engine.render(original, recipe, masks=masks)
            metrics = measure(original, output.image, masks, white)
            failure = problems(metrics, monochrome=recipe["tab"] == "Monochrome")
            rows.append(CoverResult(str(recipe["id"]), str(grade["family"]),
                                    str(grade["light"]), tone, metrics, failure))
    return rows


@dataclass(frozen=True)
class EdgeResult:
    """Two-person and low-light synthetic safety report, not release evidence."""

    filter_id: str
    condition: str
    faces: int
    protected_faces: int
    deterministic: bool
    original_unchanged_on_protected_skin: bool
    problems: tuple[str, ...]

    @property
    def passed(self) -> bool:
        return not self.problems


def evaluate_edge(recipe: Mapping[str, Any], scene: fixtures.EdgeScene) -> EdgeResult:
    """Never average the second face away when validating group protection.

    Both skin areas must be represented in the supplied group mask. Output
    shape, determinism and hard-mask restoration are assessed separately.
    Identity-lock defaults on, even when optional skin guard is off.
    """
    if not scene.faces or len(scene.faces) != len(scene.tones):
        raise ValueError("edge scene must declare each constituent face")
    if scene.masks.skin is None:
        raise ValueError("edge scene must have a skin mask")
    original = scene.image
    covered = scene.masks.skin >= 0.75
    for region in scene.faces:
        if region.shape != original.shape[:2] or int(np.count_nonzero(region)) < 20:
            raise ValueError("each edge face needs its own supported region")
    result = engine.render(original, recipe, masks=scene.masks)
    repeated = engine.render(original, recipe, masks=scene.masks)
    settings = engine.Settings(protect_skin=True, guard=False, identity_lock=True)
    protected = engine.render(original, recipe, settings, masks=scene.masks)
    issues: list[str] = []
    valid_image = result.image.dtype == np.uint8 and result.image.shape == original.shape
    if not valid_image:
        issues.append("output dimensions or data type changed")
    deterministic = np.array_equal(result.image, repeated.image)
    if not deterministic:
        issues.append("the same input rendered differently")
    protected_count = 0
    kept = True
    for position, region in enumerate(scene.faces):
        if not np.any(region & ~covered) and np.array_equal(
            original[region], protected.image[region]
        ):
            protected_count += 1
        else:
            kept = False
            issues.append(f"face {position + 1}: skin evidence or protection missing")
    if protected.plan.identity_lock is not True:
        issues.append("identity lock was not enabled")
    return EdgeResult(str(recipe["id"]), scene.condition, len(scene.faces),
                      protected_count, deterministic, kept, tuple(issues))


def editorial_inventory(recipes: Iterable[Mapping[str, Any]]) -> dict[str, Any]:
    """Fail closed on missing grades, duplicate IDs/ranks and unexpected values."""
    chosen = list(recipes)
    errors: list[str] = []
    seen_ids: set[str] = set()
    seen_ranks: set[int] = set()
    families = {key: 0 for key in schema.EDITORIAL_FAMILIES}
    lights = {key: 0 for key in schema.EDITORIAL_LIGHTS}
    rows: list[dict[str, str | int]] = []
    for recipe in chosen:
        rid = str(recipe.get("id", "?"))
        rank = recipe.get("rank")
        grade = recipe.get("editorial")
        if rid in seen_ids:
            errors.append(f"{rid}: repeated filter id")
        seen_ids.add(rid)
        if not isinstance(rank, int) or isinstance(rank, bool) or rank < 1:
            errors.append(f"{rid}: invalid rank")
        elif rank in seen_ranks:
            errors.append(f"{rid}: repeated rank")
        else:
            seen_ranks.add(rank)
        if not isinstance(grade, Mapping) or set(grade) != {"family", "light"}:
            errors.append(f"{rid}: incomplete editorial grade")
            continue
        family, light = grade["family"], grade["light"]
        if family not in schema.EDITORIAL_FAMILIES:
            errors.append(f"{rid}: unknown family")
        else:
            families[str(family)] += 1
        if light not in schema.EDITORIAL_LIGHTS:
            errors.append(f"{rid}: unknown light")
        else:
            lights[str(light)] += 1
        if family in schema.EDITORIAL_FAMILIES and light in schema.EDITORIAL_LIGHTS:
            rows.append({"id": rid, "rank": int(rank) if isinstance(rank, int) else -1,
                         "family": str(family), "light": str(light)})
    return {"filters": len(chosen), "assigned": len(rows), "families": families,
            "lights": lights, "assignments": sorted(rows, key=lambda row: (row["rank"], row["id"])),
            "problems": errors}


def top_thirty(cat: registry.Catalogue | None = None) -> list[dict[str, Any]]:
    """Priority thirty built recipes, not unbuilt ranking placeholders."""
    return (cat or registry.default()).ranked()[:30]


def evaluate_top_thirty(cat: registry.Catalogue | None = None) -> list[CoverResult]:
    return [row for recipe in top_thirty(cat) for row in evaluate(recipe)]


def summary(results: Iterable[CoverResult]) -> dict[str, Any]:
    """A compact, fail-closed, synthetic-only handoff status for box gates."""
    rows = list(results)
    rejected = sorted({row.filter_id for row in rows if not row.passed})
    grouped: dict[str, list[CoverResult]] = {}
    for row in rows:
        grouped.setdefault(row.filter_id, []).append(row)
    coverage_failures: list[str] = []
    for filter_id, tested in sorted(grouped.items()):
        observed = [row.tone for row in tested]
        if len(observed) != len(TONE_NAMES) or set(observed) != set(TONE_NAMES):
            coverage_failures.append(f"{filter_id}: incomplete or repeated synthetic skin tones")
        if len({(row.family, row.light) for row in tested}) != 1:
            coverage_failures.append(f"{filter_id}: inconsistent editorial grade")
        for row in tested:
            if row.family not in schema.EDITORIAL_FAMILIES:
                coverage_failures.append(f"{filter_id}: invalid editorial family")
                break
            if row.light not in schema.EDITORIAL_LIGHTS:
                coverage_failures.append(f"{filter_id}: invalid editorial light")
                break
    return {
        "fixture": "synthetic",
        "evaluated": len(rows),
        "filters": len(grouped),
        "passes": sum(row.passed for row in rows),
        "failingFilters": rejected,
        "failedChecks": sorted({item for row in rows for item in row.problems}),
        "coverageFailures": coverage_failures,
        "realFacesEvaluated": 0,
    }


def cover_gate(recipes: Iterable[Mapping[str, Any]], rows: Iterable[CoverResult]) -> dict[str, Any]:
    """Verify *every* required filter and tone, not merely passing averages.

    Data-only validator accepts an already computed synthetic report. It does
    not rerender photographs, use a biometric classifier, or authorize release.
    Missing results and inconsistent metadata must not become an apparent pass.
    """
    chosen = list(recipes)
    observations = list(rows)
    inventory = editorial_inventory(chosen)
    errors = list(inventory["problems"])
    expected = {(str(rec["id"]), tone) for rec in chosen for tone in TONE_NAMES}
    indexed: dict[tuple[str, str], CoverResult] = {}
    for row in observations:
        key = (row.filter_id, row.tone)
        if key in indexed:
            errors.append(f"{row.filter_id}/{row.tone}: repeated cover record")
        indexed[key] = row
    for fid, tone in sorted(expected - set(indexed)):
        errors.append(f"{fid}/{tone}: cover result missing")
    for fid, tone in sorted(set(indexed) - expected):
        errors.append(f"{fid}/{tone}: unexpected cover result")
    lookup = {str(item["id"]): item for item in chosen}
    worst: dict[str, dict[str, float]] = {}
    values_checked = (
        "texture_ratio", "hue_turn", "chroma_ratio", "white_level",
        "white_spread", "editorial_lift", "identity_drift", "texture_alignment",
    )
    for (fid, tone), row in indexed.items():
        recipe = lookup.get(fid)
        if recipe is None or tone not in TONE_NAMES:
            continue
        declared = recipe.get("editorial")
        if not isinstance(declared, Mapping) or (
            row.family != declared.get("family") or row.light != declared.get("light")
        ):
            errors.append(f"{fid}/{tone}: editorial metadata does not match recipe")
        if any(not isfinite(float(getattr(row.metrics, name))) for name in values_checked):
            errors.append(f"{fid}/{tone}: non-finite cover metric")
            continue
        measured_errors = problems(
            row.metrics, monochrome=recipe.get("tab") == "Monochrome"
        )
        if row.problems != measured_errors:
            errors.append(f"{fid}/{tone}: stored problem list does not match metrics")
        if measured_errors:
            errors.append(f"{fid}/{tone}: {'; '.join(measured_errors)}")
        current = worst.setdefault(fid, {"identityDriftMax": 0.0, "textureAlignmentMin": 1.0})
        current["identityDriftMax"] = max(current["identityDriftMax"], row.metrics.identity_drift)
        current["textureAlignmentMin"] = min(current["textureAlignmentMin"], row.metrics.texture_alignment)
    return {
        "fixture": "synthetic",
        "filters": len(chosen),
        "expected": len(expected),
        "observed": len(observations),
        "complete": not errors,
        "problems": sorted(set(errors)),
        "worstByFilter": {key: worst[key] for key in sorted(worst)},
        "realFacesEvaluated": 0,
    }


def evidence(results: Iterable[CoverResult]) -> dict[str, Any]:
    """Produce a reproducible synthetic score ledger with no image content.

    Every supported tone is represented separately. Aggregates never hide a
    failed tone or convert this fixture report into a real-face release pass.
    """
    rows = list(results)
    totals = summary(rows)
    by_family: dict[str, dict[str, int]] = {}
    by_light: dict[str, dict[str, int]] = {}
    records: list[dict[str, Any]] = []
    for row in rows:
        for counter, value in ((by_family, row.family), (by_light, row.light)):
            counts = counter.setdefault(value, {"evaluated": 0, "passes": 0})
            counts["evaluated"] += 1
            counts["passes"] += int(row.passed)
        metrics = row.metrics
        measured = (
            metrics.texture_ratio, metrics.hue_turn, metrics.chroma_ratio,
            metrics.white_level, metrics.white_spread, metrics.editorial_lift,
            metrics.identity_drift, metrics.texture_alignment,
        )
        if not all(isfinite(value) for value in measured):
            raise ValueError("a synthetic Cover Test metric must be finite")
        records.append({
            "id": row.filter_id,
            "tone": row.tone,
            "family": row.family,
            "light": row.light,
            "passed": row.passed,
            "problems": list(row.problems),
            "metrics": {
                "textureRatio": round(metrics.texture_ratio, 6),
                "hueTurnDegrees": round(metrics.hue_turn, 6),
                "chromaRatio": round(metrics.chroma_ratio, 6),
                "whiteLevel": round(metrics.white_level, 6),
                "whiteSpread": round(metrics.white_spread, 6),
                "editorialLift": round(metrics.editorial_lift, 6),
                "whitePixels": metrics.white_pixels,
                "skinPixels": metrics.skin_pixels,
                "textureEdges": metrics.texture_edges,
                "identityDrift": round(metrics.identity_drift, 6),
                "textureAlignment": round(metrics.texture_alignment, 6),
            },
        })
    return {
        **totals,
        "limits": {
            "whiteMin": WHITE_MIN,
            "whiteSpreadMax": WHITE_SPREAD_MAX,
            "textureMin": TEXTURE_MIN,
            "textureMax": TEXTURE_MAX,
            "identityDriftMax": IDENTITY_DRIFT_MAX,
            "textureAlignmentMin": TEXTURE_ALIGNMENT_MIN,
            "hueTurnMaxDegrees": HUE_TURN_MAX,
            "chromaRatioMin": CHROMA_KEEP_MIN,
            "editorialLiftMin": LIFT_MIN,
            "editorialLiftMax": LIFT_MAX,
        },
        "families": {key: by_family[key] for key in sorted(by_family)},
        "lights": {key: by_light[key] for key in sorted(by_light)},
        "results": records,
    }
