"""One error type for everything the browser should see, with a plain message."""
from __future__ import annotations


class PlumbError(Exception):
    def __init__(self, status: int, code: str, message: str, detail: dict | None = None):
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message
        self.detail = detail or {}

    def to_json(self) -> dict:
        return {"error": {"code": self.code, "message": self.message, **self.detail}}


BAD_REQUEST_MESSAGE = "That request couldn't be processed. Check the inputs and try again."


def public_value_error(exc: ValueError, log: object | None = None) -> tuple[dict, int]:
    """The reply for an unhandled ValueError: a fixed message, never the exception text, which
    can name internals (paths, shapes, limits). The detail goes to the server log only; it
    holds the exception type and message, never request bodies or photo bytes."""
    if log is not None and hasattr(log, "warning"):
        log.warning("value_error %s: %s", type(exc).__name__, str(exc)[:200])
    return {"error": {"code": "bad_request", "message": BAD_REQUEST_MESSAGE}}, 422


class BudgetExceeded(PlumbError):
    def __init__(self, message: str, detail: dict | None = None):
        super().__init__(402, "unit_budget", message, detail)


class NotInDemo(PlumbError):
    def __init__(self, feature: str):
        super().__init__(
            409,
            "not_in_demo",
            "This result isn't in the demo set yet. Try the sample photo, or ask the owner to turn on live mode.",
            {"feature": feature},
        )
