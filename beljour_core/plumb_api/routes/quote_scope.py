"""One factual quote envelope for the editor (contracts 19 and 20, R8).

This module does not initiate provider traffic. The visit counter is the server's
existing session policy, not a browser estimate. A quote is *not* a reservation:
another request can spend the remaining units before the user clicks Apply.

Author: John Khan.
"""
from __future__ import annotations

from typing import Any

from ..providers.youcam import STYLING, scope_of
from ..session_ctx import current_session
from ..state import AppState
from ..youcam.units import UNVERIFIED

LOCAL_ACTIONS = frozenset({"enhance", "posture", "hair-fibre", "beard"})
SERVER_LOCAL_ACTIONS = frozenset({"skin", "shade", "proportions", "surgery", "simulate", "aging"})
LOCAL_LABEL = "stays on this device"
STYLING_LABEL = "sent to YouCam, deleted after the result"
RECORDED_LABEL = "saved example; no new request is sent"


def local_quote(action: str) -> dict[str, Any]:
    """Report a local engine, not a zero-priced YouCam task."""
    if action not in LOCAL_ACTIONS | SERVER_LOCAL_ACTIONS:
        raise ValueError("not an available local editor action")
    return {"feature": action, "units": 0, "cached": False, "live": False}


def decorate(quote: dict[str, Any], state: AppState) -> dict[str, Any]:
    """Attach scope, correct data flow, truthful session budget and availability.

    For the old recorded-only endpoints, never imply that ``live`` means they
    are still in the allowed provider scope. They remain viewable if cached.
    """
    feature = str(quote["feature"])
    local = feature in LOCAL_ACTIONS | SERVER_LOCAL_ACTIONS or feature == "local-warp"
    styling = feature in STYLING and scope_of(feature) == "styling"
    scope = "local" if local else "youcam" if styling else "recorded_only"
    session = state.gateway.policy.status(current_session())
    cost = int(quote["units"])
    left = session["remaining"]
    available_today = max(0, session["daily_cap"] - session["spent_today"])
    cached = bool(quote["cached"])
    spend_allowed = (left is None or left >= cost) and available_today >= cost and not session["kill_switch"]
    provider_ready = bool(state.settings.live and state.gateway.provider.client is not None
                          and state.settings.youcam_styling)
    if local:
        runnable = True
        reason = None
    elif cached:
        runnable = True
        reason = None
    elif not styling:
        runnable = False
        reason = "This provider feature is outside the approved scope. Use the local tool instead."
    elif not provider_ready:
        runnable = False
        reason = "Live styling isn't enabled; saved demo results may still be available."
    elif not spend_allowed:
        runnable = False
        reason = "This visit or today's unit allowance is exhausted, or live calls are paused."
    else:
        runnable = True
        reason = None
    return {
        **quote,
        "scope": scope,
        "data_flow": "processed locally on this server; no YouCam call" if feature in SERVER_LOCAL_ACTIONS else LOCAL_LABEL if local else STYLING_LABEL if styling else RECORDED_LABEL,
        "visit_units_left": left,
        "visit_units_used": session["spent"],
        "visit_units_cap": session["cap"],
        "daily_units_left": available_today,
        "visit_units_after": None if left is None else max(0, left - (0 if cached else cost)),
        "pricing_verified": (feature not in UNVERIFIED) if styling else None,
        "can_apply": runnable,
        "unavailable_reason": reason,
        "is_estimate": True,
    }
