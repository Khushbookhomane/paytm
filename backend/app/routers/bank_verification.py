"""Bank account verification and Account Aggregator financial data router."""
import json
import re
from datetime import datetime, date, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import (
    User, BankAccount, BankVerification, FinancialConsent,
    BankTransaction, AuditEvent,
)
from ..auth import get_current_user
from ..adapters.bank_verification import get_bank_verification_adapter
from ..adapters.account_aggregator import (
    get_account_aggregator_adapter, AAConsentRequest, AAConsentStatus,
)
from ..routers.organizations import _require_org, _audit

router = APIRouter(prefix="/bank", tags=["bank-verification"])

_IFSC_RE = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")


class BankVerifyRequest(BaseModel):
    account_holder_name: str
    account_number: str
    confirm_account_number: str
    ifsc: str
    account_type: Optional[str] = "current"  # savings | current
    bank_name: Optional[str] = None


class BankConnectionCreate(BaseModel):
    provider: Optional[str] = "setu"
    purpose: Optional[str] = "Financial health analysis and credit assessment for Paytm VentureAI"
    data_range_days: Optional[int] = 365
    customer_handle: Optional[str] = None


class BankManualReviewRequest(BaseModel):
    status: str  # VERIFIED | FAILED
    notes: Optional[str] = None


def _mask_account(number: str) -> str:
    if len(number) <= 4:
        return "X" * len(number)
    return "X" * (len(number) - 4) + number[-4:]


def _encrypt_account(number: str) -> str:
    """Encrypt account number at rest. Uses Fernet if key configured."""
    key = __import__("app.config", fromlist=["settings"]).settings.ENCRYPTION_KEY
    if key:
        try:
            from cryptography.fernet import Fernet
            f = Fernet(key.encode() if isinstance(key, str) else key)
            return f.encrypt(number.encode()).decode()
        except Exception:
            pass
    # Fallback placeholder to ensure raw numbers are never stored in plain text
    return f"ENC_{_mask_account(number)}"


# ---------------------------------------------------------------------------
# Bank Account Verification
# ---------------------------------------------------------------------------

@router.post("/verify", status_code=201)
def verify_bank_account(
    body: BankVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = _require_org(current_user, db)

    # Input validation
    if body.account_number != body.confirm_account_number:
        raise HTTPException(status_code=400, detail="Account numbers do not match.")
    if not body.account_number or len(body.account_number) < 9:
        raise HTTPException(status_code=400, detail="Invalid account number.")
    ifsc = body.ifsc.upper().strip()
    if not _IFSC_RE.match(ifsc):
        raise HTTPException(status_code=400, detail="Invalid IFSC code format.")
    if not body.account_holder_name.strip():
        raise HTTPException(status_code=400, detail="Account holder name is required.")

    # Check for duplicate verified account
    existing = db.query(BankAccount).filter(
        BankAccount.organization_id == org.id,
        BankAccount.masked_account_number == _mask_account(body.account_number),
        BankAccount.ifsc == ifsc,
    ).first()
    if existing and existing.verification_status == "VERIFIED":
        raise HTTPException(status_code=409, detail="This bank account is already verified.")

    adapter = get_bank_verification_adapter()
    result = adapter.verify(
        body.account_number,
        ifsc,
        body.account_holder_name.strip(),
        declared_business_name=org.legal_name or org.trading_name,
    )

    bank_account = BankAccount(
        organization_id=org.id,
        bank_name=body.bank_name,
        encrypted_account_number=_encrypt_account(body.account_number),
        masked_account_number=_mask_account(body.account_number),
        ifsc=ifsc,
        account_holder_name=body.account_holder_name.strip(),
        account_type=body.account_type,
        verification_status=result.status,
    )
    db.add(bank_account)
    db.commit()
    db.refresh(bank_account)

    verification = BankVerification(
        bank_account_id=bank_account.id,
        provider="cashfree" if __import__("app.config", fromlist=["settings"]).settings.cashfree_configured else "stub",
        provider_reference=result.provider_reference,
        name_match_status=result.name_match_status,
        status=result.status,
        result=json.dumps(result.result),
    )
    db.add(verification)
    db.commit()
    db.refresh(verification)

    _audit(db, current_user.id, org.id, "bank.verify.initiated", "bank_account", bank_account.id)

    return {
        "id": bank_account.id,
        "masked_account_number": bank_account.masked_account_number,
        "ifsc": bank_account.ifsc,
        "verification_status": bank_account.verification_status,
        "name_match_status": result.name_match_status,
        "name_match_score": result.name_match_score,
        "provider_reference": result.provider_reference,
        "failure_reason": result.failure_reason,
    }


@router.get("/verify/{verification_id}")
def get_bank_verification(
    verification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = _require_org(current_user, db)
    account = db.query(BankAccount).filter(
        BankAccount.id == verification_id,
        BankAccount.organization_id == org.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found.")

    latest_verif = db.query(BankVerification).filter(
        BankVerification.bank_account_id == account.id,
    ).order_by(BankVerification.created_at.desc()).first()

    return {
        "id": account.id,
        "masked_account_number": account.masked_account_number,
        "ifsc": account.ifsc,
        "bank_name": account.bank_name,
        "account_type": account.account_type,
        "verification_status": account.verification_status,
        "name_match_status": latest_verif.name_match_status if latest_verif else None,
        "provider": latest_verif.provider if latest_verif else None,
    }


@router.post("/verify/{verification_id}/review")
def manual_review_bank_account(
    verification_id: int,
    body: BankManualReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Allows manual exception review for accounts requiring review."""
    org = _require_org(current_user, db)
    account = db.query(BankAccount).filter(
        BankAccount.id == verification_id,
        BankAccount.organization_id == org.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found.")

    if body.status not in ("VERIFIED", "FAILED"):
        raise HTTPException(status_code=400, detail="Status must be VERIFIED or FAILED.")

    account.verification_status = body.status
    db.commit()

    _audit(db, current_user.id, org.id, f"bank.manual_review.{body.status.lower()}", "bank_account", account.id)

    return {"id": account.id, "verification_status": account.verification_status, "notes": body.notes}


@router.get("/accounts")
def list_bank_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = _require_org(current_user, db)
    accounts = db.query(BankAccount).filter(BankAccount.organization_id == org.id).all()
    return [
        {
            "id": a.id,
            "masked_account_number": a.masked_account_number,
            "ifsc": a.ifsc,
            "bank_name": a.bank_name,
            "account_type": a.account_type,
            "verification_status": a.verification_status,
        }
        for a in accounts
    ]


# ---------------------------------------------------------------------------
# Account Aggregator / Financial Data Connection
# ---------------------------------------------------------------------------

@router.post("/connections", status_code=201)
def create_bank_connection(
    body: BankConnectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Initiate an Account Aggregator consent request."""
    org = _require_org(current_user, db)

    days = body.data_range_days or 365
    date_to = date.today()
    date_from = date_to - timedelta(days=days)

    req = AAConsentRequest(
        organization_id=org.id,
        purpose=body.purpose,
        data_types=["TRANSACTIONS", "PROFILE", "SUMMARY"],
        data_range_from=date_from,
        data_range_to=date_to,
        consent_duration_days=days,
        customer_handle=body.customer_handle,
    )

    adapter = get_account_aggregator_adapter(body.provider)
    result = adapter.create_consent(req)

    consent = FinancialConsent(
        organization_id=org.id,
        provider=body.provider or "setu",
        consent_reference=result.consent_id or result.provider_reference,
        purpose=body.purpose,
        data_range=f"{days} days ({date_from} to {date_to})",
        data_range_from=date_from,
        data_range_to=date_to,
        expires_at=result.expires_at,
        status=result.status,
    )
    db.add(consent)
    db.commit()
    db.refresh(consent)

    _audit(db, current_user.id, org.id, "bank.connection.initiated", "financial_consent", consent.id)

    return {
        "id": consent.id,
        "provider": consent.provider,
        "status": consent.status,
        "consent_reference": consent.consent_reference,
        "redirect_url": result.redirect_url,
        "purpose": consent.purpose,
        "data_range": consent.data_range,
        "expires_at": consent.expires_at,
    }


@router.get("/connections")
def list_bank_connections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List financial consents / bank data connections."""
    org = _require_org(current_user, db)
    consents = db.query(FinancialConsent).filter(FinancialConsent.organization_id == org.id).all()
    return [
        {
            "id": c.id,
            "provider": c.provider,
            "consent_reference": c.consent_reference,
            "purpose": c.purpose,
            "data_range": c.data_range,
            "status": c.status,
            "expires_at": c.expires_at,
            "revoked_at": c.revoked_at,
            "created_at": c.created_at,
        }
        for c in consents
    ]


@router.get("/connections/{connection_id}")
def get_bank_connection(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = _require_org(current_user, db)
    consent = db.query(FinancialConsent).filter(
        FinancialConsent.id == connection_id,
        FinancialConsent.organization_id == org.id,
    ).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Bank connection not found.")

    return {
        "id": consent.id,
        "provider": consent.provider,
        "consent_reference": consent.consent_reference,
        "purpose": consent.purpose,
        "data_range": consent.data_range,
        "status": consent.status,
        "expires_at": consent.expires_at,
        "revoked_at": consent.revoked_at,
        "created_at": consent.created_at,
    }


@router.post("/consents/{consent_id}/revoke")
def revoke_bank_consent(
    consent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoke authorized consent."""
    org = _require_org(current_user, db)
    consent = db.query(FinancialConsent).filter(
        FinancialConsent.id == consent_id,
        FinancialConsent.organization_id == org.id,
    ).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Consent not found.")

    adapter = get_account_aggregator_adapter(consent.provider)
    if consent.consent_reference:
        adapter.revoke_consent(consent.consent_reference)

    consent.status = AAConsentStatus.CONSENT_REVOKED
    consent.revoked_at = datetime.utcnow()
    db.commit()

    _audit(db, current_user.id, org.id, "bank.consent.revoked", "financial_consent", consent.id)

    return {"id": consent.id, "status": consent.status, "message": "Consent successfully revoked."}


@router.post("/data/fetch")
def trigger_data_fetch(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetches financial data if an approved live FIU connection is active.
    Guarded by regulatory policy.
    """
    org = _require_org(current_user, db)
    active_consent = db.query(FinancialConsent).filter(
        FinancialConsent.organization_id == org.id,
        FinancialConsent.status.in_([AAConsentStatus.CONSENT_APPROVED, AAConsentStatus.CONNECTED]),
    ).first()

    if not active_consent:
        return {
            "status": "NOT_CONNECTED",
            "message": "No active approved bank consent found. Please connect your bank account first.",
            "transactions_count": 0,
        }

    # Adapter call guarded by FIU Compliance check
    adapter = get_account_aggregator_adapter(active_consent.provider)
    try:
        transactions = adapter.fetch_financial_data(active_consent.consent_reference or "")
        return {
            "status": "CONNECTED",
            "transactions_count": len(transactions),
            "message": "Transactions fetched successfully.",
        }
    except PermissionError as exc:
        return {
            "status": "PENDING_APPROVAL",
            "message": str(exc),
            "transactions_count": 0,
        }


@router.get("/transactions")
def list_bank_transactions(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve normalized bank transactions for the merchant's organization."""
    org = _require_org(current_user, db)
    txs = db.query(BankTransaction).filter(
        BankTransaction.organization_id == org.id,
    ).order_by(BankTransaction.transaction_date.desc()).limit(limit).all()

    return [
        {
            "id": t.id,
            "bank_account_id": t.bank_account_id,
            "provider_transaction_id": t.provider_transaction_id,
            "transaction_date": t.transaction_date.isoformat(),
            "amount": float(t.amount),
            "transaction_type": t.transaction_type,
            "category": t.category,
            "description": t.description,
        }
        for t in txs
    ]
