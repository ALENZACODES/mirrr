"""Strict offline URL-fragment sharing of settings-only Pro plans.

Fragment bytes remain local to the browser on ordinary navigation. This
helper does not generate a server URL and never includes a photo or model.
A digest is an integrity checksum, never a signature or human identity proof.
Author: John Khan.
"""

from __future__ import annotations

import base64
import binascii
import re

from .errors import CommandValidationError
from .portable_recipe import PortableRecipe, export_portable_recipe, import_portable_recipe
from .pro_plan import ProPlan

_PREFIX = "#pro="
_MAX_FRAGMENT_LENGTH = 11_000
_URL_BODY = re.compile(r"^[A-Za-z0-9_-]+$")


def _encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def export_recipe_fragment(plan: ProPlan) -> str:
    """Export JSON settings as one portable, hash-prefixed fragment."""
    text = export_portable_recipe(plan)
    encoded = _encode(text.encode("utf-8"))
    result = _PREFIX + encoded
    if len(result) > _MAX_FRAGMENT_LENGTH:
        raise CommandValidationError("invalid_share_size", "Share link exceeds the safe limit.")
    return result


def import_recipe_fragment(
    fragment: str,
    *,
    confirm_weakened_identity: bool = False,
) -> PortableRecipe:
    """Import one exact fragment. An imported opt-out needs fresh consent."""
    if not isinstance(fragment, str) or not 1 <= len(fragment) <= _MAX_FRAGMENT_LENGTH:
        raise CommandValidationError("invalid_share_fragment", "Share fragment is not bounded.")
    if not fragment.startswith(_PREFIX):
        raise CommandValidationError("invalid_share_prefix", "Share fragment must start with #pro=.")
    body = fragment[len(_PREFIX):]
    if not body or _URL_BODY.fullmatch(body) is None:
        raise CommandValidationError("invalid_share_encoding", "Share fragment is not base64url.")
    if len(body) % 4 == 1:
        raise CommandValidationError("invalid_share_encoding", "Share fragment has invalid padding.")
    try:
        prepared = body + "=" * ((4 - len(body) % 4) % 4)
        payload = base64.b64decode(prepared, altchars=b"-_", validate=True)
    except (ValueError, binascii.Error):
        raise CommandValidationError("invalid_share_encoding", "Share fragment is not base64url.") from None
    if _encode(payload) != body:
        raise CommandValidationError("invalid_share_encoding", "Share fragment is not canonical.")
    return import_portable_recipe(
        payload,
        confirm_weakened_identity=confirm_weakened_identity,
    )
