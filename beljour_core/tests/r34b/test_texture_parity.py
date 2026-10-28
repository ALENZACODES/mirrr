"""Integrity of the original Grain and Structure interchange contract.

The vectors are tiny synthetic RGB images. This suite checks that the
committed evidence, regeneration script and numeric kernels agree without
using source portraits or a remote provider.
Created by John Khan.
"""
from __future__ import annotations

import base64
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np

from plumb_api.filters import oplist
from plumb_api.filters.colour import space as S
from plumb_api.filters.frame import Frame
from plumb_api.filters.qa import texture_parity


class TextureParityIntegrityTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.payload = texture_parity.build()
        cls.records = cls.payload["vectors"]

    def test_source_file_is_checked_in_and_current(self) -> None:
        self.assertTrue(texture_parity.PATH.is_file())
        self.assertEqual(texture_parity.check(), [])
        self.assertEqual(
            texture_parity.PATH.read_text(encoding="utf-8"),
            texture_parity.dumps(self.payload),
        )

    def test_one_record_per_effect_per_scene(self) -> None:
        actual = [(item["case"], item["op"]) for item in self.records]
        expected = [
            (name, op)
            for name, *_ in texture_parity.FIXTURE_CASES
            for op in ("spatial.grain", "spatial.structure")
        ]
        self.assertEqual(actual, expected)
        self.assertEqual(len(actual), len(set(actual)))
        self.assertEqual(len(self.records), 12)

    def test_metadata_never_claims_real_face_clearance(self) -> None:
        self.assertEqual(self.payload["author"], "John Khan")
        self.assertEqual(self.payload["source"], "synthetic-only")
        self.assertEqual(self.payload["real_faces"], 0)
        self.assertEqual(self.payload["encoding"], "rgb-u8-base64")
        self.assertNotIn("release_gate_passed", self.payload)
        self.assertNotIn("face_identifiers", self.payload)

    def test_source_and_output_are_exact_rgb_u8_buffers(self) -> None:
        for record in self.records:
            with self.subTest(case=record["case"], op=record["op"]):
                count = record["width"] * record["height"] * 3
                before = base64.b64decode(record["input_b64"], validate=True)
                after = base64.b64decode(record["output_b64"], validate=True)
                self.assertEqual(len(before), count)
                self.assertEqual(len(after), count)
                self.assertGreater(count, 200)
                self.assertTrue(all(isinstance(v, int) for v in before))

    def test_fixture_offsets_are_inside_the_original_photo(self) -> None:
        for record in self.records:
            with self.subTest(case=record["case"]):
                frame = record["frame"]
                self.assertGreaterEqual(frame["x0"], 0)
                self.assertGreaterEqual(frame["y0"], 0)
                self.assertLessEqual(frame["x0"] + record["width"], frame["width"])
                self.assertLessEqual(frame["y0"] + record["height"], frame["height"])
        self.assertTrue(any(r["frame"]["x0"] > 0 for r in self.records))
        self.assertTrue(any(r["frame"]["y0"] > 0 for r in self.records))

    def test_generated_source_bytes_are_reproducible(self) -> None:
        for record in self.records:
            with self.subTest(case=record["case"], op=record["op"]):
                image = texture_parity.pixels(
                    record["width"],
                    record["height"],
                    record["frame"]["x0"],
                    record["frame"]["y0"],
                )
                encoded = base64.b64decode(record["input_b64"], validate=True)
                self.assertEqual(image.tobytes(), encoded)

    def test_kernel_outputs_match_exported_bytes_again(self) -> None:
        for record in self.records:
            with self.subTest(case=record["case"], op=record["op"]):
                p = record["frame"]
                frame = Frame(p["width"], p["height"], p["x0"], p["y0"])
                source = base64.b64decode(record["input_b64"], validate=True)
                image = np.frombuffer(source, dtype=np.uint8).reshape(
                    (record["height"], record["width"], 3),
                )
                output = oplist.op(record["op"]).apply(
                    S.bytes_to_unit(image), record["params"], frame,
                )
                expected = base64.b64decode(record["output_b64"], validate=True)
                self.assertEqual(S.unit_to_bytes(output).tobytes(), expected)

    def test_zero_strength_vectors_are_exact_identities(self) -> None:
        for record in self.records:
            if record["case"] != "zero-strength":
                continue
            with self.subTest(op=record["op"]):
                self.assertEqual(record["params"]["amount"], 0)
                self.assertEqual(record["input_b64"], record["output_b64"])

    def test_invalid_stored_data_is_detected_without_rewriting(self) -> None:
        original = texture_parity.dumps(self.payload)
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder) / "texture.json"
            with patch.object(texture_parity, "PATH", target):
                self.assertTrue(texture_parity.check())
                target.write_text(original, encoding="utf-8")
                self.assertEqual(texture_parity.check(), [])
                data = json.loads(original)
                data["vectors"][0]["params"]["amount"] = 0.123
                target.write_text(json.dumps(data), encoding="utf-8")
                self.assertTrue(texture_parity.check())
                target.write_text(original.replace("synthetic-only", "real"), encoding="utf-8")
                self.assertTrue(texture_parity.check())

    def test_serialization_is_stable_and_has_one_terminal_newline(self) -> None:
        serialized = texture_parity.dumps(self.payload)
        self.assertTrue(serialized.endswith("\n"))
        self.assertFalse(serialized.endswith("\n\n"))
        self.assertEqual(json.loads(serialized), self.payload)
        self.assertEqual(texture_parity.dumps(json.loads(serialized)), serialized)

    def test_synthetic_references_do_not_use_remote_uris(self) -> None:
        for record in self.records:
            self.assertEqual(set(record), {
                "case", "op", "width", "height", "frame", "params",
                "input_b64", "output_b64",
            })
            self.assertNotIn("http", record["input_b64"])
            self.assertNotIn("http", record["output_b64"])


if __name__ == "__main__":
    unittest.main()
