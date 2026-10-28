"""The round 0 tooling in scripts/ (repo root) and the admin scripts in api/scripts/: each check
passes on this repo and catches what it is meant to catch on a small made up repo."""
import hashlib
import importlib.util
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent.parent
API = REPO / "api"


def load(path: Path):
    spec = importlib.util.spec_from_file_location(path.stem + "_under_test", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


licences = load(REPO / "scripts" / "check_licences.py")
secrets = load(REPO / "scripts" / "scan_secrets.py")
boundaries = load(REPO / "scripts" / "check_boundaries.py")
fixtures = load(REPO / "scripts" / "check_fixtures.py")
copy = load(REPO / "scripts" / "check_copy.py")
lines = load(REPO / "scripts" / "count_lines.py")


def mini_repo(tmp: Path) -> Path:
    (tmp / "api").mkdir()
    (tmp / "web" / "src").mkdir(parents=True)
    (tmp / "api" / "requirements.txt").write_text("numpy>=1.26  # maths\nhttpx\n")
    (tmp / "web" / "package.json").write_text(json.dumps({"devDependencies": {"typescript": ">=5.4"}}))
    (tmp / "web" / "src" / "a.ts").write_text('const M = "https://cdn.example.org/lib@1/x.js";\n')
    ledger = {
        "policy": {"allowed": ["MIT", "BSD-3-Clause", "Apache-2.0"], "pending": ["Unverified"], "blocked": ["GPL-3.0"]},
        "python": [{"name": "numpy", "licence": "BSD-3-Clause", "status": "allowed"},
                   {"name": "httpx", "licence": "BSD-3-Clause", "status": "allowed"}],
        "npm": [{"name": "typescript", "licence": "Apache-2.0", "status": "allowed"}],
        "runtime": [{"name": "lib", "licence": "MIT", "status": "allowed", "urls": ["https://cdn.example.org/lib@"]}],
        "models": [],
    }
    (tmp / "licences.json").write_text(json.dumps(ledger))
    return tmp


class LicenceCheckTest(unittest.TestCase):
    def test_this_repo_passes(self):
        result = licences.check(REPO)
        self.assertEqual(result.failures, [])
        self.assertTrue(result.ok())
        self.assertGreater(result.checked, 20)
        self.assertTrue(any("pillow" in p for p in result.pending))   # John's open question 1

    def test_strict_mode_fails_on_pending(self):
        self.assertFalse(licences.check(REPO).ok(strict=True))

    def test_mini_repo_passes_then_catches_problems(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = mini_repo(Path(tmp))
            self.assertEqual(licences.check(root).failures, [])
            (root / "api" / "requirements.txt").write_text("numpy\nleftpad==1.0\n")
            self.assertTrue(any("leftpad" in f for f in licences.check(root).failures))

    def test_unknown_runtime_url_and_model_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = mini_repo(Path(tmp))
            (root / "web" / "src" / "b.ts").write_text('fetch("https://models.example.net/m.task")\n')
            model = root / "api" / "weights.onnx"
            model.write_bytes(b"weights")
            fails = licences.check(root).failures
            self.assertTrue(any("models.example.net" in f for f in fails))
            self.assertTrue(any("weights.onnx" in f for f in fails))
            data = json.loads((root / "licences.json").read_text())
            data["runtime"].append({"name": "m", "licence": "MIT", "status": "allowed", "urls": ["https://models.example.net/"]})
            data["models"] = [{"name": "w", "path": "api/weights.onnx", "licence": "MIT", "status": "allowed",
                               "sha256": hashlib.sha256(b"weights").hexdigest()}]
            (root / "licences.json").write_text(json.dumps(data))
            self.assertEqual(licences.check(root).failures, [])
            model.write_bytes(b"changed")
            self.assertTrue(any("checksum" in f for f in licences.check(root).failures))

    def test_blocked_licence_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = mini_repo(Path(tmp))
            data = json.loads((root / "licences.json").read_text())
            data["python"][0]["licence"] = "GPL-3.0"
            (root / "licences.json").write_text(json.dumps(data))
            self.assertTrue(any("blocked" in f for f in licences.check(root).failures))

    def test_requirement_parsing(self):
        self.assertEqual(licences.requirement_names("Foo_Bar>=1\n# c\n-r other.txt\nbaz[x]==2 ; python_version>'3'\n"),
                         ["foo-bar", "baz"])


class SecretScanTest(unittest.TestCase):
    def test_this_repo_is_clean(self):
        self.assertEqual(secrets.scan(REPO), [])

    def test_catches_keys_tokens_and_signed_urls(self):
        long_token = "Bearer " + "A1b2C3d4" * 4
        text = (f'h = "{long_token}"\nYOUCAM_API_KEY = "abcdefghijklmnop1234"\n'  # gitleaks:allow (made up)
                'u = "https://s3.example.com/x?X-Amz-Signature=abc"\n')  # gitleaks:allow (made up)
        hits = secrets.scan_text(text, "x.py")
        self.assertEqual(len(hits), 3)

    def test_allow_marker(self):
        self.assertEqual(secrets.scan_text('k = "Bearer ' + "Z" * 30 + '"  # gitleaks:allow\n', "t.py"), [])

    def test_fake_keys_in_tests_are_fine(self):
        self.assertEqual(secrets.scan_text('assert h == "Bearer k123"\nYOUCAM_API_KEY=...\n', "t.py"), [])
        self.assertEqual(secrets.scan_text('f"Bearer {self._key}"', "c.py"), [])

    def test_env_file_is_flagged(self):
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / ".env").write_text("X=1\n")
            self.assertEqual(len(secrets.scan(Path(tmp))), 1)


class BoundaryTest(unittest.TestCase):
    def test_this_repo_keeps_youcam_behind_one_module(self):
        self.assertEqual(boundaries.check(REPO), [])

    def test_catches_a_second_door(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            mod = root / "api" / "plumb_api" / "routes"
            mod.mkdir(parents=True)
            (mod / "sneaky.py").write_text("from ..youcam.client import YouCamClient\n")
            web = root / "web" / "src"
            web.mkdir(parents=True)
            (web / "x.ts").write_text('fetch("https://yce-api-01.makeupar.com/s2s")\n')
            problems = boundaries.check(root)
            self.assertEqual(len(problems), 2)

    def test_synthetic_may_import_the_data_type_only(self):
        self.assertEqual(boundaries.client_imports("from ..youcam.client import TaskOutcome\n"), [(1, {"TaskOutcome"})])
        with tempfile.TemporaryDirectory() as tmp:
            demo = Path(tmp) / "api" / "plumb_api" / "demo"
            demo.mkdir(parents=True)
            (demo / "synthetic.py").write_text("from ..youcam.client import TaskOutcome, YouCamClient\n")
            self.assertEqual(len(boundaries.check(Path(tmp))), 1)


class FixtureCheckTest(unittest.TestCase):
    def test_this_repo(self):
        problems, count = fixtures.check(REPO)
        self.assertEqual(problems, [])
        # R14 explicitly retires 53 of the 60 provider fixture records. The
        # scanner must still visit all seven approved records and four cassettes.
        demo = REPO / "api" / "plumb_api" / "demo"
        self.assertEqual(len(list((demo / "fixtures").glob("*.json"))), 7)
        self.assertEqual(len(list((demo / "cassettes").glob("*.json"))), 4)
        self.assertEqual(count, 11)

    def test_unredacted_cassette_is_caught(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "bad.json"
            path.write_text(json.dumps({"format": "beljour-cassette/1", "name": "bad", "synthetic": False,
                                        "interactions": [{"request": {"method": "GET", "path": "/x", "headers": {"Authorization": "x"}},
                                                          "response": {"status": 200, "json": {"url": "https://real.example/r.jpg"}, "blob": "gone.jpg"}}]}))
            problems = fixtures.check_cassette(path)
            self.assertEqual(len(problems), 3)


class CopyCheckTest(unittest.TestCase):
    def test_string_lexer(self):
        text = 'h("p", {}, "Talk to your clinician"); // "surgery" in a comment\nconst t = `a ${x} b`;\n/* "patient" */'
        found = [v for _, v in copy.ts_strings(text)]
        self.assertIn("Talk to your clinician", found)
        self.assertNotIn("surgery", " ".join(found))
        self.assertNotIn("patient", " ".join(found))
        self.assertIn("a   b", found)

    def test_rules(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "web" / "src"
            src.mkdir(parents=True)
            (src / "a.ts").write_text('h("p", {}, "Flawless skin, guaranteed");\nfetch("/api/surgery/preview");\n')
            hits = copy.check(Path(tmp))
            self.assertEqual(len(hits), 1)   # the route path is an identifier, not copy
            self.assertIn("hype", hits[0])

    def test_report_mode_does_not_fail(self):
        self.assertEqual(copy.main(["--root", str(REPO)]), 0)


class CountLinesTest(unittest.TestCase):
    def test_comments_and_blanks_are_skipped(self):
        py = "# comment\n\nx = 1  # trailing\n\"\"\"doc\"\"\"\n"
        self.assertEqual(lines.count_file(py, "#", ".py"), 2)
        ts = "// c\n/* block\n still */\nconst a = 1;\n/* one */ const b = 2;\n"
        self.assertEqual(lines.count_file(ts, "//", ".ts"), 2)

    def test_tests_are_counted_apart(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "api" / "tests").mkdir(parents=True)
            (root / "api" / "m.py").write_text("a = 1\nb = 2\n")
            (root / "api" / "tests" / "test_m.py").write_text("assert True\n")
            (root / "node_modules").mkdir()
            (root / "node_modules" / "x.js").write_text("skip()\n")
            totals = lines.count(root)
            self.assertEqual((totals.code_total, totals.test_total), (2, 1))


class AdminScriptsTest(unittest.TestCase):
    def test_judge_code_script(self):
        judge = load(API / "scripts" / "judge_code.py")
        out: list[str] = []
        judge.main(["abcd-efgh"], out=out.append)
        self.assertEqual(out[0], "code:   ABCD-EFGH")
        self.assertIn(hashlib.sha256(b"ABCD-EFGH").hexdigest(), out[1])

    def test_ledger_script_lists_and_clears(self):
        from plumb_api.ledger import TaskLedger
        script = load(API / "scripts" / "ledger.py")
        with tempfile.TemporaryDirectory() as tmp:
            ledger = TaskLedger(Path(tmp) / "ledger.sqlite3")
            ledger.begin("k1", "makeup-vto", "v2.0")
            ledger.ambiguous("k1", "reply lost")
            out: list[str] = []
            self.assertEqual(script.main(["--data-dir", tmp, "list", "--status", "ambiguous"], out=out.append), 0)
            self.assertIn("ambiguous", out[1])
            self.assertEqual(script.main(["--data-dir", tmp, "clear", "k1"], out=out.append), 0)
            self.assertEqual(TaskLedger(Path(tmp) / "ledger.sqlite3").get("k1").status, "failed")
            self.assertEqual(script.main(["--data-dir", tmp, "clear", "k1"], out=out.append), 1)

    def test_spike_cassette_generator_is_deterministic(self):
        gen = load(API / "scripts" / "make_spike_cassettes.py")
        from lab.python import beljour_lab as spikes
        with tempfile.TemporaryDirectory() as tmp:
            original = spikes.CASSETTES
            try:
                gen.CASSETTES = Path(tmp)
                gen.main()
            finally:
                gen.CASSETTES = original
            for path in Path(tmp).glob("*.json"):
                committed = original / path.name
                self.assertEqual(json.loads(path.read_text()), json.loads(committed.read_text()), path.name)
            shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
