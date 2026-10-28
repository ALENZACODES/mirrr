"""Model loading is fail-closed; see registry.py and CONTRACTS.md section 18.

Author: John Khan.
"""
from .registry import ModelEntry, ModelRegistry, RegistryError, sha256_bytes, validate_file, verify_catalog_licences

__all__ = ("ModelRegistry", "ModelEntry", "RegistryError", "sha256_bytes",
           "verify_catalog_licences", "validate_file")
