"""Data factory: licence-clean, deduplicated, balanced and locked image sets.

Stages run on metadata and pixels they are given and never touch the
network. Public API is re-exported here; other packages should import from
this module only.
Author: John Khan.
"""

from __future__ import annotations

from .config import ConfigError, PipelineConfig, load_config, parse_config
from .datacard import card_facts, write_card
from .dedup import DuplicateLink, MultiIndex, NearDupConfig, exact_dedup, near_dedup
from .holdout import HoldoutError, HoldoutGuard, LeakReport
from .intake_csv import convert_csv
from .integrity import diff_manifests, verify_exports
from .licence import DenyList, LicenceDecision, LicenceFilter, LicencePolicy, build_filter
from .lockfile import LOCK_FORMAT, LockError, assert_lock, build_lock, verify_lock
from .manifest import (
    MANIFEST_SCHEMA,
    ManifestError,
    ManifestReader,
    ManifestWriter,
    read_manifest,
    verify_manifest,
)
from .near_holdout import NearHoldoutGuard, fingerprint_sets
from .pipeline import Pipeline, RunResult, run_pipeline
from .provenance_register import register_rows, write_register
from .quality_score import QualityConfig, QualityResult, score_image
from .records import ImageRecord, RecordError, validate_record
from .report import build_report, render_markdown, write_report
from .slices import BalanceResult, SliceSpec, balance
from .stages import StageError
from .takedown import TakedownRegistry, TakedownRequest, apply_takedown

__all__ = [
    "LOCK_FORMAT",
    "MANIFEST_SCHEMA",
    "BalanceResult",
    "ConfigError",
    "DenyList",
    "DuplicateLink",
    "HoldoutError",
    "HoldoutGuard",
    "ImageRecord",
    "LeakReport",
    "LicenceDecision",
    "LicenceFilter",
    "LicencePolicy",
    "LockError",
    "ManifestError",
    "ManifestReader",
    "ManifestWriter",
    "MultiIndex",
    "NearDupConfig",
    "NearHoldoutGuard",
    "Pipeline",
    "PipelineConfig",
    "QualityConfig",
    "QualityResult",
    "RecordError",
    "RunResult",
    "SliceSpec",
    "StageError",
    "TakedownRegistry",
    "TakedownRequest",
    "apply_takedown",
    "assert_lock",
    "balance",
    "build_filter",
    "build_lock",
    "build_report",
    "card_facts",
    "convert_csv",
    "diff_manifests",
    "exact_dedup",
    "fingerprint_sets",
    "load_config",
    "near_dedup",
    "parse_config",
    "read_manifest",
    "register_rows",
    "render_markdown",
    "run_pipeline",
    "score_image",
    "validate_record",
    "verify_exports",
    "verify_lock",
    "verify_manifest",
    "write_card",
    "write_register",
    "write_report",
]
