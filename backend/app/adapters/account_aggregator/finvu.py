"""Finvu Account Aggregator Adapter (Sandbox / API)."""
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from .base import BaseAAAdapter, AAConsentRequest, AAConsentResult, AAConsentStatus
from .regulatory_guard import FIUComplianceGuard
from ...config import settings

logger = logging.getLogger(__name__)


class FinvuAAAdapter(BaseAAAdapter):
    def __init__(self):
        self.client_id = settings.AA_CLIENT_ID
        self.client_secret = settings.AA_CLIENT_SECRET
        self.env = settings.AA_ENVIRONMENT.lower()

    def create_consent(self, request: AAConsentRequest) -> AAConsentResult:
        mock_id = f"finvu-consent-{request.organization_id}-{int(datetime.utcnow().timestamp())}"
        return AAConsentResult(
            status=AAConsentStatus.CONSENT_PENDING,
            consent_id=mock_id,
            provider="finvu",
            provider_reference=f"FINVU_REF_{mock_id}",
            redirect_url=f"{settings.FRONTEND_URL}/onboarding/bank-consent?mock_provider=finvu&consent_id={mock_id}",
            expires_at=datetime.utcnow() + timedelta(days=request.consent_duration_days),
        )

    def get_consent_status(self, consent_id: str) -> AAConsentResult:
        return AAConsentResult(
            status=AAConsentStatus.CONSENT_APPROVED if "approved" in consent_id else AAConsentStatus.CONSENT_PENDING,
            consent_id=consent_id,
            provider="finvu",
        )

    def fetch_financial_data(self, consent_id: str) -> List[Dict[str, Any]]:
        FIUComplianceGuard.assert_fiu_compliance()
        return []

    def revoke_consent(self, consent_id: str) -> bool:
        return True
