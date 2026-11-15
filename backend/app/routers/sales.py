from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Merchant
from ..schemas import SalesRangeResponse
from ..auth import get_current_merchant
from ..services.analytics import get_sales_analytics

router = APIRouter(tags=["sales"])

@router.get("/sales", response_model=SalesRangeResponse)
def get_sales(
    range: str = Query("week", pattern="^(week|month)$"),
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    return get_sales_analytics(db, current_merchant.id, time_range=range)
