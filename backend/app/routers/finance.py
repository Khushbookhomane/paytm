from typing import Optional, List
from datetime import date as dt_date
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..db import get_db
from ..models import Merchant, Expense
from ..schemas import FinanceSummaryResponse, FinanceExplainRequest, FinanceExplainResponse
from ..auth import get_current_merchant
from ..services.finance import get_finance_summary, explain_finance_metrics

router = APIRouter(prefix="/finance", tags=["finance"])

class ExpenseCreate(BaseModel):
    category: str = Field(..., min_length=2, max_length=50)
    amount: float = Field(..., gt=0)
    date: Optional[dt_date] = None
    notes: Optional[str] = None

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


@router.get("/expenses")
def list_expenses(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """List recorded store operational expenses."""
    expenses = db.query(Expense).filter(
        Expense.merchant_id == current_merchant.id
    ).order_by(desc(Expense.date)).limit(100).all()

    return [
        {
            "id": e.id,
            "category": e.category,
            "amount": round(e.amount, 2),
            "date": str(e.date),
        }
        for e in expenses
    ]


@router.post("/expenses", status_code=status.HTTP_201_CREATED)
def create_expense(
    req: ExpenseCreate,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """Record a new store operating expense."""
    exp = Expense(
        merchant_id=current_merchant.id,
        category=req.category,
        amount=req.amount,
        date=req.date or dt_date.today(),
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return {
        "id": exp.id,
        "category": exp.category,
        "amount": round(exp.amount, 2),
        "date": str(exp.date),
        "status": "success"
    }


@router.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """Delete an expense record."""
    exp = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.merchant_id == current_merchant.id
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found.")

    db.delete(exp)
    db.commit()
    return {"status": "success", "message": "Expense removed successfully."}
