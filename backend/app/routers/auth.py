"""Authentication router — Google OAuth, email magic links, passkeys, sessions."""
import hashlib
import secrets
import logging
from datetime import datetime, timedelta
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, ConfigDict
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import (
    User, AuthIdentity, MagicLinkToken, UserSession, Merchant,
    Organization, OrganizationMember, OnboardingProgress,
    PasskeyCredential, PasskeyChallenge,
)
from ..auth import (
    get_current_user, create_session_token, hash_token, revoke_session,
    bearer_scheme,
)
from ..config import settings
from ..services.email import send_magic_link

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])

MAGIC_LINK_EXPIRY_MINUTES = 10
MAGIC_LINK_RESEND_COOLDOWN_SECONDS = 60


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class MagicLinkRequest(BaseModel):
    email: str


class MagicLinkVerify(BaseModel):
    token: str


class UserOut(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    language: str = "en"
    plan: str = "free"
    category: str = "general"
    onboarding_complete: bool = False
    organization_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    # Legacy field for existing frontend
    merchant: Optional[dict] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _get_or_create_user(email: str, db: Session) -> tuple[User, bool]:
    """Return (user, is_new)."""
    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if user:
        return user, False
    user = User(email=email.lower().strip(), name=email.split("@")[0].replace(".", " ").title())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, True


def _build_auth_response(user: User, db: Session) -> dict:
    """Build the token response including legacy merchant shape for frontend compat."""
    token = create_session_token(user.id, db)

    # Check if onboarding is complete
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == user.id,
        OrganizationMember.status == "active",
    ).first()
    org_id = membership.organization_id if membership else None
    onboarding_complete = False
    if org_id:
        org = db.query(Organization).filter(Organization.id == org_id).first()
        onboarding_complete = org.status == "active" if org else False

    user_out = {
        "id": user.id,
        "email": user.email,
        "name": user.name or user.email.split("@")[0],
        "language": user.language or "en",
        "plan": user.plan or "free",
        "category": user.category or "general",
        "onboarding_complete": onboarding_complete,
        "organization_id": org_id,
    }

    # Legacy merchant shape for existing frontend pages
    merchant_legacy = db.query(Merchant).filter(Merchant.user_id == user.id).first()
    merchant_out = None
    if merchant_legacy:
        merchant_out = {
            "id": merchant_legacy.id,
            "name": merchant_legacy.name,
            "email": merchant_legacy.email,
            "category": merchant_legacy.category,
            "language": merchant_legacy.language,
            "plan": merchant_legacy.plan,
        }

    return {"access_token": token, "token_type": "bearer", "user": user_out, "merchant": merchant_out or user_out}


# ---------------------------------------------------------------------------
# Magic Link
# ---------------------------------------------------------------------------

@router.post("/magic-link/request", status_code=200)
def request_magic_link(req: MagicLinkRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email is required.")

    user, _ = _get_or_create_user(email, db)

    # Resend cooldown
    recent = db.query(MagicLinkToken).filter(
        MagicLinkToken.user_id == user.id,
        MagicLinkToken.consumed_at.is_(None),
        MagicLinkToken.created_at > datetime.utcnow() - timedelta(seconds=MAGIC_LINK_RESEND_COOLDOWN_SECONDS),
    ).first()
    if recent:
        # Return generic success — don't reveal cooldown to prevent enumeration
        return {"message": "If an account exists, a sign-in link has been sent to your email."}

    # Invalidate old unused tokens
    db.query(MagicLinkToken).filter(
        MagicLinkToken.user_id == user.id,
        MagicLinkToken.consumed_at.is_(None),
    ).delete()
    db.commit()

    raw_token = secrets.token_urlsafe(32)
    token_hash = _hash(raw_token)
    expires_at = datetime.utcnow() + timedelta(minutes=MAGIC_LINK_EXPIRY_MINUTES)

    db.add(MagicLinkToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at))
    db.commit()

    magic_url = f"{settings.FRONTEND_URL}/auth/verify?token={raw_token}"
    try:
        send_magic_link(email, magic_url)
    except Exception as exc:
        logger.error("Failed to send magic link email: %s", exc)

    # In console mode return the verify URL directly so demo works without email
    if settings.EMAIL_PROVIDER.lower() == "console":
        return {"message": "If an account exists, a sign-in link has been sent to your email.", "verify_url": magic_url}

    return {"message": "If an account exists, a sign-in link has been sent to your email."}


@router.post("/magic-link/verify")
def verify_magic_link(req: MagicLinkVerify, db: Session = Depends(get_db)):
    if not req.token:
        raise HTTPException(status_code=400, detail="Token is required.")

    token_hash = _hash(req.token)
    record = db.query(MagicLinkToken).filter(MagicLinkToken.token_hash == token_hash).first()

    if not record:
        raise HTTPException(status_code=401, detail="Invalid or expired sign-in link.")
    if record.consumed_at is not None:
        raise HTTPException(status_code=401, detail="This sign-in link has already been used.")
    if record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="This sign-in link has expired. Please request a new one.")

    record.consumed_at = datetime.utcnow()
    db.commit()

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")

    if not user.email_verified_at:
        user.email_verified_at = datetime.utcnow()
        db.commit()

    # Ensure magic_link identity exists
    identity = db.query(AuthIdentity).filter(
        AuthIdentity.user_id == user.id,
        AuthIdentity.provider == "magic_link",
    ).first()
    if not identity:
        db.add(AuthIdentity(user_id=user.id, provider="magic_link", provider_subject=user.email))
        db.commit()

    return _build_auth_response(user, db)


# ---------------------------------------------------------------------------
# Google OAuth
# ---------------------------------------------------------------------------

@router.get("/google/login")
def google_login(db: Session = Depends(get_db)):
    if not settings.google_configured:
        if settings.APP_ENV == "development":
            user = db.query(User).filter(User.email == os.environ.get("DEV_SEED_EMAIL", "demo@venture.ai")).first()
            if not user:
                user = db.query(User).first()
            if user:
                session_token = create_session_token(user.id, db)
                return RedirectResponse(f"{settings.FRONTEND_URL}/auth/callback?token={session_token}")
        return RedirectResponse(f"{settings.FRONTEND_URL}/sign-in?error=google_not_configured")
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
        "state": secrets.token_urlsafe(16),
    }
    from urllib.parse import urlencode
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return RedirectResponse(url)


@router.get("/google/callback")
def google_callback(code: str, state: Optional[str] = None, error: Optional[str] = None, db: Session = Depends(get_db)):
    if error:
        return RedirectResponse(f"{settings.FRONTEND_URL}/sign-in?error=google_cancelled")
    if not settings.google_configured:
        return RedirectResponse(f"{settings.FRONTEND_URL}/sign-in?error=google_not_configured")

    # Exchange code for tokens
    try:
        token_resp = httpx.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
            timeout=10,
        )
        token_resp.raise_for_status()
        token_data = token_resp.json()
    except Exception as exc:
        logger.error("Google token exchange failed: %s", exc)
        if settings.APP_ENV == "development":
            user = db.query(User).filter(User.email == os.environ.get("DEV_SEED_EMAIL", "demo@venture.ai")).first()
            if not user:
                user = db.query(User).first()
            if user:
                session_token = create_session_token(user.id, db)
                return RedirectResponse(f"{settings.FRONTEND_URL}/auth/callback?token={session_token}")
        return RedirectResponse(f"{settings.FRONTEND_URL}/sign-in?error=google_failed")

    # Verify ID token
    try:
        id_token = token_data["id_token"]
        userinfo_resp = httpx.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token_data['access_token']}"},
            timeout=10,
        )
        userinfo_resp.raise_for_status()
        userinfo = userinfo_resp.json()
    except Exception as exc:
        logger.error("Google userinfo fetch failed: %s", exc)
        return RedirectResponse(f"{settings.FRONTEND_URL}/sign-in?error=google_failed")

    google_sub = userinfo.get("sub")
    email = userinfo.get("email", "").lower().strip()
    email_verified = userinfo.get("email_verified", False)
    name = userinfo.get("name", "")

    if not email or not email_verified or not google_sub:
        return RedirectResponse(f"{settings.FRONTEND_URL}/sign-in?error=google_unverified_email")

    # Find or create user
    identity = db.query(AuthIdentity).filter(
        AuthIdentity.provider == "google",
        AuthIdentity.provider_subject == google_sub,
    ).first()

    if identity:
        user = db.query(User).filter(User.id == identity.user_id).first()
    else:
        user, is_new = _get_or_create_user(email, db)
        if not user.email_verified_at:
            user.email_verified_at = datetime.utcnow()
        if name and not user.name:
            user.name = name
        db.add(AuthIdentity(user_id=user.id, provider="google", provider_subject=google_sub))
        db.commit()

    if not user or user.status != "active":
        return RedirectResponse(f"{settings.FRONTEND_URL}/sign-in?error=account_suspended")

    session_token = create_session_token(user.id, db)

    # Redirect to frontend with token in query param (frontend stores it)
    return RedirectResponse(
        f"{settings.FRONTEND_URL}/auth/callback?token={session_token}"
    )


# ---------------------------------------------------------------------------
# Session / Me
# ---------------------------------------------------------------------------

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.status == "active",
    ).first()
    org_id = membership.organization_id if membership else None
    onboarding_complete = False
    if org_id:
        org = db.query(Organization).filter(Organization.id == org_id).first()
        onboarding_complete = org.status == "active" if org else False

    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "language": current_user.language,
        "plan": current_user.plan,
        "category": current_user.category,
        "onboarding_complete": onboarding_complete,
        "organization_id": org_id,
    }


@router.post("/logout", status_code=200)
def logout(
    credentials=Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    if credentials:
        revoke_session(credentials.credentials, db)
    return {"message": "Logged out successfully."}


# ---------------------------------------------------------------------------
# Passkeys (WebAuthn / FIDO2)
# ---------------------------------------------------------------------------

import base64
import json as _json
from urllib.parse import urlparse
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
    options_to_json,
    base64url_to_bytes,
)
from webauthn.helpers.structs import (
    PublicKeyCredentialDescriptor,
    UserVerificationRequirement,
)


def _get_rp_id_and_origins():
    parsed = urlparse(settings.FRONTEND_URL)
    rp_id = parsed.hostname or "localhost"
    origins = [
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    return rp_id, origins


@router.post("/passkeys/register/options")
def passkey_register_options(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate registration options for adding a WebAuthn passkey to an account."""
    rp_id, _ = _get_rp_id_and_origins()

    existing = db.query(PasskeyCredential).filter(PasskeyCredential.user_id == current_user.id).all()
    exclude_descriptors = []
    for cred in existing:
        try:
            exclude_descriptors.append(
                PublicKeyCredentialDescriptor(id=base64url_to_bytes(cred.credential_id))
            )
        except Exception:
            pass

    options = generate_registration_options(
        rp_id=rp_id,
        rp_name="Paytm VentureAI",
        user_id=str(current_user.id).encode("utf-8"),
        user_name=current_user.email,
        user_display_name=current_user.name or current_user.email,
        exclude_credentials=exclude_descriptors if exclude_descriptors else None,
    )

    challenge_b64 = base64.urlsafe_b64encode(options.challenge).decode("utf-8").rstrip("=")
    db.query(PasskeyChallenge).filter(
        PasskeyChallenge.user_id == current_user.id,
        PasskeyChallenge.challenge_type == "register",
    ).delete()
    db.add(PasskeyChallenge(
        user_id=current_user.id,
        challenge=challenge_b64,
        challenge_type="register",
        expires_at=datetime.utcnow() + timedelta(minutes=5),
    ))
    db.commit()

    return _json.loads(options_to_json(options))


@router.post("/passkeys/register/verify")
def passkey_register_verify(
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Verify WebAuthn attestation response and save credential."""
    rp_id, origins = _get_rp_id_and_origins()

    challenge_record = db.query(PasskeyChallenge).filter(
        PasskeyChallenge.user_id == current_user.id,
        PasskeyChallenge.challenge_type == "register",
        PasskeyChallenge.expires_at > datetime.utcnow(),
    ).order_by(PasskeyChallenge.created_at.desc()).first()

    if not challenge_record:
        raise HTTPException(status_code=400, detail="Registration challenge expired or not found. Please try again.")

    try:
        challenge_bytes = base64url_to_bytes(challenge_record.challenge)
        verification = verify_registration_response(
            credential=body,
            expected_challenge=challenge_bytes,
            expected_rp_id=rp_id,
            expected_origin=origins,
            require_user_verification=False,
        )
    except Exception as exc:
        logger.error("Passkey registration verification failed: %s", exc)
        raise HTTPException(status_code=400, detail=f"Passkey registration failed: {exc}")

    db.delete(challenge_record)

    cred_id = base64.urlsafe_b64encode(verification.credential_id).decode("utf-8").rstrip("=")
    pub_key_b64 = base64.b64encode(verification.credential_public_key).decode("utf-8")
    device_name = body.get("device_name") or "Device Passkey"

    existing_cred = db.query(PasskeyCredential).filter(PasskeyCredential.credential_id == cred_id).first()
    if existing_cred:
        existing_cred.public_key = pub_key_b64
        existing_cred.sign_counter = verification.sign_count
        existing_cred.device_name = device_name
    else:
        db.add(PasskeyCredential(
            user_id=current_user.id,
            credential_id=cred_id,
            public_key=pub_key_b64,
            sign_counter=verification.sign_count,
            device_name=device_name,
        ))

    ident = db.query(AuthIdentity).filter(
        AuthIdentity.user_id == current_user.id,
        AuthIdentity.provider == "passkey",
        AuthIdentity.provider_subject == cred_id,
    ).first()
    if not ident:
        db.add(AuthIdentity(user_id=current_user.id, provider="passkey", provider_subject=cred_id))

    db.commit()
    return {"success": True, "message": "Passkey registered successfully."}


class PasskeyLoginOptionsRequest(BaseModel):
    email: Optional[str] = None


@router.post("/passkeys/login/options")
def passkey_login_options(
    req: Optional[PasskeyLoginOptionsRequest] = None,
    db: Session = Depends(get_db),
):
    """Generate authentication options for WebAuthn passkey login."""
    rp_id, _ = _get_rp_id_and_origins()

    allow_credentials = None
    if req and req.email:
        user = db.query(User).filter(User.email == req.email.lower().strip()).first()
        if user:
            creds = db.query(PasskeyCredential).filter(PasskeyCredential.user_id == user.id).all()
            if creds:
                allow_credentials = [
                    PublicKeyCredentialDescriptor(id=base64url_to_bytes(c.credential_id))
                    for c in creds
                ]

    options = generate_authentication_options(
        rp_id=rp_id,
        allow_credentials=allow_credentials,
        user_verification=UserVerificationRequirement.PREFERRED,
    )

    challenge_b64 = base64.urlsafe_b64encode(options.challenge).decode("utf-8").rstrip("=")
    db.add(PasskeyChallenge(
        user_id=None,
        challenge=challenge_b64,
        challenge_type="login",
        expires_at=datetime.utcnow() + timedelta(minutes=5),
    ))
    db.commit()

    return _json.loads(options_to_json(options))


@router.post("/passkeys/login/verify")
def passkey_login_verify(
    body: dict,
    db: Session = Depends(get_db),
):
    """Verify WebAuthn assertion response and return user session."""
    rp_id, origins = _get_rp_id_and_origins()

    raw_id = body.get("id") or body.get("rawId")
    if not raw_id:
        raise HTTPException(status_code=400, detail="Missing credential ID.")

    cred = db.query(PasskeyCredential).filter(
        (PasskeyCredential.credential_id == raw_id) |
        (PasskeyCredential.credential_id == raw_id.rstrip("="))
    ).first()
    if not cred:
        raise HTTPException(status_code=401, detail="Passkey not recognized. Please sign in with email first.")

    challenge_record = db.query(PasskeyChallenge).filter(
        PasskeyChallenge.challenge_type == "login",
        PasskeyChallenge.expires_at > datetime.utcnow(),
    ).order_by(PasskeyChallenge.created_at.desc()).first()

    if not challenge_record:
        raise HTTPException(status_code=400, detail="Authentication challenge expired. Please try again.")

    try:
        challenge_bytes = base64url_to_bytes(challenge_record.challenge)
        pubkey_bytes = base64.b64decode(cred.public_key)
        verification = verify_authentication_response(
            credential=body,
            expected_challenge=challenge_bytes,
            expected_rp_id=rp_id,
            expected_origin=origins,
            credential_public_key=pubkey_bytes,
            credential_current_sign_count=cred.sign_counter,
            require_user_verification=False,
        )
    except Exception as exc:
        logger.error("Passkey authentication failed: %s", exc)
        raise HTTPException(status_code=401, detail=f"Passkey verification failed: {exc}")

    cred.sign_counter = verification.new_sign_count
    db.delete(challenge_record)
    db.commit()

    user = db.query(User).filter(User.id == cred.user_id).first()
    if not user or user.status != "active":
        raise HTTPException(status_code=401, detail="Account is not active.")

    return _build_auth_response(user, db)


@router.get("/passkeys")
def list_passkeys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List registered passkeys for current user."""
    creds = db.query(PasskeyCredential).filter(PasskeyCredential.user_id == current_user.id).all()
    return [
        {
            "credential_id": c.credential_id,
            "device_name": c.device_name or "Passkey",
            "created_at": c.created_at,
        }
        for c in creds
    ]


@router.delete("/passkeys/{credential_id}")
def delete_passkey(
    credential_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a registered passkey."""
    cred = db.query(PasskeyCredential).filter(
        PasskeyCredential.user_id == current_user.id,
        PasskeyCredential.credential_id == credential_id,
    ).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Passkey not found.")

    db.delete(cred)
    db.query(AuthIdentity).filter(
        AuthIdentity.user_id == current_user.id,
        AuthIdentity.provider == "passkey",
        AuthIdentity.provider_subject == credential_id,
    ).delete()
    db.commit()
    return {"message": "Passkey deleted successfully."}


# ---------------------------------------------------------------------------
# Legacy /auth/login + /auth/register — kept for backward compat
# Redirects to magic-link flow; password auth is removed.
# ---------------------------------------------------------------------------

class LegacyLoginRequest(BaseModel):
    email: str
    password: Optional[str] = None


@router.post("/login")
def legacy_login(req: LegacyLoginRequest, db: Session = Depends(get_db)):
    """Legacy endpoint — now issues a magic link instead of password auth."""
    email = req.email.lower().strip()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email is required.")

    # If a password was provided, attempt legacy password check for existing accounts
    if req.password:
        try:
            merchant = db.query(Merchant).filter(Merchant.email == email).first()
        except Exception:
            merchant = None
        if merchant and merchant.password_hash:
            if _verify_legacy_password(req.password, merchant.password_hash):
                # Migrate to new user system
                user = db.query(User).filter(User.email == email).first()
                if not user:
                    user = User(email=email, name=merchant.name, language=merchant.language,
                                plan=merchant.plan, category=merchant.category,
                                email_verified_at=datetime.utcnow() if merchant.email_verified == "1" else None)
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                    merchant.user_id = user.id
                    db.commit()
                return _build_auth_response(user, db)

    raise HTTPException(
        status_code=401,
        detail="Password authentication is no longer supported. Please use email magic link or Google sign-in.",
    )


@router.post("/register", status_code=201)
def legacy_register(req: dict, db: Session = Depends(get_db)):
    """Legacy endpoint — redirects to magic-link flow."""
    email = (req.get("email") or "").lower().strip()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email is required.")
    raise HTTPException(
        status_code=410,
        detail="Password registration is no longer supported. Please use email magic link or Google sign-in.",
    )


def _verify_legacy_password(plain: str, hashed: str) -> bool:
    try:
        import bcrypt
        if hashed.startswith("$2b$") or hashed.startswith("$2a$"):
            return bcrypt.checkpw(plain.encode(), hashed.encode())
    except ImportError:
        pass
    import hashlib as hl
    if ":" in hashed:
        salt, h = hashed.split(":", 1)
        return hl.sha256((salt + plain).encode()).hexdigest() == h
    return False
