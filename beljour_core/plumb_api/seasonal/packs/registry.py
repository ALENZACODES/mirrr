"""Pack registry: the extension point other packages use to add occasions.

register_pack checks the pack (frozen occasion id, no duplicate, every look's
renderer known and of the right kind, every motif allowed) before it is
stored. A PackRegistry instance can be created for isolated tests; the module
functions act on the shared default registry.
Author: John Khan.
"""

from __future__ import annotations

from .forbidden import forbidden_problems
from .model import PackError, SeasonalPack
from .motifs import library_ids
from .occasions import OCCASION_IDS, require_occasion
from .render import check_look_renderer


class PackRegistry:
    """Occasion id to SeasonalPack, one pack per occasion."""

    def __init__(self) -> None:
        self._packs: dict[str, SeasonalPack] = {}

    def register(self, pack: SeasonalPack) -> SeasonalPack:
        """Validate and add a pack; duplicates and unknown ids are rejected."""
        if not isinstance(pack, SeasonalPack):
            raise PackError("register_pack needs a SeasonalPack")
        require_occasion(pack.occasion)
        if pack.occasion in self._packs:
            raise PackError(f"a pack for {pack.occasion} is already registered")
        problems = pack_problems(pack)
        if problems:
            raise PackError(f"pack {pack.occasion} rejected: {'; '.join(problems)}")
        self._packs[pack.occasion] = pack
        return pack

    def get(self, occasion: str) -> SeasonalPack:
        """The pack for an occasion; unknown ids and missing packs raise."""
        require_occasion(occasion)
        pack = self._packs.get(occasion)
        if pack is None:
            raise PackError(f"no pack is registered for {occasion} yet")
        return pack

    def has(self, occasion: str) -> bool:
        """True when a pack for the occasion is registered."""
        return occasion in self._packs

    def packs(self) -> tuple[SeasonalPack, ...]:
        """Registered packs in the frozen occasion order."""
        return tuple(self._packs[o] for o in OCCASION_IDS if o in self._packs)

    def occasions(self) -> tuple[str, ...]:
        """Occasion ids that have a pack, in frozen order."""
        return tuple(pack.occasion for pack in self.packs())

    def missing(self) -> tuple[str, ...]:
        """Occasion ids that still have no pack."""
        return tuple(o for o in OCCASION_IDS if o not in self._packs)


def pack_problems(pack: SeasonalPack) -> list[str]:
    """Every reason a pack may not be registered; empty when it is fine."""
    problems: list[str] = []
    motif_ids = list(pack.motifs)
    for look in pack.looks:
        motif_ids.extend(look.motifs)
        for name in ("motifs", "corner"):
            value = look.params.get(name)
            if isinstance(value, tuple):
                motif_ids.extend(str(item) for item in value)
            elif isinstance(value, str) and value:
                motif_ids.append(value)
        try:
            check_look_renderer(look)
        except PackError as error:
            problems.append(str(error))
    problems.extend(sorted(set(forbidden_problems(motif_ids))))
    known = set(pack.motifs)
    named = {m for m in motif_ids if m not in known}
    if named:
        problems.append(f"looks name motifs the pack does not list: {sorted(named)}")
    drawn = set(library_ids(pack.occasion))
    undrawn = sorted(m for m in known if m not in drawn)
    if undrawn:
        problems.append(f"motifs {undrawn} are not drawn yet; add them with register_motif")
    return problems


DEFAULT_REGISTRY = PackRegistry()


def register_pack(pack: SeasonalPack) -> SeasonalPack:
    """Add a pack to the shared registry."""
    return DEFAULT_REGISTRY.register(pack)


def get_pack(occasion: str) -> SeasonalPack:
    """The registered pack for an occasion."""
    return DEFAULT_REGISTRY.get(occasion)


def list_packs() -> tuple[SeasonalPack, ...]:
    """All registered packs in frozen occasion order."""
    return DEFAULT_REGISTRY.packs()
