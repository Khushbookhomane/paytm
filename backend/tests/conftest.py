"""Shared test fixtures for the VentureAI test suite.

Provides a seeded test database and auth token for legacy business module tests.
All tests use an isolated in-memory SQLite database — never the production DB.
"""
import hashlib
import secrets
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db import Base, get_db
from app.models import (
    User, UserSession, Merchant, Product, Customer,
    Transaction, TransactionItem, Expense,
)

TEST_DB_URL = "sqlite:///./test_ventureai.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


def _seed_test_merchant(db) -> tuple:
    """Create a test user + merchant + session. Returns (merchant, raw_token)."""
    import os
    os.environ.setdefault("DEV_SEED_PASSWORD", "test-seed-password-dev-only")
    from app.adapters.seeded import SeededDemoAdapter
    adapter = SeededDemoAdapter(random_seed=42)
    adapter.ingest_data(db)
    merchant = db.query(Merchant).first()

    # Create linked User
    user = db.query(User).filter(User.email == merchant.email).first()
    if not user:
        user = User(
            email=merchant.email,
            name=merchant.name,
            email_verified_at=datetime.utcnow(),
            language=merchant.language,
            plan=merchant.plan,
            category=merchant.category,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        merchant.user_id = user.id
        db.commit()

    # Create session token
    raw = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    session = UserSession(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(hours=24),
    )
    db.add(session)
    db.commit()
    return merchant, raw


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    _seed_test_merchant(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="session")
def client():
    return TestClient(app)


@pytest.fixture(scope="session")
def auth_token(setup_test_db) -> str:
    db = TestingSessionLocal()
    merchant = db.query(Merchant).first()
    user = db.query(User).filter(User.email == merchant.email).first()
    session = db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.revoked_at.is_(None),
    ).first()
    db.close()

    # Reconstruct raw token — we need to find it by creating a new one
    raw = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    db2 = TestingSessionLocal()
    db2.add(UserSession(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(hours=24),
    ))
    db2.commit()
    db2.close()
    return raw


@pytest.fixture(scope="session")
def auth_headers(auth_token) -> dict:
    return {"Authorization": f"Bearer {auth_token}"}
