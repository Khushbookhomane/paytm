"""Bank account verification adapter — Cashfree (sandbox) + stub fallback.
Includes documented name-matching comparing returned account holder name with declared business/proprietor name.
"""
import hmac
import hashlib
import re
import difflib
import logging
from abc import ABC, abstractmethod
from typing import Optional, Tuple

import httpx

from ..config import settings

logger = logging.getLogger(__name__)

# Common business titles / honorifics stripped during name matching
NOISE_WORDS = {
    "m/s", "ms", "mr", "mrs", "shri", "smt", "pvt", "ltd", "private", "limited",
    "enterprises", "enterprise", "store", "stores", "trading", "company", "co",
    "services", "solutions", "kirana", "general"
}


def clean_tokens(name: str) -> set:
    if not name:
        return set()
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", name.lower())
    tokens = set(cleaned.split())
    return {t for t in tokens if t and t not in NOISE_WORDS}


def calculate_name_match(declared_name: str, returned_name: str) -> Tuple[float, str]:
    """
    Documented Name-Matching Process:
    1. Clean and tokenize both names, eliminating business honorifics and suffixes.
    2. Compute Jaccard token overlap.
    3. Compute Levenshtein/SequenceMatcher ratio on canonicalized names.
    4. Return (score, match_status) where status is:
       - 'matched' for score >= 0.75
       - 'partial' for 0.45 <= score < 0.75
       - 'mismatch' for score < 0.45
    """
    if not declared_name or not returned_name:
        return 0.0, "mismatch"

    d_tokens = clean_tokens(declared_name)
    r_tokens = clean_tokens(returned_name)

    # Token overlap
    if d_tokens and r_tokens:
        intersection = d_tokens.intersection(r_tokens)
        union = d_tokens.union(r_tokens)
        jaccard = len(intersection) / len(union) if union else 0.0
    else:
        jaccard = 0.0

    # Sequence string similarity
    d_clean = " ".join(sorted(d_tokens)) if d_tokens else declared_name.lower().strip()
    r_clean = " ".join(sorted(r_tokens)) if r_tokens else returned_name.lower().strip()
    seq_ratio = difflib.SequenceMatcher(None, d_clean, r_clean).ratio()

    # Blended score
    final_score = round(max(jaccard, seq_ratio * 0.9, (jaccard + seq_ratio) / 2), 2)

    if final_score >= 0.75 or (d_tokens and d_tokens.issubset(r_tokens)):
        return final_score, "matched"
    elif final_score >= 0.45:
        return final_score, "partial"
    else:
        return final_score, "mismatch"


class BankVerificationResult:
    def __init__(
        self,
        status: str,
        provider_reference: Optional[str] = None,
        name_match_status: Optional[str] = None,
        name_match_score: Optional[float] = None,
        returned_name: Optional[str] = None,
        result: Optional[dict] = None,
        failure_reason: Optional[str] = None,
    ):
        self.status = status  # VERIFIED | FAILED | PENDING | REQUIRES_REVIEW
        self.provider_reference = provider_reference
        self.name_match_status = name_match_status  # matched | partial | mismatch
        self.name_match_score = name_match_score
        self.returned_name = returned_name
        self.result = result or {}
        self.failure_reason = failure_reason


class BaseBankVerificationAdapter(ABC):
    @abstractmethod
    def verify(
        self,
        account_number: str,
        ifsc: str,
        account_holder_name: str,
        declared_business_name: Optional[str] = None,
    ) -> BankVerificationResult:
        pass


class CashfreeBankVerificationAdapter(BaseBankVerificationAdapter):
    """Cashfree Payments bank account verification.
    Requires CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET.
    Sandbox: https://sandbox.cashfree.com
    Production: https://api.cashfree.com
    """

    BASE_URLS = {
        "sandbox": "https://sandbox.cashfree.com",
        "production": "https://api.cashfree.com",
    }

    def __init__(self):
        self.base_url = self.BASE_URLS.get(settings.CASHFREE_ENVIRONMENT, self.BASE_URLS["sandbox"])
        self.client_id = settings.CASHFREE_CLIENT_ID
        self.client_secret = settings.CASHFREE_CLIENT_SECRET

    def verify(
        self,
        account_number: str,
        ifsc: str,
        account_holder_name: str,
        declared_business_name: Optional[str] = None,
    ) -> BankVerificationResult:
        try:
            resp = httpx.post(
                f"{self.base_url}/verification/bank-account/sync",
                headers={
                    "x-client-id": self.client_id,
                    "x-client-secret": self.client_secret,
                    "Content-Type": "application/json",
                },
                json={
                    "bank_account": account_number,
                    "ifsc": ifsc,
                    "name": account_holder_name,
                },
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPStatusError as exc:
            logger.error("Cashfree bank verification HTTP error: %s", exc)
            return BankVerificationResult(status="FAILED", failure_reason=str(exc))
        except Exception as exc:
            logger.error("Cashfree bank verification error: %s", exc)
            return BankVerificationResult(status="FAILED", failure_reason="Provider unavailable.")

        cf_status = data.get("account_status", "").upper()
        returned_name = data.get("name_at_bank") or account_holder_name
        
        # Run documented name matching comparing returned bank name against declared business name
        target_name = declared_business_name or account_holder_name
        score, match_status = calculate_name_match(target_name, returned_name)

        if cf_status == "VALID":
            if match_status == "mismatch":
                # Do not automatically approve a mismatch — requires manual review
                return BankVerificationResult(
                    status="REQUIRES_REVIEW",
                    provider_reference=data.get("reference_id"),
                    name_match_status="mismatch",
                    name_match_score=score,
                    returned_name=returned_name,
                    failure_reason="Account holder name at bank does not match declared business or proprietor name.",
                    result=data,
                )
            return BankVerificationResult(
                status="VERIFIED",
                provider_reference=data.get("reference_id"),
                name_match_status=match_status,
                name_match_score=score,
                returned_name=returned_name,
                result={"account_status": cf_status, "name_match_score": score},
            )
        elif cf_status == "INVALID":
            return BankVerificationResult(
                status="FAILED",
                provider_reference=data.get("reference_id"),
                failure_reason="Bank account not found or invalid.",
                result=data,
            )
        else:
            return BankVerificationResult(
                status="REQUIRES_REVIEW",
                provider_reference=data.get("reference_id"),
                result=data,
            )


class StubBankVerificationAdapter(BaseBankVerificationAdapter):
    """Sandbox stub — used when Cashfree credentials are not configured."""

    def verify(
        self,
        account_number: str,
        ifsc: str,
        account_holder_name: str,
        declared_business_name: Optional[str] = None,
    ) -> BankVerificationResult:
        if not account_number or len(account_number) < 9:
            return BankVerificationResult(status="FAILED", failure_reason="Invalid account number format.")
        if not ifsc or len(ifsc) != 11:
            return BankVerificationResult(status="FAILED", failure_reason="Invalid IFSC code.")

        target_name = declared_business_name or account_holder_name
        score, match_status = calculate_name_match(target_name, account_holder_name)

        status = "PENDING"
        if match_status == "mismatch":
            status = "REQUIRES_REVIEW"

        return BankVerificationResult(
            status=status,
            provider_reference=f"stub-{account_number[-4:]}",
            name_match_status=match_status,
            name_match_score=score,
            returned_name=account_holder_name,
            result={"note": "Sandbox mode — configure CASHFREE_CLIENT_ID/SECRET for live verification."},
        )


def verify_cashfree_webhook_signature(payload_bytes: bytes, signature: str) -> bool:
    """Validate webhook HMAC SHA256 signature from Cashfree."""
    if not settings.CASHFREE_CLIENT_SECRET or not signature:
        return False
    computed = hmac.new(settings.CASHFREE_CLIENT_SECRET.encode(), payload_bytes, hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed, signature)


def get_bank_verification_adapter() -> BaseBankVerificationAdapter:
    if settings.cashfree_configured:
        return CashfreeBankVerificationAdapter()
    return StubBankVerificationAdapter()
