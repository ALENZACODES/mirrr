"""Occasion model for event cards: the 14 frozen occasion ids and their looks.

Each occasion has a display name, a plain editable English greeting, a palette family and the
ornament ids it may use. Each look narrows that to one palette, a set of layouts, background
pattern families and ornaments. Greetings make no claim about religious meaning.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass

from .errors import UnknownLookError, UnknownOccasionError

OCCASION_IDS: tuple[str, ...] = (
    "halloween", "christmas", "thanksgiving", "new_year", "easter", "kwanzaa", "hanukkah",
    "eid_al_fitr", "eid_al_adha", "diwali", "holi", "vaisakhi", "gurpurab", "bandi_chhor_divas",
)

LAYOUT_IDS: tuple[str, ...] = (
    "photo_top", "photo_bottom", "full_bleed", "framed_centre", "offset_left", "offset_right",
    "arch_window", "circle_badge", "wide_band",
)

PATTERN_FAMILIES: tuple[str, ...] = (
    "stripes", "dots", "tiles", "waves", "rangoli_radial", "snowfall", "confetti",
    "leaf_scatter", "chevrons", "sunburst", "starfield", "scallops", "bokeh", "colour_cloud",
    "garland", "petals", "triangles", "herringbone",
)

# Machine-checked deny-list. No card, look or motif provider may use these ids, and no
# motif id may contain one of them as a token. Covers sacred figures, sacred text, sacred
# buildings, faith emblems that are not greeting decoration, and costume caricature.
FORBIDDEN_MOTIFS: frozenset[str] = frozenset({
    "khanda", "ik_onkar", "om", "swastika", "cross", "crucifix", "rosary", "nativity",
    "angel", "saint", "halo", "deity", "god", "goddess", "prophet", "guru", "guru_portrait",
    "ganesha", "lakshmi", "krishna", "rama", "jesus", "mary", "buddha", "scripture",
    "calligraphy", "verse", "prayer_text", "holy_book", "mosque", "minaret", "kaaba",
    "temple", "golden_temple", "gurdwara", "church", "cathedral", "synagogue",
    "costume_caricature", "headdress", "war_bonnet", "turban_caricature", "blackface",
    "witch_doctor", "sombrero_caricature", "religious_figure",
})


def is_forbidden_motif(motif_id: str) -> bool:
    """True when the id is on the deny-list or contains a deny-listed token."""
    lowered = motif_id.lower()
    if lowered in FORBIDDEN_MOTIFS:
        return True
    tokens = set(lowered.replace("-", "_").split("_"))
    return any(token in FORBIDDEN_MOTIFS for token in tokens)


@dataclass(frozen=True)
class Look:
    """One curated direction for an occasion: palette, layouts, patterns and ornaments."""

    id: str
    name: str
    palette: tuple[str, ...]
    grounds: tuple[int, ...]
    layouts: tuple[str, ...]
    patterns: tuple[str, ...]
    motifs: tuple[str, ...]


@dataclass(frozen=True)
class Occasion:
    """A frozen occasion id with its greeting defaults and looks."""

    id: str
    name: str
    greeting: str
    palette_family: str
    motifs: tuple[str, ...]
    looks: tuple[Look, ...]

    def look(self, look_id: str) -> Look:
        for candidate in self.looks:
            if candidate.id == look_id:
                return candidate
        raise UnknownLookError(self.id, look_id)

    @property
    def look_ids(self) -> tuple[str, ...]:
        return tuple(candidate.id for candidate in self.looks)


ALL_LAYOUTS = LAYOUT_IDS
PORTRAIT_LAYOUTS = ("photo_top", "photo_bottom", "framed_centre", "arch_window", "circle_badge")
BOLD_LAYOUTS = ("full_bleed", "offset_left", "offset_right", "wide_band", "photo_top")


def _look(look_id: str, name: str, palette: str, grounds: tuple[int, ...],
          layouts: tuple[str, ...], patterns: str, motifs: str) -> Look:
    return Look(look_id, name, tuple(palette.split()), grounds, layouts,
                tuple(patterns.split()), tuple(motifs.split()))


HALLOWEEN = Occasion(
    "halloween", "Halloween", "Happy Halloween", "night_orange",
    ("pumpkin", "bat", "full_moon", "spider_web", "candy", "ghost", "star"),
    (
        _look("pumpkin_patch", "Pumpkin Patch", "#1d1a2b #2e2840 #f6c445 #f2711c #fdf6e3 #6b8e3a",
              (0, 4), ALL_LAYOUTS, "dots stripes leaf_scatter scallops tiles",
              "pumpkin full_moon star candy"),
        _look("bat_night", "Bat Night", "#14122a #2b2757 #e9d8a6 #f28f3b #f7f3e9 #8f7cc8",
              (0, 1), ALL_LAYOUTS, "starfield waves chevrons dots sunburst",
              "bat full_moon star spider_web"),
        _look("candy_corn", "Candy Corn", "#fff4e0 #ffd166 #f77f00 #f25c05 #2b2118 #fcbf49",
              (0, 1), ALL_LAYOUTS, "stripes chevrons confetti dots tiles",
              "candy pumpkin star bat"),
        _look("friendly_ghosts", "Friendly Ghosts",
              "#2b2d42 #3d405b #f4d35e #ee964b #f8f7ff #9a8c98",
              (0, 4), PORTRAIT_LAYOUTS, "bokeh starfield scallops waves dots",
              "ghost full_moon star candy"),
        _look("spider_lace", "Spider Lace", "#0f0f12 #2a2a33 #b8f2a6 #9b5de5 #f1f1f1 #f15bb5",
              (0, 4), BOLD_LAYOUTS, "rangoli_radial chevrons stripes tiles sunburst",
              "spider_web bat full_moon star"),
    ),
)

CHRISTMAS = Occasion(
    "christmas", "Christmas", "Merry Christmas", "pine_red",
    ("snowflake", "evergreen", "ornament_ball", "holly", "gift", "candy_cane", "star"),
    (
        _look("snowy_pines", "Snowy Pines", "#f5f7fa #dce7ef #c0392b #1f6f4a #1b2a33 #8fb9a8",
              (0, 1), ALL_LAYOUTS, "snowfall dots waves scallops",
              "snowflake evergreen star"),
        _look("cosy_red", "Cosy Red", "#8e1b1b #b23a3a #f2c14e #2f6b3a #fff8f0 #f5d6c6",
              (0, 4), ALL_LAYOUTS, "stripes tiles dots chevrons",
              "ornament_ball holly gift candy_cane"),
        _look("midnight_lights", "Midnight Lights",
              "#0c1b33 #1d3557 #f1c453 #e63946 #f1faee #a8dadc",
              (0, 1), BOLD_LAYOUTS, "bokeh starfield snowfall sunburst",
              "star ornament_ball snowflake gift"),
        _look("evergreen_paper", "Evergreen Paper",
              "#e9f1e7 #c8dcc4 #b5452f #275d38 #17251b #e2b04a",
              (0, 1), PORTRAIT_LAYOUTS, "leaf_scatter dots tiles scallops",
              "evergreen holly candy_cane star"),
        _look("candy_stripe", "Candy Stripe", "#fff7f5 #fde0dc #d62839 #2a7f62 #2b1d1d #f2b5b5",
              (0, 1), ALL_LAYOUTS, "stripes chevrons dots garland",
              "candy_cane gift ornament_ball holly"),
    ),
)

THANKSGIVING = Occasion(
    "thanksgiving", "Thanksgiving", "Happy Thanksgiving", "harvest_amber",
    ("maple_leaf", "oak_leaf", "acorn", "wheat", "pumpkin", "apple"),
    (
        _look("falling_leaves", "Falling Leaves", "#fbf3e4 #f3dfc1 #d9822b #a23e1a #3b2414 #e9b44c",
              (0, 1), ALL_LAYOUTS, "leaf_scatter dots waves stripes",
              "maple_leaf oak_leaf acorn"),
        _look("harvest_table", "Harvest Table", "#5b3a29 #6f4a35 #e9b44c #d9822b #fbf3e4 #a3b18a",
              (0, 4), ALL_LAYOUTS, "tiles stripes scallops chevrons",
              "wheat pumpkin apple acorn"),
        _look("golden_field", "Golden Field", "#fff6d8 #f6e3a1 #c97b28 #7a5c2e #2e2416 #8a9a5b",
              (0, 1), PORTRAIT_LAYOUTS, "sunburst waves dots leaf_scatter",
              "wheat maple_leaf apple"),
        _look("cranberry_dusk", "Cranberry Dusk", "#3d1f2b #5a2d3c #f2a65a #c44536 #fdf0e6 #d9b48f",
              (0, 4), BOLD_LAYOUTS, "leaf_scatter chevrons stripes bokeh",
              "oak_leaf acorn maple_leaf apple"),
        _look("gratitude_garland", "Gratitude Garland",
              "#f7efe2 #ead7bb #b5651d #6b8e23 #2f2418 #d9a441",
              (0, 1), PORTRAIT_LAYOUTS, "garland leaf_scatter dots herringbone",
              "maple_leaf acorn wheat apple"),
    ),
)

NEW_YEAR = Occasion(
    "new_year", "New Year", "Happy New Year", "midnight_gold",
    ("confetti_burst", "firework", "star", "sparkle", "balloon", "clock"),
    (
        _look("midnight_gold", "Midnight Gold", "#0b0c1e #1b1d3a #f5c542 #e0a526 #fdfbf3 #8c7ae6",
              (0, 1), ALL_LAYOUTS, "confetti starfield sunburst bokeh",
              "firework sparkle star clock"),
        _look("party_pop", "Party Pop", "#fffaf0 #ffe8d6 #ff5d8f #3a86ff #1d1d28 #ffbe0b",
              (0, 1), ALL_LAYOUTS, "confetti dots stripes chevrons",
              "confetti_burst balloon sparkle star"),
        _look("silver_frost", "Silver Frost", "#eef1f6 #d5dbe6 #6c7a96 #2e3a59 #141b2d #b9c2d6",
              (0, 1), PORTRAIT_LAYOUTS, "starfield waves dots tiles",
              "sparkle star clock firework"),
        _look("neon_countdown", "Neon Countdown", "#120327 #2a0a4a #00f5d4 #f15bb5 #fefae0 #fee440",
              (0, 1), BOLD_LAYOUTS, "sunburst chevrons confetti bokeh",
              "firework balloon confetti_burst sparkle"),
        _look("champagne_bubbles", "Champagne Bubbles",
              "#1a1423 #2d2438 #f4d58d #c9a227 #fbf7ef #8d7b9b",
              (0, 1), BOLD_LAYOUTS, "bokeh dots confetti triangles",
              "balloon clock sparkle firework"),
    ),
)

EASTER = Occasion(
    "easter", "Easter", "Happy Easter", "spring_pastel",
    ("egg", "tulip", "daisy", "sparkle"),
    (
        _look("pastel_eggs", "Pastel Eggs", "#fdf7fb #f6e1ee #8fd3c7 #f4a6c1 #3b2f3a #ffd97d",
              (0, 1), ALL_LAYOUTS, "dots scallops waves stripes",
              "egg daisy tulip"),
        _look("spring_meadow", "Spring Meadow", "#eef7e8 #d6ebc9 #f7b538 #e56b6f #23331f #9ad1d4",
              (0, 1), ALL_LAYOUTS, "leaf_scatter dots tiles sunburst",
              "tulip daisy egg"),
        _look("sunrise_garden", "Sunrise Garden", "#fff1e6 #fde2d4 #ff9f1c #2ec4b6 #2b2d42 #cbf3f0",
              (0, 1), PORTRAIT_LAYOUTS, "sunburst scallops waves dots",
              "daisy egg sparkle tulip"),
        _look("robin_egg", "Robin Egg", "#e8f6f8 #c7e8ee #f28482 #84a59d #23343b #f6bd60",
              (0, 1), ALL_LAYOUTS, "dots petals scallops herringbone",
              "egg tulip daisy"),
        _look("lilac_morning", "Lilac Morning", "#f6f0fb #e6d8f2 #9b5de5 #f7b801 #2a1f36 #7ec8a6",
              (0, 1), PORTRAIT_LAYOUTS, "petals waves dots garland",
              "daisy tulip egg sparkle"),
    ),
)

KWANZAA = Occasion(
    "kwanzaa", "Kwanzaa", "Happy Kwanzaa", "kinara_tricolour",
    ("kinara", "harvest_corn", "candle", "star"),
    (
        _look("seven_lights", "Seven Lights", "#1b1b1b #2c2c2c #c1272d #1e7b34 #fbf3e0 #e8b630",
              (0, 4), ALL_LAYOUTS, "stripes tiles bokeh dots",
              "kinara candle star"),
        _look("harvest_gold", "Harvest Gold", "#fbf3e0 #f1dfb5 #c1272d #1e7b34 #1b1b1b #e8b630",
              (0, 1), ALL_LAYOUTS, "chevrons stripes dots sunburst",
              "kinara harvest_corn candle"),
        _look("evening_green", "Evening Green", "#123d26 #1e5236 #e8b630 #c1272d #fbf3e0 #f2e2c4",
              (0, 4), PORTRAIT_LAYOUTS, "tiles scallops bokeh waves",
              "kinara harvest_corn star"),
        _look("unity_gold", "Unity Gold", "#2b1a0e #432a17 #e8b630 #1e7b34 #fbf3e0 #c1272d",
              (0, 4), BOLD_LAYOUTS, "triangles stripes bokeh chevrons",
              "kinara candle harvest_corn"),
        _look("family_table", "Family Table", "#fff8ec #f4e1c1 #1e7b34 #c1272d #22170e #e8b630",
              (0, 1), PORTRAIT_LAYOUTS, "garland dots herringbone scallops",
              "kinara harvest_corn star"),
    ),
)

HANUKKAH = Occasion(
    "hanukkah", "Hanukkah", "Happy Hanukkah", "blue_silver",
    ("menorah", "dreidel", "candle", "gelt_coin", "sparkle"),
    (
        _look("festival_lights", "Festival Lights",
              "#0d1b4c #1a2f6e #f2c14e #7fb3ff #f6f8ff #c5d3f0",
              (0, 1), ALL_LAYOUTS, "bokeh starfield waves dots",
              "menorah candle sparkle"),
        _look("dreidel_spin", "Dreidel Spin", "#f4f7fd #dce5f7 #2f5fd0 #f2b134 #12204a #9bb4ea",
              (0, 1), ALL_LAYOUTS, "tiles dots chevrons stripes",
              "dreidel gelt_coin sparkle"),
        _look("silver_glow", "Silver Glow", "#e8ecf3 #cfd7e4 #335c9e #8a9bb8 #101a2e #f0c75e",
              (0, 1), PORTRAIT_LAYOUTS, "waves scallops dots starfield",
              "menorah dreidel candle"),
        _look("midnight_dreidel", "Midnight Dreidel",
              "#101a3a #1d2b5c #9cc5ff #f2c14e #f4f7ff #6e8fd6",
              (0, 1), BOLD_LAYOUTS, "starfield triangles bokeh chevrons",
              "dreidel candle sparkle gelt_coin"),
        _look("winter_light", "Winter Light", "#f7f9fc #e3e9f4 #2f5fd0 #e0a526 #142042 #a7c0ef",
              (0, 1), PORTRAIT_LAYOUTS, "garland waves dots herringbone",
              "menorah candle gelt_coin"),
    ),
)

_EID_MOTIFS = ("crescent", "lantern", "star", "sparkle")

EID_AL_FITR = Occasion(
    "eid_al_fitr", "Eid al-Fitr", "Eid Mubarak", "lantern_teal",
    _EID_MOTIFS,
    (
        _look("lantern_night", "Lantern Night", "#0f2a3d #16405c #f2c14e #e07a5f #f7f4ea #81b29a",
              (0, 1), ALL_LAYOUTS, "starfield bokeh tiles waves",
              "lantern crescent star"),
        _look("mint_morning", "Mint Morning", "#eef8f4 #d2ede2 #2a9d8f #e9c46a #1d3530 #f4a261",
              (0, 1), ALL_LAYOUTS, "tiles dots scallops sunburst",
              "crescent lantern sparkle"),
        _look("rose_gold", "Rose Gold", "#fbf1ee #f3d9d1 #b5838d #6d597a #2b2233 #e5989b",
              (0, 1), PORTRAIT_LAYOUTS, "rangoli_radial dots waves starfield",
              "crescent star lantern"),
        _look("golden_crescent", "Golden Crescent",
              "#1b1430 #2c2150 #f2c14e #e07a5f #faf6ec #8fb8de",
              (0, 1), BOLD_LAYOUTS, "starfield bokeh triangles tiles",
              "crescent star lantern"),
        _look("dawn_sky", "Dawn Sky", "#fff4ea #ffe0c7 #e76f51 #2a9d8f #2b2622 #f4a261",
              (0, 1), PORTRAIT_LAYOUTS, "garland sunburst dots petals",
              "lantern crescent sparkle"),
    ),
)

EID_AL_ADHA = Occasion(
    "eid_al_adha", "Eid al-Adha", "Eid Mubarak", "desert_gold",
    _EID_MOTIFS,
    (
        _look("desert_dusk", "Desert Dusk", "#3a2618 #573a24 #f2c14e #d4a373 #fdf6ec #a3b18a",
              (0, 4), ALL_LAYOUTS, "starfield tiles waves bokeh",
              "crescent lantern star"),
        _look("sand_and_sky", "Sand and Sky", "#fdf6ec #f2e3c9 #2f6690 #d4a373 #1f2a33 #81c3d7",
              (0, 1), ALL_LAYOUTS, "tiles dots chevrons sunburst",
              "lantern crescent sparkle"),
        _look("emerald_evening", "Emerald Evening",
              "#0d3b2e #145a45 #e9c46a #e76f51 #f4f1de #8ab17d",
              (0, 1), PORTRAIT_LAYOUTS, "rangoli_radial starfield scallops dots",
              "crescent star lantern"),
        _look("night_market", "Night Market", "#14213d #22355e #fca311 #e07a5f #f6f6f6 #8ecae6",
              (0, 1), BOLD_LAYOUTS, "starfield triangles bokeh chevrons",
              "lantern crescent star"),
        _look("olive_grove", "Olive Grove", "#f4f1e6 #e2dcc5 #6b8e23 #c08a3e #262a1c #a3b18a",
              (0, 1), PORTRAIT_LAYOUTS, "garland herringbone dots tiles",
              "crescent lantern sparkle"),
    ),
)

DIWALI = Occasion(
    "diwali", "Diwali", "Happy Diwali", "marigold_flame",
    ("diya", "rangoli", "marigold", "sparkle", "light_string", "firework"),
    (
        _look("diya_glow", "Diya Glow", "#2a0f3d #43195e #ffb627 #ff7b00 #fff4e0 #e05780",
              (0, 1), ALL_LAYOUTS, "bokeh rangoli_radial starfield dots",
              "diya sparkle light_string"),
        _look("rangoli_bright", "Rangoli Bright", "#fff4e0 #ffe1b3 #e05780 #0f9d8a #2a1a12 #ffb627",
              (0, 1), ALL_LAYOUTS, "rangoli_radial dots scallops sunburst",
              "rangoli marigold diya"),
        _look("marigold_garland", "Marigold Garland",
              "#7a1f2b #962c3b #f9c74f #f28c28 #fff6e9 #90be6d",
              (0, 4), PORTRAIT_LAYOUTS, "scallops stripes dots bokeh",
              "marigold diya light_string"),
        _look("festival_night", "Festival Night", "#0b1026 #1a2147 #ffd166 #ef476f #fdfcf7 #06d6a0",
              (0, 1), BOLD_LAYOUTS, "starfield bokeh sunburst confetti",
              "firework diya sparkle"),
        _look("pink_marigold", "Pink Marigold", "#fff0f5 #ffd6e6 #e05780 #f28c28 #2d1622 #ffb627",
              (0, 1), PORTRAIT_LAYOUTS, "petals garland rangoli_radial dots",
              "marigold diya rangoli"),
    ),
)

HOLI = Occasion(
    "holi", "Holi", "Happy Holi", "colour_burst",
    ("colour_powder", "colour_splash", "balloon", "marigold"),
    (
        _look("colour_cloud", "Colour Cloud", "#fffdf7 #fff1e6 #ff5fa2 #2a9d8f #1e1b24 #f9c74f",
              (0, 1), ALL_LAYOUTS, "colour_cloud confetti dots waves",
              "colour_powder colour_splash balloon"),
        _look("spring_splash", "Spring Splash", "#f0fff4 #d8f3dc #8e44ad #f4a261 #1b2a22 #e63946",
              (0, 1), ALL_LAYOUTS, "colour_cloud dots sunburst scallops",
              "colour_splash marigold colour_powder"),
        _look("vivid_play", "Vivid Play", "#2b1055 #3f1d7a #f1c40f #ff5fa2 #fffaf2 #2ec4b6",
              (0, 1), BOLD_LAYOUTS, "colour_cloud confetti chevrons bokeh",
              "colour_powder balloon colour_splash"),
        _look("pastel_gulal", "Pastel Gulal", "#fdf8ff #f1e6ff #ff7aa2 #3ec1d3 #241a2e #ffd166",
              (0, 1), PORTRAIT_LAYOUTS, "petals colour_cloud dots waves",
              "colour_powder balloon colour_splash"),
        _look("rainbow_run", "Rainbow Run", "#101820 #1d2b36 #ff4d6d #4cc9f0 #fbfbf2 #ffd60a",
              (0, 1), BOLD_LAYOUTS, "colour_cloud triangles confetti sunburst",
              "colour_splash colour_powder balloon"),
    ),
)

_SIKH_LIGHTS = ("diya", "light_string", "marigold", "sparkle")

VAISAKHI = Occasion(
    "vaisakhi", "Vaisakhi", "Happy Vaisakhi", "harvest_saffron",
    ("wheat", "light_string", "marigold", "sparkle", "kite"),
    (
        _look("golden_harvest", "Golden Harvest", "#fff7e0 #fbe7b0 #e08e0b #3f7d3a #2b2111 #f6bd60",
              (0, 1), ALL_LAYOUTS, "leaf_scatter sunburst stripes dots",
              "wheat marigold sparkle"),
        _look("fair_day", "Fair Day", "#e8f4fd #cfe6f7 #f28c28 #2a7f62 #13293d #f6bd60",
              (0, 1), ALL_LAYOUTS, "chevrons dots waves confetti",
              "kite wheat light_string"),
        _look("saffron_evening", "Saffron Evening",
              "#3b2106 #5a3410 #f6bd60 #e08e0b #fff7e8 #a3c585",
              (0, 4), PORTRAIT_LAYOUTS, "bokeh scallops stripes starfield",
              "light_string wheat marigold"),
        _look("mustard_fields", "Mustard Fields", "#fffbe6 #fbefb0 #d4a017 #2f6b3a #262012 #e07a2e",
              (0, 1), PORTRAIT_LAYOUTS, "garland herringbone leaf_scatter dots",
              "wheat marigold kite"),
        _look("harvest_dusk", "Harvest Dusk", "#2d1b0e #47301a #f6bd60 #84a59d #fdf6e9 #e08e0b",
              (0, 4), BOLD_LAYOUTS, "triangles bokeh sunburst stripes",
              "wheat light_string sparkle"),
    ),
)

GURPURAB = Occasion(
    "gurpurab", "Gurpurab", "Happy Gurpurab", "lamp_gold",
    _SIKH_LIGHTS,
    (
        _look("lamp_rows", "Lamp Rows", "#1a1033 #2c1d52 #ffb627 #f28c28 #fff6e5 #9bc1bc",
              (0, 1), ALL_LAYOUTS, "bokeh starfield dots waves",
              "diya light_string sparkle"),
        _look("morning_marigold", "Morning Marigold",
              "#fffaf0 #ffeccc #f28c28 #2f6690 #22201c #f9c74f",
              (0, 1), ALL_LAYOUTS, "scallops dots stripes sunburst",
              "marigold diya sparkle"),
        _look("quiet_glow", "Quiet Glow", "#0e2a2f #17414a #f6c453 #f2a65a #f4f1de #c9a0dc",
              (0, 1), PORTRAIT_LAYOUTS, "bokeh waves starfield tiles",
              "light_string diya marigold"),
        _look("evening_lamps", "Evening Lamps", "#1b1b2f #2e2e4d #f7b267 #f4845f #fff8ee #a1c6ea",
              (0, 1), BOLD_LAYOUTS, "triangles bokeh garland starfield",
              "diya light_string sparkle"),
        _look("saffron_dawn", "Saffron Dawn", "#fff6ea #ffe3c2 #ef8a17 #1d4e89 #261b0f #f6c453",
              (0, 1), PORTRAIT_LAYOUTS, "garland petals dots waves",
              "marigold diya light_string"),
    ),
)

BANDI_CHHOR_DIVAS = Occasion(
    "bandi_chhor_divas", "Bandi Chhor Divas", "Happy Bandi Chhor Divas", "lamp_night",
    _SIKH_LIGHTS + ("firework",),
    (
        _look("night_of_lamps", "Night of Lamps", "#0b0f2a #1a2150 #ffc94a #ff8c42 #fdfaf2 #7bdff2",
              (0, 1), ALL_LAYOUTS, "bokeh starfield sunburst dots",
              "diya light_string firework"),
        _look("warm_welcome", "Warm Welcome", "#fff5e6 #ffe2bf #e85d04 #1d4e89 #261a10 #ffba08",
              (0, 1), ALL_LAYOUTS, "scallops stripes dots confetti",
              "marigold diya sparkle"),
        _look("sky_lights", "Sky Lights", "#140f2e #2b2158 #ffd166 #ef476f #fffdf5 #06d6a0",
              (0, 1), BOLD_LAYOUTS, "starfield confetti bokeh chevrons",
              "firework sparkle light_string"),
        _look("garland_glow", "Garland Glow", "#2a1035 #43195e #ffcf56 #ff6f59 #fff7ec #8ac6d1",
              (0, 1), PORTRAIT_LAYOUTS, "garland bokeh petals dots",
              "diya marigold light_string"),
        _look("sparkler_night", "Sparkler Night", "#0d1321 #1d2d44 #9ad1d4 #ffb627 #fdfcf8 #748cab",
              (0, 1), BOLD_LAYOUTS, "starfield triangles confetti bokeh",
              "firework sparkle diya"),
    ),
)

OCCASIONS: dict[str, Occasion] = {
    occ.id: occ
    for occ in (HALLOWEEN, CHRISTMAS, THANKSGIVING, NEW_YEAR, EASTER, KWANZAA, HANUKKAH,
                EID_AL_FITR, EID_AL_ADHA, DIWALI, HOLI, VAISAKHI, GURPURAB, BANDI_CHHOR_DIVAS)
}


def get_occasion(occasion_id: str) -> Occasion:
    """Look up an occasion by its frozen id."""
    try:
        return OCCASIONS[occasion_id]
    except KeyError:
        raise UnknownOccasionError(occasion_id) from None


def get_look(occasion_id: str, look_id: str) -> Look:
    """Look up one look of an occasion."""
    return get_occasion(occasion_id).look(look_id)
