"""Deterministic replay tests: the same seed and inputs give byte-identical output.

Author: John Khan.
"""

from __future__ import annotations

import hashlib
import os
import subprocess
import sys
from pathlib import Path

from plumb_api.seasonal.cards import OCCASION_IDS, export_png, export_svg, make_card
from plumb_api.seasonal.cards.compose import compose
from plumb_api.seasonal.cards.grammar import design_from_seed
from plumb_api.seasonal.cards.render_svg import render_svg
from plumb_api.seasonal.cards.synthetic import encode_with_metadata, synthetic_portrait
from plumb_api.seasonal.cards.text import CardText

API_ROOT = Path(__file__).resolve().parents[2]
TEXT = CardText("Ana", "Ben", "See you soon", "Happy Holidays")
SCRIPT = """
import hashlib, sys
from plumb_api.seasonal.cards.compose import compose
from plumb_api.seasonal.cards.grammar import design_from_seed
from plumb_api.seasonal.cards.render_svg import render_svg
from plumb_api.seasonal.cards.text import CardText
text = CardText("Ana", "Ben", "See you soon", "Happy Holidays")
out = []
for occasion in sys.argv[1:]:
    svg = render_svg(compose(design_from_seed(occasion, 4242), text))
    out.append(hashlib.sha256(svg.encode()).hexdigest())
print(",".join(out))
"""


def _svg_digest(occasion: str, seed: int) -> str:
    svg = render_svg(compose(design_from_seed(occasion, seed), TEXT))
    return hashlib.sha256(svg.encode()).hexdigest()


def test_hundred_seeds_replay_byte_identical_svg() -> None:
    for seed in range(100):
        occasion = OCCASION_IDS[seed % len(OCCASION_IDS)]
        first = render_svg(compose(design_from_seed(occasion, seed), TEXT))
        second = render_svg(compose(design_from_seed(occasion, seed), TEXT))
        assert first == second, (occasion, seed)


def test_replay_holds_across_processes_and_hash_seeds() -> None:
    expected = ",".join(_svg_digest(o, 4242) for o in OCCASION_IDS[:4])
    for hash_seed in ("0", "123", "random"):
        env = dict(os.environ, PYTHONHASHSEED=hash_seed, PYTHONPATH=str(API_ROOT))
        result = subprocess.run([sys.executable, "-c", SCRIPT, *OCCASION_IDS[:4]],
                                capture_output=True, text=True, env=env, cwd=API_ROOT,
                                check=True, timeout=120)
        assert result.stdout.strip() == expected


def test_full_card_exports_replay_byte_identical() -> None:
    photo = encode_with_metadata(synthetic_portrait(360, 450, seed=3)[0])
    a = make_card("halloween", photo, to="Ana", sender="Ben", seed=77)
    b = make_card("halloween", photo, to="Ana", sender="Ben", seed=77)
    assert export_svg(a) == export_svg(b)
    assert export_png(a, 540) == export_png(b, 540)
