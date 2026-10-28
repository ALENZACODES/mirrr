"""The fixed approved makeup requests recorded for an offline demonstration.

A fixture is an explicitly selected recorded example, never a skin, shade, age or
proportions measurement borrowed from another face. The local tools compute their
own results from the visitor's image. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Callable

from ..consent import attestation

FOUNDATIONS = ("F08N", "F09N", "F10N")
LIPS = ("L06", "L07", "L09")
DEMO_BLUSH = "B02"


def run_plan(post: Callable[[str, dict], dict], photo_id: str, log: Callable[[str], None] = print) -> dict:
    """The recorder's operator has explicitly selected synthetic mode or confirmed
    rights, adult consent and spending. Every request still uses the ordinary
    per-photo consent route and the single provider adapter.
    """
    selections = [{"foundation_id": identifier} for identifier in FOUNDATIONS]
    selections.extend({"lip_id": identifier} for identifier in LIPS)
    selections.append({"foundation_id": FOUNDATIONS[0], "lip_id": LIPS[0], "blush_id": DEMO_BLUSH})
    path = "/api/makeup/try"
    for selection in selections:
        body = {"photo_id": photo_id, **selection, "consent": attestation(photo_id, "makeup")}
        result = post(path, body)
        if "error" in result:
            raise RuntimeError("The approved makeup recording failed; no other endpoint will be substituted.")
        log(f"  {path} {selection} -> {result.get('source', 'unknown')}")
    return {path: len(selections)}


def estimated_units() -> int:
    """Current makeup estimate: three foundation, three lip and one combined look."""
    return len(FOUNDATIONS) + len(LIPS) + 1
