"""W93 Salon Decision Pack (Top 5 #5): a two-page spec she can show a stylist, colourist,
brow or lash technician, or dentist.

Rules from John's round 2 plan (section 7) and the W93 entry, enforced here:

* A pack with photos starts page 1 with her unedited photo. The preview never travels without
  the reality it started from, and the photo set always lists the original first. A
  settings-only pack (no ``original_photo``) holds no photo, no photo reference and no preview.
* Two pages at most, plus the photo set: page 1 her photo and measured facts (a Shade
  Passport excerpt; allergies only when she turns them on), page 2 the target (Lab values
  and nearest shades with ΔE), the map (legible in black and white) and the plan.
* Every pack carries the consent footer, word for word:
  "Visual aid generated [date]. Professional assessment in person governs suitability,
  formula and price."
* No affiliate links, no product pushing and no beauty scores: keys named score, rating or
  rank are refused. Price range and how long it lasts come from the decision estimates
  (``engines/workflow_w/decision.py``: ASSUMED Canadian-dollar ranges she can replace with her
  salon's figures) only when the plan names a service; otherwise the pack says they are not
  estimated instead of inventing numbers.
* Her data, her control: share links are an expiring, signed local token only. Nothing is
  hosted or uploaded by this module (round2-plan-binding.md section 7, ASSUMED local-only).

Pure functions on plain data: the photo is referenced by its SHA-256, never embedded.
Author: John Khan.
"""
from __future__ import annotations

import hashlib
import hmac
import html
import json
import math
import re
from collections.abc import Mapping, Sequence
from datetime import date
from typing import Any

from ..engines.workflow_w import decision

FORMAT = "beljour-salon-pack/1"
VERSION = "salon-pack-w93/1"
LABEL = "Visual aid for a consultation. Previews are simulations."
FOOTER = "Visual aid generated {date}. Professional assessment in person governs suitability, formula and price."
TARGET_KINDS = ("hair", "makeup", "brows", "lashes", "smile")
MAP_KINDS = ("foil", "balayage", "lash", "brow", "dental", "placement")
VIEWS = ("front", "side")
LIGHTS = ("daylight", "office", "evening")
MAX_SHARE_DAYS = 30
FORBIDDEN_KEYS = re.compile(r"score|rating|rank|affiliate|buy_link", re.IGNORECASE)
SHA = re.compile(r"^[0-9a-f]{64}$")


class PackError(ValueError):
    """A pack input that breaks one of the W93 rules."""


def _sha(value: object, where: str) -> str:
    if not isinstance(value, str) or not SHA.fullmatch(value):
        raise PackError(f"{where} must be a 64-character lowercase SHA-256")
    return value


def _lab(value: object, where: str) -> list[float]:
    if (not isinstance(value, (list, tuple)) or len(value) != 3
            or not all(isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) for v in value)
            or not 0 <= value[0] <= 100):
        raise PackError(f"{where} must be a finite Lab triple with L* in 0..100")
    return [round(float(v), 2) for v in value]


def _text(value: object, where: str, limit: int = 240) -> str:
    if not isinstance(value, str) or not value.strip() or len(value) > limit:
        raise PackError(f"{where} must be plain text of 1..{limit} characters")
    return value.strip()


def _no_scores(data: object, where: str) -> None:
    if isinstance(data, Mapping):
        for key, value in data.items():
            if FORBIDDEN_KEYS.search(str(key)):
                raise PackError(f"{where}: '{key}' is not allowed in a salon pack (no scores, ranks or affiliate data)")
            _no_scores(value, where)
    elif isinstance(data, (list, tuple)):
        for item in data:
            _no_scores(item, where)


def _photo_set(original: Mapping[str, Any] | None, previews: Sequence[Mapping[str, Any]]) -> list[dict[str, Any]]:
    if original is None:
        if previews:
            raise PackError("previews travel only with her unedited photo; a settings-only pack has neither")
        return []
    orig_sha = _sha(original.get("sha256"), "original photo")
    for key in ("width", "height"):
        v = original.get(key)
        if isinstance(v, bool) or not isinstance(v, int) or not 1 <= v <= 20000:
            raise PackError(f"original photo {key} must be 1..20000")
    photos: list[dict[str, Any]] = [{"role": "original", "sha256": orig_sha, "width": original["width"],
                                     "height": original["height"], "caption": "Your unedited photo"}]
    seen = {orig_sha}
    if len(previews) > 6:
        raise PackError("a pack holds at most 6 previews (front and side in three lights)")
    for i, p in enumerate(previews):
        sha = _sha(p.get("sha256"), f"preview {i + 1}")
        if sha in seen:
            raise PackError("each preview must be a different image from the original and from each other")
        seen.add(sha)
        view, light = p.get("view"), p.get("light")
        if view not in VIEWS or light not in LIGHTS:
            raise PackError(f"preview {i + 1}: view must be front or side, light daylight, office or evening")
        photos.append({"role": "preview", "sha256": sha, "view": view, "light": light,
                       "caption": f"Simulation, {view}, {light} light"})
    return photos


def _measured(measured: Mapping[str, Any], include_allergies: bool) -> dict[str, Any]:
    _no_scores(measured, "measured facts")
    out: dict[str, Any] = {}
    if "skin_lab" in measured:
        out["skin_lab"] = _lab(measured["skin_lab"], "skin Lab")
    if "undertone" in measured:
        if measured["undertone"] not in ("cool", "neutral", "warm", "olive"):
            raise PackError("undertone must be cool, neutral, warm or olive")
        out["undertone"] = measured["undertone"]
    if "depth_band" in measured:
        band = measured["depth_band"]
        if isinstance(band, bool) or not isinstance(band, int) or not 1 <= band <= 10:
            raise PackError("depth band must be 1..10")
        out["depth_band"] = band
        out["depth_band_note"] = "ASSUMED bands from L*, not a Monk label"
    if "hair_level" in measured:
        level = measured["hair_level"]
        if isinstance(level, bool) or not isinstance(level, int) or not 1 <= level <= 10:
            raise PackError("hair level must be 1..10")
        out["hair_level"] = level
    if "hair_history" in measured:
        out["hair_history"] = _text(measured["hair_history"], "hair history")
    allergies = measured.get("allergies")
    if include_allergies and allergies:
        if not isinstance(allergies, (list, tuple)) or len(allergies) > 20:
            raise PackError("allergies must be a list of up to 20 entries")
        out["allergies"] = [_text(a, "allergy", 60) for a in allergies]
        out["allergy_note"] = "Shared because you turned it on. No flag does not mean safe for you; patch test first."
    if not out:
        raise PackError("a pack needs at least one measured fact")
    return out


def _target(target: Mapping[str, Any]) -> dict[str, Any]:
    _no_scores(target, "target")
    kind = target.get("kind")
    if kind not in TARGET_KINDS:
        raise PackError(f"target kind must be one of {', '.join(TARGET_KINDS)}")
    out: dict[str, Any] = {"subject": kind, "description": _text(target.get("description"), "target description"),
                           "lab": _lab(target.get("lab"), "target Lab")}
    shades = target.get("nearest_shades", [])
    if not isinstance(shades, (list, tuple)) or len(shades) > 3:
        raise PackError("list up to 3 nearest shades")
    out["nearest_shades"] = []
    for s in shades:
        de = s.get("delta_e")
        if isinstance(de, bool) or not isinstance(de, (int, float)) or not math.isfinite(de) or de < 0:
            raise PackError("each nearest shade needs a non-negative ΔE")
        out["nearest_shades"].append({"name": _text(s.get("name"), "shade name", 80), "lab": _lab(s.get("lab"), "shade Lab"),
                                      "delta_e": round(float(de), 2)})
    out["shade_source"] = "Our reference shades. Not tested against real products."
    return out


def _maps(maps: Sequence[Mapping[str, Any]]) -> list[dict[str, Any]]:
    _no_scores(list(maps), "maps")
    if len(maps) > 4:
        raise PackError("a pack holds at most 4 maps")
    out = []
    for m in maps:
        kind = m.get("kind")
        if kind not in MAP_KINDS:
            raise PackError(f"map kind must be one of {', '.join(MAP_KINDS)}")
        coverage = m.get("coverage")
        if isinstance(coverage, bool) or not isinstance(coverage, (int, float)) or not 0 <= coverage <= 1:
            raise PackError("map coverage must be a share in 0..1")
        zones = m.get("zones", [])
        if not isinstance(zones, (list, tuple)) or len(zones) > 12:
            raise PackError("a map lists up to 12 zones")
        out.append({"kind": kind, "coverage_percent": round(100 * float(coverage), 1),
                    "zones": [_text(z, "zone", 60) for z in zones],
                    "print_note": "Drawn as outlines and hatching, readable in black and white."})
    return out


def _plan(plan: Mapping[str, Any]) -> dict[str, Any]:
    _no_scores(plan, "plan")
    sessions = plan.get("sessions", 1)
    if isinstance(sessions, bool) or not isinstance(sessions, int) or not 1 <= sessions <= 12:
        raise PackError("sessions must be 1..12")
    out: dict[str, Any] = {"sessions": sessions,
                           "price_range": "Not estimated: no service was named for this pack.",
                           "maintenance": "Not planned: no service was named for this pack.",
                           "patch_test": bool(plan.get("patch_test", True))}
    if "service" in plan:
        out.update(_estimate(plan, sessions))
    steps = plan.get("levels_by_session")
    if steps is not None:
        if not isinstance(steps, (list, tuple)) or len(steps) != sessions:
            raise PackError("levels by session must list one level per session")
        out["levels_by_session"] = [int(s) for s in steps]
    if "note" in plan:
        out["note"] = _text(plan["note"], "plan note", 400)
    if out["patch_test"]:
        out["patch_test_note"] = "Patch test 48 hours before any colour or adhesive service."
    return out


def _estimate(plan: Mapping[str, Any], sessions: int) -> dict[str, Any]:
    """Price range and longevity for the named service; her figures replace the ASSUMED ones."""
    try:
        cost = decision.cost_and_longevity(str(plan["service"]), sessions=sessions, price=plan.get("price"),
                                           lasts=plan.get("lasts"), upkeep_price=plan.get("upkeep_price"))
    except decision.DecisionError as exc:
        raise PackError(f"plan estimate: {exc}") from exc
    price, first, lasts, *rest = decision.cost_lines(cost)
    upkeep, year_one = (rest[0], rest[1]) if cost["upkeep"] is not None else ("", "")
    return {"service": cost["service"], "estimate_source": cost["source"], "estimate_label": cost["label_note"],
            "price_range": " ".join(v for v in (price, first, year_one) if v),
            "maintenance": " ".join(v for v in (lasts, upkeep) if v)}


def build_pack(*, created: date, original_photo: Mapping[str, Any] | None = None, measured: Mapping[str, Any],
               target: Mapping[str, Any], previews: Sequence[Mapping[str, Any]] = (),
               maps: Sequence[Mapping[str, Any]] = (), plan: Mapping[str, Any] | None = None,
               include_allergies: bool = False) -> dict[str, Any]:
    if not isinstance(created, date):
        raise PackError("created must be a date")
    photos = _photo_set(original_photo, previews)
    facts = _measured(measured, include_allergies)
    body = {
        "format": FORMAT, "version": VERSION, "label": LABEL, "created": created.isoformat(),
        "photo_set": photos,
        "pages": [
            {"number": 1, "title": "Your photo and measured facts" if photos else "Measured facts (settings only)",
             "sections": ([{"kind": "original_photo", "sha256": photos[0]["sha256"], "caption": "Your unedited photo"}]
                          if photos else []) + [{"kind": "measured", "facts": facts}]},
            {"number": 2, "title": "Target, map and plan",
             "sections": [{"kind": "target", **_target(target)}, {"kind": "maps", "maps": _maps(maps)},
                          {"kind": "plan", **_plan(plan or {})}]},
        ],
        "footer": FOOTER.format(date=created.isoformat()),
        "photos_included": bool(photos), "sponsored_links": False, "appearance_grades": False, "hosted": False,
    }
    body["id"] = hashlib.sha256(json.dumps(body, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()
    return body


def check_pack(pack: Mapping[str, Any]) -> list[str]:
    """Rule checks on a built pack (for tests and for anything that edits one later)."""
    problems: list[str] = []
    if pack.get("format") != FORMAT:
        problems.append("unknown pack format")
    pages = pack.get("pages", [])
    if not 1 <= len(pages) <= 2:
        problems.append("a pack has one or two pages")
    photos = pack.get("photo_set", [])
    if pack.get("photos_included", True):
        if not photos or photos[0].get("role") != "original":
            problems.append("the photo set must start with her unedited photo")
        if pages and (not pages[0].get("sections") or pages[0]["sections"][0].get("kind") != "original_photo"):
            problems.append("page 1 must start with her unedited photo")
    elif photos or any(section.get("kind") == "original_photo" for page in pages for section in page.get("sections", [])):
        problems.append("a settings-only pack holds no photo or photo reference")
    created = str(pack.get("created", ""))
    if pack.get("footer") != FOOTER.format(date=created):
        problems.append("the consent footer is missing or changed")
    try:
        _no_scores(pack, "pack")
    except PackError as exc:
        problems.append(str(exc))
    return problems


# --- rendering ------------------------------------------------------------------------------

def _lab_text(lab: Sequence[float]) -> str:
    return f"L* {lab[0]:.1f}, a* {lab[1]:.1f}, b* {lab[2]:.1f}"


def render_text(pack: Mapping[str, Any]) -> str:
    lines = [f"Salon Decision Pack ({pack['created']})", LABEL, ""]
    for page in pack["pages"]:
        lines.append(f"Page {page['number']}: {page['title']}")
        for section in page["sections"]:
            kind = section["kind"]
            if kind == "original_photo":
                lines.append(f"  Your unedited photo: {section['sha256'][:12]}")
            elif kind == "measured":
                for key, value in section["facts"].items():
                    shown = _lab_text(value) if key == "skin_lab" else ", ".join(value) if isinstance(value, list) else value
                    lines.append(f"  {key.replace('_', ' ')}: {shown}")
            elif kind == "target":
                lines.append(f"  Target ({section['subject']}): {section['description']}; {_lab_text(section['lab'])}")
                for s in section["nearest_shades"]:
                    lines.append(f"    {s['name']}: {_lab_text(s['lab'])}, ΔE {s['delta_e']:.2f}")
                lines.append(f"    {section['shade_source']}")
            elif kind == "maps":
                for m in section["maps"]:
                    zones = ", ".join(m["zones"]) or "as drawn"
                    lines.append(f"  Map ({m['kind']}): {m['coverage_percent']}% coverage; zones: {zones}")
            elif kind == "plan":
                lines.append(f"  Sessions: {section['sessions']}")
                if "levels_by_session" in section:
                    lines.append("  Levels by session: " + ", ".join(str(v) for v in section["levels_by_session"]))
                lines.append(f"  Price: {section['price_range']}")
                lines.append(f"  Maintenance: {section['maintenance']}")
                if section.get("patch_test"):
                    lines.append(f"  {section['patch_test_note']}")
                if "note" in section:
                    lines.append(f"  Note: {section['note']}")
        lines.append("")
    lines.append("Photo set: " + (", ".join(p["caption"] for p in pack["photo_set"]) or "none (settings only)"))
    lines.append(pack["footer"])
    return "\n".join(lines) + "\n"


def render_html(pack: Mapping[str, Any]) -> str:
    """A print-ready page; every value is escaped. Colours: #000091 text rules, no red."""
    esc = html.escape
    body = [f"<h1>Salon Decision Pack</h1><p class=\"label\">{esc(LABEL)}</p>"]
    for line in render_text(pack).splitlines()[3:]:
        if not line.strip():
            continue
        if line.startswith("Page "):
            body.append(f"<h2>{esc(line)}</h2>")
        elif line == pack["footer"]:
            continue
        else:
            body.append(f"<p>{esc(line.strip())}</p>")
    body.append(f"<footer>{esc(pack['footer'])}</footer>")
    style = ("body{font:14px/1.5 Georgia,serif;color:#000091;background:#FFFFFF;max-width:720px;margin:auto}"
             "h1,h2{font-weight:normal;border-bottom:1px solid #000091}footer{margin-top:24px;font-size:12px}")
    return ("<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>Salon Decision Pack</title>"
            f"<style>{style}</style></head><body>{''.join(body)}</body></html>\n")


# --- local expiring share token ----------------------------------------------------------------

def share_token(pack_id: str, *, issued_at: int, days: int, secret: bytes) -> str:
    """A signed, expiring token for a view-only link. Local model only; nothing is hosted."""
    _sha(pack_id, "pack id")
    if isinstance(days, bool) or not isinstance(days, int) or not 1 <= days <= MAX_SHARE_DAYS:
        raise PackError(f"a share link lasts 1..{MAX_SHARE_DAYS} days")
    if isinstance(issued_at, bool) or not isinstance(issued_at, int) or issued_at < 0:
        raise PackError("issued_at must be a Unix time in seconds")
    if not isinstance(secret, bytes) or len(secret) < 16:
        raise PackError("the share secret must be at least 16 bytes")
    expires = issued_at + days * 86400
    message = f"{pack_id}.{expires}".encode("ascii")
    signature = hmac.new(secret, message, hashlib.sha256).hexdigest()
    return f"{pack_id}.{expires}.{signature}"


def verify_share_token(token: str, *, now: int, secret: bytes) -> tuple[bool, str]:
    parts = token.split(".") if isinstance(token, str) else []
    if len(parts) != 3 or not SHA.fullmatch(parts[0]) or not parts[1].isdigit() or not SHA.fullmatch(parts[2]):
        return False, "malformed"
    expected = hmac.new(secret, f"{parts[0]}.{parts[1]}".encode("ascii"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, parts[2]):
        return False, "bad signature"
    if now >= int(parts[1]):
        return False, "expired"
    return True, "ok"
