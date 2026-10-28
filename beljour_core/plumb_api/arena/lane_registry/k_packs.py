"""Lane K ownership of the seasonal pack framework (task C2-SEASONAL-PACKS).

Lists every Python file the task adds, with owner and purpose, and a check
that fails when a file in the task folders is missing from the list or a
listed file does not exist. Not wired into registry.py; see the hand-off note.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

K_PACKS_OWNER = "K"
REPO_ROOT = Path(__file__).resolve().parents[4]
K_PACKS_FOLDERS: tuple[str, ...] = (
    "api/plumb_api/seasonal/packs",
    "api/tests/seasonal_packs",
)

_PACKS = "api/plumb_api/seasonal/packs/"
_TESTS = "api/tests/seasonal_packs/"

K_PACKS_MODULES: dict[str, tuple[str, str]] = {
    "api/plumb_api/seasonal/__init__.py": ("K", "seasonal parent package marker"),
    "api/plumb_api/arena/lane_registry/k_packs.py": ("K", "this ownership list and check"),
    _PACKS + "__init__.py": ("K", "public API of the seasonal packs"),
    _PACKS + "occasions.py": ("K", "the 14 frozen occasion ids and greetings"),
    _PACKS + "forbidden.py": ("K", "machine-checkable forbidden motif tokens"),
    _PACKS + "model.py": ("K", "SeasonalPack, Look, Palette and strength levels"),
    _PACKS + "target.py": ("K", "chosen-face target, effect and protected regions"),
    _PACKS + "raster.py": ("K", "anti-aliased layer and compositing"),
    _PACKS + "shapes.py": ("K", "vector shapes shared by SVG and raster output"),
    _PACKS + "motifs.py": ("K", "motif library and MotifProvider"),
    _PACKS + "grades.py": ("K", "colour grades that never brighten"),
    _PACKS + "frames.py": ("K", "motif border frames"),
    _PACKS + "accessories.py": ("K", "face-tracked hats, ears, crowns, glasses"),
    _PACKS + "facepaint.py": ("K", "cheek face paint kept off eyes and mouth"),
    _PACKS + "particles.py": ("K", "seeded frame-by-frame light effects"),
    _PACKS + "greeting.py": ("K", "editable greeting banner"),
    _PACKS + "render.py": ("K", "renderer registry and locality guard"),
    _PACKS + "registry.py": ("K", "register_pack and get_pack"),
    _PACKS + "apply.py": ("K", "apply_look entry point"),
    _PACKS + "builtin.py": ("K", "registers the five shipped packs"),
    _PACKS + "halloween.py": ("K", "Halloween pack"),
    _PACKS + "christmas.py": ("K", "Christmas pack"),
    _PACKS + "thanksgiving.py": ("K", "Thanksgiving pack"),
    _PACKS + "new_year.py": ("K", "New Year pack"),
    _PACKS + "easter.py": ("K", "Easter pack"),
    _PACKS + "hebrew.py": ("K", "arithmetic Hebrew calendar"),
    _PACKS + "lunar_table.py": ("K", "cited table of sighting and almanac dates"),
    _PACKS + "calendar.py": ("K", "next_occurrence and suggest"),
    _PACKS + "synthetic.py": ("K", "procedural drawn portraits for tests"),
    _PACKS + "preview.py": ("K", "pack contact sheet renderer"),
    _PACKS + "stack.py": ("K", "several looks in a fixed drawing order"),
    _PACKS + "catalogue.py": ("K", "JSON catalogue for the web picker"),
    _PACKS + "animate.py": ("K", "frame sequences of light effects"),
    _PACKS + "audit.py": ("K", "respect-rule audit of packs and motifs"),
    _PACKS + "calendar_ics.py": ("K", "iCalendar export of occasion dates"),
    _PACKS + "__main__.py": ("K", "command line for previews and exports"),
    _PACKS + "serialize.py": ("K", "packs as JSON data with validation"),
    _TESTS + "test_packs_model.py": ("K", "model validation tests"),
    _TESTS + "test_packs_registry.py": ("K", "registry and extension tests"),
    _TESTS + "test_packs_locality.py": ("K", "bystander, eye and geometry tests"),
    _TESTS + "test_packs_grades.py": ("K", "grade and skin-tone fairness tests"),
    _TESTS + "test_packs_calendar.py": ("K", "calendar rule and table tests"),
    _TESTS + "test_packs_hebrew.py": ("K", "Hebrew calendar tests"),
    _TESTS + "test_packs_motifs.py": ("K", "motif SVG and respect-rule tests"),
    _TESTS + "test_packs_particles.py": ("K", "particle state tests"),
    _TESTS + "test_packs_strength.py": ("K", "strength curve tests"),
    _TESTS + "test_packs_render.py": ("K", "per-look rendering tests"),
    _TESTS + "test_packs_target.py": ("K", "face target geometry tests"),
    _TESTS + "test_packs_properties.py": ("K", "seeded property tests"),
    _TESTS + "test_packs_speed.py": ("K", "speed budget tests"),
    _TESTS + "test_packs_preview.py": ("K", "preview sheet tests"),
    _TESTS + "test_packs_lane_registry.py": ("K", "tests for this ownership list"),
    _TESTS + "test_packs_stack.py": ("K", "stacking tests"),
    _TESTS + "test_packs_catalogue.py": ("K", "catalogue tests"),
    _TESTS + "test_packs_animate.py": ("K", "animation tests"),
    _TESTS + "test_packs_audit.py": ("K", "respect audit tests"),
    _TESTS + "test_packs_ics.py": ("K", "iCalendar export tests"),
    _TESTS + "test_packs_regressions.py": ("K", "regression tests for review findings"),
    _TESTS + "test_packs_cli.py": ("K", "command-line tests"),
    _TESTS + "test_packs_serialize.py": ("K", "serialization tests"),
}


def k_packs_files(root: Path = REPO_ROOT) -> list[str]:
    """Python files that exist in the task folders, repo-relative."""
    found: list[str] = []
    for folder in K_PACKS_FOLDERS:
        base = root / folder
        if base.is_dir():
            found.extend(
                path.relative_to(root).as_posix()
                for path in sorted(base.rglob("*.py"))
                if "__pycache__" not in path.parts
            )
    return found


def check_k_packs(root: Path = REPO_ROOT) -> list[str]:
    """Problems with the ownership list; empty when every file is listed and present."""
    problems: list[str] = []
    listed = set(K_PACKS_MODULES)
    for path in k_packs_files(root):
        if path not in listed:
            problems.append(f"{path} is in a K folder but not listed in k_packs.py")
    for path, (owner, purpose) in sorted(K_PACKS_MODULES.items()):
        if not (root / path).is_file():
            problems.append(f"{path} is listed in k_packs.py but does not exist")
        if owner != K_PACKS_OWNER:
            problems.append(f"{path} has owner {owner!r}, expected {K_PACKS_OWNER!r}")
        if not purpose.strip():
            problems.append(f"{path} has no purpose")
    return problems


def k_packs_ownership() -> dict[str, dict[str, str]]:
    """Path to owner and purpose rows, for a registry that wants to merge them."""
    return {
        path: {"owner": owner, "purpose": purpose}
        for path, (owner, purpose) in K_PACKS_MODULES.items()
    }
