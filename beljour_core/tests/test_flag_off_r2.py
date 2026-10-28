"""Flag-off lane: the YouCam adapter must not spend or create tasks.
Author: John Khan.
"""
import unittest
from tempfile import TemporaryDirectory
from pathlib import Path
from plumb_api.config import Settings, load_settings
from plumb_api.ledger import TaskLedger
from plumb_api.providers.youcam import YouCamProvider, OutOfScope, LEGACY, STYLING


class FlagOffJob(unittest.TestCase):
    def test_flag_off_disables_every_styling_call(self):
        with TemporaryDirectory() as tmp:
            provider = YouCamProvider(Settings(youcam_api_key="test-key-placeholder",
                                               youcam_styling=False, data_dir=Path(tmp)),
                                      None, TaskLedger(Path(tmp) / "ledger.sqlite3"))
            self.assertFalse(provider.enabled)
            for feature in STYLING:
                self.assertTrue(provider.allowed(feature))
            self.assertIsNone(provider.client)

    def test_legacy_flag_cannot_be_set_in_env(self):
        config = load_settings({"BELJOUR_YOUCAM_LEGACY": "1", "YOUCAM_API_KEY": ""})
        self.assertFalse(config.youcam_legacy)
        with TemporaryDirectory() as tmp:
            provider = YouCamProvider(config, None, TaskLedger(Path(tmp) / "ledger.sqlite3"))
            for feature in LEGACY:
                with self.assertRaises(OutOfScope):
                    provider.check(feature)

    def test_removed_endpoints_always_refused(self):
        with TemporaryDirectory() as tmp:
            provider = YouCamProvider(Settings(youcam_legacy=True), None,
                                      TaskLedger(Path(tmp) / "ledger.sqlite3"))
            for endpoint in ("cloth-v4", "ai-smile", "face-reshape", "aging", "skin-analysis"):
                with self.subTest(endpoint=endpoint), self.assertRaises(OutOfScope):
                    provider.check(endpoint)


if __name__ == "__main__":
    unittest.main()
