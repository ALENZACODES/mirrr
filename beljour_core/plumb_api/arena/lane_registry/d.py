"""Lane D ownership extension. Author: John Khan."""

from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path

from . import LaneContribution
from .legacy import REPO_ROOT

# Lane D r21d: append-only ownership manifest for the client shell.
# Feature 100 is the cross-device web experience; 95 is privacy-first local mode,
# and 103 is the Trust Centre. Other numbers identify existing destinations.
# Values are (lane owner, feature IDs). No feature scores or test results are set here.
LANE_D_R21D_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/src/layout/client-routes.ts": ("D", (14, 33, 95, 100, 101, 103)),
    "web/src/layout/client-shell.ts": ("D", (95, 100, 103)),
    "web/src/layout/route-state.ts": ("D", (95, 100)),
    "web/src/mobile/disclosure.ts": ("D", (100,)),
    "web/src/mobile/keyboard.ts": ("D", (100,)),
    "web/src/mobile/viewport.ts": ("D", (100,)),
    "web/src/ui/shell/client-errors.ts": ("D", (95, 100, 103)),
    "web/src/ui/shell/client-navigation.ts": ("D", (14, 33, 95, 100, 101, 103)),
    "web/src/ui/shell/connectivity.ts": ("D", (95, 100, 103)),
}


def lane_d_r21d_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Check this lane's modules without changing the legacy feature registry."""
    problems: list[str] = []
    for module, (owner, feature_ids) in LANE_D_R21D_MODULES.items():
        if owner != "D":
            problems.append(f"{module}: owner must be D")
        if not (root / module).is_file():
            problems.append(f"{module}: registered module is missing")
        if not feature_ids or any(index not in range(1, 104) for index in feature_ids):
            problems.append(f"{module}: invalid feature ids")
    return problems
CONTRIBUTIONS: tuple[LaneContribution, ...] = ()

# --- Lane D r22d-cp2: append-only ownership of Judge Mode client modules ---
# The demo contains only illustrative local canvases and mocked provider results.
# Registration is about source ownership, not quality, fairness or release gates.
LANE_D_R22D_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/src/layout/judge-contract.ts": ("D", (14, 33, 95, 100)),
    "web/src/layout/judge-entry.ts": ("D", (14, 33, 95, 100)),
    "web/src/layout/judge-mode.ts": ("D", (14, 33, 95, 100)),
    "web/src/layout/judge-session.ts": ("D", (14, 33, 95, 100)),
    "web/src/ui/shell/judge-canvas.ts": ("D", (14, 33, 95, 100)),
    "web/src/ui/shell/judge-compare.ts": ("D", (14, 33, 95, 100)),
    "web/src/ui/shell/judge-consent.ts": ("D", (95, 100, 103)),
    "web/src/ui/shell/judge-edits.ts": ("D", (14, 33, 95, 100)),
    "web/src/ui/shell/judge-elements.ts": ("D", (14, 33, 95, 100)),
    "web/src/ui/shell/judge-export-screen.ts": ("D", (94, 95, 100)),
    "web/src/ui/shell/judge-export.ts": ("D", (94, 95, 100)),
    "web/src/ui/shell/judge-image.ts": ("D", (95, 100, 103)),
    "web/src/ui/shell/judge-paywall.ts": ("D", (100,)),
    "web/src/ui/shell/judge-source.ts": ("D", (14, 33, 95, 100)),
}


def lane_d_r22d_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Check the separate R22D block without altering the R21D registry."""
    problems: list[str] = []
    for module, (owner, feature_ids) in LANE_D_R22D_MODULES.items():
        if owner != "D":
            problems.append(f"{module}: owner must be D")
        if not (root / module).is_file():
            problems.append(f"{module}: registered module is missing")
        if not feature_ids or any(index not in range(1, 104) for index in feature_ids):
            problems.append(f"{module}: invalid feature ids")
    return problems

# --- Lane D r22d-cp3: append-only Judge Mode rehearsal and mobile access ---
# Owner D; this adds local UI/rehearsal modules only and does not mark a
# feature or provider gate passed. All prior owners and records are intact.
LANE_D_R22D_CP3_MODULES: dict[str, tuple[str, tuple[int, ...]]] = {
    "web/src/layout/judge-rehearsal.ts": ("D", (95, 100, 103)),
    "web/src/layout/judge-readiness.ts": ("D", (95, 100, 103)),
    "web/src/mobile/judge-accessibility.ts": ("D", (100, 103)),
    "web/src/mobile/judge-connectivity.ts": ("D", (95, 100)),
    "web/src/mobile/judge-device-audit.ts": ("D", (100, 103)),
    "web/src/ui/shell/judge-device-panel.ts": ("D", (100, 103)),
    "web/src/ui/shell/judge-file-check.ts": ("D", (95, 100, 103)),
    "web/src/ui/shell/judge-guide.ts": ("D", (95, 100, 103)),
    "web/src/ui/shell/judge-report.ts": ("D", (95, 100, 103)),
}


def lane_d_r22d_cp3_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Verify D's new modules without changing other lanes' ownership views."""
    problems: list[str] = []
    for module, (owner, feature_ids) in LANE_D_R22D_CP3_MODULES.items():
        if owner != "D":
            problems.append(f"{module}: expected D owner")
        if not (root / module).is_file():
            problems.append(f"{module}: missing registered module")
        if not feature_ids or any(index not in range(1, 104) for index in feature_ids):
            problems.append(f"{module}: invalid feature ids")
    return problems

# --- Lane D r24d: local accessibility review and opt-in offline UI ---
# Registrations are ownership facts, not WCAG, real-face or offline test passes.
# R23D pending paths are included to close the Lane D ownership handoff.
LANE_D_R23D_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/src/diagnostics/timing-statistics.ts": ("D", (95, 100)),
    "web/src/diagnostics/timing-report.ts": ("D", (95, 100)),
    "web/src/diagnostics/timing-sampler.ts": ("D", (95, 100)),
    "web/src/diagnostics/timing-page.ts": ("D", (95, 100)),
    "web/src/diagnostics/timing-entry.ts": ("D", (95, 100)),
    "web/src/layout/strength-scale.ts": ("D", (100,)),
    "web/src/layout/identity-lock.ts": ("D", (95, 100)),
    "web/src/ui/shell/identity-controls.ts": ("D", (95, 100)),
    "web/src/ui/shell/studio-identity.ts": ("D", (95, 100)),
    "web/src/ui/shell/preview-cache.ts": ("D", (95, 100)),
    "web/src/ui/shell/editor-preview-cache.ts": ("D", (95, 100)),
}

LANE_D_R24D_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/src/mobile/a11y-contrast.ts": ("D", (100, 103)),
    "web/src/mobile/a11y-focus.ts": ("D", (100, 103)),
    "web/src/mobile/a11y-review.ts": ("D", (100, 103)),
    "web/src/mobile/a11y-scan.ts": ("D", (100, 103)),
    "web/src/diagnostics/accessibility-report.ts": ("D", (95, 100, 103)),
    "web/src/diagnostics/accessibility-page.ts": ("D", (95, 100, 103)),
    "web/src/diagnostics/accessibility-entry.ts": ("D", (95, 100, 103)),
    "web/src/mobile/install-state.ts": ("D", (95, 100)),
    "web/src/mobile/install-storage.ts": ("D", (95, 100)),
    "web/src/mobile/install-controller.ts": ("D", (95, 100)),
    "web/src/mobile/install-page.ts": ("D", (95, 100)),
    "web/src/mobile/install-entry.ts": ("D", (95, 100)),
    "web/src/mobile/keyboard-rehearsal.ts": ("D", (100, 103)),
    "web/src/mobile/responsive-audit.ts": ("D", (100, 103)),
    "web/src/mobile/accessibility-pages.ts": ("D", (100, 103)),
}


def lane_d_r24d_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Check R23D outstanding and all R24D modules without another lane's file."""
    problems: list[str] = []
    for modules in (LANE_D_R23D_MODULES, LANE_D_R24D_MODULES):
        for module, (owner, feature_ids) in modules.items():
            if owner != "D":
                problems.append(f"{module}: owner must be D")
            if not (root / module).is_file():
                problems.append(f"{module}: source does not exist")
            if not feature_ids or any(index not in range(1, 104) for index in feature_ids):
                problems.append(f"{module}: invalid feature IDs")
    return problems

# --- Lane D r24d-cp4: in-memory demo evidence, mobile preflight and cue UI ---
# These owner records do not certify a live provider, real-face or phone gate.
LANE_D_R24D_CP4_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/src/layout/judge-evidence-ledger.ts": ("D", (95, 100, 103)),
    "web/src/layout/judge-proof-policy.ts": ("D", (95, 100, 103)),
    "web/src/layout/judge-proof-report.ts": ("D", (95, 100, 103)),
    "web/src/layout/judge-runbook.ts": ("D", (95, 100)),
    "web/src/layout/judge-demo-readiness.ts": ("D", (95, 100, 103)),
    "web/src/mobile/judge-demo-preflight.ts": ("D", (95, 100, 103)),
    "web/src/ui/shell/judge-preflight-panel.ts": ("D", (95, 100, 103)),
    "web/src/ui/shell/judge-proof-panel.ts": ("D", (95, 100, 103)),
    "web/src/ui/shell/judge-runbook-panel.ts": ("D", (95, 100, 103)),
    "web/src/ui/shell/judge-readiness-panel.ts": ("D", (95, 100, 103)),
}


def lane_d_r24d_cp4_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Verify Lane D's evidence UI ownership without touching shared registry code."""
    problems: list[str] = []
    for module, (owner, feature_ids) in LANE_D_R24D_CP4_MODULES.items():
        if owner != "D":
            problems.append(f"{module}: owner must be D")
        if not (root / module).is_file():
            problems.append(f"{module}: registered client module is missing")
        if not feature_ids or any(index not in range(1, 104) for index in feature_ids):
            problems.append(f"{module}: invalid feature IDs")
    return problems

# --- Lane D r24d-cp5: real-product handoff and refusal rehearsal UI ---
# Public destination links carry no photo or consent; checklist statuses are
# operator-reported only and never certify provider or real-face acceptance.
LANE_D_R24D_CP5_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/src/layout/judge-live-routes.ts": ("D", (95, 100, 101, 103)),
    "web/src/layout/judge-live-runbook.ts": ("D", (95, 100, 101, 103)),
    "web/src/layout/judge-live-checks.ts": ("D", (95, 100, 101, 103)),
    "web/src/layout/judge-live-report.ts": ("D", (95, 100, 101, 103)),
    "web/src/layout/judge-failure-replay.ts": ("D", (95, 100, 103)),
    "web/src/mobile/judge-device-selfcheck.ts": ("D", (95, 100, 103)),
    "web/src/ui/shell/judge-live-panel.ts": ("D", (95, 100, 101, 103)),
    "web/src/ui/shell/judge-failure-panel.ts": ("D", (95, 100, 103)),
    "web/src/ui/shell/judge-device-selfcheck-panel.ts": ("D", (95, 100, 103)),
}


def lane_d_r24d_cp5_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Validate the cp5-owned files without editing any other lane registry."""
    problems: list[str] = []
    for module, (owner, feature_ids) in LANE_D_R24D_CP5_MODULES.items():
        if owner != "D":
            problems.append(f"{module}: expected Lane D owner")
        if not (root / module).is_file():
            problems.append(f"{module}: missing registered client module")
        if not feature_ids or any(index not in range(1, 104) for index in feature_ids):
            problems.append(f"{module}: invalid feature IDs")
    return problems

# --- Lane D r26d-cp1: explicit per-face target selection in the browser ---
# This block does not change CONTRIBUTIONS or the pinned extras views.
# A null Lane A adapter cannot fabricate face detections for an upload.
LANE_D_R26D_CP1_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/src/layout/subjects/contract.ts": ("D", (95, 100, 103)),
    "web/src/layout/subjects/selection.ts": ("D", (95, 100, 103)),
    "web/src/layout/subjects/discovery.ts": ("D", (95, 100, 103)),
    "web/src/layout/subjects/authority.ts": ("D", (95, 100, 103)),
    "web/src/ui/shell/subject-picker.ts": ("D", (95, 100, 103)),
    "web/src/ui/shell/subject-drawing.ts": ("D", (95, 100)),
    "web/src/ui/shell/subject-render.ts": ("D", (95, 100, 103)),
}


def lane_d_r26d_cp1_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Validate only new Lane D ownership; avoid the shared aggregate registry."""
    issues: list[str] = []
    for module, (owner, feature_ids) in LANE_D_R26D_CP1_MODULES.items():
        if owner != "D":
            issues.append(f"{module}: incorrect owner")
        if not (root / module).is_file():
            issues.append(f"{module}: source missing")
        if not feature_ids or any(value not in range(1, 104) for value in feature_ids):
            issues.append(f"{module}: feature ids invalid")
    return issues

# --- Lane D r26d-cp2: five illustrative edits and mocked VTO boundary ---
# Ownership only; five local layers do not certify actual provider performance.
# Do not add this round to pinned cross-lane CONTRIBUTIONS / extras views.
LANE_D_R26D_CP2_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/src/layout/judge-five-edits.ts": ("D", (33, 95, 100)),
    "web/src/layout/judge-provider-mock.ts": ("D", (33, 95, 100)),
    "web/src/ui/shell/judge-five-edit-panel.ts": ("D", (33, 95, 100)),
    "web/src/ui/shell/judge-five-render.ts": ("D", (33, 95, 100)),
    "web/src/layout/subjects/pixel-guard.ts": ("D", (95, 100, 103)),
    "web/src/ui/shell/judge-isolation-panel.ts": ("D", (95, 100, 103)),
}


def lane_d_r26d_cp2_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Check D's added demonstration sources without touching shared registry."""
    issues: list[str] = []
    for module, (owner, feature_ids) in LANE_D_R26D_CP2_MODULES.items():
        if owner != "D":
            issues.append(f"{module}: incorrect owner")
        if not (root / module).is_file():
            issues.append(f"{module}: missing module")
        if not feature_ids or any(value not in range(1, 104) for value in feature_ids):
            issues.append(f"{module}: feature ids invalid")
    return issues

# --- Lane D r27d-cp1: opt-in continuous web tour; owner D only ---
# The owner interfaces contain no default live provider or assumed face detections.
# Contributions and aggregate extras views remain unchanged.
LANE_D_R27D_CP1_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/src/layout/continuous/contract.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/state.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/ports.ts": ("D", (33, 95, 100)),
    "web/src/layout/continuous/evidence.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/pro-commands.ts": ("D", (95, 100)),
    "web/src/layout/continuous/seasonal.ts": ("D", (95, 100)),
    "web/src/layout/continuous/performance.ts": ("D", (95, 100)),
    "web/src/layout/continuous/preview.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/mount.ts": ("D", (33, 95, 100, 103)),
    "web/src/ui/shell/continuous-panels.ts": ("D", (95, 100, 103)),
    "api/tests/test_lane_d_continuous_r27d.py": ("D", (95, 100, 103)),
}


def lane_d_r27d_cp1_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Validate the exact Lane D module list, without changing extras."""
    issues: list[str] = []
    for path, (owner, feature_ids) in LANE_D_R27D_CP1_MODULES.items():
        if owner != "D":
            issues.append(f"{path}: incorrect module owner")
        if not (root / path).is_file():
            issues.append(f"{path}: registered source missing")
        if not feature_ids or any(value not in range(1, 104) for value in feature_ids):
            issues.append(f"{path}: invalid feature ids")
    return issues

# --- Lane D r27d-cp2: bounded synthetic guides and truthful completion review ---
# No changes to contributions, cross-lane extras or another owner's modules.
LANE_D_R27D_CP2_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/src/layout/continuous/guide-painter.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/release-review.ts": ("D", (95, 100, 103)),
}


def lane_d_r27d_cp2_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Check the second continuous demonstration checkpoint independently."""
    problems: list[str] = []
    for path, (owner, feature_ids) in LANE_D_R27D_CP2_MODULES.items():
        if owner != "D":
            problems.append(f"{path}: expected owner D")
        if not (root / path).is_file():
            problems.append(f"{path}: module is missing")
        if not feature_ids or any(value not in range(1, 104) for value in feature_ids):
            problems.append(f"{path}: invalid feature ids")
    return problems


# --- Lane D r27d-cp3: manual product rehearsal, no external release claims ---
# Exact ownership only; shared extras and pinned contributions are untouched.
LANE_D_R27D_CP3_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/src/layout/continuous/operator-contract.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/operator-timer.ts": ("D", (95, 100)),
    "web/src/layout/continuous/operator-state.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/operator-report.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/operator-script.ts": ("D", (95, 100)),
    "web/src/layout/continuous/operator-preflight.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/operator-accessibility.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/operator-device.ts": ("D", (95, 100)),
    "web/src/ui/shell/continuous-operator-panel.ts": ("D", (95, 100, 103)),
    "api/tests/test_lane_d_operator_r27d.py": ("D", (95, 100, 103)),
}


def lane_d_r27d_cp3_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Validate only the new Lane D operator rehearsal files."""
    issues: list[str] = []
    for path, (owner, feature_ids) in LANE_D_R27D_CP3_MODULES.items():
        if owner != "D":
            issues.append(f"{path}: incorrect owner")
        if not (root / path).is_file():
            issues.append(f"{path}: registered module is missing")
        if not feature_ids or any(value not in range(1, 104) for value in feature_ids):
            issues.append(f"{path}: invalid feature ids")
    return issues


# --- Lane D r28d-cp1: release-check operator handoff (additive only) ---
# Manual checks and drawn Canvas benchmarks never certify real-face or provider gates.
# Owner D. Pinned contributions, extras and other lanes remain unchanged.
LANE_D_R28D_CP1_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/src/layout/release/catalogue.ts": ("D", (95, 100, 103)),
    "web/src/layout/release/state.ts": ("D", (95, 100, 103)),
    "web/src/layout/release/device.ts": ("D", (95, 100, 103)),
    "web/src/layout/release/commands.ts": ("D", (95, 100, 103)),
    "web/src/layout/release/readiness.ts": ("D", (95, 100, 103)),
    "web/src/layout/release/report.ts": ("D", (95, 100, 103)),
    "web/src/layout/release/import-review.ts": ("D", (95, 100, 103)),
    "web/src/layout/release/view.ts": ("D", (95, 100, 103)),
    "web/src/layout/release/mount.ts": ("D", (95, 100, 103)),
    "api/tests/test_lane_d_release_r28d.py": ("D", (95, 100, 103)),
}


def lane_d_r28d_cp1_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Check new Lane D files without touching the aggregate registry."""
    issues: list[str] = []
    for module, (owner, feature_ids) in LANE_D_R28D_CP1_MODULES.items():
        if owner != "D":
            issues.append(f"{module}: owner must be D")
        if not (root / module).is_file():
            issues.append(f"{module}: registered module missing")
        if not feature_ids or any(index not in range(1, 104) for index in feature_ids):
            issues.append(f"{module}: invalid feature ids")
    return issues


# --- Lane D r29d-cp1: revision-safe drawn export and optional local receipt ---
# The five new TypeScript modules and the owning Python test belong to Lane D.
# Neither a Canvas PNG nor a reselected file clears external release gates.
# Shared contribution/extras tables are intentionally unchanged.
LANE_D_R29D_CP1_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/src/layout/continuous/export-ticket.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/export-png.ts": ("D", (94, 95, 100)),
    "web/src/layout/continuous/export-controller.ts": ("D", (94, 95, 100)),
    "web/src/layout/continuous/export-receipt.ts": ("D", (94, 95, 100)),
    "web/src/ui/shell/continuous-export-panel.ts": ("D", (94, 100, 103)),
    "api/tests/test_lane_d_export_r29d.py": ("D", (94, 95, 100, 103)),
    "web/test/helpers/synthetic-png.mjs": ("D", (94, 95, 100)),
    "web/test/continuous-export-controller-r29d.test.mjs": ("D", (94, 95, 100)),
    "web/test/continuous-export-png-r29d.test.mjs": ("D", (94, 95, 100)),
    "web/test/continuous-export-receipt-r29d.test.mjs": ("D", (94, 95, 100)),
    "web/test/continuous-export-ticket-r29d.test.mjs": ("D", (94, 95, 100)),
    "web/test/continuous-export-view-r29d.test.mjs": ("D", (94, 95, 100)),
    "web/test/continuous-export-interleavings-r29d.test.mjs": ("D", (94, 95, 100)),
}


def lane_d_r29d_cp1_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Check ownership without altering any other lane's contribution."""
    problems: list[str] = []
    for path, (owner, feature_ids) in LANE_D_R29D_CP1_MODULES.items():
        if owner != "D":
            problems.append(f"{path}: expected Lane D owner")
        if not (root / path).is_file():
            problems.append(f"{path}: owned module is missing")
        if not feature_ids or any(index not in range(1, 104) for index in feature_ids):
            problems.append(f"{path}: invalid feature ids")
    return problems


# --- Lane D r30d-cp1: consent-gated, non-provider local edit replay ---
# Author: John Khan.
# No shared extras/contribution registration or previously owned rows change.
# Real provider, face-quality and Pro Command gates remain independent.
LANE_D_R30D_CP1_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/src/layout/continuous/sequence-contract.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/sequence-runner.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/sequence-shotlist.ts": ("D", (95, 100, 103)),
    "web/src/ui/shell/continuous-sequence-panel.ts": ("D", (95, 100, 103)),
    "web/test/helpers/continuous-sequence-page.mjs": ("D", (95, 100)),
    "web/test/continuous-sequence-runner-r30d.test.mjs": ("D", (95, 100)),
    "web/test/continuous-sequence-panel-r30d.test.mjs": ("D", (95, 100, 103)),
    "web/test/continuous-sequence-shotlist-r30d.test.mjs": ("D", (95, 100, 103)),
    "web/test/continuous-sequence-e2e-r30d.test.mjs": ("D", (95, 100, 103)),
    "web/test/continuous-sequence-lifecycle-r30d.test.mjs": ("D", (95, 100, 103)),
    "api/tests/test_lane_d_sequence_r30d.py": ("D", (95, 100, 103)),
}


def lane_d_r30d_cp1_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Require all locally authored replay modules and their declared Lane D owner."""
    errors: list[str] = []
    for path, (owner, feature_ids) in LANE_D_R30D_CP1_MODULES.items():
        if owner != "D":
            errors.append(f"{path}: incorrect Lane D owner")
        if not (root / path).is_file():
            errors.append(f"{path}: registered module is missing")
        if not feature_ids or any(number not in range(1, 104) for number in feature_ids):
            errors.append(f"{path}: invalid feature IDs")
    return errors


# --- Lane D r31d-cp1: offline cached drawings and explicit provider-screen gates ---
# Author: John Khan.
# This adds client/test ownership only; CONTRIBUTIONS and shared extras stay fixed.
# These entries do not certify a provider response, product fit or real-face quality.
LANE_D_R31D_CP1_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/src/layout/continuous/cassette-contract.ts": ("D", (33, 95, 100, 101, 103)),
    "web/src/layout/continuous/cassette-cache.ts": ("D", (33, 95, 100, 101, 103)),
    "web/src/layout/continuous/cassette-routes.ts": ("D", (33, 95, 100, 101, 103)),
    "web/src/layout/continuous/cassette-session.ts": ("D", (33, 95, 100, 101, 103)),
    "web/src/layout/continuous/cassette-bag.ts": ("D", (33, 95, 100, 101, 103)),
    "web/src/layout/continuous/cassette-report.ts": ("D", (33, 95, 100, 101, 103)),
    "web/src/layout/continuous/cassette-journey.ts": ("D", (33, 95, 100, 101, 103)),
    "web/src/ui/shell/continuous-cassette-panel.ts": ("D", (33, 95, 100, 101, 103)),
    "web/test/cassette-contract-r31d.test.mjs": ("D", (33, 95, 100, 101, 103)),
    "web/test/cassette-cache-r31d.test.mjs": ("D", (33, 95, 100, 101, 103)),
    "web/test/cassette-routes-r31d.test.mjs": ("D", (33, 95, 100, 101, 103)),
    "web/test/cassette-session-r31d.test.mjs": ("D", (33, 95, 100, 101, 103)),
    "web/test/cassette-bag-r31d.test.mjs": ("D", (33, 95, 100, 101, 103)),
    "web/test/cassette-report-r31d.test.mjs": ("D", (33, 95, 100, 101, 103)),
    "web/test/cassette-journey-r31d.test.mjs": ("D", (33, 95, 100, 101, 103)),
    "web/test/cassette-panel-r31d.test.mjs": ("D", (33, 95, 100, 101, 103)),
    "web/test/cassette-e2e-r31d.test.mjs": ("D", (33, 95, 100, 101, 103)),
    "web/test/cassette-resilience-r31d.test.mjs": ("D", (33, 95, 100, 101, 103)),
    "web/test/cassette-french-style-r31d.test.mjs": ("D", (33, 95, 100, 101, 103)),
    "api/tests/test_lane_d_cassette_r31d.py": ("D", (33, 95, 100, 101, 103)),
}


def lane_d_r31d_cp1_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Validate the new client/test modules without editing any other owner's view."""
    errors: list[str] = []
    for module, (owner, feature_ids) in LANE_D_R31D_CP1_MODULES.items():
        if owner != "D":
            errors.append(f"{module}: owner must be D")
        if not (root / module).is_file():
            errors.append(f"{module}: missing registered module")
        if not feature_ids or any(index not in range(1, 104) for index in feature_ids):
            errors.append(f"{module}: invalid feature IDs")
    return errors


# --- Lane D r32d-cp1: optional local PNG import for the continuous tour ---
# Author: John Khan.
# Read-only operator-selected files; hash agreement is not provider evidence.
# Shared extras/contributions and other lane registrations remain unchanged.
LANE_D_R32D_CP1_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/src/layout/continuous/offline-import-contract.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/offline-import-controller.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/offline-import-guide.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/offline-import-preparation.ts": ("D", (95, 100, 103)),
    "web/src/ui/shell/continuous-offline-import-panel.ts": ("D", (95, 100, 103)),
    "web/test/helpers/offline-import-fixture.mjs": ("D", (95, 100)),
    "web/test/offline-import-contract-r32d.test.mjs": ("D", (95, 100)),
    "web/test/offline-import-controller-r32d.test.mjs": ("D", (95, 100)),
    "web/test/offline-import-lifecycle-r32d.test.mjs": ("D", (95, 100)),
    "web/test/offline-import-panel-r32d.test.mjs": ("D", (95, 100)),
    "web/test/offline-import-guide-r32d.test.mjs": ("D", (95, 100)),
    "web/test/offline-import-e2e-r32d.test.mjs": ("D", (95, 100)),
    "web/test/offline-import-preparation-r32d.test.mjs": ("D", (95, 100)),
    "web/test/offline-import-roundtrip-r32d.test.mjs": ("D", (95, 100)),
    "api/tests/test_lane_d_import_r32d.py": ("D", (95, 100, 103)),
}


def lane_d_r32d_cp1_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Require every local-replay implementation and behavioral test with owner D."""
    problems: list[str] = []
    for path, (owner, feature_ids) in LANE_D_R32D_CP1_MODULES.items():
        if owner != "D":
            problems.append(f"{path}: module owner must be D")
        if not (root / path).is_file():
            problems.append(f"{path}: registered module missing")
        if not feature_ids or any(index not in range(1, 104) for index in feature_ids):
            problems.append(f"{path}: invalid feature identifiers")
    return problems


# --- Lane D r33d-cp1: bounded local drawing frames for judge replay ---
# Author: John Khan. Frame ownership records do not score provider/real-face gates.
# No edit to shared CONTRIBUTIONS, extras or another lane's ownership view.
LANE_D_R33D_CP1_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/src/layout/continuous/frame-cache-contract.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/frame-memory.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/frame-render.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/frame-controller.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/frame-report.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/frame-playback.ts": ("D", (95, 100, 103)),
    "web/src/ui/shell/continuous-frame-panel.ts": ("D", (95, 100, 103)),
    "web/test/helpers/local-frame-fixture.mjs": ("D", (95, 100)),
    "web/test/frame-cache-contract-r33d.test.mjs": ("D", (95, 100)),
    "web/test/frame-memory-r33d.test.mjs": ("D", (95, 100)),
    "web/test/frame-controller-r33d.test.mjs": ("D", (95, 100)),
    "web/test/frame-report-r33d.test.mjs": ("D", (95, 100)),
    "web/test/frame-panel-r33d.test.mjs": ("D", (95, 100)),
    "web/test/frame-e2e-r33d.test.mjs": ("D", (95, 100)),
    "web/test/frame-playback-r33d.test.mjs": ("D", (95, 100)),
    "web/test/frame-playback-e2e-r33d.test.mjs": ("D", (95, 100)),
    "web/test/frame-render-r33d.test.mjs": ("D", (95, 100)),
    "api/tests/test_lane_d_frames_r33d.py": ("D", (95, 100, 103)),
}


def lane_d_r33d_cp1_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Verify the local rendered-frame module and test ownership within Lane D."""
    problems: list[str] = []
    for module, (owner, feature_ids) in LANE_D_R33D_CP1_MODULES.items():
        if owner != "D":
            problems.append(f"{module}: expected Lane D ownership")
        if not (root / module).is_file():
            problems.append(f"{module}: registered module is missing")
        if not feature_ids or any(index not in range(1, 104) for index in feature_ids):
            problems.append(f"{module}: invalid feature ids")
    return problems


# --- Lane D r34d-cp1: original editorial drawing samples, framed tour and evidence ---
# Author: John Khan. These entries record authorship, not approval of visual samples.
# No contribution views, gate verdicts or prior owner blocks are changed.
LANE_D_R34D_CP1_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/src/layout/editorial/house-art.ts": ("D", (95, 100, 103)),
    "web/src/layout/editorial/cover.ts": ("D", (95, 100, 103)),
    "web/src/layout/editorial/proof.ts": ("D", (95, 100, 103)),
    "web/src/layout/editorial/motion.ts": ("D", (95, 100, 103)),
    "web/src/layout/editorial/review.ts": ("D", (95, 100, 103)),
    "web/src/layout/editorial/proof-graphic.ts": ("D", (95, 100, 103)),
    "web/src/layout/editorial/proof-experience.ts": ("D", (95, 100, 103)),
    "web/src/layout/editorial/frame-pacing.ts": ("D", (95, 100, 103)),
    "web/test/editorial-art-r34d.test.mjs": ("D", (95, 100, 103)),
    "web/test/editorial-cover-r34d.test.mjs": ("D", (95, 100, 103)),
    "web/test/editorial-proof-r34d.test.mjs": ("D", (95, 100, 103)),
    "web/test/editorial-motion-r34d.test.mjs": ("D", (95, 100, 103)),
    "web/test/editorial-review-r34d.test.mjs": ("D", (95, 100, 103)),
    "web/test/editorial-integration-r34d.test.mjs": ("D", (95, 100, 103)),
    "web/test/editorial-style-r34d.test.mjs": ("D", (95, 100, 103)),
    "web/test/editorial-graphic-r34d.test.mjs": ("D", (95, 100, 103)),
    "web/test/editorial-experience-r34d.test.mjs": ("D", (95, 100, 103)),
    "web/test/editorial-proof-journey-r34d.test.mjs": ("D", (95, 100, 103)),
    "web/test/editorial-frame-pacing-r34d.test.mjs": ("D", (95, 100, 103)),
    "api/tests/test_lane_d_editorial_r34d.py": ("D", (95, 100, 103)),
}

LANE_D_R34D_REVIEW_ASSETS: tuple[str, ...] = (
    "web/public/editorial-review/portrait.svg",
    "web/public/editorial-review/figure.svg",
    "web/public/editorial-review/trust.svg",
    "web/public/editorial-review/contact-sheet.png",
    "web/public/editorial-review/proof-wall-sample.svg",
    "web/public/editorial-review/proof-wall-sample.png",
)


def lane_d_r34d_cp1_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Check authored modules and sample assets without changing shared gate views."""
    problems: list[str] = []
    for path, (owner, feature_ids) in LANE_D_R34D_CP1_MODULES.items():
        if owner != "D":
            problems.append(f"{path}: incorrect owner")
        if not (root / path).is_file():
            problems.append(f"{path}: missing module")
        if not feature_ids or any(index not in range(1, 104) for index in feature_ids):
            problems.append(f"{path}: invalid feature identifiers")
    for path in LANE_D_R34D_REVIEW_ASSETS:
        if not (root / path).is_file():
            problems.append(f"{path}: review artwork is missing")
    return problems


# --- Lane D r35d-cp1: public BELJOUR lockup verification ---
# Author: John Khan. Existing schema IDs, module paths and ownership views are unchanged.
LANE_D_R35D_CP1_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/test/beljour-brand-r35d.test.mjs": ("D", (95, 100, 103)),
    "api/tests/test_lane_d_brand_r35d.py": ("D", (95, 100, 103)),
}


def lane_d_r35d_cp1_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Public branding tests must be present and Lane D owned."""
    problems: list[str] = []
    for module, (owner, feature_ids) in LANE_D_R35D_CP1_MODULES.items():
        if owner != "D":
            problems.append(f"{module}: invalid owner")
        if not (root / module).is_file():
            problems.append(f"{module}: module missing")
        if not feature_ids or any(item not in range(1, 104) for item in feature_ids):
            problems.append(f"{module}: invalid feature ids")
    return problems


# --- Lane D r36d-cp1: native keyboard continuity and local accessibility review ---
# Author: John Khan. No client assertion is an external acceptance verdict.
# All new source and behavioral tests remain owned by Lane D alone.
LANE_D_R36D_CP1_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/src/layout/continuous/focus-session.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/keyboard-session.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/accessibility-audit.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/accessibility-report.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/accessibility-session.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/accessibility-delta.ts": ("D", (95, 100, 103)),
    "web/src/layout/continuous/header.ts": ("D", (95, 100, 103)),
    "web/src/ui/shell/continuous-keyboard-panel.ts": ("D", (95, 100, 103)),
    "web/test/continuous-focus-r36d.test.mjs": ("D", (95, 100, 103)),
    "web/test/continuous-keyboard-r36d.test.mjs": ("D", (95, 100, 103)),
    "web/test/continuous-a11y-r36d.test.mjs": ("D", (95, 100, 103)),
    "web/test/continuous-a11y-report-r36d.test.mjs": ("D", (95, 100, 103)),
    "web/test/continuous-keyboard-panel-r36d.test.mjs": ("D", (95, 100, 103)),
    "web/test/continuous-a11y-session-r36d.test.mjs": ("D", (95, 100, 103)),
    "web/test/continuous-header-r36d.test.mjs": ("D", (95, 100, 103)),
    "web/test/continuous-a11y-e2e-r36d.test.mjs": ("D", (95, 100, 103)),
    "api/tests/test_lane_d_accessibility_r36d.py": ("D", (95, 100, 103)),
}


def lane_d_r36d_cp1_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Check all new keyboard and review modules, without touching contributions."""
    problems: list[str] = []
    for module, (owner, feature_ids) in LANE_D_R36D_CP1_MODULES.items():
        if owner != "D":
            problems.append(f"{module}: expected owner D")
        if not (root / module).is_file():
            problems.append(f"{module}: missing file")
        if not feature_ids or any(index not in range(1, 104) for index in feature_ids):
            problems.append(f"{module}: invalid feature identifiers")
    return problems


# --- Lane D T9-cp1: deferred Season Book rail and optional personal mapping ---
# Author: John Khan. This is a source-driven UI, not a seasonal claim or score.
# Registered modules are owned by D; the shared contribution views stay empty.
LANE_D_T9_CP1_MODULES: Mapping[str, tuple[str, tuple[int, ...]]] = {
    "web/src/layout/season-book/contracts.ts": ("D", (95, 100, 103)),
    "web/src/layout/season-book/personal.ts": ("D", (95, 100, 101, 103)),
    "web/src/layout/season-book/alerts.ts": ("D", (95, 100, 103)),
    "web/src/layout/season-book/controller.ts": ("D", (95, 100, 103)),
    "web/src/layout/season-book/view.ts": ("D", (95, 100, 103)),
    "web/src/layout/season-book/surface.ts": ("D", (95, 100, 103)),
    "web/src/layout/season-book/index.ts": ("D", (95, 100, 103)),
    "web/test/helpers/season-book-fixtures.mjs": ("D", (95, 100, 103)),
    "web/test/season-contract-t9d.test.mjs": ("D", (95, 100, 103)),
    "web/test/season-personal-t9d.test.mjs": ("D", (95, 100, 103)),
    "web/test/season-controller-t9d.test.mjs": ("D", (95, 100, 103)),
    "web/test/season-view-t9d.test.mjs": ("D", (95, 100, 103)),
    "web/test/season-home-t9d.test.mjs": ("D", (95, 100, 103)),
    "web/test/season-privacy-t9d.test.mjs": ("D", (95, 100, 103)),
    "api/tests/test_lane_d_season_t9d.py": ("D", (95, 100, 103)),
}


def lane_d_t9_cp1_ownership(root: Path = REPO_ROOT) -> list[str]:
    """Verify staged Season Book ownership without altering any other lane."""
    problems: list[str] = []
    for module, (owner, feature_ids) in LANE_D_T9_CP1_MODULES.items():
        if owner != "D":
            problems.append(f"{module}: incorrect lane owner")
        if not (root / module).is_file():
            problems.append(f"{module}: registered module missing")
        if not feature_ids or any(index not in range(1, 104) for index in feature_ids):
            problems.append(f"{module}: invalid feature identifiers")
    return problems
