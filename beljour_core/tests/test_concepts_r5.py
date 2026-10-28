"""R5 clean-room face-mapping credits (decisions.md 2026-10-22 6:43 PM), enforced by
scripts/check_licences.py: this repo passes, and a made-up repo shows each rule biting.
Author: John Khan.
"""
import copy
import json
import tempfile
import unittest
from pathlib import Path

from tests.test_repo_checks import REPO, licences

MARKER = "concept only, no code copied"


def ledger(entries, scope):
    return {
        "policy": {"allowed": ["Own work"], "pending": [], "blocked": []},
        "concept_projects": [{"project": "OpenFace", "kind": "concept", "source": "paper", "ideas": "pose"},
                             {"project": "MediaPipe Face Landmarker", "kind": "runtime", "source": "repo", "ideas": "mesh"}],
        "concepts_scope": scope,
        "concepts": entries,
    }


def entry(name, *projects):
    return {"name": name, "licence": "Own work", "status": "allowed", "marker": MARKER,
            "inspired_by": [{"project": p, "use": "concept", "idea": "x"} for p in projects]}


class ConceptGateTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        (self.tmp / "web" / "src" / "face").mkdir(parents=True)
        self.module = self.tmp / "web" / "src" / "face" / "pose.ts"
        self.module.write_text(f"/** Pose. Credits: {MARKER}: OpenFace (pose\n * read from landmarks) and MediaPipe Face\n"
                               " * Landmarker. Author: John Khan. */\nexport const x = 1;\n")
        self.good = ledger([entry("web/src/face/pose.ts", "OpenFace", "MediaPipe Face Landmarker")], ["web/src/face/*.ts"])

    def failures(self, data):
        result = licences.Result()
        licences.check_concepts(self.tmp, data, result)
        return result.failures

    def test_this_repo_passes(self):
        data = json.loads((REPO / "licences.json").read_text())
        result = licences.Result()
        licences.check_concepts(REPO, data, result)
        self.assertEqual(result.failures, [])
        self.assertGreaterEqual(len(data["concepts"]), 12)
        for project in data["concept_projects"]:
            self.assertTrue(project.get("source") and project.get("kind") and project.get("ideas"), project)

    def test_good_entry_passes_even_with_wrapped_names(self):
        self.assertEqual(self.failures(self.good), [])

    def test_module_in_scope_needs_an_entry(self):
        (self.tmp / "web" / "src" / "face" / "extra.ts").write_text("export const y = 2;\n")
        self.assertTrue(any("extra.ts has no credit entry" in f for f in self.failures(self.good)))

    def test_header_must_carry_the_marker_and_every_project(self):
        self.module.write_text("/** Pose from OpenFace. */\n")
        found = self.failures(self.good)
        self.assertTrue(any("does not say" in f for f in found))
        self.assertTrue(any("does not name MediaPipe Face Landmarker" in f for f in found))

    def test_projects_must_be_registered_and_described(self):
        bad = copy.deepcopy(self.good)
        bad["concepts"][0]["inspired_by"].append({"project": "SomethingElse", "use": "copy", "idea": ""})
        found = self.failures(bad)
        self.assertTrue(any("not in concept_projects" in f for f in found))
        self.assertTrue(any("needs use" in f for f in found))

    def test_marker_without_entry_duplicates_and_missing_files(self):
        stray = self.tmp / "api" / "plumb_api" / "x.py"
        stray.parent.mkdir(parents=True)
        stray.write_text(f'"""Something. {MARKER}: OpenFace."""\n')
        dup = copy.deepcopy(self.good)
        dup["concepts"].append(entry("web/src/face/pose.ts", "OpenFace"))
        dup["concepts"].append(entry("web/src/face/missing.ts", "OpenFace"))
        found = self.failures(dup)
        self.assertTrue(any("x.py carries the clean-room marker" in f for f in found))
        self.assertTrue(any("listed twice" in f for f in found))
        self.assertTrue(any("missing.ts does not exist" in f for f in found))

    def test_wrong_licence_or_marker_and_empty_inspiration(self):
        bad = copy.deepcopy(self.good)
        bad["concepts"][0]["licence"] = "MIT"
        bad["concepts"][0]["inspired_by"] = []
        found = self.failures(bad)
        self.assertTrue(any("must be Own work" in f for f in found))
        self.assertTrue(any("names no inspiring project" in f for f in found))

    def test_ledgers_without_concepts_are_untouched(self):
        self.assertEqual(self.failures({"policy": {}}), [])


if __name__ == "__main__":
    unittest.main()
