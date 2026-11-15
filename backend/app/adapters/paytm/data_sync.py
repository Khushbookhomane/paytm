"""Paytm Merchant Data Synchronization."""
import logging
from typing import List, Dict, Any
from .authentication import PaytmAuthenticator

logger = logging.getLogger(__name__)


class PaytmDataSync:
    def __init__(self, authenticator: PaytmAuthenticator):
        self.auth = authenticator

    def sync_settlements(self, mid: str, date_from: str, date_to: str) -> List[Dict[str, Any]]:
        """Fetch settlement reports if officially authorized."""
        if not self.auth.is_configured:
            logger.info("Paytm integration is not configured. Live sync disabled.")
            return []
        return []

    def sync_order_list(self, mid: str) -> List[Dict[str, Any]]:
        if not self.auth.is_configured:
            return []
        return []
