"""Offline, commercial-rights-gated training reference owned by Lane E.

Images are admitted only through `pipeline.ingest`, which applies the per-source
licence filter in `policy` and the consent gate in `consent`. Every training,
scoring or export step re-audits the approved corpus with `audit.validate_corpus`.
The NumPy reference trainer is a small auditable baseline, not a production
foundation model. Author: John Khan.
"""

from .audit import CorpusAudit, CorpusInvalid, validate_corpus
from .pipeline import IngestReport, TrainingPlan, ingest
from .policy import ImageGrant, Rejected, approve
from .revocations import RevocationInvalid, RevocationSet, parse_revocations

__all__ = [
    "CorpusAudit",
    "CorpusInvalid",
    "ImageGrant",
    "IngestReport",
    "Rejected",
    "RevocationInvalid",
    "RevocationSet",
    "TrainingPlan",
    "approve",
    "ingest",
    "parse_revocations",
    "validate_corpus",
]
