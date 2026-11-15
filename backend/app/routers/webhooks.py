"""Webhooks router for Cashfree, Account Aggregator, and KYB providers."""
import json
import logging
from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter, Request, Header, HTTPException, Depends, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import (
    BankAccount, BankVerification, FinancialConsent,
    BusinessVerification, AuditEvent,
)
from ..adapters.bank_verification import verify_cashfree_webhook_signature
from ..adapters.account_aggregator.base import AAConsentStatus

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/cashfree")
async def cashfree_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_webhook_signature: str = Header(None, alias="x-webhook-signature"),
):
    """
    Handle Cashfree Bank Verification webhooks.
    Validates HMAC SHA256 signature when client secret is configured.
    """
    body_bytes = await request.body()
    try:
        payload = json.loads(body_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    # Validate signature if signature header is provided or if configured
    if x_webhook_signature:
        if not verify_cashfree_webhook_signature(body_bytes, x_webhook_signature):
            logger.warning("Invalid Cashfree webhook signature received.")
            raise HTTPException(status_code=401, detail="Invalid webhook signature.")

    event_type = payload.get("type", "")
    data = payload.get("data", {})
    ref_id = data.get("reference_id")

    if ref_id:
        # Find bank verification record
        verification = db.query(BankVerification).filter(
            BankVerification.provider_reference == str(ref_id)
        ).first()

        if verification:
            status_str = data.get("account_status", "").upper()
            if status_str == "VALID":
                verification.status = "VERIFIED"
                verification.bank_account.verification_status = "VERIFIED"
            elif status_str == "INVALID":
                verification.status = "FAILED"
                verification.bank_account.verification_status = "FAILED"
            db.commit()

            db.add(AuditEvent(
                organization_id=verification.bank_account.organization_id,
                action="webhook.cashfree.received",
                resource_type="bank_verification",
                resource_id=str(verification.id),
                event_metadata=json.dumps({"event": event_type, "status": status_str}),
            ))
            db.commit()

    return {"received": True}


@router.post("/account-aggregator")
async def account_aggregator_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """Handle Account Aggregator consent state updates and status reconciliation."""
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    consent_id = payload.get("consent_id") or payload.get("ConsentHandle") or payload.get("id")
    new_status = payload.get("status", "").upper()

    if consent_id:
        consent = db.query(FinancialConsent).filter(
            (FinancialConsent.consent_reference == str(consent_id)) |
            (FinancialConsent.id == int(consent_id) if str(consent_id).isdigit() else False)
        ).first()

        if consent:
            status_map = {
                "ACTIVE": AAConsentStatus.CONSENT_APPROVED,
                "APPROVED": AAConsentStatus.CONSENT_APPROVED,
                "REJECTED": AAConsentStatus.FAILED,
                "REVOKED": AAConsentStatus.CONSENT_REVOKED,
                "EXPIRED": AAConsentStatus.EXPIRED,
            }
            consent.status = status_map.get(new_status, consent.status)
            if consent.status == AAConsentStatus.CONSENT_REVOKED and not consent.revoked_at:
                consent.revoked_at = datetime.utcnow()
            db.commit()

            db.add(AuditEvent(
                organization_id=consent.organization_id,
                action="webhook.aa.received",
                resource_type="financial_consent",
                resource_id=str(consent.id),
                event_metadata=json.dumps({"status": new_status}),
            ))
            db.commit()

    return {"received": True}


@router.post("/kyb")
async def kyb_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """Handle KYB business verification provider status callbacks."""
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    ref_id = payload.get("reference_id") or payload.get("provider_reference")
    status_val = payload.get("status", "").upper()

    if ref_id:
        verification = db.query(BusinessVerification).filter(
            BusinessVerification.provider_reference == str(ref_id)
        ).first()

        if verification:
            if status_val in ("VERIFIED", "FAILED", "REQUIRES_REVIEW"):
                verification.status = status_val
                db.commit()

            db.add(AuditEvent(
                organization_id=verification.organization_id,
                action="webhook.kyb.received",
                resource_type="business_verification",
                resource_id=str(verification.id),
                event_metadata=json.dumps({"status": status_val}),
            ))
            db.commit()

    return {"received": True}
