"""BELJOUR Pro Commands — public, dependency-injected Lane H API.

There are no provider calls, model downloads or biometric fixtures here.
The identity meter is an uncalibrated cosine-derived similarity indicator,
not identity verification. R1h ships one synthetic test embedder only.
Author: John Khan.
"""

from __future__ import annotations

from .adapters import ProEngineBindings, RepairPublicPort
from .cache import CachedFaceEmbedder, CacheStats, FrameCache
from .cleanup import CleanupProcessor, CleanupReport
from .cleanup_detail import CleanupSignals, SpotHint
from .embedders import (
    DeterministicTestEmbedder,
    EmbedderEvidence,
    FaceEmbedder,
    cosine_similarity,
    identity_meter,
)
from .errors import (
    CommandError,
    CommandExecutionError,
    CommandParseError,
    CommandUnavailable,
    CommandValidationError,
    IdentityBlocked,
)
from .execution import CommandExecutor, ExecutionResult, OperationHandler
from .frames import ImageFrame
from .guarded import GuardedProExecutor, ProExecutionResult, ProStepReport
from .identity import IdentityDecision, IdentityGuard, IdentityThresholds
from .levels import DecimalLevel, level_ticks, validate_slider
from .parser import parse_commands, parse_single
from .performance import PerformanceBudget, PerformanceRecorder, TimingObservation
from .preview import PreviewCoordinator, PreviewTicket
from .pro_plan import (
    IdentityPolicy,
    ProPlan,
    ProStep,
    parse_pro_commands,
    pro_plan_from_dict,
    pro_plan_from_json,
)
from .pro_undo import NullProUndoHook, ProMemoryUndo, ProUndoCheckpoint, ProUndoHook
from .quality_metrics import EditQuality, cleanup_quality, upscale_quality
from .quality_r2h import CommandGateDefinition, GateObservation, load_definition
from .quality_tier_export import (
    QualityTierDossier,
    prepare_tier_dossier,
    render_tier_reviewer_sheet,
    write_tier_dossier,
)
from .quality_tier_matrix import (
    TIER_MATRIX_VERSION,
    TierLockObservation,
    build_tier_matrix,
    observation_from_runs,
    tier_matrix_csv,
    verify_tier_matrix,
)
from .quality_tiers import (
    QUALITY_TIER_VERSION,
    TIER_LONG_EDGES,
    QualityTierPlan,
    QualityTierRecipe,
    QualityTierRun,
    checked_tier_output,
    parse_quality_tier_commands,
    plan_quality_tier,
    run_quality_tier,
)
from .r2h_session import R2HSession, SessionSummary
from .regions import FaceRegions, PhotoRegionCache, RegionCacheStats
from .registry import COMMAND_REGISTRY, CommandRegistry
from .repair_gate import FaceFixerGate, FaceFixerLimits, FaceFixerReport, RegionEvidence
from .serialization import plan_from_dict, plan_from_json
from .types import (
    CleanupArgs,
    CommandName,
    CommandPlan,
    CommandStep,
    IdentityLockArgs,
    LockMode,
    LockStrength,
    PoseOnlyArgs,
    Strength,
    StudioQualityArgs,
    UpscaleArgs,
)
from .undo import MemoryUndoStack, NullUndoHook, UndoCheckpoint, UndoHook
from .upscale import UpscaleProcessor, UpscaleReport

__all__ = (
    "EditQuality",
    "cleanup_quality",
    "upscale_quality",
    "UpscaleReport",
    "UpscaleProcessor",
    "RegionCacheStats",
    "PhotoRegionCache",
    "FaceRegions",
    "SessionSummary",
    "R2HSession",
    "load_definition",
    "GateObservation",
    "CommandGateDefinition",
    "SpotHint",
    "CleanupSignals",
    "CleanupReport",
    "CleanupProcessor",
    "COMMAND_REGISTRY",
    "CacheStats",
    "CachedFaceEmbedder",
    "CleanupArgs",
    "CommandError",
    "CommandExecutionError",
    "CommandExecutor",
    "CommandName",
    "CommandParseError",
    "CommandPlan",
    "CommandRegistry",
    "CommandStep",
    "CommandUnavailable",
    "CommandValidationError",
    "DecimalLevel",
    "DeterministicTestEmbedder",
    "EmbedderEvidence",
    "ExecutionResult",
    "FaceEmbedder",
    "FaceFixerGate",
    "FaceFixerLimits",
    "FaceFixerReport",
    "FrameCache",
    "GuardedProExecutor",
    "IdentityBlocked",
    "IdentityDecision",
    "IdentityGuard",
    "IdentityLockArgs",
    "IdentityPolicy",
    "IdentityThresholds",
    "ImageFrame",
    "LockMode",
    "LockStrength",
    "MemoryUndoStack",
    "NullProUndoHook",
    "NullUndoHook",
    "OperationHandler",
    "PerformanceBudget",
    "PerformanceRecorder",
    "PoseOnlyArgs",
    "PreviewCoordinator",
    "PreviewTicket",
    "ProEngineBindings",
    "ProExecutionResult",
    "ProMemoryUndo",
    "ProPlan",
    "ProStep",
    "ProStepReport",
    "ProUndoCheckpoint",
    "ProUndoHook",
    "RegionEvidence",
    "RepairPublicPort",
    "Strength",
    "StudioQualityArgs",
    "TimingObservation",
    "UndoCheckpoint",
    "UndoHook",
    "UpscaleArgs",
    "cosine_similarity",
    "identity_meter",
    "level_ticks",
    "parse_commands",
    "parse_pro_commands",
    "parse_single",
    "plan_from_dict",
    "plan_from_json",
    "pro_plan_from_dict",
    "pro_plan_from_json",
    "validate_slider",
    "QUALITY_TIER_VERSION",
    "TIER_LONG_EDGES",
    "TIER_MATRIX_VERSION",
    "QualityTierPlan",
    "QualityTierRecipe",
    "QualityTierRun",
    "QualityTierDossier",
    "TierLockObservation",
    "plan_quality_tier",
    "parse_quality_tier_commands",
    "run_quality_tier",
    "checked_tier_output",
    "build_tier_matrix",
    "verify_tier_matrix",
    "tier_matrix_csv",
    "observation_from_runs",
    "prepare_tier_dossier",
    "render_tier_reviewer_sheet",
    "write_tier_dossier",
)
