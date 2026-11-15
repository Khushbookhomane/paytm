"""Account Aggregator Adapter Architecture.

IMPORTANT REGULATORY NOTICE:
Under RBI Master Directions on NBFC-Account Aggregator, VentureAI cannot act
independently as a Financial Information User (FIU) without RBI registration or an
authorized partnership agreement with a regulated FIU entity.
Live AA transactions are guarded and restricted until regulatory approval is confirmed.
"""
from abc import ABC, abstractmethod
from datetime import datetime, date
from typing import Optional, List, Dict, Any


class AAConsentStatus:
    NOT_CONNECTED = "NOT_CONNECTED"
    CONSENT_PENDING = "CONSENT_PENDING"
    CONSENT_APPROVED = "CONSENT_APPROVED"
    DATA_FETCH_PENDING = "DATA_FETCH_PENDING"
    CONNECTED = "CONNECTED"
    CONSENT_REVOKED = "CONSENT_REVOKED"
    EXPIRED = "EXPIRED"
    FAILED = "FAILED"


class AAConsentRequest:
    def __init__(
        self,
        organization_id: int,
        purpose: str,
        data_types: List[str],
        data_range_from: date,
        data_range_to: date,
        consent_duration_days: int = 365,
        customer_handle: Optional[str] = None,
    ):
        self.organization_id = organization_id
        self.purpose = purpose
        self.data_types = data_types
        self.data_range_from = data_range_from
        self.data_range_to = data_range_to
        self.consent_duration_days = consent_duration_days
        self.customer_handle = customer_handle


class AAConsentResult:
    def __init__(
        self,
        status: str,
        consent_id: Optional[str] = None,
        provider: str = "generic",
        provider_reference: Optional[str] = None,
        redirect_url: Optional[str] = None,
        expires_at: Optional[datetime] = None,
        error_message: Optional[str] = None,
    ):
        self.status = status
        self.consent_id = consent_id
        self.provider = provider
        self.provider_reference = provider_reference
        self.redirect_url = redirect_url
        self.expires_at = expires_at
        self.error_message = error_message


class BaseAAAdapter(ABC):
    @abstractmethod
    def create_consent(self, request: AAConsentRequest) -> AAConsentResult:
        """Initiate an eligible AA consent request."""
        pass

    @abstractmethod
    def get_consent_status(self, consent_id: str) -> AAConsentResult:
        """Query provider for the latest consent status."""
        pass

    @abstractmethod
    def fetch_financial_data(self, consent_id: str) -> List[Dict[str, Any]]:
        """Fetch bank transactions only after consent is approved."""
        pass

    @abstractmethod
    def revoke_consent(self, consent_id: str) -> bool:
        """Revoke active consent."""
        pass
