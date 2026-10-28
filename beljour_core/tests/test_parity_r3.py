"""R3 parity vectors (CONTRACTS.md §16): format, coverage, freshness and kernel registry match.
The TypeScript half of the check is web/test/parity.test.mjs.
Author: John Khan.
"""
import json
import re
import unittest
from pathlib import Path

from plumb_api.quality import parity, report

ROOT = Path(__file__).resolve().parents[2]
VECTORS = ROOT / "parity" / "core-r3.json"
SAMPLE_REPORT = ROOT / "parity" / "report-sample-python.json"
TS_PARITY = ROOT / "web" / "src" / "quality" / "parity.ts"


class ParityVectorsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc = parity.load(VECTORS)

    def test_format_and_count(self):
        self.assertEqual(self.doc["format"], "beljour-parity/1")
        self.assertEqual(self.doc["tolerance"], 1 / 255)
        self.assertGreaterEqual(len(self.doc["vectors"]), parity.MIN_VECTORS)
        self.assertEqual(parity.validate(self.doc), [])

    def test_every_python_kernel_has_vectors(self):
        used = {v["kernel"] for v in self.doc["vectors"]}
        self.assertEqual(used, set(parity.KERNELS))
        for kernel in parity.KERNELS:
            self.assertGreaterEqual(sum(v["kernel"] == kernel for v in self.doc["vectors"]), 3, kernel)

    def test_stored_expectations_are_current(self):
        """Recomputing every vector from its stored arguments reproduces the stored result."""
        worst = max(parity.compare(self.doc), key=lambda item: item[1])
        self.assertLess(worst[1], 1e-8, worst)

    def test_typescript_registers_the_same_kernels(self):
        names = set(re.findall(r'^\s*"([a-z0-9_]+\.[a-z0-9_]+)":', TS_PARITY.read_text(), re.M))
        self.assertEqual(names, set(parity.KERNELS))

    def test_validate_rejects_bad_documents(self):
        self.assertTrue(parity.validate({"format": "x"}))
        bad = dict(self.doc, vectors=self.doc["vectors"][:2] + self.doc["vectors"][:1])
        self.assertTrue(any("duplicate" in p for p in parity.validate(bad)))
        unknown = dict(self.doc, vectors=[{"id": "a", "kernel": "nope.k", "args": {}, "expected": 0}])
        self.assertTrue(parity.validate(unknown))
        with self.assertRaises(KeyError):
            parity.evaluate({"kernel": "nope.k", "args": {}})

    def test_array_round_trip(self):
        import numpy as np
        arr = np.array([[0.5, np.inf], [1.25, -2.0]])
        enc = parity.encode_array(arr)
        self.assertEqual(enc["data"][1], None)
        back = parity.decode_array(enc)
        self.assertTrue(np.isnan(back[0, 1]))
        with self.assertRaises(ValueError):
            parity.decode_array({"shape": [3], "data": [1, 2]})


class SampleReportTest(unittest.TestCase):
    def test_sample_report_is_valid_and_current(self):
        stored = json.loads(SAMPLE_REPORT.read_text())
        self.assertEqual(report.validate_report(stored), [])
        self.assertEqual(stored["language"], "python")
        from plumb_api.quality.samples import sample_report
        self.assertEqual(json.loads(json.dumps(sample_report())), stored)


if __name__ == "__main__":
    unittest.main()
