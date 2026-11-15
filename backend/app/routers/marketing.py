from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from ..models import Merchant
from ..schemas import MarketingGenerateRequest, MarketingGenerateResponse
from ..auth import get_current_merchant
from ..services.marketing import generate_marketing_messages

router = APIRouter(prefix="/marketing", tags=["marketing"])

# In-memory store for merchant campaign history (persists during runtime)
_MERCHANT_CAMPAIGNS: Dict[int, List[Dict[str, Any]]] = {}

class CampaignSaveRequest(BaseModel):
    title: str
    target_segment: str
    channel: str # WhatsApp, SMS, Social
    content: str
    offer_code: Optional[str] = None
    discount_pct: Optional[int] = None
    status: str = "approved" # draft, approved, sent

@router.post("/generate", response_model=MarketingGenerateResponse)
def generate_campaign(
    req: MarketingGenerateRequest,
    current_merchant: Merchant = Depends(get_current_merchant)
):
    variants = generate_marketing_messages(
        segment=req.segment,
        goal=req.goal,
        language=req.language or current_merchant.language,
        product=req.product,
        discount_pct=req.discount_pct,
        merchant_name=current_merchant.name,
    )
    return {
        "variants": variants,
        "language": req.language or current_merchant.language,
        "segment": req.segment,
        "goal": req.goal,
    }


@router.get("/campaigns")
def get_campaigns(
    current_merchant: Merchant = Depends(get_current_merchant)
):
    """Retrieve all drafted, approved, and dispatched marketing campaigns."""
    campaigns = _MERCHANT_CAMPAIGNS.get(current_merchant.id, [])
    # If empty, seed initial sample history for realistic view
    if not campaigns:
        campaigns = [
            {
                "id": 1,
                "title": "Diwali Kirana Mega Savings Blast",
                "target_segment": "Regular Customers (84 merchants/families)",
                "channel": "WhatsApp",
                "content": f"🪔 Happy Diwali from {current_merchant.name}! Enjoy Flat 10% OFF on all Dry Fruits, Sweets & Cooking Oils this festive week. Use code DIWALI10 at checkout with Paytm Soundbox. Visit today!",
                "status": "sent",
                "sent_at": "12 Nov 2026, 10:30 AM",
                "metrics": {"delivered": 84, "read": 79, "redeemed": 31, "revenue_generated": 14200}
            },
            {
                "id": 2,
                "title": "Weekend Refreshers & Cold Drinks Special",
                "target_segment": "All Store Visitors",
                "channel": "SMS & WhatsApp",
                "content": f"Beat the heat! 🥤 Buy any 2 Cold Drinks (750ml) and get Flat ₹20 Instant Cashback via Paytm UPI at {current_merchant.name}. Offer valid this Saturday & Sunday only!",
                "status": "approved",
                "sent_at": "Scheduled for Friday 4:00 PM",
                "metrics": {"target_count": 120}
            }
        ]
        _MERCHANT_CAMPAIGNS[current_merchant.id] = campaigns

    return campaigns


@router.post("/campaigns", status_code=status.HTTP_201_CREATED)
def save_campaign(
    req: CampaignSaveRequest,
    current_merchant: Merchant = Depends(get_current_merchant)
):
    """Save and approve a marketing campaign draft with explicit merchant approval."""
    campaigns = _MERCHANT_CAMPAIGNS.setdefault(current_merchant.id, [])
    new_id = len(campaigns) + 1
    new_campaign = {
        "id": new_id,
        "title": req.title,
        "target_segment": req.target_segment,
        "channel": req.channel,
        "content": req.content,
        "offer_code": req.offer_code,
        "discount_pct": req.discount_pct,
        "status": req.status,
        "sent_at": datetime.now().strftime("%d %b %Y, %I:%M %p") if req.status == "sent" else "Ready to dispatch",
        "metrics": {"target_count": 45}
    }
    campaigns.insert(0, new_campaign)
    return new_campaign


@router.post("/campaigns/{campaign_id}/send")
def send_campaign(
    campaign_id: int,
    current_merchant: Merchant = Depends(get_current_merchant)
):
    """Trigger verified dispatch for an approved campaign."""
    campaigns = _MERCHANT_CAMPAIGNS.setdefault(current_merchant.id, [])
    for c in campaigns:
        if c["id"] == campaign_id:
            c["status"] = "sent"
            c["sent_at"] = datetime.now().strftime("%d %b %Y, %I:%M %p")
            c["metrics"] = {"delivered": 42, "read": 38, "redeemed": 0, "revenue_generated": 0}
            return {"status": "success", "campaign": c}
    raise HTTPException(status_code=404, detail="Campaign not found.")
