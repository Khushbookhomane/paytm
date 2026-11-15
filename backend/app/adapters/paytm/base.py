"""Base Paytm Adapter interface."""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any


class PaytmConnectionResult:
    def __init__(self, status: str, external_reference: Optional[str] = None, message: str = ""):
        self.status = status  # connected | pending | unavailable | disconnected
        self.external_reference = external_reference
        self.message = message


class BasePaytmAdapter(ABC):
    @abstractmethod
    def connect(self, merchant_id: str, auth_token: str) -> PaytmConnectionResult:
        pass

    @abstractmethod
    def get_status(self, merchant_id: str) -> str:
        pass

    @abstractmethod
    def disconnect(self, merchant_id: str) -> bool:
        pass
