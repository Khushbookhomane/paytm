import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .config import settings
from .db import get_db
from .models import User, UserSession, Merchant

bearer_scheme = HTTPBearer(auto_error=False)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_session_token(user_id: int, db: Session) -> str:
    """Create a persistent session token stored in DB."""
    raw = secrets.token_urlsafe(48)
    token_hash = hash_token(raw)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    session = UserSession(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
    db.add(session)
    db.commit()
    return raw


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a short-lived JWT (used alongside session token for stateless checks)."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def _resolve_user_from_token(raw_token: str, db: Session) -> Optional[User]:
    """Try session DB lookup first, then JWT fallback."""
    # 1. Session token (preferred)
    token_hash = hash_token(raw_token)
    session = db.query(UserSession).filter(
        UserSession.token_hash == token_hash,
        UserSession.revoked_at.is_(None),
    ).first()
    if session:
        if session.expires_at < datetime.utcnow():
            return None
        return db.query(User).filter(User.id == session.user_id).first()

    # 2. JWT fallback (for tokens issued before session table existed)
    try:
        payload = jwt.decode(raw_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("user_id") or payload.get("merchant_id")
        if user_id:
            return db.query(User).filter(User.id == user_id).first()
    except JWTError:
        pass
    return None


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user = _resolve_user_from_token(credentials.credentials, db)
    if not user or user.status != "active":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")
    return user


def get_current_merchant(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Merchant:
    """Legacy dependency — resolves to Merchant for existing business routers."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    user = _resolve_user_from_token(credentials.credentials, db)
    if not user or user.status != "active":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")

    merchant = db.query(Merchant).filter(Merchant.user_id == user.id).first()
    if not merchant:
        # Fallback: match by email (for accounts created before user_id link)
        merchant = db.query(Merchant).filter(Merchant.email == user.email).first()
    if not merchant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Merchant profile not found. Complete onboarding first.")
    return merchant


def revoke_session(raw_token: str, db: Session) -> None:
    token_hash = hash_token(raw_token)
    session = db.query(UserSession).filter(UserSession.token_hash == token_hash).first()
    if session:
        session.revoked_at = datetime.utcnow()
        db.commit()
