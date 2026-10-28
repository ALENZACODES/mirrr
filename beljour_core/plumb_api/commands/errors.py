"""Stable command errors. Never include image data, embeddings or raw handler exceptions.

Author: John Khan.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ErrorDetail:
    code: str
    message: str
    command_index: int | None = None
    parameter: str | None = None

    def as_dict(self) -> dict[str, str | int | float | None]:
        return {
            "code": self.code,
            "message": self.message,
            "command_index": self.command_index,
            "parameter": self.parameter,
        }


class CommandError(ValueError):
    """Public error with a machine-readable code and intentionally safe message."""

    def __init__(
        self,
        code: str,
        message: str,
        *,
        command_index: int | None = None,
        parameter: str | None = None,
    ) -> None:
        super().__init__(message)
        self.detail = ErrorDetail(code, message, command_index, parameter)

    @property
    def code(self) -> str:
        return self.detail.code

    def as_dict(self) -> dict[str, str | int | float | None]:
        return self.detail.as_dict()


class CommandParseError(CommandError):
    """A rejected command string, before any effects run."""


class CommandValidationError(CommandError):
    """A rejected typed plan or image boundary."""


class CommandUnavailable(CommandError):
    """A non-implemented effect or unevaluated provider is never a no-op."""


class IdentityBlocked(CommandError):
    """Preserve original image/recipe and return only non-biometric metrics."""

    def __init__(self, meter: int, threshold: float, *, command_index: int | None = None) -> None:
        super().__init__(
            "identity_below_threshold",
            "Identity comparison did not meet the selected threshold. No edit was committed.",
            command_index=command_index,
        )
        self.meter = meter
        self.threshold = threshold

    def as_dict(self) -> dict[str, str | int | float | None]:
        return {**super().as_dict(), "meter": self.meter, "threshold": self.threshold}


class CommandExecutionError(CommandError):
    """An operation failed without disclosing input bytes or thrown exception text."""
