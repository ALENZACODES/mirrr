"""Development tools and own-work declarations are enforced, not just listed.

No dependency installation or network request occurs. Author: John Khan.
"""
from __future__ import annotations

import json
from pathlib import Path

from api.tests.test_repo_checks import licences, mini_repo


def test_unregistered_development_dependency_fails(tmp_path: Path):
    root = mini_repo(tmp_path)
    (root / "api/requirements-dev.txt").write_text("-r requirements.txt\nchecker==1.0\n")
    assert any("python dev: checker" in item for item in licences.check(root).failures)
    path = root / "licences.json"
    data = json.loads(path.read_text())
    data["python_dev"] = [{"name": "checker", "licence": "MIT", "status": "allowed"}]
    path.write_text(json.dumps(data))
    assert licences.check(root).failures == []
    data["python_dev"][0]["status"] = "blocked"
    path.write_text(json.dumps(data))
    assert any("checker is blocked" in item for item in licences.check(root).failures)


def test_original_role_requires_real_source_and_behavior_test(tmp_path: Path):
    root = mini_repo(tmp_path)
    source, test = root / "web/src/role.ts", root / "web/src/role.test.mjs"
    source.write_text("export const role = true;\n")
    test.write_text("import assert from 'node:assert/strict'; assert.equal(1, 1);\n")
    path = root / "licences.json"
    data = json.loads(path.read_text())
    data["policy"]["allowed"].append("Own work")
    row = {"name": "Local role", "licence": "Own work", "status": "allowed", "author": "John Khan",
           "paths": ["web/src/role.ts"], "tests": ["web/src/role.test.mjs"]}
    data["original_work"] = [row]
    path.write_text(json.dumps(data))
    assert licences.check(root).failures == []
    test.unlink()
    assert any("missing or external" in item for item in licences.check(root).failures)
    row["tests"] = []
    path.write_text(json.dumps(data))
    assert any("behavior test paths" in item for item in licences.check(root).failures)


def test_external_quality_tools_cannot_hide_pending_or_blocked_components(tmp_path: Path):
    root = mini_repo(tmp_path)
    path = root / "licences.json"
    data = json.loads(path.read_text())
    data["python_dev"] = [{"name": "external-counter", "licence": "MIT", "status": "pending",
                           "notes": "A separately installed tool has an unresolved binary component."}]
    path.write_text(json.dumps(data))
    result = licences.check(root)
    assert result.ok() and not result.ok(strict=True)
    assert any("external-counter" in item for item in result.pending)
    data["python_dev"][0]["status"] = "blocked"
    path.write_text(json.dumps(data))
    assert not licences.check(root).ok()


def test_own_work_paths_cannot_escape_the_repository(tmp_path: Path):
    root = mini_repo(tmp_path)
    outside = tmp_path.parent / "outside-r14.txt"
    outside.write_text("Temporary synthetic test source")
    try:
        path = root / "licences.json"
        data = json.loads(path.read_text())
        data["policy"]["allowed"].append("Own work")
        data["original_work"] = [{"name": "Outside", "licence": "Own work", "status": "allowed", "author": "John Khan",
                                  "paths": [str(outside)], "tests": ["web/src/a.ts"]}]
        path.write_text(json.dumps(data))
        assert any("missing or external" in item for item in licences.check(root).failures)
    finally:
        outside.unlink()
