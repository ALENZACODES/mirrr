"""
Aesthetic engine — maps Qloo taste signals to beauty aesthetic vectors.

This is the core of the Beljour × Qloo integration. Qloo tells us what
cultural entities (artists, shows, brands, cuisines) a person gravitates
toward. We translate those signals into beauty aesthetic dimensions that
Beljour's existing shade and look engines can act on.

The aesthetic dimensions we use:

    intensity       low (natural/bare) → high (glam/editorial)
    warmth          cool → warm undertone preference in colour
    boldness        minimalist → maximalist
    texture         skin-forward → full-coverage / sculptural
    colour_palette  neutral → earthy → jewel → pastel → neon
    hair_vibe       sleek/straight → textured/curly → voluminous/fantasy

These are deliberately not tied to skin tone or ethnicity — they are
aesthetic style dimensions. Skin tone comes from Beljour's shade engine.
The aesthetic vector then *combines* with skin tone to surface looks that
work for this person's actual colouring AND their style identity.

Ethnicity-first design principle
---------------------------------
Most mainstream beauty apps tune their virtual try-on for light/medium
skin and Eurocentric hair textures. Beljour + Qloo inverts this:

  1. We resolve the user's cultural taste inputs via Qloo (e.g. Burna Boy,
     K-drama, Soca, Bollywood).
  2. Qloo returns tags like "Afrobeats", "K-pop", "Caribbean", "Desi".
  3. We map those tags to aesthetic sub-palettes that actually represent
     those aesthetics — the rich pigments of West African fashion, the
     graphic liner of K-beauty, the warm bronzes of Caribbean glam.
  4. Beljour's CIEDE2000 shade engine finds the actual closest foundation
     match for the user's measured skin, within that aesthetic palette.

No look is presented as a "default" for an ethnicity. The taste signal
drives the aesthetic; the shade engine drives the match.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any


# ---------------------------------------------------------------------------
# Aesthetic vector
# ---------------------------------------------------------------------------

@dataclass
class AestheticVector:
    """
    Normalised aesthetic dimensions, each in [0.0, 1.0].

    0.0 = low end of the dimension label, 1.0 = high end.
    """

    # Core dimensions
    intensity: float = 0.5        # bare face → full glam
    warmth: float = 0.5           # cool-toned palette → warm-toned palette
    boldness: float = 0.5         # minimalist → maximalist
    texture: float = 0.5          # skin-forward (sheer) → full-coverage/sculptural
    colour_palette: str = "neutral"  # neutral | earthy | jewel | pastel | neon | multi

    # Hair
    hair_vibe: str = "natural"    # natural | sleek | textured | voluminous | fantasy | protective

    # Cultural aesthetic tags from Qloo (preserved for explain layer)
    cultural_tags: list[str] = field(default_factory=list)

    # Named aesthetic archetypes (may be multiple)
    archetypes: list[str] = field(default_factory=list)

    # Source trace for the explain layer
    trace: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "intensity": round(self.intensity, 3),
            "warmth": round(self.warmth, 3),
            "boldness": round(self.boldness, 3),
            "texture": round(self.texture, 3),
            "colour_palette": self.colour_palette,
            "hair_vibe": self.hair_vibe,
            "cultural_tags": self.cultural_tags,
            "archetypes": self.archetypes,
            "trace": self.trace,
        }


# ---------------------------------------------------------------------------
# Tag → dimension signal mappings
# ---------------------------------------------------------------------------

# Each entry: (tag_substring_patterns, dimension, delta, weight)
# delta: positive = push toward high end, negative = toward low end
# weight: how much of a full push one tag provides (0–1)

_TAG_SIGNALS: list[tuple[list[str], str, float, float]] = [
    # ── Intensity signals ──────────────────────────────────────────────
    (["glam", "editorial", "high fashion", "red carpet", "drag", "avant-garde"],   "intensity", +0.35, 1.0),
    (["minimal", "natural", "no makeup", "bare", "clean beauty", "skincare"],       "intensity", -0.30, 1.0),
    (["everyday", "casual", "effortless"],                                           "intensity", -0.15, 0.7),
    (["bold", "graphic", "theatrical", "festival"],                                  "intensity", +0.25, 0.8),

    # ── Warmth signals ────────────────────────────────────────────────
    (["afrobeats", "afropop", "west african", "afro", "yoruba", "igbo", "akan"],    "warmth", +0.30, 1.0),
    (["caribbean", "soca", "dancehall", "reggae", "jamaican"],                       "warmth", +0.25, 0.9),
    (["latin", "latina", "reggaeton", "cumbia", "salsa", "merengue"],               "warmth", +0.25, 0.9),
    (["south asian", "desi", "bollywood", "punjabi", "tamil", "hindi"],              "warmth", +0.20, 0.9),
    (["middle eastern", "arabic", "khaleeji", "persian"],                            "warmth", +0.20, 0.8),
    (["scandinavian", "nordic", "cool girl", "clean", "icy"],                       "warmth", -0.20, 0.8),
    (["k-pop", "k-beauty", "korean", "japanese", "anime"],                          "warmth", -0.10, 0.7),

    # ── Boldness signals ──────────────────────────────────────────────
    (["maximalist", "bold colour", "statement", "vibrant", "expressive"],           "boldness", +0.35, 1.0),
    (["quiet luxury", "old money", "understated", "minimal"],                       "boldness", -0.30, 1.0),
    (["streetwear", "hype", "urban", "hip hop", "trap"],                            "boldness", +0.20, 0.8),
    (["ballet", "ballet core", "soft"],                                              "boldness", -0.20, 0.7),
    (["gothic", "dark", "emo", "grunge", "punk"],                                   "boldness", +0.15, 0.7),

    # ── Texture / coverage signals ────────────────────────────────────
    (["glass skin", "dewy", "glassy", "luminous", "skinimalism"],                   "texture", -0.25, 0.9),
    (["full coverage", "matte", "flawless", "airbrushed", "photoshoot"],            "texture", +0.25, 0.9),
    (["contouring", "sculpt", "baking", "cut crease"],                              "texture", +0.20, 0.8),

    # ── Colour palette signals ────────────────────────────────────────
    # (handled separately in _resolve_colour_palette)

    # ── Hair vibe signals ─────────────────────────────────────────────
    (["natural hair", "afro", "coils", "locs", "twist out", "wash and go"],        "hair_vibe", None, 0.0, 0.0),  # handled separately
    (["protective styles", "braids", "box braids", "cornrows", "faux locs"],       "hair_vibe", None, 0.0, 0.0),
    (["sleek", "bone straight", "blowout", "silk press"],                           "hair_vibe", None, 0.0, 0.0),
    (["voluminous", "big hair", "glamour waves", "bouncy"],                         "hair_vibe", None, 0.0, 0.0),
    (["fantasy", "colour hair", "wig", "creative colour", "mermaid"],               "hair_vibe", None, 0.0, 0.0),
]

# Colour palette resolution: tag patterns → palette name
_COLOUR_PALETTE_MAP: list[tuple[list[str], str]] = [
    (["earth tone", "terracotta", "clay", "rust", "brown", "warm nude", "sienne", "cinnamon"], "earthy"),
    (["jewel", "emerald", "sapphire", "ruby", "amethyst", "deep colour", "rich colour"],        "jewel"),
    (["pastel", "soft pink", "lavender", "lilac", "baby blue", "soft colour", "kawaii"],        "pastel"),
    (["neon", "electric", "fluorescent", "rave", "UV"],                                          "neon"),
    (["rainbow", "multi", "colourful", "playful palette", "festival makeup"],                   "multi"),
]

# Hair vibe resolution: tag patterns → hair_vibe name
_HAIR_VIBE_MAP: list[tuple[list[str], str]] = [
    (["natural hair", "afro", "coils", "locs", "twist", "kinky", "wash and go"], "textured"),
    (["protective", "braids", "box braid", "cornrow", "faux locs", "senegalese", "crochet"], "protective"),
    (["sleek", "bone straight", "blowout", "silk press", "flat iron"], "sleek"),
    (["voluminous", "big hair", "bouncy", "waves", "glamour curl"], "voluminous"),
    (["fantasy", "colour hair", "creative colour", "mermaid", "wig"], "fantasy"),
]

# Archetype mapping: tag clusters → named aesthetics
_ARCHETYPE_MAP: list[tuple[list[str], str]] = [
    (["afrobeats", "afropop", "west african", "soca", "dancehall", "caribbean"], "Afro-Glam"),
    (["k-pop", "k-beauty", "korean beauty", "anime", "japanese"],                "K-Beauty"),
    (["bollywood", "south asian", "desi", "hindii", "punjabi", "tamil"],         "Desi Glam"),
    (["middle eastern", "arabic", "khaleeji", "persian"],                        "Gulf Glam"),
    (["latin", "latina", "reggaeton", "cumbia"],                                 "Latina Glam"),
    (["editorial", "avant-garde", "high fashion", "runway"],                     "Editorial"),
    (["clean beauty", "skinimalism", "minimal", "glass skin"],                   "Clean Minimal"),
    (["gothic", "dark", "emo", "grunge", "punk"],                                "Dark Aesthetic"),
    (["festival", "rave", "neon", "coachella"],                                  "Festival Glam"),
    (["drag", "theatrical", "camp"],                                             "Theatrical Drag"),
    (["quiet luxury", "old money", "understated"],                               "Quiet Luxury"),
]


def _match_patterns(text: str, patterns: list[str]) -> bool:
    t = text.lower()
    return any(re.search(p, t) for p in patterns)


# ---------------------------------------------------------------------------
# Main builder
# ---------------------------------------------------------------------------

def build_aesthetic_vector(
    qloo_tags: list[dict[str, Any]],
    *,
    extra_inputs: list[str] | None = None,
) -> AestheticVector:
    """
    Build an AestheticVector from Qloo tag results.

    Args:
        qloo_tags: list of dicts with at least {"name": str, "affinity": float}
        extra_inputs: optional user-typed free-text inputs to layer in

    Returns:
        AestheticVector with all dimensions filled
    """
    vec = AestheticVector()
    cultural_tags: list[str] = []
    trace: list[str] = []

    # Accumulate weighted dimension deltas
    dim_acc: dict[str, float] = {
        "intensity": 0.0,
        "warmth": 0.0,
        "boldness": 0.0,
        "texture": 0.0,
    }

    all_texts = [t.get("name", "") for t in qloo_tags] + (extra_inputs or [])
    all_affinities = [t.get("affinity", 0.5) for t in qloo_tags] + [0.5] * len(extra_inputs or [])

    for text, affinity in zip(all_texts, all_affinities):
        if not text:
            continue
        cultural_tags.append(text)

        for patterns, dimension, delta, weight in _TAG_SIGNALS:
            if dimension is None:
                continue
            if _match_patterns(text, patterns):
                contribution = delta * weight * min(float(affinity), 1.0)
                dim_acc[dimension] += contribution
                trace.append(f"{text!r} → {dimension} {contribution:+.2f}")

    # Clamp to [0, 1]
    vec.intensity = max(0.0, min(1.0, 0.5 + dim_acc["intensity"]))
    vec.warmth    = max(0.0, min(1.0, 0.5 + dim_acc["warmth"]))
    vec.boldness  = max(0.0, min(1.0, 0.5 + dim_acc["boldness"]))
    vec.texture   = max(0.0, min(1.0, 0.5 + dim_acc["texture"]))

    # Colour palette
    palette_votes: dict[str, float] = {}
    for text, affinity in zip(all_texts, all_affinities):
        for patterns, palette in _COLOUR_PALETTE_MAP:
            if _match_patterns(text, patterns):
                palette_votes[palette] = palette_votes.get(palette, 0.0) + float(affinity)
    if palette_votes:
        vec.colour_palette = max(palette_votes, key=palette_votes.__getitem__)
        trace.append(f"colour_palette → {vec.colour_palette!r} (votes: {palette_votes})")

    # Hair vibe
    hair_votes: dict[str, float] = {}
    for text, affinity in zip(all_texts, all_affinities):
        for patterns, vibe in _HAIR_VIBE_MAP:
            if _match_patterns(text, patterns):
                hair_votes[vibe] = hair_votes.get(vibe, 0.0) + float(affinity)
    if hair_votes:
        vec.hair_vibe = max(hair_votes, key=hair_votes.__getitem__)
        trace.append(f"hair_vibe → {vec.hair_vibe!r} (votes: {hair_votes})")

    # Archetypes
    archetypes: list[str] = []
    for text in all_texts:
        for patterns, archetype in _ARCHETYPE_MAP:
            if _match_patterns(text, patterns) and archetype not in archetypes:
                archetypes.append(archetype)
    vec.archetypes = archetypes

    vec.cultural_tags = list(dict.fromkeys(cultural_tags))  # deduplicate, preserve order
    vec.trace = trace

    return vec
