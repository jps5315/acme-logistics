# Feature: dynamic-dashboard-react, Property 4
"""
Property 4: Gemini failure resilience

For any failure mode of the Gemini API (network error, timeout, quota
exceeded, unexpected exception), GET /metrics SHALL still return HTTP 200
with ai_insights: null and all other KPI fields correctly populated.

Validates: Requirements 4.3
"""

from unittest.mock import patch, AsyncMock

import pytest
from fastapi.testclient import TestClient
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

import main


# ── Strategies ────────────────────────────────────────────────────────────────

def gemini_failure_strategy():
    """Generate exception instances representing various Gemini API failure modes."""
    exception_classes = [
        ConnectionError,
        TimeoutError,
        ValueError,
        RuntimeError,
        Exception,
    ]
    return st.one_of(*[
        st.just(cls("simulated Gemini failure"))
        for cls in exception_classes
    ])


# ── Constants ─────────────────────────────────────────────────────────────────

API_KEY = "acme-secret-key-2024"
HEADERS = {"X-API-Key": API_KEY}

# A minimal call result to ensure total_calls > 0
SAMPLE_CALL = {
    "mc_number": "MC123456",
    "carrier_name": "Test Carrier",
    "load_id": "LOAD-001",
    "agreed_price": 1500.0,
    "loadboard_rate": 1400.0,
    "deal_outcome": "successful",
    "customer_sentiment": "happy",
    "gross_profit": 100.0,
    "gross_profit_margin": 6.7,
}


# ── Property Test ─────────────────────────────────────────────────────────────

@given(exc=gemini_failure_strategy())
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
def test_gemini_failure_resilience(tmp_path, exc):
    """
    **Validates: Requirements 4.3**

    Property 4: For any failure mode of the Gemini API, GET /metrics SHALL
    return HTTP 200 with ai_insights: null and all other KPI fields populated.
    """
    data_dir = tmp_path / "data"
    data_dir.mkdir(exist_ok=True)

    with patch.object(main, "DATA_DIR", data_dir):
        client = TestClient(main.app)

        # POST at least one call result so total_calls > 0
        post_resp = client.post("/calls/result", json=SAMPLE_CALL, headers=HEADERS)
        assert post_resp.status_code == 200, f"POST /calls/result failed: {post_resp.text}"

        # Mock generate_insights to raise the generated exception
        async def raise_exc(kpi_context):
            raise exc

        with patch.object(main.gemini_client, "generate_insights", side_effect=raise_exc):
            metrics_resp = client.get("/metrics", headers=HEADERS)

        # Assert HTTP 200
        assert metrics_resp.status_code == 200, (
            f"Expected HTTP 200 but got {metrics_resp.status_code} "
            f"when Gemini raises {type(exc).__name__}: {metrics_resp.text}"
        )

        body = metrics_resp.json()

        # Assert ai_insights is null (key absent or explicitly None both pass)
        assert body.get("ai_insights") is None, (
            f"Expected ai_insights to be null, got {body.get('ai_insights')!r} "
            f"when Gemini raises {type(exc).__name__}"
        )

        # Assert all other KPI summary fields are present and populated
        summary = body.get("summary", {})
        assert summary.get("total_calls", 0) > 0, (
            f"Expected total_calls > 0, got {summary.get('total_calls')}"
        )

        required_summary_fields = [
            "total_calls",
            "success_rate_pct",
            "avg_agreed_rate",
            "avg_loadboard_rate",
            "price_vs_loadboard_pct",
            "avg_call_duration_secs",
            "total_gross_profit",
            "avg_gross_profit_margin",
        ]
        for field in required_summary_fields:
            assert field in summary, (
                f"Expected summary field '{field}' to be present in response"
            )

        # Assert other top-level fields exist
        assert "outcomes" in body, "Expected 'outcomes' in response"
        assert "sentiments" in body, "Expected 'sentiments' in response"
        assert "calls_over_time" in body, "Expected 'calls_over_time' in response"
        assert "recent_calls" in body, "Expected 'recent_calls' in response"
