"""Paytm Merchant Services Adapter Package."""
from .base import BasePaytmAdapter, PaytmConnectionResult
from .merchant_adapter import OfficialPaytmMerchantAdapter
from .authentication import PaytmAuthenticator
from .data_sync import PaytmDataSync
from .webhooks import PaytmWebhookHandler


def get_paytm_adapter() -> BasePaytmAdapter:
    return OfficialPaytmMerchantAdapter()
