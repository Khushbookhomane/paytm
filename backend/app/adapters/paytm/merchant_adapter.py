"""Official Paytm Merchant Adapter implementation."""
import logging
from .base import BasePaytmAdapter, PaytmConnectionResult
from .authentication import PaytmAuthenticator
from .data_sync import PaytmDataSync
from ...config import settings

logger = logging.getLogger(__name__)


class OfficialPaytmMerchantAdapter(BasePaytmAdapter):
    """
    Connects to Paytm Merchant Services if officially authorized.
    When API access is not configured, keeps integration disabled
    and reports unavailable status.
    """

    def __init__(self):
        self.auth = PaytmAuthenticator()
        self.sync = PaytmDataSync(self.auth)

    def connect(self, merchant_id: str, auth_token: str) -> PaytmConnectionResult:
        if not self.auth.is_configured:
            return PaytmConnectionResult(
                status="unavailable",
                message="Paytm API credentials not configured. Please use CSV upload or await partner approval.",
            )

        if not merchant_id or not auth_token:
            return PaytmConnectionResult(status="failed", message="Merchant ID and Auth Token are required.")

        # Real verification call via official API
        is_valid = self.auth.validate_merchant_credentials(merchant_id, auth_token)
        if is_valid:
            return PaytmConnectionResult(
                status="connected",
                external_reference=merchant_id,
                message="Paytm Merchant Account connected successfully.",
            )
        return PaytmConnectionResult(status="failed", message="Could not authenticate with Paytm Merchant Services.")

    def get_status(self, merchant_id: str) -> str:
        if not self.auth.is_configured:
            return "unavailable"
        return "connected" if merchant_id else "disconnected"

    def disconnect(self, merchant_id: str) -> bool:
        return True
