"""Short-lived, session-scoped demo wishlist and cart, without photos or payment data.

All totals are in integer Canadian cents, computed exclusively from the catalogue.
Nothing is purchased, charged, persisted to the browser or shared with third parties.
This per-process store is intentionally non-durable; a restart clears the demo bag.
Author: John Khan.
"""
from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field
from typing import Any

from ..errors import PlumbError
from ..sessions import ANONYMOUS, valid_session_id
from .catalogue import require_product

MAX_PER_SKU = 5
MAX_LINES = 30
MAX_WISHLIST = 50
MAX_SESSIONS = 4096
TTL_SECONDS = 60 * 60


@dataclass
class Bag:
    quantities: dict[str, int] = field(default_factory=dict)
    wishlist: set[str] = field(default_factory=set)
    last_photo: str | None = None
    last_preview_sku: str | None = None
    last_seen: float = 0.0
    revision: int = 0

    def public(self) -> dict[str, Any]:
        rows: list[dict[str, Any]] = []
        subtotal = 0
        for sku, qty in sorted(self.quantities.items()):
            product = require_product(sku)
            cost = product.price_cents * qty
            subtotal += cost
            rows.append({"product": product.to_json(), "quantity": qty, "total_cents": cost})
        wishlist = [require_product(sku).to_json() for sku in sorted(self.wishlist)]
        return {"lines": rows, "wishlist": wishlist, "items": sum(self.quantities.values()),
                "subtotal_cents": subtotal, "currency": "CAD", "tax_cents": None,
                "shipping_cents": None, "total_cents": subtotal,
                "total_label": "Sample subtotal only; taxes and delivery are not calculated",
                "checkout_enabled": False, "checkout_message": "Demo bag only. No order or payment will be taken.",
                "last_photo_id": self.last_photo, "last_preview_sku": self.last_preview_sku,
                "revision": self.revision}


class CommerceSessions:
    """A bounded store protected by one lock, with no hidden cross-session defaults."""

    def __init__(self, clock: Any = time.monotonic):
        self.clock = clock
        self._lock = threading.RLock()
        self._bags: dict[str, Bag] = {}

    def _session(self, session_id: str) -> str:
        if not valid_session_id(session_id) or session_id == ANONYMOUS:
            raise PlumbError(403, "private_session_required", "Open this page in a browser tab to keep a private demo bag.")
        return session_id

    def _get(self, session_id: str) -> Bag:
        key = self._session(session_id)
        now = float(self.clock())
        # TTL is checked before returning state, not just in a scheduled maintenance job.
        for old, bag in list(self._bags.items()):
            if now - bag.last_seen > TTL_SECONDS:
                del self._bags[old]
        if key not in self._bags:
            if len(self._bags) >= MAX_SESSIONS:
                oldest = min(self._bags, key=lambda name: self._bags[name].last_seen)
                del self._bags[oldest]
            self._bags[key] = Bag(last_seen=now)
        bag = self._bags[key]
        bag.last_seen = now
        return bag

    @staticmethod
    def _version(bag: Bag, revision: int | None) -> None:
        if revision is not None and bag.revision != revision:
            raise PlumbError(409, "stale_bag", "This bag changed in another tab. Review its latest contents before editing.")

    def view(self, session_id: str) -> dict[str, Any]:
        with self._lock:
            return self._get(session_id).public()

    def add(self, session_id: str, sku: str, quantity: int = 1, revision: int | None = None) -> dict[str, Any]:
        require_product(sku)
        if type(quantity) is not int or not 1 <= quantity <= MAX_PER_SKU:
            raise PlumbError(422, "quantity", "Choose between one and five sample items.")
        with self._lock:
            bag = self._get(session_id)
            self._version(bag, revision)
            old = bag.quantities.get(sku, 0)
            if old + quantity > MAX_PER_SKU:
                raise PlumbError(422, "quantity", "There is a limit of five per sample shade.")
            if old == 0 and len(bag.quantities) >= MAX_LINES:
                raise PlumbError(422, "bag_full", "The sample bag holds up to thirty different items.")
            bag.quantities[sku] = old + quantity
            bag.revision += 1
            return bag.public()

    def remove(self, session_id: str, sku: str, quantity: int | None = None,
               revision: int | None = None) -> dict[str, Any]:
        require_product(sku)
        if quantity is not None and (type(quantity) is not int or not 1 <= quantity <= MAX_PER_SKU):
            raise PlumbError(422, "quantity", "Choose a valid removal amount.")
        with self._lock:
            bag = self._get(session_id)
            self._version(bag, revision)
            current = bag.quantities.get(sku, 0)
            if current == 0:
                return bag.public()  # Idempotent removal, no unnecessary revision.
            remaining = current - (quantity if quantity is not None else current)
            if remaining > 0:
                bag.quantities[sku] = remaining
            else:
                bag.quantities.pop(sku, None)
            bag.revision += 1
            return bag.public()

    def wish(self, session_id: str, sku: str, selected: bool,
             revision: int | None = None) -> dict[str, Any]:
        require_product(sku)
        with self._lock:
            bag = self._get(session_id)
            self._version(bag, revision)
            if selected and sku not in bag.wishlist and len(bag.wishlist) >= MAX_WISHLIST:
                raise PlumbError(422, "wishlist_full", "Save up to fifty sample items.")
            previous = sku in bag.wishlist
            if selected:
                bag.wishlist.add(sku)
            else:
                bag.wishlist.discard(sku)
            if previous != selected:
                bag.revision += 1
            return bag.public()

    def preview(self, session_id: str, photo_sha: str, sku: str) -> None:
        require_product(sku)
        with self._lock:
            bag = self._get(session_id)
            bag.last_photo = photo_sha
            bag.last_preview_sku = sku
            bag.revision += 1

    def clear(self, session_id: str, revision: int | None = None) -> dict[str, Any]:
        with self._lock:
            bag = self._get(session_id)
            self._version(bag, revision)
            bag.quantities.clear()
            bag.wishlist.clear()
            bag.last_photo = None
            bag.last_preview_sku = None
            bag.revision += 1
            return bag.public()
