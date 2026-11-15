from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Merchant
from ..schemas import CustomerSegmentsResponse
from ..auth import get_current_merchant
from ..services.customers import get_customer_segments

router = APIRouter(prefix="/customers", tags=["customers"])

@router.get("/segments", response_model=CustomerSegmentsResponse)
def get_segments(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    return get_customer_segments(db, current_merchant.id)
