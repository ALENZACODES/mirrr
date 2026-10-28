"""docs/HAIR-LEVEL-SCALES.md matches the two hair level scales as they are now. Author: John Khan."""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from types import ModuleType

ROOT = Path(__file__).resolve().parents[2]


def scales() -> ModuleType:
    spec = importlib.util.spec_from_file_location("hair_level_scales", ROOT / "scripts/hair_level_scales.py")
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules["hair_level_scales"] = module
    spec.loader.exec_module(module)
    return module


def test_page_is_current() -> None:
    m = scales()
    assert m.OUT.read_text(encoding="utf-8") == m.render(), "run python scripts/hair_level_scales.py"


def test_the_documented_gap_is_what_the_code_does() -> None:
    m = scales()
    gaps = [lift - depth for _, depth, _, lift in m.swatch_rows()]
    assert max(abs(g) for g in gaps) == 2 and gaps[0] == gaps[-1] == 0
    assert all(depth >= lift for _, depth, lift in m.reading_rows()), "the palette never reads hair darker than the lift scale"
