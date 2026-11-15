"""Organizations and onboarding router."""
import json
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import (
    User, Organization, OrganizationMember, OnboardingProgress,
    Merchant, AuditEvent,
)
from ..auth import get_current_user

router = APIRouter(tags=["organizations"])

ONBOARDING_STEPS = [
    "ACCOUNT_CREATED",
    "EMAIL_VERIFIED",
    "ORGANIZATION_CREATED",
    "BUSINESS_PROFILE_COMPLETE",
    "BUSINESS_VERIFICATION",
    "BANK_VERIFICATION",
    "FINANCIAL_DATA_CONNECTION",
    "BUSINESS_DATA_SETUP",
    "MERCHANT_ACTIVE",
]


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class OrgCreate(BaseModel):
    legal_name: str
    trading_name: Optional[str] = None
    business_type: Optional[str] = None
    category: str = "general"
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    country: str = "India"
    business_email: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    cin: Optional[str] = None
    website: Optional[str] = None
    language: str = "en"
    currency: str = "INR"


class OrgUpdate(BaseModel):
    trading_name: Optional[str] = None
    business_type: Optional[str] = None
    category: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    business_email: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    cin: Optional[str] = None
    website: Optional[str] = None
    language: Optional[str] = None


class MemberInvite(BaseModel):
    email: str
    role: str = "STAFF"


VALID_ROLES = {"OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READ_ONLY"}


class OnboardingProgressUpdate(BaseModel):
    current_step: str
    completed_steps: Optional[List[str]] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_user_org(user: User, db: Session) -> Optional[Organization]:
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == user.id,
        OrganizationMember.status == "active",
    ).first()
    if not membership:
        return None
    return db.query(Organization).filter(Organization.id == membership.organization_id).first()


def _require_org(user: User, db: Session) -> Organization:
    org = _get_user_org(user, db)
    if not org:
        raise HTTPException(status_code=404, detail="No organisation found. Please complete business registration.")
    return org


def _audit(db: Session, user_id: int, org_id: Optional[int], action: str, resource_type: str = None, resource_id: str = None):
    db.add(AuditEvent(actor_id=user_id, organization_id=org_id, action=action,
                      resource_type=resource_type, resource_id=str(resource_id) if resource_id else None))
    db.commit()


# ---------------------------------------------------------------------------
# Organisation endpoints
# ---------------------------------------------------------------------------

@router.post("/organizations", status_code=201)
def create_organization(body: OrgCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not body.legal_name.strip():
        raise HTTPException(status_code=400, detail="Legal business name is required.")

    existing = _get_user_org(current_user, db)
    if existing:
        org = existing
        org.legal_name = body.legal_name.strip()
        org.trading_name = (body.trading_name or body.legal_name).strip()
        org.name = org.trading_name
        org.business_type = body.business_type
        org.category = body.category
        org.address = body.address
        org.city = body.city
        org.state = body.state
        org.pin_code = body.pin_code
        org.country = body.country
        org.business_email = body.business_email
        org.gstin = body.gstin
        org.pan = body.pan
        org.cin = body.cin
        org.website = body.website
        org.language = body.language
        org.currency = body.currency
        org.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(org)
    else:
        org = Organization(
            legal_name=body.legal_name.strip(),
            trading_name=(body.trading_name or body.legal_name).strip(),
            name=(body.trading_name or body.legal_name).strip(),
            business_type=body.business_type,
            category=body.category,
            address=body.address,
            city=body.city,
            state=body.state,
            pin_code=body.pin_code,
            country=body.country,
            business_email=body.business_email,
            gstin=body.gstin,
            pan=body.pan,
            cin=body.cin,
            website=body.website,
            language=body.language,
            currency=body.currency,
            status="onboarding",
        )
        db.add(org)
        db.commit()
        db.refresh(org)

        db.add(OrganizationMember(organization_id=org.id, user_id=current_user.id, role="owner"))
        db.commit()

    # Create or update onboarding progress record
    progress = db.query(OnboardingProgress).filter(OnboardingProgress.organization_id == org.id).first()
    if not progress:
        progress = OnboardingProgress(
            organization_id=org.id,
            current_step="ORGANIZATION_CREATED",
            completed_steps=json.dumps(["ACCOUNT_CREATED", "EMAIL_VERIFIED", "ORGANIZATION_CREATED"]),
        )
        db.add(progress)

    # Update user language preference
    current_user.language = body.language
    current_user.category = body.category

    # Create legacy Merchant record for existing business modules
    merchant = db.query(Merchant).filter(Merchant.email == current_user.email).first()
    if not merchant:
        merchant = Merchant(
            name=org.trading_name or org.legal_name,
            email=current_user.email,
            category=body.category,
            language=body.language,
            plan="free",
            email_verified="1",
            user_id=current_user.id,
            organization_id=org.id,
        )
        db.add(merchant)
    else:
        merchant.user_id = current_user.id
        merchant.organization_id = org.id
        merchant.name = org.trading_name or org.legal_name
        merchant.category = body.category
        merchant.language = body.language

    db.commit()
    db.refresh(org)

    _audit(db, current_user.id, org.id, "organization.created", "organization", org.id)

    return {"id": org.id, "legal_name": org.legal_name, "trading_name": org.trading_name,
            "status": org.status, "onboarding_step": "ORGANIZATION_CREATED"}


@router.get("/organizations/current")
def get_current_org(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = _require_org(current_user, db)
    progress = db.query(OnboardingProgress).filter(OnboardingProgress.organization_id == org.id).first()
    return {
        "id": org.id,
        "legal_name": org.legal_name,
        "trading_name": org.trading_name,
        "business_type": org.business_type,
        "category": org.category,
        "address": org.address,
        "city": org.city,
        "state": org.state,
        "pin_code": org.pin_code,
        "country": org.country,
        "business_email": org.business_email,
        "gstin": org.gstin,
        "cin": org.cin,
        "website": org.website,
        "language": org.language,
        "currency": org.currency,
        "status": org.status,
        "onboarding_step": progress.current_step if progress else "ORGANIZATION_CREATED",
        "completed_steps": json.loads(progress.completed_steps) if progress else [],
    }


@router.patch("/organizations/current")
def update_current_org(body: OrgUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = _require_org(current_user, db)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(org, field, value)
    org.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(org)
    _audit(db, current_user.id, org.id, "organization.updated", "organization", org.id)
    return {"id": org.id, "legal_name": org.legal_name, "status": org.status}


@router.get("/organizations/members")
def get_members(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = _require_org(current_user, db)
    results = (
        db.query(OrganizationMember, User)
        .outerjoin(User, OrganizationMember.user_id == User.id)
        .filter(OrganizationMember.organization_id == org.id)
        .all()
    )
    return [
        {
            "id": m.id,
            "user_id": m.user_id,
            "role": m.role,
            "status": m.status,
            "email": u.email if u else "unknown",
            "name": u.name if u else None,
            "is_current_user": m.user_id == current_user.id,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m, u in results
    ]


@router.post("/organizations/members", status_code=201)
def invite_member(body: MemberInvite, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = _require_org(current_user, db)
    caller_membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org.id,
        OrganizationMember.user_id == current_user.id,
    ).first()
    if not caller_membership or caller_membership.role not in {"OWNER", "ADMIN"}:
        raise HTTPException(status_code=403, detail="Only organization OWNER or ADMIN can invite members")

    role = body.role.upper()
    if role not in VALID_ROLES:
        raise HTTPException(status_code=422, detail=f"Invalid role. Allowed roles: {', '.join(sorted(VALID_ROLES))}")

    target_user = db.query(User).filter(User.email == body.email.strip().lower()).first()
    if not target_user:
        target_user = User(
            email=body.email.strip().lower(),
            name=body.email.split("@")[0].capitalize(),
            is_active=True,
            email_verified=False,
            role=role,
        )
        db.add(target_user)
        db.commit()
        db.refresh(target_user)

    existing = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org.id,
        OrganizationMember.user_id == target_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member of this organization")

    new_member = OrganizationMember(
        organization_id=org.id,
        user_id=target_user.id,
        role=role,
        status="ACTIVE",
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    _audit(db, current_user.id, org.id, "member.invited", "user", target_user.id, {"role": role, "email": target_user.email})

    return {
        "id": new_member.id,
        "user_id": target_user.id,
        "email": target_user.email,
        "name": target_user.name,
        "role": new_member.role,
        "status": new_member.status,
    }


@router.delete("/organizations/members/{user_id}")
def remove_member(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = _require_org(current_user, db)
    caller_membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org.id,
        OrganizationMember.user_id == current_user.id,
    ).first()
    if not caller_membership or caller_membership.role not in {"OWNER", "ADMIN"}:
        raise HTTPException(status_code=403, detail="Only organization OWNER or ADMIN can remove members")

    target_membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org.id,
        OrganizationMember.user_id == user_id,
    ).first()
    if not target_membership:
        raise HTTPException(status_code=404, detail="Member not found in organization")

    if target_membership.role == "OWNER":
        owner_count = db.query(OrganizationMember).filter(
            OrganizationMember.organization_id == org.id,
            OrganizationMember.role == "OWNER",
        ).count()
        if owner_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot remove the sole organization OWNER")

    db.delete(target_membership)
    db.commit()
    _audit(db, current_user.id, org.id, "member.removed", "user", user_id)
    return {"message": "Member removed successfully"}


# ---------------------------------------------------------------------------
# Onboarding
# ---------------------------------------------------------------------------

@router.get("/onboarding/status")
def get_onboarding_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = _get_user_org(current_user, db)
    if not org:
        return {"current_step": "ACCOUNT_CREATED", "completed_steps": [], "organization_id": None}
    progress = db.query(OnboardingProgress).filter(OnboardingProgress.organization_id == org.id).first()
    if not progress:
        return {"current_step": "ORGANIZATION_CREATED", "completed_steps": [], "organization_id": org.id}
    return {
        "current_step": progress.current_step,
        "completed_steps": json.loads(progress.completed_steps),
        "organization_id": org.id,
        "org_status": org.status,
    }


@router.patch("/onboarding/progress")
def update_onboarding_progress(
    body: OnboardingProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = _require_org(current_user, db)
    progress = db.query(OnboardingProgress).filter(OnboardingProgress.organization_id == org.id).first()
    if not progress:
        progress = OnboardingProgress(organization_id=org.id, current_step=body.current_step, completed_steps="[]")
        db.add(progress)

    if body.current_step not in ONBOARDING_STEPS:
        raise HTTPException(status_code=400, detail=f"Invalid onboarding step: {body.current_step}")

    progress.current_step = body.current_step
    if body.completed_steps is not None:
        progress.completed_steps = json.dumps(body.completed_steps)
    elif body.current_step not in json.loads(progress.completed_steps):
        steps = json.loads(progress.completed_steps)
        steps.append(body.current_step)
        progress.completed_steps = json.dumps(steps)

    db.commit()
    return {"current_step": progress.current_step, "completed_steps": json.loads(progress.completed_steps)}


@router.post("/onboarding/complete")
def complete_onboarding(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = _require_org(current_user, db)
    org.status = "active"
    progress = db.query(OnboardingProgress).filter(OnboardingProgress.organization_id == org.id).first()
    if progress:
        progress.current_step = "MERCHANT_ACTIVE"
        steps = json.loads(progress.completed_steps)
        if "MERCHANT_ACTIVE" not in steps:
            steps.append("MERCHANT_ACTIVE")
        progress.completed_steps = json.dumps(steps)
    db.commit()
    _audit(db, current_user.id, org.id, "onboarding.completed", "organization", org.id)
    return {"status": "active", "message": "Onboarding complete. Welcome to VentureAI!"}
