# Feature: dynamic-dashboard-react, Property 1
"""
Property 1: Call result ingestion round-trip

For any valid CallResult payload (with any combination of optional fields
present or absent), POSTing it to /calls/result SHALL return success: true
with an assigned id, and the record SHALL subsequently appear in the
recent_calls array of GET /metrics with all provided fields preserved.

Validates: Requirements 1.1, 1.2, 1.3, 3.1, 3.2
"""

import json
import pytest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from hypothesis import given, settings, HealthCheck
from hypothesis import strategies as st

import main

# ── Strategies ────────────────────────────────────────────────────────────────

# Strategies for each optional field type
_text = st.text(min_size=1, max_size=50, alphabet=st.characters(min_codepoint=32, max_codepoint=126))
_float_val = st.floats(min_value=0.0, max_value=1_000_000.0, allow_nan=False, allow_infinity=False)
_outcome = st.sampled_from(["successful", "failed", "could do better"])
_sentiment = st.sampled_from(["happy", "unsatisfied", "interested"])
_timestamp = st.datetimes().map(lambda dt: dt.isoformat())


def call_result_strategy():
    """Generate any valid CallResult payload with any combination of optional fields."""
    return st.fixed_dictionaries(
        {},
        optional={
            "session_id": _text,
            "mc_number": _text,
            "carrier_name": _text,
            "load_id": _text,
            "agreed_price": _float_val,
            "loadboard_rate": _float_val,
            "deal_outcome": _outcome,
            "customer_sentiment": _sentiment,
            "call_summary": _text,
            "gross_profit": _float_val,
            "gross_profit_margin": st.floats(min_value=0.0, max_value=100.0, allow_nan=False, allow_infinity=False),
            "gross_loss": _float_val,
            "gross_loss_margin": st.floats(min_value=0.0, max_value=100.0, allow_nan=False, allow_infinity=False),
            "call_duration": _float_val,
            "transcript": _text,
            "notes": _text,
            "timestamp": _timestamp,
        },
    )


# ── Fixtures ──────────────────────────────────────────────────────────────────

API_KEY = "acme-secret-key-2024"
HEADERS = {"X-API-Key": API_KEY}


@pytest.fixture()
def client(tmp_path):
    """TestClient with DATA_DIR patched to a temporary directory."""
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    with patch.object(main, "DATA_DIR", data_dir):
        yield TestClient(main.app)


# ── Property Test ─────────────────────────────────────────────────────────────

@given(payload=call_result_strategy())
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_call_result_ingestion_round_trip(tmp_path, payload):
    """
    **Validates: Requirements 1.1, 1.2, 1.3, 3.1, 3.2**

    Property 1: For any valid CallResult payload, POST /calls/result returns
    success: true with an id, and the record appears in GET /metrics
    recent_calls with all provided fields preserved.
    """
    data_dir = tmp_path / "data"
    data_dir.mkdir(exist_ok=True)

    with patch.object(main, "DATA_DIR", data_dir):
        client = TestClient(main.app)

        # POST the call result
        post_resp = client.post("/calls/result", json=payload, headers=HEADERS)
        assert post_resp.status_code == 200, f"Expected 200, got {post_resp.status_code}: {post_resp.text}"

        body = post_resp.json()
        assert body.get("success") is True, f"Expected success: true, got {body}"
        record_id = body.get("id")
        assert record_id, f"Expected an id in response, got {body}"

        # GET /metrics and find the record in recent_calls
        metrics_resp = client.get("/metrics", headers=HEADERS)
        assert metrics_resp.status_code == 200, f"GET /metrics failed: {metrics_resp.text}"

        recent_calls = metrics_resp.json().get("recent_calls", [])
        matching = [c for c in recent_calls if c.get("id") == record_id]
        assert len(matching) == 1, (
            f"Expected exactly one record with id={record_id} in recent_calls, "
            f"found {len(matching)}. recent_calls ids: {[c.get('id') for c in recent_calls]}"
        )

        record = matching[0]

        # Assert all provided fields are preserved
        for field, value in payload.items():
            stored = record.get(field)
            assert stored == value, (
                f"Field '{field}': expected {value!r}, got {stored!r}"
            )
