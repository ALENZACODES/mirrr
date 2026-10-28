"""Master registry claims require code, tests and explicit incomplete-work reasons.

Pass definition: mutate each status/evidence rule and observe a rejection;
unmeasured work never acquires a PASS by changing its implementation status.
Author: John Khan.
"""
from __future__ import annotations

import json
from dataclasses import replace

from plumb_api.arena import registry


def test_registered_code_cannot_hide_under_not_started():
    features, _ = registry.load()
    changed = [replace(f, status="Not started", plan={**f.plan, "state": "planned"})
               if f.id == 13 else f for f in features]
    assert any("Not started with registered code" in issue for issue in registry.validate(changed))


def test_built_requires_test_evidence_that_exists():
    features, _ = registry.load()
    missing = [replace(f, tests=()) if f.id == 13 else f for f in features]
    assert any("requires behavior tests" in issue for issue in registry.validate(missing))
    wrong = [replace(f, tests=("api/tests/never-written.py",)) if f.id == 13 else f for f in features]
    assert any("test api/tests/never-written.py does not exist" in issue for issue in registry.validate(wrong))


def test_blocked_is_explicit_and_does_not_claim_implementation():
    features, _ = registry.load()
    blocked = [f for f in features if f.status == "Blocked"]
    assert blocked
    for feature in blocked:
        assert feature.plan_state == "blocked"
        assert feature.plan.get("reason")
        assert feature.plan.get("substitute")
        assert feature.provider == "none"
    victim = blocked[0]
    broken = [replace(f, plan={**f.plan, "reason": ""}) if f.id == victim.id else f for f in features]
    assert any("reason and a substitute" in issue for issue in registry.validate(broken))


def test_partial_dependencies_count_as_built_only_with_the_complete_flow():
    # Features 6 and 91 were Blocked while only their parts existed (separate age and
    # gender engines; a 50-image batch). Both are Built now, so the rule is checked the
    # other way round: Built must name the module that does the whole flow and the test
    # that exercises it, and dropping all tests from either row is refused.
    features, _ = registry.load()
    by_id = {f.id: f for f in features}
    flows = {6: ("web/src/ui/shell/appearance-stack.ts", "web/test/appearance-stack.test.mjs"),
             91: ("web/src/save/batch-review.ts", "web/test/batch-100.test.mjs")}
    for fid, (module, test) in flows.items():
        feature = by_id[fid]
        assert feature.status == "Built"
        assert module in feature.modules and (registry.REPO_ROOT / module).is_file()
        assert test in feature.tests and (registry.REPO_ROOT / test).is_file()
        stripped = [replace(f, tests=()) if f.id == fid else f for f in features]
        assert any(f"#{fid} " in issue and "requires behavior tests" in issue
                   for issue in registry.validate(stripped))
    # The batch row promises 100 photos, not the old 50-image limit.
    assert "100 photos" in by_id[91].plan["note"]


def test_implementation_labels_do_not_create_scores_or_passes():
    features, _ = registry.load()
    rows = registry.feature_rows(features)
    assert {row.status for row in rows} == {"Built", "Blocked"}
    for row in rows:
        assert row.verdict is None
        assert all(value is None for value in row.scores.values())
    serialised = registry.to_json(rows)
    assert all(row["gate"] == "Not tested" for row in serialised)
    raw = json.loads(registry.REGISTRY_PATH.read_text())
    assert registry.validate(features, raw=raw) == []


def test_a_result_cannot_make_blocked_implementation_look_shipped():
    features, _ = registry.load()
    pending = next(f for f in features if f.status == "Blocked")
    rows = registry.feature_rows(features, feature_results={pending.id: {"source": "human", "scores": {}}})
    row = next(r for r in rows if r.feature.id == pending.id)
    assert row.status == "Blocked" and row.verdict is None
