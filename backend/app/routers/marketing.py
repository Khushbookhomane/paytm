from fastapi import APIRouter, Depends
from ..models import Merchant
from ..schemas import MarketingGenerateRequest, MarketingGenerateResponse
from ..auth import get_current_merchant
from ..services.marketing import generate_marketing_messages

router = APIRouter(prefix="/marketing", tags=["marketing"])

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
