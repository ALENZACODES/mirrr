"""Render one filter on one photo: plan, bake, look, guard, keep (filters-plan.md §3.3).

    plan     recipe + slider + toggles + preset + add-ons -> resolved stages at this strength
    bake     the pointwise colour stages fused into one 33^3 LUT (cached by the plan's key)
    look     LUT (tetrahedral) -> spatial (glow) -> light (vignette, centre, grade) -> bytes
    guard    skin guard inside the skin mask (masks/guard.py), against the look on mid-grey
    keep     Protect skin and Background only restore original pixels (masks/blend.py)

Strength 0 with no add-on returns the photo unchanged, byte for byte. The look is rounded to
bytes before the guard, so the browser's tiled render (web/src/filters/runtime/) and a
whole-photo render are the same pixels. With no skin mask the look runs as the plan's
fallback: strength capped at 30 and no op that turns skin hue (noted in the result).

Background only needs a person outline. With landmarks only, the face oval stands in (the
result says so); with nothing at all the filter can't keep her out and says why.
Author: John Khan.
"""
from __future__ import annotations

import hashlib
import json
from collections import OrderedDict
from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import Any

import numpy as np
from numpy.typing import NDArray

from . import oplist
from .colour import lut as LUT
from .colour import ops as O
from .colour import sample_cache
from .colour import space as S
from .frame import Frame, whole
from .masks import blend, guard, hue_lock
from .recipe import registry
from .strength import to_percent

U8 = NDArray[np.uint8]
Floats = NDArray[np.float64]
FALLBACK_STRENGTH = 30


class FilterUnavailable(ValueError):
    """This filter can't run on this photo as set (the message says what's missing)."""


@dataclass(frozen=True)
class Settings:
    """What she set. None means the recipe's default."""
    strength: float | None = None
    guard: bool | None = None
    protect_skin: bool | None = None
    background_only: bool | None = None
    preset: str | None = None
    addons: Mapping[str, float] = field(default_factory=dict)
    level: float | None = None
    identity_lock: bool = True


@dataclass(frozen=True)
class Stage:
    op: str
    family: str
    params: dict[str, Any]


@dataclass(frozen=True)
class Plan:
    recipe: str
    version: int
    strength: float
    stages: tuple[Stage, ...]
    guard: bool
    guard_mode: str
    protect_skin: bool
    background_only: bool
    fallback: bool
    identity: bool
    pending: tuple[str, ...]
    notes: tuple[str, ...]
    identity_lock: bool = True

    def family(self, name: str) -> list[Stage]:
        return [s for s in self.stages if s.family == name]

    @property
    def key(self) -> str:
        """Stable key of the colour stages, for the LUT cache (same rule in TypeScript)."""
        colour = [[s.op, _canonical(s.params)] for s in self.family("colour")]
        digest = hashlib.sha256(json.dumps(colour, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
        return f"{self.recipe}@{self.version}:{digest[:20]}"


def _canonical(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {k: _canonical(v) for k, v in sorted(value.items())}
    if isinstance(value, list | tuple):
        return [_canonical(v) for v in value]
    if isinstance(value, float):
        return round(value, 12)
    return value


@dataclass
class Result:
    image: U8
    look: U8
    plan: Plan
    notes: list[str]
    grey_look: U8 | None = None
    grey_rise: Floats | None = None


def _settings(recipe: Mapping[str, Any], settings: Settings) -> tuple[float, bool, bool, bool]:
    d = recipe["defaults"]
    if settings.level is not None and settings.strength is not None:
        raise ValueError("choose level or legacy strength, not both")
    strength = float(to_percent(settings.level) if settings.level is not None else
                     d["strength"] if settings.strength is None else settings.strength)
    if not np.isfinite(strength) or not 0 <= strength <= 100:
        raise ValueError("strength must be 0-100")
    strength = min(strength, float(recipe["limits"].get("strengthMax", 100)))
    def pick(given: bool | None, key: str) -> bool:
        return bool(d[key]) if given is None else bool(given)

    return strength, pick(settings.guard, "guard"), pick(settings.protect_skin, "protectSkin"), \
        pick(settings.background_only, "backgroundOnly")


def _preset(recipe: Mapping[str, Any], name: str | None) -> Mapping[str, Any] | None:
    if not name:
        return None
    for p in recipe.get("presets", []):
        if p["name"] == name:
            return p
    raise ValueError(f"{recipe['id']} has no preset {name!r}")


DEFAULTS = Settings()


def plan(recipe: Mapping[str, Any], settings: Settings = DEFAULTS, *, has_skin: bool = False,
         addon_table: Mapping[str, Mapping[str, Any]] | None = None, stats: Mapping[str, float] | None = None) -> Plan:
    """Resolve a recipe at her settings. `stats` carries photo measurements (the colour cast)."""
    addon_table = registry.default().addons if addon_table is None else addon_table
    strength, guard_on, protect, background = _settings(recipe, settings)
    notes: list[str] = []
    pending: list[str] = []
    fallback = guard_on and not has_skin and strength > 0
    if fallback:
        if strength > FALLBACK_STRENGTH:
            notes.append(f"No skin outline for this photo, so the look is capped at {FALLBACK_STRENGTH}.")
            strength = float(FALLBACK_STRENGTH)
        notes.append("No skin outline: steps that could turn skin hue are left out.")
    preset = _preset(recipe, settings.preset)
    raw = [dict(s) for s in recipe["stages"]]
    if preset is not None:
        for stage in raw:
            patch = preset.get("patch", {}).get(stage.get("id"))
            if patch:
                stage["params"] = {**stage.get("params", {}), **patch}
        raw += [dict(s) for s in preset.get("append", [])]
        pending += list(preset.get("pending", []))
    s = strength / 100.0
    stages: list[Stage] = []
    for item in raw:
        op = oplist.op(item["op"])
        params = O.scale_params(op, item.get("params", {}), O.scale_fraction(item.get("scale", "linear"), s))
        stages.append(Stage(op.name, op.family, params))
    amounts = {**{a["id"]: float(a["amount"]) for a in recipe["defaults"].get("addons", [])},
               **{k: float(v) for k, v in settings.addons.items()}}
    for aid, amount in amounts.items():
        entry = addon_table.get(aid)
        if entry is None:
            raise ValueError(f"unknown add-on {aid!r}")
        if not 0 <= amount <= 100:
            raise ValueError("add-on amounts are 0-100")
        if amount <= 0:
            continue
        if entry.get("manualOnly") and aid not in settings.addons:
            pending.append(f"{entry.get('label', aid).lower()} {entry['round']}")
            continue
        if not entry.get("built"):
            pending.append(f"{entry.get('label', aid).lower()} {entry['round']}")
            continue
        st = entry["stage"]
        op = oplist.op(st["op"])
        stages.append(Stage(op.name, op.family, O.scale_params(op, st.get("params", {}), amount / 100.0)))
    if fallback:
        kept: list[Stage] = []
        for st in stages:
            safe = O.without_skin_hue(st.op, st.params)
            if safe is not None:
                kept.append(Stage(st.op, st.family, safe))
        stages = kept
    stats = dict(stats or {})
    with_stats: list[Stage] = []
    for st in stages:
        if oplist.op(st.op).extra.get("stats") == "cast":
            with_stats.append(Stage(st.op, st.family, {**st.params, "castA": stats.get("castA", 0.0),
                                                        "castB": stats.get("castB", 0.0)}))
        else:
            with_stats.append(st)
    identity = strength <= 0 and not any(
        v > 0 and addon_table.get(k, {}).get("built")
        and (not addon_table[k].get("manualOnly") or k in settings.addons)
        for k, v in amounts.items()
    )
    with_stats = [st for st in with_stats if not O.is_neutral(st.op, st.params)]
    order = {f: i for i, f in enumerate(oplist.FAMILY_ORDER)}
    ordered = sorted(enumerate(with_stats), key=lambda t: (
        order[t[1].family], t[1].op == "spatial.grain", t[0],
    ))
    return Plan(recipe["id"], int(recipe["version"]), strength, tuple(st for _, st in ordered), guard_on,
                recipe["limits"].get("guardMode", "full"), protect, background, fallback, identity,
                tuple(pending), tuple(notes), settings.identity_lock)


def needs_cast(recipe: Mapping[str, Any]) -> bool:
    return any(oplist.op(s["op"]).extra.get("stats") == "cast" for s in recipe["stages"])


def colour_transform(stages: list[Stage]):  # type: ignore[no-untyped-def]
    def transform(rgb: Floats) -> Floats:
        out = rgb
        for st in stages:
            out = O.run(st.op, out, st.params)
        return out
    return transform


class LutCache:
    """Baked LUTs by plan key, least recently used dropped first."""

    def __init__(self, limit: int = 32) -> None:
        self.limit = limit
        self.items: OrderedDict[str, Floats] = OrderedDict()
        self.bakes = 0

    def get(self, p: Plan) -> Floats:
        key = p.key
        if key in self.items:
            self.items.move_to_end(key)
            return self.items[key]
        table = LUT.bake(colour_transform(p.family("colour")))
        self.bakes += 1
        self.items[key] = table
        while len(self.items) > self.limit:
            self.items.popitem(last=False)
        return table


CACHE = LutCache()


def look(image: np.ndarray, p: Plan, frame: Frame | None = None,
         cache: LutCache = CACHE, *, sampling: sample_cache.Sampling | None = None,
         uniform_grey: bool = False) -> U8:
    """The look on a block of pixels, before masks: LUT, spatial, light; rounded to bytes."""
    img = np.asarray(image)
    fr = frame or whole(img)
    if sampling is not None and not sample_cache.for_image(sampling, img):
        raise ValueError("LUT sampling reference belongs to a different photo")
    if uniform_grey:
        if sampling is not None or not np.all(img == S.MID_GREY_BYTE):
            raise ValueError("uniform-grey fast path requires known mid-grey source")
        single = LUT.apply_bytes(cache.get(p), img[:1, :1])
        out = np.broadcast_to(single, img.shape).copy()
    elif sampling is not None:
        out = sample_cache.apply(cache.get(p), sampling)
    else:
        out = LUT.apply_bytes(cache.get(p), img)
    for st in p.family("spatial") + p.family("light"):
        out = S.clamp01(oplist.op(st.op).apply(out, st.params, fr))
    return S.unit_to_bytes(out)


def grey_photo(shape: tuple[int, int]) -> U8:
    return np.full(shape + (3,), S.MID_GREY_BYTE, dtype=np.uint8)


def render(image: np.ndarray, recipe: Mapping[str, Any] | str, settings: Settings = DEFAULTS,
           masks: blend.FilterMasks = blend.NO_MASKS, *, face_centre: tuple[float, float] | None = None,
           cache: LutCache = CACHE, hue_source: hue_lock.HueSource | None = None,
           sampling: sample_cache.Sampling | None = None,
           guard_original: guard.OriginalGuard | None = None,
           cast_stats: tuple[float, float] | None = None) -> Result:
    """The whole pipeline on one photo (H x W x 3 or 4 uint8); returns RGB uint8."""
    rec = registry.default().get(recipe) if isinstance(recipe, str) else recipe
    img = np.asarray(image)
    if img.dtype != np.uint8 or img.ndim != 3 or img.shape[-1] not in (3, 4):
        raise ValueError("expected an H x W x 3 (or 4) uint8 photo")
    blend.validate_filter_masks(masks, img.shape[:2])
    # A face-gate batch passes a private, contiguous, read-only RGB snapshot.
    # Reuse it unchanged so verified one-time interpolation, guard and hue
    # references avoid hashing its pixels again for each filter in the pack.
    frozen = (img.shape[-1] == 3 and img.flags.c_contiguous
              and img.flags.owndata and not img.flags.writeable)
    rgb = img if frozen else img[..., :3].copy()
    stats: dict[str, float] = {}
    if needs_cast(rec):
        # The source photo's neutral cast does not depend on the selected
        # recipe. A face-gate runner may prepare it once for every recipe.
        cast = cast_stats if cast_stats is not None else O.photo_cast(S.bytes_to_unit(rgb))
        stats = {"castA": cast[0], "castB": cast[1]}
    p = plan(rec, settings, has_skin=masks.skin is not None, stats=stats)
    notes = list(p.notes)
    if p.background_only and masks.person is None:
        raise FilterUnavailable("Background only needs a person outline for this photo. Turn it off, or add a face first.")
    if p.background_only and masks.source == "landmarks" and masks.note:
        notes.append(masks.note)
    if p.protect_skin and masks.skin is None:
        notes.append("Protect skin needs a skin outline; this photo has none, so it can't be applied.")
    notes += [f"Not built yet: {item}." for item in p.pending]
    if p.identity:
        return Result(rgb.copy(), rgb.copy(), p, notes)
    frame = whole(rgb, face_centre)
    styled = look(rgb, p, frame, cache, sampling=sampling)
    # Mandatory even when the optional lightness/chroma guard is switched off.
    mask = hue_lock.face_mask(masks)
    out = hue_lock.clamp_hue(rgb, styled, mask, hue_source) if p.family("colour") and mask is not None else styled
    observed_grey: U8 | None = None
    observed_rise: Floats | None = None
    if p.guard and masks.skin is not None:
        # A pointwise look sends every mid-grey pixel to the same value. When
        # scoring a prepared face, calculate that reference once, not per pixel.
        uniform = (guard_original is not None and not p.family("spatial")
                   and not p.family("light"))
        if uniform:
            single = look(grey_photo((1, 1)), p, frame, cache, uniform_grey=True)
            observed_grey = np.broadcast_to(single, rgb.shape)
            observed_rise = np.broadcast_to(guard.grey_rise(single), rgb.shape[:2])
        else:
            observed_grey = look(grey_photo(rgb.shape[:2]), p, frame, cache, uniform_grey=True)
            observed_rise = guard.grey_rise(observed_grey)
        out = guard.guard(rgb, out, masks.skin, observed_rise, mode=p.guard_mode,
                          original=guard_original)
    keep = blend.keep_mask(masks, protect_skin=p.protect_skin, background_only=p.background_only, shape=rgb.shape[:2])
    out = blend.keep_original(rgb, out, keep)
    return Result(out, styled, p, notes, observed_grey, observed_rise)
