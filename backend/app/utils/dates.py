"""
Date utilities for Paytm VentureAI.
All business date calculations use Asia/Kolkata (IST, UTC+5:30) as the merchant timezone.
"""
from datetime import datetime, date, timedelta
from typing import Optional


def get_ist_now() -> datetime:
    """Return current datetime in IST (UTC+5:30)."""
    try:
        from zoneinfo import ZoneInfo
        return datetime.now(ZoneInfo("Asia/Kolkata")).replace(tzinfo=None)
    except ImportError:
        # Python < 3.9 fallback
        return datetime.utcnow() + timedelta(hours=5, minutes=30)


def get_ist_today() -> date:
    """Return today's date in IST. Always use this — never derive today from transaction history."""
    return get_ist_now().date()
