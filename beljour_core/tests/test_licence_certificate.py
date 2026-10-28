"""scripts/licence_certificate.py: the written certificate is current for this repo, names every
open decision plainly, and a small made up repo shows each corpus, model and strict rule biting.
All data here is made up. Author: John Khan.
"""
import copy
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from tests.test_repo_checks import REPO, licences, load

cert = load(REPO / "scripts" / "licence_certificate.py")
MODELS = Path("api") / "plumb_api" / "models"
POLICY = {"rule": "Code AND weights must allow commercial use.", "allowed": ["MIT", "Apache-2.0", "Own work"],
          "pending": ["Unverified"], "blocked": ["GPL-3.0", "CC-BY-NC-4.0", "Unknown"]}


def corpus(name, paths, provenance="synthetic", location="repository", licence="Own work", status="allowed",
           made_by=()):
    return {"name": name, "paths": list(paths), "provenance": provenance, "location": location,
            "made_by": list(made_by), "licence": licence, "status": status, "notes": "made up"}


class MiniRepo:
    """A clean repo with one dependency, one drawn fixture and one generator script."""

    def __init__(self, tmp: Path) -> None:
        self.root = tmp
        (tmp / "api" / "tests" / "fixtures").mkdir(parents=True)
        (tmp / "web" / "src").mkdir(parents=True)
        (tmp / "api" / "requirements.txt").write_text("httpx>=0.27\n")
        (tmp / "web" / "package.json").write_text(json.dumps({"devDependencies": {"typescript": ">=5.4"}}))
        (tmp / "api" / "draw.py").write_text("x = 1\n")
        (tmp / "api" / "tests" / "fixtures" / "probe.json").write_text('{"synthetic": true}\n')
        self.ledger = {
            "policy": copy.deepcopy(POLICY),
            "python": [{"name": "httpx", "licence": "MIT", "status": "allowed"}],
            "npm": [{"name": "typescript", "licence": "Apache-2.0", "status": "allowed"}],
            "runtime": [], "models": [],
            "corpora": [corpus("Probes", ["api/tests/fixtures/*"], made_by=["api/draw.py"])],
        }
        self.save()

    def save(self) -> None:
        (self.root / "licences.json").write_text(json.dumps(self.ledger))

    def build(self) -> dict:
        self.save()
        return cert.Certificate(self.root).build()

    def run(self, *flags: str) -> int:
        self.save()
        return cert.main(["--root", str(self.root), *flags])

    def add_models(self) -> None:
        """The repo's real model catalogue, evidence and runtime pins, with their ledger entries."""
        (self.root / MODELS).mkdir(parents=True)
        for name in ("catalog.json", "provenance.json", "runtime.json"):
            shutil.copy(REPO / MODELS / name, self.root / MODELS / name)
        real = json.loads((REPO / "licences.json").read_text())
        self.ledger["runtime"] = real["runtime"]
        self.ledger["policy"] = real["policy"]


class ThisRepoTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc, cls.outputs = cert.render(REPO)

    def test_written_certificate_is_current(self):
        for rel, text in self.outputs.items():
            self.assertEqual((REPO / rel).read_text(), text, f"{rel} is stale: run make licence-certificate")
        self.assertEqual(cert.main(["--root", str(REPO), "--check"]), 0)

    def test_gate_passes_but_strict_fails_on_the_open_decisions(self):
        verdict = self.doc["verdict"]
        self.assertEqual(verdict["gate"], "passed")
        self.assertEqual(verdict["failures"], [])
        self.assertEqual(verdict["strict"], "not met")
        names = " ".join(item["name"] for item in self.doc["open_items"])
        for decision in ("pillow", "certifi", "MI-GAN", "Pose Landmarker", "Monk Skin Tone", "Real-face test set",
                         "Body test set", "YouCam"):
            self.assertIn(decision, names)
        self.assertEqual(cert.main(["--root", str(REPO), "--check", "--strict"]), 1)
        markdown = self.outputs[cert.MD_PATH]
        self.assertIn("## Open items", markdown)
        self.assertIn(f"{verdict['open_items']} open items", markdown)

    def test_every_requirement_is_listed_once(self):
        python = [row["name"] for row in self.doc["dependencies"]["python"]]
        self.assertEqual(len(python), len(set(python)))
        self.assertIn("httpx", python)   # starts with "http" but is a package, not a URL
        self.assertTrue(all(row["requirements"] for row in self.doc["dependencies"]["python"]))

    def test_every_model_has_weights_code_and_checksum(self):
        catalogue = self.doc["models"]["catalogue"]
        self.assertEqual(len(catalogue), len(json.loads((REPO / MODELS / "catalog.json").read_text())["models"]))
        for model in catalogue:
            self.assertNotEqual(model["weights"]["licence"], "none recorded", model["id"])
            self.assertNotEqual(model["code"]["licence"], "none recorded", model["id"])
            self.assertEqual(model["checksum"] == "pinned", bool(model["sha256"]), model["id"])
        migan = next(m for m in catalogue if m["id"].startswith("migan"))
        self.assertEqual(migan["checksum"], "not pinned")
        self.assertNotEqual(migan["concern"], "cleared")

    def test_every_corpus_file_has_provenance(self):
        files = [f for f in cert.repo_files(REPO) if cert.is_corpus_file(f)]
        self.assertGreater(len(files), 100)
        counted = sum(c["files"] for c in self.doc["corpora"])
        self.assertEqual(counted, len(files))
        self.assertTrue(all(c["provenance"] in cert.PROVENANCE for c in self.doc["corpora"]))

    def test_output_is_repeatable(self):
        self.assertEqual(cert.render(REPO)[1], self.outputs)


class MiniRepoTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp)
        self.repo = MiniRepo(self.tmp)

    def failures(self) -> list[str]:
        return self.repo.build()["verdict"]["failures"]

    def test_clean_repo_meets_strict_and_check_follows_the_files(self):
        doc = self.repo.build()
        self.assertEqual(doc["verdict"], {"gate": "passed", "failures": [], "strict": "met", "open_items": 0,
                                          "by_concern": dict.fromkeys(cert.CONCERNS[1:], 0)})
        self.assertEqual(self.repo.run("--check"), 1)          # nothing written yet
        self.assertEqual(self.repo.run("--strict"), 0)
        self.assertEqual(self.repo.run("--check", "--strict"), 0)
        md = self.tmp / cert.MD_PATH
        md.write_text(md.read_text() + "edited by hand\n")
        self.assertEqual(self.repo.run("--check"), 1)
        self.assertEqual(self.repo.run(), 0)
        self.assertEqual(self.repo.run("--check"), 0)

    def test_ledger_change_makes_the_certificate_stale(self):
        self.assertEqual(self.repo.run(), 0)
        self.repo.ledger["python"][0]["notes"] = "re-checked"
        self.assertEqual(self.repo.run("--check"), 1)

    def test_corpus_file_without_provenance_fails(self):
        (self.tmp / "web" / "face.png").write_bytes(b"\x89PNG made up")
        self.assertTrue(any("web/face.png has no provenance" in f for f in self.failures()))
        self.repo.ledger["corpora"].append(corpus("Drawn face", ["web/*.png"], made_by=["api/draw.py"]))
        self.assertEqual(self.failures(), [])

    def test_corpus_entry_rules(self):
        entry = self.repo.ledger["corpora"][0]
        cases = [({"licence": "MIT"}, "is synthetic but its licence is not Own work"),
                 ({"provenance": "recorded"}, "is recorded data and cannot be Own work"),
                 ({"provenance": "drawn"}, "provenance must be one of"),
                 ({"made_by": ["api/gone.py"]}, "names a missing generator api/gone.py"),
                 ({"paths": ["api/tests/fixtures/*.png"]}, "no corpus file matches its paths"),
                 ({"location": "outside the repository"}, "but files in the repository match its paths"),
                 ({"status": "maybe"}, "has no status")]
        for change, message in cases:
            self.repo.ledger["corpora"] = [{**entry, **change}]
            failures = self.failures()
            self.assertTrue(any(message in f for f in failures), (change, failures))

    def test_overlapping_entries_fail(self):
        self.repo.ledger["corpora"].append(corpus("Everything", ["api/**"]))
        self.assertTrue(any("matches more than one entry" in f for f in self.failures()))

    def test_recorded_corpus_is_open_and_non_commercial_fails(self):
        self.repo.ledger["corpora"].append(corpus("Volunteer photos", [], provenance="recorded",
                                                  location="outside the repository", licence="Unverified",
                                                  status="pending"))
        doc = self.repo.build()
        self.assertEqual(doc["verdict"]["gate"], "passed")
        self.assertEqual(doc["verdict"]["strict"], "not met")
        self.assertEqual([(i["name"], i["concern"]) for i in doc["open_items"]], [("Volunteer photos", "unknown")])
        self.repo.ledger["corpora"][-1].update(licence="CC-BY-NC-4.0", status="allowed")
        doc = self.repo.build()
        self.assertEqual(doc["verdict"]["gate"], "failed")
        self.assertEqual(doc["open_items"][0]["concern"], "non-commercial")

    def test_corpus_licence_not_on_the_allowed_list_fails(self):
        self.repo.ledger["corpora"].append(corpus("Published pairs", [], provenance="third-party",
                                                  location="outside the repository", licence="CC-BY-4.0"))
        self.assertTrue(any("CC-BY-4.0 is not on the allowed list" in f for f in self.failures()))

    def test_missing_dependency_is_open_and_fails(self):
        (self.tmp / "api" / "requirements.txt").write_text("httpx>=0.27\nleftpad==1.0\n")
        doc = self.repo.build()
        self.assertTrue(any("leftpad" in f for f in doc["verdict"]["failures"]))
        self.assertIn(("leftpad", "unknown"), [(i["name"], i["concern"]) for i in doc["open_items"]])

    def test_runtime_urls_and_test_inputs_are_kept_apart(self):
        (self.tmp / "web" / "src" / "a.ts").write_text('fetch("https://cdn.example.org/lib@1/x.js")\n')
        (self.tmp / "web" / "src" / "test-a.ts").write_text('check("https://example.org/only-a-string")\n')
        doc = self.repo.build()
        self.assertTrue(any("cdn.example.org" in f for f in doc["verdict"]["failures"]))
        self.assertEqual([r["url"] for r in doc["runtime_urls"]["test_inputs"]], ["https://example.org/only-a-string"])
        self.repo.ledger["runtime"] = [{"name": "lib", "licence": "MIT", "status": "allowed",
                                        "urls": ["https://cdn.example.org/lib@"]}]
        doc = self.repo.build()
        self.assertEqual(doc["verdict"]["failures"], [])
        self.assertEqual(doc["runtime_urls"]["loaded"][0]["entry"], "lib")

    def test_unreferenced_blocked_runtime_entry_still_fails(self):
        self.repo.ledger["runtime"] = [{"name": "unused lib", "licence": "GPL-3.0", "status": "allowed", "urls": []}]
        self.assertTrue(any("unused lib is blocked" in f for f in self.failures()))

    def test_models_report_weights_code_and_checksum(self):
        self.repo.add_models()
        doc = self.repo.build()
        self.assertEqual(doc["verdict"]["failures"], [])
        rows = {m["id"]: m for m in doc["models"]["catalogue"]}
        detector = rows["face-detector-short"]
        self.assertEqual((detector["checksum"], detector["concern"]), ("pinned", "cleared"))
        self.assertEqual(detector["code"]["sha256"], json.loads((REPO / MODELS / "runtime.json").read_text())
                         ["package"]["sha256"])
        open_items = {(i["section"], i["name"]) for i in doc["open_items"]}
        self.assertIn(("model checksum", "migan-512-places2"), open_items)
        weights = next(e for e in self.repo.ledger["runtime"] if e["name"] == "MediaPipe Hair Segmenter weights")
        del weights["code"]
        doc = self.repo.build()
        self.assertIn(("model code", "hair-segmenter"), {(i["section"], i["name"]) for i in doc["open_items"]})
        self.assertEqual({m["id"]: m for m in doc["models"]["catalogue"]}["hair-segmenter"]["concern"], "unknown")
        weights["code"] = {"name": "copyleft runner", "licence": "GPL-3.0", "status": "allowed"}
        self.assertTrue(any("copyleft runner is blocked" in f for f in self.failures()))

    def test_model_file_in_repo_needs_matching_checksum(self):
        (self.tmp / "api" / "w.onnx").write_bytes(b"made up weights")
        doc = self.repo.build()
        self.assertEqual(doc["models"]["repository_files"][0]["checksum"], "not listed")
        self.assertTrue(any("w.onnx" in f for f in doc["verdict"]["failures"]))


class RuleTest(unittest.TestCase):
    def test_glob_patterns(self):
        one, deep, tail = (cert.glob_regex(p) for p in ("a/*", "a/**", "a/**/x.json"))
        self.assertTrue(one.match("a/b.png"))
        self.assertIsNone(one.match("a/b/c.png"))
        self.assertTrue(deep.match("a/b/c.png"))
        self.assertTrue(tail.match("a/x.json") and tail.match("a/b/c/x.json"))
        self.assertIsNone(tail.match("a/b/y.json"))

    def test_corpus_file_rule(self):
        for rel in ("web/x.jpeg", "api/tests/goldens/v.json", "parity/r.json", "lab/pkg/data/c.csv",
                    "api/plumb_api/data/s.json", "scripts/commerce-cassette-r1.json", "a/fixtures/deep/p.txt"):
            self.assertTrue(cert.is_corpus_file(rel), rel)
        for rel in ("web/src/layout/cassette-bag.ts", "api/plumb_api/models/fixtures.py", "lab/pkg/x.json"):
            self.assertFalse(cert.is_corpus_file(rel), rel)

    def test_concern_levels(self):
        cases = [("MIT", "allowed", "cleared"), ("MIT", "pending", "pending"), ("Unverified", "pending", "unknown"),
                 ("CC-BY-4.0", "allowed", "unknown"), (None, "allowed", "unknown"), ("MIT", None, "unknown"),
                 ("GPL-3.0", "allowed", "blocked"), ("CC-BY-NC-4.0", "pending", "non-commercial"),
                 ("Unknown", "blocked", "unknown")]
        for licence, status, level in cases:
            self.assertEqual(cert.concern(licence, status, POLICY), level, (licence, status))

    def test_requirement_parsing_keeps_http_named_packages(self):
        self.assertEqual(licences.requirement_names("httpx>=0.27\nhttps://example.org/w.whl\nhttpcore\n"),
                         ["httpx", "httpcore"])


if __name__ == "__main__":
    unittest.main()
