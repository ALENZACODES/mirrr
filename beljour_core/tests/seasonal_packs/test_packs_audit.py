"""Respect-rule audit tests: the shipped art is clean and bad art is caught.

Author: John Khan.
"""

from __future__ import annotations

import random

import pytest

from plumb_api.seasonal.packs import (
    Look,
    LookKind,
    PackRegistry,
    Palette,
    SeasonalPack,
    register_motif,
)
from plumb_api.seasonal.packs.audit import (
    AuditFinding,
    audit,
    ellipse_bounds,
    greeting_problems,
    motif_problems,
    pack_audit,
)
from plumb_api.seasonal.packs.motifs import library_ids
from plumb_api.seasonal.packs.shapes import Shape, oval, poly

PALETTE = Palette("#335577", "#557799", "#ffcc33", "#101820", "#f8f8f8")


def test_shipped_packs_and_motifs_pass_the_audit() -> None:
    # Ignore the deliberately broken motifs another test in this file registers.
    findings = [f for f in audit() if "/audit_" not in f.where]
    assert findings == [], "\n".join(str(f) for f in findings)


@pytest.mark.parametrize(
    "greeting",
    ["Happy Halloween", "Merry Christmas", "Eid Mubarak", "Happy New Year!", "Season's greetings"],
)
def test_plain_greetings_pass(greeting: str) -> None:
    assert greeting_problems(greeting) == []


@pytest.mark.parametrize(
    ("greeting", "message"),
    [
        ("Happy <b>Holi</b>", "plain letters"),
        ("Blessed by the prophet", "forbidden words"),
        ("Psalm 23 for you", "plain letters"),
        ("1234", "plain letters"),
    ],
)
def test_greetings_with_problems_are_caught(greeting: str, message: str) -> None:
    problems = greeting_problems(greeting)
    assert problems and any(message in problem for problem in problems)


def _escaping(rng: random.Random) -> tuple[Shape, ...]:
    return (oval("#ff0000", (0.5, 0.5), (0.9, 0.2)),)


def _fine(rng: random.Random) -> tuple[Shape, ...]:
    return (poly("#00aa00", [(0.2, 0.2), (0.8, 0.2), (0.5, 0.8)]),)


def _blank(rng: random.Random) -> tuple[Shape, ...]:
    return ()


def test_motif_checks_find_box_and_empty_problems() -> None:
    for name, builder in (("audit_wide", _escaping), ("audit_ok", _fine), ("audit_blank", _blank)):
        if name not in library_ids("kwanzaa"):
            register_motif("kwanzaa", name, builder)
    assert any("unit box" in p for p in motif_problems("kwanzaa", "audit_wide"))
    assert motif_problems("kwanzaa", "audit_ok") == []
    assert any("draws nothing" in p for p in motif_problems("kwanzaa", "audit_blank"))
    findings = [f for f in audit(PackRegistry()) if f.where.startswith("motif kwanzaa/")]
    assert {f.where for f in findings} == {"motif kwanzaa/audit_wide", "motif kwanzaa/audit_blank"}


def test_pack_audit_flags_styles_and_greetings() -> None:
    look = Look(
        "hat",
        LookKind.ACCESSORY,
        "Hat",
        "accessory.wear",
        {"style": "saint_halo"},
    )
    pack = SeasonalPack("kwanzaa", "Kwanzaa", PALETTE, (), (look,), "Happy Kwanzaa 2026")
    findings = pack_audit(pack)
    text = "\n".join(str(f) for f in findings)
    assert "forbidden token 'saint'" in text
    assert "plain letters" in text
    assert all(isinstance(f, AuditFinding) and f.where == "pack kwanzaa" for f in findings)


def test_ellipse_bounds_follow_rotation() -> None:
    flat = ellipse_bounds((0.5, 0.5), (0.4, 0.1), 0.0)
    corners = [value for corner in flat for value in corner]
    assert corners == pytest.approx([0.1, 0.4, 0.9, 0.6])
    upright = ellipse_bounds((0.5, 0.5), (0.4, 0.1), 90.0)
    assert upright[0][0] == pytest.approx(0.4) and upright[0][1] == pytest.approx(0.1)


def test_finding_text() -> None:
    assert str(AuditFinding("pack x", "bad")) == "pack x: bad"
