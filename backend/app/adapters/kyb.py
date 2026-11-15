"""Business verification (KYB) adapter architecture with format validations and manual review."""
import re
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any

_GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
_PAN_REGEX = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$")
_CIN_REGEX = re.compile(r"^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$")


class KYBResult:
    def __init__(
        self,
        status: str,
        provider_reference: Optional[str] = None,
        masked_identifier: Optional[str] = None,
        result: Optional[dict] = None,
        failure_reason: Optional[str] = None,
    ):
        self.status = status  # VERIFIED | FAILED | PENDING | REQUIRES_REVIEW
        self.provider_reference = provider_reference
        self.masked_identifier = masked_identifier
        self.result = result or {}
        self.failure_reason = failure_reason


def mask_pan(pan: str) -> str:
    if len(pan) == 10:
        return pan[:2] + "XXXXXX" + pan[-2:]
    return "XXXXXXXXXX"


def mask_gstin(gstin: str) -> str:
    if len(gstin) == 15:
        return gstin[:2] + "XXXXXXXXXXX" + gstin[-2:]
    return "XXXXXXXXXXXXXXX"


class BaseKYBAdapter(ABC):
    @abstractmethod
    def verify_gstin(self, gstin: str, legal_name: str) -> KYBResult:
        pass

    @abstractmethod
    def verify_pan(self, pan: str, name: str) -> KYBResult:
        pass

    @abstractmethod
    def verify_cin(self, cin: str) -> KYBResult:
        pass

    @abstractmethod
    def verify_document(self, document_type: str, document_reference: str) -> KYBResult:
        pass


class StubKYBAdapter(BaseKYBAdapter):
    """Sandbox/stub adapter with realistic validation and sandbox responses."""

    def verify_gstin(self, gstin: str, legal_name: str) -> KYBResult:
        gstin_clean = gstin.upper().strip()
        if not _GSTIN_REGEX.match(gstin_clean):
            return KYBResult(status="FAILED", failure_reason="Invalid GSTIN format. Expected 15-character alphanumeric format.")
        return KYBResult(
            status="PENDING",
            provider_reference=f"stub-gstin-{gstin_clean[:6]}",
            masked_identifier=mask_gstin(gstin_clean),
            result={"status": "ACTIVE", "legal_name": legal_name, "note": "Sandbox verification pending provider integration."},
        )

    def verify_pan(self, pan: str, name: str) -> KYBResult:
        pan_clean = pan.upper().strip()
        if not _PAN_REGEX.match(pan_clean):
            return KYBResult(status="FAILED", failure_reason="Invalid PAN format. Expected 10-character alphanumeric PAN.")
        return KYBResult(
            status="PENDING",
            provider_reference=f"stub-pan-{pan_clean[:4]}",
            masked_identifier=mask_pan(pan_clean),
            result={"status": "VALID", "name": name, "note": "Sandbox verification."},
        )

    def verify_cin(self, cin: str) -> KYBResult:
        cin_clean = cin.upper().strip()
        if not _CIN_REGEX.match(cin_clean):
            return KYBResult(status="FAILED", failure_reason="Invalid CIN format. Expected 21-character Corporate Identity Number.")
        return KYBResult(
            status="PENDING",
            provider_reference=f"stub-cin-{cin_clean[:6]}",
            masked_identifier=cin_clean[:6] + "XXXXXXXXXXX",
            result={"status": "ACTIVE", "note": "Sandbox verification."},
        )

    def verify_document(self, document_type: str, document_reference: str) -> KYBResult:
        return KYBResult(
            status="REQUIRES_REVIEW",
            provider_reference=f"doc-ref-{document_reference[:8]}",
            result={"document_type": document_type, "note": "Document submitted for manual compliance review."},
        )


def get_kyb_adapter() -> BaseKYBAdapter:
    return StubKYBAdapter()
