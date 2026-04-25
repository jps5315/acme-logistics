# Feature: dynamic-dashboard-react, Property 2
"""
Property 2: Protected endpoints reject invalid API keys

For any string that is NOT the valid API key, both POST /calls/result and
GET /metrics SHALL return HTTP 403. Absent keys (no header) SHALL also
return HTTP 403.

Validates: Requirements 1.4, 2.4
"""

import pytest
from unittest.mock import patch

from fastapi.testclient import TestClient
from hypothesis import given, settings, HealthCheck
from hypothesis import strategies as st

import main


# ── Strategies ────────────────────────────────────────────────────────────────

VALID_API_KEY = "acme-secret-key-2024"


def invalid_api_key_strategy():
    """Generate ASCII-printable strings that are NOT equal to the valid API key."""
    return st.text(
        alphabet=st.characters(min_codepoint=32, max_codepoint=126),
    ).filter(lambda k: k != VALID_API_KEY)


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture()
def client(tmp_path):
    """TestClient with DATA_DIR patched to a temporary directory."""
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    with patch.object(main, "DATA_DIR", data_dir):
        yield TestClient(main.app)


# ── Property Tests ────────────────────────────────────────────────────────────

@given(invalid_key=invalid_api_key_strategy())
@settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_invalid_api_key_rejected(tmp_path, invalid_key):
    """
    **Validates: Requirements 1.4, 2.4**

    Property 2: For any string that is not the valid API key, both
    POST /calls/result and GET /metrics SHALL return HTTP 403.
    """
    data_dir = tmp_path / "data"
    data_dir.mkdir(exist_ok=True)

    with patch.object(main, "DATA_DIR", data_dir):
        client = TestClient(main.app)
        headers = {"X-API-Key": invalid_key}

        post_resp = client.post("/calls/result", json={}, headers=headers)
        assert post_resp.status_code == 403, (
            f"POST /calls/result with invalid key {invalid_key!r} "
            f"expected 403, got {post_resp.status_code}"
        )

        get_resp = client.get("/metrics", headers=headers)
        assert get_resp.status_code == 403, (
            f"GET /metrics with invalid key {invalid_key!r} "
            f"expected 403, got {get_resp.status_code}"
        )


def test_absent_api_key_rejected(tmp_path):
    """
    **Validates: Requirements 1.4, 2.4**

    Property 2 (absent key): When no X-API-Key header is sent,
    both POST /calls/result and GET /metrics SHALL return HTTP 403.
    """
    data_dir = tmp_path / "data"
    data_dir.mkdir(exist_ok=True)

    with patch.object(main, "DATA_DIR", data_dir):
        client = TestClient(main.app)

        post_resp = client.post("/calls/result", json={})
        assert post_resp.status_code == 403, (
            f"POST /calls/result with no key expected 403, got {post_resp.status_code}"
        )

        get_resp = client.get("/metrics")
        assert get_resp.status_code == 403, (
            f"GET /metrics with no key expected 403, got {get_resp.status_code}"
        )
