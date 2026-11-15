"""Business (KYB) verification router."""
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User, BusinessVerification
from ..auth import get_current_user
from ..adapters.kyb import get_kyb_adapter
from ..routers.organizations import _require_org, _audit

router = APIRouter(prefix="/business", tags=["business-verification"])


class VerifyRequest(BaseModel):
    verification_type: str   # gstin | pan | cin | document
    gstin: Optional[str] = None
    pan: Optional[str] = None
    cin: Optional[str] = None
    document_type: Optional[str] = None
    document_reference: Optional[str] = None
    legal_name: Optional[str] = None


class BusinessManualReviewRequest(BaseModel):
    status: str  # VERIFIED | FAILED | REQUIRES_REVIEW
    notes: Optional[str] = None


@router.post("/verify", status_code=201)
def start_verification(
    body: VerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = _require_org(current_user, db)
    vtype = body.verification_type.lower()

    if vtype not in ("gstin", "pan", "cin", "document"):
        raise HTTPException(status_code=400, detail="verification_type must be gstin, pan, cin, or document.")

    adapter = get_kyb_adapter()

    if vtype == "gstin":
        if not body.gstin:
            raise HTTPException(status_code=400, detail="GSTIN is required.")
        result = adapter.verify_gstin(body.gstin.upper().strip(), body.legal_name or org.legal_name)
    elif vtype == "pan":
        if not body.pan:
            raise HTTPException(status_code=400, detail="PAN is required.")
        result = adapter.verify_pan(body.pan.upper().strip(), body.legal_name or org.legal_name)
    elif vtype == "cin":
        if not body.cin:
            raise HTTPException(status_code=400, detail="CIN is required.")
        result = adapter.verify_cin(body.cin.upper().strip())
    else:
        doc_type = body.document_type or "trade_license"
        doc_ref = body.document_reference or "uploaded-document"
        result = adapter.verify_document(doc_type, doc_ref)

    verification = BusinessVerification(
        organization_id=org.id,
        provider="stub" if "stub" in (result.provider_reference or "") else "provider",
        verification_type=vtype,
        provider_reference=result.provider_reference,
        status=result.status,
        result=json.dumps(result.result),
        failure_reason=result.failure_reason,
    )
    db.add(verification)
    db.commit()
    db.refresh(verification)

    _audit(db, current_user.id, org.id, f"business.verify.{vtype}", "business_verification", verification.id)

    return {
        "id": verification.id,
        "verification_type": vtype,
        "status": verification.status,
        "provider_reference": verification.provider_reference,
        "failure_reason": verification.failure_reason,
    }


@router.get("/verify/{verification_id}")
def get_verification(
    verification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = _require_org(current_user, db)
    v = db.query(BusinessVerification).filter(
        BusinessVerification.id == verification_id,
        BusinessVerification.organization_id == org.id,
    ).first()
    if not v:
        raise HTTPException(status_code=404, detail="Verification not found.")
    return {
        "id": v.id,
        "verification_type": v.verification_type,
        "status": v.status,
        "provider_reference": v.provider_reference,
        "failure_reason": v.failure_reason,
        "created_at": v.created_at,
    }


@router.post("/verify/{verification_id}/review")
def manual_review_verification(
    verification_id: int,
    body: BusinessManualReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin manual review endpoint for exceptional KYC/KYB approvals."""
    org = _require_org(current_user, db)
    v = db.query(BusinessVerification).filter(
        BusinessVerification.id == verification_id,
        BusinessVerification.organization_id == org.id,
    ).first()
    if not v:
        raise HTTPException(status_code=404, detail="Verification not found.")

    if body.status not in ("VERIFIED", "FAILED", "REQUIRES_REVIEW"):
        raise HTTPException(status_code=400, detail="Invalid review status.")

    v.status = body.status
    db.commit()

    _audit(db, current_user.id, org.id, f"business.manual_review.{body.status.lower()}", "business_verification", v.id)
    return {"id": v.id, "status": v.status, "notes": body.notes}
