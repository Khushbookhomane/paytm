from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Merchant
from ..schemas import FinanceSummaryResponse, FinanceExplainRequest, FinanceExplainResponse
from ..auth import get_current_merchant
from ..services.finance import get_finance_summary, explain_finance_metrics

router = APIRouter(prefix="/finance", tags=["finance"])

@router.get("/summary", response_model=FinanceSummaryResponse)
def get_summary(
    range: str = Query("month", pattern="^(week|month)$"),
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    return get_finance_summary(db, current_merchant.id, time_range=range)

@router.post("/explain", response_model=FinanceExplainResponse)
def explain_finance(
    req: FinanceExplainRequest,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    summary = get_finance_summary(db, current_merchant.id, time_range=req.range)
    lang = req.language or current_merchant.language
    return explain_finance_metrics(summary, language=lang)
