from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from ..db import get_db
from ..models import Merchant, Transaction, TransactionItem, Customer, Product
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


@router.get("/sales/transactions")
def get_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    payment_mode: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """Retrieve detailed individual transactions with items and customer info."""
    merchant_id = current_merchant.id
    query = db.query(Transaction).filter(Transaction.merchant_id == merchant_id)

    if payment_mode and isinstance(payment_mode, str) and payment_mode.lower() != "all":
        query = query.filter(Transaction.payment_mode.ilike(f"%{payment_mode}%"))

    if search and isinstance(search, str) and search.strip():
        search_term = f"%{search.strip()}%"
        # Join customer to search by name or tx id
        query = query.outerjoin(Customer, Transaction.customer_id == Customer.id).filter(
            or_(
                Customer.name.ilike(search_term),
                Transaction.id.ilike(search_term),
                Transaction.payment_mode.ilike(search_term)
            )
        )

    total_count = query.count()
    offset = (page - 1) * limit
    txs = query.order_by(desc(Transaction.ts)).offset(offset).limit(limit).all()

    tx_list = []
    for t in txs:
        items_detail = [
            {
                "name": item.product.name if item.product else "Item",
                "qty": item.qty,
                "price": item.price,
                "category": item.product.category if item.product else "General"
            }
            for item in t.items
        ]
        tx_list.append({
            "id": t.id,
            "ts": t.ts.isoformat(),
            "amount": round(t.amount, 2),
            "payment_mode": t.payment_mode,
            "customer_id": t.customer_id,
            "customer_name": t.customer.name if t.customer else "Walk-in Customer",
            "customer_phone": t.customer.phone_masked if t.customer else None,
            "items_count": len(items_detail),
            "items": items_detail,
            "status": "Completed"
        })

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit,
        "transactions": tx_list,
    }
