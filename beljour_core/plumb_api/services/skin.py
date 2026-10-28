"""Turn YouCam skin analysis JSON into plain words and a simple routine.

YouCam returns two numbers per concern. Its docs say raw_score is the measurement and
ui_score is adjusted upward so people feel better about the result. We show both, and we
rank by raw_score, because a routine should follow the measurement.
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from functools import lru_cache
from pathlib import Path

GUIDE_PATH = Path(__file__).resolve().parent.parent / "data" / "skin_guide.json"


@lru_cache(maxsize=1)
def guide() -> dict:
    return json.loads(GUIDE_PATH.read_text())


@dataclass
class ConcernScore:
    concern: str
    label: str
    what: str
    raw_score: float
    ui_score: int
    band: str
    has_mask: bool
    habits: list[str] = field(default_factory=list)
    see_pro: str | None = None


def band(raw: float) -> str:
    """Higher scores mean healthier looking skin in YouCam's scale (1 to 100)."""
    if raw >= 80:
        return "looking good"
    if raw >= 60:
        return "some room to improve"
    return "worth focusing on"


def _find_number(results: dict, *keys: str) -> float | None:
    for key in keys:
        value = results.get(key)
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, dict):
            for inner in ("score", "ui_score", "raw_score"):
                if isinstance(value.get(inner), (int, float)):
                    return float(value[inner])
    return None


def parse(results: dict) -> dict:
    """Accepts data.results from a format="json" skin analysis task."""
    concerns = guide()["concerns"]
    scores: list[ConcernScore] = []
    skin_type: str | None = None
    for item in results.get("output", []):
        name = item.get("type", "")
        if name == "skin_type":
            skin_type = item.get("skin_type") or item.get("result") or item.get("value")
            continue
        if name not in concerns or "raw_score" not in item:
            continue
        info = concerns[name]
        raw = float(item["raw_score"])
        scores.append(ConcernScore(
            name, info["label"], info["what"], round(raw, 1), int(item.get("ui_score", round(raw))),
            band(raw), bool(item.get("mask_urls")), info["habits"], info["see_pro"],
        ))
    scores.sort(key=lambda s: s.raw_score)
    return {
        "scores": [asdict(s) for s in scores],
        "overall": _find_number(results, "all", "score", "overall"),
        "skin_age": _find_number(results, "skin_age"),
        "skin_type": skin_type,
    }


def routine(scores: list[dict], max_focus: int = 3) -> dict:
    """Pick up to three focus concerns (lowest raw scores under 80), then build a morning and
    evening routine. Rules: one retinoid at most, exfoliants and retinoids on different nights,
    sunscreen every morning."""
    g = guide()
    focus = [s for s in scores if s["raw_score"] < 80][:max_focus]
    chosen: dict[str, dict] = {}
    reasons: dict[str, list[str]] = {}
    for s in focus:
        for ing_id in g["concerns"][s["concern"]]["ingredients"]:
            ing = g["ingredients"][ing_id]
            if ing["group"] == "retinoid" and any(g["ingredients"][c]["group"] == "retinoid" for c in chosen if c != ing_id):
                continue
            chosen.setdefault(ing_id, ing)
            reasons.setdefault(ing_id, []).append(s["label"].lower())
            break  # first listed ingredient is the best first step for that concern
    def step(ing_id: str) -> dict:
        ing = g["ingredients"][ing_id]
        why = ing["why"]
        for_what = reasons.get(ing_id)
        return {"id": ing_id, "name": ing["name"], "why": why,
                "for": for_what or [], "caution": ing["caution"]}

    am = [{"id": "cleanser", "name": "Gentle cleanser", "why": "a clean, calm base", "for": [], "caution": ""}]
    pm = [{"id": "cleanser", "name": "Gentle cleanser", "why": "removes sunscreen and the day", "for": [], "caution": ""}]
    alternate: list[dict] = []
    has_retinoid = any(g["ingredients"][i]["group"] == "retinoid" for i in chosen)
    for ing_id, ing in chosen.items():
        if ing["slot"] in ("am", "both") and ing_id != "sunscreen":
            am.append(step(ing_id))
        if ing["slot"] in ("pm", "both"):
            if ing["group"] == "exfoliant" and has_retinoid:
                alternate.append(step(ing_id))
            else:
                pm.append(step(ing_id))
    am.append({"id": "moisturiser", "name": "Moisturiser", "why": "keeps water in", "for": [], "caution": ""})
    pm.append({"id": "moisturiser", "name": "Moisturiser", "why": "supports overnight repair", "for": [], "caution": ""})
    am.append(step("sunscreen"))
    return {
        "focus": [s["label"] for s in focus],
        "morning": am,
        "evening": pm,
        "alternate_nights": alternate,
        "note": "Add one new product at a time, two weeks apart, so you can tell what helps. General information, not medical advice.",
    }
