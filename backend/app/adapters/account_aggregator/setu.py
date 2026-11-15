"""Setu Account Aggregator Adapter (Sandbox / Sandbox API)."""
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from .base import BaseAAAdapter, AAConsentRequest, AAConsentResult, AAConsentStatus
from .regulatory_guard import FIUComplianceGuard
from ...config import settings

logger = logging.getLogger(__name__)


class SetuAAAdapter(BaseAAAdapter):
    def __init__(self):
        self.client_id = settings.AA_CLIENT_ID
        self.client_secret = settings.AA_CLIENT_SECRET
        self.env = settings.AA_ENVIRONMENT.lower()
        self.base_url = "https://fiu-sandbox.setu.co" if self.env == "sandbox" else "https://fiu.setu.co"

    def create_consent(self, request: AAConsentRequest) -> AAConsentResult:
        if not self.client_id or not self.client_secret:
            # Sandbox mock flow for demonstration when credentials pending
            mock_id = f"setu-consent-{request.organization_id}-{int(datetime.utcnow().timestamp())}"
            return AAConsentResult(
                status=AAConsentStatus.CONSENT_PENDING,
                consent_id=mock_id,
                provider="setu",
                provider_reference=f"SETU_REF_{mock_id}",
                redirect_url=f"{settings.FRONTEND_URL}/onboarding/bank-consent?mock_provider=setu&consent_id={mock_id}",
                expires_at=datetime.utcnow() + timedelta(days=request.consent_duration_days),
            )

        # Live/Sandbox API call
        try:
            import httpx
            resp = httpx.post(
                f"{self.base_url}/consents",
                headers={
                    "x-client-id": self.client_id,
                    "x-client-secret": self.client_secret,
                    "Content-Type": "application/json",
                },
                json={
                    "Detail": {
                        "consentMode": "STORE",
                        "fetchType": "PERIODIC",
                        "consentTypes": ["TRANSACTIONS", "PROFILE", "SUMMARY"],
                        "fiTypes": ["DEPOSIT"],
                        "Purpose": {"code": "101", "text": request.purpose},
                        "FIDataRange": {
                            "from": request.data_range_from.isoformat() + "T00:00:00Z",
                            "to": request.data_range_to.isoformat() + "T23:59:59Z",
                        },
                        "ConsentDateTime": datetime.utcnow().isoformat() + "Z",
                    }
                },
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
            return AAConsentResult(
                status=AAConsentStatus.CONSENT_PENDING,
                consent_id=data.get("id"),
                provider="setu",
                provider_reference=data.get("consentHandle"),
                redirect_url=data.get("url"),
                expires_at=datetime.utcnow() + timedelta(days=request.consent_duration_days),
            )
        except Exception as exc:
            logger.error("Setu consent creation error: %s", exc)
            return AAConsentResult(
                status=AAConsentStatus.FAILED,
                provider="setu",
                error_message=str(exc),
            )

    def get_consent_status(self, consent_id: str) -> AAConsentResult:
        if not self.client_id:
            # In sandbox demo mode, simulate pending or approved based on handle
            return AAConsentResult(
                status=AAConsentStatus.CONSENT_APPROVED if "approved" in consent_id else AAConsentStatus.CONSENT_PENDING,
                consent_id=consent_id,
                provider="setu",
                provider_reference=consent_id,
            )
        try:
            import httpx
            resp = httpx.get(
                f"{self.base_url}/consents/{consent_id}",
                headers={"x-client-id": self.client_id, "x-client-secret": self.client_secret},
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
            status_map = {
                "PENDING": AAConsentStatus.CONSENT_PENDING,
                "ACTIVE": AAConsentStatus.CONSENT_APPROVED,
                "REJECTED": AAConsentStatus.FAILED,
                "REVOKED": AAConsentStatus.CONSENT_REVOKED,
                "EXPIRED": AAConsentStatus.EXPIRED,
            }
            return AAConsentResult(
                status=status_map.get(data.get("status", ""), AAConsentStatus.CONSENT_PENDING),
                consent_id=consent_id,
                provider="setu",
                provider_reference=data.get("handle"),
            )
        except Exception as exc:
            logger.error("Setu get_consent_status error: %s", exc)
            return AAConsentResult(status=AAConsentStatus.FAILED, consent_id=consent_id, error_message=str(exc))

    def fetch_financial_data(self, consent_id: str) -> List[Dict[str, Any]]:
        # Enforce regulatory guard before fetching live financial data
        FIUComplianceGuard.assert_fiu_compliance()
        return []

    def revoke_consent(self, consent_id: str) -> bool:
        return True
