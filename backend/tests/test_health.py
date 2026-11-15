import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Paytm VentureAI" in data["service"]


def test_login_password_auth_removed():
    """Password authentication is intentionally removed — expect 401."""
    response = client.post("/api/auth/login", json={"email": "demo@venture.ai", "password": "demo123"})
    assert response.status_code == 401


def test_login_invalid():
    response = client.post("/api/auth/login", json={"email": "wrong@venture.ai", "password": "wrong"})
    assert response.status_code == 401


def test_magic_link_request_returns_200():
    """Magic link request always returns 200 (anti-enumeration)."""
    response = client.post("/api/auth/magic-link/request", json={"email": "test@example.com"})
    assert response.status_code == 200
    assert "message" in response.json()
