"""Integrations router — Paytm and future providers."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from ..db import get_db
from ..models import User, Integration
from ..auth import get_current_user
from ..adapters.paytm import get_paytm_adapter
from ..routers.organizations import _require_org, _audit

router = APIRouter(prefix="/integrations", tags=["integrations"])


class PaytmConnectRequest(BaseModel):
    merchant_id: str
    auth_token: str


@router.post("/paytm/connect", status_code=201)
def connect_paytm(
    body: PaytmConnectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = _require_org(current_user, db)
    adapter = get_paytm_adapter()
    result = adapter.connect(body.merchant_id, body.auth_token)

    existing = db.query(Integration).filter(
        Integration.organization_id == org.id,
        Integration.provider == "paytm",
    ).first()

    if existing:
        existing.connection_status = result.status
        existing.external_reference = result.external_reference
        db.commit()
        integration = existing
    else:
        integration = Integration(
            organization_id=org.id,
            provider="paytm",
            external_reference=result.external_reference,
            connection_status=result.status,
        )
        db.add(integration)
        db.commit()
        db.refresh(integration)

    _audit(db, current_user.id, org.id, "integration.paytm.connect_attempt", "integration", integration.id)

    return {
        "provider": "paytm",
        "status": result.status,
        "message": result.message,
    }


@router.get("")
def list_integrations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = _require_org(current_user, db)
    integrations = db.query(Integration).filter(Integration.organization_id == org.id).all()
    return [
        {"provider": i.provider, "status": i.connection_status, "created_at": i.created_at}
        for i in integrations
    ]


@router.delete("/{provider}", status_code=200)
def disconnect_integration(
    provider: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = _require_org(current_user, db)
    integration = db.query(Integration).filter(
        Integration.organization_id == org.id,
        Integration.provider == provider,
    ).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found.")

    integration.connection_status = "disconnected"
    integration.external_reference = None
    db.commit()
    _audit(db, current_user.id, org.id, f"integration.{provider}.disconnected", "integration", integration.id)
    return {"provider": provider, "status": "disconnected"}
