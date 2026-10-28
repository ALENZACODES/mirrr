"""Machine-checkable list of motif ids that no pack or card may use.

The respect rules ban religious figures, deities, prophets, saints, scripture,
sacred buildings, the Khanda and costume caricature. A motif id is split on
underscores and every token is compared with the banned tokens, so names such
as "moon" or "lantern" are never caught by a substring accident.
Author: John Khan.
"""

from __future__ import annotations

import re
from collections.abc import Iterable

FORBIDDEN_TOKENS: frozenset[str] = frozenset(
    {
        # Symbols the rules name explicitly.
        "khanda",
        "cross",
        "crucifix",
        # Religious figures and sacred persons.
        "deity",
        "deities",
        "god",
        "goddess",
        "prophet",
        "saint",
        "angel",
        "halo",
        "messiah",
        "jesus",
        "mary",
        "nativity",
        "madonna",
        "buddha",
        "ganesha",
        "ganesh",
        "lakshmi",
        "krishna",
        "rama",
        "shiva",
        "durga",
        "hanuman",
        "guru",
        "imam",
        "rabbi",
        "priest",
        # Scripture and sacred text.
        "scripture",
        "verse",
        "psalm",
        "bible",
        "quran",
        "koran",
        "torah",
        "granth",
        "gurbani",
        "veda",
        "gita",
        "calligraphy",
        "shahada",
        "mantra",
        # Sacred buildings.
        "church",
        "chapel",
        "cathedral",
        "mosque",
        "masjid",
        "kaaba",
        "temple",
        "mandir",
        "gurdwara",
        "synagogue",
        "shrine",
        "altar",
        "idol",
        # Costume caricature of a faith or culture.
        "costume",
        "caricature",
        "headdress",
        "warbonnet",
        "turban",
        "hijab",
        "niqab",
        "kippah",
        "yarmulke",
        "bindi",
    }
)

MOTIF_ID = re.compile(r"^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$")


def motif_tokens(motif_id: str) -> tuple[str, ...]:
    """Split a motif id into the tokens the ban list is matched against."""
    return tuple(token for token in motif_id.lower().split("_") if token)


def _singulars(token: str) -> set[str]:
    """The token plus its simple singular forms, so plurals are caught too."""
    forms = {token}
    if token.endswith("ies") and len(token) > 4:
        forms.add(token[:-3] + "y")
    if token.endswith("es") and len(token) > 3:
        forms.add(token[:-2])
    if token.endswith("s") and len(token) > 2:
        forms.add(token[:-1])
    return forms


def forbidden_reason(motif_id: str) -> str | None:
    """Why a motif id is not allowed, or None when it is allowed."""
    if not MOTIF_ID.match(motif_id):
        return f"motif id {motif_id!r} is not lower snake case"
    hits = [token for token in motif_tokens(motif_id) if _singulars(token) & FORBIDDEN_TOKENS]
    if hits:
        return f"motif id {motif_id!r} uses forbidden token {hits[0]!r}"
    return None


def is_forbidden(motif_id: str) -> bool:
    """True when the motif id breaks the respect rules."""
    return forbidden_reason(motif_id) is not None


def forbidden_problems(motif_ids: Iterable[str]) -> list[str]:
    """One message per offending motif id, in input order."""
    problems: list[str] = []
    for motif_id in motif_ids:
        reason = forbidden_reason(motif_id)
        if reason is not None:
            problems.append(reason)
    return problems
