"""Typed errors raised by the event card maker.

Every error derives from CardError so callers can catch one type at the API edge.
Author: John Khan.
"""

from __future__ import annotations


class CardError(Exception):
    """Base class for every card maker failure."""


class UnknownOccasionError(CardError, KeyError):
    """The occasion id is not one of the frozen occasion ids."""

    def __init__(self, occasion: str) -> None:
        super().__init__(f"unknown occasion: {occasion!r}")
        self.occasion = occasion

    def __str__(self) -> str:
        return str(self.args[0])


class UnknownLookError(CardError, KeyError):
    """The look id does not belong to the chosen occasion."""

    def __init__(self, occasion: str, look: str) -> None:
        super().__init__(f"occasion {occasion!r} has no look {look!r}")
        self.occasion = occasion
        self.look = look

    def __str__(self) -> str:
        return str(self.args[0])


class CardTextError(CardError, ValueError):
    """A to, from, message or greeting field is not acceptable."""

    def __init__(self, field: str, reason: str) -> None:
        super().__init__(f"{field}: {reason}")
        self.field = field
        self.reason = reason


class CardOptionError(CardError, ValueError):
    """An option such as the card format, output width or frame count is out of range."""


class CardPhotoError(CardError, ValueError):
    """The input photo cannot be decoded or is outside the accepted limits."""


class DesignStoreError(CardError, RuntimeError):
    """The design store file cannot be opened or is not a design store."""


class MotifError(CardError, ValueError):
    """A motif provider returned an unknown, forbidden or unsafe motif."""


class UniquenessExhaustedError(CardError, RuntimeError):
    """No unique design was found within the retry budget."""

    def __init__(self, occasion: str, attempts: int) -> None:
        super().__init__(
            f"no unique {occasion} design after {attempts} attempts; "
            "the design store is saturated for this look"
        )
        self.occasion = occasion
        self.attempts = attempts
