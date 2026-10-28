"""Lane K registry file for task C1 (event card maker and uniqueness engine).

Lists every Python file the task adds, with its owner and purpose. check() fails when a file
in the task's folders is missing from the list or a listed file does not exist. This file is
not wired into registry.py or lane_registry/__init__.py; that is a cross-lane request.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

OWNER = "K"
REPO_ROOT = Path(__file__).resolve().parents[4]
OWNED_FOLDERS: tuple[str, ...] = ("api/plumb_api/seasonal/cards", "api/tests/seasonal_cards")
SELF_PATH = "api/plumb_api/arena/lane_registry/k_cards.py"

_CARDS = "api/plumb_api/seasonal/cards"
_TESTS = "api/tests/seasonal_cards"

K_CARDS_FILES: dict[str, tuple[str, str]] = {
    "api/plumb_api/seasonal/__init__.py": (OWNER, "seasonal package marker (shared bytes)"),
    f"{_CARDS}/__init__.py": (OWNER, "public API of the card maker"),
    f"{_CARDS}/errors.py": (OWNER, "typed card errors"),
    f"{_CARDS}/colour.py": (OWNER, "WCAG contrast, CIELAB and colour-vision maths"),
    f"{_CARDS}/shapes.py": (OWNER, "drawing primitives shared by both renderers"),
    f"{_CARDS}/motifs.py": (OWNER, "built-in ornament drawings"),
    f"{_CARDS}/occasions.py": (OWNER, "14 occasions, looks and forbidden motifs"),
    f"{_CARDS}/provider.py": (OWNER, "MotifProvider contract and audit"),
    f"{_CARDS}/geometry.py": (OWNER, "boxes and collision tests"),
    f"{_CARDS}/patterns.py": (OWNER, "background pattern families"),
    f"{_CARDS}/grammar.py": (OWNER, "seeded design grammar and CardDesign"),
    f"{_CARDS}/text.py": (OWNER, "text sanitising, wrapping and sizing"),
    f"{_CARDS}/photo.py": (OWNER, "photo intake, stripping, fit and masks"),
    f"{_CARDS}/compose.py": (OWNER, "shared composition for both renderers"),
    f"{_CARDS}/render_svg.py": (OWNER, "SVG renderer"),
    f"{_CARDS}/render_raster.py": (OWNER, "Pillow raster renderer"),
    f"{_CARDS}/fingerprint.py": (OWNER, "design fingerprints and perceptual hash"),
    f"{_CARDS}/store.py": (OWNER, "SQLite store of issued designs"),
    f"{_CARDS}/uniqueness.py": (OWNER, "uniqueness engine with bounded retries"),
    f"{_CARDS}/export.py": (OWNER, "PNG and virtual-card payload export"),
    f"{_CARDS}/service.py": (OWNER, "make_card, make_another and exports"),
    f"{_CARDS}/synthetic.py": (OWNER, "procedural portraits for tests and demos"),
    f"{_CARDS}/access.py": (OWNER, "measured text contrast and plate fallback"),
    f"{_CARDS}/vision.py": (OWNER, "colour-vision safety report"),
    f"{_CARDS}/design_space.py": (OWNER, "design-space size estimate"),
    f"{_CARDS}/scene.py": (OWNER, "scene type for envelope and gift tag"),
    f"{_CARDS}/keepsakes.py": (OWNER, "matching envelope and gift tag"),
    f"{_CARDS}/printing.py": (OWNER, "print-safe colours, bleed and crop marks"),
    f"{_CARDS}/gallery.py": (OWNER, "contact sheet of make-another variants"),
    f"{_CARDS}/bundle.py": (OWNER, "deterministic ZIP download set"),
    f"{_CARDS}/animate.py": (OWNER, "looping animated card"),
    f"{_CARDS}/handlers.py": (OWNER, "JSON request handlers for the routes lane"),
    f"{_CARDS}/glyphs.py": (OWNER, "accent drawing for the ASCII-only built-in font"),
    SELF_PATH: (OWNER, "this registry file"),
    f"{_TESTS}/test_cards_occasions.py": (OWNER, "occasion model and respect rule tests"),
    f"{_TESTS}/test_cards_colour.py": (OWNER, "colour maths and palette contrast tests"),
    f"{_TESTS}/test_cards_grammar.py": (OWNER, "design grammar tests"),
    f"{_TESTS}/test_cards_text.py": (OWNER, "text sanitiser and layout tests"),
    f"{_TESTS}/test_cards_photo.py": (OWNER, "photo intake tests"),
    f"{_TESTS}/test_cards_render.py": (OWNER, "renderer agreement tests"),
    f"{_TESTS}/test_cards_uniqueness.py": (OWNER, "uniqueness engine tests"),
    f"{_TESTS}/test_cards_export.py": (OWNER, "export and privacy tests"),
    f"{_TESTS}/test_cards_api.py": (OWNER, "public API tests"),
    f"{_TESTS}/test_cards_registry.py": (OWNER, "registry check tests"),
    f"{_TESTS}/test_cards_access.py": (OWNER, "accessibility and colour-vision tests"),
    f"{_TESTS}/test_cards_space.py": (OWNER, "design-space estimate tests"),
    f"{_TESTS}/test_cards_replay.py": (OWNER, "deterministic replay tests"),
    f"{_TESTS}/test_cards_speed.py": (OWNER, "speed budget tests"),
    f"{_TESTS}/test_cards_fuzz.py": (OWNER, "seeded fuzz tests"),
    f"{_TESTS}/test_cards_keepsakes.py": (OWNER, "envelope, gift tag and print tests"),
    f"{_TESTS}/test_cards_gallery.py": (OWNER, "contact sheet and store robustness tests"),
    f"{_TESTS}/test_cards_formats.py": (OWNER, "portrait, square and story format tests"),
    f"{_TESTS}/test_cards_bundle.py": (OWNER, "download set tests"),
    f"{_TESTS}/test_cards_animate.py": (OWNER, "animated card tests"),
    f"{_TESTS}/test_cards_handlers.py": (OWNER, "request handler tests"),
    f"{_TESTS}/test_cards_soak.py": (OWNER, "seeded end-to-end soak test"),
    f"{_TESTS}/test_cards_review.py": (OWNER, "regression tests from code reviews"),
}


def actual_files(root: Path = REPO_ROOT) -> set[str]:
    """Every .py file present under the task folders, plus the two single files."""
    found: set[str] = set()
    for folder in OWNED_FOLDERS:
        base = root / folder
        if base.is_dir():
            found.update(p.relative_to(root).as_posix() for p in base.rglob("*.py")
                         if "__pycache__" not in p.parts)
    for single in ("api/plumb_api/seasonal/__init__.py", SELF_PATH):
        if (root / single).is_file():
            found.add(single)
    return found


def check(root: Path = REPO_ROOT,
          listed: dict[str, tuple[str, str]] | None = None) -> list[str]:
    """Problems: files present but unlisted, listed but missing, or with a wrong owner."""
    entries = K_CARDS_FILES if listed is None else listed
    present = actual_files(root)
    problems = [f"unlisted: {path}" for path in sorted(present - set(entries))]
    problems += [f"missing: {path}" for path in sorted(set(entries) - present)]
    problems += [f"owner of {path} is {owner!r}, expected 'K'"
                 for path, (owner, _) in sorted(entries.items()) if owner != OWNER]
    return problems
