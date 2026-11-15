from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Merchant
from ..schemas import DashboardSummary
from ..auth import get_current_merchant
from ..services.analytics import get_dashboard_metrics

router = APIRouter(tags=["dashboard"])

@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    return get_dashboard_metrics(db, current_merchant.id)
