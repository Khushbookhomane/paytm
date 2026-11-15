"""Account Aggregator adapter module exports."""
from .base import BaseAAAdapter, AAConsentRequest, AAConsentResult, AAConsentStatus
from .setu import SetuAAAdapter
from .finvu import FinvuAAAdapter
from .regulatory_guard import FIUComplianceGuard
from ...config import settings


def get_account_aggregator_adapter(provider: str = None) -> BaseAAAdapter:
    chosen = (provider or settings.ACCOUNT_AGGREGATOR_PROVIDER or "setu").lower()
    if "finvu" in chosen:
        return FinvuAAAdapter()
    return SetuAAAdapter()
