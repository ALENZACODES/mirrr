'R17B local session/provenance tests. Author: John Khan.'
from __future__ import annotations

import hashlib
import json

import pytest

from plumb_api.arena.r17b_definitions import DEFINITIONS
from plumb_api.arena.r17b_evidence import definitions_fingerprint
from plumb_api.arena.r17b_session import LocalSession, Observation, RecipeSnapshot, RenderReceipt, RenderTicket, photo_fingerprint

def digest(seed: bytes=b'photo') -> str:
    return hashlib.sha256(seed).hexdigest()

def recipe(feature: str='W19', family: str='hair_women', *, style: str='soft', amount: float=0.5, humidity: float=55.0, direction: str='neutral', level: str='normal', metadata: dict[str, object] | None=None) -> RecipeSnapshot:
    return RecipeSnapshot(feature=feature, family=family, style=style, amount=amount, humidity=humidity, direction=direction, level=level, metadata={} if metadata is None else metadata)

def ready(feature: str='W19', family: str='hair_women') -> LocalSession:
    session = LocalSession('unit')
    session.bind_photo(digest())
    session.set_recipe(recipe(feature, family))
    return session

def test_photo_fingerprint_is_dimension_bound() -> None:
    pixels = bytes(range(24))
    first = photo_fingerprint(pixels, 2, 3, 4)
    second = photo_fingerprint(pixels, 3, 2, 4)
    assert len(first) == 64
    assert first != second

@pytest.mark.parametrize('width,height,channels,size', [(0, 1, 4, 0), (1, 1, 2, 2), (2, 2, 4, 15)])
def test_photo_fingerprint_rejects_bad_shape(width: int, height: int, channels: int, size: int) -> None:
    with pytest.raises(ValueError):
        photo_fingerprint(bytes(size), width, height, channels)

def test_recipe_canonical_is_order_independent_for_metadata() -> None:
    a = recipe(metadata={'z': 1, 'a': 'x'})
    b = recipe(metadata={'a': 'x', 'z': 1})
    assert a.canonical() == b.canonical()
    assert a.sha256 == b.sha256

@pytest.mark.parametrize('amount', [-0.01, 1.01, float('nan'), float('inf')])
def test_recipe_rejects_bad_amount(amount: float) -> None:
    with pytest.raises(ValueError):
        recipe(amount=amount).validate()

def test_recipe_rejects_feature_family_mismatch() -> None:
    with pytest.raises(ValueError, match='mismatch'):
        recipe('W19', 'makeup_w').validate()

def test_metadata_rejects_private_or_nested_values() -> None:
    with pytest.raises(ValueError):
        recipe(metadata={'_raw': 1}).validate()
    with pytest.raises(ValueError):
        recipe(metadata={'nested': {'x': 1}}).validate()

def test_observation_validation_rejects_checked_assumption() -> None:
    with pytest.raises(ValueError):
        Observation(1, 'mask', True, 'checked', True).validate()

def test_bind_photo_changes_revision_only_when_digest_changes() -> None:
    session = LocalSession()
    session.bind_photo(digest(b'a'))
    assert session.revision == 1
    session.bind_photo(digest(b'a'))
    assert session.revision == 1
    session.bind_photo(digest(b'b'))
    assert session.revision == 2

def test_photo_change_clears_photo_backed_recipe() -> None:
    session = ready()
    assert session.recipe is not None
    session.bind_photo(digest(b'new'))
    assert session.recipe is None

def test_photo_backed_recipe_requires_photo() -> None:
    with pytest.raises(ValueError, match='bound photo'):
        LocalSession().set_recipe(recipe())

def test_workflow_recipe_does_not_require_photo() -> None:
    session = LocalSession()
    session.set_recipe(recipe('W94', 'workflow_w'))
    ticket = session.ticket()
    assert ticket.photo_sha256 == '0' * 64

def test_setting_equal_recipe_is_revision_stable() -> None:
    session = ready()
    revision = session.revision
    session.set_recipe(recipe())
    assert session.revision == revision

def test_recipe_change_invalidates_ticket() -> None:
    session = ready()
    ticket = session.ticket()
    session.set_recipe(recipe(amount=0.6))
    receipt = session.complete(ticket, b'output', 4.5)
    assert receipt.state == 'stale'
    assert receipt.output_sha256 is None

def test_observation_change_invalidates_ticket() -> None:
    session = ready()
    ticket = session.ticket()
    session.observe('humidity', 71, source='user')
    assert session.complete(ticket, b'output', 2).state == 'stale'

def test_complete_current_ticket_hashes_output() -> None:
    session = ready()
    ticket = session.ticket()
    receipt = session.complete(ticket, b'result', 9.25)
    assert receipt.state == 'completed'
    assert receipt.output_sha256 == hashlib.sha256(b'result').hexdigest()
    assert receipt.elapsed_ms == pytest.approx(9.25)

def test_cancel_and_fail_are_recorded_without_output() -> None:
    session = ready()
    first = session.cancel(session.ticket())
    second = session.fail(session.ticket(), 'worker failed safely')
    assert first.state == 'cancelled' and first.output_sha256 is None
    assert second.state == 'failed' and second.reason == 'worker failed safely'
    assert len(session.receipts) == 2

def test_ticket_is_bound_to_definition_fingerprint() -> None:
    ticket = ready().ticket()
    assert ticket.definitions_sha256 == definitions_fingerprint(DEFINITIONS)

def test_ticket_hash_validation_rejects_non_hex() -> None:
    ticket = RenderTicket(1, 1, 'W19', 'g' * 64, '0' * 64, '0' * 64)
    with pytest.raises(ValueError):
        ticket.validate()

def test_receipt_rejects_output_on_non_completed_state() -> None:
    ticket = ready().ticket()
    with pytest.raises(ValueError):
        RenderReceipt(ticket, 'failed', '0' * 64, None, 'x').validate()

def test_safe_export_contains_no_pixel_fields() -> None:
    session = ready()
    session.observe('mask_quality', 'checked', source='checked')
    session.complete(session.ticket(), b'secret pixel-like bytes', 1)
    exported = session.safe_export_text()
    assert 'secret pixel' not in exported
    assert 'mask_quality' in exported
    assert 'photo_sha256' in exported
    parsed = json.loads(exported)
    assert 'pixels' not in parsed
    assert 'landmarks' not in parsed

def test_safe_export_is_valid_json_and_stable() -> None:
    session = ready()
    first = session.safe_export_text()
    parsed = json.loads(first)
    assert parsed['author'] == 'John Khan'
    assert parsed['schema'] == 'beljour.r17b.session.v1'
    assert session.safe_export_text() == first
    assert session.audit_sha256 == hashlib.sha256(first.encode()).hexdigest()

def test_observations_are_returned_as_immutable_tuple() -> None:
    session = ready()
    session.observe('note', 'user supplied')
    assert isinstance(session.observations, tuple)
    assert len(session.observations) == 1

def test_session_id_rejects_control_characters() -> None:
    with pytest.raises(ValueError):
        LocalSession('bad\x00id')

def test_recipe_rejects_unknown_feature() -> None:
    with pytest.raises(ValueError):
        recipe('W999').validate()

@pytest.mark.parametrize('feature,family', [('W1', 'makeup_w'), ('W94', 'workflow_w'), ('UPSCALE2', 'upscale'), ('GENDER', 'gender_look'), ('SHAVE', 'shave')])
def test_all_engine_families_issue_valid_tickets(feature: str, family: str) -> None:
    session = LocalSession()
    if family != 'workflow_w':
        session.bind_photo(digest(feature.encode()))
    session.set_recipe(recipe(feature, family))
    ticket = session.ticket()
    ticket.validate()
    assert ticket.feature == feature
