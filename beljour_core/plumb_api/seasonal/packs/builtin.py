"""Registers the five packs this package ships into the default registry.

Author: John Khan.
"""

from __future__ import annotations

from . import christmas, easter, halloween, new_year, thanksgiving
from .model import SeasonalPack
from .registry import DEFAULT_REGISTRY, PackRegistry

BUILTIN_PACKS: tuple[SeasonalPack, ...] = (
    halloween.PACK,
    christmas.PACK,
    thanksgiving.PACK,
    new_year.PACK,
    easter.PACK,
)


def register_builtin(registry: PackRegistry) -> None:
    """Add the built-in packs that the registry does not already hold."""
    for pack in BUILTIN_PACKS:
        if not registry.has(pack.occasion):
            registry.register(pack)


register_builtin(DEFAULT_REGISTRY)
