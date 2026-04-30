# Feature: dynamic-dashboard-react, Property 3
"""
Property 3: Financial KPI aggregation correctness

For any set of CallResult records with gross_profit and gross_profit_margin
values, GET /metrics SHALL return total_gross_profit equal to the exact sum
of all gross_profit values, and avg_gross_profit_margin equal to the mean of
all gross_profit_margin values rounded to one decimal place.

Validates: Requirements 2.1, 2.2
"""

import json
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

import main

# ── Strategies ────────────────────────────────────────────────────────────────

def call_with_financials_strategy():
    """Generate a CallResult-like dict with gross_profit and gross_profit_margin."""
    return st.fixed_dictionaries({
        "gross_profit": st.floats(
            min_value=-1_000_000.0,
            max_value=1_000_000.0,
            allow_nan=False,
            allow_infinity=False,
        ),
        "gross_profit_margin": st.floats(
            min_value=0.0,
            max_value=100.0,
            allow_nan=False,
            allow_infinity=False,
        ),
    })


# ── Constants ─────────────────────────────────────────────────────────────────

API_KEY = "acme-secret-key-2024"
HEADERS = {"X-API-Key": API_KEY}


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture()
def client_with_data_dir(tmp_path):
    """TestClient with DATA_DIR patched to a temporary directory."""
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    with patch.object(main, "DATA_DIR", data_dir):
        yield TestClient(main.app), data_dir


# ── Property Test ─────────────────────────────────────────────────────────────

@given(calls=st.lists(call_with_financials_strategy(), min_size=1))
@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
def test_financial_kpi_aggregation_correctness(client_with_data_dir, calls):
    """
    **Validates: Requirements 2.1, 2.2**

    Property 3: For any set of CallResult records with gross_profit and
    gross_profit_margin values, GET /metrics returns total_gross_profit equal
    to round(sum(gross_profit values), 2) and avg_gross_profit_margin equal
    to round(mean(gross_profit_margin values), 1).
    """
    client, data_dir = client_with_data_dir

    # Clear any existing call results from previous examples
    results_file = data_dir / "call_results.json"
    if results_file.exists():
        results_file.write_text("[]")

    # POST each call result
    for call in calls:
        resp = client.post("/calls/result", json=call, headers=HEADERS)
        assert resp.status_code == 200, f"POST failed: {resp.text}"

    # GET /metrics
    metrics_resp = client.get("/metrics", headers=HEADERS)
    assert metrics_resp.status_code == 200, f"GET /metrics failed: {metrics_resp.text}"

    summary = metrics_resp.json()["summary"]

    expected_total_gross_profit = round(sum(c["gross_profit"] for c in calls), 2)
    expected_total_gross_profit_margin = round(sum(c["gross_profit_margin"] for c in calls), 2)

    assert summary["total_gross_profit"] == expected_total_gross_profit, (
        f"total_gross_profit: expected {expected_total_gross_profit}, "
        f"got {summary['total_gross_profit']}"
    )
    assert summary["total_gross_profit_margin"] == expected_total_gross_profit_margin, (
        f"total_gross_profit_margin: expected {expected_total_gross_profit_margin}, "
        f"got {summary['total_gross_profit_margin']}"
    )
