'Emit deterministic R17B provenance values for browser parity. Author: John Khan.'
from __future__ import annotations

import json

from plumb_api.arena.r17b_session import LocalSession, RecipeSnapshot, photo_fingerprint


def main() -> None:
    pixels = bytes((index * 17 + 3) % 256 for index in range(6 * 5 * 4))
    photo_sha = photo_fingerprint(pixels, 6, 5, 4)
    recipe = RecipeSnapshot(feature='W19', family='hair_women', style='soft layers', amount=0.625, humidity=55.25, metadata={'source': 'checked', 'count': 3, 'approved': True})
    session = LocalSession('parity')
    session.bind_photo(photo_sha)
    session.set_recipe(recipe)
    session.observe('humidity', 55.25, source='user', assumed=False)
    session.observe('hair_mask', 'checked', source='checked', assumed=False)
    ticket = session.ticket()
    receipt = session.complete(ticket, b'r17b-output', 7.5)
    payload = {'format': 'beljour.r17b.provenance-parity/1', 'pixels': list(pixels), 'width': 6, 'height': 5, 'channels': 4, 'photo_sha256': photo_sha, 'recipe': json.loads(recipe.canonical()), 'recipe_canonical': recipe.canonical(), 'recipe_sha256': recipe.sha256, 'ticket': {'id': ticket.id, 'revision': ticket.revision, 'feature': ticket.feature, 'photo_sha256': ticket.photo_sha256, 'recipe_sha256': ticket.recipe_sha256, 'definitions_sha256': ticket.definitions_sha256}, 'receipt_state': receipt.state, 'output_sha256': receipt.output_sha256}
    print(json.dumps(payload, sort_keys=True, separators=(',', ':')))
if __name__ == '__main__':
    main()
