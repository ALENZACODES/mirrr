"""R18B local upscale profile persistence tests. Author: John Khan."""
from __future__ import annotations

import json
from dataclasses import replace

import pytest

from plumb_api.engines.upscale.device_profile import TimingSample, build_profile
from plumb_api.engines.upscale.profile_store import (
    STORE_SCHEMA,
    decode,
    encode,
    restore,
    safe_keys,
    store,
)


def profile():
    return build_profile(
        (
            TimingSample(512, 512, 2, 350.0, 70.0, "preview"),
            TimingSample(512, 512, 2, 360.0, 72.0, "preview"),
            TimingSample(1024, 768, 2, 900.0, 110.0, "export"),
            TimingSample(1024, 768, 2, 920.0, 112.0, "export"),
        )
    )


def test_store_round_trip_restores_equivalent_profile() -> None:
    original = profile()
    stored = store(original)
    decoded = decode(encode(stored))
    restored = restore(decoded)
    assert restored == original


def test_encoding_is_deterministic() -> None:
    stored = store(profile())
    assert encode(stored) == encode(stored)
    assert json.loads(encode(stored))["schema"] == STORE_SCHEMA


def test_store_contains_only_explicit_safe_keys() -> None:
    payload = json.loads(encode(store(profile())))
    assert tuple(sorted(payload)) == tuple(sorted(safe_keys()))
    text = encode(store(profile())).lower()
    for forbidden in ("pixel", "image", "photo", "mask", "landmark", "filename", "email", "account"):
        assert forbidden not in text


def test_payload_checksum_detects_peak_memory_tampering() -> None:
    stored = store(profile())
    tampered = replace(stored, observed_peak_mb=stored.observed_peak_mb + 1.0)
    with pytest.raises(ValueError, match="checksum"):
        restore(tampered)


def test_payload_checksum_detects_rate_tampering() -> None:
    stored = store(profile())
    assert stored.export is not None
    changed = dict(stored.export)
    changed["p90_ms_per_mp"] = float(changed["p90_ms_per_mp"]) + 1.0
    tampered = replace(stored, export=changed)
    with pytest.raises(ValueError, match="checksum"):
        restore(tampered)


def test_decode_detects_tampering_before_restore() -> None:
    payload = json.loads(encode(store(profile())))
    payload["sample_count"] += 1
    with pytest.raises(ValueError, match="checksum"):
        decode(json.dumps(payload))


def test_decode_rejects_non_json() -> None:
    with pytest.raises(ValueError, match="invalid calibration JSON"):
        decode("not-json")


def test_decode_rejects_array_payload() -> None:
    with pytest.raises(ValueError, match="object"):
        decode("[]")


def test_decode_rejects_extra_fields() -> None:
    payload = json.loads(encode(store(profile())))
    payload["device_name"] = "forbidden"
    with pytest.raises(ValueError, match="unexpected"):
        decode(json.dumps(payload))


def test_decode_rejects_missing_fields() -> None:
    payload = json.loads(encode(store(profile())))
    del payload["payload_sha256"]
    with pytest.raises(ValueError, match="unexpected"):
        decode(json.dumps(payload))


def test_decode_rejects_non_object_preview_rate() -> None:
    payload = json.loads(encode(store(profile())))
    payload["preview"] = [1, 2, 3]
    with pytest.raises(ValueError, match="preview rate"):
        decode(json.dumps(payload))


def test_decode_rejects_non_object_export_rate() -> None:
    payload = json.loads(encode(store(profile())))
    payload["export"] = "fast"
    with pytest.raises(ValueError, match="export rate"):
        decode(json.dumps(payload))


def test_decode_rejects_wrong_store_schema() -> None:
    stored = store(profile())
    bad = replace(stored, schema="wrong")
    with pytest.raises(ValueError, match="store schema"):
        bad.validate()


def test_decode_rejects_wrong_profile_schema() -> None:
    stored = store(profile())
    bad = replace(stored, profile_schema="wrong")
    with pytest.raises(ValueError, match="profile schema"):
        bad.validate()


def test_decode_rejects_zero_sample_count() -> None:
    stored = store(profile())
    bad = replace(stored, sample_count=0)
    with pytest.raises(ValueError, match="sample_count"):
        bad.validate()


def test_decode_rejects_nonfinite_peak() -> None:
    stored = store(profile())
    bad = replace(stored, observed_peak_mb=float("nan"))
    with pytest.raises(ValueError, match="observed_peak_mb"):
        bad.validate()


def test_decode_rejects_bad_profile_digest() -> None:
    stored = store(profile())
    bad = replace(stored, profile_sha256="x" * 64)
    with pytest.raises(ValueError, match="SHA-256"):
        bad.validate()


def test_decode_rejects_bad_payload_digest() -> None:
    stored = store(profile())
    bad = replace(stored, payload_sha256="0")
    with pytest.raises(ValueError, match="SHA-256"):
        bad.validate()


def test_rate_mapping_requires_exact_fields() -> None:
    stored = store(profile())
    assert stored.preview is not None
    preview = dict(stored.preview)
    del preview["mad_ms_per_mp"]
    bad = replace(stored, preview=preview)
    with pytest.raises(ValueError, match="rate fields"):
        bad.validate()


def test_rate_mapping_rejects_boolean_metric() -> None:
    stored = store(profile())
    assert stored.preview is not None
    preview = dict(stored.preview)
    preview["p90_ms_per_mp"] = True
    bad = replace(stored, preview=preview)
    with pytest.raises(ValueError, match="numeric"):
        bad.validate()


def test_rate_mapping_rejects_negative_metric() -> None:
    stored = store(profile())
    assert stored.preview is not None
    preview = dict(stored.preview)
    preview["p90_ms_per_mp"] = -1.0
    bad = replace(stored, preview=preview)
    with pytest.raises(ValueError, match="finite non-negative"):
        bad.validate()


def test_rate_mapping_rejects_kept_count_above_sample_count() -> None:
    stored = store(profile())
    assert stored.export is not None
    export = dict(stored.export)
    export["kept_count"] = int(export["sample_count"]) + 1
    bad = replace(stored, export=export)
    with pytest.raises(ValueError, match="rate counts"):
        bad.validate()


def test_rate_mapping_rejects_non_integer_counts() -> None:
    stored = store(profile())
    assert stored.export is not None
    export = dict(stored.export)
    export["sample_count"] = 2.5
    bad = replace(stored, export=export)
    with pytest.raises(ValueError, match="integers"):
        bad.validate()


def test_stored_profile_rejects_missing_both_modes() -> None:
    stored = store(profile())
    bad = replace(stored, preview=None, export=None)
    with pytest.raises(ValueError, match="requires a rate"):
        bad.validate()


def test_single_mode_profile_round_trips() -> None:
    original = build_profile(
        (
            TimingSample(512, 512, 2, 500.0, 64.0, "export"),
            TimingSample(512, 512, 2, 510.0, 66.0, "export"),
        )
    )
    restored = restore(decode(encode(store(original))))
    assert restored == original
    assert restored.preview_rate is None
    assert restored.export_rate is not None


def test_checksum_is_stable_across_json_parse_cycle() -> None:
    first = store(profile())
    text = encode(first)
    second = decode(text)
    assert first.payload_sha256 == second.payload_sha256
    assert encode(first) == encode(second)
