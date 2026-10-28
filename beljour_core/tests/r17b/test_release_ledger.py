'R17B release-evidence ledger tests. Author: John Khan.'
from __future__ import annotations

import pytest

from plumb_api.arena.r17b_definitions import DEFINITIONS
from plumb_api.arena.r17b_evidence import GroupSummary, definitions_fingerprint
from plumb_api.arena.r17b_release import FrozenEvidence, GateResult, ParityEvidence, assess_release, synthetic_development_assessment

GROUPS = ('hair_women', 'makeup_w', 'workflow_w', 'upscale', 'gender_look', 'shave')
GATES = ('mypy', 'ruff', 'api', 'web', 'parity', 'browser_acceptance')
DEF_HASH = definitions_fingerprint(DEFINITIONS)

def gates(status: str='passed') -> list[GateResult]:
    if status not in {'passed', 'failed', 'unavailable'}:
        raise ValueError('invalid test gate status')
    return [GateResult(name, status) for name in GATES]

def groups(ready: bool=True) -> list[GroupSummary]:
    if ready:
        return [GroupSummary(name, 1, 1, 1, 0, 0, True, (DEF_HASH,)) for name in GROUPS]
    return [GroupSummary(name, 1, 0, 0, 0, 1, False, (DEF_HASH,)) for name in GROUPS]

def parity(error: int=1) -> ParityEvidence:
    return ParityEvidence(error, 24, GROUPS)

def frozen(cases: int=100000, failed: int=0, locked: bool=True) -> FrozenEvidence:
    return FrozenEvidence(cases, cases - failed, failed, locked, 'a' * 64 if locked else None)

def test_complete_evidence_is_release_candidate_bookkeeping_only() -> None:
    result = assess_release(gates=gates(), parity=parity(), groups=groups(), frozen=frozen())
    assert result.decision == 'release_candidate'
    assert result.static_ready and result.parity_ready and result.group_evidence_ready and result.frozen_ready
    assert not result.blockers

def test_missing_frozen_evidence_stays_development_verified() -> None:
    result = assess_release(gates=gates(), parity=parity(), groups=groups(), frozen=frozen(0, locked=False))
    assert result.decision == 'development_verified'
    assert not result.frozen_ready
    assert 'frozen:not_locked' in result.blockers

def test_missing_group_evidence_never_claims_release_candidate() -> None:
    result = assess_release(gates=gates(), parity=parity(), groups=groups(False), frozen=frozen())
    assert result.decision == 'development_verified'
    assert not result.group_evidence_ready
    assert any((item.startswith('evidence:') for item in result.blockers))

def test_failed_static_gate_blocks_even_with_frozen_pass() -> None:
    values = gates()
    values[1] = GateResult('ruff', 'failed', 'lint errors')
    result = assess_release(gates=values, parity=parity(), groups=groups(), frozen=frozen())
    assert result.decision == 'blocked'
    assert 'static:ruff:failed' in result.blockers

def test_unavailable_static_gate_blocks() -> None:
    values = [GateResult(name, 'unavailable' if name == 'mypy' else 'passed') for name in GATES]
    result = assess_release(gates=values, parity=parity(), groups=groups(), frozen=frozen())
    assert result.decision == 'blocked'
    assert 'static:mypy:unavailable' in result.blockers

def test_missing_static_gate_blocks() -> None:
    result = assess_release(gates=gates()[:-1], parity=parity(), groups=groups(), frozen=frozen())
    assert result.decision == 'blocked'
    assert 'static:browser_acceptance:missing' in result.blockers

def test_parity_above_one_byte_blocks() -> None:
    result = assess_release(gates=gates(), parity=parity(2), groups=groups(), frozen=frozen())
    assert result.decision == 'blocked'
    assert 'parity:max_byte_error=2' in result.blockers

def test_definition_fingerprint_mismatch_blocks() -> None:
    result = assess_release(gates=gates(), parity=parity(), groups=groups(), frozen=frozen(), definitions_sha256='b' * 64)
    assert result.decision == 'blocked'
    assert 'definitions:fingerprint_mismatch' in result.blockers

def test_frozen_below_100k_not_ready() -> None:
    result = assess_release(gates=gates(), parity=parity(), groups=groups(), frozen=frozen(99999))
    assert result.decision == 'development_verified'
    assert 'frozen:cases=99999<100000' in result.blockers

def test_frozen_failure_not_ready() -> None:
    result = assess_release(gates=gates(), parity=parity(), groups=groups(), frozen=frozen(100000, failed=1))
    assert result.decision == 'development_verified'
    assert 'frozen:failed=1' in result.blockers

def test_frozen_counts_must_add_up() -> None:
    with pytest.raises(ValueError, match='add up'):
        FrozenEvidence(10, 10, 1, True, 'a' * 64).validate()

def test_locked_frozen_evidence_requires_hash() -> None:
    with pytest.raises(ValueError, match='lock hash'):
        FrozenEvidence(1, 1, 0, True).validate()

def test_unlocked_cannot_claim_lock_hash() -> None:
    with pytest.raises(ValueError, match='cannot claim'):
        FrozenEvidence(1, 1, 0, False, 'a' * 64).validate()

@pytest.mark.parametrize('error', [-1, 256])
def test_parity_error_range_is_bounded(error: int) -> None:
    with pytest.raises(ValueError):
        ParityEvidence(error, 1, ('hair',)).validate()

def test_parity_engine_names_must_be_unique() -> None:
    with pytest.raises(ValueError):
        ParityEvidence(0, 1, ('hair', 'hair')).validate()

def test_duplicate_gate_names_are_rejected() -> None:
    values = gates() + [GateResult('mypy', 'passed')]
    with pytest.raises(ValueError, match='duplicate gate'):
        assess_release(gates=values, parity=parity(), groups=groups(), frozen=frozen())

def test_duplicate_group_names_are_rejected() -> None:
    values = groups() + [groups()[0]]
    with pytest.raises(ValueError, match='duplicate group'):
        assess_release(gates=gates(), parity=parity(), groups=values, frozen=frozen())

def test_group_summary_must_be_internally_consistent() -> None:
    bad = GroupSummary('hair_women', 1, 1, 0, 0, 0, True, (DEF_HASH,))
    with pytest.raises(ValueError):
        assess_release(gates=gates(), parity=parity(), groups=[bad, *groups()[1:]], frozen=frozen())

def test_audit_hash_is_deterministic() -> None:
    first = assess_release(gates=gates(), parity=parity(), groups=groups(), frozen=frozen())
    second = assess_release(gates=list(reversed(gates())), parity=parity(), groups=list(reversed(groups())), frozen=frozen())
    assert first.audit_sha256 == second.audit_sha256

def test_audit_hash_changes_with_gate_detail() -> None:
    first = assess_release(gates=gates(), parity=parity(), groups=groups(), frozen=frozen())
    values = gates()
    values[0] = GateResult('mypy', 'passed', 'box Python 3.13')
    second = assess_release(gates=values, parity=parity(), groups=groups(), frozen=frozen())
    assert first.audit_sha256 != second.audit_sha256

def test_synthetic_example_is_explicitly_not_release_ready() -> None:
    result = synthetic_development_assessment()
    assert result.decision == 'development_verified'
    assert not result.group_evidence_ready
    assert not result.frozen_ready
    assert any((item.startswith('frozen:') for item in result.blockers))
