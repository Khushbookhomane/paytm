"""Regulatory compliance guard for Account Aggregator and FIU interactions."""
import logging
from ...config import settings

logger = logging.getLogger(__name__)


class FIUComplianceGuard:
    """
    Enforces compliance with RBI Master Directions on Account Aggregators.
    
    Rule 1: VentureAI must never claim to retrieve live bank data without production credentials
            and an authorized FIU partner arrangement.
    Rule 2: When credentials are unset or FIU status is unverified, operations must either return
            sandbox/stub handles or remain strictly disabled.
    """

    @classmethod
    def is_fiu_authorized(cls) -> bool:
        """Returns True only when valid production credentials and provider agreements are in place."""
        if settings.APP_ENV != "production":
            return False
        return bool(settings.AA_CLIENT_ID and settings.AA_CLIENT_SECRET and settings.ACCOUNT_AGGREGATOR_PROVIDER)

    @classmethod
    def assert_fiu_compliance(cls) -> None:
        """Raise error if live financial data fetch is attempted without FIU authorization."""
        if not cls.is_fiu_authorized():
            raise PermissionError(
                "Regulatory FIU authorization required. Live financial data access is disabled "
                "pending formal onboarding with an RBI-regulated Account Aggregator / FIU partner."
            )
