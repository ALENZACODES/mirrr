"""Signed task tickets, so a browser can hand back a pending task after a server restart.

When the server creates a YouCam task for a browser, it returns a ticket: the request key,
task id, feature, endpoint version, owner photo hash and units, plus an HMAC over all of
them. After a restart that wiped the ledger, the browser sends its tickets back; the server
checks each signature and resumes polling. A ticket can't be forged or edited without the
secret, so a browser can't make the server poll a task it never created.

The secret comes from BELJOUR_RESUME_SECRET. Without one, a random secret is made per
process, so tickets still work within one run but not across a restart (the HANDOFF notes
this; render.yaml generates a value).

Author: John Khan.
"""
from __future__ import annotations

import hashlib
import hmac
import secrets
from dataclasses import asdict, dataclass

TICKET_VERSION = 1


@dataclass(frozen=True)
class Ticket:
    request_key: str
    task_id: str
    feature: str
    version: str
    owner: str
    units: int
    sig: str = ""
    v: int = TICKET_VERSION

    def payload(self) -> str:
        return "|".join([str(self.v), self.request_key, self.task_id, self.feature, self.version,
                         self.owner, str(self.units)])

    def to_json(self) -> dict:
        return asdict(self)


class TicketSigner:
    def __init__(self, secret: str = ""):
        self.ephemeral = not secret
        self._secret = (secret or secrets.token_hex(32)).encode()

    def _mac(self, ticket: Ticket) -> str:
        return hmac.new(self._secret, ticket.payload().encode(), hashlib.sha256).hexdigest()[:32]

    def issue(self, request_key: str, task_id: str, feature: str, version: str, owner: str, units: int) -> Ticket:
        unsigned = Ticket(request_key, task_id, feature, version, owner, int(units))
        return Ticket(**{**asdict(unsigned), "sig": self._mac(unsigned)})

    def verify(self, data: dict) -> Ticket | None:
        """A Ticket if the signature matches, else None. Unknown fields are ignored."""
        try:
            ticket = Ticket(
                request_key=str(data["request_key"]), task_id=str(data["task_id"]),
                feature=str(data["feature"]), version=str(data["version"]), owner=str(data["owner"]),
                units=int(data["units"]), sig=str(data.get("sig", "")), v=int(data.get("v", TICKET_VERSION)),
            )
        except (KeyError, TypeError, ValueError):
            return None
        if ticket.v != TICKET_VERSION or not ticket.sig:
            return None
        return ticket if hmac.compare_digest(ticket.sig, self._mac(ticket)) else None
