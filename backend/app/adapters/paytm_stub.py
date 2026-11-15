from typing import Dict, Any
from sqlalchemy.orm import Session
from .base import BaseDataAdapter

class PaytmApiAdapter(BaseDataAdapter):
    """
    Paytm Merchant API Adapter Stub.
    
    In a production deployment, this adapter connects to the Paytm for Business
    Developer APIs (Transaction Reports API, Order List API, Settlement Details API)
    using OAuth2 merchant credentials and Paytm Partner MIDs.
    
    For local hackathon evaluation and zero-credential demos, this adapter is documented
    as a stub. Real live Paytm integrations require formal merchant onboarding and
    Paytm Developer Portal API authorization keys.
    """

    def __init__(self, mid: str = "DEMO_MID_123456", api_key: str = ""):
        self.mid = mid
        self.api_key = api_key

    def ingest_data(self, db: Session, merchant_id: int) -> Dict[str, Any]:
        raise NotImplementedError(
            "Paytm Live Production API requires authorized Paytm Merchant Partner credentials (MID and Production Key). "
            "For this demo, please use the Seeded Demo Data or upload your own store transactions CSV via the Data Settings tab."
        )
