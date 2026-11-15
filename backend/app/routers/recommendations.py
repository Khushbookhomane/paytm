from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Merchant
from ..schemas import RecommendationCard
from ..auth import get_current_merchant
from ..services.recommendations import generate_recommendations

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

@router.get("/today", response_model=List[RecommendationCard])
def get_today_recommendations(
    language: str = Query(None),
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    lang = language or current_merchant.language or "hi"
    return generate_recommendations(db, current_merchant.id, language=lang)
