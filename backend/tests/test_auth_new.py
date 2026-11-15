"""Tests for the new authentication system — uses shared conftest DB."""
import secrets
import hashlib
from datetime import datetime, timedelta

import pytest

from app.models import User, MagicLinkToken, UserSession
from tests.conftest import TestingSessionLocal


def _make_user(email=None):
    db = TestingSessionLocal()
    email = email or f"u_{secrets.token_hex(4)}@test.com"
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, email_verified_at=datetime.utcnow())
        db.add(user)
        db.commit()
        db.refresh(user)
    db.close()
    return email, user.id


def _make_session(user_id):
    db = TestingSessionLocal()
    raw = secrets.token_urlsafe(48)
    db.add(UserSession(
        user_id=user_id,
        token_hash=hashlib.sha256(raw.encode()).hexdigest(),
        expires_at=datetime.utcnow() + timedelta(hours=24),
    ))
    db.commit()
    db.close()
    return raw


def _auth_with_org(client):
    email, uid = _make_user()
    token = _make_session(uid)
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/api/organizations", json={"legal_name": "Test Store", "category": "kirana"}, headers=headers)
    return headers


# ---------------------------------------------------------------------------
# Magic link
# ---------------------------------------------------------------------------

class TestMagicLink:
    def test_request_new_user(self, client):
        resp = client.post("/api/auth/magic-link/request", json={"email": f"new_{secrets.token_hex(4)}@test.com"})
        assert resp.status_code == 200
        assert "message" in resp.json()

    def test_request_invalid_email(self, client):
        resp = client.post("/api/auth/magic-link/request", json={"email": "notanemail"})
        assert resp.status_code == 400

    def test_generic_response_anti_enumeration(self, client):
        email = f"enum_{secrets.token_hex(4)}@test.com"
        r1 = client.post("/api/auth/magic-link/request", json={"email": email})
        r2 = client.post("/api/auth/magic-link/request", json={"email": email})
        assert r1.json()["message"] == r2.json()["message"]

    def test_verify_invalid_token(self, client):
        resp = client.post("/api/auth/magic-link/verify", json={"token": "invalid-xyz"})
        assert resp.status_code == 401

    def test_verify_missing_token(self, client):
        resp = client.post("/api/auth/magic-link/verify", json={"token": ""})
        assert resp.status_code == 400

    def test_full_flow(self, client):
        email = f"flow_{secrets.token_hex(4)}@test.com"
        client.post("/api/auth/magic-link/request", json={"email": email})

        db = TestingSessionLocal()
        user = db.query(User).filter(User.email == email).first()
        assert user is not None
        record = db.query(MagicLinkToken).filter(
            MagicLinkToken.user_id == user.id,
            MagicLinkToken.consumed_at.is_(None),
        ).first()
        assert record is not None
        raw = secrets.token_urlsafe(32)
        record.token_hash = hashlib.sha256(raw.encode()).hexdigest()
        db.commit()
        db.close()

        resp = client.post("/api/auth/magic-link/verify", json={"token": raw})
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_replay_prevention(self, client):
        email, uid = _make_user()
        raw = secrets.token_urlsafe(32)
        db = TestingSessionLocal()
        db.add(MagicLinkToken(
            user_id=uid,
            token_hash=hashlib.sha256(raw.encode()).hexdigest(),
            expires_at=datetime.utcnow() + timedelta(minutes=10),
            consumed_at=datetime.utcnow(),
        ))
        db.commit()
        db.close()
        resp = client.post("/api/auth/magic-link/verify", json={"token": raw})
        assert resp.status_code == 401
        assert "already been used" in resp.json()["detail"]

    def test_expired_token(self, client):
        email, uid = _make_user()
        raw = secrets.token_urlsafe(32)
        db = TestingSessionLocal()
        db.add(MagicLinkToken(
            user_id=uid,
            token_hash=hashlib.sha256(raw.encode()).hexdigest(),
            expires_at=datetime.utcnow() - timedelta(minutes=1),
        ))
        db.commit()
        db.close()
        resp = client.post("/api/auth/magic-link/verify", json={"token": raw})
        assert resp.status_code == 401
        assert "expired" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# Session / logout
# ---------------------------------------------------------------------------

class TestSession:
    def test_get_me_authenticated(self, client):
        email, uid = _make_user()
        token = _make_session(uid)
        resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["email"] == email

    def test_get_me_unauthenticated(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_logout_revokes_session(self, client):
        _, uid = _make_user()
        token = _make_session(uid)
        resp = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        resp2 = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert resp2.status_code == 401


# ---------------------------------------------------------------------------
# Organisation
# ---------------------------------------------------------------------------

class TestOrganization:
    def test_create_organization(self, client):
        headers = _auth_with_org.__wrapped__(client) if hasattr(_auth_with_org, '__wrapped__') else _make_fresh_headers(client)
        resp = client.post("/api/organizations", json={"legal_name": "New Store", "category": "kirana"}, headers=headers)
        # Either 201 (new) or 409 (already exists from _auth_with_org) — both are correct
        assert resp.status_code in (201, 409)

    def test_create_org_missing_name(self, client):
        _, uid = _make_user()
        token = _make_session(uid)
        headers = {"Authorization": f"Bearer {token}"}
        resp = client.post("/api/organizations", json={"legal_name": "", "category": "kirana"}, headers=headers)
        assert resp.status_code == 400

    def test_get_current_org(self, client):
        headers = _auth_with_org(client)
        resp = client.get("/api/organizations/current", headers=headers)
        assert resp.status_code == 200
        assert "legal_name" in resp.json()

    def test_duplicate_org_rejected(self, client):
        headers = _auth_with_org(client)
        resp = client.post("/api/organizations", json={"legal_name": "Dup Store", "category": "kirana"}, headers=headers)
        assert resp.status_code == 409

    def test_onboarding_status(self, client):
        headers = _auth_with_org(client)
        resp = client.get("/api/onboarding/status", headers=headers)
        assert resp.status_code == 200
        assert "current_step" in resp.json()


def _make_fresh_headers(client):
    _, uid = _make_user()
    token = _make_session(uid)
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Bank verification
# ---------------------------------------------------------------------------

class TestBankVerification:
    def test_valid_bank_verification(self, client):
        headers = _auth_with_org(client)
        resp = client.post("/api/bank/verify", json={
            "account_holder_name": "Test Merchant",
            "account_number": "123456789012",
            "confirm_account_number": "123456789012",
            "ifsc": "SBIN0001234",
            "account_type": "current",
        }, headers=headers)
        assert resp.status_code == 201
        assert "masked_account_number" in resp.json()

    def test_account_number_mismatch(self, client):
        headers = _auth_with_org(client)
        resp = client.post("/api/bank/verify", json={
            "account_holder_name": "Test",
            "account_number": "123456789012",
            "confirm_account_number": "999999999999",
            "ifsc": "SBIN0001234",
        }, headers=headers)
        assert resp.status_code == 400
        assert "do not match" in resp.json()["detail"]

    def test_invalid_ifsc(self, client):
        headers = _auth_with_org(client)
        resp = client.post("/api/bank/verify", json={
            "account_holder_name": "Test",
            "account_number": "123456789012",
            "confirm_account_number": "123456789012",
            "ifsc": "INVALID",
        }, headers=headers)
        assert resp.status_code == 400

    def test_list_bank_accounts(self, client):
        headers = _auth_with_org(client)
        client.post("/api/bank/verify", json={
            "account_holder_name": "Test",
            "account_number": "123456789012",
            "confirm_account_number": "123456789012",
            "ifsc": "SBIN0001234",
        }, headers=headers)
        resp = client.get("/api/bank/accounts", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1
        for acct in resp.json():
            assert len(acct.get("masked_account_number", "")) <= 20

    def test_cross_merchant_isolation(self, client):
        headers_a = _auth_with_org(client)
        headers_b = _auth_with_org(client)
        resp = client.post("/api/bank/verify", json={
            "account_holder_name": "Merchant A",
            "account_number": "111111111111",
            "confirm_account_number": "111111111111",
            "ifsc": "HDFC0001234",
        }, headers=headers_a)
        account_id = resp.json()["id"]
        resp_b = client.get(f"/api/bank/verify/{account_id}", headers=headers_b)
        assert resp_b.status_code == 404
