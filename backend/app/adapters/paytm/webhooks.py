"""Paytm Webhook / IPN processor with checksum verification."""
import hmac
import hashlib
import logging
from typing import Dict, Any

from ...config import settings

logger = logging.getLogger(__name__)


class PaytmWebhookHandler:
    def __init__(self):
        self.merchant_key = settings.PAYTM_CLIENT_SECRET

    def verify_checksum(self, payload: Dict[str, Any], checksum: str) -> bool:
        """Verify Paytm transaction checksum/signature."""
        if not self.merchant_key or not checksum:
            return False
        # Calculate HMAC SHA256 over canonical string representation
        try:
            sorted_keys = sorted([k for k in payload.keys() if k != "CHECKSUMHASH"])
            canonical = "|".join(f"{k}={payload[k]}" for k in sorted_keys)
            expected = hmac.new(self.merchant_key.encode(), canonical.encode(), hashlib.sha256).hexdigest()
            return hmac.compare_digest(expected, checksum)
        except Exception as exc:
            logger.error("Paytm checksum verification failed: %s", exc)
            return False
