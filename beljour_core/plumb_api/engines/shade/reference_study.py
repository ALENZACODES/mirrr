"""Reproducible six-condition study of W6 reference identity on drawn patches.

Each of the 96 in-house skin references is drawn as flat sRGB patches (two
cheeks, a forehead and, where a condition calls for it, a neutral grey card) and
read twice: by the historical cheek-first reader (baseline) and by the checked
entry with the two-cheek consensus (candidate). No photograph, mesh or model is
used, and nothing is saved.

Conditions (every value below is an ASSUMED engineering choice, not measured
from faces):

* ``flat_patches``: all three zones carry the reference colour.
* ``forehead_glare_cheeks_agree``: the forehead is 12 L* lighter with 30% less
  chroma, as a shine band would read; the cheeks agree.
* ``cheeks_disagree``: one cheek is 20 L* nearer mid-grey than the other.
* ``insufficient_cheek_samples``: each cheek shows only 6 pixels.
* ``warm_light_checked_neutral`` / ``cool_light_checked_neutral``: the whole
  scene is lit by a warm or cool linear-light cast of unit luminance, and an
  explicit neutral card under the same light is supplied.

Results are synthetic exact-reference outcomes, not face accuracy, released-person
quality or physical product matching. Mirrored in
web/src/engines/shade/reference-study.ts. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any

import numpy as np

from . import colourspace as cs
from .loaders import ShadeRecord, load_reference_shades, shade_by_id
from .skin_accuracy import assess_skin_zones
from .skin_evidence import AccuracySummary, summarize_accuracy

CONDITIONS = (
    "flat_patches",
    "forehead_glare_cheeks_agree",
    "cheeks_disagree",
    "insufficient_cheek_samples",
    "warm_light_checked_neutral",
    "cool_light_checked_neutral",
)
EVIDENCE_IDS = {
    "flat_patches": "r32f-flat-patches",
    "forehead_glare_cheeks_agree": "r32f-forehead-glare-cheeks-agree",
    "cheeks_disagree": "r32f-cheeks-disagree",
    "insufficient_cheek_samples": "r32f-insufficient-cheek-samples",
    "warm_light_checked_neutral": "r32f-warm-light-checked-neutral",
    "cool_light_checked_neutral": "r32f-cool-light-checked-neutral",
}
AGGREGATE_ID = "r32f-six-condition-aggregate"

# Drawn layout: four square blocks in one row, GAP pixels apart and from the frame.
BLOCK = 24
GAP = 2
HEIGHT = BLOCK + 2 * GAP
WIDTH = 4 * (BLOCK + GAP) + GAP
BLOCKS = ("cheek_right", "cheek_left", "forehead", "neutral")
SPARSE_CHEEK = (2, 3)
FILL = 96
NEUTRAL_GREY = 128
GLARE_LIGHTNESS = 12.0
GLARE_CHROMA = 0.7
CHEEK_SHIFT = 20.0
# Linear-light casts, scaled so their luminance (Y) is exactly 1.
_WARM = np.array([1.15, 1.0, 0.8])
_COOL = np.array([0.86, 1.0, 1.22])
_Y = cs.RGB_TO_XYZ[1]
CASTS = {
    "warm_light_checked_neutral": _WARM / float(_Y @ _WARM),
    "cool_light_checked_neutral": _COOL / float(_Y @ _COOL),
}


def _bytes(lab: Sequence[float] | np.ndarray) -> np.ndarray:
    return cs.to_bytes(cs.lab_to_srgb(np.asarray(lab, dtype=np.float64)))


def _block(name: str) -> tuple[slice, slice]:
    left = GAP + BLOCKS.index(name) * (BLOCK + GAP)
    return slice(GAP, GAP + BLOCK), slice(left, left + BLOCK)


def draw_scenario(lab: Sequence[float], condition: str) -> tuple[np.ndarray, dict[str, np.ndarray],
                                                                  np.ndarray | None]:
    """The drawn RGB scene, its boolean zone masks and the neutral-card mask (or None)."""
    if condition not in CONDITIONS:
        raise ValueError("unknown reference study condition")
    skin = np.asarray(lab, dtype=np.float64)
    image = np.full((HEIGHT, WIDTH, 3), FILL, dtype=np.uint8)
    colours = {name: skin for name in ("cheek_right", "cheek_left", "forehead")}
    if condition == "forehead_glare_cheeks_agree":
        colours["forehead"] = np.array([min(100.0, skin[0] + GLARE_LIGHTNESS),
                                        skin[1] * GLARE_CHROMA, skin[2] * GLARE_CHROMA])
    elif condition == "cheeks_disagree":
        toward_middle = -CHEEK_SHIFT if skin[0] > 50 else CHEEK_SHIFT
        colours["cheek_left"] = np.array([skin[0] + toward_middle, skin[1], skin[2]])
    masks: dict[str, np.ndarray] = {}
    for name, colour in colours.items():
        rows, cols = _block(name)
        image[rows, cols] = _bytes(colour)
        mask = np.zeros((HEIGHT, WIDTH), dtype=np.bool_)
        if condition == "insufficient_cheek_samples" and name != "forehead":
            mask[rows.start:rows.start + SPARSE_CHEEK[0], cols.start:cols.start + SPARSE_CHEEK[1]] = True
        else:
            mask[rows, cols] = True
        masks[name] = mask
    neutral: np.ndarray | None = None
    cast = CASTS.get(condition)
    if cast is not None:
        rows, cols = _block("neutral")
        image[rows, cols] = NEUTRAL_GREY
        neutral = np.zeros((HEIGHT, WIDTH), dtype=np.bool_)
        neutral[rows, cols] = True
        image = cs.to_bytes(cs.encode(cs.decode(image) * cast))
    return image, masks, neutral


@dataclass(frozen=True)
class ScenarioOutcome:
    shade_id: str
    condition: str
    baseline_id: str | None
    candidate_id: str | None
    candidate_source: str

    @property
    def baseline_exact(self) -> bool:
        return self.baseline_id == self.shade_id

    @property
    def candidate_exact(self) -> bool:
        return self.candidate_id == self.shade_id

    @property
    def refused(self) -> bool:
        return self.candidate_id is None

    @property
    def wrong_accepted(self) -> bool:
        return self.candidate_id is not None and self.candidate_id != self.shade_id

    def public(self) -> dict[str, Any]:
        return {"shade_id": self.shade_id, "condition": self.condition,
                "baseline_id": self.baseline_id, "candidate_id": self.candidate_id,
                "candidate_source": self.candidate_source, "baseline_exact": self.baseline_exact,
                "candidate_exact": self.candidate_exact, "refused": self.refused,
                "wrong_accepted": self.wrong_accepted}


def evaluate_reference_scenario(shade: str | ShadeRecord, condition: str) -> ScenarioOutcome:
    """Draw one reference under one condition and read it with both readers."""
    record = shade if isinstance(shade, ShadeRecord) else shade_by_id(shade, "reference")
    if record.surface != "skin":
        raise ValueError("the reference study reads skin references only")
    image, masks, neutral = draw_scenario(record.lab, condition)
    found = assess_skin_zones(image, masks, neutral_mask=neutral)
    baseline = None if found.baseline.refused or found.baseline.best is None else str(found.baseline.best["id"])
    return ScenarioOutcome(record.id, condition, baseline, found.reference_id, found.source)


def _row(identifier: str, condition: str, baseline: AccuracySummary,
         candidate: AccuracySummary) -> dict[str, Any]:
    return {"id": identifier, "condition": condition, "n": candidate.total,
            "baseline_exact": baseline.exact, "candidate_exact": candidate.exact,
            "refused": candidate.refused, "wrong_accepted": candidate.wrong_accepted,
            "kind": "synthetic"}


@dataclass(frozen=True)
class ReferenceStudy:
    outcomes: tuple[ScenarioOutcome, ...]
    conditions: tuple[str, ...]

    def summaries(self, condition: str | None = None) -> tuple[AccuracySummary, AccuracySummary]:
        """Baseline and candidate accounting, for one condition or all of them."""
        chosen = [o for o in self.outcomes if condition is None or o.condition == condition]
        baseline = summarize_accuracy({"expected_id": o.shade_id, "predicted_id": o.baseline_id}
                                      for o in chosen)
        candidate = summarize_accuracy({"expected_id": o.shade_id, "predicted_id": o.candidate_id}
                                       for o in chosen)
        return baseline, candidate

    def rows(self) -> list[dict[str, Any]]:
        out = [_row(EVIDENCE_IDS[name], name, *self.summaries(name)) for name in self.conditions]
        if len(self.conditions) > 1:
            out.append(_row(AGGREGATE_ID, "aggregate", *self.summaries()))
        return out

    def public(self) -> dict[str, Any]:
        return {"format": "beljour-reference-study/1", "rows": self.rows(),
                "references": len({o.shade_id for o in self.outcomes}),
                "note": "Synthetic exact-reference outcome on drawn patches; not face accuracy.",
                "real_face_pass": False, "tested_against_real_products": False}


def run_reference_study(conditions: Sequence[str] = CONDITIONS,
                        shades: Sequence[ShadeRecord] | None = None) -> ReferenceStudy:
    """Every reference under every requested condition, in catalogue then condition order."""
    chosen = tuple(conditions)
    if not chosen or len(set(chosen)) != len(chosen) or any(c not in CONDITIONS for c in chosen):
        raise ValueError("conditions must be distinct known study conditions")
    records = load_reference_shades() if shades is None else tuple(shades)
    outcomes = tuple(evaluate_reference_scenario(record, condition)
                     for record in records for condition in chosen)
    return ReferenceStudy(outcomes, chosen)
